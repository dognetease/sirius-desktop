import { api, apis, ContactAndOrgApi, DataTrackerApi, PersonalMarkParams } from 'api';
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import styles from './mark.module.scss';
import { useContactMarked } from '@web-common/hooks/useContactModel';

import { Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ContactActions, useActions } from '@web-common/state/createStore';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';

interface SiriusContactMarkProps {
  testId?: string;
  // 联系人id
  contactId?: string;
  // 是否用联系人id匹配mark值
  useId?: boolean;
  // 分组id
  orgId?: string;
  // 联系人邮箱
  email?: string;
  // 是否需要展示tooltip
  visibleToolTip?: boolean | string;
  // 是否需要展示hover状态
  visibleHover?: boolean;
  // 是否可以操作添加，取消
  canOperate?: boolean;
  // 取消是否需要弹窗
  cancelToast?: boolean;
  // 星标icon大小 默认16
  size?: number;
  // 当星标成功后的回调（添加，取消）
  onMarked?(marked: boolean): void;
  // 给星标外表框的样式
  style?: React.CSSProperties;
  // 给星标外表框加的class
  className?: string;
  // 未标记是否隐藏
  noMarkedHidden?: boolean;
  // 无匹配数据时默认是否展示标星
  defaultMarked?: boolean;
  // 是否使用文字新标
  useText?: boolean;
  // 是否使用card的icon
  useCardIcon?: boolean;
}

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const SiriusContactMark: React.FC<SiriusContactMarkProps> = props => {
  const {
    size = 16,
    onMarked,
    contactId,
    email,
    orgId,
    canOperate,
    style,
    visibleToolTip,
    cancelToast,
    visibleHover,
    noMarkedHidden,
    defaultMarked,
    useId,
    className,
    useText,
    useCardIcon,
    testId,
  } = props;
  const contactAction = useActions(ContactActions);
  // 从redux获取当前联系人的星标数据
  const marked = useContactMarked({ email, orgId, contactId, useId });
  // 是否选中
  const [checked, setChecked] = useState<boolean>(defaultMarked ? true : marked);
  // 是否展示toolTip
  const [openTooltip, setOpenTooltip] = useState<boolean>(false);
  // 当redux数据变化，改变当前星标状态
  useEffect(() => {
    setChecked(marked);
  }, [marked]);

  const handleOperate = async (isMarked: boolean, id: string) => {
    if (!cancelToast || isMarked) {
      setChecked(isMarked);
    }
    const data: PersonalMarkParams = {
      id,
      type: orgId ? 2 : 1,
    };
    const action = isMarked ? 'add' : 'cancel';
    const { success, msg } = await contactApi.doBatchOperatePersonalMark([data], action);
    if (success) {
      setChecked(isMarked);
      onMarked && onMarked(isMarked);
      if (orgId) {
        const m = new Map();
        m.set(orgId, isMarked);
        contactAction.doUpdateOrgMarkedMap(m);
      } else if (email && contactId) {
        contactAction.doUpdateEmailMarkedMap({ type: action, isAll: false, data: new Map(Object.entries({ [email]: [contactId] })) });
      }
      message.success(isMarked ? getIn18Text('addMarkSuccess') : getIn18Text('cancelMarkSuccess'));
    } else {
      setChecked(!isMarked);
      message.error(msg || getIn18Text(isMarked ? 'addMarkFail' : 'cancelMarkFail'));
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (!canOperate) {
      return;
    }
    const id = orgId || contactId;
    if (!id) {
      return;
    }
    e.stopPropagation();
    const isMarked = !checked;
    if (!isMarked && cancelToast) {
      SiriusModal.error({
        title: getIn18Text('cancelToastTitle'),
        content: getIn18Text('cancelToastContent'),
        onOk: async () => {
          dataTracker.track('pcMail_click_button_cancelStarContactPage', { buttonName: '确定' });
          await handleOperate(isMarked, id);
        },
        onCancel: () => {
          dataTracker.track('pcMail_click_button_cancelStarContactPage', { buttonName: '取消' });
        },
      });
    } else {
      handleOperate(isMarked, id);
    }
  };

  const tooltipTitle = typeof visibleToolTip === 'string' ? visibleToolTip : getIn18Text(checked ? 'cancelMark' : 'addMark');

  return noMarkedHidden && !checked ? null : (
    <Tooltip
      title={tooltipTitle}
      placement="top"
      visible={openTooltip}
      onVisibleChange={open => {
        setOpenTooltip(open && !!visibleToolTip);
      }}
    >
      <div
        data-test-id={testId}
        data-test-checked={checked}
        onClick={handleClick}
        className={classnames(className || styles.siriusContactMarkContainer, visibleHover && styles.markHover)}
        style={style}
      >
        {useText ? (
          <span>{tooltipTitle}</span>
        ) : (
          <div
            style={{ width: size, height: size }}
            className={classnames(styles.markIcon, {
              [styles.checked]: checked,
              [styles.group]: !!orgId,
              [styles.detailIcon]: useCardIcon,
            })}
          />
        )}
      </div>
    </Tooltip>
  );
};
export default SiriusContactMark;
