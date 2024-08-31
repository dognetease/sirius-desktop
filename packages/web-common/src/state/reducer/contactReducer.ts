import {
  api,
  apis,
  ContactAndOrgApi,
  ContactId,
  ContactModel,
  EMAIL,
  EntityOrg,
  MailListConfig,
  MemberType,
  OrgId,
  CustomerId,
  ICustomerModel,
  CustomerContactId,
  ACCOUNT_EMAIL,
  ExternalContactId,
  CustomerOrgModel,
  MailPlusCustomerApi,
  CustomerMapChangeEvent,
  util,
  _ACCOUNT,
  EmailRoles,
} from 'api';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { MailActions } from './index';

import { buildContactModel, transEmailRoleBase2ContactModel, transServerCustomerModel } from '@web-common/utils/contact_util';
import { createAccountEmailKey, getMainAccount, parseAccountEmailKey } from '@web-common/components/util/contact';
import { ContactOrgItem } from '@web-common/components/util/contact';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import lodashKeyBy from 'lodash/keyBy';
import lodashOmit from 'lodash/omit';
import lodashOmitBy from 'lodash/omitBy';

import store, { RootState } from '@web-common/state/createStore';

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
const eventApi = api.getEventApi();

/**
 * zoumingliang 2023/6/26
 * 通过更新的联系人详情更新需要变更的emailIdMap
 * 每次更新contactMap,需要确认当前更新的contactModel对应的email 于 emailIdMap的email对应的eamil的id所在的联系人详情数据，哪个优先级别高
 * @param emailIdMap: contactReducer中的emailIdMap数据
 * @param list: 变更的联系人详情列表（灵犀，外贸）
 * @param contactMap: contactReducer中的contactMap数据
 * @param _account: 所属的账号
 * @returns 变更了的emailIdMap值，需要和原始数据做一个merge
 */
// const getUpdateEmailIdMap = (emailIdMap: TEmailIdMap, list: ContactModel[], contactMap: TContactMap, _account?: string) => {
//   const updateData: TEmailIdMap = {};
//   const emailModelMap: Record<ACCOUNT_EMAIL, ContactModel[]> = {};
//   list.forEach(item => {
//     const email = contactApi.doGetModelDisplayEmail(item);
//     let account = _account || item._account;
//     const accountEmailKey = createAccountEmailKey(email, account);
//     let modelList = emailModelMap[accountEmailKey];
//     if (!modelList) {
//       const contactId = emailIdMap[accountEmailKey];
//       const model = lodashGet(contactMap, contactId);
//       modelList = model ? [model] : [];
//     }
//     modelList.push(item);
//     emailModelMap[accountEmailKey] = modelList;
//   });
//   Object.keys(emailModelMap).forEach(accountEmail => {
//     const modelList = emailModelMap[accountEmail] || [];
//     if (modelList.length) {
//       const model = mailPlusCustomerApi.doCompareContactModelRoles(modelList);
//       const contactId = lodashGet(model, 'contact.id');
//       updateData[accountEmail] = contactId;
//     }
//   });
//   return updateData;
// };

const mergeContactData = (prevData: ContactModel, nextData: ContactModel) => {
  if (prevData.customerOrgModel) {
    const nextInfo = nextData.customerOrgModel?.relatedCompanyInfo;
    const prevInfo = prevData.customerOrgModel?.relatedCompanyInfo;
    if (!nextInfo?.length && prevInfo?.length) {
      nextData.customerOrgModel.relatedCompanyInfo = prevInfo;
    }
  } else {
    // const nextFull = nextData.isFull === undefined ? true : nextData.isFull;
    // nextData.isFull = nextFull
    // if(prevData.isFull && !nextData.isFull) {
    //   nextData.isFull = true;
    //   Object.assign(nextData.contact, prevData.contact);
    // }
  }
};

const contactDataAddReduxParams = (list: ContactModel[], isFull: boolean, _account: string) => {
  const reduxUpdateTime = Date.now();
  list.forEach(item => {
    Object.assign(item, { reduxUpdateTime, isFull, _account });
  });
  return list;
};

export interface EmailMarkedParams {
  data: Map<EMAIL, Set<ContactId> | ContactId[]>;
  type: 'add' | 'cancel';
  isAll?: boolean;
}

export interface RequireICustomerContactModel extends ContactModel {
  customerOrgModel: CustomerOrgModel;
}

export interface RefreshUpdateRes {
  updateContactMap?: TContactMap;
  updateEmailIdMap?: TEmailIdMap;
  updateCustomerMap?: TCustomerMap;
}

export interface SetContactReducerStateDataParams extends RefreshUpdateRes {
  deleteCustomerIdList?: CustomerId[];
  deleteContactIdList?: ContactId[];
}

export interface ContactReducerState {
  emailIdMap?: TEmailIdMap;
  customerMap?: TCustomerMap;
  contactMap?: TContactMap;
}

export interface UpdateIdsRes {
  updateEmailIdMap: TEmailIdMap;
  updateCustomerIds: CustomerId[];
  updateContactMap: TContactMap;
  updateLxContactIds: [_ACCOUNT, ContactId[]];
}

export interface RefreshUpdateRoleRes {
  updateCustomerIds: CustomerId[];
  contactPromiseList: Promise<ContactModel[]>[];
  updateEmailIdMap: TEmailIdMap;
  updateContactMap?: TContactMap;
}

export type TEmailIdMap = Record<ACCOUNT_EMAIL, ContactId | CustomerContactId | ExternalContactId>;

