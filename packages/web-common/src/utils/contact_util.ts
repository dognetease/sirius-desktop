import React from 'react';
import { navigate } from 'gatsby';
import {
  apiHolder,
  apis,
  ContactApi,
  ContactInfoType,
  ContactModel,
  ContactType,
  EntityContact,
  EntityContactItem,
  EntityOrg,
  EntityOrgTeamContact,
  EntityTeamOrg,
  MailBoxEntryContactInfoModel,
  MemberType,
  OrgApi,
  OrgListOption,
  OrgModel,
  ParsedContact,
  SearchCondition,
  util,
  ContactTreeType as IContactTreeType,
  ContactItem as IContactItem,
  OrgItem as IOrgItem,
  CustomerRole,
  AccountApi,
  ServerCustomerModel,
  ServerCustomerContactModel,
  CustomerOrgType,
  ICustomerContactModel,
  ICustomerModel,
  ICustomerManagerModel,
  ICustomerLabelModel,
  ISimpleCustomerConatctModel,
  EmailRoles,
  MailPlusCustomerApi,
  EmailRoleBase,
  CustomerOrgModel,
  CustomerDetail,
  LabelModel,
} from 'api';
import { DataNode } from 'antd/lib/tree';
import { UIContactModel } from '@web-contact/data';
import { filterSameEmailAndHitQueryContact } from '@web-common/components/util/contact';
import isEqual from 'lodash/isEqual';
import lodashGet from 'lodash/get';
import lodashZip from 'lodash/zip';
import { getIn18Text } from 'api';
import { RequireICustomerContactModel } from '@web-common/state/reducer/contactReducer';

export type ContactItem = IContactItem;
export type ContactTreeType = IContactTreeType;
export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
export const systemApi = apiHolder.api.getSystemApi();
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailPlusCustomerApi = apiHolder.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

// const inEdm = systemApi.inEdm();
export interface ContactDataNode extends DataNode {
  value?: UIContactModel;
}

export interface OrgDataNode extends DataNode {
  value?: EntityOrg | EntityTeamOrg;
}

/**
 * 组织企业通讯录数据构建成树（只包含组织节点）
 * @param data
 * @returns {DataNode}
 */
export const data2Tree = (data: OrgModel): OrgDataNode => {
  const treeNode: OrgDataNode = {
    key: data.org.id,
    value: data.org,
    title: data.org.orgName,
    isLeaf: false,
  };
  if (data.children && data.children.length > 0) {
    treeNode.children = data.children.map(data2Tree);
  }
  return treeNode;
};
/**
 * 构造通讯录的叶节点
 * @param data
 * @param type
 */
export const data2Leaf = (data: UIContactModel, type: ContactInfoType) => {
  let leafNode: ContactDataNode;
  const infos = data.contactInfo.filter(info => info.contactItemType === type && info.contactItemVal);
  if (infos.length === 1) {
    const key = data.contact.id;
    leafNode = {
      key,
      title: React.createElement(React.Fragment, null, data.contact.contactName),
      // 阻止antd自动生成tree node的title属性
      isLeaf: true,
      value: data, // 传入原始数据
    };
  } else {
    // 多邮箱情况
    leafNode = {
      key: data.contact.id,
      title: React.createElement(React.Fragment, null, data.contact.contactName),
      isLeaf: false,
      children: infos.map(info => ({
        key: `${data.contact.id}|${info.contactItemVal}`,
        title: React.createElement(React.Fragment, null, info.contactItemVal),
        isLeaf: true,
        value: {
          ...data,
          contactInfo: [info],
        },
      })),
    };
  }
  return leafNode;
};

export enum StaticNodeKey {
  PERSON = 'person',
  PERSON_ALL = 'personal_all',
  PERSON_NO_GROUP = 'personal_no_group',
  CORP = 'corp',
  GROUP = 'group',
  PERSON_MARK_LIST = 'personal_mark_list',
}

export enum StaticRootNodeKey {
  PERSON = 'personalRoot',
  ENTERPRISE = 'enterpriseRoot',
  TEAM = 'teamRoot',
  RECENT = 'recentRoot',
  CUSTOMER = 'customerRoot',
}

export enum SearchGroupKey {
  ALL,
  CORP,
  PERSON,
  TEAM,
}

/**
 * 更新个人通讯录树
 * @param list
 * @param children
 */
export const updatePersonTreeData = (list: DataNode[], children: DataNode[]): DataNode[] =>
  list.map(node => {
    if (node.key === StaticNodeKey.PERSON_ALL) {
      return {
        ...node,
        title: `${getIn18Text('SUOYOULIANXIREN11')}（${children.length}）`,
        children: (node.children || []).concat(children),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updatePersonTreeData(node.children, children),
      };
    }
    return node;
  });
/**
 * 更新企业通讯录树
 * @param list
 * @param key
 * @param children
 */
