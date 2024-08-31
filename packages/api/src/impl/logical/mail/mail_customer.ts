import { api } from '@/api/api';
import { apis } from '@/config';
// import { CustomerBoxModel } from '@/api/logical/mail';
import { SystemApi } from '@/api/system/system';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
// import { SimpleContactModel } from '@/api/_base/api';
import { ContactTransform, ContactTransformInstance } from '../contact/contact_transform';
import { CustomerEntityForMail } from '@/api/logical/contact_edm';
import { EventApi } from '@/api/data/event';
import { CustomerApi } from '@/api/logical/customer';

/**
 * 数据库处理
 */
export class MailCustomerHelper {
  contactApi: ContactAndOrgApi;

  contactTrans: ContactTransform = ContactTransformInstance;

  systemApi: SystemApi;

  eventApi: EventApi;

  customerApi: CustomerApi;

  constructor() {
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
    this.customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
  }

  // async doListCustomers(param: CustomerListParams, noCache?: boolean): Promise<ListCustomerPageRes> {
  //   if (!this.systemApi.inEdm()) {
  //     return Promise.reject(new Error('只支持在外贸环境调用'));
  //   }
  //   let result: CustomerEntityForMail[] = [];
  //   if (!noCache) {
  //     result = await this.contactApi.doGetCustomerListFromDb(param);
  //     console.log('[do list customers] from db', result);
  //   }
  //   if (result.length > 0) {
  //     this.syncCustomerList(param, result).catch(() => {
  //       console.error('[do list customers] sync error');
  //     });
  //     return {
  //       data: this.convertCustomerModel(result),
  //       loadMore: result.length >= param.limit,
  //     };
  //   }
  //   result = await this.contactApi.doGetCustomerListFromServer(param);
  //   console.log('[do list customers] from server', result);
  //   this.syncCustomerList(param, undefined, result).catch(() => {
  //     console.error('[do list customers] sync error');
  //   });
  //
  //   return {
  //     data: this.convertCustomerModel(result),
  //     loadMore: result.length >= param.limit,
  //   };
  // }

  // async doListCustomersFromDb(param: CustomerListParams): Promise<ListCustomerPageRes> {
  //   if (!this.systemApi.inEdm()) {
  //     return Promise.reject(new Error('只支持在外贸环境调用'));
  //   }
  //   const result = await this.contactApi.doGetCustomerListFromDb(param);
  //   console.log('[do list customers] from db', result);
  //   return {
  //     data: this.convertCustomerModel(result),
  //     loadMore: result.length >= param.limit,
  //   };
  // }

  // 格式化 CustomerEntityForMail 为 CustomerBoxModel
  // private convertCustomerModel(customerRes: CustomerEntityForMail[]): CustomerBoxModel[] {
  //   if (customerRes.length === 0) {
  //     return [];
  //   }
  //   return customerRes.map(v => {
  //     const targetManager = this.findCustomerManager(v);
  //     const managerList: SimpleContactModel[] = Array.isArray(v.managerList)
  //       ? v.managerList.map(it => ({
  //           account: it.managerAccount,
  //           contactName: it.managerName,
  //           contactId: it.managerId,
  //         }))
  //       : [];
  //     const contacts = Array.isArray(v.contactList) ? v.contactList.map(it => this.contactTrans.transCustomerToContactModel(it).contact) : [];

  //     return {
  //       orgName: v.companyName,
  //       id: v.originId,
  //       lastUpdateTime: v.lastUpdateTime,
  //       lastSetTopTime: targetManager?.lastSetTopTime,
  //       lastMailTime: targetManager?.lastMailTime,
  //       contacts,
  //       managerList,
  //     };
  //   });
  // }

  // async syncCustomerList(param: CustomerListParams, dbData?: CustomerEntityForMail[], netData?: CustomerEntityForMail[]) {
  //   // 有本地数据，拉取网络数据
  //   if (dbData) {
  //     const temp = await this.contactApi.doGetCustomerListFromServer(param);
  //     await this.syncCustomerListHandler(param, dbData, temp, { sendEvent: true });
  //   } else if (netData) {
  //     // 有网络数据，拉取本地数据
  //     const temp = await this.contactApi.doGetCustomerListFromDb(param);
  //     await this.syncCustomerListHandler(param, temp, netData, { sendEvent: false });
  //   }
  // }

