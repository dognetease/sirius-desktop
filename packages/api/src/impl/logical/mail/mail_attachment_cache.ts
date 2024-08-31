import { api } from '@/api/api';
import { SystemApi } from '@/api/system/system';
import {
  MailEntryModel,
  MailFileAttachModel,
  UpdateMailCountTaskType,
  FileTask,
  FileDownloadTaskType,
  FileDownloadConf,
  SaveMailsPutFileParams,
} from '@/api/logical/mail';
import { resultObject } from '@/api/_base/api';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { FileApi, FileAttachModel } from '@/api/system/fileLoader';
import { util, wait } from '@/api/util';
import { apis, inWindow } from '@/config';
import { DbApiV2 } from '@/api/data/new_db';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';

export class MailAttactmentCacher {
  systemApi: SystemApi;

  db: DbApiV2;

  mailContentDbHelper: MailContentDbHelper;

  fileDownloadConf: FileDownloadConf;

  fileApi: FileApi;

  loggerHelper: DataTrackerApi;

  shouldCacheToInstallDir = false;

  cacheBasePath: string | undefined = undefined;

  customMailCachePath: string | undefined = undefined;

  defaultCachepath: string | undefined = undefined;

  constructor(dbHelper: MailContentDbHelper) {
    this.systemApi = api.getSystemApi();
    this.db = api.getNewDBApi();
    this.mailContentDbHelper = dbHelper;
    this.fileApi = api.getFileApi();
    this.loggerHelper = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.fileDownloadConf = {
      taskIds: [],
      taskMap: new Map(),
      runningTaskId: '',
      fileDownloadDir: {},
      taskEnable: false,
    };
    this.getShouldUseInstallDir().then(res => {
      this.shouldCacheToInstallDir = res;
      if (res) {
        this.getExeDir().then((exePath: string) => {
          if (!exePath) return;
          this.cacheBasePath = exePath;
        });
      }
    });
  }

  private getExePath() {
    return window.electronLib.appManage.getPath('exe');
  }

  async setMailCachePath(path: string) {
    this.customMailCachePath = path;
  }

  private async getExeDir(): Promise<string> {
    return this.getExePath().then((exeDir: string) => {
      if (exeDir && exeDir.includes('.exe') && exeDir.includes('\\')) {
        const lastPathSplitInx = exeDir.lastIndexOf('\\');
        return exeDir.substring(0, lastPathSplitInx);
      }
      return '';
    });
  }

  private async getShouldUseInstallDir(): Promise<boolean> {
    if (!inWindow() || !window.electronLib) return false;
    const isWin = !window.electronLib.env.isMac;
    if (isWin) {
      const exePath = await this.getExePath();
      if (exePath && exePath.toLowerCase().indexOf('c:') === 0) {
        return false;
      }
      return true;
    }
    return false;
  }

  private filterDownloadFile(file: MailFileAttachModel) {
    const { fileType, inlined, fileSize /* , cloudAttachment */ } = file;
    // 日程附件不下载
    if (!fileType || fileType === 'ics') {
      return false;
    }
    // 内联的图片附件，且尺寸小于20M，下载
    const INLINE_MAX_SIZE = 20 * 1024 * 1024;
    if (inlined && util.isImage(fileType) && fileSize < INLINE_MAX_SIZE) {
      return true;
    }
    // 非内联附件，且尺寸小于3M，下载
    const FILE_MAX_SIZE = 3 * 1024 * 1024;
    if (!inlined && fileSize < FILE_MAX_SIZE) {
      return true;
    }
    return false;
  }

  private getAttachmentPart(v: MailFileAttachModel) {
    return (v.id ? String(v.id) : v.cloudIdentity) || '_' + (1000 * Math.random()).toFixed(2);
  }

