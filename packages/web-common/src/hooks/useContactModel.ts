import { useMemo, useEffect, useRef } from 'react';
import { useAppSelector, userAppSelectorShallowEqual } from '@web-common/state/createStore';
import {
  _ACCOUNT,
  api,
  apis,
  ContactAndOrgApi,
  ContactId,
  ContactItem,
  ContactModel,
  CustomerId,
  EMAIL,
  EmailRoles,
  EntityOrg,
  ICustomerModel,
  MailPlusCustomerApi,
  OrgId,
} from 'api';
import { systemApi } from '@web-common/utils/contact_util';
import {
  doGetContactData,
  doMergeContactDataWithServerData,
  doGetEmailMarkedData,
  doGetConactDataFromServer,
  doGetCustomerData,
} from '@web-common/state/selector/contact';
import lodashGet from 'lodash/get';
import { createAccountEmailKey, getMainAccount } from '@web-common/components/util/contact';

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

// 获取联系人数据带的参数
interface IUseContactModelParams {
  contactId?: string;
  email?: string;
  name?: string;
  _account?: string;
  isMainAccount?: boolean;
  // 是否需要完整数据
  needFull?: boolean;
  watchParams?: Array<'contactId' | 'email' | '_account' | 'name' | 'personalOrg'>;
  needCompleteContact?: boolean;
  // 是否使用ID和email进行组合查询
  useCompositeQuery?: boolean;
}

// 获取联系人头像数据带的参数
interface AvatarProps extends IUseContactModelParams {
  name?: string;
  emailTxt?: string;
  color?: string;
  avatar?: string;
  logcAvatar?: string;
  model?: ContactModel;
  showAvatarFirst?: boolean;
}

// 联系人头像返回的数据
interface AvatarRes {
  avatar: string;
  avatarTxt: string;
  avatarPendant: string;
  color: string;
  source?: 'redux' | 'prop';
}

// 更新联系人详情需要的参数
interface UpdateContactModelParams {
  contactId?: string;
  email?: string;
  _account?: string;
  personalOrg?: string[];
  name?: string;
  model?: ContactModel;
  useIdFirst?: boolean;
  needCompleteContact?: boolean;
  needFull?: boolean;
}

// 通过服务端最新的更新时间更新通讯录联系人的数据
const updateExternalData = (data: ContactItem | undefined) => {
  if (data) {
    const { reduxUpdateTime = 0, email, _account } = data;
    if (email) {
      const lxLastUpdateTime = contactApi.doGetContactLastUpdateTime(_account);
      if (reduxUpdateTime < lxLastUpdateTime) {
        doGetContactData({ email, _account });
      }
    }
  }
};

// 通过联系人详情获取邮件角色
export const getContactEmailRoleByContactModel = (model?: ContactModel): EmailRoles => {
  if (model) {
    const edmRole = model.customerOrgModel?.role;
    if (edmRole) {
      return edmRole as EmailRoles;
    }
    if (model.contact) {
      return model?.contact.type as EmailRoles;
    }
  }
  return 'external';
};

// 通过联系人参数获取联系人详情
// export const useContactModelOld = ({ contactId, email: _email, _account = systemApi.getCurrentUser()?.id }: IUseContactModelParams) => {
//   // 根据contactId获取modal数据
//   const contactModel = useAppSelector(state => {
//     const email = _email?.toLocaleLowerCase();
//     if (email) {
//       const user = systemApi.getCurrentUser();
//       const userModel = user?.contact;
//       if (email === user?.id && userModel) {
//         const model = state.contactReducer.contactMap[userModel?.contact?.id];
//         if (model) {
//           return model;
//         } else {
//           return userModel;
//         }
//       }
//       const idMap = state.contactReducer.emailIdMap[email] || {};
//       const idMapKeys = Object.keys(idMap) || [];
//       const hasRequestApi = idMapKeys.some(item => item && item.split('_')[0] === _account);
//       // 如果没有关于当前账号的信息，则返回undefined，@明亮，此处是否会导致循环，转起来
//       if (!hasRequestApi) {
//         return undefined;
//       }
//       const displayContactItem = getDisplayContactItem(Object.values(idMap), undefined, _account);
//       if (displayContactItem?.id) {
//         // 外贸通0510，非主账号支持客户
//         // if(!isMainAccount && (displayContactItem.type === 'clue' || displayContactItem.type === 'customer')){
//         //   return undefined;
//         // }
//         updateExternalData(displayContactItem);
//         return state.contactReducer.contactMap[displayContactItem.id];
//       }
//       return undefined;
//     }
//     if (contactId) {
//       return state.contactReducer.contactMap[contactId];
//     }
//     return undefined;
//   }, userAppSelectorShallowEqual);
//   return contactModel;
// };

