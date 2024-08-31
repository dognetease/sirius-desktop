import { Api } from '../_base/api';

export interface AdvertisingReminderApi extends Api {
  getReminders(): Promise<AdvertisingReminderInfo>;
  trackLog(adsId: AdvertisingReminderInfo['id']): Promise<boolean>;
}

export interface AdvertisingReminderInfo {
  notice: string;
  title: string;
  content: string;
  clickName: string;
  clickUrl: string;
  id: number;
}
