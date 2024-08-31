import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import type { AppUpdater, UpdateInfo } from 'electron-updater';
import { fsManage } from './fsManage';
import { setIsUpdatingQuit } from './app-state';

function logToFile(msg: string) {
  try {
    fsManage.writeToLogFile({ data: `AppUpdater:` + msg });
  } catch (ex) {
    console.error(ex);
  }
}

function logErrorToFile(err: Error, errorType: string) {
  logToFile(`errorType:` + err.message + getOSEOL() + err.stack);
}

let EOL = '';
function getOSEOL(): string {
  if (EOL) return EOL;
  EOL = require('os').EOL;
  return EOL;
}

export class AppAutoUpdater {
  readonly appUpdater: AppUpdater;

  constructor() {
    this.appUpdater = autoUpdater;
    this.appUpdater.autoDownload = false;
    this.appUpdater.autoInstallOnAppQuit = true;
    this.appUpdater.allowDowngrade = true;
    this.addEvents();
  }

  setAutoInstallOnAppQuit(val: boolean) {
    this.appUpdater.autoInstallOnAppQuit = val;
  }

  setFeedUrl(url: string, channel: string = 'latest') {
    if (!url) {
      throw new Error(`url is null or empty`);
    }
    logToFile(`setFeedURL(${url})`);
    this.appUpdater.setFeedURL({
      provider: 'generic',
      url: url,
      channel: channel,
    });
  }

  getFeedUrl(): Promise<string | null | undefined> {
    logToFile(`getFeedUrl()`);
    return Promise.resolve(this.appUpdater.getFeedURL());
  }

  private onError(err: Error): void {
    logErrorToFile(err, 'onError');
  }

  private logUpdateInfo(updateInfo: UpdateInfo) {
    logToFile(`onUpdateAvailable: 
               Version:${updateInfo.version}
               releaseDate:${updateInfo.releaseDate}
               files: ${updateInfo.releaseName}`);
  }

  private onUpdateAvailable(updateInfo: UpdateInfo) {
    logToFile('onUpdateAvailable');
    this.logUpdateInfo(updateInfo);
  }

  private onUpdateNotAvailable(updateInfo: UpdateInfo) {
    logToFile('onUpdateNotAvailable');
    this.logUpdateInfo(updateInfo);
  }

  private onDownloadSuccessed(updateInfo: UpdateInfo) {
    logToFile('onDownloadSuccessed');
    this.logUpdateInfo(updateInfo);
  }

  private addEvents() {
    this.appUpdater.on('error', this.onError.bind(this));
    this.appUpdater.on('update-available', this.onUpdateAvailable.bind(this));
    this.appUpdater.on('update-not-available', this.onUpdateNotAvailable.bind(this));
    this.appUpdater.on('update-downloaded', this.onDownloadSuccessed.bind(this));
  }

  checkForUpdates(): Promise<UpdateCheckResult | null> {
    logToFile(`checkForUpdates()`);
    return this.appUpdater.checkForUpdates();
  }

  downloadUpdate(): Promise<any> {
    return this.appUpdater.downloadUpdate();
  }

  quitAndInstall() {
    logToFile(`quitAndInstall`);
    const isWin32 = process.platform === 'win32';
    let isSlient = isWin32 ? false : false;
    let isForceRunAfter = isWin32 ? true : false;
    setIsUpdatingQuit(true);
    setTimeout(() => {
      this.appUpdater.autoInstallOnAppQuit = true;
      this.appUpdater.quitAndInstall(isSlient, isForceRunAfter);
    }, 2500);
  }
}

const appUpdater = new AppAutoUpdater();

export default appUpdater;
