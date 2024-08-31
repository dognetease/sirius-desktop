import { EventEmitter } from 'events';
import { apis, apiHolder, ApiRequestConfig, WhatsAppApi } from 'api';
import { formatFileSize, toFixed } from '@web-common/utils/file';

export interface UploadInfo {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
}

export enum UploadFileStatus {
  INIT = 0,
  UPLOADING,
  DONE,
  FAIL,
  PAUSE,
  CANCEL,
}

const httpApi = apiHolder.api.getDataTransApi();
const NosUploadHost = 'wanproxy-web.127.net';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const getUploadToken = (options: { fileName: string }) => {
  return whatsAppApi.getNosUploadToken({ fileName: options.fileName });
};

export class Uploader extends EventEmitter {
  file: File;
  status: UploadFileStatus = UploadFileStatus.INIT;
  id: string;
  fileSize: number; // bytes
  uploadSpeed?: string;
  hash: string;
  progress?: number;
  private sliceUploadStartTime?: number;
  private offset: number;
  uploadInfo?: UploadInfo;
  private fileReader: FileReader = new FileReader();
  sliceSize = 2 * 1024 * 1024;
  abortController?: AbortController;

  constructor(file: File, hash?: string, sliceSize?: number) {
    super();
    this.file = file;
    this.hash = hash || '';
    this.id = this.hash + Date.now();
    this.fileSize = file.size;
    this.offset = 0;
    this.progress = 0;
    this.sliceUploadStartTime = Date.now();
    if (sliceSize) {
      this.sliceSize = sliceSize;
    }
    this.startUpload();
  }

  startUpload() {
    const option = {
      fileName: this.file.name,
      fileSize: this.file.size,
    };
    this._setStatus(UploadFileStatus.UPLOADING);
    setTimeout(() => {
      this.emit('start', { id: this.id });
    });
    getUploadToken(option)
      .then(data => {
        this.uploadInfo = data as unknown as UploadInfo;
        console.log('uploadToken', data);
        this.fileReader = new FileReader();
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this._setStatus(UploadFileStatus.FAIL);
        };
        this.uploadNext();
      })
      .catch(e => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', e);
      });
  }

  private completeUpload() {
    whatsAppApi
      .getNosDownloadUrl({
        fileName: this.file.name,
        nosKey: this.uploadInfo!.nosKey,
      })
      .then(downloadUrl => {
        this._setStatus(UploadFileStatus.DONE);
        this.emit('complete', { downloadUrl });
      })
      .catch(() => {
        this.emit('error');
      });
  }

  private uploadSlice(slice: ArrayBuffer) {
    const { offset, status, uploadInfo } = this;
    if (!slice || !uploadInfo) return;
    if (status !== UploadFileStatus.UPLOADING) return;
    const { bucketName, nosKey, context = '', token } = uploadInfo;
    const isComplete = slice.byteLength + offset === this.file.size;
    const uploadUrl = `https://${NosUploadHost}/${bucketName}/${nosKey}`;
    this.abortController = new AbortController();
    const config: ApiRequestConfig = {
      contentType: 'stream',
      headers: {
        'x-nos-token': token,
        'content-type': this.file.type,
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
    };
    httpApi
      .post(uploadUrl, slice, config)
      .then(ret => {
        if (ret.status === 200) {
          if (isComplete) {
            this.completeUpload();
          } else {
            const data: any = ret.data;
            (this.uploadInfo as UploadInfo).context = data.context;
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
    console.log('uploadSlice', this.offset, this.offset + this.sliceSize);
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