export type TCustomerMap = Record<CustomerId, ICustomerModel>;

export type TContactMap = Record<ContactId, ContactModel>;

export type TCustomerRoleMap = Record<CustomerId, EmailRoles>;

interface ReturnGetMyCustomerList {
  idList: string[];
  loadMore: boolean;
}

interface ParamsGetMyCustomerList {
  limit?: number;
  lastId?: string;
  lastMailTime?: number;
}

export interface IContactReducer {
  // 灵犀组织详情集合
  orgMap: Record<OrgId, EntityOrg>;
  // 灵犀联系人详情集合
  contactMap: TContactMap;
  // 主账号邮箱标星集合
  emailMarkedMap: Record<EMAIL, Array<ContactId>>;
  // 个人分组标星集合
  orgMarkedMap: Record<OrgId, boolean>;
  // 账号下的邮箱匹配灵犀联系人id, 外贸联系人id，外部联系人id
  emailIdMap: TEmailIdMap;
  // 外贸客户详情集合
  customerMap: TCustomerMap;
  // 外贸我的客户列表
  myCustomerList: {
    idList: string[];
    loadMore: boolean;
  };
  // emailContactMap: TContactMap;
  contact: { external?: ContactModel; createFlag?: string };
  selector: {
    focused: string;
    add: boolean;
    pendingItem: ContactModel | ContactModel[];
  };
  selectedTags: {
    type: MemberType;
    emails: string[];
  };
  currentEditingMail: {
    type: string;
    current: string;
  };
  canShowContactMultPanel: boolean;
  checkedContacts: ContactOrgItem[];
  mailListConfig: MailListConfig | null;
  contactMapCleanTimes: number;
}

const InitialState: IContactReducer = {
  orgMap: {},
  contactMap: {},
  // emailContactMap: {},
  emailMarkedMap: {},
  orgMarkedMap: {},
  emailIdMap: {},
  customerMap: {},
  contact: {},
  myCustomerList: {
    idList: [],
    loadMore: true,
  },
  selector: {
    focused: '',
    add: false,
    pendingItem: [],
  },
  selectedTags: {
    type: '',
    emails: [],
  },
  /** 当前正在编辑的联系人 */
  currentEditingMail: {
    type: '',
    current: '',
  },
  canShowContactMultPanel: false,
  checkedContacts: [],
  mailListConfig: null,
  contactMapCleanTimes: 0,
};

