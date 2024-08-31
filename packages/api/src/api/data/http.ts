// import {apis} from "../../config";
// import {api} from "../api";
import { Api } from '../_base/api';
import { DeviceInfo } from '@/api/system/system';
// import {TransMethod} from "../../impl/api_data/http/http_impl";

export type URLBuilderConf = {
  noAddingHost?: boolean;
  _account?: string;
};
export interface BlackUrlList {
  [key: string]: boolean;
}
export type HttpTransMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK';

export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
export type HttpContentType = 'form' | 'json' | 'xml' | 'stream' | 'text' | 'arraybuffer' | '';

export type LoadOperation = 'abort' | 'pause' | 'resume';

export interface LoaderActionConf extends ApiRequestConfig {
  progressIndicator?: (progress: number, receivedBytes?: number) => void;
  operatorSet?: (handler: (operation: LoadOperation) => void) => void;
  recordPerf?: boolean;
  recordFileType?: 'common' | 'cloud' | 'all';
  // 已完成偏移量
  offset?: number;
  _account?: string;
}

/**
 * 网络交互返回数据的外包装
 */
export interface ResponseData<T = any> {
  success?: boolean;
  message?: string;
  code?: string | number;
  data?: T;
  suc?: boolean;
  msgCode?: string;
  msgCodeDesc?: string;
  msg?: string;
  result?: T;
  ret?: T;
  var?: T;
  err_msg?: string;
  en_err_msg?: string;
  error?: string;
  sentTInfo?: string;
  errorCode?: string;
  [k: string]: string | undefined | T | number | boolean | Record<string, string | number | boolean>;
  // errorRcpts?: object;
}

/**
 refresh : 刷新本地缓存，使用网络请求数据返回，仅在网络断网无法返回时使用本地数据返回
 useDirect : 直接使用本地缓存，仅在本地缓存不存在的情况下访问网络，并在返回后将数据缓存在本地
 useAndRefresh: 直接使用本地缓存，但是每次使用后启动异步任务访问网络，并刷新本地缓存
 noCache：不使用缓存
 */
export type CachePolicy = 'refresh' | 'useDirect' | 'useAndRefresh' | 'noCache';

/**
 * 请求的通用配置类
 */
export interface ApiRequestConfig {
  /**
   * 请求地址，调用时通常不用在这个地方填写
   */
  url?: string;
  /**
   * 账号信息
   */
  _account?: string;
  /**
   * 处理后的url
   */
  parsedUrl?: URL;
  /**
   * 调用方法
   */
  method?: HttpTransMethod;

  baseURL?: string;
  /**
   * 请求header，可自定义
   */
  headers?: any;
  /**
   * axios自带，基本没用
   */
  params?: any;

  agentNode?: string;
  /**
   * 参数序列化方法，{@link Axios.AxiosRequestConfig}
   * @param params
   */
  paramsSerializer?: (params: any) => string;
  /**
   * 数据
   */
  data?: any;
  mockData?: any;
  /**
   * 超时时间
   */
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  responseType?: ResponseType;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  maxContentLength?: number;
  validateStatus?: ((status: number) => boolean) | null;
  maxBodyLength?: number;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  decompress?: boolean;
  /**
   * 请求数据类型
   */
  contentType?: HttpContentType;
  operator?: (handler: (operation: LoadOperation) => void) => void;
  /**
   * 正在进行重登录
   */
  reLoginProcessing?: boolean;
  /**
   * 由于请求失败，验证失败等原因进行重试的次数
   */
  retryTimes?: number;
  /**
   * 该请求进行过重登录，由httpApi设置
   */
  handleReLogin?: boolean;
  /**
   * 请求是否被用户主动取消，由httpApi设置
   */
  canceled?: boolean;
  /**
   * 请求的唯一key，由httpApi设置
   */
  rqKey?: string;
  /**
   * 进入队列等待，0否，其他值是，由httpApi设置
   */
  enqueued?: number;
  /**
   * 缓存过期时间，小于零可禁用缓存
   */
  expiredPeriod?: number;
  /**
   * 同类请求最多可以并行的数量，暂未支持
   */
  concurrentRate?: number;
  /**
   * 同类请求的key生成器，同一个key被认为是同类请求
   */
  concurrentKeyGen?: () => string;
  /**
   * 在useCacheResultPeriod毫秒内使用缓存返回结果，
   */
  useCacheResultPeriod?: number;
  /**
   * 无法使用cache返回结果，由httpApi设置
   */
  cacheMissed?: boolean;
  /**
   * 请求序列号，由请求框架层httpApi设置
   */
  seq?: number;
  /**
   * 使用cache返回结果
   */
  useCacheReturn?: boolean;
  /**
   * 期望的返回类型，针对部分有毒的接口，需要使用text返回数据，再自行转换为json
   */
  expectedResponseType?: ResponseType;
  /**
   * 缓存处理方案
   */
  cachePolicy?: CachePolicy;
  /**
   * 请求的标签，可以用于带回后续处理的参数，tag也作为请求分类依据
   */
  tag?: string;
  /**
   * 路径,url分类依据（计算方式，urlPath + config.tag）,忽略参数，框架自动维护，不需要传入
   */
  urlPath?: string;
  /**
   * 请求是否处理成功，由请求框架层做处理后填入，写入缓存时如发现此标示位置位，则不会存入缓存
   */
  requestFailed?: boolean;
  /**
   * 不自动弹出错误
   */
  noErrorMsgEmit?: boolean;
  /**
   * 不自动入队
   */
  noEnqueue?: boolean;
  dataType?: string;
  //仅主账号web端生效，子账号会强制加token
  noHeaderCookie?: boolean;
  hideErrorToast?: boolean;
}

