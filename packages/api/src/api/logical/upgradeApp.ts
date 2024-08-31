import { Api, commonMessageReturn } from '../_base/api';

export interface UpgradeCheckConfig {
  forcePopup?: boolean;
  isMac?: boolean;
  version?: string;
  isFirstRun?: boolean;
  isRetry?: boolean;
}

export interface UpgradeCheckReq {
  appName: string;
  platform: string;
  version: string;
  elctronVersion: string;
  electronProjectVersion: string;
  arch: string;
}

export interface UpgradeCheckRes {
  descriptionList: any[];
  forceUpdate: boolean;
  needUpdate: boolean;
  popup: boolean;
  title: string;
  downloadUrl: string;
  fileMd5?: string;
  YMLFileUrl: string;
  electonVersion: string;
  electronProjectVersion: string;
  autoUpdate?: boolean;
}

export interface UpgradeDownloadReq {
  downloadUrl: string;
  fileName: string;
}

export interface UpgradeDownloadRes {
  filePath: string;
  fileName: string;
  totalBytes: number;
  md5?: string;
  success: boolean;
}

export interface UpgradeInstallInfo {
  filePath: string;
  localMd5?: string;
  serverMd5?: string;
}

export interface UpgradeInfo {
  filePath: string;
  fileName: string;
  totalSize?: number;
  md5?: string;
  recSize?: number;
  success: boolean;
}

export interface InstallAppParams extends UpgradeInfo {
  title: string;
  description: any[];
  force: boolean;
  forcePopup: boolean;
}

export type IgnoreUpdateReasonType = 'NO_APPLICATIONS_FOLDER' | 'NO_SIGNED_PACKAGE' | 'MSI_BUILD';
export interface AppDescParmas {
  title: string;
  description: any[];
  force: boolean;
  forcePopup?: boolean;
  YMLFileUrl?: string;
  hasAdimUserGroup?: boolean;
  isLaterUpdate?: boolean;
  popup?: boolean;
  ignoreUpdate?: boolean;
  ignoreReason?: IgnoreUpdateReasonType;
}

export interface IgnoreUpdateInfoType {
  ignoreUpdate?: boolean;
  ignoreReason?: IgnoreUpdateReasonType;
}

export interface UpgradeAppApi extends Api {
  doUpdateCheck: (config?: UpgradeCheckConfig) => void;
  showNewVersionAppDescDialog: (updateInfo: AppDescParmas) => void;
  checkAndDownLoadByYMLFile: (YMLFileUrl?: string) => Promise<{ success: boolean; errorType?: string; errMsg?: string } | undefined>;
  writeAppReloadUpdateInfo(): string;
  writeAppPendingUpdateInfo(upgradeInfo?: AppDescParmas): string;
  getPendingUpdateInfo(): AppDescParmas | undefined;
  deletePendingUpdateInfo: () => Promise<commonMessageReturn>;
  getTime: () => string | null;
  getShouldIgnoreUpdateInfo(): Promise<IgnoreUpdateInfoType>;
}
