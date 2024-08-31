import React, { useEffect } from 'react';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { api, apiHolder, apis, DataTrackerApi, RegisterApi } from 'api';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './switchLoginOrRegister.module.scss';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
interface SwitchLoginOrRegisterProp {
  onSwitch?: (type: 'login' | 'register') => void;
}
const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const SwitchLoginOrRegister: React.FC<SwitchLoginOrRegisterProp> = props => {
  const { visibleSwitchModal, registerInfo } = useAppSelector(state => state.loginReducer);
  const { setVisibleSwitchModal, setMailBindModalInfo, setRegisterInfo } = useActions(LoginActions);
  const { onSwitch } = props;
  const switchRegister = async () => {
    if (!registerInfo.mobile.startsWith('(86)')) {
      Message.info(getIn18Text('ZANSHIJINZHICHI'));
      return;
    }
    try {
      const { success, message, isRegister } = await registerApi.doValidateCode({ ...registerInfo, needGetBindAccount: false });
      if (success) {
        if (isRegister) {
          const msg = getIn18Text('MEIGESHOUJIHAO');
          Message.error(msg);
          setVisibleSwitchModal(false);
          trackApi.track('pc_no_account_select_action_page_result', { action: 'register', result: msg });
        } else {
          setVisibleSwitchModal(false);
          setRegisterInfo({ visible: true, isValidate: true });
          onSwitch && onSwitch('register');
          trackApi.track('pc_no_account_select_action_page_result', { action: 'register', result: true });
        }
      } else {
        Message.error(message);
        trackApi.track('pc_no_account_select_action_page_result', { action: 'register', result: message });
      }
    } catch (e) {
      console.warn(e);
      trackApi.track('pc_no_account_select_action_page_result', { action: 'register', result: 'exception ' });
    }
  };
  useEffect(() => {
    trackApi.track('pc_no_account_select_action_page');
  }, []);
  const switchLogin = () => {
    setVisibleSwitchModal(false);
    setMailBindModalInfo({ visible: true });
    onSwitch && onSwitch('login');
    trackApi.track('pc_no_account_select_action_page_result', { action: 'login', result: true });
  };
  return (
    <SiriusHtmlModal
      visible={visibleSwitchModal}
      width={400}
      onCancel={() => {
        setVisibleSwitchModal(false);
      }}
    >
      <div className={styles.wrap}>
        <div className={styles.title}>
          <div className={styles.titleTxt}>{getIn18Text('XUANZENINDESHI')}</div>
          <div className={styles.titleTxt2}>{getIn18Text('NINDESHOUJIHAO')}</div>
        </div>
        <div className={styles.content}>
          <div className={styles.item} onClick={switchLogin}>
            <div className={styles.loginIcon} />
            <div className={styles.label}>{getIn18Text('BANGDINGYIYOUDE')}</div>
            <div className={styles.arrowRight} />
          </div>
          <div className={styles.item} onClick={switchRegister}>
            <div className={styles.registerIcon} />
            <div className={styles.label}>{getIn18Text('ZHUCENINDEWANG')}</div>
            <div className={styles.arrowRight} />
          </div>
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
export default SwitchLoginOrRegister;