/**
 * 网络请求的返回通用外包装
 */
export interface ApiResponse<T = any> {
  uri: string;
  config: ApiRequestConfig;
  data?: ResponseData<T>;
  rawData?: T;
  status: number;
  statusText: string;
  headers: any;
  request?: any;
  code?: string;
}

/**
 * 网络请求错误返回的通用外部封装
 */
export interface ApiError<T = any> extends Error {
  code?: string;
  request?: any;
  response?: ApiResponse<T>;
  toJSON: () => object;
}

// type RequestPreHandleRet = { reLogin: boolean, cache: boolean };
type ResponseCachePolicyRet = {
  // cache: 'none' | 'inLocalStore' | 'inIndexDb';
  cacheKey?: string;
};

// export type TransMethod =
/**
 * 按url配置的拦截器
 */
export interface RequestHandleConfig {
  /**
   * 根据返回数据预判是否需要自动进行重新登录，
   *
   * @param data
   */
  requestAutoReLogin?: (data: ApiResponse<any>) => boolean;
  /**
   * 根据返回数据预判是否需要自动缓存，
   *
   * @param data
   */
  canCache?: (data: ApiResponse<any>) => boolean;
  /**
   * 重登录后原请求的变换配置
   */
  reLoginUrlHandler?: (Request: ApiRequestConfig) => ApiRequestConfig;
  /**
   * 拦截器正则表达式，匹配除了host之外的url部分
   */
  matcher: RegExp;
  /**
   * 缓存key生成器
   */
  cachePolicyGenerator?: (data: ApiRequestConfig) => ResponseCachePolicyRet;
  /**
   * 最大可并行请求
   */
  maxConcurrentRequest?: number;
  /**
   * 根据返回确认是否重试
   */
  requestAutoRetry?: (data: ApiResponse<any>) => number;
}

export const constHttpCanceledToken = '__canceled__';

/**
 * 网络请求API,
 * 请求方法中config非必须，如传入，则config中的url可覆盖第一个参数url
 * config中noErrorMsgEmit 可以控制不自动弹出错误窗口
 * config中noEnqueue 可以控制不自动入队相同请求
 */
export interface DataTransApi extends Api {
  get<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>;

  delete(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse>;

  head(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse>;

  options(url: string, config?: ApiRequestConfig): Promise<ApiResponse>;

  post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>;

  put(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse>;

  patch(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse>;

  patch(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse>;

  buildUrl(url: string, req: any, conf?: URLBuilderConf): string;

  addConfig(conf: RequestHandleConfig): void;

  setDisableCache(disable: boolean): void;

  buildRequestKey(config: ApiRequestConfig): any;

  /**
   * 针对部分单url多种功能的接口使用urlPath这个字段进行区分
   * @param config
   */
  getUrlPath(config: ApiRequestConfig): void;

  /**
   * 清除指定缓存
   * @param req 清理缓存的请求参数
   */
  cleanCacheEntry(req: Partial<ApiRequestConfig>): void;

  setLogoutStatus(flag: boolean): void;

  setSubAccountLogoutStatus(subAccount: string, flag: boolean): void;

  getDeviceInfo(): DeviceInfo | undefined;

  getLogoutPage(): string;

  addCommonHeader(key: string, value: string): void;

  updateDeviceInfo(): Promise<void>;

  triggerCurrentUserLogout(forceLogout: boolean): void;

  getSubAccountByReqConfig(req?: ApiRequestConfig): string;
}
