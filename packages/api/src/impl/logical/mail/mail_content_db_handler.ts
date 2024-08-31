/* eslint-disable max-lines */
import moment from 'moment';
import {
  ActionStore,
  ClassifyThreadMailsResult,
  EntityMailAttachment,
  EntityMailAttr,
  EntityMailContent,
  EntityMailData,
  EntityMailOperation,
  EntityMailStatus,
  mailAttrFilterName,
  mailBoxOfDefer,
  mailBoxOfDeleted,
  mailBoxOfDraft,
  mailBoxOfFakeThread,
  mailBoxOfRdFlag,
  mailBoxOfSpam,
  mailBoxTable,
  mailContentFilterName,
  mailContentFolderFilterName,
  mailDbCommonQueryFilterName,
  mailOperationTable,
  mailTable,
  tpMailFilterName,
  TpMailListQuery,
  mailBoxOfUnread,
  MailAttrType,
  mailBoxOfFilterStar,
  mailBoxOfStar,
  SubActionsType,
} from './mail_action_store_model';
import { api } from '@/api/api';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { FileApi } from '@/api/system/fileLoader';
import { ErrorReportApi } from '@/api/data/errorReport';
import { apis } from '@/config';
// import { MailOperationHandler } from './mail_operation_handler';
import {
  EntityMailBox,
  MailBoxEntryContactInfoModel,
  MailBoxModel,
  MailDeferParams,
  MailEntryInfo,
  MailEntryModel,
  MailModelEntries,
  MailOperationRecord,
  MailOperationType,
  MailSearchRecord,
  MailSearchRecordPayload,
  MailSearchRecordUpdatePayload,
  MailSearchTypes,
  MemberType,
  ParsedContact,
  queryMailBoxParam,
  RequestMailTagRequest,
  UpdateMailCountTaskType,
  FileTask,
  SaveMailsPutParams,
  EntityTpMail,
  MailAttrDbRes,
  MailConfApi,
  MailAttrConf,
  ListStarContactRes,
  StarAddressContactMap,
  MarkPayload,
  MailApi,
  // MailFileAttachModel,
} from '@/api/logical/mail';
import { resultObject } from '@/api/_base/api';
import { AdQueryCondition, AdQueryConfig, availableCompareFunc, DbApiV2 } from '@/api/data/new_db';
import { DataStoreApi } from '@/api/data/store';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import { getFolderStartContactId, getIsEncryptedMail, util } from '@/api/util';
import { SystemApi } from '@/api/system/system';
import { EventApi } from '@/api/data/event';
import { HtmlApi } from '@/api/data/html';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { MailAttactmentCacher } from './mail_attachment_cache';
import { edmMailHelper } from '@/api/util/edm_mail_helper';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { setMailAttSource } from '@/api/utils';

export interface MailContentCheckFeature {
  id: string | string[];
  noContent?: boolean; // 是否查找邮件的内容 ， 为否不查mail_content表
  noContact?: boolean; // 是否额外查找邮件的联系人，为否不查contact_dexie.contract相关表
  noStatus?: boolean; // 是否邮件的状态，为否不查mail_status表
  noAttachment?: boolean; // 是否查找邮件关联的附件，为否不查mail_attachment表
  noData?: boolean; // 是否查找邮件基础数据，为否不查mail_data表
  statusData?: EntityMailStatus[];
  contentData?: EntityMailContent[];
  mailData?: EntityMailData[];
  attachData?: EntityMailAttachment[];
  noContactRace?: boolean; // 不需要联系人 4s 的竞速等待，返回最终真实数据
  _account?: string;
}

type MailStatusChangeType = 'read' | 'redFlag' | 'spam' | 'folder' | 'top' | 'preferred' | 'defer' | 'requestReadReceiptLocal' | 'memo';

type MailStatParam = {
  newData: EntityMailStatus[];
  type: MailStatusChangeType;
  mark: boolean;
  fid: number;
  originData?: EntityMailStatus[] | undefined;
  payload?: MarkPayload;
  isThread?: boolean;
  _account?: string;
};

interface StarMailStatParam {
  mids: string[];
  mark: boolean;
  _account?: string;
}

const defaultMailEntryInfo: MailEntryInfo = {
  title: '',
  folder: 0,
  attachmentCount: 0,
  threadMessageCount: 0,
  replayed: false,
  forwarded: false,
  directForwarded: false,
  system: false,
  popRead: false,
  rcptSucceed: false,
  rcptFailed: false,
  content: {
    content: '',
    contentId: '',
  },
  id: '',
};

const MemberTypeMapper: StringMap = {
  发送: 'to',
  抄送: 'cc',
  密送: 'bcc',
};

/**
 * 数据库处理
 */
export class MailContentDbHelper {
  fileApi: FileApi;

  db: DbApiV2;

  actions: ActionStore;

  mailApi: MailApi;

  subActions?: SubActionsType;

  modelHandler: MailModelHandler;

  contactHandler: MailContactHandler;

  storeApi: DataStoreApi;

  systemApi: SystemApi;

  errReportApi: ErrorReportApi;

  eventApi: EventApi;

  htmlApi: HtmlApi;

  loggerHelper: DataTrackerApi;

  mailAttachmentCacher: MailAttactmentCacher;

  mailConfApi: MailConfApi;

  contactApi: ContactApi & OrgApi;

  static debugMailPopWindow = true;

  static translateSignTag = '<headm></headm>';

  static CLEAR_MAILS_KEY = 'clearMailLastCheck';

  constructor(actions: ActionStore, modelHandler: MailModelHandler, contactHandler: MailContactHandler, subActions?: SubActionsType) {
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    // action改造
    this.actions = actions;
    this.subActions = subActions;
    this.systemApi = api.getSystemApi();
    this.modelHandler = modelHandler;
    this.contactHandler = contactHandler;
    this.db = api.getNewDBApi();
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.fileApi = api.getFileApi();
    this.storeApi = api.getDataStoreApi();
    this.errReportApi = api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
    this.eventApi = api.getEventApi() as EventApi;
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
    this.loggerHelper = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.mailAttachmentCacher = new MailAttactmentCacher(this);
    ActionStore.dbEnable = true;
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
  }

  setMailCachePath(path: string) {
    this.mailAttachmentCacher.setMailCachePath(path);
  }

  initDbEnable() {
    const sync = this.storeApi.getSync(ActionStore.dbEnableKey);
    if (sync && sync.suc && sync.data) {
      ActionStore.dbEnable = sync.data === 'true';
    }
  }

  setDbEnable(flag: boolean) {
    ActionStore.dbEnable = flag;
    this.storeApi.put(ActionStore.dbEnableKey, String(ActionStore.dbEnable)).then().catch(console.warn);
  }

  async doListMailBox(_account?: string): Promise<MailBoxModel[] | undefined> {
    const data = await this.listMailBoxRawEntry(_account);
    if (!data) {
      return undefined;
    }
    data.forEach(item => {
      // if (item.mailBoxType === 'customer') {
      item.mailBoxUnread = item.mailBoxCurrentUnread;
      item.threadMailBoxUnread = item.threadMailBoxCurrentUnread;
      // }
    });
    const { starList } = await this.doListStarContact(_account);
    const mailBoxModels = await this.modelHandler.handleCommonFolderRet(data, starList, _account);

    // TODO: Action先关的改动，目前只有主账号才会去进行，有冇问题？(・・∂)?
    // if (!_account || _account === this.systemApi.getMainAccount().email) {
    this.modelHandler.saveMailBoxContentToAction(mailBoxModels, data, _account);
    // }

    return mailBoxModels;
  }

  async listMailBoxRawEntry(_account?: string) {
    let data;
    try {
      data = (await this.db.getByEqCondition(
        {
          ...mailBoxTable,
          _dbAccount: _account,
        },
        _account
      )) as EntityMailBox[];
      if (!data || data.length === 0) {
        return undefined;
      }
    } catch (e) {
      console.warn('check db mailbox failed:', e);
      return undefined;
    }
    return data;
  }

  buildQuery(param: queryMailBoxParam, _account?: string): Promise<resultObject[] | { totalCount: number; data: resultObject[] }> {
    const query = this.buildCondition(param);
    if (query) {
      const isRealList = this.mailConfApi.getIsUseRealListSync();
      if (query.adCondition) {
        if (isRealList && this.db.getByRangeConditionWithTotalCount) {
          return this.db.getByRangeConditionWithTotalCount(query, _account);
        }
        return this.db.getByRangeCondition(query, _account);
      }
      if (isRealList && this.db.getByEqConditionWithTotal) {
        return this.db.getByEqConditionWithTotal(query, _account);
      }
      return this.db.getByEqCondition(query, _account);
    }
    return Promise.reject(new Error('尚未实现'));
  }

  buildDeferMailCondition(param: queryMailBoxParam): AdQueryConfig {
    const [startTimeStr, endTimeStr] = param.filter?.defer ? param?.filter.defer.split(':') : [];
    const startTime = startTimeStr ? moment(startTimeStr).startOf('day').valueOf() : 0;
    const endTime = endTimeStr ? moment(endTimeStr).endOf('day').valueOf() : Number.MAX_VALUE;
    const adCondition: AdQueryConfig['adCondition'] = {
      field: ['isThread', 'isDefer', 'deferTime', 'rcTime'],
      type: 'between',
      args: [[0, 1, startTime], [0, 1, endTime], true, true],
    };
    return {
      start: param.index,
      count: param.count,
      adCondition,
      ...mailTable.status,
    };
  }

  // eslint-disable-next-line max-statements
  buildCondition(param: queryMailBoxParam): AdQueryConfig | undefined {
    const isThread = param.checkType === 'checkThread' ? 1 : 0;
    let query: AdQueryConfig | undefined;
    // 针对待办邮件
    if (param.id === mailBoxOfDefer.id) {
      return this.buildDeferMailCondition(param);
    }
    // 其他
    if (param.id && !param.filter && !param.status) {
      if (param.id === mailBoxOfRdFlag.id) {
        const adCondition: AdQueryConfig['adCondition'] = isThread
          ? {
              field: ['isThread', 'folder', 'redFlag', 'rcTime'],
              type: 'between',
              args: [[1, mailBoxOfFakeThread.id, 1, -Number.MAX_VALUE], [1, mailBoxOfFakeThread.id, 1, 0], true, true],
            }
          : {
              field: ['isThread', 'redFlag', 'rcTime'],
              type: 'between',
              args: [[0, 1, -Number.MAX_VALUE], [0, 1, 0], true, true],
            };
        query = {
          start: param.index,
          count: param.count,
          adCondition,
          filter: mailContentFilterName,
          ...mailTable.status,
        };
      } else if (param.id === mailBoxOfUnread.id) {
        const adCondition: AdQueryConfig['adCondition'] = isThread
          ? {
              field: ['isThread', 'folder', 'readStatus', 'rcTime'],
              type: 'between',
              args: [[1, mailBoxOfFakeThread.id, 0, -Number.MAX_VALUE], [1, mailBoxOfFakeThread.id, 0, 0], true, true],
            }
          : {
              field: ['isThread', 'readStatus', 'rcTime'],
              type: 'between',
              args: [[0, 0, -Number.MAX_VALUE], [0, 0, 0], true, true],
            };
        query = {
          start: param.index,
          count: param.count,
          adCondition,
          filter: mailContentFolderFilterName,
          ...mailTable.status,
        };
      } else if (param.topFlag === 'top') {
        query = {
          start: param.index,
          count: param.count,
          desc: param.desc,
          adCondition: {
            field: ['isThread', 'folder', 'rank', 'rcTime'],
            type: 'between',
            args: [[isThread, param.id, -11, -Number.MAX_VALUE], [isThread, param.id, 0, 0], true, true],
          },
          ...mailTable.status,
        };
      } else {
        query = {
          start: param.index,
          count: param.count,
          desc: param.desc,
          adCondition: {
            field: ['isThread', 'folder', 'rcTime'],
            type: 'between',
            args: [[isThread, param.id, -Number.MAX_VALUE], [isThread, param.id, 1], true, true],
          },
          ...mailTable.status,
        };
      }
    } else if (param.status) {
      const ret: AdQueryCondition = {
        type: 'between',
      };
      if (param.status === 'read') {
        if (param.id) {
          ret.field = ['isThread', 'folder', 'readStatus'];
          ret.args = [[isThread, param.id, 1], [isThread, param.id, 1], true, true];
        } else {
          ret.field = ['isThread', 'readStatus'];
          ret.args = [[isThread, 1], [isThread, 1], true, true];
        }
        // ret.readStatus = 1;
      } else if (param.status === 'unread') {
        if (param.id) {
          ret.field = ['isThread', 'folder', 'readStatus'];
          ret.args = [[isThread, param.id, 0], [isThread, param.id, 0], true, true];
        } else {
          ret.field = ['isThread', 'readStatus'];
          ret.args = [[isThread, 0], [isThread, 0], true, true];
        }
      } else if (param.status === 'redFlag') {
        if (param.id) {
          ret.field = ['isThread', 'folder', 'redFlag'];
          ret.args = [[isThread, param.id, 1], [isThread, param.id, 1], true, true];
        } else {
          ret.field = ['isThread', 'redFlag'];
          ret.args = [[isThread, 1], [isThread, 1], true, true];
        }
      }
      query = {
        start: param.index,
        count: param.count,
        adCondition: ret,
        ...mailTable.status,
      };
      // return this.db.getByEqCondition(query);
    } else if (param.id && param.filter) {
      let field = ['isThread', 'folder', '', 'rcTime'];
      const args: any[] = [[isThread, param.id, 0, -Number.MAX_VALUE], [isThread, param.id, 0, 0], true, true];
      const type: availableCompareFunc = 'between';
      if (param.filter.label0) {
        field[2] = 'redFlag';
        args[0][2] = 1;
        args[1][2] = 1;
      } else if (param.filter.flags?.read === false) {
        field[2] = 'readStatus';
        args[0][2] = 0;
        args[1][2] = 0;
      } else if (param.filter.preferred === 0) {
        field[2] = 'preferred';
        args[0][2] = 0;
        args[1][2] = 0;
      } else if (param.filter.sentDate) {
        field[2] = 'rank';
        args[0][2] = 0;
        args[1][2] = 0;
        args[0][3] = -Date.parse(param.filter.sentDate[1]);
        args[1][3] = -Date.parse(param.filter.sentDate[0]);
      }
      field = field.filter(v => !!v);
      query = {
        start: param.index,
        desc: param.desc,
        count: param.count,
        adCondition: { field, type, args },
        ...mailTable.status,
      };
    }
    if (!param.id && !param.ids && param.tag) {
      query = {
        start: param.index,
        // count: 500,
        count: Math.min(param.count, 1000),
        adCondition: {
          field: 'tags',
          type: 'anyOf' as availableCompareFunc,
          args: param.tag,
        },
        order: 'rcTime',
        orderUsingIndex: false,
        filter: mailDbCommonQueryFilterName,
        ...mailTable.status,
        additionalData: {
          isThread,
        },
      };
    }
    if (param.ids) {
      // TODO : use multiple index ?
    }
    return query;
  }

