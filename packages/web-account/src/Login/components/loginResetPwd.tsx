import React, { useState, useCallback } from 'react';
import styles from './loginResetPwd.module.scss';
import { LoginModel, api } from 'api';
import { useAppDispatch } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import PasswordForm from '@web-common/components/UI/PasswordForm/password-form';
import Login from '@web-account/Login';
import { refreshPage } from '@web-common/utils/utils';

interface Props {
  type?: 'addAccountModal' | 'addAccount';
  defaultAccount?: string;
  defaultVisibleLogin?: boolean;
  onLoginSuccess?: () => void;
  onAfterLogout?: () => void;
  onBeforeLogin?: () => void;
  onAfterLogin?: (res?: LoginModel) => void;
}

const systemApi = api.getSystemApi();

export default (props: Props) => {
  const { defaultAccount, defaultVisibleLogin, onLoginSuccess, onAfterLogout, onAfterLogin, onBeforeLogin, type = 'addAccountModal' } = props;
  const dispatch = useAppDispatch();
  const [originLoginKey, setOriginLoginKey] = useState<string | undefined>();

  const [visibleLogin, setVisibleLogin] = useState<boolean>(Boolean(defaultVisibleLogin));

  const [visiblePsw, setVisiblePsw] = useState<boolean>(false);

  const [initAccount, setInitAccount] = useState<string | undefined>(defaultAccount);

  const onResetPwdSuccess = useCallback(async (pwd: string, redirectUrl?: string) => {
    const current = systemApi.getCurrentUser();
    if (redirectUrl === 'entry') {
      refreshPage();
    } else {
      const account = current?.id;
      if (!account) {
        console.error('[onResetPwdSuccess] error no currentUser', current);
        return;
      }
      const originKey = await systemApi.getLocalLoginToken(account, pwd);
      setVisibleLogin(true);
      setVisiblePsw(false);
      setInitAccount(account);
      setOriginLoginKey(originKey);
    }
  }, []);

  const handlerResetPassword = useCallback(() => {
    setVisiblePsw(true);
    dispatch(LoginActions.doTogglePassPrepareForm(false));
  }, []);

  return (
    <div className={styles.addAccountWrap}>
      {visiblePsw && (
        <div className={styles.resetPasswordWrap}>
          <PasswordForm from="reset_password" onSuccess={onResetPwdSuccess} />
        </div>
      )}
      {visibleLogin && (
        <div className={styles.loginWrap}>
          <Login
            hideQrCodeLogin
            onAddAccountLoginSuccess={onLoginSuccess}
            handlerResetPassword={handlerResetPassword}
            type={type}
            initAccount={initAccount}
            originLoginKey={originLoginKey}
            onAfterLogout={onAfterLogout}
            onAfterLogin={onAfterLogin}
            onBeforeLogin={onBeforeLogin}
          />
        </div>
      )}
    </div>
  );
};
