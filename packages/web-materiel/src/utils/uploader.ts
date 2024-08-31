import { EventEmitter } from 'events';
import { apis, apiHolder, ApiRequestConfig, MaterielApi, MaterielUploadInfo } from 'api';
import { formatFileSize, toFixed } from '@web-common/utils/file';

const httpApi = apiHolder.api.getDataTransApi();
const NosUploadHost = 'nosup-hz1.127.net';
const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;

export enum UploadStatus {
  INIT = 0,
  UPLOADING,
  DONE,
  FAIL,
  PAUSE,
  CANCEL,
}

const getUploadToken = (options: { fileName: string }) => {
  return materielApi.getUploadToken({ fileName: options.fileName });
};

export class Uploader extends EventEmitter {
  file: File;
  status: UploadStatus = UploadStatus.INIT;
  id: string;
  fileSize: number; // bytes
  uploadSpeed?: string;
  hash: string;
  progress?: number;
  private sliceUploadStartTime?: number;
  private offset: number;
  uploadInfo?: MaterielUploadInfo;
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
    this._setStatus(UploadStatus.UPLOADING);
    setTimeout(() => {
      this.emit('start', { id: this.id });
    });
    getUploadToken(option)
      .then(data => {
        this.uploadInfo = data as unknown as MaterielUploadInfo;
        console.log('uploadToken', data);
        this.fileReader = new FileReader();
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this._setStatus(UploadStatus.FAIL);
        };
        this.uploadNext();
      })
      .catch(e => {
        this._setStatus(UploadStatus.FAIL);
        this.emit('error', e);
      });
  }

  cancelUpload() {
    if (this.status === UploadStatus.UPLOADING) {
      this._setStatus(UploadStatus.CANCEL);
      this.emit('cancel');
    }
  }

  private completeUpload() {
    materielApi
      .getDownloadUrl({
        fileName: this.file.name,
        nosKey: this.uploadInfo!.nosKey,
      })
      .then(downloadUrl => {
        if (this.status === UploadStatus.UPLOADING) {
          this._setStatus(UploadStatus.DONE);
          this.emit('complete', { downloadUrl });
        }
      })
      .catch(() => {
        this.emit('error');
      });
  }

  private uploadSlice(slice: ArrayBuffer) {
    const { offset, status, uploadInfo } = this;
    if (!slice || !uploadInfo) return;
    if (status !== UploadStatus.UPLOADING) return;
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
        if (this.status !== UploadStatus.UPLOADING) return;
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
            if (this.status === UploadStatus.UPLOADING) {
              this.completeUpload();
            }
          } else {
            const data: any = ret.data;
            (this.uploadInfo as MaterielUploadInfo).context = data.context;
            this.offset = data.offset;
            this.uploadNext();
          }
        } else {
          this._setStatus(UploadStatus.FAIL);
          this.emit('error');
        }
      })
      .catch(_ => {
        this._setStatus(UploadStatus.FAIL);
        this.emit('error');
      });
  }

  uploadNext() {
    const blobSlice = File.prototype.slice;
    console.log('uploadSlice', this.offset, this.offset + this.sliceSize);
    this.fileReader.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + this.sliceSize));
  }

  private _setStatus(status: UploadStatus) {
    if (this.status !== status) {
      const oldStatus = this.status;
      this.status = status;
      this.emit('statusChange', status, oldStatus);
    }
  }
}
