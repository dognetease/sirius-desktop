/* eslint-disable camelcase */
import {
  PageAndSortParam,
  ReqDateRange,
  ReqFollowsPanel,
  ReqWorkbenchNoticeListParams,
  ReqWorktableArticleList,
  ReqWorktableEmployeeList,
  ResAccountRange,
  ResCustomerPanel,
  ResEdmPanel,
  ResEmailPanel,
  ResFollowsPanel,
  ResNotice,
  ResSchedulePanel,
  ResTodoPanel,
  ResWorkbenchCityInfo,
  ResWorkbenchCityList,
  ResWorkbenchCurrencyList,
  ResWorkbenchExchangeRate,
  ResWorkbenchKnwoledgeList,
  ResWorkbenchNoticeList,
  ResWorktableEmployeeList,
  ResWorktableEmployeeMemberList,
  ResWorktableSendCount,
  ResWroktableArticleList,
  WorktableApi,
  ReqAllStagePanel,
  ResMyStagePanel,
  ResAllStagePanel,
  ResWorktableSysUsage,
  ResEmailInquirySwitch,
  ResEmailInquiryItem,
} from '@/api/logical/worktable';
import { api } from '../../../api/api';
import mailApiImpl from '../mail/mail_impl';
import { MailApi } from '@/api/logical/mail';
import { ApiRequestConfig } from '../../../api/data/http';
import { inWindow, isEdm } from '@/config';
import { EventApi, IntervalEventParams } from '@/index';
import { config } from 'env_def';

const eventApi = api.getEventApi();

export class WorktableApiImpl implements WorktableApi {
  name = 'worktableApiImpl';

  static readonly RndSyncRate = Math.floor(6 * Math.random());

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi: EventApi = api.getEventApi();

