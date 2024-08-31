/* eslint-disable max-statements */
import { config as confFunc } from 'env_def';
import { apis, inWindow } from '@/config';
import { api } from '@/api/api';
import { IntervalEventParams, SystemApi } from '@/api/system/system';
import { Api, PopUpMessageInfo } from '@/api/_base/api';
import { DataTransApi } from '@/api/data/http';
import { UpgradeAppApi, UpgradeCheckConfig, UpgradeCheckReq, UpgradeCheckRes, AppDescParmas } from '@/api/logical/upgradeApp';
import { DataStoreApi } from '@/api/data/store';
import { EventApi } from '@/api/data/event';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { getTime, updateTime } from './upgrade_time_util';
import { getOs } from './../../../utils/confOs';
import { getIn18Text } from '@/api/utils';

const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;
const APP_RELOAD_UPDATE_INFO = 'APP_RELOAD_UPDATE_INFO';
const APP_PENDING_UPDATE_INFO = 'APP_PENDING_UPDATE_INFO';
const GLOBAL_STORE_CONFIG = { noneUserRelated: true };
const DOWNLOAD_APPS_KEY = 'download_apps_key';
const CHECK_UPDATE_TIME_SPAN = 1000 * 60 * 60 * 4;
const appName = process.env.BUILD_ISEDM ? 'lingxibanggong-waimao' : 'lingxibangong';

class UpgradeAppApiImp implements UpgradeAppApi {
  name: string;

  static readonly RndSyncRate = Math.floor(6 * Math.random());

  private systemApi: SystemApi;

  private http: DataTransApi;

  private store: DataStoreApi;

  private eventApi: EventApi;

  dataTrackApi: DataTrackerApi;

  public getTime: typeof getTime;

  udpateErrorTimes = 0;

  updateErrorTimesLimit = 5;

  updateErrorLastDateTime = 0;

  lastCheckUpateTime = 0;

  isMac = true;

  version = '1.0.0';

  isDownloading = false;

  isUserHasAdminGroup = true;

  isWin = false;

  downloadedAppPath = '';

  YMLCheckCacheMap: { [key: string]: boolean } = {};

  private upgradeAppCheckHandle: IntervalEventParams = {
    eventPeriod: 'long',
    handler: async () => {
      try {
        // this.lastCheckUpateTime为0，不检查
        if (!this.lastCheckUpateTime) {
          return;
        }
        // 下载中，不再次检查
        if (this.isDownloading) {
          return;
        }
        // 时间少于检查间隔时间
        const nowTs = new Date().getTime();
        if (nowTs - this.lastCheckUpateTime < CHECK_UPDATE_TIME_SPAN) {
          return;
        }
        // 检查更新
        this.doUpdateCheck();
      } catch (ex) {
        console.error('checkUpgradeAppTimeSpanHandle error', ex);
      }
    },
    id: 'upgradeAppCheck',
    seq: 0,
  };

  constructor() {
    this.name = apis.upgradeAppApiImpl;
    this.systemApi = api.getSystemApi();
    this.store = api.getDataStoreApi();
    this.http = api.getDataTransApi();
    this.eventApi = api.getEventApi();
    this.dataTrackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.getTime = getTime;
  }

  async checkAndDownLoadByYMLFile(YMLFileUrl?: string) {
    if (!YMLFileUrl || !window || !window.electronLib) {
      return {
        success: true,
        errorType: 'GET_YML_ERROR',
      };
    }
    if (this.YMLCheckCacheMap[YMLFileUrl]) {
      return {
        success: true,
      };
    }
    const res = await this.checkUpdateByYMLFile(YMLFileUrl);
    if (res && res.success && res.hasUpdate) {
      const downloadRes = await this.downloadAppOfNewVersion();
      if (downloadRes && downloadRes.success) {
        this.YMLCheckCacheMap[YMLFileUrl] = true;
        return {
          success: true,
        };
      }
      return {
        success: true,
        errorType: 'DOWNLOAD_ERROR',
        errMsg: downloadRes?.err as string,
      };
    }
    return {
      success: true,
      errorType: 'CHECK_YML_ERROR',
      errMsg: res?.err as string,
    };
  }

  async checkUpdateByYMLFile(YMLFileUrl: string) {
    if (window && window.electronLib) {
      try {
        const { electronLib } = window;
        await electronLib.appManage.setUpdateFeedURL({ url: YMLFileUrl });
        const checkResultInfo = await electronLib.appManage.checkForUpdates();
        let hasUpdate = false;
        if (checkResultInfo) {
          const { updateInfo } = checkResultInfo;
          const updateVersion = updateInfo && updateInfo.version ? updateInfo.version : '';
          const currentVersion = electronLib.env.version;
          if (updateVersion !== currentVersion) {
            hasUpdate = true;
          }
        }
        return {
          success: true,
          hasUpdate,
        };
      } catch (ex: any) {
        return {
          success: false,
          hasUpdate: false,
          err: ex ? ex.message : '',
        };
      }
    }
    return null;
  }

