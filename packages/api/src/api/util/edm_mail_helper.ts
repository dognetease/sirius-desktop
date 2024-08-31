import { MailEntryModel } from '@/api/logical/mail';
import { CustomerOrgModel } from '@/api/logical/contact_edm';
import { EntityContact } from '@/api/_base/api';
import { EmailRoleBase, EmailRoleBaseRes, EmailRoleBaseScoreMap, EmailRoles, MailPlusEdmPrivilegeViewData, RelatedCompanyInfo } from '@/api/logical/mail_plus_customer';

//原来的优先级： 同事＞自己的客户>同事的客户>公海客户>自己的线索>同事的线索>公海线索＞个人联系人＞陌生人
//0830版本新的优先级： 同事＞自己的客户>自己的线索>同事的客户>同事的线索>公海客户>公海线索＞个人联系人＞陌生人
export const RoleScoreMap: Record<EmailRoles, number> = {
  enterprise: 100,
  // myCustomer: 90,
  // colleagueCustomer: 80,
  // colleagueCustomerNoAuth: 75,
  // openSeaCustomer: 70,
  // myClue: 60,
  // colleagueClue: 70,
  // openSeaClue: 40,
  myCustomer: 90,
  myClue: 80,
  colleagueCustomer: 70,
  colleagueCustomerNoAuth: 65,
  colleagueClue: 60,
  colleagueClueNoAuth: 55,
  openSeaCustomer: 50,
  openSeaClue: 40,
  personal: 30,
  external: 20,
};

