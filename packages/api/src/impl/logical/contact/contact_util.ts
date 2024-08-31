import lodashGet from 'lodash/get';
import { apis, inWindow, isElectron } from '@/config';
import { DbApiV2, DBList } from '@/api/data/new_db';
import { DataTransApi } from '@/api/data/http';
import { SystemApi } from '@/api/system/system';
import { EventApi, SystemEvent } from '@/api/data/event';
import { api } from '@/api/api';
import { ErrMsgCodeMap, ErrMsgType } from '@/api/errMap';
import { AccountApi } from '@/api/logical/account';
import { TaskApi } from '@/api/system/task';
import { ContactItem, ContactLastTimeKey, timeKeyMap, UtilHitParams, ContactMultileAccountOption } from '@/api/logical/contactAndOrg';
import { DataStoreApi } from '@/api/data/store';
import { anonymousFunction, ContactModel, EmailAccountDomainInfo, EntityContact, resultObject, EntityContactItem, ContactInfoType } from '@/api/_base/api';
import { LoggerApi } from '@/api/data/dataTracker';
import { CustomerRole } from '@/api/logical/contact_edm';
import { EdmRoleApi } from '@/api/logical/edm_role';
import { EmailRoles } from '@/api/logical/mail_plus_customer';
import { wait } from '@/api/util/index';

// const webSyncPages = ['/api_data_init.html'];
// const electronSyncPages = ['/api_data_init.html'];

export interface ContactSyncStorePageInfo {
  pageIndex?: number;
  totalPage?: number;
  lastMaxId?: string | null;
  expiredTime?: number;
  lastUpdateTime?: number;
  fullLastUpdateTime?: number;
  // 从服务端拉取信息是按照分页模式还是start id模式
  domain: string;
  from: string;
  account: string;
  // 此次增量更新尝试了多少次
  retryTimes?: number;
  source: 'lingxi' | 'qiye' | 'unknown';
  step?: 'core' | 'all' | 'increase';
  done?: boolean;
  addressRuleLastUpdateTime?: number;
  coreCount?: number;
}

enum IStaticNodeKey {
  PERSON = 'person',
  PERSON_ALL = 'personal_all',
  PERSON_NO_GROUP = 'personal_no_group',
  PERSON_MARK_LIST = 'personal_mark_list',
}

type OrgTraverseNode = {
  parentNodeKey?: string;
  firstChildNodeKey?: string;
  prevSiblingNodeKey?: string;
  nextSiblingNodeKey?: string;
  selfNodeKey: string;
  selfCount: number;
  totalCount: number;
  visitCount?: number;
};

export class ContactConst {
  protected dbApi: DbApiV2 = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;

  protected httpApi: DataTransApi = api.getDataTransApi();

  protected systemApi: SystemApi = api.getSystemApi();

  private taskApi: TaskApi = api.requireLogicalApi(apis.taskApiImpl) as TaskApi;

  protected eventApi: EventApi = api.getEventApi();

  protected store: DataStoreApi = api.getDataStoreApi();

  protected loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

  protected accountApi: AccountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

  protected edmRoleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

  readonly contactDbName: DBList = 'contact_dexie';

  readonly contactSearchDbName: DBList = 'contact_search';

  readonly edmcontactSearchDbName: DBList = 'edm_contact_search';

  readonly contactCustomerGlobalDBName: DBList = 'contact_global';

  readonly contactCustomerDBName: DBList = 'contact_customer';

  readonly contactTable = 'contact';

  readonly contactItemTable = 'contactItem';

  readonly orgContactTable = 'orgContact';

  readonly orgManager = 'orgManager';

  readonly orgTable = 'org';

  readonly recentContactTable = 'recent_contact';

  readonly personalMarkTable = 'personal_mark';

  readonly orgpathlistTable = 'orgpathlist';

  readonly frequentContactTable = 'frequentContact';

  readonly orgTableHitList: UtilHitParams = ['orgName', 'orgPYName'];

  readonly contactTableHitList: UtilHitParams = [
    ['contact', 'contactName'],
    ['contact', 'contactPYName'],
    ['contact', 'contactPYLabelName'],
  ];

  readonly CustomerContactSearchHitList: UtilHitParams = ['contactName', 'contactPYName', 'contactPYLabelName'];

