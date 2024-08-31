/* eslint-disable prefer-promise-reject-errors */
import lodashGet from 'lodash/get';
import moment from 'moment';
import {
  ModulePs,
  ProductAuthApi,
  ProductAuthTagInfo,
  ProductVersionInfo,
  ReqGetGlobalAuths,
  ResGetGlobalAuths,
  ResGetGlobalAuthsWithCache,
  ResGetGlobalAuthsWithoutCache,
  ABSwitch,
  ReqPubClueCreate,
  ResGetPrivilege,
  ResGetPrivilegeAll,
  AUTH_CONFIG,
  AUTH_TYPE_CONFIG,
  AuthorityFeature,
  AuthorityFeatureKey,
  ParseConfigMap,
  LocalAuthorityConfigType,
  ProductAuthorityFeatureKey,
  DefaultParseConfigFn,
  Privileges,
  SubAccountProductInfo,
  ProductConfig,
  EdmVideoItem,
  EdmVideos,
} from '@/api/logical/productAuth';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { SystemApi } from '../../../api/system/system';
import { ApiResponse, DataTransApi, ResponseData } from '../../../api/data/http';
import { DataStoreApi, StoreData } from '@/api/data/store';
import { wait } from '@/api/util';

const inEdm = process.env.BUILD_ISEDM;
const PRODUCT_ID = 'PRODUCT_ID';
// 存储全局的权限
class GlobalAuthsStore {
  // 默认权限请求参数
  static defGlobalAuthsParams = {
    productId: 'sirius',
    productVersionId: 'trial',
  };

  // 权限过期时间 5分钟
  static readonly expireTime = 5 * 60 * 1000;

  globalAuths: ModulePs[] | null;

  // 最近一次的获取时间（毫秒）
  latestGetTime: number | null;

  constructor() {
    this.latestGetTime = null;
    this.globalAuths = [];
  }

  reset() {
    this.latestGetTime = null;
    this.globalAuths = [];
  }
}

/**
 *  权限转换方法Map
 *  当有需要特殊处理的权健配置转换在此处添加
 */
