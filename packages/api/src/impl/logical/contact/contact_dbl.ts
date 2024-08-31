/* eslint-disable max-statements */
/* eslint-disable max-lines */
import mergeWith from 'lodash/mergeWith';
import lodashGroupby from 'lodash/groupBy';
import lodashChunk from 'lodash/chunk';
import lodashGet from 'lodash/get';
import lodashOrderBy from 'lodash/orderBy';
import dayjs from 'dayjs';
import { DataTrackerApi } from '@/api/data/dataTracker';
import {
  AdQueryCondition,
  BaseType,
  ContactSearchConfig,
  ContactSearchResult,
  ContactSearchResult2,
  DbApiV2,
  orderParams,
  QueryConfig,
  QueryFilterFunc,
  SearchConditionFilter,
  SearchFilter,
  SearchFilterType,
  AdQueryConfig,
  DBList,
} from '@/api/data/new_db';
import { api } from '@/api/api';
import { apis, inWindow } from '@/config';
import {
  ContactCommonRes,
  contactCondition,
  ContactEntityUpdateParams,
  ContactListParams,
  contactTableNames,
  ContactTeam,
  ContactTeamMember,
  DeleteListParams,
  diffList,
  diffRes,
  HandleContactListParams,
  OrgContactIndex,
  OrgContactListParams,
  OrgEntityMap,
  OrgListParams,
  recentContactListParams,
  recentContactListRes,
  SearchCondition,
  // SearchContactTablesNames,
  // SearchMemoryTransModel,
  // SearchTableParams,
  // SearchTransModel,
  ServerTeamRes,
  syncRes,
  SyncTeamListParams,
  tableType,
  TeamMemberMap,
  UpdateContactModelRes,
  SearchTransModel,
  SearchTableParams,
  SearchContactTablesNames,
  SearchMemoryTransModel,
  ContactPersonalMarkSimpleModel,
  ContactPersonalMarkNotifyEventData,
  CoreOrgServerRawData,
  CoreContactServerRawData,
  EntityOrgPathList,
  CoreContactEvent,
  ContactAccountsOption,
  ContactAccountsOptionWithPartial,
  FrequentContactParams,
} from '@/api/logical/contactAndOrg';
import {
  CatchErrorRes,
  ContactModel,
  ContactType,
  EntityContact,
  EntityContactItem,
  EntityOrg,
  EntityOrgContact,
  EntityOrgTeamContact,
  EntityPersonalOrg,
  EntityPersonalOrgContact,
  EntityTeamOrg,
  identityObject,
  NeedUpdateTeamOrgList,
  OrgContactModel,
  resultObject,
  ContactMemoryModel,
  EntityPersonalMark,
} from '@/api/_base/api';
import { util } from '@/api/util';
import { Team } from '@/api/logical/im';
import { TEAM_EVENT_NAME, TeamEventCallbackParmas } from '@/api/logical/im_team';
import { SystemApi } from '@/api/system/system';
import { EventApi, SystemEvent } from '@/api/data/event';
import { DataTransApi, ResponseData } from '@/api/data/http';
import {
  contactCommonConditionFilterName,
  contactCommonSearchFilterName,
  contactCommonTypeFilter,
  contactExcludeSelfFilterName,
  contactIMFilterName,
  contactMultiTypeFilterName,
  contactOrgIdEqTeamFilterName,
  contactOrgIdNeqPersonOrgFilterName,
  contactOrgIdNeqTeamFilterName,
  contactGrepRelateEnterpriseFilterName,
  contactGrepInvalidEnterpriseFilterName,
} from '@/api/logical/contact_constants';
import { AccountApi } from '@/api/logical/account';
import { ContactTransform, ContactTransformInstance } from './contact_transform';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { TaskApi, ContactSyncTaskEntity } from '@/api/system/task';
import { DataStoreApi } from '@/api/data/store';
import { wait } from '@/api/util/index';

// import { searchDbHelper } from './contact_search_helper';

export class ContactDB {
  protected dbApi: DbApiV2;

  protected httpApi: DataTransApi;

  protected systemApi: SystemApi;

  protected eventApi: EventApi;

  protected accountApi: AccountApi;

  protected storeApi: DataStoreApi;

  private dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

  contactTrans: ContactTransform = ContactTransformInstance;

  // 内存搜索通讯录数据
  // private searchDBHelper = searchDbHelper

  contactUtil: ContactConst = ContactUtilInterface;

  readonly orgTable = 'org';

  private contactLastUpdateTimMap: Record<string, number> = {};

  protected isInitPersonalOrg = false;

  private taskApi = api.requireLogicalApi(apis.taskApiImpl) as TaskApi;

  private readonly tablePrimaryKeyMap: Record<string, string> = {
    contact: 'id',
    contactItem: 'id',
    // contactOrg: 'id',
    orgContact: 'id',
    org: 'id',
  };

  inited = false;

  private isSyncTeamList = false;

  contactSyncTimes = 0;

  private coreQuickCleanDelayDuration = 2 * 1000;

  private coreCleanDelayDuration = 15 * 1000;

  readonly tablesName: contactTableNames[] = [
    this.contactUtil.contactTable,
    this.contactUtil.contactItemTable,
    this.contactUtil.orgTable,
    this.contactUtil.orgpathlistTable,
  ];

  private enablePutContact = true;

  private coreNeedDeleteStep: Map<string, Set<'org' | 'contact'>> = new Map();

  constructor() {
    this.dbApi = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.storeApi = api.getDataStoreApi();
  }

  getContactLastUpdateTime(_account: string = this.contactUtil.getCurrentAccount()) {
    return this.contactLastUpdateTimMap[_account] || 0;
  }

  getContactWritePriority() {
    return this.enablePutContact;
  }

  setContactLastUpdateTime(_account: string = this.contactUtil.getCurrentAccount()) {
    this.contactLastUpdateTimMap[_account] = Date.now();
  }

  repackageQueryConfigByRelateEnterpriseInfo(_queryConfig: AdQueryConfig, noRelateEnterprise = false, enterpriseFieldName = 'enterpriseId'): AdQueryConfig {
    if (!noRelateEnterprise || (inWindow() && window.isAccountBg)) {
      return _queryConfig;
    }

    const queryConfig = { ..._queryConfig };

    if (queryConfig.filter && queryConfig.filter.length) {
      queryConfig.filter =
        typeof queryConfig.filter === 'string'
          ? [queryConfig.filter, contactGrepRelateEnterpriseFilterName]
          : [...queryConfig.filter, contactGrepRelateEnterpriseFilterName];
    }

    queryConfig.additionalData = { ...queryConfig.additionalData, needGrepRelateEnterpriseResult: true, enterpriseFieldName };

    return queryConfig;
  }

  setDataOrder<T>(params: orderParams<T>) {
    const { orderBy, data, query } = params;
    if (!Array.isArray(data) || !data.length || !Array.isArray(orderBy) || !orderBy.length) {
      return data;
    }

    const iteratees: (string | ((params: T) => number))[] = [];
    const orders: ('asc' | 'desc')[] = [];

    orderBy.forEach(orderItem => {
      const orderItemArr = (Array.isArray(orderItem) ? orderItem : [orderItem, true]) as [string, boolean];
      if (orderItemArr.length < 2) {
        return;
      }
      const [field, isAsc = false] = orderItemArr;
      if (typeof query === 'string' && query.length) {
        iteratees.push(o => {
          const str = lodashGet(o, field, '');

          return typeof str === 'string' && str.includes(query) ? str.indexOf(query) : Infinity;
        });
      } else {
        iteratees.push(field);
      }
      orders.push(isAsc ? 'asc' : 'desc');
    });
    return lodashOrderBy(data, iteratees, orders);
  }

  /**
   * 通过联系人列表
   * @param params 查找联系人的条件
   */
  async getContactList(params: ContactListParams): Promise<EntityContact[]> {
    const { idList, contactType, showDisable = true, isIM, exclude, orderByItem: orderBy, _account, needLog, noRelateEnterprise, needOrder = true } = params;
    if (!contactType) {
      if (!idList) {
        return Promise.reject(new Error('必须传入idList,或者contactType'));
      }
      if (!idList.length) {
        console.error('[contact_dbl] getContactList error', idList);
        return [];
      }
    }
    let adCondition;
    const includeOption: SearchConditionFilter[] = [];
    const excludeOption: SearchConditionFilter[] = exclude || [];
    // 代表联系人类型
    if (contactType && (!idList || idList.length === 0)) {
      adCondition = {
        type: 'equals',
        args: [contactType],
        field: 'type',
      } as AdQueryCondition;
    }
    if (idList && idList.length > 0) {
      adCondition = {
        type: 'anyOf',
        args: [idList],
        field: 'id',
      } as AdQueryCondition;
      if (contactType) {
        includeOption.push({ key: 'type', val: contactType });
      }
    }
    // 代表只展示可以IM的联系人
    if (isIM) {
      includeOption.push({ key: 'enableIM', val: true });
    }
    // 代表只展示正常的状态的联系人
    if (!showDisable) {
      includeOption.push({ key: 'visibleCode', val: 0 });
    }

    let res: EntityContact[] = [];
    try {
      if (needLog) {
        console.warn('[contact_tree] doGetPersonalContact start', _account);
      }

      const queryConfig = this.repackageQueryConfigByRelateEnterpriseInfo(
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.contactTable,
          adCondition,
          additionalData: {
            includeOption,
            excludeOption,
            parentName: needLog ? 'doGetPersonalContact' : '',
          },
          filter: contactCommonConditionFilterName,
          useDexieFilter: false,
          _dbAccount: _account,
        },
        noRelateEnterprise
      );

      res = (await this.dbApi.getByRangeCondition(queryConfig)) as EntityContact[];
      if (needLog) {
        console.warn('[contact_tree] doGetPersonalContact end', _account);
      }
    } catch (error) {
      console.error('[contact] getContactList', error, params);
    }
    if ((res && res.length <= 1000) || needOrder) {
      res = this.setDataOrder({
        data: res,
        orderBy: orderBy || ['contactLabel', 'contactPYName', 'contactName'],
      });
    }