export const useContactModelNames = (params: { emails: string[]; _account?: string; enableQuery?: boolean }) => {
  const { emails, _account, enableQuery = false } = params;

  const needMatchEmail = useMemo(() => {
    return emails.slice(0, 5);
  }, [emails.length]);

  const names = useAppSelector(state => {
    if (!enableQuery) {
      return {};
    }
    return needMatchEmail.reduce((total, subEmail) => {
      if (!subEmail) {
        return total;
      }
      const accountEmailKey = createAccountEmailKey(subEmail, _account);
      const contactId = state.contactReducer.emailIdMap[accountEmailKey];
      const name = state.contactReducer.contactMap[contactId]?.contact?.contactName;
      if (name) {
        total[subEmail] = name;
      }
      return total;
    }, {} as Record<string, string>);
  }, userAppSelectorShallowEqual);

  // 如果当前redux数据中没有当前email数据 发送请求
  useEffect(() => {
    if (!enableQuery) {
      return;
    }
    const matchedEmails = Object.keys(names);
    needMatchEmail.filter(item => {
      if (!matchedEmails.includes(item)) {
        doGetContactData({
          email: item,
          needFull: false,
          _account,
        });
      }
    });
  }, [Object.keys(names).length]);

  return names;
};
export const useContactModelList = (emails: string[], _account?: string): ContactModel[] => {
  const res = useAppSelector(
    state => {
      const contactIds: string[] = [];
      const modelList: ContactModel[] = [];
      emails.forEach(email => {
        const accountEmailKey = createAccountEmailKey(email, _account);
        const contactId = state.contactReducer.emailIdMap[accountEmailKey];
        if (contactId) {
          contactIds.push(contactId);
          const model = state.contactReducer.contactMap[contactId];
          if (model) {
            modelList.push(model);
          }
        }
      });
      return {
        contactIds,
        modelList,
      };
    },
    (left, right) => {
      const leftStr = left.contactIds.join('_');
      const rightStr = right.contactIds.join('-');
      return leftStr === rightStr;
    }
  );
  return res.modelList;
};

export const useContactModel = (params: IUseContactModelParams): ContactModel | undefined => {
  const user = systemApi.getCurrentUser(params._account || '');
  const email = params.email?.toLocaleLowerCase();
  const isSelf = email === user?.id;
  const needFull = isSelf || params.needFull;
  const contactId = params.contactId;
  const _account = params._account || user?.id;

  // 根据contactId获取modal数据
  const contactModel = useAppSelector(state => {
    let model: ContactModel | undefined;
    const userModel = user?.contact;
    const useCompositeQuery = params.useCompositeQuery || false;

    // 如果优先使用contactId查询 如果有数据的情况下优先从contactIdMap中去取数据
    if (lodashGet(contactId, 'length', 0) && useCompositeQuery) {
      const matchedContact = state.contactReducer.contactMap[contactId!];
      if (matchedContact && matchedContact.contact?.type === 'personal') {
        return matchedContact;
      }
    }

    if (isSelf && userModel) {
      if (userModel?.contact?.id) {
        model = state.contactReducer.contactMap[userModel?.contact?.id];
      }
      if (!model) {
        model = { ...userModel, isFull: true };
      }
    } else if (email) {
      const accountEmailKey = createAccountEmailKey(email, _account);
      const contactId = state.contactReducer.emailIdMap[accountEmailKey];
      model = state.contactReducer.contactMap[contactId];
    } else if (contactId) {
      model = state.contactReducer.contactMap[contactId];
    }
    return model;
  }, userAppSelectorShallowEqual);

  useUpdateContactModel({ ...params, needFull, email, model: contactModel });

  if (needFull && !contactModel?.isFull) {
    return undefined;
  }
  return contactModel;
};
// 通过邮箱获取联系人标签信息
export const useContactEmailRole = (params: { email: string; _account?: string; name?: string }): EmailRoles => {
  const { email, _account = getMainAccount(), name } = params;
  const model = useContactModel({ ...params, needFull: false });
  useEffect(() => {
    if (process.env.BUILD_ISEDM && params.email) {
      mailPlusCustomerApi.doUpdateDisplayEmailLabelMap({
        email,
        name,
        _account,
        action: 'add',
      });
    }
  }, [params.email, params._account]);
  const role = useMemo(() => {
    return getContactEmailRoleByContactModel(model);
  }, [model?.customerOrgModel?.role, model?.contact?.type]);
  return role;
};

