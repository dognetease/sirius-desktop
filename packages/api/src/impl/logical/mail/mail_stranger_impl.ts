import {
  MailStrangerApi,
  ResponseSmartGetPriorities,
  ResponseSetSmartPriorities,
  RequestSetSmartPriorities,
  RequestSmartGetPrioritiesParams,
  EmailListPriority,
} from '@/api/logical/mail_stranger';
import { CommonRes } from '@/api/logical/mail_praise';
import { apis } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataTransApi, ResponseData } from '@/api/data/http';
import { api } from '@/api/api';
import { Api } from '@/api/_base/api';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
// import { EventApi } from '@/api/data/event';
import { MailApi, MailConfApi } from '@/api/logical/mail';
import { DataTrackerApi } from '@/api/data/dataTracker';

class MailStrangerApiImpl implements MailStrangerApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  private contactApi: ContactAndOrgApi;

  // private eventApi: EventApi;

  private mailApi: MailApi;

  private trackApi: DataTrackerApi;

  private mailConfigApi: MailConfApi;

  constructor() {
    this.name = apis.mailStrangerApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
    this.trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.mailConfigApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    // this.eventApi = api.getEventApi();
  }

  init(): string {
    return this.name;
  }

  static getCommonRes<T>(resData?: ResponseData<T>, handleData?: (data: T) => T) {
    if (resData?.success) {
      let { data } = resData;
      if (handleData && data) {
        data = handleData(data);
      }
      return {
        data,
        success: true,
      };
    }
    return {
      success: false,
      message: resData?.message,
    };
  }

  static async handlePromise<T>(promise: Promise<any>, handleData?: (data: T) => T): Promise<CommonRes<T>> {
    try {
      const res = await promise;
      const data = res.data as ResponseData<T>;
      return MailStrangerApiImpl.getCommonRes<T>(data, handleData);
    } catch (e) {
      return {
        success: false,
      };
    }
  }

  async getSmartGetPriorities(params: RequestSmartGetPrioritiesParams): Promise<CommonRes<ResponseSmartGetPriorities>> {
    const url = this.systemApi.getUrl(params.email ? 'getSmartGetPriority' : 'getSmartGetPriorities');
    const dealedParams = {
      ...params,
      ...(params.email ? { email: params.email?.toLocaleLowerCase() } : null),
    };
    const res = await MailStrangerApiImpl.handlePromise<ResponseSmartGetPriorities>(
      this.http.get(url, dealedParams, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
      })
    );
    return res;
  }

  async setSmartPriorities(req: RequestSetSmartPriorities): Promise<CommonRes<ResponseSetSmartPriorities>> {
    const url = this.systemApi.getUrl('setSmartPriorities');
    const { email, priority, name, prevPriority } = req;
    try {
      if (prevPriority !== undefined) {
        this.trackApi.track('pc_intelligent_display_sender_importance', {
          display_mode: this.mailConfigApi.getMailMergeSettings() === 'true' ? '聚合模式' : '普通模式',
          original_state: prevPriority,
          operating_actions: priority,
        });
      }
    } catch (error) {
      console.warn('[hubble] pc_intelligent_display_sender_importance report error');
    }
    const emails: string[] = typeof email === 'string' ? [email] : email;
    let requestEmails = emails.slice();
    let names: string[] = [];
    if (typeof name === 'string') {
      names = [name];
    } else if (Array.isArray(name)) {
      names = [...name];
    }
    if (names.length === emails.length) {
      requestEmails = emails.map((e, index) => {
        const n = names[index];
        if (n) {
          return `"${n}"<${e}>`;
        }
        return e;
      });
    }
    const res = await MailStrangerApiImpl.handlePromise<ResponseSetSmartPriorities>(
      this.http.post(url, {
        priority,
        email: requestEmails.join(','),
      })
    );
    if (res.success) {
      try {
        // emaillist 修改设置优先级
        await this.mailApi.newUsersIntoEmailList(
          emails.map(item => ({
            accountName: item,
            priority,
          })),
          'mark'
        );
        // 修改通讯录
        await this._syncContact({ priority, email: emails, contacts: res.data?.contacts });
      } catch (error) {
        console.warn('[setSmartPriorities] after process error');
      }
    }
    return res;
  }

  private async _syncUpdateContact(emails: string[], priority: EmailListPriority) {
    const localContacts = await this.contactApi.doGetContactByItem({
      type: 'EMAIL',
      value: emails,
    });
    if (localContacts.length > 0) {
      await this.contactApi.doUpdateContactModel(
        localContacts.map(contact => ({
          ...contact,
          contact: {
            ...contact.contact,
            priority,
          },
        }))
      );
    }
  }

  private async _syncContact(req: { email: string[]; priority: EmailListPriority; contacts?: any[] }) {
    const { contacts, email, priority } = req;
    let updateEmails = [...email];
    // 如果有新建数据 直接插入本地 并且更新服务端邮件列表
    if (Array.isArray(contacts) && contacts.length > 0) {
      await this.mailApi.doMarkMailPerferred(req.email, req.priority, 'new');
      const emailPools = contacts.flatMap(c => c.email);
      updateEmails = email.filter(em => !emailPools.includes(em));
      await this.contactApi.doInsertOrReplacePersonal({
        data: {
          data: contacts as any[],
          success: true,
        },
        _account: this.systemApi.getCurrentUser()?.id || '',
      });
    } else {
      await this.mailApi.doMarkMailPerferred(req.email, req.priority, 'edit');
    }
    await this._syncUpdateContact(updateEmails, priority);
  }
}

const mailStrangerApiImpl: Api = new MailStrangerApiImpl();

api.registerLogicalApi(mailStrangerApiImpl);

export default mailStrangerApiImpl;
