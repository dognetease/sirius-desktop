import {
  CustomerApi,
  NetStorageApi,
  NetStorageShareApi,
  NetStorageType,
  NSFileContent,
  RequestNSUploadInfo,
  ResFinishNosUpload,
  ResNosToken,
  ResponseAttachmentUploadToken,
} from 'api';
import { formatFileSize, getFileExt, toFixed } from '@web-common/utils/file';
import { apiHolder, ApiRequestConfig, apis, LoadOperation, ResponseNSUploadInfo } from 'api';
import EventEmitter from 'events';
import { normalizeShareUrl } from '@web-disk/utils';

const systemApi = apiHolder.api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const AttachmentUploadHost = 'wanproxy-web.127.net';

export enum UploadFileStatus {
  INIT = 0,
  UPLOADING,
  DONE,
  FAIL,
  PAUSE,
  CANCEL,
}

export class DiskFileUpload extends EventEmitter {
  file: File;
  status: UploadFileStatus = UploadFileStatus.INIT;
  id: string;
  dirId?: number;
  fileType: string;
  fileSize: number; // bytes
  uploadSpeed?: string;
  md5: string;
  progress?: number;
  private sliceUploadStartTime?: number;
  private offset: number;
  uploadInfo?: ResponseNSUploadInfo;
  private fileReader: FileReader;
  sliceSize = 2 * 1024 * 1024;
  private _httpCancelHandler: (k: LoadOperation) => void = function () {};
  completeData: NSFileContent | null = null;
  diskType = 'personal' as NetStorageType;

  constructor(file: File, dirId?: number, sliceSize?: number) {
    super();
    const md5 = systemApi.md5(file.name + file.size);
    this.file = file;
    this._setStatus(UploadFileStatus.UPLOADING);
    this.md5 = md5;
    this.id = md5 + Date.now();
    this.dirId = dirId;
    this.fileType = getFileExt(file.name);
    this.fileSize = file.size;
    this.offset = 0;
    this.progress = 0;
    this.sliceUploadStartTime = Date.now();
    this.fileReader = new FileReader();
    if (sliceSize) {
      this.sliceSize = sliceSize;
    }
  }

  startUpload() {
    const option: RequestNSUploadInfo = {
      fileName: this.file.name,
      fileSize: this.file.size,
      type: this.diskType,
      dirId: this.dirId,
      md5: this.md5,
    };
    diskApi
      .doGetNSUploadInfo(option)
      .then(data => {
        this.uploadInfo = data;
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this._setStatus(UploadFileStatus.FAIL);
        };
        this._setStatus(UploadFileStatus.UPLOADING);
        this.uploadNext();
      })
      .catch(e => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', e);
      });
  }

  cancelUpload() {
    this._setStatus(UploadFileStatus.CANCEL);
    this._httpCancelHandler && this._httpCancelHandler('abort');
  }

  continueUpload() {
    if (this.status === UploadFileStatus.UPLOADING) return;
    if (!this.uploadInfo) {
      this.startUpload();
    } else {
      this.uploadNext();
    }
  }

  private completeUpload() {
    const { fileId, nosKey } = this.uploadInfo as ResponseAttachmentUploadToken;
    const finishOption = {
      dirId: this.dirId,
      fileId,
      nosKey,
      fileSize: this.file.size,
      type: this.diskType,
      fileName: this.file.name,
    };
    diskApi
      .doSetNSUploadFinish(finishOption)
      .then(data => {
        this.completeData = data;
        this.progress = 100;
        this.emit('progress', { loaded: this.file.size, progress: 100 });
        this.emit('uploadFinish', data);
        this._setStatus(UploadFileStatus.DONE);
      })
      .catch(e => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', e);
      });
  }

  private uploadSlice(slice: ArrayBuffer) {
    const { offset, status, uploadInfo } = this;
    if (!slice || !uploadInfo) return;
    if (status !== UploadFileStatus.UPLOADING) return;

    const { bucketName, nosKey, context = '', token } = uploadInfo;
    const isComplete = slice.byteLength + offset === this.file.size;
    const uploadUrl = `https://${AttachmentUploadHost}/${bucketName}/${nosKey}`;
    const config: ApiRequestConfig = {
      contentType: 'stream',
      headers: {
        'x-nos-token': token,
      },
      params: {
        offset,
        complete: isComplete,
        context,
        version: '1.0',
      },
      onUploadProgress: (ev: ProgressEvent) => {
        const pos = this.offset + ev.loaded;
        this.progress = toFixed((pos * 100) / this.file.size, 1);
        const now = Date.now();
        this.uploadSpeed = formatFileSize((slice.byteLength * 1000) / (now - (this.sliceUploadStartTime || 0))) + '/s';
        this.sliceUploadStartTime = now;
        this.emit('progress', { loaded: pos, progress: this.progress, speed: this.uploadSpeed });
      },
      operator: handler => {
        this._httpCancelHandler = handler;
      },
    };
    httpApi
      .post(uploadUrl, slice, config)
      .then(ret => {
        if (ret.status === 200) {
          if (isComplete) {
            this.completeUpload();
          } else {
            const data: any = ret.data;
            (this.uploadInfo as ResponseNSUploadInfo).context = data.context;
            this.offset = data.offset;
            this.uploadNext();
          }
        } else {
          this._setStatus(UploadFileStatus.FAIL);
          this.emit('error');
        }
      })
      .catch(_ => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error');
      });
  }

  uploadNext() {
    const blobSlice = File.prototype.slice;
    this.fileReader.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + this.sliceSize));
  }

  private _setStatus(status: UploadFileStatus) {
    if (this.status !== status) {
      const oldStatus = status;
      this.status = status;
      this.emit('statusChange', status, oldStatus);
    }
  }
}

