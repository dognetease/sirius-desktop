import lodashOrderBy from 'lodash/orderBy';
import groupBy from 'lodash/groupBy';
import lodashGet from 'lodash/get';
import lodashCapitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import {
  ContactInfoType,
  ContactModel,
  ContactType,
  EntityContact,
  EntityContactItem,
  EntityOrg,
  EntityOrgContact,
  EntityPersonalOrgContact,
  EntityTeamOrg,
  OrgModel,
  resultObject,
  EntityPersonalMark,
  EntityPersonalOrg,
} from '@/api/_base/api';
import { util } from '@/api/util';
import {
  ContactSearch,
  contactUpdateParams,
  ContactPersonalMarkSimpleModel,
  ContactTeam,
  ContactTeamMember,
  OrgSearch,
  ServerTeamRes,
  TeamMemberMap,
  transformData,
  transformOrgDataConfig,
  CoreContactServerRawData,
  CoreOrgServerRawData,
  EntityOrgPathList,
  ContactServerVOModel,
} from '@/api/logical/contactAndOrg';
import {
  EntityCustomerLabel,
  EntityCustomerOrgManager,
  EntityCustomerOrg,
  EntityClueOrg,
  EntityCustomerOrgContact,
  TransContactRes,
  EntityCustomerContact,
  CustomerType,
  EntityCustomerUnitContact,
  CustomerContactSearch,
  CustomerOrgSearch,
  CustomerOrg,
  CustomerOrgType,
  CustomerRole,
} from '@/api/logical/contact_edm';
import { api } from '@/api/api';
import { SearchConditionFilter } from '@/api/data/new_db';
import { ContactSearchTransform } from './contact_search_transform';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { EmailRoles } from '@/api/logical/mail_plus_customer';

interface ContactThread {
  contact: EntityContact[];
  contactItem: EntityContactItem[];
  orgContact: EntityOrgContact[];
}

interface EnterpriseContactThread extends ContactThread {
  needDeleteContactIds?: string[];
}

interface PersonalContactThread extends ContactThread {
  personalIds: string[];
  markedList: Omit<EntityPersonalMark, 'id'>[];
}

export class ContactTransform extends ContactSearchTransform {
  systemApi = api.getSystemApi();

  contactUtil: ContactConst = ContactUtilInterface;

  /**
   * 将服务端分组id转换成本地分组id
   * @param id
   */
  transOrgIdByPersonalOrg(id: string) {
    if (id.startsWith('personal_org_')) {
      return id;
    }
    return 'personal_org_' + id;
  }

  private transPersonalItem2Contact(item: resultObject, _lastUpdateTime: number): EntityContact {
    const obj: resultObject = {};
    obj.accountVisible = 1;
    obj.accountStatus = 0;
    obj.contactPYName = util.toPinyin(item.qiyeAccountName);
    const pinyinName = item.pinyinName || item.qiyeAccountName.split('').map((s: string) => util.toPinyin(s));
    obj.contactPYLabelName = pinyinName.reduce((pre: string, cur: string) => {
      pre += cur.charAt(0).toLocaleLowerCase();
      return pre;
    }, '');
    obj.contactName = item.qiyeAccountName;
    if (item.personContactGroupList?.length) {
      obj.personalOrg = item.personContactGroupList.map((group: { groupId: string; groupName: string }) => this.transOrgIdByPersonalOrg(group.groupId));
    }
    const email = this.getFlatStrOrArrInfo(item.email);
    const tel = this.getFlatStrOrArrInfo(item.tel);
    const mobileList = this.getFlatStrOrArrInfo(item.mobileList);
    const faxList = this.getFlatStrOrArrInfo(item.faxList);
    let accountName = '';
    if (email) {
      accountName = (email[0] + '').toLocaleLowerCase();
    } else if (tel) {
      accountName = tel[0] + '';
    } else if (mobileList) {
      accountName = mobileList[0] + '';
    } else if (faxList) {
      accountName = faxList[0] + '';
    } else {
      accountName = item.qiyeAccountName + '';
    }
    obj.accountName = accountName;
    obj.accountOriginId = item.qiyeAccountId;
    obj.accountId = item.qiyeAccountId + '';
    obj.remark = item.remark;
    obj.priority = item.priority;
    obj.enableIM = item.enableIM;
    obj.adrList = item.adrList;
    obj.pref = item.pref;
    obj.birthday = item.birthday;
    obj.role = item.role;
    obj.title = item.title;
    obj.org = item.org;
    obj.orgname = item.orgname;

    if (item.iconVO) {
      obj.avatar = item.iconVO.mediumUrl;
      obj.avatarPendant = item.iconVO.pendantUrl;
    }
    obj.visibleCode = item.showCode === undefined ? 0 : item.showCode;
    obj.enterpriseId = -2;
    obj.id = obj.accountOriginId;

    // 星标数据
    obj.marked = item.marked;

    let contactLabel = obj.contactPYName ? obj.contactPYName.charAt(0).toLocaleUpperCase() : '';
    if (/[^A-Z]/.test(contactLabel)) {
      contactLabel = '|';
    }
    obj._lastUpdateTime = _lastUpdateTime;
    obj.contactLabel = contactLabel;
    obj.type = 'personal';

    obj.updateTime = new Date();
    return obj as EntityContact;
  }

  /**
   * 个人通讯录列表数据转换成contact表数据
   * @param list
   */
  transPersonalListToContact(list: resultObject[], _lastUpdateTime: number = Date.now()): EntityContact[] {
    const contactList = list.map(item => this.transPersonalItem2Contact(item, _lastUpdateTime));
    return contactList;
  }

  transPersonalItem2ContactInfo(item: resultObject, _lastUpdateTime: number): EntityContactItem[] {
    const itemList: EntityContactItem[] = [];
    const rs = {
      contactItemVal: '',
      contactItemRefer: '',
      contactItemType: '',
      isDefault: 0,
      emailType: -1,
      contactId: item.qiyeAccountId,
    };
    // email账号
    itemList.push(
      ...(this.getFlatStrOrArrInfo(
        item.email.map((subEmail: string) => subEmail.toLocaleLowerCase()),
        'EMAIL',
        rs
      ) as EntityContactItem[])
    );
    // FAX
    itemList.push(...(this.getFlatStrOrArrInfo(item.faxList, 'FAX', rs) as EntityContactItem[]));
    // tel
    itemList.push(...(this.getFlatStrOrArrInfo(item.tel, 'TEL', rs) as EntityContactItem[]));
    // mobile
    itemList.push(...(this.getFlatStrOrArrInfo(item.mobileList, 'MOBILE', rs) as EntityContactItem[]));

    return itemList.map(_item => ({
      ..._item,
      contactItemVal: _item.contactItemVal,
      type: 'personal',
      _lastUpdateTime,
      id: util.getUnique(_item.contactId, _item.contactItemType, _item.contactItemVal),
    }));
  }

  /**
   * 个人通讯录列表数据转换成contactItem表数据
   * @param list
   */
  transPersonalListToContactInfo(list: resultObject[], _lastUpdateTime: number = Date.now()): EntityContactItem[] {
    return list.map(item => this.transPersonalItem2ContactInfo(item, _lastUpdateTime)).flat();
  }

  transPersonalContact2MutipleData(list: resultObject[], _lastUpdateTime: number): PersonalContactThread {
    const contactList: EntityContact[] = [];
    const contactItemList: EntityContactItem[] = [];
    const orgContactList: EntityOrgContact[] = [];

    const personalIds: string[] = [];
    const markedList: Omit<EntityPersonalMark, 'id'>[] = [];

    list.forEach(item => {
      const contact = this.transPersonalItem2Contact(item, _lastUpdateTime);
      const contactItem = this.transPersonalItem2ContactInfo(item, _lastUpdateTime);
      const orgContact = this.transPersonalItem2OrgContact(item, _lastUpdateTime) as unknown as EntityOrgContact[];

      if (typeof item.marked === 'number' && item.marked > 0) {
        markedList.push(this.transPersonal2Mark(item, _lastUpdateTime));
      }

      contactList.push(contact);
      contactItemList.push(...contactItem);
      orgContactList.push(...orgContact);
      personalIds.push(contact.id);
    });

    return {
      contact: contactList,
      contactItem: contactItemList,
      orgContact: orgContactList,
      personalIds,
      markedList,
    };
  }

