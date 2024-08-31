/* eslint-disable class-methods-use-this */
// import asyncPool from 'tiny-async-pool';
import axios, { AxiosError } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
// import throttle from 'lodash/throttle';
import { FsSelectRes } from 'env_def';
// import { throws } from 'assert';
// import pathtool from 'path';
import { apis } from '../../config';
import { api } from '../../api/api';
import { PopUpMessageInfo, ApiLifeCycleEvent, resultObject } from '../../api/_base/api';
// import {Api} from "../../api/_base/api";
import { mailTable } from '../logical/mail/mail_action_store_model';
import {
  attachmentTypeMap,
  FileApi,
  FileAttachModel,
  FileDownloadManage,
  FileLoaderActionConf,
  FileSaveAsConf,
  FileType,
  FsSaveRes,
  ImportMailModel,
  LoaderResult,
  UploadPieceHandler,
} from '../../api/system/fileLoader';
import { ApiResponse, DataTransApi, LoaderActionConf, LoadOperation } from '../../api/data/http';
import { SystemApi } from '../../api/system/system';
import { ListStore, StringTypedMap } from '../../api/commonModel';
import FileManageDb from './file_dbl';
import { EventApi } from '../../api/data/event';
// import { ApiLifeCycleEvent } from '../../api/_base/api';
import { mailPerfTool } from '@/api/util/mail_perf';
import { PerformanceApi } from '@/api/system/performance';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { AccountApi } from '@/api/logical/account';
import { getOs } from '../../utils/confOs';
import { MailConfApi } from '@/api/logical/mail';
// import axios,{AxiosInstance} from "axios";

// import {FsSelectRes} from "sirius-desktop/declare/FsManage";

// import {FsDownloadRes} from "../../gen/bundle";

export type TestLocalFilesResult = {
  re: boolean;
  fileModel?: FileAttachModel;
  uselessItem: FileAttachModel[];
};

class FileApiImp implements FileApi {
  static readonly invalidFid = -10000000;

  name: string;

  systemApi: SystemApi;

  eventApi: EventApi;

  store: ListStore<FileAttachModel>;

  fileIndex: StringTypedMap<number>;

  fileDb: FileManageDb;

  httpApi: DataTransApi;

  fsDownloadManage: FileDownloadManage = {};

  mailConfApi: MailConfApi;

  dataTrakerApi: DataTrackerApi;

  accountApi: AccountApi;

  performanceApi = api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;

  constructor() {
    this.name = apis.defaultFileApi;
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
    this.httpApi = api.getDataTransApi();
    this.store = new ListStore<FileAttachModel>();
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.fileIndex = {};
    this.fileDb = new FileManageDb();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.dataTrakerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
  }

  saveImportMails(mailInfos: ImportMailModel[], _account?: string | undefined): Promise<string[]> {
    return this.fileDb.putImportMails(mailInfos, _account).then((res: resultObject[]) => {
      if (res.length) {
        return res.map(mailInfo => mailInfo.__prKey__);
      }
      return [];
    });
  }

  checkMailMd5Exists(md5List: string[], _account?: string | undefined): Promise<ImportMailModel[]> {
    return this.fileDb.getImportMailByMd5(md5List, _account);
  }