  buildFileInfo(it: MailEntryModel, filesMap: Map<string, FileTask>, idSet: Set<string>) {
    if (!this.systemApi.isElectron()) {
      return;
    }
    if (it.isThread) {
      return;
    }
    if (it.entry?.folder === 2 || it.entry?.isDraft) {
      return;
    }
    if (Array.isArray(it.entry?.attachment) && it.entry?.attachment.length > 0) {
      it.entry?.attachment.filter(this.filterDownloadFile).forEach(v => {
        if (v.fileOriginUrl && !idSet.has(v.fileOriginUrl)) {
          idSet.add(v.fileOriginUrl);
          const targetTask = {
            file: v,
            mailInfo: {
              fid: it.entry?.folder,
              mid: it.id,
              part: this.getAttachmentPart(v),
            },
          };
          filesMap.set(v.fileOriginUrl, targetTask);
        }
      });
    }
  }

  async putFileIgnoreExist({ idSet, data, taskType = 'default', reserveKeys = [], _account }: SaveMailsPutFileParams): Promise<resultObject[]> {
    if (!this.systemApi.isElectron()) {
      return [];
    }

    if (data.size === 0) {
      return [];
    }
    const ids = Array.from(idSet);
    const delIds: Set<number> = new Set();
    const validOriginData: FileAttachModel[] = [];
    const originData = ((await this.db.getByIndexIds({ dbName: 'fileop', tableName: 'file', _dbAccount: _account }, 'fileOriginUrl', ids)) as FileAttachModel[]).filter(
      v => !!v
    );
    originData.forEach(v => {
      if (!v.filePath || !window.electronLib.fsManage.isExist(v.filePath)) {
        if (v.fid) {
          delIds.add(v.fid);
        }
      } else {
        validOriginData.push(v);
      }
    });
    if (delIds.size > 0) {
      await this.db.deleteById({ dbName: 'fileop', tableName: 'file', _dbAccount: _account }, [...delIds]).catch();
    }
    if (validOriginData && validOriginData.length > 0) {
      this.mailContentDbHelper.deleteExistData('fileOriginUrl', data, validOriginData, reserveKeys);
    }
    if (data.size > 0) {
      const remainData: FileTask[] = [];
      data.forEach(v => {
        remainData.push(v);
      });
      this.storeDownloadTasks(remainData, taskType, _account);
      return remainData;
    }
    return Promise.resolve([]);
  }

  storeDownloadTasks(files: FileTask[], taskType: UpdateMailCountTaskType = 'default', _account?: string) {
    const type = taskType === 'push' ? 'pushTask' : 'defaultTask';
    files.forEach(task => {
      const { file } = task;
      const id = file.fileOriginUrl;
      if (id) {
        if (type === 'pushTask') {
          setTimeout(() => {
            this.insertDownloadTask(id, type, task);
          }, 100);
        } else {
          this.insertDownloadTask(id, type, task);
        }
      }
    });
    this.saveFilesInMail(false, taskType, _account).then();
  }

  private insertDownloadTask(id: string, taskType: FileDownloadTaskType, task: FileTask) {
    const { taskIds, runningTaskId, taskMap } = this.fileDownloadConf;
    // 任务执行中，返回吧
    if (id === runningTaskId || taskMap.has(id)) {
      return;
    }
    const index = taskIds.indexOf(id);
    // 队列中不存在这个任务，那么如果是 push 任务，就插到最前面，否则插到最后面
    if (index === -1) {
      if (taskType === 'defaultTask') {
        taskIds.push(id);
      } else {
        taskIds.unshift(id);
      }
      taskMap.set(id, { ...task, taskType });
    } else {
      // 队列中存在这个任务的话，如果是 push 任务，把这个任务插入到最前面
      console.log('[file auto download] file download task exist', taskType, id);
      if (taskType === 'pushTask') {
        taskIds.splice(index, 1);
        taskIds.unshift(id);
      }
    }
  }