const parseConfig: ParseConfigMap = {
  [AuthorityFeature.READ_EMIAIL](authConfig: any) {
    const { accessValue, accessLabel, accessValueType } = authConfig;
    let value = accessValue;
    if (accessValueType === 'JSON') {
      try {
        value = JSON.parse(accessValue);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: (AuthorityFeature.READ_EMIAIL + '_' + accessLabel) as ProductAuthorityFeatureKey,
      show: true,
      desc: value,
    };
  },
};

/**
 * 默认权限转换方法
 */
const defautlAuthConfigParse: DefaultParseConfigFn = (key: AuthorityFeatureKey, authConfig: any) => {
  const { accessValue, accessLabel } = authConfig;
  return {
    name: (key + '_' + accessLabel) as ProductAuthorityFeatureKey,
    show: !!accessValue,
    desc: null,
  };
};

class ProductAuthApiImpl implements ProductAuthApi {
  private systemApi: SystemApi;

  private http: DataTransApi;

  private storeApi: DataStoreApi;

  private productAuthSynced = false;

  private hasTriggerABSwitchRequest = false;

  static readonly storeName = 'pubClueInfo';

  static defaultTagInfos: ProductAuthTagInfo[] = [];

  static defaultProductInfo: ProductVersionInfo = {
    productId: '',
    productVersionId: 'others',
    productVersionName: '',
    showVersionTag: false,
    subAccountProductInfo: new Map(),
  };

  private tagInfos: ProductAuthTagInfo[] = ProductAuthApiImpl.defaultTagInfos;

  private productInfo: ProductVersionInfo = ProductAuthApiImpl.defaultProductInfo;

  globalAuthsStore: GlobalAuthsStore;

  /**
   * 本地缓存权限配置
   * 属于密封对象，无法被修改
   */
  private LocalAuthorityConfig?: LocalAuthorityConfigType;

  // 权限请求锁
  private requestAuthConfigNetLock = false;

  constructor() {
    this.name = apis.productAuthApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.storeApi = api.getDataStoreApi();
    this.globalAuthsStore = new GlobalAuthsStore();
    this.getAuthConfig = this.getAuthConfig.bind(this);
    this.saveAuthConfigFromNet = this.saveAuthConfigFromNet.bind(this);
  }

  getStoreAuthInfo() {
    return this.storeApi.getSync(AUTH_CONFIG)?.data;
  }

  setStoreAuthInfo(authInfoStr: string) {
    return this.storeApi.putSync(AUTH_CONFIG, authInfoStr);
  }

  // eslint-disable-next-line class-methods-use-this
  private unpackRes(res: ApiResponse) {
    console.log('[product auth] from network:', res);
    if (res && res.data && res.data.success) {
      return res.data.data;
    }
    if (res && res.data) {
      return Promise.reject({
        title: res.data.message,
        code: res.data.code,
      });
    }
    return Promise.reject({
      title: '请求失败',
      code: 'SERVER.ERR',
    });
  }

  private abSwitch: ABSwitch = {
    forbidden_writelog: false,
    contact_cache: false,
    longtask: false,
    localdb: false,
    cache_contact: false,
    show_new_web_entry_guide: false,
    address_transfer2_crm_done: false,
    edm_mail: inEdm,
    skip_full_enterprise: false,
    build_unitpath_local: false,
    disable_ui_binding_outlook: false,
    disable_ui_binding_gmail: false,
    disable_ui_binding_qiyeqq: false,
    edm_menu_video: '',
    // ws_personal: false,
  };

  private productConfig: ProductConfig = {
    learning_video: null,
  };

  static SWITCH_MAX_STORE_DURATION = 2 * 60 * 60 * 1000;

  async getABSwitch(field: keyof ABSwitch | undefined) {
    if (typeof field === 'undefined') {
      return this.abSwitch;
    }
    return this.abSwitch[field];
  }

  getABSwitchSync(field: keyof ABSwitch | undefined) {
    if (typeof field === 'undefined') {
      return this.abSwitch;
    }
    return this.abSwitch[field];
  }

  doGetGlobalAuths(req?: ReqGetGlobalAuths): Promise<ResGetGlobalAuths> {
    const url = this.systemApi.getUrl('getAllAuthorities');
    return this.http.get(url, req || GlobalAuthsStore.defGlobalAuthsParams).then(res => this.unpackRes(res));
  }

  private async fetchProductTagInfo() {
    let res = null;
    try {
      res = await this.http.get(this.systemApi.getUrl('clientTagInfo'));
    } catch (e) {
      console.error('[productAuth] getProductTagFromNetwork got error', e);
    }
    console.log('[productAuth] get tag successful ', res);
    if (res && res.data && res.data.success && res.data.data) {
      const { tags } = res.data.data;
      this.tagInfos = tags;
      // this.productInfo = rest;
      // 直接更改版本
      // this.productInfo.productVersionId = 'free';
      this.productAuthSynced = true;
    }
    return res;
  }

  async doGetProductAuthTags(): Promise<ProductAuthTagInfo[]> {
    if (!this.productAuthSynced) {
      await this.fetchProductTagInfo();
    }
    return this.tagInfos;
  }

  async doGetProductVersion(): Promise<ProductVersionInfo> {
    if (!this.productInfo?.productId) {
      try {
        const config = this.storeApi.getSync(AUTH_TYPE_CONFIG)?.data;
        if (config) {
          this.productInfo = JSON.parse(config);
        } else {
          await this.saveAuthConfigFromNet();
          const newConfig = this.storeApi.getSync(AUTH_TYPE_CONFIG)?.data;
          if (newConfig) {
            this.productInfo = JSON.parse(newConfig);
          }
        }
      } catch (e) {
        console.error('auth error', e);
      }
    }
    return this.productInfo;
  }

  doGetProductVersionId(): string {
    // 默认主账号
    return this.productInfo.productVersionId || 'sirius';
  }

  async asyncGetProductVersionId(params?: { _account: string }): Promise<string> {
    const _account = params?._account;
    if (_account) {
      if (this.productInfo?.subAccountProductInfo?.get(_account)) {
        return this.productInfo?.subAccountProductInfo?.get(_account)?.productVersionId || 'sirius';
      }
      try {
        const res = await this.http.get(this.systemApi.getUrl('clientTagInfo'), undefined, { _account });
        console.log('[productAuth] get tag successful ', res);
        const { success, data: infoData } = res?.data || {};
        if (success && infoData) {
          this.productInfo?.subAccountProductInfo?.set(_account, infoData as SubAccountProductInfo);
          return infoData.productVersionId || 'sirius';
        }
        return 'sirius';
      } catch (e) {
        console.error('[productAuth] getProductTagFromNetwork got error', e);
        return 'sirius';
      }
    }
    // 默认主账号
    return this.productInfo.productVersionId || 'sirius';
  }

  name: string;

  init() {
    return this.name;
  }

  private async fetchABSwitch() {
    const productVersion = this.systemApi.inEdm() ? await this.doGetProductVersion() : null;
    const url = this.systemApi.getUrl('getABSwitch');
    try {
      const res = (await this.http.get(url, {
        matchPath: 'desktop_optimize',
        _productVersion: productVersion ? productVersion.productVersionId : undefined,
      })) as ApiResponse<Record<'desktop_optimize', ABSwitch>>;
      if (!res.data) {
        res.data = {
          data: {
            desktop_optimize: {} as any,
          },
        };
      }
      this.abSwitch = lodashGet(res, 'data.data.desktop_optimize', this.abSwitch);
    } catch (ex) {
      console.error('[abtest]error', ex);
    }
  }

  afterInit() {
    this.fetchABSwitch();
    this.fetchProductTagInfo()
      .then()
      .catch(err => console.warn(err));

    if (this.systemApi.getCurrentUser() && !this.hasTriggerABSwitchRequest) {
      this.fetchABSwitch();
      this.systemApi.intervalEvent({
        eventPeriod: 'long',
        handler: async ev => {
          console.log('[abtest]', ev);
          // 15分钟执行一次
          if (ev.seq % 10 === 0) {
            this.fetchABSwitch();
          }
        },
        seq: 0,
      });
      this.hasTriggerABSwitchRequest = false;
    }
    return this.name;
  }

  afterLogin() {
    // 清空 重置
    this.globalAuthsStore.reset();
    this.fetchABSwitch();
    this.doGetGlobalAuths()
      .then(res => {
        this.globalAuthsStore.globalAuths = res.privileges;
        this.globalAuthsStore.latestGetTime = new Date().getTime();
      })
      .catch(error => {
        console.log('afterLogin doGetGlobalAuths error', error);
      });
    if (!this.hasTriggerABSwitchRequest) {
      this.fetchABSwitch();
      this.systemApi.intervalEvent({
        eventPeriod: 'long',
        handler: async ev => {
          console.log('[abtest]', ev);
          // 15分钟执行一次
          if (ev.seq % 10 === 0) {
            this.fetchABSwitch();
          }
        },
        seq: 0,
      });
      this.hasTriggerABSwitchRequest = false;
    }
    return this.name;
  }

  // 从网络系统权限存储到本地
  async saveAuthConfigFromNet(retry?: number): Promise<boolean> {
    retry = retry === undefined ? 2 : retry;
    try {
      // 如果本地有缓存的权限信息，则不阻塞加载流程
      const sync = this.storeApi.getSync(AUTH_CONFIG);
      if (sync && sync.suc && sync.data) {
        this.fetchProductTagInfo();
        if (!this.systemApi.getIsCorpMailMode()) {
          this.doGetPrivilegeAll().then(res => {
            if (res && res.data && res?.data?.privileges) {
              this.mergeAndSaveAuthConfig(res?.data?.privileges);
              const { productId, productVersionId, productVersionName } = res?.data || {};
              const productInfo = {
                productId,
                productVersionId,
                productVersionName,
              };
              this.storeApi.putSync(AUTH_TYPE_CONFIG, JSON.stringify(productInfo));
            }
            console.log('[productAuth] get auth ', res);
          });
        }
      } else {
        this.fetchProductTagInfo();
        if (!this.systemApi.getIsCorpMailMode()) {
          const res = await this.doGetPrivilegeAll();
          if (res && res.data && res?.data?.privileges) {
            this.mergeAndSaveAuthConfig(res?.data?.privileges);
            const { productId, productVersionId, productVersionName } = res?.data || {};
            const productInfo = {
              productId,
              productVersionId,
              productVersionName,
            };
            this.storeApi.putSync(AUTH_TYPE_CONFIG, JSON.stringify(productInfo));
          }
          console.log('[productAuth] get auth ', res);
        }
      }
      return true;
    } catch (e) {
      console.error('[productAuth] get auth failed ', e);
      // if (e && typeof e === 'string' && e === 'NETWORK.ERR.TIMEOUT') {
      if (retry > 0) {
        await wait(1500 * (3 - retry) + 500);
        if (!this.systemApi.getIsCorpMailMode()) {
          return this.saveAuthConfigFromNet(retry - 1);
        }
      }
      // }
      return Promise.reject(new Error('权限请求失败'));
    }
  }

  async getGlobalAuthsWithCache(): Promise<ResGetGlobalAuthsWithCache> {
    const nowTime = new Date().getTime();
    const { latestGetTime, globalAuths } = this.globalAuthsStore;
    // 未过期 返回旧权限
    if (latestGetTime && nowTime - latestGetTime < GlobalAuthsStore.expireTime) {
      return {
        success: true,
        source: 'cache',
        val: globalAuths,
        changed: false,
      };
    }
    // 已过期 或上次未获取到 获取并返回新权限
    try {
      const res = await this.doGetGlobalAuths();
      this.globalAuthsStore.globalAuths = res.privileges;
      this.globalAuthsStore.latestGetTime = nowTime;
      return {
        success: true,
        source: 'net',
        val: this.globalAuthsStore.globalAuths,
        changed: !!(JSON.stringify(this.globalAuthsStore.globalAuths) === JSON.stringify(globalAuths)),
      };
    } catch (error) {
      console.log('getGlobalAuthsWithCache error', error);
      return {
        success: false,
        source: 'cache',
        val: globalAuths,
        changed: false,
        error,
      };
    }
  }

  async getGlobalAuthsWithoutCache(): Promise<ResGetGlobalAuthsWithoutCache> {
    const { globalAuths } = this.globalAuthsStore;
    try {
      const res = await this.doGetGlobalAuths();
      this.globalAuthsStore.globalAuths = res.privileges;
      this.globalAuthsStore.latestGetTime = new Date().getTime();
      return {
        success: true,
        source: 'net',
        val: this.globalAuthsStore.globalAuths,
      };
    } catch (error) {
      console.log('getAllAuthsWithoutCache error', error);
      return {
        success: false,
        source: 'cache',
        val: globalAuths,
        error,
      };
    }
  }

  async createPubClue(req: ReqPubClueCreate): Promise<ResponseData | undefined> {
    const url = this.systemApi.getUrl('createPubClue');
    const params = { productType: 'Sirius', clueSource: 'LX_DESKTOP', ...req };
    return this.http
      .post(url, params, { contentType: 'json' })
      .then(res => {
        console.log('createPubClue', res);
        return res.data;
      })
      .catch(() => Promise.reject(new Error('request failed')));
  }

  async isOverTimeByPubClue(): Promise<boolean> {
    const sync: StoreData = this.storeApi.getSync(ProductAuthApiImpl.storeName);
    if (sync && sync.suc && sync.data) {
      const data = JSON.parse(sync.data);
      const saveDate = moment(data.time).hour(23).minute(59).second(59);
      return moment().isAfter(saveDate);
    }
    return true;
  }

  async savePubClueTime(): Promise<void> {
    this.storeApi.putSync(ProductAuthApiImpl.storeName, JSON.stringify({ time: moment().valueOf() }));
  }

  // 获取权限信息
  getAuthConfig(key: ProductAuthorityFeatureKey) {
    let res = null;
    if (!this.systemApi.getIsCorpMailMode()) {
      if (this.LocalAuthorityConfig) {
        // 密封对象以防止修改
        res = Object.freeze(this.LocalAuthorityConfig[key]) || null;
      } else {
        const strConfig = this.storeApi.getSync(AUTH_CONFIG)?.data;
        // 如果本地变量没有初始化，尝试从localstorge中读取缓存
        if (strConfig) {
          try {
            this.LocalAuthorityConfig = Object.freeze(JSON.parse(strConfig));
            res = (this.LocalAuthorityConfig && Object.freeze(this.LocalAuthorityConfig[key])) || null;
          } catch (e) {
            console.warn(e);
          }
        } else if (!this.requestAuthConfigNetLock && this.systemApi.getCurrentUser()) {
          // 本地没有缓存，尝试挂锁触发一次网络权限请求，本次权限获取会失败
          this.requestAuthConfigNetLock = !0;
          this.saveAuthConfigFromNet();
        }
      }
    }
    return res;
  }

  /**
   * 融合权限规则
   */
  private mergeAndSaveAuthConfig(list: Privileges<unknown>[]) {
    const resConfig: LocalAuthorityConfigType = {};
    try {
      list.forEach(config => {
        const key: AuthorityFeatureKey = config.resourceLabel;
        config?.accessList?.forEach(element => {
          const { accessLabel } = element;
          const productAuthName: ProductAuthorityFeatureKey = (key + '_' + accessLabel) as ProductAuthorityFeatureKey;
          const parse = parseConfig[key];
          if (parse) {
            resConfig[productAuthName] = parse(element);
          } else {
            resConfig[productAuthName] = defautlAuthConfigParse(key, element);
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
    this.LocalAuthorityConfig = resConfig;
    // 本地存储到localStorge中
    // todo: 存储到分用户的localStorge
    try {
      // localStorage.setItem(AUTH_CONFIG, JSON.stringify(resConfig));
      this.storeApi.putSync(AUTH_CONFIG, JSON.stringify(resConfig));
    } catch (e) {
      console.error(e);
    }
    return resConfig;
  }

  /**
   * 获取所有权限信息
   */
  async doGetPrivilegeAll<T = unknown>() {
    const requestPrivilegeFromCommonWeb = async (right_no: string) => {
      const url = this.systemApi.getUrl('getAccountRight');
      try {
        const res = await this.http.get<{
          data: boolean;
        }>(url, { right_no }, { contentType: 'form' });
        // if (`${res.code}` !== '200') {
        //   return true;
        // }
        return res.data?.result?.data || false;
      } catch (ex) {
        return true;
      }
    };

    const convertToPrivilegeResponse = (right: boolean, name: string) => {
      if (name === 'passchange') {
        return {
          resourceLabel: 'ORG_SETTING_UPDATE_PASSWORD' as AuthorityFeatureKey,
          resourceName: '管理后台设置密码',
          accessList: [
            {
              accessLabel: 'SHOW',
              accessName: '显示',
              accessValueType: 'BOOL',
              accessValue: right,
            },
          ],
        };
      }
      return {
        resourceLabel: 'ORG_SETTING_BIG_ATTACH' as AuthorityFeatureKey,
        resourceName: '管理后台云附件',
        accessList: [
          {
            accessLabel: 'SHOW',
            accessName: '显示',
            accessValueType: 'BOOL',
            accessValue: right,
          },
        ],
      };
    };

    return this.http.get<ResGetPrivilegeAll<T>>(this.systemApi.getUrl('getPrivilegeAll')).then(async res => {
      if (res.data == null || lodashGet(res, 'data.code', 999) !== 0) {
        throw new Error(lodashGet(res, 'data.message', '获取账号版本全部功能权限失败'));
      }
      const productId = res.data.data?.productId;
      if (productId != null) {
        this.storeApi.putSync(PRODUCT_ID, productId);
      }

      // 请求passchange和big_attach权限接口
      await Promise.all(
        ['passchange', 'bigattach'].map(async right => {
          const flag = await requestPrivilegeFromCommonWeb(right);
          // eslint-disable-next-line
          // @ts-ignore
          res.data?.data?.privileges.push(convertToPrivilegeResponse(flag, right));
        })
      );
      return res.data;
    });
  }

  /**
   * 获取版本功能信息
   */
  async doGetProductTags() {
    return this.http.get(this.systemApi.getUrl('getProductTags')).then(res => {
      console.log(res);
      if (res.data) {
        return res.data.data;
      }
      throw new Error('获取版本信息失败');
    });
  }

  /**
   * 根据权限标识，获取权限信息
   */
  async doGetPrivilege<T = unknown>() {
    return this.http.get<ResGetPrivilege<T>>(this.systemApi.getUrl('getPrivilege')).then(res => {
      if (res.data == null || lodashGet(res, 'data.code', 999) !== 0) {
        throw new Error(lodashGet(res, 'data.message', '获取账号版本功能权限失败'));
      }
      return res.data;
    });
  }

  async doGetProductVideos(videoId: string): Promise<EdmVideoItem | null> {
    if (this.productConfig.learning_video && (this.productConfig.learning_video as EdmVideos)[videoId]) {
      return (this.productConfig.learning_video as EdmVideos)[videoId];
    }
    const url = this.systemApi.getUrl('getProductVideos');
    const res = (await this.http.get(url, { videoId })) as ApiResponse<EdmVideos>;
    if (!res.data?.data) {
      return null;
    }
    const result = res.data.data[videoId] || null;
    if (result) {
      if (!this.productConfig.learning_video) {
        this.productConfig.learning_video = {};
      }
      (this.productConfig.learning_video as EdmVideos)[videoId] = result;
    }
    return result;
  }
}

const productAuthApiImpl: ProductAuthApi = new ProductAuthApiImpl();
api.registerLogicalApi(productAuthApiImpl);
export default productAuthApiImpl;
