import fse from 'fs-extra';
import nodeCrypto from 'crypto';
import { DownloadItem, ipcMain, WebContents } from 'electron';
import { ErrMap, FsDownloadConfig, FsDownloadRes, RequestManage } from '../declare/FsManage';
import {
  DownloadManage,
  DownloadManageHandleType,
  DownloadManageType,
  ElectronDownload,
  ElectronDownloadCallback,
  IDownloadFile,
  INewDownloadFile,
} from '../declare/downloadManage';
import { IpcRendererRes } from '../declare/IpcChannelManage';
import { AbstractManager } from './abstractManager';
import { storeManage } from './storeManage';

class DownloadManageImpl extends AbstractManager implements DownloadManage, ElectronDownload {
  errMap: ErrMap = {
    ECONNRESET: '文件下载取消',
    ETIMEDOUT: '文件下载超时',
    SAVEERROR: '文件保存错误',
    UNKNOW: '文件下载错误',
  };

  // 同个url 同时请求多次句柄管理
  requestManage: RequestManage = {};

  newDownloadItem: INewDownloadFile | null = null;

  downloadItemData: Map<string, IDownloadFile> = new Map();

  // will-download 回调集合
  downloadListeners: Map<string, ElectronDownloadCallback> = new Map();

  private tag = 'download [DownloadItem]';

  constructor() {
    super();
    this.listenerDownload = this.listenerDownload.bind(this);
  }

  async updateDownloadItem(id: string, item: DownloadItem, itemData: IDownloadFile) {
    if (item.isPaused()) {
      console.warn(this.tag, 'Download is paused', itemData.url);
      itemData.paused = item.isPaused();
      return;
    }
    const newReceivedBytes = item.getReceivedBytes();
    const totalBytes = itemData.totalBytes;
    const downloadInfo = (await this.get('download', 'inprogress')) || {};
    // downloadItem.getTotalBytes() 获取可能为unknown size 即为0
    if (totalBytes > 0) {
      itemData.progress = newReceivedBytes / totalBytes;
    }
    itemData.receivedBytes = newReceivedBytes;
    downloadInfo[id] = { totalBytes, progress: itemData.progress, receivedBytes: newReceivedBytes };
    await storeManage.set('download', 'inprogress', downloadInfo);
  }

  async addDownloadItem(event: Event, item: DownloadItem, webContents: WebContents, originUrl: string): Promise<IDownloadFile> {
    const fileUrl = originUrl;
    console.warn(this.tag, 'addDownloadItem', fileUrl);
    const downloadItemData: IDownloadFile = {
      url: fileUrl,
      state: item.getState(),
      startTime: Date.now(),
      progress: 0,
      totalBytes: item.getTotalBytes(),
      receivedBytes: 1,
      paused: false,
      _sourceItem: item,
    };

    // 判断下载项是否存在，存在先取消、移除，再添加
    if (this.downloadItemData.has(fileUrl)) {
      this.writeLog('download-progress-repeat', { fileUrl });
      const repeatDownloadItem = this.downloadItemData.get(fileUrl);
      if (repeatDownloadItem?._sourceItem?.getState() === 'progressing') {
        repeatDownloadItem?._sourceItem?.cancel();
      }
      console.warn(this.tag, 'file url already exists:', fileUrl);
    }
    this.downloadItemData.set(fileUrl, downloadItemData);
    return downloadItemData;
  }

  async downloadAbort(url: string) {
    if (this.requestManage[url]?.request) {
      const { request } = this.requestManage[url];
      this.writeLog('download-abort', {
        ...this.downloadItemData.get(url),
      });
      request?.cancel();
    }
    this.clear(url);
  }

  isExist(path: string): boolean {
    return fse.pathExistsSync(path);
  }

  removeFile(filePath: string) {
    try {
      fse.remove(filePath, error => {
        if (error) {
          this.writeLog('fsManage-removeFile-error', { err: error.message, filePath });
          console.error('[fsManage removeFile error]', error);
        } else {
          console.log('[fsManage removeFile success]', error);
        }
      });
    } catch (e) {
      console.warn(this.tag, e);
    }
  }

