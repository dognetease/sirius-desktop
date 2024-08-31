import { config as envConfig, WindowHooksObserverConf } from 'env_def';
import moment from 'moment';
import lodashDebounce from 'lodash/debounce';
import {
  CatalogAction,
  catalogSync,
  CatalogUnionApi,
  DateTime,
  DeleteCatalogParams,
  EntityCatalog,
  EntitySchedule,
  EntityScheduleAndContact,
  FreeBusyModel,
  FreeBusyQueryParams,
  MeetingRoomConditionModel,
  MeetingRoomDetailCondition,
  MeetingRoomDetailModel,
  MeetingRoomListAvailableCondition,
  MeetingRoomListCondition,
  MeetingRoomListModel,
  MeetingRoomModel,
  ScheduleDelete,
  ScheduleInsert,
  ScheduleModel,
  ScheduleOperate,
  ScheduleUpdate,
  SubscribeCatalogListParams,
  SubscribeCatalogParams,
  CatalogInitModel,
  CatalogSyncRes,
  ZoneItem,
  MeetingRoomInfo,
  MeetingRoomInfoCondition,
  DeleteThirdAccountCatalogParams,
  catalogSettingModel,
  catelogUpdateSettingModel,
  TimeUnit,
  ReminderParam,
  ReminderInfo,
  CatalogNotifyInfo,
  ReminderListMap,
  DBScheduleReminder,
  ReminderAction,
} from '../../../api/logical/catalog';
import { apis, inWindow } from '../../../config';
import { api } from '../../../api/api';
import { SystemApi } from '../../../api/system/system';
import { EventApi, SystemEvent } from '../../../api/data/event';
import { Api, resultObject } from '../../../api/_base/api';
import { DbApiV2, DBList } from '../../../api/data/new_db';
import { ApiResponse, DataTransApi } from '../../../api/data/http';
// import lf from "lovefield";
// import {lf} from "../../../api/data/lovefield"
import { util } from '../../../api/util/index';
import { MailConfApi } from '../../../api/logical/mail';
import { PerformanceApi } from '@/api/system/performance';
import { locationHelper } from '@/api/util/location_helper';
import { getIn18Text } from '@/api/utils';

let ZONE_LIST: ZoneItem[] = [];
const Tag = '[Catalog]';

// 通知句柄偏移量，只同步2小时内的通知
const NOTICE_INTERVAL_OFFSET = 2 * 60 * 60 * 1000;
// 过期提醒偏移量，24小时
const NOTICE_EXPIRE_OFFSET = 24 * 60 * 60 * 1000;
class CatalogApiImpl implements CatalogUnionApi {
  urlMap = {
    create: '/lingxi/calender/create',
    import: '/lingxi/calender/port',
    config: '/lingxi/calender/edit/',
    subscribe: '',
  };

  initData: CatalogInitModel = {
    catalog: [],
    schedule: [],
    noticeObjMap: {},
    noticeTimeoutHandler: [],
    enableNotice: true,
  };

  scheduleUrl = envConfig('scheduleJumpUrlBase') as string;

  name: string;

  private systemApi: SystemApi;

  private eventApi: EventApi;

  private DBApi: DbApiV2;

  private http: DataTransApi;

  private dbName: DBList = 'catalog_dexie';

  private mailConfApi: MailConfApi;

  private performanceApi: PerformanceApi;

  constructor() {
    this.name = apis.catalogApiImpl;
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
    this.DBApi = api.getNewDBApi();
    this.http = api.getDataTransApi();
    this.initCatalogData = this.initCatalogData.bind(this);
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    this.performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
    this.initScheduleNotice = lodashDebounce(this.initScheduleNotice, 5000);
    this._debounceCheckExpireScheduleNotice = lodashDebounce(this.checkExpireScheduleNotice.bind(this), 10000, { leading: true, trailing: false });
  }
  private _debounceCheckExpireScheduleNotice() {
    // console.log('_debounceCheckExpireScheduleNotice');
  }

  async doUpdateSettings(params: catelogUpdateSettingModel): Promise<boolean> {
    const { data } = await this.http.post(this.systemApi.getUrl('updateSetting'), params, { contentType: 'json' });
    return data?.data === 1;
  }

  async doGetSetting(): Promise<catalogSettingModel> {
    const { data } = await this.http.get(this.systemApi.getUrl('getSetting'));
    if (data?.success || data?.code === 200) {
      return data.data as catalogSettingModel;
    }
    return Promise.reject(data!.message);
  }

  async doGetHasMeetingRoom(): Promise<boolean> {
    const { data } = await this.http.get(this.systemApi.getUrl('hasMeetingRoom'));
    return data?.success && data.data;
  }

  async doGetMeetingRoomCondition(): Promise<MeetingRoomConditionModel> {
    const { data } = await this.http.get(this.systemApi.getUrl('meetingRoomCondition'));
    if (data?.success) {
      return data.data as MeetingRoomConditionModel;
    }
    return Promise.reject(data!.message);
  }

  async doGetMeetingRoomList(condition: MeetingRoomListCondition): Promise<MeetingRoomListModel[]> {
    // eslint-disable-next-line camelcase
    const zone_id = await this.getZoneId();

    const unit: MeetingRoomListCondition['unit'] = 15;
    // eslint-disable-next-line no-param-reassign
    condition = { unit, ...condition, zone_id };
    const { data } = await this.http.get(this.systemApi.getUrl('meetingRoomList'), condition);
    if (data?.success) {
      return data.data.itemList as MeetingRoomListModel[];
    }
    return Promise.reject(data!.message);
  }

  async doGetMeetingRoomDetail(condition: MeetingRoomDetailCondition): Promise<MeetingRoomDetailModel> {
    // eslint-disable-next-line camelcase
    const zone_id = await this.getZoneId();
    const unit: MeetingRoomListCondition['unit'] = 15;
    // eslint-disable-next-line no-param-reassign
    condition = { unit, ...condition, zone_id };
    const { data } = await this.http.get(this.systemApi.getUrl('meetingRoomDetail'), condition);
    if (data?.success) {
      return data.data as MeetingRoomDetailModel;
    }
    return Promise.reject(data!.message);
  }

  async doGetAvailableRoom(condition: MeetingRoomListAvailableCondition): Promise<MeetingRoomModel[]> {
    const unit: MeetingRoomListAvailableCondition['unit'] = 15;
    // eslint-disable-next-line no-param-reassign
    condition = { unit, ...condition };
    const { data: res = {} } = await this.http.post(this.systemApi.getUrl('meetingRoomAvailable'), condition, { contentType: 'json' });
    const { data = { roomInfoList: [] } } = res;
    const { roomInfoList = [] } = data;
    return roomInfoList as MeetingRoomModel[];
  }

  async doGetOneRoomInfo(condition: MeetingRoomInfoCondition): Promise<MeetingRoomInfo> {
    const unit: MeetingRoomInfoCondition['unit'] = 15;
    // eslint-disable-next-line no-param-reassign
    condition = { unit, ...condition };
    const { data: res = {} } = await this.http.post(this.systemApi.getUrl('oneMeetingRoomInfo'), condition, { contentType: 'json' });
    const {
      data: { statusCode, untilDate },
    } = res;
    // 单独接口返回的
    // statusCode: 1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室，
    // untilDate: "2022-09-23"
    return { statusCode, untilDate };
  }