  /**
   * 企业通讯录列表数据转换成contact表数据
   * @param list
   */
  transEnterpriseItemToContact(item: ContactServerVOModel, _lastUpdateTime: number, options: { _account?: string }): EntityContact {
    const currentCompanyId = this.contactUtil.getCurrentCompanyId(options._account);

    const obj: resultObject = {};
    const _email = (item.email || '').toLocaleLowerCase();
    const _displayEmail = (item.displayEmail || '').toLocaleLowerCase();
    obj.displayEmail = _displayEmail || _email;
    obj.contactName = item.qiyeNickName;
    obj.accountName = _email;
    obj.accountId = util.getUnique(_email, item.orgId);
    obj.accountOriginId = item.qiyeAccountId;
    obj.contactPYName = util.toPinyin(item.qiyeNickName);
    obj.contactPYLabelName = (item.qiyeNickName || '')
      .split('')
      .map((_item: string) => util.toPinyin(_item).slice(0, 1))
      .join('');

    // 关联企业功能:关联企业通讯录业务需要在contact表里插入一个orgId字段来做关联企业筛查
    obj.enterpriseId = item.orgId;
    obj.accountVisible = item.addrVisible;
    obj.accountStatus = item.status;
    obj.accountType = item.type;
    if (item.unitNamePathList && item.unitNamePathList.length) {
      // const visibleUnitNamePathList = item.unitNamePathList.filter(
      //   (list2: resultObject[]) => !list2.some((e: resultObject) => e.showCode !== 0)
      // );
      // obj.position = item.unitNamePathList.map((arr) => {

      // }, [] as string[][]));

      obj.position = item.unitNamePathList
        .map(subUnitItem =>
          // console.log('subUnitItem1',subUnitItem)
          subUnitItem.filter(item => item.showCode === 0).map(item => item.unitName)
        )
        .filter(
          subUnitItem =>
            // console.log('subUnitItem2',subUnitItem)
            subUnitItem && subUnitItem.length
        );
    } else {
      obj.position = [];
    }
    obj.enableIM = item.enableIM;
    if (currentCompanyId) {
      obj.enableIM = obj.enableIM && obj.enterpriseId === currentCompanyId;
    }
    if (item.iconVO) {
      obj.avatar = item.iconVO.mediumUrl;
      obj.avatarPendant = item.iconVO.pendantUrl;
    }
    obj.visibleCode = item.showCode === undefined ? 0 : item.showCode;
    obj.enterpriseId = obj.enterpriseId || -1;
    obj.id = obj.accountOriginId;
    obj.job = item.job;
    obj.contactLabel = this.getContactLabel(obj.contactPYName);
    obj.type = 'enterprise';
    obj.updateTime = new Date();
    obj._lastUpdateTime = _lastUpdateTime;
    return obj as EntityContact;
  }

  transEnterpriseListToContact(list: resultObject[], _lastUpdateTime: number = Date.now(), options: { _account?: string }): EntityContact[] {
    const contactList = list.map(item =>
      this.transEnterpriseItemToContact(item as unknown as ContactServerVOModel, _lastUpdateTime, {
        _account: options._account,
      })
    );
    return contactList;
  }

  /**
   * 企业通讯录列表数据转换成contactItem表数据
   * @param list
   */
  transEnterpriseItem2ContactItem(item: resultObject, _lastUpdateTime: number = Date.now(), force = false): EntityContactItem[] {
    const _email = (item.email || '').toLocaleLowerCase();
    const _displayEmail = (item.displayEmail || '').toLocaleLowerCase();
    let itemList: resultObject[] = [];
    const yunxinType = {
      contactItemVal: item.yunxinAccountId,
      contactItemRefer: item.yunxinToken,
      contactItemType: 'yunxin',
      isDefault: 0,
    };
    const telType = {
      contactItemVal: item.tel,
      contactItemRefer: '',
      contactItemType: 'TEL',
      isDefault: 0,
    };
    const mobileType = {
      contactItemVal: item.mobile,
      contactItemRefer: '',
      contactItemType: 'MOBILE',
      isDefault: 0,
    };

    // 如果displayEmail && email一致 && force=true不需要返回email信息 core接口已经做了插入
    const allEmails = [...new Set([_displayEmail, _email].filter(item => item && item.trim().length))];
    if (!force || allEmails.length >= 1) {
      allEmails.forEach((emailVal, index) => {
        itemList.push({
          contactItemVal: emailVal,
          contactItemRefer: '',
          contactItemType: 'EMAIL',
          emailType: index === 0 ? -1 : 1,
          isDefault: index === 0 ? 1 : 0,
        });
      });
    }

    if (yunxinType.contactItemVal) {
      itemList.push(yunxinType);
    }
    if (telType.contactItemVal) {
      itemList.push(telType);
    }

    if (mobileType.contactItemVal) {
      itemList.push(mobileType);
    }
    // 添加一些公用信息
    itemList = itemList.map(_item => ({
      ..._item,
      contactId: item.qiyeAccountId,
      type: 'enterprise',
      enterpriseId: item.orgId,
      _lastUpdateTime,
      id: util.getUnique(item.qiyeAccountId, _item.contactItemType, _item.contactItemVal),
    }));
    return itemList as unknown as EntityContactItem[];
  }

  transEnterpriseListToContactItem(list: resultObject[], _lastUpdateTime: number = Date.now()): EntityContactItem[] {
    const contactItemList: EntityContactItem[] = list.reduce((total: EntityContactItem[], item) => {
      this.transEnterpriseItem2ContactItem(item, _lastUpdateTime).forEach(item => {
        total.push(item);
      });
      return total;
    }, []);
    return contactItemList;
  }

  /**
   * 将个人通讯录数据转成orgContact数据
   * @param item
   * @param _lastUpdateTime
   */
  private transPersonalItem2OrgContact(item: resultObject, _lastUpdateTime: number): EntityPersonalOrgContact[] {
    const contactId = item.qiyeAccountId;
    return lodashGet(item, 'personContactGroupList', []).map(({ groupId }: { groupId: string }) => {
      const orgId = this.transOrgIdByPersonalOrg(groupId);
      return {
        id: util.getUnique(orgId, contactId),
        orgId,
        contactId,
        updateTime: new Date(_lastUpdateTime),
        type: 'personal',
        _lastUpdateTime,
      };
    });
  }

  /**
   * 个人通讯录列表数据转换成OrgContact表数据
   * @param list
   */
  transPersonalListToOrgContact(list: resultObject[], _lastUpdateTime: number = Date.now()): EntityPersonalOrgContact[] {
    return list.map(item => this.transPersonalItem2OrgContact(item, _lastUpdateTime)).flat();
  }

  transEnterprise2OrgContact = (item: resultObject, _lastUpdateTime: number): EntityOrgContact[] => {
    if (!item || !Array.isArray(item.accountRankList) || !item.accountRankList.length) {
      return [];
    }

    return item.accountRankList.reduce((total, current) => {
      const { unitId: orgId, accountRank } = current || {};
      if (orgId) {
        const contactId = item.qiyeAccountId;
        const yunxinId = item.yunxinAccountId;
        const enterpriseId = item.orgId;
        const rankNum = accountRank;
        total.push({
          id: util.getUnique(orgId, contactId),
          orgId,
          contactId,
          yunxinId,
          rankNum,
          enterpriseId,
          type: 'enterprise',
          _lastUpdateTime,
        });
      }
      return total;
    }, [] as resultObject[]);
  };

  /**
   * 企业通讯录列表数据转换成orgContact表数据
   * @param list: 企业通讯录列表
   * */
  transEnterpriseListToOrgContact(list: resultObject[], _lastUpdateTime: number = Date.now()): EntityOrgContact[] {
    const orgContactList: EntityOrgContact[] = [];
    list.map(item => this.transEnterprise2OrgContact(item, _lastUpdateTime)).flat();
    return orgContactList;
  }