  async clear(url: string) {
    try {
      if (!this.requestManage[url]) {
        this.writeLog('download-clear-error', { err: 'can not find url in requestManage', url }).then();
        return;
      }
      const { tempFilePath, request } = this.requestManage[url];
      console.log('[download-clean] ', tempFilePath);
      if (tempFilePath) {
        this.removeFile(tempFilePath);
      }
      if (request) {
        const donwloadUrl = request.getURLChain()[0];
        this.downloadListeners.delete(donwloadUrl);
        this.downloadItemData.delete(donwloadUrl);
      }
      delete this.requestManage[url];

      const downloadInfo = (await this.get('download', 'inprogress')) || {};
      if (downloadInfo[url]) {
        console.warn(this.tag, 'download item storeManage delete key', url);
        delete downloadInfo[url];
        await storeManage.set('download', 'inprogress', downloadInfo);
      }
      this.downloadListeners.delete(url);
      this.downloadItemData.delete(url);
    } catch (error) {
      console.warn(this.tag, 'download clear error has occurred ', url);
      this.writeLog('download-clear-error', { err: error, url }).then();
    }
  }

  private genTempPath(filePath: string): string {
    return filePath + '_lx_temp_' + (Date.now() % 100000) + Math.random().toFixed(3);
  }

  async download(config: FsDownloadConfig): Promise<FsDownloadRes> {
    console.log('download inside', config);
    const handleResolve = (resolve: (value: PromiseLike<FsDownloadRes> | FsDownloadRes) => void, ret: FsDownloadRes) => {
      const item = this.requestManage[config.url];
      this.clear(config.url);
      resolve(ret);
      if (item && item.queueReq && item.queueReq.length > 0) {
        item.queueReq.forEach((it: any) => {
          it(ret);
        });
      }
    };
    return new Promise(resolve => {
      const { url: originUrl, realUrl = '', fileName, filePath: originFilePath, dirPath, downloadUrl = '' } = config;
      if (this.requestManage[downloadUrl]) {
        const item = this.requestManage[downloadUrl];
        item.queueReq = item.queueReq || [];
        item.queueReq.push(resolve);
        return;
      }
      const filePath = this.getFilePath(fileName, originFilePath, dirPath);
      const tempFilePath = this.genTempPath(filePath);
      let receivedBytes = 0; // 已经下载的字节数
      const md5sum = nodeCrypto.createHash('md5'); // 文件md5
      const url = downloadUrl;
      const url1 = new URL(originUrl);
      this.getCookie(url1.host, config.sessionName).then(cookie => {
        this.writeLog('download-before-start', {
          originFilePath,
          cookie,
          url: originUrl,
          filePath,
          tempFilePath,
          fileName,
          // url: config.url,
          realUrl,
          path: config.filePath,
          dirPath: config.dirPath,
          name: config.fileName,
          start: config.start,
          channel: config.channel,
        }).then();
      });
      // const self = this;
      const onDownloadCallback: ElectronDownloadCallback = (item: DownloadItem, downloadItemData: IDownloadFile) => {
        console.warn(this.tag, 'ElectronDownloadCallback', item);
        const _url = downloadItemData.url;
        if (url !== _url) {
          console.warn(this.tag, 'will-download 回调命中错误', url, _url);
          this.writeLog('download-url-error', { error: 'will-download 回调命中错误', url, _url }).then();
          return;
        }
        let fallbackSavePath = tempFilePath;
        // 存在多个同URL请求，将当前下载取消， 移除临时文件，重新下载
        if (this.requestManage[originUrl]) {
          const requestItem = this.requestManage[originUrl];
          if (requestItem.request?.getState() === 'progressing') {
            requestItem.request?.cancel();
          }
          this.removeFile(requestItem.tempFilePath);
          fallbackSavePath = this.genTempPath(filePath);
        }
        if (!this.isExist(fallbackSavePath)) {
          this.writeLog('download-path-error', { error: 'save path can not be found', path: fallbackSavePath, url }).then();
        }

        item.setSavePath(fallbackSavePath);
        this.requestManage[originUrl] = { request: item, tempFilePath: fallbackSavePath };
        md5sum.update(url);
        // 更新下载
        item.on('updated', async (e, state) => {
          // TODO 获取item data chunk
          // md5sum.update(e.data);
          if (state === 'interrupted') {
            console.warn(this.tag, 'Download is interrupted but can be resumed', e);
            const ret = {
              filePath,
              fileName,
              totalBytes: receivedBytes,
              success: false,
              message: 'interrupted',
            };
            handleResolve(resolve, ret);
          } else if (state === 'progressing') {
            // todo
            this.updateDownloadItem(_url, item, downloadItemData);
            receivedBytes = downloadItemData.receivedBytes;
          }
        });

        // 下载完成
        item.once('done', async (e, state) => {
          console.warn(this.tag, 'download item done status', state);
          if (state !== 'cancelled') {
            console.warn(this.tag, 'download item done status cancelled');
          }
          let ret;
          // 下载成功 && process.platform === 'darwin'
          if (state === 'completed') {
            // app.dock.downloadFinished(downloadItem.path);
            const md5 = md5sum.digest('hex').toUpperCase();
            fse.move(tempFilePath, filePath, { overwrite: true }, err => {
              if (err) {
                console.warn(this.tag, 'downloadManage fse.move error:', err);
                ret = {
                  filePath,
                  fileName,
                  totalBytes: receivedBytes,
                  success: false,
                  message: '下载成功,文件覆盖失败',
                };
                this.writeLog('download-write-error', { err: err.message, ret, url }).then();
              } else {
                ret = {
                  filePath,
                  fileName,
                  totalBytes: receivedBytes,
                  md5,
                  success: true,
                };
                this.writeLog('download-success', { ret, url }).then();
              }
              handleResolve(resolve, ret);
            });
          } else {
            this.writeLog('download-net-error', {
              message: 'download-net-error: ' + state,
              url: config.url,
              totalBytes: receivedBytes,
              filePath,
              fileName,
            }).then();
            ret = {
              message: 'download-net-error: ' + state,
              filePath,
              fileName,
              totalBytes: receivedBytes,
              success: false,
            };
            handleResolve(resolve, ret);
          }
        });
      };
      // 根据下载url注册 will-download 回调
      this.downloadListeners.set(url, onDownloadCallback);
      const finalSessionName = config.sessionName || this.defaultSessionName;
      const _session = this.getSession(finalSessionName);
      if (config.sessionName && !AbstractManager.downloadSessionSet.has(finalSessionName)) {
        _session.on('will-download', this.listenerDownload);
        AbstractManager.downloadSessionSet.add(finalSessionName);
      }
      console.log('download inside session', finalSessionName);
      _session.downloadURL(url);
    });
  }

