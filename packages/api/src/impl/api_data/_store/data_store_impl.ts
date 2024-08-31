import { AES, enc, MD5 } from 'crypto-js';
import { config } from 'env_def';
import debounce from 'lodash/debounce';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isEqualWith from 'lodash/isEqualWith';
// import isMatch from 'lodash/isMatch';
import lodashGet from 'lodash/get';
import { api } from '@/api/api';
import { ErrMsgCodeMap } from '@/api/errMap';
import { commonMessageReturn, ContactModel, Properties, User } from '@/api/_base/api';
import { DataStoreApi, globalStoreConfig, StoreConfig, StoreData, StoredLock, StoredSequence, ISubAccountEmailOnlyInfo, SubAccountState } from '@/api/data/store';
// import { apis, environment, inWindow, isElectron } from '@/config';
import { apis, environment, inWindow } from '@/config';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { EventApi, SystemEvent, SystemEventTypeNames } from '@/api/data/event';
import { StringTypedMap } from '@/api/commonModel';
import { SystemApi } from '@/api/system/system';
// import { AccountApi } from '@/api/logical/account';
import { JsonFormatter } from '../../api_system/system_impl';
import { pathNotInArrJudge, wait } from '@/api/util';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { guideBy } from '@/api/util/decorators';
import { SubAccountExpired } from '@/const';
import { inWindowTool } from './../../../utils/inWindow';
import { DbApiV2, DBList } from '@/api/data/new_db';
// import {debounce} from "lodash";
// import { SystemApi } from '../../../api/system/system';
// import {User} from "../../../api/system/system";
// import {EventApi, SystemEvent} from "../../../api/data/event";
class StoreSeqHelper implements StoredSequence {
  name: string;

  key: string;

  _seq: number;

  systemApi: SystemApi;

  curWinId: number;

  constructor(name: string, key: string, initSeq?: number) {
    this.name = name;
    this.key = key;
    this._seq = 0;
    this.curWinId = initSeq || 0;
    this.systemApi = api.getSystemApi();
    const inElectron = this.systemApi.isElectron() && window.electronLib;
    if (inElectron) {
      this.initCurWinId();
    }
  }

  async initCurWinId() {
    const curWin = await window.electronLib.windowManage.getCurWindow();
    this.curWinId = curWin?.id || 0;
  }

  // 已弃用
  next(): number {
    const item = this.getItem();
    if (item) {
      this._seq = parseInt(item, 10);
    }
    this._seq += 1;
    this.setItem();
    const inElectron = this.systemApi.isElectron() && window.electronLib;
    if (inElectron) {
      return this.curWinId * 10000 + this._seq;
    }
    return this._seq;
  }

  // 返回 accountid &seq& 累计number（按照信的个数）
  nextOne(_account?: string): string {
    const account = _account || this.systemApi.getCurrentUser(_account)?.id || '';
    // cid改造
    const item = this.getItem();
    if (item) {
      this._seq = parseInt(item, 10);
    }
    this._seq += 1;
    this.setItem();
    return account + '&seq&' + this._seq;
  }

  private setItem() {
    // if (window.electronLib && isElectron()) {
    //   window.electronLib.storeManage.set('app', this.key, this._seq);
    // } else {
    localStorage.setItem(this.key, this._seq + '');
    // }
  }

  private getItem() {
    // if (window.electronLib && isElectron()) {
    //   return window.electronLib.storeManage.get('app', this.key);
    // }
    return localStorage.getItem(this.key);
  }

  setSeq(seq: number): void {
    this._seq = seq;
    this.setItem();
  }

  current(): number {
    const item = this.getItem();
    if (item) {
      this._seq = parseInt(item, 10);
    }
    return this._seq;
  }
}

interface LockStruct {
  lockTime: number;
  lockClientId: string;
  lockEventId?: string;
}

class StoreLockHelper implements StoredLock {
  // clientKey: string;
  lockKey: string;

  // 单一页面需要按照事件上锁
  lockInOnePage: boolean;

  lockTime: number;

  notifyMsg?: LockStruct;

  waitList: {
    time: number;
    eventId?: string;
    func: () => void;
    abort: () => void;
  }[];

  runningTask: number;

  timeoutTask: number;

  hasLock: boolean;

  storeApi: DataStoreImpl;

  timeout?: number;

  constructor(
    name: string,
    storeApi: DataStoreImpl,
    timeout?: number,
    /* , ck: string */
    lockInOnePage?: boolean
  ) {
    // this.clientKey = 't-' + (new Date().getTime()).toString(16) + '-' + config('16', 'genRandomKey') as string;
    this.lockKey = name;
    this.lockInOnePage = !!lockInOnePage;
    this.lockTime = -1;
    this.waitList = [];
    this.runningTask = 0;
    this.timeoutTask = 0;
    this.hasLock = false;
    this.timeout = timeout;
    this.storeApi = storeApi;
    // this.clientKey = ck;
  }

  async lock(eventId?: string): Promise<void> {
    const storeLock = this.storeApi.storeLock(this.lockKey, eventId);
    if (storeLock === 1) {
      return this.lockSucceed();
    }
    if (storeLock === 0) {
      await wait(100);
      if (this.storeApi.lockNotHoldByCurrentPage(this.storeApi.getLockStruct(this.lockKey))) {
        return this.lockFailed(eventId);
      }
      return this.lockSucceed();
    }
    if (storeLock === -1) {
      return this.lockFailed(eventId);
    }
    return Promise.reject(new Error('错误的返回码' + storeLock + ' 未知错误'));
  }

  destroyLock(): void {
    this.storeApi.removeLock(this.lockKey);
    this.waitList = [];
    this.hasLock = false;
    this.storeApi?.removeLock(this.lockKey);
  }

  unlock(): void {
    if (this.runningTask > 0) {
      this.runningTask -= 1;
    }
    if (this.waitList.length === 0 && this.hasLock) {
      if (this.runningTask - this.timeoutTask <= 0) {
        this.storeApi.removeLock(this.lockKey);
        this.hasLock = false;
      } else {
        // do nothing , other task is still running
      }
    } else {
      this.refreshWaitingList();
    }
  }