const contactSlice = createSlice({
  name: 'contactReducer',
  initialState: InitialState,
  reducers: {
    doUpdateMailListConfig: (state, action: PayloadAction<MailListConfig>) => {
      state.mailListConfig = action.payload;
    },
    // 重新设置redux数据
    doResetContactData(state, action: PayloadAction<RefreshUpdateRes>) {
      const { updateContactMap = {}, updateCustomerMap = {}, updateEmailIdMap = {} } = action.payload;
      state.contactMapCleanTimes += 1;
      state.contactMap = updateContactMap;
      state.emailIdMap = updateEmailIdMap;
      state.customerMap = updateCustomerMap;
    },
    // 清空所有的本地数据
    doCleanContactMap(state) {
      state.contactMap = {};
      state.emailIdMap = {};
      state.contactMapCleanTimes += 1;
    },
    // 删除lx联系人数据
    doDeleteContactMap(state, action: PayloadAction<{ idList: ContactId[]; _account?: string }>) {
      const { idList, _account = getMainAccount() } = action.payload;
      if (idList?.length) {
        state.emailIdMap = lodashOmitBy(state.emailIdMap, (id, accountEmail) => {
          const parseRes = parseAccountEmailKey(accountEmail);
          return idList.includes(id) && parseRes?.account === _account;
        });
        state.contactMap = lodashOmit(state.contactMap, idList);
      }
    },
    // 清空所有的客户详情数据
    doCleanCustomerMap(state) {
      state.customerMap = {};
    },
    // 更新email是否星标的映射
    doUpdateEmailMarkedMap: (state, action: PayloadAction<EmailMarkedParams>) => {
      const { data, type, isAll } = action.payload;
      data.forEach((idSet, email) => {
        const idList = [...idSet];
        if (type === 'add') {
          const oldList = state.emailMarkedMap[email];
          if (isAll) {
            if (!isEqual(oldList, idList)) {
              state.emailMarkedMap[email] = idList;
            }
          } else {
            state.emailMarkedMap[email] = [...new Set([...(oldList || []), ...idList])];
          }
        } else if (type === 'cancel') {
          if (isAll) {
            state.emailMarkedMap[email] = [];
          } else {
            const oldList = state.emailMarkedMap[email] || [];
            const data = new Set(oldList);
            idList.forEach(id => {
              data.delete(id);
            });
            state.emailMarkedMap[email] = [...data];
          }
        }
      });
    },
    // 更新个人分组是否星标的映射
    doUpdateOrgMarkedMap: (state, action: PayloadAction<Map<OrgId, boolean>>) => {
      const data = action.payload || new Set();
      data.forEach((item, orgId) => {
        const oldData = state.orgMarkedMap[orgId];
        if (!!item !== !!oldData) {
          state.orgMarkedMap[orgId] = !!item;
        }
      });
    },
    // 修改灵犀/外贸联系人详情
    _doUpdateContactMap: (state, action: PayloadAction<TContactMap>) => {
      const contactMap = action.payload;
      const updateContactMap: TContactMap = {};
      Object.keys(contactMap)?.forEach(id => {
        const nextData = contactMap[id];
        const prevData = state.contactMap[id];
        const isFull = nextData.isFull === undefined ? true : nextData.isFull;
        const _account = nextData._account || getMainAccount();
        const now = Date.now();
        if (!prevData) {
          updateContactMap[id] = { ...nextData, reduxUpdateTime: now, isFull, _account };
        } else {
          const { reduxUpdateTime, ...oldModel } = prevData;
          if (!oldModel || !isEqual(oldModel, nextData)) {
            mergeContactData(prevData, nextData);
            updateContactMap[id] = { ...nextData, reduxUpdateTime: now, isFull, _account };
          }
        }
      });
      if (!isEmpty(updateContactMap)) {
        Object.assign(state.contactMap, updateContactMap);
      }
    },
    // 修改email到联系人id
    _doUpdateEmailIdMap: (state, action: PayloadAction<TEmailIdMap>) => {
      const updateEmailIdData = action.payload;
      if (!isEmpty(updateEmailIdData)) {
        Object.assign(state.emailIdMap, updateEmailIdData);
      }
    },
    // 修改客户详情数据
    doUpdateCustomerMap: (state, action: PayloadAction<TCustomerMap>) => {
      const customerMap = action.payload;
      const updateCustomerMap: TCustomerMap = {};
      Object.keys(customerMap)?.forEach(customerId => {
        const nextData = customerMap[customerId];
        const prevData = state.customerMap[customerId];
        if (!prevData) {
          updateCustomerMap[customerId] = { ...nextData, reduxUpdateTime: Date.now() };
        } else {
          const { reduxUpdateTime, ...oldModel } = prevData;
          if (!oldModel || !isEqual(oldModel, nextData)) {
            updateCustomerMap[customerId] = { ...nextData, reduxUpdateTime: Date.now() };
          }
        }
      });
      if (!isEmpty(updateCustomerMap)) {
        Object.assign(state.customerMap, updateCustomerMap);
      }
    },
    // 修改外贸我的客户列表数据
    doUpdateMyCustomerList: (state, action: PayloadAction<{ loadMore?: boolean; idList: string[]; index?: number }>) => {
      const { idList, loadMore, index } = action.payload;
      let { idList: oldList, loadMore: prevLoadMore } = state.myCustomerList;
      if (loadMore !== undefined && !isEqual(loadMore, prevLoadMore)) {
        state.myCustomerList.loadMore = loadMore;
      }
      if (index !== undefined && idList?.length) {
        const filterList = oldList.filter(id => !idList.includes(id));
        filterList.splice(index, 0, ...idList);
        state.myCustomerList.idList = filterList;
      } else if (!isEqual(oldList, idList)) {
        state.myCustomerList.idList = idList;
      }
    },
    doCleanMyCustomerList: state => {
      state.myCustomerList = {
        idList: [],
        loadMore: true,
      };
    },
    // 更新个人分组详情的映射
    doUpdateOrgMap: (state, action: PayloadAction<EntityOrg[]>) => {
      action.payload.forEach(item => {
        state.orgMap[item.id] = item;
      });
    },
    doCreateFormExternal: (state, action: PayloadAction<any>) => {
      state.contact.external = action.payload;
    },
    doCreateAfterFlag: (state, action: PayloadAction<any>) => {
      state.contact.createFlag = action.payload;
    },
    doFocusSelector: (state, action: PayloadAction<any>) => {
      state.selector.focused = action.payload;
      state.selectedTags = { emails: [], type: '' };
    },
    doAddItemToSelector: (
      state,
      action: PayloadAction<{
        add: any;
        pendingItem: ContactModel | ContactModel[];
      }>
    ) => {
      const { add, pendingItem } = action.payload;
      state.selector.add = add;
      state.selector.pendingItem = pendingItem;
    },
    doSelectTags: (
      state,
      action: PayloadAction<{
        type: MemberType;
        emails: string[];
      }>
    ) => {
      const { type, emails } = action.payload;
      state.selectedTags.type = type;
      state.selectedTags.emails = Array.from(new Set(emails));
      state.selector.focused = type;
    },
    doSetCurrentEditingMail: (state, action: PayloadAction<{ type: string; current: string }>) => {
      const { type, current } = action.payload;
      state.currentEditingMail = { type, current };
    },

    doUpdateContactMultPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.canShowContactMultPanel = action.payload;
    },

    doUpdateCheckedContacts: (state, action: PayloadAction<ContactOrgItem[]>) => {
      state.checkedContacts = action.payload;
    },
  },
  /** 异步操作 */
  extraReducers: builder => {
    builder.addCase(MailActions.doCloseMail, state => {
      state.selectedTags = { emails: [], type: '' };
    });
  },
});

/**
 * 通过lx联系人id获取灵犀联系人详情信息
 */
export const doGetContactListAsync = async (idList: string[], _account: string = getMainAccount()) => {
  try {
    const data = await contactApi.doGetContactById(idList, _account);
    doUpdateLxContactMap({ [_account]: data });
  } catch (error) {
    // e.message && Message.error(e.message);
  }
};

// 内部方法
// 通过客户id获取客户详情并转换数据结构
const getCustomerDataByIds = async (ids: string[], updateCustomerIdRoleMap?: TCustomerRoleMap) => {
  // 如果不是外贸版本 直接返回空 @郭超
  if (!process.env.BUILD_ISEDM) {
    return {
      data: [],
      customerContactList: [],
      customerList: [],
      contactMap: [],
      customerMap: [],
    };
  }

  const data = await mailPlusCustomerApi.doGetCustomerDataByIds(ids, updateCustomerIdRoleMap);
  const { customerContactList, customerList, contactMap, customerMap } = transServerCustomerModel(data);
  return {
    data,
    customerContactList,
    customerList,
    contactMap,
    customerMap,
  };
};