  async doListMailEntry(param: queryMailBoxParam, _account?: string): Promise<MailModelEntries | undefined> {
    let data: MailModelEntries | undefined;
    try {
      console.log('checkStarMail', param);
      if (!param.checkType || ['normal', 'checkThread', 'checkStarMail'].includes(param.checkType) || edmMailHelper.isEdmMailReq(param.checkType)) {
        let mids: string[] | undefined;
        let totalCount: number | null = null;
        if (param.mids && param.mids.length > 0) {
          mids = param.mids;
        } else if (process.env.BUILD_ISEDM && edmMailHelper.isEdmMailReq(param.checkType)) {
          return this.doListCustomerMailBoxEntities(param);
        } else if (param.checkType === 'checkStarMail') {
          // 星标联系人邮件
          mids = await this.doListStarMailBoxEntities(param, _account);
        } else {
          const entriesPromise = this.buildQuery(param, _account);
          const queryResult = await entriesPromise;
          let result = Array.isArray(queryResult) ? queryResult : queryResult.data;

          if (!Array.isArray(queryResult) && queryResult && queryResult.totalCount) {
            totalCount = queryResult.totalCount;
          }
          result = result.filter(v => !!v);
          if (result && result.length > 0) {
            mids = result.map(it => it.mid);
          }
        }
        const mailEntryModels =
          mids && mids.length > 0
            ? await this.getMailById({
                id: mids,
                noContent: true,
                noContactRace: param.noContactRace,
                _account: param._account,
              })
            : [];
        data = {
          count: param.count,
          index: param.index || 0,
          query: param,
          total: totalCount || mailEntryModels.length,
          data: mailEntryModels.map(it => this.makeModelSafe(it)),
          building: -1,
        };
      }
    } catch (e) {
      console.warn('check db mailEntry failed:', e);
      return undefined;
    }
    return data;
  }

  doListCustomerMailBoxEntities(param: queryMailBoxParam): Promise<MailModelEntries> {
    const currentUser = this.systemApi.getCurrentUser();
    const { attrQuery } = param;

    if (!currentUser || !attrQuery || (Array.isArray(attrQuery) && attrQuery.length === 0)) {
      return Promise.resolve({
        count: param.count || 0,
        index: param.index || 0,
        query: param,
        total: 0,
        data: [],
        building: -1,
      });
    }
    return Promise.resolve({
      count: param.count || 0,
      index: param.index || 0,
      query: param,
      total: 0,
      data: [],
      building: -1,
    });
    // TODO: 1.19星标联系人邮件对 mail_attr 做了比较大的改动，外贸客户邮件原来的逻辑需要适配（原来的方案无法解决抄送密送的本地问题，也没有上线）
    // const query = Array.isArray(attrQuery) ? attrQuery : [attrQuery];
    // const queryCondition: Required<MailAttrQuery>[] = query.map(v => ({
    //   from: v.from || currentUser?.id,
    //   to: (Array.isArray(v.to) ? v.to : [v.to]).filter(it => !!it)
    // }));
    // const endTime = param.endDate ? (new Date(param.endDate).getTime() || 0) : 0;
    // return this.getMailIdsByAddressInPairs(queryCondition, param.count, endTime, param.attrQueryFilter).then(res => {
    //   const selfMailIds = res.filter(v => !v.isTpMail).map(v => v.mid);
    //   const tpMailIds = res.filter(v => v.isTpMail).map(v => v.mid);
    //   const p1 = () => this.getMailById({
    //     id: selfMailIds,
    //     noContent: true,
    //     noContactRace: param.noContactRace
    //   });
    //   const p2 = () => this.getTpMailById({
    //     id: tpMailIds,
    //   });
    //   return Promise.all([p1(), p2()]);
    // }).then(([res1, res2]) => {
    //   const models = [...res1, ...res2].sort((prev, next) => {
    //     if (prev.entry.sendTime && next.entry.sendTime) {
    //       const aDate = util.parseDate(prev.entry.sendTime);
    //       const bDate = util.parseDate(next.entry.sendTime);
    //       if (aDate && bDate) {
    //         return bDate - aDate;
    //       }
    //     }
    //     return 0;
    //   });
    //   console.log('[mail] doListCustomerMailBoxEntities', models);
    //   return {
    //     count: param.count,
    //     index: param.index || 0,
    //     query: param,
    //     total: models.length,
    //     data: models.map(it => this.makeModelSafe(it)),
    //     building: -1,
    //   };
    // });
  }

  // 星标联系人邮件
  async doListStarMailBoxEntities(param: queryMailBoxParam, _account?: string): Promise<string[]> {
    console.log('doListStarMailBoxEntities');
    if (!param.id || !this.modelHandler.isValidStarFolderId(param.id)) {
      throw new Error('星标联系人邮件本地查询参数错误');
    }
    // 目前只处理单个查询联系人或联系人组的情况
    if (!param.attrConf) {
      const attrConf = await this.modelHandler.doGetStarContactQuery(param.id, _account);
      param.attrConf = {
        ...attrConf,
        attrType: 'star',
      };
    }
    const { id, emailList, attrValue } = param.attrConf;
    if (!id || emailList.length === 0) {
      return [];
    }
    let adCondition: AdQueryConfig['adCondition'];
    let adQuery: AdQueryConfig;
    if (param.filter?.flags?.read === undefined) {
      const accountAlias = this.systemApi.getCurrentUserAccountAlias(_account);
      const currentUser = this.systemApi.getCurrentUser(_account);
      const currentId = currentUser?.id ? [currentUser?.id] : [];
      adCondition = {
        field: ['attrType', 'attrValue', 'rcTime'],
        type: 'between',
        args: [['star', attrValue, -Number.MAX_VALUE], ['star', attrValue, 0], true, true],
      };
      adQuery = {
        start: param.index || 0,
        count: param.count || 30,
        adCondition,
        additionalData: {
          exchangeType: param.attrQueryFilter?.type,
          filterValue: accountAlias.length > 0 ? accountAlias : currentId,
        },
        filter: mailAttrFilterName,
        ...mailTable.attr,
      };
    } else {
      const readStatus = param.filter?.read ? 1 : 0;
      adCondition = {
        field: ['attrType', 'attrValue', 'readStatus', 'rcTime'],
        type: 'between',
        args: [['star', attrValue, readStatus, -Number.MAX_VALUE], ['star', attrValue, readStatus, 0], true, true],
      };
      adQuery = {
        start: param.index || 0,
        count: param.count || 30,
        adCondition,
        ...mailTable.attr,
      };
    }
    return this.db.getByRangeCondition(adQuery, _account).then(res => {
      console.log('[mails attr] db query res', res);
      return (res as EntityMailAttr[]).map(v => v.mid);
    });
  }

  makeModelSafe(entry: MailEntryModel): MailEntryModel {
    entry.entry.content = entry.entry.content || {
      content: '',
      contentId: '',
    };
    entry.receiver = entry.receiver || [];
    entry.sender = entry.sender || this.contactHandler.buildEmptyContact(false)[0];
    return entry;
  }

  async doGetMailContent(mid: string, noContactRace = false, _account?: string): Promise<MailEntryModel | undefined> {
    // let data: MailEntryModel | undefined = undefined;
    try {
      const result = await this.getMailById({ id: mid, noContactRace, _account });
      if (result && result.length > 0 && !this.modelHandler.isEntryContentEmpty(result[0])) {
        return result[0];
      }
      return undefined;
    } catch (e) {
      console.warn('check db mailContent failed:', e);
      return undefined;
    }
    // return data;
  }

  async doGetTpMailContent(mid: string): Promise<MailEntryModel | undefined> {
    const result = await this.getTpMailById({ id: mid }).then(res => setMailAttSource(res, 'content'));
    if (result && result.length > 0 && !this.modelHandler.isEntryContentEmpty(result[0]) && !this.modelHandler.checkAttachmentUrl(result[0])) {
      return result[0];
    }
    return undefined;
  }

  async getMailContentTableInDb(mid: string, _account?: string): Promise<resultObject> {
    const content: resultObject = await this.db.getById(mailTable.content, mid, _account);
    return content || {};
  }

  // langType、langListMap、title、content的变更到数据库
  async syncTranslateContentToDb(mid: string, langType: string, conditions?: string, _account?: string): Promise<boolean> {
    // const content:resultObject = await this.db.getById(mailTable.content, mid);
    const content: resultObject = await this.getMailContentTableInDb(mid, _account);
    // 如果查不到,就不走数据库了
    if (Object.keys(content).length === 0) {
      return false;
    }
    if (!content.langListMap?.origin) {
      // const taskContactList:Map<string, ContactModel> = new Map<string, ContactModel>();
      content.langListMap.origin = content.title + MailContentDbHelper.translateSignTag + content.content;
    }
    if (conditions) {
      content.langListMap[langType] = conditions;
    }
    // const translateContent = conditions || content.langListMap[langType];
    content.langType = langType;
    // const [titleStr, contentStr] = translateContent.split(MailContentDbHelper.translateSignTag);
    // content.title = titleStr;
    // content.content = contentStr;
    await this.db.put(mailTable.content, content, _account);
    return true;
  }

  // 存原文的语言
  async syncContentLangToDb(mid: string, originLang: string, _account?: string): Promise<boolean> {
    const content: resultObject = await this.getMailContentTableInDb(mid, _account);
    // 如果查不到,就不走数据库了
    if (Object.keys(content).length === 0) {
      return false;
    }
    const langListMap = content.langListMap || {};
    langListMap.originLang = originLang;
    content.langListMap = langListMap;
    await this.db.put(mailTable.content, content, _account);
    return true;
  }

  // 根据聚合邮件主邮件获得关联的详情邮件
  async getThreadMessageByThreadMails(result: EntityMailStatus[], _account?: string) {
    const threadMessageIds = result
      .filter(v => !!v)
      .reduce<string[]>((total, current) => {
        if (current.isThread && Array.isArray(current.threadMessageIds)) {
          total.push(...current.threadMessageIds);
        }
        return total;
      }, []);
    const threadResult = (await this.db.getByIds({ ...mailTable.status, _dbAccount: _account }, [...new Set(threadMessageIds)])) as EntityMailStatus[];
    return threadResult.filter(v => !!v);
  }

  // 根据聚合邮件ID获得关联的详情邮件
  async getThreadMessageByThreadIds(tids: (string | undefined)[] | undefined, _account?: string) {
    if (!tids || tids.length === 0) {
      return {
        threadMails: [] as EntityMailStatus[],
        threadMessages: [] as EntityMailStatus[],
      };
    }
    const threadIds: string[] = tids.filter(v => !!v) as string[];
    const result = ((await this.db.getByIds({ ...mailTable.status, _dbAccount: _account }, [...new Set(threadIds)], _account)) as EntityMailStatus[]).filter(v => !!v);
    let threadMails: EntityMailStatus[] = [];
    let threadMessageResult: EntityMailStatus[] = [];
    if (result && result.length > 0) {
      threadMessageResult = await this.getThreadMessageByThreadMails(result, _account);
      const { threadIds: ids } = this.extractThreadIds(result);
      threadMails = ((await this.db.getByIds(mailTable.status, [...new Set(ids)], _account)) as EntityMailStatus[]).filter(v => !!v);
    }
    return {
      threadMails,
      threadMessages: threadMessageResult.filter(v => !!v),
    };
  }

  // 传入一组ID，按照聚合邮件和普通邮件进行分类，默认会返回伪造的threadId，例如 threadId-folderId
  async classifyThreadMailsByIds(id: string | string[], ignoreFakeThreadId?: boolean, _account?: string): Promise<ClassifyThreadMailsResult> {
    const result = ((await this.db.getByIds({ ...mailTable.status, _dbAccount: _account }, Array.isArray(id) ? id : [id], _account)) as EntityMailStatus[]).filter(
      v => !!v
    );

    const { threadIds, fakeThreadIds } = this.extractThreadIds(result, ignoreFakeThreadId);
    const normalIds = result.filter(v => v && !v.isThread).map(v => v.mid);
    return {
      threadIds,
      normalIds,
      fakeThreadIds,
    };
  }