export const updateOrgTreeData = <T extends DataNode>(list: T[], key: React.Key, child: T[], noChildToLeaf?: boolean): T[] => {
  return list.map(node => {
    if (node.key === key) {
      const children = (node.children || []).concat(child);
      if (children.length === 0 && noChildToLeaf) {
        return {
          ...node,
          isLeaf: true,
          children,
        };
      }
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateOrgTreeData(node.children, key, child, noChildToLeaf),
      };
    }
    return node;
  });
};
export const EntityContact2ContactModel = (contact: EntityContact): ContactModel => ({
  contact,
  contactInfo: [],
});
export const getCharAvatar = (name: string | undefined = '') => name.charAt(0).toLocaleUpperCase();
export const contact4ui = (list?: ContactModel[], pointLabel?: boolean) => {
  const labels = new Set();
  if (!list) {
    return [];
  }
  return list.map(item => {
    const r: UIContactModel = {
      ...item,
    };
    r.contact.defaultEmail = item.contact.accountName;
    r.contact.charAvatar = getCharAvatar(item.contact.contactName);
    if (pointLabel) {
      if (!labels.has(r.contact.contactLabel)) {
        r.contact.labelPoint = true;
        labels.add(r.contact.contactLabel);
      }
    }
    return r;
  });
};
// 添加优先级最高的用户
export const teamAddTopUser = async (list: EntityTeamOrg[]) => {
  const idList = list.map(item => item.id);
  const params = {
    idList,
    needGroup: true,
    needContactData: true,
    needContactModelData: false,
  };
  const res = (await contactApi.doGetOrgContactListByTeamId(params)) as Array<EntityOrgTeamContact[]>;
  res.forEach((contactArr, index) => {
    const ownerArr: EntityOrgTeamContact[] = [];
    const managerArr: EntityOrgTeamContact[] = [];
    const normalArr: EntityOrgTeamContact[] = [];
    contactArr.forEach(contact => {
      switch (contact.type) {
        case 'owner':
          ownerArr.push(contact);
          break;
        case 'manager':
          managerArr.push(contact);
          break;
        case 'normal':
          normalArr.push(contact);
          break;
        default:
          break;
      }
    });
    // @ts-ignore 邹明亮 @chengxufa 为什么直接修改群类型的属性
    list[index].topUsers = [...ownerArr, ...managerArr, ...normalArr].splice(0, 3);
  });
};
export const getContact = async (orgId?: string) => {
  const list = await contactApi.doGetContactByOrgId({ orgId });
  return contact4ui(list);
};
/**
 * 获取一个组织下的所有个人通讯信息
 * @param node
 * @param level 遍历层级深度
 */
export const getAllPersonContact = async (node: DataNode, level: number = 1) => {
  const { key, children = [] } = node;
  let ret: any[] = (await getContact(String(key))) || [];
  if (level <= 0) {
    return ret;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const child of children) {
    if (!child.isLeaf && child.children?.length) {
      // eslint-disable-next-line no-await-in-loop
      const list = await getAllPersonContact(child, level - 1);
      ret = ret.concat(list);
    } else if (!child.isLeaf) {
      // eslint-disable-next-line no-await-in-loop
      const list = (await getContact(String(child.key))) || [];
      ret = ret.concat(list);
    }
  }
  return ret;
};
export const getPersonContact = async (options = {}) => {
  const data = await contactApi.doGetPersonalContact(options);
  return contact4ui(data, !0);
};
export const getOrgs = async (options = {}) => {
  const orgData = await contactApi.doGetContactOrg(options);
  return orgData;
  // return {
  //   org: {
  //     orgName: '111'
  //   },
  //   children: []
  // }
};

/**
 * @deprecated:无人调用 1.27版本之后废弃
 * @Description: 获取组织结构
 * @param key
 * @returns
 */
export const getOrgNode = async (key?: string): Promise<DataNode> => {
  const orgData = await contactApi.doGet(key);
  return data2Tree(orgData);
  // return data2Tree({
  //   org: {
  //     orgName: '111',
  //     id:'111'
  //   } as EntityOrg,
  //   children: []
  // });
};
export const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// $&表示整个被匹配的字符串
export const getContactById = async (id: string | string[]) => {
  const data = await contactApi.doGetContactById(id);
  const list = contact4ui(data);
  return list;
};
/**
 * 根据id和类型搜索部门组织
 * @param id
 * @returns
 */
export const getOrgById = async (id: string | string[], type: '' | 'origin') => {
  const req = type === 'origin' ? { originIdList: id } : { idList: id };
  const data = await contactApi.doGetOrgList(req as OrgListOption);
  return data;
};
/**
 * 根据origin id搜索部门组织
 * @param id
 * @returns
 */
export const getOrgByOriginId = async (id: string | string[]) => getOrgById(id, 'origin');
/**
 * 根据id搜索群组
 * @param list 群组id列表
 * @returns
 */
export const getTeamById = async (list: string[]) => {
  const data = await contactApi.doGetTeamList(list);
  await teamAddTopUser(data);
  return data;
};
/**
 * 搜索联系人、组织、群组
 * @param option
 * @returns
 */
export const searchContact = async (option: SearchCondition) => {
  // searchContact1(option);
  const { query, isIM = false, filter, showDisable, noRelateEnterprise } = option;
  if (!query) {
    return null;
  }
  const data = await contactApi.doSearchAllContact({
    query,
    showDisable,
    isIM,
    filter,
    noRelateEnterprise,
  });
  console.log('2222---doSearchAllContact', data);
  await teamAddTopUser(data.teamList);
  return {
    [SearchGroupKey.CORP]: data.orgList,
    [SearchGroupKey.PERSON]: contact4ui(data.contactList),
    [SearchGroupKey.TEAM]: data.teamList,
  };
};

