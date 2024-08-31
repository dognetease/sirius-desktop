import { Api } from '../_base/api';

interface openOptions {
  templateId: number;
}
export interface configOptions {
  // 唯一标识
  uid?: string; // 可选，用户在企业产品中的标识，便于后续客服系统中查看该用户在产品中的相关信息，不传表示匿名用户 。若要指定用户信息，不显示默认的（guestxxx用户姓名），就必须传uid（如果需要上报data信息，必须先上传uid）
  name?: string; // 可选，用户在企业产品中的名称，便于后续客服系统中查看该用户在产品中的相关信息
  email?: string; // 可选，用户在企业产品中的邮箱，便于后续客服系统中查看该用户在产品中的相关信息
  mobile?: string; // 可选，用户在企业产品中的手机，便于后续客服系统中查看该用户在产品中的相关信息
  level?: number; // vip级别 [1-10]
  title?: string; // 自定义访客咨询来源页的标题，不配置sdk会自动抓取，和referrer一起使用
  referrer?: string; // 自定义访客咨询来源页的url，不配置sdk会自动抓取，和title一起使用
  groupid?: string; // 指定客服组id
  shuntId?: string; // 访客选择多入口分流模版id
  robotShuntSwitch?: number; // 机器人优先开关
  robotId?: number; // 机器人id
  qtype?: number; // 企业常见问题模板id
  welcomeTemplateId?: number; // 企业欢迎语模板id
  data?: string; // 企业当前登录用户其他信息，JSON字符串，其中 avatar 字段用于设置访客头像
  success?: () => void;
  error?: (e: any) => void;
}
export interface Kf {
  (method: 'onready', callback: () => void): void;
  (method: 'config', options?: configOptions): void;
  (method: 'url', options?: openOptions): string;
  (method: 'open', options?: openOptions): void;
  (method: 'logoff'): void;
}

export interface KfApi extends Api {
  name: string;
  setKfConfig: () => void;
  getUrl: () => Promise<string>;
  openUrl: () => void;
}
