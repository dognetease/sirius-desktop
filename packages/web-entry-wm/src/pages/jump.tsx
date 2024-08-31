import React, { useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import { api, apiHolder, apis, DataStoreApi, DataTrackerApi, inWindow, locationHelper, LoginApi, PerformanceApi, SystemApi, getIn18Text } from 'api';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { LoginError } from '@web-account/Login/login_error/login_error';
import { NewVersionLoading } from '@web-account/Login/new_version_loading/new_version_loading';
import { getWaimaoTrailEntryHost, safeDecodeURIComponent } from '@web-common/utils/utils';
import SiriusLayout from '../layouts';

const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /sid=([0-9a-zA-Z%_#*\-.]+)/i;

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const storeApi = api.getDataStoreApi() as DataStoreApi;
const sysApi = api.getSystemApi() as SystemApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

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

const diableBackDB = (disable: boolean) => {
  if (window && window.bridgeApi && window.bridgeApi.master) {
    if (disable) {
      window.bridgeApi.master.forbiddenBbWin4CurrPage();
    } else {
      window.bridgeApi.master.enableBbWin4CurrPage();
    }
  }
};

const getSearch = (key: string, decode = false): string => {
  try {
    const search = new URLSearchParams(decode ? safeDecodeURIComponent(window.location.search) : window.location.search);
    return search.get(key) || '';
  } catch (e) {
    console.error('get search error ', e);
  }
  return '';
};

const getJumpMode = (): JumpMode => {
  if (inWindow() && window.location.search) {
    if (getSearch('jumpMode', true) === 'jumpOut') {
      return 'jumpOut';
    }
    if (getSearch('jumpMode', true) === 'clientLogin') {
      return 'clientLogin';
    }
    return 'login';
  }
  return 'login';
};

export type JumpMode = 'login' | 'jumpOut' | 'clientLogin';

const JumpPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');
  const [loginError, setLoginError] = useState<boolean>(false);
  const [sid, setSid] = useState<string>('');

  useEffect(() => {
    if (inWindow() && window.location.search) {
      const currentJumpMode = getJumpMode();
      // for跳转登录
      if (userInfoPattern.test(window.location.search)) {
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
          diableBackDB(true);
          sysApi
            .doGetCookies(true)
            .then(rs => {
              if (rs && (uid || rs.qiye_uid || rs.mail_uid)) {
                const uidStr = uid || rs.qiye_uid || rs.mail_uid;
                const emailAccount = uidStr.replace(/"/g, '');
                return storeApi.setLastAccount(undefined).then(success => {
                  console.warn('[jump page] clear', success);
                  return loginApi.doTryLoginWithCurrentState(emailAccount, loginKey);
                });
              }
              setLoginError(true);
              return Promise.reject(new Error('没有查询到本地cookie'));
            })
            .then(re => {
              if (re.pass) {
                // 外部跳转
                diableBackDB(false);
                if (currentJumpMode === 'jumpOut') {
                  const jumpType = getSearch('jumpType', true);
                  const from = getSearch('from', true);
                  if (jumpType === '1') {
                    const targetUrl = getWaimaoTrailEntryHost() + '?' + encodeURIComponent(`from=${from}`);
                    location.assign(targetUrl);
                  }
                } else if (currentJumpMode === 'clientLogin') {
                  // 客户端跳转Web登录
                  const redirectUrl = getSearch('target');
                  navigate(redirectUrl || '/');
                } else {
                  // 跳转登录
                  const options = {
                    state: {
                      show_old: getSearch('show_old'),
                      from: getSearch('from'),
                    },
                  };
                  recordTimestamp();
                  if (getSearch('testJu') !== '1') {
                    navigate('/', options);
                  }
                }
              } else {
                setLoginError(true);
              }
            })
            .catch(ex => {
              diableBackDB(false);
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
    }
  }, []);

  // 登陆出错
  if (loginError) {
    return <LoginError sid={sid} show_old={getSearch('show_old')} />; // sid 由jump传入，保持一致性
  }

  const renderLogin = <NewVersionLoading tip={getIn18Text('jumping')} />;

  let page;
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
