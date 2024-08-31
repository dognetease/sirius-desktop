import { Api } from '../_base/api';
import { ResponseData } from '../data/http';

export interface CreateDiscussOption {
  owner: string;
  members: string[];
  name: string;
  emailTid: string;
  emailMid: string;
}

export interface DiscussMailOption {
  teamId: string;
}

export interface DiscussMailDetailOption {
  teamId: string;
  msgId: string;
}

export interface MailDiscussOption {
  yxAccId: string;
  emailTid: string;
  emailMid: string;
}

export interface DiscussBindOption {
  msgId: string;
  teamId: string;
}

export interface MailAttachOption {
  teamId: string;
  msgId: string;
  part: string;
}

export interface ShareMailOption {
  from: string;
  tos: string[];
  teamIds: string[];
  emailTid: string;
  emailMid: string;
}

// 餐卡：http://doc.hz.netease.com/pages/viewpage.action?pageId=331166261
export interface MailItemRes {
  msgId: string;
  subject: string;
  from: string;
  to: string;
  summary: string;
  sentDate: number;
  receivedDate: string;
  createTime: number;
  email: string;
  emailMid: string;
  emailTid: string;
  attachments: {
    filename: string;
    contentId: string;
    estimateSize: number;
    contentLength: number;
    isMsg: boolean;
    id: string;
    contentLocation: null;
    encoding: string;
    contentType: string;
    inlined: boolean;
    content: null;
  }[];
}

export interface MailListRes {
  total: number;
  msgs: Array<MailItemRes>;
}

export interface IMDiscussApi extends Api {
  /**
   * 创建邮件讨论组
   * @param option
   */
  createDiscuss(option: CreateDiscussOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 获取讨论组邮件
   * @param option
   */
  getDiscussMail(option: DiscussMailOption, blockedError?: boolean): Promise<ResponseData<MailListRes>>;

  /**
   * 邮件消息详情
   * @param option
   */
  getDiscussMailDetail(option: DiscussMailDetailOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 邮件所属讨论组列表
   * @param option
   */
  getMailDiscuss(option: MailDiscussOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 解除邮件和讨论组绑定
   * @param option
   */
  cancelDiscussBind(option: DiscussBindOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 讨论组邮件详情下载附件
   * @param option
   */
  discussMailAttach(option: MailAttachOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 邮件分享
   * @param option
   */
  shareMail(option: ShareMailOption, blockedError?: boolean): Promise<ResponseData>;
}
