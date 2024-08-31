/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { config, ResponseWinInfo, WindowEventData } from 'env_def';
import { ErrMsgCodeMap } from '@/api/errMap';
import {
  EventApi,
  ObFunction,
  ObHandler,
  ObObject,
  parentWindowIframeTarget,
  SystemEvent,
  systemEventAllType,
  SystemEventTypeBaseDef,
  SystemEventTypeDef,
  SystemEventTypeNames,
  SystemEventTypeWebWorkerDef,
} from '@/api/data/event';
import { commonMessageReturn } from '@/api/_base/api';
import { api } from '@/api/api';
// import {DataStoreApi} from "../../../api/data/store";
import { apis, environment, inWindow } from '@/config';
import { FixSizeQueue, ListStore, NumberTypedMap, SequenceHelper, StringTypedMap } from '@/api/commonModel';
import { SystemApi } from '@/api/system/system';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { DataStoreApi } from '@/api/data/store';
import { guideBy } from '@/api/util/decorators';
import { AccountApi } from '@/api/logical/account';
// import { val } from 'cheerio/lib/api/attributes';
// import co=-098fig from '../../../env';
// import { SimpleWinInfo } from 'sirius-desktop/src/declare/WindowManage';
// import { electronLib } from '../../../gen/bundle';
type SysEventQueueHolder = Partial<Record<SystemEventTypeNames, ListStore<ObObject>>>;
// {
//   // eslint-disable-next-line no-undef
//   [k: SystemEventTypeNames]: ListStore<ObObject>;
// }

// const recordedEvent: SystemEventTypeNames[] = ['login', 'loginExpired', 'mailChanged', 'mailMsgCenter',
// 'mailOperation', 'initModule', 'initPage', 'contactNotify', 'selectContactNotify', 'bkStableSwitchAccount',
// 'electronClose', 'electronClosed'];

const env = typeof environment === 'string' ? environment : 'local';
const isDev = !['prod', 'prev'].includes(env);

class EventProcessingInfo {
  lastEventSeq: number;

  confirmedSeq: number;

  lastEventTime?: number;

  eventActiveCount?: number;

  eventMemoryQueue?: FixSizeQueue;

  lastEvent?: SystemEvent;

  waitingEvents?: NumberTypedMap<ObFunction>;

  constructor(eventName: SystemEventTypeNames) {
    const eventType = systemEventAllType[eventName];
    this.confirmedSeq = 0;
    this.lastEventSeq = 0;
    if (!eventType) {
      throw new Error('错误的系统事件类型');
    }
    if (eventType.persist && eventType.maxPersistNum && eventType.maxPersistNum > 1) {
      this.eventMemoryQueue = new FixSizeQueue<SystemEvent>(eventType.maxPersistNum);
    }
    if (eventType.eventType === 'workerMsg' || eventType.eventType === 'electronMsg' || eventType.eventType === 'iframeMsg') {
      this.waitingEvents = {};
    }
  }
}

class ObProcessingInfo {
  lastEventSeq: number;

  registerTime: number;

  failHandleEvent?: SystemEvent[];

  obId: number;

  constructor(obId: number) {
    this.lastEventSeq = -1;
    this.registerTime = new Date().getTime();
    this.obId = obId;
  }
}

class EventApiImpl implements EventApi {
  static host: string = config('host') as string;

  static debug: boolean = config('debug') === 'true';

  static readonly lastErrKey: string = 'lastErrTime';

  static readonly KEY_STORE_EVENT: string = 'persistEvent-';

  static eventHandleTimeout = 7500;

  static obMap: SysEventQueueHolder = {};

  static obNameMap: Map<string, ObProcessingInfo> = new Map<string, ObProcessingInfo>();

  // static extElectronObMap: SysEventQueueHolder = new SysEventQueueHolder();
  // static extObMap: SysEventQueueHolder = new SysEventQueueHolder();
  static webWorkMap: ListStore<SharedWorker> = new ListStore<SharedWorker>();

  static iframeMap: Map<string, Window> = new Map<string, Window>();

  static seq: SequenceHelper = new SequenceHelper();

  // static eventLastOccurTime: StringTypedMap<number> = {};
  //
  // static eventActionCount: StringTypedMap<number> = {};
  //
  // static eventMemoryQueue: StringTypedMap<FixSizeQueue | SystemEvent> = {};
  static status: StringTypedMap<EventProcessingInfo> = {};

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  dataTracker: DataTrackerApi;

  loggerTracker: DataTrackerApi;

  accountApi: AccountApi;

  currentAccount = '';

  // winId?:number;
  // webContentId?:number;
  name: string;

  // private storeApi: DataStoreApi;
  private static focused = true;

  private static readonly webIdMap: Map<number, number> = new Map<number, number>();

  // private static readonly accountBgOnlyEvents = ['login', 'logout', 'loginExpiredCrossWindow'];

  private isEventListenerInited = false;

  constructor() {
    this.name = apis.defaultEventApi;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.loggerTracker = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    // this.storeApi = api.getDataStoreApi();
    // console.log('constructor called,', this.name);
  }

  // private eventPerfomanceTotalStore=new EventPerfomanceTotalStore()