  // 遍历服务端enterprise返回contact/contactItem/orgContact列表
  // 替换原来的遍历方法 减少遍历次数@郭超
  transferEnterprise2MutileTableData(
    list: resultObject[],
    lastUpdateTime: number,
    options: {
      force?: boolean;
      unitPathMap?: Map<string, Record<'idPathList' | 'namePathList', string[]>>;
      _account?: string;
    }
  ): EnterpriseContactThread {
    const contactList: EntityContact[] = [];
    const contactItemList: EntityContactItem[] = [];
    const orgContactList: EntityOrgContact[] = [];
    // const contactSearchList:resultObject[] = [];

    const needDeleteContactIds: string[] = [];

    const force = lodashGet(options, 'force', false);
    const unitPathMap = lodashGet(options, 'unitPathMap', new Map());

    list.forEach(item => {
      // 当前账号是否可见 0可见；非0不可见；(是否可见是指是否在通讯录中出现)
      // 具体看服务端文档https://docs.popo.netease.com/lingxi/003be794a86244c7826bcdd5bd3b940c#edit
      if (item.showCode !== 0) {
        needDeleteContactIds.push(item.qiyeAccountId);
        return;
      }
      const singleContact = this.transEnterpriseItemToContact(item as unknown as ContactServerVOModel, lastUpdateTime, { _account: options._account });

      // 增量更新场景下 从本地信息中补充组织信息
      if (!force && unitPathMap.size) {
        singleContact.position = (item as ContactServerVOModel).unitIdList.filter(unitId => unitPathMap.has(unitId)).map(unitId => unitPathMap.get(unitId)!.namePathList);
      }

      const singleContactItem = this.transEnterpriseItem2ContactItem(item, lastUpdateTime, force);

      contactList.push(singleContact);
      contactItemList.splice(Math.max(contactItemList.length - 1, 0), 0, ...singleContactItem);
      // 仅增量更新执行orgContact更新
      // 仅增量更新更新内存数据
      if (!force) {
        const singleOrgContact = this.transEnterprise2OrgContact(item, lastUpdateTime);
        orgContactList.splice(Math.max(contactItemList.length - 1, 0), 0, ...singleOrgContact);
        // contactSearchList.push(this.transServerContact2Search(item as ContactServerVOModel));
      }
    });
    return {
      contact: contactList,
      contactItem: contactItemList,
      orgContact: orgContactList,
      needDeleteContactIds,
      // contactSearchList
    };
  }

  transPersonal2Mark(item: resultObject, _lastUpdateTime: number, type: 1 | 2 = 1): Omit<EntityPersonalMark, 'id'> {
    if (type === 1) {
      return {
        value: item.qiyeAccountId,
        name: item.qiyeAccountName,
        emails: item.email,
        marked: item.marked,
        originId: item.qiyeAccountId,
        _lastUpdateTime,
        type: 1,
      } as unknown as EntityPersonalMark;
    }

    return {
      type: 2,
      value: `personal_org_${item.groupId}`,
      name: item.groupName,
      emails: [],
      marked: item.marked,
      originId: item.groupId,
      _lastUpdateTime,
    };
  }

  /**
   *
   * 将星标数据插入到星标数据表中
   * @returns
   */
  transferPersonalList2PersonalMark(list: resultObject[], type: 1 | 2 = 1, _lastUpdateTime: number = Date.now()): Omit<EntityPersonalMark, 'id'>[] {
    const markedList: Omit<EntityPersonalMark, 'id'>[] = [];
    list.forEach(item => {
      if (typeof item.marked !== 'number' || item.marked <= 0) {
        return;
      }
      markedList.push(this.transPersonal2Mark(item, _lastUpdateTime, type));
    });
    return markedList;
  }

  /**
   * im群组列表数据转换成org表数据
   * @param list
   */
  transTeamToOrg(list: ContactTeam[]): EntityTeamOrg[] {
    const orgList: EntityTeamOrg[] = [];
    list.forEach(item => {
      const { teamId, serverCustom, avatar, intro, name, announcement, owner, memberNum, memberUpdateTime, createTime, updateTime } = item;
      const type = 2000;
      const id = 'team_' + teamId;
      const parent = 'team';
      const originId = 'team_' + teamId;
      const orgRank = createTime;
      let orgName = name || '';
      const visibleCode = 0;
      if (!orgName || orgName.includes('LINGXI_IM_TEAM_DEFAULT_NAME')) {
        try {
          const customObj = JSON.parse(serverCustom);
          orgName = customObj.auto_team_name || orgName;
        } catch (e) {
          console.error('[contact] transTeamToOrg SON.parse serverCustom', e);
        }
      }
      const orgPYName = util.toPinyin(orgName);
      orgList.push({
        id,
        parent,
        orgName,
        orgPYName,
        orgRank,
        type,
        visibleCode,
        originId,
        avatar,
        intro,
        announcement,
        owner,
        memberNum,
        memberUpdateTime,
        createTime,
        updateTime,
        _lastUpdateTime: updateTime,
      });
    });
    return orgList;
  }

  /**
   * 服务端群组成员数据转化成本地通讯录群组成员数据
   * @param item
   */
  transServerTeamMemberList(item: resultObject): ContactTeamMember[] {
    const { tid: teamId, owner, admins, members } = item;
    let teamMember: resultObject[] = [];
    teamMember = members.concat([
      { ...owner, type: 'owner' },
      ...admins.map((adminMember: resultObject) => ({
        ...adminMember,
        type: 'manage',
      })),
    ]);
    return teamMember.map((memberItem: resultObject) => {
      const { type, nick: nickInTeam, createtime: joinTime, accid: account } = memberItem;
      return {
        type: type || 'normal',
        nickInTeam,
        joinTime,
        teamId,
        account,
      };
    });
  }

  /**
   * 服务端群组列表数据转换成数据
   * @param list
   */
  transServerTeamList(list: resultObject[]): ServerTeamRes {
    const teamMemberMap: TeamMemberMap = {};
    const teamList = list.map(item => {
      const {
        icon: avatar,
        intro,
        announcement,
        owner,
        member_update_time: memberUpdateTime,
        createtime: createTime,
        updatetime: updateTime,
        custom: serverCustom,
        tname: name,
        tid: teamId,
      } = item;
      const ownerId = owner.accid;
      const memberList = this.transServerTeamMemberList(item);
      teamMemberMap[teamId] = memberList;
      return {
        serverCustom,
        name,
        teamId,
        avatar,
        intro,
        announcement,
        owner: ownerId,
        memberNum: memberList.length,
        memberUpdateTime,
        createTime,
        updateTime,
      };
    }) as ContactTeam[];
    return {
      teamList,
      teamMemberMap,
    };
  }

  /**
   * 格式化服务端返回的客户数据为DB存储的数据结构
   */
  transServerRepToDB(data: resultObject[], type: 'clue' | 'customer', lastUpdateTime?: number) {
    const _lastUpdateTime = lastUpdateTime || Date.now();
    const orgList: CustomerOrg[] = [];
    let managerList: EntityCustomerOrgManager[] = [];
    let contactList: EntityCustomerContact[] = [];
    let orgContactList: EntityCustomerOrgContact[] = [];
    let contactModelList: ContactModel[] | undefined;
    const idList: string[] = [];
    const transToOrgManager = type === 'customer' ? this.transCustomerToOrgManager : this.transClueToOrgManager;
    const transToOrg = type === 'customer' ? this.transCustomerToOrg : this.transClueToOrg;
    data.forEach(item => {
      const orgId = this.createCustomerOrgId(item, type);
      idList.push(orgId);
      const hasEmail = !!item.contact_list?.some((curContact: resultObject) => curContact.email);
      if (!item.delFlag && hasEmail) {
        // 转化线索联系人数据结构
        const res = this.transToContact(item, type, _lastUpdateTime);
        contactList = contactList.concat(res.contactList);
        orgContactList = orgContactList.concat(res.orgContactList);
        // 转换线索的所有者的数据结构
        managerList = managerList.concat(transToOrgManager.bind(this)(item, _lastUpdateTime));
        // 转换线索的数据结构
        const orgData = transToOrg.bind(this)(item, _lastUpdateTime);
        orgList.push(orgData);
      }
    });
    return {
      orgList,
      managerList,
      contactList,
      orgContactList,
      idList,
      contactModelList,
    };
  }

