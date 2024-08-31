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
  ProductAuthApi,
  getIn18Text,
  addAccountPageEmailsKey,
} from 'api';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import Login from '@web-account/Login/login';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '../layouts';

console.info('---------------------from login page------------------');
const buildFor = apiHolder.env.forElectron;
const userInfoPattern = /userInfo=([0-9a-zA-Z%_#\-.]+)/i;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storeApi = api.getDataStoreApi() as DataStoreApi;
const eventApi = api.getEventApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const systemApi = api.getSystemApi() as SystemApi;
const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;

const SWITCH_ACCOUNT_RESULT_EVENT = 'bkStableSwitchAccount';

async function sendSwitchAccountErrorEvent(accountId: string, errorType?: string) {
  return eventApi.sendSysEvent({
    eventName: SWITCH_ACCOUNT_RESULT_EVENT,
    eventData: {
      pass: false,
      accountId,
      errorType,
    } as BkLoginResultData,
  });
}

eventApi.registerSysEventObserver('initBkLoginPage', {
  name: 'bkLogin-init-page',
  func: async (e: SystemEvent<BkLoginInitData>) => {
    if (e.eventData) {
      if (!inWindow()) {
        return;
      }
      // 关闭后台DB
      if (window.bridgeApi && window.bridgeApi.master) {
        window.bridgeApi.master.forbiddenBbWin4CurrPage();
      }

      const { account, browserUUId, accountId, accountInfo, sessionName, isSharedAccountSwitch, targetSharedAccount } = e.eventData;
      try {
        const switchTimeOut = setTimeout(async () => {
          await sendSwitchAccountErrorEvent(accountId, 'timeout');
        }, 20 * 1000);

        if (browserUUId) {
          await loginApi.setDeviceId(browserUUId);
        }

        if (account && account.length) {
          accountApi.storeAccountList(account);
        }

        if (accountInfo && accountInfo.length) {
          accountApi.storeAccountInfoList(accountInfo);
        }

        if (sessionName) {
          systemApi.setCurrentSessionName(sessionName);
        }

        const { pass } = await loginApi.doAutoLogin(accountId);

        let eventData = {
          pass,
          accountId,
        } as BkLoginResultData;
        if (pass) {
          let switchRes;
          const [_account, _accountInfo] = await accountApi.doGetAllAccountList();
          if (isSharedAccountSwitch && targetSharedAccount) {
            switchRes = await loginApi.switchSharedAccount(targetSharedAccount, true);
          }
          if (switchRes && !switchRes.success) {
            eventData.pass = false;
          } else {
            const currentUser = systemApi.getCurrentUser();
            const currentNode = storeApi.getCurrentNode();
            const authInfo = productAuthApi.getStoreAuthInfo();
            eventData = Object.assign(eventData, { currentUser, currentNode, authInfo, account: _account, accountInfo: _accountInfo });
          }
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
        await sendSwitchAccountErrorEvent(accountId, 'catch');
      }
    } else {
      await sendSwitchAccountErrorEvent('no-account', 'no-event');
    }
  },
});
eventApi.registerSysEventObserver('initAddAccountPageEvent', {
  name: 'add-account-page-init',
  func: async (ev: SystemEvent<AddAccountPageInitDataType>) => {
    if (window.bridgeApi && window.bridgeApi.master) {
      window.bridgeApi.master.forbiddenBbWin4CurrPage();
    }
    window.electronLib.windowManage.setTitle(getIn18Text('TIANJIAYOUXIANGZHANG'));
    const { eventData } = ev;
    if (eventData) {
      const { currentHostType, currentUser, browserUUId, sessionName, visibileWinIds } = eventData;
      if (currentHostType) {
        systemApi.setCurrentHostType(currentHostType);
      }
      if (currentUser) {
        let emailList: Array<string> = [];
        if (currentUser.prop && Array.isArray(currentUser.prop.accountAlias)) {
          emailList = currentUser.prop.accountAlias as Array<string>;
        }
        emailList.push(currentUser.id);
        storeApi.putSync(addAccountPageEmailsKey, JSON.stringify(emailList), globalStoreConfig);
      }
      if (browserUUId) {
        await loginApi.setDeviceId(browserUUId);
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
  useEffect(() => {
    if (!inWindow()) return;
    const oldTitle = document.title;
    document.title = `${getIn18Text('WANGYILINGXIBAN')} - 登录`;
    return () => {
      document.title = oldTitle || '';
    };
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
    page = inWindow() ? <SiriusLayout.LoginLayout>{renderLogin}</SiriusLayout.LoginLayout> : null;
  }
  return page;
};
export default LoginPage;
console.info('---------------------end login page------------------');