  sendSysEvent(ev: SystemEvent, notPersist?: boolean, noPostInfo?: boolean, toCertainOb?: ObObject): Promise<commonMessageReturn> | undefined {
    const startTime = Date.now();
    if (!ev.noLog && ev.eventName === 'storeUserChangeEvent') {
      // console.error('**[event] send event called ' + ev.eventName, ev);
    }
    if (ev.eventName === 'loginExpired' && inWindow()) {
      this.dataTracker.track('pc_auto_login_occurred', { bk: window.isBridgeWorker, path: window.location.pathname });
    }
    const eventType = this.checkEvent(ev);
    // 超时信息不发送
    if (this.testEventExipred(eventType, ev, true)) {
      console.warn('[event] event expired !! ', ev);
      // this.loggerTracker.track('event_expired_when_sending', ev);
      this.trackEvent('event_expired_when_sending', eventType, ev);
      return undefined;
    }
    ev.eventTime = ev.eventTime || new Date().getTime();
    const status = EventApiImpl.status[ev.eventName];
    if (!status) {
      return undefined;
    }
    // status.lastEventSeq = status.lastEventSeq || 0;
    ev.eventSeq = ev.eventSeq || status.lastEventSeq + 1;
    ev._account = ev._account || this.currentAccount || this.systemApi.getCurrentUser()?.id;
    ev._fromPage = window.location.pathname;
    if (eventType.filter && !eventType.filter(ev)) {
      return undefined;
    }
    if (!ev.noLog) {
      console.log('[event] will send:' + ev.eventName, ev, status);
      this.trackEvent('event_send', eventType, ev, status);
    }
    // if (eventType.eventType === 'innerMsg') {
    const obMapElement = EventApiImpl.obMap[ev.eventName];
    if ((!eventType.persist || eventType.persist === 'none') && !obMapElement) {
      if (!isDev) {
        throw new Error('非持久化消息需要有消费者才可发送:' + ev.eventName);
      } else {
        return undefined;
      }
    }
    if (!notPersist) {
      this.persistEventData(eventType, ev);
    }
    if (eventType.acceptCount && eventType.acceptCount > 0) {
      if (status.lastEventSeq - status.confirmedSeq > eventType.acceptCount) {
        return undefined;
      }
    }

    // const performanceKey = this.eventPerfomanceTotalStore.start(ev.eventName);
    const flag = (eventType.toAllWin || eventType.toType || ev.toType) && eventType.eventType === 'electronMsg';
    if (!flag || noPostInfo || (ev.eventSubItem && ev.eventSubItem > 0)) {
      if (toCertainOb) {
        if (!this.filterObEvent(toCertainOb, ev)) {
          ev.isStick = true;
          toCertainOb.func(ev);
        }
        return Promise.resolve('');
      }
      const eventHandled = this.handleEventConsuming({
        status,
        ev,
        obMapElement,
        eventType,
        noPostInfo: !!noPostInfo || !!ev.noPost,
      });
      if (Date.now() - startTime > 200) {
        console.warn(`[event]%cconsuming too long.${ev.eventName}.duration:${Date.now() - startTime}`, 'color:blue;background:yellow;font-size:14px', ev);
      }

      // this.eventPerfomanceTotalStore.complete(performanceKey);
      return eventHandled;
    }
    if (flag) {
      const eventHandled = this.sendEventToAll(status, ev, eventType);
      if (Date.now() - startTime > 200) {
        console.warn(`[event]%cconsuming too long.${ev.eventName}.duration:${Date.now() - startTime}`, 'color:blue;background:yellow;font-size:14px', ev);
      }
      // this.eventPerfomanceTotalStore.complete(performanceKey);
      return eventHandled;
    }
    throw new Error('发送事件的参数类型不合法');
  }

  private trackEvent(evName: string, eventType: SystemEventTypeDef, ev: SystemEvent<any>, status?: EventProcessingInfo) {
    // web端不打event日志
    if (!this.systemApi.isElectron()) {
      return;
    }
    if (Math.random() > (eventType.recordSample || 0.5)) {
      this.loggerTracker.track(evName, {
        event: JSON.stringify(ev).substr(0, eventType.recordLen || 2048),
        seq: ev.eventSeq,
        time: ev.eventTime,
        status: status
          ? {
              seq: status.lastEventSeq,
              time: status.lastEventTime,
              last: JSON.stringify(status.lastEvent || status.eventMemoryQueue?.toArray())?.substr(0, eventType.recordLen || 2048),
            }
          : undefined,
      });
    }
  }