  private watchLogin(ev: SystemEvent): void {
    if (ev && ev.eventData) {
      // let db = this.DBApi.getDB(this.dbName);
      // if (db?.schemaBuilder) {
      //   this.DBApi.close(this.dbName);
      // }
      // this.systemApi.getCurrentUser();
      this.DBApi.initDb(this.dbName); // 初始化数据库
      this.initCatalogData();
    } else {
      this.DBApi.closeSpecific(this.dbName);
      // console.log("connect close after logout");
    }
  }

  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id || '';
  }

  // 日历数据转换
  transCatalogData(data: resultObject[]) {
    const email = this.getEmail();
    return data.map(item => {
      const newItem = { ...item };
      newItem.isOwner = Number(email === item.belonger.extDesc);
      newItem.id = item.catalogId;
      return newItem;
    });
  }

  // 第三方账号日历数据转换，账号信息处理为日历的属性
  thirdTransCatalogData(data: resultObject[]) {
    const email = this.getEmail();
    const catalogArr: resultObject[] = [];
    data.forEach(thirdAccount => {
      const { appEmail, appType, catalogList, syncAccountId, userName } = thirdAccount || {};
      if (catalogList && catalogList.length) {
        catalogList.forEach((item: any) => {
          const newItem = { ...item };
          // 第三方账号日历，应该有用户本人的。但是isOwner权限放的比较大，所以此处isOwner设置为0
          newItem.isOwner = Number(email === item.belonger.extDesc);
          // newItem.isOwner = Number(false);
          newItem.id = item.catalogId;
          // 添加第三方标示字段syncAccountId和第三方账号信息字段thirdAccount，需要本地入库
          newItem.syncAccountId = Number(syncAccountId);
          newItem.thirdAccount = {
            appEmail, // string
            appType, // number: 1.钉钉 2.企业微信 3.飞书 100.其他应用类型,新增加了泡泡类型
            syncAccountId, // number
            userName, // string
          };
          catalogArr.push(newItem);
        });
      }
    });
    return catalogArr as resultObject[];
  }

  // 根据日程的时区id获取GMT后缀
  getGMT(item: any): string {
    let gmt = 'GMT+08:00'; // 默认东八区
    const zoneId = item?.time?.startZone.id || item?.time?.endZone.id || item?.startZoneId || item?.endZoneId || 290;
    // 非全日日程需要转换
    if (!item.allDay) {
      if (ZONE_LIST && ZONE_LIST.length) {
        const zone = ZONE_LIST.find(i => i.id === zoneId);
        if (zone) {
          const reg = /\((.+?)\)/gi;
          const arr = zone.content.match(reg);
          if (arr && arr.length) {
            gmt = arr[0].replace('(', '').replace(')', '');
            if (gmt === 'GMTZ') {
              gmt = 'GMT+00:00';
            }
          }
        }
      }
    }
    return gmt;
  }

  // TODO:// 获取日程详情需要传入当前的日历id
  // 日程数据转换
  transScheduleData(data: resultObject | resultObject[], isDetail?: boolean) {
    this.performanceApi.time({
      statKey: 'schedule_data_handle',
      statSubKey: 'data_transform',
    });
    const list: resultObject[] = util.singleToList(data);
    let scheduleContact: EntityScheduleAndContact[] = [];
    const schedule = list.map(item => {
      if (!item) return item;
      let newItem = { ...item };
      if (isDetail) {
        newItem = Object.assign(newItem, item.time);
        if (newItem.recur) {
          newItem.recur.userFreq = newItem.recur.userFrequency;
          newItem.recur.freq = newItem.recur.frequency;
          delete newItem.recur.userFrequency;
          delete newItem.recur.frequency;
        }
      }
      const uid = util.getUnique(item.scheduleId, item.catalogId, item.recurrenceId || 0);
      newItem.id = uid;
      if (newItem.allDay) {
        newItem.start = util.getTime(newItem.start);
        newItem.end = util.getTime(newItem.end);
      } else {
        // 非全日日程需要根据时区转换
        const gmt = this.getGMT(newItem);
        newItem.start = util.getTimeByGMT(newItem.time.start, gmt);
        newItem.end = util.getTimeByGMT(newItem.time.end, gmt);
      }
      // 日程持续时间是否大于24小时，0不大于，1大于
      newItem.timeFlag = newItem.start + 86400000 >= newItem.end ? 0 : 1;

      scheduleContact = scheduleContact.concat(CatalogApiImpl.setScheduleContactData(item, uid));
      delete newItem.invitees;
      // 处理附件
      const attachments =
        item?.attachments?.map((f: { accountAttachmentAccountId: number; belonger: { accountId: number } }) => {
          f.accountAttachmentAccountId = f?.belonger?.accountId;
          return f;
        }) || [];
      newItem.attachments = attachments;
      return newItem;
    });
    this.performanceApi.timeEnd({
      statKey: 'schedule_data_handle',
      statSubKey: 'data_transform',
      params: {
        event_count: `${schedule.length}`,
      },
    });
    return {
      schedule: schedule as EntitySchedule[],
      scheduleContact,
    };
  }

  // 删除本地日程联系人
  async deleteDiffScheduleContact(scheduleList: EntitySchedule[], newlist: EntityScheduleAndContact[]) {
    const oldList = await this.getScheduleContactById(scheduleList.map(item => item.id));
    const diffRes = util.getDiff(util.getKeyListByList(oldList, 'id'), util.getKeyListByList(newlist, 'id'));
    if (diffRes.deleteDiff?.length) {
      this.DBApi.deleteById(
        {
          dbName: this.dbName,
          tableName: 'scheduleContact',
        },
        diffRes.deleteDiff!
      );
    }
  }

  // 单个日程设置日程联系人数据
  static setScheduleContactData(obj: resultObject, uid: string): EntityScheduleAndContact[] {
    let myself;
    const owner = obj.belonger;
    const creator = obj.creator || owner;
    const organizer = obj.organizer || creator;
    let list = [];
    if (obj?.invitees) {
      list = obj.invitees.map((item: resultObject) => {
        if (item.invitee && !item.invitee.extDesc) {
          console.warn('ScheduleContact', item, obj);
        }
        const email = item.invitee.extDesc || '';
        const isOrganizer = email === organizer.extDesc;
        const isOwner = email === owner.extDesc;
        const isCreator = email === creator.extDesc;
        const isInviter = !isOrganizer;
        if (isOrganizer) {
          myself = isOrganizer;
        }
        return {
          id: util.getUnique(item.invitee.accountId, uid),
          // 联系人id
          contactId: item.invitee.accountId,
          email,
          // 日程id
          scheduleId: uid,
          // 日程操作 （需要操作1，接受2，拒绝3，暂定4，已委派5）
          partStat: item.partStat,
          // 是否是拥有者
          isOwner: Number(isOwner),
          // 是否是组织者
          isOrganizer: Number(isOrganizer),
          // 是否是创建者
          isCreator: Number(isCreator),
          // 是否是被邀请者
          isInviter: Number(isInviter),
          // 联系人简要信息
          simpleInfo: item.invitee,
          originInvtees: true,
        };
      });
    }
    if (!myself) {
      myself = organizer;
      list.unshift({
        id: util.getUnique(myself.accountId, uid),
        // 联系人id
        contactId: myself.accountId,
        email: myself.extDesc,
        // 日程id
        scheduleId: uid,
        // 日程操作 （需要操作1，接受2，拒绝3，暂定4，已委派5）
        partStat: obj.partStat,
        // 是否是拥有者
        isOwner: Number(myself.extDesc === owner.extDesc),
        // 是否是组织者
        isOrganizer: Number(myself.extDesc === organizer.extDesc),
        // 是否是创建者
        isCreator: Number(myself.extDesc === creator.extDesc),
        // 是否是被邀请者
        isInviter: Number(obj.inviteeType === 2),
        // 联系人简要信息
        simpleInfo: myself,
      });
    }
    return list;
  }

  // 获取本地库日程联系人
  async getScheduleContactById(idList: (number | string)[]): Promise<EntityScheduleAndContact[]> {
    // console.time('getScheduleContactById');
    const ids = [...new Set(idList)];
    const res = await this.DBApi.getByRangeCondition({
      dbName: this.dbName,
      tableName: 'scheduleContact',
      adCondition: {
        type: 'anyOf',
        field: 'scheduleId',
        args: [ids as string[]],
      },
    });
    // console.log('got schedule contact list for ' + idList.join(','), res);
    // console.timeEnd('getScheduleContactById');
    return res as EntityScheduleAndContact[];
  }

  // 为日程数据拼接日历和联系人信息
  // async getScheduleModel(
  //   scheduleList: EntitySchedule[],
  // ): Promise<ScheduleModel[]> {
  //   this.performanceApi.time({
  //     statKey: 'schedule_data_handle',
  //     statSubKey: 'data_compose'
  //   });
  //   const catalogIdList: Array<number> = [];
  //   const scheduleContactIdList: Array<number> = [];
  //   scheduleList.forEach((item: resultObject) => {
  //     catalogIdList.push(item.catalogId);
  //     scheduleContactIdList.push(item.id);
  //   });
  //   const list = await Promise.all([
  //     this.doGetCatalogByItem(catalogIdList),
  //     this.getScheduleContactById(scheduleContactIdList),
  //   ]);
  //   const catalogList = list[0];
  //   const scheduleContactList = list[1];
  //   const res = scheduleList.map(item => (
  //     {
  //       scheduleInfo: item,
  //       catalogInfo: catalogList.find(catalog => {
  //         const id = Number(catalog.id);
  //         return id === item.catalogId;
  //       }) as EntityCatalog,
  //       contactInfo: scheduleContactList.filter(contact => contact.scheduleId === item.id),
  //     }
  //   ));
  //   this.performanceApi.timeEnd({
  //     statKey: 'schedule_data_handle',
  //     statSubKey: 'data_compose',
  //     params: {
  //       event_count: `${scheduleList.length}`
  //     }
  //   });
  //   return res;
  // }

  private getSid() {
    const currentUser = this.systemApi.getCurrentUser();
    return currentUser?.sessionId;
  }

  private buildRequestUrl(url: string, params?: any): string {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    let searchParams = params || {};
    if (isCorpMail) {
      searchParams = { ...(params || {}), sid: this.getSid() };
    }
    return this.http.buildUrl(url, searchParams);
  }

  async getSelfCatalogList(): Promise<catalogSync> {
    const email = this.getEmail();
    let res;
    try {
      const requestUrl = this.buildRequestUrl(this.systemApi.getUrl('catalogList'));
      const { data } = await this.http.post(
        requestUrl,
        {
          uid: email,
          searchTime: new Date().getTime(),
        },
        { contentType: 'form' }
      );

      const catalogData = this.transCatalogData(data!.data);
      res = {
        success: true,
        data: catalogData?.filter(item => item.isOwner),
      };
    } catch (message) {
      console.error(Tag, 'syncCatalog error', message, this.DBApi);
      res = {
        success: false,
        message,
      };
    }
    return res;
  }

  // 服务端获取日历
  async syncCatalog(): Promise<catalogSync> {
    const email = this.getEmail();
    let res;
    try {
      const requestUrl = this.buildRequestUrl(this.systemApi.getUrl('catalogList'));
      const { data } = await this.http.post(
        requestUrl,
        {
          uid: email,
          searchTime: new Date().getTime(),
        },
        { contentType: 'form' }
      );
      // 第三方日历
      const thirdRequestUrl = this.buildRequestUrl(this.systemApi.getUrl('thirdCatalogList'));
      const { data: thirdData } = await this.http.post(
        thirdRequestUrl,
        {
          uid: email,
          searchTime: new Date().getTime(),
        },
        { contentType: 'form' }
      );

      const catalogData = this.transCatalogData(data!.data);
      const thirdCatalogData = this.thirdTransCatalogData(thirdData?.data || []);
      // console.log('transCatalogData--->', catalogData);
      // this.DBApi.putAll(
      //   {
      //     dbName: this.dbName,
      //     tableName: 'catalog',
      //   },
      //   catalogData,
      // );
      // console.log('insert into db ', catalogData, catalogList);
      // console.log('insertOrReplace catalog', catalogList)
      res = {
        success: true,
        data: [...catalogData, ...thirdCatalogData],
      };
    } catch (message) {
      console.error('syncCatalog error', message, this.DBApi);
      res = {
        success: false,
        message,
      };
    }
    return res;
  }

  // 日程详情
  async syncScheduleDetail(catalogId: number, recurrenceId: number, scheduleId: number, uid?: string): Promise<catalogSync> {
    const email = this.getEmail();
    let res;
    try {
      let params = {};
      if (uid) {
        params = { uid };
      } else {
        params = { catalogId, recurrenceId, scheduleId };
      }
      const url = this.buildRequestUrl(this.systemApi.getUrl('scheduleDetail'), {
        uid: email,
        searchTime: new Date().getTime(),
      });
      const { data } = await this.http.post(
        url,
        {
          ...params,
        },
        { contentType: 'json' }
      );
      // transScheduleData需要依赖ZONE_LIST,提前请求下
      if (!ZONE_LIST || !ZONE_LIST.length) {
        await this.getZoneList();
      }
      const scheduleData = this.transScheduleData(data!.data, true);
      // 优化点：数据库同步可以异步执行
      // await this.deleteDiffScheduleContact(scheduleData.schedule, scheduleData.scheduleContact);
      // const list = await Promise.all([
      //   this.DBApi.putAll(
      //     {
      //       dbName: this.dbName,
      //       tableName: 'schedule',
      //     },
      //     scheduleData.schedule,
      //   ),
      //   this.DBApi.putAll(
      //     {
      //       dbName: this.dbName,
      //       tableName: 'scheduleContact',
      //     },
      //     scheduleData.scheduleContact,
      //   ),
      // ]);
      // console.log('insert all into db return :', list);
      res = {
        success: true,
        data: scheduleData,
      };
    } catch (message) {
      console.error('syncScheduleDetail', message);
      res = {
        success: false,
        // message,
      };
    }
    return res;
  }

  // 分隔日程请求入参的日期间隔
  static splitDateRange(s: DateTime, e: DateTime, pieces = 2) {
    let start = util.getTime(s);
    let end = util.getTime(e);
    if (end < start) {
      const t = start;
      start = end;
      end = t;
    }
    // 查询总天数除片数
    const delta = Math.ceil((end - start) / 86400000 / pieces);
    // 至少有1天以上才能分片请求
    if (delta > 0) {
      const rangeArr: Array<[DateTime, DateTime]> = [];
      let begin = start;
      while (begin < end) {
        const d1 = begin;
        const d2 = begin + 86400000 * delta;
        rangeArr.push([util.getDateTime(d1), util.getDateTime(d2 < end ? d2 - 1 : end)]);
        begin = d2;
      }
      return rangeArr;
    }
    return [[[util.getDateTime(start), util.getDateTime(end)]]];
  }

  // 服务端请求日程
  async syncScheduleList(catalogIds: number[], start: DateTime, end: DateTime): Promise<catalogSync> {
    // console.time('2222服务端获取日程');
    this.performanceApi.time({
      statKey: 'schedule_data_handle',
      statSubKey: 'network_fetch',
    });
    if (catalogIds && catalogIds.length === 0) {
      return {
        success: false,
        message: 'catalogIds is empty',
      };
    }
    const email = this.getEmail();
    let res;
    try {
      const url = this.buildRequestUrl(this.systemApi.getUrl('scheduleList'), {
        uid: email,
        searchTime: new Date().getTime(),
      });
      console.time('network requset events data | SCHEDULE_TIME_LOG');
      // 按照时间分割 时间范围，最多分成4个请求发送
      // 分多片请求，以免数据量大的时候服务端反应太慢
      const results = await Promise.all(
        CatalogApiImpl.splitDateRange(start, end).map(([s, e]) =>
          this.http.post(
            url,
            {
              catalogIds,
              start: s,
              end: e,
            },
            { contentType: 'json' }
          )
        )
      );
      console.timeEnd('network requset events data | SCHEDULE_TIME_LOG');
      const data = results.map(r => r.data?.data || []).flat();
      if (data.length) {
        res = {
          success: true,
          data,
        };
      } else {
        console.log('[catalog] syncScheduleList data null', results);
        res = {
          success: true,
          data: [],
          message: 'syncScheduleList data is null',
        };
      }
    } catch (message) {
      console.error('syncScheduleList', message);
      res = {
        success: false,
        message,
      };
    }
    this.performanceApi.timeEnd({
      statKey: 'schedule_data_handle',
      statSubKey: 'network_fetch',
      params: {
        event_count: `${res.data?.length}`,
      },
    });
    // console.timeEnd('2222服务端获取日程');
    return res;
  }

  // 本地日历数据
  async getDBCatalogList(idList?: number[]) {
    // console.time('getDBCatalogList');
    let data;
    if (idList) {
      const ids = [...new Set(idList)];
      data = await this.DBApi.getByIds(
        {
          dbName: this.dbName,
          tableName: 'catalog',
        },
        ids
      );
      // console.log('from db get ' + idList.join(','), data);
    } else {
      data = await this.DBApi.getByEqCondition({
        dbName: this.dbName,
        tableName: 'catalog',
      });
      // console.log('from db get no id', data);
    }
    // console.timeEnd('getDBCatalogList');
    console.log('getDBCatalogList', data);
    return data;
  }

  // 本地日程数据
  async getDBScheduleList(catalogIds: number[], start: DateTime, end: DateTime): Promise<EntitySchedule[]> {
    // console.time('2222本地库获取日程');
    this.performanceApi.time({
      statKey: 'schedule_data_handle',
      statSubKey: 'read_db',
    });
    const startTime = util.getTime(start);
    const endTime = util.getTime(end);
    const mStart = moment(startTime);
    const mEnd = moment(endTime);
    let res;
    try {
      const result = await Promise.all([
        this.DBApi.getByRangeCondition({
          dbName: this.dbName,
          tableName: 'schedule',
          adCondition: {
            type: 'between',
            field: ['timeFlag', 'start'],
            args: [[0, startTime - 86400000], [0, endTime], true, true],
          },
        }),
        this.DBApi.getByRangeCondition({
          dbName: this.dbName,
          tableName: 'schedule',
          adCondition: {
            type: 'between',
            field: ['timeFlag', 'start'],
            args: [[1, -Number.MAX_VALUE], [1, Number.MAX_VALUE], false, false],
          },
        }),
      ]);
      res = result.flat().filter(i => catalogIds.includes(i.catalogId) && !!util.rangeInteract([mStart, mEnd], [moment(i.start), moment(i.end)]));
    } catch (err) {
      console.error('getDBScheduleList Error', err);
      throw err;
    }
    this.performanceApi.timeEnd({
      statKey: 'schedule_data_handle',
      statSubKey: 'read_db',
      params: {
        event_count: `${res.length}`,
      },
    });
    return res as EntitySchedule[];
  }

  // 删除本地数据
  async delDBData(dbList: resultObject[], syncList: resultObject[], diffKey: string, tableName: string) {
    const oldList = util.getKeyListByList(dbList, diffKey);
    const newList = util.getKeyListByList(syncList, diffKey);
    const diffRes = util.getDiff(oldList, newList);
    if (diffRes.deleteDiff) {
      // console.log(tableName + 'has deleteDiff: ',diffRes);
      await this.DBApi.deleteById(
        {
          dbName: this.dbName,
          tableName,
        },
        diffRes.deleteDiff!
      );
      // console.log('delete ' + tableName + ' success', res);
    }
    return diffRes;
  }

  // 获取日历列表
  async doGetCatalogByItem(idList?: number[], cached = true): Promise<EntityCatalog[]> {
    let dbList: EntityCatalog[] = [];
    if (cached) {
      dbList = (await this.getDBCatalogList(idList)) as EntityCatalog[];
      // 远程数据比较并同步
      setTimeout(() => {
        this.compareCatalogList(dbList, [], cached);
      }, 0);
    } else {
      const syncRes = await this.syncCatalog();
      console.info('[catalog] doGetCatalogByItem server data:', syncRes);
      if (syncRes.success) {
        // this.delDBData(dbList, syncRes.data, 'id', 'catalog');
        // 本地数据对比同步
        setTimeout(() => {
          this.compareCatalogList([], syncRes.data, cached);
        }, 0);
        return syncRes.data;
      }
      // 服务端失败，请求本地库
      dbList = (await this.getDBCatalogList(idList)) as EntityCatalog[];
      // 服务端失败
      // if (syncRes.message === 'NETWORK.ERR.TIMEOUT') {
      //   dbList = await this.getDBCatalogList(idList) as EntityCatalog[];
      // }

      console.error('[catalog] doGetCatalogByItem Error', syncRes.message);
      return dbList;
    }
    return dbList;
  }

  // 比较本地库和服务端日历列表,同步数据库,cached标志是否是缓存,
  // cached为false，代表服务端请求后发起的，这个时候不需要发送通知了，此时页面就是最新数据，仅仅同步本地数据即可
  async compareCatalogList(DBCatalogList: EntityCatalog[], netCatalogList: EntityCatalog[], cached: boolean) {
    if (cached) {
      const netListRes = await this.syncCatalog();
      if (netListRes.success) {
        // 先写入新的数据
        await this.DBApi.putAll({ dbName: this.dbName, tableName: 'catalog' }, netListRes.data);
        // 根据id去掉老的数据
        await this.delDBData(DBCatalogList, netListRes.data, 'id', 'catalog');
        // 对比并发送通知，仅仅日历变化
        const hasCatalogDiff = this.isDiffCatalogListFn(DBCatalogList, netListRes.data);
        if (hasCatalogDiff) {
          this.sendNotify({
            catalog: {
              hasDiff: hasCatalogDiff,
            },
          });
        }
      }
    } else {
      // 如果是服务端请求后对比
      const dbList = await this.getDBCatalogList();
      // 先写入新的数据
      this.DBApi.putAll({ dbName: this.dbName, tableName: 'catalog' }, netCatalogList);
      // 根据id去掉老的数据
      this.delDBData(dbList, netCatalogList, 'id', 'catalog');
    }
  }

  // 纯粹两个日历列表的比较逻辑,返回是否不同
  isDiffCatalogListFn(DBCatalogList: EntityCatalog[], netCatalogList: EntityCatalog[]) {
    let isDiff = DBCatalogList.length !== netCatalogList.length;
    if (isDiff) {
      return true;
    }
    DBCatalogList.forEach(item => {
      const netItemArr = netCatalogList.filter(i => item.catalogId === i.catalogId);
      if (netItemArr.length !== 1 || item.updateTime !== netItemArr[0].updateTime) {
        isDiff = true;
      }
    });
    return isDiff;
  }

  // 发送通知消息
  sendNotify(res: CatalogSyncRes) {
    console.log('[catalog] sendNotify', res);
    this.eventApi.sendSysEvent({
      eventName: 'catalogNotify',
      eventData: res,
    });
  }

  // 获取日程
  // eslint-disable-next-line max-params
  async doGetScheduleByDate(
    catalogIds: number[],
    start: DateTime,
    end: DateTime,
    cached = true,
    needCompare = true, // cached为true的时候，是否需要对比。兼容同步本地库后的通知消息，此时仅仅获取本地即可
    diffNotify = true
  ): Promise<ScheduleModel[]> {
    // console.time('2222UI获取日程');
    let scheduleList: EntitySchedule[] = [];
    this.performanceApi.time({
      statKey: 'schedule_data_handle',
      statSubKey: 'summary',
    });
    if (catalogIds && catalogIds.length === 0) {
      return [];
    }
    if (cached) {
      scheduleList = await this.getDBScheduleList(catalogIds, start, end);
      // 异步比较
      if (needCompare) {
        setTimeout(() => {
          this.compareScheduleList(scheduleList, {}, cached, catalogIds, start, end, diffNotify);
        }, 0);
      }
    } else {
      const syncRes = await this.syncScheduleList(catalogIds, start, end);
      // 优化点：此处await中的工作包含了同步数据库，其实可以异步进行
      // scheduleList = await handleSyncScheduleList(syncRes);
      let scheduleData: { schedule: EntitySchedule[]; scheduleContact: EntityScheduleAndContact[] };
      if (syncRes.success) {
        // transScheduleData需要依赖ZONE_LIST,提前请求下
        if (!ZONE_LIST || !ZONE_LIST.length) {
          await this.getZoneList();
        }
        scheduleData = this.transScheduleData(syncRes.data);
        const mStart = moment(util.getTime(start));
        const mEnd = moment(util.getTime(end));
        scheduleData!.schedule.forEach((it: EntitySchedule) => {
          if (util.rangeInteract([mStart, mEnd], [moment(it?.start), moment(it?.end)])) {
            scheduleList.push(it);
          }
        });
        // 异步比较
        setTimeout(() => {
          this.compareScheduleList([], scheduleData, cached, catalogIds, start, end, diffNotify);
        }, 0);
      } else {
        // 服务端失败
        // if (syncRes.message === 'NETWORK.ERR.TIMEOUT') {
        scheduleList = await this.getDBScheduleList(catalogIds, start, end);
        // }
      }
    }
    // const res = await this.newgetScheduleModel(scheduleList);
    // console.time('3333日历');
    let result: any[] = [];
    if (scheduleList.length) {
      const catalogList = await this.getDBCatalogList();
      result = scheduleList.map(item => ({
        scheduleInfo: item,
        catalogInfo: catalogList.find(i => i.id === item.catalogId) as EntityCatalog,
        contactInfo: [],
      }));
    }

    // console.timeEnd('3333日历');
    this.performanceApi.timeEnd({
      statKey: 'schedule_data_handle',
      statSubKey: 'summary',
      params: {
        event_count: `${result.length}`,
      },
    });
    // console.timeEnd('2222UI获取日程');
    return result;
  }

  // 比较日程本地库和服务端
  // eslint-disable-next-line max-params
  async compareScheduleList(DBList: EntitySchedule[], netScheduleData: any, cached: boolean, catalogIds: number[], start: DateTime, end: DateTime, sendNotify = true) {
    // 同步数据库打点开始
    // console.time('2222日程对比');

    this.performanceApi.time({
      statKey: 'schedule_data_handle',
      statSubKey: 'sync_db',
    });
    let scheduleData: { schedule: EntitySchedule[]; scheduleContact: EntityScheduleAndContact[] } = {
      schedule: [],
      scheduleContact: [],
    };
    let dbList: resultObject[];
    // console.time('日程对比1');
    if (cached) {
      dbList = DBList;
      const syncRes = await this.syncScheduleList(catalogIds, start, end);
      if (syncRes.success) {
        // transScheduleData需要依赖ZONE_LIST,提前请求下
        if (!ZONE_LIST || !ZONE_LIST.length) {
          await this.getZoneList();
        }
        scheduleData = this.transScheduleData(syncRes.data);
      } else {
        // 如果服务端失败，则终止同步
        // if (syncRes.message === 'NETWORK.ERR.TIMEOUT') {
        console.log('[catalog] compareScheduleList failed because NETWORK.ERR.TIMEOUT');
        return;
        // }
      }
    } else {
      // 如果是服务端请求后对比
      dbList = await this.getDBScheduleList(catalogIds, start, end);
      scheduleData = netScheduleData;
    }
    // console.timeEnd('日程对比1');
    // console.time('日程对比2');

    const mStart = moment(util.getTime(start));
    const mEnd = moment(util.getTime(end));
    const inRangeData: EntitySchedule[] = [];
    scheduleData?.schedule.forEach((it: EntitySchedule) => {
      if (util.rangeInteract([mStart, mEnd], [moment(it?.start), moment(it?.end)])) {
        inRangeData.push(it);
      }
    });
    // console.timeEnd('日程对比2');
    // console.time('日程对比4');
    // 删除diff 数据
    const scheduleDiff = await this.delDBData(dbList, inRangeData, 'id', 'schedule');
    // console.timeEnd('日程对比4');
    // console.time('日程对比5');
    await this.DBApi.putAll(
      {
        dbName: this.dbName,
        tableName: 'schedule',
      },
      scheduleData!.schedule
    );
    // console.timeEnd('日程对比5');
    // console.time('日程对比6');

    // 如果是先使用的缓存则需要发送消息
    if (cached && sendNotify) {
      const hasScheduleDiff = !!scheduleDiff.insertDiff.length || !!scheduleDiff.deleteDiff.length;
      // 有变化则发出通知
      if (hasScheduleDiff) {
        this.sendNotify({
          schedule: {
            hasDiff: hasScheduleDiff,
            diff: scheduleDiff,
          },
        });
      }
    }
    // 异步执行联系人更新操作
    setTimeout(() => {
      this.compareScheduleContactList(scheduleData);
    }, 0);
    // console.timeEnd('日程对比6');
    this.performanceApi.timeEnd({
      statKey: 'schedule_data_handle',
      statSubKey: 'sync_db',
      params: {
        event_count: `${scheduleData!.schedule.length}`,
      },
    });
    // console.timeEnd('2222日程对比');
  }

  // 异步执行，日程联系人表的同步工作
  async compareScheduleContactList(scheduleData: any) {
    // console.time('联系人对比2')
    // const mStart = moment(util.getTime(start));
    // const mEnd = moment(util.getTime(end));
    // const filterScheduleId: string[] = [];
    // scheduleData?.schedule.forEach((it: EntitySchedule) => {
    //   if (!util.rangeInteract([mStart, mEnd], [moment(it.start), moment(it.end)])) {
    //     filterScheduleId.push(it.id);
    //   }
    // });
    // const inRangeContactData = scheduleData?.scheduleContact.filter((it: { scheduleId: string; }) => !filterScheduleId.includes(it.scheduleId));
    // const scheduleIdList = DBList.map(i => i.id);
    // console.timeEnd('联系人对比2')
    // console.time('联系人对比3')

    // const contactList = await this.getScheduleContactById(scheduleIdList);
    // console.timeEnd('联系人对比3')
    // console.time('联系人对比4');

    // 删除diff 数据
    // this.delDBData(contactList, inRangeContactData, 'id', 'scheduleContact');
    // 插入数据
    if (scheduleData && scheduleData.scheduleContact) {
      this.DBApi.putAll(
        {
          dbName: this.dbName,
          tableName: 'scheduleContact',
        },
        scheduleData.scheduleContact
      );
    }

    // console.timeEnd('联系人对比4');
  }

  // 获取日程详情
  async doGetScheduleDetail(catalogId: number, recurrenceId: number, scheduleId: number) {
    // let data;
    let scheduleInfo;
    let contactInfo;
    const res = await this.syncScheduleDetail(catalogId, recurrenceId, scheduleId);
    if (res.success) {
      // data = res.data;
      scheduleInfo = res.data.schedule;
      contactInfo = res.data.scheduleContact;
      setTimeout(() => {
        this.deleteDiffScheduleContact(res.data.schedule, res.data.scheduleContact);
        this.DBApi.putAll(
          {
            dbName: this.dbName,
            tableName: 'schedule',
          },
          res.data.schedule
        );
        this.DBApi.putAll(
          {
            dbName: this.dbName,
            tableName: 'scheduleContact',
          },
          res.data.scheduleContact
        );
      }, 0);
    } else {
      scheduleInfo = await this.DBApi.getByEqCondition({
        dbName: this.dbName,
        tableName: 'schedule',
        query: {
          catalogId,
          scheduleId,
          recurrenceId,
        },
        // where: (table) => {
        //   return window.lf.op.and(
        //     table.catalogId.eq(catalogId),
        //     table.recurrenceId.eq(recurrenceId),
        //     table.scheduleId.eq(scheduleId),
        //   );
        // },
      });
      contactInfo = await this.getScheduleContactById([scheduleInfo[0].id]);
    }
    // const result = await Promise.all([
    //   this.getDBCatalogList(),
    //   this.getScheduleContactById([data[0].id])
    // ]);
    const result = await this.getDBCatalogList();
    return [
      {
        scheduleInfo: scheduleInfo[0],
        catalogInfo: result.find(i => i.id === catalogId) as EntityCatalog,
        contactInfo,
      },
    ];
  }

  // 获取日程详情
  async doGetScheduleDetailByUid(uid: string) {
    // let data;
    let scheduleInfo;
    let contactInfo;
    let catalogId: string;
    const res = await this.syncScheduleDetail(-1, -1, -1, uid);
    if (res.success) {
      // data = res.data;
      scheduleInfo = res.data.schedule;
      contactInfo = res.data.scheduleContact;
      catalogId = scheduleInfo[0]?.catalogId;
      setTimeout(() => {
        this.deleteDiffScheduleContact(res.data.schedule, res.data.scheduleContact);
        this.DBApi.putAll(
          {
            dbName: this.dbName,
            tableName: 'schedule',
          },
          res.data.schedule
        );
        this.DBApi.putAll(
          {
            dbName: this.dbName,
            tableName: 'scheduleContact',
          },
          res.data.scheduleContact
        );
      }, 0);
    }
    // const result = await Promise.all([
    //   this.getDBCatalogList(),
    //   this.getScheduleContactById([data[0].id])
    // ]);
    const result = await this.getSelfCatalogList();
    return [
      {
        scheduleInfo: scheduleInfo[0],
        catalogInfo: result.success ? (result.data?.find((i: resultObject) => i.id === catalogId) as EntityCatalog) : {},
        contactInfo,
      } as ScheduleModel,
    ];
  }

  // 新增日程
  doInsertSchedule(config: ScheduleInsert): Promise<ApiResponse> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('scheduleAdd'), {
      uid,
      searchTime: new Date().getTime(),
    });
    return this.http.post(url, config, { contentType: 'json' });
  }

  // 修改日程
  doUpdateSchedule(config: ScheduleUpdate): Promise<ApiResponse> {
    const uid = this.getEmail();
    let delPath = this.systemApi.getUrl('scheduleUpdate');
    delPath += config.recurrenceId ? '/cycle/' : '/nocycle/';
    delPath += config.isOrganizer ? 'organizer' : 'invitee';
    delete config.isOrganizer;
    const url = this.buildRequestUrl(delPath, {
      uid,
      searchTime: new Date().getTime(),
    });
    return this.http.post(url, config, { contentType: 'json' });
  }

  // 删除日程
  doDeleteSchedule(config: ScheduleDelete): Promise<ApiResponse> {
    const uid = this.getEmail();
    let delPath = this.systemApi.getUrl('scheduleDelete');
    delPath += config.recurrenceId ? '/cycle/' : '/nocycle/';
    delPath += config.isOrganizer ? 'organizer' : 'invitee';
    delete config.isOrganizer;
    const url = this.buildRequestUrl(delPath, {
      uid,
      searchTime: new Date().getTime(),
    });
    return this.http.post(url, config, { contentType: 'json' });
  }

  // 日程邀请操作
  doOperateSchedule(config: ScheduleOperate): Promise<ApiResponse> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('scheduleOperate'), {
      uid,
      searchTime: new Date().getTime(),
    });
    return this.http.post(url, config, { contentType: 'json' });
  }

  init(): string {
    if (inWindow() && !(this.systemApi.isElectron() && locationHelper.testPathMatch('writeMail'))) {
      this.eventApi.registerSysEventObserver('login', { func: this.watchLogin.bind(this), name: 'catalogLoginOb' });
    }
    return this.name;
  }

  private checkExpireScheduleNotice() {
    if (this.systemApi.isMainWindow() && this.systemApi.isElectron()) {
      this.initScheduleNoticeData().then(() => {
        this.initScheduleNoticeEvent();
        this.sendExpireScheduleNotice();
      });
    }
  }

  private clearNoticeTimeoutHandler() {
    const { noticeTimeoutHandler } = this.initData;
    console.log(Tag, 'clearNoticeTimeoutHandler', noticeTimeoutHandler);
    noticeTimeoutHandler?.forEach(handler => {
      clearTimeout(handler);
    });
  }

  afterInit() {
    const currentUser = this.systemApi.getCurrentUser();
    console.log(Tag, 'afterInit initCatalogData currentUser', currentUser);
    if (currentUser) {
      this.DBApi.initDb(this.dbName);
      this.initCatalogData().then(() => {
        console.log(Tag, 'afterInit initCatalogData then');
        // 重启过程中立即发送有可能触发invoke error
        this.checkExpireScheduleNotice();
      });
      if (inWindow() && this.systemApi.isElectron() && window.electronLib) {
        this.systemApi.addWindowHooks('onLaptopSuspend', () => {
          this.clearNoticeTimeoutHandler();
        });
        this.systemApi.addWindowHooks('onLockScreen', () => {
          this.clearNoticeTimeoutHandler();
        });
        this.systemApi.addWindowHooks('onLaptopResume', () => {
          this.clearNoticeTimeoutHandler();
          this._debounceCheckExpireScheduleNotice();
        });
        this.systemApi.addWindowHooks('onUnlockScreen', () => {
          this.clearNoticeTimeoutHandler();
          this._debounceCheckExpireScheduleNotice();
        });
      }
      // addHooksListener
    }
    return this.name;
  }

  // 数据库是否有数据
  async testDbNoData(): Promise<boolean> {
    let force = true;
    try {
      const data = await Promise.all([
        this.DBApi.getTableCount({
          dbName: this.dbName,
          tableName: 'catalog',
        }),
        this.DBApi.getTableCount({
          dbName: this.dbName,
          tableName: 'schedule',
        }),
      ]);
      console.log('[catalog] testDbNoData table count catalog,schedule', data);
      force = !data.some(item => item > 0);
    } catch (error) {
      console.error('[catalog] testDbNoData table count Error', error);
      force = true;
    }
    return force;
  }

  private sendCatalogInitModuleEvent() {
    this.eventApi.sendSysEvent({
      eventName: 'initModule',
      eventStrData: 'catalog',
    });
  }

  async initScheduleNoticeEvent() {
    const { noticeObjMap = {}, enableNotice } = this.initData;
    this.clearNoticeTimeoutHandler();
    const _noticeTimeoutHandler: any[] = [];
    const now = Date.now();
    Object.keys(noticeObjMap).forEach(deadline => {
      const noticeTime = Number(deadline);
      if (noticeTime > now && noticeTime - now <= NOTICE_INTERVAL_OFFSET) {
        const noticeList = [...noticeObjMap[noticeTime]];
        const handler = setTimeout(() => {
          console.log(Tag, 'customNotification called', noticeObjMap[noticeTime], enableNotice);
          if (enableNotice) {
            this.systemApi.createWindowWithInitData('scheduleReminder', {
              eventName: 'customNotification',
              eventData: {
                eventType: 'scheduleReminder',
                reminders: noticeList,
              },
            });
          }
        }, noticeTime - now);
        console.log(Tag, 'customNotification registed', deadline, noticeObjMap[noticeTime], now);
        _noticeTimeoutHandler.push(handler);
        delete noticeObjMap[noticeTime];
      }
    });
    this.initData.noticeTimeoutHandler = _noticeTimeoutHandler;
  }

  private getExpireTitleByReminderInfo(info: ReminderInfo, nowTime: number) {
    let title = '';
    let timeDiff = 0;
    const { scheduleStartDate, isAllDay } = info;
    // 取秒数差值计算
    const nowTimeSecondes = Math.floor(nowTime / 1000);
    const scheduleStartSecondes = Math.floor(scheduleStartDate / 1000);
    const oneDayTimestamp = 60 * 60 * 24 * 1000;
    let In18Text = ['BEFORENTIMEUNIT', 'BEFOREHOURSMINUTES'];

    // 现在时间已经大于日程开始时间
    if (nowTime > scheduleStartDate) {
      timeDiff = nowTimeSecondes - scheduleStartSecondes;
    } else {
      timeDiff = scheduleStartSecondes - nowTimeSecondes;
      In18Text = ['AFTERNTIMEUNIT', 'AFTERHOURSMINUTES'];
    }
    // 全天日程
    if (isAllDay) {
      // 现在时间已经大于日程开始时间
      if (nowTime > scheduleStartDate) {
        // 当前时间在，全天日程时间范围内，显示今天
        if (nowTime <= scheduleStartDate + oneDayTimestamp) {
          title = getIn18Text('JINTIAN');
        } else {
          title = getIn18Text(In18Text[0], { how: Math.floor(timeDiff / 60 / 60 / 24), manyTimes: this.getReminderTextByTimeUnit(TimeUnit.DAY) });
        }
      } else if (timeDiff <= 60 * 60 * 24) {
        // 日程还未开始，并且当前时间和日程开始时间相差小于24小时，显示明天
        title = getIn18Text('MINGTIAN');
      } else {
        title = getIn18Text(In18Text[0], { how: Math.ceil(timeDiff / 60 / 60 / 24), manyTimes: this.getReminderTextByTimeUnit(TimeUnit.DAY) });
      }
    } else if (timeDiff < 5) {
      // 小于5秒
      title = getIn18Text('XIANZAI');
    } else if (timeDiff < 60) {
      // 小于60秒
      title = getIn18Text(In18Text[0], { how: timeDiff, manyTimes: this.getReminderTextByTimeUnit(TimeUnit.SECONDS) });
    } else if (timeDiff < 60 * 60) {
      // 小于60分钟
      title = getIn18Text(In18Text[0], { how: Math.floor(timeDiff / 60), manyTimes: this.getReminderTextByTimeUnit(TimeUnit.MIN) });
    } else if (timeDiff < 60 * 60 * 24) {
      // 小于24小时
      title = getIn18Text(In18Text[1], { hour: Math.floor(timeDiff / 60 / 60), minutes: Math.floor((timeDiff / 60) % 60) });
    } else {
      // 大于24小时
      title = getIn18Text(In18Text[0], { how: Math.ceil(timeDiff / 60 / 60 / 24), manyTimes: this.getReminderTextByTimeUnit(TimeUnit.DAY) });
    }
    return title;
  }

  async sendExpireScheduleNotice() {
    const { noticeObjMap = {}, enableNotice } = this.initData;
    // 设置允许通知 且 主窗口 且 桌面端 才走后续流程
    if (!enableNotice || !this.systemApi.isMainWindow() || !this.systemApi.isElectron()) {
      return;
    }
    const now = Date.now();
    let _reminders: ReminderInfo[] = [];
    Object.keys(noticeObjMap).forEach(deadline => {
      const noticeTime = Number(deadline);
      if (noticeTime < now && now - noticeTime < NOTICE_EXPIRE_OFFSET) {
        console.log(Tag, 'sendExpireScheduleNotice called', noticeObjMap[noticeTime], enableNotice);
        const reminders = noticeObjMap[noticeTime].map(reminder => {
          const title = this.getExpireTitleByReminderInfo(reminder, now);
          return { ...reminder, reminder: title };
        });
        _reminders = _reminders.concat(reminders);
        // console.log(Tag, 'sendExpireScheduleNotice registed', deadline, noticeObjMap[noticeTime], now);
      }
    });
    if (_reminders.length) {
      this.systemApi.createWindowWithInitData('scheduleReminder', {
        eventName: 'customNotification',
        eventData: {
          eventType: 'scheduleReminder',
          reminders: _reminders,
        },
      });
    }
  }

  initScheduleNotice(param?: CatalogNotifyInfo) {
    if (this.systemApi.isMainWindow()) {
      if (param?.catalogId) {
        // TODO 增量更新 需要维护多个日历id以及拆分通知数据 暂不实现
        console.log(Tag, 'initScheduleNotice width catalog', param.catalogId);
      }
      this.initScheduleNoticeData().then(() => {
        this.initScheduleNoticeEvent();
        // this.sendExpireScheduleNotice();
      });
    }
  }

  // 初始化日历
  async initCatalogData() {
    const isAccountBg = !!(window && window.isAccountBg);
    if (!isAccountBg) {
      const noData = await this.testDbNoData();
      if (noData) {
        const catalog = await this.doGetCatalogByItem([], false);
        const ids = util.getKeyListByList(catalog, 'id', true);
        const time = Date.now();
        const startTime = util.getDateTime(time - 42 * 24 * 60 * 60 * 1000);
        const endTime = util.getDateTime(time + 42 * 24 * 60 * 60 * 1000);
        const schedule = await this.doGetScheduleByDate(ids, startTime, endTime);
        this.initData = {
          ...this.initData,
          catalog,
          schedule,
        };
      }
      // TODO web开发调试，提测前解 开
      if (this.systemApi.isMainWindow()) {
        // this.observeScheduleReminderMark();
        // 初始化先执行一遍
        await this.initScheduleNotice();
        try {
          this.systemApi.intervalEvent({
            seq: 0,
            eventPeriod: 'extLong', // 开发调试暂时用long
            // eventPeriod: 'long',
            id: 'schedule_notice_collector',
            handler: async () => {
              console.log(Tag, 'schedule_notice_collector called');
              // if (ev.seq > 0) {
              await this.initScheduleNotice();
              // }
            },
          });
        } catch (error) {
          console.error(Tag, 'initScheduleNoticeData error', error);
        }
      }
    }
    this.sendCatalogInitModuleEvent();
  }

  private getTimeUnitOffset(value: TimeUnit) {
    switch (value) {
      case TimeUnit.DAY:
        return 24 * 60 * 60 * 1000;
      case TimeUnit.MIN:
        return 1 * 60 * 1000;
      case TimeUnit.HOUR:
        return 60 * 60 * 1000;
      case TimeUnit.WEEK:
        return 7 * 24 * 60 * 60 * 1000;
      case TimeUnit.SECONDS:
      default:
        return 0;
    }
  }

  private getReminderTextByTimeUnit(value: TimeUnit) {
    switch (value) {
      case TimeUnit.DAY:
        return getIn18Text('TIAN');
      case TimeUnit.MIN:
        return getIn18Text('FENZHONG');
      case TimeUnit.HOUR:
        return getIn18Text('XIAOSHI');
      case TimeUnit.WEEK:
        return getIn18Text('XINGQI');
      case TimeUnit.SECONDS:
        return getIn18Text('MIAO');
      default:
        return '';
    }
  }

  private getDurationText(daysDiff: number) {
    switch (daysDiff) {
      case 0:
        return getIn18Text('XIANZAI');
      case 1:
        return getIn18Text('MINGTIAN');
      case 2:
        return getIn18Text('HOUTIAN');
      default:
        return '';
    }
  }

  /**
   * 生成日程提醒文案
   * @param startTime 日程开始时间
   * @param value 日程提醒参数
   * @param isAllDay 是否为全天日程
   * @returns 提醒文案
   */
  private getReminderText(startTime: number, value: ReminderParam, isAllDay: boolean) {
    // 日程开始时间
    const startTimeMom = moment(new Date(startTime));
    // 提醒时间
    const reminderDate = moment(new Date(startTime - this.getTimeUnitOffset(value.timeUnit) * value.interval));
    const dayDiff = startTimeMom.diff(reminderDate, 'days');
    let res = '';
    if (isAllDay) {
      reminderDate.set('hours', value.time?.hr || 0);
      reminderDate.set('seconds', value.time?.sec || 0);
      reminderDate.set('minutes', value.time?.min || 0);
    }
    const HHMM = reminderDate.format('HH:mm');

    if (dayDiff > 2) {
      res = getIn18Text('AFTERNTIMEUNIT', { how: dayDiff, manyTimes: getIn18Text('TIAN') });
    } else if (dayDiff > 0) {
      res = this.getDurationText(dayDiff) + HHMM;
    } else {
      res = isAllDay ? getIn18Text('XIANZAI') : getIn18Text('AFTERNTIMEUNIT', { how: value.interval, manyTimes: this.getReminderTextByTimeUnit(value.timeUnit) });
    }
    return res;
  }

  private getReminderDatetime(scheduleStartDate: number, reminder: ReminderParam, isAllDay: boolean) {
    const reminderDate = moment(new Date(scheduleStartDate - this.getTimeUnitOffset(reminder.timeUnit) * reminder.interval));
    if (isAllDay) {
      reminderDate.set('hours', reminder.time?.hr || 0);
      reminderDate.set('seconds', reminder.time?.sec || 0);
      reminderDate.set('minutes', reminder.time?.min || 0);
    }
    return reminderDate.toDate().getTime();
  }

  /**
   * 清洗数据，比对接口获取的日程提醒列表和db存储的已提醒列表
   * @param dbReminder db已提醒列表，key为“scheduleId_日程开始时间_提醒时间”拼接
   * @param schedule 接口返回的日程
   * @param formatedReminderInfo 接口返回的提醒列表（格式化后）
   * @returns 有效的提醒列表，即传入提醒队列
   */
  private filterNoticeReminder(dbReminder: Map<string, DBScheduleReminder>, schedule: EntitySchedule): ReminderInfo[] {
    // const dbMarkedReminders: string[] = [];
    const validReminders: ReminderInfo[] = [];
    // 枚举日程提醒，并转换为日程提醒窗口需要展示的格式数据
    schedule?.reminders?.forEach(reminder => {
      console.log(Tag, 'reminder list', reminder);
      const deadline = this.getReminderDatetime(schedule.start, reminder, !!schedule.allDay);
      const formatReminder = `${schedule.scheduleId}_${schedule.start}_${deadline}`;
      console.log(Tag, 'filterNoticedReminder formatedReminderInfo formatReminder', formatReminder);
      // reminderAction 为应用提醒或者应用和邮件提醒才为有效提醒
      if (!dbReminder.has(formatReminder) && reminder.reminderAction && reminder.reminderAction !== ReminderAction.EMAIL) {
        validReminders.push({
          scheduleId: schedule.scheduleId,
          title: schedule.summary || getIn18Text('WUZHUTI'),
          reminder: this.getReminderText(schedule.start, reminder, !!schedule.allDay),
          deadline,
          scheduleStartDate: schedule.start,
          scheduleEndDate: schedule.end,
          isAllDay: !!schedule.allDay,
          location: schedule.location,
          creator: schedule.organizer?.extNickname || '',
        });
      }
    });
    return validReminders;
  }

  async doPutScheduleReminderDB(reminders: ReminderInfo[] = []) {
    if (reminders.length) {
      // const { scheduleId, deadline, scheduleStartDate } = reminders;
      const dbReminders: DBScheduleReminder[] = reminders.map(item => ({
        id: `${item.scheduleId}_${item.scheduleStartDate}_${item.deadline}`,
        start: item.scheduleStartDate,
        scheduleId: item.scheduleId,
        updateTime: Date.now(),
      }));
      await this.DBApi.putAll({ dbName: this.dbName, tableName: 'scheduleReminder' }, dbReminders);
    }
  }

  async doDeleteScheduleReminderDB(scheduleIds: number[]) {
    if (scheduleIds.length) {
      await this.DBApi.deleteByByRangeCondition({
        dbName: this.dbName,
        tableName: 'scheduleReminder',
        adCondition: {
          field: 'scheduleId',
          args: scheduleIds,
          type: 'anyOf',
        },
      });
    }
  }

  private async doCompareDBScheduleReminder(reminderSchedule: EntitySchedule[]) {
    let noticeList: ReminderInfo[] = [];
    if (reminderSchedule?.length) {
      const dbScheduleMap: Map<DBScheduleReminder['id'], DBScheduleReminder> = new Map();
      // const dbScheduleIdSet: Set<DBScheduleReminder['scheduleId']> = new Set();
      const scheduleIds = reminderSchedule.map(item => item.scheduleId);
      // 查询DB
      const dbScheduleReminder = await this.doGetDBScheduleReminder(scheduleIds);
      // 枚举到Map中
      dbScheduleReminder.forEach(item => {
        dbScheduleMap.set(item.id, item);
        // dbScheduleIdSet.add(item.scheduleId);
      });
      // 枚举接口响应的提醒列表
      reminderSchedule.forEach(item => {
        // 找到scheduleId相同的提醒，比对提醒列表
        // if (dbScheduleIdSet.has(item.scheduleId)) {
        // scheduleId相同 但是日程开始时间与DB不同，则丢弃历史已保存的提醒记录
        // this.filterValidReminder(dbSchedule, reminderInfo);
        const validReminders = this.filterNoticeReminder(dbScheduleMap, item);
        if (validReminders.length) {
          noticeList = noticeList.concat(validReminders);
        }
        // } else {
        //   // 保存新日程提醒到提醒列表
        //   noticeList = noticeList.concat(reminderInfo);
        // }
      });
    }
    return noticeList;
  }

  async initScheduleNoticeData() {
    const time = Date.now();
    // 获取日程开始日期，一天前
    const startTime = util.getDateTime(time - 1 * 24 * 60 * 60 * 1000);
    // 获取日程开始日期，30天
    const endTime = util.getDateTime(time + 30 * 24 * 60 * 60 * 1000);
    const selfCatalog = await this.getSelfCatalogList();
    const settings = await this.doGetSetting();
    const currentUser = this.getEmail();
    let noticeList: ReminderInfo[] = [];
    const noticeObjMap: ReminderListMap = {};
    // const scheduleReminderData: ScheduleReminder[] = [];
    if (selfCatalog.success) {
      // 调试暂时为true
      if (settings.reminderNotice) {
        const ids = util.getKeyListByList(selfCatalog.data, 'id', true);
        const schedule = await this.doGetScheduleByDate(ids, startTime, endTime, false, false, false);
        const filteredSchedule = schedule
          .filter(s => {
            const isOwner = s?.scheduleInfo?.organizer?.extDesc === currentUser;
            // 受邀人接受状态
            const resStat = s?.scheduleInfo?.partStat;
            // 受邀人接受/待定/未操作
            const isInviteeOperaAvailable = resStat === 2 || resStat === 4 || resStat === 1;
            const hasReminders = s?.scheduleInfo?.reminders?.length > 0;
            return (isOwner || isInviteeOperaAvailable) && hasReminders;
          })
          .map(item => item.scheduleInfo);

        noticeList = await this.doCompareDBScheduleReminder(filteredSchedule);
        // 按提醒时间聚合通知
        noticeList.forEach(notice => {
          if (noticeObjMap[notice.deadline]) {
            const mergedNoticeList = noticeObjMap[notice.deadline];
            mergedNoticeList.push(notice);
            noticeObjMap[notice.deadline] = mergedNoticeList;
          } else {
            noticeObjMap[notice.deadline] = [notice];
          }
        });
      }
      console.log(Tag, 'noticeObjMap', noticeObjMap);
      this.initData = {
        ...this.initData,
        noticeObjMap,
        enableNotice: !!settings.reminderNotice,
      };
    } else {
      console.error('initScheduleNoticeData failed', 'fetch catalog error');
    }
  }

  private async doGetDBScheduleReminder(scheduleIds: number[]) {
    const res = await this.DBApi.getByRangeCondition({
      dbName: this.dbName,
      tableName: 'scheduleReminder',
      adCondition: {
        type: 'anyOf',
        field: 'scheduleId',
        args: [scheduleIds],
      },
    });
    // console.log('got schedule contact list for ' + idList.join(','), res);
    // console.timeEnd('getScheduleContactById');
    return res as DBScheduleReminder[];
  }

  // 通过联系人查询日历
  async doGetSubscribeCatalogByContact(params: SubscribeCatalogListParams): Promise<EntityCatalog[]> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('getSubscribeCatalogList'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    return this.transCatalogData(data!.data) as EntityCatalog[];
  }

  // 订阅日历
  async doSubscribeCatalog(params: SubscribeCatalogParams): Promise<boolean> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('subscribeCatalog'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    return data?.code === 200;
  }

  // 退订日历
  async doUnsubscribeCatalog(params: SubscribeCatalogParams): Promise<boolean> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('unsubscribeCatalog'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    // 优化点：异步删除本地库的日历,减少本地库对比通知
    this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: 'catalog',
      },
      params.catalogId
    );
    return data?.code === 200;
  }

  // 退订日历，日历列表发起
  async doDeleteCatalog(params: DeleteCatalogParams): Promise<boolean> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('deleteCatalog'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    // 优化点：异步删除本地库的日历,减少本地库对比通知
    this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: 'catalog',
      },
      params.catalogId
    );
    return data?.code === 200;
  }

  // 删除第三方账号，不再展示对应账号下的日历
  async deleteThirdAccountCatalog(params: DeleteThirdAccountCatalogParams): Promise<boolean> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('deleteThirdAccountCatalog'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const param = { syncAccountId: params.syncAccountId };
    const { data } = await this.http.post(url, param, { contentType: 'json' });
    // 优化点：异步删除本地库的日历,减少本地库对比通知，删除第三方账号下的所有日历,日历id数组从UI层传递进来，减少一次查库
    this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: 'catalog',
      },
      params.catalogIds
    );
    return data?.code === 200;
  }

  // 删除我的日历
  async doDeleteMyCatalog(params: DeleteCatalogParams): Promise<[boolean, string | undefined]> {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('deleteMyCatalog'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    // 优化点：异步删除本地库的日历,减少本地库对比通知
    this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: 'catalog',
      },
      params.catalogId
    );
    return [data?.code === 200, data?.err_msg];
  }

  // 获取忙闲
  async doGetFreeBusyList(params: FreeBusyQueryParams) {
    const uid = this.getEmail();
    const url = this.buildRequestUrl(this.systemApi.getUrl('freebusyList'), {
      uid,
      searchTime: new Date().getTime(),
    });
    const { data } = await this.http.post(url, params, { contentType: 'json' });
    // 跟日志一样,transFreeBusyData方法需要ZONE_LIST，提前请求下
    if (!ZONE_LIST || !ZONE_LIST.length) {
      await this.getZoneList();
    }
    return this.transFreeBusyData(data?.data, params);
  }

  async doActionCatalog(key: CatalogAction, onAfterClose: () => void, calendarId?: string) {
    const targetUrl = this.buildUrl(key, calendarId);
    // this.systemApi.openNewWindow(url, true);
    /* {
     onAfterClose: () => {
     try {
     onAfterClose();
     } catch (e) {
     console.log(e);
     }
     },
     } */
    const jumpableUrl = this.systemApi.getUrl('genMailOnlineJumpURL');
    if (!this.systemApi.isElectron()) {
      const preValiteRes = await this.http.get(jumpableUrl, {
        sid: this.systemApi.getCurrentUser()?.sessionId || '',
        module: '',
        hl: 'ZH',
      });
      if (preValiteRes.data && preValiteRes.data.success) {
        const preValiteUrl = (preValiteRes.data.data.url as string).replace(/(&l=).+/, `$1${encodeURIComponent(targetUrl)}`);
        this.systemApi.openNewWindow(preValiteUrl);
      }
      return;
    }
    this.systemApi
      .createWindow({
        type: 'customer',
        url: targetUrl,
        setMainWindowCookie: true,
        setMainLocalStorage: true,
        specifyCookieDomain: '.qiye.163.com',
        // callbacks: {
        //   onAfterClose: () => {
        //     onAfterClose();
        //   },
        // },
      })
      .then(res => {
        if (res && res.success && res.winId) {
          this.systemApi.addWindowHookConf({
            targetWinId: res.winId,
            hooksName: 'onAfterClose',
            intercept: false,
          } as WindowHooksObserverConf);
          const id = this.eventApi.registerSysEventObserver('electronClosed', {
            name: 'catalogElectronClosedOb' + res.winId,
            func: ev => {
              console.log('[catalog] hook callback ', res, ev);
              if (ev.eventStrData === String(res.winId)) {
                onAfterClose();
                this.eventApi.unregisterSysEventObserver('electronClosed', id);
              }
            },
          });
        }
      });
  }

  // 忙闲数据处理
  transFreeBusyData(resData: resultObject[], params: FreeBusyQueryParams) {
    const startTime = util.getTime(params.start as DateTime);
    const endTime = util.getTime(params.end as DateTime);
    const list: FreeBusyModel[] = [];
    if (Array.isArray(resData)) {
      resData.forEach(item => {
        list.push({
          account: item.account,
          freeBusyItems: item.freeBusyItems
            .map((fi: any) => {
              let start;
              let end;
              if (fi.allDay) {
                start = util.getTime(fi.start as DateTime);
                end = util.getTime(fi.end as DateTime);
              } else {
                const gmt = this.getGMT(fi);
                start = util.getTimeByGMT(fi.start as DateTime, gmt);
                end = util.getTimeByGMT(fi.end as DateTime, gmt);
              }
              return {
                allDay: fi.allDay,
                color: fi.color,
                summary: fi.summary,
                start,
                end,
                uid: fi.uid,
                scheduleId: fi.scheduleId,
                instanceId: fi.instanceId,
                recurrenceId: fi.recurrenceId,
              };
            })
            .filter((fi: any) => {
              if (fi.start !== fi.end) {
                return !(fi.end <= startTime || fi.start >= endTime);
              }
              return !(fi.end < startTime || fi.start > endTime);
            }),
        });
      });
    }
    return list;
  }

  // 获取时区
  async getZoneList(noCache = false): Promise<ZoneItem[]> {
    const email = this.getEmail();
    let res;
    try {
      if (!noCache && ZONE_LIST.length) {
        return ZONE_LIST;
      }
      const requestUrl = this.buildRequestUrl(this.systemApi.getUrl('zoneList'));
      const { data } = await this.http.post(
        requestUrl,
        {
          uid: email,
          searchTime: new Date().getTime(),
        },
        { contentType: 'form' }
      );
      if (data?.data && data?.data.length) {
        res = data?.data;
      } else {
        res = [];
      }
    } catch (message) {
      console.log('[catalog] getZoneList error', message);
      res = [];
    }
    ZONE_LIST = res;
    return res;
  }

  // 获取当前时区id,默认北京时区id:290
  async getZoneId(): Promise<number> {
    const key = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let zoneList = [];
    if (ZONE_LIST && ZONE_LIST.length) {
      zoneList = ZONE_LIST;
    } else {
      zoneList = await this.getZoneList();
    }
    if (zoneList.length) {
      const zone = zoneList.find(i => i.key === key);
      if (zone) {
        return zone.id;
      }
      return 290; // 默认北京时区id
    }
    return 290;
  }

  private buildUrl(key: CatalogAction, calendarId: string | undefined) {
    const func = this.urlMap[key];
    const hashPart = key === 'config' ? func + calendarId : func;
    const webMailHost = this.mailConfApi.getWebMailHost(true);
    return webMailHost + this.scheduleUrl + hashPart;
  }
}

const catalogApiImpl: Api = new CatalogApiImpl();
api.registerLogicalApi(catalogApiImpl);
export default catalogApiImpl;