  lockSucceed(): Promise<void> {
    if (!this.lockInOnePage) {
      this.refreshWaitingList();
    }

    this.runningTask += 1;
    this.hasLock = true;
    return Promise.resolve(undefined);
  }

  lockFailed(eventId?: string): Promise<void> {
    const now = new Date().getTime();
    return new Promise<void>((r, j) => {
      let eid = -1;
      // 超时放弃
      const tid = setTimeout(() => {
        if (eid > 0) {
          delete this.waitList[eid - 1];
          this.timeoutTask += 1;
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        j({
          content: 'wait lock time exceed limit ' + DataStoreImpl.MAX_LOCK_EXPIRED,
          code: 'storedLockTimeout',
        });
      }, this.timeout || DataStoreImpl.MAX_LOCK_EXPIRED);
      eid = this.waitList.push({
        time: now,
        eventId: eventId || '',
        func: () => {
          clearTimeout(tid);
          this.runningTask += 1;
          this.hasLock = true;
          r(undefined);
        },
        abort: () => {
          clearTimeout(tid);
          this.runningTask -= 1;
          j(new Error('用户取消'));
        },
      });
    });
  }

  abortWaitItem(eventId: string) {
    const abortIndex = this.waitList.findIndex(item => item.eventId === eventId);
    if (abortIndex > -1) {
      if (this.waitList[abortIndex]) {
        this.waitList[abortIndex].abort();
        this.waitList.splice(abortIndex, 1);
      }
    }
  }

  private refreshWaitingList() {
    if (this.waitList && this.waitList.length > 0) {
      if (!this.storeApi.lockNotHoldByCurrentPage(this.storeApi.getLockStruct(this.lockKey))) {
        let item;
        do {
          item = this.waitList.shift();
          if (item && item.func) {
            item.func();
          }
          if (this.lockInOnePage) {
            break;
          }
        } while (item);
        this.timeoutTask = 0;
      } else {
        console.warn('wtf, what happened to this lock:' + this.lockKey);
      }
    }
  }

  async notify(oldKey: string | null, newKey: string | null, ck: string): Promise<void> {
    console.log('[store] shift key storage:', this.lockKey, oldKey, newKey);
    if (newKey) {
      this.notifyMsg = JSON.parse(newKey) as LockStruct;
    } else if (oldKey !== ck) {
      if (this.waitList.length - this.timeoutTask > 0) {
        const storeLock = this.storeApi.storeLock(this.lockKey);
        if (storeLock === 0) {
          await wait(100);
          if (this.storeApi.lockNotHoldByCurrentPage(this.storeApi.getLockStruct(this.lockKey))) {
            // do nothing
          } else {
            this.refreshWaitingList();
          }
        } else if (storeLock === 1) {
          // happen rarely
          this.refreshWaitingList();
        } else if (storeLock === -1) {
          // do nothing
        }
      } else {
        // do nothing , no need to require lock
      }
    } else {
      // error raised ， oldkey= clientId and newkey = undefined means other page released the lock of current page
      throw new Error('what happened for lock:' + this.lockKey + ' with ' + oldKey + ' to ' + newKey);
    }
  }
}

const dataMemoryStore: Map<string, string> = new Map<string, string>();

const storageTable = {
  dbName: 'storageDB' as DBList,
  tableName: 'localStorage',
};

class DataStoreImpl implements DataStoreApi {
  public static MAX_LOCK_EXPIRED = 45 * 1000;

  public static readonly salt = config('globalSalt');

  public static keyDeviceUUID: string = config('browerDeviceUUID') as string;

  static defaultPassKey: string = config('globalKey') as string;

  static user: User | undefined = undefined; // 主账号

  static subAccountUserMap: { [key: string]: User | undefined } = {}; // 子账号UserMap key: email

  // {lujiajian_123@163.com: lujiajian_123@163.com, lujiajian.third.0@office.163.com: lujiajian_123@163.com}
  // id -> agentEmail
  static subAccountEmailMap: { [key: string]: string } = {};

  // agentEmail -> id
  static subAccountAgentEmailMap: { [key: string]: string } = {};

  static companyProp = 'company';

  static node = 'hz';

  static subAccountNodeMap: { [key: string]: string } = {}; // key: email

  static uuid = '';

  readonly locks: StringTypedMap<StoreLockHelper>;

  private readonly userAccountKey = 'currentLoginUserAccount';

  private readonly nodeKey = 'currentNodeStore';

  readonly clientId: string;

  readonly propMap: Properties;

  readonly subAccountPropMap: { [key: string]: Properties };

  name: string;

  readonly errorKey: string = '-----------';

  private contactApi: ContactApi & OrgApi;

  private eventApi: EventApi;

  private systemApi: SystemApi;

  private dbApi: DbApiV2;

  // private accountApi: AccountApi;

  private loggerApi: DataTrackerApi;

  private watchedStoreKey: Set<string> = new Set<string>();

  private readonly logoutStatusKey = 'user_logout_status';

  // private eventApi: EventApi;
  // private systemApi: SystemApi;
  // lastAccountMd5: string = "";
  // loginStatus: boolean = false;
  // systemApi: SystemApi;
  constructor() {
    // this.eventApi = api.getEventApi();
    // this.systemApi = api.getSystemApi();
    this.name = apis.defaultDataStoreApiImpl;
    this.propMap = {};
    this.subAccountPropMap = {};
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as DataTrackerApi;
    this.dbApi = api.requireLogicalApi(apis.dexieDbApi) as unknown as DbApiV2;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    // this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
    this.clientId = ('t-' + new Date().getTime().toString(16) + '-' + config('16', 'genRandomKey')) as string;
    this.locks = {};
    // this.systemApi = api.getSystemApi();
  }

  private getKeyPrefix(config?: StoreConfig): string {
    const prefix = (config ? config.prefix || '' : '') as string;
    if (config && config.noneUserRelated) {
      return prefix;
    }
    const emailId = this.getEmailIdByEmail(config?._account || '');
    const currentUser = emailId ? DataStoreImpl.subAccountUserMap[emailId] : DataStoreImpl.user;
    if (!currentUser) {
      // if (!pathNotInArrJudge(window.location, ignoreLoginPath)) {
      //   this.eventApi.sendSimpleSysEvent('loginExpired');
      // }
      return this.errorKey;
    }
    const { accountMd5 } = currentUser;
    return accountMd5 + prefix + '-';
  }

