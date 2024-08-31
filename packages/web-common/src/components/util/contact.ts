import {
  apiHolder,
  apis,
  ContactApi,
  ContactModel,
  ContactOrgType,
  ContactSearch,
  CustomerContactSearch,
  CustomerOrg,
  CustomerOrgSearch,
  CustomerSearchContactMemoryRes,
  EntityClueOrg,
  EntityContact,
  EntityContactItem,
  EntityCustomerOrg,
  EntityOrg,
  EntityOrgTeamContact,
  EntityPersonalOrg,
  EntityScheduleAndContact,
  EntityTeamOrg,
  identityObject,
  OrgApi,
  OrgSearch,
  util,
  ContactItem,
  ContactOrgItem as IContactOrgItem,
  conf,
  api,
  ACCOUNT_EMAIL,
  EmailRoles,
  CustomerRole,
  getIn18Text,
  ContactDetail,
  ServerCustomerContactModel,
} from 'api';
import cloneDeep from 'lodash/cloneDeep';
import lodashCapitalize from 'lodash/capitalize';
import { DataNode } from 'antd/lib/tree';
// @ts-ignore
import { TeamMemberInfo } from '@web-im/subcontent/store/memberReduce';
import { ContactTreeOrgType, ContactTreeType, getValidEmail, OrgItem } from '@web-common/utils/contact_util';
import { emailPattern } from '@web-common/utils/constant';
import { doGetCustomerContactByCustomerIds } from '@web-common/state/reducer/contactReducer';

const env = conf('stage');

export type SearchContactType = 'all' | 'enterprise' | 'personal' | 'external';
export type ContactType = 'enterprise' | 'personal' | 'team' | 'recent' | 'external';
export type ContactSelectedMap = Record<ContactTreeType, Record<string, ContactItem>>;
export type ContactTreeOrgNodeType =
  | 'enterprise'
  | 'personal'
  | 'team'
  | 'recent'
  | 'clue'
  | 'customer'
  | 'personal_info'
  | 'external'
  | 'root'
  | 'separator'
  | 'other'
  | 'openSea';
export type ContactTreeLeafNodeType = 'enterprise' | 'recent' | 'personal' | 'external' | 'customer' | 'clue' | 'other';
export type ContactTreeNodeType = ContactTreeOrgNodeType | ContactTreeLeafNodeType | 'personal_info' | 'separator';

export interface ContactTreeOrgNode extends DataNode {
  key: string;
  title: string | React.ReactNode;
  isOrg: true;
  nodeType: ContactTreeType;
  orgInfo?: EntityOrg | EntityTeamOrg | EntityPersonalOrg | CustomerOrg;
  orgList?: EntityOrg[];
  children?: ContactTreeDataNode[];
  titleToolTip?: string;
}

export interface ContactTreeRoot extends DataNode {
  key: string;
  title: string;
  isOrg: true;
  nodeType: ContactTreeType;
  children?: ContactTreeDataNode[];
}

export interface ContactTreePersonalNode extends DataNode {
  key: string;
  title: string;
  isOrg: true;
  nodeType: 'personal_info';
  children: ContactTreeLeaf[];
}

export interface ContactTreeLeaf extends DataNode {
  key: string;
  title: string;
  isOrg: false;
  nodeType: ContactTreeLeafNodeType;
  data: ContactItem;
  isMailList?: boolean;
}

export interface ContactTreeNode extends DataNode {
  key: string;
  title: string;
  isOrg: true;
  nodeType: ContactTreeType;
  data?: EntityOrg | EntityTeamOrg | EntityPersonalOrg | CustomerOrg;
  item?: OrgItem;
  orgList?: EntityOrg[];
  children?: ContactTreeDataNode[];
  titleToolTip?: string;
  hasMore?: boolean;
}

export interface ContactTreeSeparatorLeaf extends DataNode {
  key: string;
  title: string;
  isOrg: false;
  nodeType: 'separator';
}

export type ContactTreeDataNode = ContactTreeOrgNode | ContactTreeLeaf | ContactTreePersonalNode | ContactTreeRoot;

export enum SearchGroupKey {
  ALL,
  CORP,
  PERSON,
}

// @ts-ignore
export interface UIContact extends EntityContact {
  id: string;
  type: ContactType;
  contactLabel: string;
  contactName: string;
  color?: string;
  charAvatar?: string;
  labelPoint?: boolean;
  defaultEmail?: string;
}

