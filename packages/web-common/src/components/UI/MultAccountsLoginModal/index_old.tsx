import React, { useState, useEffect } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';
import styles from './multaccountslogin.module.scss';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import Login from './components/Login';

import { apiHolder as api, apis, LoginApi, AccountTypes, MultAccountsLoginInfo, CloseMultAccountLoginFun, ProductAuthApi } from 'api';
import { getIn18Text } from 'api';

const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const MultAccountsLoginModal: React.FC<{
  loginInfo: MultAccountsLoginInfo;
  closeModel: CloseMultAccountLoginFun;
}> = props => {
  // 'Microsoft', 'MicrosoftGlobal', 'Outlook' 暂时屏蔽
  const [accountTypes, setAccountTypes] = useState(['NeteaseQiYeMail', '163Mail', 'QQMail', 'TencentQiye', 'Gmail', 'Others']);
  const { closeModel, loginInfo } = props;
  const [mailsVisible, setMailsVisible] = useState<boolean>(false);
  const [loginVisible, setLoginVisible] = useState<boolean>(false);
  const [accountType, setAccountType] = useState<AccountTypes>('NeteaseQiYeMail');
  const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const changeAccount = (visible: boolean, type?: AccountTypes) => {
    setLoginVisible(visible);
    setMailsVisible(!visible);
    type && setAccountType(type);
  };

  const mailLogo = () => {
    return accountTypes.map(type => {
      return (
        <div
          onClick={() => {
            changeAccount(true, type);
          }}
          key={type}
          className={classnames(styles.logoContainer)}
        >
          <div className={classnames([styles.image, styles['i' + type]])}></div>
        </div>
      );
    });
  };
  useEffect(() => {
    if (loginInfo.type === 'bind') {
      setMailsVisible(true);
    } else {
      setAccountType(loginInfo!.accountType);
      setLoginVisible(true);
    }
    const newAccountTypes = [...accountTypes];
    // if (productAuthApi.getABSwitchSync('disable_ui_binding_outlook')) {
    //   newAccountTypes.splice(newAccountTypes.indexOf('Outlook'), 1);
    // }
    if (productAuthApi.getABSwitchSync('disable_ui_binding_gmail')) {
      newAccountTypes.splice(newAccountTypes.indexOf('Gmail'), 1);
    }
    if (productAuthApi.getABSwitchSync('disable_ui_binding_qiyeqq')) {
      newAccountTypes.splice(newAccountTypes.indexOf('TencentQiye'), 1);
    }

    if (newAccountTypes.length !== accountTypes.length) {
      setAccountTypes(newAccountTypes);
    }
  }, []);
  return (
    <>
      {mailsVisible && (
        <Modal
          className={classnames(styles.modal)}
          footer={null}
          centered
          width={480}
          closable
          destroyOnClose
          transitionName=""
          maskTransitionName=""
          maskClosable={false}
          visible={mailsVisible}
          onCancel={() => {
            closeModel({ refresh: false });
          }}
          closeIcon={<CloseIcon className="dark-invert" />}
        >
          <div className={classnames(styles.title)}>{getIn18Text('XUANZENINDEYOUXIANG')}</div>
          <div className={classnames(styles.container)}>{mailLogo()}</div>
        </Modal>
      )}
      {loginVisible && (
        <Login
          visible={loginVisible}
          chooseMail={() => {
            changeAccount(false);
          }}
          accountType={accountType}
          loginInfo={loginInfo}
          closeAllModal={({ refresh, email }) => {
            closeModel({ refresh, email });
            setLoginVisible(false);
            // 解绑
            loginApi.stopBindAccount();
          }}
        />
      )}
    </>
  );
};
export default MultAccountsLoginModal;