// 通过email 获取客户详情 无使用地方
// export const useCustomerModelByEmail = (params: IUseContactModelParams) => {
//   const contactModel = useContactModel(params);
//   const customerId = contactModel?.customerOrgModel?.companyId;
//   const customerModel = useCustomerModel({ customerId });
//   return {
//     contactModel,
//     customerModel,
//   };
// };

// 通过客户id获取客户联系人详情数据
export const useCustomerModel = (params: { customerId?: CustomerId; email?: EMAIL; _account?: _ACCOUNT; emailRole?: EmailRoles }): ICustomerModel | undefined => {
  const { customerId, email, _account, emailRole } = params;
  const model = useAppSelector(state => {
    if (customerId) {
      return state.contactReducer.customerMap[customerId];
    }
    return undefined;
  }, userAppSelectorShallowEqual);
  useEffect(() => {
    // 判断角色发生变化也要重新请求
    if (!model && customerId && email && emailRole !== 'colleagueCustomerNoAuth' && emailRole !== 'colleagueClueNoAuth') {
      doGetCustomerData(customerId, email, _account);
    }
  }, [customerId, model?.id, emailRole]);
  return model;
};

// 更新联系人详情
export const useUpdateContactModel = (params: UpdateContactModelParams) => {
  const { model, ...data } = params || {};
  // const contactMapCleanTimes = useAppSelector(state => {
  //   state.contactReducer.contactMapCleanTimes;
  // });
  const { needFull, contactId, email, _account } = data;
  const modelId = model?.contact?.id;
  const isFull = model?.isFull;

  useEffect(() => {
    if (!modelId) {
      doGetContactData({ ...data, needFull: false });
    } else if (needFull && !model?.isFull) {
      const companyId = model?.customerOrgModel?.companyId;
      if (companyId) {
        doGetCustomerData(companyId, email?.toLocaleLowerCase(), _account);
      } else {
        doGetContactData({ ...data, email: email?.toLocaleLowerCase(), contactId: modelId || contactId, useIdFirst: true });
      }
    }
  }, [modelId, contactId, email, isFull]);
  // }, [ noData, contactId, contactMapCleanTimes ]);

  // 更新Job信息
  useEffect(() => {
    const contactType = lodashGet(model, 'contact.type', '');
    // 配置了needCompleteContact才会去查完整数据
    if (contactType !== 'enterprise' || (params.needCompleteContact || false) !== true) {
      return;
    }
    doMergeContactDataWithServerData({
      contactModel: model!,
      requiredField: ['job'],
      _account: params._account,
    });
  }, [params.contactId, lodashGet(model, 'contact.type', ''), params?._account, params?.needCompleteContact]);

  useEffect(() => {});

  /**
   * 1.23版本策略调整: 因为低内存模式下用户信息已经可以加载完整信息。现在没有必要再去拉详细信息了
   * 同域内的详情用户从服务端查询一下
   */
  useEffect(() => {
    const contactType = lodashGet(model, 'contact.type', '');
    const externalEmail = lodashGet(params, 'email', '');
    const myDomain = systemApi.getCurrentUser()?.domain || '';
    // 查询相同域名的陌生人信息
    if (!params?.needCompleteContact || contactType === 'enterprise' || !externalEmail || externalEmail.indexOf(myDomain) == -1) {
      return;
    }
    // 如果200ms内还拿不到当前用户的信息
    const tid = setTimeout(() => {
      doGetConactDataFromServer(params.contactId!, params.email!, params._account);
    }, 200);
    return () => {
      tid && clearTimeout(tid);
    };
  }, [params.email, lodashGet(model, 'contact.type', ''), params?.needCompleteContact]);

  // 1.27版本策略调整：如果低内存模式下可能是没有云信信息的 需要想办法补充
  useEffect(() => {
    const contactType = lodashGet(model, 'contact.type', '');
    const hasYunxin = model?.contactInfo.find(item => {
      return item.contactItemType === 'yunxin';
    });
    const isMainAccount = systemApi.getIsMainAccount(params._account);

    if (contactType !== 'enterprise' || hasYunxin || !isMainAccount || !isFull) {
      return;
    }
    doGetConactDataFromServer(params.contactId!, params.email!, params._account);
  }, [isFull, params.email, lodashGet(model, 'contactInfo.length', 0)]);
};