// 通过客户id从redux中获取客户详情，获取不到从服务端获取
export const doGetCustomersByIds = async (customerIds: string[], from: 'server' | 'redux' = 'redux'): Promise<ICustomerModel[]> => {
  if (!customerIds?.length) {
    return [];
  }
  let customerList: ICustomerModel[] = [],
    requesetIds: string[] = customerIds;
  if (from === 'redux') {
    const { customerMap } = store.getState().contactReducer;
    const res = customerIds.reduce(
      (obj, customerId) => {
        if (customerId) {
          const current = customerMap[customerId];
          if (current) {
            obj.customerList.push(current);
          } else {
            obj.requesetIds.push(customerId);
          }
        }
        return obj;
      },
      {
        customerList: [] as ICustomerModel[],
        requesetIds: [] as string[],
      }
    );
    customerList = res.customerList;
    requesetIds = res.requesetIds;
  }

  if (requesetIds.length) {
    const result = await doGetCustomersByIdsFromServer({ idList: requesetIds });
    if (result) {
      customerList = [...customerList, ...result];
    }
  }
  return customerList;
};

const filterContactListAndCustomer = (
  customerEmailList: { _account: _ACCOUNT; email: EMAIL; customerId: CustomerId; name?: string }[],
  contactMap: Record<string, ContactModel[]>,
  customerMap: TCustomerMap
) => {
  const contactEmailMap = Object.keys(contactMap)?.reduce((obj, customerId) => {
    const contactList = contactMap[customerId];
    const emailSet = contactList.reduce((res, cur) => {
      const email = contactApi.doGetModelDisplayEmail(cur);
      if (email) {
        res.add(email);
      }
      return res;
    }, new Set<string>());
    obj.set(customerId, emailSet);
    return obj;
  }, new Map<string, Set<EMAIL>>());
  const needDeleteCustomerIdSet = new Set<string>([...contactEmailMap.keys()]);
  const accountEmailMap: Record<string, string[]> = {};
  const emailNameMap = new Map<EMAIL, string>();
  customerEmailList.forEach(obj => {
    const { email, customerId, _account, name } = obj;
    emailNameMap.set(email, name || email);
    const emails = contactEmailMap.get(customerId) || new Set();
    if (emails.has(email)) {
      needDeleteCustomerIdSet.delete(customerId);
    } else {
      const emails = accountEmailMap[_account] || [];
      emails.push(email);
      accountEmailMap[_account] = emails;
    }
  });
  // if (needDeleteCustomerIdSet.size) {
  //   needDeleteCustomerIdSet.forEach(id => {
  //     delete contactMap[id];
  //     delete customerMap[id];
  //   });
  // }
  return {
    accountEmailMap,
    customerMap,
    emailNameMap,
  };
};

// 通过客户id从服务端获取获取客户详情
export const doGetCustomersByIdsFromServer = async (params: {
  idList: string[];
  requestEmails?: { _account: _ACCOUNT; email: EMAIL; customerId: CustomerId }[];
}): Promise<ICustomerModel[]> => {
  const { idList, requestEmails } = params;
  try {
    let { customerList, contactMap, customerMap } = await getCustomerDataByIds(idList);
    const deleteIdList = new Set(idList);
    // 获取到需要删除的id列表暂时不删除
    if (customerList.length) {
      customerList.forEach(item => {
        const customerId = item.id;
        if (deleteIdList.has(customerId)) {
          deleteIdList.delete(customerId);
        }
      });
    }
    const deleteCustomerIdList: string[] = [...deleteIdList];
    const deleteContactIdList: string[] = [];
    if (deleteIdList.size) {
      // 通过客户id获取在redux的关联信息
      // 取出关联的email，以及所属的账号，accountEmailMap
      const res = getCustomerLinkData(deleteCustomerIdList);
      deleteContactIdList.push(...res.contactIdList);
    }

    // 需要重新请求的email数据
    let accountEmailMap: Record<_ACCOUNT, EMAIL[]> = {};
    let emailNameMap: Map<EMAIL, string> = new Map();
    // 确认是否是首次请求客户详情且有数据
    if (requestEmails && requestEmails.length > 0) {
      // 过滤客户联系人以及客户数据返回过滤后的数据
      const res = filterContactListAndCustomer(requestEmails, contactMap, customerMap);
      // 需要重新请求的email数据
      accountEmailMap = res.accountEmailMap;
      // 过滤后需要更新的客户数据
      customerMap = res.customerMap;
      // 过滤后请求的email对应的名字
      emailNameMap = res.emailNameMap;
    }
    // 需要更新的联系人数据
    let updateContactMap: TContactMap = {};
    // 需要更新的客户数据
    let updateCustomerMap: TCustomerMap = {};
    if (!isEmpty(customerMap)) {
      updateCustomerMap = customerMap;
    }
    // 需要更新的邮件到联系人map
    let updateEmailIdMap: TEmailIdMap = {};
    // 判断是否需要重新请求
    if (!isEmpty(accountEmailMap)) {
      // 通过email获取应该更新的联系人和客户详情数据
      const {
        updateEmailIdMap: _updateEmailIdMap,
        updateContactMap: _updateContactMap,
        updateCustomerMap: _updateCustomerMap,
      } = await getEmailRoleAndDetailByEmails(accountEmailMap, emailNameMap);
      // 把通过email获取到的需要更新数据 和之前需要更新的部分聚合
      if (!isEmpty(_updateContactMap)) {
        updateContactMap = { ..._updateContactMap };
      }
      if (!isEmpty(_updateCustomerMap)) {
        updateCustomerMap = { ...updateCustomerMap, ..._updateCustomerMap };
      }
      if (!isEmpty(_updateEmailIdMap)) {
        updateEmailIdMap = _updateEmailIdMap!;
      }
    }
    setContactReducerStateData({
      updateContactMap,
      updateEmailIdMap,
      updateCustomerMap,
      deleteCustomerIdList,
      deleteContactIdList,
    });
    return customerList;
  } catch (error) {
    console.error('[contact_reducer] doGetCustomerByIdsAsync error', error);
    return [];
  }
};

