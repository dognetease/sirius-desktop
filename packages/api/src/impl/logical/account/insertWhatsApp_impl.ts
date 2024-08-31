import {
  InsertWhatsAppApi,
  Sender,
  SenderStatus,
  SenderList,
  IStatisticReq,
  IStatisticResp,
  AllotList,
  AddAllotReq,
  PersonalSender,
  PersonalSenderList,
  PersonalWAContactReq,
  PersonalWARecentlyContactReq,
  PersonalWARecentlyContactRes,
  PersonalWARecentlyMessageReq,
  PersonalWARecentlyMessageRes,
  WAChattedReq,
  ChannelParams,
  ChannelListRes,
  AddChannelQuotaReqItem,
  UserItemInfo,
  ResourceLabel,
  UpdateChannelQuotaReq,
  UnbindChannelReq,
  WAOperationLog,
  WANumberList,
  RecordExport,
  ModeType,
  PersonalSenderListDataReq,
  PersonalSenderListData,
  MarketTaskListReq,
  PageListVoMarketingTaskResponse,
  MarketTaskDetailReq,
  PageListVoMarketingTaskDetailResponse,
  ExportResponse,
  MarketChannelsState,
  MaskResVerifyWhatsappNumber,
  GetOrdersWaRes,
  WaGPTQuotaRes,
  WaGPTConfigRes,
  WaGPTMsgReq,
  WaGPTMsgRes,
  MarketingTaskResponse,
  WaGroupAccount,
  WaGroupTask,
  HistoryKeywords,
  GroupListReq,
  GroupListRes,
  GroupNunberListReq,
  GroupNunberListRes,
  GroupTaskItem,
  GroupTaskListReq,
  GroupTaskDetail,
  GroupTaskListRes,
  JoinGroupResult,
  WaMultiSendQuotaRes,
  WaMgmtChannel,
  WaMgmtQrCodeRes,
  WaMgmtChatListReq,
  WaMgmtChatListRes,
  WaMgmtSendImgByUrlReq,
  WaMgmtSendImgByUrlRes,
  WAChannelContactListRes,
  WhatsAppSenderItemRes,
  EditAccConfigRequest,
  WaOrgStatReq,
  WaOrgStatRes,
  WaOrgKeywordRes,
  WaAddKeywordReq,
  StatisticsListReq,
  StatisticsListRes,
  AllWaWorkloadRes,
  AllChannelListRes,
} from '@/api/logical/insertWhatsApp';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