// @ts-ignore
export interface UIContactModel extends ContactModel {
  // contactInfo:EntityContactItem[],
  contact: UIContact;
}

export const CommonNull: unknown = null;

/**
 * 转换联系人叶子结构
 * @param list
 */
export const transTreeLeaf = (params: { item: ContactItem | ContactModel; parentKey?: string; isMailList?: boolean }): ContactTreeLeaf => {
  try {
    const { item, parentKey, isMailList } = params;
    const data = 'contact' in item ? transContactModel2ContactItem(item) : item;
    const { id, name, type, email } = data;
    const key = (parentKey ? parentKey + '_' : '') + (id || email);
    return {
      key,
      title: name || email,
      isLeaf: true,
      isOrg: false,
      data,
      nodeType: type as ContactTreeLeafNodeType,
      isMailList,
    };
  } catch (e) {
    contactUtilError('transTreeLeaf error', e);
    return CommonNull as ContactTreeLeaf;
  }
};

export const transOrgItem2TreeNode = (data: OrgItem, isNodeLeaf = false): ContactTreeNode => {
  try {
    const { id, orgName, type } = data;
    let nodeType: ContactTreeOrgNodeType = 'enterprise';
    if (type === 2000) {
      nodeType = 'team';
    } else if (type === 2001) {
      nodeType = 'personal';
    } else if (type === 2002) {
      nodeType = 'customer';
    } else if (type === 2003) {
      nodeType = 'clue';
    }
    return {
      key: id,
      title: orgName,
      isLeaf: isNodeLeaf,
      isOrg: true,
      item: data,
      nodeType,
    };
  } catch (e) {
    contactUtilError('transOrgItem2TreeNode error', e);
    return CommonNull as ContactTreeNode;
  }
};

/**
 * 转换联系人节点结构
 * @param list
 */
export const transTreeNode = (data: EntityOrg, isNodeLeaf = false): ContactTreeNode => {
  try {
    const { id, orgName, type } = data;
    let nodeType: ContactTreeOrgNodeType = 'enterprise';
    if (type === 2000) {
      nodeType = 'team';
    } else if (type === 2001) {
      nodeType = 'personal';
    } else if (type === 2002) {
      nodeType = 'customer';
    } else if (type === 2003) {
      nodeType = 'clue';
    }
    return {
      key: id,
      title: orgName,
      isLeaf: isNodeLeaf,
      isOrg: true,
      data,
      nodeType,
    };
  } catch (e) {
    contactUtilError('transOrgItem2TreeNode error', e);
    return CommonNull as ContactTreeNode;
  }
};

export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
export const systemApi = api.getSystemApi();
export const getColor = (email: string) => contactApi.getColor(email);
export const getCharAvatar = (name: string | undefined) => {
  if (!name) {
    return name;
  }
  return name.charAt(0).toLocaleUpperCase();
};
export const fixContactLabel = (label: string) => (label === '|' ? '#' : label);
export const contact4ui = (list?: ContactModel[], pointLabel?: boolean) => {
  const labels = new Set();
  if (!list) {
    return [];
  }
  return cloneDeep(list).map(e => {
    const r = e as UIContactModel;
    r.contact.defaultEmail = e.contact.accountName;
    r.contact.charAvatar = getCharAvatar(e.contact.contactName);
    // r.contact.color = getColor(r.contact.defaultEmail)
    // r.contact.contactLabel = fixContactLabel(r.contact.contactLabel)
    if (pointLabel) {
      if (!labels.has(r.contact.contactLabel)) {
        r.contact.labelPoint = !0;
        labels.add(r.contact.contactLabel);
      } else {
        r.contact.labelPoint = false;
      }
    }
    return r;
  });
};

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // $&表示整个被匹配的字符串
}