  private async sendEventToAll(status: EventProcessingInfo, ev: SystemEvent<any>, type: SystemEventTypeDef) {
    const allInfos: ResponseWinInfo[] = await this.systemApi.getAllWindow();
    this.buildWebIdMap(allInfos);
    let infos = allInfos;
    if (ev.toType || type.toType) {
      const filterType = ev.toType || type.toType || [];
      infos = allInfos.filter(it => filterType?.findIndex(tpit => it.type === tpit) >= 0);
    }
    // const eventType = systemEventAllType[ev.eventName];
    // 过滤非目标账号的窗口
    // if (!eventType.toAllAccount) {
    //   // 拿到全部当前所有登录账号信息，过滤非当前账号的账号后台窗口
    //   let noNeedSendWins = this.accountApi.getAccountWinInfos().filter(account => ev._account !== account.email);

    //   // toAccount 为指定白名单窗口，从过滤窗口列表移除
    //   if (Array.isArray(ev.toAccount) && ev.toAccount.length > 0) {
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore 都已经判断isArray成立了，为啥lint还报错？
    //     noNeedSendWins = noNeedSendWins.filter(account => !ev.toAccount.includes(account.email));
    //   }
    //   const noNeedSendWinIds = noNeedSendWins.map(account => account.winId);
    //   // 不向 noNeedSendWinIds 窗口发送消息，过滤掉
    //   if (noNeedSendWinIds.length) {
    //     infos = infos.filter((it: ResponseWinInfo) => !noNeedSendWinIds.includes(it.id));
    //   }
    // }
    const selfWin = await this.systemApi.getCurrentWinInfo(true);
    const promises: Promise<commonMessageReturn>[] = [];
    const idSet: Set<number> = new Set<number>();
    status.lastEventTime = ev.eventTime || 0;
    status.lastEventSeq = ev.eventSeq || 0;
    // const isAccountBgOnlyEvent = window.isAccountBg && EventApiImpl.accountBgOnlyEvents.includes(ev.eventName);
    // for (const win of infos)
    infos.forEach(win => {
      if (!idSet.has(win.webId)) {
        idSet.add(win.webId);
        if (win.id !== selfWin.id) {
          // if (isAccountBgOnlyEvent) {
          //   return;
          // }
          if (!ev.noPost) {
            const newEvent = {
              ...ev,
              ...({
                eventTarget: String(win.webId),
                eventSubItem: ev.eventSeq,
                eventSeq: undefined,
                eventTime: undefined,
                asInnerMsg: false,
                noLog: true,
              } as Partial<SystemEvent>),
            };
            // newEvent.eventSeq = undefined;
            const items = this.sendSysEvent(newEvent);
            if (items) {
              promises.push(items);
            }
          }
        } else if (ev.asInnerMsg || type.asInnerMsg) {
          // as inner msg 需要发给自己
          const newEvent = {
            ...ev,
            ...({
              // eventTarget: String(win.webId),
              eventSubItem: ev.eventSeq,
              eventSeq: undefined,
              eventTime: undefined,
              asInnerMsg: true,
              noLog: true,
            } as Partial<SystemEvent>),
          };
          const items = this.sendSysEvent(newEvent, type.persist !== 'memory' && type.persist !== 'disk', true);
          if (items) {
            promises.push(items);
          }
        }
      }
    });
    console.log('[event] send to all window got item:', promises.length); // 如果没有可发窗体，直接返回
    const toAllIds = infos.map(it => it.webId + ',' + it.id);
    this.loggerTracker.track('event_send_to_all', {
      evName: ev.eventName,
      evSeq: ev.eventSeq,
      evTime: ev.eventTime,
      toAll: toAllIds,
    });
    // debugger;
    return promises.length > 0
      ? Promise.allSettled(promises)
          .then((rs: PromiseSettledResult<commonMessageReturn>[]) => {
            console.warn('[event] send all event to win got :', rs.map(it => it.status).join(' '));
            return '';
          })
          .catch(reason => {
            console.warn('[event] send to all window error ', reason);
            this.loggerTracker.track('event_send_to_all_error', {
              evName: ev.eventName,
              evSeq: ev.eventSeq,
              evTime: ev.eventTime,
              toAll: toAllIds,
            });
            return '发送全局事件出现错误';
          })
      : Promise.resolve('');
  }

  private filterObEvent(ob: ObObject, ev: SystemEvent<any>) {
    // 注册ob._account 并且发送ev指定_account 会检测是否相同，否则不执行回调
    if (ob._account && ev._account && ob._account !== ev._account) {
      return true;
    }
    if (ob.nameFilter && ev.eventStrData) {
      if (typeof ob.nameFilter === 'string') {
        return ob.nameFilter === ev.eventStrData;
      }
      if (ob.nameFilter instanceof RegExp) {
        return ob.nameFilter.test(ev.eventStrData);
      }
    }
    return false;
  }

  private handleEventConsuming(conf: {
    status: EventProcessingInfo;
    ev: SystemEvent<any>;
    obMapElement?: ListStore<ObObject>;
    eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef;
    noPostInfo: undefined | boolean;
  }) {
    const { status, ev, obMapElement, eventType, noPostInfo } = conf;
    // 同一个seq只处理一次，避免重放
    if (!noPostInfo && status.lastEventSeq && ev.eventSeq && ev.eventSeq > 0 && status.lastEventSeq === ev.eventSeq) {
      return Promise.resolve('');
    }
    status.lastEventTime = ev.eventTime || 0;
    status.lastEventSeq = ev.eventSeq || 0;
    const type = eventType.eventType;
    // if (type === 'innerMsg' || !!noPostInfo) { }
    const asInnerMsg = ev.asInnerMsg !== undefined ? ev.asInnerMsg : !!eventType.asInnerMsg;
    console.time('[event] handleEventConsuming iterateObPromise' + ev.eventName);
    const iterateObPromise =
      (type === 'innerMsg' || !!noPostInfo || asInnerMsg) && obMapElement && obMapElement.total > 0
        ? obMapElement.iterate((ob: ObObject) => {
            // const element = EventApiImpl.status[ev.eventName];
            const element = status.eventActiveCount;
            status.eventActiveCount =
              // eslint-disable-next-line no-nested-ternary
              element ? (element + 1 > 90000000 ? 90000000 : element + 1) : 1;
            if (!this.filterObEvent(ob, ev)) {
              console.log('[event] event processing: ', ev.eventName, ' -> ', ob.name);
              ob.func(ev);
            }
          })
        : Promise.resolve('');
    return iterateObPromise
      .then(res => {
        console.timeEnd('[event] handleEventConsuming iterateObPromise' + ev.eventName);
        if (!ev.noLog) {
          console.log('[event] done system event dispatch with flag:' + noPostInfo, ev);
        }
        if ((type === 'workerMsg' || type === 'electronMsg' || type === 'iframeMsg') && !noPostInfo) {
          return this.postMessage(ev, !!ev.eventSubItem);
        }
        return res as commonMessageReturn;

        // else {
        //     throw new Error("not supported yet " + ErrMsgCodeMap['SEND.MSG.EXCEPTION']);
        // }
      })
      .catch(reason => {
        console.warn('[event] done  event handle got error:', ev, reason);
        return ErrMsgCodeMap['SEND.MSG.EXCEPTION'] as commonMessageReturn;
      });
  }

