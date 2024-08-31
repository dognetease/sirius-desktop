import { navigate } from '@reach/router';
import { NotiAction, NotificationNum, PushHandleApi, IPushConfigSetRequest, IPushConfigGetRes, IPushConfigCleanRes } from '../../../api/logical/push';
import { Api, ApiLifeCycleEvent, NotificationType, PopUpMessageInfo, User } from '../../../api/_base/api';
import { api } from '../../../api/api';
import { NIMApi } from '@/api/logical/im';
import { apis, inWindow } from '../../../config';
import { allAvailableNotificationType, EventApi } from '../../../api/data/event';
import { SystemApi } from '../../../api/system/system';
import { ApiResponse, DataTransApi, ResponseData } from '../../../api/data/http';
import { DataStoreApi } from '../../../api/data/store';
import { LoginApi, LoginModel } from '../../../api/logical/login';
import { TaskApi } from '../../../api/system/task';
import { util } from '@/api/util';
import { AccountApi, AccountInfo, ISharedAccount } from '@/api/logical/account';
import { mailPerfTool } from '@/api/util/mail_perf';
// import {StringTypedMap} from "../../../api/commonModel";

// import {electronLib} from "sirius-desktop/lib";

import { SubAccountTableModel } from '@/api/data/tables/account';
import { SystemEvent } from '@/api/data/event';
import { getIn18Text } from '@/api/utils';

interface IPushFolderItem {
  folderId: number;
  type: number;
}

let _isEnableIM = true;

class PushHandlerApiImpl implements PushHandleApi {
  static inited = false;

  static readonly unhandledNotificationNumKey: string = 'unhandledNotificationCount';

  user?: User;

  currentNo!: NotificationNum;

  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  httpApi: DataTransApi;

  storeApi: DataStoreApi;

  loginApi: LoginApi;

  accountApi: AccountApi;

  taskApi: TaskApi;

  nimApi: NIMApi;

  // isAccountBg: boolean;

  subAccountMailUnreadCount: Map<string, number> = new Map();

  allAccountNoticeInfo: Map<string, NotificationNum> = new Map();

  constructor() {
    this.name = apis.pushApiImpl;
    this.httpApi = api.getDataTransApi();
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.taskApi = api.requireLogicalApi(apis.taskApiImpl) as TaskApi;
    this.nimApi = api.requireLogicalApi(apis.imApiImpl) as NIMApi;
    // this.isAccountBg = this.getIsAccountBg();
    this.resetCurrentNoToZero();
    this.currentNo = {
      im: 0,
      mail: 0,
      sys: 0,
      whatsApp: 0,
      facebook: 0,
    };
    this._handleSubAccountExpired = this._handleSubAccountExpired.bind(this);
  }