  private async downloadAppOfNewVersion() {
    if (process.env.BUILD_ISELECTRON) {
      try {
        const res = await window.electronLib.appManage.downloadUpdate();
        return {
          success: true,
          localFiles: res as Array<string>,
        };
      } catch (ex: any) {
        return {
          success: false,
          err: ex ? ex.message : '',
        };
      }
    }
    return null;
  }

  private checkUpdateErrorTimes() {
    // 一天前失败，重置失败次数和最后失败时间
    if (this.udpateErrorTimes && this.updateErrorLastDateTime + MS_IN_ONE_DAY < new Date().getTime()) {
      this.resetUpdateErrorTime();
    }
    // 失败次数过多，不再重试
    if (this.udpateErrorTimes > this.updateErrorTimesLimit) {
      return false;
    }

    return true;
  }

  private resetUpdateErrorTime() {
    this.udpateErrorTimes = 0;
    this.updateErrorLastDateTime = 0;
  }

  private addUpdateErrorTime() {
    this.udpateErrorTimes++;
    this.updateErrorLastDateTime = new Date().getTime();
  }

  private async deleteOutdatedDownloadApp() {
    if (process.env.BUILD_ISELECTRON) {
      try {
        const { electronLib } = window;
        const oldDownloadPath = electronLib.env.userDataPath + '/upgrade';
        if (electronLib.fsManage.isExist(oldDownloadPath)) {
          electronLib.fsManage.remove(oldDownloadPath);
        }
        const downloadedAppStoreInfo = await this.store.get(DOWNLOAD_APPS_KEY, GLOBAL_STORE_CONFIG);
        if (downloadedAppStoreInfo.suc && downloadedAppStoreInfo.data) {
          const downloadedAppInfo = JSON.parse(downloadedAppStoreInfo.data);
          const currentVersion = window.electronLib.env.version;
          Object.keys(downloadedAppInfo).forEach(versionKey => {
            const filePath = downloadedAppInfo[versionKey];
            if (versionKey !== currentVersion) {
              // 非当前版本使用的更新包，可以删除
              window.electronLib.fsManage.remove(filePath);
            } else {
              this.downloadedAppPath = filePath;
            }
          });
        }
      } catch (ex) {
        console.error('deleteDownloadApp error', ex);
      }
    }
  }

  private async writeDownloadedAppPathInfo(appFilePath: string) {
    try {
      if (window.electronLib) {
        const { version } = window.electronLib.env;
        await this.store.put(
          DOWNLOAD_APPS_KEY,
          JSON.stringify({
            [version]: appFilePath,
          }),
          GLOBAL_STORE_CONFIG
        );
      }
    } catch (ex) {
      console.error('writeDownloadedAppPathInfo error', ex);
    }
  }

  private async getIsSignedPackage() {
    if (!process.env.BUILD_ISELECTRON) {
      return true;
    }
    if (!this.isMac) {
      return true;
    }
    // @todo liuhao 暂时先使用profile判断
    const profile = confFunc('profile') as string;
    if (profile) {
      const isTestProd = profile.includes('test_prod');
      if (isTestProd) {
        return false;
      }
    }
    return true;
  }

  async getCurrentArch() {
    const { process } = window;
    if (this.isMac) {
      const isRunningUnderRosetta = await window.electronLib.appManage.getIsRunningUnderRosetta();
      if (isRunningUnderRosetta) {
        return 'arm64';
      }
      return process.arch;
    }
    return process.arch;
  }

  async getShouldIgnoreUpdateInfo() {
    try {
      const isInApplicationFolder = await this.getIsInApplicationFolder();
      const isSignedPackage = await this.getIsSignedPackage();
      const { isMsiBuild } = this.systemApi;
      if (!isInApplicationFolder || !isSignedPackage || isMsiBuild) {
        const ignoreReason: 'NO_APPLICATIONS_FOLDER' | 'NO_SIGNED_PACKAGE' | 'MSI_BUILD' | undefined = !isInApplicationFolder
          ? 'NO_APPLICATIONS_FOLDER'
          : !isSignedPackage
          ? 'NO_SIGNED_PACKAGE'
          : isMsiBuild
          ? 'MSI_BUILD'
          : undefined;
        return {
          ignoreUpdate: true,
          ignoreReason,
        };
      }
      return {
        ignoreUpdate: false,
      };
    } catch (ex) {
      return {
        ignoreUpdate: false,
      };
    }
  }

