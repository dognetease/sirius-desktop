import { apis, apiHolder, inWindow, WebMailApi, MultAccountsLoginWay, AccountTypes, DataTrackerApi } from 'api';
import { config } from 'env_def';

const SHOW_OLD = 'show_old';
const storeApi = apiHolder.api.getDataStoreApi();
const webmailApi = apiHolder.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const trackMap = {
  NeteaseQiYeMail: 'qiye',
  QQMail: 'qq',
  '163Mail': '163',
  Others: 'other',
};

// webmail 活动标记
const ACTIVITY_STAT = 'activity_stat';
const getStore = (key: string) => {
  const result = storeApi.getSync(key);
  if (result.suc && result.data != null) {
    return result.data;
  }
  return null;
};

// 获取show_old值
export const getShowOld = (): string => {
  const result = storeApi.getSync(SHOW_OLD);
  if (result.suc && result.data != null) {
    return result.data;
  }
  return '2';
};

export const joinWebmailActivity = (tid: string) => {
  // todo 是否报名了活动
  const isWebmail = inWindow() && config('profile') ? config('profile').toString().includes('webmail') : false;
  const id = getStore(ACTIVITY_STAT) || '';
  if (isWebmail && id !== '') {
    webmailApi.doInvokeActivity(tid, +id);
  }
};

export const getEmailSuffix = (email: string) => {
  if (email === null || email === '') {
    return [];
  }
  var result = [email.substring(0, email.indexOf('@')), email.substring(email.indexOf('@') + 1, email.length)];
  return result;
};

export const sendAddAccountTrack = (way: MultAccountsLoginWay, accountType: AccountTypes, result: 'success' | 'fail', failReason?: string) => {
  trackApi.track('pcMail_click_LoginDetailPage_agent', {
    way,
    type: trackMap[accountType],
    bindResult: result,
    failReason: result === 'fail' ? failReason || '' : null,
  });
};
