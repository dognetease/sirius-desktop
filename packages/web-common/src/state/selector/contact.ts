import store, { ContactActions } from '@web-common/state/createStore';
import { _ACCOUNT, api, apis, ContactAndOrgApi, ContactModel, CustomerId, EMAIL, MailBoxEntryContactInfoModel, MailPlusCustomerApi, MemberType, OrgId, util } from 'api';
import { buildContactModel, ContactItem, transContactModel2MailContactModel, transEmailRoleBase2ContactModel } from '@web-common/utils/contact_util';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import {
  doGetCustomerContactByEmails,
  doGetCustomersByIdsFromServer,
  doUpdateContactMap,
  TEmailIdMap,
  doUpdateLxContactMap,
  doUpdateEmailIdMap,
} from '@web-common/state/reducer/contactReducer';
import { createAccountEmailKey, getMainAccount } from '@web-common/components/util/contact';
import cloneDeep from 'lodash/cloneDeep';
// import lodashMerge from 'lodash/merge';

/**
 * 通过id获取列表
 */

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
const systemApi = api.getSystemApi();

type Account = string;
interface requestParams {
  contactId?: string;
  email?: string;
  _account?: string;
  personalOrg?: string[];
  name?: string;
  orgId?: string;
  // 是否需要完整contact数据
  needFull?: boolean;
  useIdFirst?: boolean;
  syncServer?: boolean;
}

type TEmailExtraInfoMap = Map<EMAIL, { name?: string; needFull?: boolean }>;

class ContactReduxApi {
  requestEmails: Map<Account, Set<EMAIL>> = new Map();

  requestIds = new Map<string, Set<string>>();

  requestOrgIds = new Map<string, Set<string>>();

  requestEmailNameMap = new Map<string, string>();

  requestCustomerIds = new Set<CustomerId>();

  requestCustomerExtraMap = new Map<string, { _account: _ACCOUNT; email: EMAIL; customerId: CustomerId }>();

  getCustomerDetail = (customerId: CustomerId, email?: EMAIL, _account: _ACCOUNT = getMainAccount()) => {
    if (customerId && email) {
      this.requestCustomerIds.add(customerId);
      const key = customerId + email + _account;
      this.requestCustomerExtraMap.set(key, {
        customerId,
        email,
        _account,
      });
      console.log(`[getCustomerDetail] request customerId:${customerId}, email: ${email}, _account: ${_account}`);
      this.requestCustomerDetail();
    }
  };

  getEmailMarkedDetail = (params: requestParams) => {
    const { email, _account = systemApi.getCurrentUser()?.id, orgId } = params;

    if (_account) {
      if (orgId) {
        const orgIdSet = this.requestOrgIds.get(_account) || new Set();
        orgIdSet.add(orgId);
        this.requestOrgIds.set(_account, orgIdSet);
        this.requestMarkedDetail();
      } else if (email) {
        const emailSet = this.requestEmails.get(_account) || new Set();
        emailSet.add(email);
        this.requestEmails.set(_account, emailSet);
        this.requestMarkedDetail();
      }
    }
  };

