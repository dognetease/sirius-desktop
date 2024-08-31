import lodashOmit from 'lodash/omit';
import { api } from '@/api/api';
import { ContactServer, ContactServerInstance } from './contact_server';
import ContactSelectNotify, { ContactSelectProxy } from './contact_select_notify';
import { ContactDB, ContactDBInstance } from './contact_dbl';
import { ContactTransform, ContactTransformInstance } from './contact_transform';
import { ContactModel, resultObject, SimpleContactModel } from '@/api/_base/api';
import { DbApiV2, DBList, QueryConfig, QueryFilterFunc } from '@/api/data/new_db';
import {
  ContactEdmTableName,
  // CustomerContactSearch,
  CustomerFilterType,
  CustomerOrg,
  CustomerOrgSearch,
  CustomerOrgType,
  CustomerSearchCondition,
  // CustomerSearchContactMemoryRes,
  CustomerSearchRes,
  CustomerSyncRes,
  CustomerType,
  EntityClueOrg,
  EntityCustomerContact,
  EntityCustomerOrg,
  EntityCustomerOrgContact,
  EntityCustomerOrgManager,
  EntityCustomerUnitContact,
  CustomerContactSearch,
  // CustomerOrgSearch,
  CustomerSearchContactMemoryRes,
  CustomerListParams,
  CustomerSyncTempRes,
  CustomerResFromServer,
  CustomerEntityForMail,
  HandleOrgListParams,
  SaveCustomerListToDBParams,
  CustomerEmailModelRes,
  MyCustomerListParams,
  CustomerSaveDBRes,
  CustomerRole,
  CustomerRoleExtra,
} from '@/api/logical/contact_edm';
import { util } from '@/api/util';
import { customerFilterNames } from '@/api/logical/contact_constants';
import { AccountApi } from '@/api/logical/account';
import { apis } from '@/config';
import { SystemEvent } from '@/api/data/event';
import { ContactEdmSyncRes, CustomerUpdatePushMsg, MyCustomerSearchCondition } from '@/api/logical/contactAndOrg';
import { LoggerApi } from '@/api/data/dataTracker';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { EdmRoleApi } from '@/api/logical/edm_role';
import { EmailRoles } from '@/api/logical/mail_plus_customer';

export class ContactEdmHelper {
  systemApi = api.getSystemApi();

  storeApi = api.getDataStoreApi();

  eventApi = api.getEventApi();

  loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

  accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

  edmRoleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

  contactServer: ContactServer = ContactServerInstance;

  contactUtil: ContactConst = ContactUtilInterface;

  contactSelectNotify: ContactSelectProxy = ContactSelectNotify;

  contactDB: ContactDB = ContactDBInstance;

  contactTrans: ContactTransform = ContactTransformInstance;

  protected dbApi: DbApiV2 = api.getNewDBApi();

  dbName: DBList = 'contact_global';

  customerDBName: DBList = 'contact_customer';

  customerSyncTimes = 0;

  colleagueSyncTimes = 0;

  isSyncing = false;

  switchSync = true;

  private edmLastUpdateTime: number = Date.now();

  private lastEdmRoleRangeData: string[] | undefined;

  private lastEdmRoleViewData: boolean | undefined;

  tableNames: Record<ContactEdmTableName, ContactEdmTableName> = {
    contact: 'contact',
    org: 'org',
    orgContact: 'orgContact',
    orgManager: 'orgManager',
    label: 'label',
    colleagueContact: 'colleagueContact',
  };

  getContactEdmLastUpdateTime() {
    return this.edmLastUpdateTime;
  }

  setContactEdmLastUpdateTime(lastUpdateTime?: number) {
    this.edmLastUpdateTime = lastUpdateTime || Date.now();
  }

  getContactEdmSyncTimes() {
    return this.customerSyncTimes;
  }

  getColleagueSyncTimes() {
    return this.colleagueSyncTimes;
  }

  // 通过负责人获取客户列表
  async syncCustomerListByManagerId(params: { idList: string[]; page?: number; from?: 'all' | 'filter' }) {
    const { idList, page = 1, from = 'filter' } = params;
    try {
      const { success, data } = await this.contactServer.getCustomerListByManagerId({ idList, page, from });
      if (success && data) {
        const promiseList: Promise<any>[] = [];
        if (data.list.length > 0) {
          const ids: string[] = [];
          data.list.forEach(item => {
            if (item.company_id) {
              ids.push(item.company_id);
            }
          });
          promiseList.push(
            this.contactServer
              .doGetCustomersFromServerBatch({
                idList: ids,
              })
              .then(async result => {
                if (Array.isArray(result) && result.length > 0) {
                  await this.handleCustomerList({
                    data: result,
                    needDeleteLastData: true,
                    sendEvent: true,
                  });
                  return true;
                }
                return false;
              })
          );
        }
        if (data.loadMore) {
          promiseList.push(this.syncCustomerListByManagerId({ idList, page: page + 1, from: data.from }));
        }
        await Promise.all(promiseList);
        return {
          success: true,
        };
      }
      return {
        success,
      };
    } catch (error: any) {
      return {
        success: false,
      };
    }
  }

  setLastEdmRoleData(params: { privilegeMap?: Map<string, Set<string>>; contactPrivilegeRangeData?: string[] }) {
    const { privilegeMap, contactPrivilegeRangeData } = params;
    if (privilegeMap && this.lastEdmRoleViewData === undefined) {
      this.lastEdmRoleViewData = this.edmRoleApi.doGetContactViewPrivilege();
    }

    if (contactPrivilegeRangeData && this.lastEdmRoleViewData === undefined) {
      this.lastEdmRoleRangeData = this.edmRoleApi.doGetContactPrivilegeRangeData();
    }
  }

  // 判断是否需要强制更新全部客户数据
  async needForceSyncCustomerList(): Promise<{ force: boolean; idList?: string[] }> {
    try {
      await Promise.all([this.edmRoleApi.getCurrentPrivilege(), this.edmRoleApi.getModuleDataRange('CONTACT')]);
      const privilegeMap = this.edmRoleApi.doGetPrivilegeMap();
      const roleRangeData = this.edmRoleApi.doGetContactPrivilegeRangeData();
      if (privilegeMap === undefined || roleRangeData === undefined) {
        return { force: false };
      }
      const roleViewData = this.edmRoleApi.doGetContactViewPrivilege();
      if (this.lastEdmRoleRangeData === undefined || this.lastEdmRoleViewData === undefined) {
        this.lastEdmRoleViewData = roleViewData;
        this.lastEdmRoleRangeData = roleRangeData;
        return { force: false };
      }
      if (this.lastEdmRoleViewData !== roleViewData) {
        this.lastEdmRoleViewData = roleViewData;
        this.lastEdmRoleRangeData = roleRangeData;
        return { force: true, idList: roleRangeData };
      }
      const { deleteDiff, insertDiff } = util.getDiffNew(this.lastEdmRoleRangeData, roleRangeData);
      const idList = [...deleteDiff, ...insertDiff];
      if (idList?.length) {
        this.lastEdmRoleViewData = roleViewData;
        this.lastEdmRoleRangeData = roleRangeData;
        return {
          force: true,
          idList,
        };
      }
      return {
        force: false,
      };
    } catch (e) {
      console.error('[contact_edm] needForceSyncCustomerList error', e);
      return { force: false };
    }
  }

  sendEdmColleagueNotify() {
    const syncTimes = this.getColleagueSyncTimes() + 1;
    this.colleagueSyncTimes = syncTimes;
    const contactNotifyData: SystemEvent = {
      eventName: 'colleagueEdmNotify',
      eventStrData: 'notify',
      eventData: {
        syncTimes,
      },
      eventSeq: 0,
      noLog: true,
    };
    this.eventApi.sendSysEvent(contactNotifyData);
  }

