import React, { useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import {
  // AccountApi,
  api,
  apiHolder,
  apis,
  // BkLoginInitData, BkLoginResultData,
  // DataStoreApi,
  DataTrackerApi,
  // globalStoreConfig,
  inWindow,
  locationHelper,
  LoginApi,
  PerformanceApi,
  SystemApi,
} from 'api';
// import Login from '@web-account/Login/login';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
// import Launch from '@web-account/Launch/launch';
import { LoginError } from '@web-account/Login/login_error/login_error';
import { NewVersionLoading } from '@web-account/Login/new_version_loading/new_version_loading';
// import { config } from 'env_def';
import SiriusLayout from '../layouts';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

console.info('---------------------from jump page------------------');
const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /sid=([0-9a-zA-Z%_#*\-.]+)/i;
const fromWebmailPattern = /from=login/;

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
// const storeApi = api.getDataStoreApi() as DataStoreApi;
// const eventApi = api.getEventApi();
const sysApi = api.getSystemApi() as SystemApi;
// const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
// const keyDeviceUUID = config('browerDeviceUUID') as string;
const pageStartStamp = Date.now();
const host = locationHelper.getHost();
const recordTimestamp = () => {
  const span = Date.now() - pageStartStamp;
  performanceApi.point({
    statKey: 'jump_page_stay_span',
    statSubKey: host,
    valueType: 1,
    value: span,
  });
};

const getSearch = (key: string): string => {
  try {
    const search = new URLSearchParams(window.location.search);
    return search.get(key) || '';
  } catch (e) {
    console.error('get search error ', e);
  }
  return '';
};

const JumpPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');
  // const [originLoginKey, setLoginInfoKey] = useState<string>();
  //
  // const handlerResetPassword = (email: string) => {
  //   storeApi.putSync('willAutoLoginAccount', email, { noneUserRelated: true });
  //   navigate('/password_reset');
  // };
  const [loginError, setLoginError] = useState<boolean>(false);
  const [sid, setSid] = useState<string>('');

  useEffect(() => {
    if (inWindow() && window.location.search && userInfoPattern.test(window.location.search)) {
      trackApi.track('web_auto_login_start', { location: window.location.search });
      const exec = userInfoPattern.exec(window.location.search);
      if (exec && exec[1]) {
        const loginKey = safeDecodeURIComponent(exec[1]) || '';
        setSid(loginKey);
        const tid = setTimeout(() => {
          setLoginError(true);
          console.error('timeout when jump to page ');
        }, 45000);
        const uid = locationHelper.getParam('uid');
        sysApi
          .doGetCookies(true)
          .then(rs => {
            if (rs && (uid || rs.qiye_uid || rs.mail_uid)) {
              const uidStr = uid || rs.qiye_uid || rs.mail_uid;
              const emailAccount = uidStr.replace(/"/g, '');
              return loginApi.doTryLoginWithCurrentState(emailAccount, loginKey);
            }
            setLoginError(true);
            return Promise.reject(new Error('没有查询到本地cookie'));
          })
          .then(re => {
            if (re.pass) {
              // location.assign(locationHelper.buildStaticUrl('/'));
              // if () { // 从旧版过来，需要加标识
              const options = {
                state: {
                  show_old: getSearch('show_old'),
                  from: getSearch('from'),
                },
              };
              recordTimestamp();
              if (getSearch('testJu') !== '1') navigate('/', options);
              // }
              // else {
              //   navigate('/').then(() => {
              //     recordTimestamp();
              //   });
              // }
            } else {
              setLoginError(true);
            }
          })
          .catch(ex => {
            console.warn('[jump page] error ', ex);
            setLoginError(true);
          })
          .finally(() => {
            clearTimeout(tid);
          });
      } else {
        setLoginError(true);
      }
    } else {
      setLoginError(true);
    }
  }, []);

  // 登陆出错
  if (loginError) {
    return <LoginError sid={sid} show_old={getSearch('show_old')} />; // sid 由jump传入，保持一致性
  }

  // const renderLogin = <Login type="common" handlerResetPassword={handlerResetPassword} originLoginKey={originLoginKey} />;
  // const renderLogin = <div>登录中。。。</div>;
  // const renderLogin = <Launch from="launch" />;
  const renderLogin = <NewVersionLoading />;
  let page = null;
  if (buildFor) {
    page = (
      <SiriusLayout.ContainerLayout isLogin>
        <SiriusLayout.LoginLayout>{renderLogin}</SiriusLayout.LoginLayout>
      </SiriusLayout.ContainerLayout>
    );
  } else {
    page = <SiriusLayout.LoginLayout>{renderLogin}</SiriusLayout.LoginLayout>;
  }
  return page;
};

export default JumpPage;

console.info('---------------------end jump page------------------');