  private readonly reportSecretKey: string = config('reportSecretKey') as string;

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
      const data1 = err.data;
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: (data1?.message as string) || (data1?.msg as string) || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig) {
    const apiConfig: ApiRequestConfig = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    try {
      const { data } = await this.http.post(url, body, apiConfig);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      const data1 = err.data;
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: (data1?.message as string) || (data1?.msg as string) || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err);
    }
  }

  getUnreadCount(): Promise<{ unreadCount: number }> {
    return this.get(this.systemApi.getUrl('getUnreadCount'));
  }

  getEmailPanel(req: ReqDateRange): Promise<ResEmailPanel> {
    return this.post(this.systemApi.getUrl('getEmailPanel'), req);
  }

  getWorktableArticleList(req: ReqWorktableArticleList): Promise<ResWroktableArticleList> {
    return this.get(this.systemApi.getUrl('getWorktableArticleList'), req);
  }

  getSysUsageView(): Promise<ResWorktableSysUsage[]> {
    return this.get(this.systemApi.getUrl('getSysUsageView'));
  }

  getMyStagePanel(): Promise<ResMyStagePanel> {
    return this.post(this.systemApi.getUrl('getMyStagePanel'), null);
  }

  getAllStagePanel(req: ReqAllStagePanel): Promise<ResAllStagePanel> {
    return this.post(this.systemApi.getUrl('getAllStagePanel'), req);
  }

  getWorktableSendCount(): Promise<ResWorktableSendCount> {
    return this.get(this.systemApi.getUrl('getWorktableSendCount'));
  }

  getWorkBenchKnowledgeList(): Promise<ResWorkbenchKnwoledgeList> {
    return this.get(this.systemApi.getUrl('getWorkBenchKnowledgeList'));
  }

  getWorkBenchCurrencyList(): Promise<ResWorkbenchCurrencyList> {
    return this.get(this.systemApi.getUrl('getWorkBenchCurrencyList'));
  }

  getWorkBenchExchangeRate(req: { currencyCode: string }): Promise<ResWorkbenchExchangeRate> {
    return this.get(this.systemApi.getUrl('getWorkBenchExchangeRate'), {
      ...req,
    });
  }

  getWorkBenchCityList(): Promise<ResWorkbenchCityList> {
    return this.get(this.systemApi.getUrl('getWorkBenchCityList'));
  }

  getWorkBenchCityInfo(req: { id: number }): Promise<ResWorkbenchCityInfo> {
    return this.get(this.systemApi.getUrl('getWorkBenchCityInfo'), {
      ...req,
    });
  }

  getEmployeePkList(req: ReqWorktableEmployeeList): Promise<ResWorktableEmployeeList> {
    return this.get(this.systemApi.getUrl('getEmployeePkList'), {
      ...req,
    });
  }

  getWorkBenchNoticeList(req: ReqWorkbenchNoticeListParams): Promise<ResWorkbenchNoticeList> {
    return this.get(this.systemApi.getUrl('getWorkBenchNoticeList'), {
      ...req,
    });
  }

  postWorkBenchNoticeIgnoreAll(): Promise<null> {
    return this.post(this.systemApi.getUrl('postWorkBenchNoticeIgnoreAll'), null);
  }

  getEmployeePkMemberList(): Promise<ResWorktableEmployeeMemberList> {
    return this.get(this.systemApi.getUrl('getEmployeePkMemberList'));
  }

  getEdmPanel(req: ReqDateRange): Promise<ResEdmPanel> {
    return this.get(this.systemApi.getUrl('getEdmPanel'), {
      startTime: req.start_date,
      endTime: req.end_date,
    });
  }

  getAllEdmPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResEdmPanel> {
    const param: Record<string, string> = {
      startTime: req.start_date,
      endTime: req.end_date,
    };
    if (req.account_id_list) {
      param.searchAccIds = req.account_id_list?.join(',');
    }
    return this.get(this.systemApi.getUrl('getAllEdmPanel'), param);
  }

  getCustomerPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResCustomerPanel> {
    return this.post(this.systemApi.getUrl('getCustomerPanel'), req);
  }

  getAllCustomerPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResCustomerPanel> {
    return this.post(this.systemApi.getUrl('getAllCustomerPanel'), req);
  }

  getFollowsPanel(req: ReqFollowsPanel): Promise<ResFollowsPanel> {
    return this.post(this.systemApi.getUrl('getFollowsPanel'), req);
  }

  getAllFollowsPanel(req: ReqFollowsPanel): Promise<ResFollowsPanel> {
    return this.post(this.systemApi.getUrl('getAllFollowsPanel'), req);
  }

  getSchedulePanel(req: ReqDateRange & PageAndSortParam): Promise<ResSchedulePanel> {
    return this.post(this.systemApi.getUrl('getSchedulePanel'), req);
  }

  getAccountRange(label: string): Promise<ResAccountRange> {
    return this.get(this.systemApi.getUrl('getAccountRange'), {
      label,
    });
  }

  getUnreadMail(req: { receiveDate: number; page: number; pageSize?: number }): Promise<ResTodoPanel> {
    return this.get(this.systemApi.getUrl('getUnreadMail'), req);
  }

  getContactMail(req: { receiveDate: number; page: number; pageSize?: number }): Promise<ResTodoPanel> {
    return this.get(this.systemApi.getUrl('getContactMail'), req);
  }

  ignoreEmail(mid: string | undefined, nid: number | undefined): Promise<boolean> {
    return this.post(this.systemApi.getUrl('ignoreMailByMid'), {
      emailMid: mid,
      notifyId: nid,
    });
  }

  getPlayContext(req: { mediaId: string; mediaName: string; totalTime?: number }): Promise<{ playId: string }> {
    return this.post(this.systemApi.getUrl('getPlayContext'), req);
  }

  reportPlayTime(req: { playTime: number; playId: string }): Promise<void> {
    return this.post(this.systemApi.getUrl('reportPlayTime'), req);
  }

  async getNotice(): Promise<ResNotice> {
    // return this.get(this.systemApi.getUrl('getEdmNotice'));
    try {
      const { data } = await this.http.get(this.systemApi.getUrl('getEdmNotice'));
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      return Promise.reject(err);
    }
  }

  checkNotice() {
    if (!isEdm()) return;
    if (inWindow() && window.isAccountBg) return;
    return this.getNotice().then(data => {
      if (data.code === 0) {
        this.eventApi.sendSysEvent({
          eventName: 'edmGlobalNotice',
          eventStrData: '',
          eventData: data,
          eventSeq: 0,
        });
      }
    });
  }

  afterInit() {
    if (inWindow()) {
      this.checkNotice();
      this.systemApi.intervalEvent(this.edmGlobalNoticeCheckHandle);
    }
    return this.name;
  }

  private edmGlobalNoticeCheckHandle: IntervalEventParams = {
    eventPeriod: 'long',
    handler: ob => {
      // 90s 后执行自动同步
      if (ob.seq > 0 && this.systemApi.getCurrentUser()) {
        this.checkNotice();
      }
    },
    id: 'edmNoticeCheck',
    seq: 0,
  };

  getEmailInquirySwitch(): Promise<ResEmailInquirySwitch> {
    return this.get(this.systemApi.getUrl('getEmailInquirySwitch'));
  }

  async getEmailInquiry(): Promise<ResEmailInquiryItem[]> {
    const res = await this.post(this.systemApi.getUrl('getEmailInquiry'), {
      pageNo: 1,
      pageSize: 3,
    });
    let emailInquiryItems: ResEmailInquiryItem[] = [];
    if (res?.content?.length > 0) {
      const rawInfos: any[] = res.content;
      emailInquiryItems = await Promise.all(
        rawInfos.map(async ({ mid, createTime, toEmail, emailInfo, isRead, id }) => {
          const mail = await (mailApiImpl as MailApi).handleRawMailContent(mid, JSON.parse(emailInfo));
          return {
            id,
            email: toEmail,
            timestamp: new Date(createTime).getTime(),
            unread: !isRead,
            mail,
          };
        })
      );
    }
    return emailInquiryItems;
  }

  markEmailInquiryRead(id: string): Promise<void> {
    return this.get(this.systemApi.getUrl('markEmailInquiryRead'), { handoverEmailId: id });
  }

  isUrlNeedToEncrypt(url: string, encryptFlag = 'enc'): boolean {
    try {
      const urlObj = new URL(url);
      const { searchParams } = urlObj;
      const needToEncrypt = searchParams.get(encryptFlag) === '1';
      return needToEncrypt && !!this.reportSecretKey;
    } catch (e) {
      console.error('isUrlNeedEncrypt', e);
      return false;
    }
  }

  async encryptedReportUrl(url: string, encryptKey = 'rid'): Promise<string> {
    try {
      const needToEncrypt = this.isUrlNeedToEncrypt(url);
      if (!needToEncrypt) {
        return url;
      }
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser?.contact?.contact?.enterpriseId) {
        return url;
      }
      const urlObj = new URL(url);
      const { searchParams } = urlObj;
      const newSearchParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== 'enc') {
          newSearchParams.append(key, value);
        }
      });
      const encryptedObj = {
        time: Date.now(),
        orgId: currentUser.contact.contact.enterpriseId,
        accountId: currentUser.contact.contact.id,
      };
      const encryptedStr = this.systemApi.encryptByECB(JSON.stringify(encryptedObj), this.reportSecretKey);
      newSearchParams.append(encryptKey, encryptedStr);
      urlObj.search = newSearchParams.toString();
      return urlObj.href;
    } catch (e) {
      console.error('encryptUrl error', e);
      return url;
    }
  }
}

const worktableApiImpl = new WorktableApiImpl();
api.registerLogicalApi(worktableApiImpl);
export default worktableApiImpl;
