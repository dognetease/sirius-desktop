import React, { useState, useEffect } from 'react';
import { apis, api, PwdRuleModel, LoginApi } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { compose } from '@reduxjs/toolkit';
// import { navigate } from 'gatsby';
// import { PasswordPrepareForm } from './password-prepare-form';
// import { PasswordResetForm } from './password-reset-form';
import { PasswordCheckNew } from './password-check-new';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
interface PasswordFormProps {
  onBack?: () => void;
  onSuccess: (pwd: string, redirectUrl?: string) => void;
  from?: 'setting' | 'reset_password';
}
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const PasswordForm = (props: PasswordFormProps) => {
  const { onBack, from = 'setting', onSuccess } = props;
  const [passRule, setPassRule] = useState<PwdRuleModel | undefined>();
  const [account, setAccount] = useState<string | undefined>();
  const [oldPass, setOldPass] = useState<string>('');
  const loginActions = useActions(LoginActions);
  const {
    loginInfo: { loginId = '' },
    passPrepareFormVisible,
  } = useAppSelector(state => state.loginReducer);
  // useEffect(() => {
  //   if (!loginId && window.location.pathname.includes('password_reset')) {
  //     navigate('/login');
  //   }
  // }, [loginId]);
  useEffect(() => {
    loginApi
      .doGetPasswordRules()
      .then(rule => {
        if (rule?.errmsg) {
          message.error(getIn18Text('MIMAGUIZEHUO11'));
          // setPassRule();
          return;
        }
        setAccount(rule.nickname);
        setPassRule(rule);
        setOldPass(compose(atob, atob, atob)(loginId));
      })
      .catch(() => {
        message.error(getIn18Text('MIMAGUIZEHUO'));
      });
  }, []);
  // const isLoading = visible || !passRule || Object.keys(passRule).length === 0;
  return (
    <>
      {/* {!passPrepareFormVisible && (<PasswordResetForm passRule={passRule} oldPass={oldPass} from={from} onSuccess={onSuccess} onBack={() => {
                // loginActions.doSetPasswordResetVisible(true);
                onBack && onBack();
            }}/>)}
      {passPrepareFormVisible && (<PasswordPrepareForm onSuccess={pwd => {
                setOldPass(pwd);
                loginActions.doTogglePassPrepareForm(false);
            }}/>)} */}

      {
        <PasswordCheckNew
          passRule={passRule}
          account={account}
          from={from}
          oldPass={oldPass}
          onBack={() => {
            onBack && onBack();
          }}
          onSuccess={onSuccess}
        />
      }
    </>
  );
};
export default PasswordForm;