// 搜索联系人
export const getSearchContact = async (searchValue: string, isIM?: boolean, noLock?: boolean) => {
  if (!searchValue) {
    return null;
  }
  const data = await contactApi.doSearchContact(searchValue, isIM, noLock);
  const list = contact4ui(data);
  return {
    [SearchGroupKey.ALL]: list,
    [SearchGroupKey.CORP]: list.filter(e => e && e.contact && e.contact.type === 'enterprise'),
    [SearchGroupKey.PERSON]: list.filter(e => e && e.contact && e.contact.type === 'personal'),
  };
};
export const getSearchAllContact = async (option: SearchCondition) => {
  const { query, showDisable, isIM } = option;
  const data = await contactApi.doSearchAllContact({ query, showDisable, isIM });
  data.contactList = filterSameEmailAndHitQueryContact(data.contactList);
  return data;
};
export const getSearchAllContactInWriteMail = async (option: SearchCondition) => {
  const { query, showDisable, isIM, curAccountId, flattenMuliptleEmails } = option;
  const _account = curAccountId || systemApi.getCurrentUser()?.id;
  // const { main, edm } = await contactApi.doSearchNew({
  const { main, edm } = await contactApi.doSearchAllContactNew({
    query,
    showDisable,
    isIM,
    useFrequentOrder: true,
    useEdmData: process.env.BUILD_ISEDM,
    _account,
    flattenMuliptleEmails,
    maxItem: 100,
  });

  // 查询个人分组通讯录数量
  const personalorgIdsWithAccount: Record<string, string[]> = {};

  if (_account && Reflect.has(main, _account)) {
    personalorgIdsWithAccount[_account] = (lodashGet(main, `['${_account}'].personalOrgList`, []) as EntityOrg[]).map(item => {
      return item.id;
    });
  } else {
    Object.keys(main).forEach(subEmail => {
      personalorgIdsWithAccount[subEmail] = (lodashGet(main, `['${subEmail}'].personalOrgList`, []) as EntityOrg[]).map(item => {
        return item.id;
      });
    });
  }

  // 执行查询
  try {
    const accountList = Object.keys(personalorgIdsWithAccount);
    const promiseRequestList = accountList.map(_account => {
      return contactApi.queryPersonalMemberCount(personalorgIdsWithAccount[_account]!, _account);
    });

    const res = await Promise.all(promiseRequestList);

    const countMap = new Map(lodashZip(accountList, res)) as Map<string, Record<string, number>>;

    for (let subEmail in main) {
      if (!countMap.has(subEmail) || !main[subEmail].personalOrgList) {
        return;
      }

      main[subEmail].personalOrgList = main[subEmail].personalOrgList
        .filter(orgItem => {
          const { id } = orgItem;
          return lodashGet(countMap.get(subEmail), `${id}`, 0) as number;
        })
        .map(orgItem => {
          const { id } = orgItem;
          orgItem.orgName = `${orgItem.orgName}(联系组)`;
          orgItem.memberNum = lodashGet(countMap.get(subEmail), `${id}`, 0) as number;
          return orgItem;
        });
    }
  } catch (ex) {}

  if (_account) {
    return {
      data: main[_account] ? [main[_account]] : [],
      edm,
    };
  } else {
    return {
      data: Object.values(main) || [],
      edm,
    };
  }
};
export const syncAll = async (force?: boolean) => {
  const orgData = await contactApi.syncAll(force);
  return [orgData];
};
export const getDisplayEmailInfo = (list: EntityContactItem[]): EntityContactItem[] => {
  return list.filter(item => item.contactItemType === 'EMAIL' && !(item.type === 'enterprise' && !item.isDefault));
};
/**
 * 转换头像的大小
 * @param avatar 头像地址必须是 sizeMap定义的大小
 * @param type 需要转换成的大小()
 */
export type AvatarSizeType = 'big' | 'middle' | 'small' | 'mini';
export const transAvatarSize = (avatar: string, type: AvatarSizeType): string => {
  const sizeMap: Record<AvatarSizeType, string> = {
    mini: '32x32',
    small: '80x80',
    middle: '180x180',
    big: '480x480',
  };
  let curAvatarSize;
  Object.values(sizeMap).forEach(item => {
    if (avatar.includes(item)) {
      curAvatarSize = item;
    }
  });
  if (!curAvatarSize) {
    throw new Error(getIn18Text('BIXUCHUANRU3'));
  }
  return avatar.replace(curAvatarSize, sizeMap[type]);
};

// export interface ContactItem {
//   id?: string;
//   type: ContactTreeType;
//   avatar?: string;
//   name: string;
//   email: string;
//   accountType?: number;
//   position?: string[][];
//   customerRole?: CustomerRole,
//   createTime?: number,
//   hitQuery?: string[],
//   /**
//    * 头像挂饰
//    */
//   avatarPendant?: string;
//   mailMemberType?: MemberType;
// }

export type ContactTreeOrgType = 'org' | 'team' | 'personalOrg' | 'customer' | 'clue';

export type OrgItem = IOrgItem;