  initIpcChannel() {
    ipcMain.handle('downloadManageInvoke', async (event, functionName: DownloadManageHandleType, args) => {
      // console.log('download downloadManageInvoke', functionName, args);
      const data = await this[functionName](args as any);
      console.log('downloadManageInvoke', data);
      return { data } as IpcRendererRes;
    });
    ipcMain.on('downloadManage', (event, functionName: DownloadManageType, args) => {
      this[functionName](args);
    });
  }

  /**
   * 监听下载
   * @param event - electron 事件
   * @param item - 下载项
   * @param webContents - webContents
   */
  listenerDownload(event: Event, item: DownloadItem, webContents: WebContents): void {
    // 获取原始下载地址
    const url = item.getURLChain()[0];
    // 添加下载项
    this.addDownloadItem(event, item, webContents, url).then(downloadItem => {
      this.updateDownloadItem(url, item, downloadItem);
      console.warn(this.tag, 'downloadListeners', url, this.downloadListeners);
      if (this.downloadListeners.has(url)) {
        const callback: ElectronDownloadCallback | undefined = this.downloadListeners.get(url);
        if (callback) {
          callback(item, downloadItem);
        }
      } else {
        this.writeLog('download-listener-error', { err: 'downloadListeners are not contained url', url }).then();
        console.warn(this.tag, 'download item 未注册下载回调 url:', url);
      }
    });
  }
}

export const downloadManage = new DownloadManageImpl();
