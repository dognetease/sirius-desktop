import moment from 'moment';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { SystemApi } from '../../../api/system/system';
import { Api, resultObject } from '../../../api/_base/api';
import { DataTransApi } from '../../../api/data/http';
import { IcsApi, IcsEvent, IcsModel, requestIcsInfo, requestIcsOperate } from '../../../api/logical/ics';
import { CatalogUnionApi } from '../../../api/logical/catalog';
import { util } from '../../../api/util/index';

class IcsApiImpl implements IcsApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  private catalogApi: CatalogUnionApi;

  // private static reLoginCodeList: { "-16": 1 };

  constructor() {
    this.name = apis.icsApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.catalogApi = api.requireLogicalApi(apis.catalogApiImpl) as CatalogUnionApi;
  }

  async getIcsParse(config: requestIcsInfo): Promise<resultObject> {
    const subAccount = config._account || '';
    config.sid = this.getSid(subAccount);
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const urlKey = isCorpMail ? 'corpParseIcsFile' : 'icsParse';
    if (isCorpMail) {
      config.part = config.partId;
    }

    const { data } = await this.http.get(this.systemApi.getUrl(urlKey), config, { _account: subAccount });
    if (data?.success || data?.code == 200) {
      if (isCorpMail) {
        const corpResData = data.data || {};
        const res = {
          method: corpResData.method,
          propId: corpResData.propId,
          veventList: corpResData.events,
        };
        return res;
      }
      return data!.result;
    }
    return Promise.reject(data?.message);
  }

  getIcsInfoParams(res: resultObject, attendee: string, _account?: string) {
    const email = this.getEmail(_account);
    let url = this.systemApi.getUrl('icsInfo', undefined, undefined, _account);
    const event = res.veventList[0];
    const organizer = event.organizer.extDesc;
    const { propId } = res;
    let infoData;
    let params = {
      organizer,
      uid: event.uid,
      sequence: event.sequence,
      recurrenceId: event.recurrenceId,
    };
    if (organizer === email) {
      if (res.method === 'REQUEST') {
        // 组织者查看邮件
        url += '/organizer/info';
        params = Object.assign(params, {
          propId,
          event,
        });
      } else if (res.method === 'REPLY') {
        // 组织者来更新被邀请者的参与状态
        url += '/organizer/resp';
        const { partStat } = event.invitees.find((item: resultObject) => item.email === attendee);
        params = Object.assign(params, {
          attendee,
          lastModified: event.lastModified,
          partStat,
          event,
        });
      } else {
        infoData = {
          event: res.veventList[0],
          // 当前邀请是否取消
          cancel: 1,
          // 当前邀请是否已经修改
          change: 0,
          // 当前邀请是否已经过期;
          expired: 0,
          // 当前系统是否支持
          support: 1,
        };
      }
    } else {
      url += '/attendee/info';
      // 被邀请者查看邮件
      params = event;
    }
    return {
      url,
      params,
      infoData,
      event,
      method: res.method,
    };
  }

  private static transformIcsModel(data: any) {
    const icsData: IcsModel = {
      ...data,
    };
    if (icsData.event.recur && icsData.event.recur.until) {
      icsData.event.recur.until = util.getDateTime(icsData.event.recur.until as unknown as number);
    }
    return icsData;
  }

  async doGetIcsInfo(config: requestIcsInfo): Promise<IcsModel> {
    try {
      const res = await this.getIcsParse(config);
      const uid = this.getEmail(config?._account);
      const { url, params, infoData, event, method } = this.getIcsInfoParams(res, config.attendee, config?._account);
      if (infoData) {
        return IcsApiImpl.transformIcsModel(infoData);
      }
      const { data } = await this.http.post(
        this.http.buildUrl(url, {
          uid,
          method,
        }),
        params,
        { contentType: 'json', _account: config?._account }
      );
      const rs = data!.data;
      // 需要原始ics类型
      rs.method = method;
      rs.hasEvent = !!rs?.event;
      rs.event = await this.getFreeBusyInfo(rs?.event || event || {});
      return IcsApiImpl.transformIcsModel(rs);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getFreeBusyInfo(event: IcsEvent): Promise<IcsEvent> {
    const { startTime, endTime } = event;
    if (startTime || endTime) {
      const res = await this.catalogApi.doGetFreeBusyList({
        users: [this.getEmail()],
        start: util.getDateTime(startTime),
        end: util.getDateTime(endTime),
      });
      const mStart = moment(startTime);
      const mEnd = moment(endTime);
      event.conflict = res[0].freeBusyItems
        .filter(free => {
          const curStart = moment(free.start);
          const curEnd = moment(free.end);
          return free.uid !== event.uid && util.rangeInteract([mStart, mEnd], [curStart, curEnd]);
        })
        .sort((ea, eb) => {
          const ead = ea.end - ea.start;
          const ebd = eb.end - eb.start;
          if (ead !== ebd) {
            return ead - ebd;
          }
          return ea.start - eb.start;
        });
    }
    return event;
  }

  private getCommonSearchParams(_account?: string): { sid: string } {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const currentUser = this.systemApi.getCurrentUser(_account);
    return {
      sid: isCorpMail ? (currentUser?.sessionId as string) : '',
    };
  }

  async doOperateIcs(config: requestIcsOperate): Promise<IcsModel> {
    const uid = this.getEmail(config?._account);
    const url = this.http.buildUrl(this.systemApi.getUrl('icsOperate', undefined, undefined, config?._account), {
      uid,
      ...this.getCommonSearchParams(config?._account),
    });
    const { data } = await this.http.post(url, config, { contentType: 'json', _account: config?._account });
    return data!.data as IcsModel;
  }

  getSid(email?: string) {
    const user = this.systemApi.getCurrentUser(email);
    return user?.sessionId || '';
  }

  getEmail(_account?: string) {
    const user = this.systemApi.getCurrentUser(_account);
    return user?.id || '';
  }

  init(): string {
    return this.name;
  }

  afterInit() {
    return this.name;
  }
}

const icsApiImpl: Api = new IcsApiImpl();
api.registerLogicalApi(icsApiImpl);
export default icsApiImpl;