  private extractThreadIds(result: EntityMailStatus[], ignoreFakeThreadId?: boolean | undefined) {
    const fakeThreadIds: string[] = [];
    const filteredResult = result.filter(v => v && v.isThread);
    const reduceFunc = (total: string[], current: EntityMailStatus) => {
      let ret = total;
      if (current.convFids && current.convFids.length > 0) {
        const fakeIds: string[] = current.convFids.map(fid => util.getJointThreadId(current.threadId, fid));
        const children = ignoreFakeThreadId ? [] : fakeIds;
        fakeThreadIds.push(...fakeIds);
        const set = new Set([...total, ...children]);
        if (current.threadId) {
          set.add(current.threadId);
        }
        if (set) {
          ret = Array.from(set);
        }
      }
      return ret;
    };
    const threadIds: string[] = filteredResult.reduce<string[]>(reduceFunc, [] as string[]) as string[];
    return { threadIds, fakeThreadIds };
  }

  async doDeleteMail(param: {
    originData: EntityMailStatus[];
    fid: number;
    id?: string | string[];
    isThread?: boolean;
    deletedId: string[];
    moveId: string[];
    ignoreThread?: boolean;
    _account?: string;
  }): Promise<EntityMailStatus[] | undefined> {
    const { originData, fid, id, isThread, deletedId = [], moveId = [], _account } = param;
    let result;
    if (id) {
      const checkIds = Array.isArray(id) ? id : [id];
      result = ((await this.db.getByIds({ ...mailTable.status, _dbAccount: _account }, checkIds)) as EntityMailStatus[]).filter(v => !!v);
    } else if (fid) {
      // TODO : batch delete should reduce the size and do it multiple times
      result = (await this.db.getByEqCondition(
        {
          query: { folder: fid },
          ...mailTable.status,
          _dbAccount: _account,
        },
        _account
      )) as EntityMailStatus[];
    }
    result = result ? result.filter(v => !!v) : [];
    if (result && result.length > 0) {
      if (fid) {
        const tempIds = [];
        result.forEach(v => {
          if (v.isThread && v.threadId && v.mid.includes('--')) {
            tempIds.push(v.threadId);
          }
        });
      }
      if (isThread) {
        const threadResult = await this.getThreadMessageByThreadMails(result, _account);
        if (threadResult.length > 0) {
          result.push(...threadResult);
        }
      } else if (!param.ignoreThread) {
        // 如果聚合邮件的所有关联邮件都被删除了，那么聚合邮件本身也要被删除
        const resultWithThreadId = result.filter(v => v && v.threadId);
        const tempResult: EntityMailStatus[] = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const item of resultWithThreadId) {
          if (item.threadId) {
            // eslint-disable-next-line no-await-in-loop
            const { threadMails } = await this.getThreadMessageByThreadIds([item.threadId], _account);
            // 除了当前要删除的邮件之外，没有其他要删除的邮件了，可以把聚合邮件也放到待删除（包括待回滚）列表中
            if (threadMails.length > 0) {
              const threadMail = threadMails[0];
              const { threadMessageIds } = threadMail;
              if (!Array.isArray(threadMessageIds) || (threadMessageIds[0] === item.mid && threadMessageIds.length === 1)) {
                tempResult.push(...threadMails);
              }
            }
          }
        }
        result.push(...tempResult);
      }
      result.forEach(it => {
        if (it.folder === mailBoxOfDeleted.id) {
          if (it.mid) {
            deletedId.push(it.mid);
          }
        } else {
          if (it.mid) {
            moveId.push(it.mid);
          }
          originData.push({ ...it } as EntityMailStatus);
        }
      });
      return this.doMarkInDb({
        newData: result,
        type: 'folder',
        mark: true,
        fid: mailBoxOfDeleted.id,
        originData,
        isThread,
        _account,
      });
    }
    return [];
  }

  async deleteInActionById(deletedId: string[], _account?: string) {
    if (deletedId && deletedId.length > 0) {
      try {
        await this.deleteByIds(deletedId, _account);
      } finally {
        await this.modelHandler.notifyFolderCountChange(true, _account);
      }
    }
  }

  // eslint-disable-next-line max-params
  async doMarkMail(
    mark: boolean,
    id: string[] | string,
    type: MailOperationType,
    isThread?: boolean,
    payload?: MarkPayload,
    _account?: string
  ): Promise<EntityMailStatus[] | undefined> {
    console.log('[mail mark]', type, id);
    const checkIds = Array.isArray(id) ? id : [id];
    const result = ((await this.db.getByIds(mailTable.status, checkIds, _account)) as EntityMailStatus[]).filter(v => !!v);
    if (result && result.length > 0) {
      if (isThread) {
        // 聚合邮件的置顶操作不会影响单封置顶
        if (type !== 'top') {
          const threadResult = await this.getThreadMessageByThreadMails(result, _account);
          result.push(...threadResult);
        }
      } else {
        const resultWithThreadId = result.filter(v => v.threadId).filter(v => !!v);
        const threadMailIds = resultWithThreadId.map(v => v.threadId);
        // 只要有一封单封邮件是未读的，那么聚合邮件就是未读的，所有单封都是已读，聚合邮件才已读
        if (type === 'read') {
          const tempResult: EntityMailStatus[] = [];
          // eslint-disable-next-line no-restricted-syntax
          for (const item of resultWithThreadId) {
            // eslint-disable-next-line no-await-in-loop
            const { threadMessages, threadMails } = await this.getThreadMessageByThreadIds([item.threadId], _account);
            // 所有都已读了，聚合邮件才是已读
            if (mark) {
              // 除了当前要标记的邮件之外，其他所有邮件未读的邮件
              const unreadThreadMessages = threadMessages.filter(v => v.readStatus === 0 && v.mid !== item.mid);
              // eslint-disable-next-line max-depth
              if (unreadThreadMessages.length === 0) {
                console.log('[mail mark] ', id, ' mark thread same time', threadMails);
                tempResult.push(...threadMails);
              } else {
                console.log('[mail mark] ', id, ' unread messages', unreadThreadMessages);
              }
            } else {
              // 当前标记为未读，那么就是未读
              tempResult.push(...threadMails);
            }
          }
          result.push(...tempResult);
        }
        // 如果是针对单封邮件的操作，只有『添加』操作才会影响到关联的聚合邮件
        if (type === 'redFlag' && mark) {
          const { threadMails } = await this.getThreadMessageByThreadIds(threadMailIds, _account);
          if (threadMails && threadMails.length > 0) {
            result.push(...threadMails);
          }
        }
      }
    }

    try {
      return await this.doMarkInDb({
        newData: result,
        type,
        mark,
        fid: -1000,
        isThread,
        payload,
        _account,
      });
    } finally {
      // this.modelHandler.notifyFolderCountChange(false);
    }
  }

  async doMarkMailDefer(mid: string | string[], isDefer: boolean, conf: MailDeferParams, _account?: string): Promise<EntityMailStatus[]> {
    const ids = Array.isArray(mid) ? mid : [mid];
    const originData = ((await this.db.getByIds(mailTable.status, ids, _account)) as EntityMailStatus[]).filter(v => !!v);
    if (originData && originData.length > 0) {
      const newData: EntityMailStatus[] = originData.map(v => ({
        ...v,
        isDefer: isDefer ? 1 : 0,
        deferTime: isDefer && conf.deferTime && conf.deferTime > 0 ? conf.deferTime : undefined,
        deferNotice: isDefer && conf.deferNotice ? 1 : 0,
      }));
      const ret = (await this.db.putAll(mailTable.status, newData, undefined, _account)) as EntityMailStatus[];
      console.log('[mail] doMarkMailDefer save', ret);
      return ret;
    }
    return [];
  }

  async getMailLeastUpdated(fid: number, toTimestamp: number, fromTimestamp: number, count?: number): Promise<EntityMailStatus[]> {
    const field = ['folder', 'updateTime'];
    const args: any[] = [[fid, fromTimestamp], [fid, toTimestamp], true, true];
    return (await this.db.getByRangeCondition({
      start: 0,
      count: count || 100,
      adCondition: {
        field,
        type: 'between' as availableCompareFunc,
        args,
      },
      ...mailTable.status,
    })) as EntityMailStatus[];
  }

  async doMarkMailInfFolder(mark: boolean, fid: number, isThread?: boolean, _account?: string): Promise<EntityMailStatus[] | undefined> {
    const result = (await this.db.getByEqCondition(
      {
        query: {
          '[isThread+folder+readStatus]': [isThread ? 1 : 0, fid, mark ? 0 : 1],
        },
        ...mailTable.status,
      },
      _account
    )) as EntityMailStatus[];

    if (result && result.length > 0 && isThread) {
      const threadIds = result.filter(v => v && v.isThread).map(v => v.mid);
      const tempResult = await this.getThreadMessageByThreadIds(threadIds, _account);
      const threadMails = tempResult.threadMails.filter(v => v && !threadIds.includes(v.mid));
      result.push(...threadMails);
      result.push(...tempResult.threadMessages);
    }

    return this.doMarkInDb({
      newData: result,
      type: 'read',
      mark,
      fid: -1000,
      isThread,
      _account,
    });
  }

  private async doMarkInDb(conf: MailStatParam) {
    const { newData, type, mark, fid, originData, _account, payload } = conf;
    if (newData && newData.length > 0) {
      const filterData = this.filterMarkResult(newData, type, mark, fid, payload);
      let ret = [] as EntityMailStatus[];
      if (filterData && filterData.length > 0) {
        ret = (await this.db.putAll({ ...mailTable.status, _dbAccount: _account }, filterData)) as EntityMailStatus[];
        if (type === 'folder') {
          const needDeleteAttrList = filterData.filter(({ folder }) => mailBoxOfFilterStar[folder]).map(v => v.mid);
          if (needDeleteAttrList.length > 0) {
            // 如果邮件被移动到上述三个文件夹，则mail_attr数据需要删掉
            this.deleteMailAttrByMids(needDeleteAttrList).then();
          }
        }
        console.log('[mail] doMarkInDb save', ret);
        if (type === 'read' || type === 'folder') {
          await this.updateMailStat({
            newData: filterData,
            type,
            mark,
            fid,
            originData,
            isThread: conf.isThread,
            _account,
          });
          if (type === 'read') {
            // 标记星标联系人邮件的 readStatus
            const mids = newData.map(v => v.mid);
            await this.updateStarMailStat({ mids, mark, _account });
          }
        }
      }
      return ret;
    }
    return [];
  }

  private async updateMailStat(conf: MailStatParam) {
    const { newData, type, mark, fid, originData, _account } = conf;
    if (!newData || newData.length === 0) {
      return;
    }
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const { mailBoxDic } = targetActions || {};
    if (!mailBoxDic) {
      return;
    }
    const changedFolderMap: Map<number, EntityMailBox> = new Map();
    if (type === 'read') {
      this.loggerHelper.track('mark_mail', { stage: 'update_mail_start', newData });
      newData.forEach(it => {
        const folderId = it.folder;
        const folder = mailBoxDic[folderId];
        if (folder) {
          if (it.isThread) {
            folder.threadMailBoxCurrentUnread += mark ? -1 : 1;
            folder.threadMailBoxUnread += mark ? -1 : 1;
          } else {
            folder.mailBoxCurrentUnread += mark ? -1 : 1;
            folder.mailBoxUnread += mark ? -1 : 1;
          }
          const keys = ['threadMailBoxCurrentUnread', 'threadMailBoxUnread', 'mailBoxCurrentUnread', 'mailBoxUnread'];
          keys.forEach(key => {
            if (folder[key as 'threadMailBoxCurrentUnread'] < 0) {
              console.error('[mail mark] < 0 type read', key, it, conf);
              folder[key as 'threadMailBoxCurrentUnread'] = 0;
            }
          });
          changedFolderMap.set(folderId, folder);
        }
      });
    } else if (type === 'folder') {
      if (!originData) {
        return;
      }
      const map: Map<string, EntityMailStatus> = new Map<string, EntityMailStatus>();
      originData.forEach(it => {
        map.set(it.mid, it);
      });
      const toFolder = mailBoxDic[fid];
      if (toFolder) {
        toFolder.mailBoxTotal += newData.length;
        changedFolderMap.set(fid, toFolder);
        newData.forEach(it => {
          const item = map.get(it.mid);
          if (item) {
            const fromFolder = mailBoxDic[item.folder];
            if (fromFolder) {
              fromFolder.mailBoxTotal -= 1;
              const isDraftMailMove = [toFolder.mailBoxId, fromFolder.mailBoxId].includes(mailBoxOfDraft.id);
              if (item.readStatus === 0 || isDraftMailMove) {
                if (it.isThread) {
                  fromFolder.threadMailBoxCurrentUnread -= 1;
                  fromFolder.threadMailBoxUnread -= 1;
                  toFolder.threadMailBoxCurrentUnread += 1;
                  toFolder.threadMailBoxUnread += 1;
                } else {
                  fromFolder.mailBoxCurrentUnread -= 1;
                  fromFolder.mailBoxUnread -= 1;
                  toFolder.mailBoxCurrentUnread += 1;
                  toFolder.mailBoxUnread += 1;
                }
                const keys = ['threadMailBoxCurrentUnread', 'threadMailBoxUnread', 'mailBoxCurrentUnread', 'mailBoxUnread'];
                keys.forEach(key => {
                  if (fromFolder[key as 'threadMailBoxCurrentUnread'] < 0) {
                    console.error('[mail mark] < 0 type folder', key, it, conf);
                    fromFolder[key as 'threadMailBoxCurrentUnread'] = 0;
                  }
                });
                changedFolderMap.set(item.folder, fromFolder);
              }
            }
          }
        });
      }
      // 处理聚合邮件相关
      await this.updateThreadMailCount(newData, toFolder.mailBoxId, _account);
    }
    const changedFolder: EntityMailBox[] = [...changedFolderMap.values()].map(v => {
      ['mailBoxTotal', 'threadMailBoxTotal', 'mailBoxUnread', 'mailBoxCurrentUnread', 'threadMailBoxUnread', 'threadMailBoxCurrentUnread'].forEach(key => {
        if (v[key as 'mailBoxTotal'] < 0) {
          console.error('[mail mark] < 0', key, v, conf);
        }
      });
      return {
        ...v,
        mailBoxTotal: Math.max(v.mailBoxTotal, 0),
        threadMailBoxTotal: Math.max(v.threadMailBoxTotal, 0),
        mailBoxUnread: Math.max(v.mailBoxUnread, 0),
        mailBoxCurrentUnread: Math.max(v.mailBoxCurrentUnread, 0),
        threadMailBoxUnread: Math.max(v.threadMailBoxUnread, 0),
        threadMailBoxCurrentUnread: Math.max(v.threadMailBoxCurrentUnread, 0),
      };
    });
    console.log('doMarkMail in api updateMailStat');
    await this.saveMailBoxes(changedFolder, _account);
    // 本地更新文件夹未读数
    const folderRes = await this.doListMailBox(_account);
    this.eventApi.sendSysEvent({
      eventName: 'mailChanged',
      eventStrData: 'syncFolder',
      eventData: folderRes,
      toAccount: [this.systemApi.getMainAccount().email],
      _account,
    });
    if (type === 'read') {
      this.loggerHelper.track('mark_mail', { stage: 'update_mail_end', mark, changedFolder });
    }
    this.modelHandler.calFolderUnread(_account);
    // await this.modelHandler.notifyFolderCountChange(false);
  }

  private async updateStarMailStat(conf: StarMailStatParam) {
    const { mids, mark, _account } = conf;
    const res = ((await this.db.getByIndexIds({ ...mailTable.attr }, 'mid', mids, _account)) as EntityMailAttr[]).filter(v => !!v);
    if (res.length > 0) {
      const newData = res.map(v => ({
        ...v,
        readStatus: mark ? 1 : 0,
      }));
      await this.db.putAll({ ...mailTable.attr }, newData, undefined, _account);
    }
  }

  private async updateThreadMailCount(data: EntityMailStatus[], mailBoxId: number | string, _account?: string) {
    // 修改聚合邮件的 threadMessageCount 等属性
    const idSet: Set<string> = new Set();
    const handledThreadMailStatus: EntityMailStatus[] = [];
    const isDelete = +mailBoxId === 4;
    // eslint-disable-next-line no-restricted-syntax
    for (const it of data) {
      if (it.threadId && !it.isThread) {
        // eslint-disable-next-line no-await-in-loop
        const threadMails = ((await this.db.getByIds({ ...mailTable.status, _dbAccount: _account }, [it.threadId])) as EntityMailStatus[]).filter(v => !!v);
        if (threadMails.length > 0) {
          const threadMail = threadMails[0];
          const { threadMessageIds } = threadMail;
          if (threadMessageIds && threadMessageIds.length > 0) {
            const newThreadMessageIds = isDelete ? threadMessageIds.filter(tid => tid !== it.mid) : [...new Set([...threadMessageIds, it.mid])];
            handledThreadMailStatus.push({
              ...threadMail,
              threadMessageCount: newThreadMessageIds.length,
              threadMessageIds: newThreadMessageIds,
              threadMessageFirstId: newThreadMessageIds.length > 0 ? newThreadMessageIds[0] : '',
            });
          }
          idSet.add(threadMail.mid);
        }
      }
    }
    this.putDataAndReserveFields({
      table: { ...mailTable.status, _dbAccount: _account },
      idSet,
      data: handledThreadMailStatus,
      reserveKeys: ['headers', 'threadId', 'attachmentsZipPath'],
    }).then();
  }

  // eslint-disable-next-line max-params
  private filterMarkResult(result: EntityMailStatus[], type: MailStatusChangeType, mark: boolean, fid: number, payload?: MarkPayload) {
    const newData = result
      .map(it => {
        if (type === 'redFlag') {
          if ((it.redFlag === 1) === mark) {
            return undefined;
          }
          it.redFlag = mark ? 1 : 0;
        } else if (type === 'preferred') {
          if ((it.preferred === 0) === mark) {
            return undefined;
          }
          it.preferred = mark ? 0 : 1;
        } else if (type === 'read') {
          if ((it.readStatus === 1) === mark) {
            return undefined;
          }
          it.readStatus = mark ? 1 : 0;
        } else if (type === 'folder') {
          if (it.folder === fid) {
            return undefined;
          }
          it.folder = fid;
          // 邮件移动后会失去置顶状态
          it.rank = 0;
        } else if (type === 'top') {
          if ((it.rank === -10) === mark) {
            return undefined;
          }
          it.rank = mark ? -10 : 0;
        } else if (type === 'requestReadReceiptLocal') {
          it.requestReadReceiptLocal = mark;
        } else if (type === 'memo') {
          it.memo = payload?.memo || '';
        }
        return it;
      })
      .filter(it => !!it) as EntityMailStatus[];
    console.log('==== update db using filtered data:', newData);
    return newData;
  }

  async updateMailStatus(items: EntityMailStatus[], _account?: string) {
    return this.db.putAll({ ...mailTable.status, _dbAccount: _account }, items);
  }

  async updateMessageTags(params: RequestMailTagRequest, origin: EntityMailStatus[], isThread?: boolean, _account?: string): Promise<EntityMailStatus[] | undefined> {
    if (!params || !params.ids || params.ids.length === 0) {
      return undefined;
    }
    const mails = ((await this.db.getByIds(mailTable.status, params.ids, _account)) as EntityMailStatus[]).filter(v => !!v);
    if (mails && mails.length > 0) {
      // 对聚合邮件的所有更改，都要体现在关联的单封邮件
      // 单封邮件的更改，只有添加操作，要体现在关联的聚合邮件中
      if (isThread) {
        // 如果是针对聚合邮件实体的操作，『添加』、『删除』都会同步到关联的单封邮件
        const threadMessages = await this.getThreadMessageByThreadMails(mails, _account);
        if (threadMessages && threadMessages.length > 0) {
          mails.push(...threadMessages);
        }
      } else if (params.add && params.add.length > 0) {
        // 如果是针对单封邮件的操作，只有『添加』操作才会影响到关联的聚合邮件
        const threadMailIds = mails.map(v => v.threadId).filter(v => !!v);
        if (threadMailIds.length > 0) {
          const threadMails = ((await this.db.getByIds(mailTable.status, threadMailIds as string[], _account)) as EntityMailStatus[]).filter(v => !!v);
          if (threadMails && threadMails.length > 0) {
            mails.push(...threadMails);
          }
        }
      }
      mails.forEach(it => {
        origin.push({ ...it });
        if (params.set && params.set.length > 0) {
          it.tags = params.set;
        }
        if (params.add && params.add.length > 0) {
          it.tags = (it.tags || []).concat(params.add);
          it.tags = [...new Set(it.tags)];
        }
        if (params.delete && params.delete.length > 0) {
          const tgSet = new Set<string>(params.delete);
          if (it.tags && it.tags.length > 0) {
            it.tags = it.tags.filter(tg => !tgSet.has(tg));
          }
        }
      });
      await this.db.putAll(mailTable.status, mails, undefined, _account);
    }
    return mails;
  }

  async doMoveMail(originData: EntityMailStatus[], id: string | string[], fid: number, isThread?: boolean, _account?: string): Promise<EntityMailStatus[] | undefined> {
    const checkIds = Array.isArray(id) ? id : [id];
    const result = ((await this.db.getByIds(mailTable.status, checkIds, _account)) as EntityMailStatus[]).filter(v => !!v);
    originData.push(...result.map(v => ({ ...v })));
    // if (result && result.length > 0) {
    //   if (isThread) {
    //     // 如果是聚合邮件本身，那么关联的每封邮件放到 result 中，也就放到了 originData 中
    //     const threadResult = await this.getThreadMessageByThreadMails(result);
    //     result.push(...threadResult);
    //   } else {
    //     // 如果是聚合邮件的一封子邮件，那么只将子邮件所属的关联邮件放到用于回滚的 originData 中
    //     // eslint-disable-next-line no-restricted-syntax
    //     for (const it of result) {
    //       if (!it.isThread && it.threadId) {
    //         // eslint-disable-next-line no-await-in-loop
    //         const threadMails = (await this.db.getByIds(mailTable.status, [
    //           it.threadId,
    //         ])) as EntityMailStatus[];
    //         if (threadMails && threadMails.length > 0 && threadMails[0]) {
    //           originData.push(threadMails[0]);
    //           // 如果要移动的子邮件从已删除移出，并且聚合邮件也在已删除，那么需要将聚合邮件从已删除移出来
    //           // eslint-disable-next-line max-depth
    //           if (threadMails[0].folder === 4 && fid !== 4) {
    //             result.push(threadMails[0]);
    //           }
    //         }
    //       }
    //     }
    //   }
    //   result.forEach(it => originData.push({ ...it } as EntityMailStatus));
    // }
    return this.doMarkInDb({
      newData: result,
      type: 'folder',
      mark: true,
      fid,
      originData,
      isThread,
      _account,
    });
  }

  async getMailById(
    /* ids: string | string[], */
    conf: MailContentCheckFeature
  ): Promise<MailEntryModel[]> {
    console.log('check mail from db:' + conf.id, conf);
    if (!conf.id) {
      return Promise.reject(new Error('参数未传入'));
    }
    if (!!conf.noStatus && !!conf.noData && !!conf.noContent) {
      return Promise.reject(new Error('需查询基础参数'));
    }
    const checkIds = Array.isArray(conf.id) ? conf.id : [conf.id];
    const result: Map<string, MailEntryModel> = new Map<string, MailEntryModel>();
    const getMailData = !conf.noData ? this.db.getByIds(mailTable.data, checkIds, conf._account) : (Promise.resolve(conf.mailData) as Promise<EntityMailData[]>);
    const getMailStatus = !conf.noStatus
      ? this.db.getByIds(mailTable.status, checkIds, conf._account)
      : (Promise.resolve(conf.statusData) as Promise<EntityMailStatus[]>);
    const getMailAttachment = !conf.noAttachment
      ? this.db.getByIds(mailTable.attachment, checkIds, conf._account)
      : (Promise.resolve(conf.attachData) as Promise<EntityMailAttachment[]>);
    const getMailContent = !conf.noContent
      ? this.db.getByIds(mailTable.content, checkIds, conf._account)
      : (Promise.resolve(conf.contentData) as Promise<EntityMailContent[]>);
    const baseResult = await Promise.all([getMailData, getMailStatus, getMailContent, getMailAttachment]);

    this.buildMailModelByMailData(result, baseResult[0] as EntityMailData[], conf._account);
    this.buildMailModelByMailStatus(result, baseResult[1] as EntityMailStatus[]);
    this.buildMailModelByMailAttachment(result, baseResult[3] as EntityMailAttachment[], undefined, conf._account);
    await this.buildMailModelByMailContent(result, baseResult[2] as EntityMailContent[], conf._account);
    await this.buildMailContactByMailDataAndContent(
      result,
      baseResult[0] as EntityMailData[],
      baseResult[2] as EntityMailContent[],
      !conf.noContact,
      conf.noContactRace,
      conf._account
    );

    return Array.from(result.values());
    // return baseResult as MailEntryModel[];
    // return Promise.reject('');
  }

  async getTpMailById(params: {
    id: string | string[];
    noContent?: boolean; // 是否查找邮件的内容
  }): Promise<MailEntryModel[]> {
    const ids = Array.isArray(params.id) ? params.id : [params.id];
    const result: Map<string, MailEntryModel> = new Map<string, MailEntryModel>();

    const getListPromise = () => this.db.getByIds(mailTable.tpMail, ids);
    const getContentPromise = params.noContent ? () => Promise.resolve([]) : () => this.db.getByIds(mailTable.tpMailContent, ids);

    const baseResult = await Promise.all([getListPromise(), getContentPromise()]);
    const listRes = (baseResult[0] as EntityTpMail[]).filter(v => !!v);
    const contentRes = (baseResult[1] as EntityTpMail[]).filter(v => !!v);

    if (Array.isArray(listRes) && listRes.length > 0) {
      listRes.forEach(v => {
        result.set(v.mid, v.entryModel);
      });
      contentRes.forEach(v => {
        const { entryModel, mid } = v;
        const listModel = result.get(mid);
        if (listModel && entryModel) {
          const newModel = this.modelHandler.merge(listModel, entryModel);
          result.set(v.mid, newModel);
        }
      });
      console.log('[get tpMail] no content', result);
    }

    return Array.from(result.values());
  }

  // 2022.03.02 1.19星标联系人邮件对 mail_attr 做了比较大的改动，外贸客户邮件原来的逻辑需要适配 by 周昊
  // 针对自己的邮件
  // 根据邮件地址 from + to，『成组的』从 mail_attr 中获取 mid
  // 所谓成组，指的是往来邮件，例如 from === A， to === B，实际上会查询A给B发送的邮件，也会查询B给A发送的邮件
  // 查询方法是：查询 from === A 的邮件，在其中过滤出 to 包括 B 的邮件，同时查询 to === A 的邮件，过滤出 from 包括 B 的邮件，去重后归并
  // 针对下属、同事等第三方邮件
  // 根据 from 为 owner，toList作为筛选条件
  // getMailIdsByAddressInPairs(
  //   attrQuery: Required<MailAttrQuery>[],
  //   count = 100,
  //   endTime = 0,
  //   queryFilter?: MailAttrQueryFilter,
  // ): Promise<MailAttrDbRes[]> {
  //   //  服务端客户邮件列表调用的是企业邮搜索接口，新邮件有5分钟延迟
  //   //  而客户端推送、列表接口可以立刻收到，然后缓存在本地
  //   //  所以通过本地数据可以获取到这封邮件
  //   //  目前先屏蔽5分钟内的新邮件，后续解决5分钟延迟后，客户端本地放开这个限制
  //   const timeLimit = -Date.now() + 5 * 60 * 1000;
  //
  //   const promises = attrQuery.reduce<Array<Promise<MailAttrDbRes[]>>>((total, current) => {
  //     const { from, to } = current;
  //     const toList = (Array.isArray(to) ? to : [to]).filter(v => !!v);
  //     const conf: MailAddressQuery = {
  //       value: from,
  //       count,
  //       endTime,
  //       filterValues: toList
  //     };
  //     const currentUser = this.systemApi.getCurrentUser();
  //     // 查询本人邮件
  //     if (!from || from === currentUser?.id) {
  //       // 如果传入了 queryFilter 参数，则需要过滤
  //       // queryFilter.type === 'receiver', 则只查询当前用户作为收件人的查询
  //       if (!queryFilter?.type || queryFilter.type === 'receive') {
  //         total.push(this.getMailByAddress('to', conf, timeLimit));
  //       }
  //       // queryFilter.type === 'sender', 则只查询当前用户作为发件人的查询
  //       if (!queryFilter?.type || queryFilter.type === 'send') {
  //         total.push(this.getMailByAddress('from', conf, timeLimit));
  //       }
  //     } else {
  //       // 查询第三方邮件
  //       const tpQuery: TpMailListQuery = {
  //         from,
  //         toList,
  //         count,
  //         endTime,
  //         exchangeType: queryFilter?.type
  //       };
  //       total.push(this.getTpMails(tpQuery));
  //     }
  //     return total;
  //   }, [] as Array<Promise<MailAttrDbRes[]>>);
  //   return Promise.all(promises).then(result => {
  //     const set = new Set<string>();
  //     return [...result.flat()]
  //       .sort((prev, next) => prev.rcTime - next.rcTime)
  //       .reduce((t, v) => {
  //         if (!set.has(v.mid)) {
  //           set.add(v.mid);
  //           t.push(v);
  //         }
  //         return t;
  //       }, [] as MailAttrDbRes[])
  //       .slice(0, count);
  //   });
  // }

  // getMailByAddress(
  //   key: 'from' | 'to',
  //   param: MailAddressQuery,
  //   timeLimit = -Number.MAX_VALUE
  // ): Promise<MailAttrDbRes[]> {
  //   const {
  //     value, endTime, count, filterValues
  //   } = param;
  //   const adCondition: AdQueryConfig['adCondition'] = {
  //     field: ['key', 'value', 'rcTime'],
  //     type: 'between',
  //     args: [
  //       [key, value, (typeof endTime === 'number' && endTime !== 0) ? -(endTime - 100) : timeLimit],
  //       [key, value, -5 * 60 * 1000],
  //       true,
  //       true,
  //     ],
  //   };
  //   const query: AdQueryConfig = {
  //     count,
  //     adCondition,
  //     additionalData: {
  //       key,
  //       value,
  //       filterValues,
  //     },
  //     filter: mailAttrFilterName,
  //     ...mailTable.attr,
  //   };
  //   return this.db.getByRangeCondition(query).then(res => {
  //     console.log('[mails query] by attr', key, res);
  //     return (res as EntityMailAttr[]).map(v => ({
  //       rcTime: v.rcTime,
  //       mid: v.mid,
  //       isTpMail: false
  //     }));
  //   });
  // }

  getTpMails(param: TpMailListQuery): Promise<MailAttrDbRes[]> {
    const { from, toList, endTime, count, exchangeType } = param;
    const adCondition: AdQueryConfig['adCondition'] = {
      field: ['owner', 'rcTime'],
      type: 'between',
      args: [[from, typeof endTime === 'number' && endTime !== 0 ? -(endTime - 100) : -Number.MAX_VALUE], [from, 0], true, true],
    };
    const query: AdQueryConfig = {
      count,
      adCondition,
      additionalData: {
        exchangeType,
        toList,
        from,
      },
      filter: tpMailFilterName,
      ...mailTable.tpMail,
    };
    return this.db.getByRangeCondition(query).then(res => {
      console.log('[tp mails query] from db', param, res);
      return (res as EntityTpMail[]).map(v => ({
        rcTime: v.rcTime,
        mid: v.mid,
        isTpMail: true,
      }));
    });
  }

  // eslint-disable-next-line max-params
  private async buildMailContactByMailDataAndContent(
    result: Map<string, MailEntryModel>,
    baseEntity: EntityMailData[],
    contentEntity: EntityMailContent[],
    checkContact?: boolean,
    noContactRace = false,
    _account?: string
  ) {
    // console.log(result, baseEntity, contentEntity);
    if (!result || ((!baseEntity || baseEntity.length === 0) && (!contentEntity || contentEntity.length === 0))) {
      return;
    }
    const allContact: Map<string, ParsedContact[]> = new Map<string, ParsedContact[]>();
    if (baseEntity && baseEntity.length > 0) {
      baseEntity.forEach(it => {
        if (it && it.mid && it.contactData) {
          allContact.set(it.mid, it.contactData);
        }
      });
    }
    if (contentEntity && contentEntity.length > 0) {
      contentEntity.forEach(it => {
        if (it && it.mid && it.contactData) {
          allContact.set(it.mid, it.contactData);
        }
      });
    }
    allContact.forEach(v => {
      if (v && v.length) {
        v.forEach(it => {
          it.type = it.type in MemberTypeMapper ? (MemberTypeMapper[it.type] as MemberType) : it.type;
        });
      }
    });
    await this.buildMailContactData(allContact, result, checkContact, noContactRace, _account);
  }

  // eslint-disable-next-line max-params
  private async buildMailContactData(
    allContact: Map<string, ParsedContact[]>,
    result: Map<string, MailEntryModel>,
    checkContact: undefined | boolean,
    noContactRace = false,
    _account?: string
  ) {
    if (checkContact) {
      const allCheckedContact: ParsedContact[] = [];
      allContact.forEach(val => {
        allCheckedContact.push(...val);
      });
      const models: StringTypedMap<MailBoxEntryContactInfoModel> = await this.contactHandler.handleContactRawList(allCheckedContact, noContactRace, _account);
      allContact.forEach((val, key) => {
        const mailEntryModel = result.get(key);
        if (mailEntryModel) {
          mailEntryModel.receiver = mailEntryModel.receiver || [];
          if (val && val.length > 0) {
            val.forEach(it => {
              const itemForUse = { ...models[it.email + it.type], originName: it.name, mailMemberType: it.type } as MailBoxEntryContactInfoModel;
              // const contactModel = itemForUse;
              if (itemForUse) {
                if (it.type === '') {
                  mailEntryModel.sender = itemForUse;
                  if (!mailEntryModel.senders) {
                    mailEntryModel.senders = [];
                  }
                  mailEntryModel.senders?.push(itemForUse);
                } else {
                  // itemForUse.mailMemberType = it.type;
                  mailEntryModel.receiver.push(itemForUse);
                }
              }
            });
          }
        }
      });
    } else {
      allContact.forEach((val, key) => {
        const mailEntryModel = result.get(key);
        if (mailEntryModel) {
          mailEntryModel.receiver = mailEntryModel.receiver || [];
          if (val && val.length > 0) {
            val.forEach(it => {
              const contactModel = this.contactHandler.buildRawContactItem(it);
              if (it.type === '') {
                mailEntryModel.sender = contactModel;
                if (!mailEntryModel.senders) {
                  mailEntryModel.senders = [];
                }
                mailEntryModel.senders?.push(contactModel);
              } else {
                contactModel.mailMemberType = it.type;
                mailEntryModel.receiver.push(contactModel);
              }
            });
          }
        }
      });
    }
  }

  private async buildMailModelByMailContent(result: Map<string, MailEntryModel>, entity: EntityMailContent[], _account?: string) {
    if (!entity || entity.length === 0) {
      return;
    }
    for (let i = 0; i < entity.length; i++) {
      const it = entity[i];
      if (it && it.mid) {
        const { mid } = it;
        const mailModel: Partial<MailEntryModel> = result.get(mid) || {};
        mailModel.id = mid;
        // mailModel.tags = it.tags;
        const entry = {
          title: it.title, // this.htmlApi.encodeHtml(it.title),
          brief: it.brief || mailModel.entry?.brief,
          content: {
            content: it.content,
            contentId: it.contentId,
            isHtml: it.isHtml,
            encoding: it.encoding || 'default',
          },
          // 从数据库中获取langType和langListMap
          langType: it.langType || '',
          langListMap: it.langListMap || {},
          // folder: 1,
          // threadMessageCount: 0,
        } as Partial<MailEntryInfo>;
        mailModel.entry = {
          ...defaultMailEntryInfo,
          ...mailModel.entry,
          ...entry,
        };
        mailModel.antispamInfo = it.antispamInfo;
        if (it.content && it.content.length > 0 && entry.content) {
          // if(isHtml){
          // eslint-disable-next-line no-await-in-loop
          await this.modelHandler.handleMailContentReplace(mailModel as MailEntryModel, 'readMailFromDb', undefined, undefined);
        }
        result.set(mid, mailModel as MailEntryModel);
      }
    }
  }

  private buildMailModelByMailAttachment(result: Map<string, MailEntryModel>, entity: EntityMailAttachment[], noCloudAttachment?: boolean, _account?: string) {
    if (!entity || entity.length === 0) {
      return;
    }
    const currentUser = this.systemApi.getCurrentUser(_account);
    if (!currentUser) {
      throw new Error('用户未登录？');
    }
    const subAccount = this.storeApi.getEmailIdByEmail(_account || '');
    const isSubAccount = !!subAccount;

    let token = '';
    if (isSubAccount && !process.env.BUILD_ISELECTRON) {
      token = this.mailConfApi.getTokenBySubAccount(subAccount);
    }

    for (let i = 0; i < entity.length; i++) {
      const it = entity[i];
      if (it && it.mid) {
        const { mid } = it;
        const mailModel: Partial<MailEntryModel> = result.get(mid) || {};
        mailModel.id = mid;
        if (noCloudAttachment) {
          it.attachment = it.attachment.filter(v => v.type !== 'netfolder');
        }
        if (it.attachment && it.attachment.length > 0) {
          it.attachment.forEach(item => {
            if (item.type !== 'netfolder') {
              if (item.fileUrl) {
                item.fileUrl = item.fileUrl.replace(/(\?|&|%3F|%26)sid(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1sid$2' + currentUser.sessionId);
              }
              if (item.filePreviewUrl) {
                // 替换为最新sid
                item.filePreviewUrl = item.filePreviewUrl.replace(/(\?|&|%3F|%26)sid(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1sid$2' + currentUser.sessionId);
              }
              if (token && item.fileUrl) {
                item.fileUrl = item.fileUrl.replace(/(\?|&|%3F|%26)_token(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1_token$2' + token);
              }
              if (token && item.filePreviewUrl) {
                item.filePreviewUrl = item.filePreviewUrl.replace(/(\?|&|%3F|%26)_token(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1_token$2' + token);
              }
            }
            this.fileApi.registerTmpFile(item);
          });
        }
        // mailModel.tags = it.tags;
        const entry = {
          // title: it.title,
          attachment: it.attachment,
          attachmentCount: it.attachment.length,
          isIcs: it.attachment.some(attaIt => {
            const { fileName } = attaIt;
            if (fileName) {
              return fileName.endsWith('.ics');
            }
            // 部分邮件没有fileName，可以判断类型
            return attaIt?.contentType?.includes('text/calendar');
          }),
          // content: {
          //   content: '',
          //   contentId: '',
          // },
          // folder: 1,
          // threadMessageCount: 0,
        } as Partial<MailEntryInfo>;
        mailModel.isEncryptedMail = it.attachment ? getIsEncryptedMail(it.attachment) : false;
        mailModel.entry = {
          ...defaultMailEntryInfo,
          ...mailModel.entry,
          ...entry,
        };
        result.set(mid, mailModel as MailEntryModel);
      }
    }
  }

  private buildMailModelByMailStatus(result: Map<string, MailEntryModel>, entity: EntityMailStatus[]) {
    if (!entity || entity.length === 0) {
      return;
    }
    for (let i = 0; i < entity.length; i++) {
      const it = entity[i];
      if (it && it.mid) {
        const { mid } = it;
        const mailModel: Partial<MailEntryModel> = result.get(mid) || {};
        mailModel.id = mid;
        mailModel.threadId = it.threadId;
        mailModel.updateTime = it.updateTime;
        mailModel.isOneRcpt = it.isOneRcpt;
        if (it.tags && it.tags.length > 0) {
          mailModel.tags = it.tags; // .filter(tag => tag && !tag.startsWith('%st') && !tag.endsWith('%'));
        }
        mailModel.headers = it.headers;
        const entry = {
          // title: it.title,
          top: it.rank === -10,
          folder: it.folder,
          mark: it.redFlag === 1 ? 'redFlag' : 'none',
          readStatus: it.readStatus === 1 ? 'read' : 'unread',
          replayed: it.replyStatus === 1,
          requestReadReceiptLocal: it.requestReadReceiptLocal,
          forwarded: it.forwardStatus === 1,
          directForwarded: it.directForwardedStatus === 1,
          rclStatus: it.rclStatus,
          sndStatus: it.sndStatus,
          memo: it.memo,
          canRecall: it.canRecall,
          threadMessageIds: it.threadMessageIds || [],
          threadMessageCount: it.threadMessageCount || 0,
          threadMessageFirstId: it.threadMessageFirstId || '',
          receiveTime: util.dateFormatTo8(-it.sdTime),
          sendTime: util.dateFormatTo8(-it.rcTime),
          rcptCount: it.rcptCount,
          sentMailId: it.sentMailId,
          readCount: it.readCount,
          innerCount: it.innerCount,
          innerRead: it.innerRead,
          preferred: it.preferred,
          eTeamType: it.eTeamType || 0,
          isDefer: it.isDefer === 1,
          deferTime: it.deferTime ? moment(it.deferTime).format('YYYY-MM-DD HH:mm:ss') : '',
          deferNotice: it.deferNotice === 1,
          popRead: it.popRead === 1,
          rcptFailed: it.rcptFailed === 1,
          rcptSucceed: it.rcptSucceed === 1,
          system: it.system === 1,
          suspiciousSpam: !!it.suspiciousSpam,
          // content: {
          //   content: '',
          //   contentId: '',
          // },
          // folder: 1,
          // threadMessageCount: 0,
        } as Partial<MailEntryInfo>;
        mailModel.convFids = Array.isArray(it.convFids) ? it.convFids : [];
        mailModel.entry = {
          ...defaultMailEntryInfo,
          ...mailModel.entry,
          ...entry,
        };
        result.set(mid, mailModel as MailEntryModel);
      }
    }
  }

  private buildMailModelByMailData(result: Map<string, MailEntryModel>, entity: EntityMailData[], _account?: string) {
    if (!entity || entity.length === 0) {
      return;
    }
    const currentUser = this.systemApi.getCurrentUser(_account);
    for (let i = 0; i < entity.length; i++) {
      const it = entity[i];
      if (it && it.mid) {
        const { mid } = it;
        const mailModel: Partial<MailEntryModel> = result.get(mid) || {};
        mailModel.isThread = !!it.isThread;
        mailModel.id = mid;
        mailModel.createTime = it.createTime;
        mailModel.taskId = it.taskId;
        mailModel._account = currentUser?.id;
        mailModel.authAccountType = (currentUser?.prop?.authAccountType as string) || null;
        mailModel.mailIllegal = it.mailIllegal ? it.mailIllegal.split(',').map(v => +v) : undefined;
        if (it.scheduleDateTimeZone) {
          mailModel.scheduleDateTimeZone = it.scheduleDateTimeZone;
        }
        const entry = {
          title: it.title,
          sendTime: util.dateFormatTo8(-it.rcTime),
          rcTime: it.rcTime,
          receiveTime: util.dateFormatTo8(-it.sdTime),
          id: mid,
          attachmentCount: it.attachmentCount,
          brief: it.brief,
          priority: it.priority,
          isScheduleSend: it.isScheduleSend || false,
          tid: it.tid,
          praiseId: it.praiseId,
          sentMailId: it.sentMailId,
          langType: it.langType || '',
          langListMap: it.langListMap || {},
          requestReadReceipt: it.requestReadReceipt,
          linkAttached: !!it.linkAttached,
          suspiciousSpam: !!it.suspiciousSpam,
          size: it.size || 0,
          encpwd: it.encpwd || '',
          // content: {
          //   content: '',
          //   contentId: '',
          // },
          // folder: 1,
        } as Partial<MailEntryInfo>;
        mailModel.entry = {
          ...defaultMailEntryInfo,
          ...mailModel.entry,
          ...entry,
        };
        result.set(mid, mailModel as MailEntryModel);
      }
    }
  }

  async saveMailBoxes(items: EntityMailBox[], _account?: string, clearTable?: boolean) {
    const targets = items.map(item => ({
      ...item,
      mailBoxUnread: item.mailBoxType === 'customer' ? 0 : item.mailBoxUnread,
      threadMailBoxUnread: item.mailBoxType === 'customer' ? 0 : item.threadMailBoxUnread,
    }));
    if (clearTable) {
      try {
        await this.db.clear({ ...mailBoxTable, _dbAccount: _account });
      } catch (e) {
        console.error('[DB saveMailBoxes clear error]', e);
      }
    }
    return this.db.putAll({ ...mailBoxTable, _dbAccount: _account }, targets);
  }

  // 将聚合邮件根据 convFids 拆分为 N + 1 个数据，会对邮件的 ID 进行改写！！！
  splitThreadMails(mails: MailEntryModel[]): MailEntryModel[] {
    return mails.reduce<MailEntryModel[]>((total, v) => {
      if (!v.isThread) {
        return [...total, v];
      }
      const convFids = Array.isArray(v.convFids) ? v.convFids : [v.entry.folder];
      // 根据 convFids，将一个聚合邮件实体拆分为多个实体，这些实体的 id 是拼接的，其他信息都是与来源相符的
      const children = convFids.map(fid => {
        const newId = util.getJointThreadId(v.id, fid);
        return {
          ...v,
          id: newId,
          entry: {
            ...v.entry,
            id: newId,
            folder: fid,
          },
        };
      });
      // 真实的（来源）聚合邮件，fid 是 -100001， 是为了在使用文件夹筛选时，不会被删选出来，但是通过 id 是可以筛选到的
      const threadMail = {
        ...v,
        entry: {
          ...v.entry,
          folder: mailBoxOfFakeThread.id,
        },
      };
      return [...total, ...children, threadMail];
    }, []);
  }

  async saveMails(
    mails: MailEntryModel | MailEntryModel[],
    taskType: UpdateMailCountTaskType = 'default',
    _account?: string,
    attrConf?: queryMailBoxParam['attrConf']
  ): Promise<any> {
    const initialMail = Array.isArray(mails) ? mails : [mails];
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const mailInfo = isCorpMail ? initialMail : this.splitThreadMails(initialMail);
    const mailData: Map<string, EntityMailData> = new Map<string, EntityMailData>();
    const mailContent: Map<string, EntityMailContent> = new Map<string, EntityMailContent>();
    const mailStatus: EntityMailStatus[] = [];
    const mailAttachment: Map<string, EntityMailAttachment> = new Map<string, EntityMailAttachment>();
    // const mailAttachmentContentMap: Map<string, EntityMailAttachment> = new Map<string, EntityMailAttachment>();
    const mailAttachmentContent: EntityMailAttachment[] = [];
    const mailFiles: Map<string, FileTask> = new Map();
    const idSet: Set<string> = new Set<string>();
    // const idContnetSet: Set<string> = new Set<string>();
    const fileIdSet: Set<string> = new Set<string>();
    const mailAttr: Map<string, EntityMailAttr> = new Map();
    // 本地邮件data map
    const localMailMap: Map<string, resultObject> = new Map();

    // 从db查询邮件，用于判断附件是否需要保存
    try {
      const mailIds = Array.isArray(mails) ? mails.map(item => item?.entry?.id) : [mails?.entry?.id];
      let localMails = await this.db.getByIds(mailTable.data, mailIds, _account);
      localMails = localMails.filter(v => !!v);
      localMails.forEach(item => {
        if (item) {
          localMailMap.set(item.id, item);
        }
      });
    } catch (e) {
      console.error(e);
    }

    mailInfo.forEach((it: MailEntryModel) => {
      if (it && it.id) {
        const mid = it.id;
        idSet.add(mid);
        const partInfo = this.modelHandler.isEntryContentEmpty(it);
        const titleMd5 = this.systemApi.md5(it.entry.title, true);
        const mstatus = this.buildMailStatusInfo(it, titleMd5);
        const localData = localMailMap.get(mid);
        const localAttFromContent = localData && localData?.attSource === 'content';
        const couldSaveAtt = it?.entry?.attSource === 'content' || !localData?.attSource || !localAttFromContent;
        mailStatus.push(mstatus);
        if (attrConf) {
          this.buildMailAttrInfo(it, attrConf, mailAttr);
        }
        const mdata = this.buildMailDataEntity(it, partInfo ? 0 : 1, titleMd5);
        mailData.set(mid, mdata);
        // 如果本地附件来源为content，则非content的附件不保存
        if (couldSaveAtt) {
          const mAttachment = this.buildAttachmentInfo(it, titleMd5);
          if (mAttachment) {
            mailAttachment.set(mid, mAttachment);
          }
          this.mailAttachmentCacher.buildFileInfo(it, mailFiles, fileIdSet);
          if (!partInfo) {
            const mContent = this.buildMailContentEntity(it);
            mailContent.set(mid, mContent);
            if (mAttachment) {
              mailAttachmentContent.push(mAttachment);
              // mailAttachmentContentMap.set(mid, mAttachment);
              // idContnetSet.add(mid);
              mailAttachment.delete(mid);
            }
          }
        }
      }
    });
    const statusPromise = this.putDataAndReserveFields({
      table: { ...mailTable.status, _dbAccount: _account },
      idSet,
      data: mailStatus,
      reserveKeys: ['headers', 'threadId', 'attachmentsZipPath', 'convFids', 'threadMessageCount', 'threadMessageIds', 'requestReadReceiptLocal'],
    });
    const dataPromise = this.putIgnoreExist({
      table: { ...mailTable.data, _dbAccount: _account },
      idSet,
      data: mailData,
      reserveKeys: [
        'brief',
        'tid',
        'fromEmail',
        'fromName',
        'toContactName',
        'toEmail',
        'sendersEmail',
        'isScheduleSend',
        'taskId',
        'linkAttached',
        'requestReadReceipt',
        'attSource',
      ],
    });
    const contentPromise = this.putIgnoreExist({
      table: { ...mailTable.content, _dbAccount: _account },
      idSet,
      data: mailContent,
      reserveKeys: ['contentMd5', 'encoding'],
    });
    const attrPromise = this.putIgnoreExist({
      table: { ...mailTable.attr, _dbAccount: _account },
      idSet: new Set(mailAttr.keys()),
      data: mailAttr,
      mapKey: 'aid',
    });
    // const attachmentPromise = this.putIgnoreSimilarAttachment(
    //   {
    //     table: { ...mailTable.attachment, _dbAccount: _account },
    //     idSet,
    //     data: mailAttachment,
    //   }
    // );
    // const attachmentContentPromise = this.putIgnoreSimilarAttachment(
    //   {
    //     table: { ...mailTable.attachment, _dbAccount: _account },
    //     idSet: idContnetSet,
    //     data: mailAttachmentContentMap
    //   }
    // );
    const attachmentPromise = this.putIgnoreExist({
      table: { ...mailTable.attachment, _dbAccount: _account },
      idSet,
      data: mailAttachment,
    });
    const attachmentContentPromise = this.db.putAll({ ...mailTable.attachment, _dbAccount: _account }, mailAttachmentContent);
    // 将文件自动下载放到宏任务队列，别耽误其他事o(╯□╰)o
    setTimeout(() => {
      this.mailAttachmentCacher
        .putFileIgnoreExist({
          idSet: fileIdSet,
          data: mailFiles,
          taskType,
          _account,
        })
        .catch(e => {
          console.error('[file auto download] error ', e);
        });
    });
    return Promise.all([statusPromise, dataPromise, contentPromise, attachmentPromise, attachmentContentPromise, attrPromise]);
  }

  async saveTpMails(mails: MailEntryModel | MailEntryModel[]): Promise<void> {
    const initialMail = Array.isArray(mails) ? mails : [mails];
    const listModels: EntityTpMail[] = initialMail.map(mail => ({
      mid: mail.id,
      owner: mail.owner || '',
      entryModel: {
        ...mail,
        entry: {
          ...mail.entry,
          content: {
            ...mail.entry.content,
            content: '',
          },
        },
      },
      rcTime: -(util.parseDate(mail.entry.sendTime) || 0),
    }));
    const contentModels: EntityTpMail[] = initialMail
      .filter(v => v.entry?.content?.content)
      .map(mail => ({
        mid: mail.id,
        owner: mail.owner || '',
        entryModel: mail,
        rcTime: -(util.parseDate(mail.entry.sendTime) || 0),
      }));
    console.log('[tp mails] save to db list', listModels);
    console.log('[tp mails] save to db content', contentModels);
    await Promise.all([this.db.putAll(mailTable.tpMail, listModels), this.db.putAll(mailTable.tpMailContent, contentModels)]);
  }

  // 清理『垃圾邮件』+『已删除』文件夹中存在超过 30 天的邮件
  // 目前没有合适的字段能够表征『删除30天以上』，所以采取的方案是查找上述两个文件夹中 rcTime 在30天以上的邮件，然后去远端比对进行删除
  // 没有使用 listMessage 的 modifiedDate 这个字段，因为它会有延迟，一旦错过了移动时列表同步的更新时间，那么后续就无法对不再同步的邮件进行删除了
  async collectExpiredMailIds(): Promise<string[]> {
    const CLEAR_TARGET_TIMESTAMP = moment().subtract(30, 'day').valueOf();
    const idsInDeleted = await this.findExpiredMailIds(mailBoxOfDeleted.id, CLEAR_TARGET_TIMESTAMP);
    const idsInSpam = await this.findExpiredMailIds(mailBoxOfSpam.id, CLEAR_TARGET_TIMESTAMP);
    return [...idsInDeleted, ...idsInSpam];
  }

  // 查找时没有查找聚合邮件，因为『垃圾邮件』+『已删除』没有聚合邮件，并且删除时有针对性聚合邮件的逻辑
  private async findExpiredMailIds(fid: number, expiredTimestamp: number): Promise<string[]> {
    const query: AdQueryConfig = {
      start: 0,
      adCondition: {
        field: ['isThread', 'folder', 'rcTime'],
        type: 'between',
        args: [[0, fid, -expiredTimestamp], [0, fid, -0], true, true],
      },
      ...mailTable.status,
    };
    const res = (await this.db.getByRangeCondition(query)) as EntityMailStatus[];
    res.forEach(v => {
      console.log('[mail clear]', fid, new Date(-v.rcTime).toLocaleString());
    });
    return res.filter(v => !!v).map(v => v.mid);
  }

  async checkAndSetClearFlag(): Promise<boolean> {
    let needClear = true;
    const storeData = await this.storeApi.get(MailContentDbHelper.CLEAR_MAILS_KEY);
    if (storeData && storeData.data) {
      // 每隔一天进行一次清理
      const CLEAR_INTERVAL = 24 * 60 * 60 * 1000;
      const lastCheckTimestamp = +storeData.data;
      needClear = Date.now() - lastCheckTimestamp >= CLEAR_INTERVAL;
    }
    if (needClear) {
      await this.storeApi.put(MailContentDbHelper.CLEAR_MAILS_KEY, String(Date.now()));
    }
    return needClear;
  }

  /**
   * 更新单封邮件对应的threadId,
   * 只需要更新mail_status表
   * @param mails
   */
  async saveThreadIds(mails: MailEntryModel[], _account?: string) {
    const map: Map<string, string> = new Map<string, string>();
    mails.forEach(mail => {
      const { threadMessageIds } = mail.entry;
      if (mail.isThread && Array.isArray(threadMessageIds) && threadMessageIds.length > 0) {
        const threadId = mail.id;
        threadMessageIds.forEach(it => map.set(it, threadId));
        // eslint-disable-next-line no-await-in-loop
        // const currentMails = await this.getMailById({ id: threadMessageIds });
        // const its: MailEntryModel[] = currentMails.filter(v => !!v).map(v => ({
        //   ...v,
        //   threadId,
        // }));
        // eslint-disable-next-line no-await-in-loop
        // await this.saveMails(its);
      }
    });
    if (map.size > 0) {
      const mids = [...map.keys()];
      const allInfo = ((await this.db.getByIds(mailTable.status, mids, _account)) as EntityMailStatus[]).filter(it => !!it);
      allInfo.forEach(it => {
        it.threadId = map.get(it.mid) || '';
      });
      console.log('[db] ==== insert into db for data of db: mailTable.status', allInfo);
      await this.db.putAll(mailTable.status, allInfo, undefined, _account);
    }
  }

  async putDataAndReserveFields({ table, idSet, data, reserveKeys }: SaveMailsPutParams): Promise<resultObject[]> {
    const ids = Array.from(idSet);
    const originData = (await this.db.getByIds(table, ids)).filter(v => !!v);
    const originMap = new Map<string, resultObject>();
    if (originData && originData.length > 0) {
      originData.forEach(it => !!it && !!it.mid && originMap.set(it.mid, it));
    }
    if (data.length > 0) {
      const remainData: resultObject[] = [];
      data.forEach((v: resultObject) => {
        // 如果status已经保存过headers要保留使用原始headers
        const oData = originMap.get(v.mid);
        // const originHeaders = oData?.headers;
        // if (!v.headers && originHeaders) {
        //   v.headers = originHeaders;
        // }
        //
        // // 如果status已经保存过threadId要保留使用原始threadId
        // const originThreadId = oData?.threadId;
        // if (!v.threadId && originThreadId) {
        //   v.threadId = originThreadId;
        // }
        //
        // // attachmentsZipPath 附件压缩包目录
        // const attachmentsZipPath = oData?.attachmentsZipPath;
        // attachmentsZipPath && (
        //   v.attachmentsZipPath = attachmentsZipPath
        // );
        const { nv } = this.mergeAndTestData(v, oData, reserveKeys);
        remainData.push(nv);
      });
      return this.db.putAll(table, remainData);
    }
    return Promise.resolve([]);
  }

  private mergeAndTestData(data: resultObject, oData: resultObject | undefined, reserveKeys: string[] = []) {
    const nv = { ...data };
    let diff = false;
    if (reserveKeys && reserveKeys.length > 0 && oData) {
      reserveKeys.forEach(key => {
        if (oData[key] && nv[key] === undefined) {
          nv[key] = oData[key];
          diff = true;
        } else if (['requestReadReceiptLocal'].includes(key) && oData[key] !== undefined) {
          nv[key] = oData[key];
        } else if (Array.isArray(oData[key]) && Array.isArray(nv[key])) {
          diff = diff || util.isArrayDifferent(oData[key], nv[key]);
        } else if (oData[key] !== nv[key]) {
          diff = true;
        }
        return diff;
      });
    }
    console.log('[db] insert into db for compare ' + reserveKeys.join(',') + '-> ' + diff, data, oData);
    return { nv, diff };
  }

  // 聚合邮件不生效
  // eslint-disable-next-line max-params
  async putIgnoreExist({ table, idSet, data, reserveKeys, mapKey = 'mid' }: SaveMailsPutParams<Map<string, resultObject>>): Promise<resultObject[]> {
    if (data.size === 0) {
      return [];
    }
    const ids = Array.from(idSet);
    const originData = (await this.db.getByIds(table, ids)).filter(v => !!v);
    if (originData && originData.length > 0) {
      this.deleteExistData(mapKey, data, originData, reserveKeys);
    }
    if (data.size > 0) {
      const remainData: resultObject[] = [];
      data.forEach(v => {
        remainData.push(v);
      });
      return this.db.putAll(table, remainData);
    }
    return Promise.resolve([]);
  }

  // 聚合邮件不生效
  // 功能1：当邮件附件已经存储为内联之后，不再存储非内联状态
  // 功能2：如果要写入的附件是 winmail.dat，并且DB中已经有了附件，那么就不在写入了
  // async putIgnoreSimilarAttachment(
  //   {
  //     table,
  //     idSet,
  //     data,
  //     mapKey = 'mid',
  //   }: SaveMailsPutParams<Map<string, resultObject>>
  // ): Promise<resultObject[]> {
  //   if (data.size === 0) {
  //     return [];
  //   }
  //   const ids = Array.from(idSet);
  //   const originData = (
  //     await this.db.getByIds(table, ids)
  //   ).filter(v => !!v);
  //   if (originData && originData.length > 0) {
  //     this.deleteExistDataByAttachment(mapKey, data, originData);
  //   }
  //   if (data.size > 0) {
  //     const remainData: resultObject[] = [];
  //     data.forEach(v => {
  //       remainData.push(v);
  //     });
  //     return this.db.putAll(table, remainData);
  //   }
  //   return Promise.resolve([]);
  // }

  private buildAttachmentInfo(it: MailEntryModel, titleMd5: string): EntityMailAttachment | undefined {
    const mid = it.id;
    const { title } = it.entry;
    titleMd5 = titleMd5 || this.systemApi.md5(it.entry.title, true);
    if (it.entry.attachment && it.entry.attachment.length > 0) {
      return {
        mid,
        title,
        titleMd5,
        isThread: it.isThread ? 1 : 0,
        attachment: it.entry.attachment,
        attachmentNames: it.entry.attachment.map(attIt => attIt.fileName),
        changeAble: it.entry.folder === 2,
      };
    }
    return undefined;
  }

  private buildMailStatusInfo(it: MailEntryModel, titleMd5?: string): EntityMailStatus {
    const mid = it.id;
    const { title } = it.entry;
    titleMd5 = titleMd5 || this.systemApi.md5(it.entry.title, true);
    // 服务端使用 sendTime 排序，客户端的索引都是 rcTime, 所以需要调换一下然后存到 db 里面
    const rcTime = -(util.parseDate(it.entry.sendTime) || 0);
    const sdTime = -(util.parseDate(it.entry.receiveTime) || 0);
    // eslint-disable-next-line no-nested-ternary
    const rank = it.entry.top ? -10 : it.entry.isScheduleSend ? -9 : 0;
    return {
      isThread: it.isThread ? 1 : 0,
      threadId: it.threadId || undefined,
      mid,
      convFids: Array.isArray(it.convFids) ? it.convFids : undefined,
      threadMessageFirstId: it.isThread && it.entry.threadMessageFirstId ? it.entry.threadMessageFirstId : undefined,
      threadMessageIds: it.isThread && it.entry.threadMessageIds ? it.entry.threadMessageIds : undefined,
      threadMessageCount: it.isThread ? it.entry.threadMessageCount : undefined,
      title,
      titleMd5,
      rank,
      folder: it.entry.folder,
      tags: it.tags,
      redFlag: it.entry.mark === 'redFlag' ? 1 : 0,
      readStatus: it.entry.readStatus === 'read' ? 1 : 0,
      requestReadReceiptLocal: it.entry.requestReadReceipt,
      sdTime,
      rcTime,
      updateTime: Date.now(),
      replyStatus: it.entry.replayed ? 1 : 0,
      forwardStatus: it.entry.forwarded ? 1 : 0,
      directForwardedStatus: it.entry.directForwarded ? 1 : 0,
      rclStatus: it.entry.rclStatus,
      sndStatus: it.entry.sndStatus,
      memo: it.entry.memo,
      canRecall: it.entry.canRecall ? 1 : 0,
      headers: it.headers,
      rcptCount: it.entry.rcptCount,
      readCount: it.entry.readCount,
      innerCount: it.entry.innerCount,
      innerRead: it.entry.innerRead,
      isOneRcpt: it.isOneRcpt,
      preferred: it.entry.preferred,
      eTeamType: it.entry.eTeamType || 0,
      isDefer: it.entry.isDefer ? 1 : 0,
      deferTime: it.entry.deferTime ? new Date(it.entry.deferTime).getTime() : undefined,
      deferNotice: it.entry.deferNotice ? 1 : 0,
      popRead: it.entry.popRead ? 1 : 0,
      rcptFailed: it.entry.rcptFailed ? 1 : 0,
      rcptSucceed: it.entry.rcptSucceed ? 1 : 0,
      suspiciousSpam: !!it.entry?.suspiciousSpam,
      system: it.entry.system ? 1 : 0,
      sentMailId: it.entry.sentMailId,
    };
  }

  // 构造 mail_attr 表中的 AID
  getMailAttrId(mid: string, attrValue: string, attrType: MailAttrType) {
    return this.systemApi.md5(`${mid}${attrValue}${attrType}`, true);
  }

  // 根据联系人ID或者联系人组ID，以及包含的 email 构造 attr 表的查询主键
  getStarAttrValue(id: string, emailList: string[]) {
    return this.systemApi.md5(`${id}${emailList.join('')}`, true);
  }

  private buildMailAttrInfo(it: MailEntryModel, attrConf: MailAttrConf, resMap: Map<string, EntityMailAttr>) {
    const {
      id,
      isThread,
      entry: { sendTime, readStatus },
    } = it;
    const { attrValue, attrType } = attrConf;
    if (id && !isThread) {
      // 服务端使用 sendTime 排序，客户端的索引都是 rcTime, 所以需要调换一下然后存到 db 里面
      const rcTime = -(util.parseDate(sendTime) || 0);
      const { from, to } = this.handleMailContact(it);
      const aid = this.getMailAttrId(id, attrValue, attrType);
      // TODO：对于CC和BCC的邮件，这里有问题，
      const value: EntityMailAttr = {
        aid,
        attrType,
        attrValue,
        rcTime,
        mid: id,
        filterValues: {
          from: Array.isArray(from) ? from : [from],
          to: Array.isArray(to) ? to : [to],
        },
        readStatus: readStatus === 'unread' ? 0 : 1,
      };
      resMap.set(aid, value);
    }
    console.log('[mail attr]', resMap);
  }

  private buildMailContentEntity(
    it: MailEntryModel,
    titleMd5?: string
    // fromDb?:boolean,
  ) {
    const mid = it.id;
    const { title } = it.entry;
    titleMd5 = titleMd5 || this.systemApi.md5(it.entry.title, true);
    const {
      cc,
      bcc,
      to,
      from,
      fromName,
      // senders,
      // sendersName,
      ccName,
      bccName,
      toName,
      all,
    } = this.handleMailContact(it);
    const content = it.entry.content?.content;
    return {
      mid,
      title,
      titleMd5,
      isThread: it.isThread ? 1 : 0,
      contactData: all,
      fromEmail: from,
      fromName,
      // sendersEmail: senders,
      // sendersName,
      toContactName: toName,
      ccContactName: ccName,
      bccContactName: bccName,
      toEmail: to,
      ccEmail: cc,
      bccEmail: bcc,
      brief: it.entry.brief,
      content,
      isHtml: it.entry.content?.isHtml,
      contentId: it.entry.content?.contentId,
      contentMd5: this.systemApi.md5(content, true),
      createTime: Date.now(),
      changeAble: it.entry.folder === 2,
      langType: it.entry.langType,
      langListMap: it.entry.langListMap,
      antispamInfo: it.antispamInfo,
      encoding: it.entry.content?.encoding || 'default',
    } as EntityMailContent;
  }

  private buildMailDataEntity(it: MailEntryModel, allInfo: number, titleMd5?: string) {
    const mid = it.id;
    const { title } = it.entry;
    titleMd5 = titleMd5 || this.systemApi.md5(it.entry.title, true);
    const { to, toName, from, fromName, all, senders, sendersName } = this.handleMailContact(it);
    // 为了匹配 status 表中 buildMailStatusInfo 做的设计才进行的调换
    const sdTime = -(util.parseDate(it.entry.receiveTime) || 0);
    const rcTime = -(util.parseDate(it.entry.sendTime) || 0);
    const isEncryptedMail = it.entry.attachment ? getIsEncryptedMail(it.entry.attachment) : false;
    return {
      mid,
      title,
      titleMd5,
      isThread: it.isThread ? 1 : 0,
      attachmentCount: it.entry.attachment?.length || 0,
      attSource: it?.entry?.attSource || undefined,
      sdTime,
      rcTime,
      brief: it.entry.brief,
      contactData: all,
      fromEmail: from,
      fromName,
      toContactName: toName,
      // ccContactName: ccName,
      // bccContactName: bccName,
      toEmail: to,
      sendersEmail: senders,
      sendersName,
      isIcs: it.entry.isIcs,
      traceId: it.entry.traceId,
      taskId: it.taskId, // 任务邮件id
      suspiciousSpam: !!it.entry.suspiciousSpam,
      requestReadReceipt: it.entry.requestReadReceipt,
      // ccEmail: cc,
      // bccEmail: bcc,
      allInfo,
      createTime: Date.now(),
      changeAble: it.entry.folder === 2,
      priority: it.entry.priority,
      isScheduleSend: it.entry.isScheduleSend || false,
      scheduleDateTimeZone: it.scheduleDateTimeZone,
      tid: it.entry.tid,
      praiseId: it.entry.praiseId,
      sentMailId: it.entry.sentMailId,
      langType: it.entry.langType,
      langListMap: it.entry.langListMap,
      linkAttached: it.entry.linkAttached,
      size: it.size,
      encpwd: it.entry.encpwd || '',
      isEncryptedMail,
      mailIllegal: it.mailIllegal ? it.mailIllegal.join(',') : '',
    } as EntityMailData;
  }

  deleteExistData(mapKey: string, data: Map<string, resultObject>, originData: resultObject[], reserveKeys?: string[]) {
    originData.forEach(it => {
      const key = it[mapKey];
      if (!!it && !!key) {
        const target = data.get(key);
        if (target) {
          let reserve = true;
          if (reserveKeys && reserveKeys.length > 0) {
            const { diff } = this.mergeAndTestData(target, it, reserveKeys);
            if (!diff) {
              reserve = false;
            }
          } else {
            reserve = false;
          }
          if (!reserve) {
            data.delete(key);
          }
        }
      }
    });
  }

  // deleteExistDataByAttachment(
  //   mapKey: string,
  //   data: Map<string, resultObject>,
  //   originData: resultObject[]
  // ) {
  //   originData.forEach(it => {
  //     const key = it[mapKey];
  //     if (!!it && !!key) {
  //       const target = data.get(key) as EntityMailData;
  //       if (target && target?.attachment) {
  //         const del = target.attachment.some((item: MailFileAttachModel, index: number) => {
  //           if (
  //             it.attachment[index]?.inlined && it.attachment[index]?.inlined !== item?.inlined
  //           ) {
  //             return true;
  //           }
  //           const isWinMailAttachment = util.isWinMailAttachment(item);
  //           if (isWinMailAttachment && it.attachment[index]) {
  //             return true;
  //           }
  //           return false;
  //         });
  //         if (del) {
  //           data.delete(key);
  //         }
  //       }
  //     }
  //   });
  // }

  private handleMailContact(item: MailEntryModel) {
    const cc: string[] = [];
    const bcc: string[] = [];
    const to: string[] = [];
    const senders: string[] = [];
    const ccName: string[] = [];
    const bccName: string[] = [];
    const toName: string[] = [];
    const sendersName: string[] = [];
    const all: ParsedContact[] = [];
    const from = item.sender?.contactItem?.contactItemVal;
    // item.sender 会有undefined的情况
    const fromName = item.sender?.originName || item.sender?.contact?.contact?.contactName;
    // const allContact: string[] = [];
    item.receiver.forEach(it => {
      if (it) {
        const email = it.contactItem.contactItemVal;
        const name = it.originName || it.contact.contact.contactName;
        all.push({
          name,
          email,
          type: it.mailMemberType,
          item: '',
        });
        // allContact.push(name);
        if (it.mailMemberType === 'to') {
          to.push(email);
          toName.push(name);
        } else if (it.mailMemberType === 'cc') {
          cc.push(email);
          ccName.push(name);
        } else if (it.mailMemberType === 'bcc') {
          bcc.push(email);
          bccName.push(name);
        }
      }
    });
    if (item.senders && item.senders.length > 1) {
      item.senders.forEach(it => {
        if (it) {
          const email = it.contactItem.contactItemVal;
          const name = it.originName || it.contact.contact.contactName;
          all.push({
            name,
            email,
            type: it.mailMemberType || '',
            item: '',
          });
          senders.push(email);
          sendersName.push(name);
        }
      });
    }
    if (from && fromName) {
      all.push({
        name: fromName,
        email: from,
        type: '',
        item: '',
      });
    }
    return {
      cc,
      bcc,
      to,
      from,
      senders,
      fromName,
      sendersName,
      ccName,
      bccName,
      toName,
      all,
    };
  }

  // 获得聚合邮件的第一封邮件ID
  async getFirstMessageFromThreadMail(threadId: string, _account?: string) {
    const threadMail = await this.getMailById({
      id: threadId,
      noContent: true,
      noContact: true,
      noAttachment: true,
      noData: true,
      _account,
    });
    if (!threadMail || threadMail.length === 0) {
      return Promise.reject(new Error('Not Found Thread Mail When Replay'));
    }
    const { threadMessageFirstId } = threadMail[0].entry;
    if (!threadMessageFirstId) {
      return Promise.reject(new Error('Not Found Thread Mail When Replay'));
    }
    return threadMessageFirstId;
  }

  getAllThreadIds(data: MailEntryModel[], includeNormal = false) {
    const res = data.reduce<Set<string>>((total, current) => {
      const { isThread, convFids, id, threadId } = current;
      if (isThread && Array.isArray(convFids) && convFids.length > 0) {
        convFids.forEach(fid => total.add(util.getJointThreadId(threadId, fid)));
        if (threadId) {
          total.add(threadId);
        }
      }
      if (includeNormal) {
        total.add(id);
      }
      return total;
    }, new Set());
    return Array.from(res);
  }

  async doGetMailSearchRecords(count = 10, _account?: string): Promise<MailSearchRecord[]> {
    const res = await this.doGetMailOptRecords({ action: 'search', count }, _account);
    if (Array.isArray(res) && res.length > 0) {
      return res.map(v => ({
        id: v.oid,
        type: (v.operationTitle as MailSearchTypes) || 'all',
        content: v.operationContent,
      }));
    }
    return [];
  }

  async doSaveMailSearchRecord(content: MailSearchRecordPayload[], _account?: string) {
    const operationRecords: Array<Omit<EntityMailOperation, 'oid'>> = content.map(it => {
      const now = -Date.now();
      return {
        operationType: 'search',
        createTime: now,
        updateTime: now,
        finishTime: now,
        operationContent: it.content,
        operationTitle: it.type,
        delFlag: 0,
      };
    });
    await this.db.putAll(mailOperationTable, operationRecords, undefined, _account);
  }

  async doGetMailOptRecords(params: MailOperationRecord, _account?: string) {
    return (await this.db.getByRangeCondition(
      {
        start: 0,
        count: params.count || 10,
        adCondition: {
          field: ['operationType', 'delFlag', 'createTime'],
          type: 'between' as availableCompareFunc,
          args: [[params.action, 0, -Number.MAX_VALUE], [params.action, 0, 0], true, true],
        },
        ...mailOperationTable,
      },
      _account
    )) as EntityMailOperation[];
  }

  async updateMailSearchRecord(params: MailSearchRecordUpdatePayload, _account?: string) {
    const result = (await this.db.getByIds(mailOperationTable, params.id, _account)) as EntityMailOperation[];
    if (Array.isArray(result) && result.length > 0) {
      result.forEach(v => {
        v.delFlag = params.deleteFlag;
      });
      this.db.putAll(mailOperationTable, result).then();
    }
  }

  deleteByIds(deletedIds: string[], _account?: string) {
    return Promise.all([
      this.db.deleteById({ ...mailTable.status, _dbAccount: _account }, deletedIds),
      this.db.deleteById({ ...mailTable.content, _dbAccount: _account }, deletedIds),
      this.db.deleteById({ ...mailTable.data, _dbAccount: _account }, deletedIds),
      this.db.deleteById({ ...mailTable.attachment, _dbAccount: _account }, deletedIds),
      this.deleteMailAttrByMids(deletedIds, _account),
    ]).catch(ex => {
      console.warn(ex);
    });
  }

  deleteTpMailsById(deletedIds: string[]) {
    return Promise.all([this.db.deleteById({ ...mailTable.tpMail }, deletedIds), this.db.deleteById({ ...mailTable.tpMailContent }, deletedIds)]).catch(ex => {
      console.warn(ex);
    });
  }

  deleteMailAttrByMids(mids: string[], _account?: string) {
    return this.db.deleteByByRangeCondition({
      adCondition: {
        field: 'mid',
        args: [mids],
        type: 'anyOf',
      },
      ...mailTable.attr,
      _dbAccount: _account,
    });
  }

  deleteTpMailsByOwner(owners: string[]) {
    const promises = [...new Set(owners)].reduce<Array<Promise<number>>>((t, v) => {
      const adCondition: AdQueryCondition = {
        field: ['owner', 'rcTime'],
        args: [[v, -Number.MAX_VALUE], [v, 0], true, true],
        type: 'between',
      };
      const p1 = this.db.deleteByByRangeCondition({
        adCondition,
        ...mailTable.tpMail,
      });
      const p2 = this.db.deleteByByRangeCondition({
        adCondition,
        ...mailTable.tpMailContent,
      });
      return [...t, p1, p2];
    }, [] as Array<Promise<number>>);

    return Promise.all(promises).catch(e => {
      console.error('deleteTpMailsByOwner', e);
    });
  }

  deleteCustomerUnread(lastUpdateTime: number) {
    const adCondition: AdQueryCondition = {
      field: ['type', 'updateTime'],
      args: [['customer', -Number.MAX_VALUE], ['customer', lastUpdateTime - 2000], true, true],
      type: 'between',
    };
    return this.db.deleteByByRangeCondition({
      adCondition,
      ...mailTable.statistic,
    });
  }

  saveFilesInMail(taskEnable?: boolean, taskType: UpdateMailCountTaskType = 'default', _account?: string) {
    return this.mailAttachmentCacher.saveFilesInMail(taskEnable || false, taskType, _account);
  }

  mkDownloadDir(type: 'inline' | 'regular', config: { fid: number; mid: string; _account?: string }, fallbackToDefault?: boolean): Promise<string> {
    return this.mailAttachmentCacher.mkDownloadDir(type, config, fallbackToDefault);
  }

  // 获取星标联系人列表
  async doListStarContact(_account?: string): Promise<ListStarContactRes> {
    const currentUser = this.systemApi.getCurrentUser(_account);
    const res = await this.contactApi.doGetPersonalMarkList(undefined, undefined, { needMemberEmail: true }, _account);
    console.log('[star mail] star List from db', res);
    const starList: MailBoxModel[] = [];
    const addressContactMap: StarAddressContactMap = {};
    res.forEach((v, index) => {
      const mailBoxId = getFolderStartContactId(v?.value, v?.type);
      const parent = mailBoxOfStar.id;
      const star: MailBoxModel = {
        childrenCount: 0,
        _account: currentUser?.id,
        authAccountType: currentUser?.prop?.authAccountType as string, // currentUser?.prop?.authAccountType,
        entry: {
          deferCount: 0,
          mailBoxName: v.name,
          mailBoxCurrentUnread: v.unreadMailCount || 0,
          mailBoxUnread: v.unreadMailCount || 0,
          mailBoxTotal: 0,
          mailBoxType: 'sys',
          mailBoxId,
          mailBoxParent: parent,
          pid: parent,
          threadMailBoxTotal: 0,
          threadMailBoxUnread: v.unreadMailCount || 0,
          threadMailBoxCurrentUnread: v.unreadMailCount || 0,
          id: mailBoxId,
          sort: index,
        },
        mailBoxId,
        children: [],
        starInfo: {
          id: v.value,
          type: +v.type === 1 ? 'personal' : 'org',
          emailList: v.emails,
        },
      };
      starList.push(star);
      if (Array.isArray(v.emails) && v.emails.length > 0) {
        v.emails.forEach(email => {
          if (!addressContactMap[email]) {
            addressContactMap[email] = { contactsBelong: new Set([v.value]) };
          } else {
            addressContactMap[email].contactsBelong.add(v.value);
          }
        });
      }
    });
    return {
      starList,
      addressContactMap,
    };
  }
}
