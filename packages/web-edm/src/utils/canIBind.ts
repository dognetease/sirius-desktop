import { apiHolder, apis, AccountApi, EdmSendBoxApi } from 'api';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
// 输入一个账号是否可以绑定
export const canIBind = async (email: string) => {
  if (!email) {
    return false;
  }
  const subAccounts = await accountApi.getAllSubAccounts();
  const result = subAccounts.some(account => account.agentEmail === email);

  if (result) {
    return false;
  }

  const senders = await edmApi.getSendBoxSenderList();

  return !senders.senderList.some(sender => sender.email === email);
};