export const splitSearchHit = (hit: string, text: string) => {
  const searchText = escapeRegExp(hit.slice());
  const reg = new RegExp(searchText, 'i');
  const result = reg.exec(text.slice());
  if (!result) {
    return null;
  }
  const head = text.substring(0, result.index);
  const target = text.substring(result.index, result.index + hit.length);
  const tail = text.substring(result.index + hit.length);
  return {
    head,
    target,
    tail,
  };
};
export const getSearchContact = async (searchValue: string, isIM: boolean) => {
  if (!searchValue) {
    return null;
  }
  const t1 = Date.now();
  const data = await contactApi.doSearchContact(searchValue, isIM);
  const list = contact4ui(data);
  console.log(`Search ${searchValue} in ${Date.now() - t1}ms`, list);
  return {
    [SearchGroupKey.ALL]: list,
    [SearchGroupKey.CORP]: list.filter(e => e.contact.type === 'enterprise'),
    [SearchGroupKey.PERSON]: list.filter(e => e.contact.type === 'personal'),
  };
};

export function verifyEmail(email: string): boolean {
  // const emailReg = /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
  const emailReg = emailPattern;
  return emailReg.test(email);
}

export type SelectedContactMap = Map<string, ContactItem>;
export type SelectedOrgMap = Map<string, OrgItem>;
export type SelectedContactOrgMap = Map<string, ContactOrgItem>;
export const creatExternalContentItem = (email: string, name?: string): ContactItem => {
  return {
    type: 'external',
    name: name || email,
    email,
  };
};

export const transTeamMember2ContactItem = (item: TeamMemberInfo): ContactItem | null => {
  if (item.user) {
    return {
      id: item.user.contactId,
      type: 'enterprise',
      name: item.user.nick,
      email: item.user.email,
    };
  } else {
    return null;
  }
};
export const tarnsEntityContact2ContactItem = (item: EntityContact): ContactItem => {
  try {
    const { id, type, avatar, contactName, position, accountType } = item;
    const email = contactApi.doGetModelDisplayEmail(item);
    return {
      id,
      type,
      avatar,
      name: contactName,
      email,
      position,
      accountType,
    };
  } catch (e) {
    contactUtilError('transContactModel2ContactItem error', e);
    return CommonNull as ContactItem;
  }
};
export const transEntityContactItem2ContactItem = (itemList: EntityContactItem[]): ContactItem[] => {
  return itemList.map<ContactItem>(item => {
    return {
      id: item.contactId,
      type: item.type,
      name: item.contactItemVal,
      email: item.contactItemVal,
    };
  });
};

export const buildOrgChildrenKey = (orgId: string, item: ContactItem) => {
  return orgId + '_' + (item?.id || item?.email);
};

export const transContactModel2ContactItem = (item: ContactModel): ContactItem => {
  try {
    const { id, type, avatar, contactName, position, accountType } = item?.contact || {};
    const email = contactApi.doGetModelDisplayEmail(item);
    const emailList: Set<string> = new Set([email]);
    if (item?.contactInfo?.length) {
      item.contactInfo.forEach(info => {
        if (info.contactItemType === 'EMAIL' && info.contactItemVal) {
          emailList.add(info.contactItemVal);
        }
      });
    }
    return {
      id,
      type,
      avatar,
      name: contactName,
      email,
      emailList: [...emailList],
      emailCount: emailList.size,
      position,
      accountType,
      customerRole: item.customerOrgModel?.role,
      createTime: item.customerOrgModel?.createTime,
      reduxUpdateTime: item.reduxUpdateTime,
      _account: item._account,
    };
  } catch (e) {
    contactUtilError('transContactModel2ContactItem error', e);
    return CommonNull as ContactItem;
  }
};

export const transContactSearch2ContactItem = (item: ContactSearch): ContactItem => {
  try {
    const { id, type, avatar, contactName, position, accountName: _email, accountType, hitQueryEmail, remark } = item;

    // 个人邮箱如果命中的是非accountName邮箱。默认展示命中邮箱
    const email = type === 'personal' && hitQueryEmail ? hitQueryEmail : _email;
    return {
      id,
      type,
      avatar,
      name: contactName,
      email,
      emailCount: item.emailCount,
      position,
      accountType,
      remark,
    };
  } catch (e) {
    contactUtilError('transContactSearch2ContactItem error', e);
    return CommonNull as ContactItem;
  }
};