  storeLock(key: string, eventId = ''): number {
    let strLock = this.getLockStruct(key);
    const now = new Date().getTime();
    if (strLock) {
      if (strLock.lockClientId !== this.clientId && strLock.lockTime + DataStoreImpl.MAX_LOCK_EXPIRED >= now) {
        // 现有锁有效，且非当前页面持有
        return -1;
      }
      if (strLock.lockClientId === this.clientId && strLock.lockTime + DataStoreImpl.MAX_LOCK_EXPIRED >= now) {
        // 当前页面持有时，如果单一页面也需要按照事件顺序进行排队的话
        if (eventId && strLock.lockEventId !== eventId) {
          return -1;
        }
        // 现有锁有效，且当前页面持有
        strLock.lockTime = now;
        localStorage.setItem(key, JSON.stringify(strLock));
        return 1;
      }
      // 锁无效，加新锁分支
    } else {
      // 无锁，加新锁分支
    }
    strLock = {
      lockClientId: this.clientId,
      lockTime: now,
      lockEventId: eventId || '',
    };
    localStorage.setItem(key, JSON.stringify(strLock));
    return 0;
  }

  getLockStruct(key: string) {
    const item = localStorage.getItem(key);
    let strLock: LockStruct | undefined;
    if (item) {
      strLock = JSON.parse(item) as LockStruct;
    }
    return strLock;
  }

  lockNotHoldByCurrentPage(strLock?: LockStruct) {
    if (!strLock) {
      return false;
    }
    const now = new Date().getTime();
    return strLock.lockTime + DataStoreImpl.MAX_LOCK_EXPIRED >= now && strLock.lockClientId !== this.clientId;
  }

  removeLock(key: string) {
    const lockStruct = this.getLockStruct(key);
    if (lockStruct) {
      if (lockStruct.lockClientId === this.clientId || !lockStruct.lockClientId) {
        localStorage.removeItem(key);
      } else {
        console.warn('[store] lock not hold by current page, current lock id is ' + lockStruct.lockClientId + ' rather than ' + this.clientId);
      }
    }
  }

  getLock(name: string, timeout?: number, createNone?: boolean, lockInOnePage?: boolean): StoreLockHelper {
    if (!name) {
      throw new Error('参数错误');
    }
    const key = this.makeKey('lock-', name);
    if (key === this.errorKey) {
      throw new Error('login status not proper');
    }
    if (key in this.locks && Object.prototype.hasOwnProperty.apply(this.locks, [key]) && this.locks[key]) {
      return this.locks[key];
    }
    if (createNone) {
      throw new Error('no lock exist');
    }
    const lockHelper = new StoreLockHelper(key, this, timeout, lockInOnePage);
    this.locks[key] = lockHelper;
    return lockHelper;
  }

  getSeqHelper(name: string, initSeq?: number): StoredSequence {
    const key = this.makeKey('seq-', name);
    if (key === this.errorKey) {
      throw new Error('no login user');
    }
    // const item = localStorage.getItem(key);
    // let _seq: number;
    // if (item) _seq = parseInt(item);
    // _seq = initSeq || 0;
    return new StoreSeqHelper(name, key, initSeq);
    // return {
    //   name,
    //   next(): number {
    //     const item = localStorage.getItem(key);
    //     if (item) _seq = parseInt(item);
    //     _seq++;
    //     localStorage.setItem(key, _seq + "");
    //     return _seq;
    //   },
    //   setSeq(seq: number) {
    //     _seq = seq;
    //     localStorage.setItem(key, _seq + "");
    //   },
    //   current(): number {
    //     const item = localStorage.getItem(key);
    //     if (item) _seq = parseInt(item);
    //     return _seq;
    //   },
    // };
  }

  private getCurrentSubAccountsListKey() {
    if (DataStoreImpl.user) {
      return `${DataStoreImpl.user.id}-subAccountsList`;
    }
    return '';
  }

  addSubAccountToList(emailInfo: ISubAccountEmailOnlyInfo) {
    if (!DataStoreImpl.user) {
      // 主账号User不存在
      return;
    }
    const existList = this.getSubAccountList(); // 获取localStorage的子账号列表
    if (existList.length) {
      const sameEmailItem = existList.find(item => item.email === emailInfo.email);
      if (!sameEmailItem) {
        existList.push(emailInfo);
      } else {
        sameEmailItem.agentEmail = emailInfo.agentEmail;
      }
    } else {
      existList.push(emailInfo);
    }
    this.saveNewSubAccountList(existList);
  }

  getSubAccountList(): Array<ISubAccountEmailOnlyInfo> {
    // 获取localStorage中存储的当前主账号的子账号list
    // [{email: lujiajian_123@163.com, agentEmail: lujiajian.third.0@office.163.com;}]
    const subAccountsListKey = this.getCurrentSubAccountsListKey();
    if (!subAccountsListKey) {
      return [];
    }
    const existListRes = this.getSync(subAccountsListKey, globalStoreConfig);
    let existList: Array<ISubAccountEmailOnlyInfo> = [];
    if (existListRes.suc && existListRes.data) {
      try {
        existList = JSON.parse(existListRes.data);
      } catch (ex) {
        console.error(ex);
      }
    }
    return existList;
  }

  /**
   * 通过email获取subAccountEmailMap中子账号email
   * @param email 邮箱email或者代理邮箱agentEmail
   */
  getEmailIdByEmail(email: string, returnExpired?: boolean) {
    if (email === SubAccountExpired && returnExpired) {
      return SubAccountExpired;
    }
    if (DataStoreImpl.user) {
      if (email === DataStoreImpl.user.id || (DataStoreImpl.user.loginAccount && email === DataStoreImpl.user.loginAccount)) {
        return '';
      }
    }
    return DataStoreImpl.subAccountEmailMap[email] || (returnExpired ? SubAccountExpired : '');
  }

