import { apiHolder as api, apis, ConvertApi, ConvertTaskResponse, NetStorageShareApi, SystemApi, ConvertTaskStatus, NetStorageType } from 'api';
import { sleep } from '@web-common/components/util/async';
import { formatFileSize, getFileExt } from '@web-common/utils/file';
import { UploadFileStatus, IUploadFile } from './upload';
import { normalizeShareUrl } from './utils';
import { ImportResultReason } from './components/DiskHead/diskHead';
import { getIn18Text } from 'api';
const POLLING_INTERVAL = 5e3; // 轮询间隔
const CONVERT_TIMEOUT = 12e4; //
let cursor = 0;
const systemApi = api.api.getSystemApi() as SystemApi;
const convertApi = api.api.requireLogicalApi('convertApiImpl') as ConvertApi;
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
function getFileType(file: File): string {
  const ext = getFileExt(file.name);
  if (ext === 'docx') {
    return 'lxdoc';
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return 'lxxls';
  }
  return 'other';
}
export class UploadConvert implements IUploadFile {
  id: string;
  file: File;
  status: UploadFileStatus;
  fileType: string;
  fileSize: string;
  offset: number;
  dirId: number;
  diskType?: NetStorageType | undefined;
  failedReason?: string | undefined;
  progress: number;
  type: 'private' | 'public';
  // convert task id
  taskId?: string;
  // doc identity
  result?: ConvertTaskResponse;
  cb?: (task: IUploadFile) => void;
  cancelCb?: () => void;
  // 成功或失败的原因,用来埋点上报
  reason: string = '';
  successInfo?: string = '';
  constructor(file: File, type: 'private' | 'public', dirId: number, cb?: (task: IUploadFile) => void) {
    this.id = `upload-convert-${++cursor}`;
    this.file = file;
    this.status = UploadFileStatus.PAUSE;
    this.fileType = getFileType(file);
    this.fileSize = formatFileSize(file.size);
    this.offset = 0;
    this.type = type;
    this.dirId = dirId;
    this.progress = 0;
    this.cb = cb;
  }
  startUpload(): void {
    this.continueUpload();
  }
  continueUpload(): void {
    switch (this.status) {
      case UploadFileStatus.PAUSE:
      case UploadFileStatus.FAIL:
        this.upload();
        break;
      case UploadFileStatus.UPLOADING:
      case UploadFileStatus.CONVERTING:
      case UploadFileStatus.DONE:
      default:
        break;
    }
  }
  abortUpload(): void {
    if (this.cancelCb) {
      this.cancelCb();
    }
  }
  openFile() {
    if (!(this.status === UploadFileStatus.DONE && this.result)) return;
    nsShareApi.getNSShareLink({ resourceId: this.result.fileId, resourceType: 'FILE' }).then(data => {
      if (data.shareUrl) {
        const shareUrl = normalizeShareUrl(data.shareUrl);
        if (systemApi.isElectron()) {
          systemApi.handleJumpUrl(-1, shareUrl);
        } else {
          systemApi.openNewWindow(shareUrl);
        }
      }
    });
  }
  private async upload() {
    try {
      this.failedReason = undefined;
      this.result = undefined;
      this.status = UploadFileStatus.UPLOADING;
      this.cb?.(this);
      const fileType = getFileExt(this.file.name);
      if (this.type === 'private') {
        this.taskId = await convertApi.importPersonalDoc(this.file, fileType, this.file.name, this.dirId, (fn: any) => (this.cancelCb = fn));
      } else {
        this.taskId = await convertApi.importDoc(this.file, fileType, this.file.name, this.dirId, (fn: any) => (this.cancelCb = fn));
      }
      this.progress = 25;
      this.status = UploadFileStatus.CONVERTING;
      this.cb?.(this);
      this.poll();
    } catch (err: any) {
      // request canceled by user no need to set failedReason and changeState
      if (err.message === 'cancelled') {
        return;
      }
      this.status = UploadFileStatus.FAIL;
      this.reason = ImportResultReason.NetworkOrOther;
      if (err.message === 'timeout' || err.message === 'NETWORK.ERR.TIMEOUT') {
        this.failedReason = getIn18Text('QINGQIUCHAOSHI');
      } else if (err.data && !err.data.success && err.data.message) {
        this.failedReason = err.data.message;
        if (err.data.code === 10304) {
          this.reason = ImportResultReason.DiskLimit;
        }
      }
      this.cb?.(this);
    }
  }
  private async poll() {
    if (!this.taskId) {
      throw new Error('try to start polling without taskId');
    }
    // 虚假进度
    let polling = true;
    (async () => {
      while (this.progress < 99 && polling) {
        this.progress++;
        this.cb?.(this);
        await sleep(1000);
      }
    })();
    this.result = { status: ConvertTaskStatus.Waiting } as ConvertTaskResponse;
    const startTime = Date.now();
    while (this.result.status === ConvertTaskStatus.Waiting) {
      await sleep(POLLING_INTERVAL);
      if (Date.now() - startTime > CONVERT_TIMEOUT) {
        this.result.status = ConvertTaskStatus.Failed;
        this.result.failureReason = getIn18Text('ZHUANHUANCHAOSHI');
        return;
      }
      try {
        if (this.type === 'private') {
          this.result = await convertApi.checkPersonalConvertTask(this.taskId);
        } else {
          this.result = await convertApi.checkConvertTask(this.taskId);
        }
      } catch (err) {
        console.error(err);
        this.result.status = ConvertTaskStatus.Failed;
        this.result.failureReason = getIn18Text('WANGLUOCUOWU');
        break;
      }
    }
    // 终止读条
    polling = false;
    if (this.result.status === ConvertTaskStatus.Completed) {
      this.progress = 100;
      this.status = UploadFileStatus.DONE;
      if (this.result.failureReason?.includes(getIn18Text('JIEDUAN'))) {
        this.successInfo = this.result.failureReason;
        this.reason = ImportResultReason.CellLimit;
      } else {
        this.reason = ImportResultReason.Success;
      }
    } else {
      this.status = UploadFileStatus.FAIL;
      this.failedReason = this.result.failureReason || getIn18Text('WEIZHICUOWU');
      this.reason = ImportResultReason.NetworkOrOther;
    }
    this.cb?.(this);
  }
}