export const transCustomerRole2EmailRole = (type: ContactType, role?: CustomerRole): EmailRoles | undefined => {
  if (!role) {
    return role;
  }
  const lxType = ['enterprise', 'personal', 'external'];
  if (lxType.includes(type)) {
    return type as EmailRoles;
  }
  // "manager" | "colleague" | "openSea" | "other" =>"myCustomer" | "myClue" | "colleagueCustomer" | "colleagueCustomerNoAuth" | "colleagueClue" | "enterprise" | "openSeaCustomer" | "openSeaClue" | "personal" | "external"
  const CustomerRoleObj: Partial<Record<CustomerRole, EmailRoles>> = {
    manager: 'myCustomer',
    colleague: 'colleagueCustomer',
    openSea: 'openSeaCustomer',
  };
  // if (role === 'manager') {
  //   return ('my' + lodashCapitalize(type));
  // }
  // return (role + lodashCapitalize(type));
  return CustomerRoleObj[role];
};

export const transCustomerContactSearch2ContactItem = (item: CustomerContactSearch): ContactItem => {
  try {
    const { id, type, contactName, accountName: email, customerRole, hitQuery, createTime } = item;
    return {
      id,
      type,
      name: contactName,
      email,
      customerRole,
      hitQuery,
      createTime,
    };
  } catch (e) {
    contactUtilError('transCustomerContactSearch2ContactItem error', e);
    return CommonNull as ContactItem;
  }
};

export const transOrgSearch2OrgItem = (item: OrgSearch): OrgItem => {
  try {
    const { id, type, orgRank, orgName, hitQuery, originId, memberNum } = item;
    let orgType: ContactTreeOrgType = 'org';
    if (type === 2000) {
      orgType = 'team';
    } else if (type === 2001) {
      orgType = 'personalOrg';
    }
    return {
      id,
      orgType,
      type,
      orgRank,
      orgName,
      hitQuery,
      originId: originId || id,
      memberNum,
    };
  } catch (e) {
    contactUtilError('transOrgSearch2OrgItem error', e);
    return CommonNull as OrgItem;
  }
};

export const transCustomerOrgSearch2OrgItem = (item: CustomerOrgSearch): OrgItem => {
  try {
    const { id, type, orgRank, orgName, hitQuery, customerRole, originId } = item;
    let orgType: ContactTreeOrgType = 'org';
    if (type === 2002) {
      orgType = 'customer';
    } else if (type === 2003) {
      orgType = 'clue';
    }
    return {
      id,
      orgType,
      type,
      orgRank,
      orgName,
      hitQuery,
      customerRole,
      originId,
    };
  } catch (e) {
    contactUtilError('transOrgSearch2OrgItem error', e);
    return CommonNull as OrgItem;
  }
};

export const transEntityOrg2OrgItem = (item: EntityOrg): OrgItem => {
  try {
    const { id, type, orgRank, orgName, originId } = item;
    let orgType: ContactTreeOrgType = 'org';
    if (type === 2000) {
      orgType = 'team';
    } else if (type === 2001) {
      orgType = 'personalOrg';
    } else if (type === 2002) {
      orgType = 'customer';
    } else if (type === 2003) {
      orgType = 'clue';
    }
    return {
      id,
      type,
      orgRank,
      orgName,
      orgType,
      originId,
    };
  } catch (e) {
    contactUtilError('transOrgSearch2OrgItem error', e);
    return CommonNull as OrgItem;
  }
};

// export const transEntityOrg2OrgItem = (item: EntityOrg): OrgItem => {
//   const  {id, type, orgRank, orgName } = item;
//   let orgType: ContactTreeOrgType  = 'org';
//   if(type === 2000) {
//     orgType = 'team';
//   } else if(type === 2001) {
//     orgType = 'personalOrg'
//   }else if(type === 2002) {
//     orgType = 'customer'
//   } else if(type === 2003) {
//     orgType = 'clue'
//   }
//   return {
//     id,
//     type,
//     orgRank,
//     orgName,
//     orgType
//   }
// }
// 我的客户联系人 | 我的线索联系人 | 我的客户 | 我的线索 | 同事客户联系人 | 同事线索联系人 | 同事客户 | 同事线索
// 废弃 邹明亮
export type EdmSearchResOrderType = 'myCustomerContact' | 'myCustomer' | 'colleagueCustomer' | 'colleagueCustomerContact';
// | 'myClueContact'
// | 'myClueOrg'
// | 'colleagueClueContact'
// | 'colleagueClueOrg';