  // private watchLogin(ev: SystemEvent) {
  //   if (ev && ev.eventData) {
  //     this.fileDb.init();
  //   } else if (ev) {
  //     this.fileDb.close();
  //   }
  // }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      this.fileDb.init();
    }
    return this.name;
  }

  beforeLogout() {
    this.fileDb.close();
    return this.name;
  }

  init(): string {
    return this.name;
  }

  afterInit() {
    if (this.systemApi.getCurrentUser()) {
      this.fileDb.init();
    }
    // this.eventApi.registerSysEventObserver("login", {
    //   name:"fileLoginOb",
    //   func:this.watchLogin.bind(this)
    // });
    return this.name;
  }

  afterLoadFinish() {
    return this.name;
  }

  setFsDownloadStatus(url: string, file: FileAttachModel) {
    const noLog = file.fileStatus === 'downloading';
    const cur = Object.assign(this.getFsDownloadStatus(url) || {}, file);
    this.fsDownloadManage[url] = cur;
    this.eventApi.sendSysEvent({
      eventName: 'fsDownloadNotify',
      eventStrData: url,
      eventData: cur,
      eventSeq: 0,
      noLog,
    });
  }

  getFsDownloadStatus(url: string): FileAttachModel | undefined {
    return this.fsDownloadManage[url];
  }

  clearFsDownloadStatus(url: string) {
    delete this.fsDownloadManage[url];
  }

  abortFsDownload(url: string): void {
    window.electronLib.downloadManage.downloadAbort(url);
    this.clearFsDownloadStatus(url);
  }

  // 批量下载
  async batchDownload(req: FileAttachModel, conf?: FileLoaderActionConf): Promise<{ fileModel: FileAttachModel; succ: boolean }> {
    const { fileContent, filePath: path } = req;
    // ArrayBuffer类型 直接下载
    if ((fileContent as ArrayBuffer)?.byteLength && path) {
      return new Promise((resolve, reject) => {
        window.electronLib.fsManage.writeFile(Buffer.from(fileContent as ArrayBuffer), path, {}, (err: any) => {
          if (err) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({
              succ: false,
              path,
              reason: err,
            });
          } else {
            resolve({
              succ: true,
              fileModel: req,
            });
          }
        });
      });
    }
    return this.download(req, conf);
  }

  // 预检查文件
  preCheckFile(req: FileAttachModel[], hostPath: string) {
    let totalSize = 0;
    const dealedFiles = req.reduce((total, r) => {
      if (r.filePath) {
        return [...total, r];
      }
      const { fileName, fileSize } = r;
      totalSize += fileSize;
      const matches = /\.[^\.]+$/.exec(fileName);
      const ext = matches ? matches[0] : '';
      let frontName = ext ? fileName.split(ext)[0] : fileName;
      while (frontName.length > 155) {
        // 文件名过长截断
        // 没有在RFC中找到文件名最长的有关标准，155可以满足大部分环境，暂定155
        frontName = frontName.substring(0, frontName.length - 1);
      }

      // 检测文件名是否重名
      const samenamelength = total.filter(item => {
        if (typeof item.fileName !== 'string') {
          return false;
        }
        const reg = /^(?<count>\(\d+\)){0,1}$/;
        return !!item.fileName.replace(frontName, '').replace(ext, '').match(reg);
      }).length;
      // 是否已经存在列表中
      const isExists = total.some(item => {
        if (typeof item.fileName !== 'string') {
          return false;
        }
        return item.fileName === fileName;
      });
      // 如果重名添加序号
      frontName = samenamelength !== 0 && isExists ? `${frontName}(${samenamelength})` : frontName;
      const sep = window.electronLib.fsManage.normalizePath('/');
      return [
        ...total,
        {
          ...r,
          fileName: frontName + ext,
          filePath: `${hostPath}${sep}${frontName + ext}`,
        },
      ];
    }, [] as FileAttachModel[]);

    return {
      totalSize,
      dealedFiles,
    };
  }

  // 下载多个文件
  async saveZip(
    req: Array<FileAttachModel>,
    name: string,
    mailId?: string,
    options: {
      removeOrginalFile?: boolean;
      _account?: string;
    } = {}
  ) {
    const { removeOrginalFile, _account = '' } = options;
    if (this.systemApi.isElectron() && window.electronLib) {
      const saveName = `${name}.zip`;
      const isSubAccount = this.mailConfApi.isSubAccount(_account);
      // 唤起弹窗
      const { success, path } = await window.electronLib.windowManage.saveDialog({
        fileName: saveName,
        openAsMainWindow: isSubAccount,
      });
      const reg = getOs() === 'mac' ? /.*(?=\/[^/]+$)/ : /.*(?=\\[^\\]+$)/;
      const matchRes = path.match(reg);
      const hostPath = matchRes ? matchRes[0] : '';
      // 兜底路径
      const tempPath: string = await window.electronLib.fsManage.mktempdir(`atc-${Date.now().toString()}-`);

      // 成功唤起
      if (success) {
        mailPerfTool.attachmentTransfer('download', 'all', 'start');
        // 前置校验整理
        const { dealedFiles, totalSize } = this.preCheckFile(req, tempPath || hostPath);
        // 开始批量下载并注入
        const loadResultArr = (await this.asyncPool({
          num: 3,
          infos: dealedFiles,
          func: this.batchDownload.bind(this),
          conf: {
            // fix SIRIUS-3760 批量下载是临时文件夹，不需要缓存到db
            noStoreData: true,
            _account,
          },
        })) as { fileModel: FileAttachModel; succ: boolean }[];

        // 非数组或存在下载失败
        if (!(loadResultArr instanceof Array) || loadResultArr.some(_ => _.succ === false)) {
          mailPerfTool.attachmentTransfer('download', 'all', 'end', {
            result: 'fail',
            fileSize: totalSize,
            fileType: 'zip',
          });

          // 全部下载如果出现单个附件下载失败，会终止打包，并提示用户重新下载
          // 如果在打zip包场景下打包失败 删除所有的file
          // eslint-disable-next-line no-unused-expressions
          loadResultArr.forEach(r => {
            if (!r.succ) {
              return;
            }
            if (typeof r.fileModel.filePath === 'string' && r.fileModel.filePath.length > 0) {
              window.electronLib.fsManage.remove(r.fileModel.filePath);
            }

            this.delFileInfo(r.fileModel);

            // 重置下载状态
            this.eventApi.sendSysEvent({
              eventName: 'fsDownloadNotify',
              eventStrData: r.fileModel.fileUrl,
              eventData: undefined,
              eventSeq: 0,
              noLog: true,
            });
          });
          return {
            success: false,
            path: '',
          };
        }
        const files: string[] = [];
        loadResultArr.forEach(r => {
          // eslint-disable-next-line no-unused-expressions
          r.fileModel.filePath !== undefined && files.push(r.fileModel.filePath);
        });

        // 打包
        const res = await window.electronLib.fsManage.zip({
          files,
          filePath: path,
          fileName: saveName,
        });

        // 打包下载完成后，将zip文件目录路径存储到 mailTable.status 中
        if (mailId) {
          const mailStatus = await this.fileDb.dbApi.getById(mailTable.status, mailId);
          if (mailStatus) {
            mailStatus.attachmentsZipPath = res.filePath;
            await this.fileDb.dbApi.put(mailTable.status, mailStatus);
          }
        }
        await window.electronLib.fsManage.remove(tempPath);
        mailPerfTool.attachmentTransfer('download', 'all', 'end', {
          result: 'success',
          fileSize: totalSize,
          fileType: 'zip',
        });

        // 删除所有的本地文件
        if (removeOrginalFile === true) {
          // 如果在打zip包场景下打包失败 删除所有的file
          loadResultArr.forEach(r => {
            if (typeof r.fileModel.filePath === 'string' && r.fileModel.filePath.length > 0) {
              window.electronLib.fsManage.remove(r.fileModel.filePath);
            }

            // 重置下载状态
            this.eventApi.sendSysEvent({
              eventName: 'fsDownloadNotify',
              eventStrData: r.fileModel.fileUrl,
              eventData: undefined,
              eventSeq: 0,
              noLog: true,
            });

            this.delFileInfo(r.fileModel);
          });
        }

        return {
          ...res,
          path: res.filePath,
        };
      }
    }
    return {
      success: false,
      path: '',
    };
  }

  // 下载多个文件
  async saveAll(req: Array<FileAttachModel>, _account = '') {
    if (this.systemApi.isElectron() && window.electronLib) {
      // 选择目录
      const { success, path } = await window.electronLib.windowManage.select({
        properties: ['openDirectory'],
        buttonLabel: '下载',
      });
      const hostPath = Array.isArray(path) ? path[0] : path;
      // 成功唤起
      if (success) {
        mailPerfTool.attachmentTransfer('download', 'all', 'start');
        // 前置校验整理
        const { dealedFiles, totalSize } = this.preCheckFile(req, hostPath);
        // 开始批量下载并注入
        const loadResultArr = (await this.asyncPool({
          num: 3,
          infos: dealedFiles,
          func: this.batchDownload.bind(this),
          conf: { _account },
        })) as { fileModel: FileAttachModel; succ: boolean }[];

        // 非数组或存在下载失败
        if (!(loadResultArr instanceof Array) || loadResultArr.some(_ => _.succ === false)) {
          mailPerfTool.attachmentTransfer('download', 'all', 'end', {
            result: 'fail',
            fileSize: totalSize,
            fileType: 'zip',
          });
          return {
            success: false,
            path: hostPath,
          };
        }
        return {
          success: true,
          path: hostPath,
          loadResArr: loadResultArr,
        };
      }
      return {
        success: false,
        path: '',
      };
    }
    return {
      success: false,
      path: '',
    };
  }

  // 下载本地已有的文件，不用使用网络路径，实际上是从项目路径下拷贝到用户选择的路径
  async downloadLocalFile(req: Partial<FileAttachModel>): Promise<LoaderResult | FsSaveRes> {
    if (this.systemApi.isElectron() && window.electronLib && req?.fileName && req?.filePath) {
      const isSubAccount = this.mailConfApi.isSubAccount(req?._account);
      // 唤起系统弹窗
      const dialogRes = await window.electronLib.windowManage.saveDialog({
        fileName: req.fileName,
        openAsMainWindow: isSubAccount,
      });
      if (dialogRes.success) {
        await window.electronLib.fsManage.copy(req.filePath, dialogRes.path);
        return {
          success: true,
          path: dialogRes.path,
        };
      }
    }
    return {
      success: false,
      path: '',
    };
  }

  private sysToast(text: string) {
    if (!text) {
      return;
    }
    this.eventApi.sendSysEvent({
      eventName: 'error',
      eventLevel: 'error',
      eventStrData: 'warn',
      eventData: {
        popupType: 'toast',
        popupLevel: 'warn',
        title: text,
        code: 'PARAM.ERR',
        auto: false,
        duration: 1.5,
      } as PopUpMessageInfo,
      eventSeq: 0,
    });
  }

  // 单个文件 保存下载
  async saveDownload(req: Partial<FileAttachModel>, conf?: FileLoaderActionConf): Promise<LoaderResult | FsSaveRes> {
    const fileName = req.fileName?.replace(/[:*|!$/]+/gi, '_');
    // electron端
    if (this.systemApi.isElectron() && window.electronLib) {
      // req.fileName readonly 不能直接修改
      const isSubAccount = this.mailConfApi.isSubAccount(conf?._account);
      // 唤起系统弹窗
      const res = await window.electronLib.windowManage.saveDialog({
        fileName,
        openAsMainWindow: isSubAccount,
      });

      // 唤起成功
      if (res.success) {
        this.sysToast(req.dialogConfirmText || '');
        let saveAndDownload = true;
        if (conf?.saveAndDownload !== undefined) {
          saveAndDownload = conf.saveAndDownload;
        }
        if (saveAndDownload) {
          const base64Reg = new RegExp(/^data:image\/\w+;base64,/);
          // 以base64方式下载
          if (req.fileUrl && base64Reg.test(req.fileUrl)) {
            const reqUrl = req.fileUrl.slice().replace(base64Reg, '');
            return window.electronLib.fsManage.saveBase64File(res.path, reqUrl);
          }
          // ArrayBuffer 以buffer方式下载
          if ((req?.fileContent as ArrayBuffer)?.byteLength) {
            return new Promise((resolve, reject) => {
              window.electronLib.fsManage.writeFile(Buffer.from(req?.fileContent as ArrayBuffer), res.path, {}, (err: any) => {
                if (err) {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  return reject({
                    success: false,
                    path: res.path,
                    reason: err,
                  });
                }
                return resolve({
                  success: true,
                  path: res.path,
                });
              });
            });
          }
          // 以网络请求方式下载
          return this.download(
            {
              ...req,
              filePath: res.path,
              fileName,
            },
            conf
          );
        }
        return res;
      }
      return {
        success: false,
        path: '',
      };
    }
    // Web
    const newReq = req && (!req.fileUrl || !req.fileName) ? this.transferModel(req as FileAttachModel) : (req as FileAttachModel);
    if (!req || !req.fileUrl || !req.fileName) {
      return Promise.reject(new Error('[file] download no data required'));
    }
    this.sysToast(req.dialogConfirmText || '');
    return this.downloadExternal(newReq);
  }

  clipboardWriteImage(dataURL: string) {
    if (this.systemApi.isElectron() && window.electronLib) {
      window.electronLib.fsManage.clipboardWriteImage(dataURL);
    }
  }

  // 网络下载
  async download(reqO: Partial<FileAttachModel>, conf?: FileLoaderActionConf): Promise<LoaderResult> {
    let req = reqO as FileAttachModel;
    // 数据不全，转换
    if (req && (!req.fileUrl || !req.fileName)) {
      req = this.transferModel(req);
    }
    if (!req || !req.fileUrl || !req.fileName) {
      return Promise.reject(new Error('[file] download no data required'));
    }
    if (conf?._account) {
      req._account = conf?._account;
    }
    // const ext = req.fileName ? pathtool.extname(req.fileName) : '.';
    // let frontName = req.fileName ? req.fileName.split(ext)[0] : '';
    // while (encodeURI(frontName).length > 155) {
    //   // 文件名过长截断
    //   // 没有在RFC中找到文件名最长的有关标准，155可以满足大部分环境，暂定155
    //   frontName = frontName.substring(0, frontName.length - 1);
    // }
    // req.fileName = frontName + ext;
    // if (req.filePath) {
    //   req.filePath = pathtool.dirname(req.filePath) + '/' + req.fileName;
    // }
    const recordParams = {
      recordPerf: conf?.recordPerf,
      recordFileType: conf?.recordFileType || 'all',
    };
    if (this.systemApi.isElectron() && window.electronLib) {
      if (recordParams.recordPerf) {
        mailPerfTool.attachmentTransfer('download', recordParams.recordFileType, 'start');
      }
      const rqUrl = this.httpApi.buildUrl(req.fileUrl, this.httpApi.getDeviceInfo() || {});
      req.fileUrlInUse = rqUrl;
      // let delIds:;
      try {
        const [res, re] = await Promise.all([this.getFileInfo(req), this.testLocalFile(req)]);
        if (res && res.length > 0) {
          // const { re, fileModel, uselessItem } = await this.testLocalFiles(res);
          let fileModel: FileAttachModel | undefined;
          if (re) {
            fileModel = res.find(it => it.filePath === req.filePath);
          }
          const delIds = res.filter(it => (fileModel ? it.filePath !== req.filePath && !!it.fid : !!it.fid));
          this.fileDb.delBatch(delIds); // 只删除确实不存在的
          if (fileModel) {
            return {
              succ: true,
              fid: req.fid,
              errMsg: '',
              storeInLocal: true,
              fileModel,
            } as LoaderResult;
          }
          // 如果文件不存在，则该条目也应被删除
          // delIds = delIds || [];
          // delIds.push(fileModel.fid as number);
        }
      } catch (e) {
        console.warn('[file] got file from local :', e);
      }
      return this.downloadInternalOther(req, conf)
        .then(res => {
          if (recordParams.recordPerf) {
            mailPerfTool.attachmentTransfer('download', recordParams.recordFileType, 'end', {
              result: res.succ ? 'success' : 'fail',
              fileSize: req.fileSize,
              fileType: req.fileType,
            });
          }
          return res;
        })
        .catch(ex => {
          console.warn('[file] downloadInternalOther ex', ex);
          if (recordParams.recordPerf) {
            mailPerfTool.attachmentTransfer('download', recordParams.recordFileType, 'end', {
              result: 'fail',
              fileSize: req.fileSize,
              fileType: req.fileType,
            });
          }
          return Promise.reject(new Error('[file] downloadInternalOther fail to download' + ex));
        });
    }
    return this.downloadExternal(req)
      .then(res => {
        if (recordParams.recordPerf) {
          mailPerfTool.attachmentTransfer('download', recordParams.recordFileType, 'end', {
            result: res.succ ? 'success' : 'fail',
            fileSize: req.fileSize,
            fileType: req.fileType,
          });
        }
        return res;
      })
      .catch(err => {
        if (recordParams.recordPerf) {
          mailPerfTool.attachmentTransfer('download', recordParams.recordFileType, 'end', {
            result: 'fail',
            fileSize: req.fileSize,
            fileType: req.fileType,
          });
        }
        return Promise.reject(err);
      });
  }

  /**
   * 遍历所有文件记录，找出至多一条可用记录，其余记录添加到无用列表，可删除
   * @private
   * @param items
   */
  testLocalFiles(items: FileAttachModel[]): TestLocalFilesResult {
    const result = { re: false, uselessItem: [] } as TestLocalFilesResult;
    if (!items || items.length === 0) {
      return result;
    }
    items.forEach(it => {
      if (!result.fileModel && it.filePath && window.electronLib.fsManage.isExist(it.filePath)) {
        result.fileModel = it;
      } else {
        result.uselessItem.push(it);
      }
    });
    return result;
  }

  private transferModel(req: FileAttachModel) {
    if (req.fid === undefined) {
      req = this.registerTmpFile(req);
    }
    if (req.fid !== undefined) {
      if (req.fid <= 0) {
        const re = cloneDeep(this.store.getOb(-req.fid)); // cloneDeep是因为报错：object is not extensible
        if (re) {
          re.filePath = req.filePath;
          req = re;
        }
      }
    }
    return req;
  }

  private downloadExternal(req: FileAttachModel) {
    if (req && req.fileUrl) {
      const msg = this.systemApi.openNewWindow(req.fileUrl);
      return Promise.resolve({
        succ: true,
        fid: FileApiImp.invalidFid,
        errMsg: msg as string,
        storeInLocal: false,
        fileModel: req,
      });
    }
    return Promise.reject(new Error('[file] downloadExternal no url set'));
  }

  private sendLog(status: string) {
    let statSubKey = '';
    if (status === 'success') {
      statSubKey = 'success';
    } else if (status.indexOf('权限不足') !== -1) {
      statSubKey = 'noauth_error';
    } else if (status.indexOf('字节为空') !== -1) {
      statSubKey = 'emptybyte_error';
    } else if (status.indexOf('覆盖失败') !== -1) {
      statSubKey = 'cover_error';
    } else if (status.indexOf('文件保存错误') !== -1) {
      statSubKey = 'save_error';
    } else if (status.indexOf('文件下载超时') === -1) {
      statSubKey = 'timeout_error';
    } else if (status.indexOf('下载取消') !== -1) {
      statSubKey = 'download_cancel';
    } else if (status.indexOf('下载错误') !== -1) {
      statSubKey = 'download_error';
    } else {
      statSubKey = 'unknown_error';
    }

    this.performanceApi.point({
      statKey: 'fs_download',
      statSubKey,
      value: 1,
      valueType: 4,
    });
  }

  async downloadFile(req: FileAttachModel, conf?: FileLoaderActionConf): Promise<boolean> {
    const writer = await window.electronLib.fsManage.createWriteStream(req.fileName, req.filePath);
    console.log('---download,', conf);
    const response = await axios({
      method: 'get',
      url: req.fileUrl,
      responseType: 'stream',
      onDownloadProgress:
        conf && conf.progressIndicator
          ? (ev: ProgressEvent) => {
              const percent = ev.loaded / (ev.total || req.fileSize || 10000000);
              console.log('download ' + percent);
              conf?.progressIndicator && conf?.progressIndicator(percent);
            }
          : undefined,
    });
    // const response = this.httpApi.get(req.fileUrl!, undefined, {
    //     responseType: 'stream',
    //     onDownloadProgress: conf && conf.progressIndicator
    //     ? (ev: ProgressEvent) => {
    //         const percent = ev.loaded / (ev.total || req.fileSize || 10000000);
    //         console.log('download ' + percent);
    //         conf?.progressIndicator && conf?.progressIndicator(percent);
    //       }
    //     : undefined,
    //     _account: conf?._account
    // });
    return new Promise((resolve, reject) => {
      response?.data?.pipe(writer);
      let error: any = null;
      writer.on('error', (err: AxiosError) => {
        console.warn('---- download:', err);
        error = err;
        writer.close();
      });
      writer.on('close', () => {
        console.log('download closed');
        if (!error) {
          resolve(true);
        } else {
          reject(error);
        }
      });
    });
  }

  // 由于 got 不支持 sirius 协议，下载本地 sirius 协议下的文件，暂时使用 move 方法代替
  async downloadSiriusFile(req: FileAttachModel): Promise<LoaderResult> {
    if (req.fileUrl && req.fileName && req.filePath) {
      const siriusProtocol = 'sirius://sirius.file/';
      if (req.fileUrl.startsWith(siriusProtocol)) {
        const fromPath = decodeURIComponent(req.fileUrl.replace(siriusProtocol, ''));
        if (window.electronLib.fsManage.isExist(fromPath)) {
          try {
            await window.electronLib.fsManage.copy(fromPath, req.filePath);
            console.log('[sirius file] return from electron lib:', req);
            await this.storeFileInfo(
              {
                ...req,
                fileStatus: 'downloaded',
              },
              true
            );
            return {
              succ: true,
              fid: req.fid || -1,
              errMsg: '',
              storeInLocal: true,
              fileModel: req,
            };
          } catch (e) {
            if (req.fileOriginUrl && !req.fileOriginUrl.startsWith(siriusProtocol)) {
              return this.download({
                ...req,
                fileUrl: req.fileOriginUrl,
              });
            }
            return Promise.reject(new Error('[sirius file] download SiriusFile file error'));
          }
        } else if (req.fileOriginUrl && !req.fileOriginUrl.startsWith(siriusProtocol)) {
          return this.download({
            ...req,
            fileUrl: req.fileOriginUrl,
          });
        } else {
          return Promise.reject(new Error('[sirius file] download SiriusFile file error'));
        }
      }
      return Promise.reject(new Error('[sirius file] download SiriusFile file url must be under sirius protocol'));
    }
    return Promise.reject(new Error('[sirius file] download SiriusFile error invalid req'));
  }

  async downloadInternalOther(req: FileAttachModel, conf?: FileLoaderActionConf): Promise<LoaderResult> {
    if (req.fileUrl && req.fileName) {
      // TODO: 如果 got 方法支持 sirius 协议后，就可以移除这部分代码，但是要考虑 storeFileInfo 的第二个参数的逻辑
      if (req.fileUrl.startsWith('sirius://sirius.file')) {
        return this.downloadSiriusFile(req);
      }

      const url = req.fileUrl;
      const file = this.getFsDownloadStatus(url);
      if (file?.fileStatus === 'downloading' || file?.fileStatus === 'downloadStart') {
        const msg = url + ' is already downloading';
        console.error(msg, file);
        return Promise.reject(msg);
      }
      this.setFsDownloadStatus(url, {
        ...req,
        fileStatus: 'downloadStart',
        fileReceivedBytes: 0,
      });
      let onProgress: FileLoaderActionConf['progressIndicator'];
      let sessionName = '';
      // let setFsDownloadStatus: DebouncedFunc<FileApiImp['setFsDownloadStatus']>;
      let setFsDownloadStatus: any;
      if (conf && conf.progressIndicator) {
        const progressThrottle = conf.progressThrottle === undefined ? true : conf.progressThrottle;
        if (progressThrottle) {
          onProgress = throttle(conf.progressIndicator, conf.throttleTime || 1000, {
            leading: true,
          });
        } else {
          onProgress = conf.progressIndicator;
        }
      } else {
        setFsDownloadStatus = throttle(this.setFsDownloadStatus, 500, {
          leading: true,
          trailing: true,
        });
      }
      const progressArr: string[] = [];
      // 多账号后台指定sessionName
      if (conf?._account && this.mailConfApi.isSubAccount(conf?._account)) {
        sessionName = this.systemApi.getSessionNameOfSubAccount(conf._account);
      }

      return window.electronLib.downloadManage
        .download({
          sessionName,
          url,
          realUrl: req.fileUrlInUse,
          dirPath: req.dirPath,
          filePath: req.filePath,
          fileName: req.fileName,
          progress: (receivedBytes: number, totalBytes: number, progress: number) => {
            const _totalBytes = totalBytes <= 0 ? req.fileSize : totalBytes;
            progress = progress || receivedBytes / _totalBytes;
            const _progress = progress.toFixed(2);
            if (!progressArr.includes(_progress)) {
              // console.warn(
              //   '[fs] download receivedBytes: ',
              //   receivedBytes,
              //   'totalBytes: ',
              //   _totalBytes,
              //   'progress: ',
              //   progress
              // );
              progressArr.push(_progress);
            }
            if (this.getFsDownloadStatus(url)?.fileStatus !== 'downloading') {
              this.setFsDownloadStatus(url, {
                ...req,
                fileStatus: 'downloading',
                fileReceivedBytes: receivedBytes,
                fileSize: _totalBytes,
                fileDownloadProgress: progress,
              });
            }
            if (onProgress) {
              onProgress(progress, receivedBytes);
            } else {
              setFsDownloadStatus.call(this, url, {
                ...req,
                fileStatus: 'downloading',
                fileReceivedBytes: receivedBytes,
                fileSize: _totalBytes,
                fileDownloadProgress: progress,
              });
            }
          },
        })
        .then((rs: any) => {
          console.warn('download file return from electron lib:', rs);
          const storeData = { ...req };
          storeData.filePath = rs.filePath;
          storeData.fileName = rs.fileName;
          storeData.fileMd5 = rs.md5;
          storeData.fileSize = rs.totalBytes;
          if (storeData.fid && storeData.fid < 0) {
            storeData.fid = undefined;
          }
          if (rs.success) {
            storeData.fileStatus = 'downloaded';
            this.sendLog('success');
            const storeFileFn = conf?.noStoreData ? () => Promise.resolve() : () => this.storeFileInfo(storeData);
            return storeFileFn().then(() => {
              const fileModel = {
                ...storeData,
                fileStatus: 'downloaded',
                fileReceivedBytes: rs.totalBytes,
                fileSize: rs.totalBytes,
              };
              setFsDownloadStatus ? setFsDownloadStatus.call(this, url, fileModel) : this.setFsDownloadStatus(url, fileModel);
              return {
                succ: true,
                fid: storeData.fid,
                errMsg: '',
                storeInLocal: true,
                fileModel,
              } as LoaderResult;
            });
          }
          try {
            if (storeData.filePath) {
              window.electronLib.fsManage.remove(storeData.filePath).then();
            }
          } catch (e) {
            console.error(e);
          }
          const fileModel = {
            ...storeData,
            fileStatus: 'downloadFailed',
            fileReceivedBytes: rs.totalBytes,
          };
          setFsDownloadStatus ? setFsDownloadStatus.call(this, url, fileModel) : this.setFsDownloadStatus(url, fileModel);

          this.sendLog(rs.message as string);
          return {
            succ: false,
            fid: storeData.fid,
            errMsg: rs.message,
            storeInLocal: false,
            fileModel,
          } as LoaderResult;
          // });
        })
        .catch((reason: unknown) => {
          console.error('downloadInternalOther', reason);
          return {
            succ: false,
            fid: FileApiImp.invalidFid,
            errMsg: reason,
            storeInLocal: true,
            fileModel: req,
          } as LoaderResult;
        });
    }
    return Promise.reject(new Error('[file] downloadInternalOther file url is empty'));
  }

  judgeFileType(contentType: string | undefined, fileName: string): FileType {
    const typeMapElement = contentType ? attachmentTypeMap[contentType] : undefined;
    if (typeMapElement) {
      return typeMapElement;
    }
    if (fileName) {
      const indexOf = fileName.lastIndexOf('.');
      if (indexOf > 0 && indexOf < fileName.length - 1) {
        return fileName.substring(indexOf + 1) as FileType;
      }
    }
    return 'other';
  }

  openFile(file: FileAttachModel): Promise<boolean> {
    if (this.systemApi.isElectron() && window.electronLib) {
      file = this.transferModel(file);
      return this.testLocalFile(file).then(res => {
        if (res) {
          if (file.filePath) {
            window.electronLib.fsManage.open(file.filePath);
            return Promise.resolve(true);
          }
          return this.getFileInfo(file).then((re: FileAttachModel[]) => {
            if (re && re[0] && re[0].filePath) {
              window.electronLib.fsManage.open(re[0].filePath);
              return true;
            }
            return false;
          });
        }
        return false;
      });
    }
    return Promise.reject(new Error('[file] openFile not support'));
  }

  async openFileFromDownload(filePath: string): Promise<boolean> {
    if (filePath) {
      const existRes = await window.electronLib.fsManage.isExist(filePath);
      if (existRes) {
        window.electronLib.fsManage.open(filePath);
        return true;
      }
      return false;
    }
    return false;
  }

  async openDirFromDownload(filePath: string): Promise<boolean> {
    if (filePath) {
      const existRes = await window.electronLib.fsManage.isExist(filePath);
      if (existRes) {
        window.electronLib.fsManage.show(filePath);
        return true;
      }
      return false;
    }
    return false;
  }

  selectFile(file: FileAttachModel): Promise<string> {
    if (this.systemApi.isElectron() && window.electronLib) {
      file = this.transferModel(file);
      return window.electronLib.windowManage
        .select({
          title: '保存',
          properties: ['promptToCreate', 'openDirectory'],
        })
        .then((re: FsSelectRes) => {
          if (re.success) {
            const path: string = Array.isArray(re.path) && re.path.length ? re.path[0] : re.path.toString();
            if (path) {
              const movePath = this.buildMovePath(file, path);
              return movePath;
            }
            return '';
          }
          return '';
        });
    }
    return Promise.reject(new Error('[file] selectFile not support'));
  }

  moveFilePath(file: FileAttachModel, re: string) {
    if (file.filePath) {
      window.electronLib.fsManage.move(file.filePath as string, re);
      file.filePath = re;
      this.storeFileInfo(file).then();
      return true;
    }
    return false;
  }

  async saveAs(file: FileAttachModel, conf: FileSaveAsConf): Promise<boolean> {
    if (this.systemApi.isElectron() && window.electronLib) {
      file = this.transferModel(file);

      const isFileExist = await this.testLocalFile(file);
      if (!isFileExist || !file.filePath) {
        return Promise.reject(new Error('[file] 本地文件不存在'));
      }

      const fileName = file.fileName.replace(/[:*|!$]+/gi, '_');
      const isSubAccount = this.mailConfApi.isSubAccount(file?._account);
      const { success, path } = await window.electronLib.windowManage.saveDialog({ fileName, openAsMainWindow: isSubAccount });
      if (success) {
        const fromPath = window.electronLib.fsManage.normalizePath(file.filePath);
        const toPath = window.electronLib.fsManage.normalizePath(path);
        const mode = conf?.mode || 'copy';
        if (mode === 'copy') {
          await window.electronLib.fsManage.copy(fromPath, toPath);
        } else {
          await window.electronLib.fsManage.move(fromPath, toPath);
        }
        if (conf?.saveStore) {
          file.filePath = toPath;
          this.storeFileInfo(file)
            .then()
            .catch(e => {
              console.error('[file] saveAs error when storeFileInfo', e);
            });
        }
        return true;
      }
      return false;
    }
    return Promise.reject(new Error('[file] saveAs not support'));
  }

  // 展示文件（打开父文件夹，锁定文件）
  show(file: FileAttachModel): Promise<boolean> {
    if (this.systemApi.isElectron() && window.electronLib) {
      file = this.transferModel(file);
      return this.testLocalFile(file).then(re => {
        if (re && file.filePath) {
          window.electronLib.fsManage.show(file.filePath);
          return true;
        }
        return false;
      });
    }
    return Promise.reject(new Error('[file] show not support'));
  }

  /**
   * @param filePath 目录路径
   * @returns boolean
   */
  openDir(filePath: string) {
    if (this.systemApi.isElectron() && window.electronLib) {
      const isExist = window.electronLib.fsManage.isExist(filePath);
      if (isExist) {
        window.electronLib.fsManage.show(filePath);
        return true;
      }
    }
    return false;
  }

  testLocalFile(file: FileAttachModel): Promise<boolean> {
    if (this.systemApi.isElectron() && window.electronLib) {
      if (file.filePath) {
        const b = window.electronLib.fsManage.isExist(file.filePath);
        return Promise.resolve(b);
      }
      file = this.transferModel(file);
      return this.getFileInfo(file).then((res: FileAttachModel[]) => {
        // if (re && re[0] && re[0].filePath) {
        //   Object.assign(file, re[0]);
        //   return window.electronLib.fsManage.isExist(re[0].filePath);
        // }
        const { re } = this.testLocalFiles(res);
        return re;
      });
    }
    return Promise.reject(new Error('[file] testLocalFile not support'));
  }

  commonPieceUploadConf = {
    contentType: 'stream',
    timeout: 20 * 60 * 1000,
  } as UploadPieceHandler;

  // 分片上传
  async uploadPieceByPiece(url: string, content: FileAttachModel, uploader: UploadPieceHandler): Promise<ApiResponse<any>> {
    const { file, fileName, fileSize } = content;
    const originOffset = uploader ? uploader?.offset || 0 : 0;
    const baseAttrs = {
      url,
      fileName,
      fileSize,
      func: 'uploadPieceByPiece',
      originOffset,
    };

    const startTime = new Date().getTime();
    const { firstUploadAction } = uploader;
    // 上传分片个数
    let uploadCount = 0;
    // 过半
    let over50 = !(originOffset / fileSize < 0.5);
    // 过9成
    let over90 = !(originOffset / fileSize < 0.9);

    if (!file) throw new Error('参数错误，上传的文件不存在');

    const headers = uploader.headers || {};
    headers['Content-Type'] = file.type + ';charset=UTF-8';

    let canceled = false;
    let httpCancel: ((op: LoadOperation) => void) | undefined;

    if (uploader && uploader.operatorSet) {
      uploader.operatorSet(operation => {
        if (operation === 'abort') {
          canceled = true;
          if (httpCancel) {
            httpCancel(operation);
          }
        }
      });
    }
    uploader.headers = headers;
    const confHolder: UploadPieceHandler | undefined = uploader;

    const loadAction: (cnf: UploadPieceHandler | undefined) => Promise<any> = async (cnf: UploadPieceHandler | undefined) => {
      let conf: UploadPieceHandler | undefined = cnf;
      if (!conf) return undefined;
      const start = uploader.offset;
      const count = uploader.sliceSize + uploader.offset > file.size ? file.size - uploader.offset : uploader.sliceSize;
      const slice = file?.slice(start, start + count);
      const isComplete = uploader.sliceSize + uploader.offset >= file.size;

      // 分片上传的特殊参数
      const reqConfig: any = {
        contentType: 'stream',
        headers: {
          'x-nos-token': uploader.token,
        },
        params: {
          offset: conf.offset,
          complete: isComplete,
          context: conf.context,
          version: '1.0',
        },
      };

      const config = {
        ...this.commonPieceUploadConf,
        onUploadProgress: (ev: ProgressEvent) => {
          const pr = (start + ev.loaded) / (file?.size || 100000000);
          if (uploader && uploader.progressIndicator) {
            uploader.progressIndicator(pr);
          }
        },
        operator: (handler: (operation: LoadOperation) => void) => {
          httpCancel = handler;
        },
        ...reqConfig,
        ...conf,
      };

      // 需要将 blob 的 slice，转换成 arrayBuffer
      const arrayBufferSlice = await slice.arrayBuffer();
      const res: ApiResponse<any> = await this.httpApi.post(config.url || url, arrayBufferSlice, config);
      const { status, data } = res;
      // 上传成功
      if (status === 200 && data) {
        // 首片上传
        if (uploadCount === 0 && firstUploadAction) {
          firstUploadAction(data);
        }
        uploadCount += 1;
        const { offset } = data;
        const curProgress = offset / fileSize;
        try {
          // 过半
          if (curProgress > 0.5 && !over50) {
            over50 = true;
            this.performanceApi.point({
              statKey: 'mail_attachment_uploading',
              statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---50`),
              value: new Date().getTime() - startTime,
              valueType: 1,
              params: baseAttrs,
            });
          }
          // 过90%
          if (curProgress > 0.9 && !over90) {
            over90 = true;
            this.performanceApi.point({
              statKey: 'mail_attachment_uploading',
              statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---90`),
              value: new Date().getTime() - startTime,
              valueType: 1,
              params: baseAttrs,
            });
          }
          if (offset >= fileSize) {
            this.performanceApi.point({
              statKey: 'mail_attachment_uploading',
              statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---100`),
              value: new Date().getTime() - startTime,
              valueType: 1,
              params: baseAttrs,
            });
          }
        } catch (error) {
          console.log('mail_attachment_uploading error', error);
        }
      }

      // 未取消
      if (!res.config?.canceled) {
        content.fileStatus = 'uploaded';
        uploader.status = 'uploading';
        if (canceled) {
          res.config.canceled = true;
          return res;
        }
        if (!res.config.canceled) {
          conf = uploader.nextUploader(res);
          if (conf) {
            content.uploadContext = conf.context;
            content.uploadOffset = conf.offset;
            content.originOffset = originOffset;
            console.log('continue uploaded:' + res.uri, conf);
            return loadAction(conf);
          }
          console.log('successfully uploaded:' + res.uri, conf);
        }
      }
      return res;
    };
    // 递归调用分片上传
    try {
      if (!originOffset) {
        this.performanceApi.point({
          statKey: 'mail_attachment_uploading',
          statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---0`),
          value: 0,
          valueType: 1,
          params: baseAttrs,
        });
      }
    } catch (error) {
      console.log('mail_attachment_uploading error', error);
    }

    const result = loadAction(confHolder);

    return result || Promise.reject(new Error('[file] uploadPieceByPiece 未知错误'));
  }

  // 整体上传
  upload(url: string, content: FileAttachModel, uploader: undefined | LoaderActionConf): Promise<ApiResponse<any>> {
    const { file, fileName, fileSize } = content;
    const originOffset = uploader ? uploader?.offset || 0 : 0;
    const baseAttrs = {
      url,
      fileName,
      fileSize,
      func: 'upload',
      originOffset,
    };
    if (!file) {
      throw new Error('参数错误，上传的文件不存在');
    }
    const startTime = new Date().getTime();
    // 过半
    let over50 = !(originOffset / fileSize < 0.5);
    // 过9成
    let over90 = !(originOffset / fileSize < 0.9);
    const headers = uploader?.headers || {};
    headers['Content-Type'] = file.type;
    try {
      if (!originOffset) {
        this.performanceApi.point({
          statKey: 'mail_attachment_uploading',
          statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---0`),
          value: 0,
          valueType: 1,
          params: baseAttrs,
        });
      }
    } catch (error) {
      console.log('mail_attachment_uploading error', error);
    }

    return this.httpApi
      .post(url, file, {
        contentType: 'stream',
        onUploadProgress: (ev: ProgressEvent) => {
          const { loaded, total } = ev;
          const curProgress = loaded / total;
          try {
            // 过半
            if (curProgress > 0.5 && !over50) {
              over50 = true;
              this.performanceApi.point({
                statKey: 'mail_attachment_uploading',
                statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---50`),
                value: new Date().getTime() - startTime,
                valueType: 1,
                params: baseAttrs,
              });
            }
            // 过90%
            if (curProgress > 0.9 && !over90) {
              over90 = true;
              this.performanceApi.point({
                statKey: 'mail_attachment_uploading',
                statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---90`),
                value: new Date().getTime() - startTime,
                valueType: 1,
                params: baseAttrs,
              });
            }
            if (loaded >= fileSize) {
              this.performanceApi.point({
                statKey: 'mail_attachment_uploading',
                statSubKey: this.systemApi.md5(`${fileName}---${fileSize}---100`),
                value: new Date().getTime() - startTime,
                valueType: 1,
                params: baseAttrs,
              });
            }
          } catch (error) {
            console.log('mail_attachment_uploading error', error);
          }

          const pr = (loaded * 1.0) / (file?.size || 100000000);
          if (uploader && uploader.progressIndicator) {
            uploader.progressIndicator(pr);
          }
        },
        headers,
        operator: uploader && uploader.operatorSet,
        timeout: 20 * 60 * 1000,
        ...uploader,
      })
      .then((res: ApiResponse) => {
        if (!res.config?.canceled && res.status >= 200 && res.status <= 206) {
          content.fileStatus = 'uploaded';
          return res;
        }
        return res;
      });
  }

  // 上传文件
  uploadFile(file: FileAttachModel) {
    const fileFormData = new FormData();
    fileFormData.append('file', file.file as any, file.fileName);
    fileFormData.append('type', 'signature');
    const url = this.systemApi.getUrl('uploadFile');
    return this.httpApi.post(url, fileFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        accept: '*/*',
      },
      timeout: 20 * 60 * 1000,
      contentType: 'stream',
    });
    // .then(res =>
    // if (!res.config?.canceled && res.status >= 200 && res.status <= 206) {
    //   file.fileStatus = 'uploaded';
    //   return this.storeFileInfo(file).then(() => {
    //     return res;
    //   });
    // } else {
    //   return res;
    // }
    // res);
  }

  saveTmpFile(files: FileAttachModel[]): Promise<FileAttachModel[]> {
    console.log(files);
    throw new Error('');
  }

  registerTmpFile(file: FileAttachModel): FileAttachModel {
    const { key } = this.getFileKey(file);
    let id: number;
    if (key in this.fileIndex) {
      id = this.fileIndex[key];
    } else {
      id = -this.store.addOb(file);
      this.fileIndex[key] = id;
    }
    file.fid = id;
    return file;
  }

  getAttachmentZipPath(mid: string): Promise<string> {
    return this.fileDb.dbApi.getById(mailTable.status, mid).then(re => re?.attachmentsZipPath || '');
  }

  getFileInfo(file: FileAttachModel): Promise<FileAttachModel[]> {
    const fileKey = this.getFileKey(file);
    return this.fileDb.get(fileKey.key, fileKey.field, file._account).then((re: FileAttachModel[]) => {
      let res;
      if (re && re.length >= 1) {
        // 多个文件记录时，返回最后一个文件.
        res = re[re.length - 1];
        // file.fid = res.fid;
      }
      console.log('getFileInfo', res, re);
      return res ? [res] : re;
    });
  }

  getFileInfoByFileName(fileName: string): Promise<FileAttachModel[]> {
    if (!fileName) {
      return Promise.resolve([]);
    }
    let name = '';
    let ext = '';
    const fileNameArr = fileName?.split('.');
    if (fileNameArr.length > 1) {
      name = fileNameArr[fileNameArr.length - 2];
      ext = fileNameArr[fileNameArr.length - 1];
    } else {
      name = fileName;
    }
    return this.fileDb.dbApi
      .getByRangeCondition({
        dbName: 'fileop',
        tableName: 'file',
        adCondition: {
          type: 'startsWithIgnoreCase',
          field: 'fileName',
          args: [name],
        },
      })
      .then(re => {
        let res;
        if (re && re.length >= 1) {
          res = ext ? re.filter(item => item.fileName.endsWith(ext)) : re;
        }
        console.log('getFileInfoByFileName', res, re);
        return res as unknown as FileAttachModel[];
      });
  }

  storeFileInfo(file: FileAttachModel, update = false): Promise<FileAttachModel> {
    // const fileKey = this.getFileKey(file);
    return this.getFileInfo(file).then((re: FileAttachModel[]) => {
      const targetFile: FileAttachModel =
        update && re && re.length === 1
          ? {
              ...re[0],
              ...file,
            }
          : file;
      // if (re && re.length == 1) file.fid = re[0].fid;
      console.log('got file related ', targetFile, re);
      return this.fileDb.put(targetFile).then(rs => {
        console.log('file stored:', rs);
        return rs;
      });
    });
    // const key: string = this.getFileKey(file);
    // let id: number;
    // if (key in this.fileIndex) {
    //   id = this.fileIndex[key];
    // } else {
    //   id = this.store.addOb(file);
    //   this.fileIndex[key] = id;
    // }
    // file.fid = id;
  }

  delFileInfo(file: FileAttachModel) {
    if (file.fid && file.fileUrl) {
      this.fileDb.del(file.fid, file._account);
      this.clearFsDownloadStatus(file.fileUrl);
    } else {
      console.error('[file] delFileInfo no fid', file);
    }
  }

  async delAttachmentZipPath(mid: string) {
    const mailStatus = await this.fileDb.dbApi.getById(mailTable.status, mid);
    if (mailStatus) {
      mailStatus.attachmentsZipPath = '';
      await this.fileDb.dbApi.put(mailTable.status, mailStatus);
    }
  }

  getFileKey(file: FileAttachModel): { key: string | number; field: keyof FileAttachModel } {
    if (file.fid && file.fid > 0) {
      return {
        key: file.fid,
        field: 'fid',
      };
    }
    if (file.fileOriginUrl) {
      return {
        key: file.fileOriginUrl,
        field: 'fileOriginUrl',
      };
    }
    if (file.fileUrl) {
      return {
        key: file.fileUrl,
        field: 'fileUrl',
      };
    }
    if (file.fileMd5 && file.fileMd5.length > 10) {
      return {
        key: file.fileMd5,
        field: 'fileMd5',
      };
    }
    if (file.fileSourceKey) {
      return {
        key: file.fileSourceKey,
        field: 'fileSourceKey',
      };
    }
    if (file.filePath) {
      return {
        key: file.filePath,
        field: 'filePath',
      };
    }
    throw new Error('no identified field');
  }

  private buildMovePath(file: FileAttachModel, path: string) {
    const home = window.electronLib.env.isMac ? '/Downloads' : '\\Downloads';
    if (file && file.fileName) {
      return window.electronLib.env.isMac ? path + '/' + file.fileName : path + '\\' + file.fileName;
    }
    if (file && file.filePath && path) {
      let indexOf = file.filePath.lastIndexOf('/');
      if (indexOf < 0) {
        indexOf = file.filePath.lastIndexOf('\\');
      }
      if (indexOf < 0) {
        return home;
        // throw new Error('文件路径异常');
      }
      return path + file.filePath.substring(indexOf);
    }
    // throw new Error('文件路径为空');
    return home;
  }

  private async asyncPool(params: { num: number; infos: any[]; func: any; conf?: FileLoaderActionConf }) {
    const { num, infos, func, conf } = params;

    const result: any[] = [];
    let count = 0;
    const infosLength = infos.length;
    return new Promise((resolve, reject) => {
      const next = () => {
        count += 1;
        func(infos.shift(), conf)
          .then((res: any) => {
            result.push(res);
            if (infos.length > 0) {
              next();
            } else if (result.length === infosLength) {
              resolve(result);
            }
          })
          .catch((err: any) => {
            reject(err);
          });
      };
      while (count < num && infos.length > 0) {
        next();
      }
    });
  }
}

const fileApi: FileApi = new FileApiImp();
api.registerFileApi(fileApi);

export default fileApi;
