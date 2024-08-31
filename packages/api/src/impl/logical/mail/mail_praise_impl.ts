import { MailPraiseApi, CommonRes, Pendant, Medals, ResponsePersonMedalDetail } from '@/api/logical/mail_praise';
import { apis, inWindow } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataTransApi, ResponseData } from '@/api/data/http';
import { api } from '@/api/api';
import { Api } from '@/api/_base/api';
import { ContactAndOrgApi } from '../../../api/logical/contactAndOrg';

class MailPraiseApiImpl implements MailPraiseApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  private contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

  constructor() {
    this.name = apis.mailPraiseApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
  }

  init(): string {
    return this.name;
  }

  afterLoadFinish() {
    if (inWindow()) {
      this.initCurrentUserPendantId();
    }
    return this.name;
  }

  // 初始化当前用户挂件id
  async initCurrentUserPendantId() {
    const currentUser = this.systemApi.getCurrentUser();
    const accountId = currentUser?.contact?.contact.id;
    if (accountId) {
      this.getPersonMedalDetail(accountId);
    }
  }

  // 设置当前用户挂件id
  setCurrentUserPendantId(id: number) {
    this.systemApi.setUserProp('pendantId', String(id));
  }

  async handlePromise<T>(promise: Promise<any>, handleData?: (data: T) => T): Promise<CommonRes<T>> {
    try {
      const res = await promise;
      const data = res.data as ResponseData<any>;
      return this.getCommonRes<T>(data, handleData);
    } catch (e) {
      return {
        success: false,
      };
    }
  }

  getCommonRes<T>(resData?: ResponseData<any>, handleData?: (data: T) => T) {
    if (resData?.success) {
      let { data } = resData;
      if (handleData) {
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

  setMedalPendant(id: number): Promise<CommonRes<Pendant>> {
    const url = this.systemApi.getUrl('setPendant');
    return this.handlePromise<Pendant>(this.http.post(url, { id }, { contentType: 'json' }));
  }

  cancelMedalPendant(id: number): Promise<CommonRes> {
    const url = this.systemApi.getUrl('cancelPendant');
    return this.handlePromise<Pendant>(this.http.post(url, { id }, { contentType: 'json' }));
  }

  getMedals(): Promise<CommonRes<Medals>> {
    const url = this.systemApi.getUrl('getMedals');
    return this.handlePromise<Medals>(this.http.get(url));
  }

  async getPersonMedalDetail(accountId: string): Promise<CommonRes<ResponsePersonMedalDetail>> {
    const url = this.systemApi.getUrl('getPersonMedalDetail');
    const res = await this.handlePromise<ResponsePersonMedalDetail>(this.http.get(url, { accountId }));
    const { pendantImageUrl: avatarPendant = '', id: pendantId = -1 } = res?.data?.medals.find(medal => medal.asPendant) || {};
    this.setCurrentUserPendantId(pendantId);
    this.contactApi.doUpdateContactById({ id: accountId, avatarPendant });
    return res;
  }
}

const mailPraiseApiImpl: Api = new MailPraiseApiImpl();

api.registerLogicalApi(mailPraiseApiImpl);

export default mailPraiseApiImpl;