  /**
   * 客户列表数据转换成组织
   */
  transCustomerToOrg(item: resultObject, _lastUpdateTime: number): EntityCustomerOrg {
    const id = this.createCustomerId(item.company_id);
    const originId = item.company_id;
    const orgName = item.company_name;
    const orgPYName = util.toPinyin(orgName);
    const createTime = typeof item.create_time === 'number' ? item.create_time : new Date(item.create_time).getTime();
    const managerNames = item.manager_list?.map((p: resultObject) => p?.name || '');
    const labelNames = item.label_list?.map((p: resultObject) => p?.label_name || '');
    return {
      id,
      originId,
      visibleCode: 0,
      orgName,
      orgPYName,
      type: 2002,
      orgRank: createTime || 0,
      createTime,
      parent: 'customer',
      area: Array.isArray(item.area)
        ? item.area.reduce((str, cur) => {
            if (cur) {
              str = (str ? str + '-' : '') + cur;
            }
            return str;
          }, '')
        : item.area, // 地区
      zone: item.zone, // 时区
      website: item.website,
      cLevel: item.company_level, // 等级
      cLevelName: item.company_level_name, // 等级
      number: item.company_number, // 编号
      domain: item.company_domain, // 公司域名
      shortName: item.short_name, // 公司简称
      starLevel: item.star_level, // 公司星级
      sourceName: item.source_name,
      companyName: item.company_name,
      labelNames, // 标签集合
      managerNames, // 公司管理者,
      customerType: 'customer',
      _lastUpdateTime,
      lastUpdateTime: item.lastUpdateTime,
      _company: this.getCurrentDomain(),
    };
  }

  /**
   * 线索列表数据转换成组织
   */
  transClueToOrg(item: resultObject, _lastUpdateTime: number): EntityClueOrg {
    const id = this.createClueId(item.id);
    const originId = item.id;
    const orgName = item.company_name || item.name;
    const orgPYName = util.toPinyin(orgName);
    const createTime = typeof item.create_at === 'number' ? item.create_time : new Date(item.create_time).getTime();
    const owner = item.manager_list?.map((p: resultObject) => p?.name || '');
    return {
      id,
      originId,
      visibleCode: 0,
      orgName,
      orgPYName,
      type: 2003,
      orgRank: createTime || 0,
      createTime,
      parent: 'clue',
      number: item.number, // 线索编号
      status: item.status, // 线索状态
      area: item.area, // 地区
      website: item.website,
      domain: item.company_domain, // 公司域名
      companyName: item.company_name,
      managerNames: owner,
      sourceName: item.source_name,
      createType: item.create_type,
      customerType: 'clue',
      _lastUpdateTime,
      lastUpdateTime: item.lastUpdateTime,
      _company: this.getCurrentDomain(),
    };
  }

  /**
   * 客户数据转成组织label数据
   */
  transCustomerToOrgLabel(item: resultObject, _lastUpdateTime: number): EntityCustomerLabel[] {
    const labelList: EntityCustomerLabel[] = [];
    const orgId = this.createCustomerId(item.company_id);
    item.label_list.forEach((label: resultObject) => {
      labelList.push(this.transToLabel(label, orgId, 'customer', _lastUpdateTime));
    });
    return labelList;
  }

  /**
   * 线索数据转换成组织label数据
   * // TODO
   */

  /**
   * 客户数据转换成所属manager数据
   */
  transCustomerToOrgManager(item: resultObject, _lastUpdateTime: number): EntityCustomerOrgManager[] {
    const list = item.manager_list;
    const result: EntityCustomerOrgManager[] = [];
    const orgId = this.createCustomerId(item.company_id);
    const companyId = this.getCurrentDomain();
    list?.forEach((manager: resultObject) => {
      const { id: managerId, name: managerName, email: managerAccount, lastSetTopTime = 0, lastMailTime = 0 } = manager;
      result.push({
        id: util.getUnique(orgId, managerId),
        orgId,
        managerName,
        managerId,
        managerAccount,
        companyId,
        customerType: 'customer',
        _lastUpdateTime,
        _company: this.getCurrentDomain(),
        lastUpdateTime: item.lastUpdateTime,
        lastSetTopTime,
        lastMailTime,
        sortWeight: -(lastSetTopTime * 5 + lastMailTime * 2 + Number(item.company_id || 0)),
      });
    });
    return result;
  }

  /**
   * 线索数据转换成所属manager数据
   */
  transClueToOrgManager(item: resultObject, _lastUpdateTime: number): EntityCustomerOrgManager[] {
    const list = item.manager_list;
    const result: EntityCustomerOrgManager[] = [];
    const orgId = this.createClueId(item.id);
    const companyId = this.getCurrentDomain();
    list.forEach((manager: resultObject) => {
      const { id: managerId, name: managerName, email: managerAccount, lastSetTopTime = 0, lastMailTime = 0 } = manager;
      result.push({
        id: util.getUnique(orgId, managerId),
        orgId,
        managerName,
        managerId,
        managerAccount,
        companyId,
        customerType: 'clue',
        _lastUpdateTime,
        _company: this.getCurrentDomain(),
        lastUpdateTime: item.lastUpdateTime,
        lastSetTopTime,
        lastMailTime,
        sortWeight: -(lastSetTopTime * 5 + lastMailTime * 2 + Number(item.id || 0)),
      });
    });
    return result;
  }

  /**
   * 客户列表中的联系人转换成联系人
   */
  transToContact(data: resultObject, type: CustomerType, _lastUpdateTime: number): TransContactRes {
    const contactList: EntityCustomerContact[] = [];
    const orgContactList: EntityCustomerOrgContact[] = [];
    const orgId = type.startsWith('customer') ? this.createCustomerId(data.company_id) : this.createClueId(data.id);
    const _company = this.getCurrentDomain();
    data.contact_list?.forEach((item: resultObject) => {
      const originId = item.contact_id;
      const name = item.contact_name;
      const contactPYName = util.toPinyin(name);
      const contactLabel = this.getContactLabel(contactPYName);
      const contactPYLabelName = this.getContactPYLabel(name);
      const account = item.email?.toLocaleLowerCase();
      const contactId = item.contact_id;
      // const labelNames: string[] = [];
      // item.label_list.forEach((label: resultObject) => {
      //   const labelType = type.startsWith('customer') ? 'customer_contact' : 'clue_contact';
      //   labelList.push(this.transToLabel(label, contactId, labelType, _lastUpdateTime));
      //   labelNames.push(label?.label_name || '');
      // });
      orgContactList.push({
        id: util.getUnique(orgId, contactId),
        account,
        orgId,
        contactId,
        isMainContact: Boolean(item.main_contact),
        _lastUpdateTime,
        customerType: type,
        _company,
      });
      contactList.push({
        id: contactId,
        contactLabel,
        contactPYName,
        contactPYLabelName,
        name,
        account,
        originId,
        customerType: type,
        avatar: item.contact_icon,
        remark: item.remark,
        whatsApp: item.whats_app,
        phones: item.phones,
        gender: item.gender, // 性别
        birthday: item.birthday, // 生日
        homePage: item.homePage, // 主页
        job: item.job,
        pictures: item.pictures, // 图片展示
        _lastUpdateTime,
        _company,
      });
    });
    return {
      contactList,
      orgContactList,
    };
  }

  getCustomerContactIdList(data: resultObject, type: CustomerType) {
    const contactList: string[] = [];
    const orgContactList: string[] = [];
    const orgId = type.startsWith('customer') ? this.createCustomerId(data.company_id) : this.createClueId(data.id);
    data.contact_list?.forEach((item: resultObject) => {
      const contactId = item.contact_id;
      contactList.push(contactId);
      orgContactList.push(util.getUnique(orgId, contactId));
    });
    return {
      contactList,
      orgContactList,
    };
  }

  getCustomerManagerIdList(data: resultObject, type: CustomerType): string[] {
    const list = data.manager_list;
    const result: string[] = [];
    const orgId = type.startsWith('customer') ? this.createCustomerId(data.company_id) : this.createClueId(data.id);
    list?.forEach((manager: resultObject) => {
      result.push(util.getUnique(orgId, manager.id));
    });
    return result;
  }

  transToLabel(label: resultObject, parentId: string, customerType: CustomerType, _lastUpdateTime: number): EntityCustomerLabel {
    const { label_id: originId = '', label_name: name = '', label_color: color = '', label_create_time: createTime = 0, label_type: type = 0 } = label;
    const _company = this.getCurrentDomain();
    const item: EntityCustomerLabel = {
      id: util.getUnique(parentId, originId),
      originId,
      name,
      color,
      type,
      createTime,
      customerType,
      _lastUpdateTime,
      _company,
    };
    if (customerType === 'customer' || customerType === 'clue') {
      item.orgId = parentId;
    } else if (customerType === 'customer_contact' || customerType === 'clue_contact') {
      item.contactId = parentId;
    }
    return item;
  }