  getAgentEmailByEmail(email: string) {
    if (!email || !email.length) return '';
    if (DataStoreImpl.user) {
      if (email === DataStoreImpl.user.id || (DataStoreImpl.user.loginAccount && email === DataStoreImpl.user.loginAccount)) {
        return DataStoreImpl.user.id;
      }
    }
    return DataStoreImpl.subAccountAgentEmailMap[email] || '';
  }

  // 更新子账号list（subAccountEmailMap、localStorage）
  private saveNewSubAccountList(list: Array<ISubAccountEmailOnlyInfo>) {
    const subAccountsListKey = this.getCurrentSubAccountsListKey();
    if (!subAccountsListKey) {
      return;
    }
    this.initSubAccountEmailMap(list); // 更新subAccountEmailMap
    this.putSync(subAccountsListKey, JSON.stringify(list), globalStoreConfig); // 存到localStorage
  }

  /**
   * 删除子账号list（subAccountEmailMap、localStorage）
   * @param email 邮箱email或者代理邮箱agentEmail
   */
  removeSubAccountFromList(email: string) {
    const emailId = this.getEmailIdByEmail(email);
    if (emailId) {
      this.setLastAccount(undefined, emailId);
    }
    if (!DataStoreImpl.user) {
      return;
    }
    const existList = this.getSubAccountList();
    if (existList && existList.length) {
      const newList = existList.filter(item => item.email !== email && item.agentEmail !== email);
      this.saveNewSubAccountList(newList);
    }
  }

  getUserProp(key: string, email?: string) {
    const emailId = this.getEmailIdByEmail(email || '');
    const currentUser = emailId ? DataStoreImpl.subAccountUserMap[emailId] : DataStoreImpl.user;
    return currentUser && currentUser.prop ? currentUser.prop[key] : undefined;
  }

  setUserProp(key: string, value: string | string[], store?: boolean, emailParam?: string) {
    try {
      const emailId = this.getEmailIdByEmail(emailParam || '');
      const emailUser = emailId ? DataStoreImpl.subAccountUserMap[emailId] : DataStoreImpl.user;
      if (emailUser) {
        const prop = emailUser.prop ? { ...emailUser.prop } : {};
        const newUser = { ...emailUser, ...{ prop } };
        newUser.prop[key] = value;
        if (key === DataStoreImpl.companyProp) {
          newUser.company = value as string;
        }
        if (!emailId) {
          DataStoreImpl.user = newUser;
        } else {
          DataStoreImpl.subAccountUserMap[emailId] = newUser;
        }
        if (store) {
          // 刷新到localStorage
          this.storeUser(newUser, emailParam)?.then();
        }
      } else if (emailId) {
        if (!this.subAccountPropMap[emailId]) {
          this.subAccountPropMap[emailId] = {};
        }
        this.subAccountPropMap[emailId][key] = value;
      } else {
        this.propMap[key] = value;
      }
    } catch (e) {
      console.error(e);
    }
  }

  getCurrentNode(email?: string): string {
    const emailId = this.getEmailIdByEmail(email || '') || email || '';
    return emailId ? DataStoreImpl.subAccountNodeMap[emailId] || 'hz' : DataStoreImpl.node;
  }

  setCurrentNode(node?: string, email?: string) {
    const emailId = this.getEmailIdByEmail(email || '') || email || '';

    const accountNodeKey = emailId ? this.getSubAccountCurrentNodeKey(DataStoreImpl.user!.id, emailId) : this.nodeKey;
    if (node) {
      if (emailId) {
        DataStoreImpl.subAccountNodeMap[emailId] = node;
      } else {
        DataStoreImpl.node = node;
      }
      const res = this.putSync(accountNodeKey, node, globalStoreConfig);
      if (res) {
        console.log('[store] error store node : ' + res);
      } else {
        console.log('[store] node store success ');
      }
    } else {
      this.del(accountNodeKey, globalStoreConfig).then();
    }
  }

  private async setCurrentUser(loginUser: User, email: string) {
    const emailId = this.getEmailIdByEmail(email || '');
    await this.setLastAccount(loginUser, emailId);
  }

  getCurrentUser(email?: string): User | undefined {
    const emailId = this.getEmailIdByEmail(email || '');
    return emailId ? DataStoreImpl.subAccountUserMap[emailId] : DataStoreImpl.user;
  }

  putSync(key: string, data: string, config?: StoreConfig) {
    const prefix = this.getKeyPrefix(config);
    try {
      const key1 = this.makeKey(prefix, key);
      if (key1 === this.errorKey) {
        return 'login status not proper';
      }
      // const content = data;
      this.putDataAction(config, key1, data, key);
      return '';
    } catch (e) {
      console.error('[store] put error for key:' + key, e);
      // user disable the localstorage or exceed the quota
      throw new Error(ErrMsgCodeMap['STORAGE.SAVE.EXCEPTION'] + ' ' + key);
    }
  }

  private putDataAction(config: StoreConfig | undefined, key1: string, data: string, key: string) {
    if (!config || !config.storeMethod || config.storeMethod === 'localStorage') {
      localStorage.setItem(key1, data);
      console.log('[store] store put ' + key + '-->', data);
    } else if (config.storeMethod === 'memory') {
      dataMemoryStore.set(key1, data);
    }
  }

  private putToDBDataAction(key: string, data: string) {
    try {
      return this.dbApi.put(storageTable, {
        key: key,
        value: data,
      });
    } catch (ex) {
      throw ex;
    }
  }

  getSync(key: string, conf?: StoreConfig): StoreData {
    const prefix = this.getKeyPrefix(conf);
    const key1 = this.makeKey(prefix, key);
    if (key1 === this.errorKey) {
      return {
        key: key1,
        suc: false,
        err: 'login status not proper',
      };
    }
    const content = this.getDataAction(conf, key1);
    if (content) {
      const data = <string>content;
      return this.buildContent(key, key1, data);
    }
    return {
      key: key1,
      suc: false,
      err: 'not found key',
    };
  }

  getKey(key: string, conf?: StoreConfig) {
    return this.makeKey(this.getKeyPrefix(conf), key);
  }

  private getDataAction(conf: StoreConfig | undefined, key1: string) {
    let content: string | undefined | null;
    if (!conf || !conf.storeMethod || conf.storeMethod === 'localStorage') {
      content = localStorage.getItem(key1);
    } else if (conf.storeMethod === 'memory') {
      content = dataMemoryStore.get(key1);
    }
    return content;
  }