  async saveFilesInMail(taskEnable?: boolean, taskType: UpdateMailCountTaskType = 'default', _account?: string) {
    const isLowMemoryMode = this.systemApi.getIsLowMemoryModeSync();
    const isBgPage = window.isBridgeWorker;
    const isElectron = this.systemApi.isElectron();
    // 只有在 客户端 + 非低内存模式 + 后台才会做这个事情
    if (!inWindow() || !isElectron || isLowMemoryMode || !isBgPage) {
      return;
    }
    // 只有在 mail_impl 里面延时强制开启任务后，或者即时推送的邮件，才能进行下载
    if (taskEnable) {
      this.fileDownloadConf.taskEnable = true;
    }
    const startRun = this.fileDownloadConf.taskEnable || taskType === 'push';
    if (!startRun) {
      console.log('[file auto download] not allowed at the moment');
      return;
    }

    const type = taskType === 'push' ? 'pushTask' : 'defaultTask';
    const { runningTaskId, taskIds } = this.fileDownloadConf;
    if (runningTaskId) {
      console.log('[file auto download] ', type, 'already running', runningTaskId);
      return;
    }

    console.log('[file auto download] ---- ', type, '---- start', taskIds);
    await this.saveFilesInMailCall(_account);
  }

  private async saveFilesInMailCall(_account?: string) {
    const { taskIds, taskMap } = this.fileDownloadConf;
    const taskId = taskIds.shift();
    if (taskId) {
      this.fileDownloadConf.runningTaskId = taskId;
      const task = taskMap.get(taskId);
      if (task) {
        try {
          const { file, mailInfo } = task;
          const dirPath = await this.mkDownloadDir(file.inlined ? 'inline' : 'regular', { fid: mailInfo.fid, mid: mailInfo.mid });
          console.log('[file auto download] ---- stage1 ---- prepare dir ', dirPath);
          const originFilePath = this.getDownloadFileName(dirPath, file, false);
          const toDownload = await this.fileDownloadLastCheck(taskId, originFilePath, _account);
          if (toDownload) {
            const filePath = this.getDownloadFileName(dirPath, file, true);
            console.log('[file auto download] ---- stage2 ---- download start filePath ', filePath);
            const defaultCachePath = this.getDefaultCachePathByAttachment(file.inlined ? 'inline' : 'regular', { fid: mailInfo.fid, mid: mailInfo.mid, _account });
            console.log('[file auto download] ---- stage2 ---- download start defaultCachePath ', defaultCachePath);
            const result = await this.fileApi.download(
              {
                ...file,
                filePath,
                fallbackFilePath: defaultCachePath,
              },
              { _account }
            );
            console.log('[file auto download] ---- stage3 -- save succeed ', result);
            this.loggerHelper.track('auto_download_result', { task, result });
          } else {
            console.log('[file auto download] file already downloaded', file);
          }
          // 下一个任务如果是 push 邮件的任务，那么等 3s，否则等 60s 再开启下一个任务
          const nextTaskId = taskIds[0];
          const nextTask = nextTaskId ? taskMap.get(nextTaskId) : null;
          const sleepTime = nextTask && nextTask.taskType === 'pushTask' ? 3000 : 60000;
          console.log('[file auto download] ---- stage4 -- will wait ', sleepTime / 1000, ' s');
          await wait(sleepTime);
        } catch (ex) {
          console.error('[file auto download] error', ex);
          this.loggerHelper.track('auto_download_error', { task, ex });
        }
      }
      await this.saveFilesInMailCall(_account);
    } else {
      this.fileDownloadConf.runningTaskId = '';
      console.log('[file auto download] ---- finished');
    }
  }

  setDefaultCachePath(path: string) {
    this.defaultCachepath = path;
  }

  private getDefaultCachePathByAttachment(type: 'inline' | 'regular', config: { fid: number; mid: string; _account?: string }) {
    const currentUser = this.systemApi.getCurrentUser(config?._account);
    const userPath = currentUser?.id ? util.replaceInvalidFileChar(currentUser?.id) : 'unknown';
    const { fid = 100001, mid } = config;
    const midDir = util.replaceInvalidFileChar(mid);
    const dirPath = window.electronLib.fsManage.normalizePath(`${this.defaultCachepath}/${userPath}/${type}/${fid}/${midDir}`);
    return dirPath;
  }

