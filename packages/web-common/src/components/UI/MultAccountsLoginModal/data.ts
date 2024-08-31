import { AccountApi, AccountTypes, MailApi, SubAccountServerModel, api, apis, getIn18Text } from 'api';
export type TCodeType = 'TencentQiye' | '163Mail' | '126Mail' | 'QQMail' | 'Gmail';
export type TAuthCodeMap = Record<TCodeType, string>;
const codeMap: TAuthCodeMap = {
  QQMail: 'https://service.mail.qq.com/detail/0/75',
  '163Mail': 'https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac2a5feb28b66796d3b',
  '126Mail': 'https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac2a5feb28b66796d3b',
  TencentQiye: 'https://open.work.weixin.qq.com/help2/pc/19886?person_id=1',
  Gmail: 'https://support.google.com/accounts/answer/185833?visit_id=637011925839380259-3739600675&rd=1#ts=3141880',
};

const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.getSystemApi();

export const getAuthCodeMap = async (): Promise<TAuthCodeMap> => {
  const newAuthMap = { ...codeMap };
  try {
    const res = await mailApi.getAuthCodeDesc();
    if (res?.length) {
      res.forEach(desc => {
        switch (desc.desc) {
          case '163':
            newAuthMap['163Mail'] = desc.url;
            break;
          case '126':
            newAuthMap['126Mail'] = desc.url;
            break;
          case 'qq':
            newAuthMap['QQMail'] = desc.url;
            break;
          case 'qq_qiye':
            newAuthMap['TencentQiye'] = desc.url;
            break;
          case 'gmail':
            newAuthMap['Gmail'] = desc.url;
            break;
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
  return newAuthMap;
};

export const getBindEmailMessage = async (email: string) => {
  if (!email) {
    return '';
  }
  const currentUser = systemApi.getCurrentUser();
  if (currentUser && (email === currentUser.id || (currentUser.loginAccount && currentUser.loginAccount === email))) {
    return getIn18Text('BIND_SELF_NOALLOW');
  }
  const emailItem = await getBindAccountInfo(email);
  if (emailItem) {
    if (emailItem.expired) {
      return getIn18Text('BIND_SUBACCOUNT_EXPIRED');
    }
    return getIn18Text('BIND_SUBACCOUNT_ALREADY');
  }
  return '';
};

export const getBindAccountInfo = async (email: string): Promise<SubAccountServerModel | null> => {
  if (!email) {
    return null;
  }
  try {
    const allSubAccounts = await accountApi.getAllSubAccounts();
    const emailItem = allSubAccounts.find(item => item.agentEmail === email);
    return emailItem || null;
  } catch (error) {
    console.error('getBindAccountInfo error', error);
    return null;
  }
};

export const getAccountType = (type: string): AccountTypes => {
  if (type === 'GmailPerson') {
    return 'Gmail';
  }
  return type as AccountTypes;
};