export const edmMailHelper = {
  getCustomerInfo(mailModel: MailEntryModel): CustomerOrgModel | undefined {
    return mailModel?.sender?.contact.customerOrgModel;
  },
  filterEdmFid(fid: number) {
    // 过滤已删除和草稿箱
    return fid > 0 && ![2, 4].includes(fid);
  },
  isEdmMailReq(checkType = '') {
    return ['checkCustomerMail', 'checkSubordinateMail'].includes(checkType);
  },
  transContactModelToEmailRole(contact: EntityContact): EmailRoleBase {
    return {
      role: contact.type as EmailRoles,
      email: contact.displayEmail || contact.accountName,
      companyId: '',
      companyName: '',
      contactId: contact.id,
      contactName: contact.contactName,
      contactAvatar: contact.avatar,
      relatedCompanyInfo: [],
    };
  },
  // 返回1，prev优先级高，返回-1，next优先级高，返回0，一样高
  compareRoles(prev: EmailRoleBase, next: EmailRoleBase, viewPrivilege?: MailPlusEdmPrivilegeViewData): number {
    // 先比较 role
    const prevScore = edmMailHelper.getRoleScoreByViewPrivilege(prev.role, viewPrivilege) || 0;
    const nextScore = edmMailHelper.getRoleScoreByViewPrivilege(next.role, viewPrivilege) || 0;
    if (prevScore > nextScore) {
      return 1;
    }
    if (prevScore < nextScore) {
      return -1;
    }
    // 然后比较 customerCreateTime
    const prevCreateTime = prev.customerCreateTime || 0;
    const nextCreateTime = next.customerCreateTime || 0;
    if (prevCreateTime > nextCreateTime) {
      return 1;
    }
    if (prevCreateTime < nextCreateTime) {
      return -1;
    }
    // 最后比较 contactId
    const prevContactId = +prev.contactId;
    const nextContactId = +next.contactId;
    if (prevContactId > nextContactId) {
      return 1;
    }
    if (prevContactId < nextContactId) {
      return -1;
    }
    return 0;
  },

  getRoleScoreByViewPrivilege(role: EmailRoles, viewPrivilege?: MailPlusEdmPrivilegeViewData) {
    const originScore = RoleScoreMap[role] || 0;
    if (!viewPrivilege) {
      return originScore;
    }
    // 本期0715把此类数据忽略，进行下一个优先级的匹配
    // if (role === 'colleagueCustomerNoAuth') {
    //   return -1000;
    // }
    if (role === 'myCustomer' || role === 'colleagueCustomer') {
      return viewPrivilege.customer ? originScore : -1000;
    }
    if (role === 'openSeaCustomer') {
      return viewPrivilege.openSeaCustomer ? originScore : -1000;
    }
    if (role === 'myClue' || role === 'colleagueClue') {
      return viewPrivilege.clue ? originScore : -1000;
    }
    if (role === 'openSeaClue') {
      return viewPrivilege.openSeaClue ? originScore : -1000;
    }
    return originScore;
  },

  insertIntoDataMap(params: {
    dataMap: EmailRoleBaseScoreMap;
    newData: EmailRoleBase;
    emailSet: Set<string>;
    maxScore?: number;
    privilege?: MailPlusEdmPrivilegeViewData;
  }) {
    const { dataMap, newData, emailSet, maxScore = 0, privilege } = params;
    const { email, role } = newData;
    const existData = dataMap.get(email);
    const score = edmMailHelper.getRoleScoreByViewPrivilege(role, privilege);
    // 如果 score === -1000，那么说明没有对应的权限，不应该被插入，要过滤掉
    if (score < 0) {
      return;
    }
    // 替换或者插入的情况：没有旧数据，或旧数据的优先级低，或旧数据的contactId小于新数据的contactId（创建时间更晚）
    const replaceOrInsert = !existData || existData.score < score || (existData.score === score && +existData.data.contactId < +newData.contactId);
    // 不替换数据，需要将旧数据或者新数据插入到 relatedCompanyInfo：有旧数据，且优先级相同，且新旧数据的客户ID不同
    const toPushIntoRelatedInfo = existData && existData.score === score && existData.data.companyId !== newData.companyId;
    if (replaceOrInsert && !toPushIntoRelatedInfo) {
      dataMap.delete(email);
      dataMap.set(email, { score, data: newData });
      // 只有在满足了最高权限后，才会删除，否则还需保留在 emailSet 中进行后续查询处理
      if (score === maxScore) {
        emailSet.delete(email);
      }
    } else if (toPushIntoRelatedInfo) {
      const existCreateTime = existData.data.customerCreateTime || 0;
      const newCreateTime = newData.customerCreateTime || 0;
      let relatedCustomer: RelatedCompanyInfo;
      // 旧数据的创建时间晚于新数据的创建时间，那么把新数据放到 relatedCompanyInfo，否则把旧数据放到 relatedCompanyInfo 中
      if (existCreateTime >= newCreateTime) {
        relatedCustomer = { companyId: String(newData.companyId), companyName: String(newData.companyName) };
      } else {
        existData.data = {
          ...newData,
          relatedCompanyInfo: existData.data.relatedCompanyInfo,
        };
        relatedCustomer = { companyId: String(existData.data.companyId), companyName: String(existData.data.companyName) };
      }
      const tempSet = new Set(existData.data.relatedCompanyInfo.map(v => v.companyId));
      if (!tempSet.has(relatedCustomer.companyId)) {
        existData.data.relatedCompanyInfo.push(relatedCustomer);
        tempSet.add(relatedCustomer.companyId); // 防止添加两次
      }
      if (!tempSet.has(existData.data.companyId)) {
        existData.data.relatedCompanyInfo.push({ companyId: String(existData.data.companyId), companyName: String(existData.data.companyName) });
      }
    }
  },
  getMyCustomerByEmailList: (res: EmailRoleBaseRes, emailList: string[]): string[] => {
    const idSet: Set<string> = emailList
      .filter(email => {
        const item = res[email];
        return item?.role === 'myCustomer' && item.companyId;
      })
      .reduce((total, email) => {
        const current = res[email];
        total.add(current.companyId);
        if (Array.isArray(current.relatedCompanyInfo)) {
          current.relatedCompanyInfo.forEach(v => {
            total.add(v.companyId);
          });
        }
        return total;
      }, new Set() as Set<string>);
    return [...idSet];
  },
};
