import { EventEmitter } from 'events';
import { BASE_URL } from './consts';

const NosUploadHost = 'wanproxy-web.127.net';

export interface ResponseNSUploadInfo {
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

function getUploadToken(options: { fileName: string }) {
  return fetch(`${BASE_URL}/sns-server/api/biz/upload/get_upload_token?fileName=${encodeURIComponent(options.fileName || '')}`)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        return res.data;
      }
      throw new Error(res.message);
    });
}

// class EventEmitter {
//   events: Record<string, Array<Function>> = {};
//   on(event: string, listener: Function) {
//     if (!this.events[event]) {
//       this.events[event] = [];
//     }
//     this.events[event].push(listener);
//     return this;
//   }
//   off(event: string, listener?: Function) {
//     if (!this.events[event]) {
//       return this;
//     }
//     if (listener === undefined) {
//       delete this.events[event];
//     } else {
//       const idx = this.events[event].indexOf(listener);
//       idx > -1 && this.events[event].splice(idx, 1);
//     }
//     return this;
//   }
//   emit(event: string, ...data: any[]) {
//     const copy = [...this.events[event]];
//     copy.forEach(fn => fn(...data));
//     return this;
//   }
// }
export class NosUploader extends EventEmitter {
  file: File;

  status: UploadFileStatus = UploadFileStatus.INIT;

  id: string;

  fileSize: number; // bytes

  uploadSpeed?: string;

  hash: string;

  progress?: number;

  private sliceUploadStartTime?: number;

  private offset: number;

  uploadInfo?: ResponseNSUploadInfo;

  private fileReader?: FileReader;

  sliceSize = 2 * 1024 * 1024;

  abortController?: AbortController;

  constructor(file: File, hash: string = '', sliceSize?: number) {
    super();
    this.file = file;
    // this._setStatus(UploadFileStatus.UPLOADING);;
    this.hash = hash;

    this.id = hash + Date.now();
    this.fileSize = file.size;
    this.offset = 0;
    this.progress = 0;
    this.sliceUploadStartTime = Date.now();
    if (sliceSize) {
      this.sliceSize = sliceSize;
    }
  }

  startUpload() {
    const option = {
      fileName: this.file.name,
      fileSize: this.file.size,
    };
    getUploadToken(option)
      .then(data => {
        this.uploadInfo = data as unknown as ResponseNSUploadInfo;
        console.log('uploadToken', data);
        this.fileReader = new FileReader();
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this._setStatus(UploadFileStatus.FAIL);
          this.emit('error', e);
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
    this.abortController && this.abortController.abort();
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
    this._setStatus(UploadFileStatus.DONE);
    this.emit('complete', this.uploadInfo);
    return this.uploadInfo;
  }

  private uploadSlice(slice: ArrayBuffer) {
    const { offset, status, uploadInfo } = this;
    if (!slice || !uploadInfo) return;
    if (status !== UploadFileStatus.UPLOADING) return;
    const { bucketName, nosKey, context = '', token } = uploadInfo;
    const isComplete = slice.byteLength + offset === this.file.size;
    const uploadUrl = `https://${NosUploadHost}/${bucketName}/${nosKey}`;
    this.abortController = new AbortController();
    // const config: AxiosRequestConfig = {
    //     headers: {
    //         'x-nos-token': token,
    //         ContentType: this.file.type,
    //     },
    //     timeout: 2 * 60 * 1000,
    //     params: {
    //         offset,
    //         complete: isComplete,
    //         context,
    //         version: '1.0',
    //     },
    //     onUploadProgress: (ev: ProgressEvent) => {
    //         const pos = this.offset + ev.loaded;
    //         this.progress = +((pos * 100) / this.file.size).toFixed(1);
    //         // const now = Date.now();
    //         // this.uploadSpeed =
    //         //     formatFileSize(
    //         //         (slice.byteLength * 1000) / (now - (this.sliceUploadStartTime || 0))
    //         //     ) + '/s';
    //         // this.sliceUploadStartTime = now;
    //         // this.emit('progress', { loaded: pos, progress: this.progress, speed: this.uploadSpeed });
    //     },
    //     cancelToken: this.cancelToken.token
    // };
    const params = new URLSearchParams({
      offset: offset.toString(),
      complete: String(isComplete),
      context,
      version: '1.0',
    }).toString();
    fetch(uploadUrl + '?' + params, {
      method: 'POST',
      body: slice,
      headers: {
        'x-nos-token': token,
        ContentType: this.file.type,
      },
      signal: this.abortController.signal,
    })
      .then(res => res.json())
      .then(ret => {
        console.log('upload to', uploadUrl, offset, offset + slice.byteLength, ret);
        if (isComplete) {
          this.completeUpload();
        } else {
          (this.uploadInfo as ResponseNSUploadInfo).context = ret.context;
          this.offset = ret.offset;
          this.uploadNext();
        }
      })
      .catch(_ => {
        this._setStatus(UploadFileStatus.FAIL);
        this.emit('error', _);
      });
  }

  uploadNext() {
    const blobSlice = File.prototype.slice;
    console.log('uploadSlice', this.offset, this.offset + this.sliceSize);
    this.fileReader?.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + this.sliceSize));
  }

  private _setStatus(status: UploadFileStatus) {
    if (this.status !== status) {
      const oldStatus = status;
      this.status = status;
      this.emit('statusChange', status, oldStatus);
    }
  }
}
