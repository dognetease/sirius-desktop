import AdmZip from 'adm-zip';
import fse from 'fs-extra';
import { ipcMain } from 'electron';
import path from 'path';
import { ErrMap, FsManageHandle, FsManageHandleType, FsManageType, FsZipConfig, FsZipRes, RequestManage } from '../declare/FsManage';
import { IpcRendererRes } from '../declare/IpcChannelManage';
import { AbstractManager } from './abstractManager';
// import {appManage} from "./appManage";
// import {WriteStream} from "fs";

// const { config } = require('env_def');
// const myDomain = config('domain') as string;

class FsManageImpl extends AbstractManager implements FsManageHandle {
  errMap: ErrMap = {
    ECONNRESET: '文件下载取消',
    ETIMEDOUT: '文件下载超时',
    SAVEERROR: '文件保存错误',
    UNKNOW: '文件下载错误',
  };

  requestManage: RequestManage = {};

  downloadAbort(url: string): void {
    const { request } = this.requestManage[url];
    console.log('request.destroy', url, Boolean(request));
    this.writeLog('download-abort', {
      url,
      request,
    });
    try {
      request?.destroy();
      // if(tempFilePath) {
      //   fse.remove(tempFilePath, (err) => {
      //     console.error(err);
      //   });
      // }
    } catch (err) {
      console.error(err);
    }
    // this.clear(url);
  }

  async zip(config: FsZipConfig) {
    const { fileName, filePath, files } = config;
    const zip = new AdmZip();
    const addFilePromise = files.map(
      async fileLocationPath =>
        new Promise<boolean>(res => {
          fse.access(fileLocationPath, b => {
            if (!b) {
              zip.addLocalFile(fileLocationPath);
            }
            res(!!b);
          });
        })
    );
    return new Promise<FsZipRes>(res => {
      Promise.all(addFilePromise).then(addRes => {
        const savePath = path.join(this.getFilePath(fileName, filePath));
        zip.getEntries().forEach(entry => {
          // fix unicode characters
          // https://github.com/cthackers/adm-zip/issues/255
          entry.header.made = 0x314;
          // eslint-disable-next-line no-bitwise
          entry.header.flags |= 0x800; // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
        });
        zip.writeZip(savePath, error => {
          res({
            fileName,
            filePath: savePath,
            error: error || undefined,
            success: !error,
            message: error ? `save fail ${error.message}` : `save success ${addRes.filter(r => r).length} of ${addRes.length} zipped`,
          });
        });
      });
    });
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
      console.warn(e);
    }
  }

  clear(url: string) {
    const { tempFilePath } = this.requestManage[url];
    console.log('[download-clean] ', tempFilePath);
    if (tempFilePath) {
      this.removeFile(tempFilePath);
    }
    delete this.requestManage[url];
  }

  initIpcChannel() {
    ipcMain.handle('fsManageInvoke', async (event, functionName: FsManageHandleType, args) => {
      const data = await this[functionName](args as any);
      console.log('fsManageInvoke', data);
      return { data } as IpcRendererRes;
    });
    ipcMain.on('fsManage', (event, functionName: FsManageType, args) => {
      this[functionName](args);
    });
    ipcMain.on('ondragstart', (event, functionName: FsManageType, args) => {
      this.writeLog('dragFile received', args).then(() => {
        this.dragFile(event, args);
      });
    });
  }

  dragFile(event: Electron.IpcMainEvent, params?: { filePath: string; iconPath?: string }) {
    console.log('[start drag] start', params);
    this.writeLog('[start drag] start', params).then(() => {
      if (params) {
        try {
          const icon = path.join(__dirname, '../electron/static/drag.png');
          event.sender.startDrag({
            file: params.filePath,
            icon: params.iconPath || icon,
          });
          console.log('[start drag] end', icon);
          this.writeLog('[start drag] end', icon).then();
        } catch (e) {
          this.writeLog('[start drag] error', e).then();
        }
      }
    });
  }
}

export const fsManage = new FsManageImpl();