  private updateIsEnableIMNotification() {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      if (currentUser) {
        this.getCurrentPushConfig(1).then(res => {
          if (res && res.success && res.data) {
            _isEnableIM = res.data.isIMEnable!;
          }
        });
      }
    } catch (ex) {
      console.error('updateIsEnableIMNotification-catch', ex);
    }
  }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      // this.isAccountBg = this.getIsAccountBg();
      this.user = ev.data?.eventData as User;
      if (this.user) {
        this.registerPush(this.user);
      }
      this.loadUnreadNum(this.user);
    }
    return this.name;
  }

  beforeLogout(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      const user = ev.data?.eventData as User;
      this.unregisterPush(user?.id);
      this.resetCurrentNoToZero(user?.id);
      this.currentNo = {
        im: 0,
        mail: 0,
        sys: 0,
        whatsApp: 0,
        facebook: 0,
      };
    }
    return this.name;
  }

  // 订阅子账号邮件未读数变更
  registerSubAccountUnreadCount(
    ev: SystemEvent<{
      type: string;
      num: number;
    }>
  ) {
    const { type, num } = ev.eventData!;
    const subAccount = ev._account as string;
    if (type !== 'mail') {
      return;
    }
    // >0 表示是有新增未读 =0表示要清空
    if (num > 0) {
      this.subAccountMailUnreadCount.set(subAccount, num);
    } else if (num === 0) {
      this.subAccountMailUnreadCount.set(subAccount, 0);
    }

    this.pushNumChange('mail', subAccount);
  }

  registerPush(user: User) {
    this.httpApi
      .post(
        this.systemApi.getUrl('mailPushRegister'),
        {
          sources: 'pushmail',
          target: 'newclientPC',
          uid: user.id,
        },
        { _account: user.id }
      )
      .then(res => {
        // TODO: handle exception status
        console.log('[push] register push succeed:', res);
      })
      .catch(res => {
        console.warn('[push] register push failed:', res);
      });
  }

  private unregisterPush(email: string) {
    if (email) {
      this.httpApi
        .post(
          this.systemApi.getUrl('mailPushUnregister'),
          {
            sources: 'pushmail',
            target: 'newclientPC',
            uid: email,
          },
          { _account: email }
        )
        .then(res => {
          // TODO: handle exception status
          console.log('[push] unregister push succeed:', res);
        })
        .catch(res => {
          console.warn('[push] unregister push failed:', res);
        });
    }
  }

  async getCurrentPushConfig(type: number = 0, _account?: string): Promise<IPushConfigGetRes> {
    try {
      const url = this.systemApi.getUrl('getPushConfig');
      return this.httpApi
        .post(url, { type }, { _account })
        .then(res => res.data)
        .then(res => {
          if (res && res.success && res.data === null) {
            res.data = {
              imPushSwitch: 1,
              folderConfigs: [],
              mailPushSwitch: 1,
            };
          }
          if (res && res.success && res.data) {
            const resData = res.data;
            const isIMEnable = !!(resData.imPushSwitch && Number(resData.imPushSwitch) === 1);
            const isMailEnable = !!(resData.mailPushSwitch && Number(resData.mailPushSwitch) === 1);
            const disableFolders: Array<number> =
              type === 1
                ? []
                : (resData.folderConfigs || [])
                    .filter((configItem: IPushFolderItem) => configItem && configItem.type === 0)
                    .map((configItem: IPushFolderItem) => configItem.folderId);
            return {
              success: true,
              data: {
                isIMEnable,
                disableFolders,
                isMailEnable,
              },
            };
          }
          return {
            success: false,
            errorMsg: res?.message || '',
          };
        })
        .catch((err: any) => ({
          success: false,
          errorMsg: (err && err.message) || '',
        }));
    } catch (ex: any) {
      console.error('getCurrentPushConfig-catch', ex);
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  async cleanPushConfig(_account?: string): Promise<IPushConfigCleanRes> {
    try {
      const url = this.systemApi.getUrl('cleanPushConfig');
      return this.httpApi
        .post(url, undefined, { _account })
        .then(res => res.data)
        .then(res => {
          if (res && res.success && res.data) {
            return {
              success: true,
            };
          }
          return {
            success: false,
            errorMsg: res?.message || '',
          };
        })
        .catch(err => ({
          success: false,
          errorMsg: (err && err.message) || '',
        }));
    } catch (err: any) {
      return {
        success: false,
        errorMsg: (err && err.message) || '',
      };
    }
  }

  private async setPushConfigToServer(config: IPushConfigSetRequest, _account?: string) {
    try {
      const url = this.systemApi.getUrl('setPushConfig');
      const deviceInfo = this.httpApi.getDeviceInfo();
      const currentUser = this.systemApi.getCurrentUser(_account);
      if (!currentUser) {
        return {
          success: false,
          errorMsg: 'not login',
        };
      }
      const isThirdSubAccount = this.systemApi.getIsThirdSubAccountByEmailId(currentUser.id || '');
      const mainAndSubAccount = isThirdSubAccount ? `${currentUser.id}}` : '';
      const userInfo = await this.accountApi.getCurrentAccountInfo(currentUser.id, _account || '');

      const yunxinAccountId = isThirdSubAccount ? 'unused' + this.systemApi.md5(`${userInfo.qiyeAccountId}-${mainAndSubAccount}`) : userInfo.yunxinAccountId;

      const resData = await this.httpApi
        .post(
          url,
          {
            _system: deviceInfo?._system,
            _platform: deviceInfo?.p,
            yxAccId: yunxinAccountId,
            imPushSwitch: config.isIMEnable ? 1 : 0,
            imPushSound: 'default',
            mailPushSwitch: config.isMailEnable ? 1 : 0,
            mailPushSound: 'default',
            folderConfigs: (config.disableFolders || []).map(folderId => ({
              folderId,
            })),
          },
          { contentType: 'json', _account }
        )
        .then(res => res.data);
      if (resData && resData.success) {
        _isEnableIM = !!config.isIMEnable;
        return {
          success: true,
        };
      }
      return {
        success: false,
        errorMsg: resData?.error || '',
      };
    } catch (ex: any) {
      console.error('setPushConfigToServer-error', ex);
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  async setCurrentConfig(config: IPushConfigSetRequest, _account?: string) {
    try {
      let fullSetConfig: IPushConfigSetRequest | null = null;
      const noIMEnableInParam = typeof config.isIMEnable === 'undefined';
      const noDisableFoldersInParam = typeof config.disableFolders === 'undefined';
      const noMailEnableInParam = typeof config.isMailEnable === 'undefined';
      if (noIMEnableInParam && noDisableFoldersInParam && noMailEnableInParam) {
        return {
          success: true,
        };
      } else {
        const serverConfig = await this.getCurrentPushConfig(undefined, _account);
        if (!serverConfig.success) {
          return {
            success: false,
            errorMsg: serverConfig.errorMsg,
          };
        }
        //@ts-ignore
        const configData: IPushConfigSetRequest = serverConfig.data;
        if (configData) {
          fullSetConfig = {
            isIMEnable: noIMEnableInParam ? configData.isIMEnable : config.isIMEnable,
            disableFolders: noDisableFoldersInParam ? configData.disableFolders : config.disableFolders,
            isMailEnable: noMailEnableInParam ? configData.isMailEnable : config.isMailEnable,
          };
          const serverRes = await this.setPushConfigToServer(fullSetConfig, _account);
          return serverRes;
        }
        return {
          success: false,
        };
      }
    } catch (ex: any) {
      console.error('setCurrentConfig-catch', ex);
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  private getParams = (str: string, name: string) => {
    const reg = new RegExp(`${name}=([^\\?&]+)(?=(&|$))`);
    if (str.match(reg)) {
      return (str.match(reg) as string[])[1];
    }
    return '';
  };

  private openImSession = (paramsStr: string, str: string, type = 'hash') => {
    const sessionId = this.getParams(paramsStr, 'sessionId');
    const [scene, to] = sessionId.split('-') as ['p2p' | 'team', ''];
    if (type === 'assign') {
      window.location.assign(str + paramsStr);
    } else {
      window.location.hash = str + paramsStr;
    }
    this.nimApi.currentSession.setPushSessionEvent({ scene, to });
  };

  getNotificationCount(): NotificationNum {
    return this.currentNo;
  }

  triggerNotificationInfoChange(content: NotiAction, _account = ''): void {
    console.log('[push] $$$$$ trigger push:', content);
    let needChangeNum = false;
    let type: NotificationType | undefined;
    const currentUserId = this.systemApi.getCurrentUser(_account)?.id || '';
    const currentNotice = this.allAccountNoticeInfo.get(currentUserId);
    if (!currentNotice) {
      return;
    }
    // const mailChangedEventTarget = workerWinId > -1 ? workerWinId + '' : undefined;
    switch (content.action) {
      case 'new_im_msg':
      case 'new_im_gp_msg':
        this.pushNotification(content, 'im');
        break;
      case 'new_im_noti':
        break;
      case 'new_im_msg_num':
        currentNotice.im = content.num;
        type = 'im';
        needChangeNum = true;
        break;
      case 'new_im_msg_inc':
        currentNotice.im += content.num;
        type = 'im';
        needChangeNum = true;
        break;
      case 'new_mail':
        this.pushNotification(content, 'mail');
        this.eventApi.sendSysEvent({
          eventName: 'mailPushNotify',
          eventData: {
            mid: content.mailId,
            accountId: content.accountId,
          },
          // eventTarget: mailChangedEventTarget,
          eventSeq: 0,
          eventStrData: 'notify',
        });
        // this.currentNo.mail += content.num;
        // type = 'mail';
        // needChangeNum = true;
        break;
      case 'new_mail_num': {
        const pre = currentNotice.mail;
        currentNotice.mail = content.num;
        type = 'mail';
        needChangeNum = pre !== currentNotice.mail;
        break;
      }
      case 'im_clear': {
        const pre = currentNotice.im;
        type = 'im';
        currentNotice.im = 0;
        needChangeNum = pre !== currentNotice.im;
        break;
      }
      case 'mail_clear': {
        const pre = currentNotice.mail;
        type = 'mail';
        currentNotice.mail = 0;
        needChangeNum = pre !== currentNotice.mail;
        break;
      }
      case 'whatsApp': {
        this.pushNotification(content, 'whatsApp');
        break;
      }
      case 'facebook': {
        this.pushNotification(content, 'facebook');
        break;
      }
      default:
        break;
    }
    this.allAccountNoticeInfo.set(currentUserId, currentNotice);
    this.storeUnhandedData(currentNotice, currentUserId);
    if (needChangeNum) {
      this.pushNumChange(type, _account);
    }
  }

  private getTotalNum(data: NotificationNum) {
    let num = 0;
    Object.keys(this.currentNo).forEach(it => {
      num += data[it as NotificationType] || 0;
    });
    const totalSubAccountUnreadAccount = [...this.subAccountMailUnreadCount.values()].reduce((total, cur) => total + cur, 0);
    num += Number.isSafeInteger(totalSubAccountUnreadAccount) ? Math.max(totalSubAccountUnreadAccount, 0) : 0;
    return num;
  }

  private getUnreadCount(type: NotificationType) {
    const currentAccount = this.systemApi.getCurrentUser()?.id;
    const currentNoticeInfo = this.allAccountNoticeInfo.get(currentAccount || '');
    if (type !== 'mail') {
      if (currentNoticeInfo) {
        return currentNoticeInfo[type];
      }
      return this.currentNo[type];
    }
    const totalSubAccountUnreadAccount = [...this.subAccountMailUnreadCount.values()].reduce((total, cur) => total + cur, 0);
    return (currentNoticeInfo?.mail || 0) + (Number.isSafeInteger(totalSubAccountUnreadAccount) ? Math.max(totalSubAccountUnreadAccount, 0) : 0);
  }

  private storeUnhandedData(data: NotificationNum, _account = '') {
    this.storeApi.put(PushHandlerApiImpl.unhandledNotificationNumKey, JSON.stringify(data), { _account }).then();
  }

  private pushNumChange(type?: NotificationType, _account?: string) {
    // const currentAccount = this.systemApi.getCurrentUser(_account)?.id || '';
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    if (_account && _account !== this.systemApi.getCurrentUser()?.id) {
      if ((type === 'mail' || !type) && this.allAccountNoticeInfo.has(_account)) {
        const currentNoticeInfo = this.allAccountNoticeInfo.get(_account);
        const num = currentNoticeInfo?.mail || 0;
        if (num > 0) {
          this.subAccountMailUnreadCount.set(_account, num);
        } else if (num === 0) {
          this.subAccountMailUnreadCount.set(_account, 0);
        }
      }
    }
    const currentNoticeInfo = this.allAccountNoticeInfo.get(mainAccount);
    this.systemApi.updateAppNotification({
      type: ['macDocker'],
      content: {
        num: this.getTotalNum(currentNoticeInfo || this.currentNo),
        title: '',
        code: '',
      },
    });
    if (type) {
      this.eventApi.sendSysEvent({
        eventSeq: 0,
        eventStrData: type,
        eventName: 'notificationChange',
        eventData: this.getUnreadCount(type),
      });
    } else {
      allAvailableNotificationType.forEach(str => {
        if (currentNoticeInfo && currentNoticeInfo[str] && currentNoticeInfo[str] > 0) {
          this.eventApi.sendSysEvent({
            eventSeq: 0,
            eventStrData: str,
            eventName: 'notificationChange',
            eventData: this.getUnreadCount(str),
          });
        }
      });
    }
  }

  private static handleNotificationContent(str: string) {
    const len = util.isMac() ? 40 : 64;
    const { chatLen: totalLen, real: result } = [...str].reduce(
      ({ chatLen, real }, item) => {
        if (chatLen < len) {
          if (/[\u4e00-\u9fa5]/.test(item)) {
            chatLen += 2;
          } else {
            chatLen += 1;
          }
          real += item;
        }
        return {
          chatLen,
          real,
        };
      },
      { chatLen: 0, real: '' }
    );
    return totalLen < len ? result : result + '...';
  }

  private isCurrrentAccountNotification(accountInfo: AccountInfo | SubAccountTableModel, accountId: string | undefined) {
    if (!accountInfo || !accountId) {
      return false;
    }
    return accountInfo.id && this.systemApi.md5(accountInfo.id) === accountId;
  }

  private async pushNotification(content: NotiAction, type: NotificationType) {
    let isOwner: boolean;
    let notificationContent = content.content;
    let receiveSubAccount: SubAccountTableModel | undefined;
    let isSubAccountNotification = false;

    if (type === 'im' && !_isEnableIM) {
      return;
    }

    let sharedAccount: ISharedAccount | undefined;

    if (type === 'mail') {
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser) {
        return;
      }
      const accountMd5 = this.systemApi.md5(currentUser.id);
      isOwner = content.accountId ? content.accountId === accountMd5 && !currentUser.isSharedAccount : true;
      const receiveSubAccounts = (await this.accountApi.getSubAccounts({ expired: false })) || [];
      const sharedAccountInfo = await this.accountApi.getSharedAccountsInfoAsync();
      isSubAccountNotification = !!receiveSubAccount;
      isOwner = isOwner || isSubAccountNotification;

      console.warn('pushNotification isOwner', isOwner);
      if (!isOwner) {
        if (!process.env.BUILD_ISELECTRON) {
          return;
        }
        receiveSubAccount = receiveSubAccounts.find(subAccount => this.isCurrrentAccountNotification(subAccount, content?.accountId));
        const { localList } = await this.accountApi.doGetAccountList();
        const receiveAccount = localList.find(item => this.isCurrrentAccountNotification(item, content?.accountId));
        sharedAccount = sharedAccountInfo?.sharedAccounts?.find(account => this.systemApi.md5(account.email) === content?.accountId);
        // 如果当前是公共账号登录，并且推送accountId为所属主账号id, 则取主账号信息;
        // 解决登录公共账号登录情况下不显示所属主账号的小红点问题
        if (currentUser.isSharedAccount && sharedAccountInfo?.email && this.systemApi.md5(sharedAccountInfo?.email) === content?.accountId) {
          sharedAccount = sharedAccountInfo as unknown as ISharedAccount;
        }
        if (!receiveAccount && !sharedAccount) {
          return;
        }
        if (receiveAccount?.nickName) {
          notificationContent =
            PushHandlerApiImpl.handleNotificationContent(notificationContent) + getIn18Text('LAIZI：') + receiveAccount.nickName + '(' + receiveAccount.id + ')';
        } else if (receiveAccount?.accountName) {
          notificationContent = PushHandlerApiImpl.handleNotificationContent(notificationContent) + getIn18Text('LAIZI：') + receiveAccount.accountName;
        }
        // 更新小红点
        if (process.env.BUILD_ISELECTRON && (sharedAccount || receiveAccount)) {
          const emailList = [];
          if (sharedAccount) {
            emailList.push(sharedAccount.email);
          }
          if (receiveAccount) {
            emailList.push(receiveAccount.id);
          }
          await this.accountApi.updateSidebarDockUnreadStatus(emailList, true);
          this.eventApi.sendSimpleSysEvent('accountNotify');
        }
        if (sharedAccount) {
          return;
        }
      }
    }
    this.systemApi.updateAppNotification({
      type: ['windowsFlush'],
      content: {
        num: this.getTotalNum(this.currentNo),
        title: '',
        code: '',
      },
    });
    if (this.systemApi.isElectron() && (await window.electronLib.appManage.isAppLockScreen())) {
      return;
    }
    this.systemApi
      .showSysNotification({
        code: '',
        tag: type,
        title: content.title,
        content: notificationContent,
        confirmCallback: async ev => {
          const isUnLockApp = this.systemApi.getIsLockApp();
          if (isUnLockApp) return;
          console.log('[push] confirm clicked:', ev);
          const idPart = content.data || '';
          if (process.env.BUILD_ISELECTRON) {
            window.electronLib.windowManage.show();
            if (this.systemApi.isMainPage()) {
              /** 打开读信页面 */
              if (type === 'mail') {
                if (!isOwner) {
                  const suc = await this.handleMultiAccount(content);
                  if (suc) {
                    return;
                  }
                  if (sharedAccount) {
                    await this.handleSharedAccount(sharedAccount.email, content.mailId || '');
                  } else {
                    await this.handleLocalAccount(content);
                  }
                } else {
                  mailPerfTool.mailContent('push', 'start', {
                    isThread: false,
                  });
                  const account = isSubAccountNotification ? receiveSubAccount?.id || '' : '';
                  this.systemApi
                    .createWindowWithInitData(
                      { type: 'readMail', additionalParams: { account } },
                      {
                        eventName: 'initPage',
                        eventData: { id: content?.mailId, accountId: account },
                        eventStrData: 'push',
                      }
                    )
                    .then();
                }
              } else if (type === 'im') {
                const isWaimao = this.systemApi.inEdm();
                const v1v2 = window.localStorage.getItem('v1v2');

                if (isWaimao && v1v2 === 'v2') {
                  this.openImSession(idPart, 'sirius://sirius.page/#coop?page=message&', 'assign');
                } else {
                  this.openImSession(idPart, 'sirius://sirius.page/#message?', 'assign');
                }
              } else {
                window.location.assign('sirius://sirius.page/#mailbox?' + idPart);
              }
            }
            if (ev.target.close && typeof ev.target.close === 'function') {
              ev.target.close();
            }
          } else if (inWindow()) {
            window.focus();
            if (this.systemApi.isMainPage()) {
              /** 打开读信窗口 */
              if (type === 'mail') {
                window.open(
                  `${this.systemApi.getContextPath()}/readMail/?id=${content?.mailId}&push=1`,
                  'readMail',
                  'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
                );
                return;
              }
              if (type === 'im') {
                this.openImSession(idPart, `${this.systemApi.isWebWmEntry() ? '#coop?page=message&' : '#message?'}`);
                return;
              }
              window.location.hash = '#mailbox?' + idPart;
            }
          }
          if (type === 'mail') {
            this.eventApi.sendSysEvent({
              eventName: 'mailChanged',
              eventData: '1',
              eventSeq: 0,
              eventStrData: '',
            });
          }
          if (type === 'whatsApp') {
            if (content.data) {
              try {
                const { chatId, from } = JSON.parse(content.data);
                const url = !from ? `#edm?page=whatsAppMessage&chatId=${chatId}` : `#edm?page=whatsAppMessage&chatId=${chatId}&from=${from}`;
                this.eventApi.sendSysEvent({
                  eventName: 'routeChange',
                  eventStrData: 'gatsbyStateNav',
                  eventData: { url },
                });
              } catch {}
            }

            if (typeof ev.target.close === 'function') {
              ev.target.close();
            }
          }
          if (type === 'facebook') {
            if (content.data) {
              try {
                const { pageId, contactId } = JSON.parse(content.data);
                navigate(`#edm?page=facebookMessage&pageId=${pageId}&contactId=${contactId}`);
              } catch (error) {
                console.warn(error);
              }
              if (typeof ev.target.close === 'function') {
                ev.target.close();
              }
            }
          }
        },
      })
      .then();
  }

  /**
   * 处理多账号邮件推送
   * @param content
   * @private
   */
  private async handleMultiAccount(content: NotiAction) {
    const bindAccount = await this.accountApi.getMainAndSubAccounts({ expired: false });
    const curAccount = bindAccount.find(item => item.id && this.systemApi.md5(item.id) === content?.accountId);
    if (!curAccount) {
      return false;
    }
    this.systemApi
      .createWindowWithInitData(
        { type: 'readMail', additionalParams: { account: curAccount.id } },
        {
          eventName: 'initPage',
          eventData: content?.mailId,
          eventStrData: 'push',
        }
      )
      .then();
    return true;
  }

  private async createMailPushTask(account: string, mailId: string) {
    try {
      if (!mailId) return;
      await this.taskApi.doCreateTask({
        account,
        action: 'AfterLogin',
        from: 'mail_push',
        to: 'mail',
        content: { mailId: mailId },
      });
    } catch (e) {
      console.error('[push] push 创建任务失败！！！！', e);
    }
  }

  private async switchSharedAccount(email: string) {
    try {
      const res = await this.loginApi.switchSharedAccount(email);
      if (!res.success) {
        this.eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            forcePopup: true,
            popupType: 'window',
            title: getIn18Text('TISHI'),
            popupLevel: 'error',
            content: res.errMsg || getIn18Text('SWITCH_SHARED_ACCOUNT_ERROR'),
            code: 'PARAM.ERR',
          },
          eventSeq: 0,
        });
      }
    } catch (ex) {
      console.error('switchSharedAccount-error', ex);
    }
  }

  private async handleSharedAccount(email: string, mailId: string) {
    try {
      if (!email || !mailId) return;
      await this.createMailPushTask(email, mailId);
      await this.switchSharedAccount(email);
    } catch (ex) {
      console.error('handleSharedAccount-error', ex);
    }
  }

  /**
   * 处理本地账号邮件推送
   * @param content
   * @private
   */
  private async handleLocalAccount(content: NotiAction) {
    const { localList } = await this.accountApi.doGetAccountList();
    const cur = localList.find(item => item.id && this.systemApi.md5(item.id) === content?.accountId);
    const account = cur && cur.id;
    if (!account) {
      return;
    }
    await this.createMailPushTask(account, content.mailId || '');
    this.handleAccountSwitch(account).then();
  }

  private async handleAccountSwitch(account: string) {
    this.eventApi.sendSysEvent({
      eventName: 'error',
      eventLevel: 'error',
      eventStrData: '',
      eventData: {
        popupType: 'toast',
        popupLevel: 'info',
        title: getIn18Text('ZHANGHAOQIEHUANZHONG..'),
        code: 'PARAM.ERR',
      } as PopUpMessageInfo,
      eventSeq: 0,
    });
    const preAccount = this.systemApi.getCurrentUser()?.id;
    const { pass } = await this.loginApi.doAutoLoginInCurrentPage(account, true);
    if (!pass) {
      // TODO 当上一个事件在前时，需要展示
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          forcePopup: true,
          popupType: 'window',
          popupLevel: 'error',
          title: getIn18Text('DENGLUZHUANGTAISHIXIAO'),
          content: `账号：${account}登录状态失效，无法切换，请重新选择账号登录`,
          code: 'PARAM.ERR',
          confirmCallback: () => {
            if (preAccount) {
              this.loginApi.doAutoLoginInCurrentPage(preAccount).then((res: LoginModel) => {
                if (res.pass) {
                  location.assign('/#setting');
                } else {
                  window.electronLib.windowManage.reload();
                }
              });
            } else {
              window.electronLib.windowManage.reload();
            }
          },
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    }
  }

  private startBindDevice(_account: string) {
    if (this.systemApi.isMainPage()) {
      this.systemApi.intervalEvent({
        seq: 1,
        eventPeriod: 'extLong',
        id: 'intervalBindDeice',
        handler: handler => {
          if (handler.seq > 0 && handler.seq % 3 === 0) {
            this.systemApi.getCurrentUser(_account) && this.loginApi.bindAccountDevice();
          }
        },
      });
    }
  }

  private resetCurrentNoToZero(email?: string) {
    if (email) {
      this.allAccountNoticeInfo.set(email, {
        im: 0,
        mail: 0,
        sys: 0,
        whatsApp: 0,
        facebook: 0,
      });
      this.subAccountMailUnreadCount.set(email, 0);
    }
    // user
    this.currentNo = {
      im: 0,
      mail: 0,
      sys: 0,
      whatsApp: 0,
      facebook: 0,
    };
  }

  // private getIsAccountBg() {
  //   return inWindow() ? window && window.isAccountBg : false;
  // }

  private loadUnreadNum(user?: User) {
    // accountBg不用读取该配置
    // if (this.isAccountBg) {
    //   return;
    // }
    const currentUser = this.systemApi.getCurrentUser(user?.id);
    const mainAccount = this.systemApi.getCurrentUser();
    if (currentUser) {
      this.storeApi.get(PushHandlerApiImpl.unhandledNotificationNumKey, { _account: currentUser.id }).then(res => {
        if (res && res.suc && res.data) {
          const data = JSON.parse(res.data) as NotificationNum;
          this.allAccountNoticeInfo.set(currentUser.id, data);
          if (mainAccount?.id !== currentUser.id) {
            this.subAccountMailUnreadCount.set(currentUser.id, data?.mail);
          }
        } else {
          this.resetCurrentNoToZero(currentUser.id);
          this.currentNo = {
            im: 0,
            mail: 0,
            sys: 0,
            whatsApp: 0,
            facebook: 0,
          };
        }
        this.pushNumChange(undefined, currentUser.id);
      });
    } else {
      this.resetCurrentNoToZero();
      this.currentNo = {
        im: 0,
        mail: 0,
        sys: 0,
        whatsApp: 0,
        facebook: 0,
      };
      this.pushNumChange();
    }
    console.log('[push] $$$ load unreadnum:', [...this.allAccountNoticeInfo.entries()]);
  }

  init(): string {
    return this.name;
  }

  afterInit() {
    setTimeout(() => {
      this.updateIsEnableIMNotification();
    }, 100);
    return this.name;
  }

  private updateSubAccountNoticeInfo() {
    const accountList = this.storeApi.getSubAccountList();

    accountList.forEach(item => {
      this.registerPush({ id: item.email } as User);
      this.loadUnreadNum({ id: item.email } as User);
    });
  }

  private _handleSubAccountExpired(ev: SystemEvent) {
    if (ev && ev.eventData) {
      const { eventData } = ev;
      const { subAccount } = eventData;
      if (this.subAccountMailUnreadCount.has(subAccount)) {
        this.subAccountMailUnreadCount.delete(subAccount);
      }
      if (this.allAccountNoticeInfo.has(subAccount)) {
        this.allAccountNoticeInfo.delete(subAccount);
      }
      this.pushNumChange('mail', subAccount);
    }
  }

  afterLoadFinish(): string {
    if (inWindow()) {
      // this.systemApi.intervalEvent({
      //   eventPeriod: 'extLong',
      //   handler: ob => {
      //     if (ob.seq > 1) {
      //       this.updateIsEnableIMNotification();
      //     }
      //   },
      //   id: 'push-updateIsEnableIMNotification',
      //   seq: 0,
      // });
      if (PushHandlerApiImpl.inited) {
        return this.name;
      }
      this.updateIsEnableIMNotification();

      this.httpApi.addConfig({
        matcher: /\/qiyepush\/open\/subscribe/i,
        requestAutoReLogin(data: ApiResponse<ResponseData>): boolean {
          return data.status === 403 || (!!data.data && !!data.data.code && (String(data.data.code) === '403' || String(data.data.code) === '401'));
        },
        reLoginUrlHandler: conf => conf,
      });

      PushHandlerApiImpl.inited = true;
      const currentUser = this.systemApi.getCurrentUser();
      if (currentUser) {
        this.startBindDevice(currentUser.id);
        this.registerPush(currentUser);
        this.loadUnreadNum();
        this.updateSubAccountNoticeInfo();
      }

      // 主窗口订阅
      // if (this.systemApi.isMainWindow() || this.systemApi.isMainPage()) {
      //   this.eventApi.registerSysEventObserver('syncSubAccountUnreadCount', { func: this.registerSubAccountUnreadCount.bind(this) });
      // }

      const isMainPage = this.systemApi.isMainPage();
      if (isMainPage || process.env.BUILD_ISWEB) {
        this.eventApi.registerSysEventObserver('SubAccountDeleted', {
          name: 'SubAccountDeleted-PushImpl',
          func: this._handleSubAccountExpired,
        });
        this.eventApi.registerSysEventObserver('SubAccountLoginExpired', {
          name: 'SubAccountLoginExpired-PushImpl',
          func: this._handleSubAccountExpired,
        });
        this.eventApi.registerSysEventObserver('SubAccountAdded', {
          name: 'SubAccountAdded-PushImpl',
          func: ev => {
            if (ev && ev.eventData) {
              const { eventData } = ev;
              const { subAccount } = eventData;
              this.registerPush({ id: subAccount } as User);
              this.loadUnreadNum({ id: subAccount } as User);
              this.pushNumChange('mail', subAccount);
            }
          },
        });
      }
    }
    return this.name;
  }
}

const pushApi: Api = new PushHandlerApiImpl();

api.registerLogicalApi(pushApi);

export default pushApi;