class InsertWhatsAppImpl implements InsertWhatsAppApi {
  name = 'insertWhatsAppApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req?: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      setTimeout(() => {
        const message = err.data?.message || err.data?.msg || '网络错误';
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: message,
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      });
      return Promise.reject(err.data);
    }
  }

  async delete(url: string, req?: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      setTimeout(() => {
        const message = err.data?.message || err.data?.msg || '网络错误';
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: message,
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      });
      return Promise.reject(err.data);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    try {
      const { data } = await this.http.post(url, body, config);
      if (!data || !data.success) {
        const err = {
          data: {
            message: data?.message,
          },
        };
        throw err;
        // return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: err.data?.message || err.data?.msg || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err.data);
    }
  }

  getSenderList(): Promise<SenderList> {
    return this.get(this.systemApi.getUrl('getSenderList'));
  }

  addSender(req: Sender): Promise<Sender> {
    return this.post(this.systemApi.getUrl('addSender'), req);
  }

  deleteSender(req: Sender): Promise<Sender> {
    return this.delete(this.systemApi.getUrl('deleteSender'), req);
  }

  updateSender(req: Sender): Promise<Sender> {
    return this.post(this.systemApi.getUrl('updateSender'), req);
  }

  updateSenderStatus(req: { sender: string; status: string }): Promise<boolean> {
    return this.get(this.systemApi.getUrl('updateSenderStatus'), req);
  }

  queryBindStatus(): Promise<SenderStatus> {
    return this.get(this.systemApi.getUrl('queryBindStatus'));
  }

  getWhatsAppStatisticList(req: IStatisticReq): Promise<IStatisticResp> {
    return this.get(this.systemApi.getUrl('getWhatsAppStatisticList'), req);
  }

  getWhatsAppAllStatisticList(req: IStatisticReq): Promise<IStatisticResp> {
    return this.get(this.systemApi.getUrl('getWhatsAppAllStatisticList'), req);
  }
  getAllotList(req: { sender: string }): Promise<AllotList> {
    return this.get(this.systemApi.getUrl('getAllotList'), req);
  }
  getAllotPersonList(req: { sender: string }): Promise<AllotList> {
    return this.get(this.systemApi.getUrl('getAllotPersonList'), req);
  }
  addAllot(req: AddAllotReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addAllot'), req, { contentType: 'form' });
  }
  deleteAllot(req: AddAllotReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteAllot'), req, { contentType: 'form' });
  }
  getPersonalSenderList(): Promise<PersonalSenderList> {
    return this.get(this.systemApi.getUrl('getPersonalSenderList'));
  }
  getPersonalSenderListV2(req: PersonalSenderListDataReq): Promise<PersonalSenderListData> {
    return this.get(this.systemApi.getUrl('getPersonalSenderListV2'), req);
  }
  getPersonalContactList(req: PersonalWAContactReq): Promise<PersonalSender> {
    return this.get(this.systemApi.getUrl('getPersonalContactList'), req);
  }
  getPersonalMessageList(req: any): Promise<any> {
    return this.get(this.systemApi.getUrl('getPersonalMessageList'), req);
  }
  getPersonalRecentlyContactCount(req: PersonalWARecentlyContactReq): Promise<PersonalWARecentlyContactRes> {
    return this.get(this.systemApi.getUrl('getPersonalRecentlyContactCount'), req);
  }
  getPersonalRecentlyMessageCount(req: PersonalWARecentlyMessageReq): Promise<PersonalWARecentlyMessageRes> {
    return this.get(this.systemApi.getUrl('getPersonalRecentlyMessageCount'), req);
  }
  getBusinessContactList(req: any): Promise<any> {
    return this.get(this.systemApi.getUrl('getBusinessContactList'), req);
  }
  getBusinessMessageList(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('getBusinessMessageList'), req, { contentType: 'form' });
  }
  loginPersonalWA(req: any) {
    return this.post(this.systemApi.getUrl('loginPersonalWA'), req, { contentType: 'form' });
  }
  logoutPersonalWA(req: any) {
    return this.post(this.systemApi.getUrl('logoutPersonalWA'), req, { contentType: 'form' });
  }
  getWhatsAppAccountList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getWhatsAppAccountList'));
  }
  getWhatsAppAccountListV2(whatsApp: string): Promise<WhatsAppSenderItemRes> {
    return this.get(this.systemApi.getUrl('getWhatsAppAccountListV2'), { whatsApp });
  }
  getWhatsAppChatted(req: WAChattedReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getWhatsAppChatted'), req);
  }
  getChannelList(req: ChannelParams): Promise<ChannelListRes> {
    return this.get(this.systemApi.getUrl('getChannelList'), req) as Promise<ChannelListRes>;
  }
  addChannelQuota(req: { quotas: AddChannelQuotaReqItem[] }): Promise<void> {
    return this.post(this.systemApi.getUrl('addChannelQuota'), req, { contentType: 'json' });
  }
  getSubList(resourceLabel?: ResourceLabel): Promise<UserItemInfo[]> {
    return this.get(this.systemApi.getUrl('getSubList'), resourceLabel ? { resourceLabel } : null) as Promise<UserItemInfo[]>;
  }
  updateChannelQuota(req: UpdateChannelQuotaReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateChannelQuota'), req, { contentType: 'json' });
  }
  unbindChannel(req: UnbindChannelReq): Promise<void> {
    return this.post(this.systemApi.getUrl('unbindChannel'), req, { contentType: 'json' });
  }

  getOperateLogType(): Promise<Array<{ label: string; value: string }>> {
    return this.get(this.systemApi.getUrl('getOperateLogType')).then(res =>
      res.content.map((item: any) => ({
        label: item.name,
        value: item.type,
      }))
    );
  }

  getOperateLog(req: {
    page: number;
    pageSize: number;
    filterType?: string;
    endTime?: string;
    startTime?: string;
    accountId?: string[];
    orderBy?: string;
    direction?: string;
  }): Promise<{ content: WAOperationLog[]; totalSize: number; totalPage: number }> {
    return this.get(this.systemApi.getUrl('getOperateLog'), req);
  }

  getWhatsAppList(): Promise<WANumberList[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppList'));
  }

  recordExport(req: any): Promise<RecordExport> {
    return this.post(this.systemApi.getUrl('recordExport'), req);
  }

  waAccConfig(): Promise<EditAccConfigRequest> {
    return this.get(this.systemApi.getUrl('waAccConfig'), null);
  }
  waAccConfigEdit(req: EditAccConfigRequest): Promise<boolean> {
    return this.post(this.systemApi.getUrl('waAccConfigEdit'), req);
  }

  getAllocationMode(): Promise<ModeType> {
    return this.get(this.systemApi.getUrl('getAllocationMode'));
  }

  updateAllocationMode(mode: { mode: ModeType }): Promise<void> {
    return this.get(this.systemApi.getUrl('updateAllocationMode'), mode);
  }

  getOperateLogDetail(req: { id: string }): Promise<WAOperationLog> {
    return this.get(this.systemApi.getUrl('getOperateLogDetail'), req);
  }

  addKeyword(req: WaAddKeywordReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addWAKeyword'), req);
  }

  deleteKeyword(id: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteWAKeyword'), { id });
  }

  getKeywordList(): Promise<WaOrgKeywordRes> {
    return this.get(this.systemApi.getUrl('getWAKeywordList'));
  }
  addWaMarketingTask(req: FormData): Promise<boolean> {
    // return this.post(this.systemApi.getUrl('addWaMarketingTask'), req, { contentType: 'json' });
    return this.post(this.systemApi.getUrl('addWaMarketingTask'), req);
  }
  marketTaskList(req: MarketTaskListReq): Promise<PageListVoMarketingTaskResponse> {
    return this.get(this.systemApi.getUrl('marketTaskList'), req);
  }
  marketTaskDetailList(req: MarketTaskDetailReq): Promise<PageListVoMarketingTaskDetailResponse> {
    return this.get(this.systemApi.getUrl('marketTaskDetailList'), req);
  }
  marketTaskDetail(id: string): Promise<MarketingTaskResponse> {
    return this.get(this.systemApi.getUrl('marketTaskDetail'), { taskId: id });
  }

  marketTaskImportTemplate(): Promise<ExportResponse> {
    return this.get(this.systemApi.getUrl('marketTaskImportTemplate'), null);
  }
  getMarketChannelList(type: 'MULTI_SEND' | 'JOIN_GROUP'): Promise<MarketChannelsState> {
    return this.get(this.systemApi.getUrl('getMarketChannelList'), { type });
  }
  getMarketSendList(): Promise<MarketChannelsState> {
    return this.get(this.systemApi.getUrl('getMarketSendList'), null);
  }
  getWAChannelContactList(number: string): Promise<WAChannelContactListRes> {
    return this.get(this.systemApi.getUrl('getWAChannelContactList'), { number });
  }
  marketTaskTemplateAnalyze(req: FormData): Promise<string[]> {
    return this.post(this.systemApi.getUrl('marketTaskTemplateAnalyze'), req);
  }
  maskVerifyWhatsappNumber(req: string[]): Promise<MaskResVerifyWhatsappNumber> {
    return this.post(this.systemApi.getUrl('maskVerifyWhatsappNumber'), {
      whatsAppNumbers: req,
    });
  }
  getOrdersWa(): Promise<GetOrdersWaRes> {
    return this.get(this.systemApi.getUrl('getOrdersWa'), null);
  }
  getWaGPTQuota(): Promise<WaGPTQuotaRes> {
    return this.get(this.systemApi.getUrl('getWaGPTQuota'), null);
  }
  getWaGPTConfig(): Promise<WaGPTConfigRes> {
    return this.post(this.systemApi.getUrl('getWaGPTConfig'), null);
  }
  getWaGPTMsg(req: WaGPTMsgReq): Promise<WaGPTMsgRes> {
    return this.post(this.systemApi.getUrl('getWaGPTMsg'), req);
  }
  getGroupQrCode(transportId: string, orgId: string): Promise<WaGroupAccount> {
    return this.get(this.systemApi.getUrl('getGroupQrCode'), { transportId, orgId });
  }
  reconnectGroupQrCode(transportId: string, orgId: string): Promise<boolean> {
    return this.get(this.systemApi.getUrl('reconnectGroupQrCode'), { transportId, orgId });
  }
  logoutWa(transportId: string, orgId: string): Promise<boolean> {
    return this.get(this.systemApi.getUrl('logoutWa'), { transportId, orgId });
  }
  createWaGroupTask(req: WaGroupTask): Promise<boolean> {
    return this.post(this.systemApi.getUrl('createWaGroupTask'), req);
  }
  getNewChannelId(type: 'MULTI_SEND' | 'JOIN_GROUP'): Promise<string> {
    return this.get(this.systemApi.getUrl('getNewChannelId'), { type });
  }
  groupHistoryKeywords(): Promise<HistoryKeywords> {
    return this.get(this.systemApi.getUrl('groupHistoryKeywords'), null);
  }
  getWaGroupList(req: GroupListReq): Promise<GroupListRes> {
    return this.get(this.systemApi.getUrl('getWaGroupList'), req);
  }
  getWaGroupNumberList(req: GroupNunberListReq): Promise<GroupNunberListRes> {
    return this.get(this.systemApi.getUrl('getWaGroupNumberList'), req);
  }

  getGroupTaskList(req: GroupTaskListReq): Promise<GroupTaskListRes> {
    return this.get(this.systemApi.getUrl('getGroupTaskList'), req);
  }
  getGroupTaskSummary(taskId: string): Promise<GroupTaskItem> {
    return this.get(this.systemApi.getUrl('getGroupTaskSummary'), { taskId });
  }
  getGroupTaskDetail(req: { taskId: string; page: number; pageSize: number }): Promise<GroupTaskDetail> {
    return this.get(this.systemApi.getUrl('getGroupTaskDetail'), req);
  }

  checkJoinGroupResult(req: { taskId: string; link: string; groupId?: string }): Promise<JoinGroupResult> {
    return this.post(this.systemApi.getUrl('checkJoinGroupResult'), req);
  }

  getWaMultiSendQuota(): Promise<WaMultiSendQuotaRes> {
    return this.get(this.systemApi.getUrl('getWaMultiSendQuota'), null);
  }

  getMgmtChannelList(): Promise<{ bind: boolean; channels: WaMgmtChannel[] }> {
    return this.get(this.systemApi.getUrl('getWaMgmtChannelList'));
  }

  getMgmtChannelId(): Promise<string> {
    return this.get(this.systemApi.getUrl('getWaMgmtChannelId'));
  }

  getMgmtQrCode(req: { transportId: string }): Promise<WaMgmtQrCodeRes> {
    return this.get(this.systemApi.getUrl('getWaMgmtQrCode'), req);
  }

  getMgmtChatList(req: WaMgmtChatListReq): Promise<WaMgmtChatListRes> {
    return this.get(this.systemApi.getUrl('getWaMgmtChatList'), req);
  }

  sendMgmtImgByUrl(req: WaMgmtSendImgByUrlReq): Promise<WaMgmtSendImgByUrlRes> {
    const { transportId, ...restReq } = req;
    return this.post(this.systemApi.getUrl('sendWaMgmtImgByUrl') + `?transportId=${transportId}`, restReq);
  }

  logoutMgmt(req: { transportId: string }): Promise<boolean> {
    return this.get(this.systemApi.getUrl('logoutWaMgmt'), req);
  }

  getWAReddot(): Promise<{ redDot: boolean }> {
    return this.get(this.systemApi.getUrl('getWAReddot'));
  }

  getWaOrgStat(req: WaOrgStatReq): Promise<WaOrgStatRes> {
    return this.get(this.systemApi.getUrl('getWaOrgStat'), req);
  }

  getStatisticsList(req: StatisticsListReq): Promise<StatisticsListRes> {
    return this.post(this.systemApi.getUrl('getStatisticsList'), req);
  }

  getWaWorkload(req: StatisticsListReq): Promise<AllWaWorkloadRes> {
    return this.post(this.systemApi.getUrl('getWaWorkload'), req);
  }

  getWaChannelAllList(): Promise<AllChannelListRes> {
    return this.get(this.systemApi.getUrl('getWaChannelAllList'), null);
  }
}

const impl = new InsertWhatsAppImpl();
api.registerLogicalApi(impl);
export default impl;
