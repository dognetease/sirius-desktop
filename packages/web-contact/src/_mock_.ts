import { AccountApi, api, apis, ContactAndOrgApi, ContactItem, ContactModel } from 'api';
import { ContactFormField } from './component/ContactForm/ContactForm';
import { contact4ui, contactFormToParams } from './util';
import { SearchGroupKey } from '@web-common/utils/contact_util';
import { transContactSearch2ContactItem, transContactModel2ContactItem } from '@web-common/components/util/contact';
import { SearchResModel } from 'data';

export const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
export const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

export const fileApi = api.getFileApi();

export const eventApi = api.getEventApi();
export const systemApi = api.getSystemApi();
const tag = '[contact.tsx]';
export const syncAll = async (force?: boolean) => {
  const orgData = await contactApi.syncAllAccount(force);
  return orgData;
};

export const getOrgs = async (params: any = {}) => {
  const orgData = await contactApi.doGetContactOrg(params);
  return orgData;
};

export const getPersonalOrgList = async (_account: string) => {
  console.log(tag, 'getPersonalOrgList params', _account);
  const { success, data } = await contactApi.doGetPersonalOrg({ _account });
  console.log(tag, 'getPersonalOrgList params result', _account, data);
  if (success && data) {
    return data;
  } else {
    return [];
  }
};

export const getContact = async ({ orgId = '', _account = '' }: any) => {
  console.log(tag, 'getContact params', _account);
  const list = await contactApi.doGetContactByOrgId({ orgId, _account });
  console.log(tag, 'getContact params result', _account, list);
  const itemList: ContactItem[] = [];
  list.forEach(item => {
    itemList.push(transContactModel2ContactItem(item));
  });
  return itemList;
};

export const getPersonContact = async (_account?: string) => {
  console.log(tag, 'getPersonContact params', _account);
  const data = await contactApi.doGetPersonalContact({ _account });
  console.warn(tag, 'getPersonContact result', data);
  return contact4ui(data, !0);
};

const FetchLock = {
  accounts: new Map(),
  setFetchId(_account: string) {
    let count = FetchLock.accounts.get(_account) || 0;
    FetchLock.accounts.set(_account, ++count);
    return count;
  },
  getFetchId(_account: string) {
    return FetchLock.accounts.get(_account) || 0;
  },
};

// const fetchLockFunc = (fn: (...args:any[]) => Promise<any>): (...args:any[]) => Promise<any> => {
//   let fetchId = 0;
//   return async (...params: any[]) =>{
//     const currentId = fetchId + 1;
//     fetchId++;
//     const res = await fn(...params);
//     if(currentId !== fetchId){
//       return undefined
//     }
//     return res;
//   }
// }

export const getSearchContact = async (searchValue: string, _account: string) => {
  if (!searchValue) {
    return null;
  }
  const t1 = Date.now();
  const counter = FetchLock.setFetchId(_account);
  const data = await contactApi.doSearch({ query: searchValue, _account });
  if (FetchLock.getFetchId(_account) !== counter) {
    return null;
  }
  const searchRes = contact4ui(data.main[_account].contactList);
  console.log(`Search ${searchValue} in ${Date.now() - t1}ms`, searchRes);
  return {
    [SearchGroupKey.ALL]: searchRes,
    [SearchGroupKey.CORP]: searchRes.filter(e => e.contact.type === 'enterprise'),
    [SearchGroupKey.PERSON]: searchRes.filter(e => e.contact.type === 'personal'),
    [SearchGroupKey.TEAM]: [],
  };
};

const getAccountMap = async (): Promise<Record<string, string>> => {
  try {
    const list = await accountApi.getMainAndSubAccounts();
    if (list?.length > 1) {
      return list.reduce((res, cur) => {
        if (cur.id && cur.agentEmail) {
          res[cur.id] = cur.agentEmail;
        }
        return res;
      }, {});
    }
  } catch (err) {
    console.error('[contact tree] getMainAndSubAccounts error', err);
  }
  return {};
};

export const getSearchContactAddressBook = async (searchValue: string) => {
  if (!searchValue) {
    return null;
  }
  const t1 = Date.now();
  const counter = FetchLock.setFetchId('all');
  const data = await contactApi.doSearchNew({
    query: searchValue,
    showDisable: false,
    useEdmData: false,
    exclude: ['orgName', 'orgPYName'],
  });
  if (FetchLock.getFetchId('all') !== counter) {
    return null;
  }
  const aliasMap = await getAccountMap();
  const lxData = data.main;
  // const mainAccountData = data.main[systemApi.getCurrentUser()?.id!];
  // lxData.mockAccount = {...mainAccountData};
  const res: SearchResModel = {};
  Object.keys(lxData).forEach(accountName => {
    const item = lxData[accountName];
    if (item?.contactList?.length) {
      const enterpriseList: ContactItem[] = [];
      const personalList: ContactItem[] = [];
      const allList: ContactItem[] = [];
      item.contactList.forEach(item => {
        const contactItem = transContactSearch2ContactItem(item);
        allList.push(contactItem);
        if (contactItem.type === 'enterprise') {
          enterpriseList.push(contactItem);
        }
        if (contactItem.type === 'personal') {
          personalList.push(contactItem);
        }
      });
      const account = aliasMap[accountName] || accountName;
      res[account] = {
        [SearchGroupKey.ALL]: allList,
        [SearchGroupKey.CORP]: enterpriseList,
        [SearchGroupKey.PERSON]: personalList,
        [SearchGroupKey.TEAM]: [],
      };
    }
  });
  console.log(`AddressBook Search ${searchValue} in ${Date.now() - t1}ms`, res);
  return res;
};

/**
 * 删除联系人
 * @param contact 联系人
 * @returns
 */
export const delContact = async (contact: ContactModel) => {
  const success = await contactApi.doDeleteContact({
    accountIdList: [contact.contact.id],
  });
  return success;
};

/**
 * @deprecated: 貌似是无人引用的
 * 修改联系人
 * @param contact 要修改的联系人
 * @param values 要修改的字段表单
 */
export const editContact = async (contact: ContactModel, values: ContactFormField) => {
  await contactApi.doUpdateContact({
    accountId: contact.contact.id,
    ...contactFormToParams(values),
  });
  const res = await getPersonContact();
  return res;
};

/**
 * 新建联系人
 * @param values 新建联系人表单
 */
export const createContact = async (values: ContactFormField) => {
  const res = await contactApi.doInsertContact({
    list: contactFormToParams(values),
  });
  const list = await getPersonContact();

  return {
    list,
    contact: res.data && (res.data[0] as ContactModel),
  };
};