  async doUpdateCheck(config?: UpgradeCheckConfig) {
    console.warn('[upgrade] doUpdateCheck');
    this.lastCheckUpateTime = new Date().getTime();
    const { env } = window.electronLib;
    const { isMac = env.isMac, forcePopup = false, version = env.version, isFirstRun } = config || {};
    this.isMac = isMac;
    const forceUpdateParam = forcePopup;
    const checkErrorTimeResult = this.checkUpdateErrorTimes();
    if (!forceUpdateParam && !checkErrorTimeResult) {
      return;
    }
    const NO_NEW_VERSION_TIP = getIn18Text('YIJINGSHI');
    const { process } = window;
    if (!process) {
      if (forcePopup) {
        this.sendPopupMessage(NO_NEW_VERSION_TIP);
      }
      return;
    }

    const archStr = await this.getCurrentArch();

    const checkRes = await this.check({
      appName,
      platform: getOs() as string,
      version,
      elctronVersion: process?.versions?.electron as string,
      electronProjectVersion: '',
      arch: archStr || 'x64',
    });

    this.dataTrackApi.track('pc_upgrade_check');
    // 接口返回失败，直接提示已经是最新版本即可
    if (!checkRes) {
      if (forcePopup) {
        this.sendPopupMessage(NO_NEW_VERSION_TIP);
      } else {
        const isRetry = config && config.isRetry ? true : false;
        if (!isRetry) {
          setTimeout(() => {
            this.doUpdateCheck({ ...(config || {}), isRetry: true });
          }, 30000);
        }
      }
      return;
    }
    const { title, descriptionList, needUpdate, forceUpdate, YMLFileUrl, popup } = checkRes;
    // 已有更新，不再次检查
    const pendingUpdateInfo = this.getPendingUpdateInfo();
    if (YMLFileUrl) {
      if (pendingUpdateInfo?.YMLFileUrl === YMLFileUrl) {
        this.dataTrackApi.track('pc_upgrade_local_exist_file');
        if (isFirstRun) {
          const shouldShowPopup = this.getShoudlShowPopup(pendingUpdateInfo);
          if (shouldShowPopup) {
            this.showNewVersionAppDescDialog(pendingUpdateInfo);
          }
          this.setVisibleUpdateAppIcon(true);
        } else if (forcePopup) {
          this.dataTrackApi.track('pc_upgrade_local_exist_file_forcePopup');
          this.showNewVersionAppDescDialog(pendingUpdateInfo);
        }
        return;
      }
    } else {
      this.deletePendingUpdateInfo();
    }
    if (typeof checkRes.autoUpdate !== 'undefined') {
      if (!forcePopup && checkRes.autoUpdate === false) {
        return;
      }
    }
    if (needUpdate || forceUpdate) {
      this.dataTrackApi.track('pc_upgrade_needUpdate');
      const ignoreUpdateInfo = await this.getShouldIgnoreUpdateInfo();
      if (ignoreUpdateInfo && ignoreUpdateInfo.ignoreUpdate) {
        this.dataTrackApi.track('pc_upgrade_needUpdate_ignoreUpdate');
        const updataInfo = {
          title,
          description: descriptionList,
          force: forceUpdate,
          forcePopup,
          YMLFileUrl,
          hasAdimUserGroup: true,
          popup,
          ignoreUpdate: true,
          ignoreReason: ignoreUpdateInfo.ignoreReason,
        } as AppDescParmas;
        if (popup || forcePopup) {
          this.showNewVersionAppDescDialog(updataInfo);
        }
        this.writeAppPendingUpdateInfo(updataInfo);
        this.setVisibleUpdateAppIcon(true);
        return;
      }
      // 没有YMLFileUrl
      if (!YMLFileUrl) {
        this.dataTrackApi.track('pc_upgrade_needUpdate_noFileUrl');
        if (forcePopup) {
          this.sendPopupMessage(NO_NEW_VERSION_TIP);
        }
        return;
      }
      const { electronLib } = window;
      // 是否之前下载成功过，下载成功过，不弹出该框
      const DOWNLOAD_APP_TIP = getIn18Text('YOUXINBANBEN，ZHENGZAI');
      if (forcePopup && !this.isDownloading && this.downloadedAppPath && !electronLib.fsManage.isExist(this.downloadedAppPath)) {
        this.sendPopupMessage(DOWNLOAD_APP_TIP);
      }
      if (forcePopup) {
        this.sendPopupMessage(DOWNLOAD_APP_TIP);
        if (this.isDownloading) {
          return;
        }
      }
      // 通过YML文件来检查更新
      this.dataTrackApi.track('pc_upgrade_checkFileUrl');
      const updateInfo = await this.checkUpdateByYMLFile(YMLFileUrl);
      const RETRY_DELAY = 10000;
      if (!updateInfo) return;
      // 检查更新未成功
      if (!updateInfo.success) {
        this.dataTrackApi.track('pc_upgrade_checkFileUrl_fail');
        if (forcePopup) {
          this.sendPopupMessage(getIn18Text('JIANCHABANBENXINXICHU'));
        } else {
          this.addUpdateErrorTime();
          setTimeout(() => {
            this.doUpdateCheck();
          }, RETRY_DELAY);
        }
        return;
      }

      if (updateInfo.hasUpdate) {
        this.dataTrackApi.track('pc_upgrade_checkFileUrl_success');
        this.isDownloading = true;
        this.setVisibleUpdateAppIcon(false);
        const downLoadResult = await this.downloadAppOfNewVersion();

        this.isDownloading = false;
        if (!downLoadResult) return;

        if (downLoadResult.success) {
          this.dataTrackApi.track('pc_upgrade_download_success');
          this.YMLCheckCacheMap[YMLFileUrl] = true;
          const downloadedFiles = downLoadResult.localFiles;
          const upgradeInfo: AppDescParmas = {
            title,
            description: descriptionList,
            force: forceUpdate,
            forcePopup,
            YMLFileUrl,
            hasAdimUserGroup: this.isUserHasAdminGroup,
            popup,
          };
          if (downloadedFiles && downloadedFiles.length) {
            const appFilePath = downloadedFiles[0];
            this.writeDownloadedAppPathInfo(appFilePath);
            this.downloadedAppPath = appFilePath;
            this.writeAppPendingUpdateInfo(upgradeInfo);
            this.setVisibleUpdateAppIcon(true);
          }

          this.resetUpdateErrorTime();
          if (popup || forcePopup) {
            this.showNewVersionAppDescDialog(upgradeInfo);
          }
        } else {
          this.dataTrackApi.track('pc_upgrade_download_fail');
          if (forcePopup) {
            this.sendPopupMessage(getIn18Text('XIAZAICHUCUO，QINGSHAO'));
          } else {
            this.addUpdateErrorTime();
            setTimeout(() => {
              this.doUpdateCheck();
            }, RETRY_DELAY);
          }
        }
      } else {
        this.resetUpdateErrorTime();
        if (forcePopup) {
          this.sendPopupMessage(NO_NEW_VERSION_TIP);
        }
      }
    } else {
      this.resetUpdateErrorTime();
      if (forcePopup) {
        this.sendPopupMessage(NO_NEW_VERSION_TIP);
      }
    }
  }

