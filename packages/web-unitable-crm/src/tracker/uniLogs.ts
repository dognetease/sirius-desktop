import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export enum UniContactType {
  sendEmail = 'send-email',
  oneKeyMarketing = 'one-key-marketing',
}
export type actionType =
  | 'send-email'
  | 'one-key-marketing'
  | 'customsDetail'
  | 'readEmailDetail'
  | 'replyEmail'
  | 'transEmail'
  | 'createAuthorization'
  | 'showAuthInfo'
  | 'showAppendix'
  | 'previewImage';
export type pageType = 'uni-talbe-crm' | 'uniCustoms' | 'uniEmails';

export const uniToEdmTrackEvent = (page: pageType, action: actionType, payload: any) => {
  trackerApi.track('pc_waimao_uni_contact', {
    pageType: page,
    action,
    payload,
  });
};