/**
 * 合并两个联系人数据
 * left 简要数据， right 完整数据
 */
const mergerContactMap = (left: TContactMap, right: TContactMap) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const result: TContactMap = {};
  new Set([...leftKeys, ...rightKeys]).forEach(contactId => {
    const leftItem = left[contactId];
    const rightItem = right[contactId];
    if (leftItem && rightItem) {
      const customerOrgModel = leftItem.customerOrgModel;
      if (customerOrgModel) {
        rightItem.customerOrgModel.relatedCompanyInfo = leftItem.customerOrgModel.relatedCompanyInfo;
      }
      result[contactId] = rightItem;
    } else if (leftItem) {
      result[contactId] = leftItem;
    } else if (rightItem) {
      result[contactId] = rightItem;
    }
  });
  return result;
};

// 更新联系人角色
export const doUpdateEmailIdMap = (updateEmailIdMap: TEmailIdMap) => {
  const dispatch = store.dispatch;
  dispatch(actions._doUpdateEmailIdMap(updateEmailIdMap));
};

// 更新联系人详情列表
export const doUpdateContactMap = (params: ContactModel[] | Record<_ACCOUNT, ContactModel[]>) => {
  const dispatch = store.dispatch;
  let updateContactMap: TContactMap = {};
  if (params && !Array.isArray(params)) {
    Object.keys(params).forEach(_account => {
      const list = params[_account];
      list.forEach(item => {
        const contactId = item?.contact.id;
        if (contactId) {
          updateContactMap[contactId] = { ...item, _account };
        }
      });
    });
  } else {
    updateContactMap = lodashKeyBy(params, 'contact.id');
  }
  dispatch(actions._doUpdateContactMap(updateContactMap));
};

// 只更新灵犀联系人详情
export const doUpdateLxContactMap = doUpdateContactMap;

// 只更新客户联系人详情
export const doUpdateCustomerContactMap = doUpdateContactMap;

// reducer 内部获取我的客户列表并转化返回数据结构
const _getMyCustomerList = async (_params?: ParamsGetMyCustomerList) => {
  const params = _params || { limit: 50 };
  const limit = params.limit || 50;
  const lastId = params.lastId ? Number(params.lastId) : 0;
  const list = await mailPlusCustomerApi.doGetCustomerListFromServer({ ...params, limit, lastId });
  const { customerList } = transServerCustomerModel(list, 'customer');
  // 需要加入到原来的客户列表后面的id列表
  const customerIdList: string[] = [];
  // 通过返回的客户列表
  customerList.forEach(item => {
    customerIdList.push(item.id);
  });
  return {
    customerList,
    customerIdList,
    loadMore: limit === list.length,
  };
};

// 从reducer 获取我的客户列表
export const doGetMyCustomerListFromReducer = async (params: ParamsGetMyCustomerList | undefined): Promise<ReturnGetMyCustomerList> => {
  const { lastId, limit = 50 } = params || {};
  const dispatch = store.dispatch;
  const state = store.getState() as RootState;
  const { customerMap, myCustomerList } = state.contactReducer;
  // 本地保存的id列表， 是否可以继续请求
  let { idList, loadMore } = myCustomerList;
  const index = lastId ? idList.findIndex(v => +v === +lastId) : -1;
  const startIndex = index > 0 ? index : 0;
  // 在本地获取需要分页的列表数据
  const result = idList.slice(startIndex, startIndex + limit);
  // 在我的客户列表中的ID，但是在本地没有详情的id
  const needUpdateIdList: string[] = [];
  // 最终返回给ui展示的方法
  let displayList: string[] = [];
  // 如果可以加载更多数据且返回的数量少于要求的数量
  if (loadMore && result.length < limit) {
    // const lastId = idList[startIndex] as unknown as number;
    const lastCustomerModel = customerMap[lastId || idList[0]];
    const lastMailTime = lastCustomerModel?.lastMailTime;
    const { customerList, customerIdList, loadMore: _loadMore } = await _getMyCustomerList({ lastId, limit, lastMailTime });
    loadMore = _loadMore;
    displayList = [...customerIdList];
    let updateCustomerMap: TCustomerMap = {};
    if (customerList?.length) {
      updateCustomerMap = lodashKeyBy(customerList, 'id');
    }
    setContactReducerStateData({
      updateCustomerMap,
    });
    // 返回的客户列表信息更新我的客户列表id，和
    dispatch(
      actions.doUpdateMyCustomerList({
        loadMore,
        idList: [...idList.slice(0, startIndex + 1), ...customerIdList],
      })
    );
  } else {
    // 不可以加载更多， 或者返回的数量等于要求的数量
    result.forEach(customerId => {
      const customerDetail = customerMap[customerId];
      if (customerDetail) {
        displayList.push(customerDetail.id);
      } else {
        // 列表有id，详情应该存在否则存在问题
        needUpdateIdList.push(customerId);
      }
    });
  }
  // 增加更新机制？
  if (needUpdateIdList.length > 0) {
    // TODO
    console.error('[contactReducer] doGetMyCustomerList needUpdateIdList error, why happened', needUpdateIdList);
  }
  return { idList: displayList, loadMore };
};

