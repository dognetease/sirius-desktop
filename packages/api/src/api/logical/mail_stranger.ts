import { Api } from '../_base/api';
import { CommonRes } from './mail_praise';

export interface StrangerModel {
  accountName: string;
  contactName: string;
  updateTime?: number | undefined | null;
  mailIds?: string[];
  priority?: EmailListPriority;
}

// 高0，中1，低2
export type EmailListPriority = 0 | 1 | 2 | -1;

// 兜底用优先级
export const DefPriority = -1;

// 调优提示映射
export const PriorityIntroMap = {
  0: '高优',
  1: '普通',
  2: '低优',
};

// 0全部，1陌生，2企业联系人
export type PriorityType = 0 | 1 | 2;

export type PrioritiyAccount = {
  email: string;
  priority: EmailListPriority;
  /**
   * qiyeaccountid，这个参数是在priorityType=2生效，陌生和全部，这个参数为null
   */
  accountId?: string;
};

export interface RequestSmartGetPrioritiesParams {
  priorityType?: PriorityType;
  email?: string;
}
export interface ResponseSmartGetPriorities extends Partial<Omit<PrioritiyAccount, 'accountId'>> {
  priorities?: Array<PrioritiyAccount>;
}

export interface RequestSetSmartPriorities {
  // 支持直接传 "Name"<Email> 格式
  email: string | string[];
  // 或者纯email + name数组 拼接成上述格式
  name?: string | string[];
  priority: EmailListPriority;
  // 埋点用
  prevPriority?: EmailListPriority;
}

export interface ResponseSetSmartPriorities {
  contactIdList: number[] | null;
  contacts?: any[];
}

export interface MailStrangerApi extends Api {
  getSmartGetPriorities(params: RequestSmartGetPrioritiesParams): Promise<CommonRes<ResponseSmartGetPriorities>>;

  setSmartPriorities(req: RequestSetSmartPriorities): Promise<CommonRes<ResponseSetSmartPriorities>>;
}