  private persistEventData(eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, ev: SystemEvent<any>) {
    if (eventType.persist && eventType.persist !== 'none') {
      this.persistEventToMemory(eventType, ev);
      if (eventType.persist === 'disk' && this.systemApi.isElectron()) {
        // TODO : persist event content to dist
        this.saveEventToLocal(ev);
      }
    }
  }

  private checkEvent(ev: SystemEvent<unknown>) {
    if (!ev || !ev.eventName) {
      throw new Error('发送事件参数错误');
    }
    const eventType = systemEventAllType[ev.eventName];
    if (!eventType || !eventType.enable) {
      throw new Error('非法事件类型');
    }
    if (eventType.eventType === 'sysFeedback') {
      throw new Error('此类型事件无法通过外部接口发送');
    }

    if (!EventApiImpl.status[ev.eventName]) {
      throw new Error('此类型事件status未注册');
    }
    return eventType;
  }

  private persistEventToMemory(eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, ev: SystemEvent<any>) {
    if (eventType.maxPersistNum === 0) return;
    const size = eventType.maxPersistNum || 1;
    if (size === 1) {
      EventApiImpl.status[ev.eventName].lastEvent = ev;
      if (!ev.noLog) {
        console.log('[event] persist event to memory store:', ev);
      }
    } else {
      let queueElement = EventApiImpl.status[ev.eventName].eventMemoryQueue as FixSizeQueue<SystemEvent>;
      if (!queueElement) {
        queueElement = new FixSizeQueue<SystemEvent>(size);
      }
      const num = queueElement.push(ev);
      if (!ev.noLog) {
        console.log('[event] persist event to memory queue:', num, ev);
      }
    }
  }

  confirmEvent(ev: SystemEvent) {
    const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
    if (eventType.eventType === 'workerMsg' || eventType.eventType === 'electronMsg') {
      return;
    }
    const status = EventApiImpl.status[ev.eventName];
    const element = status.eventActiveCount;
    status.eventActiveCount =
      // eslint-disable-next-line no-nested-ternary
      element !== undefined ? (element - 1 > 0 ? element - 1 : 0) : 0;
    status.confirmedSeq = ev.eventSeq || 0;
    if (eventType.acceptCount && eventType.acceptCount > 0) {
      if (status.lastEventSeq - status.confirmedSeq <= eventType.acceptCount) {
        this.dumpMessageFromQueue(ev.eventName, 1);
      }
    }
  }

  @guideBy(inWindow)
  registerSysEventObserver(eventName: SystemEventTypeNames, ob: ObHandler): number {
    if (typeof ob !== 'object' && typeof ob !== 'function') {
      throw new Error('添加监视者不合法');
    }
    if (inWindow() && environment !== 'prod') {
      console.log('[event] got event register:', eventName, ob);
    }
    const eventType = systemEventAllType[eventName];
    if (!eventType) {
      throw new Error('非法事件类型');
    }
    const re = this.addObObjToMap(EventApiImpl.obMap, eventName, ob);

    // 处理持久化事件，添加监听器时需要判定是否已经有持久化的消息储存，如有则应触发消息发送事件
    if (eventType.persist) {
      this.dumpMessageFromQueue(eventName, undefined, re.ob);
    }
    return re.ret;
  }

  getObserverByName(eventName: SystemEventTypeNames, obName: string): ObObject | undefined {
    if (EventApiImpl.obNameMap.has(obName)) {
      const newVar = EventApiImpl.obNameMap.get(obName);
      const mapElement = EventApiImpl.obMap[eventName];
      return mapElement && newVar ? mapElement.getOb(newVar.obId) : undefined;
    }
    return undefined;
  }

  private addObObjToMap(obMap: SysEventQueueHolder, eventName: SystemEventTypeNames, ob: ObObject) {
    if (!obMap[eventName]) {
      obMap[eventName] = new ListStore();
    }
    // console.log('addObObjToMap', _account);
    // if (typeof ob === 'function') {
    ob.name = ob.name || 'no-name-' + (Math.floor(Math.random() * 1000) * 100000 + (Date.now() % 100000));
    ob.eventName = eventName;
    // }
    let ret: number | undefined;
    if (EventApiImpl.obNameMap.has(ob.name)) {
      const newVar = EventApiImpl.obNameMap.get(ob.name);
      if (newVar && newVar.obId) {
        ret = newVar.obId;
      }
    }
    if (ret === undefined) {
      ret = obMap[eventName]!.addOb(ob as ObObject, ob.prepend);
      if (ob && !ob.name.startsWith('no-name-')) {
        EventApiImpl.obNameMap.set(ob.name, new ObProcessingInfo(ret));
      }
    }
    return { ob, ret };
  }

  unregisterSysEventObserver(eventName: SystemEventTypeNames, id: number): void {
    const obMapElement = EventApiImpl.obMap[eventName];
    if (!obMapElement) {
      return;
    }
    const eventType = systemEventAllType[eventName];
    if (!eventType) {
      return;
    }
    const ob = obMapElement?.removeOb(id);
    ob && !ob.name!.startsWith('no-name-') && EventApiImpl.obNameMap.delete(ob.name!);
    console.log('[event] remove observer of ' + eventName + ' :' + ob?.name);
    // let obMap;
    /* if (eventType.eventType === 'innerMsg') {
     obMap = EventApiImpl.obMap;
     } else */
    // if (eventType.eventType === 'workerMsg') {
    //   const obMap = EventApiImpl.extObMap;
    //   obMap && ob && ob.postObId !== undefined && obMap[eventName].removeOb(ob.postObId);
    // } else if (eventType.eventType === 'electronMsg') {
    //   const obMap = EventApiImpl.extElectronObMap;
    //   obMap && ob && ob.electronObId !== undefined && obMap[eventName].removeOb(ob.electronObId);
    // } else {
    //   throw new Error('not supported yet');
    // }
    // if (eventType.eventType === "innerMsg") {
    //     SystemApiImpl.obMap[eventName].removeOb(id);
    // } else {
    //     SystemApiImpl.extObMap[eventName].removeOb(id);
    // }
  }