// 对比出权重最大的联系人信息，外贸通0510，非主账号支持客户，isMainAccount不再需要，后续可考虑删除
export const getValidEmail = (pre: ContactItem, cur: ContactItem, isMainAccount = true): ContactItem => {
  // 可对比的属性
  const compareArr: Array<keyof ContactItem> = ['type', 'customerRole', 'createTime', 'id'];
  // 属性不同值的权重
  const compareMap: Record<string, any> = {
    // 企业联系人 > 客户联系人 > 线上联系人 > 个人通讯录 > 其他
    type: {
      enterprise: 5,
      customer: 4,
      clue: 3,
      personal: 2,
      external: 1,
      team: -1,
      recent: -1,
    },
    customerRole: {
      manager: 4,
      colleague: 3,
      openSea: 2,
      other: 1,
      undefined: 0,
    },
    status: {
      '1': 1,
      '2': 1,
      '3': 1,
      '4': 0,
      '5': 1,
    },
  };
  let result: ContactItem | undefined;
  compareArr.forEach(prop => {
    if (!result && pre[prop] !== cur[prop]) {
      // 当前值
      let value = pre[prop];
      let value2 = cur[prop];
      // 当前映射
      const obj = compareMap[prop];
      if (obj) {
        // 非主账号 客户/线索
        // if (!isMainAccount && (value === 'customer' || value === 'clue')){
        //   value = '0'
        // } else{
        //   value = obj[value + ''];
        // }
        // if (!isMainAccount && (value2 === 'customer' || value2 === 'clue')){
        //   value2 = '0'
        // } else{
        //   value2 = obj[value2 + ''];
        // }
        // 外贸通0510:非主账号， 客户/线索也参与排序
        value = obj[value + ''];
        value2 = obj[value2 + ''];
      }
      if (value && value2) {
        // pre 对比 cur
        result = value.toString().localeCompare(value2.toString(), 'zh') >= 0 ? pre : cur;
      }
    }
  });
  return result || pre;
};

// export const getValidEmail = (pre: ContactItem, cur: ContactItem): ContactItem => {
//   if (pre.id && cur.id) {
//     if(systemApi.inEdm()){
//       if(pre.type === 'customer' && cur.type === 'customer'){
//
//       }
//     }
//     if (pre.type === 'enterprise' && cur.type === 'enterprise') {
//       // 对比是不是邮件列表
//       if (pre.accountType !== undefined) {
//         if (contactApi.isMailListByAccountType(pre.accountType)) {
//           return cur;
//         } else {
//           return pre;
//         }
//       } else if (cur.accountType !== undefined) {
//         if (contactApi.isMailListByAccountType(cur.accountType)) {
//           return pre;
//         } else {
//           return cur;
//         }
//       } else {
//         return cur.id.toString().localeCompare(pre.id.toString(), 'zh') >= 0 ? cur : pre;
//       }
//     } else {
//       if (pre.type === 'enterprise') {
//         return pre;
//       } else if (cur.type === 'enterprise') {
//         return cur;
//       } else if (pre.type === 'personal' && cur.type === 'personal') {
//         return cur.id.toString().localeCompare(pre.id.toString(), 'zh') >= 0 ? cur : pre;
//       } else if (pre.type === 'personal') {
//         return pre;
//       } else if (cur.type === 'personal') {
//         return cur;
//       } else {
//         return cur.id.toString().localeCompare(pre.id.toString(), 'zh') >= 0 ? cur : pre;
//       }
//     }
//   } else {
//     if (pre.id) {
//       return pre;
//     } else if (cur.id) {
//       return cur;
//     } else if (pre.name !== pre.email) {
//       return cur;
//     } else {
//       return pre;
//     }
//   }
// };
export const getDisplayContactItem = (list: ContactItem[], type?: ContactTreeType, _account?: string): ContactItem | undefined => {
  let selectContactItem: ContactItem | undefined;
  // 根据传入的type过滤一次
  let filterList = type ? list.filter(item => type === item.type) : list;
  // 根据传入的account过滤一次，取当前账号和客户信息即可
  if (_account) {
    filterList = filterList.filter(item => {
      return accountApi.getIsSameSubAccountSync(_account, item._account || '') || item.type === 'customer' || item.type === 'clue';
    });
  }
  filterList.forEach(item => {
    if (selectContactItem) {
      selectContactItem = getValidEmail(selectContactItem, item);
    } else {
      selectContactItem = item;
    }
  });
  return selectContactItem;
};

// 此方法，外贸通0715后应该是没地方用到了
export const customerTypeToText = (item: { type: ContactTreeType; customerRole?: CustomerRole }): string => {
  let res = '';
  if (item.type === 'customer') {
    res += item.customerRole === 'manager' ? getIn18Text('mine') : getIn18Text('colleague');
    res += getIn18Text('customer');
  } else if (item.type === 'clue') {
    res += item.customerRole === 'manager' ? getIn18Text('mine') : getIn18Text('colleague');
    res += getIn18Text('clue');
  }
  return res;
};
// 根据类型，返回标签文本
export const emailRoleToText = (emailRole?: EmailRoles): string => {
  const obj: Partial<Record<EmailRoles, string>> = {
    myClue: getIn18Text('WODEXIANSUO'),
    myCustomer: getIn18Text('WODEKEHU'),
    colleagueClue: getIn18Text('TONGSHIXIANSUO'),
    colleagueClueNoAuth: getIn18Text('TONGSHIXIANSUO'),
    colleagueCustomer: getIn18Text('TONGSHIKEHU'),
    colleagueCustomerNoAuth: getIn18Text('TONGSHIKEHU'),
    openSeaClue: getIn18Text('GONGHAIXIANSUO'),
    openSeaCustomer: getIn18Text('GONGHAIKEHU'),
  };
  return emailRole ? obj[emailRole] || '' : '';
};

