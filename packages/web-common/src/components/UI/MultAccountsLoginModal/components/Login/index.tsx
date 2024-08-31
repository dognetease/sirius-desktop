import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import LoginForm from '../LoginForm/index';
import SetForm from '../SetForm/index';
import VerifyCode from '../VerifyCode/index';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import {
  apiHolder as api,
  apis,
  LoginApi,
  AccountTypes,
  EmailAndPass,
  MultAccountsLoginInfo,
  CloseMultAccountLoginFun,
  CloseMultAccountLoginInfo,
  AccountApi,
  SubAccountServerModel,
  getIn18Text,
} from 'api';

const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.api.getSystemApi();

const SUB_ACCOUNT_EXIST = 'SUB_ACCOUNT_EXIST';
const SUB_ACCOUNT_EXPIRED = 'SUB_ACCOUNT_EXPIRED';
const BIND_SELF_NOALLOW = 'BIND_SELF_NOALLOW';

const tipCodeErrorMsgMap: { [key: string]: string } = {
  [SUB_ACCOUNT_EXIST]: getIn18Text('BIND_SUBACCOUNT_ALREADY'),
  [SUB_ACCOUNT_EXPIRED]: getIn18Text('BIND_SUBACCOUNT_EXPIRED'),
  [BIND_SELF_NOALLOW]: getIn18Text('BIND_SELF_NOALLOW'),
};

const MultAccountsLogin: React.FC<{
  visible: boolean;
  accountType: AccountTypes;
  closeAllModal: CloseMultAccountLoginFun;
  chooseMail: () => void;
  loginInfo: MultAccountsLoginInfo;
}> = props => {
  const { visible, closeAllModal, accountType, chooseMail, loginInfo } = props;
  // 登录 账密
  const [formVisible, setFormVisible] = useState<boolean>(false);
  // 高级设置
  const [setVisible, setSetVisible] = useState<boolean>(false);
  // 验证码
  const [verifyCodeVisible, setVerifyCodeVisible] = useState<boolean>(false);
  const [mobile, setMobile] = useState<string>('');
  const [formData, setFormData] = useState<EmailAndPass>({ agentEmail: '', password: '' });
  // modal关闭按钮何时展示
  const modelClosable = useMemo(() => {
    // return !!setVisible;
    return true;
  }, [setVisible]);
  const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const changeSetVisible = (visible: boolean) => {
    setSetVisible(visible);
    setFormVisible(!visible);
  };
  const changeVerifyCodeVisible = (visible: boolean) => {
    setVerifyCodeVisible(visible);
    setFormVisible(!visible);
  };
  const getFormData = (baseInfo: any, visible?: 'set' | 'verify', mobile?: string) => {
    setFormData(baseInfo);
    if (visible === 'set') {
      changeSetVisible(true);
    }
    if (visible === 'verify') {
      changeVerifyCodeVisible(true);
      setMobile(mobile || '');
    }
  };

  const [allSubAccounts, setAllSubAccounts] = useState<Array<SubAccountServerModel>>([]);

  useEffect(() => {
    accountApi.getAllSubAccounts().then(res => {
      if (res && res.length) {
        setAllSubAccounts(res);
      }
    });
  }, []);

  const getTipInfoByEmail = (email: string, isReBind: boolean) => {
    let tipCode = '';
    if (!email) {
      tipCode = '';
      return;
    }

    const emailItem = allSubAccounts.find(item => item.agentEmail === email);
    if (emailItem) {
      if (!emailItem.expired) {
        tipCode = SUB_ACCOUNT_EXIST;
      } else {
        if (!isReBind) {
          tipCode = SUB_ACCOUNT_EXPIRED;
        } else {
          tipCode = '';
        }
      }
    } else {
      tipCode = '';
    }

    if (!tipCode) {
      const currentUser = systemApi.getCurrentUser();
      if (currentUser) {
        if (email === currentUser.id || (currentUser.loginAccount && currentUser.loginAccount === email)) {
          tipCode = BIND_SELF_NOALLOW;
        }
      }
    }

    return {
      tipCode: tipCode,
      tipTxt: tipCodeErrorMsgMap[tipCode] || '',
      showReBind: tipCode === SUB_ACCOUNT_EXPIRED,
    };
  };

  const [isReBind, setIsReBind] = useState<boolean>(false);

  useEffect(() => {
    setIsReBind(loginInfo.type === 'rebind');
  }, [loginInfo.type]);

  const handleChangeToReBind = (val: boolean) => {
    if (val) {
      setIsReBind(true);
    } else {
      setIsReBind(false);
    }
  };

  const closeLoginModal = (info: CloseMultAccountLoginInfo, type: 'login' | 'set' | 'verify') => {
    if (info.refresh) {
      closeAllModal(info);
      return;
    }
    if (info.norebind) {
      setIsReBind(loginInfo.type === 'rebind');
      return;
    }
    if (info.agentEmail) {
      loginInfo.agentEmail = info.agentEmail;
    }
    if (info.password) {
      loginInfo.password = info.password;
    }
    if (type === 'login') {
      chooseMail();
    } else if (type === 'set') {
      changeSetVisible(false);
    } else if (type === 'verify') {
      changeVerifyCodeVisible(false);
      loginApi.stopBindAccount();
    }
  };

  useEffect(() => {
    setFormVisible(visible);
  }, []);
  return (
    <>
      <Modal
        footer={null}
        destroyOnClose
        centered
        width={480}
        visible={visible}
        closable={modelClosable}
        maskClosable={false}
        transitionName=""
        maskTransitionName=""
        // bodyStyle={{ padding: setVisible ? '24px' : '40px' }}
        bodyStyle={{ padding: '24px' }}
        onCancel={() => {
          closeAllModal({ refresh: false });
        }}
        closeIcon={<CloseIcon className="dark-invert" />}
      >
        {/* 登录 账密 */}
        <LoginForm
          visible={formVisible}
          accountType={accountType}
          loginInfo={loginInfo}
          getTipInfoByEmail={getTipInfoByEmail}
          changeToRebind={handleChangeToReBind}
          isReBind={isReBind}
          closeModal={info => {
            closeLoginModal(info, 'login');
          }}
          sendFormData={getFormData}
        />
        {/* 高级设置 */}
        {setVisible && (
          <SetForm
            loginInfo={loginInfo}
            accountType={accountType}
            formData={formData}
            getTipInfoByEmail={getTipInfoByEmail}
            changeToRebind={handleChangeToReBind}
            isReBind={isReBind}
            closeModal={info => {
              closeLoginModal(info, 'set');
            }}
          />
        )}
        {/* 验证码 */}
        {verifyCodeVisible && (
          <VerifyCode
            loginInfo={loginInfo}
            mobile={mobile}
            formData={formData}
            closeModal={info => {
              closeLoginModal(info, 'verify');
            }}
          />
        )}
      </Modal>
    </>
  );
};
export default MultAccountsLogin;