  sendContactEdmNotify(res: ContactEdmSyncRes = {}, syncAll = false) {
    this.setContactEdmLastUpdateTime();
    const customerSyncTimes = this.getContactEdmSyncTimes() + 1;
    this.customerSyncTimes = customerSyncTimes;
    console.log('[contact] contactEdmNotify send', res);
    const contactIdList = res.contactList || [];
    const contactNotifyData: SystemEvent = {
      eventName: 'contactEdmNotify',
      eventStrData: syncAll ? 'notifyAll' : 'notify',
      eventSeq: 0,
      noLog: true,
    };
    if (contactIdList.length > 1000) {
      const list = util.sliceList(contactIdList);
      list.forEach((item, i) => {
        window.setTimeout(() => {
          const eventData: ContactEdmSyncRes = {
            contactList: item,
            customerSyncTimes,
            needSync: i === list.length - 1,
            type: res.type || 'customer',
            isForce: res.isForce,
          };
          this.eventApi.sendSysEvent({ ...contactNotifyData, eventData });
        }, 0);
      });
    } else {
      const eventData: ContactEdmSyncRes = {
        contactList: contactIdList,
        customerSyncTimes,
        needSync: true,
        type: res.type || 'customer',
        isForce: res.isForce,
      };
      this.eventApi.sendSysEvent({ ...contactNotifyData, eventData });
    }
    // const orgIdList = res.orgList || [];
    // if (orgIdList.length > 1000) {
    //   const list = this.sliceList(contactIdList);
    //   list.forEach(item => {
    //     window.setTimeout(() => {
    //       const eventData: ContactEdmSyncRes = { orgList: item, customerSyncTimes };
    //       this.eventApi.sendSysEvent({ ...contactNotifyData, eventData });
    //     }, 0);
    //   });
    // } else if (orgIdList.length) {
    //   const eventData: ContactEdmSyncRes = { orgList: orgIdList, customerSyncTimes };
    //   this.eventApi.sendSysEvent({ ...contactNotifyData, eventData });
    // }
  }

  /**
   * 定于过滤函数
   */
  filterFunctions: Record<CustomerFilterType, QueryFilterFunc> = {
    searchContact: (item: resultObject, params?: QueryConfig) => {
      if (!params || !params.additionalData?.query) {
        return false;
      }
      const reg = new RegExp(util.escapeRegex(params.additionalData.query), 'i');
      const searchItems = ['name', 'contactPYName', 'contactPYLabelName', 'account'];
      return searchItems.some(value => reg.test(item[value]));
    },
    searchOrg: (item: resultObject, params?: QueryConfig) => {
      if (!params || !params.additionalData?.query) {
        return false;
      }
      const reg = new RegExp(util.escapeRegex(params.additionalData.query), 'i');
      const searchItems = ['orgName', 'orgPYName'];
      return searchItems.some(value => reg.test(item[value]));
    },
    searchMyCustomer: (item: resultObject, params?: QueryConfig) => {
      if (!params || !params.additionalData?.searchParams) {
        return false;
      }
      const { query, currentAccountId, type } = params.additionalData.searchParams || {};
      const reg = new RegExp(util.escapeRegex(query), 'i');
      const searchItems = ['orgName', 'orgPYName'];
      return item.type === type && item.managerList?.includes(currentAccountId) && searchItems.some(value => reg.test(item[value]));
    },
    searchMemoryContact: (item: resultObject, params?: QueryConfig) => {
      if (!params || !params.additionalData?.query) {
        return false;
      }
      const reg = new RegExp(util.escapeRegex(params.additionalData.query), 'i');
      const searchItems = ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'];
      return searchItems.some(value => reg.test(item[value]));
    },
  };

  /**
   * 获取当前公司
   * @private
   */
  private getCurrentDomain() {
    return this.systemApi.getCurrentUser()?.domain;
  }

  /**
   * 往db_impl加入filter函数
   */
  addFilterRegistry() {
    Object.keys(customerFilterNames).forEach(filterName => {
      this.dbApi.addFilterRegistry({
        filterFunc: this.filterFunctions[filterName as CustomerFilterType],
        name: filterName,
      });
    });
  }

  async handlePushCustomerMgs(params: CustomerUpdatePushMsg) {
    const idList = params.companyIds;
    if (idList?.length) {
      const result = await this.contactServer.doGetCustomersFromServerBatch({
        idList,
      });
      let newIdList: string[] = [];
      let needNotifyContactIdList: Set<string> = new Set();
      const _lastUpdateTime = Date.now();
      if (Array.isArray(result) && result.length > 0) {
        const { orgList, updateContactIdList } = await this.handleCustomerList({
          data: result,
          needDeleteLastData: true,
          sendEvent: true,
          _lastUpdateTime,
        });
        newIdList = util.getKeyListByList<string>(orgList, 'id', true);
        needNotifyContactIdList = new Set([...updateContactIdList]);
      }
      const { deleteDiff } = util.getDiff<string>(idList.map(this.contactTrans.createCustomerId), newIdList);
      if (deleteDiff.length) {
        const { contactIdList } = await this.deleteDataByOrgId(deleteDiff, _lastUpdateTime);
        needNotifyContactIdList = new Set([...needNotifyContactIdList, ...contactIdList]);
      }
      this.sendContactEdmNotify(
        {
          type: 'customer',
          orgList: deleteDiff,
          contactList: [...needNotifyContactIdList],
        },
        true
      );
    }
  }

  handleCustomerListRes(data: CustomerResFromServer[]): CustomerSyncTempRes {
    const result: CustomerSyncTempRes = {
      orgList: [],
      managerList: [],
      contactList: [],
      orgContactList: [],
      customerIdList: [],
    };
    const _lastUpdateTime = Date.now();
    data.forEach(item => {
      const orgId = this.contactTrans.createCustomerOrgId(item, 'customer');
      result.customerIdList.push(orgId);
      const hasEmail = !!item.contact_list?.some((curContact: resultObject) => curContact.email);
      if (!item.delFlag && hasEmail) {
        // 转化客户联系人数据结构
        const res = this.contactTrans.transToContact(item, 'customer', _lastUpdateTime);
        result.contactList = result.contactList.concat(res.contactList);
        result.orgContactList = result.orgContactList.concat(res.orgContactList);
        // 转换客户的所有者的数据结构
        result.managerList = result.managerList.concat(this.contactTrans.transCustomerToOrgManager(item, _lastUpdateTime));
        // 转换客户的数据结构
        result.orgList.push(this.contactTrans.transCustomerToOrg(item, _lastUpdateTime));
      }
    });
    return result;
  }

  handleCustomerListSeverRes(data: CustomerResFromServer[]): CustomerEntityForMail[] {
    const result: CustomerEntityForMail[] = [];
    const _lastUpdateTime = Date.now();
    data.forEach(item => {
      const hasEmail = !!item.contact_list?.some((curContact: resultObject) => curContact.email);
      if (!item.delFlag && hasEmail) {
        let transDataItem: CustomerEntityForMail = {} as CustomerEntityForMail;
        const org = this.contactTrans.transCustomerToOrg(item, _lastUpdateTime);
        const res = this.contactTrans.transToContact(item, 'customer', _lastUpdateTime);
        const managerList = this.contactTrans.transCustomerToOrgManager(item, _lastUpdateTime);
        transDataItem = {
          ...org,
          contactList: res.contactList,
          orgContactList: res.orgContactList,
          managerList,
        };
        result.push(transDataItem);
      }
    });
    return result;
  }

  /**
   * 处理客户列表服务器数据
   */
  async handleCustomerList(params: HandleOrgListParams): Promise<CustomerSyncRes> {
    const { data, needDeleteLastData = true, _lastUpdateTime } = params;
    const { orgList, managerList, contactList, orgContactList, idList, contactModelList } = this.contactTrans.transServerRepToDB(data, 'customer', _lastUpdateTime);
    let saveRes: CustomerSaveDBRes = {
      updateContactIdList: [],
      updateOrgContactIdList: [],
      updateOrgManagerIdList: [],
    };
    try {
      saveRes = await this.doSaveCustomerListToDB({
        orgList,
        contactList,
        managerList,
        orgContactList,
        idList,
        needDeleteLastData,
      });
      const contactIdList = util.getKeyListByList(contactList, 'id');
      const orgIdList = util.getKeyListByList(orgList, 'id');
      this.sendContactEdmNotify(
        {
          contactList: contactIdList,
          orgList: orgIdList,
          type: 'customer',
        },
        params.sendEvent
      );
    } catch (e) {
      console.error('[contact_edm] handleCustomerList error', e);
    }
    return {
      orgList,
      managerList,
      contactList,
      orgContactList,
      contactModelList,
      ...saveRes,
    };
  }

