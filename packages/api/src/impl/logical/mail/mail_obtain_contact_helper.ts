/* eslint-disable no-restricted-syntax */
import { ActionStore, ContactProcessingItem, MailEntryProcessingItem, ResponseMailContentEntry, ResponseMailListEntry, SubActionsType } from './mail_action_store_model';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { api } from '@/api/api';
import { ContactApi, contactInsertParams, OrgApi } from '@/api/logical/contactAndOrg';
import { apis } from '@/config';
import { MailBoxEntryContactInfoModel, MemberType, ParsedContact } from '@/api/logical/mail';
import { util, wait } from '@/api/util';
import { StringTypedMap } from '@/api/commonModel';
import { ContactModel, EntityContact, EntityContactItem, PopUpMessageInfo } from '@/api/_base/api';
import { EventApi } from '@/api/data/event';
import { getIn18Text } from '@/api/utils';

export class MailContactHandler {
  static contactPattern = {
    withName: /\s*(?:([^<> \t"]+)|"([^"]+)")\s*<([\w\-._*]+@[\w.-]+\.[a-zA-Z]{2,20})>/i,
    withoutName: /\s*(([\w\-._#*]+)@[\w.\-_]+\.[a-zA-Z]{2,20})/i,
  };

  actions: ActionStore;

  subActions?: SubActionsType;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  contactApi: ContactApi & OrgApi;

  eventApi: EventApi;

  constructor(actions: ActionStore, subActions?: SubActionsType) {
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.eventApi = api.getEventApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
    // action改造
    this.actions = actions;
    this.subActions = subActions;
  }

  /**
   * 读信mailContacts 处理入口
   * @param prItems
   * @param noContactRace
   * @param _account
   */
  handleContactList(prItems: MailEntryProcessingItem[], noContactRace?: boolean, _account?: string): Promise<MailEntryProcessingItem[]> {
    // const that = this;
    const contactList: ParsedContact[] = [];
    // const contactMapSender: ContactMapToMailEntryPI = {};
    // const contactMapReciever: ContactMapToMailEntryPI = {};
    prItems.forEach(it => {
      // function addItemToMap(item: ParsedContact) {
      //     contactList.push(item.email);
      //         let list = map[item.email];
      //         if (!list) {
      //             list = [];
      //         }
      //         list.push(it);
      //         map[item.email] = list;
      //     };
      it.senderContactMap.parsed.forEach(item => contactList.push(item));
      it.receiverContactMap.parsed.forEach(item => contactList.push(item));
    });
    return this.handleContactRawList(contactList, noContactRace, _account).then((contactMap: StringTypedMap<MailBoxEntryContactInfoModel>) => {
      prItems.forEach(it => {
        this.handleContactItem(it, contactMap);
      });
      return prItems;
    });
    // return Promise.resolve(prItems);
  }

  addContact(params: MailBoxEntryContactInfoModel[], _account?: string) {
    const insertParams: contactInsertParams[] = params.map(param => ({
      name: param?.originName || param?.contact.contact.contactName || param?.contact.contact.accountName,
      comment: getIn18Text('XIEXINZIDONGTIANJIALIAN'),
      emailList: [param.contactItem.contactItemVal],
      auto: 1,
      groupIdList: [],
      _account,
    }));
    this.contactApi
      .doInsertContact({
        list: insertParams,
        _account,
      })
      .then(r => {
        if (r.success) {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: getIn18Text('TIANJIALIANXIRENCHENGGONGv16'),
              code: 'SOK',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
        }
      });
  }

  handleContactItem(it: MailEntryProcessingItem, contactMap: StringTypedMap<MailBoxEntryContactInfoModel>) {
    it.senderContactMap.parsed.forEach(item => {
      const element = contactMap[item.email + item.type];
      // if (element) {
      it.sender.push({
        mailMemberType: item.type,
        contactItem: element.contactItem,
        contact: element.contact,
        originName: item.name,
        inContactBook: element.inContactBook,
      });
      // } else {
      //     this.buildContactItem(item, it.sender);
      // }
    });
    const otherContactMap: Set<string> = new Set<string>();
    let mailToCount = 0;
    it.receiverContactMap.parsed.forEach(citem => {
      if (citem.type === 'bcc' || citem.type === 'cc') {
        otherContactMap.add(citem.email);
      } else if (citem.type === 'to') {
        mailToCount += 1;
      }
    });
    let receiverList = it.receiverContactMap.parsed;
    if (mailToCount > otherContactMap.size) {
      receiverList = receiverList.filter(it => it.type !== 'to' || !otherContactMap.has(it.email));
    }
    receiverList.forEach(item => {
      const element = contactMap[item.email + item.type];
      // if (element) {
      it.receiver.push({
        mailMemberType: item.type,
        contactItem: element.contactItem,
        contact: element.contact,
        originName: item.name,
        inContactBook: element.inContactBook,
      });
      // } else {
      //     this.buildContactItem(item, it.receiver);
      // }
    });
  }

  /**
   * 按email查询联系人信息
   * @param id
   * @param type
   */
  getContractItemByEmail(id: string[], type: MemberType, _accont?: string): Promise<MailBoxEntryContactInfoModel[]> {
    if (!id || id.length === 0) {
      return Promise.reject(new Error('需要提供email数组参数'));
    }
    const contactList: ParsedContact[] = id.map(it => ({
      item: it,
      email: it,
      name: undefined,
      type,
    }));
    return this.handleContactRawList(contactList, undefined, _accont).then(res => {
      const ret: MailBoxEntryContactInfoModel[] = [];
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const idx in contactList) {
        const it = contactList[idx];
        const re = res[it.email + it.type];
        if (re && re.contactItem.contactItemVal && re.contactItem.contactItemVal.length > 0) {
          ret.push({ ...re, mailMemberType: it.type, inContactBook: true });
        }
      }
      return ret;
    });
    // return this.contactApi!.doGetContactByItem({
    //     type: "EMAIL",
    //     value: id
    // }).then((res: ContactModel[]) => {
    //     const result: MailBoxEntryContactInfoModel[] = [];
    //     if (res && res.length > 0) {
    //         // const re = res[0];
    //         let checkedResult = res.map(re => {
    //             return {
    //                 mailMemberType: type,
    //                 contactItem: re.contactInfo.filter(it => it.hitQuery && it.hitQuery[0])[0],
    //                 contact: re.contact,
    //                 inContactBook: true
    //             }
    //         });
    //         return result;
    //     } else {
    //         return [];
    //     }
    //     return result;
    // });
  }

  buildRawContactItem(item?: ParsedContact, _account?: string): MailBoxEntryContactInfoModel {
    // 造个空的
    if (!item) {
      const currentUser = this.systemApi.getCurrentUser(_account);
      if (currentUser) {
        if (currentUser.contact) {
          const citme = currentUser.contact.contactInfo.filter(it => it.contactItemType === 'EMAIL').pop() || {
            type: '',
            contactId: currentUser.id,
            contactItemRefer: '',
            contactItemType: 'EMAIL',
            // accountId
            contactItemVal: currentUser.id,
            createTime: 0,
            id: '',
            isDefault: 1,
            unreadItemCount: 0,
            updateTime: 0,
            useFrequency: 0,
          };
          return {
            contact: currentUser.contact,
            contactItem: citme,
            inContactBook: true,
          } as MailBoxEntryContactInfoModel;
        }
        if (currentUser.id) {
          item = {
            item: '',
            name: currentUser.nickName,
            email: currentUser.id,
            type: '',
            avatar: '',
          };
        }
      }
    }
    if (!item) {
      throw new Error('参数错误，未传入item');
    }
    const properties = this.systemApi.handleAccountAndDomain(item.email);
    const contactName = item.name || (properties.account as string) || 'unknown';
    const contactPYName = this.toPinyin(contactName);
    const contactLabel = util.getContactLabel(contactPYName);
    const contactPYLabelName = util.getContactPYLabel(contactName);
    const _lastUpdateTime = Date.now();
    const cItem: EntityContactItem = {
      type: 'external',
      contactId: item.email,
      contactItemRefer: '',
      contactItemType: 'EMAIL',
      // 应当是 accountId
      contactItemVal: item.email,
      createTime: 0,
      id: '',
      emailType: -1,
      isDefault: 0,
      unreadItemCount: 0,
      updateTime: 0,
      useFrequency: 0,
      _lastUpdateTime,
    };
    const contactItem: MailBoxEntryContactInfoModel = {
      inContactBook: false,
      contact: {
        contact: {
          avatar: item?.avatar,
          contactName,
          contactPYName,
          contactLabel,
          contactPYLabelName,
          accountStatus: -1,
          accountVisible: 0,
          id: item.id || '',
          accountId: item.email,
          accountName: item.email,
          type: 'external',
          color: this.contactApi!.getColor(item.email),
          visibleCode: 0,
          enableIM: false,
        },
        contactInfo: [cItem],
      } as ContactModel,
      contactItem: cItem,
      mailMemberType: item.type,
      originName: item.name,
    };
    return contactItem;
  }

  transContactModel2MailContactModel(item: ContactModel, receiverType: MemberType): MailBoxEntryContactInfoModel {
    const cItem = item.contactInfo.find(info => info.contactItemType === 'EMAIL' && info.isDefault === 1);
    const _lastUpdateTime = Date.now();
    const contactInfo: EntityContactItem = {
      id: '',
      contactId: item.contact.id,
      contactItemType: 'EMAIL',
      contactItemVal: item.contact.displayEmail || item.contact.accountName,
      contactItemRefer: '',
      type: item.contact.type,
      isDefault: 1,
      _lastUpdateTime,
    };
    return {
      contact: item,
      mailMemberType: receiverType,
      contactItem: cItem || contactInfo,
      inContactBook: item.contact.type !== 'external',
    };
  }

  handleEmailListStringToParsedContent(listStr: string, ret: ContactProcessingItem) {
    if (!listStr || listStr.length === 0) {
      return ret;
    }
    const contactPattern = [
      {
        reg: /,?\s*"\s*(?:[+\-])?\s*([^"]+)"\s*<\s*([\w\-._*]+@[\w\.\-]+\.[a-zA-Z]{2,25})\s*>\s*/gi,
        nameIndex: 1,
        emailIndex: 2,
        total: 2,
      },
      {
        reg: /(?:[,+\-])?\s*([^<> \t"](?:[^<>"]+)?)\s*<\s*([\w\-._*]+@[\w\.\-]+\.[a-zA-Z]{2,25})\s*>\s*/gi,
        nameIndex: 1,
        emailIndex: 2,
        total: 2,
      },
      {
        reg: /,?\s*[+-]?\s*(([\w\-._#*&!$%'+/=?^`{|}~]+)@[\w.\-_]+\.[a-zA-Z]{2,25})\s*/gi,
        nameIndex: 2,
        emailIndex: 1,
        total: 2,
      },
    ];
    let item: Array<any> | null = null;
    // const ret = [];
    // const reg = /\s*((?:(?:"[^"]+")|(?:[\w\-._#*]+))\s*@[\w.\-_]+)(?:,|$)/g;
    const set: Set<string> = new Set<string>();
    const pos: Map<number, number> = new Map<number, number>();
    let allUnmatched = true;
    for (const conf of contactPattern) {
      let start = 0;
      while (start < listStr.length) {
        conf.reg.lastIndex = this.getNextStart(start, pos);
        let hasMatch = false;
        // debugger;
        item = conf.reg.exec(listStr);
        if (item?.length && item.length >= conf.total && !set.has(item[conf.emailIndex])) {
          const emailEl = item[conf.emailIndex];
          ret.parsed.push({
            item: item[0],
            name: item[conf.nameIndex],
            email: emailEl,
            type: ret.type || '',
          });
          const end = conf.reg.lastIndex + 1;
          pos.set(end - item[0].length - 1, end);
          start = end;
          hasMatch = true;
          allUnmatched = false;
          set.add(emailEl);
        }
        if (!hasMatch) {
          break;
        }
      }
    }
    if (allUnmatched) {
      ret.parsed.push({
        item: listStr,
        name: listStr,
        email: listStr,
        type: ret.type || '',
        isIllegalEmail: true,
      });
    }
    return ret;
  }

  private getNextStart(st: number, pos: Map<number, number>) {
    let start = st;
    while (pos.has(start) && pos.get(start)) {
      start = pos.get(start) || 0;
    }
    return start;
  }

  parseContactStr(listStr: string | string[], type: MemberType): ContactProcessingItem {
    // console.log("handle contact list:", listStr);
    const items: string[] = typeof listStr === 'string' ? [listStr] : listStr;
    const ret = {
      origin: items,
      parsed: [],
      type,
    } as ContactProcessingItem;
    if (!listStr || listStr.length === 0) {
      if (ret.parsed.length === 0) {
        let item = '';
        if (item) {
          item = Array.isArray(items) ? items.join(',') : String(items);
        }
        ret.parsed.push({
          item,
          email: '',
          name: type === '' ? '无发件人' : '无收件人',
          type,
        });
      }
      return ret;
    }
    for (const item of items) {
      if (item && item.length > 0) {
        this.handleEmailListStringToParsedContent(item, ret);
      }
    }
    return ret;
    // items.forEach(item => {
    //   if (item && item.length > 2) {
    //     const exec1 = MailContactHandler.contactPattern.withName.exec(item);
    //     if (exec1) {
    //       ret.parsed.push({
    //         item,
    //         name: exec1[2] || exec1[1],
    //         email: exec1[3],
    //         type,
    //       });
    //     } else {
    //       const exec = MailContactHandler.contactPattern.withoutName.exec(item);
    //       if (exec) {
    //         ret.parsed.push({
    //           item: exec[0],
    //           email: exec[1],
    //           name: exec[2],
    //           type,
    //         });
    //       }
    //       // else {
    //       //   ret.parsed.push({
    //       //     item,
    //       //     email: '',
    //       //     name: type === '' ? '无发件人' : '无收件人',
    //       //     type,
    //       //   });
    //       // }
    //     }
    //   }
    // });
    // return ret;
    // const contacts = this.contactApi!.doGetContactById(contact).then((res: ContactModel[]) => {
    //     const result: MailBoxEntryContactInfoModel[] = [];
    //     res.forEach(item => {
    //         result.push({
    //             mailMemberType: "发送",
    //             contact: item.contact,
    //             contactItem: item.contactInfo[0]
    //         });
    //     })
    //     return result;
    // });
    // return contacts;
  }

  private concatProcessingEntry(a: ContactProcessingItem, b: ContactProcessingItem, distinct?: boolean): ContactProcessingItem {
    const map: StringTypedMap<ParsedContact> = {};
    if (distinct && a.parsed) {
      a.parsed.forEach(it => {
        map[it.email + ':' + it.type] = it;
      });
    }
    a.origin && b.origin && a.origin.push(...b.origin);
    !a.origin && b.origin && (a.origin = b.origin);
    a.parsed &&
      b.parsed &&
      b.parsed.forEach(it => {
        if (!distinct) {
          a.parsed.push(it);
        } else if (!map[it.email + ':' + it.type]) {
          a.parsed.push(it);
        }
      });
    !a.parsed && b.parsed && (a.parsed = b.parsed);
    a.result &&
      b.result &&
      b.result.forEach(item => {
        a.result?.push(item);
      });
    !a.result && b.result && (a.result = b.result);
    return a;
  }

  mapMailEntryToProcessingItem(item: ResponseMailContentEntry | ResponseMailListEntry, id: string): MailEntryProcessingItem {
    const dist = {
      receiverContactMap: this.parseContactStr(item.to, 'to'),
      senderContactMap: this.parseContactStr(item.from, ''),
      sender: [],
      receiver: [],
    };
    if (item.cc && item.cc.length > 0) {
      this.concatProcessingEntry(dist.receiverContactMap, this.parseContactStr(item.cc, 'cc'), true);
    }
    if (item.bcc && item.bcc.length > 0) {
      this.concatProcessingEntry(dist.receiverContactMap, this.parseContactStr(item.bcc, 'bcc'), true);
    }
    return { ...item, ...dist, id };
  }

  handleContactRawList(contactList: ParsedContact[], noContactRace?: boolean, _account?: string): Promise<StringTypedMap<MailBoxEntryContactInfoModel>> {
    // const value = contactList.map(it => it.email);
    // const noRace = !!noContactRace && this.systemApi.inEdm();
    return this.getContactItemWithTimeout(contactList, noContactRace, _account)
      .then((res: ContactModel[]) => {
        const allMail = new Set<string>();
        contactList.forEach(it => {
          if (it.email) {
            allMail.add(it.email.toLocaleLowerCase());
          }
        });
        const contactMap: StringTypedMap<MailBoxEntryContactInfoModel> = {};
        if (res && res.length > 0) {
          for (const item of res) {
            // const contactItem = item.contactInfo.filter(
            //   it => allMail.has(it.contactItemVal),
            // ).pop();
            if (!item) {
              console.error('[mail_obtain_contact_helper] handleContactRawList error', res);
            }
            item?.contactInfo?.forEach(contactItem => {
              if (contactItem && contactItem.contactItemType === 'EMAIL' && allMail.has(contactItem.contactItemVal)) {
                const email = contactItem.contactItemVal;
                const contactNew: EntityContact = { ...item.contact, hitQueryEmail: email };
                const storedContact = contactMap[email];
                if (!storedContact || storedContact.contact.contact.type === 'personal') {
                  contactMap[email] = {
                    mailMemberType: '',
                    contactItem,
                    contact: {
                      contact: contactNew,
                      contactInfo: item.contactInfo,
                      orgs: item.orgs,
                      customerOrgModel: item.customerOrgModel,
                    },
                    inContactBook: true,
                  };
                }
              }
            });
          }
        }
        const newContactMap: StringTypedMap<MailBoxEntryContactInfoModel> = {};
        contactList.forEach(it => {
          const email = it.email?.toLocaleLowerCase();
          const element = contactMap[email];
          if (!element) {
            newContactMap[it.email + it.type] = this.buildRawContactItem(it);
          } else {
            const newElement = { originName: it.name, ...element };
            newContactMap[it.email + it.type] = newElement;
            // element.mailMemberType = it.type;
            // element.contact.contact.contactName =
            //   it.name || element.contact.contact.contactName;
          }
        });
        return newContactMap;
      })
      .catch(err => {
        console.warn('mail contact obtain error:', err);
        const contactMap: StringTypedMap<MailBoxEntryContactInfoModel> = {};
        contactList.forEach(it => {
          const element = contactMap[it.email];
          if (!element) {
            contactMap[it.email + it.type] = this.buildRawContactItem(it);
          } else {
            // element.mailMemberType = it.type;
            // element.contact.contact.contactName =
            //   it.name || element.contact.contact.contactName;
          }
        });
        return contactMap;
      });
  }

  private getContactItemWithTimeout(list: ParsedContact[], noRace = false, _account?: string) {
    console.log('[getContactItemWithTimeout] list', noRace, _account);
    return Promise.resolve(this.buildRawContactItems(list, 0));
    // const value = list.map(it => it.email);
    // // return Promise.race([this.buildRawContactItems(list), this.contactApi!.doGetContactByItem({
    // //   type: 'EMAIL',
    // //   value,
    // // })]);
    // const promise = () => {
    //   console.time('[buildRawContactItems] doGetContactByEmailsAdvance');
    //   return this.contactApi!.doGetContactByEmailsAdvance({
    //     emails: value,
    //     useEdm: process.env.BUILD_ISEDM,
    //     needGroup: false,
    //     _account,
    //   }).then(v => {
    //     console.timeEnd('[buildRawContactItems] doGetContactByEmailsAdvance');
    //     return v.listRes;
    //   });
    // };

    // if (noRace) {
    //   return promise();
    // }

    // return Promise.race([this.buildRawContactItems(list), promise()]);
  }

  private async buildRawContactItems(list: ParsedContact[], timeout = 4000): Promise<ContactModel[]> {
    const models = list.map(it => this.buildRawContactItem(it)?.contact);
    if (timeout === 0) {
      return Promise.resolve(models);
    }
    return wait(4000).then(() => {
      console.warn('[buildRawContactItems] race', models);
      return Promise.resolve(models);
    });
  }

  toPinyin(str: string) {
    return util.toPinyin(str);
  }

  buildEmptyContact(b: boolean): MailBoxEntryContactInfoModel[] {
    if (b) {
      return [
        this.buildRawContactItem({
          type: 'to',
          name: '无收件人',
          email: '',
        } as ParsedContact),
      ] as MailBoxEntryContactInfoModel[];
    }
    return [
      this.buildRawContactItem({
        type: '',
        name: '无发件人',
        email: '',
      } as ParsedContact),
    ];
  }
}
