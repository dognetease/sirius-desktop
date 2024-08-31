import { ContactModel, EntityOrg, EntityOrgTeamContact, EntityPersonalOrg, YunxinContactModel } from '@/api/_base/api';
import { ContactCommonRes, SearchAllContactRes, SearchTeamContactRes } from '@/api/logical/contactAndOrg';
import { MailBoxEntryContactInfoModel } from '@/api/logical/mail';
import { api } from '@/api/api';

export class ContactSelectProxy {
  selectWhiteList: string[] = [];

  private eventApi = api.getEventApi();

  private recentSelectContactMap: Map<string, ContactModel> = new Map();

  private recentSelectOrgMap: Map<string, EntityOrg> = new Map();

  private selectContactNotifyTimer: number | undefined;

  private recentSelectOrgMapTimer: number | undefined;

  private sendMaxTime = 3 * 1000;

  sendSelectContactNotify(force?: boolean) {
    console.log('[contact_proxy] sendSelectContactNotify ', this.recentSelectContactMap.size, this.selectContactNotifyTimer);
    if (this.recentSelectContactMap.size >= 30 || force) {
      const list = [...this.recentSelectContactMap.values()];
      this.eventApi.sendSysEvent({
        eventName: 'selectContactNotify',
        eventData: list,
      });
      this.recentSelectContactMap.clear();
      if (this.selectContactNotifyTimer) {
        clearTimeout(this.selectContactNotifyTimer);
        this.selectContactNotifyTimer = undefined;
      }
    } else if (!this.selectContactNotifyTimer) {
      this.selectContactNotifyTimer = window.setTimeout(() => {
        console.log('[contact_proxy] auto sendSelectContactNotify');
        const list = [...this.recentSelectContactMap.values()];
        this.eventApi.sendSysEvent({
          eventName: 'selectContactNotify',
          eventData: list,
        });
        this.recentSelectContactMap.clear();
        if (this.selectContactNotifyTimer) {
          clearTimeout(this.selectContactNotifyTimer);
          this.selectContactNotifyTimer = undefined;
        }
      }, this.sendMaxTime);
      console.log('[contact_proxy] start setTimeout', this.selectContactNotifyTimer);
    }
  }

  sendSelectOrgNotify(force?: boolean) {
    console.log('[contact_proxy] recentSelectOrgMap ', this.recentSelectOrgMap.size, this.recentSelectOrgMapTimer);
    if (this.recentSelectOrgMap.size >= 30 || force) {
      const list = [...this.recentSelectOrgMap.values()];
      this.eventApi.sendSysEvent({
        eventName: 'selectOrgNotify',
        eventData: list,
      });
      this.recentSelectOrgMap.clear();
      if (this.recentSelectOrgMapTimer) {
        clearTimeout(this.recentSelectOrgMapTimer);
        this.recentSelectOrgMapTimer = undefined;
      }
    } else if (!this.recentSelectOrgMapTimer) {
      this.recentSelectOrgMapTimer = window.setTimeout(() => {
        console.log('[contact_proxy] auto sendSelectContactNotify');
        const list = [...this.recentSelectOrgMap.values()];
        this.eventApi.sendSysEvent({
          eventName: 'selectOrgNotify',
          eventData: list,
        });
        this.recentSelectOrgMap.clear();
        if (this.recentSelectOrgMapTimer) {
          clearTimeout(this.recentSelectOrgMapTimer);
          this.recentSelectOrgMapTimer = undefined;
        }
      }, this.sendMaxTime);
      console.log('[contact_proxy] start setTimeout', this.recentSelectOrgMapTimer);
    }
  }

  addRecentSelectContactMap(list: ContactModel[], force?: boolean) {
    // list.forEach(item => {
    //   this.recentSelectContactMap.set(item.contact.id, item);
    // });
    // this.sendSelectContactNotify(force);
    console.log('[contact.selectnotify]addRecentSelectContact', list, force);
  }

  addRecentSelectOrgMap(list: EntityOrg[], force?: boolean) {
    // list.forEach(item => {
    //   this.recentSelectOrgMap.set(item.id, item);
    // });
    // this.sendSelectOrgNotify(force);
    console.log('[contact.selectnotify]addRecentSelectOrgMap', list, force);
  }

  async handleNeedTransData(key: string, data: unknown) {
    try {
      if (!this.selectWhiteList.includes(key)) {
        throw new Error(key + 'not in selectWhiteList');
      }
      if (key === 'doGetPersonalOrg') {
        const { success, data: orgList } = data as ContactCommonRes<EntityPersonalOrg[]>;
        if (success && orgList) {
          orgList.forEach(item => this.recentSelectOrgMap.set(item.id, item));
          this.sendSelectOrgNotify();
        }
        return;
      }
      let list: ContactModel[] = [];
      switch (key) {
        case 'doGetContactByEmails':
          (data as MailBoxEntryContactInfoModel[]).forEach(item => this.recentSelectContactMap.set(item.contact.contact.id, item.contact));
          break;
        case 'doGetOrgContactListByTeamId':
          (data as Array<EntityOrgTeamContact | EntityOrgTeamContact[]>).forEach(item => {
            if (Array.isArray(item)) {
              item.forEach(({ model }) => {
                if (model) {
                  this.recentSelectContactMap.set(model.contact.id, model);
                }
              });
            } else {
              const { model } = item;
              if (model) {
                this.recentSelectContactMap.set(model.contact.id, model);
              }
            }
          });
          break;
        case 'doSearchAllContact':
          list = (data as SearchAllContactRes)?.contactList;
          if (list?.length) {
            list.forEach(item => this.recentSelectContactMap.set(item.contact.id, item));
          }
          break;
        case 'doSearchTeamContact':
          list = (data as SearchTeamContactRes)?.contactList;
          if (list?.length) {
            list.forEach(item => this.recentSelectContactMap.set(item.contact.id, item));
          }
          break;
        case 'doGetContactByYunxin':
          list = (data as YunxinContactModel)?.contactModelList;
          if (list?.length) {
            list.forEach(item => this.recentSelectContactMap.set(item.contact.id, item));
          }
          break;
        default:
          list = data as ContactModel[];
          if (list?.length) {
            list.forEach(item => this.recentSelectContactMap.set(item.contact.id, item));
          }
          break;
      }
    } catch (e) {
      console.error('[contact_select_notify] handleNeedTransData', e, key, data);
    }
    this.sendSelectContactNotify();
  }
}

export default new ContactSelectProxy();