  private async getDataFromDB(key: string) {
    let dbInfo = await this.dbApi.getById(storageTable, key);
    return dbInfo ? dbInfo.value : undefined;
  }

  getFromDB(key: string, conf?: StoreConfig): Promise<StoreData> {
    const prefix = this.getKeyPrefix(conf) as string;
    return new Promise<StoreData>(async (r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          r({
            key: key1,
            suc: false,
            err: 'login status not proper',
          });
        }
        const content = await this.getDataFromDB(key1);
        if (content) {
          const data = <string>content;
          r(this.buildContent(key, key1, data));
        } else {
          r({
            key: key1,
            suc: false,
            err: 'not found key',
          });
        }
      } catch (e) {
        j(new Error(ErrMsgCodeMap['STORAGE.READ.EXCEPTION'] + ' ' + key));
      }
    });
  }

  get(key: string, conf?: StoreConfig): Promise<StoreData> {
    const prefix = this.getKeyPrefix(conf) as string;
    return new Promise<StoreData>((r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          r({
            key: key1,
            suc: false,
            err: 'login status not proper',
          });
        }
        const content = this.getDataAction(conf, key1);
        if (content) {
          const data = <string>content;
          r(this.buildContent(key, key1, data));
        } else {
          r({
            key: key1,
            suc: false,
            err: 'not found key',
          });
        }
      } catch (e) {
        j(new Error(ErrMsgCodeMap['STORAGE.READ.EXCEPTION'] + ' ' + key));
      }
    });
  }

  private buildContent(key: string, key1: string, data: string) {
    // console.log("get " + key + "->" + data);
    return {
      originKey: key,
      key: key1,
      data,
      suc: true,
    };
  }

  private makeKey(prefix: string, key: string) {
    if (prefix === this.errorKey) {
      console.warn('[store] login status not proper for such action');
      return prefix;
    }
    if (environment === 'local' || environment === 'test' || environment === 'dev') {
      return prefix + key;
    }
    return prefix + MD5(key + DataStoreImpl.salt).toString(enc.Base64);
  }

  putToDB(key: string, data: string, conf?: StoreConfig): Promise<commonMessageReturn> {
    const prefix = this.getKeyPrefix(conf);
    return new Promise<commonMessageReturn>(async (r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          j(new Error('login status not proper'));
        }

        await this.putToDBDataAction(key1, data);
        r('');
      } catch (e) {
        console.error('[store] putToDB error for key:' + key, e);
        j(new Error(ErrMsgCodeMap['STORAGE.SAVE.EXCEPTION'] + ' ' + key));
      }
    });
  }

  put(key: string, data: string, conf?: StoreConfig): Promise<commonMessageReturn> {
    const prefix = this.getKeyPrefix(conf);
    return new Promise<commonMessageReturn>((r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          j(new Error('login status not proper'));
        }
        // const content = data;
        // localStorage.setItem(key1, data);
        this.putDataAction(conf, key1, data, key);
        // console.log('[store] store put ' + key + '-->', data);
        r('');
      } catch (e) {
        console.error('[store] put error for key:' + key, e);
        // user disable the localstorage or exceed the quota
        j(new Error(ErrMsgCodeMap['STORAGE.SAVE.EXCEPTION'] + ' ' + key));
      }
    });
  }

  clear(conf?: StoreConfig): Promise<commonMessageReturn> {
    // if (config) console.debug(config);
    return new Promise<commonMessageReturn>((r, j) => {
      try {
        const isLocalStorage = !conf || !conf.storeMethod || conf.storeMethod === 'localStorage';
        const isMemory = conf?.storeMethod === 'memory';
        if (conf && conf.noneUserRelated) {
          if (isLocalStorage) {
            localStorage.clear();
          } else if (isMemory) {
            dataMemoryStore.clear();
          }
        } else {
          // for (const localStorageKey in localStorage)
          let keys: string[] | undefined;
          if (isLocalStorage) {
            keys = Object.keys(localStorage);
          } else if (isMemory) {
            keys = Object.keys(dataMemoryStore);
          }
          if (keys) {
            const emailId = this.getEmailIdByEmail(conf?._account || '');
            const currentUser = emailId ? DataStoreImpl.subAccountUserMap[emailId] : DataStoreImpl.user;
            keys.forEach(localStorageKey => {
              if (currentUser) {
                const lastAccountMd5 = currentUser.accountMd5;
                if (Object.prototype.hasOwnProperty.apply(localStorage, [localStorageKey]) && localStorageKey.startsWith(lastAccountMd5)) {
                  if (isLocalStorage) {
                    localStorage.removeItem(localStorageKey);
                  } else if (isMemory) {
                    dataMemoryStore.delete(localStorageKey);
                  }
                }
              }
            });
          }
        }
        r('');
      } catch (e) {
        j(e);
      }
    });
  }

  delFromDB(key: string, conf?: StoreConfig): Promise<commonMessageReturn> {
    const prefix = this.getKeyPrefix(conf);
    return new Promise<commonMessageReturn>(async (r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          r('login status not proper');
        }
        await this.dbApi.deleteById(storageTable, key1);
        r('');
      } catch (e) {
        // user disable the localstorage or exceed the quota
        j(new Error(ErrMsgCodeMap['STORAGE.SAVE.EXCEPTION'] + ' ' + key));
      }
    });
  }

  del(key: string, conf?: StoreConfig): Promise<commonMessageReturn> {
    const prefix = this.getKeyPrefix(conf);
    return new Promise<commonMessageReturn>((r, j) => {
      try {
        const key1 = this.makeKey(prefix, key);
        if (key1 === this.errorKey) {
          r('login status not proper');
        }
        const isLocalStorage = !conf || !conf.storeMethod || conf.storeMethod === 'localStorage';
        const isMemory = conf?.storeMethod === 'memory';
        if (isLocalStorage) {
          localStorage.removeItem(key1);
        } else if (isMemory) {
          dataMemoryStore.delete(key1);
        }
        console.log('[store] store del', key);
        r('');
      } catch (e) {
        // user disable the localstorage or exceed the quota
        j(new Error(ErrMsgCodeMap['STORAGE.SAVE.EXCEPTION'] + ' ' + key));
      }
    });
  }

  // watchLogin(ev: SystemEvent): void {
  //   if (ev && ev.eventData) {
  //     const user = ev.eventData as User;
  //     this.lastAccountMd5 = user.accountMd5;
  //     console.log("all user store prefix use:" + this.lastAccountMd5,user);
  //   } else {
  //     this.resetStore();
  //   }
  // }
  async setLastAccount(lst: User | undefined, emailParam?: string) {
    console.log('[store] receive user data change:', lst);
    const emailId = emailParam;
    if (!emailId) {
      DataStoreImpl.user = lst;
    } else {
      DataStoreImpl.subAccountUserMap[emailParam] = lst;
    }
    const propMap = emailParam ? this.subAccountPropMap[emailParam] || {} : this.propMap;
    /* for (const propMapKey in this.propMap) */
    Object.keys(propMap).forEach(propMapKey => {
      if (Object.prototype.hasOwnProperty.apply(propMap, [propMapKey]) && propMap[propMapKey]) {
        this.setUserProp(propMapKey, propMap[propMapKey], false, emailParam);
        delete propMap[propMapKey];
      }
    });
    // this.loginStatus = !!lst;
    // if (this.loginStatus && lst) {
    //   this.lastAccountMd5 = lst.accountMd5;
    // }
    if (!emailParam) {
      this.watchContact();
    } else {
      this.watchContact(undefined, emailParam);
    }
    /* return watchContact
     ? watchContact.then(() => {
     return this.storeUser(lst);
     })
     : */
    try {
      await this.storeUser(lst, emailParam);
      return 'success';
    } catch (e) {
      return 'fail';
    }
  }

  addWatchedKey(key: string, config?: StoreConfig) {
    const keyPrefix = this.getKeyPrefix(config);
    const s = this.makeKey(keyPrefix, key);
    this.watchedStoreKey.add(s);
  }

  // resetStore() {
  // }

  decryptMsg(content: string, key: string) {
    try {
      const array = AES.decrypt(content, key, {
        format: JsonFormatter,
      });
      return array.toString(enc.Utf8);
    } catch (ex) {
      return content;
    }
  }

  isLogout(email?: string): boolean {
    const emailId = this.getEmailIdByEmail(email || '');
    const logoutStatusKey = emailId ? this.getSubAccountLogoutStatusKey(DataStoreImpl.user!.id, emailId) : this.logoutStatusKey;
    const sync = this.getSync(logoutStatusKey, { storeMethod: 'memory' });
    return !!sync && sync.suc && !!sync.data && sync.data === 'true';
  }

  getUUID(): string {
    return DataStoreImpl.uuid;
  }

  loadUUID() {
    const uuidStore = this.getSync(DataStoreImpl.keyDeviceUUID, globalStoreConfig);
    let uuid = '';
    if (uuidStore && uuidStore.suc && uuidStore.data) {
      console.log('[store] client uuid !!!!!------- ' + uuidStore.data);
      uuid = uuidStore.data;
    } else {
      uuid = ('i-' + new Date().getTime().toString(16) + '-' + config('16', 'genRandomKey')) as string;
      this.put(DataStoreImpl.keyDeviceUUID, uuid, globalStoreConfig).then(() => {
        console.log('[store] client uuid !!!!------- ' + uuid);
      });
    }
    DataStoreImpl.uuid = uuid;
    return uuid;
  }

  private getShouldInitLoadUser() {
    if (process.env.BUILD_ISWEB) {
      try {
        const isWebmail = config && config('profile') && (config('profile') as string).startsWith('webmail');
        if (isWebmail) {
          if (inWindowTool()) {
            const currentPathName = window.location.pathname;
            if (currentPathName.includes('/jump/')) {
              return false;
            }
          }
        }
        return true;
      } catch (ex) {
        console.error('loadUser error:', ex);
        return true;
      }
    }
    return true;
  }

  loadUser() {
    const noDecrypt = !!(inWindow() && !window.featureSupportInfo.supportCrypto);
    const pass = noDecrypt ? { suc: true, data: 'ok' } : this.getSync(DataStoreImpl.defaultPassKey, globalStoreConfig);
    const res = this.getSync(this.userAccountKey, globalStoreConfig);
    if (pass.suc && pass.data && res.suc && res.data) {
      console.warn('[store] load user !!!!!!---------', res.data);
      const realData = noDecrypt ? res.data : this.decryptMsg(res.data, pass.data);
      DataStoreImpl.user = JSON.parse(realData);
    } else {
      console.warn('[store] no load user !!!!!!---------', res);
    }
  }

  loadSubAccountsUser() {
    if (!DataStoreImpl.user) {
      return;
    }
    const subAccountList = this.getSubAccountList();
    this.initSubAccountEmailMap(subAccountList);
    if (subAccountList && subAccountList.length) {
      const noDecrypt = !!(inWindow() && !window.featureSupportInfo.supportCrypto);
      const pass = noDecrypt ? { suc: true, data: 'ok' } : this.getSync(DataStoreImpl.defaultPassKey, globalStoreConfig);
      subAccountList.forEach(item => {
        const subAccountKey = this.getSubAccountCurrentUserKey(DataStoreImpl.user!.id, item.email);
        const subAccounRes = this.getSync(subAccountKey, globalStoreConfig);
        if (pass.suc && pass.data && subAccounRes.suc && subAccounRes.data) {
          const realData = noDecrypt ? subAccounRes.data : this.decryptMsg(subAccounRes.data, pass.data);
          DataStoreImpl.subAccountUserMap[item.email] = JSON.parse(realData);
        }
      });
    }
  }

  loadNode() {
    const result = this.getSync(this.nodeKey, globalStoreConfig);
    if (result.suc && result.data) {
      console.log('[store] load node !!!!!!!---------', result.data);
      DataStoreImpl.node = result.data;
    }
  }

  private loadSubAccountsNode() {
    if (!DataStoreImpl.user) {
      return;
    }
    const subAccountList = this.getSubAccountList();
    this.initSubAccountEmailMap(subAccountList);
    if (subAccountList && subAccountList.length) {
      subAccountList.forEach(item => {
        const subAccountKey = this.getSubAccountCurrentNodeKey(DataStoreImpl.user!.id, item.email);
        const subAccounRes = this.getSync(subAccountKey, globalStoreConfig);
        if (subAccounRes.suc && subAccounRes.data) {
          DataStoreImpl.subAccountNodeMap[item.email] = subAccounRes.data;
        }
      });
    }
  }

  private initSubAccountEmailMap(subAccountListParam?: Array<ISubAccountEmailOnlyInfo>) {
    const subAccountList = subAccountListParam || this.getSubAccountList();
    if (subAccountList && subAccountList.length) {
      DataStoreImpl.subAccountEmailMap = {};
      subAccountList.forEach(item => {
        DataStoreImpl.subAccountEmailMap[item.email] = item.email;
        DataStoreImpl.subAccountEmailMap[item.agentEmail] = item.email;
        DataStoreImpl.subAccountAgentEmailMap[item.email] = item.agentEmail;
        DataStoreImpl.subAccountAgentEmailMap[item.agentEmail] = item.agentEmail;
      });
    }
  }

  private getSubAccountCurrentUserKey(mainEmail: string, accountEmail: string) {
    return `${mainEmail || ''}-${accountEmail || ''}-${this.userAccountKey}`;
  }

  private getSubAccountCurrentNodeKey(mainEmail: string, accountEmail: string) {
    return `${mainEmail || ''}-${accountEmail || ''}-${this.nodeKey}`;
  }

  private getSubAccountLogoutStatusKey(mainEmail: string, accountEmail: string) {
    return `${mainEmail || ''}-${accountEmail || ''}-${this.logoutStatusKey}`;
  }

  async putSubAccountState(val: SubAccountState) {
    const { email, agentEmail, node, loginUser } = val;
    this.loggerApi.track('syncSubAccountState_putSubAccountState', { val });
    if (!loginUser) {
      return;
    }
    this.addSubAccountToList({ email, agentEmail });
    this.setCurrentNode(node, email);
    await this.setCurrentUser(loginUser, email);
  }

  getSubAccountState() {
    const agentAccount = this.systemApi.getCurrentAgentAccount();
    if (DataStoreImpl.user) {
      return {
        email: DataStoreImpl.user.id,
        agentEmail: agentAccount.email, // 1.27版本DataStoreImpl.user之前没有agentEmail，需要通过getCurrentAgentAccount获取
        node: DataStoreImpl.node,
        loginUser: DataStoreImpl.user,
      };
    }
    return undefined;
  }

  @guideBy(() => inWindow() && !pathNotInArrJudge(window.location, ['/', '/index.html', '/login', '/mlogin', '/jump', '/account-bg', '/api_data_init.html']))
  private async storeUser(data: User | undefined, emailParam?: string) {
    const userAccountKey = !emailParam ? this.userAccountKey : this.getSubAccountCurrentUserKey(DataStoreImpl.user?.id || '', emailParam);
    if (data) {
      const data1 = window.featureSupportInfo.supportCrypto ? await this.systemApi.encryptMsg(JSON.stringify(data)) : JSON.stringify(data);

      let hasAlreadyPutted = false;
      // 从store中取出历史user对比如果account已经把这个账号写入过了 避免二次更新
      try {
        const passAndUser = await Promise.all([this.get(DataStoreImpl.defaultPassKey, globalStoreConfig), this.get(userAccountKey, globalStoreConfig)]);
        const [pass, userEncryptionInfo] = passAndUser;
        if (pass && pass.suc && userEncryptionInfo && userEncryptionInfo.suc) {
          const realUserStr = this.decryptMsg(userEncryptionInfo.data!, pass.data!);
          const userInfo = JSON.parse(realUserStr);
          /* eslint consistent-return: ["error", { "treatUndefinedAsUnspecified": false }] */
          // eslint-disable-next-line consistent-return
          hasAlreadyPutted = isEqualWith(userInfo, data, (objCookieArr, newCookieArr, field) => {
            if (field && field === 'cookie') {
              return this.systemApi.md5(objCookieArr) === this.systemApi.md5(newCookieArr);
            }
            // return undefined;
          });
          console.log('[store] compared', hasAlreadyPutted, userInfo, data);
        }
      } catch (ex) {
        console.warn('[store] load old user failed:' + ex);
      }

      if (!hasAlreadyPutted) {
        await this.put(userAccountKey, data1, globalStoreConfig).then(res => {
          if (res) {
            console.log('[store] error store user: ' + res);
          } else {
            console.log('[store] user store success');
          }
        });
      } else {
        console.log('[store] userstore has  written');
      }

      // 放到这里更合适(有可能因为数据在store中存在 会跳过写入)
      // TODO: 需要携带子账号account吗？
      this.eventApi.sendSysEvent({
        eventName: 'storeUserChangeEvent',
        eventStrData: 'storeUser',
        eventData: {
          // eslint-disable-next-line
          // @ts-ignore
          // eslint-disable-next-line consistent-return
          data: cloneDeepWith(data, (...args) => {
            if (Array.isArray(args) && args.length > 1 && args[0] === 'cookie') {
              return this.systemApi.md5(args[0]);
            }
            // return undefined;
          }),
          needWrite: !hasAlreadyPutted,
        },
        _account: emailParam,
      });
      // });
    } else {
      await this.del(userAccountKey, globalStoreConfig);
    }
  }

  private watchContact(ev?: SystemEvent, emailParam?: string): Promise<void> | undefined {
    const currentUser = this.getCurrentUser(emailParam);
    if (currentUser && this.contactApi.isInited()) {
      // 屏蔽多账号场景下 账号互串查询的问题
      if (currentUser && ev && ev._account !== currentUser.id) {
        return undefined;
      }
      const accountParam = emailParam ? currentUser.id : undefined;
      console.log('[im.myaccount]storeContactInit:', currentUser);
      const userPromise = this.contactApi.doGetContactByItem({
        type: 'EMAIL',
        value: [currentUser.id],
        _account: accountParam,
      });
      const orgPromise = this.contactApi.doGetOrgList({ typeList: [99], _account: accountParam });
      return Promise.all([userPromise, orgPromise]).then(res => {
        const [value, org] = res;
        let change = false;
        if (value && value.length > 0) {
          const model: ContactModel | undefined = value.filter(it => it && it.contact && it.contact.type === 'enterprise').pop();
          if (model && model.contact) {
            if (model.contact.position && model.contact.position.length > 0) {
              const it = model.contact.position[0].join('-');
              if (this.getUserProp('department', emailParam) !== it) {
                this.setUserProp('department', it, false, emailParam);
                change = true;
              }
            }
            // 如果contactInfo长度不一致 强制更新一次
            if (lodashGet(model, 'contactInfo.length', 0) > lodashGet(currentUser, 'contact.contactInfo.length', 0)) {
              change = true;
            }

            const user = !emailParam ? DataStoreImpl.user : DataStoreImpl.subAccountUserMap[emailParam];
            if (user) {
              const newUser = { ...user };
              if (model && model.contact) {
                if (newUser.avatar !== model.contact.avatar) {
                  newUser.avatar = model.contact.avatar || '';
                  change = true;
                }
              }
              if (model && model.contact && model.contact.contactName) {
                if (newUser.nickName !== model.contact.contactName) {
                  newUser.nickName = model.contact.contactName;
                  change = true;
                }
              }
              newUser.contact = model;
              if (!emailParam) {
                DataStoreImpl.user = newUser;
              } else {
                DataStoreImpl.subAccountUserMap[emailParam] = newUser;
              }
            }
          }
        }
        if (org && org.length > 0) {
          const corp = org[0];
          const user = !emailParam ? DataStoreImpl.user : DataStoreImpl.subAccountUserMap[emailParam];
          if (user) {
            if (this.getUserProp('company', emailParam) !== corp.orgName) {
              this.setUserProp('company', corp.orgName, false, emailParam);
              change = true;
            }
            if (this.getUserProp('companyId', emailParam) !== corp.originId) {
              this.setUserProp('companyId', corp.originId, false, emailParam);
              change = true;
            }
          }
        }
        if (change) {
          console.log('[im.myaccount]sendSysEvent:', currentUser);
          this.eventApi.sendSysEvent({
            eventName: 'updateUserInfo',
            eventStrData: '',
            eventSeq: 0,
            eventData: currentUser,
            eventLevel: 'info',
            _account: accountParam,
          } as SystemEvent);
          const user = !emailParam ? DataStoreImpl.user : DataStoreImpl.subAccountUserMap[emailParam];
          if (user) {
            this.storeUser(user, emailParam)?.then();
          }
        }
      });
    }
    return undefined;
  }

  init(): string {
    // if (inWindow()) {
    const shouldLoadUser = this.getShouldInitLoadUser();
    if (shouldLoadUser) {
      this.loadUser(); // DataStoreImpl.user 初始化
    }
    this.loadSubAccountsUser(); // subAccountUserMap 初始化
    this.loadNode();
    this.loadSubAccountsNode();
    this.loadUUID();
    const globalStorageEventListener = (ev: StorageEvent) => {
      const evKey = ev.key || '';
      if (evKey || evKey.indexOf('_hubble') >= 0) {
        return;
      }
      if (ev.key && ev.key in this.locks && this.locks[ev.key]) {
        const lock = this.locks[ev.key];
        lock.notify(ev.oldValue, ev.newValue, this.clientId).then();
      } else if (ev.key) {
        const prefix = this.getKeyPrefix(globalStoreConfig);
        const key1 = this.makeKey(prefix, this.userAccountKey); // 主账号UserKey
        if (ev.key === key1) {
          // currentLoginUserAccount不被外部注册的watchKey监听
          this.loadUser();
        } else if (this.watchedStoreKey.has(ev.key)) {
          this.eventApi.sendSysEvent({
            eventName: 'storeChangeEvent',
            eventStrData: ev.key,
            eventData: ev,
          });
        }
      }
    };
    window.addEventListener('storage', debounce(globalStorageEventListener, 500, { maxWait: 1000, leading: true, trailing: false }));
    this.eventApi.registerSysEventObserver('contactNotify', {
      name: 'sysContactSyncOb',
      func: ev => {
        const eventAccount = this.getEmailIdByEmail(ev._account || '');
        this.watchContact.bind(this)(ev, eventAccount);
      },
    });
    this.eventApi.registerSysEventObserver('loginBlock', {
      name: 'systemApiLogoutOb',
      func: (ev: SystemEvent) => {
        const emailId = this.getEmailIdByEmail(ev?._account || '');
        const logoutStatusKey = emailId ? this.getSubAccountLogoutStatusKey(DataStoreImpl.user!.id, emailId) : this.logoutStatusKey;
        if (ev && ev.eventData) {
          this.putSync(logoutStatusKey, 'true', { storeMethod: 'memory' });
        } else {
          this.putSync(logoutStatusKey, 'false', { storeMethod: 'memory' });
        }
      },
    });
    const subAccountUpdateEvents: Array<SystemEventTypeNames> = ['SubAccountAdded', 'SubAccountDeleted', 'subAccountDBChanged', 'SubAccountLoginExpired'];
    subAccountUpdateEvents.forEach(eventName => {
      this.eventApi.registerSysEventObserver(eventName, {
        name: 'dataStoreApiImpl-' + eventName,
        func: () => {
          const isMainPage = this.systemApi.isMainPage();
          if (isMainPage) return;
          this.loadSubAccountsNode();
          this.loadSubAccountsUser();
        },
      });
    });
    return this.name;
  }

  afterInit() {
    this.loggerApi.track('app_init_data_in_store', {
      uuid: this.getUUID(),
      node: this.getCurrentNode(),
      subAccountNodeMap: DataStoreImpl.subAccountNodeMap,
      user: this.getCurrentUser(),
      subAccountUserMap: DataStoreImpl.subAccountEmailMap,
      client: this.clientId,
    });
    return this.name;
  }
}

const dataStore: DataStoreImpl = new DataStoreImpl();
// const init = function () {
//     dataStore = new DataStoreImpl();
api.registerDataStoreApi(dataStore);
// return dataStore.name;
// }
/* const name = */
// init();
export default dataStore;
