// // @ts-nocheck
// import type { ContactModel, EntityOrgTeamContact } from '@/api/_base/api';

// import type { contactCondition, ContactTeamMember, CorpApiContactItem } from '@/api/logical/contactAndOrg';
// import { ContactDBInstance } from './contact_dbl';

// import { api } from '@/api/api';
// import { util } from '@/api/util';

// const httpImpl = api.getDataTransApi();
// const systemApi = api.getSystemApi();
// const contactDb = ContactDBInstance;

// /**
//  * corp Api的ContactItem转换到ContactModel
//  * @param apiContactItem
//  * @returns
//  */
// function corpApiContactItemToContactModel(apiContactItem: CorpApiContactItem): ContactModel {
//   const firstPinYiName = apiContactItem.pinyinName[0];
//   const commonContactInfo = {
//     // 暂时设置默认值
//     unreadItemCount: 0,
//     updateTime: new Date().getTime() - 1,
//     createTime: new Date().getTime() - 1,
//     contactId: apiContactItem.qiyeAccountId,
//     contactItemRefer: '',
//   };

//   const item: ContactModel = {
//     contact: {
//       id: apiContactItem.qiyeAccountId,
//       contactLabel: firstPinYiName ? firstPinYiName[0].toUpperCase() : '',
//       contactPYName: apiContactItem.pinyinName.join(''),
//       contactPYLabelName: apiContactItem.pinyinName.map(item => item[0]).join(''),
//       accountName: apiContactItem.email,
//       accountStatus: apiContactItem.status,
//       accountVisible: apiContactItem.showCode,
//       color: util.getColor(apiContactItem.email),
//       type: 'enterprise',
//       avatar: apiContactItem.iconVO?.bigUrl,
//       accountId: apiContactItem.qiyeAccountId,
//       enableIM: apiContactItem.enableIM,
//       contactName: apiContactItem.qiyeNickName || apiContactItem.qiyeAccountName,
//       visibleCode: apiContactItem.showCode,
//       hitQuery: ['contactName', 'contactPYName'],
//     },
//     contactInfo: [
//       {
//         contactItemVal: apiContactItem.email,
//         contactItemType: 'EMAIL',
//         isDefault: 1,
//         id: '',
//         type: 'enterprise',
//         hitQuery: ['contactItemVal'],
//         ...commonContactInfo,
//       },
//       {
//         contactItemVal: apiContactItem.yunxinAccountId,
//         contactItemType: 'yunxin',
//         isDefault: 0,
//         id: apiContactItem.yunxinAccountId,
//         type: 'enterprise',
//         ...commonContactInfo,
//       },
//     ],
//   };
//   return item;
// }

// /**
//  * 列表转换
//  * @param apiContactItemList
//  * @param getColorFn
//  * @returns
//  */
// function corpApiContactItemListToContactModelList(apiContactItemList: Array<CorpApiContactItem>): Array<ContactModel> {
//   return apiContactItemList.map(apiContactItem => corpApiContactItemToContactModel(apiContactItem));
// }

// function getRequestInfoFromCondition(condition: contactCondition): { url: string | null | undefined; params?: any; passed?: boolean } {
//   const { type, value } = condition;
//   // 没有value值无法搜索
//   if (!value || !value.length) return { url: null };

//   let requestUrl;
//   let requstParams;
//   const domain = systemApi.getCurrentUser()?.domain;
//   let passed = true;
//   switch (type) {
//     case 'EMAIL':
//       requestUrl = systemApi.getUrl('corpGetContactsByEmails');
//       const emailSet = new Set<string | number>();
//       //
//       const emailFilted = value.filter((email: string | number) => {
//         const emailStr = email.toString();
//         if (!emailStr.endsWith(`@${domain}`)) {
//           // 外域邮箱搜索不到联系人信息
//           return false;
//         }
//         if (emailSet.has(email)) {
//           return false;
//         }
//         emailSet.add(email);
//         return true;
//       });

//       if (!emailFilted || !emailFilted.length) {
//         passed = false;
//       }

//       requstParams = {
//         domain,
//         emailList: emailFilted.join(','),
//       };

//       break;
//     case 'yunxin':
//       requestUrl = systemApi.getUrl('corpGetContactsByYunXinIds');
//       requstParams = {
//         domain,
//         yunxinAccIdList: value.join(','),
//       };
//       break;
//     default:
//     // 暂不支持
//   }

//   return {
//     url: requestUrl,
//     params: requstParams,
//     passed,
//   };
// }

// /**
//  * 通过type和value数组从服务器搜索联系人
//  * @param params
//  */
// async function getContactModelListByIds(condition: contactCondition): Promise<Array<ContactModel>> {
//   try {
//     const requestInfo = getRequestInfoFromCondition(condition);
//     const defaultReturn: Array<ContactModel> = [];

//     if (!requestInfo.url || !requestInfo.passed) {
//       return defaultReturn;
//     }