// 修改我的客户列表排序
export const doUpdateMyCustomerListSort = async (idList: string[], _account?: string): Promise<boolean> => {
  if (idList.length === 0) {
    return true;
  }
  try {
    const success = await refreshCustomerDataByIds(idList);
    if (success) {
      await store.dispatch(actions.doUpdateMyCustomerList({ idList, index: 0 }));
      sendCustomerMapChangeNotify({ idList, isFull: false });
    }
    return success;
  } catch (e) {
    console.error('doUpdateMyCustomerListSort', e);
    return false;
  }
};

// 刷新所有的通讯录数据（灵犀联系人，外贸联系人，外贸客户)
export const refreshContactData = async (cleanList = false): Promise<boolean> => {
  try {
    // 拿到页面上展示email角色对应的email
    const accountMap = mailPlusCustomerApi.doGetDisplayEmailLabelMap();
    const accountEmailMap: Record<_ACCOUNT, EMAIL[]> = {};
    let emailNameMap: Map<EMAIL, string> = new Map();
    accountMap.forEach((item, _account) => {
      if (_account && item) {
        accountEmailMap[_account] = [...item.keys()];
        emailNameMap = new Map([...emailNameMap, ...item]);
      }
    });
    // 通过email查询角色信息，并将更新的简要联系人数据返回，以及更新的email对应id的信息返回
    let { updateEmailIdMap, updateContactMap = {}, contactPromiseList } = await getEmailRoleByEmails(accountEmailMap, emailNameMap, true);
    if (contactPromiseList?.length) {
      // 请求灵犀的详情数据（区分多账号的请求方式）
      const lxData = await Promise.all(contactPromiseList);
      // 聚合灵犀联系人详情返回的数据
      const lxContactList = lxData.flat();
      if (lxContactList?.length) {
        // 需要变更的联系人详情map
        // 聚合灵犀联系人和之前的简要联系人数据
        updateContactMap = mergerContactMap(updateContactMap, lodashKeyBy(lxContactList, 'contact.id'));
      }
    }
    // 最后重新设置联系人数据
    // 客户详情数据不去请求，因为根据业务需要，一个一个请求
    store.dispatch(
      actions.doResetContactData({
        updateEmailIdMap,
        updateContactMap,
        updateCustomerMap: {},
      })
    );
    // TODO 合并我的客户列表的删除和新增的操作
    if (cleanList) {
      await store.dispatch(actions.doCleanMyCustomerList());
    }
    return true;
  } catch (e) {
    console.error('[contactReducer] refreshContactData error', e);
    return false;
  }
};

// 刷新传入的客户详情信息
export const refreshCustomerDataByIds = async (ids: string[]): Promise<boolean> => {
  try {
    if (!ids?.length) {
      console.error('请输入要刷新的客户id');
      return false;
    }
    // 通过客户id获取在redux的关联信息
    // 取出关联的email，以及所属的账号，accountEmailMap
    const { contactIdList: deleteContactIdList, emailAccountList: accountEmailMap, emailNameMap } = getCustomerLinkData(ids);

    // 通过email获取修改联系人角色数据，以及联系人详情数据
    const res = await getEmailRoleAndDetailByEmails(accountEmailMap, emailNameMap);
    setContactReducerStateData({
      ...res,
      deleteContactIdList,
      deleteCustomerIdList: ids,
    });
    return true;
  } catch (e) {
    console.error('[contactReducer] refreshCustomerDataByIds error', e);
    return false;
  }
};

/*
 * accountEmailMap: 不同账号下的emails
 *  emailNameMap: 传入的email，对应的name集合
 * 返回：email对应的角色的详细信息
 */
export const refreshContactDataByEmails = async (accountEmailMap: Record<_ACCOUNT, EMAIL[]>, emailNameMap: Map<EMAIL, string>) => {
  try {
    if (!accountEmailMap || !Object.keys(accountEmailMap)?.length) {
      console.error('请输入要刷新的email');
      return false;
    }
    const res = await getEmailRoleAndDetailByEmails(accountEmailMap, emailNameMap);
    if (res.updateCustomerMap) {
      const customerIdList = Object.keys(res.updateCustomerMap);
      const sendNotify = await refreshMyCustomerList();
      if (sendNotify) {
        sendCustomerMapChangeNotify({ idList: customerIdList, isFull: false });
      }
    }
    setContactReducerStateData(res);
    return true;
  } catch (e) {
    console.error('[contactReducer] refreshCustomerDataByIds error', e);
    return false;
  }
};