export const buildContactModel = (
  item: ContactItem,
  reduxParams?: {
    reduxUpdateTime?: number;
    isFull?: boolean;
    _account?: string;
  }
): ContactModel => {
  const type = ['enterprise', 'personal', 'customer', 'clue', 'external'].includes(item.type) ? (item.type as ContactType) : 'external';
  const name = item.name || item.email;
  const model: ContactModel = {
    contact: {
      id: item.id || '',
      contactName: name,
      accountName: item.email,
      visibleCode: 0,
      contactPYName: util.toPinyin(name),
      contactLabel: util.getContactLabel(name),
      contactPYLabelName: util.getContactPYLabel(name),
      accountType: 2,
      accountId: '',
      displayEmail: item.email,
      enableIM: false,
      type,
      color: util.getColor(item.email),
      _lastUpdateTime: Date.now(),
    },
    contactInfo: [
      {
        id: item.id || '',
        contactItemType: 'EMAIL',
        contactId: '',
        contactItemVal: item.email,
        type,
        isDefault: 1,
        contactItemRefer: '',
        _lastUpdateTime: Date.now(),
      },
    ],
    _account: item._account,
  };
  return Object.assign(model, reduxParams || {});
};

export const transMailContactModel2ContactItem = (item: MailBoxEntryContactInfoModel): ContactItem => {
  const model = item?.contact;
  const { id, type, avatar, contactName, position, accountType } = model?.contact || {};
  const email = contactApi.doGetModelDisplayEmail(model);
  return {
    id,
    type,
    avatar,
    name: contactName,
    email,
    position,
    accountType,
    customerRole: model?.customerOrgModel?.role,
    createTime: model?.customerOrgModel?.createTime,
    mailMemberType: item.mailMemberType,
  };
};

export const buildContactItem = (item: ParsedContact): ContactItem => {
  const { email, name, type } = item;
  return {
    email,
    name: name || email,
    mailMemberType: type,
    type: 'external',
  };
};

export const transContactItem2MailContactModel = (item: ContactItem): MailBoxEntryContactInfoModel => {
  // const {id, email, name, mailMemberType, type} = item;
  const model = buildContactModel(item);
  return {
    /**
     * 联系人信息
     */
    contact: model,
    /**
     * 联系人使用的email信息
     */
    contactItem: model.contactInfo[0],
    /**
     * 发送、抄送、密送
     */
    mailMemberType: item.mailMemberType || 'to',
    /**
     * 是否在通讯录中
     */
    inContactBook: item.type !== 'external',
  } as MailBoxEntryContactInfoModel;
};

export const transContactModel2MailContactModel = (item: ContactModel, receiverType: MemberType): MailBoxEntryContactInfoModel => {
  const email = contactApi.doGetModelDisplayEmail(item);
  const hitQueryEmailFirst = lodashGet(item, 'contact.hitQueryEmail.length', 0) && item.contact.type === 'personal';
  // 1.25郭超 目的是为了寻找hitQueryEmail对应的contactItem作为receiveremail
  const cHitqueryEmailItem = hitQueryEmailFirst
    ? item.contactInfo.find(info => {
        if (info.contactItemType !== 'EMAIL') {
          return false;
        }
        return info.contactItemVal.toLocaleLowerCase() === email;
      })
    : null;
  const cItem =
    cHitqueryEmailItem ||
    item.contactInfo.find(info => {
      return info.contactItemType === 'EMAIL' && info.isDefault === 1;
    });

  const contactInfo: EntityContactItem = {
    id: '',
    contactId: item.contact.id,
    contactItemType: 'EMAIL',
    contactItemVal: contactApi.doGetModelDisplayEmail(item),
    contactItemRefer: '',
    type: item.contact.type,
    isDefault: 1,
    _lastUpdateTime: Date.now(),
  };
  return {
    contact: item,
    mailMemberType: receiverType,
    contactItem: cItem || contactInfo,
    inContactBook: item.contact.type !== 'external',
  };
};

export const transServerCustomerContact2CustomerContactModel = (item: ServerCustomerContactModel, type: CustomerOrgType): ICustomerContactModel => {
  const { contact_id: id, contact_name, contact_icon: avatar, email: account, main_contact: mainContact, ...extra } = item;
  const name = contact_name || account;
  const contactPYName = util.toPinyin(name);
  const contactLabel = util.getContactLabel(contactPYName);
  const _lastUpdateTime = Date.now();
  return {
    ...extra,
    id,
    originId: id,
    name,
    contactPYName,
    contactPYLabelName: '',
    contactLabel,
    avatar,
    account,
    _lastUpdateTime,
    mainContact,
    customerType: type,
    _company: '',
  };
};
export const transServerCustomerContact2ContactModel = (params: {
  item: ServerCustomerContactModel;
  id: string;
  type: CustomerOrgType;
  role: EmailRoles;
}): RequireICustomerContactModel => {
  const { item, type, role, id } = params;
  const currentModel = transServerCustomerContact2CustomerContactModel(item, type);
  const contact: EntityContact = {
    id: currentModel.id,
    contactName: currentModel.name,
    contactLabel: currentModel.contactLabel,
    contactPYName: currentModel.contactPYName,
    contactPYLabelName: currentModel.contactPYLabelName,
    accountName: currentModel.account,
    displayEmail: currentModel.account,
    visibleCode: 0,
    enableIM: false,
    accountType: 2,
    type,
    accountId: currentModel.id,
    _lastUpdateTime: currentModel._lastUpdateTime,
  };
  const contactInfo: EntityContactItem[] = [
    {
      id: '',
      contactId: currentModel.id,
      contactItemType: 'EMAIL',
      contactItemVal: currentModel.account,
      isDefault: 1,
      type,
      contactItemRefer: '',
      _lastUpdateTime: currentModel._lastUpdateTime,
    },
  ];
  return {
    contact,
    contactInfo: contactInfo,
    customerOrgModel: {
      role: role,
      companyId: id,
      currentModel,
    },
    isFull: true,
  };
};