  /**
   * 线索中的联系人中的联系人转换成联系人
   */
  transClueToContact(item: resultObject): EntityContact {
    const id = this.createClueId(item.id);
    const contactName = item.contact_name;
    const contactPYName = util.toPinyin(contactName);
    const contactLabel = this.getContactLabel(contactPYName);
    const contactPYLabelName = this.getContactPYLabel(contactName);
    const accountName = item.email;
    const accountId = item.contact_id;
    const _lastUpdateTime = Date.now();
    return {
      id,
      contactLabel,
      contactPYName,
      contactPYLabelName,
      contactName,
      accountName,
      accountId,
      visibleCode: 0,
      type: 'customer',
      accountType: 2,
      displayEmail: accountName,
      enableIM: false,
      avatar: item.contact_icon,
      remark: item.remark,
      _lastUpdateTime,
    };
  }

  transColleagueToUnitContact(item: resultObject, _lastUpdateTime: number): EntityCustomerUnitContact[] {
    const res: EntityCustomerUnitContact[] = [];
    item.unitIds.forEach((orgId: string) => {
      const contactId = item.accId;
      res.push({
        id: util.getUnique(contactId, orgId),
        contactId,
        orgId,
        email: item.email,
        nickname: item.nickname,
        status: item.status,
        _lastUpdateTime,
      });
    });
    return res;
  }

  private getCurrentDomain() {
    return this.systemApi.getCurrentUser()!.domain;
  }

  getContactLabel(name: string): string {
    let contactLabel = name ? name.charAt(0).toLocaleUpperCase() : '';
    if (/[^A-Z]/.test(contactLabel)) {
      contactLabel = '|';
    }
    return contactLabel;
  }

  getContactPYLabel(name: string): string {
    const pinyinName = name.split('').map((item: string) => util.toPinyin(item));
    const res = pinyinName.reduce((pre: string, cur: string) => {
      pre += cur.charAt(0).toLocaleLowerCase();
      return pre;
    }, '');
    return res;
  }

  transLocal2ServerCustomerId(id: string) {
    if (id.startsWith('customer_')) {
      return id.split('customer_')[1];
    }
    return id;
  }

  createCustomerId(id: string): string {
    return id.startsWith('customer_') ? id : 'customer_' + id;
  }

  private createClueId(id: string): string {
    return id.startsWith('clue_') ? id : 'clue_' + id;
  }

  createCustomerOrgId(data: resultObject, type: CustomerType): string {
    return type.startsWith('customer') ? 'customer_' + data.company_id : 'clue_' + data.id;
  }

  buildContactItem(params: { id: string; contactItemType: ContactInfoType; value: string; type: ContactType; isDefault?: boolean }): EntityContactItem {
    const { id, value, contactItemType, type, isDefault } = params;
    const _lastUpdateTime = Date.now();
    return {
      id: util.getUnique(id, 'MOBILE', value),
      contactId: id,
      contactItemVal: value,
      contactItemType,
      contactItemRefer: '',
      isDefault: isDefault ? 1 : 0,
      type,
      _lastUpdateTime,
    };
  }

  /**
   * 客户列表中的联系人转换成联系人
   */
  transCustomerToContactModel(item: EntityCustomerContact): ContactModel {
    const { id, contactLabel, contactPYName, name, contactPYLabelName, avatar, account, remark, customerType, originId, phones, whatsApp = '', _lastUpdateTime } = item;
    const type: ContactType = customerType.startsWith('customer') ? 'customer' : 'clue';
    const contactInfo: EntityContactItem[] = [
      this.buildContactItem({
        id,
        value: whatsApp,
        contactItemType: 'whatsApp',
        type,
      }),
      this.buildContactItem({
        id,
        type,
        contactItemType: 'EMAIL',
        value: account,
        isDefault: true,
      }),
    ];
    phones?.forEach(value => {
      contactInfo.push(
        this.buildContactItem({
          id,
          value,
          type,
          contactItemType: 'MOBILE',
        })
      );
    });
    return {
      contact: {
        id,
        contactLabel,
        contactPYName,
        contactPYLabelName,
        contactName: name,
        avatar,
        accountType: 2,
        displayEmail: account,
        accountName: account,
        remark,
        type,
        visibleCode: 0,
        enableIM: false,
        accountId: originId,
        color: util.getColor(account),
        _lastUpdateTime,
      },
      contactInfo,
    };
  }

  /**
   * 将'[email]'这样的个人字符数据转换成数据库数据
   * @param arr
   * @param type
   * @param rs
   */
  getFlatStrOrArrInfo(arr: string[], type?: string, rs?: resultObject): any[] {
    const newArr: any[] = [];
    arr.forEach((val: string) => {
      const res = rs ? { ...rs } : {};
      if (type) {
        res.contactItemType = type;
        res.isDefault = 1;
      }
      try {
        if (val.startsWith('[') && val.endsWith(']')) {
          const arr = JSON.parse(val) as [];
          arr.forEach(a => {
            if (type) {
              res.contactItemVal = a;
              newArr.push(res);
            } else {
              newArr.push(a);
            }
          });
        } else if (type) {
          res.contactItemVal = val;
          newArr.push(res);
        } else {
          newArr.push(val);
        }
      } catch (e) {
        console.error('[contact] getFlatStrOrArrInfo', e);
        newArr.push(val);
      }
    });
    return newArr;
  }

  transPersonalOrgContact(list: string[], orgIdList: string[]): EntityPersonalOrgContact[] {
    const res: EntityPersonalOrgContact[] = [];
    const updateTime = Date.now();
    list.forEach(contactId => {
      orgIdList.forEach(groupId => {
        const orgId = this.transOrgIdByPersonalOrg(groupId);
        res.push({
          id: util.getUnique(orgId, contactId),
          orgId,
          contactId,
          updateTime,
        });
      });
    });
    return res;
  }

  /**
   * @deprecated:无人调用？1.27版本之后删除
   * 处理查询出来后的组织树
   * @param config:格式化参数
   */
  transformOrgData(config: transformOrgDataConfig): OrgModel {
    const { level = 9999, orgId = '-1', orgAllList, orgAllMap } = config;
    let children: OrgModel[] = [];

    const mainCompanyId = this.contactUtil.getCurrentCompanyId(config._account);
    // 当前层的组织列表
    let orgList = orgAllList.filter(item => {
      if (orgId === '-1') {
        return item.parent === orgId || item.parent === `${mainCompanyId}_-1`;
      }
      return item.parent === orgId;
    });
    const org = (orgAllMap[orgId] || {}) as EntityOrg;
    if (orgList.length && level > 0) {
      children = orgList.map(item => {
        const res = this.transformOrgData({
          orgId: item.id,
          level: level - 1,
          orgAllList,
          orgAllMap,
        });
        // 组合下一层的组织列表
        orgList = orgList.concat(res.orgList);
        return res;
      });
    }
    orgList.unshift(org);
    return {
      org,
      children,
      orgList,
    };
  }

  /**
   * 数据库中的数据统一输出到UI层的数据格式
   * @param data
   */
  transformContactModel(data: transformData): ContactModel[] {
    const { contactInfoList = [], contactList = [], orgData, needOrgData, orderByIdList, contactIdMap, contactInfoIdMap, _account } = data;
    const contactMap = contactIdMap || util.listToMap<EntityContact>(contactList, 'id');
    const idList = orderByIdList || Object.keys(contactMap);

    const contactInfoMap: Record<string, EntityContactItem[]> = contactInfoIdMap || groupBy(contactInfoList, item => item.contactId);
    const { flattenMuliptleEmails } = data;

    const contactModelList: ContactModel[] = [];
    idList.forEach(id => {
      const contact = contactMap[id];
      if (!contact) {
        return;
      }
      // 必须要是个人联系人&通过hitQuery命中的联系人才能拍平
      const enableFlatten = flattenMuliptleEmails && contact.type === 'personal' && lodashGet(contact, 'hitQuery.length', 0) > 0;

      contact.color = util.getColor(contact.accountName);
      const contactInfo: EntityContactItem[] = contactInfoMap[id] || [
        {
          contactItemType: 'EMAIL',
          contactItemVal: contact.accountName,
          type: contact.type,
          contactId: contact.id,
          id: util.getUnique(contact.id, contact.type, contact.accountName),
          contactItemRefer: '',
          isDefault: 1,
        },
      ];

      // 如果当前数据可以拍扁成多条
      if (enableFlatten) {
        contactInfo.forEach(item => {
          if (item.contactItemType !== 'EMAIL') {
            return;
          }
          const contactModelClone = cloneDeep(contact);
          contactModelClone.hitQueryEmail = item.contactItemVal;
          const o: ContactModel = {
            contact: contactModelClone,
            contactInfo: [item],
            _account,
          };
          contactModelList.push(o);
        });
      } else {
        const o: ContactModel = {
          contact,
          contactInfo,
          _account,
        };
        if (needOrgData && orgData) {
          o.orgs = orgData[id];
        }
        contactModelList.push(o);
      }
    });
    return contactModelList;
  }