export class AttachmentFileUpload extends EventEmitter {
  file: File;
  status: UploadFileStatus = UploadFileStatus.INIT;
  id: string;
  fileType: string;
  fileSize: number; // bytes
  uploadSpeed?: string;
  progress?: number;
  private sliceUploadStartTime?: number;
  private offset: number;
  tokenInfo?: ResNosToken;
  private fileReader: FileReader;
  sliceSize = 2 * 1024 * 1024;
  private _httpCancelHandler: (k: LoadOperation) => void = function () {};
  completeData: ResFinishNosUpload | null = null;
  source = 'follow';

  constructor(file: File, source?: string, sliceSize?: number) {
    super();
    const md5 = systemApi.md5(file.name + file.size);
    this.file = file;
    this._setStatus(UploadFileStatus.UPLOADING);
    this.id = md5 + Date.now();
    this.fileType = getFileExt(file.name);
    this.fileSize = file.size;
    this.offset = 0;
    this.progress = 0;
    this.sliceUploadStartTime = Date.now();
    this.fileReader = new FileReader();
    if (sliceSize) {
      this.sliceSize = sliceSize;
    }
    if (source !== undefined) {
      this.source = source;
    }
  }

  startUpload() {
    customerApi
      .getNosUploadToken({
        fileName: this.file.name,
        source: this.source,
      })
      .then(data => {
        this.tokenInfo = data;
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this._setStatus(UploadFileStatus.FAIL);
        };
        this._setStatus(UploadFileStatus.UPLOADING);
        this.uploadNext();
      })
      .catch(e => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', e);
      });
  }

  cancelUpload() {
    this._setStatus(UploadFileStatus.CANCEL);
    this._httpCancelHandler && this._httpCancelHandler('abort');
  }

  continueUpload() {
    if (this.status === UploadFileStatus.UPLOADING) return;
    if (!this.tokenInfo) {
      this.startUpload();
    } else {
      this.uploadNext();
    }
  }

  private completeUpload() {
    const { nosKey } = this.tokenInfo as ResNosToken;
    const finishOption = {
      size: this.file.size,
      nos_key: nosKey,
      file_name: this.file.name,
      source: this.source,
    };
    customerApi
      .finishNosUpload(finishOption)
      .then(data => {
        this.completeData = data;
        this.progress = 100;
        this.emit('progress', { loaded: this.file.size, progress: 100 });
        this.emit('uploadFinish', data);
        this._setStatus(UploadFileStatus.DONE);
      })
      .catch(e => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', e);
      });
  }

  private uploadSlice(slice: ArrayBuffer) {
    const { offset, status, tokenInfo } = this;
    if (!slice || !tokenInfo) return;
    if (status !== UploadFileStatus.UPLOADING) return;

    const { bucketName, nosKey, token, context = '' } = tokenInfo;
    const isComplete = slice.byteLength + offset === this.file.size;
    const uploadUrl = `https://${AttachmentUploadHost}/${bucketName}/${nosKey}`;
    const config: ApiRequestConfig = {
      contentType: 'stream',
      headers: {
        'x-nos-token': token,
      },
      params: {
        offset,
        complete: isComplete,
        context,
        version: '1.0',
      },
      onUploadProgress: (ev: ProgressEvent) => {
        const pos = this.offset + ev.loaded;
        this.progress = toFixed((pos * 100) / this.file.size, 1);
        const now = Date.now();
        this.uploadSpeed = formatFileSize((slice.byteLength * 1000) / (now - (this.sliceUploadStartTime || 0))) + '/s';
        this.sliceUploadStartTime = now;
        this.emit('progress', { loaded: pos, progress: this.progress, speed: this.uploadSpeed });
      },
      operator: handler => {
        this._httpCancelHandler = handler;
      },
    };
    httpApi
      .post(uploadUrl, slice, config)
      .then(ret => {
        if (ret.status === 200) {
          if (isComplete) {
            this.completeUpload();
            console.log(ret.data);
          } else {
            const data: any = ret.data;
            (this.tokenInfo as ResNosToken).context = data.context;
            this.offset = data.offset;
            this.uploadNext();
          }
        } else {
          this._setStatus(UploadFileStatus.FAIL);
          this.emit('error');
        }
      })
      .catch(_ => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error');
      });
  }

  uploadNext() {
    const blobSlice = File.prototype.slice;
    this.fileReader.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + this.sliceSize));
  }

  private _setStatus(status: UploadFileStatus) {
    if (this.status !== status) {
      const oldStatus = status;
      this.status = status;
      this.emit('statusChange', status, oldStatus);
    }
  }
}