// 刷新我的客户列表
export const refreshMyCustomerList = async (needSendNotify: boolean = true): Promise<boolean> => {
  try {
    const dispatch = store.dispatch;
    const { customerIdList, loadMore, customerList } = await _getMyCustomerList();
    setContactReducerStateData({
      updateCustomerMap: lodashKeyBy(customerList, 'id'),
    });
    dispatch(actions.doUpdateMyCustomerList({ idList: customerIdList, loadMore }));
    if (needSendNotify) {
      sendCustomerMapChangeNotify({ idList: customerIdList, isFull: false });
    }
    return true;
  } catch (e) {
    console.error('[contactReducer] refreshMyCustomerList error', e);
    return false;
  }
};

// 通知客户数据变更
const sendCustomerMapChangeNotify = (params: { idList?: string[]; isFull: boolean }) => {
  const { isFull, idList } = params;
  eventApi.sendSysEvent({
    eventName: 'customerMapChangeNotify',
    eventData: {
      target: isFull ? 'all' : 'myCustomerList',
      idList,
    } as CustomerMapChangeEvent,
    eventSeq: 0,
  });
  console.warn('[contactReducer] ~ sendEdmNotify ~ params:', params);
};

// 通过email查询角色信息，并将更新的简要联系人数据返回，以及更新的email对应id的信息返回
export const getEmailRoleByEmails = async (
  accountEmailMap: Record<_ACCOUNT, EMAIL[]>, // 需要重新获取email的角色信息，区分多账号的集合
  emailNameMap: Map<EMAIL, string> = new Map(), // 用来给到外部联系人email展示的名称信息集合
  needUpdateLxDetail?: boolean // 是否需要灵犀的详情数据
): Promise<RefreshUpdateRoleRes> => {
  /*
   * 1.通过api获取email最新对应的角色 doGetRoleByEmail
   * 2.通过返回的数据计算出需要的灵犀详情的请求（contactModel）
   * 3.通过返回的数据计算出客户详情的customerIdList (updateCustomerIds)
   * 4.通过返回的数据计算出需要变更的email角色(updateEmailIdMap)
   * 5.通过返回的数据计算出需要变更的通讯录列表(updateContactMap)(简要数据)
   */
  const promiseList = Object.keys(accountEmailMap).reduce((arr, _account) => {
    const emails = [...new Set(accountEmailMap[_account])];
    arr.push(
      mailPlusCustomerApi.doGetRoleByEmail({ emails, _account, useEdm: process.env.BUILD_ISEDM }).then(roleRes => {
        const updateContactMap: TContactMap = {};
        const updateCustomerIds: string[] = [];
        const updateEmailIdMap: TEmailIdMap = {};
        const requestLxIds: string[] = [];
        const reduxUpdateTime = Date.now();
        emails.forEach(email => {
          const val = roleRes[email];
          const accountEmailKey = createAccountEmailKey(email, _account);
          if (val) {
            updateEmailIdMap[accountEmailKey] = val.contactId;
            if (val.companyId) {
              updateCustomerIds.push(val.companyId);
              updateContactMap[val.contactId] = transEmailRoleBase2ContactModel(val);
            } else {
              requestLxIds.push(val.contactId);
            }
          } else {
            const externalId = 'external_id_' + email;
            const name = emailNameMap.get(email) || email;
            const contactModelItem = buildContactModel({ email, type: 'external', name, id: externalId, _account }, { reduxUpdateTime, _account, isFull: true });
            updateContactMap[externalId] = contactModelItem;
            updateEmailIdMap[accountEmailKey] = externalId;
          }
        });
        return {
          updateEmailIdMap,
          updateContactMap,
          updateCustomerIds,
          updateLxContactIds: [_account, requestLxIds],
        };
      })
    );
    return arr;
  }, [] as Promise<UpdateIdsRes>[]);
  const promiseListRes = await Promise.all(promiseList);
  // 聚合返回的计算结果，
  const { updateCustomerIds, contactPromiseList, updateEmailIdMap, updateContactMap } = promiseListRes.reduce(
    (obj, item) => {
      if (item?.updateCustomerIds?.length) {
        obj.updateCustomerIds.push(...item.updateCustomerIds);
      }
      if (item?.updateLxContactIds?.length && needUpdateLxDetail) {
        const [_account, lxIds] = item.updateLxContactIds;
        obj.contactPromiseList.push(contactApi.doGetContactById(lxIds, _account).then(res => contactDataAddReduxParams(res, true, _account)));
      }
      if (!isEmpty(item.updateEmailIdMap)) {
        obj.updateEmailIdMap = { ...item.updateEmailIdMap };
      }
      if (!isEmpty(item.updateContactMap)) {
        obj.updateContactMap = { ...item.updateContactMap };
      }
      return obj;
    },
    {
      updateCustomerIds: [] as CustomerId[],
      contactPromiseList: [] as Promise<ContactModel[]>[],
      updateEmailIdMap: {} as TEmailIdMap,
      updateContactMap: {} as TContactMap,
    }
  );
  return {
    updateCustomerIds,
    contactPromiseList,
    updateEmailIdMap,
    updateContactMap,
  };
};