  transExclude2FilterCondition(exclude: SearchConditionFilter[], item: resultObject) {
    return exclude.length
      ? !exclude.some(excludeItem => {
          let bool;
          const { val } = excludeItem;
          const { key } = excludeItem;
          if (Array.isArray(val)) {
            bool = val.includes(item[key]);
          } else {
            bool = item[key] === val;
          }
          return bool;
        })
      : true;
  }

  transInclude2FilterCondition(include: SearchConditionFilter[], item: resultObject) {
    return include && include.length > 0
      ? !include.some(includeItem => {
          let bool;
          const { val } = includeItem;
          const { key } = includeItem;
          if (Array.isArray(val)) {
            bool = !val.includes(item[key]);
          } else {
            bool = item[key] !== val;
          }
          return bool;
        })
      : true;
  }

  getPositionByUnit(orgId: string[]): string[][] {
    console.log('orgId', orgId);
    // TODO: getOrgsByOrgId
    return [];
  }

  transServerSearch(list: resultObject[]): ContactSearch[] {
    const searchList: ContactSearch[] = list.map(item => {
      const contactPYName = util.toPinyin(item.qiyeNickName);
      const pinyinName = item.pinyinName || item.qiyeNickName.split('').map((n: string) => util.toPinyin(n));
      const contactPYLabelName = pinyinName.reduce((pre: string, cur: string) => pre + cur.charAt(0).toLocaleLowerCase(), '');
      const contactName = item.qiyeNickName;
      const accountName = item.email;
      let avatar = '';
      let avatarPendant = '';
      if (item.iconVO) {
        avatar = item.iconVO.mediumUrl;
        avatarPendant = item.iconVO.pendantUrl;
      }
      return {
        id: item.qiyeAccountId,
        contactPYName,
        contactPYLabelName,
        contactName,
        accountName,
        position: this.getPositionByUnit(item.unitIdList),
        type: 'enterprise',
        avatar,
        avatarPendant,
        visibleCode: item.showCode,
        enableIM: item.enableIM,
        yunxin: item.yunxinAccountId,
        accountType: item.type,
      };
    });
    return searchList;
  }

  transContactModel2ContactSearch(list: ContactModel[]): ContactSearch[] {
    return list.map(item => {
      const {
        contact: {
          id,
          contactName,
          accountName,
          contactPYName,
          contactPYLabelName,
          position,
          type,
          avatar,
          avatarPendant,
          visibleCode,
          enableIM,
          accountType,
          hitQueryEmail,
          remark,
          hitQuery = [],
        },
      } = item;
      const emailCount = item.contactInfo.filter(item => item.contactItemType === 'EMAIL').length;
      return {
        id,
        contactPYName,
        contactPYLabelName,
        contactName,
        accountName,
        position,
        type,
        avatar,
        avatarPendant,
        visibleCode,
        enableIM,
        yunxin: '',
        accountType,
        hitQueryEmail,
        hitQuery,
        remark,
        emailCount,
      };
    });
  }

  transOrg2OrgSearch(list: EntityOrg[]): OrgSearch[] {
    return list.map(item => {
      const { id, orgName, orgPYName, orgRank, hitQuery, type, visibleCode, originId } = item;
      return {
        id,
        orgName,
        orgPYName,
        type,
        orgRank,
        visibleCode,
        hitQuery,
        originId,
      };
    });
  }

  transEdmContact2EdmContactSearch(list: ContactModel[]): CustomerContactSearch[] {
    const res: CustomerContactSearch[] = [];
    list.forEach(item => {
      const {
        contact: { id, contactName, accountName, contactPYName, contactPYLabelName, type },
        customerOrgModel,
      } = item;
      if (customerOrgModel) {
        res.push({
          id,
          orgId: '',
          _lastUpdateTime: 0,
          contactPYName,
          contactPYLabelName,
          contactName,
          accountName,
          type: type as CustomerOrgType,
        });
      }
    });
    return res;
  }

  transEdmOrg2EdmOrgSearch(list: CustomerOrg[]): CustomerOrgSearch[] {
    const res: CustomerOrgSearch[] = [];
    list.forEach(item => {
      const { id, _company, _lastUpdateTime, orgName, orgPYName, type, orgRank, customerType, hitQuery, customerRole, originId } = item;
      res.push({
        id,
        _lastUpdateTime,
        _company,
        orgName,
        orgPYName,
        type,
        orgRank,
        customerType: customerType as CustomerOrgType,
        hitQuery,
        customerRole,
        originId,
      });
    });
    return res;
  }

  transCustomerRole2EmailRole(type: ContactType, role?: CustomerRole): EmailRoles {
    if (!role) {
      return role as unknown as EmailRoles;
    }
    const lxType = ['enterprise', 'personal', 'external'];
    if (lxType.includes(type)) {
      return type as EmailRoles;
    }
    if (role === 'manager') {
      return ('my' + lodashCapitalize(type)) as EmailRoles;
    }
    return (role + lodashCapitalize(type)) as EmailRoles;
  }

  transEmailRole2CustomerRole(role?: EmailRoles): CustomerRole {
    return role as CustomerRole;
  }

  transfromPersonalMarkRawData(rawDataList: EntityPersonalMark[]): ContactPersonalMarkSimpleModel[] {
    // 按照mark进行排序(先只按照marked排序 看看是否满足业务流程 不满足再加updateTime or name等策略)
    return lodashOrderBy(rawDataList, ['marked']);
  }

  /**
   *
   * @param model contactUpdateParams
   * @returns
   */

  transformPersonalParam2PersonalMarkEntityList(model: contactUpdateParams): EntityPersonalMark[] {
    const _lastUpdateTime = Date.now();
    if (Array.isArray(model.emailList) && model.emailList.length) {
      return [
        {
          id: util.getUnique(model.accountId),
          value: model.accountId,
          marked: model.marked,
          type: 1,
          emails: model.emailList,
          name: model.name,
          _lastUpdateTime,
        } as EntityPersonalMark,
      ];
    }
    return [
      {
        id: util.getUnique(model.accountId),
        value: model.accountId,
        marked: model.marked!,
        type: 1,
        emails: [],
        name: model.name,
        _lastUpdateTime,
      },
    ];
  }

  /**
   * 获取到的组织列表中的数据加入org表（相同的数据update 通过主键id）
   * @param list: 通讯录列表
   * */
  transOrg2EntityOrg(params: { list: resultObject[]; _lastUpdateTime?: number; _account?: string }): { entityOrgList: EntityOrg[]; needDeleteOrgIds: string[] } {
    const { list: _list, _lastUpdateTime = Date.now(), _account } = params;
    const list = Array.isArray(_list) ? _list : [_list];

    const mainCompanyId = this.contactUtil.getCurrentCompanyId(_account);

    const entityOrgList: EntityOrg[] = [];
    const needDeleteOrgIds: string[] = [];

    list.forEach(item => {
      if (![0, 7].includes(item.showCode || 0)) {
        needDeleteOrgIds.push(item.unitId as string);
        return;
      }

      const { orgId } = item;
      const { type } = item;
      let id = item.unitId + '';
      let parent = item.parentUnitId + '' || (mainCompanyId === orgId ? '-1' : `${orgId}_-1`);
      const orgName = item.unitName;
      const orgRank = item.unitRank;
      const visibleCode = item.showCode === undefined ? 0 : item.showCode;
      const originId = item.oriUnitId + '';

      // 新增关联
      if (type === 99) {
        id = mainCompanyId === orgId ? '-1' : `${orgId}_-1`;
        parent = '-2';
      }
      const orgPYName = util.toPinyin(orgName);
      entityOrgList.push({
        id,
        parent,
        orgName,
        orgPYName,
        orgRank,
        type,
        visibleCode,
        originId,
        enterpriseId: item.orgId,
        _lastUpdateTime,
      } as EntityOrg);
    });

    return { entityOrgList, needDeleteOrgIds };
  }

