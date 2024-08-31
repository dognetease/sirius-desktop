/* eslint-disable max-lines */
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import dayjs from 'dayjs';
import {
  ContactApi,
  ContactCommonRes,
  contactCondition,
  contactDeleteParams,
  ContactEntityUpdateParams,
  ContactInitModel,
  contactInsertParams,
  ContactOrgOption,
  ContactSearch,
  contactUpdateParams,
  ContactAddRecentParams,
  DeletePersonalOrgParams,
  InsertPersonalOrgRes,
  MemorySearchCondition,
  OrgApi,
  OrgContactCondition,
  OrgIdContactModelMap,
  OrgListOption,
  OrgSearch,
  PersonalContactOption,
  SearchAllContactRes,
  SearchCondition,
  uploadIconParams,
  uploadIconRes,
  RequestContactOrgParams,
  SearchContactMemoryRes,
  recentContactListParams,
  recentContactListRes,
  SearchContactMermoryTableRes,
  DelMailListParams,
  MailListMember,
  GetMailListParams,
  GetEmailDatatParams,
  ContactDataFrom, // 查看邮件列表成员
  CustomerUpdatePushMsg, // 查看邮件列表成员
  ContactPersonalMarkSimpleModel,
  ContactItem,
  OrgItem,
  ContactOrgItem,
  contactTableNames,
  PersonalImportParams,
  PersonalExportParams,
  ContactAccountsOption,
  ContactAccountsOptionWithPartial,
  PersonalOrgParams,
  FrequentContactParams,
} from '@/api/logical/contactAndOrg';
import { api } from '@/api/api';
import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import { DataStoreApi } from '@/api/data/store';
import ContactSelectNotify, { ContactSelectProxy } from './contact_select_notify';
import {
  Api,
  ApiLifeCycleEvent,
  CatchErrorRes,
  ContactModel,
  EntityContact,
  EntityContactItem,
  EntityOrg,
  EntityOrgTeamContact,
  EntityPersonalOrg,
  EntityPersonalOrgContact,
  EntityTeamOrg,
  identityObject,
  OrgContactModel,
  OrgModel,
  OrgModel2,
  resultObject,
  SearchTeamOrgModel,
  YunxinContactModel,
  EntityPersonalMark,
  ContactInfoType,
  ContactMemoryModel,
  ContactId,
} from '@/api/_base/api';
import { apis, inWindow, getShouldInitMemoryDBInMainPage } from '@/config';
import { personalRegexp, util } from '@/api/util/index';
import { ContactDB, ContactDBInstance } from './contact_dbl';
import { ContactServer, ContactServerInstance } from './contact_server';
import { DataTrackerApi, LoggerApi } from '@/api/data/dataTracker';
import { ErrorReportApi } from '@/api/data/errorReport';
import { SequenceHelper } from '@/api/commonModel';
import { ErrResult } from '@/api/errMap';
import { MailApi, MailBoxEntryContactInfoModel, MemberType } from '@/api/logical/mail';
import { NIMApi } from '@/api/logical/im';
import { PerformanceApi } from '@/api/system/performance';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { DbApiV2, QueryConfig } from '@/api/data/new_db';
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
import { ContactEdmHelper, ContactEdmHelperInstance } from './contact_edm_help';
import { ContactPersonalHelper, ContactPersonalHelperInstance } from './contact_personal_help';
import { locationHelper } from '@/api/util/location_helper';
import { AccountApi } from '@/api/logical/account';
import { CustomerOrgSearch, CustomerEmailModelRes, CustomerSearchContactMemoryRes, CustomerContactSearch } from '@/api/logical/contact_edm';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { ContactTransform, ContactTransformInstance } from './contact_transform';
import { EventApi, SystemEvent } from '@/api/data/event';
import { ContactSync, ContactSyncInstance } from './contact_sync';
import { SubAccountTableModel } from '@/api/data/tables/account';
import { MailPlusCustomerApi, SearchCustomerRes } from '@/api/logical/mail_plus_customer';
import { ISubAccountEventData } from '@/api/logical/login';
import { contactHealthDetectHelper } from './contact_healthdetect_helper';

class Action {
  searchContactSeq: number;

  searchSeqGen: SequenceHelper;

  constructor() {
    this.searchSeqGen = new SequenceHelper();
    this.searchContactSeq = this.searchSeqGen.next();
  }
}

export class ContactImplApi implements ContactApi, OrgApi {
  static inited = false;

  name: string;

  systemApi = api.getSystemApi();

  eventApi: EventApi = api.getEventApi();

  protected dbApi: DbApiV2 = api.getNewDBApi();

  http: DataTransApi;

  store: DataStoreApi;

  mailApi: MailApi;

  loggerApi: LoggerApi;

  dataTracker: DataTrackerApi;

  errorReportImpl: ErrorReportApi;

  nimApi: NIMApi;

  performanceApi: PerformanceApi;

  productApi: ProductAuthApi;

  accountApi: AccountApi;

  mailPlusCustomerApi: MailPlusCustomerApi;

  initData: ContactInitModel = {
    orgs: {},
    personal: [],
  };

  action: Action = new Action();

  contactDB: ContactDB = ContactDBInstance;

  contactServer: ContactServer = ContactServerInstance;

  contactSync: ContactSync = ContactSyncInstance;

  contactSelectNotify: ContactSelectProxy = ContactSelectNotify;

  contactEdmHelper: ContactEdmHelper = ContactEdmHelperInstance;

  contactUtil: ContactConst = ContactUtilInterface;

  contactTrans: ContactTransform = ContactTransformInstance;

  contactPersonalHelper: ContactPersonalHelper = ContactPersonalHelperInstance;

  private subAccountEventHandler: undefined | number = 0;

  private contactHealthDetectHelper = contactHealthDetectHelper;

  // 控制是否使用新的搜索方式
  // private useNewContactSearch = true;

  constructor() {
    this.name = apis.contactApiImpl;
    this.store = api.getDataStoreApi();
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.http = api.getDataTransApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.dataTracker = api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
    this.errorReportImpl = api.requireLogicalApi('errorReportImpl') as ErrorReportApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
    this.nimApi = api.requireLogicalApi(apis.imApiImpl) as NIMApi;
    this.performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
    this.productApi = api.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;
    this.mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
  }

  // closeNewContactSearch() {
  //   this.useNewContactSearch = false;
  // }

  // #region ---------------- 个人通讯录 ----------------