  /**
   * 处理线索列表服务器数据
   */
  async handleClueList(params: HandleOrgListParams): Promise<CustomerSyncRes> {
    const { data, needDeleteLastData = true, _lastUpdateTime } = params;
    const { orgList, managerList, contactList, orgContactList, idList, contactModelList } = this.contactTrans.transServerRepToDB(data, 'clue', _lastUpdateTime);
    let saveRes: CustomerSaveDBRes = {
      updateContactIdList: [],
      updateOrgContactIdList: [],
      updateOrgManagerIdList: [],
    };
    try {
      saveRes = await this.doSaveCustomerListToDB({
        orgList,
        contactList,
        managerList,
        orgContactList,
        idList,
        needDeleteLastData,
      });
      const contactIdList = util.getKeyListByList(contactList, 'id');
      const orgIdList = util.getKeyListByList(orgList, 'id');
      this.sendContactEdmNotify({
        contactList: contactIdList,
        orgList: orgIdList,
        type: 'clue',
      });
    } catch (e) {
      console.error('[contact_edm] handleClueList error', e);
    }
    return {
      orgList,
      managerList,
      contactList,
      orgContactList,
      contactModelList,
      ...saveRes,
    };
  }

  /**
   * DB中新增客户
   */
  async doSaveCustomerListToDB(params: SaveCustomerListToDBParams): Promise<CustomerSaveDBRes> {
    const { orgList, contactList, orgContactList, managerList, needDeleteLastData = true, idList } = params;
    let updateContactIdList = new Set<string>();
    let updateOrgContactIdList = new Set<string>();
    let updateOrgManagerIdList = new Set<string>();
    if (!Array.isArray(orgList) || orgList.length === 0) {
      return {
        updateContactIdList: [],
        updateOrgContactIdList: [],
        updateOrgManagerIdList: [],
      };
    }
    // 先把所有加入数据库
    await Promise.all([
      this.putAll(this.tableNames.org, orgList),
      this.putAll(this.tableNames.contact, contactList),
      this.putAll(this.tableNames.orgContact, orgContactList),
      this.putAll(this.tableNames.orgManager, managerList),
    ]);
    contactList?.forEach(item => {
      updateContactIdList.add(item.id);
    });
    orgContactList?.forEach(item => {
      updateOrgContactIdList.add(item.id);
    });
    managerList?.forEach(item => {
      updateOrgManagerIdList.add(item.id);
    });
    // 删除增量更新的id对应没有改变的数据
    const { _lastUpdateTime } = orgList[0];
    if (needDeleteLastData && idList.length && _lastUpdateTime) {
      // 删除小于当前插入数据库的条目
      const { contactIdList = [], orgContactIdList = [], orgManagerIdList = [] } = await this.deleteDataByOrgId(idList, _lastUpdateTime);
      updateContactIdList = new Set([...updateContactIdList, ...contactIdList]);
      updateOrgContactIdList = new Set([...updateOrgContactIdList, ...orgContactIdList]);
      updateOrgManagerIdList = new Set([...updateOrgManagerIdList, ...orgManagerIdList]);
    }
    return {
      updateContactIdList: [...updateContactIdList],
      updateOrgContactIdList: [...updateOrgContactIdList],
      updateOrgManagerIdList: [...updateOrgContactIdList],
    };
  }

  async handleColleagueList(list: resultObject[], needDeleteLastData = true): Promise<EntityCustomerUnitContact[]> {
    try {
      const _lastUpdateTime = Date.now();
      let insertData: EntityCustomerUnitContact[] = [];
      list.forEach(item => {
        insertData = insertData.concat(this.contactTrans.transColleagueToUnitContact(item, _lastUpdateTime));
      });
      await this.dbApi.putAll(
        {
          tableName: this.tableNames.colleagueContact,
          dbName: this.customerDBName,
        },
        insertData
      );
      if (needDeleteLastData) {
        await this.dbApi.deleteByByRangeCondition({
          dbName: this.customerDBName,
          tableName: this.tableNames.colleagueContact,
          adCondition: {
            field: '_lastUpdateTime',
            args: [0, _lastUpdateTime - 10, true, true],
            type: 'between',
          },
        });
      }
      this.sendEdmColleagueNotify();
      return insertData;
    } catch (e) {
      console.error('[contact_edm] handleColleagueList error', e);
      return [];
    }
  }

  createRole(role: CustomerRoleExtra, type: CustomerType): EmailRoles {
    return (role + type) as EmailRoles;
  }

  parseRole(role: EmailRoles): { customerType: CustomerOrgType; customerRole: CustomerRole } {
    console.log(role);
    return {
      customerType: 'customer',
      customerRole: 'manager',
    };
  }

  /**
   * 查询contact_global库中数据
   * @param params 查询条件
   */
  async doSearchAll(params: CustomerSearchCondition): Promise<CustomerSearchRes> {
    const start = Date.now();
    const { query } = params;
    const [_contactList, _searchOrgList] = await Promise.all([this.doSearchContact<EntityCustomerContact>({ query }), this.doSearchOrg<CustomerOrg>({ query })]);
    const idList = util.getKeyListByList(_contactList, 'id');
    const orgContactList = await this.getOrgContactById<EntityCustomerOrgContact>({ idList, field: 'contactId', needLog: true });
    const contactOrgMap = new Map<string, string>();
    const orgIdSet = new Set<string>();
    _searchOrgList.forEach(item => {
      orgIdSet.add(item.id);
    });
    orgContactList.forEach(item => {
      contactOrgMap.set(item.contactId, item.orgId);
      orgIdSet.add(item.orgId);
    });
    const orgIdList = [...orgIdSet];
    const [orgManagerList, orgList] = await Promise.all([
      this.getOrgManagerByOrgId<EntityCustomerOrgManager>({
        idList: orgIdList,
        needLog: true,
      }),
      this.getDataById<CustomerOrg>({
        tableName: 'org',
        idList: orgIdList,
        needLog: true,
      }),
    ]);

    const orgIdRole = await this.getOrgAllRole(orgManagerList);
    const contactList = _contactList.filter(item => {
      const orgId = contactOrgMap.get(item.id);
      const { hasRole } = this.getCustomerRole(orgIdRole, orgId);
      return hasRole;
    });
    contactList.sort((a, b) => {
      const aOrgId = contactOrgMap.get(a.id);
      const bOrgId = contactOrgMap.get(b.id);
      const { customerRole: aRole } = this.getCustomerRole(orgIdRole, aOrgId);
      const { customerRole: bRole } = this.getCustomerRole(orgIdRole, bOrgId);
      const curNumber = this.getCustomerOrderNumber(a.customerType as CustomerOrgType, aRole);
      const preNumber = this.getCustomerOrderNumber(b.customerType as CustomerOrgType, bRole);
      return curNumber > preNumber ? -1 : 1;
    });
    const searchOrgList = _searchOrgList.filter(item => {
      const { hasRole } = this.getCustomerRole(orgIdRole, item.id);
      return hasRole;
    });
    searchOrgList.sort((a, b) => {
      const { customerRole: aRole } = this.getCustomerRole(orgIdRole, a.id);
      const { customerRole: bRole } = this.getCustomerRole(orgIdRole, b.id);
      const curNumber = this.getCustomerOrderNumber(a.customerType as CustomerOrgType, aRole);
      const preNumber = this.getCustomerOrderNumber(b.customerType as CustomerOrgType, bRole);
      if (curNumber === preNumber) {
        return a.orgRank > b.orgRank ? -1 : 1;
      }
      return curNumber > preNumber ? -1 : 1;
    });
    const orgMap = new Map<string, CustomerOrg>();
    orgList.forEach(item => {
      orgMap.set(item.id, item);
    });
    const contact: ContactModel[] = contactList.map(item => {
      const curOrgId = contactOrgMap.get(item.id);
      const tranModel = this.contactTrans.transCustomerToContactModel(item);
      const mode = util.addHitQuery({
        data: tranModel,
        queryList: [query],
        hitList: this.contactUtil.contactTableHitList,
      });
      if (curOrgId) {
        const curOrg = orgMap.get(curOrgId);
        if (curOrg) {
          const { customerRole } = this.getCustomerRole(orgIdRole, curOrgId);
          mode.customerOrgModel = {
            role: customerRole,
            companyId: curOrgId,
          };
        }
      }
      return mode;
    });
    const customer: EntityCustomerOrg[] = [];
    const clue: EntityClueOrg[] = [];
    searchOrgList.forEach(_item => {
      const item = util.addHitQuery({
        data: _item,
        queryList: [query],
        hitList: this.contactUtil.orgTableHitList,
      });
      const { customerRole } = this.getCustomerRole(orgIdRole, item.id);
      if (item.customerType.startsWith('customer')) {
        customer.push({
          ...item,
          customerRole,
        } as EntityCustomerOrg);
      } else {
        clue.push({
          ...item,
          customerRole,
        } as EntityClueOrg);
      }
    });
    this.logger('contact_edm_doSearchAll', this.useTime(start));
    return {
      contact,
      customer,
      clue,
    };
  }

