import {
  AiHostingApi,
  ContactStatusReq,
  ContactStatusRes,
  DeleteContactReq,
  SwitchContactReq,
  ContactListReq,
  ContactDetailStatReq,
  ContactDetailListReq,
  ContactListRes,
  ContactDetailStatRes,
  ContactDetailListRes,
  AddContactReq,
  ReplyContactListReq,
  ReplyContactListRes,
} from '@/api/logical/ai_hosting';
import { HostingPlanListModel, EmailTemplatesResModel, SavePlanReqModel, DelPlanReqModel } from '@/api/logical/edm_marketing';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

export class AiHostingApiImpl implements AiHostingApi {
  name = apis.aiHostingApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req: any, config?: ApiRequestConfig) {
    const param = {
      ...req,
    };
    try {
      const { data } = await this.http.get(url, param, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, reqConfig?: ApiRequestConfig) {
    const config = {
      contentType: 'form',
      noEnqueue: true,
      ...(reqConfig || {}),
    };
    const param = {
      ...body,
    };
    try {
      const { data } = await this.http.post(url, param, config as ApiRequestConfig);

      if (!data || !data.success) {
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  addAiHostingContact(req: AddContactReq): Promise<string> {
    return this.post(this.systemApi.getUrl('addAiHostingContact'), req, {
      contentType: 'json',
    });
  }

  getAiHostingContactStatus(req: ContactStatusReq): Promise<ContactStatusRes> {
    return this.get(this.systemApi.getUrl('getAiHostingContactStatus'), req);
  }

  deleteAiHostingContact(req: DeleteContactReq): Promise<string> {
    return this.post(this.systemApi.getUrl('deleteAiHostingContact'), req, {
      contentType: 'json',
    });
  }

  switchAiHostingContact(req: SwitchContactReq): Promise<string> {
    return this.post(this.systemApi.getUrl('switchAiHostingContact'), req, {
      contentType: 'json',
    });
  }

  getAiHostingContactList(req: ContactListReq): Promise<ContactListRes> {
    return this.get(this.systemApi.getUrl('getAiHostingContactList'), req);
  }

  getAiHostingReplyContactList(req: ReplyContactListReq): Promise<ReplyContactListRes> {
    return this.get(this.systemApi.getUrl('getAiHostingReplyContactList'), req);
  }

  getAiHostingContactDetailStatistics(req: ContactDetailStatReq): Promise<ContactDetailStatRes> {
    return this.get(this.systemApi.getUrl('getAiHostingContactDetailStatistics'), req);
  }

  getAiHostingContactDetailList(req: ContactDetailListReq): Promise<ContactDetailListRes> {
    return this.get(this.systemApi.getUrl('getAiHostingContactDetailList'), req);
  }

  getAiHostingPlanInfos(req: ContactStatusReq): Promise<HostingPlanListModel> {
    return this.get(this.systemApi.getUrl('getAiHostingPlanInfos'), req);
  }

  getAiHostingPlanV2Infos(req: ContactStatusReq): Promise<HostingPlanListModel> {
    return this.get(this.systemApi.getUrl('getAiHostingPlanV2Infos'), req);
  }

  getAiHostingPlanEmailTemplates(): Promise<EmailTemplatesResModel> {
    return this.get(this.systemApi.getUrl('getAiHostingPlanEmailTemplates'), {});
  }

  saveAiHostingPlan(req: SavePlanReqModel): Promise<string> {
    return this.post(this.systemApi.getUrl('saveAiHostingPlan'), req, {
      contentType: 'json',
    });
  }

  delAiHostingPlan(req: DelPlanReqModel): Promise<string> {
    return this.post(this.systemApi.getUrl('delAiHostingPlan'), req, {
      contentType: 'form',
    });
  }
}

const aiHostingApiImpl = new AiHostingApiImpl();
api.registerLogicalApi(aiHostingApiImpl);
export default aiHostingApiImpl;