  readonly contactItemTableHitList: UtilHitParams = [['contactInfo', 'contactItemVal']];

  protected colors = ['#6BA9FF', '#70CCAB', '#AA90F4', '#F7A87C'];

  readonly StaticNodeKey = IStaticNodeKey;

  readonly searchTableLimit = 1000;

  statusLevel: Record<string, number> = {
    5: 1,
    6: 2,
    4: 3,
    1: 4,
    2: 5,
    3: 6,
    other: 7,
  };

  private lastSyncTimeKeyMap: timeKeyMap = {
    enterprise: 'server_sync_enterprise_last_time_',
    client: 'client_sync_last_time_',
    personal: 'server_sync_personal_last_time_',
    org: 'server_sync_org_last_time_',
    personalOrg: 'server_sync_personal_org_last_time_',
  };

  handleAccountAndDomain(account: string) {
    return this.systemApi.handleAccountAndDomain(account) as unknown as EmailAccountDomainInfo;
  }

  // 轮询间歇时间
  private contactSyncIntervalSeq = 10 * 6;

  setContactSyncIntervalSeq(minutes: number) {
    if (minutes) {
      this.contactSyncIntervalSeq = minutes * 6;
    }
  }

  getContactSyncIntervalSeq() {
    return this.contactSyncIntervalSeq;
  }

  /**
   * 获取当前用户的Domain
   * */
  getDomain() {
    const user = this.systemApi.getCurrentUser();
    return user?.domain;
  }

  /**
   * 获取当前用户账号
   */
  getCurrentAccount() {
    return this.systemApi.getCurrentUser()?.id || '';
  }