  // async syncCustomerListHandler(param: CustomerListParams, dbData: CustomerEntityForMail[], netData: CustomerEntityForMail[], conf?: { sendEvent: boolean }) {
  //   const { sendEvent = false } = conf || {};
  //   const { changedModels, delModels, isDiff } = this.compareCustomerList(dbData, netData);
  //
  //   const needChange = changedModels.size > 0;
  //   const needDel = delModels.size > 0;
  //
  //   if (needDel) {
  //     const needDelIds = [...delModels.keys()];
  //     const modelsFromServer = await this.contactApi.doGetCustomersFromServerBatch({ idList: needDelIds });
  //     const existModelMap = modelsFromServer.reduce<Map<string, CustomerEntityForMail>>((t, v) => t.set(v.originId, v), new Map());
  //
  //     delModels.forEach((value, id) => {
  //       const current = existModelMap.get(id);
  //       if (current) {
  //         delModels.delete(id);
  //         changedModels.set(id, value);
  //       }
  //     });
  //     if (delModels.size > 0) {
  //       await this.contactApi.doDelCustomerManager({ idList: [...delModels.keys()] });
  //     }
  //   }
  //
  //   if (needChange) {
  //     await this.contactApi.doSaveCustomerToDb([...changedModels.values()]);
  //   }
  //
  //   if (isDiff && sendEvent) {
  //     await this.eventApi.sendSysEvent({
  //       eventName: 'mailChanged',
  //       eventStrData: 'syncCustomerList',
  //       eventData: { param },
  //     });
  //   }
  // }

  // compareCustomerList(dbData: CustomerEntityForMail[], netData: CustomerEntityForMail[]): CompareCustomerListRes {
  //   let isDiff = false;
  //   const changedModels: Map<string, CustomerEntityForMail> = new Map();
  //   const delModels: Map<string, CustomerEntityForMail> = new Map();
  //
  //   const dtAMap = dbData.reduce<Map<string, CustomerEntityForMail>>((t, v) => t.set(v.originId, v), new Map());
  //   const dtBMap = netData.reduce<Map<string, CustomerEntityForMail>>((t, v) => t.set(v.originId, v), new Map());
  //
  //   // 因为客户列表顺序调整也可以认为是不同，所以先简单的对比出 isDiff，后续的 map 比对，是为了保证数据的一致性
  //   if (dtAMap.size !== dtBMap.size) {
  //     isDiff = true;
  //   }
  //
  //   if (!isDiff) {
  //     for (let i = 0, len = dbData.length; i < len; i++) {
  //       const itemA = dbData[i];
  //       const itemB = netData[i];
  //       if (!itemB || itemA.originId !== itemB.originId) {
  //         isDiff = true;
  //         break;
  //       }
  //     }
  //   }
  //
  //   dtAMap.forEach((itemA, id) => {
  //     const itemB = dtBMap.get(id);
  //     if (!itemB) {
  //       delModels.set(id, itemA);
  //     } else {
  //       const idDifferent = this.compareCustomerModel(itemA, itemB);
  //       if (idDifferent) {
  //         changedModels.set(id, itemB);
  //       }
  //       dtBMap.delete(id);
  //     }
  //   });
  //
  //   if (dtBMap.size > 0) {
  //     dtBMap.forEach(itemB => {
  //       changedModels.set(itemB.originId, itemB);
  //     });
  //   }
  //   return { changedModels, delModels, isDiff };
  // }

  // 客户数据比对，目前只比对了 lastUpdateTime 和 lastMailTime
  // compareCustomerModel(dtA: CustomerEntityForMail, dtB: CustomerEntityForMail): boolean {
  //   if (dtB.lastUpdateTime && dtB.lastUpdateTime !== dtA.lastUpdateTime) {
  //     return true;
  //   }
  //   const targetManagerA = this.findCustomerManager(dtA);
  //   const targetManagerB = this.findCustomerManager(dtB);
  //   if (!targetManagerA) {
  //     return true;
  //   }
  //   if (targetManagerB?.lastMailTime && targetManagerB.lastMailTime !== targetManagerA.lastMailTime) {
  //     return true;
  //   }
  //   // if (targetManagerB?.lastSetTopTime && (targetManagerB.lastSetTopTime !== targetManagerA.lastSetTopTime)) {
  //   //   return true;
  //   // }
  //   return false;
  // }