  async postMessage(ev: SystemEvent, noConfirm?: boolean): Promise<string> {
    const eventType: SystemEventTypeDef = this.checkEvent(ev);
    const status = EventApiImpl.status[ev.eventName];
    let finishSend = false;
    // if (!ev || !ev.eventName || !EventApiImpl.obMap[ev.eventName]) return 'SEND.MSG.EXCEPTION';
    // const eventType = systemEventAllType[ev.eventName];
    if (eventType.eventType === 'iframeMsg') {
      // if (!eventType.iframeElementId && !ev.) return Promise.reject('SEND.MSG.EXCEPTION');'
      let target: Window | undefined;
      if (ev.eventTarget) {
        target = EventApiImpl.iframeMap.get(ev.eventTarget);
      }
      if (!target) {
        const element = ev.iframeElementId ? EventApiImpl.getIframeWindowById(ev.iframeElementId) : EventApiImpl.iframeMap.get(ev.eventName) || window.parent;
        target = element;
      }
      if (target && target.postMessage) {
        target.postMessage(ev, EventApiImpl.host);
        if (!ev.noLog) {
          console.log('[event] ***** post iframe message with flag ' + noConfirm + ':', ev);
        }
        finishSend = true;
        if (ev.eventTarget) {
          EventApiImpl.iframeMap.delete(ev.eventTarget);
        }
      } else {
        return Promise.reject(new Error('SEND.MSG.EXCEPTION'));
      }
    } else if (eventType.eventType === 'workerMsg') {
      if (!eventType.handlerWorkerId) {
        return Promise.reject(new Error('SEND.MSG.EXCEPTION'));
      }
      const ob: SharedWorker | undefined = EventApiImpl.webWorkMap.getOb(eventType.handlerWorkerId);
      if (ob) {
        ob.port.postMessage(ev);
        if (!ev.noLog) {
          console.log('[event] ***** post worker message with flag ' + noConfirm + ':', ev);
        }
        finishSend = true;
      } else {
        return Promise.reject(new Error('SEND.MSG.EXCEPTION'));
      }
    } else if (eventType.eventType === 'electronMsg') {
      if (this.systemApi.isElectron() && window.electronLib) {
        const id = await this.buildEventSendId(ev);
        if (!id) {
          return Promise.reject(new Error('no win id'));
        }
        window.electronLib.windowManage
          .exchangeData({
            id,
            data: ev,
          })
          .then();
        if (!ev.noLog) {
          console.log('[event] ***** post electron message with flag ' + noConfirm + ':', ev);
        }
        finishSend = true;
      } else {
        return Promise.reject(new Error('not support by current environment'));
      }
    } else {
      return Promise.reject(new Error('not supported'));
    }
    if (finishSend && !noConfirm) {
      return new Promise<string>((r, j) => {
        const tid = setTimeout(() => {
          console.warn('[event] ***** failed confirm message for timeout :', ev);
          j(new Error('事件返回确认超时，发送失败'));
          this.saveEventToLocal(ev).then(() => {
            // console.log('***** event data store to local');
          });
        }, EventApiImpl.eventHandleTimeout);
        if (!status || !status.waitingEvents) {
          j(new Error('内部错误，未生成必要的状态存储'));
        }
        if (ev.eventSeq) {
          status.waitingEvents![ev.eventSeq] = (re: SystemEvent) => {
            if (re.eventMsg?.feedbackSeq === ev.eventSeq) {
              clearTimeout(tid);
              delete status.waitingEvents![ev.eventSeq || 0];
              if (!ev.noLog) {
                console.log('[event] ***** finish confirm message:', ev, re);
              }
              r('');
            } else {
              console.warn('[event] ***** failed confirm message for unknown :', ev, re);
              j(new Error('未知错误，得到意外的返回事件'));
            }
          };
        } else {
          j(new Error('未知错误，事件无序列号'));
        }
      });
    }
    return Promise.resolve('');
  }

  private async buildEventSendId(ev: SystemEvent<any>) {
    let id;
    if (ev.eventTarget && /\d+/.test(ev.eventTarget)) {
      id = Number(ev.eventTarget);
    } else {
      const winInfo = await this.systemApi.getCurrentWinInfo(true);
      const winId = winInfo.parent;
      if (winId !== -1) {
        if (EventApiImpl.webIdMap.has(winId)) {
          id = EventApiImpl.webIdMap.get(winId);
        } else {
          const winInfos = await this.systemApi.getAllWindow();
          this.buildWebIdMap(winInfos);
          id = EventApiImpl.webIdMap.get(winId);
        }
      }
      ev.eventTarget = String(id);
    }
    console.log('[event] send event to win ' + id, ev);
    return id;
  }

  private async saveEventToLocal(ev: SystemEvent<any>) {
    const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
    if (eventType.maxPersistNum === 0) return Promise.resolve();
    const size = eventType.maxPersistNum || 1;
    const eventKey = this.getStoredEventKey(ev);
    if (eventType.persistTTL && eventType.persistTTL <= 0) {
      return Promise.resolve();
    }
    if (size === 1) {
      await this.putEventToStore(eventKey, ev);
    } else {
      let data: SystemEvent[] = [];
      const storeData = await this.getEventFromStore(eventKey);
      if (storeData && typeof storeData === 'string' && storeData.trim().length > 0) {
        data = JSON.parse(storeData);
      }
      data.push(ev);
      // await this.storeApi.put(eventKey, JSON.stringify(data));
      await this.putEventToStore(eventKey, data);
    }
    return Promise.resolve();
  }

