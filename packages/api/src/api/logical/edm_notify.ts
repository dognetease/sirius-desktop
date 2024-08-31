import { Api } from '../_base/api';

/**
  EDM("邮件营销额度不足"),
  EDM_SEND_HHB("邮件营销单日超额发送（护航包）"),
  EDM_SEND_QJB("邮件营销单日超额发送（旗舰版）"),
  SEARCH_PERSON_WA("全球搜-个人WA群发"),
  SEARCH_BIZ_WA("全球搜-商业WA群发")
 */
export type QuotaNotifyModuleType = 'EDM' | 'EDM_SEND_HHB' | 'EDM_SEND_QJB' | 'SEARCH_PERSON_WA' | 'SEARCH_BIZ_WA';
export interface EdmNotifyApi extends Api {
  getNotifyConfig(): Promise<resNotifyConfig>;
  updateNotifyConfig(req: reqNotify): Promise<boolean>;
  getQuotaNotify(moduleType: 'EDM'): Promise<QuotaNotifyRes>;
  getQuotaNotifyModal(moduleType: QuotaNotifyModuleType, triggerLoc?: 'click' | 'createTask'): Promise<QuotaNotifyModalRes>;
}

export interface resNotifyConfig {
  moduleConfigList: moduleConfigListItem[];
}

export interface moduleConfigListItem {
  module: string;
  moduleName: string;
  imEditable: boolean;
  emailEditable: boolean;
  notifyConfigs: notifyItem[];
}

export interface notifyItem {
  content: string;
  email: boolean;
  im: boolean;
  scene: string;
  title: string;
  enable: boolean;
}

export interface reqNotify {
  items: {
    email: boolean;
    im: boolean;
    scene: string;
  }[];
}

export interface QuotaNotifyRes {
  // 提示类型，0-不提示，1-剩余为0，2-不足10%
  tipsType: 0 | 1 | 2;
  // 是否管理员
  admin: boolean;
  // 提示内容中占位参数，map接口，key为参数名，和占位标签名称对应，value为参数值
  params: {
    number: string;
    link: string;
  };
  // 提示内容
  tipsContent: string;
}

export interface QuotaNotifyModalRes {
  bubbleStyle: string;
  bubbleText: string;
  middleText: string;
  qrCode: string;
  subtitle: string;
  telephone: string;
  title: string;
  workingHours: string;
}