// 星标联系人
export const useContactMarked = (props: { email?: EMAIL; contactId?: ContactId; orgId?: OrgId; _account?: string; useId?: boolean }): boolean => {
  const { email, orgId, useId, contactId, _account } = props;
  const contactMarked = useAppSelector(state => {
    if (orgId) {
      return state.contactReducer.orgMarkedMap[orgId];
    }
    // 根据contactId获取modal数据
    if (email) {
      const contactIdList = state.contactReducer.emailMarkedMap[email];
      if (useId && contactId && contactIdList) {
        return contactIdList.includes(contactId);
      }
      if (!contactIdList) {
        return undefined;
      }
      return contactIdList.length > 0;
    }
    return undefined;
  }, userAppSelectorShallowEqual);
  useMemo(() => {
    if (contactMarked === undefined) {
      doGetEmailMarkedData({ email, orgId, _account });
    }
  }, [email]);
  return !!contactMarked;
};

// 客户联系人详情 废弃
// export const useCustomerContactModel = (params: { email: string; onlyCustomer?: boolean; id?: string }) => {
//   return useAppSelector(state => {
//     const { email: _email, onlyCustomer, id: _id } = params;
//     const modelMap: Record<string, ContactModel> = {};
//     let displayContactId: string | undefined;
//     if (onlyCustomer && _id) {
//       const model = state.contactReducer.contactMap[_id];
//       if (model) {
//         modelMap[_id] = model;
//         displayContactId = _id;
//       }
//     }
//     return { modelMap, displayContactId };
//   }, userAppSelectorShallowEqual);
// };

// 通过分组id获取分组name
export const useContactPersonalOrg = (personalIdList?: string[]) => {
  return useAppSelector(
    state => {
      if (!personalIdList?.length) {
        return {
          personalOrgNameList: [],
          hasDataOrgIds: [],
        };
      }
      const personalOrgNameList: string[] = [];
      const hasDataOrgIds: string[] = [];
      personalIdList.forEach(id => {
        const orgInfo = state.contactReducer.orgMap[id];
        if (orgInfo) {
          hasDataOrgIds.push(id);
          personalOrgNameList.push(orgInfo.orgName);
        }
      });
      return { personalOrgNameList, hasDataOrgIds };
    },
    (prev, cur) => {
      const { personalOrgNameList: left, hasDataOrgIds: orgLeft } = prev;
      const { personalOrgNameList: right, hasDataOrgIds: orgRight } = cur;
      if (left?.length === right?.length) {
        const leftSet = new Set(left);
        return left.length > 0 && !right.some(item => !leftSet.has(item));
      }
      if (orgLeft?.length === orgRight?.length) {
        const leftOrgSet = new Set(orgLeft);
        return orgLeft.length > 0 && !orgRight.some(item => !leftOrgSet.has(item));
      }
      return false;
    }
  );
};
/**
 * @deprecated:废弃
 * @param personalIdList
 * @returns
 */
export const useContactPersonalOrgList = (personalIdList?: string[]) => {
  if (!personalIdList) {
    return [];
  }
  return useAppSelector(state => {
    const personalOrgNameList: EntityOrg[] = [];
    personalIdList.forEach(id => {
      const orgInfo = state.contactReducer.orgMap[id];
      if (orgInfo) {
        personalOrgNameList.push(orgInfo);
      }
    });
    return personalOrgNameList;
  }, userAppSelectorShallowEqual);
};

