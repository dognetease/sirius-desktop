import { config } from 'env_def';
import { api } from '../../../api/api';
import { Api } from '../../../api/_base/api';
import { ConvertApi, ConvertMailAttachment2DocParams, ConvertTaskResponse } from '../../../api/logical/convert';
import { apis } from '../../../config';
import { DataTransApi, ResponseData, LoadOperation, constHttpCanceledToken } from '../../../api/data/http';
import { SystemApi } from '../../../api/system/system';
import { locationHelper } from '@/api/util/location_helper';

class ConvertApiImpl implements ConvertApi {
  name: string;

  http: DataTransApi;

  systemApi: SystemApi;

  constructor() {
    this.name = apis.convertApiImpl;
    this.http = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
  }

  init() {
    return this.name;
  }

  async convertMailAttachment2Doc(params: ConvertMailAttachment2DocParams) {
    const user = this.systemApi.getCurrentUser();

    const res = await this.http.post(
      this.systemApi.getUrl('covertMailAttachment2Doc'),
      {
        ...params,
        uid: user?.id,
        sid: user?.sessionId,
      },
      { noEnqueue: true }
    );

    const data = res.data as ResponseData<{ taskId: string }>;

    return data.data!.taskId;
  }

  async convertFile2Doc(fileId: number, dirId: number) {
    const res = await this.http.post(
      this.systemApi.getUrl('convertFile2Doc'),
      { fileId, dirId },
      {
        noEnqueue: true,
        timeout: 1000 * 60 * 2,
      }
    );

    const data = res.data as ResponseData<{ taskId: string }>;

    return data.data!.taskId;
  }

  async convertPersonalFile2Doc(fileId: number, dirId: number) {
    const res = await this.http.post(
      this.systemApi.getUrl('convertPersonalFile2Doc'),
      { fileId, dirId },
      {
        noEnqueue: true,
        timeout: 1000 * 60 * 2,
      }
    );

    const data = res.data as ResponseData<{ taskId: string }>;

    return data.data!.taskId;
  }

  async getMailAttachmentDocCovertStatus(taskId: string) {
    const res = await this.http.get(this.systemApi.getUrl('getMailAttachmentDocCovertStatus'), { taskId }, { noEnqueue: true });
    const data = res.data as ResponseData<ConvertTaskResponse>;
    return data.data!;
  }

  async importDoc(file: File, docType: string, fileName: string, dirId: number, getCancelFn: (fn: any) => void = () => {}): Promise<string> {
    const formdata = new FormData();
    formdata.append('file', file);
    formdata.append('docType', docType);
    formdata.append('fileName', fileName || file.name);
    formdata.append('dirId', `${dirId}`);
    const res = await this.http
      .post(this.systemApi.getUrl('importDoc'), formdata, {
        noEnqueue: true,
        contentType: 'arraybuffer',
        headers: {
          contentType: 'multipart/form-data',
        },
        timeout: 1000 * 60 * 2,
        operator: (handler: (operation: LoadOperation) => void) => {
          getCancelFn(handler.bind(null, 'abort'));
        },
      })
      .catch((err: any) => {
        // http_impl will throw some message string
        if (typeof err === 'string') {
          throw new Error(err);
        }
        if (err.message.includes(constHttpCanceledToken)) {
          throw new Error('cancelled');
        }
        throw err;
      });
    const data = res.data as ResponseData<{ taskId: string }>;
    return data.data!.taskId;
  }

  async checkConvertTask(taskId: string): Promise<ConvertTaskResponse> {
    const res = await this.http.get(
      this.systemApi.getUrl('checkConvertTask'),
      { taskId },
      {
        noEnqueue: true,
        timeout: 1000 * 60 * 2,
      }
    );
    const data = res.data as ResponseData<ConvertTaskResponse>;
    return data.data!;
  }

  async importPersonalDoc(file: File, docType: string, fileName: string, dirId: number, getCancelFn: (fn: any) => void = () => {}): Promise<string> {
    const formdata = new FormData();
    formdata.append('file', file);
    formdata.append('docType', docType);
    formdata.append('fileName', fileName || file.name);
    formdata.append('dirId', `${dirId}`);
    const res = await this.http
      .post(this.systemApi.getUrl('importPersonalDoc'), formdata, {
        noEnqueue: true,
        contentType: 'arraybuffer',
        headers: {
          contentType: 'multipart/form-data',
        },
        timeout: 1000 * 60 * 2,
        operator: (handler: (operation: LoadOperation) => void) => {
          getCancelFn(handler.bind(null, 'abort'));
        },
      })
      .catch((err: any) => {
        // http_impl will throw some message string
        if (typeof err === 'string') {
          throw new Error(err);
        }
        if (err.message && err.message.includes(constHttpCanceledToken)) {
          throw new Error('cancelled');
        }
        throw err;
      });
    const data = res.data as ResponseData<{ taskId: string }>;
    return data.data!.taskId;
  }

  async checkPersonalConvertTask(taskId: string): Promise<ConvertTaskResponse> {
    const res = await this.http.get(
      this.systemApi.getUrl('checkPersonalConvertTask'),
      { taskId },
      {
        noEnqueue: true,
        timeout: 1000 * 60 * 2,
      }
    );
    const data = res.data as ResponseData<ConvertTaskResponse>;
    return data.data!;
  }

  getFileURL(task: ConvertTaskResponse): string {
    const type = task.fileType === 'excel' ? 'sheet' : 'doc';
    const host = process.env.BUILD_ISELECTRON ? config('host') : `https://${locationHelper.getHost()}`;
    return `${host}${config('contextPath')}/${type}/#id=${task.fileId}&parentResourceId=${task.dirId}&spaceId=${task.spaceId}&ref=${task.userId}&from=PERSONAL`;
  }
}

const convertApiImpl: Api = new ConvertApiImpl();
api.registerLogicalApi(convertApiImpl);
export default convertApiImpl;