  private transformCoreContact2EntityContact(
    item: CoreContactServerRawData,
    fullUnitPathMap: Map<string, EntityOrgPathList>,
    options: {
      iconPrefix: string;
      enterpriseId: number;
      lastUpdateTime: number;
      _account?: string;
    }
  ) {
    const { iconPrefix = '', enterpriseId, _account } = options;
    const currentCompanyId = this.contactUtil.getCurrentCompanyId(_account);
    const obj: resultObject = {};
    obj.displayEmail = item.email;
    obj.contactName = item.nickName;
    obj.accountName = item.email.toLocaleLowerCase();
    obj.accountId = util.getUnique(item.email, '');
    obj.accountOriginId = item.accountId;
    obj.contactPYName = util.toPinyin(item.nickName);
    const pinyinLabelArr: string[] = [];
    item.nickName.split('').forEach((_item: string) => {
      const pinyin = util.toPinyin(_item);
      pinyinLabelArr.push(pinyin.slice(0, 1));
      return pinyin;
    });
    obj.contactPYLabelName = pinyinLabelArr.join('');
    // 关联企业功能:关联企业通讯录业务需要在contact表里插入一个orgId字段来做关联企业筛查
    obj.enterpriseId = enterpriseId;
    obj.accountVisible = 0;
    obj.accountStatus = 0;
    obj.accountType = item.type;

    obj.position = (item.rankList || []).reduce((total, current) => {
      const { unitId } = current;
      if (fullUnitPathMap.has(unitId)) {
        total.push(fullUnitPathMap.get(unitId)!.pathNameList);
      }
      return total;
    }, [] as string[][]);

    obj.enableIM = item.type === 2;
    if (currentCompanyId) {
      obj.enableIM = obj.enableIM && obj.enterpriseId === currentCompanyId;
    }
    obj.avatar = lodashGet(item, 'smallIconUrl.length', 0) > 0 ? iconPrefix + item.smallIconUrl : '';
    obj.avatarPendant = '';
    obj.visibleCode = 0;
    obj.id = obj.accountOriginId;
    obj.contactLabel = this.getContactLabel(obj.contactPYName);
    obj.type = 'enterprise';
    obj.updateTime = new Date();
    obj._lastUpdateTime = options.lastUpdateTime;

    obj.source = 'core';

    return obj as EntityContact;
  }

  private transformCoreContact2EntityContactItem(item: CoreContactServerRawData, enterpriseId: number, lastUpdateTime: number): EntityContactItem {
    const email = (item.email || '').toLocaleLowerCase();
    const contactItemType = 'EMAIL';
    return {
      contactItemVal: email,
      contactItemRefer: '',
      contactItemType,
      emailType: 1,
      // 默认是主显账号
      isDefault: 1,
      contactId: item.accountId,
      enterpriseId,
      updateTime: Date.now(),
      id: util.getUnique(item.accountId, contactItemType, email),
      type: 'enterprise',
      source: 'core',
      _lastUpdateTime: lastUpdateTime,
    };
  }

  // 将服务端的个人分组数据转成成员列表数据
  transPersonalGroup2EntityOrgList(list: resultObject[], _lastUpdateTime: number): { groupList: EntityPersonalOrg[]; markedList: Omit<EntityPersonalMark, 'id'>[] } {
    const groupList: EntityPersonalOrg[] = [];
    const markedList: Omit<EntityPersonalMark, 'id'>[] = [];
    list.forEach(item => {
      const { groupId: id, groupName: name, marked } = item;
      groupList.push({
        id: this.transOrgIdByPersonalOrg(id),
        orgName: name,
        orgPYName: util.toPinyin(name),
        originId: id,
        type: 2001,
        visibleCode: 0,
        parent: 'personal_org',
        orgRank: 1,
        updateTime: _lastUpdateTime,
        marked,
        _lastUpdateTime,
      });

      if (typeof marked === 'number' && marked > 0) {
        markedList.push(this.transPersonal2Mark(item, _lastUpdateTime, 2));
      }
    });
    return {
      groupList,
      markedList,
    };
  }

  private transformCoreContact2EntityOrgContact(item: CoreContactServerRawData, enterpriseId: number, lastUpdateTime: number): EntityOrgContact[] {
    if (!item || !Array.isArray(item.rankList) || !item.rankList.length) {
      return [];
    }
    return item.rankList.map(rankItem => ({
      id: util.getUnique(rankItem.unitId, item.accountId),
      orgId: rankItem.unitId,
      contactId: item.accountId,
      yunxinId: '',
      rankNum: rankItem.accountRank,
      enterpriseId,
      source: 'core',
      type: 'enterprise',
      _lastUpdateTime: lastUpdateTime,
    }));
  }

  // 将通讯录核心数据转换成服务DB格式的contact/contactItem/orgContact数据
  transformCoreContact2MultipeData(
    modeList: CoreContactServerRawData[],
    fullUnitPathlist: EntityOrgPathList[],
    options: {
      enterpriseId: number;
      iconPrefix: string;
      lastUpdateTime: number;
      _account?: string;
    }
  ): EnterpriseContactThread {
    const contactList: EntityContact[] = [];
    const contactItemList: EntityContactItem[] = [];
    const orgContactList: EntityOrgContact[] = [];

    const { enterpriseId, lastUpdateTime } = options;
    console.time('[contact_transform]transformCoreContact2MultipeData');
    const fullUnitPathMap = new Map(fullUnitPathlist.map(item => [item.id, item]));

    modeList.forEach(_item => {
      if (!_item.email || !_item.email.length) {
        return;
      }
      const item = { ..._item, orgId: enterpriseId };
      contactList.push(
        this.transformCoreContact2EntityContact(item, fullUnitPathMap, {
          ...options,
          lastUpdateTime,
        })
      );
      contactItemList.push(this.transformCoreContact2EntityContactItem(item, enterpriseId, lastUpdateTime));
      orgContactList.splice(Math.max(0, orgContactList.length - 1), 0, ...this.transformCoreContact2EntityOrgContact(item, enterpriseId, lastUpdateTime));
    });

    console.timeEnd('[contact_transform]transformCoreContact2MultipeData');
    console.log('[contact_transform]transformCoreContact2MultipeData', contactList, contactItemList, orgContactList);

    return {
      contact: contactList,
      contactItem: contactItemList,
      orgContact: orgContactList,
    };
  }