  requestMarkedDetail = debounce(
    () => {
      const requestEmails = this.requestEmails;

      const requestOrgIds = this.requestOrgIds;
      requestEmails.forEach(async (emailSet, _account) => {
        const dispatch = store.dispatch;
        if (emailSet.size) {
          const emails = [...emailSet];
          console.log('[requestMarkedDetail] emails', emails, _account);
          const mapData = await contactApi.doGetPersonalMarklistByEmail({ emails, _account });
          console.log('[requestMarkedDetail] emails result', mapData);
          const payload: Map<string, string[]> = new Map();
          const accountSet = requestEmails.get(_account) || new Set();
          emails.forEach(email => {
            accountSet.delete(email);
            const markedList = mapData.get(email);
            if (markedList) {
              const contactIdList: string[] = [];
              markedList.forEach(item => {
                const contactId = item.value;
                if (contactId) {
                  contactIdList.push(item.value);
                }
              });
              payload.set(email, contactIdList);
            } else {
              payload.set(email, []);
            }
          });
          requestEmails.set(_account, accountSet);
          dispatch(ContactActions.doUpdateEmailMarkedMap({ data: payload, type: 'add', isAll: true }));
        }
      });

      requestOrgIds.forEach(async (orgIdSet, _account) => {
        const dispatch = store.dispatch;
        if (orgIdSet.size) {
          const orgIds = [...orgIdSet];
          console.log('[requestMarkedDetail] orgIds', orgIds, _account);
          const list = await contactApi.doGetPersonalMarkList(orgIds, 'value');
          const orgSet = new Set<OrgId>();
          list.forEach(item => {
            const orgId = item.value;
            if (item.type === 2 && orgId) {
              orgSet.add(orgId);
            }
          });
          console.log('[requestMarkedDetail] orgIds result', list);
          const accountSet = requestEmails.get(_account) || new Set();
          const payload = new Map<OrgId, boolean>();
          orgIds.forEach(orgId => {
            accountSet.delete(orgId);
            payload.set(orgId, orgSet.has(orgId));
          });
          requestEmails.set(_account, accountSet);
          dispatch(ContactActions.doUpdateOrgMarkedMap(payload));
        }
      });
    },
    1000,
    { leading: true }
  );

  requestCustomerDetail = debounce(
    async () => {
      if (this.requestCustomerIds.size) {
        const requestMap = new Map(this.requestCustomerExtraMap);
        const customerIds = [...this.requestCustomerIds];
        console.log('[requestCustomerDetail] customerIds', customerIds);
        const list = await doGetCustomersByIdsFromServer({
          idList: customerIds,
          requestEmails: [...requestMap.values()],
        });
        console.log('[requestCustomerDetail] customerIds result', list);
        customerIds.forEach(customerId => {
          this.requestCustomerIds.delete(customerId);
        });
        requestMap.forEach((_, key) => {
          this.requestCustomerExtraMap.delete(key);
        });
      }
    },
    1000,
    { leading: true }
  );
}
// 聚合是否需要详细数据的email请求通讯录数据
const requestContactDataByEmails = async (fullEmails: string[], notFull: string[], _account: string) => {
  const [{ listRes: fullList }, res] = await Promise.all([
    contactApi.doGetContactByEmailsAdvance({ emails: fullEmails, needGroup: false, _account, useData: 'db' }),
    mailPlusCustomerApi.doGetRoleByEmail({ emails: notFull, _account, useEdm: process.env.BUILD_ISEDM }),
  ]);
  const updateEmailIdMap: TEmailIdMap = {};
  const notFullList = Object.keys(res).reduce((arr, email) => {
    const current = res[email];
    if (current) {
      const accountEmailKey = createAccountEmailKey(email, _account);
      updateEmailIdMap[accountEmailKey] = current.contactId;
      arr.push(transEmailRoleBase2ContactModel(current));
    }
    return arr;
  }, [] as ContactModel[]);
  return { updateContactList: [...fullList, ...notFullList], updateEmailIdMap };
};

// 获取email相关的星标数据加入redux中
export const doGetEmailMarkedData = new ContactReduxApi().getEmailMarkedDetail;

// 获取客户详情数据加入redux中
export const doGetCustomerData = new ContactReduxApi().getCustomerDetail;