// 通过email获取角色以及角色对应的详情值
export const getEmailRoleAndDetailByEmails = async (
  accountEmailMap: Record<_ACCOUNT, EMAIL[]>,
  emailNameMap: Map<EMAIL, string> = new Map()
): Promise<RefreshUpdateRes> => {
  const {
    updateCustomerIds,
    contactPromiseList,
    updateEmailIdMap,
    updateContactMap: roleUpdateContactMap,
  } = await getEmailRoleByEmails(accountEmailMap, emailNameMap, true);
  // 获取更新的客户id：角色的映射
  const updateCustomerIdRoleMap: TCustomerRoleMap = {};
  roleUpdateContactMap &&
    Object.values(roleUpdateContactMap).forEach(contactModel => {
      const { role, companyId } = (contactModel?.customerOrgModel as CustomerOrgModel) || {};
      if (companyId && role) {
        updateCustomerIdRoleMap[companyId] = role;
      }
    });
  // 通过客户id获取详情，以及获取灵犀联系人详情
  const [updateCustomerMap, lxContactList] = await Promise.all([
    updateCustomerIds?.length
      ? getCustomerDataByIds(updateCustomerIds, updateCustomerIdRoleMap).then(res => {
          return res.customerMap;
        })
      : Promise.resolve(undefined),
    Promise.all(contactPromiseList).then(lxData => {
      // 聚合灵犀联系人详情
      const lxContactList = lxData.flat();
      return lxContactList;
    }),
  ]);
  // 需要变更的联系人详情map
  const updateContactMap = mergerContactMap(roleUpdateContactMap || {}, lodashKeyBy(lxContactList, 'contact.id'));
  return {
    updateEmailIdMap,
    updateContactMap,
    updateCustomerMap,
  };
};

// 设置联系人redux中的核心数据
const setContactReducerStateData = (params: SetContactReducerStateDataParams) => {
  const { deleteCustomerIdList = [], deleteContactIdList = [], updateCustomerMap, updateContactMap, updateEmailIdMap } = params;
  let willDeleteCustomerIds, willDeleteContactIds;

  // 计算出添加，删除后的客户详情数据
  if (updateCustomerMap && !isEmpty(updateCustomerMap)) {
    if (deleteCustomerIdList?.length) {
      const oldKeys = Object.keys(updateCustomerMap);
      const diff = util.getDiffNew<string>(oldKeys, deleteCustomerIdList);
      willDeleteCustomerIds = diff.insertDiff;
    }
    store.dispatch(actions.doUpdateCustomerMap(updateCustomerMap));
  }
  // 计算出添加，删除后的联系人数据
  if (updateContactMap && !isEmpty(updateContactMap)) {
    if (deleteContactIdList?.length) {
      const oldKeys = Object.keys(updateContactMap);
      const diff = util.getDiffNew<string>(oldKeys, deleteContactIdList);
      willDeleteContactIds = diff.insertDiff;
    }
    store.dispatch(actions._doUpdateContactMap(updateContactMap));
  }
  // 计算出添加，删除后的邮箱-》联系人关联数据
  if (updateEmailIdMap && !isEmpty(updateEmailIdMap)) {
    store.dispatch(actions._doUpdateEmailIdMap(updateEmailIdMap));
  }
  console.log(`willDeleteCustomerIds: ${willDeleteCustomerIds}, willDeleteContactIds: ${willDeleteContactIds}`);
};

// 通过email 获取客户联系人详情（给联系人树使用）
export const doGetCustomerContactByEmails = async (params: { emails: string[] }): Promise<TContactMap> => {
  const { emails } = params;
  if (!emails?.length) {
    return {};
  }
  const res = await mailPlusCustomerApi.doGetRoleByEmail({ emails, useLx: false });
  const resultEmails = Object.keys(res);
  if (resultEmails?.length) {
    return resultEmails.reduce((obj, email) => {
      const item = res[email];
      if (item) {
        obj[email] = transEmailRoleBase2ContactModel(item);
      }
      return obj;
    }, {} as TContactMap);
  }
  return {};
};

// 通过客户id 获取客户联系人详情（给联系人树使用）
export const doGetCustomerContactByCustomerIds = async (params: { idList: string[] }): Promise<Record<string, ContactModel[]>> => {
  const { idList } = params;
  // 此处的idList角色都是我的客户，如有改动，后续可以去掉idRoleMap
  const idRoleMap: TCustomerRoleMap = {};
  if (idList && idList.length) {
    idList.forEach(id => {
      idRoleMap[id] = 'myCustomer';
    });
  }
  const { contactMap } = await getCustomerDataByIds(idList, idRoleMap);
  return contactMap;
};

// 内部方法
// 获取客户关联数据
const getCustomerLinkData = (
  cutsomerIdList: string[]
): {
  cutsomerIdList: string[];
  contactIdList: string[];
  emailAccountList: Record<string, EMAIL[]>;
  emailNameMap: Map<EMAIL, string>;
} => {
  const state = (store.getState() as RootState).contactReducer;
  const contactIdList: string[] = [];
  const idNameMap = new Map<string, string>();
  cutsomerIdList?.forEach(customerId => {
    const curCustomer = state.customerMap[customerId];
    curCustomer?.contactList?.forEach(item => {
      contactIdList.push(item.id);
      idNameMap.set(item.id, item.name);
    });
  });
  const emailNameMap = new Map<string, string>();
  const emailAccountList = Object.keys(state.emailIdMap).reduce((obj, accountEmail) => {
    const curContactId = state.emailIdMap[accountEmail];
    if (curContactId && contactIdList.includes(curContactId)) {
      const paresData = parseAccountEmailKey(accountEmail);
      if (paresData) {
        const emailList = obj[paresData.account] || [];
        emailList.push(paresData.email);
        emailNameMap.set(paresData.email, idNameMap.get(curContactId) || paresData.email);
        obj[paresData.account] = emailList;
      }
    }
    return obj;
  }, {} as Record<string, EMAIL[]>);
  return {
    cutsomerIdList,
    contactIdList,
    emailAccountList,
    emailNameMap,
  };
};

export const { actions } = contactSlice;
export default contactSlice.reducer;
