import { apis, inWindow, isElectron } from '../../../config';
import { api } from '../../../api/api';
import { Api } from '../../../api/_base/api';
import { KeyboardApi } from '@/api/system/keyboard';
import { EventApi } from '@/api/data/event';
import { SystemApi } from '@/api/system/system';
import { util } from '@/api/util';

const inEdm = process.env.BUILD_ISEDM;

class KeyboardApiImpl implements KeyboardApi {
  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  isInited = false;

  constructor() {
    this.name = apis.keyboardApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
  }

  handleGlobal(event: KeyboardEvent) {
    // 处理全局快捷键
    let eventData;
    let interceptSendEvent = false;
    let eventStrData = 'global';
    const commandKey = util.isMac() ? event.metaKey : event.ctrlKey;
    if (commandKey && !event.altKey && !event.shiftKey) {
      switch (event.keyCode) {
        case 87:
          isElectron() && window.electronLib.windowManage.close();
          interceptSendEvent = true;
          break;
        case 77:
          isElectron() && window.electronLib.windowManage.minimize();
          interceptSendEvent = true;
          break;
        case 111:
        case 191:
          eventData = {
            action: 'visibleKeyboardModel',
          };
          break;
        case 55:
          if (!inEdm) {
            interceptSendEvent = true;
          } else {
            // 打开客户
            eventData = {
              action: 'navigate',
              url: '/#customer',
              module: 'customer',
            };
          }
          break;
        case 54:
          if (!inEdm) {
            interceptSendEvent = true;
          } else {
            // 打开营销
            eventData = {
              action: 'navigate',
              url: '/#edm',
              module: 'edm',
            };
          }
          break;
        case 53:
          // 打开通讯录
          eventData = {
            action: 'navigate',
            url: '/#contact',
            module: 'contact',
          };
          break;
        case 52:
          // 打开云文档
          eventData = {
            action: 'navigate',
            url: '/#disk',
            module: 'disk',
          };
          break;
        case 51:
          // 打开日历
          eventData = {
            action: 'navigate',
            url: '/#schedule',
            module: 'schedule',
          };
          break;
        case 50:
          // 打开消息
          eventData = {
            action: 'navigate',
            url: '/#message',
            module: 'message',
          };
          break;
        case 49:
          // 打开邮箱
          eventData = {
            action: 'navigate',
            url: '/#mailbox',
            module: 'mailbox',
          };
          break;
        case 48:
          // 打开设置
          eventData = {
            action: 'navigate',
            url: '/#setting',
            module: 'setting',
          };
          break;
        default:
          eventStrData = '';
          break;
      }
    }
    return {
      eventData,
      eventStrData,
      interceptSendEvent,
    };
  }

  afterInit() {
    return this.name;
  }

  afterLogin() {
    return this.name;
  }

  init(): string {
    if (inWindow()) {
      window.addEventListener('keydown', event => {
        const currentModule = this.systemApi.getCurrentModule();
        const { eventData, eventStrData, interceptSendEvent } = this.handleGlobal(event);
        !interceptSendEvent &&
          this.eventApi.sendSysEvent({
            noLog: true,
            eventName: 'keyboard',
            eventStrData: eventStrData || currentModule,
            eventData: eventData || event,
          });
      });
    }
    this.isInited = true;
    return this.name;
  }
}

const impl: Api = new KeyboardApiImpl();
api.registerLogicalApi(impl);
export default impl;