    return res;
  }

  async getPersonalContactByEmails(emails: string[], _account?: string): Promise<ContactModel[]> {
    const contactModelList = (await this.getContactByItem({
      type: 'EMAIL',
      filterType: 'personal',
      value: emails,
      _account,
    })) as ContactModel[];

    return contactModelList;
  }

  async getOrgList(params: OrgListParams, returnEmptyWhenNoIdList?: boolean): Promise<Array<EntityOrg & EntityTeamOrg>> {
    params = params || {};
    const { idList, typeList, originIdList, showSearchable, isIM, exclude, needLog, orderByItem: orderBy, _account, needOrder = true } = params;
    let adCondition;
    const includeOption: SearchConditionFilter[] = [];
    const excludeOption: SearchConditionFilter[] = exclude || [];
    // 用originId索引查询
    if (!!returnEmptyWhenNoIdList && (originIdList?.length === 0 || idList?.length === 0)) {
      return Promise.resolve([]);
    }
    if (originIdList?.length) {
      adCondition = {
        type: 'anyOf',
        args: [originIdList],
        field: 'originId',
      } as AdQueryCondition;
      includeOption.push({ key: 'type', val: 0 });
    }
    // 用id索引查询（origin同时存在取id）
    if (idList?.length) {
      adCondition = {
        type: 'anyOf',
        args: [idList],
        field: 'id',
      } as AdQueryCondition;
      if (originIdList) {
        includeOption.push({ key: 'originId', val: originIdList });
      }
    }
    // 代表只展示可以IM的联系人
    if (isIM) {
      excludeOption.push({ key: 'type', val: [1, 2, 2001] });
    }
    if (showSearchable) {
      includeOption.push({ key: 'visibleCode', val: [0, 7] });
    } else {
      includeOption.push({ key: 'visibleCode', val: 0 });
    }
    if (typeList) {
      includeOption.push({ key: 'type', val: typeList });
    }
    let res: Array<EntityOrg & EntityTeamOrg> = [];
    try {
      // const contactCommonConditionFilter = [
      //   item => this.transInclude2FilterCondition(includeOption, item)
      //     && this.transExclude2FilterCondition(excludeOption, item),
      // ];
      if (needLog) {
        console.warn('[contact_tree] getOrgList start ', _account);
      }
      res = (await this.dbApi.getByRangeCondition({
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.orgTable,
        adCondition,
        additionalData: {
          includeOption,
          excludeOption,
          parentName: needLog ? 'getOrgList' : '',
        },
        filter: contactCommonConditionFilterName,
        useDexieFilter: false,
        _dbAccount: _account,
      })) as Array<EntityOrg & EntityTeamOrg>;
    } catch (error) {
      console.error('getOrgListError', error);
    }
    if (needOrder) {
      res = this.setDataOrder({
        data: res,
        orderBy: orderBy || [['orgRank', false]],
      });
    }

    return res;
  }

  /**
   * @deprecated:无人调用 1.21之后下掉
   * @param data
   * @returns
   */
  async setContactList(data: EntityContact[]) {
    if (!Array.isArray(data) || !data.length || !this.enablePutContact) {
      return;
    }
    await this.dbApi.putAll(
      {
        tableName: this.contactUtil.contactTable,
        dbName: this.contactUtil.contactDbName,
      },
      data
    );
  }

  /**
   * @deprecated:无人调用 1.21之后下掉
   * @param data
   * @returns
   */
  async setOrgList(data: EntityOrg[]) {
    if (!Array.isArray(data) || !data.length || !this.enablePutContact) {
      return;
    }
    await this.dbApi.putAll(
      {
        tableName: this.contactUtil.orgTable,
        dbName: this.contactUtil.contactDbName,
      },
      data
    );
  }

  getTableList(name: string, idList: Array<number | string>, contactType?: ContactType) {
    const filterName = contactType && name === this.contactUtil.contactTable ? contactCommonTypeFilter : undefined;
    // if () {
    // filter = [(item: resultObject) => item.type === contactType];
    // }
    const adCondition = {
      type: 'anyOf',
      args: [idList],
      field: 'id',
    } as AdQueryCondition;
    const query = {
      adCondition,
      dbName: this.contactUtil.contactDbName,
      tableName: name,
      additionalData: {
        contactType,
      },
      // filter,
    } as QueryConfig;
    if (filterName) {
      query.filter = filterName;
      query.useDexieFilter = false;
    }
    return this.dbApi.getByRangeCondition(query);
  }

  /**
   *  通过联系人信息比如（email,yunxinId）获取contactId
   * @param list 通过联系人信息列表
   */
  async getContactItemListByItem(list: string[]): Promise<EntityContactItem[]> {
    let contactItemList: EntityContactItem[] = [];
    try {
      if (!list?.length) {
        return [];
      }
      const adCondition = {
        type: 'anyOf',
        args: [list],
        field: 'contactItemVal',
      } as AdQueryCondition;
      contactItemList = (await this.dbApi.getByRangeCondition({
        adCondition,
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactItemTable,
      })) as EntityContactItem[];
    } catch (e) {
      console.error('[contact] getContactIdListByItem', e, list);
    }
    return contactItemList;
  }

  // 老方法对应的
  private async getContactByItemOld(condition: contactCondition): Promise<Record<string, ContactModel>> {
    const { type, value, filterType, _account, showDisable } = condition;

    const adCondition = {
      type: 'anyOf',
      args: value,
      field: 'contactItemVal',
    } as AdQueryCondition;

    const contactItemList = await this.dbApi.getByRangeCondition<EntityContactItem>({
      adCondition,
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactItemTable,
      additionalData: {
        type,
        filterType,
      },
      filter: contactMultiTypeFilterName,
      useDexieFilter: false,
      _dbAccount: _account,
    });

    if (!contactItemList || !contactItemList.length) {
      return {};
    }

    const contactIds: Set<string> = new Set(contactItemList.map(item => item.contactId));

    const contactList = await this.getContactList({
      idList: [...contactIds],
      _account,
      showDisable,
    });

    if (!contactList || !contactList.length) {
      return {};
    }

    const validContactMap: Map<string, EntityContact> = new Map();
    contactList.forEach(item => {
      if (condition.isIM && !item.enableIM) {
        return;
      }

      if (condition.filterType && item.type !== filterType) {
        return;
      }

      validContactMap.set(item.id, item);
    });

    if (!validContactMap.size) {
      return {};
    }

    const validContactItemList = await this.getContactItemListByContactId({ idList: [...validContactMap.keys()], _account });
    const contactItemMap = lodashGroupby(validContactItemList, item => item.contactId);

    return [...validContactMap.keys()].reduce((total, contactId) => {
      if (!Reflect.has(contactItemMap, contactId)) {
        return total;
      }
      total[contactId] = {
        contact: validContactMap.get(contactId)!,
        contactInfo: contactItemMap[contactId]!,
      };
      return total;
    }, {} as Record<string, ContactModel>);
  }

  // 执行分包查询
  private async getContactByItemWithChunked(condition: contactCondition): Promise<Record<string, ContactModel>> {
    const { type, value, filterType, _account } = condition;

    let contactModelMap: Record<string, ContactModel> = {};

    await lodashChunk(value, 2000).reduce((total, chunkedIds) => {
      total = total
        .then(() =>
          this.getContactByItemOld({
            type,
            value: chunkedIds,
            filterType,
            _account,
          })
        )
        .then(chunkedContactModel => {
          contactModelMap = Object.assign(contactModelMap, chunkedContactModel);
          return true;
        });
      return total;
    }, Promise.resolve(true));

    return contactModelMap;
  }

  private async getContactSimpleModelByItem(condition: contactCondition): Promise<Record<string, ContactModel>> {
    const { value, _account } = condition;

    // 待补充一堆条件
    const adCondition = {
      type: 'anyOf',
      args: value,
      field: 'accountName',
    } as AdQueryCondition;

    const entityContactList = await this.dbApi.getByRangeCondition<EntityContact>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactTable,
      adCondition,
      _dbAccount: _account,
    });

    return entityContactList.reduce((total, entityContact) => {
      total[entityContact.id] = {
        contact: entityContact,
        contactInfo: [
          {
            contactId: entityContact.id,
            contactItemVal: entityContact.accountName,
            contactItemType: 'EMAIL',
            isDefault: 1,
            contactItemRefer: '',
            type: entityContact.type,
            _lastUpdateTime: entityContact._lastUpdateTime,
            id: util.getUnique(entityContact.id, entityContact.accountName),
          },
        ],
      };
      return total;
    }, {} as Record<string, ContactModel>);
  }

  private async getContactSimpleModelByItemWithChunked(condition: contactCondition): Promise<Record<string, ContactModel>> {
    const { type, value, filterType, _account } = condition;

    let contactModelMap: Record<string, ContactModel> = {};

    await lodashChunk(value, 2000).reduce((total, chunkedIds) => {
      total = total
        .then(() =>
          this.getContactSimpleModelByItem({
            type,
            value: chunkedIds,
            filterType,
            _account,
          })
        )
        .then(chunkedContactModel => {
          contactModelMap = Object.assign(contactModelMap, chunkedContactModel);
          return true;
        });
      return total;
    }, Promise.resolve(true));

    return contactModelMap;
  }

  /**
   * 通过condition向contactItem表查询contactId，在通过contactId 获取contact基础信息，在过滤不符合的联系人信息
   * @param condition 联系人查询条件
   */
  async getContactByItem(condition: contactCondition): Promise<ContactModel[]> {
    if (!lodashGet(condition, 'type.length', 0) || !lodashGet(condition, 'value.length', 0)) {
      return [];
    }

    if (condition.type === 'EMAIL') {
      condition.value = (condition.value || []).map(item => `${item}`.toLocaleLowerCase());
    }

    // const { type, value } = condition;
    let contactModelMap: Record<string, ContactModel> = {};

    try {
      const queryType = lodashGet(condition, 'generateContactModelType', 'oldModel');

      if (queryType === 'chunked') {
        contactModelMap = await this.getContactByItemWithChunked(condition);
      } else if (queryType === 'simpleModel') {
        contactModelMap = await this.getContactSimpleModelByItemWithChunked(condition);
      } else {
        contactModelMap = await this.getContactByItemOld(condition);
      }
    } catch (ex) {
      console.error('getContactByItem Error', ex, condition);
    }

    return contactModelMap ? Object.values(contactModelMap) : [];
  }

  async getContactByYunxin(accounts: string[], showDisable: boolean): Promise<EntityContact[]> {
    let contactList: EntityContact[] = [];
    try {
      if (!accounts?.length) {
        return contactList;
      }
      const adCondition = {
        type: 'anyOf',
        args: [accounts],
        field: 'contactItemVal',
      } as AdQueryCondition;
      // const cfilter = [
      //   item => item.contactItemType === 'yunxin' && item.type === 'enterprise',
      // ];
      const contactItemList = (await this.dbApi.getByRangeCondition({
        adCondition,
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactItemTable,
        filter: contactIMFilterName,
        useDexieFilter: false,
      })) as EntityContactItem[];
      if (contactItemList && contactItemList.length > 0) {
        const idList = util.getKeyListByList(contactItemList, 'contactId');
        contactList = await this.getContactList({
          idList,
          isIM: true,
          showDisable,
        });
      }
    } catch (error) {
      console.error('getContactByYunxin Error', error, accounts);
    }
    return contactList;
  }

  /**
   * 通过联系人id列表获取对应的组织的列表
   * @param idList
   * @param _account
   */
  private async getOrgData(idList: string[], _account: string): Promise<OrgEntityMap> {
    const res = await this.getOrgContactListByContactId({
      idList,
      filterTeamOrg: true,
      _account,
    });
    const orgContact = util.getGroupListByItem(res, 'contactId', 'orgId');
    const orgContactIdList = orgContact.objectKeyArray;
    const orgContactIdMap = orgContact.objectKeyMap; // {1000:[{orgId:'',contactId:1000}]}
    const orgList = await this.getOrgList({
      idList: orgContact.listKeyArray,
      _account,
    });
    const orgData = util.listToMap(orgList, 'id');
    orgContactIdList.forEach((contactId: number) => {
      const currentOrgContactIdList = orgContactIdMap[contactId];
      orgContactIdMap[contactId] = currentOrgContactIdList.map((item: resultObject) => orgData[item.orgId]);
    });
    return orgContactIdMap as OrgEntityMap;
  }

  /**
   * 通过联系人idList获取联系人详情列表
   * @param idList
   * @param _account
   */
  async getContactItemListByContactId({ idList = [], _account = this.contactUtil.getCurrentAccount() }: any): Promise<EntityContactItem[]> {
    if (idList?.length) {
      const adCondition = {
        type: 'anyOf',
        field: 'contactId',
        args: [idList],
      } as AdQueryCondition;
      console.time('[optimize]contactApi-searchContactFetchItem:' + idList.length);
      const res = (await this.dbApi.getByRangeCondition({
        adCondition,
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactItemTable,
        _dbAccount: _account,
      })) as EntityContactItem[];
      console.timeEnd('[optimize]contactApi-searchContactFetchItem:' + idList.length);
      return res;
    }
    return [];
  }

  async queryPersonalMemberCount(ids: string[], account?: string): Promise<Record<string, number>> {
    if (!ids || !ids.length) {
      return {};
    }

    const orgContactList = await this.dbApi.getByRangeCondition<EntityOrgContact>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgContactTable,
      adCondition: {
        field: 'orgId',
        type: 'anyOf',
        args: ids,
      },
      _account: account || this.systemApi.getCurrentUser()?.id || '',
    });

    if (!orgContactList || !orgContactList.length) {
      return {};
    }

    const contactIds = orgContactList.map(item => item.contactId);

    const entityContactList = await this.dbApi.getByRangeCondition<EntityContact>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactTable,
      _account: account || this.systemApi.getCurrentUser()?.id || '',
      adCondition: {
        type: 'anyOf',
        field: 'id',
        args: contactIds,
      },
    });

    const entityContactSet = new Set(entityContactList.map(item => item.id));

    const groupMap: Map<string, number> = new Map();

    orgContactList.forEach(item => {
      const { orgId, contactId } = item;

      if (entityContactSet.has(contactId)) {
        groupMap.set(orgId, (groupMap.get(orgId) || 0) + 1);
      }
    });

    return Object.fromEntries(groupMap);
  }

  /**
   * 处理orgContact分组
   * @param idList 分组依据
   * @param list 用来分组的数据
   * @param key 对应的在list中的属性值组成的idList
   */
  private orgContactListHandleGroup(idList: string[], list: OrgContactModel[], key: OrgContactIndex): Array<OrgContactModel[]> {
    return idList.map(id => list.filter(item => item[key] === id));
  }

  /**
   * 处理orgContactList需要添加详细联系人
   * @param contactIdList
   * @param orgContactList
   * @param isAll 是否需要contact全量信息
   * @private
   */
  private async orgContactListHandleContact(contactIdList: string[], orgContactList: OrgContactModel[], isAll?: boolean): Promise<OrgContactModel[]> {
    const contactList = await this.getContactList({ idList: contactIdList });
    if (isAll) {
      const contactModelList = await this.handleContactList({
        contactList,
        orderByIdList: contactIdList,
      });
      const contactModelMap = contactModelList.reduce((modelMap, item) => {
        const contactId = item?.contact?.id;
        if (contactId) {
          if (!modelMap.contactId) {
            modelMap[contactId] = item;
          }
        }
        return modelMap;
      }, {} as identityObject<ContactModel>);
      return orgContactList.map(item => {
        item.model = contactModelMap[item.contactId];
        return item;
      });
    }
    const contactListMap = util.listToMap<EntityContact>(contactList, 'id');
    return orgContactList.map(item => {
      item.contact = contactListMap[item.contactId];
      return item;
    });
  }

  /**
   * 通过条件查询OrgContact表
   * @param condition
   * @param condition.needGroup 是否需要分组
   * @param condition.needContactData 是否需要联系人的详细信息
   * @param condition.filterTeamOrg 是否过滤类型为群组的组织
   * @param condition.type 通过那个index查询
   * @param condition.idList 查询的数据
   */
  async getOrgContactList(condition: OrgContactListParams): Promise<Array<OrgContactModel | OrgContactModel[]>> {
    const { idList, type, includeType, filterPersonalOrg, filterTeamOrg, filterOrg, needGroup, needContactData, needContactModelData, filterSelf, orderBy, _account } =
      condition;
    let adCondition;
    const filter: string[] = [];
    const additionalData: resultObject = {};
    if (idList?.length) {
      adCondition = {
        type: 'anyOf',
        args: [idList],
        field: type,
      } as AdQueryCondition;
    }
    if (filterTeamOrg) {
      // filter.push((item: resultObject) => !item.orgId.startsWith('team_'));
      filter.push(contactOrgIdNeqTeamFilterName);
    }
    if (filterOrg) {
      // filter.push((item: resultObject) => item.orgId.startsWith('team_'));
      filter.push(contactOrgIdEqTeamFilterName);
    }
    if (filterPersonalOrg) {
      // filter.push((item: resultObject) => !item.orgId.startsWith('personal_org_'));
      filter.push(contactOrgIdNeqPersonOrgFilterName);
    }
    const user = this.systemApi.getCurrentUser();
    if (filterSelf && user?.contact) {
      const contactId = user.contact.contact.id;
      additionalData.contactId = contactId;
      filter.push(contactExcludeSelfFilterName);
      // filter.push((item: resultObject) => item.contactId !== contactId);
    }
    let list: OrgContactModel[] = [];
    let res: Array<OrgContactModel | OrgContactModel[]> = [];

    try {
      if (type === 'orgId' && includeType) {
        list = (await this.dbApi.getByRangeCondition({
          adCondition: {
            field: type,
            args: [includeType],
            type: 'startsWith',
          },
          tableName: this.contactUtil.orgContactTable,
          dbName: this.contactUtil.contactDbName,
          additionalData,
          filter,
          useDexieFilter: false,
          _dbAccount: _account,
        })) as OrgContactModel[];
      } else if (adCondition) {
        list = (await this.dbApi.getByRangeCondition({
          adCondition,
          tableName: this.contactUtil.orgContactTable,
          dbName: this.contactUtil.contactDbName,
          additionalData,
          filter,
          useDexieFilter: false,
          _dbAccount: _account,
        })) as OrgContactModel[];
      } else {
        return [];
      }
    } catch (e) {
      console.error('[contact] getOrgContactList', e, condition);
    }
    if (list.length) {
      if (needContactData || needContactModelData) {
        const contactId = util.getKeyListByList<string>(list, 'contactId', true);
        list = await this.orgContactListHandleContact(contactId, list, !!needContactModelData);
      }
      if (orderBy) {
        list = this.setDataOrder({ data: list, orderBy });
      }
      if (needGroup && idList?.length) {
        res = this.orgContactListHandleGroup(idList, list, type);
      } else {
        res = list;
      }
    }
    return res;
  }

  /**
   * 通过idList获取 组织与联系人id联系表 列表
   * @param idList contactId列表
   * @param filterTeamOrg 是否过滤群组
   */
  getOrgContactListByContactId(params: ContactAccountsOptionWithPartial<{ idList: string[]; filterTeamOrg?: boolean }>): Promise<resultObject[]> {
    const { idList, filterTeamOrg, _account = this.systemApi.getCurrentUser()?.id || '' } = params;
    return this.getOrgContactList({
      idList,
      type: 'contactId',
      filterTeamOrg,
      _account,
    });
  }

  /**
   * 通过idList获取 组织与联系人id联系表 列表
   * @param idList:组织id列表
   */
  async getOrgContactListByOrgId(idList: string[], _account: string): Promise<EntityOrgTeamContact[]> {
    return (await this.getOrgContactList({
      idList,
      type: 'orgId',
      _account,
    })) as EntityOrgTeamContact[];
  }

  /**
   * 通过联系人信息类型获取联系人信息列表
   * @param contactType
   * */
  async getContactItemListByType(contactType: string): Promise<EntityContactItem[]> {
    const res = await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactItemTable,
      additionalData: {
        contactType,
      },
      // filter: [item => item.type === contactType],
      filter: contactCommonTypeFilter,
      useDexieFilter: false,
    });
    return res as EntityContactItem[];
  }

  async getPersonalOrg(params: ContactAccountsOption<{ idList?: string[] }>): Promise<EntityPersonalOrg[]> {
    const { idList = [] } = params;
    let adCondition: AdQueryCondition;
    params._account = params._account || this.contactUtil.getCurrentAccount();
    if (Array.isArray(idList) && idList.length) {
      adCondition = {
        type: 'anyOf',
        field: 'id',
        args: [idList],
      };
    } else {
      adCondition = {
        type: 'startsWith',
        field: 'id',
        args: ['personal_org'],
      };
    }
    let personalOrgList = await this.dbApi.getByRangeCondition<EntityPersonalOrg>({
      adCondition,
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgTable,
      _account: params._account,
      asSoon: true,
    });
    personalOrgList = util.setDataOrder({
      data: personalOrgList,
      orderBy: ['orgPYName', 'orgName'],
    });
    return personalOrgList;
  }

  /**
   * 根据联系人email获取联系人展示背景颜色
   * @param email
   */
  getColor(email: string): string {
    return util.getColor(email);
  }

  /**
   * 通过联系人列表数据 去获取相对应的 联系人详情数据以及组织的数组
   * @param params 处理联系人列表数据参数
   */
  async handleContactList(params: HandleContactListParams): Promise<ContactModel[]> {
    const { contactList = [], orderByIdList, needOrgData, _account = this.contactUtil.getCurrentAccount() } = params;
    if (!contactList) {
      return [];
    }
    const idList = orderByIdList || util.getKeyListByList<string>(contactList, 'id');
    if (idList.length === 0) {
      return [];
    }
    const promiseList: any[] = [];
    promiseList.push(this.getContactItemListByContactId({ idList, _account }));
    if (needOrgData) {
      promiseList.push(this.getOrgData(idList, _account));
    }
    const data = await Promise.all(promiseList);
    const contactInfoList = data[0] as EntityContactItem[];
    const orgData = needOrgData ? (data[1] as OrgEntityMap) : undefined;
    return this.contactTrans.transformContactModel({
      orderByIdList: idList,
      contactInfoList,
      contactList,
      orgData,
      _account,
    });
  }

  // 在数据后台获取通讯录内存数据
  async getContactsInMemoryMode(param: { fields: string[]; type?: 'email' | 'yunxin' | 'contactId'; _account?: string }): Promise<ContactMemoryModel[]> {
    const _dbAccount = param._account || this.contactUtil.getCurrentAccount();

    const fieldsMap = {
      email: 'accountName',
      yunxin: 'yunxinId',
      contactId: 'id',
    };
    if (param.type && !Object.keys(fieldsMap).includes(param.type)) {
      return Promise.reject(new Error('ony support email and yunxin'));
    }

    const type = param.type || 'email';

    let { fields } = param;
    if (type === 'email') {
      fields = fields.map(item => item.toLocaleLowerCase());
    }
    // TODO @guochao check
    if (!fields?.length) {
      console.error('[contact_dbl] getContactsInMemoryMode error fields null');
      return [];
    }
    const conditionType = fieldsMap[type];
    // enterprise账号如果存在可用账号 要过滤不可用账号
    const list: ContactMemoryModel[] = await this.dbApi.getByRangeCondition({
      dbName: 'contact_search',
      tableName: 'contact',
      adCondition: {
        type: 'anyOf',
        field: conditionType,
        args: [fields],
      },
      _dbAccount,
    });
    const validContactModelMap: Map<string, ContactMemoryModel> = new Map();

    list.forEach(contact => {
      if (contact.type !== 'enterprise') {
        validContactModelMap.set(contact.id, contact);
        return;
      }
      const key = `enterprise+${contact.accountName}`;
      if (!validContactModelMap.has(key)) {
        validContactModelMap.set(key, contact);
      } else if (validContactModelMap.get(key)?.visibleCode !== 0 && contact.visibleCode === 0) {
        validContactModelMap.set(key, contact);
      }
    });

    return [...validContactModelMap.values()];
  }

  // 将内存数据格式转成成contactModel
  transformMemoryModel2StandardModel(item: ContactMemoryModel): ContactModel {
    const contact = {
      id: item.id,
      accountStatus: 0,
      accountVisible: 1,
      contactLabel: item.contactPYLabelName.slice(0, 1) || '',
      contactPYLabelName: item.contactPYLabelName,
      contactPYName: item.contactPYName,
      contactName: item.contactName,
      accountName: item.accountName,
      enterpriseId: 0,
      accountOriginId: '',
      enableIM: item.enableIM,
      type: item.type,
      position: item.position,
      avatar: item.avatar,
      avatarPendant: item.avatarPendant,
      visibleCode: item.visibleCode,
      updateTime: 0,
      accountType: 2,
      displayEmail: item.accountName,
      accountId: `${item.accountName}_${item.id}`,
      dataSource: 'loki',
    } as unknown as EntityContact;

    const contactItemList = [
      {
        id: '',
        contactItemVal: item.accountName,
        contactItemRefer: '',
        contactItemType: 'EMAIL',
        isDefault: item.isDefault,
        type: item.type,
        contactId: item.id,
        emailType: 1,
      },
    ] as unknown as EntityContactItem[];
    if (item.enableIM && item.type === 'enterprise') {
      contactItemList.push({
        id: '',
        contactItemVal: item.yunxinId,
        contactItemRefer: '',
        contactItemType: 'yunxin',
        isDefault: item.isDefault,
        type: item.type,
        contactId: item.id,
        emailType: 1,
      } as unknown as EntityContactItem);
    }

    return {
      contact,
      contactInfo: contactItemList,
    };
  }

  async getContactSearchCount(_account?: string): Promise<number> {
    const _dbAccount = _account || this.contactUtil.getCurrentAccount();
    return this.dbApi.getTableCount({
      dbName: 'contact_search',
      tableName: 'contact',
      _dbAccount,
    });
  }

  // 判断内存数据库是否是否异常
  async testMemoryDataException() {
    try {
      const memoryCount = await this.dbApi.getTableCount({
        dbName: 'contact_search',
        tableName: 'contact',
      });
      if (memoryCount === 0) {
        return true;
      }
      const dbCount = await this.dbApi.getTableCount({
        dbName: 'contact_dexie',
        tableName: 'contact',
      });
      // 这个判断方式不太准确 但是大部分的遇到的场景都是内存数据库里面只有从服务端load下来的部分数据
      return dbCount >= 2 * memoryCount;
    } catch (ex) {
      return false;
    }
  }

  /**
   * 添加通讯录默认搜索条件
   * @param condition 通讯录搜索
   * @returns 通讯录搜索列表处理后的数据
   */
  handleSearchCondition(condition: SearchCondition): SearchCondition {
    const searchExclude = condition.searchExclude || {};
    const searchInclude = condition.searchInclude || {};
    const { contactType, showDisable = true, isIM = false } = condition;
    const contactItemExclude = searchExclude.contactItem || [];
    const contactInclude = searchInclude.contact || [];
    const orgInclude = searchInclude.org || [];
    contactItemExclude.push({ key: 'contactItemType', val: 'yunxin' });
    if (isIM) {
      contactInclude.push({ key: 'enableIM', val: true });
    }

    if (!showDisable) {
      contactInclude.push({ key: 'visibleCode', val: 0 });
      orgInclude.push({ key: 'visibleCode', val: [0, 7] });
    }

    if (contactType) {
      contactInclude.push({ key: 'type', val: contactType });
    }
    searchExclude.contactItem = contactItemExclude;
    searchInclude.contact = contactInclude;
    searchInclude.org = orgInclude;
    condition.searchExclude = searchExclude;
    condition.searchInclude = searchInclude;
    return condition;
  }

  /**
   * 生成通讯录搜索列表
   * @param condition 搜索条件
   * @returns 通讯录搜索列表
   */
  getSearchCondition(condition: SearchCondition): ContactSearchConfig[] {
    const { exclude, searchExclude, searchInclude, query, _account } = this.handleSearchCondition(condition);
    const itemList: ContactSearchConfig[] = [
      {
        query,
        tableName: this.tablesName[0],
        hitName: 'contactName',
        select: 'id',
        orderByItem: ['contactName'],
        _account,
      },
      {
        query,
        tableName: this.tablesName[0],
        hitName: 'contactPYLabelName',
        select: 'id',
        orderByItem: ['contactPYLabelName'],
        _account,
      },
      {
        query,
        tableName: this.tablesName[0],
        hitName: 'contactPYName',
        select: 'id',
        orderByItem: ['contactPYName', 'accountName'],
        _account,
      },
      {
        query,
        tableName: this.tablesName[1],
        hitName: 'contactItemVal',
        aliasTableName: this.tablesName[0],
        select: 'contactId',
        orderByItem: ['contactItemVal', 'contactItemType'],
        _account,
      },
      {
        query,
        tableName: this.tablesName[2],
        hitName: 'orgName',
        select: 'id',
        orderByItem: ['parent', 'orgRank'],
        _account,
      },
      {
        query,
        tableName: this.tablesName[2],
        hitName: 'orgPYName',
        select: 'id',
        orderByItem: ['orgRank'],
        _account,
      },
    ];
    const searchList: ContactSearchConfig[] = [];
    itemList.forEach(item => {
      if (!exclude?.includes(item.hitName)) {
        const _searchExclude = searchExclude && searchExclude[item.tableName];
        const _searchInclude = searchInclude && searchInclude[item.tableName];
        if (_searchExclude) {
          item.exclude = _searchExclude;
        }
        if (searchInclude) {
          item.include = _searchInclude;
        }
        searchList.push(item);
      }
    });
    return searchList;
  }

  async getSearchData(params: ContactSearchConfig): Promise<resultObject[]> {
    const { query, tableName, exclude = [], include = [], orderByItem: orderBy, hitName, _account } = params;
    const reg = new RegExp(util.escapeRegex(query), 'i');
    // console.log('[contact] contact_db.' + tableName + '  getSearchData ' + query, include, exclude);
    console.time('[optimize]contactApi-searchGetAllData:' + query + ' ' + tableName);
    let res = await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName,
      _dbAccount: _account,
    });
    console.timeEnd('[optimize]contactApi-searchGetAllData:' + query + ' ' + tableName);
    console.time('[optimize]contactApi-searchFilterData:' + query + ' ' + tableName);
    res = res.filter(
      (item: resultObject) =>
        reg.test(item[hitName]) && this.contactTrans.transExclude2FilterCondition(exclude, item) && this.contactTrans.transInclude2FilterCondition(include, item)
    );
    // console.log('[contact] result !!query,hitName,res', query, hitName, res);
    const orderedData = this.setDataOrder({
      data: res,
      orderBy,
      query,
    });
    console.timeEnd('[optimize]contactApi-searchFilterData:' + query + ' ' + tableName);
    return orderedData;
  }

  /**
   * 处理通讯录搜索列表搜索到的数据
   * @param searchList 通讯录搜索列表
   * @returns 通讯录搜索列表处理后的数据
   */
  async handleSearchList(searchList: ContactSearchConfig[]): Promise<ContactSearchResult> {
    const result: ContactSearchResult = {};
    const promiseList = searchList.map(search => this.getSearchData(search));
    console.time('[optimize]contactAPI-searchContact:' + searchList[0].query);
    const data = await Promise.all(promiseList);
    console.timeEnd('[optimize]contactAPI-searchContact:' + searchList[0].query);
    console.time('[optimize]contactAPI-loopContact:' + searchList[0].query);
    searchList.forEach((search, index) => {
      const list = data[index];
      const { select } = search;
      const tableName = search.aliasTableName || search.tableName;
      const selectList = result[tableName] || new Set();
      list.forEach((item: resultObject) => {
        selectList.add(item[select]);
      });
      result[tableName] = selectList;
    });
    console.timeEnd('[optimize]contactAPI-loopContact:' + searchList[0].query);
    return result;
  }

  /**
   * 搜索联系人
   * @param condition
   * @returns
   */
  getContactBySearch(condition: SearchCondition): Promise<ContactSearchResult> {
    const searchCondition = this.getSearchCondition(condition);
    return this.handleSearchList(searchCondition);
  }

  getSearchFilter(): QueryFilterFunc {
    return (item: resultObject, params?: QueryConfig) => {
      if (!params || !params.additionalData || !params.additionalData.searchFilterList) {
        return false;
      }
      return params.additionalData.searchFilterList.every(({ val: _val, key: _key, type: _type }: SearchFilter) => {
        if (Array.isArray(_key) && (!Array.isArray(_type) || !Array.isArray(_val))) {
          throw new Error('过滤key为list,val,type,必须一一对应');
        }
        let keyList: string[];
        let typeList: SearchFilterType[];
        let valList: Array<BaseType[] | BaseType>;
        if (!Array.isArray(_key)) {
          keyList = [_key];
          typeList = [_type as SearchFilterType];
          valList = [_val as BaseType[] | BaseType];
        } else {
          keyList = _key;
          typeList = _type as SearchFilterType[];
          valList = _val as Array<BaseType[] | BaseType>;
        }
        return keyList.some((curKey, i) => {
          const data = item[curKey] as BaseType;
          const type = typeList[i];
          const val = valList[i];
          if (type === 'match') {
            return Array.isArray(val)
              ? val.some(valItem => new RegExp(util.escapeRegex(valItem.toString()), 'i').test(data as string))
              : new RegExp(util.escapeRegex(val.toString()), 'i').test(data as string);
          }
          const valArr = Array.isArray(val) ? val : [val];
          if (type === 'equal') {
            return valArr.includes(data);
          }
          if (type === 'notEqual') {
            return !valArr.includes(data);
          }
          return false;
        });
      });
    };
  }

  searchTable<T = resultObject>(params: SearchTableParams) {
    const { searchFilterList, _account, tableName, filterLimit, lastId, dbName, noRelateEnterprise = false } = params;
    const isMainAccount = !_account || _account === (this.systemApi.getCurrentUser()?.id || '');

    // 主账号和三方账号走不通的过滤逻辑(三方账号不关注非关联逻辑)
    let filterList: string[] = [];

    if (!isMainAccount) {
      filterList = [contactCommonSearchFilterName];
    } else if (noRelateEnterprise) {
      filterList = [contactCommonSearchFilterName, contactGrepRelateEnterpriseFilterName];
    } else {
      filterList = [contactCommonSearchFilterName, contactGrepInvalidEnterpriseFilterName];
    }

    const rangeCondition: AdQueryConfig = {
      dbName: dbName || this.contactUtil.contactDbName,
      tableName,
      adCondition: {
        type: 'above',
        args: [lastId || 0],
        field: 'id',
      },
      // 如果不筛选关联数据 不能返回无效的关联企业数据
      filter: filterList,
      useDexieFilter: false,
      additionalData: {
        searchFilterList,
      },
      _dbAccount: _account,
      filterLimit,
    };

    // 如果只查询主企业
    if (noRelateEnterprise) {
      rangeCondition.additionalData!.needGrepRelateEnterpriseResult = true;
      rangeCondition.additionalData!.enterpriseFieldName = 'enterpriseId';
    }

    return this.dbApi.getByRangeCondition<T>(rangeCondition);
  }

  /**
   * 转换搜索条件
   * 把所有传入的参数转换成每个表需要查询的数据结构
   * @param condition
   * @return 返回每个表tableName查询条件searchFilterList, 以searchKey分组,
   */
  transMemorySearchCondition(condition: SearchCondition): SearchMemoryTransModel[] {
    const {
      query, // 搜索的东西
      contactType, // 联系人类型
      // 是否过滤禁用联系
      showDisable = true,
      // 搜索的结果是否过滤非IM
      isIM,
      // 搜索的时候需要过滤的表
      exclude,
      showNotDisplayEmail = true,
    } = condition;
    const contactFilterList: SearchFilter[] = [];
    const orgFilterList: SearchFilter[] = [];
    // 联系人类型转换
    if (contactType) {
      // 联系人类型只查询 type
      contactFilterList.push({
        key: 'type',
        val: contactType,
        type: 'equal',
      });
    }
    // 联系人Item是否搜索非主显账号
    if (!showNotDisplayEmail) {
      contactFilterList.push({
        key: ['type', 'isDefault'],
        type: ['notEqual', 'notEqual'],
        val: ['enterprise', 1],
      });
    }

    // 联系人是否搜索禁用账号
    if (!showDisable) {
      // 联系人是否搜索禁用账号
      contactFilterList.push({
        key: 'visibleCode',
        val: 0,
        type: 'equal',
      });
      // 组织是否搜索禁用组织
      orgFilterList.push({
        key: 'visibleCode',
        val: [0, 7],
        type: 'equal',
      });
    }
    // 联系人是否可以云信
    if (isIM) {
      contactFilterList.push({
        key: 'enableIM',
        val: true,
        type: 'equal',
      });
      orgFilterList.push({
        key: 'type',
        val: [2000, 2001, 2002, 2003],
        type: 'notEqual',
      });
    }

    /**
     * 搜索数据库的表集合对应查询条件
     * @tableName 表名
     * @searchFilterList 过滤条件
     * @searchKey 搜索出来的项目以searchKey为key组合
     */
    const searchTableMap: Partial<Record<SearchContactTablesNames, SearchMemoryTransModel>> = {
      contact: {
        tableName: 'contact',
        searchFilterList: contactFilterList,
        searchKey: 'id',
      },
      org: {
        tableName: 'org',
        // 过滤条件
        searchFilterList: orgFilterList,
        // 以那个key区分
        searchKey: 'id',
      },
    };
    /**
     * 1.提前定义需要查询的表的哪些字段
     * 2.把需要查询的字段转换成searchFilterList格式
     */
    const defaultFilterMap: Partial<Record<SearchContactTablesNames, Set<string>>> = {
      contact: new Set(['contactName', 'contactPYName', 'contactPYLabelName', 'accountName']),
      org: new Set(['orgName', 'orgPYName']),
    };
    const searchList: SearchMemoryTransModel[] = [];
    exclude?.forEach(item => {
      Object.values(defaultFilterMap).forEach(defaultFilter => {
        defaultFilter.delete(item);
      });
    });
    const defaultFilterKeysList = Object.keys(defaultFilterMap) as SearchContactTablesNames[];
    defaultFilterKeysList.forEach(item => {
      const filterSet = defaultFilterMap[item];
      const searchItem = searchTableMap[item];
      if (filterSet && filterSet.size > 0 && searchItem) {
        const searchFilterList = searchItem.searchFilterList || [];
        const keys = [...filterSet];
        searchFilterList.push({
          key: keys,
          val: keys.map(() => query),
          type: keys.map(() => 'match'),
        });
        searchItem.searchFilterList = searchFilterList;
        searchList.push(searchItem);
      }
    });
    return searchList;
  }

  /**
   * 转换搜索条件
   * 把所有传入的参数转换成每个表需要查询的数据结构
   * @param condition
   * @return 返回每个表tableName查询条件searchFilterList, 以searchKey分组,
   */
  transSearchCondition(condition: SearchCondition): SearchTransModel[] {
    const {
      query, // 搜索的东西
      contactType, // 联系人类型
      // 是否过滤禁用联系人
      showDisable = true,
      // 搜索的结果是否过滤非IM
      isIM,
      // 搜索的时候需要过滤的表
      exclude,
      // 搜索的结果过滤条件
      filter,
      // 搜索的时候需要过滤的条件
      searchExclude,
      searchInclude,
    } = condition;
    const contactFilterList: SearchFilter[] = [];
    const contactItemFilterList: SearchFilter[] = [];
    const orgFilterList: SearchFilter[] = [];
    // 联系人Item默认不搜索云信数据
    contactItemFilterList.push({
      key: 'contactItemType',
      val: 'yunxin',
      type: 'notEqual',
    });
    // 联系人类型转换
    if (contactType) {
      // 联系人类型只查询 type
      contactFilterList.push({
        key: 'type',
        val: contactType,
        type: 'equal',
      });
      // 联系人Item类型只查询 type
      contactItemFilterList.push({
        key: 'type',
        val: contactType,
        type: 'equal',
      });
    }
    // // 联系人Item是否搜索非主显账号
    // if (!showNotDisplayEmail) {
    //   contactItemFilterList.push({
    //     key: ['contactType', 'contactItemType', 'isDefault'],
    //     type: ['notEqual', 'notEqual', 'notEqual'],
    //     val: ['enterprise', 'EMAIL', 1],
    //   });
    // }
    // 联系人是否可以云信
    if (isIM) {
      contactFilterList.push({
        key: 'enableIM',
        val: true,
        type: 'equal',
      });
    }

    if (!showDisable) {
      // 联系人是否搜索禁用账号
      contactFilterList.push({
        key: 'visibleCode',
        val: 0,
        type: 'equal',
      });
      // 组织是否搜索禁用组织
      orgFilterList.push({
        key: 'visibleCode',
        val: [0, 7],
        type: 'equal',
      });
    }

    /**
     * 搜索数据库的表集合对应查询条件
     * @tableName 表名
     * @searchFilterList 过滤条件
     * @searchKey 搜索出来的项目以searchKey为key组合
     */
    const searchTableMap: Partial<Record<contactTableNames, SearchTransModel>> = {
      contact: {
        tableName: 'contact',
        searchFilterList: contactFilterList,
        searchKey: 'id',
      },
      contactItem: {
        tableName: 'contactItem',
        searchFilterList: contactItemFilterList,
        searchKey: 'contactId',
      },
      org: {
        tableName: 'org',
        // 过滤条件
        searchFilterList: orgFilterList,
        // 以那个key区分
        searchKey: 'id',
      },
    };
    /**
     * 把条件参数filter，searchExclude， searchInclude 转换成 searchFilterList格式
     */
    Object.values(searchTableMap).forEach(item => {
      if (filter) {
        const tableExclude = filter[item.tableName] || [];
        tableExclude.forEach(({ key, val }) => {
          item.searchFilterList.push({
            key,
            val,
            type: 'notEqual',
          });
        });
      }
      if (searchExclude) {
        const tableExclude = searchExclude[item.tableName] || [];
        tableExclude.forEach(({ key, val }) => {
          item.searchFilterList.push({
            key,
            val,
            type: 'notEqual',
          });
        });
      }
      if (searchInclude) {
        const tableInclude = searchInclude[item.tableName] || [];
        tableInclude.forEach(({ key, val }) => {
          item.searchFilterList.push({
            key,
            val,
            type: 'equal',
          });
        });
      }
    });

    /**
     * 1.提前定义需要查询的表的哪些字段
     * 2.把需要查询的字段转换成searchFilterList格式
     */
    const defaultFilterMap: Partial<Record<contactTableNames, Set<string>>> = {
      contact: new Set(['contactName', 'contactPYName', 'contactPYLabelName']),
      contactItem: new Set(['contactItemVal']),
      org: new Set(['orgName', 'orgPYName']),
    };
    const searchList: SearchTransModel[] = [];
    exclude?.forEach(item => {
      Object.values(defaultFilterMap).forEach(defaultFilter => {
        defaultFilter.delete(item);
      });
    });
    const defaultFilterKeysList = Object.keys(defaultFilterMap) as contactTableNames[];
    defaultFilterKeysList.forEach(item => {
      const filterSet = defaultFilterMap[item];
      const searchItem = searchTableMap[item];
      if (filterSet && filterSet.size > 0 && searchItem) {
        const searchFilterList = searchItem.searchFilterList || [];
        const keys = [...filterSet];
        searchFilterList.push({
          key: keys,
          val: keys.map(() => query),
          type: keys.map(() => 'match'),
        });
        searchItem.searchFilterList = searchFilterList;
        searchList.push(searchItem);
      }
    });
    return searchList;
  }

  async getContactBySearch2(params: SearchCondition): Promise<ContactSearchResult2> {
    // 查询所有表的数据结构
    const tableCondition = this.transSearchCondition(params);
    const { _account, maxItem = this.contactUtil.searchTableLimit, lastId, noRelateEnterprise = false } = params;
    // 批量查询数据库数据并过滤查询条件返回值都处理成相同类型的返回值 ContactSearchResult2
    const promiseList: Array<Promise<ContactSearchResult2>> = tableCondition.map(condition => {
      const { tableName, searchFilterList, searchKey, returnList } = condition;
      return this.searchTable<resultObject>({
        searchFilterList,
        tableName,
        _account,
        filterLimit: maxItem,
        lastId,
        noRelateEnterprise,
      }).then(async list => {
        const idSet = new Set<string>();
        const idMap: Record<string, unknown> = {};
        list.forEach(item => {
          idSet.add(item[searchKey]);
          if (returnList) {
            const arr: any = idMap[item[searchKey]] || [];
            arr.push(item);
            idMap[item[searchKey]] = arr;
          } else {
            idMap[item[searchKey]] = item;
          }
        });
        return {
          [tableName]: {
            idSet,
            idMap,
          },
        };
      });
    });
    const data = await Promise.all(promiseList);
    let res: ContactSearchResult2 = {};
    data.forEach(item => {
      res = { ...res, ...item };
    });
    return res;
  }

  getFlatStrOrArrInfo(arr: string[], type?: string, rs?: resultObject): any[] {
    const newArr: any[] = [];
    arr.forEach((val: string) => {
      const res = rs ? { ...rs } : {};
      if (type) {
        res.contactItemType = type;
        res.isDefault = 1;
      }
      try {
        if (val.startsWith('[') && val.endsWith(']')) {
          const arr = JSON.parse(val) as [];
          arr.forEach(a => {
            if (type) {
              res.contactItemVal = a;
              newArr.push(res);
            } else {
              newArr.push(a);
            }
          });
        } else if (type) {
          res.contactItemVal = val;
          newArr.push(res);
        } else {
          newArr.push(val);
        }
      } catch (e) {
        console.error('[contact] getFlatStrOrArrInfo', e);
        newArr.push(val);
      }
    });
    return newArr;
  }

  getTeamListById(list: string[]) {
    const idList = list.map(item => (item.includes('team_') ? item : 'team_' + item));
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    return this.getOrgList({ idList, _account: mainAccount });
  }

  transTeamToOrg(list: ContactTeam[]): EntityTeamOrg[] {
    const orgList: EntityTeamOrg[] = [];
    list.forEach(item => {
      const { teamId, serverCustom, avatar, intro, name, announcement, owner, memberNum, memberUpdateTime, createTime, updateTime } = item;
      const type = 2000;
      const id = 'team_' + teamId;
      const parent = 'team';
      const originId = 'team_' + teamId;
      const orgRank = createTime;
      let orgName = name || '';
      const visibleCode = 0;
      if (!orgName || orgName.includes('LINGXI_IM_TEAM_DEFAULT_NAME')) {
        try {
          const customObj = JSON.parse(serverCustom);
          orgName = customObj.auto_team_name || orgName;
        } catch (e) {
          console.error('[contact] transTeamToOrg SON.parse serverCustom', e);
        }
      }
      const orgPYName = util.toPinyin(orgName);
      orgList.push({
        id,
        parent,
        orgName,
        orgPYName,
        orgRank,
        type,
        visibleCode,
        originId,
        avatar,
        intro,
        announcement,
        owner,
        memberNum,
        memberUpdateTime,
        createTime,
        updateTime,
        _lastUpdateTime: updateTime,
      });
    });
    return orgList;
  }

  transServerTeamMemberList(item: resultObject): ContactTeamMember[] {
    const { tid: teamId, owner, admins, members } = item;
    let teamMember: resultObject[] = [];
    teamMember = members.concat([
      { ...owner, type: 'owner' },
      ...admins.map((adminMember: resultObject) => ({
        ...adminMember,
        type: 'manage',
      })),
    ]);
    return teamMember.map((memberItem: resultObject) => {
      const { type, nick: nickInTeam, createtime: joinTime, accid: account } = memberItem;
      return {
        type: type || 'normal',
        nickInTeam,
        joinTime,
        teamId,
        account,
      };
    });
  }

  transServerTeamList(list: resultObject[]): ServerTeamRes {
    const teamMemberMap: TeamMemberMap = {};
    const teamList = list.map(item => {
      const {
        icon: avatar,
        intro,
        announcement,
        owner,
        member_update_time: memberUpdateTime,
        createtime: createTime,
        updatetime: updateTime,
        custom: serverCustom,
        tname: name,
        tid: teamId,
      } = item;
      const ownerId = owner.accid;
      const memberList = this.transServerTeamMemberList(item);
      teamMemberMap[teamId] = memberList;
      return {
        serverCustom,
        name,
        teamId,
        avatar,
        intro,
        announcement,
        owner: ownerId,
        memberNum: memberList.length,
        memberUpdateTime,
        createTime,
        updateTime,
      };
    }) as ContactTeam[];
    return {
      teamList,
      teamMemberMap,
    };
  }

  async getTeamServerData(): Promise<ServerTeamRes> {
    let teams: resultObject[] = [];
    try {
      const { data } = await this.httpApi.get(this.systemApi.getUrl('getTeamList'));
      if (data?.success && data?.data?.teams) {
        teams = data.data.teams;
      }
    } catch (e) {
      console.error('[contact] getTeamServerData error', e);
    }
    return this.transServerTeamList(teams);
  }

  async getNeedUpdateTeamOrgList(params: SyncTeamListParams): Promise<NeedUpdateTeamOrgList> {
    const { teamList = [], force } = params;
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    let list;
    let teamMemberMap: TeamMemberMap = {};
    if (force) {
      const data = await this.getTeamServerData();
      list = data.teamList;
      teamMemberMap = data.teamMemberMap;
    } else {
      list = teamList;
    }
    if (!list.length) {
      return {
        needDeleteTeamList: [],
        needUpdateTeamList: [],
        needUpdateMemberTeamIdList: [],
        needUpdateTeamMemberList: [],
      };
    }
    const orgList = this.transTeamToOrg(list);
    const newIdList = util.getKeyListByList(orgList, 'id');
    let oldTeamList;
    if (force) {
      oldTeamList = await this.getTeamOrgList();
    } else {
      oldTeamList = await this.getOrgList({ idList: newIdList, _account: mainAccount });
    }
    const oldTeamMap = util.listToMap(oldTeamList, 'id');
    const needUpdateTeamList: EntityTeamOrg[] = [];
    const needUpdateMemberTeamIdList: string[] = [];
    let needUpdateTeamMemberList: ContactTeamMember[] = [];
    const oldIdList = util.getKeyListByList(oldTeamList, 'id');
    const diff = util.getDiff<string>(oldIdList, newIdList);
    const needDeleteTeamList = diff.deleteDiff ? diff.deleteDiff : [];
    orgList.forEach(item => {
      const oldItem = oldTeamMap[item.id] as EntityTeamOrg | undefined;
      const teamId = item.id.split('team_')[1];
      if (!force && oldItem) {
        if (item.updateTime > oldItem.updateTime) {
          needUpdateTeamList.push(item);
        }
        if (item.memberUpdateTime > oldItem.memberUpdateTime) {
          needUpdateMemberTeamIdList.push(teamId);
          needUpdateTeamMemberList = needUpdateTeamMemberList.concat(teamMemberMap[teamId] || []);
        }
      } else {
        needUpdateTeamList.push(item);
        needUpdateMemberTeamIdList.push(teamId);
        needUpdateTeamMemberList = needUpdateTeamMemberList.concat(teamMemberMap[teamId] || []);
      }
    });
    return {
      needDeleteTeamList,
      needUpdateTeamList,
      needUpdateMemberTeamIdList,
      needUpdateTeamMemberList,
    };
  }

  async syncTeamList(params: SyncTeamListParams = {}) {
    if (this.isSyncTeamList && params.force) {
      console.warn('[contact] syncAll force syncTeamList more times');
      return;
    }
    params.force && (this.isSyncTeamList = true);

    const mainAccount = this.systemApi.getCurrentUser()?.id || '';

    console.log('[contact] syncTeamList', params);
    try {
      const res = await this.getNeedUpdateTeamOrgList(params);
      if (res.needUpdateMemberTeamIdList.length) {
        const memberList = res.needUpdateTeamMemberList;
        const memberListRes = await this.teamMemberIntoTable(res.needUpdateMemberTeamIdList, memberList);
        memberListRes && console.log('[contact] updateMemberTeamIdList success teamIdList');
      }
      if (res.needDeleteTeamList.length) {
        const deleteTeamListRes = await this.deleteData({
          tableName: this.contactUtil.orgTable,
          list: res.needDeleteTeamList,
          _account: mainAccount,
        });
        console.log('[contact] delete team list', deleteTeamListRes);
      }
      if (res.needUpdateTeamList.length) {
        const teamListRes = await this.teamIntoOrg(res.needUpdateTeamList);
        console.log('[contact] teamListIntoOrg', teamListRes);
      }
    } catch (e) {
      console.error('[contact] getNeedUpdateTeamOrgList error', e, params);
    }
    if (params.force) {
      this.isSyncTeamList = false;
      this.sendContactNotify({ syncStatus: { team: true }, _account: mainAccount });
    }
  }

  async transTeamMemberToOrgContact(list: ContactTeamMember[]): Promise<EntityOrgTeamContact[]> {
    const yunxinIdList = new Set<string>();
    const _lastUpdateTime = Date.now();
    list.forEach(item => {
      yunxinIdList.add(item.account);
    });
    const contactItemList = await this.getContactItemListByItem([...yunxinIdList]);
    // 去除个人通讯录中有云信账号
    const yunxinIdMap: Record<string, string> = {};
    contactItemList.forEach(item => {
      const yunxin = item.contactItemVal;
      if (item.type !== 'personal') {
        yunxinIdMap[yunxin] = item.contactId;
        yunxinIdList.delete(yunxin);
      }
    });
    if (yunxinIdList.size) {
      try {
        const { data } = await this.httpApi.post(this.systemApi.getUrl('getContactByYunxin'), { yunxinAccIdList: [...yunxinIdList] });
        const itemList = data?.data?.itemList;
        itemList?.forEach((element: resultObject) => {
          yunxinIdMap[element.yunxinAccountId] = element.qiyeAccountId;
        });
        console.log('[contact_dbl] syncTeam getContactByYunxin yunxinIdMap', yunxinIdMap);
      } catch (e) {
        console.error('[contact_dbl] syncTeam getContactByYunxin error', e);
      }
    }
    return list.map(item => {
      const { type, nickInTeam, joinTime, teamId, account: yunxinId } = item;
      const contactId = yunxinIdMap[yunxinId] || '';
      const orgId = 'team_' + teamId;
      const id = util.getUnique(orgId, yunxinId, contactId);
      const imId = orgId + '_' + yunxinId;
      return {
        id,
        imId,
        contactId,
        orgId,
        yunxinId,
        type, // 群成员类型
        nickInTeam, // 在群里面的昵称
        joinTime, // 入群时间
        _lastUpdateTime,
      };
    });
  }

  getTeamOrgList() {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    return this.getOrgList({ typeList: [2000], _account: mainAccount });
  }

  /**
   * 通过群id 获取群成员
   * @param idList
   * @private
   */
  async getTeamMemberById(idList: string[]): Promise<ContactTeamMember[]> {
    console.log('[contact] [team] getTeamMemberById start', idList);
    if (!idList.length) return [];
    let memberList: ContactTeamMember[] = [];
    try {
      const ids = idList.join(',');
      const { data } = await this.httpApi.get(this.systemApi.getUrl('getTeamMembers'), { tid_list: ids });
      console.log('[contact] [team] getTeamMemberById end', data);
      if (data?.success && data?.data?.length) {
        data?.data?.forEach((item: resultObject) => {
          memberList = memberList.concat(this.transServerTeamMemberList(item));
        });
      }
    } catch (e) {
      console.error('[contact] getTeamMemberById error', e);
    }
    return memberList;
  }

  /**
   *
   * @param teamId
   * @param accounts
   */
  async getTeamMemberByTeamIdAndAccount(teamId: string, accounts: string[]): Promise<ContactTeamMember[]> {
    const memberList = await this.getTeamMemberById([teamId]);
    return memberList.filter(item => item.teamId === teamId && accounts.includes(item.account));
  }

  teamIntoOrg(list: EntityTeamOrg[]) {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    return this.intoTable({
      tableName: this.contactUtil.orgTable,
      list,
      _account: mainAccount,
    });
  }

  async teamMemberIntoTable(teamIdList: string[], list: ContactTeamMember[]): Promise<boolean> {
    const teamOrgIdList = teamIdList.map(item => 'team_' + item);
    const teamMemberList = await this.transTeamMemberToOrgContact(list);
    const oldTeamMemberList = (await this.getOrgContactListByOrgId(teamOrgIdList, this.contactUtil.getCurrentAccount())) as EntityOrgTeamContact[];
    const teamMemberIdList = util.getKeyListByList(teamMemberList, 'id');
    const oldTeamMemberIdList = util.getKeyListByList(oldTeamMemberList, 'id');
    const diffRes = util.getDiff(oldTeamMemberIdList, teamMemberIdList);
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const { success, error } = await util.SyncCatchError(() => {
      const arr: Array<Promise<any>> = [
        this.intoTable({
          tableName: this.contactUtil.orgContactTable,
          list: teamMemberList,
          _account: mainAccount,
        }),
      ];
      if (diffRes.deleteDiff) {
        arr.push(
          this.deleteData({
            tableName: this.contactUtil.orgContactTable,
            list: diffRes.deleteDiff,
            _account: mainAccount,
          })
        );
      }
      return Promise.all(arr);
    });
    if (!success && error) {
      console.error('[contact] teamMemberIntoTable', error, teamIdList, list);
    }
    return success;
  }

  /**
   * 获取到的个人分组列表中的数据加入org表（相同的数据update 通过主键id）
   * @param list: 个人分组列表
   * */
  personalOrgIntoOrg(list: resultObject[], _lastUpdateTime = Date.now()): EntityPersonalOrg[] {
    const now = Date.now();
    return list.map(item => {
      const { groupId: id, groupName: name, updateTime = now, marked } = item;
      return {
        id: this.transOrgIdByPersonalOrg(id),
        orgName: name,
        orgPYName: util.toPinyin(name),
        originId: id,
        type: 2001,
        visibleCode: 0,
        parent: 'personal_org',
        orgRank: 1,
        updateTime,
        marked,
        _lastUpdateTime,
      };
    });
  }

  async intoTable(
    options: ContactAccountsOption<{ tableName: string; list: resultObject[] }>,
    config: {
      asSoon?: boolean;
      supportCache?: 'enable' | 'disable';
    } = { asSoon: false }
  ) {
    const { tableName, list, _account } = options;
    const { asSoon = false, supportCache = 'enable' } = config;

    // 如果是写入到DB中去 要判断是否可以执行写入
    if ((!Array.isArray(list) || !list.length || !this.enablePutContact) && !asSoon) {
      return [];
    }
    console.time(`[contact_dbl]intoTable${tableName}.${list.length}`);
    const res = await this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName,
        _dbAccount: _account,
        asSoon,
      },
      list,
      {
        supportCache,
      }
    );

    console.timeEnd(`[contact_dbl]intoTable${tableName}.${list.length}`);
    return res;
  }

  async getDiffRes(params: DeleteListParams): Promise<diffRes> {
    const { list, tableName, type } = params;
    const key = this.tablePrimaryKeyMap[tableName];
    const newList = util.getKeyListByList(list, key);
    const tableList = await this.getTableList(tableName, newList, type);
    const oldList = tableList && tableList.length ? util.getKeyListByList(tableList, key) : [];
    return util.getDiff(oldList, newList);
  }

  /**
   * @deprecated:目前来看无人调用
   * @param params
   * @returns
   */
  async delListByKey(params: ContactAccountsOption<DeleteListParams>): Promise<syncRes> {
    const { tableName, type } = params;
    const diffRes = await this.getDiffRes(params);
    const k = tableName + (type ? '_' + type : '');
    const res = {
      [k as tableType]: diffRes,
    };
    if (diffRes.deleteDiff) {
      try {
        await this.deleteData({
          tableName,
          list: diffRes.deleteDiff,
          _account: params._account,
        });
      } catch (message) {
        console.error('[contact] delListByKey error', message, params);
      }
    }
    return res;
  }

  /**
   * @deprecated:无人调用 1.27版本之后去掉
   * 找到contact表中的type=personal的数据，与新数据做diff,删除多余数据
   * @param list
   */
  async deletePersonalContactList(params: ContactAccountsOption<{ list: EntityContact[] }>): Promise<syncRes> {
    const { list, _account } = params;
    const tableType = 'contact_personal';
    const res: syncRes = {
      [tableType]: {},
    };
    try {
      const idList = util.getKeyListByList<string>(list, 'id');
      const contactList = await this.getContactList({
        contactType: 'personal',
      });
      const oldIdList = util.getKeyListByList(contactList, 'id');
      const diffRes = util.getDiff(oldIdList, idList);
      diffRes.deleteDiff?.length &&
        (await this.deleteData({
          tableName: this.contactUtil.contactTable,
          list: diffRes.deleteDiff,
          _account,
        }));
      res[tableType] = diffRes;
    } catch (e) {
      console.error('[contact] deletePersonalContactList error', e, list);
    }
    return res;
  }

  /**
   * @deprecated:无人调用 1.27版本之后去掉
   * 通过新加入的contactItem中的contactId找到原来contactItem表中的contactId相关数据删除，或者通过type查找旧数据
   * @param list 新加入的contactItem列表
   * @param type 加入contactItem的类型
   */
  async deleteContactItemList(
    params: ContactAccountsOption<{
      list: EntityContactItem[];
      type?: 'enterprise' | 'personal';
    }>
  ): Promise<syncRes> {
    const { list, type = 'enterprise', _account } = params;
    const tableType = 'contactItem_' + type;
    const res = {
      [tableType]: {},
    };
    try {
      const contactIdList = util.getKeyListByList<string>(list, 'contactId', true);
      const idList = util.getKeyListByList<string>(list, 'id');
      let contactItemList;
      if (type === 'enterprise') {
        contactItemList = await this.getContactItemListByContactId({
          idList: contactIdList,
        });
      } else {
        contactItemList = await this.getContactItemListByType(type);
      }
      const oldIdList = util.getKeyListByList<string>(contactItemList, 'id');
      const diffRes = util.getDiff<string>(oldIdList, idList);
      diffRes.deleteDiff?.length &&
        (await this.deleteData({
          tableName: this.contactUtil.contactItemTable,
          list: diffRes.deleteDiff,
          _account,
        }));
      res[tableType] = diffRes;
    } catch (e) {
      console.error('[contact] deleteContactItemList error', e, list, type);
    }
    return res;
  }

  /**
   * @deprecated:无人调用1.27版本之后删除
   * 通过加入的orgContact列表找到表中原来数据，作出diff删除
   * @param list
   */
  async deleteOrgContactList(params: ContactAccountsOption<{ list: EntityOrgContact[] }>): Promise<syncRes> {
    const { list, _account } = params;
    const contactIdList = util.getKeyListByList(list, 'contactId', true);
    const orgContactList = await this.getOrgContactList({
      idList: contactIdList,
      type: 'contactId',
      filterTeamOrg: true,
    });
    const orgContactIdList = util.getKeyListByList(orgContactList, 'id');
    await this.deleteData({
      tableName: this.contactUtil.orgContactTable,
      list: orgContactIdList,
      _account,
    });
    return {
      orgContact_enterprise: {
        deleteDiff: orgContactIdList,
      },
    };
  }

  async _getOrgContactList(list: EntityOrgContact[]): Promise<(OrgContactModel | OrgContactModel[])[]> {
    const contactIdList = util.getKeyListByList(list, 'contactId', true);
    const orgContactList = await this.getOrgContactList({
      idList: contactIdList,
      type: 'contactId',
      filterTeamOrg: true,
    });
    return orgContactList;
  }

  /**
   * @deprecated:无人调用1.27版本之后删除
   * 删除diff的个人分组的联系人关联数据
   */
  async deletePersonalOrgContactList(params: ContactAccountsOption<{ list: EntityPersonalOrgContact[] }>): Promise<syncRes> {
    const { list, _account } = params;
    const idList = util.getKeyListByList<string>(list, 'id');
    const orgContactList = await this.getOrgContactList({
      includeType: 'personal_org_',
      type: 'orgId',
    });
    const oldIdList = util.getKeyListByList(orgContactList, 'id');
    const diff = util.getDiff(oldIdList, idList);
    const { deleteDiff, updateDiff, insertDiff } = diff;
    if (deleteDiff.length) {
      await this.deleteData({
        tableName: this.contactUtil.contactTable,
        list: deleteDiff,
        _account,
      });
    }
    return {
      orgContact_personal: {
        deleteDiff,
        insertDiff,
        updateDiff,
      },
      syncStatus: {
        personalOrg: true,
      },
    };
  }

  /**
   * @deprecated:无人调用1.27版本之后删除
   * @param contactList
   * @param contactItemList
   * @returns
   */
  async deleteDiffPersonalData(params: ContactAccountsOption<{ contactList: resultObject[]; contactItemList: resultObject[] }>): Promise<syncRes[]> {
    const { contactList, contactItemList, _account } = params;
    const newContactIdList = util.getKeyListByList(contactList, 'id');
    const newContactItemIdList = util.getKeyListByList(contactItemList, 'id');
    const oldContactList = await this.getContactList({
      contactType: 'personal',
    });
    const oldContactIdList = util.getKeyListByList(oldContactList, 'id');
    const oldContactItemList = await this.getContactItemListByContactId({
      idList: oldContactIdList,
    });
    const oldContactItemIdList = util.getKeyListByList(oldContactItemList, 'id');
    const diffContactIdList = util.getDiff(oldContactIdList, newContactIdList);
    const diffContactItemIdList = util.getDiff(oldContactItemIdList, newContactItemIdList);
    await Promise.all([
      this.deleteData({
        tableName: this.contactUtil.contactTable,
        list: diffContactIdList.deleteDiff!,
        _account,
      }),
      this.deleteData({
        tableName: this.contactUtil.contactItemTable,
        list: diffContactItemIdList.deleteDiff!,
        _account,
      }),
    ]);
    return [{ contact_personal: diffContactIdList }, { contactItem_personal: diffContactItemIdList }];
  }

  /**
   * 删除通讯录中的无效数据(不可见数据 离职数据等场景)
   * @param contactIds
   * @returns
   */
  private cleanInvalidEnterpriseRawData(options: ContactAccountsOption<{ contactIds: string[] }>) {
    const { contactIds, _account } = options;
    // 查询id
    const queryIds = async (ids: string[]) => {
      const [contactItemList, orgContactList] = (await Promise.all(
        [this.contactUtil.contactItemTable, this.contactUtil.orgContactTable].map(tableName =>
          this.dbApi.getByRangeCondition({
            dbName: this.contactUtil.contactDbName,
            tableName,
            adCondition: {
              type: 'anyOf',
              field: 'contactId',
              args: ids,
            },
            _dbAccount: _account,
          })
        )
      )) as [EntityContactItem[], EntityOrgContact[]];

      return [contactItemList.map(item => item.id), orgContactList.map(item => item.id)];
    };

    // 删除数据
    const deleteRawByIds = async (tableName: string, ids: string[]) => {
      if (!Array.isArray(ids) || !ids.length) {
        return;
      }
      await this.dbApi.deleteById(
        {
          dbName: this.contactUtil.contactDbName,
          tableName,
          _dbAccount: _account,
        },
        ids
      );
    };

    // 先查询对应表的id 然后执行删除
    return lodashChunk(contactIds, 1000).reduce(async (total, current, index) => {
      total = total
        .then(async () => {
          if (index > 0) {
            await wait(100);
          }
          return queryIds(current);
        })
        .then(async ([chunkContactItemIds, chunkOrgContactIds]) => {
          await Promise.all([
            deleteRawByIds(this.contactUtil.contactTable, current),
            deleteRawByIds(this.contactUtil.contactItemTable, chunkContactItemIds),
            deleteRawByIds(this.contactUtil.orgContactTable, chunkOrgContactIds),
          ]);
        })
        .catch(ex => {
          console.error('[conactDB]cleanInvalidEnterpriseData.error', ex);
        });
      return total;
    }, Promise.resolve());
  }

  /**
   * @description:删除通讯录增量更新中的过期数据
   * @note: 过期数据指的是增量变更前的数据 例如email/mobile
   * @param contactIds
   * @returns
   */
  private cleanExpiredEntityRawdata(options: ContactAccountsOption<{ list: EntityContact[]; lastUpdateTime: number }>) {
    const { list: contactModelList, lastUpdateTime, _account } = options;
    const timestamp = lastUpdateTime - 10;

    // 查询重复老数据(orgContact & contactItem)
    const queryExpiredList = async (ids: string[], timestamp: number) => {
      const [contactItemList, orgContactList] = await Promise.all([
        this.dbApi.getByRangeCondition({
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.contactItemTable,
          adCondition: {
            type: 'anyOf',
            field: 'contactId',
            args: ids,
          },
          _dbAccount: _account,
        }) as Promise<EntityContactItem[]>,
        this.dbApi.getByRangeCondition({
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.orgContactTable,
          adCondition: {
            type: 'anyOf',
            field: 'contactId',
            args: ids,
          },
          _dbAccount: _account,
        }) as Promise<EntityOrgContact[]>,
      ]);

      const expiredOrgContactIds: string[] = [];
      const expiredContactItemIds: string[] = [];

      contactItemList.forEach(item => {
        if (item._lastUpdateTime >= timestamp) {
          return;
        }
        expiredContactItemIds.push(item.id);
      });

      orgContactList.forEach(item => {
        if (item._lastUpdateTime >= timestamp) {
          return;
        }
        expiredOrgContactIds.push(item.id);
      });

      return { expiredContactItemIds, expiredOrgContactIds };
    };

    // 删除过期老数据
    const deleteExpiredList = async (idsMap: { expiredContactItemIds: string[]; expiredOrgContactIds: string[] }) => {
      const { expiredContactItemIds, expiredOrgContactIds } = idsMap;

      await Promise.all([
        expiredContactItemIds && expiredContactItemIds.length
          ? this.dbApi.deleteById(
              {
                dbName: this.contactUtil.contactDbName,
                tableName: this.contactUtil.contactItemTable,
                _dbAccount: _account,
              },
              expiredContactItemIds
            )
          : Promise.resolve(),

        expiredOrgContactIds && expiredOrgContactIds.length
          ? this.dbApi.deleteById(
              {
                dbName: this.contactUtil.contactDbName,
                tableName: this.contactUtil.orgContactTable,
                _dbAccount: _account,
              },
              expiredOrgContactIds
            )
          : Promise.resolve(),
      ]);
    };

    // 先查询无效数据(更新时间<lastUpdateTime) 然后执行删除
    return lodashChunk(contactModelList, 1000).reduce((total, current, index) => {
      total = total
        .then(async () => {
          if (index) {
            await wait(100);
          }
          return queryExpiredList(
            current.map(item => item.id),
            timestamp
          );
        })
        .then(deleteExpiredList)
        .catch(ex => {
          console.error('[conactDB]cleanExpiredEntityRawdata.error', ex);
        });

      return total;
    }, Promise.resolve());
  }

  /**
   * 获取到的企业通讯录列表加入数据库
   * @param list: 企业通讯录列表
   * */
  async enterpriseAllInto(options: ContactAccountsOption<{ list: resultObject[]; force?: boolean }>): Promise<syncRes[]> {
    const { list: _list, force = false, isMainAccount, _account } = options;
    const list = util.singleToList(_list);
    const _lastUpdateTime = Date.now();

    // 如果增量更新下有新数据 需要重新计算部门人数信息
    if (!force && list && list.length) {
      this.needComputeMemberNum.set(_account, true);
    }

    const {
      contactItem: enterpriseInfoList,
      contact: enterpriseList,
      orgContact: orgContactList,
      needDeleteContactIds = [],
      // contactSearchList = []
    } = this.contactTrans.transferEnterprise2MutileTableData(list, _lastUpdateTime, {
      force: window.isAccountBg ? false : force,
    });

    const intoCountMap: Map<string, number> = new Map();

    try {
      const promiseRequest = [
        this.intoTable(
          {
            tableName: this.contactUtil.contactTable,
            list: enterpriseList,
            isMainAccount,
            _account,
          },
          {
            supportCache: force ? 'disable' : 'enable',
          }
        ),
        this.intoTable({
          tableName: this.contactUtil.contactItemTable,
          list: enterpriseInfoList,
          isMainAccount,
          _account,
        }),
        // 继续走全量更新
        this.intoTable({
          tableName: this.contactUtil.orgContactTable,
          list: orgContactList,
          isMainAccount,
          _account,
        }),
      ];
      const intoResultList = await Promise.all(promiseRequest);

      intoResultList.forEach((list, index) => {
        if (index === 0 && enterpriseList.length > list.length) {
          intoCountMap.set(this.contactUtil.contactTable, enterpriseList.length - list.length);
        } else if (index === 1 && enterpriseInfoList.length > list.length) {
          intoCountMap.set(this.contactUtil.contactItemTable, enterpriseInfoList.length - list.length);
        } else if (index === 2 && orgContactList.length - list.length) {
          intoCountMap.set(this.contactUtil.orgContactTable, orgContactList.length - list.length);
        }
      });
    } catch (e) {
      console.error('[contact]enterpriseAllInto.error(code:2)', list, e);
      throw e;
    }

    // 非强制同步场景下 需要删除服务返回的不可见数据
    if (!force && Array.isArray(needDeleteContactIds) && needDeleteContactIds.length) {
      await this.cleanInvalidEnterpriseRawData({
        contactIds: needDeleteContactIds,
        isMainAccount,
        _account,
      });
    }
    // 非强制同步场景下 删除 orgContact & contactItem中的无效数据
    if (!force && Array.isArray(enterpriseList) && enterpriseList.length) {
      await this.cleanExpiredEntityRawdata({
        list: enterpriseList,
        lastUpdateTime: _lastUpdateTime,
        isMainAccount,
        _account,
      });
    }

    // 如果有写入失败的数据 执行上报
    if (intoCountMap.size) {
      this.dataTracker.track('pc_db_put_lost', {
        ...Object.fromEntries(intoCountMap),
        _account: options._account,
        enableTrackInBg: true,
        dbname: 'contact',
      });
    }

    return Promise.resolve([
      {
        contact_enterprise: {
          updateDiff: force ? [] : enterpriseList.map(item => item.id),
          deleteDiff: [],
        },
        insertCountMap: Object.fromEntries(intoCountMap),
        _account,
      },
    ]);
  }

  async deleteTrashContactByManual() {
    const md5 = this.systemApi.getCurrentUser()?.accountMd5 || '';
    try {
      this.dbApi.deleteDB(this.contactUtil.contactDbName + '_' + md5);
    } catch (ex) {
      console.error('[contactDB]deleteTrashContactByManual.failed', ex);
    }

    return true;
  }

  // 清理无效的个人分组数据
  async clearnInvalidPersonalOrg(params: ContactAccountsOption<{ lastUpdateTime: number }>) {
    const { lastUpdateTime, _account } = params;
    const timestamp = lastUpdateTime - 10;

    const localOrgList = (await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgTable,
      query: {
        type: 2001,
      },
      _dbAccount: _account,
    })) as EntityOrg[];

    const ids: string[] = [];

    // 筛选出<lastUpdatetime的contactId
    localOrgList.forEach(item => {
      if (item._lastUpdateTime <= timestamp) {
        ids.push(item.id);
      }
    });

    if (!ids || !ids.length) {
      return [];
    }

    // 删除个人分组数据
    const orgDeleteRequest = this.dbApi.deleteById(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.orgTable,
        _dbAccount: _account,
      },
      ids
    );

    // 删除个人分组星标
    const personalMarkDeleteRequest = this.dbApi.deleteByByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      adCondition: {
        type: 'anyOf',
        field: 'id',
        args: ids,
      },
      _dbAccount: _account,
    });

    await Promise.all([orgDeleteRequest, personalMarkDeleteRequest]);
    return ids;
  }

  async cleanInvalidPersonalContact(params: ContactAccountsOption<{ lastUpdateTime: number }>) {
    const { lastUpdateTime, _account } = params;
    const timestamp = lastUpdateTime - 10;

    const localContactList = (await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactTable,
      query: {
        type: 'personal',
      },
      _dbAccount: _account,
    })) as EntityContact[];

    const ids: string[] = [];

    // 筛选出<lastUpdatetime的contactId
    localContactList.forEach(item => {
      if (item._lastUpdateTime <= timestamp) {
        ids.push(item.id);
      }
    });

    if (!ids || !ids.length) {
      return;
    }

    const contactDeleteRequest = this.dbApi.deleteById(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactTable,
        _dbAccount: _account,
      },
      ids
    );

    const contactItemDeleteRequest = this.dbApi.deleteByByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactItemTable,
      adCondition: {
        type: 'anyOf',
        field: 'contactId',
        args: ids,
      },
      _dbAccount: _account,
    });

    const orgContactDeleteRequest = this.dbApi.deleteByByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactItemTable,
      adCondition: {
        type: 'anyOf',
        field: 'contactId',
        args: ids,
      },
      _dbAccount: _account,
    });

    const personalMarkDeleteRequest = this.dbApi.deleteByByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      adCondition: {
        type: 'anyOf',
        field: 'id',
        args: ids,
      },
      _dbAccount: _account,
    });

    await Promise.all([contactDeleteRequest, contactItemDeleteRequest, orgContactDeleteRequest, personalMarkDeleteRequest]);
  }

  /**
   * 同步后的个人通讯录与本地数据diff，处理diff数据
   * @param list: 个人通讯录列表
   * */
  async personalAllInto(options: ContactAccountsOption<{ list: resultObject[]; force?: boolean }>): Promise<syncRes[]> {
    const { list: _list, force = false, isMainAccount, _account } = options;
    const lastUpdateTime = Date.now();
    const list = util.singleToList(_list);

    const {
      contact: personalList,
      contactItem: personalInfoList,
      orgContact: personalOrgContactList,
      // personalIds: personalIdList,
      markedList,
    } = this.contactTrans.transPersonalContact2MutipleData(list, lastUpdateTime);

    console.time('[contact] personalAllInto intoTable');

    // 插入个人通讯录数据
    try {
      if (Array.isArray(personalList) && personalList.length) {
        await Promise.all([
          this.intoTable(
            {
              tableName: this.contactUtil.contactTable,
              list: personalList,
              isMainAccount,
              _account,
            },
            {
              supportCache: 'enable',
            }
          ),
          this.intoTable({ tableName: this.contactUtil.contactItemTable, list: personalInfoList, isMainAccount, _account }),
          this.intoTable({
            tableName: this.contactUtil.orgContactTable,
            list: personalOrgContactList,
            isMainAccount,
            _account,
          }),
          // 全量更新星标
          this.doInsertPersonalMark(
            {
              list: markedList,
              isMainAccount,
              _account,
            },
            { type: 1, isIncrease: false, _lastUpdateTime: lastUpdateTime }
          ),
        ]);
      }
    } catch (ex) {
      console.error('[contactDB].personalAllInto.error(1):', ex);
    }

    try {
      // 如果是全量更新OR 返回数据不为空则执行删除老数据逻辑
      // 增量同步场景下 如果数据=[] 不执行删除逻辑
      if (force || (personalList && personalList.length)) {
        await this.cleanInvalidPersonalContact({
          lastUpdateTime,
          _account,
        });
      }
    } catch (ex) {
      console.error('[contactDB].personalAllInto.error(2):', ex);
    }

    return Promise.resolve([
      {
        contact: {
          deleteDiff: [],
          updateDiff: [],
        },
        _account,
      },
    ]);
  }

  /**
   * 获取到的个人通讯录列表加入数据库
   * @param params: 个人通讯录列表
   * @param _account
   * */
  personalInto(params: resultObject[], _account?: string): Promise<CatchErrorRes> {
    const list = util.singleToList(params);
    const _lastUpdateTime = Date.now();
    const personalList = this.contactTrans.transPersonalListToContact(list, _lastUpdateTime);
    const personalInfoList = this.contactTrans.transPersonalListToContactInfo(list, _lastUpdateTime);
    const personalOrgContactList = this.contactTrans.transPersonalListToOrgContact(list, _lastUpdateTime);
    return util.SyncCatchError(async () => {
      const contactIdList = personalList.map(item => item?.id);
      const [oldContactItemList, oldOrgContactList] = await Promise.all([
        this.getContactItemListByContactId({
          idList: contactIdList,
          _account,
        }),
        this.getOrgContactList({
          idList: contactIdList,
          type: 'contactId',
          filterTeamOrg: false,
          _account,
        }),
      ]);
      const newList = util.getKeyListByList(personalInfoList, 'id');
      const oldList = util.getKeyListByList(oldContactItemList, 'id');
      const oldOrgContactIdList = util.getKeyListByList(oldOrgContactList, 'id');
      const newOrgContactIdList = util.getKeyListByList(personalOrgContactList, 'id');
      const { deleteDiff } = util.getDiff(oldList, newList);
      const { deleteDiff: orgContactDeleteIdList } = util.getDiff(oldOrgContactIdList, newOrgContactIdList);
      await Promise.all([
        this.deleteData({
          tableName: this.contactUtil.contactItemTable,
          list: deleteDiff,
          _account,
        }),
        this.deleteData({
          tableName: this.contactUtil.orgContactTable,
          list: orgContactDeleteIdList,
          _account,
        }),
      ]);
      return Promise.all([
        this.intoTable(
          {
            tableName: this.contactUtil.contactTable,
            list: personalList,
            _account: _account!,
          },
          {
            asSoon: true,
          }
        ),
        this.intoTable(
          {
            tableName: this.contactUtil.contactItemTable,
            list: personalInfoList,
            _account: _account!,
          },
          {
            asSoon: true,
          }
        ),
        this.intoTable(
          {
            tableName: this.contactUtil.orgContactTable,
            list: personalOrgContactList,
            _account: _account!,
          },
          {
            asSoon: true,
          }
        ),
      ]);
    });
  }

  /**
   * 给org表中添加数据
   * @param list:企业组织列表树
   * */
  async orgAllInto(options: ContactAccountsOption<{ list: resultObject[] }>): Promise<syncRes[]> {
    const { list, isMainAccount, _account } = options;
    const _lastUpdateTime = Date.now();
    const res = this.contactTrans.transOrg2EntityOrg({ list, _lastUpdateTime, _account });
    let { entityOrgList: orgList } = res;
    const { needDeleteOrgIds } = res;
    console.log('orgAllInto orgList', orgList);

    // 查询部门人数信息(人数信息服务端没有给是客户端自己算的)执行数据合并

    try {
      if (orgList && orgList.length) {
        const ids = orgList.map(item => item.id);
        const oldOrgList = await this.dbApi.getByIds<EntityOrg>(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.orgTable,
            _dbAccount: options._account,
          },
          ids
        );
        const memberNumMap: Map<string, number> = new Map();

        oldOrgList.forEach(item => {
          if (!item) {
            return;
          }
          memberNumMap.set(item.id, item.memberNum!);
        });
        orgList = orgList.map(item => {
          item.memberNum = memberNumMap.get(item.id) || 0;
          return item;
        });
        // 执行数据合并
      }
    } catch (ex) {
      console.error('[contactDB]orgAllInto.error(0):', ex);
    }

    // 执行添加逻辑
    try {
      if (orgList && orgList.length) {
        await this.intoTable({
          tableName: this.contactUtil.orgTable,
          list: orgList as resultObject[],
          isMainAccount,
          _account,
        });
      }
    } catch (ex) {
      console.error('[contactDB]orgAllInto.error(1):', ex);
    }

    // 执行删除逻辑
    try {
      if (needDeleteOrgIds && needDeleteOrgIds.length) {
        await this.dbApi.deleteById(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.orgTable,
            _dbAccount: _account,
          },
          needDeleteOrgIds
        );
      }
    } catch (ex) {
      console.error('[contactDB]orgAllInto.error(2):', ex);
    }

    return [
      {
        org: {
          deleteDiff: [],
          updateDiff: [],
        },
        _account,
      },
    ];
  }

  private addCoreContactLock(options: ContactAccountsOption<{ tableName: 'org' | 'contact'; enterpriseId: number }>) {
    const { tableName, enterpriseId } = options;
    const mainEnterpriseId = this.systemApi.getCurrentCompanyId(options._account);
    // 如果是关联企业不做处理
    if (enterpriseId !== mainEnterpriseId) {
      return;
    }

    if (!this.coreNeedDeleteStep.has(options._account)) {
      this.coreNeedDeleteStep.set(options._account, new Set());
    }

    this.coreNeedDeleteStep.get(options._account)?.add(tableName);
  }

  // 执行核心数据的插入
  async coreContactAllInto(
    options: ContactAccountsOption<{
      list: CoreContactServerRawData[];
      orgpathlist: EntityOrgPathList[];
    }>,
    _config: {
      enterpriseId: number;
      iconPrefix: string;
      enableFastCleanInvalidContact?: boolean;
    }
  ) {
    const { list, orgpathlist, ...restOptions } = options;
    const lastUpdateTime = Date.now();
    const config = {
      ..._config,
      _account: options._account,
      lastUpdateTime,
    };

    const cleanDelayDuration = lodashGet(options, 'enableFastCleanInvalidContact', false) ? this.coreQuickCleanDelayDuration : this.coreCleanDelayDuration;

    // 如果服务端没有返回数据 直接进行删除处理
    if (!Array.isArray(list) || !list.length) {
      console.time('[contact_dbl]coreContactAllInto.deleteInvalidCoreContact');
      // 将orgcontact数据同步给org数据 计算部门人数信息
      this.eventApi.sendSysEvent({
        eventName: 'subCoreOrgContactReady',
        eventData: {
          enterpriseId: config.enterpriseId,
          data: new Map(),
        },
        _account: restOptions._account,
      });
      setTimeout(() => {
        this.addCoreContactLock({ tableName: 'contact', enterpriseId: config.enterpriseId, ...restOptions });
        this.deleteInvalidCoreContact({
          lastUpdateTime,
          enterpriseId: config.enterpriseId,
          ...restOptions,
        });
      }, cleanDelayDuration);

      console.timeEnd('[contact_dbl]coreContactAllInto.deleteInvalidCoreContact');
      return;
    }

    // 关联企业和主企业执行核心数据插入 使用不同的配置(关联降配)
    const highDBConfig = { limitSize: 3000, intervalDuration: 100 };
    const lowDbConfig = { limitSize: 1500, intervalDuration: 300 };
    const { limitSize, intervalDuration } = this.systemApi.getCurrentCompanyId() === config.enterpriseId && restOptions.isMainAccount ? highDBConfig : lowDbConfig;

    // 执行数据比较
    const orgContactMapGroupbyOrg: Map<string, number> = new Map();
    const intoList = lodashChunk(list, limitSize).reduce((total, subList) => {
      const {
        contact: coreEnterpriseContactList,
        contactItem: coreEnterpriseContactItemlist,
        orgContact: coreEnterpriseOrgContactList,
      } = this.contactTrans.transformCoreContact2MultipeData(subList, orgpathlist, config);

      // 生成一个org分组Map给到org计算memberNum使用
      coreEnterpriseOrgContactList.forEach(item => {
        const { orgId } = item;
        if (!orgContactMapGroupbyOrg.has(orgId)) {
          orgContactMapGroupbyOrg.set(orgId, 0);
        }
        orgContactMapGroupbyOrg.set(orgId, (orgContactMapGroupbyOrg.get(orgId) || 0) + 1);
      });

      total.push({
        contact: coreEnterpriseContactList,
        contactItem: coreEnterpriseContactItemlist,
        orgContact: coreEnterpriseOrgContactList,
      });
      return total;
    }, [] as { contact: EntityContact[]; contactItem: EntityContactItem[]; orgContact: EntityOrgContact[] }[]);

    // 将orgcontact数据同步给org数据 计算部门人数信息
    this.eventApi.sendSysEvent({
      eventName: 'subCoreOrgContactReady',
      eventData: {
        enterpriseId: config.enterpriseId,
        data: orgContactMapGroupbyOrg,
      },
      _account: restOptions._account,
    });

    // 分批插入
    const promiseRequest = intoList
      .reduce((total, current, currentIndex) => {
        total = total
          .then(async () => {
            if (currentIndex !== 0) {
              await wait(intervalDuration);
            }
            return this.coreContactIntoChunked({
              ...current,
              ...restOptions,
            });
          })
          .catch(ex => {
            console.error('[contact_dbl]coreContactIntoChunked.error', ex);
          });
        return total;
      }, Promise.resolve())
      .catch(ex => {
        console.error('[contact_dbl]coreContactAllInto.error', ex);
      });

    try {
      await promiseRequest;
    } catch (ex) {
      this.dataTracker.track('pc_contact_sync_db_error', {
        _account: options._account,
        from: 'enterprise',
        step: 'core',
        message: lodashGet(ex, 'message', `${ex}`),
      });
    }

    await this.cleanOrgpathTable({ ...restOptions });

    setTimeout(() => {
      this.addCoreContactLock({ tableName: 'contact', enterpriseId: config.enterpriseId, ...restOptions });
      this.deleteInvalidCoreContact({
        lastUpdateTime,
        enterpriseId: config.enterpriseId,
        ...restOptions,
      });
    }, cleanDelayDuration);
  }

  // 清除完整路径table
  private async cleanOrgpathTable(options: ContactAccountsOption<{ tableName?: string }>) {
    const { tableName = this.contactUtil.orgpathlistTable } = options;
    // const orgcontactlist = await this.dbApi.getByRangeCondition<EntityOrgContact>({
    //   dbName: this.contactUtil.contactDbName,
    //   tableName: this.contactUtil.orgContactTable,
    // });

    // const list = lodashGroupby(orgcontactlist, item => item.orgId);
    // console.warn('[guochaotest]orgcontactlist:', list);
    window.bridgeApi.master.forbiddenBridgeOnce();
    return this.dbApi.clear({
      dbName: this.contactUtil.contactSearchDbName,
      tableName,
      _dbAccount: options._account,
    });
  }

  // 分5000条一次执行
  async coreContactIntoChunked(options: ContactAccountsOption<{ contact: EntityContact[]; contactItem: EntityContactItem[]; orgContact: EntityOrgContact[] }>) {
    // 执行数据比较
    const { contact: coreEnterpriseContactList, contactItem: coreEnterpriseContactItemlist, orgContact: coreEnterpriseOrgContactList } = options;

    const hasEmpty = [coreEnterpriseContactList, coreEnterpriseContactItemlist].some(item => !item || !item.length);
    if (hasEmpty) {
      return;
    }

    // 配置成单次插入5000条(todo: 需要验证是否会阻塞JS)
    // this.contactUtil.contactTable,this.contactUtil.contactItemTable,this.contactUtil.orgContactTable
    const requestPromiseList = [
      {
        table: this.contactUtil.contactTable,
        list: coreEnterpriseContactList,
      },
      {
        table: this.contactUtil.contactItemTable,
        list: coreEnterpriseContactItemlist,
      },
      {
        table: this.contactUtil.orgContactTable,
        list: coreEnterpriseOrgContactList,
      },
    ].map(({ table, list }) => {
      // 本次插入在主窗口执行
      this.contactUtil.forbiddenBridgeOnce();
      return this.dbApi.putAll(
        {
          dbName: this.contactUtil.contactDbName,
          tableName: table,
          _dbAccount: options._account,
        },
        list as unknown as resultObject[],
        {
          pageSize: 5000,
          supportCache: 'disable',
        }
      );
    });

    await Promise.all(requestPromiseList);
  }

  /**
   * @description:删除重复数据.1.22版本新增 解决通讯录重复问题
   * @param lastUpdateTime
   * @param enterpriseId
   * @returns
   */
  private async deleteDuplicateOrgContact(params: ContactAccountsOption<{ lastUpdateTime: number; enterpriseId: number }>) {
    const { enterpriseId, lastUpdateTime } = params;
    // 删除重复数据逻辑只适配于主企业
    const mainCompanyId = this.systemApi.getCurrentCompanyId(params._account);
    if (mainCompanyId !== enterpriseId || !this.systemApi.getIsMainAccount(params._account)) {
      return;
    }

    const totalOrgContactList = await this.dbApi.getByRangeCondition<EntityOrgContact>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgContactTable,
      _dbAccount: params._account,
    });
    const needDeleteOrgContactIds: string[] = [];
    // 进行分片查找
    await lodashChunk(totalOrgContactList, 5000).reduce((total, chunkList, index) => {
      total = total.then(async () => {
        if (index > 0) {
          await wait(200);
        }
        chunkList.forEach(item => {
          // 慎重判断type逻辑 别把个人群组给删了
          const { _lastUpdateTime, enterpriseId: _enterpriseId, orgId, id } = item;
          if (_enterpriseId && _enterpriseId !== enterpriseId) {
            return;
          }
          // 如果不是数组开头的并不是企业
          if (orgId && !/^\d+/.test(orgId)) {
            return;
          }

          if (!_lastUpdateTime || _lastUpdateTime < lastUpdateTime) {
            needDeleteOrgContactIds.push(id);
          }
        });

        return true;
      });
      return total;
    }, Promise.resolve(true));

    if (!needDeleteOrgContactIds || !needDeleteOrgContactIds.length) {
      return;
    }
    this.dataTracker.track('pc_contact_check_duplicatedata', {
      _account: params._account,
      recordSubAccount: false,
      count: needDeleteOrgContactIds.length,
      type: 'user',
    });
    this.contactUtil.forbiddenBridgeOnce();
    await this.dbApi.deleteById(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.orgContactTable,
        _dbAccount: params._account,
      },
      needDeleteOrgContactIds
    );
  }

  private async deleteInvalidCoreContact(options: ContactAccountsOption<{ lastUpdateTime: number; enterpriseId: number }>) {
    const { lastUpdateTime, enterpriseId, _account: _dbAccount } = options;
    const timesstamp = lastUpdateTime - 10;
    const promiseRequestFunctionList = [
      () => {
        this.contactUtil.forbiddenBridgeOnce();
        return this.dbApi.deleteByByRangeCondition(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.contactTable,
            adCondition: {
              type: 'between',
              field: ['enterpriseId', '_lastUpdateTime'],
              args: [[enterpriseId, 0], [enterpriseId, timesstamp], true],
            },
            _dbAccount,
          },
          _dbAccount,
          { supportCache: false }
        );
      },
      () => {
        this.contactUtil.forbiddenBridgeOnce();
        return this.dbApi.deleteByByRangeCondition(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.contactItemTable,
            adCondition: {
              type: 'between',
              field: ['contactItemType', 'enterpriseId', '_lastUpdateTime'],
              args: [['EMAIL', enterpriseId, 0], ['EMAIL', enterpriseId, timesstamp], true],
            },
            _dbAccount,
          },
          _dbAccount,
          { supportCache: false }
        );
      },
      () => {
        this.contactUtil.forbiddenBridgeOnce();
        return this.dbApi.deleteByByRangeCondition(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.orgContactTable,
            adCondition: {
              type: 'between',
              field: ['enterpriseId', '_lastUpdateTime'],
              args: [[enterpriseId, 0], [enterpriseId, timesstamp], true],
            },
            _dbAccount,
          },
          _dbAccount,
          { supportCache: false }
        );
      },
    ];

    return Promise.all(promiseRequestFunctionList.map(func => func()))
      .then(() => this.deleteDuplicateOrgContact({ lastUpdateTime: timesstamp, enterpriseId, _account: options._account }))
      .finally(() => {
        this.sendCoreDeleteInvalidEvent({
          tableName: 'contact',
          enterpriseId,
          _account: options._account,
        });
      });
  }

  async sendCoreDeleteInvalidEvent(params: ContactAccountsOption<{ enterpriseId: number; tableName: 'contact' | 'org' }>) {
    // 只有主页面可以发送clean
    if (inWindow() && window.isBridgeWorker) {
      return;
    }

    const mainCompanyId = this.systemApi.getCurrentCompanyId(params._account);

    // 只主企业可以发送删除事件
    if (params.enterpriseId !== mainCompanyId) {
      return;
    }

    this.coreNeedDeleteStep.get(params._account)?.delete(params.tableName);

    if (!this.coreNeedDeleteStep.get(params._account)?.size) {
      this.contactUtil.sendCrossEvent({
        eventName: 'changeCoreContactSyncStatus',
        eventData: {
          status: 'cleanDone',
        },
        _account: this.systemApi.getCurrentUser(params._account)?.id || '',
      });
    }
  }

  async coreOrgAllInto(
    options: ContactAccountsOption<{
      list: CoreOrgServerRawData[];
    }>,

    config: {
      enableFastCleanInvalidContact?: boolean;
      // 当前统一的visibleCode(设置仅搜索课件的时候要用这个值覆盖单条数据的visibleCode)
      visibleCode: number;
      // 插入的企业ID
      enterpriseId?: number;
    }
  ): Promise<unknown> {
    const { list, ...restOptions } = options;
    const { enterpriseId, visibleCode = 0, enableFastCleanInvalidContact = false } = config;
    const curEnterpriseId = enterpriseId || this.contactUtil.getCurrentCompanyId(restOptions._account);
    // 是否可以快速删除老数据
    const lastUpdateTime = Date.now();
    // 延迟删除数据配置
    const cleanDelayDuration = enableFastCleanInvalidContact ? this.coreQuickCleanDelayDuration : this.coreCleanDelayDuration;

    // 创建一个完整部门路径列表
    const _now = Date.now();
    const {
      fullPathList: orgFullPathList,
      entityOrgList,
      orgTreeMap,
    } = this.contactTrans.flattenServerUnit2FullOrgPath(list, { visibleCode: visibleCode || 0, lastUpdateTime, _account: options._account }, curEnterpriseId);

    const traverseDuration = Date.now() - _now;

    if (traverseDuration > 2000) {
      this.dataTracker.track('pc_core_org_traverse', {
        _account: options._account,
        duration: Date.now() - _now,
        count: list.length,
      });
    }

    // 构建完整部门链路表给coreContact使用
    this.coreFullOrgpathAllInto({
      orgFullPathList,
      enterpriseId: curEnterpriseId,
      ...restOptions,
    });

    if (entityOrgList && entityOrgList.length) {
      // 从shortEnteprise中获取orgcontact数据。计算部门信息
      const orgcontactMapGroupbyOrgId = (await new Promise(resolve => {
        const eid = this.eventApi.registerSysEventObserver('subCoreOrgContactReady', {
          func: (e: SystemEvent<{ enterpriseId: number; data: Map<string, number> }>) => {
            const cid = lodashGet(e.eventData, 'enterpriseId', curEnterpriseId);
            const groupMap = lodashGet(e.eventData, 'data', new Map());

            if (cid !== curEnterpriseId) {
              return;
            }

            this.eventApi.unregisterSysEventObserver('subCoreOrgContactReady', eid);
            resolve(groupMap);
          },
          _account: options._account,
        });
      })) as Map<string, number>;

      // 计算部门人数信息
      const nodeMemberCountMap = await this.contactUtil.computeEntityOrgMemberCount({
        rootOrgKey: '-2',
        orgContactMap: orgcontactMapGroupbyOrgId,
        orgTreeMap,
      });
      // 配置部门人数
      entityOrgList.map(item => {
        const { id } = item;
        if (nodeMemberCountMap.has(id)) {
          item.memberNum = nodeMemberCountMap.get(id)!.totalCount;
        } else {
          item.memberNum = 0;
        }
        return item;
      });

      // 本次插入在主窗口执行
      try {
        this.contactUtil.forbiddenBridgeOnce();
        // 将部门数据灌入到DB表中去(配置单次插入5000)
        await this.dbApi.putAll(
          {
            dbName: this.contactUtil.contactDbName,
            tableName: this.contactUtil.orgTable,
            _dbAccount: options._account,
          },
          entityOrgList,
          {
            pageSize: 3000,
          }
        );
      } catch (ex) {
        this.dataTracker.track('pc_contact_sync_db_error', {
          _account: options._account,
          from: 'org',
          step: 'core',
          message: lodashGet(ex, 'message', `${ex}`),
        });
      }
    }
    // 删除无效数据
    setTimeout(() => {
      this.addCoreContactLock({
        enterpriseId: curEnterpriseId,
        tableName: 'org',
        _account: options._account,
      });
      this.deleteInvalidEntityCoreOrg({
        lastUpdateTime,
        enterpriseId: curEnterpriseId,
        ...restOptions,
      });
    }, cleanDelayDuration);
    return true;
  }

  // 在loki数据中插入完整部门链路表
  // 目的:coreContact计算所属部门信息使用
  private async coreFullOrgpathAllInto(options: ContactAccountsOption<{ orgFullPathList: EntityOrgPathList[]; enterpriseId: number }>) {
    const { orgFullPathList, enterpriseId } = options;
    if (!orgFullPathList || !orgFullPathList.length) {
      await wait(50);
      this.eventApi.sendSysEvent({
        eventName: 'coreOrgPathlistReady',
        eventData: {
          type: 'server',
          enterpriseId,
        },
        _account: options._account,
      });
      return;
    }

    this.contactUtil.forbiddenBridgeOnce();
    try {
      await this.dbApi.putAll(
        {
          dbName: this.contactUtil.contactSearchDbName,
          tableName: this.contactUtil.orgpathlistTable,
          _dbAccount: options._account,
        },
        orgFullPathList,
        { memoryPageSize: 10000 }
      );
      // 发送一个通讯录组织部门已经OK的通知(contactcore构建部门信息需要部门链路)
      this.eventApi.sendSysEvent({
        eventName: 'coreOrgPathlistReady',
        eventData: {
          type: 'server',
          enterpriseId,
        },
        _account: options._account,
      });
    } catch (ex) {
      console.error('[contact_dbl]corOgAllInto.put.orgpathlist.error', ex);
    }
  }

  // 删除无效的核心数据
  private deleteInvalidEntityCoreOrg(options: ContactAccountsOption<{ lastUpdateTime: number; enterpriseId: number }>) {
    const { lastUpdateTime, enterpriseId } = options;
    const timestamp = lastUpdateTime - 10;
    return this.dbApi
      .deleteByByRangeCondition(
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.orgTable,
          adCondition: {
            type: 'between',
            field: ['enterpriseId', '_lastUpdateTime'],
            args: [
              [enterpriseId, 0],
              [enterpriseId, timestamp],
            ],
          },
          _dbAccount: options._account,
        },
        options._account,
        { supportCache: false }
      )
      .finally(() => {
        this.sendCoreDeleteInvalidEvent({ tableName: 'org', _account: options._account, enterpriseId });
      });
  }

  /**
   * @deprecated: 目前看无人调用 1.27废弃
   * @description: 获取到的组织列表加入数据库
   * @param list: 组织列表
   * */
  orgInto(list: resultObject[]): Promise<CatchErrorRes> {
    const { entityOrgList: orgList } = this.contactTrans.transOrg2EntityOrg({ list, _lastUpdateTime: Date.now(), _account: this.systemApi.getCurrentUser()?.id || '' });
    return util.SyncCatchError(() =>
      this.intoTable({
        tableName: this.contactUtil.orgTable,
        list: orgList,
        isMainAccount: true,
        _account: this.systemApi.getCurrentUser()?.id || '',
      })
    );
  }

  /**
   * 将服务端分组id转换成本地分组id
   * @param id
   */
  transOrgIdByPersonalOrg(id: string) {
    if (id.startsWith('personal_org_')) {
      return id;
    }
    return 'personal_org_' + id;
  }

  /**
   * 给org表中添加分组数据
   * @param list:企业组织列表树
   * */
  async personalOrgAllInto(
    options: ContactAccountsOption<{
      list: resultObject[];
      force?: boolean;
    }>
  ): Promise<syncRes[]> {
    const _lastUpdateTime = Date.now();
    const { list, isMainAccount, _account, force = false } = options;

    const { groupList: orgList, markedList } = this.contactTrans.transPersonalGroup2EntityOrgList(list, _lastUpdateTime);
    console.log('personalOrgAllInto orgList', orgList);
    const idList = util.getKeyListByList<string>(orgList, 'id');

    if (orgList && orgList.length) {
      await Promise.all([
        this.intoTable({
          tableName: this.contactUtil.orgTable,
          list: orgList,
          isMainAccount,
          _account,
        }),
        // 更新DB
        this.doInsertPersonalMark(
          {
            list: markedList,
            isMainAccount,
            _account,
          },
          {
            isIncrease: false,
            type: 2,
          }
        ),
      ]);
    }

    let delIdList: string[] = [];

    // 如果是强制更新或者有数据 删除无效数据
    if (force || (list && list.length)) {
      delIdList = await this.clearnInvalidPersonalOrg({
        _account,
        lastUpdateTime: _lastUpdateTime,
      });
    }

    const updateDiff = idList.filter(id => !delIdList.includes(id));
    return [
      {
        org: {
          deleteDiff: delIdList,
          updateDiff,
        },
      },
    ];
  }

  async updateContactById(
    params: ContactAccountsOption<{
      list: ContactEntityUpdateParams[];
      action?: 'update' | 'insert' | 'delete';
    }>
  ): Promise<ContactCommonRes<UpdateContactModelRes>> {
    const { list: originContactList, action = 'update', _account } = params;
    if (!originContactList.length) {
      return {
        success: true,
      };
    }
    const idList = util.getKeyListByList(originContactList, 'id');
    const list = await this.getContactList({ idList, _account });
    if (!list.length) {
      return {
        success: false,
      };
    }
    const needUpdateContactList: Record<'contact', EntityContact>[] = [];
    list.forEach(item => {
      const findContact = originContactList.find(obj => obj.id === item.id);
      if (findContact) {
        let hasDiff = false;
        const newContact = mergeWith(item, findContact, (cur, src) => {
          if (src !== cur) {
            hasDiff = true;
            if (Array.isArray(src)) {
              if (action === 'update') {
                return src;
              }
              if (action === 'insert') {
                return [...new Set((cur || []).concat(src))];
              }
              return (cur || []).filter((id: string) => !src.includes(id));
            }
          }
          return undefined;
        });
        if (hasDiff) {
          needUpdateContactList.push({
            contact: newContact,
          });
        }
      } else {
        needUpdateContactList.push({
          contact: item,
        });
      }
    });
    if (!needUpdateContactList.length) {
      return {
        success: true,
      };
    }
    return this.updateContactModel({ list: needUpdateContactList, _account });
  }

  async updateContactModel(params: ContactAccountsOption<{ list: Partial<ContactModel>[] }>): Promise<ContactCommonRes<UpdateContactModelRes>> {
    const { list, _account } = params;
    try {
      const contactList: EntityContact[] = [];
      let contactItemList: EntityContactItem[] = [];
      const personalContactId = new Set<string>();
      const enterpriseContactId = new Set<string>();
      list.forEach(item => {
        const { contact, contactInfo } = item;
        if (contact) {
          contactList.push(contact);
          if (contact.type === 'enterprise') {
            enterpriseContactId.add(contact.id);
          } else if (contact.type === 'personal') {
            personalContactId.add(contact.id);
          }
        }
        if (contactInfo?.length) {
          contactItemList = contactItemList.concat(contactInfo);
          const { contactId, type } = contactInfo[0];
          if (type === 'enterprise') {
            enterpriseContactId.add(contactId);
          } else if (type === 'personal') {
            personalContactId.add(contactId);
          }
        }
      });
      await Promise.all([
        this.intoTable({
          tableName: this.contactUtil.contactTable,
          list: contactList,
          _account,
        }),
        this.intoTable({
          tableName: this.contactUtil.contactItemTable,
          list: contactItemList,
          _account,
        }),
      ]);
      return {
        success: true,
        data: {
          personalIdList: [...personalContactId],
          enterpriseIdList: [...enterpriseContactId],
        },
      };
    } catch (e) {
      console.error('[contact] updateContactModel error', e);
      return {
        success: false,
      };
    }
  }

  async doInsertPersonalMark(
    options: ContactAccountsOption<{ list: resultObject[] }>,
    config: {
      type?: 1 | 2;
      _lastUpdateTime?: number;
      isIncrease?: boolean;
      // 是否有新增数据
      noNewMarkData?: boolean;
      quickUpdate?: boolean;
    } = {
      type: 1,
      _lastUpdateTime: Date.now(),
      isIncrease: true,
      noNewMarkData: false,
      quickUpdate: false,
    }
  ): Promise<resultObject> {
    const { list: _data, _account } = options;
    if (!Array.isArray(_data) || !_data.length) {
      return _data;
    }
    const { isIncrease = true, type = 1, quickUpdate = false } = config;

    console.log('[contact_dbl]doInsertPersonalMark', isIncrease, type, quickUpdate);

    const data = _data.map(item => {
      if (item.type === 1) {
        item.originId = item.value;
      } else {
        item.value = item.value.includes('personal_org') ? item.value : `personal_org_${item.value}`;
        item.originId = item.value.replace('personal_org_', '');
      }
      return item;
    });

    const personalMarkList: EntityPersonalMark[] = [];
    const ids: string[] = [];
    data.forEach(item => {
      ids.push(item.value);
      personalMarkList.push({
        ...item,
        id: util.getUnique(item.value),
      } as EntityPersonalMark);
    });

    const count = await this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.personalMarkTable,
        _dbAccount: _account,
      },
      personalMarkList
    );

    // 发送通知
    this.eventApi.sendSysEvent({
      eventName: 'contactPersonalMarkNotify',
      eventStrData: 'notify',
      eventData: {
        actionType: 'update',
        isAll: !isIncrease,
        noNewMarkData: config.noNewMarkData || false,
        data: personalMarkList,
      },
      _account,
    });

    return count;
  }

  async doInsertOrReplacePersonal(params: ContactAccountsOption<{ data: ResponseData<resultObject[]> }>): Promise<CatchErrorRes<ContactModel[]>> {
    const { data, _account } = params;
    if (data?.success && data?.data) {
      const res = await this.personalInto(data.data as resultObject[], _account);
      if (res.success && res.data) {
        const idList = util.getKeyListByList(res.data[0], 'id');

        const emaillist: Set<string> = new Set();
        (res.data[1] as EntityContactItem[])?.forEach(item => {
          if (item.contactItemType === 'EMAIL') {
            emaillist.add(item.contactItemVal);
          }
        });

        res.data = await this.contactTrans.transformContactModel({
          contactList: res.data[0],
          contactInfoList: res.data[1],
          _account,
        });

        this.sendContactNotify({
          contact_personal: {
            updateDiff: idList,
          },
          syncStatus: {
            personal: true,
          },
          emails: [...emaillist],
          _account,
        });
      }
      return res;
    }
    return {
      success: false,
      error: data?.message,
    };
  }

  /**
   * 删除个人列表数据
   * @param list: 个人通讯录列表primaryKey[]
   * */
  async personalContactDelete(params: ContactAccountsOption<{ list: string[] }>): Promise<ContactCommonRes<syncRes>> {
    const { list: _list, _account } = params;
    const list = Array.isArray(_list) ? _list : [_list];
    try {
      const [itemList, orgContactList] = await Promise.all([
        this.getContactItemListByContactId({ idList: list, _account }),
        this.getOrgContactListByContactId({ idList: list, _account }),
      ]);
      const contactItemIdList = util.getKeyListByList(itemList, 'id');
      const orgContactIdList = util.getKeyListByList(orgContactList, 'id');
      await Promise.all([
        this.deleteData({ tableName: this.contactUtil.contactTable, list, _account }),
        this.deleteData({ tableName: this.contactUtil.contactItemTable, list: contactItemIdList, _account }),
        this.deleteData({ tableName: this.contactUtil.orgContactTable, list: orgContactIdList, _account }),
      ]);
      return {
        success: true,
        data: {
          contact_personal: {
            deleteDiff: list,
          },
          contactItem_personal: {
            deleteDiff: contactItemIdList,
          },
          orgContact_personal: {
            deleteDiff: orgContactIdList,
          },
          syncStatus: {
            personal: true,
          },
        },
      };
    } catch (e) {
      console.error('[contact] personalContactDelete error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 删除idList 对应的数据
   * @param {string} tableName //表名
   * @param {diffList} list //需要删除的列表的key
   * @param _account
   * @return {*}
   */
  deleteData(options: { tableName: string; list: diffList; _account?: string }) {
    const { list, tableName, _account = this.systemApi.getCurrentUser()?.id } = options;
    if (list && list.length > 0) {
      return this.dbApi
        .deleteById(
          {
            dbName: this.contactUtil.contactDbName,
            tableName,
            _dbAccount: _account,
          },
          list
        )
        .then(() => {
          this.clearCache();
          return true;
        });
    }
    return Promise.resolve(true);
  }

  async handleLeaveTeam(team: Team) {
    const orgId = 'team_' + team.teamId;
    const orgContactList = await this.getOrgContactList({
      idList: [orgId],
      type: 'orgId',
    });
    const idList = util.getKeyListByList(orgContactList, 'id');
    await this.deleteData({
      tableName: this.contactUtil.orgContactTable,
      list: idList,
    });
    await this.deleteData({
      tableName: this.contactUtil.orgTable,
      list: [orgId],
    });
  }

  async handleUpdateTeam(team: Team) {
    const teamList = this.transTeamToOrg([team]);
    await this.teamIntoOrg(teamList);
  }

  // async handleUpdateTeam(team:Team) {
  //   const teamList = this.transTeamToOrg([team]);
  //   await this.teamIntoOrg(teamList);
  // }

  async handleRemoveTeamMembers(team: Team, accounts: string[]) {
    const teamId = 'team_' + team.teamId;
    const imIdList = accounts.map(item => teamId + '_' + item);
    const teamMemberList = await this.getOrgContactList({
      type: 'imId',
      idList: imIdList,
    });
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const idList = util.getKeyListByList(teamMemberList, 'id');
    await this.deleteData({
      tableName: this.contactUtil.orgContactTable,
      list: idList,
      _account: mainAccount,
    });
    const teamList = this.transTeamToOrg([team]);
    await this.intoTable({
      tableName: this.contactUtil.orgTable,
      list: teamList,
      _account: mainAccount,
    });
  }

  async handleTransferTeamMembers(team: Team, accounts: string[]) {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const teamMemberList = await this.getTeamMemberByTeamIdAndAccount(team.teamId, accounts);
    const memberList = await this.transTeamMemberToOrgContact(teamMemberList);
    await this.intoTable({
      tableName: this.contactUtil.orgContactTable,
      list: memberList,
      _account: mainAccount,
    });
    const teamList = this.transTeamToOrg([team]);
    await this.intoTable({
      tableName: this.contactUtil.orgTable,
      list: teamList,
      _account: mainAccount,
    });
  }

  async handleAddTeamMembers(team: Team, accounts: string[]) {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const teamMemberList = await this.getTeamMemberByTeamIdAndAccount(team.teamId, accounts);
    const memberList = await this.transTeamMemberToOrgContact(teamMemberList);
    await this.intoTable({
      tableName: this.contactUtil.orgContactTable,
      list: memberList,
      _account: mainAccount,
    });
    const teamList = this.transTeamToOrg([team]);
    await this.intoTable({
      tableName: this.contactUtil.orgTable,
      list: teamList,
      _account: mainAccount,
    });
  }

  async handleTeamEvent(res: TeamEventCallbackParmas) {
    console.log('[contact] [team] action', res);
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const { action, team, accounts } = res;
    switch (action) {
      case TEAM_EVENT_NAME.UPDATE_TEAM:
        if (team) {
          try {
            await this.handleUpdateTeam(team);
          } catch (e) {
            console.error('[contact] UPDATE_TEAM error', e);
          }
        } else {
          console.warn('[contact] UPDATE_TEAM no data');
        }
        break;
      case TEAM_EVENT_NAME.ADD_TEAM_MEMBERS:
        if (team && accounts?.length) {
          try {
            await this.handleAddTeamMembers(team, accounts);
          } catch (e) {
            console.error('[contact] addTeamMembers error', e);
          }
        } else {
          console.warn('[contact] ADD_TEAM_MEMBERS no data');
        }
        break;
      case TEAM_EVENT_NAME.REMOVE_TEAM_MEMBERS:
        if (team && accounts?.length) {
          try {
            await this.handleRemoveTeamMembers(team, accounts);
          } catch (e) {
            console.error('[contact] removeTeamMembers error', e);
          }
        } else {
          console.warn('[contact] REMOVE_TEAM_MEMBERS no data');
        }
        break;
      case TEAM_EVENT_NAME.JOIN_TEAM:
        if (team) {
          try {
            await this.syncTeamList({ teamList: [team] });
          } catch (e) {
            console.error('[contact] joinTeam error', e);
          }
        } else {
          console.warn('[contact] JOIN_TEAM no data');
        }
        break;
      case TEAM_EVENT_NAME.LEAVE_TEAM:
        if (team) {
          try {
            await this.handleLeaveTeam(team);
          } catch (e) {
            console.error('[contact] LEAVE_TEAM error', e);
          }
        } else {
          console.warn('[contact] LEAVE_TEAM no data');
        }
        break;
      case TEAM_EVENT_NAME.TRANSFER_TEAM:
        if (team && accounts) {
          this.handleTransferTeamMembers(team, accounts);
        } else {
          console.warn('[contact] TRANSFER_TEAM no data');
        }
        break;
      default:
        break;
    }
    this.sendContactNotify({ syncStatus: { team: true }, _account: mainAccount });
  }

  init() {
    this.dbApi.initDb(this.contactUtil.contactDbName);
    console.log('[contact] contactDB inited', this.inited);

    if (!this.inited) {
      this.initSyncNIM();
      this.testDbNoData().then(noData => {
        if (!noData) {
          this.initContactData();
        }
      });
      this.inited = true;
    }

    const funcCallback = (e: SystemEvent<CoreContactEvent>) => {
      const status = e.eventData?.status;
      if (!e.eventData?.isMainAccount) {
        return;
      }
      // 如果前台正在进行核心数据同步 禁用后台所有的put操作
      if (status === 'start') {
        this.enablePutContact = false;
      } else if (status === 'finish') {
        this.enablePutContact = true;
      }
    };

    // 在通讯录中设置通讯录同步锁(核心数据同步过程中  其他数据禁止同步)
    if (inWindow() && window.isBridgeWorker) {
      this.eventApi.registerSysEventObserver('changeCoreContactSyncStatus', {
        func: funcCallback,
        _account: this.systemApi.getCurrentUser()?.id || '',
      });
    }
  }

  async testDbNoData(): Promise<boolean> {
    let force = true;

    try {
      // // 检查是否需要删除所有老数据
      // await this.needUpdateOldDBData();

      const data = await Promise.all([
        this.getTableCount({ tableName: 'contact' }),
        this.getTableCount({ tableName: 'orgContact' }),
        this.getTableCount({ tableName: 'contactItem' }),
      ]);
      console.log('[contact] testDbNoData table count contact,org', data);
      force = !data.some(item => item > 0);
    } catch (error) {
      console.error('[contact] testDbNoData table count Error', error);
      force = true;
    }
    return force;
  }

  private contactTempSyncStatus: Map<
    'enterprise' | 'org' | 'personal' | 'personalOrg' | 'all',
    {
      status: 'none' | 'core' | 'all';
      expiredTime: number;
    }
  > = new Map();

  async detectTempContactSyncStatusWithMemory(from?: 'enterprise' | 'org' | 'personal' | 'personalOrg'): Promise<'none' | 'core' | 'all'> {
    const key = from || 'all';

    if (!this.contactTempSyncStatus.has(key)) {
      return this.detectCoreEnterpriseHasData({ from });
    }
    const { status, expiredTime } = this.contactTempSyncStatus.get(key)!;
    if (Date.now() > expiredTime) {
      return this.detectCoreEnterpriseHasData({ from });
    }
    return status;
  }

  private setTempContactSyncStatus(status: 'none' | 'core' | 'all', from?: 'enterprise' | 'org' | 'personal' | 'personalOrg') {
    if (status === 'none') {
      return;
    }
    this.contactTempSyncStatus.set(from || 'all', {
      status,
      expiredTime: Date.now() + 20 * 60 * 1000,
    });
  }

  // 检测通讯录核心数据是否加载完成
  // 判断条件1:contact中是否有enterprise数据
  // 判断条件2:org中是否有enterprise数据
  // 判断条件3:task_global表中是否有enterprise & org的插入数据 (因为DB是分批插入的 有数据不代表同步完)
  async detectCoreEnterpriseHasData(
    options: ContactAccountsOptionWithPartial<Partial<{ from: 'enterprise' | 'org' | 'personal' | 'personalOrg'; subDomain: string }>>
  ): Promise<'none' | 'core' | 'all'> {
    const { from, subDomain, _account } = options;
    const currentUser = this.systemApi.getCurrentUser(_account);
    const accountMd5 = lodashGet(currentUser, 'accountMd5', '');

    // const totalAccounts = await this.accountApi.getMainAndSubAccounts();
    // if (totalAccounts.length && _account) {
    //   accountMd5 = totalAccounts.find(item => [item.agentEmail, item.loginAccount].includes(_account))?.accountMd5 || lodashGet(currentUser, 'accountMd5', '');
    // }

    const curDomain = subDomain || lodashGet(currentUser, 'domain') || lodashGet(currentUser, 'id', '').replace(/^.+@/, '');
    // const domainShareList = lodashGet(currentUser, 'prop.domainShareList');
    let taskList: resultObject[];
    try {
      taskList = await this.dbApi.getByRangeCondition<ContactSyncTaskEntity>({
        dbName: 'task_global',
        tableName: 'contact_synctask',
      });
    } catch (ex) {
      console.error('[contactDB]detectCoreEnterpriseHasData.error1:', ex);
      return 'none';
    }

    // 如果没有sync同步记录(表示一次精简数据同步都没有做过)
    if (!Array.isArray(taskList) || taskList.length <= 0) {
      return 'none';
    }

    const stepMap: Map<string, 'none' | 'core' | 'all' | 'increase'> = from
      ? new Map([[from, 'none']])
      : new Map([
          ['personal', 'none'],
          ['personalOrg', 'none'],
          ['enterprise', 'none'],
          ['org', 'none'],
        ]);
    taskList.forEach(item => {
      if (item.account !== accountMd5 || item.domain !== curDomain || !stepMap.has(item.from)) {
        return;
      }

      const enterpriseStep = this.taskApi.getContactDoneStep(item as ContactSyncTaskEntity);
      stepMap.set(item.from, enterpriseStep);
    });

    let taskStep: 'none' | 'core' | 'all' = 'none';
    const stepList = [...stepMap.values()];

    if (stepList.includes('none')) {
      return 'none';
    }
    if (stepList.includes('core')) {
      taskStep = 'core';
    } else {
      taskStep = 'all';
    }

    if (from === 'personalOrg' || from === 'personal') {
      this.setTempContactSyncStatus(taskStep, from);
      return taskStep;
    }

    const totalRequestList: Map<'enterprise' | 'org', AdQueryConfig> = new Map([
      [
        'enterprise',
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.contactTable,
          query: {
            type: 'enterprise',
          },
          count: 1,
          _account: options._account,
        },
      ],
      [
        'org',
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.orgTable,
          adCondition: {
            type: 'anyOf',
            field: 'type',
            args: [0, 99],
          },
          count: 1,
          _account: options._account,
        },
      ],
    ]);

    const requestPromise = (from ? [totalRequestList.get(from)] : [...totalRequestList.values()]).map(item => {
      this.contactUtil.forbiddenBridgeOnce();
      const queryApiName = item?.query ? 'getByEqCondition' : 'getByRangeCondition';
      return this.dbApi[queryApiName](item!);
    });

    try {
      const list = await Promise.all(requestPromise);
      // 如果传了from response长度>=1 没有传>=2
      const step = list.flat().length >= (from ? 1 : 2) ? taskStep : 'none';
      this.setTempContactSyncStatus(step, from);
      return step;
    } catch (ex) {
      return 'none';
    }
  }

  async getTableCount(options: ContactAccountsOptionWithPartial<{ tableName: contactTableNames; dbName?: DBList; enterpriseId?: number }>) {
    const { tableName, dbName = this.contactUtil.contactDbName, enterpriseId = 0 } = options;
    if (tableName === 'orgpathlist' && enterpriseId) {
      const list = await this.dbApi.getByRangeCondition({
        dbName,
        tableName,
        adCondition: {
          type: 'equals',
          field: 'enterpriseId',
          args: [enterpriseId],
        },
        count: 1,
        _dbAccount: options._account,
      });
      return list.length;
    }

    return this.dbApi.getTableCount({
      dbName,
      tableName,
      _dbAccount: options._account,
    });
  }

  /**
   * 初始化同步IM数据
   */
  initSyncNIM() {
    const func = (e: SystemEvent<TeamEventCallbackParmas>) => {
      const eventData = e.eventData!;
      this.handleTeamEvent(eventData);
    };
    this.eventApi.registerSysEventObserver('imTeamEvents', {
      func,
      _account: this.systemApi.getCurrentUser()?.id || '',
    });
  }

  sendContactNotify(res: ContactAccountsOption<syncRes>) {
    this.setContactLastUpdateTime();
    this.contactSyncTimes += 1;
    res.contactSyncTimes = this.contactSyncTimes;
    res.hasDiff = true;
    console.log('[contact] contactNotify send', res);
    const contactNotifyData: SystemEvent = {
      eventName: 'contactNotify',
      eventStrData: 'notify',
      eventData: res,
      eventSeq: 0,
      noLog: true,
      _account: res._account || this.systemApi.getCurrentUser()?.id,
    };
    this.eventApi.sendSysEvent(contactNotifyData);

    if (res.syncStatus?.enterprise || res.syncStatus?.personal || res.syncStatus?.customer || res.syncStatus?.clue) {
      // 发account
      this.eventApi.sendSysEvent({
        ...contactNotifyData,
        eventName: 'contactAccountNotify',
      });
    }
    if (res.syncStatus?.org || res.syncStatus?.team || res.syncStatus?.personalOrg) {
      this.eventApi.sendSysEvent({
        ...contactNotifyData,
        eventName: 'contactOrgNotify',
      });
    }
  }

  close() {
    this.clearCache();
    this.dbApi.closeSpecific(this.contactUtil.contactDbName);
  }

  clearCache() {
    console.log('[contact] clearCache');
  }

  async initCache() {
    console.log('[contact] initCache');
  }

  initContactData() {
    console.log('[contact] initModule send contact');
    this.eventApi.sendSysEvent({
      eventName: 'initModule',
      eventStrData: 'contact',
    });
  }

  async getAllContactList(account?: string): Promise<ContactModel[]> {
    const contactList = (await this.dbApi.getByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactTable,
      _dbAccount: account,
    })) as EntityContact[];
    return this.handleContactList({ contactList });
  }

  async getAllOrgContactList(account?: string): Promise<EntityOrgContact[]> {
    const contactList = await this.dbApi.getByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgContactTable,
      _dbAccount: account,
    });
    return contactList as EntityOrgContact[];
  }

  // 获取最近联系人
  async getRecentContact(params: recentContactListParams): Promise<recentContactListRes[]> {
    // const query = {
    //   tableName: this.contactUtil.recentContactTable,
    //   dbName: this.contactUtil.contactDbName,
    //   order: 'index',
    //   start: (params.page - 1) * params.pageSize,
    //   count: params.pageSize,
    // };
    // const res = await this.dbApi.getByEqCondition(query);
    const indexes = [];
    for (let i = 0; i < params.pageSize; i++) {
      indexes.push((params.page - 1) * params.pageSize + i);
    }
    let res = await this.dbApi.getByIds(
      {
        tableName: this.contactUtil.recentContactTable,
        dbName: this.contactUtil.contactDbName,
        _dbAccount: params._account,
      },
      indexes
    );
    res = res.filter(_ => _);
    res &&
      res.length &&
      res.forEach(_ => {
        // eslint-disable-next-line no-unused-expressions
        _ && delete _.index;
      });
    return res as recentContactListRes[];
  }

  // 更新最近联系人表
  async saveRecentContactInDb(concatList: recentContactListRes[], params: recentContactListParams) {
    // page: 1,
    // pageSize: 10,
    concatList.forEach((concat: recentContactListRes, index: number) => {
      concat.index = (params.page - 1) * params.pageSize + index;
    });
    return this.dbApi
      .putAll(
        {
          tableName: this.contactUtil.recentContactTable,
          dbName: this.contactUtil.contactDbName,
          _account: params._account,
        },
        concatList
      )
      .then();
  }

  /**
   * 删除当前客户数据
   */
  async deleteCustomerDataInDB() {
    try {
      // const res = await Promise.all([
      //   this.deleteDbByName(this.contactUtil.orgContactTable),
      //   this.deleteDbByName(this.contactUtil.orgManager),
      //   this.deleteDbByName(this.contactUtil.contactTable),
      //   this.deleteDbByName(this.contactUtil.orgTable)
      // ]);
      const res = await this.dbApi.deleteDB(this.contactUtil.contactCustomerGlobalDBName);
      console.log('delete customer data succeeded', res);
    } catch (err) {
      console.log('delete customer data failed');
    }
  }

  // 本地数据中有没有subDomain数据
  async hasSubDomainData(orgId: string): Promise<boolean> {
    console.log('[contactDBL]hasSubDomainData:', orgId);
    const list = await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgTable,
      query: {
        originId: `org_${orgId}`,
      },
      count: 1,
    });
    return list.length > 0;
    // return false;
  }

  // 获取当前最大星标mark值
  async getMaxPersonalMark(_account: string): Promise<{
    count: number;
    data: ContactPersonalMarkSimpleModel[];
  }> {
    const account = _account || this.systemApi.getCurrentUser()?.id || '';
    // TODO @guochao check (是否使用索引marked倒排，limit取1)
    const list = (await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      _dbAccount: account,
    })) as unknown as EntityPersonalMark[];
    const markedList: number[] = list.map(item => item.marked);
    markedList.push(0);
    return {
      count: Math.max(...markedList),
      data: this.contactTrans.transfromPersonalMarkRawData(list.filter(item => typeof item.marked === 'number' && item.marked > 0)),
    };
  }

  // 获取星标列表
  async getPersonalMarkListByFields(
    args: (string | number)[],
    field: 'value' | 'email' | 'type' = 'value',
    _account?: string
  ): Promise<ContactPersonalMarkSimpleModel[]> {
    const adCondtionObj = (!Array.isArray(args) || !args.length
      ? {}
      : {
          adCondition: {
            field,
            type: 'anyOf',
            args,
          },
        }) as unknown as Record<'adCondition', AdQueryCondition>;
    // TODO @guochao check：是否需要直接返回【】
    const rawDataList = (await this.dbApi.getByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      _dbAccount: _account,
      ...adCondtionObj,
    })) as unknown as EntityPersonalMark[];

    return this.contactTrans.transfromPersonalMarkRawData(rawDataList.filter(item => typeof item.marked === 'number' && item.marked > 0));
  }

  // 删除星标
  async doDeletePersonalMark(params: ContactAccountsOption<{ ids: string[] }>): Promise<number> {
    const { ids, _account } = params;
    if (!Array.isArray(ids) || !ids.length) {
      return 0;
    }

    const data = await this.dbApi.getByRangeCondition<EntityPersonalMark>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      adCondition: {
        field: 'value',
        type: 'anyOf',
        args: ids,
      },
      _dbAccount: _account,
    });
    const idList: string[] = [];
    const list: EntityPersonalMark[] = [];
    data.forEach(item => {
      list.push(item);
      idList.push(item.id);
    });
    if (!idList.length) {
      return 0;
    }
    await this.dbApi.deleteById(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.personalMarkTable,
        _dbAccount: _account,
      },
      idList
    );
    // 发送通知
    this.eventApi.sendSysEvent({
      eventName: 'contactPersonalMarkNotify',
      eventStrData: 'notify',
      eventData: {
        actionType: 'delete',
        isAll: false,
        data: list,
      } as ContactPersonalMarkNotifyEventData,
      _account,
    });
    return idList.length;
  }

  // 更新星标联系人邮件未读数
  async updatePersonalmarkMailUnreadCount(idMap: Record<string, number>, _account?: string) {
    const personalMarkList = (await this.dbApi.getByRangeCondition(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.personalMarkTable,
        adCondition: {
          type: 'anyOf',
          field: 'id',
          args: Object.keys(idMap),
        },
      },
      _account
    )) as EntityPersonalMark[];

    return this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.personalMarkTable,
      },
      personalMarkList.map(item => ({
        ...item,
        unreadMailCount: idMap[item.id]!,
      })) as EntityPersonalMark[],
      undefined,
      _account
    );
  }

  // 更新contact或者Org对应的星标数据
  async updateContactOrgMarkInfoWithQuery(params: ContactAccountsOption<{ ids: Map<string, { id: string; marked: number }>; type: 1 | 2 }>) {
    const { ids, type, _account } = params;
    const targetTableName = type === 1 ? this.contactUtil.contactTable : this.contactUtil.orgTable;
    const idList = [...ids.keys()];
    if (!idList?.length) {
      return [];
    }
    // TODO @guochao check 感觉不对不应该是[idList]?
    const contactList = (await this.dbApi.getByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: targetTableName,
      adCondition: {
        type: 'anyOf',
        field: 'id',
        args: idList,
      },
      _dbAccount: _account,
    })) as resultObject[];

    const results = (await this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: targetTableName,
      },
      contactList.map(item => ({
        ...item,
        marked: ids.get(item.id)!.marked,
      }))
    )) as resultObject[];
    if (type === 1) {
      this.sendContactNotify({
        contact_personal: {
          updateDiff: results.map(item => item.id),
        },
        syncStatus: {
          personal: !!results.length,
        },
        _account,
      });
    }

    return results;
  }

  // 更新contact或者Org对应的星标数据
  async updateContactOrgMarkInfo(
    params: ContactAccountsOption<{
      list: resultObject[];
      type: 1 | 2;
    }>
  ) {
    const { list, type, _account } = params;
    const targetTableName = type === 1 ? this.contactUtil.contactTable : this.contactUtil.orgTable;
    const results = await this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: targetTableName,
        _dbAccount: _account,
      },
      list
    );

    type === 1 &&
      this.sendContactNotify({
        contact_personal: {
          updateDiff: results.map(item => item.id),
        },
        syncStatus: {
          personal: !!results.length,
        },
        _account,
      });
    return results;
  }

  async doGetPersonalMarklistByEmail(emails: string[]) {
    if (!emails?.length) {
      return new Map();
    }
    const modelList = (await this.dbApi.getByRangeCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.personalMarkTable,
      adCondition: {
        type: 'anyOf',
        field: 'emails',
        args: [...new Set(emails)],
      },
    })) as EntityPersonalMark[];

    const modelListFlat = modelList
      .filter(item => typeof item.marked === 'number' && item.marked > 0)
      .map(item =>
        item.emails.map(subEmail => ({
          ...item,
          email: subEmail,
        }))
      )
      .flat();

    const markMap = lodashGroupby(modelListFlat, item => item.email) as Record<string, EntityPersonalMark[]>;

    return new Map(Object.entries(markMap)) as Map<string, EntityPersonalMark[]>;
  }

  /**
   * @deprecated 无效API
   * @param dbName
   * @param list
   */
  async clearTable(dbName: string) {
    return this.dbApi.clear({
      dbName: this.contactUtil.contactDbName,
      tableName: dbName,
    });
  }

  /**
   * @deprecated 无效API
   * @param dbName
   * @param list
   */
  async restoreData(dbName: string, list: resultObject[]) {
    await this.clearTable(dbName);
    this.dbApi.putAll(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: dbName,
      },
      list
    );
  }

  async getTotalLokiData<T = resultObject>(options: ContactAccountsOption<{ tableName: string; enableProxy?: boolean }>): Promise<T[]> {
    const { tableName, enableProxy = true, _account } = options;
    if (typeof tableName !== 'string' || !tableName.length) {
      return [];
    }
    if (!enableProxy) {
      this.contactUtil.forbiddenBridgeOnce();
    }

    return this.dbApi.getByEqCondition({
      dbName: 'contact_search',
      tableName,
      _dbAccount: _account,
    }) as unknown as T[];
  }

  private needComputeMemberNum: Map<string, boolean> = new Map();

  // private oldTotalMemberCount = 0;
  setNeedComputeMemberNum(options: ContactAccountsOption<{ flag: boolean }>) {
    this.needComputeMemberNum.set(options._account, options.flag);
  }

  async triggerComputeEntityOrgMemeberNum(account: string) {
    let needCompute = this.needComputeMemberNum.get(account) || false;
    // 看看-1这个结果下是否有数据
    if (!needCompute) {
      const orgList = await this.dbApi.getByEqCondition({
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.orgTable,
        query: {
          id: '-1',
        },
      });
      const rootMemberNumber = lodashGet(orgList, '[0].memberNum', 0);
      needCompute = typeof rootMemberNumber !== 'number' || rootMemberNumber <= 0;
    }

    if (!needCompute) {
      return;
    }

    // 计算所有的orgContact数据
    const totalOrgContactList = (await this.dbApi.getByEqCondition({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgContactTable,
      query: {
        type: 'enterprise',
      },
    })) as EntityOrgContact[];

    // 如果更新后部门人数和老的部门人数总数一致 跳过计算
    // if (totalOrgContactList.length === this.oldTotalMemberCount) {
    //   return;
    // }

    // 触发计算。获取所有entityOrg数据
    const totalOrgList = await this.dbApi.getByRangeCondition<EntityOrg>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgTable,
      adCondition: {
        type: 'anyOf',
        field: 'type',
        args: [0, 1, 2, 99],
      },
    });

    const orgContactMap: Map<string, number> = new Map();
    const orgTreeMap: Map<string, string[]> = new Map();

    totalOrgList.forEach(item => {
      const { id, parent } = item;

      if (!orgTreeMap.has(parent)) {
        orgTreeMap.set(parent, []);
      }
      orgTreeMap.get(parent)!.push(id);
    });

    totalOrgContactList.forEach(item => {
      const { orgId } = item;
      orgContactMap.set(orgId, (orgContactMap.get(orgId) || 0) + 1);
    });

    // 计算人数信息
    const nodeMemberCountMap = await this.contactUtil.computeEntityOrgMemberCount({
      rootOrgKey: '-2',
      orgContactMap,
      orgTreeMap,
    });

    const needUpdateOrgList: EntityOrg[] = [];
    totalOrgList.forEach(item => {
      const { id, memberNum = 0 } = item;
      const { totalCount } = nodeMemberCountMap.get(id) || { totalCount: 0 };
      if (memberNum === totalCount) {
        return;
      }
      needUpdateOrgList.push({
        ...item,
        memberNum: totalCount,
      });
    });

    // 如果有数据变化执行更新
    if (needUpdateOrgList && needUpdateOrgList.length) {
      await this.dbApi.putAll(
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.orgTable,
        },
        needUpdateOrgList
      );
    }

    // 每次计算完成之后都重置成false
    // this.oldTotalMemberCount = totalOrgContactList.length;
    this.needComputeMemberNum.set(account, false);
  }

  /**
   * 通讯录搜索结果排序
   */
  async sortSearchResult<T>(
    params: ContactAccountsOption<{
      list: T[];
      query: string;
      orderBy: string[];
      useFrequentOrder?: boolean;
      frequentChannel?: string;
      frequentOrderCount?: number;
      handleSameIdType?: 'flatten' | 'replace';
      idKeypath?: string;
    }>
  ): Promise<{
    frequentOrderList: T[];
    defaultOrderList: T[];
  }> {
    const { list, query, orderBy, idKeypath = 'id' } = params;

    const defaultOrderList = util.setDataOrder<T>({
      data: list,
      query,
      orderBy,
    });
    const defaultOrderMap: Map<string, T> = new Map();

    const { frequentChannel = 'mail', frequentOrderCount = 10, _account, handleSameIdType = 'replace' } = params;

    const queryIds: Set<string> = new Set();
    const flattenDataMap: Map<string, T[]> = new Map();
    defaultOrderList.forEach(item => {
      const id = lodashGet(item, `${idKeypath}`, '');
      queryIds.add(util.getUnique(id, frequentChannel));
      defaultOrderMap.set(id, item);
      if (handleSameIdType === 'flatten') {
        if (!flattenDataMap.has(id)) {
          flattenDataMap.set(id, []);
        }

        flattenDataMap.get(id)!.push(item);
      }
    });

    if (!params.useFrequentOrder) {
      const _list: T[] = [];
      defaultOrderMap.forEach((item, id) => {
        if (handleSameIdType === 'flatten' && flattenDataMap.has(id)) {
          _list.push(...flattenDataMap.get(id)!);
          return;
        }
        _list.push(item);
      });

      return {
        frequentOrderList: [] as T[],
        defaultOrderList: _list,
      };
    }

    // 读取DB数据
    const frequentTableRawData = await this.dbApi.getByIds<FrequentContactParams>(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.frequentContactTable,
        _dbAccount: _account,
      },
      [...queryIds]
    );
    const frequentContactList = frequentTableRawData.filter(item => item);
    if (!frequentContactList || !frequentContactList.length) {
      const _list: T[] = [];
      defaultOrderMap.forEach((item, id) => {
        if (handleSameIdType === 'flatten' && flattenDataMap.has(id)) {
          _list.push(...flattenDataMap.get(id)!);
          return;
        }
        _list.push(item);
      });

      return {
        frequentOrderList: [] as T[],
        defaultOrderList: _list,
      };
    }

    const frequentOrderMap: Map<string, T> = new Map();
    const orderList = lodashOrderBy(frequentContactList, ['timestamp', 'sendcount'], ['desc', 'desc']);

    let startIndex = 0;
    // 只取frequentOrderCount条数据
    while (startIndex < Math.min(orderList.length, frequentOrderCount)) {
      const { contactId } = orderList[startIndex];
      frequentOrderMap.set(contactId, defaultOrderMap.get(contactId)!);
      defaultOrderMap.delete(contactId);
      startIndex++;
    }

    const frequentOrderList: T[] = [];
    const _list: T[] = [];
    frequentOrderMap.forEach((item, id) => {
      if (handleSameIdType === 'flatten' && flattenDataMap.has(id)) {
        frequentOrderList.push(...flattenDataMap.get(id)!);
        return;
      }
      frequentOrderList.push(item);
    });

    defaultOrderMap.forEach((item, id) => {
      if (handleSameIdType === 'flatten' && flattenDataMap.has(id)) {
        _list.push(...flattenDataMap.get(id)!);
        return;
      }
      _list.push(item);
    });

    return {
      frequentOrderList,
      defaultOrderList: _list,
    };
  }

  // 查询当期那联系人最近联系次数
  // 三个字段分别是contactId/email/channel(channel表示渠道 mail-写信页.im-IM搜索)
  async queryFrequentContact(params: ContactAccountsOption<{ list: [string, string][] }>) {
    const { list, _account } = params;

    return this.dbApi.getByRangeCondition<FrequentContactParams>({
      dbName: 'contact_dexie',
      tableName: this.contactUtil.frequentContactTable,
      _dbAccount: _account,
      adCondition: {
        type: 'anyOf',
        field: ['contactId', 'channel'],
        args: list,
      },
    });
  }

  // 写入数据
  async putFrequentContact(params: ContactAccountsOption<{ list: FrequentContactParams[] }>) {
    const { list, _account } = params;
    return this.dbApi.putAll(
      {
        dbName: 'contact_dexie',
        tableName: this.contactUtil.frequentContactTable,
        _dbAccount: _account,
      },
      list
    );
  }

  // 清除过期的通讯录数据(一个月以上的通讯录)
  async cleanExpiredFrequentContact(params: ContactAccountsOption<Record<string, unknown>>) {
    const timestamp = dayjs().startOf('day').subtract(30, 'day').valueOf();
    const list = await this.dbApi.getByRangeCondition<FrequentContactParams>({
      dbName: 'contact_dexie',
      tableName: this.contactUtil.frequentContactTable,
      adCondition: {
        type: 'below',
        field: 'timestamp',
        args: [timestamp],
      },
      _account: params._account,
    });

    if (!list || !list.length) {
      return;
    }
    const ids = list.map(item => item.id);
    await this.dbApi.deleteById(
      {
        dbName: 'contact_dexie',
        tableName: this.contactUtil.frequentContactTable,
        _account: params._account,
      },
      ids
    );
  }
}

export const ContactDBInstance = new ContactDB();