export const transServerCustomer2CustomerModel = (item: ServerCustomerModel): ICustomerModel => {
  const {
    company_name: orgName,
    company_number: number,
    company_domain: domain,
    short_name: shortName,
    source_name: sourceName,
    source,
    company_level: cLevel,
    company_level_name: cLevelName,
    contact_list,
    manager_list,
    label_list,
    star_level: starLevel,
    company_id: id,
    originCompanyId,
    area,
    create_time,
    main_contact,
    ...extra
  } = item;
  let contactList: ISimpleCustomerConatctModel[] = contact_list?.map(contact => {
    return {
      id: contact.contact_id,
      email: contact.email,
      name: contact.contact_name,
      isMain: contact.main_contact,
    };
  });
  // 如果联系人列表不存在，并且主联系人存在，线索的场景
  if (!contact_list && main_contact) {
    contactList = [
      {
        id: main_contact.contact_id,
        email: main_contact.email,
        name: main_contact.contact_name,
        isMain: main_contact.main_contact,
      },
    ];
  }
  const managerNames: string[] = [];
  const managerList: ICustomerManagerModel[] = manager_list?.map(manager => {
    managerNames.push(manager.name);
    return {
      managerId: manager.id,
      // 负责人email
      managerAccount: manager.email,
      // 负责人姓名+邮箱, 格式: 张三(zhangsan@lx.net.com)
      managerName: manager.name,
      // 负责人头像
      iconUrl: manager.iconUrl,
      // 最后沟通时间
      lastMailTime: manager.lastMailTime,
      // 负责人姓名
      managerOriginName: manager.manager_name,
    };
  });
  const labelList: ICustomerLabelModel[] = label_list?.map(label => {
    const {
      label_id: id,
      label_name: name = '',
      label_color: color = '',
      // 如果有这个字段则取这个字段，这个字段取label_color
      label_color_origin,
      label_create_time: createTime = 0,
      label_type: type = 0,
      label_company_count: companyCount,
      label_contact_count: contactCount,
      label_remark: remark,
      create_account: createAccount,
      create_account_id: createAccountId,
    } = label;
    return {
      // 客户/客户联系人 标签Id
      id: id as unknown as string,
      // 标签名称
      name,
      // 标签类型，0-客户个人标签，1-联系人标签
      type,
      // 标签颜色
      color: label_color_origin || color,
      // 标签创建时间
      createTime,
      // 标签备注
      remark,
      // 标签下企业数量
      companyCount,
      // 标签下联系人数量
      contactCount,
      // 标签创建人id
      createAccountId,
      // 标签创建人信息
      createAccount,
    };
  });
  const orgPYName = util.toPinyin(orgName);
  return {
    ...extra,
    createTime: create_time,
    shortName,
    area: Array.isArray(area)
      ? area.reduce((str, cur) => {
          if (cur) {
            str = (str ? str + '-' : '') + cur;
          }
          return str;
        }, '')
      : area, // 地
    domain,
    website: item.website,
    cLevel: cLevel as unknown as string, // 等级
    cLevelName,
    number,
    starLevel: starLevel as unknown as string, // 公司星级
    companyName: orgName,
    id,
    originCompanyId: originCompanyId || id,
    originId: id,
    orgName,
    orgPYName,
    parent: 'customer',
    type: 2003,
    orgRank: Number(create_time),
    visibleCode: 0,
    contactList,
    managerList,
    labelList,
    managerNames,
    labelNames: [],
    _lastUpdateTime: Date.now(),
    sourceName: sourceName,
    sourceId: source + '',
  };
};