  async getContactId() {
    const contactId = this.contactUtil.getCurrentContactId();
    if (!contactId) {
      try {
        await this.accountApi.doGetMailAliasAccountListV2();
      } catch (e) {
        throw new Error('request contactId fail');
      }
    }
    return this.contactUtil.getCurrentContactId();
  }

  /**
   * 获取当前账号的联系人id
   * @private
   */
  async getCurrentContactId(params?: { _account?: string; accountType?: 'email' | 'id' }): Promise<string> {
    let account = params?._account;
    const accountType = params?.accountType || 'email';
    if (accountType === 'email') {
      account = account || this.contactUtil.getCurrentAccount();
      if (account === this.contactUtil.getCurrentAccount()) {
        return this.getContactId();
      }
      const contactItemList = await this.contactDB.getContactItemListByItem([account]);
      const curContactItem = contactItemList.find(item => item.contactItemType === 'EMAIL' && item.type === 'enterprise');
      account = curContactItem?.contactId;
    } else {
      account = account || (await this.getContactId());
    }
    return account || '';
  }

  async doSearchAllInMemory(params: CustomerSearchCondition): Promise<CustomerSearchContactMemoryRes> {
    const start = Date.now();
    const { query, _account: curAccount, edmUseMainAccount = true } = params;
    // 外贸通0510,因为挂载账号统一都使用登录账号的客户信息，所以此处直接使用默认
    // edmUseMainAccount参数控制是否使用主账号，默认是true，会覆盖传入的_account,如果需要使用传入的_account,则需要设置edmUseMainAccount为false
    let _account = curAccount || this.contactUtil.getCurrentAccount();
    if (edmUseMainAccount) {
      _account = this.contactUtil.getCurrentAccount();
    }

    // 搜索内存命中的联系人列表和客户列表
    const [contactList, searchOrgList] = await Promise.all([
      this.doSearchContact<CustomerContactSearch>({
        query,
        dbName: this.contactUtil.edmcontactSearchDbName,
        tableName: this.tableNames.contact,
        filterName: customerFilterNames.searchMemoryContact,
      }),
      this.doSearchOrg<CustomerOrgSearch>({
        query,
        dbName: this.contactUtil.edmcontactSearchDbName,
        tableName: this.tableNames.org,
      }),
    ]);

    // 当前用户id，用来判断是不是我的客户
    const currentAccountId = await this.getCurrentContactId({ _account });
    // 客户权限列表
    const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
    const roleAccountIds = this.edmRoleApi.doGetContactPrivilegeRangeData();
    const contact: CustomerContactSearch[] = [];
    contactList.forEach(_item => {
      // 给搜索联系人添加高亮，命中的key
      const item = util.addHitQuery({
        data: _item,
        queryList: [query],
        hitList: this.contactUtil.CustomerContactSearchHitList,
      });
      // 设置客户类型
      const customerRole = this.contactUtil.getCustomerRoleByMangerIds({ currentAccountId, managerIds: _item.managerList, roleAccountIds, viewRole });
      // 过滤无权限
      if (!customerRole.startsWith('noRole')) {
        contact.push({
          ...item,
          customerRole,
        });
      }
    });
    // 设置客户联系人排序
    contact.sort((a, b) => {
      const aRole = a.customerRole;
      const bRole = b.customerRole;
      const curNumber = this.getCustomerOrderNumber(a.type, aRole);
      const preNumber = this.getCustomerOrderNumber(b.type, bRole);
      return curNumber > preNumber ? -1 : 1;
    });
    const customer: CustomerOrgSearch[] = [];
    const clue: CustomerOrgSearch[] = [];
    searchOrgList.forEach(_item => {
      // 给搜索客户添加高亮，命中的key
      const item = util.addHitQuery({
        data: _item,
        queryList: [query],
        hitList: this.contactUtil.orgTableHitList,
      });
      // 设置客户类型
      const customerRole = this.contactUtil.getCustomerRoleByMangerIds({ currentAccountId, managerIds: _item.managerList, roleAccountIds, viewRole });
      // 过滤无权限，以及给数据分类（客户，线索）
      if (!customerRole.startsWith('noRole')) {
        if (item.type === 2002) {
          customer.push({
            ...item,
            customerType: 'customer',
            customerRole,
          });
        } else {
          clue.push({
            ...item,
            customerType: 'clue',
            customerRole,
          });
        }
      }
    });
    // 设置客户排序
    customer.sort((a, b) => {
      const curNumber = this.getCustomerOrderNumber('customer', a.customerRole);
      const preNumber = this.getCustomerOrderNumber('customer', b.customerRole);
      if (curNumber === preNumber) {
        return a.orgRank > b.orgRank ? -1 : 1;
      }
      return curNumber > preNumber ? -1 : 1;
    });
    // 设置线索排序
    clue.sort((a, b) => {
      const curNumber = this.getCustomerOrderNumber('clue', a.customerRole);
      const preNumber = this.getCustomerOrderNumber('clue', b.customerRole);
      if (curNumber === preNumber) {
        return a.orgRank > b.orgRank ? -1 : 1;
      }
      return curNumber > preNumber ? -1 : 1;
    });
    this.logger('contact_edm_doSearchAll', this.useTime(start));
    return {
      contact,
      customer,
      clue,
    };
  }

  useTime(start: number) {
    return Date.now() - start + 'ms';
  }

  logger(key: string, data?: resultObject | string) {
    console.warn(key, data);
    this.loggerApi.track(key, {
      appendix: 'contact',
      data,
    });
  }

  /**
   * 搜索联系人表
   * @param params
   */
  async doSearchContact<T = resultObject>(params: CustomerSearchCondition) {
    const { query, limit = this.contactUtil.searchTableLimit, lastId, count, dbName, tableName, filterName } = params;
    const _company = this.getCurrentDomain();
    const start = Date.now();
    const res = await this.dbApi.getByRangeCondition<T>({
      dbName: dbName || this.contactUtil.contactCustomerGlobalDBName,
      tableName: tableName || this.tableNames.contact,
      adCondition: {
        type: 'above',
        args: [lastId || 0],
        field: 'id',
      },
      filter: filterName || customerFilterNames.searchContact,
      useDexieFilter: false,
      filterLimit: limit,
      query: {
        _company,
      },
      additionalData: {
        query,
        parentName: 'contact_edm_doSearchContact',
      },
      count,
    });
    this.logger('contact_edm_doSearchContact', this.useTime(start));
    return res;
  }

  /**
   * 搜索客户/线索表
   * @param params
   */
  async doSearchOrg<T = resultObject>(params: CustomerSearchCondition) {
    const { query, limit = this.contactUtil.searchTableLimit, count, lastId, tableName, dbName } = params;
    const _company = this.getCurrentDomain();
    const start = Date.now();
    const res = await this.dbApi.getByRangeCondition<T>({
      dbName: dbName || this.contactUtil.contactCustomerGlobalDBName,
      tableName: tableName || this.tableNames.org,
      filter: customerFilterNames.searchOrg,
      adCondition: {
        type: 'above',
        args: [lastId || 0],
        field: 'id',
      },
      filterLimit: limit,
      useDexieFilter: false,
      query: {
        _company,
      },
      count,
      additionalData: {
        query,
        parentName: 'contact_edm_doSearchOrg',
      },
    });
    this.logger('contact_edm_doSearchOrg', this.useTime(start));
    return res;
  }

  /**
   * 搜索我的客户
   */
  async doSearchMyCustomer(condition: MyCustomerSearchCondition): Promise<CustomerOrgSearch[]> {
    const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
    if (!viewRole) {
      return [];
    }
    const { query, limit = 50, lastId, _account } = condition;
    const currentAccountId = await this.getCurrentContactId({ _account });
    const _company = this.getCurrentDomain();
    const searchOrgList = await this.dbApi.getByRangeCondition<CustomerOrgSearch>({
      dbName: this.contactUtil.edmcontactSearchDbName,
      tableName: this.tableNames.org,
      filter: customerFilterNames.searchMyCustomer,
      useDexieFilter: false,
      query: {
        _company,
      },
      additionalData: {
        searchParams: {
          query,
          type: 2002,
          currentAccountId,
        },
        parentName: 'contact_edm_doSearchOrg',
      },
    });
    searchOrgList.sort((a, b) => (a.orgRank > b.orgRank ? -1 : 1));
    let index = searchOrgList.findIndex(item => item.id === lastId);
    index = index === -1 ? 0 : index;
    const res: CustomerOrgSearch[] = searchOrgList.slice(index, index + limit);
    // let flag = !lastId;
    // searchOrgList.some(item => {
    //   if (res.length < limit) {
    //     if (flag) {
    //       res.push(item);
    //     } else if (item.id === lastId) {
    //       flag = true;
    //     }
    //     return true;
    //   }
    //   return false;
    // });
    return res;
  }