  // 自动下载目录，位于软件根目录下
  async mkDownloadDir(type: 'inline' | 'regular', config: { fid: number; mid: string; _account?: string }, fallbackToDefault: boolean = false): Promise<string> {
    const { fid = 100001, mid, _account } = config;
    const currentUser = this.systemApi.getCurrentUser(_account);
    const userPath = currentUser?.id ? util.replaceInvalidFileChar(currentUser?.id) : 'unknown';

    const userDir = this.fileDownloadConf.fileDownloadDir[userPath];
    if (userDir && userDir[type] && userDir[type][fid] && userDir[type][fid][mid]) {
      return userDir[type][fid][mid];
    }
    const midDir = util.replaceInvalidFileChar(mid);
    const dirPath = window.electronLib.fsManage.normalizePath(`${this.customMailCachePath ? '' : 'download'}/${userPath}/${type}/${fid}/${midDir}`);
    let dir: string = '';
    try {
      dir = await window.electronLib.fsManage.mkDir(dirPath, this.customMailCachePath || this.cacheBasePath);
    } catch (ex) {
      console.error('mkDir error', ex);
      const downDirPath = window.electronLib.fsManage.normalizePath(`download/${dirPath}`);
      if (fallbackToDefault && this.cacheBasePath && this.customMailCachePath && this.customMailCachePath.includes(this.cacheBasePath)) {
        dir = await window.electronLib.fsManage.mkDir(downDirPath, '');
      } else {
        if (this.customMailCachePath) {
          if (!fallbackToDefault) {
            dir = await window.electronLib.fsManage.mkDir(downDirPath, this.cacheBasePath);
          } else {
            if (this.cacheBasePath) {
              if (this.customMailCachePath.includes(this.cacheBasePath)) {
                dir = await window.electronLib.fsManage.mkDir(downDirPath, '');
              } else {
                dir = await window.electronLib.fsManage.mkDir(downDirPath, this.cacheBasePath);
              }
            } else {
              dir = await window.electronLib.fsManage.mkDir(downDirPath, '');
            }
          }
        } else {
          if (fallbackToDefault && this.cacheBasePath) {
            dir = await window.electronLib.fsManage.mkDir(dirPath, '');
          } else {
            throw ex;
          }
        }
      }
    }
    if (!this.fileDownloadConf.fileDownloadDir[userPath]) {
      this.fileDownloadConf.fileDownloadDir[userPath] = {
        inline: {},
        regular: {},
      };
    }
    if (!this.fileDownloadConf.fileDownloadDir[userPath][type][fid]) {
      this.fileDownloadConf.fileDownloadDir[userPath][type][fid] = {};
    }
    this.fileDownloadConf.fileDownloadDir[userPath][type][fid][mid] = dir;
    return dir;
  }

  private getDownloadFileName(dirPath: string, file: MailFileAttachModel, rename = true) {
    const formatFileName = file.fileName.replace(/[:*\^\|'"`~]/gi, '_');
    const extFileName = /^.+(\.[a-zA-Z0-9]+)$/.test(formatFileName) ? formatFileName : `${formatFileName}.${file.fileType}`;
    const fileName = rename ? window.electronLib.fsManage.setDownloadFileName(dirPath, extFileName, undefined, 2000) : extFileName;
    return `${window.electronLib.fsManage.normalizePath(dirPath + '/')}${fileName}`;
  }

  private async fileDownloadLastCheck(fileOriginUrl: string, filePath: string, _account?: string) {
    if (!this.systemApi.isElectron()) {
      return false;
    }
    const fileExist = window.electronLib.fsManage.isExist(filePath);
    if (!fileExist) {
      return true;
    }
    const dbData = (
      (await this.db.getByIndexIds({ dbName: 'fileop', tableName: 'file', _dbAccount: _account }, 'fileOriginUrl', [fileOriginUrl])) as FileAttachModel[]
    ).filter(v => !!v);
    if (dbData.length === 0) {
      return true;
    }
    const dbFilePath = dbData[0].filePath;
    const res = dbFilePath !== filePath;
    if (dbFilePath && res) {
      try {
        await window.electronLib.fsManage.remove(dbFilePath);
      } catch (ex) {
        console.error('remove file error', ex);
      }
    }
    return res;
  }
}
