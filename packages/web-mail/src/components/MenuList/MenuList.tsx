/**
 * 改文件似乎已经没有引用了 2023.7.19
 */
import React, { useMemo } from 'react';
import { MailEntryModel, EventApi, apiHolder as api } from 'api';
import { useActions, useAppSelector, MailClassifyActions } from '@web-common/state/createStore';
import { MailStatus } from '../../util';
import MailMenuBase from '../../common/components/MailMenu/MailMenuBase/MailMenuBase';
import ReadMailSignMenuConfig from '../../common/components/MailMenu/mailMenuConifg/ReadMailSignMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../common/constant';
import { mergeMenuConfig } from '../../common/components/MailMenu/util';
import { CommonMailMenuConfig } from '../../types';
import useState2RM from '../../hooks/useState2ReduxMock';
import { getMailFromMails } from '@web-mail/util';

const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;

const MenuList: React.FC<{
  isThreadMode: boolean;
  mailDiscussIsShow: boolean;
  listData?: MailStatus;
  item: MailEntryModel;
  visible?: boolean;
  onDelete?(id?: string, isThread?: boolean): void;
  setVisible(visible: boolean): void;
  onWithDraw?(mid?: string, isRes?: boolean): void;
  menu: CommonMailMenuConfig[];
}> = ({ isThreadMode, mailDiscussIsShow, item, listData, onDelete, onWithDraw, setVisible, menu }) => {
  const taskStatus = useAppSelector(state => state.readMailReducer.taskDetail.status); // 任务状态
  // todo: 现在属于全局独一份，后续有需要的话状态提升，props传入
  const [mailMenuItemState, setMailMenuItemState] = useState2RM('mailMenuItemState');

  // const handleWithDraw = (mid: string, isRes?: boolean) => {
  //   setVisible(false);
  //   if (onWithDraw) {
  //     onWithDraw(mid, isRes);
  //   }
  // };

  const customMenuConfg: CommonMailMenuConfig[] = useMemo(
    () => [
      {
        // todo: 需要确认该项目到底是否展示
        key: MAIL_MENU_ITEM.TAG,
        show: (mails, defaultShow) => {
          const mail = getMailFromMails(mails);
          const { isThread } = mail;
          if (taskStatus === 0 || isThread) {
            return false;
          }
          return defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        // todo: 需要确认该项目到底是否展示
        key: MAIL_MENU_ITEM.TOP,
        show: (mail, defaultShow) => {
          if (taskStatus === 0 || isThreadMode) {
            return false;
          }
          return defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        key: MAIL_MENU_ITEM.MOVE,
        show: (mail, defaultShow) => {
          if (isThreadMode) {
            return false;
          }
          return defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
        show: (mail, defaultShow) => {
          if (listData?.isrcl) {
            return false;
          }
          return defaultShow ? defaultShow(mail) : false;
        },
        onClick: mails => {
          const mail = getMailFromMails(mails);
          // const { id, _account } = mail;
          // handleWithDraw(id, false, _account);
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: { mailData: mail },
            eventStrData: 'retractEmail',
            _account: mail?._account,
          });
        },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
        show: (mail, defaultShow) => !!listData?.isrcl && (defaultShow ? defaultShow(mail) : false),
        onClick: mails => {
          const mail = getMailFromMails(mails);
          if (listData?.isrcl) {
            // const { id, _account } = mail;
            eventApi.sendSysEvent({
              eventName: 'mailMenuOper',
              eventData: { mailData: mail, showRes: true },
              eventStrData: 'retractEmail',
              _account: mail?._account,
            });
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.DELETE,
        onClick: (mails, defaultClick) => {
          const mail = getMailFromMails(mails);
          const { _account } = mail;
          if (onDelete) {
            onDelete(mail.entry.id);
          } else {
            defaultClick && defaultClick(mail);
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.SHARE,
        show: (mails, defaultShow) => {
          const mail = getMailFromMails(mails);
          // 根据showMailDiscuss 设置决策是否展示邮件分享
          if (mailDiscussIsShow) {
            if (defaultShow) {
              return defaultShow(mail);
            }
            return true;
          }
          return false;
        },
      },
      // todo: 临时处理，以适应现在的融合规则, 需要重新写融合规则
      {
        key: MAIL_MENU_ITEM.TRANSLATE,
      },
    ],
    [taskStatus, isThreadMode, listData, onDelete, onWithDraw]
  );

  const menuConfig = useMemo(() => {
    if (menu && menu.length) {
      return mergeMenuConfig(menu, customMenuConfg);
    }
    return customMenuConfg;
  }, [menu, customMenuConfg]);

  return (
    <MailMenuBase
      onMenuClick={() => {
        setVisible(false);
      }}
      // 邮件撤回的外部显示状态
      menu={menuConfig}
      mail={item}
      defaultMenu={ReadMailSignMenuConfig}
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
    />
  );
};

export default MenuList;
