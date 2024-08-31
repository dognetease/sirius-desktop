import React, { useCallback } from 'react';
import { MailEntryModel, DataTrackerApi, apiHolder as api, apis } from 'api';
import { FLOLDER, MAIL_MENU_ITEM } from '../../common/constant';
import MailMenuBase from '../../common/components/MailMenu/MailMenuBase/MailMenuBase';
import useState2RM from '../../hooks/useState2ReduxMock';
import { useAppSelector } from '@web-common/state/createStore';
import { isMailDiff } from '@web-mail/utils/mailCompare';
import { CommonMailMenuConfig } from '@web-mail/types';
import { folderIdIsVrFolder } from '@web-mail/util';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const MailMenu: React.FC<any> = props => {
  const { activeMailId, visible, setVisible, selectedKeys, selected, domProps } = props;

  const item = useAppSelector(
    state => {
      if (state?.mailReducer?.mailEntities) {
        const id = Array.isArray(activeMailId) ? activeMailId[0] : activeMailId;
        return state?.mailReducer?.mailEntities[id];
      }
    },
    (old, newValue) => {
      return !isMailDiff(old as MailEntryModel, newValue as MailEntryModel);
    }
  );

  // 右键操作单改多的临时处理
  if (!activeMailId || activeMailId.length == 0) return <></>;

  // todo: 现在属于全局独一份，后续有需要的话状态提升，props传入
  const [mailMenuItemState, setMailMenuItemState] = useState2RM('mailMenuItemState');
  // 关键id

  // 在icon按钮之前收集打点信息
  const handelIconMenuBeforeClick = useCallback((config: CommonMailMenuConfig, data: MailEntryModel) => {
    let name = config?.name;
    if (typeof config?.name === 'function') {
      const _name = config?.name(data);
      if (typeof _name === 'string') {
        name = _name;
      }
    }
    trackApi.track('pcMail_click_ReplyButton_mailHead_mailList', { buttonName: name });
  }, []);

  return visible ? (
    <MailMenuBase
      mail={item}
      beforeMenuItemClick={handelIconMenuBeforeClick}
      onMenuClick={() => {
        setVisible(false);
      }}
      // selected 不属于邮件的固有属性，从业务成覆盖
      menu={[
        {
          key: MAIL_MENU_ITEM.TOP,
          show: (mail, defaultShow) => {
            // 由于红旗邮件是虚拟文件夹，邮件本身的所属文件夹不可能是红旗，只能在需要的业务层判断
            if (selected !== 'ALL') {
              return false;
            }
            if (defaultShow) {
              return defaultShow(mail);
            }
            return true;
          },
        },
      ]}
      menuItemStateMap={mailMenuItemState}
      onMenuItemStateChange={(menuId, data) =>
        setMailMenuItemState({
          ...mailMenuItemState,
          [item?.entry?.id]: {
            ...(mailMenuItemState[item?.entry?.id] || {}),
            [menuId]: data,
          },
        })
      }
      domProps={domProps}
    ></MailMenuBase>
  ) : (
    <></>
  );
};
export default MailMenu;
