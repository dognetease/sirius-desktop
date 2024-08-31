import { SiriusEmailBridgeApi } from '@lxunit/bridge-types';
import { apiHolder, apis, conf, MailApi, MailConfApi } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;

export const siriusEmailBridgeImpl: SiriusEmailBridgeApi = {
  sendEmail(contact: string[]) {
    try {
      if (contact && contact.length) {
        if (apiHolder.env.forElectron) {
          mailApi.doWriteMailToContact(contact);
        } else if (systemApi.isMainPage()) {
          mailApi.doWriteMailToContact(contact);
        } else {
          const host = conf('host');
          systemApi.openNewWindow(host + '/#?writeMailToContact=' + contact[0], false);
        }
      }
    } catch (error) {
      console.error('siriusEmailBridgeImpl sendMail:', error);
    }
  },
  doOpenEdmRelatedPage(params) {
    return mailConfApi.doOpenEdmRelatedPage(params);
  },
};
