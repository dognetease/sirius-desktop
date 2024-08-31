import { Api, NotificationType, User } from '../_base/api';

export type NotificationActionType =
  | 'im_clear'
  | 'mail_clear'
  | 'new_mail'
  | 'new_mail_num'
  | 'new_im_msg'
  | 'new_im_noti'
  | 'new_im_gp_msg'
  | 'new_im_msg_num'
  | 'new_im_msg_inc'
  | 'whatsApp'
  | 'facebook';
export type NotiAction = {
  action: NotificationActionType;
  num: number;
  title: string;
  content: string;
  data?: string;
  mailId?: string;
  accountId?: string;
};

export interface IPushConfigSetRequest {
  isIMEnable?: boolean;
  disableFolders?: Array<number>;
  isMailEnable?: boolean;
}

export interface IPushConfigSetRes {
  success: boolean;
  errorMsg?: string;
}

export interface IPushConfigGetRes {
  success: boolean;
  errorMsg?: string;
  data?: IPushConfigSetRequest;
}

export type IPushConfigCleanRes = IPushConfigGetRes;

export interface PushHandleApi extends Api {
  /**
   * 实际推送通知逻辑
   */
  triggerNotificationInfoChange(content: NotiAction, _account?: string): void;

  getNotificationCount(): NotificationNum;

  registerPush(user: User): void;

  setCurrentConfig(config: IPushConfigSetRequest, _account?: string): Promise<IPushConfigSetRes>;

  getCurrentPushConfig(type: number, _account?: string): Promise<IPushConfigGetRes>;

  cleanPushConfig(_account?: string): Promise<IPushConfigCleanRes>;
}

export type NotificationNum = Record<NotificationType, number>;
