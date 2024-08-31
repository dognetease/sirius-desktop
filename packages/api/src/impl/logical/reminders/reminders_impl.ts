import { WinType } from 'env_def';
import { apis } from '@/config';
import { api } from '@/api/api';
import { AdvertisingReminderInfo, AdvertisingReminderApi } from '@/api/logical/reminders';
import { Api } from '@/api/_base/api';
// import { EdmRoleApi } from '@/api/logical/edm_role';

const Tag = '[Reminder]';
export class ReminderImpl implements AdvertisingReminderApi {
  name = apis.remindersImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  // private roleApi: EdmRoleApi;

  // private isAdmin = -1;

  // constructor() {
  //   this.roleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
  // }

  init() {
    return this.name;
  }

  afterInit() {
    if (process.env.BUILD_ISELECTRON && process.env.BUILD_ISEDM && this.systemApi.isMainPage()) {
      this.systemApi.intervalEvent({
        seq: 0,
        eventPeriod: 'mid', // 开发调试暂时用long
        // eventPeriod: 'long',
        id: 'reminderx_notice_collector',
        handler: ev => {
          console.log(Tag, 'schedule_notice_collector called');
          if (ev.seq === 1 || ev.seq % 20 === 0) {
            this.getReminders().then(data => {
              if (data) {
                // if (data.clickUrl.includes('weekly?enc=1') && !isAdmin) {
                //   return;
                // }
                this.systemApi.createWindowWithInitData('advertisingReminder' as WinType, {
                  eventName: 'customNotification',
                  eventData: {
                    eventType: 'advertisingReminder',
                    reminders: [data],
                  },
                });
              }
            });
          }
        },
      });
    }
    return this.name;
  }

  // async getRemindersWithIsAdmin() {
  //   const [data, isAdmin] = await Promise.all([this.getReminders(), this.getIsAdmin()]);
  //   return { data, isAdmin };
  // }

  async getReminders(): Promise<AdvertisingReminderInfo> {
    const { data } = await this.http.get(this.systemApi.getUrl('getBusinessAds'));
    if (data?.success || data?.code === 200) {
      return data.data as AdvertisingReminderInfo;
    }
    return Promise.reject(data!.message);
    // return Promise.reject(data!.message);
    // return this.http.get(this.systemApi.getUrl('getBusinessAds'), null);
  }

  // async getIsAdmin(): Promise<boolean> {
  //   if (this.isAdmin !== -1) {
  //     return this.isAdmin === 1;
  //   }
  //   return this.roleApi.getRoleList().then(({ roles }) => {
  //     const isAdmin = roles.some(role => role.roleType === 'ADMIN');
  //     this.isAdmin = isAdmin ? 1 : 0;
  //     return isAdmin;
  //   });
  // }

  async trackLog(adsId: AdvertisingReminderInfo['id']): Promise<boolean> {
    const url = this.systemApi.getUrl('setBusinessAdsClick');

    const res = await this.http.post(url, { id: adsId }, { contentType: 'json' });
    return Number(res?.code) === 200;
  }
}

const impl: Api = new ReminderImpl();
api.registerLogicalApi(impl);
export default impl;
