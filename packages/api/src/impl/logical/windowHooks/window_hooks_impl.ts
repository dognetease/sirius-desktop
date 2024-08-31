import { inWindow } from '@/config';
import { api } from '@/api/api';
import { SystemApi } from '@/api/system/system';
import { Api } from '@/api/_base/api';
import { WindowHooksApi, WindowHooksListener } from '@/api/logical/WindowHooks';
import { EventApi } from '@/api/data/event';

class WindowHooksImpl implements WindowHooksApi {
  name: string;

  private systemApi: SystemApi;

  private eventApi: EventApi;

  resizeList: WindowHooksListener[] = [];

  constructor() {
    this.name = 'windowHooksImpl';
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
  }

  handleOpenUrl(winid: number, data: any) {
    this.systemApi.handleJumpUrl(winid, data);
  }

  isLogin() {
    return this.systemApi.getCurrentUser();
  }

  onResize(listener: WindowHooksListener) {
    this.resizeList.push(listener);
  }

  init(): string {
    if (inWindow()) {
      const isElectron = this.systemApi.isElectron() && window.electronLib;
      if (isElectron) {
        window.electronLib.windowManage.addHooksListener({
          onOpenExternalUrl: this.handleOpenUrl.bind(this),
          onResize: (_winId, bounds) => {
            this.resizeList.forEach(listener => {
              listener(bounds);
            });
          },
          onAfterClose: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronClosed',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onBeforeClose: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronClose',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onBlur: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronBlur',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onActive: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronActive',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onHide: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronHide',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onShow: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'electronShow',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onLaptopSuspend: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'laptopSuspend',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onLockScreen: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'lockScreen',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onLaptopResume: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'laptopResume',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
          onUnlockScreen: (winId, data, ext) => {
            this.eventApi.sendSysEvent({
              eventName: 'unlockScreen',
              eventStrData: String(winId),
              eventData: {
                winId,
                data,
                ext,
              },
            });
          },
        });
      }
    }
    return this.name;
  }

  afterLoadFinish() {
    return this.name;
  }
}

const apiImpl: Api = new WindowHooksImpl();
api.registerLogicalApi(apiImpl);
export default apiImpl;
