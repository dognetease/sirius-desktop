import { config } from 'env_def';
import { apis, inWindow } from '@/config';
import { Api, User } from '@/api/_base/api';
import { api } from '@/api/api';
import { EventApi } from '@/api/data/event';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { configOptions, KfApi } from '@/api/logical/kf';
import { util } from '@/api/util';
import { getIn18Text } from '@/api/utils';

const forElectron = config('build_for') === 'electron';

class KfApiImp implements KfApi {
  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  isInited = false;

  isReady = false;

  waitList: any[] = [];

  version: string = config('version') as string;

  public static keyDeviceUUID: string = config('browerDeviceUUID') as string;

  constructor() {
    this.name = apis.kfApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
  }

  /**
   * 获取当前用户的email
   * */
  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id;
  }

  setKfConfig(callback?: (success: boolean) => void) {
    if (this.isReady) {
      const userId = this.getEmail();
      if (userId) {
        this.loginHandle(res => {
          callback && callback(res);
          if (this.waitList.length) {
            this.waitList.forEach(fn => fn(res));
          }
        });
      } else {
        KfApiImp.logoutHandle();
      }
    } else {
      callback && this.waitList.push(callback);
    }
  }

  loginHandle(callback?: (success: boolean) => void) {
    const user = this.systemApi.getCurrentUser() as User;
    const uid = user.contact?.contact.id;
    const avatar = user.contact?.contact.avatar;
    const TITLE_PREFIX = process.env.BUILD_ISEDM ? getIn18Text('WANGYIWAIMAOTONG') : getIn18Text('WANGYILINGXIBAN');
    const options: configOptions = {
      uid,
      email: user.id,
      name: user.nickName,
      groupid: '480959804',
      robotShuntSwitch: 1,
      robotId: 9091,
      qtype: 4483243,
      welcomeTemplateId: 1151,
      title: forElectron ? `${TITLE_PREFIX}桌面端` : `${TITLE_PREFIX}网页`,
      referrer: forElectron ? 'sirius-desktop' : 'sirius-web',
      data: JSON.stringify([
        { key: 'avatar', label: '头像', value: avatar },
        { key: 'version', label: '版本号', value: this.version },
        { key: 'system', label: '系统', value: util.isMac() ? 'MacOS' : 'Windows' },
      ]),
      success: () => {
        callback && callback(true);
        console.log('[kf_impl] config set success', options);
      },
      error: e => {
        callback && callback(false);
        console.error('[kf_impl] config set error', e);
      },
    };
    window.ysf('config', options);
  }

  static logoutHandle() {
    window.ysf('logoff');
  }

  async getUrl(): Promise<string> {
    return new Promise((r, j) => {
      if (this.isReady) {
        const url = window.ysf('url', {
          templateId: 6603268,
        });
        r(url);
      } else {
        this.setKfConfig(success => {
          if (success) {
            const url = window.ysf('url', {
              templateId: 6603268,
            });
            r(url);
          } else {
            j();
          }
        });
      }
    });
  }

  openUrl(): void {
    const url = window.ysf('url', {
      templateId: 6603268,
    });
    this.systemApi.openNewWindow(url, false);
  }

  init(): string {
    return this.name;
  }

  afterInit(): string {
    console.warn('[kf_impl] window.kf', window.ysf);
    if (inWindow() && window.ysf && !this.isInited) {
      this.isInited = true;
      window.ysf('onready', () => {
        this.isReady = true;
        this.setKfConfig();
      });
      this.eventApi.registerSysEventObserver('updateUserInfo', {
        func: () => {
          this.loginHandle();
        },
      });
    }
    return this.name;
  }

  afterLogin(): string {
    // this.setKfConfig();
    return this.name;
  }

  beforeLogout(): string {
    // this.setKfConfig();
    return this.name;
  }
}

const impl: Api = new KfApiImp();
api.registerLogicalApi(impl);
export default impl;