// 获取联系人数据（简要，详情）加入redux中
export const doGetContactData = (() => {
  // 存储要请求api或者服务器的联系人emails，区分多账号
  const requestEmails = new Map<string, Set<string>>();
  // 存储要请求api或者服务器的联系人ids，区分多账号
  const requestIds = new Map<string, Set<string>>();
  // 存储要请求api或者服务器的分组ids，区分多账号
  const requestOrgIds = new Map<string, Set<string>>();
  // 存储要请求api或者服务器的联系人emails的附加信息
  const requestEmailExtraInfoMap = new Map<string, TEmailExtraInfoMap>();
  // debounce 1s请求数据
  const search = debounce(
    async () => {
      const dispatch = store.dispatch;
      // 读取email请求列表区分多账号（不同账号下，请求的email列表不一样）
      requestEmails.forEach(async (emailSet, _account) => {
        if (emailSet.size) {
          const emails = [...emailSet];
          const emailExtraInfoMap = requestEmailExtraInfoMap.get(_account);
          console.log('[doGetContactData] emails', emails, _account);
          // 从请求的email列表中区分需要完整数据的和需要部分数据的请求
          const { needFullEmails, notFullEmails } = emails.reduce(
            (obj, email) => {
              const needFull = emailExtraInfoMap?.get(email)?.needFull;
              if (!needFull) {
                obj.notFullEmails.push(email);
              } else {
                obj.needFullEmails.push(email);
              }
              return obj;
            },
            { needFullEmails: [], notFullEmails: [] } as { needFullEmails: string[]; notFullEmails: string[] }
          );
          // 聚合完整数据请求列表和不完整数据列表
          const { updateContactList, updateEmailIdMap } = await requestContactDataByEmails(needFullEmails, notFullEmails, _account);
          console.log('[doGetContactData] emails result', updateContactList);
          // 返回的联系人中聚合一下主账号和主显账号用来过滤
          const resEmails = new Set<string>();
          // API、返回的联系人列表（需要更新）
          const contactList: ContactModel[] = [];
          updateContactList.forEach(item => {
            if (item) {
              // 强制添加账号信息
              item._account = _account;
              contactList.push(item);
              resEmails.add(item.contact.displayEmail);
              resEmails.add(item.contact.accountName);
            }
          });
          const accountSet = requestEmails.get(_account) || new Set();
          const externalList: ContactModel[] = [];
          const reduxUpdateTime = Date.now();
          // 请求的email遍历
          emails.forEach(e => {
            // 删除当前账号下 的请求列表中已经请求的emails
            accountSet.delete(e);
            // 处理返回的emails不存在的email
            if (!resEmails.has(e)) {
              // 从请求的email中获取相关的email对应的name用来构建外部联系人数据
              const externalName = emailExtraInfoMap?.get(e)?.name || e;
              const externalId = 'external_id_' + e;
              const contactModelItem = buildContactModel({ email: e, type: 'external', name: externalName, id: externalId }, { isFull: true, _account, reduxUpdateTime });
              // 把外部联系人数据加入redux中
              externalList.push(contactModelItem);
              // 把外部联系人数据对应的email的关联信息加入redux中
              const accountEmailKey = createAccountEmailKey(e, _account);
              updateEmailIdMap[accountEmailKey] = externalId;
            }
          });
          // 重新设置还在当前账号下的请求列表中的email
          requestEmails.set(_account, accountSet);
          // 更新联系人角色
          doUpdateEmailIdMap(updateEmailIdMap);
          // 只更新联系人详情(Lx + edm)
          doUpdateContactMap({ [_account]: [...contactList, ...externalList] });
        }
      });
      requestIds.forEach(async (idSet, _account) => {
        if (idSet.size) {
          const idList = [...idSet];
          console.log('[doGetContactData] ids lx', idList, _account);
          const updateList = await contactApi.doGetContactById(idList, _account);
          const lxIdList = new Set();
          updateList.forEach(item => {
            lxIdList.add(item.contact.id);
          });
          if (updateList?.length) {
            console.log('[doGetContactData] ids result', updateList);
            const accountSet = requestIds.get(_account) || new Set();
            const errorIds: string[] = [];
            idList.forEach(id => {
              accountSet.delete(id);
              if (!lxIdList.has(id)) {
                errorIds.push(id);
              }
            });
            if (errorIds?.length) {
              console.error('[doGetContactData] request ids error', errorIds);
            }
            requestIds.set(_account, accountSet);
            // 只更新灵犀联系人详情
            doUpdateLxContactMap({ [_account]: updateList });
          }
        }
      });
      requestOrgIds.forEach(async (idSet, _account) => {
        if (idSet.size) {
          const idList = [...idSet];
          console.log('[doGetContactData] orgIds', idList, _account);
          const orgData = await contactApi.doGetOrgList({ idList, _account });
          if (orgData?.length) {
            dispatch(ContactActions.doUpdateOrgMap(orgData));
            const accountSet = requestOrgIds.get(_account) || new Set();
            idList.forEach(e => {
              accountSet.delete(e);
            });
            requestOrgIds.set(_account, accountSet);
          }
        }
      });
    },
    1000,
    { leading: true }
  );

  return (params: requestParams) => {
    const { email, contactId, useIdFirst, _account = systemApi.getCurrentUser()?.id, personalOrg, name, needFull } = params;
    // 请求的地方必须要带有email或者id或者 personalOrg
    if (email || contactId || personalOrg) {
      if (_account) {
        // 如果是请求的数据带有多个属性，需要判断是否有useIdFirst，那个这条请求会加入到id列表
        // 否则判断是否存在email 加入email请求列表
        // email不存在加入Id列表
        // id 不存在加入personalOrg个人分组列表
        if (useIdFirst && contactId) {
          const idSet = requestIds.get(_account) || new Set();
          idSet.add(contactId);
          requestIds.set(_account, idSet);
        } else if (email) {
          const emailSet = requestEmails.get(_account) || new Set();
          const emailExtraInfoMap: TEmailExtraInfoMap = requestEmailExtraInfoMap.get(_account) || new Map();
          emailSet.add(email);
          // 加入email的信息同时记录email的名称以及是否是需要完整数据
          const currentEmailExtraInfo = emailExtraInfoMap.get(email);
          const currentEmailExtraInfoName = currentEmailExtraInfo?.name;
          if (currentEmailExtraInfo?.needFull) {
            emailExtraInfoMap.set(email, {
              needFull: true,
              name: name || currentEmailExtraInfoName,
            });
          } else {
            emailExtraInfoMap.set(email, {
              needFull,
              name: name || currentEmailExtraInfoName,
            });
          }
          requestEmails.set(_account, emailSet);
          requestEmailExtraInfoMap.set(_account, emailExtraInfoMap);
        } else if (contactId) {
          const idSet = requestIds.get(_account) || new Set();
          idSet.add(contactId);
          requestIds.set(_account, idSet);
        } else if (personalOrg?.length) {
          const idSet = requestOrgIds.get(_account) || new Set();
          requestOrgIds.set(_account, new Set([...idSet, ...personalOrg]));
        }
      }
      console.log(`[doGetContactData] search request email:${email}, contactId:${contactId}, account:${_account}`);
      search();
    }
  };
})();