export const transCustomerSearchData = (data: CustomerSearchContactMemoryRes) => {
  const edmOptionsMap: Record<EdmSearchResOrderType, ContactOrgItem[]> = {
    myCustomerContact: [],
    myCustomer: [],
    colleagueCustomerContact: [],
    colleagueCustomer: [],
    // myClueContact: [],
    // myClueOrg: [],
    // otherClueContact: [],
    // otherClueOrg: [],
  };
  const edmContactList = data.contact;
  edmContactList.forEach(item => {
    const contactItem = transCustomerContactSearch2ContactItem(item);
    const edmKey = contactItem.customerRole + 'Contact';
    const option = edmOptionsMap[edmKey as EdmSearchResOrderType] || [];
    option.push(contactItem);
    edmOptionsMap[edmKey as EdmSearchResOrderType] = option;
  });
  const edmOrgList = [...data.customer];
  edmOrgList.forEach(item => {
    const orgItem = transCustomerOrgSearch2OrgItem(item);
    const edmKey = orgItem.customerRole;
    const option = edmOptionsMap[edmKey as EdmSearchResOrderType] || [];
    option.push(orgItem);
    edmOptionsMap[edmKey as EdmSearchResOrderType] = option;
  });
  return edmOptionsMap;
};

export const transContactInfo2ContactItem = (item?: EntityScheduleAndContact[]) => {
  const contactItems: ContactItem[] = [];
  if (item) {
    item.forEach(e => {
      contactItems.push({
        type: 'external',
        name: e.simpleInfo.extNickname || e.simpleInfo.extDesc || '',
        email: e.simpleInfo.extDesc || '',
      });
    });
  }
  return contactItems;
};

export const isEqualPersonalContact = (pre: { email: string; name: string; contactId?: string }, cur: ContactModel) => {
  if (cur?.contact && cur?.contactInfo && pre?.email && pre?.name) {
    const { contactName, type, id } = cur.contact;
    if (type !== 'personal') {
      return false;
    }
    const { email, name, contactId } = pre;
    if (contactId && contactId === id) {
      return false;
    }
    if (name !== contactName) {
      return false;
    }
    const emailList = cur.contactInfo.filter(item => item.type === 'personal' && item.contactItemType === 'EMAIL');
    if (emailList.length !== 1) {
      return false;
    }
    const findEmail = emailList[0].contactItemVal;
    return findEmail === email.toLocaleLowerCase();
  }
  return false;
};

export const filterSameEmailAndHitQueryContact = (list: ContactModel[]): ContactModel[] => {
  const contactEmailMap: Record<
    string,
    {
      index: number;
      item: ContactModel;
    }
  > = {};
  const res: ContactModel[] = [];
  list.forEach(item => {
    const { contact, contactInfo, orgs } = item;
    if (contact.type === 'personal') {
      let hitQueryEmails: EntityContactItem[] = [];
      if (contact.hitQuery?.length) {
        hitQueryEmails = contactInfo.filter(info => info.contactItemType === 'EMAIL');
      } else {
        hitQueryEmails = contactInfo.filter(info => info.hitQuery?.length && info.contactItemType === 'EMAIL');
      }
      console.log('hitQueryEmails', hitQueryEmails);
      hitQueryEmails.forEach(info => {
        const email = info.contactItemVal;
        const obj = contactEmailMap[email];
        if (!obj) {
          const newContact = { ...contact };
          newContact.hitQueryEmail = email;
          const newItem = { contact: newContact, contactInfo, orgs };
          res.push(newItem);
          contactEmailMap[email] = {
            index: res.length - 1,
            item: newItem,
          };
        }
      });
    } else if (contact.type === 'enterprise') {
      const email = contactApi.doGetModelDisplayEmail(item);
      const obj = contactEmailMap[email];
      const newContact = { ...contact };
      newContact.hitQueryEmail = email;
      const newItem = { contact: newContact, contactInfo, orgs };
      if (obj) {
        res.splice(obj.index, 1, newItem);
        contactEmailMap[email] = {
          index: obj.index,
          item: newItem,
        };
      } else {
        res.push(newItem);
        contactEmailMap[email] = {
          index: res.length - 1,
          item: newItem,
        };
      }
    }
  });
  return res;
};
export const filterContactSameEmail = (list: ContactModel[]): ContactModel[] => {
  const contactEmailMap: {
    [props in string]: {
      index: number;
      item: ContactModel;
    };
  } = {};
  const res: ContactModel[] = [];
  list.forEach((item, index) => {
    const email = item.contact.accountName;
    const obj = contactEmailMap[email];
    if (obj) {
      const isEnterprise = item.contact.type === 'enterprise';
      if (isEnterprise) {
        res.splice(obj.index, 1, item);
        contactEmailMap[email] = {
          index,
          item,
        };
      }
    } else {
      contactEmailMap[email] = {
        index,
        item,
      };
      res.push(item);
    }
  });
  return res;
};
export const getTeams = async () => {
  const res = await contactApi.doGetOrgList({ typeList: [2000] });
  return res as EntityTeamOrg[];
};
export const getTeamMembers = (idList: string[], needGroup: boolean = true) =>
  contactApi.doGetOrgContactListByTeamId({
    idList,
    needGroup,
    needContactModelData: true,
  });