  sendSelectNotifyByEmails(emails: Set<string>) {
    this.doGetContactByEmails({ emails: [...emails] });
  }

  /**
   * 通过客户联系人id返回详情
   * @param params
   */
  async doGetCustomerContactByIds(params: { idList: string[]; contactList?: ContactModel[] }): Promise<ContactModel[]> {
    const { idList, contactList } = params;
    const orgContactList = await this.getOrgContactById<EntityCustomerOrgContact>({ idList, field: 'contactId' });
    const contactOrgMap = new Map<string, string>();
    const orgIdSet = new Set<string>();
    orgContactList.forEach(item => {
      contactOrgMap.set(item.contactId, item.orgId);
      orgIdSet.add(item.orgId);
    });
    const orgIdList = [...orgIdSet];
    const { orgMap, contactMap, orgIdRole } = await this.handleOrg({ orgIdList, contactIdList: idList, contactList });
    const res: ContactModel[] = [];
    idList.forEach(id => {
      const curOrgId = contactOrgMap.get(id);
      const { customerRole, hasRole } = this.getCustomerRole(orgIdRole, curOrgId);
      if (curOrgId && hasRole) {
        const mode = contactMap.get(id);
        if (mode) {
          const curOrg = orgMap.get(curOrgId);
          if (curOrg) {
            mode.customerOrgModel = {
              role: customerRole,
              companyId: curOrgId,
            };
          }
          res.push(mode);
        }
      }
    });
    // 查询过emd的联系人通知ui
    this.contactSelectNotify.addRecentSelectContactMap([...contactMap.values()]);
    return res;
  }