// 从服务端获取灵犀详情数据加入到redux中
export const doGetConactDataFromServer = async (id: string, email: string, _account: string = getMainAccount()) => {
  const list = await contactApi.doGetContactByQiyeAccountId({
    idList: [id],
    _account,
  });
  if (Array.isArray(list) && list.length) {
    const accountEmailKey = createAccountEmailKey(email, _account);
    doUpdateEmailIdMap({ [accountEmailKey]: id });
    // 只更新联系人详情（Lx使用，不需要判断email权限过期）
    doUpdateLxContactMap({
      [_account]: list.map(item => {
        item.isFull = true;
        return item;
      }),
    });
  }
};

/**
 * @description:从服务端更新通讯录model到redux
 * @author:guochao
 */
export const doMergeContactDataWithServerData = (() => {
  const requestModelMap: Map<string, ContactModel> = new Map();
  const search = debounce(
    () => {
      if (!requestModelMap.size) {
        return;
      }

      contactApi
        .doGetContactByQiyeAccountId({
          idList: [...requestModelMap.keys()],
        })
        .then(serverModels => {
          const serverModelMap = new Map(
            serverModels.map(item => {
              return [item?.contact?.id || '', item];
            })
          );

          const mergedContactModelList: ContactModel[] = [...requestModelMap.keys()].map(key => {
            if (!serverModelMap.has(key)) {
              return requestModelMap.get(key)!;
            }
            const serverModel = serverModelMap.get(key);
            const { avatar, position } = requestModelMap.get(key)!.contact!;

            serverModel!.contact!.avatar = avatar;
            serverModel!.contact!.position = position;
            return serverModel!;
          });
          // 只更新Lx联系人详情
          doUpdateLxContactMap(mergedContactModelList);
          requestModelMap.clear();
        })
        .catch(ex => {
          console.error('[contact.redux]doGetContactDataFromServer.error', ex);
          requestModelMap.clear();
        });
    },
    500,
    { leading: true }
  );
  return (params: { contactModel: ContactModel; requiredField: string[]; _account?: string }) => {
    const { contactModel, requiredField, _account = systemApi.getCurrentUser()?.id } = params;
    const contactType = lodashGet(contactModel, 'contact.type', '');
    // 如果没有填必选字段 不更新 & 只更新企业数据
    if (!Array.isArray(params.requiredField) || !requiredField.length || contactType !== 'enterprise') {
      return;
    }

    // 只查主账号
    if (_account !== systemApi.getCurrentUser()?.id) {
      return;
    }

    const needSync = requiredField.some(itemField => {
      return typeof lodashGet(contactModel, `contact.${itemField}`, undefined) === 'undefined';
    });

    if (!needSync) {
      return;
    }

    requestModelMap.set(lodashGet(contactModel, 'contact.id', ''), contactModel);
    search();
  };
})();

