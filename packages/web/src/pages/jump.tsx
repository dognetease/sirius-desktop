import React, { useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import {
  // AccountApi,
  api,
  apiHolder,
  apis,
  // BkLoginInitData, BkLoginResultData,
  DataStoreApi,
  DataTrackerApi,
  // globalStoreConfig,
  inWindow,
  locationHelper,
  LoginApi,
  PerformanceApi,
  resultObject,
  SystemApi,
} from 'api';
// import Login from '@web-account/Login/login';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
// import { useAppDispatch } from '@web-common/state/createStore';
// import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
// import { actions as mailTabActions, tabType } from '@web-common/state/reducer/mailTabReducer';
// import Launch from '@web-account/Launch/launch';
import { LoginError } from '@web-account/Login/login_error/login_error';
import { getWaimaoTrailEntryHost, safeDecodeURIComponent } from '@web-common/utils/utils';
import { NewVersionLoading } from '@web-account/Login/new_version_loading/new_version_loading';
// import { config } from 'env_def';
import SiriusLayout from '../layouts';
import { setHistoryState } from '../components/util/historyState';
import { getIn18Text } from 'api';
import { message } from 'antd';

console.info('---------------------from jump page------------------');
const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /sid=([^&]+)/i;

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const storeApi = api.getDataStoreApi() as DataStoreApi;
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

const getSearch = (key: string, decode = false): string => {
  const search = new URLSearchParams(decode ? safeDecodeURIComponent(window.location.search) : window.location.search);
  return search.get(key) || '';
};

const getSearchNew = (key: string, decode = false): string => {
  const search = window.location.search;
  if (!search) return '';
  const params: resultObject = {};
  search
    .replace('?', '')
    .split('&')
    .forEach(param => {
      const [key, value] = param.split('=');
      params[key] = value;
    });
  const value = params[key] || '';
  if (!value) return '';
  return decode ? safeDecodeURIComponent(value) : value;
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

const trackJumpPageErrorToHubble = (errorType: string, errorMsg?: string) => {
  try {
    trackApi.track('jump_page_error', {
      errorType,
      errorMsg,
    });
  } catch (ex) {
    console.error('trackJumpErrorToHubble catch', ex);
  }
};

const getJumpMode = (): JumpMode => {
  if (inWindow() && window.location.search) {
    if (getSearch('jumpMode', true) === 'jumpOut') {
      return 'jumpOut';
    }
    return 'login';
  }
  return 'login';
};

export type JumpMode = 'login' | 'jumpOut';

const JumpPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');
  // const [originLoginKey, setLoginInfoKey] = useState<string>();
  //
  // const handlerResetPassword = (email: string) => {
  //   storeApi.putSync('willAutoLoginAccount', email, { noneUserRelated: true });
  //   navigate('/password_reset');
  // };
  const [jumpMode, setJumpMode] = useState<JumpMode>('login');
  const [loginError, setLoginError] = useState<boolean>(false);
  const [sid, setSid] = useState<string>('');

  // const dispatch = useAppDispatch();

  useEffect(() => {
    if (inWindow() && window.location.search) {
      const currentJumpMode = getJumpMode();
      setJumpMode(currentJumpMode);
      // for跳转登录
      if (userInfoPattern.test(window.location.search)) {
        trackApi.track('web_auto_login_start', { pos: window.location.pathname });
        // 获取url sid
        const exec = userInfoPattern.exec(window.location.search);
        if (exec && exec[1]) {
          const loginKey = safeDecodeURIComponent(exec[1]) || '';
          setSid(loginKey);
          // 超时报错
          const tid = setTimeout(() => {
            setLoginError(true);
            trackJumpPageErrorToHubble('api_timeout');
            console.warn('timeout when jump to page ');
          }, 45000);
          const uid = locationHelper.getParam('uid');
          diableBackDB(true);
          sysApi
            .doGetCookies(true)
            .then(rs => {
              if (rs && (uid || rs.qiye_uid || rs.mail_uid)) {
                const uidStr = uid || rs.qiye_uid || rs.mail_uid;
                const emailAccount = uidStr.replace(/"/g, '');
                const originUid = getSearch('origin_uid');
                return storeApi.setLastAccount(undefined).then(success => {
                  console.log('JUMP CLEAR', success);
                  return loginApi.doTryLoginWithCurrentState(emailAccount, loginKey, originUid);
                });
                // return loginApi.doTryLoginWithCurrentState(emailAccount, loginKey, originUid);
              }
              setLoginError(true);
              trackJumpPageErrorToHubble('cookie_or_url_err');
              return Promise.reject(new Error('没有查询到本地cookie'));
            })
            .then(re => {
              if (re.pass) {
                // location.assign(locationHelper.buildStaticUrl('/'));
                diableBackDB(false);
                // 外部跳转
                if (currentJumpMode === 'jumpOut') {
                  const jumpType = getSearch('jumpType', true);
                  // 跳转至灵犀云文档
                  if (jumpType === '0') {
                    // 跳转源头
                    const fromUrl = getSearchNew('fromUrl', false);
                    // 跳转文档目标
                    const toUrl = getSearchNew('toUrl', true);
                    if (!toUrl) message.error('跳转失败');
                    try {
                      const fullToUrl = toUrl.includes('http') ? toUrl : `https://${toUrl}`;
                      let toUrlObj = new URL(fullToUrl);
                      // 文档url结构清奇，参数放在了hash里...
                      toUrlObj.hash += `&fromUrl=${fromUrl}`;
                      console.log('toUrltoUrl', toUrlObj);
                      location.assign(toUrlObj.href);
                    } catch (error) {
                      console.log('jump error', error);
                      message.error('跳转失败');
                      toUrl && location.assign(toUrl);
                    }
                  }
                  // 跳转至外贸
                  if (jumpType === '1') {
                    const from = getSearch('from', true);
                    const targetUrl = getWaimaoTrailEntryHost() + '?' + encodeURIComponent(`from=${from}`);
                    location.assign(targetUrl);
                  }
                } else {
                  // 跳转登录
                  const options = {
                    state: {
                      show_old: getSearch('show_old'),
                      from: getSearch('from'),
                    },
                  };
                  recordTimestamp();
                  setHistoryState(options.state);
                  navigate('/', options);
                  trackApi.track('web_auto_login_end', { pos: window.location.pathname });
                }
                // }
                // else {
                //   navigate('/').then(() => {
                //     recordTimestamp();
                //   });
                // }
                // webmail跳转文件夹及邮件逻辑，待优化
                // try {
                //   const module = getSearch('module');
                //   const jsonStr = module.replace(/(\S*)\|/, '');
                //   const params = JSON.parse(jsonStr || '{}');
                //   const fid = params?.fid;
                //   const mid = getSearch('mid');
                //   if (fid) {
                //     dispatch(mailActions.doUpdateSelectedKey({ id: +fid }));
                //   }
                //   if (mid) {
                //     const tab = {
                //       id: mid,
                //       title: '邮件详情',
                //       type: tabType.read,
                //       closeable: true,
                //       isActive: true
                //     };
                //     setTimeout(() => dispatch(mailTabActions.doSetTab(tab)), 5000);
                //   }
                // } catch (e) {
                //   console.warn('jump params parse wrong');
                // }
              } else {
                trackJumpPageErrorToHubble('api_not_pass');
                setLoginError(true);
              }
            })
            .catch(ex => {
              console.warn('[jump page] error ', ex);
              const errMsg = ex && ex.message ? ex.message : undefined;
              trackJumpPageErrorToHubble('api_err', errMsg);
              diableBackDB(false);
              setLoginError(true);
            })
            .finally(() => {
              clearTimeout(tid);
            });
        } else {
          setLoginError(true);
        }
      }
    }
  }, []);

  // 登陆出错
  if (loginError) {
    return <LoginError sid={sid} show_old={getSearch('show_old')} />; // sid 由jump传入，保持一致性
  }

  // const renderLogin = <Login type="common" handlerResetPassword={handlerResetPassword} originLoginKey={originLoginKey} />;
  // const renderLogin = <div>登录中。。。</div>;
  // const renderLogin = <Launch from="launch" />;
  const jumpOutTip = getIn18Text('jumping');
  const renderLogin = <NewVersionLoading tip={jumpMode === 'jumpOut' ? jumpOutTip : undefined} />;

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