  async doGetCustomerManagerByIds(params: { idList: string[] }): Promise<Record<string, SimpleContactModel[]>> {
    const { idList } = params;
    const orgManagerList = await this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList });
    return this.transCustomerToSimpleContactModel(orgManagerList);
  }

  async transCustomerToSimpleContactModel(orgManagerList: EntityCustomerOrgManager[]): Promise<Record<string, SimpleContactModel[]>> {
    const contactIdSet = new Set();
    const res: Record<string, SimpleContactModel[]> = {};
    const needSelectContactIdMap: Record<string, string[]> = {};
    orgManagerList.forEach(item => {
      if (item.managerAccount) {
        const list: SimpleContactModel[] = res[item.orgId] || [];
        list.push({
          account: item.managerAccount,
          contactName: item.managerName,
          contactId: item.managerId,
        });
        res[item.orgId] = list;
      } else {
        const list = needSelectContactIdMap[item.orgId] || [];
        list.push(item.managerId);
        contactIdSet.add(item.managerId);
        needSelectContactIdMap[item.orgId] = list;
      }
    });
    if (contactIdSet.size) {
      const contactList = await this.contactDB.getContactList({
        idList: [...contactIdSet],
      });
      const contactMap = util.listToMap(contactList, 'id');
      Object.keys(needSelectContactIdMap).forEach(orgId => {
        const list: SimpleContactModel[] = res[orgId] || [];
        needSelectContactIdMap[orgId].forEach(contactId => {
          const item = contactMap[contactId];
          list.push({
            account: item.accountName,
            contactId: item.id,
            contactName: item.contactName,
          });
        });
        res[orgId] = list;
      });
    }
    return res;
  }

  /**
   * 通过客户/线索id获取联系人数据
   * @param params id集合
   */
  async doGetContactByOrgIds(params: { idList: string[] }): Promise<Record<string, ContactModel[]>> {
    try {
      const { idList } = params;
      const orgContactListOrigin = await this.getOrgContactById<EntityCustomerOrgContact>({ idList, field: 'orgId' });
      const orgContactList = await this.getOrgContactByEmails({
        emails: util.getKeyListByList(orgContactListOrigin, 'account', true),
      });
      const contactIdSet = new Set<string>();
      const orgIdMap = new Map<string, Set<string>>();
      orgContactList.forEach(item => {
        contactIdSet.add(item.contactId);
        const curIdSet = orgIdMap.get(item.orgId) || new Set<string>();
        curIdSet.add(item.contactId);
        orgIdMap.set(item.orgId, curIdSet);
      });
      const { orgList, orgMap, contactMap, orgIdRole } = await this.handleOrg({ orgIdList: [...orgIdMap.keys()], contactIdList: [...contactIdSet] });
      const res: Record<string, ContactModel[]> = {};
      orgIdMap.forEach((curContactIdSet, orgId) => {
        const curOrg = orgMap.get(orgId);
        const modelList: ContactModel[] = [];
        let customerOrgModel: ContactModel['customerOrgModel'];
        const { customerRole, hasRole } = this.getCustomerRole(orgIdRole, orgId);
        if (curOrg && hasRole) {
          customerOrgModel = {
            role: customerRole,
            companyId: orgId,
          };
        }
        if (hasRole) {
          curContactIdSet.forEach(contactId => {
            const curContact = contactMap.get(contactId);
            if (curContact && curOrg) {
              const newModel = {
                ...curContact,
                customerOrgModel,
              };
              modelList.push(newModel);
              contactMap.set(contactId, newModel);
            }
          });
        }
        res[orgId] = modelList;
      });
      // 查询过emd的联系人通知ui
      this.contactSelectNotify.addRecentSelectContactMap([...contactMap.values()]);
      // 查询过emd的客户通知ui
      this.contactSelectNotify.addRecentSelectOrgMap(orgList);
      return res;
    } catch (e) {
      console.error('[contact_edm] doGetContactByOrgIds error', e);
      return {};
    }
  }

  /**
   * 获取所有的客户线索
   */
  async doGetOrgList(params?: { idList?: string[]; type?: CustomerOrgType }): Promise<Array<CustomerOrg>> {
    try {
      const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
      if (!viewRole) {
        return [];
      }
      const { idList, type } = params || {};
      if (idList) {
        return this.getDataById<CustomerOrg>({
          tableName: this.tableNames.org,
          idList,
        });
      }
      let currentContactId;
      try {
        currentContactId = await this.getCurrentContactId({
          accountType: 'id',
        });
        console.warn('[contact_edm] doGetOrgList no curAccount');
      } catch (e) {
        console.error('[contact_edm] doGetOrgList no currentAccount error', e);
        return [];
      }
      const args = [this.getCurrentDomain(), currentContactId];
      const field = ['_company', 'managerId'];
      if (type) {
        args.push(type);
        field.push('customerType');
      }
      const managerList = await this.dbApi.getByRangeCondition<EntityCustomerOrgManager>({
        dbName: this.dbName,
        tableName: this.tableNames.orgManager,
        adCondition: {
          field,
          type: 'equals',
          args: [args],
        },
      });
      const idSet = new Set<string>();
      managerList.forEach(item => {
        idSet.add(item.orgId);
      });
      const orgList = await this.getDataById<CustomerOrg>({
        tableName: 'org',
        idList: [...idSet],
      });
      const orderList = util.setDataOrder({
        data: orgList,
        orderBy: [['orgRank', false]],
      });
      // 查询过emd的客户通知ui
      this.contactSelectNotify.addRecentSelectOrgMap(orgList);
      return orderList;
    } catch (e) {
      console.error('[contact_edm] doGetOrgList error', e);
      return [];
    }
  }

  async doGetMyCustomerList(params: MyCustomerListParams): Promise<EntityCustomerOrg[]> {
    try {
      const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
      if (!viewRole) {
        return [];
      }
      const { lastId, limit } = params;
      let sortWeight = -Number.MAX_VALUE;
      if (lastId) {
        const startManager = await this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList: [lastId] });
        if (!startManager || startManager.length === 0) {
          return [];
        }
        sortWeight = startManager[0].sortWeight;
      }
      const field = ['_company', 'managerId', 'customerType', 'sortWeight'];
      const currentContactId = await this.getCurrentContactId({
        accountType: 'id',
      });
      const managerList = await this.dbApi.getByRangeCondition<EntityCustomerOrgManager>({
        dbName: this.dbName,
        tableName: this.tableNames.orgManager,
        count: limit + 1,
        adCondition: {
          field,
          type: 'between',
          args: [
            [this.getCurrentDomain(), currentContactId, 'customer', sortWeight],
            [this.getCurrentDomain(), currentContactId, 'customer', 0],
          ],
        },
      });
      if (managerList.length === limit + 1) {
        if (lastId) {
          managerList.shift();
        } else {
          managerList.pop();
        }
      }
      const orgIdList: string[] = [];
      managerList.forEach(item => {
        orgIdList.push(item.orgId);
      });
      const orgList = await this.getDataById<EntityCustomerOrg>({
        tableName: 'org',
        idList: orgIdList,
      });
      const orgMap = util.listToMap(orgList, 'id');
      const orderList: EntityCustomerOrg[] = [];
      orgIdList.forEach(orgId => {
        orderList.push(orgMap[orgId]);
      });
      // 查询过emd的客户通知ui
      this.contactSelectNotify.addRecentSelectOrgMap(orderList);
      return orderList;
    } catch (e) {
      console.error('[contact_edm] doGetCustomerListFromDb error', e);
      return [];
    }
  }

  /**
   * 获取我的客户列表（分页）
   */
  async doGetCustomerListFromDb(params: CustomerListParams): Promise<CustomerEntityForMail[]> {
    try {
      const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
      if (!viewRole) {
        return [];
      }
      const { lastId, limit } = params;
      let sortWeight = -Number.MAX_VALUE;
      if (lastId) {
        const startManager = await this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList: ['customer_' + lastId] });
        if (!startManager || startManager.length === 0) {
          return [];
        }
        sortWeight = startManager[0].sortWeight;
      }
      const field = ['_company', 'managerId', 'customerType', 'sortWeight'];
      const currentContactId = await this.getCurrentContactId({
        accountType: 'id',
      });
      const managerList = await this.dbApi.getByRangeCondition<EntityCustomerOrgManager>({
        dbName: this.dbName,
        tableName: this.tableNames.orgManager,
        count: limit + 1,
        adCondition: {
          field,
          type: 'between',
          args: [[this.getCurrentDomain(), currentContactId, 'customer', sortWeight], [this.getCurrentDomain(), currentContactId, 'customer', 0], false, true],
        },
      });
      // if (managerList.length === limit + 1) {
      //   if (lastId) {
      //     managerList.shift();
      //   } else {
      //     managerList.pop();
      //   }
      // }
      const orgIdList: string[] = [];
      managerList.forEach(item => {
        orgIdList.push(item.orgId);
      });
      const result = await this.doGetCustomerFromDbByIds({ idList: orgIdList });
      return result;
    } catch (e) {
      console.error('[contact_edm] doGetCustomerListFromDb error', e);
      return [];
    }
  }

  async doGetCustomerListFromServer(params: CustomerListParams): Promise<CustomerEntityForMail[]> {
    // 从服务端获取数据
    const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
    if (!viewRole) {
      return [];
    }
    const result = await this.contactServer.doGetCustomerListFromServer(params);
    if (Array.isArray(result) && result.length > 0) {
      const temp = this.handleCustomerListSeverRes(result);
      return temp;
    }
    return [];
  }

  async doGetCustomersFromServerBatch(params: { idList: string[] }): Promise<CustomerEntityForMail[]> {
    // 从服务端获取数据
    const result = await this.contactServer.doGetCustomersFromServerBatch(params);
    if (Array.isArray(result) && result.length > 0) {
      return this.handleCustomerListSeverRes(result);
    }
    return [];
  }

  /**
   * 通过orgIdList，找到客户的 orgManager 然后将当前用户从 manager 中删除
   */
  async doDelCustomerManager(params: { idList: string[] }): Promise<void> {
    const { idList: originId } = params;
    const idList = originId.map(this.contactTrans.createCustomerId);
    const _lastUpdateTime = Date.now();
    const currentContactId = await this.getCurrentContactId({
      accountType: 'id',
    });
    const orgManagerList = await this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList });
    const orgManagerIdList: string[] = [];
    orgManagerList.forEach(item => {
      if (item._lastUpdateTime < _lastUpdateTime - 10 && item.managerId === currentContactId) {
        orgManagerIdList.push(item.id);
      }
    });
    await this.deleteData(this.tableNames.orgManager, orgManagerIdList);
  }

  /**
   * 将服务端接口返回的 CustomerEntityForMail[] 存入DB
   */
  async doSaveCustomerToDb(data: CustomerEntityForMail[]): Promise<void> {
    const result: SaveCustomerListToDBParams = {
      orgList: [],
      contactList: [],
      orgContactList: [],
      managerList: [],
      idList: [],
    };
    data.forEach(item => {
      result.contactList = result.contactList.concat(item.contactList);
      result.orgContactList = result.orgContactList.concat(item.orgContactList);
      const managerList = item.managerList.map(manager => ({
        ...manager,
        sortWeight: -((manager.lastSetTopTime || 0) * 5 + (manager.lastMailTime || 0) * 2 + Number(item.originId || 0)),
      }));
      result.managerList = result.managerList.concat(managerList);
      result.idList.push(item.id);
      const _item = lodashOmit(item, ['contactList', 'orgContactList', 'managerList']);
      result.orgList.push(_item);
    });
    await this.doSaveCustomerListToDB(result);
  }

  /**
   * 通过 orgIdList 查询DB中的客户数据
   */
  async doGetCustomerFromDbByIds(params: { idList: string[] }): Promise<CustomerEntityForMail[]> {
    try {
      const result: CustomerEntityForMail[] = [];
      const { idList } = params;
      const orgContactListOrigin = await this.getOrgContactById<EntityCustomerOrgContact>({ idList, field: 'orgId' });
      const contactIdSet = new Set<string>();
      const orgIdOrgContactMap = new Map<string, Set<EntityCustomerOrgContact>>(); // key: orgId  value: EntityCustomerOrgContact
      const contactIdOrgIdMap = new Map<string, string>(); // key: contactId  value: orgId
      orgContactListOrigin.forEach(item => {
        contactIdSet.add(item.contactId);
        const curOrgContactSet = orgIdOrgContactMap.get(item.orgId) || new Set<EntityCustomerOrgContact>();
        curOrgContactSet.add(item);
        orgIdOrgContactMap.set(item.orgId, curOrgContactSet);
        contactIdOrgIdMap.set(item.contactId, item.orgId);
      });
      const [orgList, contactList, managerList] = await Promise.all([
        this.getDataById<EntityCustomerOrg>({
          idList,
          tableName: this.tableNames.org,
        }),
        this.getDataById<EntityCustomerContact>({
          idList: [...contactIdSet],
          tableName: this.tableNames.contact,
        }),
        this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList }),
      ]);
      const orgIdOrgMap = new Map<string, EntityCustomerOrg>();
      orgList.forEach(item => {
        orgIdOrgMap.set(item.id, item);
      });
      const orgIdmanagerListMap = new Map<string, Set<EntityCustomerOrgManager>>();
      managerList.forEach(item => {
        const curOrgIdManagerSet = orgIdmanagerListMap.get(item.orgId) || new Set<EntityCustomerOrgManager>();
        curOrgIdManagerSet.add(item);
        orgIdmanagerListMap.set(item.orgId, curOrgIdManagerSet);
      });
      const orgIdcontactListMap = new Map<string, Set<EntityCustomerContact>>();
      contactList.forEach(item => {
        const orgId = contactIdOrgIdMap.get(item.id);
        if (orgId) {
          const curOrgIdContactSet = orgIdcontactListMap.get(orgId) || new Set<EntityCustomerContact>();
          curOrgIdContactSet.add(item);
          orgIdcontactListMap.set(orgId, curOrgIdContactSet);
        }
      });
      idList.forEach(orgId => {
        const _contactList = [...(orgIdcontactListMap.get(orgId) || [])];
        const _managerList = [...(orgIdmanagerListMap.get(orgId) || [])];
        const _orgContactList = [...(orgIdOrgContactMap.get(orgId) || [])];
        const org = orgIdOrgMap.get(orgId);
        if (org) {
          result.push({
            ...org,
            contactList: _contactList,
            managerList: _managerList,
            orgContactList: _orgContactList,
          });
        }
      });
      return result;
    } catch (e) {
      console.error('[contact_edm] doGetCustomerFromDbByIds error', e);
      return [];
    }
  }

  async getOrgAllRole(orgManagerList: EntityCustomerOrgManager[]): Promise<Map<string, CustomerRoleExtra>> {
    const currentContactId = await this.getCurrentContactId({
      accountType: 'id',
    });
    const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
    const roleAccountIds = this.edmRoleApi.doGetContactPrivilegeRangeData() || [];
    const orgIdRole = new Map<string, CustomerRoleExtra>();
    orgManagerList.forEach(item => {
      if (!viewRole) {
        orgIdRole.set(item.orgId, 'noRoleColleague');
      } else {
        const preRole = orgIdRole.get(item.orgId);
        let curRole: CustomerRoleExtra = 'noRoleColleague';
        if (currentContactId === item.managerId) {
          curRole = roleAccountIds.includes(item.managerId) ? 'manager' : 'noRoleManager';
        } else {
          curRole = roleAccountIds.includes(item.managerId) ? 'colleague' : 'noRoleColleague';
        }
        orgIdRole.set(item.orgId, this.compareRole(curRole, preRole));
      }
    });
    return orgIdRole;
  }

  async handleOrg(params: { orgIdList: string[]; contactIdList: string[]; contactList?: ContactModel[] }) {
    const { orgIdList, contactIdList, contactList: defaultList } = params;
    const [orgManagerList, orgList, contactMap] = await Promise.all([
      this.getOrgManagerByOrgId<EntityCustomerOrgManager>({
        idList: orgIdList,
      }),
      this.getDataById<EntityCustomerOrg | EntityClueOrg>({
        idList: orgIdList,
        tableName: this.tableNames.org,
      }),
      defaultList
        ? Promise.resolve(
            (() => {
              const _contactMap = new Map<string, ContactModel>();
              defaultList.forEach(item => {
                _contactMap.set(item.contact.id, item);
              });
              return _contactMap;
            })()
          )
        : this.getDataById<EntityCustomerContact>({
            tableName: this.tableNames.contact,
            idList: contactIdList,
          }).then(res => {
            const _contactMap = new Map<string, ContactModel>();
            res.forEach(item => {
              _contactMap.set(item.id, this.contactTrans.transCustomerToContactModel(item));
            });
            return _contactMap;
          }),
    ]);
    const orgIdRole = await this.getOrgAllRole(orgManagerList);
    const orgMap = new Map<string, CustomerOrg>();
    orgList.forEach(item => {
      orgMap.set(item.id, item);
    });
    return {
      orgMap,
      contactMap,
      orgIdRole,
      orgList,
    };
  }

  compareRole(curRole: CustomerRoleExtra, preRole?: CustomerRoleExtra) {
    if (!preRole) {
      return curRole;
    }
    const roleList: CustomerRoleExtra[] = ['noRoleManager', 'manager', 'colleague', 'noRoleColleague'];
    const res = roleList.find(item => curRole === item || preRole === item);
    return res || curRole;
  }

  getCustomerRole(orgIdRoleMap: Map<string, CustomerRoleExtra>, orgId?: string): { hasRole: boolean; customerRole: EmailRoles } {
    if (!orgId) {
      return {
        customerRole: 'external',
        hasRole: false,
      };
    }
    const role = orgIdRoleMap.get(orgId);
    if (!role) {
      return {
        hasRole: true,
        customerRole: 'openSeaCustomer',
      };
    }
    const customerRole = this.contactTrans.transCustomerRole2EmailRole('customer', role as CustomerRole);
    return {
      hasRole: !role.endsWith('NoAuth'),
      customerRole,
    };
  }

  /**
   * 通过邮箱获取对应的客户联系人和客户信息
   * @param params
   */
  async doGetContactByEmails(params: { emails: string[] }): Promise<CustomerEmailModelRes> {
    try {
      const viewRole = this.edmRoleApi.doGetContactViewPrivilege();
      if (!viewRole) {
        return {
          modelRes: {},
          modelListRes: {},
        };
      }
      // 通过email获取contactId和orgId
      const orgContactList = await this.getOrgContactByEmails(params);
      const orgIdSet = new Set<string>();
      const contactIdSet = new Set<string>();
      const orgiginEmailMap: Map<string, string> = params.emails?.reduce((res, email) => {
        if (email) {
          const lowEmail = email.toLocaleLowerCase();
          res.set(lowEmail, email);
        }
        return res;
      }, new Map());
      // email-> contactId[]
      const emailContactMap: Map<string, Set<string>> = new Map();
      // contactId-> orgId[]
      const contactOrgMap: Map<string, string> = new Map();
      orgContactList.forEach(item => {
        const contactSet = emailContactMap.get(item.account) || new Set<string>();
        contactSet.add(item.contactId);
        emailContactMap.set(item.account, contactSet);
        contactOrgMap.set(item.contactId, item.orgId);
        orgIdSet.add(item.orgId);
        contactIdSet.add(item.contactId);
      });
      const { orgList, orgMap, contactMap, orgIdRole } = await this.handleOrg({ orgIdList: [...orgIdSet], contactIdList: [...contactIdSet] });
      const res: Record<string, ContactModel> = {};
      const modelListRes: Record<string, ContactModel[]> = {};
      emailContactMap.forEach((item, _email) => {
        let emailContactModel: ContactModel | undefined;
        const emailContactModelList: ContactModel[] = [];
        const email = orgiginEmailMap.get(_email);
        if (email) {
          item.forEach(contactId => {
            const model = contactMap.get(contactId);
            const currentOrgId = contactOrgMap.get(contactId);
            const { customerRole, hasRole } = this.getCustomerRole(orgIdRole, currentOrgId);
            if (model && currentOrgId && hasRole) {
              const currentOrg = orgMap.get(currentOrgId);
              if (currentOrg) {
                const relModel = {
                  ...model,
                  customerOrgModel: {
                    role: customerRole,
                    companyId: currentOrgId,
                  },
                };
                emailContactModelList.push(relModel);
                emailContactModel = this.validCustomer(relModel, emailContactModel);
                contactMap.set(contactId, relModel);
              } else {
                emailContactModel = this.validCustomer(model, emailContactModel);
              }
            }
          });
          if (emailContactModel) {
            res[email] = emailContactModel;
          }
          modelListRes[email] = emailContactModelList;
        }
      });
      // 查询过emd的联系人通知ui
      this.contactSelectNotify.addRecentSelectContactMap([...contactMap.values()]);
      // 查询过emd的客户通知ui
      this.contactSelectNotify.addRecentSelectOrgMap(orgList);
      return {
        modelRes: res,
        modelListRes,
      };
    } catch (e) {
      console.error('[contact_edm_help] doGetContactByEmails', e);
      return {
        modelRes: {},
        modelListRes: {},
      };
    }
  }

  async doUpdateClueToCustomer(params: { clueId: string; email: string; customerData: resultObject }): Promise<ContactModel | undefined> {
    const { clueId, email, customerData } = params;
    const curClue = await this.getDataById<EntityClueOrg>({
      tableName: this.tableNames.org,
      idList: [clueId],
    });
    const res = await this.handleCustomerList({
      data: [customerData],
      sendEvent: true,
    });
    if (curClue.length) {
      this.putAll(this.tableNames.org, [{ ...curClue[0], status: '4' }]);
    }
    const curContact = res.contactList.find(item => item.account === email?.toLocaleLowerCase());
    if (curContact && res.orgList.length) {
      const curContactModel: ContactModel = {
        ...this.contactTrans.transCustomerToContactModel(curContact),
        customerOrgModel: {
          role: 'myCustomer',
          companyId: res.orgList[0].id,
        },
      };
      this.contactSelectNotify.addRecentSelectContactMap([curContactModel]);
      this.contactSelectNotify.addRecentSelectOrgMap(res.orgList);
      return curContactModel;
    }
    return undefined;
  }

  async doInsertCustomer(params: { customerData: resultObject; customerType?: CustomerOrgType; sendEvent?: boolean }): Promise<ContactModel[] | undefined> {
    const { customerData, customerType = 'customer' } = params;
    const res =
      customerType === 'clue'
        ? await this.handleClueList({ data: [customerData] })
        : await this.handleCustomerList({
            data: [customerData],
            sendEvent: true,
          });
    if (res.orgList.length && res.contactList.length) {
      const contactModelList: ContactModel[] = res.contactList.map(item => ({
        ...this.contactTrans.transCustomerToContactModel(item),
        customerOrgModel: {
          role: 'myCustomer',
          companyId: customerData.id,
        },
      }));
      this.contactSelectNotify.addRecentSelectContactMap(contactModelList);
      this.contactSelectNotify.addRecentSelectOrgMap(res.orgList);
      return contactModelList;
    }
    return undefined;
  }

  getCustomerOrderNumber(customerType: CustomerOrgType, emailRole?: EmailRoles, status?: string) {
    const customerRole = this.contactTrans.transEmailRole2CustomerRole(emailRole);
    const roleNumber: Record<CustomerRole, number> = {
      manager: 4,
      colleague: 3,
      openSea: 2,
      other: 1,
    };
    const typeNumber: Record<CustomerOrgType, number> = {
      customer: 10,
      clue: 0,
      openSea: -10,
    };
    const statusNumber = customerType === 'clue' && status === '4' ? -0.5 : 0;
    const roleValue = customerRole ? roleNumber[customerRole] : 1;
    return typeNumber[customerType] + roleValue + statusNumber;
  }

  validCustomer(cur: ContactModel, pre?: ContactModel): ContactModel {
    if (!pre) {
      return cur;
    }
    const curData = cur.customerOrgModel;
    const preData = pre.customerOrgModel;
    if (!preData) {
      return cur;
    }
    if (!curData) {
      return pre;
    }
    const curRole = this.parseRole(curData.role);
    const preRole = this.parseRole(preData.role);
    const curNumber = this.getCustomerOrderNumber(curRole.customerType, curData.role);
    const preNumber = this.getCustomerOrderNumber(preRole.customerType, preData.role);
    if (curNumber === preNumber) {
      const curCreateTime = curData.createTime || 0;
      const preCreateTime = preData.createTime || 0;
      return curCreateTime > preCreateTime ? cur : pre;
    }
    return curNumber > preNumber ? cur : pre;
  }

  /**
   * 将数据加入contact_global数据库中
   * @param tableName 表名
   * @param data 表数据
   */
  async putAll<T>(tableName: ContactEdmTableName, data: T[]) {
    if (!data.length) {
      return [];
    }
    return this.dbApi.putAll<T>({ tableName, dbName: this.dbName }, data);
  }

  /**
   * 将contact_global数据库中数据删除
   * @param tableName
   * @param idList
   */
  deleteData(tableName: ContactEdmTableName, idList: string[]) {
    if (!idList.length) {
      return Promise.resolve();
    }
    return this.dbApi.deleteById({ tableName, dbName: this.dbName }, idList);
  }

  /**
   * 通过id获取表中数据
   * @param params id集合
   */
  async getDataById<T>(params: { tableName: ContactEdmTableName; idList: string[]; needLog?: boolean }) {
    const { tableName, idList, needLog } = params;
    const start = Date.now();
    const res = await this.dbApi.getByRangeCondition<T>({
      tableName,
      dbName: this.dbName,
      adCondition: {
        args: [idList],
        type: 'anyOf',
        field: 'id',
      },
      additionalData: needLog
        ? {
            parentName: 'contact_edm_getDataById',
          }
        : undefined,
    });
    if (needLog) {
      this.logger('contact_edm_getDataById', this.useTime(start));
    }
    return res;
  }

  /**
   * 通过id获取orgContact表中数据
   * @param params id集合
   */
  async getOrgContactById<T = resultObject>(params: { idList: string[]; field: 'orgId' | 'contactId'; needLog?: boolean }) {
    const { idList, field, needLog } = params;
    const start = Date.now();
    const res = await this.dbApi.getByRangeCondition<T>({
      dbName: this.dbName,
      tableName: this.tableNames.orgContact,
      adCondition: {
        field,
        args: [idList],
        type: 'anyOf',
      },
      additionalData: needLog
        ? {
            parentName: 'contact_edm_getOrgContactById',
          }
        : undefined,
    });
    if (needLog) {
      this.logger('contact_edm_getOrgContactById', this.useTime(start));
    }
    return res;
  }

  getOrgContactByEmails(params: { emails: string[] }) {
    const { emails } = params;
    const _company = this.getCurrentDomain();
    const _emails = emails.map(email => email?.toLocaleLowerCase());
    const args = util.cartesian([[_company], _emails]);
    return this.dbApi.getByRangeCondition<EntityCustomerOrgContact>({
      tableName: this.tableNames.orgContact,
      dbName: this.dbName,
      adCondition: {
        args,
        field: ['_company', 'account'],
        type: 'anyOf',
      },
    });
  }

  /**
   * 下属列表通过组织id获取联系人id列表
   * @param params
   */
  async getContactIdByUnitId(params: { idList: string[] }): Promise<Record<string, string[]>> {
    const { idList } = params;
    const res = await this.dbApi.getByRangeCondition<EntityCustomerUnitContact>({
      dbName: this.customerDBName,
      tableName: this.tableNames.colleagueContact,
      adCondition: {
        args: [idList],
        field: 'orgId',
        type: 'anyOf',
      },
    });
    const ret: Record<string, string[]> = {};
    res.forEach(item => {
      const contactIdList: string[] = ret[item.orgId] || [];
      if (item.contactId) {
        contactIdList.push(item.contactId);
      }
      ret[item.orgId] = contactIdList;
    });
    return ret;
  }

  async getColleagueContactIdList(): Promise<string[]> {
    const list = await this.dbApi.getByRangeCondition<EntityCustomerUnitContact>({
      dbName: this.customerDBName,
      tableName: this.tableNames.colleagueContact,
    });
    const idSet = new Set<string>();
    list.forEach(item => {
      idSet.add(item.contactId);
    });
    return [...idSet];
  }

  /**
   * 通过id获取orgManager表中数据
   * @param params id集合
   */
  async getOrgManagerByOrgId<T = resultObject>(params: { idList: string[]; needLog?: boolean }) {
    const { idList, needLog } = params;
    const start = Date.now();
    const res = await this.dbApi.getByRangeCondition<T>({
      dbName: this.dbName,
      tableName: this.tableNames.orgManager,
      adCondition: {
        field: 'orgId',
        args: [idList],
        type: 'anyOf',
      },
      additionalData: needLog
        ? {
            parentName: 'contact_edm_getOrgManagerByOrgId',
          }
        : undefined,
    });
    if (needLog) {
      this.logger('contact_edm_getOrgManagerByOrgId', this.useTime(start));
    }
    return res;
  }

  /**
   * 通过id获取label表中数据
   * @param params id集合
   */
  getLabelByOrgId<T = resultObject>(params: { idList: string[] }) {
    const { idList } = params;
    return this.dbApi.getByRangeCondition<T>({
      dbName: this.dbName,
      tableName: this.tableNames.label,
      adCondition: {
        field: 'orgId',
        args: [idList],
        type: 'anyOf',
      },
    });
  }

  async deleteDataByOrgId(idList: string[], _lastUpdateTime: number) {
    const [orgList, orgManagerList, orgContactList] = await Promise.all([
      this.getDataById<CustomerOrg>({ tableName: this.tableNames.org, idList }),
      this.getOrgManagerByOrgId<EntityCustomerOrgManager>({ idList }),
      this.getOrgContactById<EntityCustomerOrgContact>({
        idList,
        field: 'orgId',
      }),
    ]);
    const orgManagerIdList: string[] = [];
    const orgContactIdList: string[] = [];
    const contactIdList: string[] = [];
    const orgIdList: string[] = [];
    orgList.forEach(item => {
      if (item._lastUpdateTime < _lastUpdateTime - 10) {
        orgIdList.push(item.id);
      }
    });
    orgManagerList.forEach(item => {
      if (item._lastUpdateTime < _lastUpdateTime - 10) {
        orgManagerIdList.push(item.id);
      }
    });
    orgContactList.forEach(item => {
      if (item._lastUpdateTime < _lastUpdateTime - 10) {
        orgContactIdList.push(item.id);
        contactIdList.push(item.contactId);
      }
    });

    await Promise.all([
      this.deleteData(this.tableNames.orgContact, orgContactIdList),
      this.deleteData(this.tableNames.orgManager, orgManagerIdList),
      this.deleteData(this.tableNames.contact, contactIdList),
      this.deleteData(this.tableNames.org, orgIdList),
    ]);
    return {
      orgIdList,
      contactIdList,
      orgManagerIdList,
      orgContactIdList,
    };
  }

  /**
   * 通过lastUpdateTime删除当前公司下的客户/线索
   * @param params type：客户/线索， tableName：表名， _lastUpdateTime： 最后加入数据库时间
   */
  deleteDataByLastUpdateTime(params: { type: CustomerType; tableName: ContactEdmTableName; _lastUpdateTime: number; dbName?: DBList }) {
    const { type, tableName, _lastUpdateTime, dbName = this.dbName } = params;
    const _company = this.getCurrentDomain();
    return this.dbApi.deleteByByRangeCondition({
      dbName,
      tableName,
      adCondition: {
        field: ['_company', 'customerType', '_lastUpdateTime'],
        args: [[_company, type, 0], [_company, type, _lastUpdateTime - 10], true, true],
        type: 'between',
      },
    });
  }

  initDB() {
    this.dbApi.initDb(this.customerDBName);
    this.dbApi.initDb(this.dbName);
  }
}

export const ContactEdmHelperInstance = new ContactEdmHelper();