export const transServerCustomerModel = (list: ServerCustomerModel[], type?: CustomerOrgType) => {
  const contactMap: Record<string, RequireICustomerContactModel[]> = {};
  const customerMap: Record<string, ICustomerModel> = {};
  const customerContactList: RequireICustomerContactModel[] = [],
    customerList: ICustomerModel[] = [];
  list?.forEach(item => {
    // 判断返回的客户是否带上联系人email,不存在的话则过滤当前客户 @zoumingliang-0727
    // TODO, 分页我的客户列表，分页获取联系人列表， 分页获取联系人列表前，需要解决上面不存在email过滤我的客户情况
    // 线索详情接口，没有contact_list，main_contact也存在无email的情况，单独处理下
    if (item?.company_type === 'clue') {
      // 线索逻辑，不再判断是否有email
      const model = transServerCustomer2CustomerModel(item);
      const customerId = model?.id;
      if (customerId) {
        customerMap[customerId] = model;
        customerList.push(model);
        const currentContactList: RequireICustomerContactModel[] = [];
        // 获取客户详情对应的email权限
        const customerRole = mailPlusCustomerApi.doGetCustomerRoleByModel(item);
        item.contact_list?.forEach(contact => {
          // 转换服务端客户的联系人数据为redux的联系人数据
          if (contact.email) {
            const contactData = transServerCustomerContact2ContactModel({
              item: contact,
              type: type || item.company_type || 'customer',
              id: model.id,
              role: customerRole,
            });
            currentContactList.push(contactData);
            customerContactList.push(contactData);
          }
        });
        contactMap[customerId] = currentContactList;
      }
    } else {
      // 客户逻辑
      const hasEmail = !!item.contact_list?.some(curContact => curContact.email) || !!item.main_contact?.email;
      if (hasEmail) {
        const model = transServerCustomer2CustomerModel(item);
        const customerId = model?.id;
        if (customerId) {
          customerMap[customerId] = model;
          customerList.push(model);
          const currentContactList: RequireICustomerContactModel[] = [];
          // 获取客户详情对应的email权限
          const customerRole = mailPlusCustomerApi.doGetCustomerRoleByModel(item);
          item.contact_list?.forEach(contact => {
            // 转换服务端客户的联系人数据为redux的联系人数据
            const contactData = transServerCustomerContact2ContactModel({
              item: contact,
              type: type || item.company_type || 'customer',
              id: model.id,
              role: customerRole,
            });
            currentContactList.push(contactData);
            customerContactList.push(contactData);
          });
          contactMap[customerId] = currentContactList;
        }
      }
    }
  });
  return {
    customerContactList,
    customerList,
    contactMap,
    customerMap,
  };
};

const parseEmailRole = (emailRole: EmailRoles): { type: ContactType; role?: CustomerRole; isEdm: boolean } => {
  const lxType = ['personal', 'enterprise', 'external'];
  const edmType: ContactType[] = ['customer', 'clue'];
  if (lxType.includes(emailRole)) {
    return {
      type: emailRole as ContactType,
      role: undefined,
      isEdm: false,
    };
  } else {
    const _emailRole = emailRole.toLocaleLowerCase();
    const res: { type: ContactType; role?: CustomerRole; isEdm: boolean } = {
      type: 'external',
      role: undefined,
      isEdm: false,
    };
    edmType.some(item => {
      const list = _emailRole.split(item);
      if (list.length > 1) {
        res.type = item;
        res.role = list[0] as CustomerRole;
        res.isEdm = true;
        return true;
      }
      return false;
    });
    return res;
  }
};

export const transEmailRoleBase2ContactModel = (item: EmailRoleBase): ContactModel => {
  const {
    role,
    email,
    companyId, // 客户ID、线索ID
    // companyName, // 客户名称、线索名称
    contactId: id, // 与 email 匹配的联系人Id
    contactName, // 与 email 匹配的联系人姓名
    contactAvatar, // 联系人头像
    customerCreateTime: createTime, // 客户创建时间
    relatedCompanyInfo, // 匹配到的其他客户、线索下信息
  } = item;
  const { type, isEdm } = parseEmailRole(role);
  const contactPYName = util.toPinyin(contactName);
  const contactLabel = util.getContactLabel(contactPYName);
  const _lastUpdateTime = Date.now();
  const contact: EntityContact = {
    id,
    contactName,
    contactLabel,
    contactPYName,
    contactPYLabelName: '',
    accountName: email,
    displayEmail: email,
    avatar: contactAvatar,
    visibleCode: 0,
    enableIM: false,
    accountType: 2,
    type: type,
    accountId: id,
    _lastUpdateTime,
  };
  const contactInfo: EntityContactItem[] = [
    {
      id: '',
      contactId: id,
      contactItemType: 'EMAIL',
      contactItemVal: email,
      isDefault: 1,
      type,
      contactItemRefer: '',
      _lastUpdateTime,
    },
  ];
  let customerOrgModel: CustomerOrgModel | undefined;
  if (isEdm) {
    customerOrgModel = {
      createTime,
      role,
      companyId,
      relatedCompanyInfo,
    };
  }
  return {
    contact,
    contactInfo,
    isFull: false,
    customerOrgModel,
  };
};

/**
 * 对比检查两个 ContactModel 是否有变化
 * @param oldVal ContactModel
 * @param newVal ContactModel
 * @returns boolean
 */
export const checkContactModelChange = (oldVal: ContactModel, newVal: ContactModel): boolean => {
  const { reduxUpdateTime: _u, ...prev } = oldVal || {};
  const { reduxUpdateTime, ...current } = newVal || {};
  if (prev && current) {
    return !isEqual(prev, current);
  }
  return true;
  // let hasChanged = false;
  // if (oldVal?.contact?.contactName !== newVal?.contact?.contactName){
  //   hasChanged = true;
  // } else if (oldVal?.contact?.accountName !== newVal?.contact?.accountName){
  //   hasChanged = true;
  // } else if (oldVal?.contact?.avatar !== newVal?.contact?.avatar){
  //   hasChanged = true;
  // } else if (oldVal?.contact?.avatarPendant !== newVal?.contact?.avatarPendant){
  //   hasChanged = true;
  // } else if (oldVal?.contact?.visibleCode !== newVal?.contact?.visibleCode){
  //   hasChanged = true;
  // }
  // return hasChanged;
};