// 通过联系人数据计算展示头像
export const useContactAvatar = (props: AvatarProps) => {
  const { model, email: _email, name, emailTxt, avatar: defaultAvatar = '', logcAvatar = '', color: defaultColor = '', showAvatarFirst = true } = props;
  const email = _email?.toLocaleLowerCase();

  const res: AvatarRes = {
    avatar: defaultAvatar,
    avatarTxt: '',
    avatarPendant: '',
    color: defaultColor,
  };
  if (model) {
    const { avatar, avatarPendant, contactName, color } = model.contact;
    res.avatarTxt = contactName || contactApi.doGetModelDisplayEmail(model);
    res.avatar = showAvatarFirst && avatar ? avatar : '';
    res.avatarPendant = avatarPendant || '';
    res.color = color || contactApi.getColor(email || contactName);
  } else {
    res.avatarTxt = name || emailTxt || '';
    if (!defaultColor) {
      res.color = contactApi.getColor(email || emailTxt || '');
    }
  }
  res.avatar = showAvatarFirst ? res.avatar || logcAvatar : '';
  return res;
};

// 聚合客户详情中用来对比的keys
const getCustomerDetailKeys = (list: ICustomerModel[]) => {
  let ids = '',
    names = '',
    contactIds = '',
    contactNames = '',
    managerIds = '';
  list?.forEach(detail => {
    if (detail) {
      const { curIds, curNames } = detail.contactList?.reduce(
        (obj, cur) => {
          let { curIds, curNames } = obj;
          curIds += cur.id;
          curNames += cur.name;
          return { curIds, curNames };
        },
        { curIds: '', curNames: '' }
      );
      const mIds = detail.managerList?.reduce((str, cur) => {
        str += cur.managerId;
        return str;
      }, '');
      ids += detail.id;
      names += detail.orgName;
      contactIds += curIds;
      contactNames += curNames;
      contactIds += curIds;
      contactNames += curNames;
      managerIds += mIds;
    }
  });
  return {
    ids,
    names,
    contactIds,
    contactNames,
    managerIds,
  };
};

// 对比我的客户列表详情数据是否一致
const compareCustomerList = (left: ICustomerModel[], right: ICustomerModel[]) => {
  const { ids: leftIds, names: leftNames, contactIds: leftContactIds, contactNames: leftContactNames, managerIds: leftManagerIds } = getCustomerDetailKeys(left);
  const { ids: rightIds, names: rightNames, contactIds: rightContactIds, contactNames: rightContactNames, managerIds: rightManagerIds } = getCustomerDetailKeys(right);
  if (leftIds !== rightIds) {
    return false;
  }
  if (leftNames !== rightNames) {
    return false;
  }
  if (leftContactIds !== rightContactIds) {
    return false;
  }
  if (leftContactNames !== rightContactNames) {
    return false;
  }
  if (leftManagerIds !== rightManagerIds) {
    return false;
  }
  return true;
};

// 通过客户id获取详情
export const useMyCustomerList = (idList: CustomerId[]): ICustomerModel[] => {
  return useAppSelector(
    state => {
      const customerMap = state.contactReducer.customerMap;
      const detailList: ICustomerModel[] = [];
      idList.forEach(id => {
        const detail = customerMap[id];
        if (detail) {
          detailList.push(detail);
        }
      });
      return detailList;
    },
    (left, right) => compareCustomerList(left, right)
  );
};

// 通过客户id以callback方式获取详情
export const useMyCustomerListCallback = (idList: string[], callback: (list: ICustomerModel[]) => void) => {
  const customerMap = useAppSelector(state => state.contactReducer.customerMap, userAppSelectorShallowEqual);
  const lastData = useRef<ICustomerModel[]>([]);
  const ids = idList.reduce((str, id) => {
    str += id;
    return str;
  }, '');
  useEffect(() => {
    const detailList: ICustomerModel[] = [];
    idList.forEach(id => {
      const detail = customerMap[id];
      if (detail) {
        detailList.push(detail);
      }
    });
    const isEqual = compareCustomerList(lastData.current, detailList);
    if (!isEqual) {
      callback(detailList);
      lastData.current = detailList;
    }
  }, [customerMap, ids]);
};
