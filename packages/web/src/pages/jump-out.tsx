import React, { useCallback, useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { api, apiHolder, apis, inWindow, LoginApi, getIn18Text } from 'api';
import { LoginError } from '@web-account/Login/login_error/login_error';
import { getJumpOutRedirectUrl, getWaimaoTrailJumpUrl, safeDecodeURIComponent } from '@web-common/utils/utils';
import { NewVersionLoading } from '@web-account/Login/new_version_loading/new_version_loading';
import SiriusLayout from '../layouts';

console.info('---------------------from jump-out page------------------');
const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /sid=([^&]+)/i;

const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

const getSearch = (key: string, decode = false): string => {
  const search = new URLSearchParams(decode ? safeDecodeURIComponent(window.location.search) : window.location.search);
  return search.get(key) || '';
};

const JumpOutPage: React.FC<PageProps> = () => {
  const [sid, setSid] = useState('');
  const [loginError, setLoginError] = useState(false);

  // 跳转到外贸体验版的点击事件，不走原有逻辑，直接跳走
  const onHandleJumpOutClick = useCallback(
    (sessionId: string) =>
      loginApi
        .getLoginCode()
        .then(code => {
          if (code) {
            setLoginError(false);
            const redirectUrl = getJumpOutRedirectUrl(sessionId, 'mailHLogin');
            const jumpUrl = getWaimaoTrailJumpUrl(code, redirectUrl);
            window.location.assign(jumpUrl);
          } else {
            setLoginError(true);
            console.error('[jump-out page] error', code);
          }
        })
        .catch(e => {
          setLoginError(true);
          console.error('[jump-out page] error', e);
        }),
    []
  );

  useEffect(() => {
    if (inWindow() && window.location.search) {
      // for跳转登录
      if (userInfoPattern.test(window.location.search)) {
        const exec = userInfoPattern.exec(window.location.search);
        if (exec && exec[1]) {
          const sessionId = safeDecodeURIComponent(exec[1]) || '';
          onHandleJumpOutClick(sessionId);
          setSid(sessionId);
        } else {
          setLoginError(true);
        }
      }
    }
  }, []);

  // 登陆出错
  if (loginError) {
    return <LoginError sid={sid} show_old={getSearch('show_old')} hideBtn />;
  }

  const jumpOutTip = getIn18Text('jumping');
  const renderLogin = <NewVersionLoading tip={jumpOutTip} />;

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

export default JumpOutPage;

console.info('---------------------end jump-out page------------------');
