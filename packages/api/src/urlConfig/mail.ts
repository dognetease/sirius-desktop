import { config } from 'env_def';
import { WebMailHostPlaceHolder } from '@/const';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailUrl {
  /**
   * 邮件相关
   */
  mailOperation: string = (WebMailHostPlaceHolder + config('mailOperation')) as string;

  mailProxyOperation: string = (WebMailHostPlaceHolder + config('mailProxyOperation')) as string;

  mailDownloadProxy: string = (WebMailHostPlaceHolder + config('mailDownloadProxy')) as string;

  mailDownload: string = (WebMailHostPlaceHolder + config('mailDownload')) as string;

  mailPreview: string = (host + config('mailPreview')) as string;

  filePreview: string = (host + config('filePreview')) as string;

  mailTraceStatus: string = (WebMailHostPlaceHolder + config('mailTraceStatus')) as string;

  mailsReadStatus: string = (WebMailHostPlaceHolder + config('mailsReadStatus')) as string;

  mailReadList: string = (WebMailHostPlaceHolder + config('mailReadList')) as string;

  // mailPreview: string = host + config("mailPreview") as string;
  writeLetterPopup: string = config('writeLetterPopup') as string;

  entSignatureForMail: string = (WebMailHostPlaceHolder + config('entSignatureForMail')) as string;

  getRiskReminderStatus: string = (WebMailHostPlaceHolder + config('getRiskReminderStatus')) as string;

  updateRiskReminderStatus: string = (WebMailHostPlaceHolder + config('updateRiskReminderStatus')) as string;

  getMaillistMember: string = (WebMailHostPlaceHolder + config('getMaillistMember')) as string;

  createMaillist: string = (WebMailHostPlaceHolder + config('createMaillist')) as string;

  updateMaillist: string = (WebMailHostPlaceHolder + config('updateMaillist')) as string;

  deleteMaillist: string = (WebMailHostPlaceHolder + config('deleteMaillist')) as string;

  listUserDomain: string = (WebMailHostPlaceHolder + config('listUserDomain')) as string;

  listUserMaillist: string = (WebMailHostPlaceHolder + config('listUserMaillist')) as string;

  getMaillist: string = (WebMailHostPlaceHolder + config('getMaillist')) as string;

  getMaillistConfig: string = (WebMailHostPlaceHolder + config('getMaillistConfig')) as string;

  checkMaillistAccountName: string = (WebMailHostPlaceHolder + config('checkMaillistAccountName')) as string;

  getThumbUpInfo: string = (host + config('getThumbUpInfo')) as string;

  setThumbUpCreate: string = (host + config('setThumbUpCreate')) as string;

  getMailGPTQuote: string = (host + config('getMailGPTQuote')) as string;

  getMailGPTConfig: string = (host + config('getMailGPTConfig')) as string;

  getMailGPTHistory: string = (host + config('getMailGPTHistory')) as string;

  getMailGPTWrite: string = (host + config('getMailGPTWrite')) as string;

  getMailGPTPolish: string = (host + config('getMailGPTPolish')) as string;

  getMailConfig: string = (host + config('getMailConfig')) as string;

  setMailConfig: string = (host + config('setMailConfig')) as string;

  getDefaultCCBCC: string = (host + config('getDefaultCCBCC')) as string;

  setDefaultCCBCC: string = (host + config('setDefaultCCBCC')) as string;

  triggerReceive: string = (host + config('triggerReceive')) as string;

  getTranslateContentByText: string = (host + config('getTranslateContentByText')) as string;

  getTranslateContentByHtml: string = (host + config('getTranslateContentByHtml')) as string;

  detectMailContentLang: string = (host + config('detectMailContentLang')) as string;

  getEnglishGrammar: string = (host + config('getEnglishGrammar')) as string;

  readPack: string = (WebMailHostPlaceHolder + config('readPack')) as string;

  readPackProxy: string = (WebMailHostPlaceHolder + config('readPackProxy')) as string;

  getFjFile: string = (WebMailHostPlaceHolder + config('getFjFile')) as string;

  genMailOnlineJumpURL: string = (host + config('genMailOnlineJumpURL')) as string;

  getRelatedMail: string = (host + config('getRelatedMail')) as string;

  mailAttachmentUploadHost: string = config('mailAttachmentUploadHost') as string;

  /**
   * 设置发信人名称
   */
  setSenderName: string = (host + config('setSenderName')) as string;

  /**
   * 设置默认发信人
   */
  setDefaultSender: string = (host + config('setDefaultSender')) as string;

  getMailSenderInfo: string = (host + config('getMailSenderInfo')) as string;

  getAuthCodeDesc: string = (host + config('getAuthCodeDesc')) as string;

  guessUserSetting: string = (host + config('guessUserSetting')) as string;

  updateDisplayEmail: string = (host + config('updateDisplayEmail')) as string;

  getDisplayName: string = (host + config('getDisplayName')) as string;
}
export type MailUrlKeys = keyof MailUrl;
const urlConfig = new MailUrl();
const urlsMap = new Map<MailUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailUrlKeys, urlConfig[item as MailUrlKeys]);
});
export default urlsMap;