  private async putEventToStore(eventKey: string, ev: any) {
    const data = JSON.stringify(ev);
    try {
      if (this.systemApi.isElectron()) {
        await window.electronLib.storeManage.set('event', eventKey, data);
      } else {
        await this.storeApi.put(eventKey, data);
      }
    } catch (e) {
      console.warn('[event] save local', e);
    }
  }

  private async getEventFromStore(eventKey: string) {
    try {
      if (this.systemApi.isElectron()) {
        return window.electronLib.storeManage.get('event', eventKey);
      }
      const dt = await this.storeApi.get(eventKey);
      if (dt && dt.suc && dt.data && dt.data.trim().length > 0) {
        return dt.data;
      }
    } catch (e) {
      console.warn('[event] get local', e);
    }
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  setupIframe(eventType: SystemEventTypeDef, eventName: SystemEventTypeNames) {
    if (inWindow()) {
      const iframeId = eventType.iframeElementId && eventType.iframeElementId();
      const iframeWin: Window | undefined = EventApiImpl.getIframeWindowById(iframeId);
      if (iframeWin) {
        EventApiImpl.iframeMap.set(eventName, iframeWin);
      }
    }
  }

  private static getIframeWindowById(iframeId: string | undefined): Window | undefined {
    if (!iframeId) {
      return undefined;
    }
    if (iframeId === parentWindowIframeTarget) {
      return window.parent;
    }
    let iframeWin: Window | undefined;
    if (iframeId) {
      const iframe: HTMLIFrameElement = window.document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframeWin = iframe.contentWindow;
      }
    }
    return iframeWin;
  }

  setupWebWorker(param: SystemEventTypeDef, name?: string): number {
    if (typeof window !== 'undefined' && typeof window.SharedWorker !== 'undefined') {
      if (param && param.handlerWorkScript) {
        const worker: SharedWorker = new SharedWorker(param.handlerWorkScript, {
          name: name || this.systemApi.md5(param.handlerWorkScript, true),
          credentials: 'same-origin',
        });
        param.handlerWorkerId = EventApiImpl.webWorkMap.addOb(worker);
        worker.port.addEventListener('message', this.workerListener);
        worker.port.addEventListener('messageerror', this.workerErrorListener);
        // TODO: handle error
      }
    }
    return -1;
  }

  // eslint-disable-next-line class-methods-use-this
  terminateWebWorker(id: number): void {
    const ob = EventApiImpl.webWorkMap.getOb(id);
    if (ob) {
      ob.port.close();
    }
  }

  sendSimpleSysEvent(eventName: SystemEventTypeNames): Promise<commonMessageReturn> | undefined {
    return this.sendSysEvent({
      eventName,
      eventStrData: eventName,
      // eventSeq: 0,
    });
  }

  dumpMessageFromQueue(eventName: SystemEventTypeNames, num?: number, sendToCertainOb?: ObObject) {
    const eventType = systemEventAllType[eventName];
    if (eventType.persist === 'memory') {
      console.log('[event] handle persist event for ' + eventName, eventType);
      const size = eventType.maxPersistNum || 1;
      const status = EventApiImpl.status[eventName];
      if (!status) {
        throw new Error('not got status, why');
      }
      const el = status.lastEvent;
      if (size === 1 && el) {
        const expired = this.testEventExipred(eventType, el);
        if (!expired) {
          this.sendSysEvent(el as SystemEvent, true, true, sendToCertainOb);
        }
      }
      if (size > 1) {
        const element = status.eventMemoryQueue as FixSizeQueue<SystemEvent>;
        num = num || element?.size() || 0;
        if (num < 1) {
          return;
        }
        if (element) {
          let el;
          let index = 0;
          const newArray = element.toArray();
          while (
            // eslint-disable-next-line no-cond-assign
            (el = newArray.pop()) &&
            index < num
          ) {
            index += 1;
            const expired = this.testEventExipred(eventType, el);
            if (!expired) {
              this.sendSysEvent(el, true, true, sendToCertainOb);
            }
          }
        }
      }
    }
  }

  private testEventExipred(eventType: SystemEventTypeDef, el: SystemEvent<any>, testSending?: boolean) {
    let expired;
    if (el.eventTime && eventType.persistTTL !== undefined) {
      // 发送情况下检测，将持久化的生存周期加上事件默认的ttl，因为消息可能在持久化一段时间后再发送，发送时需要额外增加时间的余量
      expired = el.eventTime + (testSending ? (eventType.ttl || eventType.persistTTL) + eventType.persistTTL : eventType.persistTTL) <= Date.now();
    }
    return expired;
  }

  private sendFeedback(data: SystemEvent<any>) {
    const eventType = systemEventAllType[data.eventName];
    console.log('[event] send feed back:' + data.eventName, data);
    if (eventType.eventType === 'electronMsg') {
      this.postMessage(
        {
          eventMsg: {
            feedbackSeq: data.eventSeq,
          },
          eventName: data.eventName,
          eventSeq: data.eventSeq,
          eventTarget: data.eventFrom,
        } as SystemEvent,
        true
      ).then();
    } else if (eventType.eventType === 'workerMsg' || eventType.eventType === 'iframeMsg') {
      this.postMessage(
        {
          eventMsg: {
            feedbackSeq: data.eventSeq,
          },
          eventName: data.eventName,
          eventSeq: data.eventSeq,
          eventTarget: data.eventFrom,
        } as SystemEvent,
        true
      ).then();
    }
  }

  private resendSysEvent(data: SystemEvent<any>, noFeedback?: boolean) {
    this.sendSysEvent(data, false, true) || Promise.resolve('');
    if (!noFeedback) {
      // if (sendPromise) {
      // sendPromise.then(() => {
      this.sendFeedback(data);
      // });
      // } else {
      //   this.sendFeedback(data);
      // }
    }
  }