  showSuccessToast(message: string) {
    this.eventApi.sendSysEvent({
      eventName: 'error',
      eventLevel: 'error',
      eventStrData: '',
      eventData: {
        title: message,
        popupType: 'toast',
        popupLevel: 'success',
        code: '',
      },
      eventSeq: 0,
    });
  }

  sendPopupMessage(message: string, type: 'toast' | 'window' = 'toast') {
    const eventData: PopUpMessageInfo = {
      title: message,
      popupType: type,
      popupLevel: 'info',
      code: '',
    };
    this.eventApi.sendSysEvent({
      eventName: 'error',
      eventLevel: 'error',
      eventStrData: '',
      eventData,
      eventSeq: 0,
    });
  }

  private getShoudlShowPopup(upgradeInfo: AppDescParmas): boolean {
    if (!upgradeInfo) {
      return false;
    }
    if (typeof upgradeInfo.popup === 'undefined') {
      return true;
    }
    return upgradeInfo.popup as boolean;
  }

  showNewVersionAppDescDialog(upgradeInfo: AppDescParmas) {
    // 展示应用升级弹框
    this.eventApi.sendSysEvent({
      eventName: 'upgradeApp',
      eventStrData: '',
      eventData: upgradeInfo,
      eventSeq: 0,
    });
  }

  setVisibleUpdateAppIcon(visible: boolean) {
    this.eventApi.sendSysEvent({
      eventName: 'shouldUpdateAppChanged',
      eventData: !!visible,
    });
  }

  private trackUpgradeApiError(msg: string) {
    this.dataTrackApi.track('pc_upgrade_api_error', { msg: msg });
  }