  /**
   * 获取分组列表
   * @param params
   */
  async doGetPersonalOrg(params: ContactAccountsOptionWithPartial<PersonalOrgParams>): Promise<ContactCommonRes<EntityPersonalOrg[]>> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doGetPersonalOrg({
      ...params,
      _account,
    });
  }

  /**
   * 添加分组
   * @param name
   * @param idList
   */
  doInsertPersonalOrg(
    params: ContactAccountsOptionWithPartial<{ groupName: string; idList?: string[]; isMark?: boolean }>
  ): Promise<ContactCommonRes<InsertPersonalOrgRes>> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doInsertPersonalOrg({
      ...params,
      _account,
    });
  }

  /**
   * 编辑分组
   * @param orgId: 分组id
   * @param name: 分组名称
   * @param idList
   */
  doUpdatePersonalOrg(params: ContactAccountsOptionWithPartial<{ orgId: string; groupName: string; idList: string[]; isMark?: boolean }>): Promise<ContactCommonRes> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doUpdatePersonalOrg({
      ...params,
      _account,
    });
  }

  /**
   * 给分组新增联系人
   * @param orgIdList
   * @param idList
   */
  async doInsertContactByPersonalOrgId(params: ContactAccountsOption<{ orgIdList: string[]; idList: string[] }>): Promise<ContactCommonRes> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doInsertContactByPersonalOrgId({
      ...params,
      _account,
    });
  }

  /**
   * 删除分组
   * @param params
   */
  async doDeletePersonalOrg(params: ContactAccountsOption<DeletePersonalOrgParams>): Promise<ContactCommonRes> {
    return this.contactPersonalHelper.doDeletePersonalOrg(params);
  }

  /**
   * @deprecated: 目前来看无人调用
   * 通过分组获取分组关联关系
   * @param id
   */
  async doGetPersonalOrgContactByOrgId(params: ContactAccountsOption<{ id: string | string[] }>): Promise<ContactCommonRes<Record<string, EntityPersonalOrgContact[]>>> {
    return this.contactPersonalHelper.doGetPersonalOrgContactByOrgId(params);
  }

  /**
   * 获取个人通讯录中无分组数据
   */
  async doGetPersonalNoGroupContact(_account?: string): Promise<ContactModel[]> {
    const list = await this.doGetPersonalContact({ _account });
    const res: ContactModel[] = [];
    list?.forEach(item => {
      if (!item?.contact?.personalOrg?.length) {
        res.push(item);
      }
    });
    return res;
  }

  /**
   * 获取个人通讯录列表
   * params option.isIM 是否处理im数据
   */
  async doGetPersonalContact(option?: PersonalContactOption): Promise<ContactModel[]> {
    try {
      option = option || {};
      const { showDisable = false, isIM, needLog, _account = this.contactUtil.getCurrentAccount() } = option;
      const contactList = await this.contactDB.getContactList({
        contactType: 'personal',
        isIM,
        showDisable,
        _account,
        needLog,
      });
      const ret = await this.contactDB.handleContactList({ contactList });
      return ret;
    } catch (e) {
      console.warn('[contact] personal', e);
      return [];
    }
  }

  /**
   * 更新个人联系人
   * @param params
   */
  async doUpdateContact(_params: ContactAccountsOptionWithPartial<{ params: contactUpdateParams }>): Promise<CatchErrorRes<ContactModel[]>> {
    const _account = _params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doUpdateContact({
      ..._params,
      _account,
    });
  }

  /**
   * 删除个人联系人
   * @param params
   */
  async doDeleteContact(params: ContactAccountsOptionWithPartial<contactDeleteParams>): Promise<boolean> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';

    return this.contactPersonalHelper.doDeleteContact({
      ...params,
      _account,
    });
  }

  /**
   * 新增个人联系人
   * @param params
   */
  async doInsertContact(params: ContactAccountsOptionWithPartial<{ list: contactInsertParams | contactInsertParams[] }>): Promise<CatchErrorRes<ContactModel[]>> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactPersonalHelper.doInsertContact({
      ...params,
      _account,
    });
  }

  doGetOrgContactListByContactId(idList: ContactId[]): Promise<Array<OrgContactModel>> {
    return this.contactDB.getOrgContactList({
      idList,
      type: 'contactId',
      needContactData: false,
      filterSelf: false,
      needContactModelData: false,
    }) as Promise<Array<OrgContactModel>>;
  }

  /**
   * 更新联系人头像
   * @param params 头像文件
   * @returns 组织详情列表
   */
  async uploadIcon(params: uploadIconParams): Promise<uploadIconRes> {
    return this.contactServer.uploadIcon(params);
  }

  async deleteAvatarIcon() {
    return this.contactServer.deleteAvartIcon();
  }

  /**
   * 导入个人联系人
   * @param params：联系人分组id，文件格式，
   * @returns 是否成功
   */
  async doImportPersonalContact(params: PersonalImportParams) {
    return this.contactPersonalHelper.importPersonalContact(params);
  }

  /**
   * 导出个人联系人
   * @param params 联系人分组id，文件格式
   * @returns 下载地址
   */
  async doExportPersonalContact(params: PersonalExportParams) {
    return this.contactPersonalHelper.exportPersonalContact(params);
  }

  /**
   * 导出个人联系人模板
   * @param params
   * @returns 下载地址
   */
  async doExportPersonalContactTemplate(type?: 1 | 2) {
    return this.contactPersonalHelper.exportPersonalContactTemplate(type);
  }

  // #endregion

  // #region ---------------- 通讯录操作获取 ----------------

  async doGetBKContactReady() {
    return this.contactSync.getContactReady();
  }

  async doGetContactReadySync(source?: 'enterprise' | 'org' | 'personal' | 'personalOrg') {
    try {
      const status = await this.contactDB.detectTempContactSyncStatusWithMemory(source);
      return status !== 'none';
    } catch (ex) {
      return false;
    }
  }

  doGetLocalContactReady() {
    if (locationHelper.isFrontPage()) {
      this.contactDB.detectCoreEnterpriseHasData({}).then(status => this.contactSync.setContactReady(status !== 'none'));
      // this.doGetBKContactReady().then(ready => {
      //   this.contactSync.setContactReady(ready);
      // });
    }
    return this.contactSync.getContactReady();
  }

  doGetContactLastUpdateTime(_account?: string) {
    return this.contactDB.getContactLastUpdateTime(_account);
  }

  /**
   * @deprecated:无人调用1.27版本之后废弃
   * 通过组织id获取组织与人的关联关系，主要用来获取群信息
   * @param idList
   * @param _account
   */
  doGetOrgContactListByOrgId(idList: string[], _account = this.contactUtil.getCurrentAccount()) {
    return this.contactDB.getOrgContactListByOrgId(idList, _account);
  }

  /**
   * 根据邮箱获取联系人
   * @param _emails
   * @param type
   * @returns
   */
  async doGetContactByEmails(_emails: { mail: string; contactName?: string }[] = [], type: MemberType): Promise<MailBoxEntryContactInfoModel[]> {
    const rawContacts = _emails.map(({ mail, contactName = '' }) =>
      this.mailApi.buildRawContactItem({
        item: mail,
        email: mail,
        type,
        name: contactName,
      })
    );
    const emails = _emails.map(({ mail }) => mail);
    try {
      const contactsEntity = await this.doGetContactByItem({
        type: 'EMAIL',
        value: emails,
      });
      /** 解决顺序问题 */
      const dbContacts = contactsEntity.reduce((acc, item) => {
        const { avatar, contactName } = item.contact;
        const _index = emails.indexOf(item.contact.accountName);
        if (_index !== -1) {
          const _contact = acc[_index].contact;
          acc[_index] = {
            ...acc[_index],
            contact: {
              ..._contact,
              contact: {
                ..._contact.contact,
                // accountName: item.accountName,
                contactName,
                avatar,
              },
            },
            inContactBook: true,
          };
        }
        return acc;
      }, rawContacts);
      return dbContacts.length > 0 ? dbContacts : rawContacts;
    } catch (error) {
      console.warn(error);
      return rawContacts;
    }
  }

  /**
   * 获取当前联系人同步次数
   * @returns 联系人同步次数
   */
  getContactSyncTimes(): number {
    return this.contactDB.contactSyncTimes;
  }

  /**
   * 获取当前同步状态
   * @returns 是否在同步当中
   */
  getContactSyncState(type: 'contact' | 'customer' | 'colleague' = 'contact'): boolean {
    if (type === 'contact') {
      // 如果是临时禁用 表示数据正在同步中
      return false;
    }
    if (type === 'customer') {
      return this.contactSync.isSyncCustomer;
    }
    return this.contactSync.isSyncColleague;
  }

  /**
   * 获取组织
   * @param option
   * @returns
   */
  async doGetContactOrg(option?: ContactOrgOption): Promise<OrgModel> {
    const { orgId, level, showDisable = false, isIM, needLog, _account = this.contactUtil.getCurrentAccount() } = option || {};
    try {
      const orgAllList = await this.contactDB.getOrgList({
        isIM,
        showDisable,
        needLog,
        _account,
      });
      if (orgAllList?.length) {
        const orgAllMap = util.listToMap<EntityOrg>(orgAllList, 'id');
        return this.contactTrans.transformOrgData({
          orgId,
          level,
          orgAllList,
          orgAllMap,
        });
      }
      console.error('[contact] doGetContactOrg orgTable is null');
      return {
        org: {} as EntityOrg,
        children: [],
        orgList: [],
      };
    } catch (error) {
      console.error('[contact] doGetContactOrg error', error);
      return Promise.reject(error);
    }
  }

  async doGetContactOrgMap(params?: { showDisable?: boolean; isIM?: boolean; _account?: string }): Promise<OrgModel2> {
    const { showDisable = false, isIM, _account = this.contactUtil.getCurrentAccount() } = params || {};
    // const mainCompanyId = this.contactUtil.getCurrentCompanyId();

    const list = await this.contactDB.getOrgList({
      showDisable,
      _account,
      isIM,
    });
    const result: OrgModel2 = {};
    if (!list?.length) {
      return {};
    }
    const allOrgIdMap = new Map<string, Map<string, EntityOrg>>();
    const orgMap = new Map<string, EntityOrg>();
    list.forEach(item => {
      const orgId = item.id;
      // 如果创建org数据的时候当前企业的enterpriseid还没有拿到 parentId可能会=`${mainCompanyId}_-1`
      // 将xxx_-1 和-1两种数据进行融合
      // const parentOrgId = (item.parent === '-1' || item.parent === `${mainCompanyId}_-1`) ? '-1' : item.parent;
      const parentOrgId = item.parent;

      const parentOrgMap = allOrgIdMap.get(parentOrgId) || new Map<string, EntityOrg>();
      parentOrgMap.set(orgId, item);
      allOrgIdMap.set(parentOrgId, parentOrgMap);
      orgMap.set(orgId, item);
    });
    allOrgIdMap.forEach((item, id) => {
      const children: EntityOrg[] = [];
      const orgList: EntityOrg[] = [];
      item.forEach((model, orgId) => {
        children.push(model);
        const curOrgMap = allOrgIdMap.get(orgId) || new Map<string, EntityOrg>();
        orgList.push(model, ...curOrgMap.values());
      });
      result[id] = {
        children,
        orgList,
      };
    });
    return result;
  }

  /**
   * * @deprecated:无人调用 1.27版本之后废弃
   * @Description: 获取组织结构
   * @param orgId :组织id，
   * @param level :需要搜索的层级
   * */
  doGet(orgId?: string, level?: number): Promise<OrgModel> {
    return this.doGetContactOrg({
      orgId,
      level,
    });
  }

  async doGetContactByQiyeAccountId(query: { idList: string[]; domain?: string; _account?: string; enablePutLocal?: boolean }): Promise<ContactModel[]> {
    const list = await this.contactServer.getContactByQiyeAccountId(query);

    const needDetectIds = list.filter(item => item.contact.accountStatus === 0);
    this.contactHealthDetectHelper.shouldUpdateContact(needDetectIds);

    return list;
  }

  /**
   * 获取通讯录详情
   * @param id
   */
  async doGetContactById(id: string | string[], _account = this.contactUtil.getCurrentAccount()): Promise<ContactModel[]> {
    const _idList = util.singleToList(id);
    if (!_idList.length) {
      return [];
    }
    let serverData: ContactModel[] = [];
    let dbData: ContactModel[] = [];
    let idList: string[] = [];
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      const qiyeAccountIdList: string[] = [];
      _idList.forEach(item => {
        if (item) {
          if (!personalRegexp.test(item)) {
            qiyeAccountIdList.push(item);
          } else {
            idList.push(item);
          }
        }
      });
      if (qiyeAccountIdList.length) {
        serverData = await this.contactServer.getContactByQiyeAccountId({ idList: qiyeAccountIdList, _account });
      }
    } else {
      idList = _idList;
    }
    if (idList.length) {
      const contactList = await this.contactDB.getContactList({ idList, _account, needOrder: false });
      dbData = await this.contactDB.handleContactList({
        orderByIdList: idList,
        contactList,
        needOrgData: true,
        _account,
      });
    }
    return [...serverData, ...dbData];
  }

  async doGetOrgList(option: OrgListOption = {}): Promise<EntityOrg[]> {
    try {
      let orgIdList;
      let typeList;
      let originIdList;
      if (option.idList) {
        orgIdList = util.singleToList(option.idList);
      }
      if (option.typeList) {
        typeList = util.singleToList(option.typeList);
      }
      if (option.originIdList) {
        originIdList = util.singleToList(option.originIdList);
      }
      const orgList = await this.contactDB.getOrgList({
        idList: orgIdList,
        typeList,
        originIdList,
        showDisable: option.showDisable || false,
        _account: option._account || this.systemApi.getCurrentUser()?.id || '',
      });
      return orgList;
    } catch (err) {
      console.error('[contact] doGetOrgList error', err);
      return Promise.reject(err);
    }
  }

  async doGetTeamList(list: string[]): Promise<EntityTeamOrg[]> {
    try {
      const teamList = await this.contactDB.getTeamListById(list);
      return teamList;
    } catch (err) {
      console.error('[contact] doGetTeamList error', err);
      return Promise.reject(err);
    }
  }

  /**
   * 通过组织id获取组织下的联系人
   * @param orgIdList
   * @param _account
   * @return 请求的id为key map
   */
  private async doGetContactByOrgIds(orgIdList: string[], _account = this.contactUtil.getCurrentAccount()): Promise<OrgIdContactModelMap> {
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      const { orgMap } = await this.contactServer.doGetContactByOrgId({ orgId: orgIdList, _account });
      return orgMap;
    }
    const ret = orgIdList.reduce((obj, orgId) => {
      obj[orgId] = [];
      return obj;
    }, {} as OrgIdContactModelMap);
    const orgContactList = await this.contactDB.getOrgContactListByOrgId(orgIdList, _account);
    if (!orgContactList || orgContactList.length === 0) {
      return ret;
    }
    const res: Record<string, EntityOrgTeamContact[]> = {};
    const idSet = new Set<string>();
    orgContactList.forEach(item => {
      idSet.add(item.contactId);
      const orgContactIds = res[item.orgId] || [];
      orgContactIds.push(item);
      res[item.orgId] = orgContactIds;
    });
    const idList = [...idSet];
    const [contactList, contactItemList] = await Promise.all([
      this.contactDB.getContactList({
        idList,
        showDisable: false,
        _account,
      }),
      this.contactDB.getContactItemListByContactId({ idList, _account }),
    ]);
    const contactIdMap = util.listToMap<EntityContact>(contactList, 'id');
    const contactInfoIdMap = util.listToMapValueList<EntityContactItem>(contactItemList, 'contactId');

    Object.keys(ret).forEach(orgId => {
      const curOrgContactList = res[orgId];
      if (curOrgContactList?.length) {
        const list = util.setDataOrder<EntityOrgTeamContact>({
          data: curOrgContactList,
          orderBy: [['rankNum', false], 'contactId'],
        });
        const orderByIdList = util.getKeyListByList<string>(list, 'contactId');
        const modelList = this.contactTrans.transformContactModel({
          orderByIdList,
          contactIdMap,
          contactInfoIdMap,
        });
        ret[orgId] = modelList;
      }
    });
    return ret;
  }

  /**
   * 通过组织id获取组织下的联系人
   * @param orgIdList
   * @param _account
   * @return 查询到的数据的集合 list
   */
  async doGetContactByOrgId(params: ContactAccountsOption<RequestContactOrgParams>): Promise<ContactModel[]> {
    const { orgId = '', showDisable, _account = this.contactUtil.getCurrentAccount() } = params;
    // 所有联系人特殊处理
    if (!orgId || orgId === this.contactUtil.StaticNodeKey.PERSON_ALL) {
      return this.doGetPersonalContact({ showDisable, _account });
    }
    if (orgId === this.contactUtil.StaticNodeKey.PERSON_NO_GROUP) {
      return this.doGetPersonalNoGroupContact(_account);
    }
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      const { orgMap, uniqueList } = await this.contactServer.doGetContactByOrgId(params);
      if (Array.isArray(orgId)) {
        return uniqueList;
      }
      return orgMap[orgId];
    }
    try {
      if (Array.isArray(orgId)) {
        return this.doGetUniqueContactByOrgId({ orgIdList: orgId, _account, showDisable });
      }
      const res = await this.doGetContactByOrgIds([orgId], _account);
      const list = res[orgId];
      return list;
    } catch (e) {
      console.error('[contact_impl] doGetContactByOrgId error', e);
      return [];
    }
  }

  transContactModel2ContactItem(item: ContactModel): ContactItem {
    return this.contactUtil.transContactModel2ContactItem(item);
  }

  /**
   * 通过组织id获取通讯录id,多个部门下的通讯录的人只取一次
   * @param orgIdList 组织id
   * @param _account
   */
  private async doGetUniqueContactByOrgId({ orgIdList = [], showDisable = false, _account = this.contactUtil.getCurrentAccount() }: any): Promise<ContactModel[]> {
    let contactList: EntityContact[] = [];
    const orgContactList = await this.contactDB.getOrgContactListByOrgId(orgIdList, _account);
    if (!orgContactList || orgContactList.length === 0) {
      contactList = [];
    } else {
      const idList = util.getKeyListByList<string>(orgContactList, 'contactId', true);
      if (!idList.length) {
        return [];
      }
      contactList = await this.contactDB.getContactList({
        idList,
        showDisable,
        _account,
      });
    }
    if (contactList.length === 0) {
      return [];
    }
    return this.contactDB.handleContactList({
      contactList,
      _account,
    });
  }

  async getServerAndLocalContactByEmails(emails: string[], _account?: string): Promise<ContactModel[]> {
    const [enterpriseData, personalData] = await Promise.all([
      this.contactServer.doGetContactByEmails(emails, _account),
      this.contactDB.getPersonalContactByEmails(emails, _account),
    ]);
    return [...enterpriseData, ...personalData];
  }

  /**
   * 通过contactItem 反查询 contact数据
   * @param condition
   */
  async doGetContactByItem(_condition: contactCondition): Promise<ContactModel[]> {
    const isContactReady = await this.doGetContactReadySync();

    try {
      const condition = { ..._condition, _account: _condition._account || this.contactUtil.getCurrentAccount() };
      const { isIM, value, showDisable, filterType, type } = condition;
      let contactModelList: ContactModel[] = [];
      if (!isContactReady) {
        const accounts = util.singleToList(value) as string[];
        if (type === 'yunxin') {
          contactModelList = await this.contactServer.doGetContactByYunxin(accounts, condition._account);
        } else if (type === 'EMAIL') {
          contactModelList = await this.getServerAndLocalContactByEmails(accounts, condition._account);
        }
      } else {
        contactModelList = (await this.contactDB.getContactByItem(condition)) as ContactModel[];
      }
      const filterContactModelList: ContactModel[] = [];
      contactModelList.forEach(item => {
        const imFlag = !isIM || (isIM && item.contact.enableIM);
        const visibleFlag = !showDisable || (showDisable && item.contact.visibleCode === 0);
        const typeFlag = !filterType || (filterType && item.contact.type === filterType);
        if (imFlag && visibleFlag && typeFlag) {
          filterContactModelList.push(
            util.addHitQuery({
              data: item,
              queryList: value as string[],
              hitList: [['contactInfo', 'contactItemVal']],
            })
          );
        }
      });
      return filterContactModelList;
    } catch (e) {
      console.error('[contact] doGetContactByItem error:', e);
      return [] as ContactModel[];
    }
  }

  doGetVaildEmailByContact(pre: ContactModel, cur: ContactModel, isMainAccount?: boolean): ContactModel {
    return this.contactUtil.getValidEmail(pre, cur, isMainAccount);
  }

  /**
   * 通过邮箱获取联系人数据
   * @param params
   * @return 返回结果以参数要求
   */
  async doGetContactByEmailsAdvance(params: GetEmailDatatParams): Promise<{
    listRes: ContactModel[];
    mapRes: Record<string, ContactModel[]>;
  }> {
    const { emails, needGroup = true, _account, useLx = true, useData } = params;
    const startTime = Date.now();

    console.time('[contact_edm] doGetContactByEmailsAdvance');
    const [data, edmData] = await Promise.all([
      useLx ? this.doGetContactByEmail({ emails, _account, useData }) : Promise.resolve({} as Record<string, ContactModel[]>),
      Promise.resolve({ modelRes: {}, modelListRes: {} } as CustomerEmailModelRes),
    ]);
    const mapRes: Record<string, ContactModel[]> = {};
    let listRes: ContactModel[] = [];
    const isSubAccount = inWindow() && window.isAccountBg;
    emails.forEach(item => {
      const edmMailMap = !isSubAccount ? edmData.modelRes : {};
      const edmMailListMap = edmData.modelListRes;
      const lxEmailData: ContactModel[] = data[item] || [];
      if (!isSubAccount && (edmMailMap[item] || edmMailListMap[item])) {
        if (needGroup) {
          mapRes[item] = [...lxEmailData, ...edmMailListMap[item]];
        } else {
          let displayEmailData: ContactModel = edmMailMap[item];
          lxEmailData.forEach(model => {
            if (!displayEmailData) {
              displayEmailData = model;
            } else {
              displayEmailData = this.doGetVaildEmailByContact(displayEmailData, model, !isSubAccount);
            }
          });
          if (displayEmailData) {
            listRes = listRes.concat(displayEmailData);
          }
        }
      } else if (needGroup) {
        mapRes[item] = lxEmailData;
      } else {
        listRes = listRes.concat(lxEmailData);
      }
    });
    console.timeEnd('[contact_edm] doGetContactByEmailsAdvance');
    const endTime = Date.now();

    // 超过3s打一个点
    if (endTime - startTime > 3 * 1000) {
      const iscontactready = await this.contactDB.detectCoreEnterpriseHasData({});
      this.dataTracker.track('pc_getcontactbyemail_performance', {
        _account: params._account,
        iscontactready,
        duration: endTime - startTime,
        count: emails && emails.length ? emails.length : 0,
        purecount: new Set(emails).size,
        reslen: listRes.length,
      });
      this.loggerApi.track('pc_getcontactbyemail_performance_detail', {
        params,
        listCount: listRes.length,
        mapResCount: Object.keys(mapRes).length,
      });
    }

    console.log('[contact_edm] doGetContactByEmailsAdvance', params, {
      listRes,
      mapRes,
    });
    return {
      listRes,
      mapRes,
    };
  }

  private getShouldUseMemorySearch() {
    if (window.isBridgeWorker) {
      return false;
    }
    const shouldUseMemoryDBInMainPage = getShouldInitMemoryDBInMainPage();
    return shouldUseMemoryDBInMainPage;
  }

  /**
   * 通过邮箱获取联系人信息
   * @param emails
   * @param _account
   * @return 返回结果以email 为key， 一个邮箱可对应多个联系人
   */
  async doGetContactByEmail({ emails, _account }: { emails: string[]; _account?: string; useData?: ContactDataFrom }): Promise<Record<string, ContactModel[]>> {
    const shouldUseMemorySearch = this.getShouldUseMemorySearch();
    if (shouldUseMemorySearch) {
      try {
        const res = await this.doGetContactByEmailInMemoryMode({
          emails,
          _account,
        });
        return res;
      } catch (ex) {
        console.warn('[contact.doGetContactByEmail]Error.memory', ex);
      }
    }
    let contactModelList: ContactModel[] = [];
    const isContactReady = await this.doGetContactReadySync();
    const duplicateEmails = [...new Set(emails)];
    if (!isContactReady) {
      contactModelList = await this.contactServer.doGetContactByEmails(duplicateEmails, _account);
    } else {
      contactModelList = (await this.contactDB.getContactByItem({
        type: 'EMAIL',
        value: duplicateEmails,
        _account,
      })) as ContactModel[];
    }
    const contactMap: Map<string, ContactModel> = new Map();
    const emailIdMap: Map<string, Set<string>> = new Map();
    // 执行遍历
    contactModelList.forEach(_item => {
      contactMap.set(_item.contact.id, _item);
      _item.contactInfo.forEach(info => {
        if (info.contactItemType !== 'EMAIL') {
          return;
        }
        const _email = info.contactItemVal?.toLocaleLowerCase();

        const idSet = emailIdMap.get(_email) || new Set();
        idSet.add(_item.contact.id);

        emailIdMap.set(_email, idSet);
      });
    });
    const res: Record<string, ContactModel[]> = {};
    duplicateEmails.forEach(email => {
      const _email = email.toLocaleLowerCase();
      if (!emailIdMap.has(_email)) {
        res[email] = [];
        return;
      }
      const list: ContactModel[] = [];
      emailIdMap.get(_email)!.forEach(id => {
        const contact = contactMap.get(id)!;
        if (!contact) {
          return;
        }

        if (contact.contact.type !== 'personal') {
          list.push(contact);
          return;
        }

        const contactCopy = cloneDeep(contact);
        contactCopy.contact.hitQueryEmail = _email;
        list.push(contactCopy);
      });
      res[email] = list;
    });
    this.contactSelectNotify.addRecentSelectContactMap(contactModelList);
    return res;
  }

  /**
   * 在后台内存模式下通过邮箱获取联系人(失败之后在前台的兜底方法是doGetContactByEmail)
   * @param emails
   * @param _account
   * @return 返回结果以email 为key， 一个邮箱可对应多个联系人
   */

  async doGetContactByEmailInMemoryMode(params: { emails: string[]; _account?: string; useData?: ContactDataFrom }): Promise<Record<string, ContactModel[]>> {
    // const { emails, _account, useData = 'memory' } = params;
    const { emails, _account } = params;
    // if (useData === 'db' && (window.isBridgeWorker || window.isAccountBg)) {
    //   return this.doGetContactByEmail(params);
    // }
    const masterAccount = this.contactUtil.getCurrentAccount();
    const account = _account || masterAccount;

    if (!emails.length) {
      return {};
    }

    const [dbCount, memoryCount] = await Promise.all([
      this.contactDB.getTableCount({
        tableName: 'contact',
        dbName: 'contact_dexie',
        _account: params._account || this.systemApi.getCurrentUser()?.id || '',
      }),
      this.contactDB.getTableCount({
        tableName: 'contact',
        dbName: 'contact_search',
        _account: params._account || this.systemApi.getCurrentUser()?.id || '',
      }),
    ]);

    // 只要DB数据比内存数据大 就抛出异常走兜底逻辑
    if (dbCount > memoryCount) {
      throw new Error('memory_miss');
    }

    const duplicateEmails = [...new Set(emails)];

    const contactModelList: Map<string, ContactModel> = new Map();
    const contactEmailModel: Map<string, Set<string>> = new Map();

    const contactMemoryModelList = await this.contactDB.getContactsInMemoryMode({
      fields: duplicateEmails,
      _account,
    });

    const contactModelMap: Map<string, ContactMemoryModel[]> = new Map(Object.entries(groupBy(contactMemoryModelList, item => item.id)));

    contactModelMap.forEach((list, contactId) => {
      let contactObj: EntityContact | undefined;
      const contactInfoList: EntityContactItem[] = [];

      list.forEach(item => {
        const masterEmail = item.hitQueryEmail || item.accountName;

        const contactIdList = contactEmailModel.get(masterEmail) || new Set();

        contactIdList.add(contactId);
        contactEmailModel.set(masterEmail, contactIdList);

        if (item.isDefault || list.length <= 1) {
          contactObj = {
            id: item.id,
            accountStatus: 0,
            accountVisible: 1,
            contactLabel: item.contactPYLabelName.slice(0, 1) || '',
            contactPYLabelName: item.contactPYLabelName,
            contactPYName: item.contactPYName,
            contactName: item.contactName,
            accountName: item.accountName,
            // hitQueryEmail: item.hitQueryEmail,
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
          } as unknown as EntityContact;
        }
        contactInfoList.push({
          id: '',
          contactItemVal: item.hitQueryEmail || item.accountName,
          contactItemRefer: '',
          contactItemType: 'EMAIL',
          isDefault: item.isDefault,
          type: item.type,
          contactId: item.id,
          emailType: 1,
        } as unknown as EntityContactItem);
      });

      contactModelList.set(contactId, {
        contact: contactObj!,
        contactInfo: contactInfoList,
        _account: account,
      });
    });
    const res: Record<string, ContactModel[]> = {};
    duplicateEmails.forEach(email => {
      const _email = email.toLocaleLowerCase();
      if (!contactEmailModel.has(_email)) {
        res[email] = [];
        return;
      }
      const list: ContactModel[] = [];
      contactEmailModel.get(_email)!.forEach(id => {
        const contact = contactModelList.get(id)!;
        if (!contact) {
          return;
        }

        if (contact.contact.type !== 'personal') {
          list.push(contact);
          return;
        }
        // 如果一个非主邮箱也能命中contactModel 要给当前contact加一个hitQueryEmail
        const contactCopy = cloneDeep(contact);
        contactCopy.contact.hitQueryEmail = _email;
        list.push(contactCopy);
      });
      res[email] = list;
    });
    return cloneDeep(res);
  }

  /**
   * 通过邮箱获取联系人信息
   * @param emails
   * @param _account
   * @params 返回结果以email 为key， 一个邮箱可对应1个联系人 (多个联系人返回最高匹配级别的)
   */
  async doGetContactByEmailFilter({ emails, _account }: { emails: string[]; _account?: string }): Promise<Record<string, ContactModel>> {
    let contactModelList: ContactModel[] = [];
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      contactModelList = await this.getServerAndLocalContactByEmails(emails, _account);
    } else {
      contactModelList = await this.contactDB.getContactByItem({
        type: 'EMAIL',
        value: emails,
        _account,
      });
    }
    const res: Record<string, ContactModel> = {};
    const contactMap: Record<string, ContactModel> = {};
    contactModelList.forEach(item => {
      item.contactInfo.forEach(info => {
        if (info.contactItemType === 'EMAIL') {
          const infoEmail = info.contactItemVal.toLocaleLowerCase();
          const model = contactMap[infoEmail];
          if (model) {
            contactMap[infoEmail] = this.contactUtil.getValidModel(model, item);
          } else {
            contactMap[infoEmail] = item;
          }
        }
      });
    });
    emails.forEach(email => {
      const model = contactMap[email.toLocaleLowerCase()] || contactMap[email];
      if (model) {
        res[email] = model;
      }
    });
    this.contactSelectNotify.addRecentSelectContactMap(contactModelList);
    return res;
  }

  /**
   * 通过云信返回联系人信息
   * @param accounts
   * @param showDisabled 是否展示在通讯录列表中没有展示的联系人
   */
  async doGetContactByYunxin(accounts: string[]): Promise<YunxinContactModel> {
    let needRequestAccounts: string[] = [];
    let contactModelList: ContactModel[] = [];
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      contactModelList = await this.contactServer.doGetContactByYunxin(accounts);
      return {
        needRequestAccounts,
        contactModelList,
      };
    }
    try {
      const contactList = await this.contactDB.getContactByYunxin(accounts, false);
      const idList = util.getKeyListByList<string>(contactList, 'id');
      const contactItemList = await this.contactDB.getContactItemListByContactId({ idList });
      accounts.forEach(account => {
        const contactItem = contactItemList.find(item => item.contactItemVal === account);
        if (contactItem) {
          const contactInfo = contactItemList.filter(item => item.contactId === contactItem.contactId);
          const contact = contactList.find(item => item.id === contactItem.contactId);
          if (contact) {
            contact.color = util.getColor(contact.accountName);
            contactModelList.push({
              contact,
              contactInfo,
            });
          } else {
            needRequestAccounts.push(account);
          }
        } else {
          needRequestAccounts.push(account);
        }
      });
      if (contactModelList.length) {
        contactModelList = util.addHitQueryList({
          data: contactModelList,
          queryList: accounts,
          hitList: [['contactInfo', 'contactItemVal']],
        });
      }
    } catch (e) {
      console.error('[contact] doGetContactByItem error:', e);
      needRequestAccounts = accounts;
    }

    if (needRequestAccounts.length) {
      console.log('[contact] not found accounts', needRequestAccounts);
    }
    return {
      needRequestAccounts,
      contactModelList,
    };
  }

  /**
   * 通过云信从服务端获取联系人信息
   * @param accounts
   */
  async doGetServerContactByYunxin(accounts: string[]): Promise<ContactModel[]> {
    const res = await this.contactServer.doGetContactByYunxin(accounts);
    return res;
  }

  /**
   * @description:通过email从服务端获取联系人信息
   * @param emails:string[]
   * @returns
   */
  async doGetServerContactByEmails(emails: string[], _account?: string): Promise<ContactModel[]> {
    if (!emails || !emails.length) {
      return [];
    }
    const account = _account || lodashGet(this.systemApi.getCurrentUser(), 'id', '');
    return this.contactServer.doGetContactByEmails(emails, account);
  }

  /**
   * @deprecated:目前来看无人调用此方法，1.27.0版本不再支持
   * 通过IM(teamId + yunxinId)查找 联系人关联表信息
   * @param params.idList: 群成员id列表
   * @param params.orderBy: 是否按照joinTime排序
   * @param params.filterSelf: 得到的数据是否排除自己 默认不排除
   */
  doGetOrgContactListByIM(params: OrgContactCondition): Promise<Array<EntityOrgTeamContact | EntityOrgTeamContact[]>> {
    const { idList, orderBy, needContactData, needContactModelData, filterSelf } = params;
    return this.contactDB.getOrgContactList({
      idList,
      type: 'imId',
      needContactData,
      filterSelf,
      needContactModelData,
      orderBy: orderBy ? ['joinTime'] : undefined,
    });
  }

  /**
   * 通过teamId查找 联系群成员关联信息
   * @param params.idList: 群成员id列表('team_' 拼接的)
   * @param params.orderBy: 是否按照joinTime排序
   * @param params.needGroup: 是否按照id分组排序
   * @param params.needContactData: 得到的数据是否关联contact详细信息
   * @param params.filterSelf: 得到的数据是否排除自己 默认排除
   */
  async doGetOrgContactListByTeamId(params: OrgContactCondition): Promise<Array<EntityOrgTeamContact | EntityOrgTeamContact[]>> {
    const { idList, orderBy, needGroup, needContactData, needContactModelData, filterSelf = true } = params;
    if (!idList?.length) {
      return [];
    }
    return this.contactDB.getOrgContactList({
      idList,
      type: 'orgId',
      filterSelf,
      needGroup,
      needContactData,
      needContactModelData,
      orderBy: orderBy || ['joinTime'],
    });
  }

  async doUpdateContactById(contact: ContactEntityUpdateParams | ContactEntityUpdateParams[]): Promise<boolean> {
    const originContactList = util.singleToList(contact);
    const { success, data } = await this.contactDB.updateContactById({
      list: originContactList,
      _account: this.systemApi.getCurrentUser()?.id || '',
    });
    if (success && data) {
      const { personalIdList, enterpriseIdList } = data;
      this.contactDB.sendContactNotify({
        contact_personal: {
          updateDiff: [...personalIdList],
        },
        contact_enterprise: {
          updateDiff: [...enterpriseIdList],
        },
        syncStatus: {
          enterprise: !!enterpriseIdList.length,
          personal: !!personalIdList.length,
        },
        _account: this.systemApi.getCurrentUser()?.id || '',
      });
      return true;
    }
    return false;
  }

  async doUpdateContactModel(list: Partial<ContactModel>[]): Promise<boolean> {
    const { success, data } = await this.contactDB.updateContactModel({
      list,
      _account: this.systemApi.getCurrentUser()?.id || '',
    });
    if (success && data) {
      const { personalIdList, enterpriseIdList } = data;
      this.contactDB.sendContactNotify({
        contact_personal: {
          updateDiff: [...personalIdList],
        },
        contact_enterprise: {
          updateDiff: [...enterpriseIdList],
        },
        syncStatus: {
          enterprise: !!enterpriseIdList.length,
          personal: !!personalIdList.length,
        },
        _account: this.systemApi.getCurrentUser()?.id || '',
      });
      return true;
    }
    return false;
  }

  /**
   * 处理修改新增用户
   * @param data 服务返回的通讯录数据
   * @param _account
   * @returns 处理好错误统一返回的通讯录数据结构
   */
  doInsertOrReplacePersonal(params: ContactAccountsOptionWithPartial<{ data: ResponseData<resultObject[]> }>): Promise<CatchErrorRes<ContactModel[]>> {
    const _account = params._account || this.systemApi.getCurrentUser()?.id || '';
    return this.contactDB.doInsertOrReplacePersonal({
      ...params,
      _account,
    });
  }

  /**
   * @deprecated:1.27版本之后废弃
   * @description:获取所有通讯录 目前来看无人调用
   * @returns
   */
  doGetAllContactList(account?: string) {
    return this.contactDB.getAllContactList(account);
  }

  /**
   * @deprecated:1.27版本之后废弃
   * @description:获取所有通讯录组织数据 目前来看无人调用
   * @returns
   */
  doGetAllOrgContact(account?: string) {
    return this.contactDB.getAllOrgContactList(account);
  }

  /**
   * 以下是外贸注释掉代码
   * 于1.27版本被删除
   */

  /**
   * 同步客户下属联系人数据
   */
  syncContactColleague() {
    return this.contactSync.syncContactColleague();
  }

  /**
   * 通过组织id获取下属的联系人
   */
  async doGetColleagueByOrgIds(params: { idList: string[] }): Promise<Record<string, ContactModel[]>> {
    const res = await this.contactEdmHelper.getContactIdByUnitId(params);
    let contactIdSet = new Set<string>();
    Object.values(res).forEach(item => {
      contactIdSet = new Set([...contactIdSet, ...item]);
    });
    const contactIdList = [...contactIdSet];
    if (!contactIdList.length) {
      return {};
    }
    const modelList = await this.doGetContactById(contactIdList);
    const modelMap: Record<string, ContactModel> = {};
    modelList.forEach(item => {
      const { id } = item.contact;
      if (id) {
        modelMap[id] = item;
      }
    });
    const ret: Record<string, ContactModel[]> = {};
    Object.keys(res).forEach(orgId => {
      ret[orgId] = res[orgId].map(contactId => modelMap[contactId]);
    });
    return ret;
  }

  async doGetColleagueList(): Promise<ContactModel[]> {
    const idList = await this.contactEdmHelper.getColleagueContactIdList();
    if (!idList.length) {
      return [];
    }
    return this.doGetContactById(idList);
  }

  // #endregion

  // #region ---------------- 联系人搜索 ----------------

  /**
   * 多账号搜索
   * @param condition query
   * @returns result[]
   */
  async doSearchContactByAccounts(condition: SearchCondition): Promise<Record<string, SearchAllContactRes>> {
    // 获取全部账户
    let accounts = [];
    if (condition._account) {
      accounts = [{ id: condition._account }];
    } else {
      accounts = await this.accountApi.getMainAndSubAccounts();
    }
    let result: Record<string, SearchAllContactRes> = {};
    if (accounts && accounts.length) {
      const list = await Promise.all(
        accounts.map((account: any) =>
          this.doSearchAllContact({
            ...condition,
            _account: account.id,
          }).then(data => Promise.resolve({ [account.id]: data }))
        )
      );
      list.forEach(item => {
        result = { ...result, ...item };
      });
    }
    return result;
  }

  /**
   * 多账号内存搜索
   * @param condition query
   * @returns result[]
   */
  async doSearchContactByAccountsInMemory(condition: MemorySearchCondition): Promise<Record<string, SearchContactMemoryRes>> {
    // 获取全部账户
    const start = Date.now();
    console.warn('[contact_doSearchContactByAccountsInMemory_start]');
    let accounts = [];
    if (condition._account) {
      accounts = [{ id: condition._account }];
    } else {
      accounts = await this.accountApi.getMainAndSubAccounts();
    }
    console.warn('[contact] doSearchContactByAccountsInMemory getMainAndSubAccounts', this.contactUtil.useTime(start));
    let result: Record<string, SearchContactMemoryRes> = {};
    if (accounts && accounts.length) {
      const list = await Promise.all(
        accounts.map((account: { id: string }) =>
          this.doSearchAllContactInMemory({
            ...condition,
            _account: account.id,
          }).then(data => Promise.resolve({ [account.id]: data }))
        )
      );
      list.forEach(item => {
        result = { ...result, ...item };
      });
    }
    console.warn('[bigDataSearch] [contact_doSearchContactByAccountsInMemory_end]', this.contactUtil.useTime(start));
    return result;
  }

  /**
   * 搜索群成员信息
   * @param query
   * @param _account
   */
  async doSearchTeamContact(query: string, _account?: string) {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    const res = await this.doSearchAllContact({
      query,
      // exclude: ['contactItemVal'],
      isIM: true,
      searchInclude: {
        contact: [
          { key: 'type', val: 'enterprise' },
          { key: 'visibleCode', val: 0 },
        ],
        org: [
          { key: 'visibleCode', val: 0 },
          { key: 'type', val: 2000 },
        ],
      },
      showDisable: false,
      _account,
    });
    let { teamList } = res;
    if (res.contactList.length) {
      const idList: string[] = [];
      const idMap: resultObject = {};
      res.contactList.forEach(item => {
        const contactId = item?.contact?.id;
        if (contactId) {
          idMap[contactId] = item;
          idList.push(contactId);
        }
      });
      const orgContactList = (await this.contactDB.getOrgContactList({
        type: 'contactId',
        idList,
        filterOrg: true,
        _account,
      })) as EntityOrgTeamContact[];
      const teamContactMap = orgContactList.reduce((obj, cur) => {
        const idList = obj[cur.orgId] || [];
        const model = idMap[cur.contactId];
        model && idList.push(model);
        obj[cur.orgId] = idList;
        return obj;
      }, {} as resultObject);
      const teamIdList = Object.keys(teamContactMap);
      const orgList = (await this.contactDB.getOrgList({ idList: teamIdList, _account: mainAccount }, true)) as EntityTeamOrg[];
      const filterOrgList: SearchTeamOrgModel[] = [];
      const contactInTeamList: SearchTeamOrgModel[] = [];
      const contactNotInTeamList: EntityTeamOrg[] = [];
      const teamListIdSet = new Set();
      teamList.forEach(item => {
        teamListIdSet.add(item.id);
        const contactList = teamContactMap[item.id];
        if (contactList) {
          contactInTeamList.push({ ...item, contactList });
        } else {
          contactNotInTeamList.push(item);
        }
      });
      orgList.forEach(item => {
        if (!teamListIdSet.has(item.id)) {
          const contactList = teamContactMap[item.id];
          if (contactList) {
            filterOrgList.push({ ...item, contactList });
          }
        }
      });
      teamList = [...contactInTeamList, ...contactNotInTeamList, ...filterOrgList];
    }
    console.warn('doSearchTeamContact', res.contactList);
    return {
      contactList: res.contactList,
      teamList,
    };
  }

  // 搜索联系人，客户，客户联系人（客户，客户联系人不再走后台，使用接口在前台处理，入参出参和doSearchNew一致）
  async doSearchAllContactNew(condition: MemorySearchCondition) {
    const { useEdmData, query, maxItem } = condition;
    // 普通联系人还使用doSearchNew来搜索，客户，客户联系人使用新的接口前台搜索
    const [{ main }, edmData] = await Promise.all([
      this.doSearchNew({ ...condition, useEdmData: false }),
      // 客户搜索入参：关键词，接口搜索类型暂定全部，limit数量没传递则使用300
      useEdmData ? this.mailPlusCustomerApi.doSearchCustomerAndContact(query, 'all', maxItem || 300) : Promise.resolve(undefined),
    ]);
    // 处理edmData变成想要的格式
    const edm = edmData ? this.transSearchCustomerRes2CustomerSearchContactMemoryRes(edmData) : undefined;
    const res: { main: Record<string, SearchContactMemoryRes>; edm: CustomerSearchContactMemoryRes | undefined } = {
      main,
      edm,
    };
    return res;
  }
  // 搜索返回数据格式转换
  // eslint-disable-next-line lines-between-class-members
  private transSearchCustomerRes2CustomerSearchContactMemoryRes(res: SearchCustomerRes): CustomerSearchContactMemoryRes {
    const { customerList, customerContactList } = res;
    // 客户联系人数据
    // id, type, contactName, accountName, customerRole, hitQuery, createTime
    const _lastUpdateTime = Date.now();
    const contact = customerContactList.map(item => {
      const { customerId: orgId, contactId: id, contactName, contactEmail: accountName, contactCreateTime: createTime } = item;
      const obj: CustomerContactSearch = {
        orgId,
        id,
        accountName,
        createTime,
        contactName: contactName || '',
        type: 'customer', // 类型是 customer | clue。暂时先默认为customer
        customerRole: 'myCustomer', // 目前搜索返回的都是自己的客户，默认为manager
        contactPYName: '',
        contactPYLabelName: '',
        _lastUpdateTime,
      };
      return obj;
    });
    // 客户和线索数据，线索数据直接使用空数组，目前数据无法区分
    // const { id, type, orgRank, orgName, hitQuery, customerRole, originId } = item;
    const customer = customerList.map(item => {
      const { customerId: id, customerName: orgName, customerCreateTime: orgRank } = item;
      const obj: CustomerOrgSearch = {
        id,
        originId: id,
        orgRank,
        orgName: orgName || '',
        type: 2002, // 当前暂时默认全是客户
        customerRole: 'myCustomer',
        orgPYName: '',
        _lastUpdateTime,
        _company: '',
        customerType: 'customer',
      };
      return obj;
    });
    const result: CustomerSearchContactMemoryRes = {
      contact,
      customer,
      clue: [],
    };
    return result;
  }

  async doSearchNew(condition: MemorySearchCondition) {
    const shouldUseMemorySearch = this.getShouldUseMemorySearch();
    const { enableUseMemory = true } = condition;
    if (shouldUseMemorySearch && enableUseMemory) {
      try {
        const res = await this.doSearchInMemory(condition);
        return res;
      } catch (ex) {
        console.warn('[contact.dosearchNew]Error.memory', ex);
      }
    }

    if (typeof condition.query !== 'string' || !condition.query.trim().length) {
      const currentUserId = this.systemApi.getCurrentUser()?.id || '';
      return {
        main: {
          [currentUserId]: {
            frequentContactList: [],
            contactList: [],
            teamList: [],
            orgList: [],
            personalOrgList: [],
          },
        },
      };
    }

    const { main } = await this.doSearch(condition);
    const res: { main: Record<string, SearchContactMemoryRes>; edm: CustomerSearchContactMemoryRes | undefined } = {
      main: {},
      edm: undefined,
    };
    if (main) {
      Object.keys(main).forEach(account => {
        const item = main[account];
        res.main[account] = {
          frequentContactList: this.contactTrans.transContactModel2ContactSearch(item.frequentContactList!),
          contactList: this.contactTrans.transContactModel2ContactSearch(item.contactList),
          teamList: this.contactTrans.transOrg2OrgSearch(item.teamList),
          orgList: this.contactTrans.transOrg2OrgSearch(item.orgList),
          personalOrgList: this.contactTrans.transOrg2OrgSearch(item.personalOrgList),
        };
      });
    }
    return res;
  }

  /**
   * 通讯录搜索综合方法在内存搜索
   * @param condition 条件
   */
  async doSearchInMemory(condition: MemorySearchCondition) {
    const [dbCount, memoryCount] = await Promise.all([
      this.contactDB.getTableCount({
        tableName: 'contact',
        dbName: 'contact_dexie',
        _account: condition._account || this.systemApi.getCurrentUser()?.id || '',
      }),
      this.contactDB.getTableCount({
        tableName: 'contact',
        dbName: 'contact_search',
        _account: condition._account || this.systemApi.getCurrentUser()?.id || '',
      }),
    ]);

    // 只要DB数据比内存数据大 就抛出异常走兜底逻辑
    if (dbCount > memoryCount) {
      throw new Error('memory_miss');
    }

    const start = Date.now();

    const main = await this.doSearchContactByAccountsInMemory(condition);

    console.warn('[contact] doSearchInMemory', this.contactUtil.useTime(start));
    // 需要将main数据clone一份之后返给业务层(web环境下内存数据和UI在同一个页面 指针指向到了同一个内存 要防止被修改)
    return {
      main: cloneDeep(main),
      edm: undefined,
    };
  }

  async doGetContactByIdsNew(ids: string | string[]) {
    return this.doGetContactById(ids);
  }

  // async doSearchMyCustomer(condition: MyCustomerSearchCondition): Promise<CustomerOrgSearch[]> {
  //   return this.contactEdmHelper.doSearchMyCustomer(condition);
  // }

  /**
   * 通讯录搜索综合方法
   * @param condition 搜索条件
   * @returns
   */
  async doSearch(condition: SearchCondition) {
    console.warn('[bigDataSearch] [contact_doSearch_start] [', Date.now(), ']');
    const main = await this.doSearchContactByAccounts(condition);
    console.warn('[bigDataSearch] [contact_doSearch_end] [', Date.now(), ']');
    console.timeEnd('[contact] doSearch');
    return {
      main,
      edm: undefined,
    };
  }

  async doSearchAllContactInMemory(condition: MemorySearchCondition): Promise<SearchContactMemoryRes> {
    const { query, _account, maxItem = this.contactUtil.searchTableLimit, lastId, noRelateEnterprise = false } = condition;
    console.time('[contact] doSearchAllContactInMemory');
    // 查询各个表命中的数据
    const tableCondition = this.contactDB.transMemorySearchCondition(condition);
    const promiseList: Array<Promise<SearchContactMermoryTableRes>> = tableCondition.map(condi => {
      const { tableName, searchFilterList } = condi;
      return this.contactDB
        .searchTable<ContactSearch[] | OrgSearch[]>({
          dbName: this.contactUtil.contactSearchDbName,
          searchFilterList,
          tableName,
          _account,
          filterLimit: maxItem,
          lastId,
          noRelateEnterprise,
        })
        .then(res => ({
          [tableName]: res,
        }));
    });
    const data = await Promise.all(promiseList);
    let res: SearchContactMermoryTableRes = {};
    data.forEach(item => {
      res = { ...res, ...item };
    });

    // 不拍平的场景下(默认场景) 搜索命中的通讯录需要聚合展示数量。展示主油箱
    const pureContactMap: Map<string, ContactSearch> = new Map();
    ((res.contact || []) as ContactSearch[]).forEach(_item => {
      // 添加关键词
      const item = util.addHitQuery({
        data: _item,
        queryList: [query],
        hitList: ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'],
      });
      // 如果是企业通讯录或者个人通讯录要求拍平 不做处理
      if (item.type !== 'personal' || condition.flattenMuliptleEmails) {
        pureContactMap.set(item.id + item.accountName, item);
        return;
      }

      const existContact = pureContactMap.get(item.id) as ContactSearch;

      const count = existContact?.emailCount || 0;

      if (!existContact || item.isDefault) {
        pureContactMap.set(item.id, {
          ...item,
          emailCount: count + 1,
        });
      } else {
        pureContactMap.set(item.id, {
          ...existContact,
          emailCount: count + 1,
        });
      }
    });

    // 执行通讯录排序
    const { defaultOrderList: defaultContactList, frequentOrderList: frequentContactList } = await this.contactDB.sortSearchResult({
      list: [...pureContactMap.values()],
      idKeypath: 'id',
      handleSameIdType: condition.flattenMuliptleEmails ? 'flatten' : 'replace',
      useFrequentOrder: condition.useFrequentOrder,
      frequentChannel: condition.frequentChannel,
      frequentOrderCount: condition.frequentOrderCount,
      _account: condition._account || '',
      query,
      orderBy: ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'],
    });

    // 处理查询到的组织数据
    const orgList: OrgSearch[] = [];
    const teamList: OrgSearch[] = [];
    const personalOrgList: OrgSearch[] = [];
    let orgDataList = (res.org || []) as OrgSearch[];
    if (orgDataList.length) {
      orgDataList = util.setDataOrder({
        data: orgDataList,
        orderBy: [['orgRank', false], 'orgName', 'orgPYName'],
      });
      orgDataList.forEach(item => {
        if (item.type === 2000) {
          teamList.push(item);
        } else if (item.type === 2001) {
          personalOrgList.push(item);
        } else {
          orgList.push(item);
        }
      });
    }
    console.timeEnd('[contact] doSearchAllContact2');
    console.log('[contact] doSearchAllContact2', {
      defaultContactList,
      frequentContactList,
    });
    return {
      orgList,
      personalOrgList,
      teamList,
      contactList: defaultContactList,
      frequentContactList,
    };
  }

  /**
   * 搜索通讯录所有内容
   * @param condition 搜索条件
   */
  async doSearchAllContact(_condition: SearchCondition): Promise<SearchAllContactRes> {
    const { query, _account, isIM, showDisable = true, contactType, maxItem = this.contactUtil.searchTableLimit } = _condition;
    // 查询各个表命中的数据
    const condition = { ..._condition };
    let serverModelList: ContactModel[] = [];
    const isContactReady = await this.doGetContactReadySync();
    if (!isContactReady) {
      serverModelList = await this.contactServer.doSearchAllContact(_condition);
      if (!contactType) {
        condition.contactType = 'personal';
      } else if (contactType === 'enterprise') {
        const exclude = condition.exclude || [];
        exclude.push('contactItemVal', 'contactName', 'contactPYName', 'contactPYLabelName');
        condition.exclude = exclude;
      }
    }
    const res = await this.contactDB.getContactBySearch2(condition);
    const contactItem = res.contactItem || { idSet: new Set(), idMap: {} };
    const contact = res.contact || { idSet: new Set(), idMap: {} };
    const org = res.org || { idSet: new Set(), idMap: {} };
    // 查询到contact表的数据
    const contactMap = contact.idMap as identityObject<EntityContact>;
    // 查询到org表的数据
    const orgMap = org.idMap as Record<string, EntityOrg>;
    // 命中的contactId集合
    const contactIdSet = new Set([...contact.idSet, ...contactItem.idSet]);
    // 确定需要返回的联系人id列表
    const contactIdFilterList = contactIdSet.size > maxItem ? [...contactIdSet].slice(0, maxItem) : [...contactIdSet];

    // 需要请求contact表id列表
    const contactIdList: string[] = [];
    // 用来排序的联系人数据列表
    const contactOrderList: EntityContact[] = [];
    contactIdFilterList.forEach(contactId => {
      // 如果数据源是从contactItem中来的
      if (!contactMap[contactId]) {
        contactIdList.push(contactId);
      } else {
        let entityContact = contactMap[contactId];
        entityContact = util.addHitQuery({
          data: entityContact,
          queryList: [query],
          hitList: ['contactName', 'contactPYName'],
        });
        contactMap[contactId] = entityContact;
        contactOrderList.push(entityContact);
      }
    });

    // 来自于contactItem中的数据补全contact信息
    if (contactIdList.length) {
      const list = await this.contactDB.getContactList({
        idList: contactIdList,
        _account,
        isIM,
        showDisable,
      });
      list.forEach(item => {
        // 个人邮箱如果是通过非主账号邮箱命中 添加hitQueryEmail 否则添加hitQuery
        if (item.type === 'personal' && !Reflect.has(contactMap, item.id) && contactItem.idSet.has(item.id)) {
          item.hitQueryEmail = lodashGet(contactItem.idMap, `['${item.id}'].contactItemVal`, item.accountName) as string;
        }
        contactMap[item.id] = item;
        contactOrderList.push(item);
      });
    }
    // 联系人Item数据集合
    const contactItemMap: Record<string, EntityContactItem[]> = {};
    // 需要返回的id列表请求对应的详情数据
    const contactItemList = await this.contactDB.getContactItemListByContactId({ idList: contactIdFilterList, _account });
    contactItemList.forEach(item => {
      const info = contactItemMap[item.contactId] || [];
      info.push(item);
      contactItemMap[item.contactId] = info;
    });

    // 将联系人数据组装成最终返回数据结构
    const totalContactModelList = this.contactTrans.transformContactModel({
      contactIdMap: contactMap,
      contactInfoIdMap: contactItemMap,
      // 是否根据contactItem中的emai拍扁成多条contactModel
      flattenMuliptleEmails: condition.flattenMuliptleEmails,
    });

    // 通讯录数据排序
    const { frequentOrderList, defaultOrderList: orderByIdList } = await this.contactDB.sortSearchResult({
      _account: _account || '',
      orderBy: ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'],
      query,
      handleSameIdType: condition.flattenMuliptleEmails ? 'flatten' : 'replace',
      list: totalContactModelList,
      idKeypath: 'contact.id',
      useFrequentOrder: condition.useFrequentOrder,
      frequentChannel: condition.frequentChannel,
      frequentOrderCount: condition.frequentOrderCount,
    });

    const contactList = [...serverModelList, ...orderByIdList];

    // 处理查询到的组织数据
    let orgList: EntityOrg[] = [];
    let teamList: EntityTeamOrg[] = [];
    let personalOrgList: EntityPersonalOrg[] = [];
    const orgDataList = Object.values(orgMap || {});
    if (orgDataList.length) {
      orgDataList.forEach(item => {
        if (item.type === 2000) {
          teamList.push(item as EntityTeamOrg);
        } else if (item.type === 2001) {
          personalOrgList.push(item as EntityPersonalOrg);
        } else {
          orgList.push(item as EntityOrg);
        }
      });
      personalOrgList = util.setDataOrder({
        data: personalOrgList,
        orderBy: [['createTime', false], 'orgName', 'orgPYName'],
      });
      orgList = util.setDataOrder({
        data: orgList,
        orderBy: [['orgRank', false], 'orgName', 'orgPYName'],
      });
      teamList = util.setDataOrder({
        data: teamList,
        orderBy: [['createTime', false], 'orgName', 'orgPYName'],
      });
    }

    return {
      frequentContactList: frequentOrderList,
      orgList,
      personalOrgList,
      teamList,
      contactList,
    };
  }

  /**
   * corp邮箱搜索
   * @deprecated: 通讯录业务中不再支持corp相关逻辑
   * @param query
   * @param contactModelList
   */
  async doCorpSearch(query: string, contactModelList: ContactModel[]) {
    // const serverResult = await corpUtils.corpSearchContactFromServer(query, true);
    // const localContactList = contactModelList || [];
    // // 去重，已在本地的搜索结果中的联系人过滤掉
    // // accountName为email，这个为主键去重
    // const filterServerList = serverResult.filter(item => !localContactList.find(localItem => localItem.contact.accountName === item.contact.accountName));
    // // 优先展示本地通讯录的人
    // return localContactList.concat(filterServerList);
    console.log('[contact_impl]doCorpSearch', query, contactModelList);
    return [];
  }

  /**
   * 搜索用户
   * @param query 搜索内容
   * @param isIM 是否处理im数据
   * @param maxItem 查询数量
   */
  async doSearchContactNew(query: string, isIM?: boolean, maxItem?: number): Promise<SearchContactMemoryRes> {
    if (!query || query.trim() === '') {
      return Promise.reject(ErrResult['REQUEST.ILLEGAL']);
    }
    const currentUserId = this.systemApi.getCurrentUser()?.id || '';
    const res = await this.doSearchNew({
      query,
      isIM,
      showDisable: false,
      maxItem,
    });
    // IM通讯录搜索过滤非企业联系人
    const contactList = lodashGet(res, `main[${currentUserId}].contactList`, []);
    if (contactList.length > 0) {
      res.main[currentUserId].contactList = contactList.filter((item: ContactSearch) => item.type === 'enterprise');
    }
    return res.main[currentUserId];
  }

  /**
   * 搜索用户
   * @param query 搜索内容
   * @param isIM 是否处理im数据
   * @param noLock 是否上锁
   */
  async doSearchContact(query: string, isIM?: boolean, noLock?: boolean): Promise<Array<ContactModel>> {
    if (!query || query.trim() === '') {
      return Promise.reject(ErrResult['REQUEST.ILLEGAL']);
    }
    const res = await this.doSearchAllContact({
      query,
      isIM,
      showDisable: false,
      noLock,
    });
    return res.contactList;
  }

  async handlePushCustomerMgs(params: CustomerUpdatePushMsg) {
    this.contactEdmHelper.handlePushCustomerMgs(params);
  }

  async syncAllAccount(force?: boolean): Promise<any> {
    this.subAccountEventHandler && this.eventApi.unregisterSysEventObserver('SubAccountAdded', this.subAccountEventHandler);
    this.subAccountEventHandler = this.eventApi.registerSysEventObserver('SubAccountAdded', {
      name: 'subAccountAdded-contactsubaccount',
      func: (e: SystemEvent<ISubAccountEventData>) => {
        const { subAccount } = e.eventData!;
        this.contactSync.setContactSync({
          isMainAccount: false,
          _account: subAccount,
          force: false,
        });
      },
    });
    const eventName = process.env.BUILD_ISELECTRON ? 'detectContactException' : 'detectContactExceptionInWeb';
    if (this.systemApi.isMainPage()) {
      this.eventApi.registerSysEventObserver(eventName, {
        name: 'detectContactException-needsync',
        func: (e: SystemEvent<{ type: string; enableSkipFullSync: boolean }>) => {
          const type = e.eventData?.type;
          const enableSkipFullSync = e.eventData?.enableSkipFullSync || false;

          if (type === 'contactNotEqualContactItem' || type === 'addressRuleChanged') {
            this.contactSync.setContactSync({
              isMainAccount: true,
              _account: this.systemApi.getCurrentUser()?.id || '',
              force: true,
              enableSkipFullSync,
            });
            this.dataTracker.track('pc_contact_needsyncall', {
              type,
            });
          }
        },
        _account: this.systemApi.getCurrentUser()?.id,
      });
    } else {
      this.eventApi.registerSysEventObserver(eventName, {
        name: 'detectContactException-backup',
        func(e) {
          console.log('[contact_impl].detectContactException', e);
        },
      });
    }
    const accounts = await this.accountApi.getMainAndSubAccounts({ expired: false });

    return Promise.allSettled(
      accounts.map((account: SubAccountTableModel) =>
        // this.accountApi.setCurrentAccount({ email: account.id });
        this.contactSync.setContactSync({
          isMainAccount: account.id === this.systemApi.getCurrentUser()?.id,
          _account: account.id,
          force: force || false,
        })
      )
    );
  }

  // #endregion

  // #region ---------------- 最近联系人 ----------------

  /**
   *  获取最近联系人信息
   * @params 查询参数
   * @returns 联系人详情列表
   */
  async getRecentContactList(params: recentContactListParams, noCache?: boolean): Promise<recentContactListRes[]> {
    try {
      if (!noCache) {
        const dbContactList = await this.contactDB.getRecentContact(params);
        if (dbContactList && dbContactList.length > 0) {
          return dbContactList || ([] as recentContactListRes[]);
        }
      }

      const promise = this.contactServer.getRecentContactListInServer(params);

      return promise;
    } catch (e) {
      console.warn('[contact] recent contact', e);
      return Promise.resolve([] as recentContactListRes[]);
    }
  }

  /**
   *  添加最近联系人信息
   * @param params:contracAddRecentParams 上一次同步的时间
   * @returns 联系人详情列表
   */
  async addRecentContact(params: ContactAddRecentParams): Promise<boolean> {
    const additionalParam = params._account ? this.contactUtil.getAccountSession(params._account) : undefined;

    const url = this.http.buildUrl(this.systemApi.getUrl('addRecentContact'), { ...additionalParam });

    try {
      await Promise.all(
        Object.values(params.memberParams)
          .filter(item => item && item.contactlist.length)
          .map(singleParam => {
            const emailList = singleParam.contactlist.map(item => item.email).join(',');
            // Reflect.deleteProperty(singleParam, 'contactlist');
            return this.http.post(
              url,
              {
                emailList,
                ...singleParam,
              },
              {
                _account: params._account,
              }
            );
          })
      );
      // 新增最近联系人，刷新联系人列表，
      this.eventApi.sendSysEvent({
        eventName: 'recentContactNotify',
        eventStrData: 'notify',
        _account: params._account,
      });
    } catch (e) {
      console.error('[contact] addRecentContact error', e);
    }

    const totalcontactlist = Object.values(params.memberParams).flatMap(item => item.contactlist);

    // 不用wait
    this.addFrequentContact({
      list: totalcontactlist,
      type: 'mail',
      _account: params._account,
    });

    return false;
  }

  // 添加常用联系人
  async addFrequentContact(params: ContactAccountsOption<{ list: Record<'contactId' | 'email', string>[]; type?: 'im' | 'mail' }>): Promise<void> {
    // 五分钟一个维度方便测试 上线前注释掉
    // const _timestamp = dayjs().startOf('minute');
    // const remaindMinute = _timestamp.minute() % 5;
    // const timestamp = _timestamp.valueOf() - remaindMinute * 60 * 1000;

    const timestamp = dayjs().startOf('hour').valueOf();

    const { list, type = 'mail' } = params;
    // 记录当前用户联系频率和联系次数
    const newFrequentlist: FrequentContactParams[] = list.map(item => ({
      id: util.getUnique(item.contactId, type),
      type: 'enterprise',
      contactId: item.contactId,
      email: item.email,
      // 只到小时单位
      timestamp,
      channel: type,
      sendcount: 1,
    }));

    // 查询当期那DB的联系次数更新联系次数
    const oldFrequentlist = await this.contactDB.queryFrequentContact({
      list: newFrequentlist.map(item => [item.contactId, type] as [string, string]),
      _account: params._account || this.systemApi.getCurrentUser()?.id || '',
    });

    const oldFrequentMap = new Map(oldFrequentlist.map(item => [item.id, item.sendcount]));
    // 执行写入
    this.contactDB.putFrequentContact({
      list: newFrequentlist.map(item => ({
        ...item,
        sendcount: (oldFrequentMap.get(item.id) || 0) + 1,
      })),
      _account: params._account || this.systemApi.getCurrentUser()?.id || '',
    });
  }

  /**
   *  查看邮件列表成员
   * @param accountName 上一次同步的时间
   * @returns 联系人详情列表
   */
  getMaillistMember(accountName: string) {
    return this.contactServer.getMaillistMember(accountName);
  }

  // 创建邮件列表
  async createMaillist(params: MailListMember) {
    const data = await this.contactServer.createMaillist(params);
    if (data.success) {
      await this.contactServer.operateMailLsit({
        action: 'ADD',
        accountName: params.account_name,
        domain: params.domain,
      });
    }
    return data;
  }

  // 编辑邮件列表成员
  async updateMaillist(params: MailListMember) {
    const data = await this.contactServer.updateMaillist(params);
    if (data.success) {
      await this.contactServer.operateMailLsit({
        action: 'UPDATE',
        accountName: params.account_name,
        domain: params.domain,
        qiyeAccountId: params.id,
      });
    }
    return data;
  }

  // 删除邮件列表成员
  async deleteMaillist(params: DelMailListParams) {
    const data = await this.contactServer.deleteMaillist(params);
    if (data.success) {
      await this.contactServer.operateMailLsit({
        action: 'DELETE',
        accountName: params.account_name,
        domain: params.domain,
        qiyeAccountId: params.id,
      });
    }
    return data;
  }

  // 获取用户域名列表
  listUserDomain() {
    return this.contactServer.listUserDomain();
  }

  // 我管理的邮件列表
  listUserMaillist(type?: number) {
    return this.contactServer.listUserMaillist(type);
  }

  // 查看邮件列表详情
  getMaillist(getMailListParams: GetMailListParams) {
    return this.contactServer.getMaillist(getMailListParams);
  }

  // 获取用户基本信息
  getMaillistConfig() {
    return this.contactServer.getMaillistConfig();
  }

  /**
   * @deprecated:目前看无人调用 1.27版本之后废弃
   * @description:校验邮箱列表账号
   * @param mailListMember
   * @returns
   */
  checkMaillistAccountName(mailListMember: MailListMember) {
    return this.contactServer.checkMaillistAccountName(mailListMember);
  }

  // #endregion

  // #region ---------------- 工具函数 ----------------

  async doGetContactInMailList(params: { idList?: string[]; emailList?: string[] }): Promise<{ id: Record<string, boolean>; mail: Record<string, boolean> }> {
    const { idList, emailList } = params;
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    if (!idList?.length && !emailList?.length) {
      return Promise.reject(new Error('必须传入idList 或者emailList'));
    }
    const idSet = new Set<string>(idList || []);
    const idMailMap = new Map<string, string>();
    if (emailList?.length) {
      const modelList = await this.contactDB.getContactByItem({
        value: emailList,
        type: 'EMAIL',
        filterType: 'enterprise',
      });
      modelList.forEach(item => {
        idMailMap.set(item.contact.id, item.contact.accountName);
        idSet.add(item.contact.id);
      });
    }
    const orgContactList = (await this.contactDB.getOrgContactList({
      idList: [...idSet],
      type: 'contactId',
      filterTeamOrg: true,
      filterPersonalOrg: true,
    })) as OrgContactModel[];
    const orgIdMap = new Map<string, string[]>();
    orgContactList.forEach(item => {
      const contactIdList = orgIdMap.get(item.orgId) || [];
      contactIdList.push(item.contactId);
      orgIdMap.set(item.orgId, contactIdList);
    });
    const orgList = await this.contactDB.getOrgList({
      idList: [...orgIdMap.keys()],
      _account: mainAccount,
    });
    const idResult: Record<string, boolean> = {};
    const mailResult: Record<string, boolean> = {};
    orgList.forEach(item => {
      const contactIdList = orgIdMap.get(item.id);
      contactIdList?.forEach(contactId => {
        const inMailList = item.type === 2;
        const mail = idMailMap.get(contactId);
        const inIdList = idList?.includes(contactId);
        if (inMailList) {
          if (mail) {
            mailResult[mail] = true;
          }
          if (inIdList) {
            idResult[contactId] = true;
          }
        } else {
          if (mail && !mailResult[mail]) {
            mailResult[mail] = false;
          }
          if (inIdList && !idResult[contactId]) {
            idResult[contactId] = false;
          }
        }
      });
    });
    emailList?.forEach(item => {
      if (!mailResult[item]) {
        mailResult[item] = false;
      }
    });
    return {
      id: idResult,
      mail: mailResult,
    };
  }

  isMailListByAccountType(type: number) {
    return type === 0 || type === 4;
  }

  doGetTableCount(tableName: contactTableNames) {
    return this.contactDB.getTableCount({
      tableName,
      _account: this.systemApi.getCurrentUser()?.id || '',
    });
  }

  doGetModelDisplayEmail(model: ContactModel | EntityContact): string {
    return this.contactUtil.doGetModelDisplayEmail(model);
  }

  contactLog(key: string, data?: resultObject) {
    return this.contactUtil.contactLog(key, data);
  }

  getColor(email: string): string {
    return util.getColor(email);
  }

  // #endregion

  // #region ---------------- 生命周期 ----------------

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      this.contactDB.init();
      process.env.BUILD_ISEDM && this.contactEdmHelper.initDB();
      this.setContactNotifyListener();
      this.syncAllAccount();
      ContactImplApi.inited = true;
      this.action = new Action();
    }
    return this.name;
  }

  beforeLogout() {
    this.contactServer.resetContact();
    this.clearSyncAll();
    ContactImplApi.inited = false;
    return this.name;
  }

  isInited(): boolean {
    return ContactImplApi.inited;
  }

  init(): string {
    // if (inWindow()) {
    this.http.addConfig({
      requestAutoReLogin(data: ApiResponse<ResponseData>): boolean {
        return !!data.data && !!data.data.code && String(data.data.code) === '401';
      },
      // conf.url = conf.url?.replace(/sid=[^&]+/i, "sid=" + this.getSid());
      reLoginUrlHandler: conf => conf,
      matcher: /^\/cowork\/api\/.*/i,
    });
    if (process.env.BUILD_ISEDM) {
      this.contactEdmHelper.addFilterRegistry();
    }
    this.dbApi.addFilterRegistry({
      filterFunc: this.contactDB.getSearchFilter(),
      name: contactCommonSearchFilterName,
    });
    const commonFilter = (item: resultObject, param?: QueryConfig) => item.type === param?.additionalData?.contactType;
    this.dbApi.addFilterRegistry({
      filterFunc: commonFilter,
      name: contactCommonTypeFilter,
    });
    const contactCommonConditionFilter = (item: resultObject, param?: QueryConfig) =>
      // if (!param?.additionalData?.includeOption) return false;
      // eslint-disable-next-line implicit-arrow-linebreak
      this.contactTrans.transInclude2FilterCondition(param?.additionalData?.includeOption, item) &&
      this.contactTrans.transExclude2FilterCondition(param?.additionalData?.excludeOption, item);
    this.dbApi.addFilterRegistry({
      filterFunc: contactCommonConditionFilter,
      name: contactCommonConditionFilterName,
    });
    const contactMultiTypeFilter = (item: resultObject, param?: QueryConfig) => {
      if (!param?.additionalData?.type) return false;
      return item.contactItemType === param?.additionalData?.type && (param?.additionalData?.filterType ? param?.additionalData?.filterType === item.type : true);
    };
    this.dbApi.addFilterRegistry({
      filterFunc: contactMultiTypeFilter,
      name: contactMultiTypeFilterName,
    });
    const contactIMfilter = (item: resultObject) => item.contactItemType === 'yunxin' && item.type === 'enterprise';
    this.dbApi.addFilterRegistry({
      filterFunc: contactIMfilter,
      name: contactIMFilterName,
    });
    const contactCommonPrefixFilterFactory = (prefix: string, equal: boolean) => (item: resultObject) =>
      (equal && item.orgId.startsWith(prefix)) || (!equal && !item.orgId.startsWith(prefix));
    const contactOrgIdEqTeamFilter = contactCommonPrefixFilterFactory('team_', true);
    this.dbApi.addFilterRegistry({
      filterFunc: contactOrgIdEqTeamFilter,
      name: contactOrgIdEqTeamFilterName,
    });
    const contactOrgIdNeqTeamFilter = contactCommonPrefixFilterFactory('team_', false);
    this.dbApi.addFilterRegistry({
      filterFunc: contactOrgIdNeqTeamFilter,
      name: contactOrgIdNeqTeamFilterName,
    });
    const contactOrgIdNeqPersonOrgFilter = contactCommonPrefixFilterFactory('personal_org_', false);
    this.dbApi.addFilterRegistry({
      filterFunc: contactOrgIdNeqPersonOrgFilter,
      name: contactOrgIdNeqPersonOrgFilterName,
    });
    const contactExcludeSelfFilter = (item: resultObject, param?: QueryConfig) => param?.additionalData?.contactId && item.contactId !== param?.additionalData?.contactId;
    this.dbApi.addFilterRegistry({
      filterFunc: contactExcludeSelfFilter,
      name: contactExcludeSelfFilterName,
    });

    // 注册一个过滤取消共享通讯录的函数
    const contactGrepInvalidEnterpriseFilter = (item: resultObject) => {
      const contactType = lodashGet(item, 'type', '');
      if (contactType !== 'enterprise') {
        return true;
      }
      const user = this.systemApi.getCurrentUser();

      const mainEnterpriseId = lodashGet(user, 'contact.contact.enterpriseId', 0);
      const domainShareMap = lodashGet(user, 'prop.domainShareList', undefined);
      if (!mainEnterpriseId || !domainShareMap) {
        return true;
      }
      return item.enterpriseId === mainEnterpriseId || Object.keys(domainShareMap).includes(`${item.enterpriseId}`);
    };

    this.dbApi.addFilterRegistry({
      filterFunc: contactGrepInvalidEnterpriseFilter,
      name: contactGrepInvalidEnterpriseFilterName,
    });

    // 注册一个过滤关联企业通讯录的函数
    const contactGrepRelateEnterpriseFilter = (item: resultObject, param?: QueryConfig) => {
      const field = lodashGet(param, 'additionalData.enterpriseFieldName', '');
      const needGrepRelateEnterpriseResult = lodashGet(param, 'additionalData.needGrepRelateEnterpriseResult', false);
      const myEnterpriseId = lodashGet(this.systemApi.getCurrentUser(), 'contact.contact.enterpriseId', 0);
      if (!field || !needGrepRelateEnterpriseResult || !myEnterpriseId) {
        return true;
      }
      // enterpriseId为空 或者enterprise只包含
      return !item[field] || `${item[field]}` === `${myEnterpriseId}`;
    };
    this.dbApi.addFilterRegistry({
      filterFunc: contactGrepRelateEnterpriseFilter,
      name: contactGrepRelateEnterpriseFilterName,
    });
    // }
    return this.name;
  }

  onPathChange(ev?: ApiLifeCycleEvent) {
    console.log('[contact] onPathChange', ev);
    // if (ev && ev.curPath?.pathname === '/') {
    //   if (!this.isInited()) {
    //     console.log('[contact] onPathChange afterInit');
    //     this.afterInit();
    //   }
    // }
    return this.name;
  }

  afterInit() {
    this.contactDB.contactSyncTimes = 0;
    const currentUser = this.systemApi.getCurrentUser();
    console.log('[contact] afterInit', currentUser);
    // 勿删 @autor:guochao
    // changeCoreContactSyncStatus要支持innermsg 必须在每个页面都有有一个监听事件 避免send失败
    this.eventApi.registerSysEventObserver('changeCoreContactSyncStatus', {
      func: ev => {
        console.log('[contact]event.changeCoreContactSyncStatus', ev.eventData);
      },
      _account: this.systemApi.getCurrentUser()?.id || '',
    });
    if (currentUser) {
      this.contactDB.init();
      process.env.BUILD_ISEDM && this.contactEdmHelper.initDB();
      this.setContactNotifyListener();
      this.syncAllAccount();
    }
    if (!ContactImplApi.inited) {
      ContactImplApi.inited = true;
    }

    return this.name;
  }

  // #endregion

  setContactNotifyListener() {
    if (inWindow() && this.systemApi.isMainWindow()) {
      this.eventApi.registerSysEventObserver('contactNotify', {
        name: 'setContactNotifyListener',
        func: e => {
          this.contactDB.setContactLastUpdateTime(e._account);
        },
      });
    }
  }

  setEDMSync() {
    if (!0) {
      throw new Error('no support');
    }
    setTimeout(() => {
      this.contactSync.setColleagueContactSync();
      this.contactSync.setCustomerContactSync();
    }, 50);
  }

  clearSyncAll() {
    this.contactSync.clearSyncAll();
  }

  // 获取星标列表
  // args不表示查询范围 空数组表示全量数据。field表示用哪个字段用key
  async doGetPersonalMarkList(
    args: (string | number)[] = [],
    field: 'value' | 'email' | 'type' = 'value',
    options?: {
      needMemberEmail?: boolean;
    },
    _account?: string
  ): Promise<ContactPersonalMarkSimpleModel[]> {
    const needMemberEmail = lodashGet(options, 'needMemberEmail', false);
    const res = await this.contactDB.getPersonalMarkListByFields(args, field, _account);

    if (!needMemberEmail) {
      return res;
    }

    const groupIds = res.filter(item => item.type === 2).map(item => item.value);

    if (!groupIds || !groupIds.length) {
      return res;
    }

    const contactModelList = await this.doGetContactByOrgIds(groupIds, _account);

    const getEmaillist = (list: ContactModel[]) => {
      console.log('[cotact_impl]doGetPersonalMarkList', list);
      const emails = list.flatMap(item => item.contactInfo.filter(item => item.contactItemType === 'EMAIL').map(item => item.contactItemVal));
      return [...new Set(emails)];
    };

    return res.map(item => {
      if (item.type !== 2) {
        return item;
      }

      const emails = getEmaillist(lodashGet(contactModelList, `${item.value}`, []));

      item.emails = emails;
      return item;
    });
  }

  async doGetContactPersonalMarkList(): Promise<ContactOrgItem[]> {
    const orgMap: Map<string, OrgItem> = new Map();
    const contactItemMap: Map<string, ContactItem> = new Map();
    const orderIdList: string[] = [];
    try {
      const markList = await this.doGetPersonalMarkList();
      const contactIdList: string[] = [];
      markList.forEach(item => {
        orderIdList.push(item.value);
        if (item.type === 1) {
          contactIdList.push(item.value);
        } else if (item.type === 2) {
          orgMap.set(item.value, {
            id: item.value,
            originId: item.value,
            orgName: item.name,
            orgRank: 0,
            type: 2001,
            orgType: 'personalOrg',
          });
        }
      });
      if (contactIdList.length) {
        const modelList = await this.doGetContactById(contactIdList);
        modelList.forEach(item => {
          if (item) {
            const contactItem = this.contactUtil.transContactModel2ContactItem(item);
            contactItemMap.set(item.contact.id, contactItem);
          }
        });
      }
    } catch (e) {
      console.error('[contact_impl] doGetContactPersonalMarkList error', e);
    }
    const list: ContactOrgItem[] = [];
    orderIdList.forEach(id => {
      const contactItem = contactItemMap.get(id);
      const orgItem = orgMap.get(id);
      const item = contactItem || orgItem;
      if (item) {
        list.push(item);
      }
    });
    return list;
  }

  // 批量操作(添加、取消)星标
  async doBatchOperatePersonalMark(
    params: {
      type: 1 | 2;
      id: string;
    }[],
    action: 'add' | 'cancel' = 'add'
  ) {
    return this.contactPersonalHelper.doBatchOperatePersonalMark(
      {
        configList: params,
        _account: this.systemApi.getCurrentUser()?.id || '',
      },
      action
    );
  }

  doGetPersonalMarklistByEmail(params: { emails: string[]; _account?: string }): Promise<Map<string, EntityPersonalMark[]>> {
    const { emails } = params;
    return this.contactDB.doGetPersonalMarklistByEmail(emails);
  }

  doUpdateMarkUnreadMailCount(idMap: Record<string, number>) {
    return this.contactDB.updatePersonalmarkMailUnreadCount(idMap);
  }

  detectCoreEnterpriseHasData(from?: 'personal' | 'personalOrg' | 'enterprise' | 'org') {
    return this.contactDB.detectCoreEnterpriseHasData({ from });
  }

  findContactInfoVal(contactInfoList: EntityContactItem[], type?: ContactInfoType) {
    return this.contactUtil.findContactInfoVal(contactInfoList, type);
  }

  queryPersonalMemberCount(ids: string[], account?: string): Promise<Record<string, number>> {
    return this.contactDB.queryPersonalMemberCount(ids, account);
  }

  deleteTrashContactByManual() {
    return this.contactDB.deleteTrashContactByManual();
  }
}

export const contactImpl: Api = new ContactImplApi();

const addMethodProxy = (methodList: string[], contactImpl: any, handler: (method: string, data: unknown) => any) => {
  methodList.forEach(method => {
    contactImpl[method] = new Proxy(contactImpl[method], {
      apply: async (target, context, args) => {
        const res = await target.apply(context, args);
        // redux同步逻辑
        handler(method, res);
        return res;
      },
    });
  });
  return contactImpl as Api;
};

const newContactImpl = addMethodProxy(ContactSelectNotify.selectWhiteList, contactImpl, ContactSelectNotify.handleNeedTransData.bind(ContactSelectNotify));

api.registerLogicalApi(newContactImpl);

export default newContactImpl;