  private workerListener(ev: MessageEvent) {
    const data = ev.data as SystemEvent;
    if (data && data.eventName && EventApiImpl.obMap[data.eventName]) {
      this.handleReceivedPostMsg(data);
      // const sendPromise = this.sendSysEvent(data, false, true);
      // if(sendPromise) {
      //   sendPromise.then(() => {
      //
      //   });
      // }else{
      //
      // }
      // EventApiImpl.obMap[data.eventName].iterate(ob => ob.func(data)).then(res => {
      //   console.log(res + ' finished');
      // });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private workerErrorListener(ev: MessageEvent) {
    // this.storeApi.put(EventApiImpl.lastErrKey, new Date()).then();
    console.log('error', ev);
  }

  watchElectronMsg() {
    // 通过ipc 监听electron发来的信息
    if (inWindow() && this.systemApi.isElectron() && window.electronLib) {
      window.electronLib.windowManage.addExchangeDataListener((res: WindowEventData) => {
        console.warn('*******receive data from ipc:' + res.webId, res);
        const info = res.data;
        if (info) {
          const data = info.data as SystemEvent;
          data.eventFrom = String(info.webId);
          this.handleReceivedPostMsg(data);
        }
      });
    }
  }

  watchIframeMsg() {
    if (inWindow()) {
      window.addEventListener('message', ev => {
        const { origin } = ev;
        if (origin !== EventApiImpl.host) {
          return;
        }
        // console.log('*******receive data from iframe:' + window.location.pathname, ev);
        const data = ev.data as SystemEvent;
        if (data && data.eventName) {
          data.eventFrom = 'ifr-' + EventApiImpl.seq.next();
          EventApiImpl.iframeMap.set(data.eventFrom, ev.source as Window);
          this.handleReceivedPostMsg(data);
        }
      });
    }
  }

  private handleReceivedPostMsg(data: SystemEvent<any>) {
    if (!data || !data.eventName) {
      return;
    }
    // const eventType = systemEventAllType[data.eventName];
    // ************多账号场景，过滤非当前账号事件消息 start ************
    // this.currentAccount = this.currentAccount || this.systemApi.getCurrentUser()?.id || '';
    // // 非当前账号消息，且不是全账号广播消息
    // if (!eventType?.toAllAccount && this.currentAccount && data._account !== this.currentAccount) {
    //   // toAccount白名单包含当前账号，就继续执行后续逻辑，否则过滤掉
    //   if (!(Array.isArray(data.toAccount) && data.toAccount.length > 0 && data.toAccount.includes(this.currentAccount))) {
    //     return;
    //   }
    // }
    // ************多账号场景，过滤非当前账号事件消息 end ************
    if (data.eventMsg && data.eventMsg.feedbackSeq) {
      const status = EventApiImpl.status[data.eventName];
      console.log('[event] *******handle feed back event:', data);
      if (!status || !status.waitingEvents) {
        throw new Error('内部错误，未生成必要的状态存储');
      }
      if (status.waitingEvents[data.eventMsg.feedbackSeq]) {
        status.waitingEvents[data.eventMsg.feedbackSeq](data);
      }
    } else {
      const eventType = systemEventAllType[data.eventName];
      if (eventType.eventType === 'electronMsg' || eventType.eventType === 'workerMsg' || eventType.eventType === 'iframeMsg') {
        // const isAccountBgOnlyEvent = window.isAccountBg && EventApiImpl.accountBgOnlyEvents.includes(data.eventName);
        // if (isAccountBgOnlyEvent) return;
        this.resendSysEvent(data);
      }
    }
  }

  private async loadEventFromLocal(eventName: SystemEventTypeNames, eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, noSend?: boolean) {
    const size = eventType.maxPersistNum || 1;
    try {
      const winInfo = await this.systemApi.getCurrentWinInfo(true);
      if (!winInfo) {
        return;
      }
      const eventKey = this.getStoredEventKey({ eventName, eventTarget: String(winInfo.webId) });
      // if (size === 1) {
      const storeData = await this.getEventFromStore(eventKey);
      if (storeData && typeof storeData === 'string' && storeData.trim().length > 0) {
        if (size === 1) {
          const ev = JSON.parse(storeData) as SystemEvent;
          this.handleLocalStoreEventItem({
            ev,
            noSend,
            eventName,
            eventKey,
            eventType,
          }).then();
        } else {
          const evs = JSON.parse(storeData) as SystemEvent[];
          if (evs && evs.length > 0) {
            evs.forEach(it => {
              this.handleLocalStoreEventItem({
                ev: it,
                noSend,
                eventName,
                eventKey,
                eventType,
              }).then();
            });
          }
        }
      }
    } catch (e) {
      console.warn('[event] load from local error', e);
    }
    // } else {
    //
    // }
  }

  private getStoredEventKey(ev: SystemEvent) {
    const eventType: SystemEventTypeDef = this.checkEvent(ev);
    const { eventName } = ev;
    let id: string | undefined;
    if (eventType.eventType === 'electronMsg') {
      id = String(ev.eventTarget);
    } else if (eventType.eventType === 'workerMsg') {
      id = eventType.handlerWorkScript;
    } else if (eventType.eventType === 'iframeMsg') {
      id = (eventType.iframeElementId && eventType.iframeElementId()) || '';
    }
    return EventApiImpl.KEY_STORE_EVENT + (id ? '-' + id : '') + '-' + eventName;
  }

  private async handleLocalStoreEventItem({
    noSend,
    ev,
    eventName,
    eventKey,
    eventType,
  }: {
    ev: SystemEvent;
    noSend: boolean | undefined;
    eventName: SystemEventTypeNames;
    eventKey: string;
    eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef;
  }) {
    await this.deleteEventFromLocal(eventKey);
    if (ev.eventTime && ((eventType.persistTTL && eventType.persistTTL > 0 && eventType.persistTTL + ev.eventTime > Date.now()) || eventType.persistTTL === undefined)) {
      if (!noSend) {
        this.resendSysEvent(ev, true);
      } else {
        const status = EventApiImpl.status[eventName];
        status.lastEvent = ev;
      }
    }
    // const eventKey = this.getStoredEventKey(ev);
  }

  private async deleteEventFromLocal(eventKey: string) {
    if (window.electronLib && this.systemApi.isElectron()) {
      await window.electronLib.storeManage.set('event', eventKey, '');
    }
    await this.storeApi.del(eventKey);
  }

  init() {
    console.log('[event] init called', this);
    // 添加过监听后，不用再次添加监听，避免多次触发事件
    if (this.isEventListenerInited) return this.name;

    systemEventAllType.error.filter = (ev: SystemEvent) => {
      const now = new Date().getTime();
      const lastTime = EventApiImpl.status[ev.eventName].lastEventTime || 0;
      const eventActionCount = now - lastTime < 120000 ? EventApiImpl.status[ev.eventName].eventActiveCount || 0 : 0;
      EventApiImpl.status[ev.eventName].eventActiveCount = eventActionCount;
      return ev.eventData?.forcePopup || ((!ev.auto || EventApiImpl.focused) && eventActionCount < 1 && (ev.eventTime || now) - lastTime > 3500);
    };
    console.log('[event] handle worker script init');
    const entries = Object.entries(systemEventAllType);
    const isInWeb = !this.systemApi.isElectron();
    // this.currentAccount = this.accountApi?.getCurrentAccount()?.email || '';
    // this.currentAccount = '';
    entries.forEach(value => {
      console.log('[event] enabled event:' + value[0] + ' ' + value[1].eventType, value);
      const eventType = value[1] as SystemEventTypeDef;
      if (eventType.enable) {
        const eventName = value[0] as SystemEventTypeNames;
        EventApiImpl.status[eventName] = new EventProcessingInfo(eventName);
        if (eventType.eventType === 'electronMsg' || eventType.eventType === 'workerMsg') {
          eventType.persist = eventType.persist || 'memory';
        }
        if (typeof eventType.toAllAccount !== 'boolean') {
          eventType.toAllAccount = !!eventType.toAllAccount;
        }
        if (typeof window !== 'undefined' && (typeof window.SharedWorker !== 'undefined' || typeof window.Worker !== 'undefined')) {
          if (eventType.eventType === 'workerMsg') {
            this.setupWebWorker(eventType, eventName);
          }
          if (eventType.eventType === 'iframeMsg') {
            this.setupIframe(eventType, eventName);
          }
        }
        if (isInWeb && eventType.enableInWeb) {
          eventType.toAllWin = false;
          eventType.eventType = 'innerMsg';
        }
      }
      // TODO : load event data from disk if any
    });
    this.watchElectronMsg();
    this.watchIframeMsg();
    this.isEventListenerInited = true;
    return this.name;
  }

  afterLoadFinish() {
    this.prepareWindow();
    return this.name;
  }

  private prepareWindow() {
    if (inWindow() && this.systemApi.isElectron() && window.electronLib && this.systemApi.isMainWindow()) {
      setTimeout(async () => {
        const isLowMemoryMode = await this.systemApi.getIsLowMemoryMode();
        const isLockApp = await this.systemApi.getIsLockApp();
        if (isLowMemoryMode || isLockApp) {
          return;
        }
        const currentUser = this.systemApi.getCurrentUser();
        if (currentUser) {
          this.currentAccount = currentUser.id;
          window.electronLib.windowManage.prepareAllWindow().then();
        }
      }, 60000);
    }
  }

  afterInit() {
    if (inWindow() && this.systemApi.isElectron()) {
      this.loadAllEventUnhandledFromLocal();
    }
    return this.name;
  }

  beforeLogout() {
    return this.name;
  }

  afterLogin() {
    if (inWindow() && this.systemApi.isElectron()) {
      this.loadAllEventUnhandledFromLocal();
      this.prepareWindow();
    }
    return this.name;
  }

  private loadAllEventUnhandledFromLocal() {
    const currentUser = this.storeApi.getCurrentUser();
    if (!currentUser) {
      return;
    }
    const entries = Object.entries(systemEventAllType);
    entries.forEach(value => {
      const eventType = value[1] as SystemEventTypeDef;
      if (eventType.enable && (eventType.eventType === 'electronMsg' || eventType.eventType === 'workerMsg')) {
        const eventName = value[0] as SystemEventTypeNames;
        this.loadEventFromLocal(eventName, eventType).then();
      }
    });
  }

  onBlur() {
    EventApiImpl.focused = false;
    return this.name;
  }

  onFocus() {
    this.systemApi.getActiveUserTrackParams().then(params => {
      this.dataTracker.track('pc_dailyActiveUser', {
        type: 'restartResult',
        ...(params || {}),
      });
    });
    EventApiImpl.focused = true;
    return this.name;
  }

  private buildWebIdMap(infos: ResponseWinInfo[]) {
    infos.forEach(it => {
      EventApiImpl.webIdMap.set(it.id, it.webId);
    });
  }
}

const eventApi: EventApi = new EventApiImpl();
// const init = function () {
//     eventApi = new EventApiImpl();
api.registerEventApi(eventApi);
// eventApi.init();
// return eventApi.name;
// }
/* const name = */
// init();
export default eventApi;
