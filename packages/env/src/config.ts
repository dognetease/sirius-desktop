import { config } from './gen/env';

const rsaFunc = config('', 'encryptRSA') as Function;
// const func = rsaFunc;
/**
 * 重要数据的不对称加密算法
 * @param m
 * @param e
 * @param rand
 * @param con
 */
export const rsaEncrypt = (m: string, e: string, rand: string, con: string) => rsaFunc(m, e, rand, con);

export const envStage = config('stage');

const noLoginPath: string[] = [];
noLoginPath.push('/about');
noLoginPath.push('/login');
noLoginPath.push('/share_anonymous');
noLoginPath.push('/password_reset');
noLoginPath.push('/compDoc');
noLoginPath.push('/change-pwd');
noLoginPath.push('/jump');
// const imApi=apiHolder.api.requireLogicalApi(apis.imApiImpl);
export const ignoreLoginPath: string[] = noLoginPath;

export const reLoginCodeList = {
  FA_SECURITY: 1,
  FA_INVALID_SESSION: 1,
  FA_UNAUTHORIZED: 1,
  NS_411: 1,
  NF_401: 1,
  NF_403: 1,
  'ERR.SESSIONNULL': 1,
  EXP_AUTH_COOKIE_TIMEOUT: 1,
};
export type WinType =
  | 'main'
  | 'writeMail'
  | 'login'
  | 'feedback'
  | 'about'
  | 'capture'
  | 'update'
  | 'customer'
  | 'imgPreviewPage'
  | 'attachment_preview'
  | 'readMailComb'
  | 'strangerMails'
  | 'readMail'
  | 'doc'
  | 'share'
  | 'sheet'
  | 'unitable'
  | 'scheduleOpPage'
  | 'resources'
  | 'mail'
  | 'im'
  | 'disk'
  | 'contact'
  | 'schedule'
  | 'kf'
  | 'bkInit'
  | 'bkLogin'
  | 'bkStable'
  | 'readMailReadOnly'
  | 'readOnlyUniversal'
  | 'addAccount'
  | 'changePwd'
  | 'cluePreview'
  | 'openSeaPreview'
  | 'customerPreview'
  | 'opportunityPreview'
  | 'iframePreview'
  | 'subAccountBg'
  | 'marketingDataViewer'
  | 'personalWhatsapp'
  | 'writeMailAttachmentPage'
  // | 'notificationPage'
  | 'scheduleReminder'
  | 'downloadReminder'
  | 'advertisingReminder';