export const jumpToContactPersonalMark = () => {
  navigate('/#contact', {
    state: {
      selectNodeKey: StaticNodeKey.PERSON_MARK_LIST,
    },
  });
};

export const transICustomerLabelModel2LabelModel = (labelList?: ICustomerLabelModel[]): LabelModel[] => {
  if (!Array.isArray(labelList) || !labelList.length) {
    return [];
  }
  const label_list = labelList?.map(i => {
    const { id, name, type, color, companyCount, createTime } = i;
    return {
      label_id: id,
      label_name: name,
      label_type: type,
      label_color_id: '',
      label_color: color,
      label_company_count: companyCount,
      label_create_time: +createTime,
    };
  });
  return label_list;
};

// 数据格式转换
export const transICustomerModel2CustomerDetail = (customerModel: ICustomerModel): CustomerDetail => {
  const {
    originCompanyId, // 公海客户的companyId，或者公海线索的线索id
    id, // 客户id
    area, // 地区
    zone, // 时区
    website, //? 网址
    cLevel, //? 客户等级
    cLevelName,
    number, //? 客户编号
    logo, //? 客户logo
    domain, // 客户公司域名
    companyName, // 公司名称
    shortName, //? 公司简称
    starLevel, //? 公司星级
    sourceName, // ?来源
    sourceId, // ?来源
    contactList, //ISimpleCustomerConatctModel[]; // 客户联系人id列表
    managerList, //ICustomerManagerModel[]; // 客户负责人列表
    labelList, // ICustomerLabelModel[]; // 客户标签列表
    createTime, //? 创建时间，时间戳类型
    create_by, //？ 创建人姓名
    create_by_id, //? 创建人id
    fax, //?: string;// 传真
    intent, // ?: number;客户意向单选项id
    main_industry, // ?: number;主行业单选项id
    purchase_amount, // ?: number;年采购额
    recent_follow_at, // ?: string;最近跟进时间
    recent_follow_by, // ?: string;最近跟进人姓名
    recent_follow_by_id, // ?: string;最近跟进人id
    require_product, // ?: string;需求商品描述
    scale, // ?: number;规模单选项id
    update_by, //?: string;更新人姓名
    update_by_id, // ?: string;更新人id
    update_time, // ?: string;// 更新时间
    status,
    leads_name,
    social_media,
    return_managers,
    return_remark,
    return_time,
    remark,
    address, // 公司地址
    telephone, // 电话
  } = customerModel;
  const label_list = transICustomerLabelModel2LabelModel(labelList);
  const res = {
    origin_company_id: originCompanyId,
    company_id: id,
    company_name: companyName,
    company_domain: domain,
    company_logo: logo || '',
    company_number: number || '',
    country: '', // 国家
    company_level: cLevel || '',
    company_level_name: cLevelName || '',
    area: area.split('-').filter(Boolean), // 地区可能需要整理下
    short_name: shortName || '',
    star_level: starLevel || '',
    intent: `${intent}`,
    label_list, //ICustomerLabelModel => LabelModel[];
    main_industry: `${main_industry}`,
    purchase_amount: `${purchase_amount}`,
    zone,
    scale: `${scale}`,
    fax: fax || '',
    telephone: telephone || '', // 客户电话暂时没有
    address: address || '', // 客户地址暂时没有
    remark: remark || '', // 暂无
    pictures: [], // 暂无
    sourceName: sourceName || '',
    source: sourceId || '',
    social_media, // 暂无 SocialPlatform[]
    contact_list: contactList?.map(i => {
      const { id, name, email, isMain } = i;
      return {
        contact_id: id,
        contact_name: name,
        main_contact: !!isMain,
        email,
        label_list,
        contact_icon: '',
        telephones: [],
        whats_app: '',
        social_platform: [],
        job: '',
        home_page: '',
        gender: '',
        birthday: '',
        remark: '',
        pictures: [],
        rejected: false,
        valid: true,
      };
    }), // ISimpleCustomerConatctModel => ContactDetail[];
    manager_list: managerList?.map(i => {
      const { managerId, managerName, managerOriginName } = i;
      return { name: managerName || '', manager_name: managerOriginName || '', id: managerId || '' };
    }), //ICustomerManagerModel => { name: string; manager_name: string; id: string }[];
    system_info: {
      create_time: createTime || '',
      create_user: create_by || '',
      create_user_id: create_by_id || '',
      update_time: update_time || '',
      update_user: update_by || '',
      update_user_id: update_by_id || '',
      moment_time: recent_follow_at || '',
      moment_user: recent_follow_by || '',
      moment_user_id: recent_follow_by_id || '',
    },
    require_product_type_label: require_product || '',
    product_require_level_label: '',
    edit_flag: true, // 是否可以编辑，先设置为可以，UI层自己控制
    website: website || '',
    status, // 线索状态
    leads_name, // 线索名称
    return_managers: return_managers?.map(i => {
      const { id, name, manager_name } = i;
      return { id, name, manager_name };
    }),
    return_time,
    return_remark,
  };
  return res;
};
