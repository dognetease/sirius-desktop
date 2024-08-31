import { api, apiHolder, apis, ContactAndOrgApi, MailApi, MailPlusCustomerApi } from 'api';
import { debounceMailListRequest } from '@web-mail/utils/debounceRequest';

/**
 * 包装邮件请求
 * 被同一个包装器包装过得请求，前一个请求padding状态，后续请求发起会取消前一个请求
 */
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailPlusCustomerApi = apiHolder.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const debounceRequestGroupWarp = debounceMailListRequest();

const doListMailBoxEntities = debounceRequestGroupWarp(mailApi.doListMailBoxEntities.bind(mailApi), 'doListMailBoxEntities') as typeof mailApi.doListMailBoxEntities;

const doListMailBoxEntitiesFromDB = debounceRequestGroupWarp(
  mailApi.doListMailEntitiesFromDb.bind(mailApi),
  'doListMailEntitiesFromDb'
) as typeof mailApi.doListMailEntitiesFromDb;

// const doSearchCustomers = debounceRequestGroupWarp(mailApi.doSearchCustomers.bind(mailApi), 'doSearchCustomers') as typeof mailApi.doSearchCustomers;
// 调用mailPlusCustomerApi方法，分页搜索客户
const doSearchCustomerPage = debounceRequestGroupWarp(
  mailPlusCustomerApi.doSearchCustomerPage.bind(mailPlusCustomerApi),
  'doSearchCustomerPage'
) as typeof mailPlusCustomerApi.doSearchCustomerPage;

// const doListCustomersFromDb = mailApi.doListCustomersFromDb.bind(mailApi);

// const doListCustomerManagersById = mailApi.doListCustomerManagersById.bind(mailApi);

// const doListCustomerContactsById = mailApi.doListCustomerContactsById.bind(mailApi);

// const doListCustomers = mailApi.doListCustomers.bind(mailApi);

const doCustomersUnread = mailApi.doCustomersUnread.bind(mailApi);

// const syncCustomer = contactApi.syncCustomer.bind(contactApi);

const syncContactColleague = contactApi.syncContactColleague.bind(contactApi);

const doGetColleagueList = contactApi.doGetColleagueList.bind(contactApi);

export const request = {
  doListMailBoxEntities,
  doListMailBoxEntitiesFromDB,
  // doSearchCustomers,
  doSearchCustomerPage,
  // doListCustomersFromDb,
  // doListCustomers,
  doCustomersUnread,
  // syncCustomer,
  syncContactColleague,
  doGetColleagueList,
  // doListCustomerManagersById,
  // doListCustomerContactsById,
};
