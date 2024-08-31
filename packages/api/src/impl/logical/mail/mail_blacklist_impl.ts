import { api } from '@/api/api';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';
import { MailConfApi, MailSettingKeys } from '@/api/logical/mail';
import { apis, inWindow, isElectron } from '@/config';
import { DataStoreApi } from '@/api/data/store';
import { MailBlacklistApi } from '@/api/logical/mail_blacklist';

class MailBlacklistImpl implements MailBlacklistApi {
  name: string;

  systemApi: SystemApi;

  mailConfApi: MailConfApi;

  storeApi: DataStoreApi;

  constructor() {
    this.name = apis.mailBlacklistApiImpl;
    this.systemApi = api.getSystemApi();
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    this.storeApi = api.getDataStoreApi();
  }

  init(): string {
    if (inWindow()) {
      // 每20分钟获取并设置一次黑名单
      if (isElectron()) {
        // electron 是在后台页面
        if (window.location.pathname.includes('api_data_init')) {
          this.systemApi.intervalEvent({
            id: 'loopSetBlacklist',
            eventPeriod: 'extLong',
            seq: 0,
            handler: ev => {
              if (ev.seq % 2 === 0 && ev.seq > 0) this.setBlacklist();
            },
          });
        }
      } else if (this.systemApi.isMainPage()) {
        // web是在主页面
        this.systemApi.intervalEvent({
          id: 'loopSetBlacklist',
          eventPeriod: 'extLong',
          seq: 0,
          handler: ev => {
            // eslint-disable-next-line indent
            if (ev.seq % 2 === 0 && ev.seq > 0) this.setBlacklist();
          },
        });
      }
    }
    return this.name;
  }

  // 获取并设置黑名单
  async setBlacklist(): Promise<string> {
    const black = MailSettingKeys.nRefuseList;
    const currentList = await this.mailConfApi.doGetUserAttr([black]);
    const { refuselist = '' } = currentList;
    // 存储
    this.storeApi.putSync('refuselist', JSON.stringify(refuselist));
    return refuselist;
  }

  // 添加黑名单
  async addBlacklist(email: string): Promise<boolean> {
    const black = MailSettingKeys.nRefuseList;
    try {
      const currentList = await this.mailConfApi.doGetUserAttr([black]);
      const { refuselist = '' } = currentList;
      const refuselistArr = refuselist ? refuselist.split(',') : [];
      const newRefuselistArr = [...refuselistArr, email];
      if (!refuselistArr.includes(email)) {
        const res = await this.mailConfApi.doSetUserAttr({ refuselist: newRefuselistArr.join(',') });
        // eslint-disable-next-line no-unused-expressions
        res && this.storeApi.putSync('refuselist', JSON.stringify(newRefuselistArr));
      }
      return true;
    } catch (error) {
      console.log('添加黑名单失败', error);
      return false;
    }
  }
}

const mailBlacklistImpl: Api = new MailBlacklistImpl();
api.registerLogicalApi(mailBlacklistImpl);
export default mailBlacklistImpl;