//     const res = await httpImpl.post(requestInfo.url, requestInfo.params).then(res => res.data);
//     const isSuccess = res?.success;
//     if (!isSuccess) {
//       return defaultReturn;
//     }

//     const itemList: Array<CorpApiContactItem> = res?.data?.itemList || [];
//     const result = corpApiContactItemListToContactModelList(itemList);
//     return result;
//   } catch (ex) {
//     console.error('[contact] getContactModelListByIds', ex);
//     return [];
//   }
// }

// /**
//  * 通过contactItem来查找ContactTeamMember
//  * @param list
//  * @param contactItem
//  * @returns
//  */
// function getContactTeamMemberByContactModelItem(teamMemberList: Array<ContactTeamMember>, contactItem: ContactModel): ContactTeamMember | null | undefined {
//   if (!contactItem || !contactItem.contactInfo || !contactItem.contactInfo.length) return;
//   const yunXinInfo = contactItem.contactInfo.find(item => item.contactItemType === 'yunxin');
//   if (!yunXinInfo) return;
//   const contactYunXinId = yunXinInfo.contactItemVal;
//   const teamMember = teamMemberList.find(memberItem => memberItem.account === contactYunXinId);
//   return teamMember;
// }

// async function getTeamMembersByTeamIds(
//   ids: string[],
//   needGroup = false,
//   shouldFilterSelf = false
// ): Promise<Array<Array<EntityOrgTeamContact>> | Array<EntityOrgTeamContact>> {
//   try {
//     const teamsIds = ids.map(id => id.replace(/^team_/, ''));
//     const memberList = await contactDb.getTeamMemberById(teamsIds);
//     const yunXinIds = memberList.map(memberItem => memberItem.account);

//     let contactList = await getContactModelListByIds({ type: 'yunxin', value: yunXinIds });
//     if (shouldFilterSelf) {
//       // 过滤当前用户邮箱，暂时没考虑别名email
//       const currentUser = systemApi.getCurrentUser();
//       if (currentUser && currentUser.id) {
//         const currentUserEmail = currentUser.id;
//         contactList = contactList.filter(item => {
//           const itemEmail = item.contact.accountName;
//           return itemEmail !== currentUserEmail;
//         });
//       }
//     }
//     //
//     const res: Array<EntityOrgTeamContact> = contactList.map(contactItem => {
//       const teamMember = getContactTeamMemberByContactModelItem(memberList, contactItem);

//       const newItem: EntityOrgTeamContact = {
//         id: teamMember?.account as string,
//         imId: teamMember?.account as string,
//         type: teamMember?.type as string,
//         nickInTeam: teamMember?.nickInTeam as string,
//         joinTime: teamMember?.joinTime as number,
//         contactId: contactItem.contact.accountId,
//         orgId: `team_${teamMember?.teamId as string}`,
//         yunxinId: teamMember?.account as string,
//         contact: contactItem.contact,
//         model: contactItem,
//       };
//       return newItem;
//     });

//     if (needGroup) {
//       return ids.map(teamId => res.filter(item => item.id === teamId));
//     }
//     return res;
//   } catch (ex) {
//     console.error('getTeamMembersByTeamId error', ex);
//     if (needGroup) {
//       return [[]];
//     }
//     return [];
//   }
// }

// /**
//  * corp的模式需要从服务器搜索联系人
//  * @param searchKey 搜索关键字
//  * @returns
//  */
// async function corpSearchContactFromServer(searchKey: string, noEnqueue = false): Promise<Array<ContactModel>> {
//   if (!searchKey) return [];
//   const url = systemApi.getUrl('corpSearchContact');
//   const currentUser = systemApi.getCurrentUser();

//   const params = {
//     sid: currentUser?.sessionId,
//     searchKey,
//     limit: 50,
//   };
//   const contactModelList = await httpImpl
//     .get(url, params, { noEnqueue })
//     .then(res => res.data)
//     .then(res => {
//       const isSuccess = res?.success;
//       if (!isSuccess) {
//         return [];
//       }
//       const itemList: Array<CorpApiContactItem> = res?.data?.itemList || [];
//       return corpApiContactItemListToContactModelList(itemList);
//     })
//     .catch(err => {
//       console.error('[contact]doCorpSearchContactFromServer error', err);
//       return [];
//     });
//   // 服务器的可能存在多条同email的联系人数据，服务器返回的数据需要去重
//   const result: Array<ContactModel> = [];
//   const emailSet = new Set();
//   contactModelList.forEach(item => {
//     const itemEmail = item.contact.accountName;
//     if (emailSet.has(itemEmail)) {
//       return;
//     }
//     result.push(item);
//     emailSet.add(itemEmail);
//   });

//   return result;
// }

// export default {
//   corpSearchContactFromServer,
//   corpApiContactItemToContactModel,
//   corpApiContactItemListToContactModelList,
//   getContactModelListByIds,
//   getTeamMembersByTeamIds,
// };
