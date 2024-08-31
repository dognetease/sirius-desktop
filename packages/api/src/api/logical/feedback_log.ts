import { Api } from '../_base/api';
import { ResponseData } from '../data/http';

interface file {
  // log、picture、video
  type: string;
  // 文件名
  name: string;
  // 文件的创建时间，默认服务端当前时间
  fileCreateTime?: number;
  // 文件大小
  size: number;
}

export interface TokenOption {
  fileName: string; // 文件名
}

export interface FeedbackOption {
  // 产品，sirius、ynote、sirius、cospread、mail，默认sirius
  productId?: string;
  // 日志上报时日志配置接口返回的id
  recallId?: string;
  // 设备Id、web平台可以为空
  deviceId?: string;
  // 平台, web, win, mac, ios, android
  platform: string;
  // 版本号
  version: string;
  // 系统版本号
  systemVersion: string;
  // 邮箱
  email: string;
  // 功能模块
  module?: string;
  // 问题描述
  description?: string;

  system?: string;
  browser?: string;
  browserVersion?: string;
  ua?: string;
  orgId?: string;
  orgName?: string;
  feedbackType?: string;

  // 附加列表，可以是日志、图片、视频
  files?: file[];
}

export interface LogConfigOption {
  // 产品，sirius、ynote、sirius、cospread、mail，默认sirius
  productId?: string;
  // 平台, web, win, mac, ios, android
  platform: string;
}

export interface FeedbackApi extends Api {
  /**
   * 获取nos上传凭证
   * @param option
   */
  getNosToken(option: TokenOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 提交
   * @param option
   */
  submitFeedback(option: FeedbackOption, blockedError?: boolean): Promise<ResponseData>;
}