export const doGetContactListById = async (idList: string[]): Promise<ContactModel[]> => {
  const state = store.getState();
  const result: Map<string, ContactModel> = new Map();
  const contactMap = state.contactReducer.contactMap;
  const dbIdList: string[] = [];
  idList.forEach(id => {
    if (contactMap[id]) {
      result.set(id, contactMap[id]);
    } else {
      dbIdList.push(id);
    }
  });
  if (dbIdList.length) {
    const contactList = await contactApi.doGetContactById(dbIdList);
    contactList.forEach(item => {
      result.set(item.contact.id, item);
    });
  }
  return [...result.values()];
};

export const doGetContactModelByContactItem = async (
  list: ContactItem[],
  options?: {
    useEmail?: boolean;
    useCompositeQuery4Personal?: boolean;
    useCompositeQuery4Lx?: boolean;
    _account?: string;
  }
): Promise<ContactModel[]> => {
  // 默认useEmail为true
  const useEmail = options?.useEmail || true;
  // 个人通讯录优先使用组合查询
  const useCompositeQuery4Lx = options?.useCompositeQuery4Lx;
  const _account = options?._account || '';

  const state = store.getState();
  const dispatch = store.dispatch;
  const result: Map<string, ContactModel> = new Map();
  const { contactMap, emailIdMap } = state.contactReducer;
  const idMap: Map<string, ContactItem> = new Map();
  const emailList: string[] = [];
  const customerList: ContactItem[] = [];
  const customerEmailList: string[] = [];
  const externalEmailData = new Map<string, ContactItem>();
  /**
   * @description:所有的本地查找email逻辑上都是无效的.contactReduce中emailIdMap的Key数据格式email+_account
   *
   */
  list.forEach(item => {
    const { email, id, type } = item;
    let flag = false;
    if (id && !contactMap[id]) {
      if (type === 'customer' || type === 'clue') {
        customerList.push(item);
      } else {
        idMap.set(id, item);
      }
    }
    const _useCompositeQuery4Lx = useCompositeQuery4Lx && ['personal', 'enterprise'].includes(type) && id;
    if (useEmail && email && !_useCompositeQuery4Lx) {
      const contactId = emailIdMap[email];
      if (!flag && contactId) {
        const model = contactMap[contactId];
        if (model) {
          flag = true;
          const { contact, contactInfo } = model;
          if (type === 'personal') {
            result.set(util.getUnique(contact.id, email), { contact: { ...contact, hitQueryEmail: email }, contactInfo });
          } else {
            result.set(contact.id, model);
          }
        }
      }
      if (!flag && email) {
        if (type === 'customer' || type === 'clue') {
          customerEmailList.push(email);
          externalEmailData.set(email, item);
        } else {
          emailList.push(email);
          externalEmailData.set(email, item);
        }
      }
    } else {
      if (id && contactMap[id]) {
        flag = true;
        const model = contactMap[id];
        const { contact, contactInfo } = model;
        if (type === 'personal') {
          const contactCopy = cloneDeep({ contact: { ...contact, hitQueryEmail: email }, contactInfo });
          result.set(util.getUnique(id, email), contactCopy);
        } else {
          result.set(id, model);
        }
      }
      if (!flag && id) {
        if (type === 'customer' || type === 'clue') {
          customerList.push(item);
        } else {
          idMap.set(id, item);
        }

        // 如果是个人通讯录下查不到当前用户 转成陌生人
        if (_useCompositeQuery4Lx) {
          externalEmailData.set(email, item);
        }
      }
    }
  });

  if (idMap.size) {
    const contactList = await contactApi.doGetContactById([...idMap.keys()], _account);
    contactList.forEach(item => {
      const { contact, contactInfo } = item;
      const originItem = idMap.get(contact.id);
      if (originItem) {
        externalEmailData.delete(contact.accountName);
        if (originItem.type === 'personal') {
          result.set(util.getUnique(contact.id, originItem.email), { contact: { ...contact, hitQueryEmail: originItem.email }, contactInfo });
        } else if (originItem.type === 'enterprise') {
          result.set(contact.id, item);
        }
      }
    });
  }
  // 0715修改， 不应该存在这个情况
  if (customerList.length) {
    customerList.forEach(item => {
      if (item.id) {
        result.set(item.id, buildContactModel(item));
      }
    });
  }
  // 0715修改， 不应该存在这个情况
  if (customerEmailList.length) {
    const res = await doGetCustomerContactByEmails({ emails: customerEmailList });
    Object.values(res).forEach(model => {
      result.set(model.contact.id, model);
      externalEmailData.delete(model.contact.accountName);
    });
  }
  if (emailList.length) {
    // SIRIUS-3669  【通讯录】当主账号和挂载账号拥有同一个邮箱A时，且主账号下联系人存在A、B两个邮箱...
    // 1.27版本暂时用doGetContactByEmailsAdvance替换doGetContactByItem(reason:byAdvance可以返回正确的hitqueryEmail)
    // 这里无法给用户返回正确的contact信息 但是可以保证hitQueryEmail不出错。想要解决查询到正确的contact需要传入正确的_account去执行查询
    // const contactList = await contactApi.doGetContactByItem({ value: emailList, type: 'EMAIL' });
    const contactRes = await contactApi.doGetContactByEmailsAdvance({ emails: emailList, useEdm: false, _account: options?._account });
    // 返回的contact带hitQueryEmail
    contactRes.listRes.forEach(item => {
      const {
        contact: { id, type, hitQueryEmail, accountName },
      } = item;
      externalEmailData.delete(accountName);
      if (type === 'personal') {
        result.set(util.getUnique(id, hitQueryEmail), item);
      } else if (type === 'enterprise') {
        result.set(id, item);
      }
    });
  }
  const externalData: ContactModel[] = [];
  if (externalEmailData.size) {
    externalEmailData.forEach(item => {
      externalData.push(buildContactModel(item));
    });
  }
  return [...result.values(), ...externalData];
};

// 从redux中获取email对应的联系人数据并转换成邮件联系人数据结构
export const doGetMailContactModelByContactItem = async (list: ContactItem[], receiverType: MemberType, _account?: string) => {
  let model: ContactModel[] = [];
  if (list.length) {
    model = await doGetContactModelByContactItem(list, {
      useCompositeQuery4Lx: true,
      _account: _account,
    });
  }
  const modelMap: Record<string, MailBoxEntryContactInfoModel> = {};
  model.forEach(item => {
    const mailModel = transContactModel2MailContactModel(item, receiverType);
    // const displayEmail = item.contact.displayEmail;
    // const accountEmail = item.contact.accountName;
    // const hitQueryEmail = item.contact.hitQueryEmail;
    const displayEmail = contactApi.doGetModelDisplayEmail(item);
    if (displayEmail && mailModel) {
      modelMap[displayEmail] = mailModel;
    }
  });
  const receiver: MailBoxEntryContactInfoModel[] = [];
  list.forEach(item => {
    const model = modelMap[item.email];
    if (model) {
      receiver.push(model);
    } else {
      console.error('doGetMailContactModelByContactItem has error', item, modelMap);
    }
  });
  return receiver;
};