export const getTeamAndMemberByTeam = async (teamList: EntityTeamOrg[]): Promise<EntityOrgAndContact[]> => {
  const idList = util.getKeyListByList<string>(teamList, 'id');
  const teamMembers = (await contactApi.doGetOrgContactListByTeamId({
    idList,
    needContactModelData: true,
  })) as Array<EntityOrgTeamContact>;
  const teamMemberMap: identityObject<EntityOrgTeamContact[]> = {};
  teamMembers.forEach(item => {
    const teamId = item?.orgId;
    if (teamId) {
      const members: EntityOrgTeamContact[] = teamMemberMap[teamId] || [];
      members.push(item);
      teamMemberMap[teamId] = members;
    }
  });
  const res: EntityOrgAndContact[] = [];
  teamList.forEach(item => {
    const members = teamMemberMap[item.id];
    const children: ContactItem[] = [];
    members?.forEach(member => {
      if (member.model) {
        children.push(transContactModel2ContactItem(member.model));
      }
    });
    res.push({ ...item, children, orgType: 'team' });
  });
  return res;
};
export const getTeamAndMemberByTeamIds = async (teamIds: string[]): Promise<identityObject<EntityOrgTeamContact[]>> => {
  const teamMembers = (await contactApi.doGetOrgContactListByTeamId({
    idList: teamIds,
    needContactModelData: true,
  })) as Array<EntityOrgTeamContact>;
  const teamMemberMap: identityObject<EntityOrgTeamContact[]> = {};
  // 群id：群成员 映射
  teamMembers.forEach(item => {
    const teamId = item?.orgId;
    if (teamId) {
      const members: EntityOrgTeamContact[] = teamMemberMap[teamId] || [];
      members.push(item);
      teamMemberMap[teamId] = members;
    }
  });
  return teamMemberMap;
};
export const getPersonalOrgList = async (account?: string) => {
  const { success, data } = await contactApi.doGetPersonalOrg({ _account: account });
  if (success && data) {
    return data;
  } else {
    return [];
  }
};
// TODO
export const getOrgAndContactById = async (idList: string): Promise<Record<string, ContactModel[]>> => {
  const contactList = await contactApi.doGetContactByOrgId({ orgId: idList });
  const res: Record<string, ContactModel[]> = {};
  contactList.forEach(item => {
    if (item.orgs) {
    }
  });
  return res;
};
export const includesContactItem = (data: ContactItem, selectedMap: SelectedContactMap) => {
  return selectedMap.has(getContactItemKey(data));
};
export const getContactItemKey = (data: ContactItem, useContactId?: boolean, useComposite: boolean = false): string => {
  if (useComposite) {
    return `${data?.id}:::${data?.email}`;
  } else if (useContactId) {
    return data?.id || '';
  } else {
    return data?.email;
  }
  // const {type, email, id} = data;
  // return email + '_' + (type === 'external' || id);
};

export interface SelectedContactParams {
  idList?: string[]; //选择的组织id
  selectedMap: SelectedContactMap; //已经选中的map
  checked?: boolean; // 是否要选中
  useContactId?: boolean; // 是否使用id作为key
  selectedList?: ContactItem[]; //当前选中的列表
  useEdm?: boolean; // 数据来源
  disabledMap?: SelectedContactOrgMap; //不可选的map
  _account?: string;
}

