import { Api, resultObject } from '../_base/api';

export const DataTrackerProps = [
  'domain',
  'orgName',
  'threadMode',
  'userAccount',
  'logginStatus',
  'isLogin',
  'uuid',
  'orgId',
  'version',
  'platform',
  'app',
  'qiyeAccountId',
  'mailVersion',
  'deviceId',
  '_page',
] as const;

export type DataTrackerProp = (typeof DataTrackerProps)[number];

export type DataTrackerProperties = {
  [prop in DataTrackerProp]: any;
};

export type OxpeckerSetURLParams = {
  baseUrl: string;
  beaconUrl: string;
  isNewUrl: string;
};

export interface DATracker {
  oxpecker_flush(): unknown;
  __loaded?: boolean;

  init(appkey: string, options: resultObject): void;

  login(userId: string): void;

  logout(): void;

  track(eventId: string, attributes?: resultObject): void;

  register_attributes(properties: Partial<DataTrackerProperties>): void;

  unregister_attributes(prop: DataTrackerProp): void;

  clear_attributes(): void;

  oxpecker_init(key: string, attrs?: Record<string, string>): void;

  current_attributes(callbackFn: (properties: DataTrackerProperties) => void): void;

  oxpecker_set_product_profile(properties: Partial<DataTrackerProperties>): void;

  oxpecker_set_url(conf: OxpeckerSetURLParams): void;

  oxpecker_set_token(token: string): void;

  oxpecker_set_base_attributes(attrs: Record<string, unknown>): void;
}

export interface DataTrackerApi extends Api {
  // login():void;
  //
  // logout():void;

  /**
   * 事件打点
   * @param eventId 事件id
   * @param attributes 属性
   * eg: track("pcContact_click_button_contactsDetailPage",{"buttonName":"发邮件"}) //联系人详情页-点击联系人详情中的按钮
   * @param noPopup 不继续调用下层tracker
   */

  track(eventId: string, attributes?: resultObject & Partial<{ enableTrackInBg: boolean; _account: string; recordSubAccount: boolean }>, noPopup?: boolean): void;

  initLimit(eventId: string, limitNum: number, syncNum?: number): void;

  registerAttributes(properties: DataTrackerProperties): void;

  unregisterAttributes(prop: DataTrackerProp): void;

  clearAttributes(): void;

  getAttributes(): Promise<DataTrackerProperties>;

  flush(): void;

  setNoLoggerUntil(noLoggerUntil: number): void;

  setToken(token: string): void;
}

export interface LoggerApi extends Api {
  track(eventId: string, attributes?: resultObject, priority?: 'high' | 'normal' | 'low'): void;

  flush(priority?: 'high' | 'normal' | 'low'): void;

  getLogger(period?: number, endTimestamp?: number): Promise<Record<string, resultObject[] | undefined>>;

  getWebLogs(): Promise<Map<string, Blob>>;

  uploadNosMediaOrLog(file: File, fileName: string, type?: string): Promise<string>;
}
