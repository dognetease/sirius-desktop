import { ResponseAttachmentUploadToken } from 'api';
import { formatFileSize, getFileExt, toFixed } from '@web-common/utils/file';
import { apiHolder, ApiRequestConfig, apis, EdmSendBoxApi, LoadOperation, ResponseNSUploadInfo } from 'api';
import EventEmitter from 'events';

const systemApi = apiHolder.api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const AttachmentUploadHost = 'wanproxy-web.127.net';

export enum UploadFileStatus {
  INIT = 0,
  UPLOADING,
  DONE,
  FAIL,
  PAUSE,
  CANCEL,
}

export class AttachmentUploader extends EventEmitter {
  file: File;
  status: UploadFileStatus = UploadFileStatus.INIT;
  id: string;
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
  completeData: { downloadUrl: string } | null = null;

  constructor(file: File, sliceSize?: number) {
    super();
    const md5 = systemApi.md5(file.name + file.size);
    this.file = file;
    this._setStatus(UploadFileStatus.UPLOADING);
    this.md5 = md5;
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
  }

  startUpload() {
    const option = {
      fileName: this.file.name,
      fileSize: this.file.size,
      md5: this.md5,
    };
    edmApi
      .getAttachmentUploadToken(option)
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
      this._setStatus(UploadFileStatus.UPLOADING);
      this.uploadNext();
    }
  }

  private completeUpload() {
    const { fileId, nosKey } = this.uploadInfo as ResponseAttachmentUploadToken;
    const finishOption = {
      fileId,
      nosKey,
      fileSize: this.file.size,
    };
    edmApi
      .attachmentFinishUpload(finishOption)
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
      timeout: 2 * 60 * 1000,
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