  private async check(config: UpgradeCheckReq): Promise<UpgradeCheckRes | undefined> {
    try {
      const url = this.systemApi.getUrl('newUpgradeApp');
      const { data } = await this.http.get<UpgradeCheckRes>(url, config);
      if (data?.success) {
        return data?.data;
      }
      return undefined;
    } catch (ex: any) {
      setTimeout(() => {
        const errorMsg = ex && ex.message ? ex.message : (typeof ex === 'string' ? ex : '') || '';
        this.trackUpgradeApiError(errorMsg);
      }, 0);
      return undefined;
    }
  }

  init(): string {
    return this.name;
  }

  getPendingUpdateInfo() {
    if (!window || !window.electronLib) {
      return undefined;
    }
    try {
      const result = this.store.getSync(APP_PENDING_UPDATE_INFO, GLOBAL_STORE_CONFIG);
      if (result.suc && result.data) {
        const pengingInfo = JSON.parse(result.data) as AppDescParmas;
        return pengingInfo;
      }
      return undefined;
    } catch (ex) {
      console.error(ex);
      return undefined;
    }
  }

  deletePendingUpdateInfo() {
    return this.store.del(APP_PENDING_UPDATE_INFO, GLOBAL_STORE_CONFIG);
  }

  async checkUpdateAppFirstRun() {
    if (!process.env.BUILD_ISELECTRON) return;
    const updateInfo = await this.store.get(APP_RELOAD_UPDATE_INFO, GLOBAL_STORE_CONFIG);
    if (updateInfo && updateInfo.suc && updateInfo.data) {
      try {
        const dataObj = JSON.parse(updateInfo.data);
        const { prevVersion } = dataObj;
        const currentVersion = window.electronLib.env.version;
        if (prevVersion !== currentVersion) {
          // 延迟提示
          setTimeout(() => {
            this.showSuccessToast(getIn18Text('KEHUDUANYISHENGJIZHI') + currentVersion);
          }, 2500);
        } else {
          // @todo 处理更新失败情况
        }
        // 删除该提示
      } catch (ex) {
        console.error('checkUpdateAppFirstRun', ex);
      } finally {
        await this.store.del(APP_RELOAD_UPDATE_INFO, GLOBAL_STORE_CONFIG);
      }
    }
  }

  async initUpdateCheck() {
    this.doUpdateCheck({ isFirstRun: true }).then();
    this.systemApi.intervalEvent(this.upgradeAppCheckHandle);
  }

  writeAppReloadUpdateInfo() {
    // 主动更新的提示信息
    return this.store.putSync(
      APP_RELOAD_UPDATE_INFO,
      JSON.stringify({
        prevVersion: window.electronLib.env.version,
      }),
      GLOBAL_STORE_CONFIG
    );
  }

  writeAppPendingUpdateInfo(upgradeInfo?: AppDescParmas) {
    return this.store.putSync(APP_PENDING_UPDATE_INFO, upgradeInfo ? JSON.stringify(upgradeInfo) : '', GLOBAL_STORE_CONFIG);
  }

  private async getIsInApplicationFolder(): Promise<boolean> {
    if (!process.env.BUILD_ISELECTRON) {
      return true;
    }
    if (this.isMac) {
      const isInApplicationsFolder = await window.electronLib.appManage.getIsInApplicationFolder();
      return isInApplicationsFolder;
    }
    return true;
  }

  afterLoadFinish() {
    if (inWindow()) {
      if (!this.systemApi.isMainPage()) {
        return this.name;
      }
      updateTime();
      if (process.env.BUILD_ISELECTRON) {
        if (!this.systemApi.isMsiBuild) {
          this.checkUpdateAppFirstRun();
        }
        this.deleteOutdatedDownloadApp().then(() => {
          this.isWin = !window.electronLib.env.isMac;
          if (this.isWin) {
            // msi的包不自动更新
            if (this.systemApi.isMsiBuild) {
              return;
            }
            // windows需要获取是否有管理员权限
            window.electronLib.appManage
              .getWinUserHasAdminUserGroup()
              .then(res => {
                this.isUserHasAdminGroup = res.hasAdimUserGroup;
                if (this.isUserHasAdminGroup) {
                  this.initUpdateCheck();
                } else {
                  window.electronLib.appManage.setAutoInstallOnAppQuit(false);
                }
              })
              .catch((err: any) => {
                console.error('getWinUserHasAdminUserGroup error', err);
                this.initUpdateCheck();
              });
          } else {
            this.initUpdateCheck();
          }
        });
      }
    }
    return this.name;
  }
}

const upgradeAppApiImp: Api = new UpgradeAppApiImp();
api.registerLogicalApi(upgradeAppApiImp);
export default upgradeAppApiImp;
