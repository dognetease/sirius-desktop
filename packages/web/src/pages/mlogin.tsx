import React, { useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import { apiHolder as api, apis, DataStoreApi, DataTrackerApi, inWindow } from 'api';
import MobileLogin from '@web-account/Login/MobileLogin';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const userInfoPattern = /userInfo=([0-9a-zA-Z%_#\-.]+)/i;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storeApi = api.api.getDataStoreApi() as DataStoreApi;
const LoginPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');
  const [originLoginKey, setLoginInfoKey] = useState<string>();
  const handlerResetPassword = (email: string) => {
    storeApi.putSync('willAutoLoginAccount', email, { noneUserRelated: true });
    navigate('/password_reset');
  };
  useEffect(() => {
    if (inWindow() && window.location.hash && userInfoPattern.test(window.location.hash)) {
      trackApi.track('pc_auto_login_start', { hash: window.location.hash });
      const exec = userInfoPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const loginKey = safeDecodeURIComponent(exec[1]);
        setLoginInfoKey(loginKey);
      }
    }
  }, []);
  return <MobileLogin handlerResetPassword={handlerResetPassword} originLoginKey={originLoginKey} />;
};
export default LoginPage;