  // 更新客户 lastMailTime
  // async doUpdateCustomersByNewMail(mailModel: MailEntryModel) {
  //   if (!mailModel.entry.receiveTime) {
  //     return;
  //   }
  //
  //   // 首先直接从 sender 中获取客户信息
  //   let customers: CustomerEntityForMail[] = [];
  //
  //   // 从 DB 中获取客户信息
  //   const accountName = mailModel.sender?.contact?.contact?.accountName;
  //   if (accountName) {
  //     const { mapRes } = await this.contactApi.doGetContactByEmailsAdvance({
  //       emails: [accountName],
  //       useEdm: this.systemApi.inEdm(),
  //       useLx: false,
  //       needGroup: true,
  //     });
  //     if (mapRes && mapRes[accountName]) {
  //       // const targets = mapRes[accountName].filter(v => v.customerOrgModel?.customerRole === 'manager' && v.customerOrgModel.customerType === 'customer');
  //       const targets = mapRes[accountName].filter(v => v.customerOrgModel?.role === 'myCustomer');
  //       const customerOrgModels = targets.map(v => v.customerOrgModel as CustomerOrgModel);
  //       if (customerOrgModels.length > 0) {
  //         const customerIds = customerOrgModels.map(v => v.companyId);
  //         customers = await this.contactApi.doGetCustomerFromDbByIds({ idList: customerIds });
  //       }
  //     }
  //   }
  //   console.log('[doUpdateCustomersByNewMail] customers from db', customers);
  //
  //   // 如果 db 获取不到，尝试从远端获取
  //   if (customers.length === 0) {
  //     const { items } = await this.customerApi.getCustomerByEmail(accountName);
  //     if (items && items.length > 0) {
  //       const customerIds = items.map(v => v.resource_id);
  //       customers = await this.contactApi.doGetCustomersFromServerBatch({ idList: customerIds });
  //     }
  //   }
  //
  //   // 如果有对应的客户的话，更改 lastMailTime 时间
  //   if (customers.length > 0) {
  //     if (customers.length > 0) {
  //       const newModels: CustomerEntityForMail[] = [];
  //       customers.forEach(customerInfo => {
  //         const targetManager = customerInfo ? this.findCustomerManager(customerInfo) : null;
  //         if (targetManager) {
  //           const newModel: CustomerEntityForMail = {
  //             ...customerInfo,
  //             managerList: customerInfo.managerList.map(v => {
  //               if (targetManager.managerId !== v.managerId) {
  //                 return v;
  //               }
  //               return {
  //                 ...v,
  //                 lastMailTime: new Date(mailModel.entry.receiveTime as string).getTime(),
  //               };
  //             }),
  //           };
  //           newModels.push(newModel);
  //         }
  //       });
  //       console.log('[doUpdateCustomersByNewMail] newModels', newModels);
  //       if (newModels.length > 0) {
  //         // 更新后的数据存到 db
  //         await this.contactApi.doSaveCustomerToDb(newModels);
  //         await Promise.all([
  //           // 向 UI 发送消息
  //           this.eventApi.sendSysEvent({
  //             eventName: 'mailChanged',
  //             eventStrData: 'newMailForCustomer',
  //             eventData: {
  //               customerData: this.convertCustomerModel(newModels),
  //             },
  //           }),
  //           this.eventApi.sendSysEvent({
  //             eventName: 'mailChanged',
  //             eventStrData: 'refreshCustomerUnread',
  //           }),
  //           this.eventApi.sendSysEvent({
  //             eventName: 'mailChanged',
  //             eventStrData: 'syncCustomerList',
  //           }),
  //         ]).catch(e => {
  //           console.error('[doUpdateCustomersByNewMail] send event', e);
  //         });
  //       }
  //     }
  //   }
  // }

  // 找出客户中属于当前用户的负责人
  findCustomerManager(it: CustomerEntityForMail) {
    const currentUser = this.systemApi.getCurrentUser();
    const currentContactId = currentUser?.contact?.contact.id || (currentUser?.prop?.contactId as string);
    return Array.isArray(it.managerList) ? it.managerList.find(v => v.managerId === currentContactId) : null;
  }

  // TODO
  // async doSearchCustomers(param: SearchCustomerParams): Promise<ListCustomerPageRes> {
  //   if (!param.query || !param.limit) {
  //     return Promise.reject(new Error('doSearchCustomers params error'));
  //   }
  // const condition: MyCustomerSearchCondition = {
  //   query: param.query,
  //   lastId: param.lastId ? 'customer_' + param.lastId : undefined,
  //   limit: param.limit || 30,
  // };
  // const searchResult = await this.contactApi.doSearchMyCustomer(condition);
  // console.log('[doSearchMyCustomer]', searchResult);
  // const idList = searchResult.map(v => v.id);
  // const customerList = idList.length > 0 ? await this.contactApi.doGetCustomerFromDbByIds({ idList }) : [];
  // const customerList = [];
  // return {
  //   data: this.convertCustomerModel(customerList),
  //   loadMore: customerList.length >= param.limit,
  // };
  // }
}
