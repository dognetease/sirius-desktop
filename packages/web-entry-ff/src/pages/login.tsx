import React, { useEffect, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import {
  AccountApi,
  api,
  apiHolder,
  apis,
  BkLoginInitData,
  BkLoginResultData,
  DataStoreApi,
  DataTrackerApi,
  globalStoreConfig,
  inWindow,
  LoginApi,
  SystemEvent,
  AddAccountPageInitDataType,
  SystemApi,
  Bridge,
  MasterBridge,
  ProductAuthApi,
} from 'api';
import Login from '@web-account/Login/login';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { config } from 'env_def';
import SiriusLayout from '../layouts';
import { getIn18Text } from 'api';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

console.info('---------------------from login page------------------');
const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /userInfo=([0-9a-zA-Z%_#\-.]+)/i;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storeApi = api.getDataStoreApi() as DataStoreApi;
const eventApi = api.getEventApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const keyDeviceUUID = config('browerDeviceUUID') as string;
const systemApi = api.getSystemApi() as SystemApi;
const bridgeApi = api.requireLogicalApi(apis.bridgeApiImpl) as Bridge;
const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
eventApi.registerSysEventObserver('initPage', {
  name: 'bkLogin-init-page',
  func: async (e: SystemEvent<BkLoginInitData>) => {
    if (e.eventData) {
      const instance = bridgeApi.getInstance();
      if (instance) {
        (instance as MasterBridge).forbiddenBbWin4CurrPage();
      }
      const { account, accountInfo, browserUUId, accountId } = e.eventData;
      try {
        const switchTimeOut = setTimeout(() => {
          throw new Error('switchAccountTimeout');
        }, 20 * 1000);
        storeApi.putSync(keyDeviceUUID, browserUUId, globalStoreConfig);
        storeApi.loadUUID();
        const [originAccount, originAccountInfo] = await accountApi.doGetAllAccountList();
        await Promise.all([
          accountApi.doDeleteAccountList(originAccount.map(item => item.id)),
          accountApi.doDeleteAccountInfoList(originAccountInfo.map(item => item.id)),
        ]);
        await Promise.all([accountApi.storeAccountList(account), accountApi.storeAccountInfoList(accountInfo)]);
        const { pass } = await loginApi.doAutoLogin(accountId);
        let eventData = {
          pass,
          accountId,
        } as BkLoginResultData;
        if (pass) {
          const [_account, _accountInfo] = await accountApi.doGetAllAccountList();
          eventData = Object.assign(eventData, { account: _account, accountInfo: _accountInfo });
        }
        clearTimeout(switchTimeOut);
        await eventApi.sendSysEvent({
          eventName: 'bkStableSwitchAccount',
          eventData,
        });
      } catch (error) {
        loggerApi.track('bkLogin-init-page-error', {
          message: (error as Error).message,
        });
        await eventApi.sendSysEvent({
          eventName: 'bkStableSwitchAccount',
          eventData: {
            pass: false,
            accountId,
          } as BkLoginResultData,
        });
      }
      // if (pass) {
      //   await systemApi.createWindow({
      //     type: 'main',
      //     sessionName: systemApi.md5(accountId, true)
      //   });
      // } else {
      //   systemApi.closeWindow(false, true);
      // }
    }
  },
});
eventApi.registerSysEventObserver('initAddAccountPageEvent', {
  name: 'add-account-page-init',
  func: async (ev: SystemEvent<AddAccountPageInitDataType>) => {
    const instance = bridgeApi.getInstance();
    if (instance) {
      (instance as MasterBridge).forbiddenBbWin4CurrPage();
    }
    window.electronLib.windowManage.setTitle(getIn18Text('TIANJIAYOUXIANGZHANG'));
    const { eventData } = ev;
    if (eventData) {
      const { currentHostType, currentUser, browserUUId, sessionName, visibileWinIds } = eventData;
      if (currentHostType) {
        systemApi.setCurrentHostType(currentHostType);
      }
      if (currentUser) {
        storeApi.setLastAccount(currentUser);
      }
      if (browserUUId) {
        loginApi.setDeviceId(browserUUId);
      }
      if (sessionName) {
        systemApi.setCurrentSessionName(sessionName);
      }
      if (visibileWinIds && visibileWinIds.length) {
        const { electronLib } = window;
        if (electronLib) {
          const { windowManage } = electronLib;
          const currWinInfo = await windowManage.getCurWindow();
          if (!currWinInfo) return;
          const currWinId = currWinInfo.id;
          windowManage.addHooksListener({
            onBeforeClose: (closeWinId: number) => {
              // addAccountPage关闭时关闭窗口
              if (closeWinId && Number(closeWinId) === currWinId) {
                windowManage.close({ currWinId, quit: true, force: true });
                visibileWinIds.forEach(winId => {
                  windowManage.show(winId);
                });
              }
              return false;
            },
            onOpenExternalUrl: (winId: number, data: any) => {
              systemApi.handleJumpUrl(winId, data);
            },
          });
        }
      }
      eventApi.registerSysEventObserver('accountAdded', {
        func: async ev => {
          if (ev.eventStrData === 'loginSucc') {
            // 登录成功
            const currentUser = systemApi.getCurrentUser();
            const currentNode = storeApi.getCurrentNode();
            const authInfo = productAuthApi.getStoreAuthInfo();
            const [originAccount, originAccountInfo] = await accountApi.doGetAllAccountList();
            eventApi.sendSysEvent({
              eventName: 'addAccountPageReturnEvent',
              toType: ['main'],
              eventData: {
                currentUser,
                currentNode,
                originAccount,
                originAccountInfo,
                authInfo,
              },
            });
          }
        },
      });
    }
  },
});
const LoginPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');
  const [originLoginKey, setLoginInfoKey] = useState<string>();
  const handlerResetPassword = (email: string) => {
    storeApi.putSync('willAutoLoginAccount', email, { noneUserRelated: true });
    const isAddAccountPage = systemApi.getIsAddAccountPage();
    navigate('/password_reset' + (isAddAccountPage ? '?add-account-page=true' : ''));
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
  const renderLogin = <Login type="common" handlerResetPassword={handlerResetPassword} originLoginKey={originLoginKey} />;
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
export default LoginPage;
console.info('---------------------end login page------------------');
