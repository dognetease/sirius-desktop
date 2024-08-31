import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Tooltip, Button } from 'antd';
import { WhatsAppMarketingModal } from './whatsAppMarketingModal';
import { ReactComponent as CloseIconSvg } from '@/images/icons/close_tooltips.svg';
import { actions as GlobalActions } from '@web-common/state/reducer/globalReducer';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import useLocalStorage from '@/hooks/useLocalStorage';
import { api, apis, InsertWhatsAppApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const systemApi = api.getSystemApi();
export type BindStatus = {
  /**
   * TRY("TRY", "试用", 10, 0),
   * PURCHASED("PURCHASED", "已下单", 10, 0),
   * REGISTERED("REGISTERED", "已注册", 30, 10),
   * VERIFIED("VERIFIED", "已认证", 50, 100);
   */
  orgStatus: string;
  // sender绑定状态:true-已绑定，false-未绑定
  senderStatus: boolean;
  // 模版申请状态：NOT_APPLY-未申请，IN_APPEAL-审批中，APPROVED-已通过，REJECTED-未通过
  templateStatus: string;
};
export const defaultBindStatus = {
  orgStatus: '',
  senderStatus: false,
  templateStatus: '',
};
export interface WhatsAppMarketingMethods {
  showModal(): void;
}
export const WhatsAppMarketing = forwardRef((props, ref) => {
  const containerEl = useRef<HTMLDivElement>(null);
  const currentUser = systemApi.getCurrentUser() || { id: '' };
  const dispatch = useAppDispatch();
  const showWhatsAppNotify = useAppSelector(state => state.globalReducer.showWhatsAppNotify);
  const [marketingNotifyCloseList, setMarketingNotifyCloseList] = useLocalStorage<string[]>('whats-app-marketing-notify-close-list', []); // 永久通知状态人员列表
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [bindStatus, setBindStatus] = useState<BindStatus>({ ...defaultBindStatus });
  const getPopupContainer = () => {
    return containerEl.current as HTMLDivElement;
  };
  const overlayContent = () => (
    <>
      <CloseIconSvg className={style.closeTooltipsBtn} onClick={handleTempCloseNotify} />
      <p>{getIn18Text('WANGYIXIAOZHUSHOUZHUNI3BUCHUANGJIANwhatsappYINGXIAO\uFF0CKUAISUZHAODAOSHEZHIRUKOU')}</p>
      <div className={style.actionGroup}>
        <Button size="small" className={style.closeBtn} type="link" onClick={handleCloseNotify}>
          {getIn18Text('BUZAITIXING')}
        </Button>
        <Button
          style={{ width: 'auto' }}
          size="small"
          className={style.openBtn}
          onClick={() => {
            setTooltipVisible(false);
            setModalVisible(true);
          }}
        >
          {getIn18Text('KUAISUCHUANGJIAN')}
        </Button>
      </div>
    </>
  );
  const handleTempCloseNotify = () => {
    dispatch(GlobalActions.setWhatsAppNotify(false));
    setTooltipVisible(false);
  };
  const handleCloseNotify = () => {
    setMarketingNotifyCloseList([...marketingNotifyCloseList, currentUser.id]);
    setTooltipVisible(false);
  };
  const updateBindStatus = () => {
    insertWhatsAppApi
      .queryBindStatus()
      .then(data => {
        setBindStatus(data);
        // 已下单、未绑定弹出通知
        if (
          !marketingNotifyCloseList?.includes(currentUser.id) &&
          showWhatsAppNotify &&
          !modalVisible &&
          ['UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus)
        ) {
          setTooltipVisible(true);
        }
      })
      .catch(e =>
        Toast.warning({
          content: e.message,
        })
      );
  };
  useEffect(() => {
    updateBindStatus();
  }, []);
  useImperativeHandle(ref, () => ({
    showModal: () => setModalVisible(true),
  }));
  return (
    <div className={style.container} ref={containerEl}>
      <Tooltip getPopupContainer={getPopupContainer} title={overlayContent} overlayClassName={style.tooltip} visible={tooltipVisible} zIndex={100}>
        <span></span>
      </Tooltip>
      <WhatsAppMarketingModal visible={modalVisible} bindStatus={bindStatus} updateBindStatus={() => updateBindStatus()} onClose={() => setModalVisible(false)} />
    </div>
  );
});