  /**
   * @deprecated: 目前没啥人调用。可以考虑1.25给下掉
   * @description:查找当前部门的完整部门路径(从叶节点向上查找)
   * @param options
   * @param options.partPathMap 不完整路径Map<key:unitId> 第一次不用填写
   * @param options.sourceEntityOrgList 数据源信息
   * @param options.relationshipMap 父子集映射关系 key是父级unitId value是子集集合
   * @returns
   */
  lookupOrgFullPath(options: {
    partPathMap?: Map<string, Record<'idPathList' | 'namePathList', string[]>>;
    sourceEntityOrgList: EntityOrg[];
    relationshipMap: Map<string, Set<string>>;
  }): {
    fullPathMap: Map<string, Record<'idPathList' | 'namePathList', string[]>>;
    needAddParentPathMap: Map<string, Set<string>>;
  } {
    const { sourceEntityOrgList, partPathMap, relationshipMap } = options;

    const fullPathMap = partPathMap || new Map();
    const nextNeedAddPathList: Map<string, Set<string>> = new Map();

    // 如果当前org返回的是完整部门路径(有idPathList & namePathList)
    const addFullPathInfo = (entityOrgItem: EntityOrg) => {
      const { id, idPathList, namePathList } = entityOrgItem;

      if (!relationshipMap.has(id)) {
        return;
      }

      relationshipMap.get(id)!.forEach(childrenId => {
        const chilrenIdPathlist = idPathList!;
        const chilrenNamePathList = namePathList!;

        if (fullPathMap.has(childrenId)) {
          const { idPathList: subIdPathList = [], namePathList: subNamePathlist = [] } = fullPathMap.get(childrenId)!;
          chilrenIdPathlist.push(...subIdPathList);
          chilrenNamePathList.push(...subNamePathlist);
        }

        fullPathMap.set(childrenId, {
          idPathList: chilrenIdPathlist,
          namePathList: chilrenNamePathList,
        });
      });

      relationshipMap.delete(id);
    };

    // 如果当前org没有完整部门路径(没有idPathList & namePathList)
    const addPartPathInfo = (entityOrgItem: EntityOrg) => {
      const { orgName, id, parent } = entityOrgItem;

      if (!relationshipMap.has(id)) {
        return;
      }

      relationshipMap.get(id)!.forEach(childrenId => {
        const chilrenIdPathlist = [id];
        const chilrenNamePathList = [orgName];

        if (fullPathMap.has(childrenId)) {
          const { idPathList: subIdPathList = [], namePathList: subNamePathlist = [] } = fullPathMap.get(childrenId)!;
          chilrenIdPathlist.push(...subIdPathList);
          chilrenNamePathList.push(...subNamePathlist);
        }

        fullPathMap.set(childrenId, {
          idPathList: chilrenIdPathlist,
          namePathList: chilrenNamePathList,
        });
      });

      // 如果还需要向上查找
      if (parent !== '-2') {
        nextNeedAddPathList.set(parent, new Set([...(relationshipMap.get(id) || []), ...(nextNeedAddPathList.get(parent) || [])]));
      }

      relationshipMap.delete(id);
    };

    sourceEntityOrgList.forEach(entityOrgItem => {
      const { idPathList } = entityOrgItem;

      // 如果entityOrg中有idPathlist信息 不需要在向上去查找部门路径信息了
      // 1.20.x版本org没有补充idPathlist & namePathlist信息 需要一层一层向上查找
      // 争取在1.21.x版本之后大部分场景不要走到层层向上查找逻辑去
      if (idPathList && idPathList.length) {
        addFullPathInfo(entityOrgItem);
      } else {
        addPartPathInfo(entityOrgItem);
      }
    });

    return {
      fullPathMap,
      needAddParentPathMap: nextNeedAddPathList,
    };
  }

  /**
   * @description 将服务端的组织数据数据拍扁成完整的部门完整路径信息&entityOrg格式的数组(减少一次遍历)
   * @example: {'123':{pathIdList:['网易灵犀','桌面办公','产业部门','前端组']}}
   * @returns {fullPathList:EntityOrgPathList[], entityOrgList:EntityOrg[]}
   */
  flattenServerUnit2FullOrgPath(
    rawData: CoreOrgServerRawData[],
    options: {
      visibleCode: number;
      lastUpdateTime: number;
      _account?: string;
    },
    _companyId?: number
  ): { fullPathList: EntityOrgPathList[]; entityOrgList: EntityOrg[]; orgTreeMap: Map<string, string[]> } {
    if (!Array.isArray(rawData) || !rawData.length) {
      return {
        fullPathList: [],
        entityOrgList: [],
        orgTreeMap: new Map(),
      };
    }
    const randomKey = Math.random();
    const mainCompanyId = this.contactUtil.getCurrentCompanyId(options._account);
    const { lastUpdateTime: _lastUpdateTime } = options;
    const companyId = _companyId || mainCompanyId;
    console.time(`[contact_transform]flattenServerUnit2TreadOrgPath.${randomKey}:${rawData.length}`);
    const flattenMap: Map<string, EntityOrgPathList> = new Map();

    const rawDataMap: Map<string, EntityOrg> = new Map();
    const rootKey: string[] = [];

    const groupByParentIdMap: Map<string, string[]> = new Map();
    rawData.forEach(item => {
      if (item.type === 99) {
        item.parentUnitId = '-2';
        item.unitId = companyId && companyId !== mainCompanyId ? `${companyId}_-1` : '-1';
      }

      // 如果parentUnitId=""或者=mainCompanyId_-1 则表示当前部门是一级部门
      if (!item.parentUnitId || !item.parentUnitId.length || item.parentUnitId === '-1' || item.parentUnitId === `${companyId}_-1`) {
        item.parentUnitId = companyId && companyId !== mainCompanyId ? `${companyId}_-1` : '-1';
        rootKey.push(item.unitId);
      }

      rawDataMap.set(item.unitId, {
        orgName: item.unitName,
        id: item.unitId,
        originId: item.oriUnitId || item.unitId.split('_').pop()! || '',
        orgPYName: util.toPinyin(item.unitName),
        parent: item.parentUnitId,
        type: item.type,
        orgRank: item.rank,
        visibleCode: options.visibleCode || 0,
        enterpriseId: companyId,
        source: 'core',
        _lastUpdateTime,
        idPathList: [],
        namePathList: [],
      });

      if (!groupByParentIdMap.has(item.parentUnitId)) {
        groupByParentIdMap.set(item.parentUnitId, []);
      }
      groupByParentIdMap.get(item.parentUnitId)!.push(item.unitId);
    });

    // congRoot开始 根据每一个orgId查询他的的完整部门路径
    const traverServerContactByBreadth = (
      keys: string[],
      storedMap: Map<string, EntityOrgPathList>,
      groupByParentIdMap: Map<string, string[]>,
      rawDataMap: Map<string, EntityOrg>
    ): Map<string, EntityOrgPathList> => {
      let childrenKeys: string[] = [];
      keys.forEach(singleKey => {
        // 当前部门的二级部门
        const _increasedChildrenKeys = groupByParentIdMap.has(singleKey) ? groupByParentIdMap.get(singleKey)! : [];

        // 将二级部门作为下次遍历的parentKeys
        childrenKeys = [...childrenKeys, ..._increasedChildrenKeys];

        // 插入当前部门的信息
        const rawDataItem = rawDataMap.get(singleKey)!;
        const { id: unitId, parent: parentUnitId, orgName: unitName } = rawDataItem;

        const parentPathIdList: string[] = [unitId];
        const parentPathNameList: string[] = [unitName];

        if (storedMap.get(parentUnitId)) {
          const { pathIdList: _parentPathIdList, pathNameList: _parentPathNameList } = storedMap.get(parentUnitId)!;
          parentPathIdList.splice(0, 0, ..._parentPathIdList);
          parentPathNameList.splice(0, 0, ..._parentPathNameList);
        } else if (rawDataMap.has(parentUnitId) && !parentUnitId.endsWith('-1')) {
          const { id: singleParentUnitId, orgName: singleParentUnitName } = rawDataMap.get(parentUnitId)!;
          parentPathIdList.unshift(singleParentUnitId);
          parentPathNameList.unshift(singleParentUnitName);
        }

        rawDataMap.set(unitId, {
          ...rawDataItem,
          idPathList: parentPathIdList,
          namePathList: parentPathNameList,
        });

        storedMap.set(unitId, {
          id: unitId,
          parentId: parentUnitId,
          pathIdList: parentPathIdList,
          pathNameList: parentPathNameList,
          enterpriseId: companyId,
        });
      });

      if (Array.isArray(childrenKeys) && childrenKeys.length) {
        return traverServerContactByBreadth(childrenKeys, storedMap, groupByParentIdMap, rawDataMap);
      }
      return storedMap;
    };

    traverServerContactByBreadth(rootKey, flattenMap, groupByParentIdMap, rawDataMap);

    console.timeEnd(`[contact_transform]flattenServerUnit2TreadOrgPath.${randomKey}:${rawData.length}`);

    return {
      fullPathList: [...flattenMap.values()],
      entityOrgList: [...rawDataMap.values()],
      orgTreeMap: groupByParentIdMap,
    };
  }

  // 服务端组织数据和本地通讯录数据进行比对
  compareServerAndLocalOrg(serverOrgList: CoreOrgServerRawData[], localOrgList: OrgSearch[]) {
    console.time(`[contact_transform]compareServerAndLocalContact${localOrgList.length}`);
    // todo@guochao:这个功能需要验证效果>2W条数据效果。在测试期间验证一下对比的耗时效果
    // 可以拆成1W条一次进行比较
    console.timeEnd(`[contact_transform]compareServerAndLocalContact${localOrgList.length}`);
    return serverOrgList;
  }
}

export const ContactTransformInstance = new ContactTransform();
