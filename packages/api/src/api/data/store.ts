import { Api, commonMessageReturn, Properties, User } from '../_base/api';

/**
 * storeApi 返回数据通用包装类
 */
export interface StoreData {
  /**
   * 返回数据
   */
  data?: string;
  /**
   * 错误信息
   */
  err?: string;
  /**
   * 请求的key
   */
  key: string;
  /**
   * 是否成功
   */
  suc: boolean;
  /**
   * 额外属性
   */
  prop?: Properties;
}

/**
 * 全局发号器，发号器的当前数值存在localStorage中，可以保障多页面不重复
 */
export interface StoredSequence {
  readonly name: string;

  /**
   * 获取下一个值，算法会保障该值和前值不一样
   */
  next(): number;

  /**
   * 获取下一个值，accountId &seq& number
   */
  nextOne(_account?: string): string;

  /**
   * 设置序号
   * @param seq 新序号值，后续发号将从此数值开始
   */
  setSeq(seq: number): void;

  /**
   * 获取当前序号值
   */
  current(): number;
}

/**
 * 锁结构，通过DataStoreApi.getLock获取
 */
export interface StoredLock {
  lock(eventId?: string): Promise<void>;

  unlock(): void;

  destroyLock(): void;
}

export interface ISubAccountEmailOnlyInfo {
  email: string;
  agentEmail: string;
}

export type StoreMethod = 'memory' | 'localStorage' | 'indexedDb';
/**
 * store配置
 */
export interface StoreConfig {
  /** key前缀，文本部分会被hash，前缀可以保留明文 * */
  prefix?: string;
  /** 是否为用户无关数据，用户无关数据切换账号登录时可以互相读取到 * */
  noneUserRelated?: boolean;
  /**
   * 存储方式
   */
  storeMethod?: StoreMethod;
  /**
   * 账号
   */
  _account?: string;
}

export interface SubAccountState {
  email: string;
  agentEmail: string;
  node: string;
  loginUser: User;
  // defaultPass: string;
}

/**
 * 数据存储API
 */
export interface DataStoreApi extends Api {
  /**
   * 异步存入键值对数据
   * @param key  键
   * @param data 值
   * @param config 配置，参见 {@link StoreConfig}
   */
  put(key: string, data: string, config?: StoreConfig): Promise<commonMessageReturn>;

  putToDB(key: string, data: string, config?: StoreConfig): Promise<commonMessageReturn>;

  getFromDB(key: string, config?: StoreConfig): Promise<StoreData>;

  delFromDB(key: string, config?: StoreConfig): Promise<commonMessageReturn>;
  /**
   * 异步获取键值对数据
   * @param key  键
   * @param config 配置，参见 {@link StoreConfig}
   * @return {@link StoreData}
   */
  get(key: string, config?: StoreConfig): Promise<StoreData>;

  /**
   * 异步删除键值对数据
   * @param key  键
   * @param config 配置，参见 {@link StoreConfig}
   */
  del(key: string, config?: StoreConfig): Promise<commonMessageReturn>;

  /**
   * 异步删除键值对数据
   * @param key  键
   * @param config 配置，参见 {@link StoreConfig}，如传入noneUserRelated将清理整个localStorage，否则只删除当前用户的key
   */
  clear(config?: StoreConfig): Promise<commonMessageReturn>;

  /**
   * 同步获取键值对数据
   * @param key 键
   * @param config 配置，参见 {@link StoreConfig}
   */
  getSync(key: string, config?: StoreConfig): StoreData;

  /**
   * 同步存入数据
   * @param key 键，
   * @param data 值
   * @param config  配置，参见 {@link StoreConfig}
   */
  putSync(key: string, data: string, config?: StoreConfig): string;

  /**
   * 获取全局发号器
   * @param name
   * @param initSeq
   */
  getSeqHelper(name: string, initSeq?: number): StoredSequence;

  /**
   * 设置账号，通常只有框架会调用此方法
   * @param lst 最近登录的账号
   */
  setLastAccount(lst: User | undefined, email?: string): Promise<string>;

  /**
   * 获取当前用户
   */
  getCurrentUser(email?: string): User | undefined;

  /**
   * 设置用户属性
   * @param key 键
   * @param value 值
   * @param store 是否刷新到localStorage ，如传入false，则此属性仅在内存存在，会在下次传入true的时候写入localStorage
   */
  setUserProp(key: string, value: string | string[] | Record<string, string | number>, store?: boolean, email?: string): void;

  /**
   * 设置当前节点
   * @param node
   */
  setCurrentNode(node?: string, email?: string): void;

  /**
   * 获取当前节点
   */
  getCurrentNode(email?: string): string;

  /**
   * 获取锁结构
   * @param name  锁名称，获取同名锁会执行互斥逻辑
   * @param timeout 锁超时时间
   * @param createNone 是否创建新的，传入false可用于检测是否存在该名称的锁
   * @param lockInOnePage 是否锁定同页面的内容
   */
  getLock(name: string, timeout?: number, createNone?: boolean, lockInOnePage?: boolean): StoredLock;

  /**
   * 获取本地存储的设备uuid
   */
  getUUID(): string;

  /**
   * 从localStorage中加载用户数据
   */
  loadUser(): void;

  loadSubAccountsUser(): void;

  isLogout(email?: string): boolean;

  loadUUID(): string;

  getKey(key: string, conf?: StoreConfig): any;

  addWatchedKey(key: string, config?: StoreConfig): void;

  addSubAccountToList(emailInfo: ISubAccountEmailOnlyInfo): void;

  getSubAccountList(): Array<ISubAccountEmailOnlyInfo>;

  removeSubAccountFromList(email: string): void;

  getEmailIdByEmail(email: string, returnExpired?: boolean): string;

  getAgentEmailByEmail(email: string): string;

  /**
   * 1.27版本升级将挂账号窗口的数据同步到主窗口
   * 非此场景慎用
   */
  putSubAccountState(val: SubAccountState): Promise<void>;

  /**
   * 1.27版本升级获取需要同步到主窗口的挂载账号数据
   * 非此场景慎用
   */
  getSubAccountState(): SubAccountState | undefined;
}

export const globalStoreConfig: StoreConfig = { noneUserRelated: true };