// const map: Record<string, {id: number}> = {}
// export const getFollowsDir = async (companyName) => {
//     if (map[companyName]) {
//         return map[companyName];
//     }
//     const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;
//     const rootDir = await customerApi.mkdirIfAbsent('外贸', -1);
//     const dir = await customerApi.mkdirIfAbsent(companyName, rootDir.id);
//     map[companyName] = dir;
//     return dir;
// }

export const previewDiskFile = (id: number) => {
  nsShareApi.getNSShareLink({ resourceId: id, resourceType: 'FILE' }).then(data => {
    if (data.shareUrl) {
      const shareUrl = normalizeShareUrl(data.shareUrl);
      if (systemApi.isElectron()) {
        systemApi.handleJumpUrl(-1, shareUrl);
      } else {
        systemApi.openNewWindow(shareUrl);
      }
    }
  });
};

export const previewNosFile = (id: string | number, type: string, sourceId: string) => {
  // 场景定义，前后端不一致
  const map: Record<string, string> = {
    customer: 'company',
    business: 'opportunity',
  };
  return customerApi.previewNosFile(String(id), map[type] || type, sourceId).then(url => {
    const shareUrl = normalizeShareUrl(url);
    if (systemApi.isElectron()) {
      systemApi.handleJumpUrl(-1, shareUrl);
    } else {
      systemApi.openNewWindow(shareUrl);
    }
  });
};

export const syncDocument = (id: string | number, type: string) => {
  // 场景定义，前后端不一致
  const map: Record<string, string> = {
    customer: 'company',
    business: 'opportunity',
  };
  return customerApi.syncDocument(String(id), map[type] || type);
};