  /**
   * 获取当前用户的email
   * */
  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id;
  }

  /**
   * 获取当前账号
   * @private
   */
  getCurrentContactId() {
    const user = this.systemApi.getCurrentUser();
    return user?.contact?.contact.id || (user?.prop?.contactId as string);
  }

  getCurrentCompanyId(email?: string) {
    return this.systemApi.getCurrentCompanyId(email);
  }

  /**
   * 使用时间
   * @param start
   */
  useTime(start: number) {
    return Date.now() - start + 'ms';
  }

  /**
   * 获取通讯录的lastTime
   * */
  async getStoreLastTime(lastTimeKey: ContactLastTimeKey): Promise<number> {
    const data = await this.store.get(this.lastSyncTimeKeyMap[lastTimeKey]);
    return data.suc ? Number(data.data) : 0;
  }

  /**
   * 设置通讯录的lastTime
   * */
  setStoreLastTime(lastTimeKey: ContactLastTimeKey, lastTime: number) {
    return this.store.put(this.lastSyncTimeKeyMap[lastTimeKey], String(lastTime));
  }

  async getStoreContactSyncPageInfo(params: ContactMultileAccountOption<{ from: ContactLastTimeKey; domain: string }>): Promise<ContactSyncStorePageInfo | undefined> {
    const { from, domain, _account } = params;
    // const data = await this.store.get(this.lastSyncPageKeyMap[key]);
    const accountMd5 = this.systemApi.getCurrentUser(_account)!.accountMd5 || '';

    try {
      const result = await this.taskApi.getContactSyncTask({
        from,
        domain,
        account: accountMd5,
      });
      const isExpired = result.expiredTime <= Date.now();
      // 如果没有数据返回默认数据
      if (!result) {
        return {
          domain,
          from,
          account: accountMd5,
          pageIndex: 0,
          totalPage: 0,
          lastMaxId: '',
          source: 'unknown',
        };
      }
      // 判断数据是否过期 如果数据过期 分页数据不再使用
      if (isExpired) {
        return {
          ...result,
          pageIndex: 0,
          totalPage: 0,
          lastMaxId: '',
          source: 'unknown',
        };
      }
      return result;
    } catch (ex) {
      return {
        domain,
        from,
        account: accountMd5,
        pageIndex: 0,
        totalPage: 0,
        lastMaxId: '',
        source: 'unknown',
      };
    }
  }

  async setStoreContactSyncPageInfo(params: ContactMultileAccountOption<Omit<ContactSyncStorePageInfo, 'account'>>, enableUseNewestTime = true) {
    const { _account } = params;
    const accountMd5 = this.systemApi.getCurrentUser(_account)!.accountMd5 || '';

    const lastRecord = await this.taskApi.getContactSyncTask({
      account: accountMd5,
      domain: params.domain,
      from: params.from,
    });

    const increaseUpdateTimeRetryTimes = lastRecord.retryTimes || 0;

    // 增量更新允许重试三次
    if (!enableUseNewestTime && increaseUpdateTimeRetryTimes < 2) {
      Reflect.deleteProperty(params, 'lastUpdateTime');
      params.retryTimes = increaseUpdateTimeRetryTimes + 1;
    }

    // 如果是全量更新 不再继续存储lastUpdateTime 改用fullLastupdateTime作为他的更新状态(1.22版本目前还没有什么用)
    if (params.step === 'all') {
      params.fullLastUpdateTime = params.lastUpdateTime;
      Reflect.deleteProperty(params, 'lastUpdateTime');
    }

    return this.taskApi.doUpdateContactSyncTask({
      ...lastRecord,
      ...params,
      lastMaxId: params.lastMaxId!,
      account: accountMd5,
    });
  }

  getAccountSession(_account: string) {
    const result = {
      _session: '',
      sid: '',
    };
    const accounts = this.accountApi.getLocalSubAccountsFromCache({
      subAccountEmail: _account,
      expired: false,
    });
    const account = accounts.find((it: any) => it.id === _account);
    if (account) {
      result._session = '';
      result.sid = account.sessionId;
    }
    return result;
  }

  async retry(fn: anonymousFunction<void, number>, count = 3) {
    const tid = window.setTimeout(() => {
      if (count >= 1) {
        this.retry(fn, count - 1);
      }
    }, 3000 + (4 - count) * 2000);
    fn(tid);
  }

  getValidModel(_pre: ContactModel, _cur: ContactModel): ContactModel {
    const compareArr: Array<keyof ContactModel['contact']> = ['type', 'visibleCode', 'accountStatus', 'id'];
    const compareMap: Record<string, any> = {
      type: {
        enterprise: 3,
        personal: 2,
        external: 1,
      },
      visibleCode: {
        0: 1,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
      },
      accountStatus: {
        5: 1,
        6: 2,
        4: 3,
        1: 4,
        2: 5,
        3: 6,
        undefined: 0,
      },
    };
    let result: ContactModel | undefined;
    const pre = _pre.contact;
    const cur = _cur.contact;
    compareArr.forEach(prop => {
      if (!result && pre[prop] !== cur[prop]) {
        let value = pre[prop];
        let value2 = cur[prop];
        const obj = compareMap[prop];
        if (obj) {
          value = obj[value + ''];
          value2 = obj[value2 + ''];
        }
        if (value && value2) {
          result = value.toString().localeCompare(value2.toString(), 'zh') >= 0 ? _pre : _cur;
        }
      }
    });
    return result || _pre;
  }

  getValidContact(pre: EntityContact | undefined, cur: EntityContact | undefined): EntityContact | undefined {
    if (!pre) {
      return cur;
    }
    if (!cur) {
      return cur;
    }
    if (pre.visibleCode === 0) {
      return pre;
    }
    if (cur.visibleCode === 0) {
      return cur;
    }
    const preLevel = this.statusLevel[String(pre.accountStatus || 'other')];
    const curLevel = this.statusLevel[String(cur.accountStatus || 'other')];
    return preLevel > curLevel ? cur : pre;
    // if (pre.updateTime && cur.updateTime) {
    //   return pre.updateTime > cur.updateTime ? pre : cur;
    // }
    // if (pre.createTime && cur.createTime) {
    //   return pre.createTime > cur.createTime ? pre : cur;
    // }
    // return undefined;
  }

  /**
   * 过滤不非主显的搜索结果
   * @param list
   */
  filterNotDisplayEmailSearchRes(list: ContactModel[]): ContactModel[] {
    const filter: ContactModel[] = [];
    list.forEach(model => {
      const {
        contact: { type, hitQuery },
        contactInfo,
      } = model;
      if (type === 'enterprise' && !hitQuery?.length) {
        const bool = contactInfo.some(item => item.contactItemType === 'EMAIL' && !item.hitQuery?.includes('contactItemVal') && item.isDefault);
        if (!bool) {
          filter.push(model);
        }
      } else {
        filter.push(model);
      }
    });
    return filter;
  }

  contactLog(key: string, data?: resultObject) {
    const APPENDIX = 'contact';
    const resultData = data || {};
    this.loggerApi.track(key, {
      appendix: APPENDIX,
      ...resultData,
    });
  }

  logger(key: string, data?: resultObject | string) {
    console.warn(key, data);
    this.loggerApi.track(key, {
      appendix: 'contact',
      data,
    });
  }

  catchError(reason: unknown): string {
    if (typeof reason === 'string') {
      return ErrMsgCodeMap[reason as ErrMsgType] || reason;
    }
    if (reason instanceof Error) {
      return reason.message;
    }
    return 'unknown error';
  }

  doGetModelDisplayEmail(model: ContactModel | EntityContact): string {
    try {
      if (model && 'id' in model) {
        return model.hitQueryEmail || model.displayEmail || model.accountName;
      }
      return model.contact?.hitQueryEmail || model.contact?.displayEmail || model.contact?.accountName;
    } catch (e) {
      console.error('[api_contact_util] doGetModelDisplayEmail error', e, model);
      return '';
    }
  }

  transContactModel2ContactItem(item: ContactModel): ContactItem {
    try {
      const { id, type, avatar, contactName, position, accountType } = item.contact;
      const email = this.doGetModelDisplayEmail(item);
      const emailList: Set<string> = new Set([email]);
      if (item?.contactInfo?.length) {
        item.contactInfo.forEach(info => {
          if (info.contactItemType === 'EMAIL' && info.contactItemVal) {
            emailList.add(info.contactItemVal);
          }
        });
      }
      return {
        id,
        type,
        avatar,
        name: contactName,
        email,
        position,
        accountType,
        customerRole: item.customerOrgModel?.role,
        createTime: item.customerOrgModel?.createTime,
        emailList: [...emailList],
      };
    } catch (e) {
      const CommonNull: unknown = null;
      console.error('[api_contact_util] transContactModel2ContactItem error', e);
      return CommonNull as ContactItem;
    }
  }

  getValidEmail(_pre: ContactModel, _cur: ContactModel, isMainAccount = true): ContactModel {
    const pre = this.transContactModel2ContactItem(_pre);
    const cur = this.transContactModel2ContactItem(_cur);
    const compareArr: Array<keyof ContactItem> = ['type', 'customerRole', 'createTime', 'id'];
    const compareMap: Record<string, any> = {
      type: {
        customer: 4,
        clue: 3,
        enterprise: 5,
        personal: 2,
        external: 1,
        team: -1,
        recent: -1,
      },
      customerRole: {
        manager: 3,
        colleague: 2,
        openSea: 1,
        other: 0,
        undefined: 0,
      },
      status: {
        1: 1,
        2: 1,
        3: 1,
        4: 0,
        5: 1,
      },
    };
    let result: ContactModel | undefined;
    compareArr.forEach(prop => {
      if (!result && pre[prop] !== cur[prop]) {
        let value = pre[prop];
        let value2 = cur[prop];
        const obj = compareMap[prop];
        if (obj) {
          if (!isMainAccount && (value === 'customer' || value === 'clue')) {
            value = '0';
          } else {
            value = obj[value + ''];
          }
          if (!isMainAccount && (value2 === 'customer' || value2 === 'clue')) {
            value2 = '0';
          } else {
            value2 = obj[value2 + ''];
          }
        }
        if (value && value2) {
          result = value.toString().localeCompare(value2.toString(), 'zh') >= 0 ? _pre : _cur;
        }
      }
    });
    return result || _pre;
  }

  getCustomerRole(params: { orgId?: string; managerIds?: Set<string>; colleagueIds?: Set<string> }): CustomerRole {
    // const { orgId, managerIds = [], colleagueIds = [] } = params;
    // const managerOrgId = new Set<string>([...managerIds]);
    // const colleagueOrgId = new Set<string>([...colleagueIds]);
    const { orgId, managerIds: managerOrgId = new Set(), colleagueIds: colleagueOrgId = new Set() } = params;
    if (!orgId) {
      return 'other';
    }
    if (managerOrgId.has(orgId)) {
      return 'manager';
    }
    if (colleagueOrgId.has(orgId)) {
      return 'colleague';
    }
    return 'openSea';
  }

  getCustomerRoleByMangerIds(params: { currentAccountId?: string; managerIds?: string[]; roleAccountIds?: string[]; viewRole?: boolean }): EmailRoles {
    const { currentAccountId, managerIds, roleAccountIds = [], viewRole } = params;
    if (!currentAccountId) {
      return 'external';
    }
    if (!managerIds?.length) {
      return 'openSeaCustomer';
    }
    if (!viewRole) {
      return 'colleagueCustomerNoAuth';
    }
    if (managerIds.includes(currentAccountId)) {
      return roleAccountIds.includes(currentAccountId) ? 'myCustomer' : 'colleagueCustomerNoAuth';
    }
    return managerIds.some(id => roleAccountIds.includes(id)) ? 'colleagueCustomer' : 'colleagueCustomerNoAuth';
  }

  forbiddenBridgeOnce() {
    inWindow() && window.bridgeApi.master.forbiddenBridgeOnce();
  }

  findContactInfoVal(contactInfoList: EntityContactItem[], type: ContactInfoType = 'EMAIL') {
    if (!contactInfoList || !contactInfoList.length) {
      return '';
    }

    return contactInfoList.find(item => item.contactItemType === type)?.contactItemVal || '';
  }

  async sendCrossEvent(
    data: SystemEvent,
    options?: {
      enableRetry?: boolean;
      asInnermsg?: boolean;
    }
  ) {
    if (inWindow() && window.isBridgeWorker) {
      return;
    }

    const { enableRetry = true, asInnermsg = true } = options || {};

    if (isElectron()) {
      this.eventApi.sendSysEvent(data);
      return;
    }

    if (asInnermsg) {
      this.eventApi.sendSysEvent(data);
    }
    try {
      await window.bridgeApi.master.requestData({
        namespace: 'common',
        apiname: 'forwardEvent',
        args: [data],
      });
    } catch (ex) {
      // web环境可能会因为后台页面创建的延迟 导致消息无法发送给后台页面 先等1500ms然后再发
      if (!enableRetry) {
        console.log('[contact_sync].sendCoreSyncEvent.error', ex);
        return;
      }
      await new Promise(r => setTimeout(r, 1500));
      this.sendCrossEvent(data, {
        enableRetry: false,
        asInnermsg: false,
      });
    }
  }

  // 计算部门人数
  async computeEntityOrgMemberCount(options: { rootOrgKey?: string; orgTreeMap: Map<string, string[]>; orgContactMap: Map<string, number> }) {
    const { rootOrgKey = '-2', orgTreeMap, orgContactMap } = options;

    // 预置一条root数据
    const nodeMap: Map<string, OrgTraverseNode> = new Map([
      [
        '-2',
        {
          selfNodeKey: '-2',
          parentNodeKey: undefined,
          selfCount: 0,
          totalCount: 0,
        },
      ],
    ]);

    // 寻找下一个要遍历的节点(优先子节点 接着是兄弟节点 最后是父节点)
    const findNextNode: (param: OrgTraverseNode) => string | undefined = (node: OrgTraverseNode) => {
      const { visitCount = 0, firstChildNodeKey, nextSiblingNodeKey, parentNodeKey } = node;

      // 如果当前节点只访问过一次.表示当前节点的子节点没有被访问过 要优先找firstChildNode
      if (visitCount <= 1) {
        if (firstChildNodeKey && nodeMap.get(firstChildNodeKey)) {
          return firstChildNodeKey;
        }
        node!.visitCount = (node.visitCount || 0) + 1;
        return findNextNode(node);
      }
      if (nextSiblingNodeKey && nodeMap.get(nextSiblingNodeKey)) {
        return nextSiblingNodeKey;
      }

      if (parentNodeKey && nodeMap.get(parentNodeKey)) {
        return parentNodeKey;
      }
      return undefined;
    };

    // 计算当前部门的总人数
    const computeTotalCount = (flagNodeKey: string, nodeMap: Map<string, OrgTraverseNode>) => {
      const { firstChildNodeKey, selfCount = 0, selfNodeKey = undefined } = nodeMap.get(flagNodeKey)!;
      let totalCount = selfCount;
      let nextNode = firstChildNodeKey ? nodeMap.get(firstChildNodeKey) : undefined;
      while (nextNode && nextNode.selfNodeKey !== selfNodeKey) {
        const nextNodeCount = nextNode.totalCount;
        totalCount += nextNodeCount;

        const { nextSiblingNodeKey, parentNodeKey } = nextNode;

        if (nextSiblingNodeKey && nodeMap.get(nextSiblingNodeKey)) {
          nextNode = nodeMap.get(nextSiblingNodeKey);
        } else if (parentNodeKey && nodeMap.get(parentNodeKey)) {
          nextNode = nodeMap.get(parentNodeKey);
        } else {
          nextNode = undefined;
        }
      }
      return totalCount;
    };

    const traverse = async (currentNodeKey: string | undefined, nodeMap: Map<string, OrgTraverseNode>): Promise<void> => {
      let traverCountInFrame = 0;
      let isDone = false;

      while (currentNodeKey && nodeMap.get(currentNodeKey) && traverCountInFrame <= 1000 && !isDone) {
        // 寻找当前节点的子节点
        const childlist = orgTreeMap.get(currentNodeKey);
        const currentNodeInfo = nodeMap.get(currentNodeKey)!;

        // 增加一次访问次数(一个节点访问两次肯定就遍历结束了)
        currentNodeInfo.visitCount = (currentNodeInfo.visitCount || 0) + 1;
        const { visitCount = 0 } = currentNodeInfo;

        // 给当前节点标记一次访问count

        // 先判断当前节点是否遍历完成。如果遍历完成，计算当前部门下的总人数
        // 如果当期节点没有遍历完成，标记当期节点的第一个childNode 预填充所有的子节点
        // 如果没有子节点 标记完成
        if (visitCount >= 2) {
          const totalCount = computeTotalCount(currentNodeKey, nodeMap);
          currentNodeInfo.totalCount = totalCount;
        } else if (childlist && childlist.length) {
          currentNodeInfo!.firstChildNodeKey = childlist[0]!;
          // 先预置子节点(要用for循环foreach因为纯函数检测的原因eslint报错)
          for (let index = 0; index < childlist.length; index++) {
            const childId = childlist[index];
            const isFirstChild = index <= 0;
            const isLastChild = index >= childlist.length - 1;

            const childNodeInfo: OrgTraverseNode = {
              selfNodeKey: childId,
              selfCount: orgContactMap.get(childId) || 0,
              totalCount: 0,
              visitCount: 0,
              prevSiblingNodeKey: !isFirstChild ? lodashGet(childlist, `[${index - 1}]`, undefined) : undefined,
              nextSiblingNodeKey: !isLastChild ? lodashGet(childlist, `[${index + 1}]`, undefined) : undefined,
              parentNodeKey: currentNodeKey,
            };
            nodeMap.set(childId, childNodeInfo);
          }
        } else {
          currentNodeInfo!.firstChildNodeKey = undefined;
          currentNodeInfo!.totalCount = orgContactMap.get(currentNodeKey) || 0;
          // 直接将当前节点标记为完成
          currentNodeInfo.visitCount = 2;
        }

        const nextNodeKey = findNextNode(currentNodeInfo);
        traverCountInFrame += 1;
        nodeMap.set(currentNodeKey, currentNodeInfo);
        if (nextNodeKey) {
          currentNodeKey = nextNodeKey;
        } else {
          isDone = true;
        }
      }

      // 如果当前没有遍历完成 并且遍历次数已经超过1000次 暂停300ms 再执行计算
      if (!isDone && traverCountInFrame >= 1000) {
        await wait(300);
        return traverse(currentNodeKey, nodeMap);
      }
    };

    await traverse(rootOrgKey, nodeMap);

    console.log('[contact_util]computeEntityOrgMemberCount.result:', nodeMap);
    return nodeMap;
  }

  getPublicParamFromMultipleOptions<T = Record<string, unknown>>(options: ContactMultileAccountOption<T>) {
    return {
      isMainAccount: options.isMainAccount,
      _account: options._account,
    };
  }
}
export default new ContactConst();