export const getCustomerContactByCustomerIds = async (idList: string[]): Promise<ContactModel[]> => {
  const res = await doGetCustomerContactByCustomerIds({ idList });
  return Object.values(res).reduce((pre, cur) => [...pre, ...cur], []);
};

export const getSelectedItemBySelectOrg = async (params: SelectedContactParams): Promise<SelectedContactModel> => {
  const { idList, selectedMap, disabledMap, checked = true, selectedList, useContactId, _account, useEdm } = params;
  if (!idList && !selectedList) {
    throw new Error(getIn18Text('BIXUCHUANRUi'));
  }
  let memberList = selectedList;
  if (idList?.length) {
    const contactList = useEdm ? await getCustomerContactByCustomerIds(idList) : await contactApi.doGetContactByOrgId({ orgId: idList, _account });
    memberList = contactList.map(item => transContactModel2ContactItem(item));
  }
  memberList = memberList || [];
  memberList.forEach(item => {
    const key = getContactItemKey(item, useContactId);
    if (!disabledMap?.get(key)) {
      if (checked) {
        const pre = selectedMap.get(key);
        if (pre) {
          selectedMap.set(key, getValidEmail(pre, item));
        } else {
          selectedMap.set(key, item);
        }
      } else {
        selectedMap.delete(key);
      }
    }
  });
  return {
    contactItem: selectedMap,
    selectContactItem: memberList,
  };
};

export const isOrg = (data: ContactOrgItem) => {
  return data && Boolean('orgType' in data);
};

export interface EntityOrgAndContact extends EntityOrg, EntityTeamOrg, Omit<EntityPersonalOrg, 'memberNum'> {
  children?: ContactItem[];
  orgType: ContactOrgType;
}

export type OrgAndContact = ContactItem | EntityOrgAndContact | EntityClueOrg | EntityCustomerOrg;

export type ContactOrgItem = IContactOrgItem;

export interface SelectedContactModel {
  contactItem: SelectedContactMap;
  selectContactItem: ContactItem[];
}

export const contactUtilError = (msg: string, e: unknown) => {
  console.error(`[contact_util] ${msg}`);
  if (env !== 'prod') {
    throw e;
  }
};

/**
 * 获取主账号
 */
export const getMainAccount = (): string => systemApi.getCurrentUser()?.id || '';

export const isMainAccount = (_account?: string): boolean => {
  if (_account === undefined) {
    return true;
  }
  return getMainAccount() === _account;
};

const accountEmailSeparator = '&&&';
// 创建联系人的email对应角色emailIdMap的key（由所属账号_account， 联系人的email， 和连接符组成）
// 因为用到的地方默认转小写的方式取，所以创建时默认转小写
export const createAccountEmailKey = (email: string, _account: string = getMainAccount()): ACCOUNT_EMAIL => {
  return `${_account}${accountEmailSeparator}${email?.toLocaleLowerCase()}`;
};

export const parseAccountEmailKey = (query: ACCOUNT_EMAIL): { account: string; email: string } | null => {
  if (query.includes(accountEmailSeparator)) {
    const data = query.split(accountEmailSeparator);
    return {
      account: data[0],
      email: data[1],
    };
  } else {
    console.error('parseAccountEmail error', query);
    return null;
  }
};

export const transServerCustomerContactModel2ContactDetail = (list: ServerCustomerContactModel[]): ContactDetail[] => {
  return list.map(item => {
    const {
      contact_id,
      contact_name,
      main_contact,
      email,
      // label_list: ServerCustomerLabelModel[],
      contact_icon,
      telephones,
      whats_app,
      job,
      home_page,
      gender,
      birthday,
      remark,
      pictures,
      rejected,
      valid,
      telephone,
      address,
      contact_infos,
      area,
      ext_infos,
      department,
      social_platform,
    } = item;
    const ContactDetailItem: ContactDetail = {
      contact_id,
      contact_name,
      main_contact,
      email,
      label_list: [], // LabelModel[]; 没有用到先不转换
      contact_icon,
      telephones,
      whats_app,
      social_platform,
      job,
      home_page,
      gender,
      birthday,
      remark,
      pictures: Array.isArray(pictures) ? pictures : [pictures],
      rejected,
      valid,
      telephone,
      address: Array.isArray(address) ? address : [address],
      contact_infos,
      area,
      ext_infos,
      department,
    };
    return ContactDetailItem;
  });
};
