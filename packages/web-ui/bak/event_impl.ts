// import { ErrMsgCodeMap } from '../../../api/errMap';
// import {
//   EventApi,
//   ObFunction,
//   ObHandler,
//   ObObject,
//   SystemEvent,
//   systemEventAllType,
//   SystemEventTypeBaseDef,
//   SystemEventTypeDef,
//   SystemEventTypeNames,
//   SystemEventTypeWebWorkerDef,
// } from '../../../api/data/event';
// import { commonMessageReturn } from '../../../api/_base/api';
// import { api } from '../../../api/api';
// // import {DataStoreApi} from "../../../api/data/store";
// import { apis, environment, inWindow } from '../../../config';
// import { FixSizeQueue, ListStore, NumberTypedMap, StringTypedMap } from '../../../api/commonModel';
// import { SystemApi } from '../../../api/system/system';
// import { WindowEventData } from '../../../gen/bundle';
// import { DataTrackerApi } from '../../../api/logical/dataTracker';
// import { DataStoreApi } from '../../../api/data/store';
// // import { SimpleWinInfo } from 'sirius-desktop/src/declare/WindowManage';
//
// // import { electronLib } from '../../../gen/bundle';
//
// class SysEventQueueHolder {
//   [eventName: string]: ListStore<ObObject>;
// }
//
// class EventProcessingInfo {
//   lastEventSeq: number;
//   confirmedSeq: number;
//   lastEventTime?: number;
//   eventActiveCount?: number;
//   eventMemoryQueue?: FixSizeQueue;
//   lastEvent?: SystemEvent;
//   waitingEvents?: NumberTypedMap<ObFunction>;
//
//   constructor(eventName: SystemEventTypeNames) {
//     const eventType = systemEventAllType[eventName];
//     this.confirmedSeq = 0;
//     this.lastEventSeq = 0;
//     if (!eventType) {
//       throw new Error('错误的系统事件类型');
//     }
//     if (eventType.persist && eventType.maxPersistNum && eventType.maxPersistNum > 1) {
//       this.eventMemoryQueue = new FixSizeQueue<SystemEvent>(eventType.maxPersistNum);
//     }
//     if (eventType.eventType == 'workerMsg' || eventType.eventType == 'electronMsg') {
//       this.waitingEvents = {};
//     }
//   }
// }
//
// class ObProcessingInfo {
//   lastEventSeq: number;
//   registerTime: number;
//   failHandleEvent?: SystemEvent[];
//   obId: number;
//
//   constructor(obId: number) {
//     this.lastEventSeq = -1;
//     this.registerTime = new Date().getTime();
//     this.obId = obId;
//   }
// }
//
// class EventApiImpl implements EventApi {
//
//   static readonly lastErrKey: string = 'lastErrTime';
//   static readonly KEY_STORE_EVENT: string = 'persistEvent-';
//
//   static eventHandleTimeout: number = 15000;
//
//   static obMap: SysEventQueueHolder = new SysEventQueueHolder();
//
//   static obNameMap: StringTypedMap<ObProcessingInfo> = {};
//   // static extElectronObMap: SysEventQueueHolder = new SysEventQueueHolder();
//
//   // static extObMap: SysEventQueueHolder = new SysEventQueueHolder();
//
//   static webWorkMap: ListStore<SharedWorker> = new ListStore<SharedWorker>();
//
//   // static eventLastOccurTime: StringTypedMap<number> = {};
//   //
//   // static eventActionCount: StringTypedMap<number> = {};
//   //
//   // static eventMemoryQueue: StringTypedMap<FixSizeQueue | SystemEvent> = {};
//
//   static status: StringTypedMap<EventProcessingInfo> = {};
//   systemApi: SystemApi;
//   storeApi: DataStoreApi;
//   dataTracker: DataTrackerApi;
//   // winId?:number;
//   // webContentId?:number;
//   name: string;
//
//   // private storeApi: DataStoreApi;
//   private static focused: boolean = true;
//
//   constructor() {
//     this.name = apis.defaultEventApi;
//     this.systemApi = api.getSystemApi();
//     this.storeApi = api.getDataStoreApi();
//     this.dataTracker = api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
//     // this.storeApi = api.getDataStoreApi();
//     // console.log('constructor called,', this.name);
//   }
//
//   sendSysEvent(ev: SystemEvent, notPersist?: boolean, noPostInfo?: boolean): Promise<commonMessageReturn> | undefined {
//     const eventType = this.checkEvent(ev);
//
//     ev.eventTime = ev.eventTime || new Date().getTime();
//     const status = EventApiImpl.status[ev.eventName];
//     // status.lastEventSeq = status.lastEventSeq || 0;
//     ev.eventSeq = ev.eventSeq || status.lastEventSeq + 1;
//     if (eventType.filter && !eventType.filter(ev)) return;
//
//     // if (eventType.eventType == 'innerMsg') {
//     const obMapElement = EventApiImpl.obMap[ev.eventName];
//     if ((!eventType.persist || eventType.persist == 'none') && !obMapElement) throw new Error('非持久化消息需要有消费者才可发送');
//     if (!notPersist) {
//       this.persistEventData(eventType, ev);
//     }
//     if (eventType.acceptCount && eventType.acceptCount > 0) {
//       if (status.lastEventSeq - status.confirmedSeq > eventType.acceptCount) {
//         return;
//       }
//     }
//     if ((eventType.eventType == 'innerMsg' && obMapElement && obMapElement.total > 0)
//       || (eventType.eventType == 'workerMsg' || eventType.eventType == 'electronMsg')) {
//       return this.handleEventConsuming(status, ev, obMapElement, eventType, noPostInfo);
//       // else if(eventType.eventType == 'workerMsg') {
//       //   return this.handleEventConsuming(status, ev, obMapElement, eventType, noPostInfo);
//       // }else if (eventType.eventType == 'electronMsg') {
//       //   return this.systemApi.getCurrentWinInfo().then(res => {
//       //     const winId = String(res.id);
//       //     ev.eventFrom = ev.eventFrom || winId;
//       //     if (ev.eventFrom != winId) {
//       //       return this.handleEventConsuming(status, ev, obMapElement, eventType, noPostInfo);
//       //     } else {
//       //       return Promise.resolve('0');
//       //     }
//       //   });
//       // }
//       // else {
//       //   throw new Error('not supported');
//       // }
//     }
//       // else if (eventType.eventType == 'workerMsg' || eventType.eventType == 'electronMsg') {
//       //   return this.handleEventConsuming(status, ev, obMapElement, eventType, noPostInfo);
//     // }
//     else {
//       return;
//     }
//     // }
//   }
//
//   private filterObEvent(ob: ObObject, ev: SystemEvent<any>) {
//     if (ob.nameFilter && ev.eventStrData) {
//       if (typeof ob.nameFilter == 'string') {
//         return ob.nameFilter == ev.eventStrData;
//       } else if (ob.nameFilter instanceof RegExp) {
//         return ob.nameFilter.test(ev.eventStrData);
//       }
//     }
//     return false;
//   }
//
//   private handleEventConsuming(
//     status: EventProcessingInfo,
//     ev: SystemEvent<any>,
//     obMapElement: ListStore<ObObject>,
//     eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef,
//     noPostInfo: undefined | boolean,
//   ) {
//     //同一个seq只处理一次，避免重放
//     if (status.lastEventSeq && ev.eventSeq && ev.eventSeq > 0 && status.lastEventSeq == ev.eventSeq) {
//       return Promise.resolve('');
//     }
//     status.lastEventTime = ev.eventTime || 0;
//     status.lastEventSeq = ev.eventSeq || 0;
//     const type = eventType.eventType;
//     // if (type == 'innerMsg' || !!noPostInfo) { }
//     const iterateObPromise = (type == 'innerMsg' || !!noPostInfo) ? obMapElement.iterate(
//       (ob: ObObject) => {
//         // const element = EventApiImpl.status[ev.eventName];
//         const element = status.eventActiveCount;
//         status.eventActiveCount = (element ? (element + 1 > 90000000 ? 90000000 : element + 1) : 1);
//         if (!this.filterObEvent(ob, ev))
//           ob.func(ev);
//       },
//     ) : Promise.resolve('');
//     return iterateObPromise.then((res) => {
//       console.log('done system event dispatch with flag:' + noPostInfo, ev);
//
//       if ((type == 'workerMsg' || type == 'electronMsg') && !noPostInfo) {
//         return this.postMessage(ev);
//       } else {
//         return res as commonMessageReturn;
//       }
//       // else {
//       //     throw new Error("not supported yet " + ErrMsgCodeMap['SEND.MSG.EXCEPTION']);
//       // }
//     }).catch(reason => {
//       console.log('done  event handle got error:', ev);
//       console.log(reason);
//       return ErrMsgCodeMap['SEND.MSG.EXCEPTION'] as commonMessageReturn;
//     });
//   }
//
//   private persistEventData(eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, ev: SystemEvent<any>) {
//     if (eventType.persist && eventType.persist != 'none') {
//       this.persistEventToMemory(eventType, ev);
//       if (eventType.persist == 'disk') {
//         //TODO : persist event content to dist
//       }
//     }
//   }
//
//   private checkEvent(ev: SystemEvent<any>) {
//     if (!ev || !ev.eventName) throw new Error('发送事件参数错误');
//
//     const eventType = systemEventAllType[ev.eventName];
//     if (!eventType || !eventType.enable) throw new Error('非法事件类型');
//     if (eventType.eventType == 'sysFeedback') throw new Error('此类型事件无法通过外部接口发送');
//     return eventType;
//   }
//
//   private persistEventToMemory(eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, ev: SystemEvent<any>) {
//     const size = eventType.maxPersistNum || 1;
//     if (size == 1) {
//       EventApiImpl.status[ev.eventName].lastEvent = ev;
//       console.log('persist event to memory store:', ev);
//     } else {
//       let queueElement = EventApiImpl.status[ev.eventName].eventMemoryQueue as FixSizeQueue<SystemEvent>;
//       if (!queueElement) {
//         queueElement = new FixSizeQueue<SystemEvent>(size);
//       }
//       const num = queueElement.push(ev);
//       console.log('persist event to memory queue:', num, ev);
//     }
//
//   }
//
//   confirmEvent(ev: SystemEvent) {
//     const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
//     if (eventType.eventType == 'workerMsg' || eventType.eventType == 'electronMsg') {
//       return;
//     }
//     const status = EventApiImpl.status[ev.eventName];
//     const element = status.eventActiveCount;
//     status.eventActiveCount = (element != undefined ? (element - 1 > 0 ? element - 1 : 0) : 0);
//     status.confirmedSeq = ev.eventSeq || 0;
//     if (eventType.acceptCount && eventType.acceptCount > 0) {
//       if (status.lastEventSeq - status.confirmedSeq <= eventType.acceptCount) {
//         this.dumpMessageFromQueue(ev.eventName, 1);
//       }
//     }
//   }
//
//   registerSysEventObserver(eventName: SystemEventTypeNames, ob: ObHandler): number {
//     if (typeof ob != 'object' && typeof ob != 'function') {
//       throw new Error('添加监视者不合法');
//     }
//     if (inWindow() && environment != 'prod')
//       console.log('got event register:', eventName, ob);
//     const eventType = systemEventAllType[eventName];
//     if (!eventType) throw new Error('非法事件类型');
//     const re = this.addObObjToMap(EventApiImpl.obMap, eventName, ob);
//     // ob = re.ob;
//     // let obMap;
//     /*if (eventType.eventType === 'innerMsg') {
//       // obMap = EventApiImpl.obMap;
//     } else*/
//     //处理特殊类型事件，将electron和worker类型事件添加到额外队列备用
//     // if (eventType.eventType === 'workerMsg') {
//     //   obMap = EventApiImpl.extObMap;
//     // } else if (eventType.eventType === 'electronMsg') {
//     //   obMap = EventApiImpl.extElectronObMap;
//     // } else if (eventType.eventType !== 'innerMsg') {
//     //   throw new Error('not supported yet');
//     // }
//     // if (obMap) {
//     //   const __ret = this.addObObjToMap(obMap, eventName, ob);
//     //   if (eventType.eventType === 'workerMsg') {
//     //     ob.postObId = __ret.ret;
//     //   } else if (eventType.eventType === 'electronMsg') {
//     //     ob.electronObId = __ret.ret;
//     //   }
//     // }
//     //处理持久化事件，添加监听器时需要判定是否已经有持久化的消息储存，如有则应触发消息发送事件
//     if (eventType.persist) {
//       this.dumpMessageFromQueue(eventName);
//     }
//     return re.ret;
//
//   }
//
//   private addObObjToMap(obMap: SysEventQueueHolder, eventName: SystemEventTypeNames, ob: ObObject | ((ev: SystemEvent) => void)) {
//     if (!obMap[eventName]) {
//       obMap[eventName] = new ListStore();
//     }
//     if (typeof ob == 'function') {
//       ob = {
//         name: 'no-name-' + (Math.random() * 10000 + 9999),
//         func: ob,
//       };
//     }
//     let ret = undefined;
//     if (ob.name in EventApiImpl.obNameMap && EventApiImpl.obNameMap[ob.name]) {
//       ret = EventApiImpl.obNameMap[ob.name].obId;
//     } else {
//       ret = obMap[eventName].addOb(ob as ObObject, ob.prepend);
//       if (ob && !ob.name.startsWith('no-name-')) {
//         EventApiImpl.obNameMap[ob.name] = new ObProcessingInfo(ret);
//       }
//     }
//     return { ob, ret };
//   }
//
//   unregisterSysEventObserver(eventName: SystemEventTypeNames, id: number): void {
//     if (!EventApiImpl.obMap[eventName]) return;
//     const eventType = systemEventAllType[eventName];
//     if (!eventType) return;
//     const ob = EventApiImpl.obMap[eventName].removeOb(id);
//     ob && !ob.name.startsWith('no-name-') && delete EventApiImpl.obNameMap[ob.name];
//     console.log('remove observer :', ob);
//     // let obMap;
//     /*if (eventType.eventType === 'innerMsg') {
//       obMap = EventApiImpl.obMap;
//     } else */
//     // if (eventType.eventType === 'workerMsg') {
//     //   const obMap = EventApiImpl.extObMap;
//     //   obMap && ob && ob.postObId != undefined && obMap[eventName].removeOb(ob.postObId);
//     // } else if (eventType.eventType === 'electronMsg') {
//     //   const obMap = EventApiImpl.extElectronObMap;
//     //   obMap && ob && ob.electronObId != undefined && obMap[eventName].removeOb(ob.electronObId);
//     // } else {
//     //   throw new Error('not supported yet');
//     // }
//     // if (eventType.eventType === "innerMsg") {
//     //     SystemApiImpl.obMap[eventName].removeOb(id);
//     // } else {
//     //     SystemApiImpl.extObMap[eventName].removeOb(id);
//     // }
//   }
//
//   postMessage(ev: SystemEvent, noConfirm?: boolean): Promise<string> {
//     const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
//     const status = EventApiImpl.status[ev.eventName];
//     let finishSend = false;
//     //if (!ev || !ev.eventName || !EventApiImpl.obMap[ev.eventName]) return 'SEND.MSG.EXCEPTION';
//     // const eventType = systemEventAllType[ev.eventName];
//     if (eventType.eventType == 'workerMsg') {
//
//       if (!eventType.handlerWorkerId) return Promise.reject('SEND.MSG.EXCEPTION');
//       const ob: SharedWorker | undefined = EventApiImpl.webWorkMap.getOb(eventType.handlerWorkerId);
//       if (ob) {
//         ob.port.postMessage(ev);
//         console.log('***** post worker message with flag ' + noConfirm + ':', ev);
//         finishSend = true;
//       } else {
//         return Promise.reject('SEND.MSG.EXCEPTION');
//       }
//     } else if (eventType.eventType == 'electronMsg') {
//       if (this.systemApi.isElectron() && window.electronLib) {
//         const id = (ev.eventTarget && /\d+/.test(ev.eventTarget)) ? Number(ev.eventTarget) : undefined;
//         window.electronLib.windowManage.exchangeData({
//           id,
//           data: ev,
//         }).then();
//         console.log('***** post electron message with flag ' + noConfirm + ':', ev);
//         finishSend = true;
//       } else {
//         return Promise.reject('not support by current environment');
//       }
//     } else {
//       return Promise.reject('not supported');
//     }
//     if (finishSend && !noConfirm) {
//       return new Promise<string>((r, j) => {
//         const tid = setTimeout(() => {
//           console.warn('***** failed confirm message for timeout :', ev);
//           j('事件返回确认超时，发送失败');
//           this.saveEventToLocal(ev);
//         }, EventApiImpl.eventHandleTimeout);
//         if (!status || !status.waitingEvents) {
//           j('内部错误，未生成必要的状态存储');
//         }
//         if (ev.eventSeq) {
//           status.waitingEvents![ev.eventSeq] = (re: SystemEvent) => {
//             if (re.eventMsg?.feedbackSeq == ev.eventSeq) {
//               clearTimeout(tid);
//               delete status.waitingEvents![ev.eventSeq || 0];
//               console.log('***** finish confirm message:', ev, re);
//               r('');
//             } else {
//               console.warn('***** failed confirm message for unknown :', ev, re);
//               j('未知错误，得到意外的返回事件');
//             }
//           };
//         } else {
//           j('未知错误，事件无序列号');
//         }
//       });
//     }
//     return Promise.resolve('');
//
//   }
//
//   private async saveEventToLocal(ev: SystemEvent<any>) {
//     const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
//     const size = eventType.maxPersistNum || 1;
//     const eventKey = this.getStoredEventKey(ev);
//     if (size == 1) {
//       await this.storeApi.put(eventKey, JSON.stringify(ev));
//     } else {
//       let data: SystemEvent[] = [];
//       const storeData = await this.storeApi.get(eventKey);
//       if (storeData && storeData.data && storeData.suc) {
//         data = JSON.parse(storeData.data);
//       }
//       data.push(ev);
//       await this.storeApi.put(eventKey, JSON.stringify(data));
//     }
//   }
//
//   setupWebWorker(param: SystemEventTypeDef, name?: string): number {
//     if (typeof window !== 'undefined' && typeof window.SharedWorker !== 'undefined') {
//       if (param && param.handlerWorkScript) {
//         const worker: SharedWorker = new SharedWorker(param.handlerWorkScript, {
//           name: name || this.systemApi.md5(param.handlerWorkScript, true),
//           credentials: 'same-origin',
//         });
//         param.handlerWorkerId = EventApiImpl.webWorkMap.addOb(worker);
//         worker.port.addEventListener('message', this.workerListener);
//         worker.port.addEventListener('messageerror', this.workerErrorListener);
//         //TODO: handle error
//       }
//     }
//     return -1;
//   }
//
//   terminateWebWorker(id: number): void {
//     EventApiImpl.webWorkMap[id] && EventApiImpl.webWorkMap[id]?.port.close();
//   }
//
//   sendSimpleSysEvent(eventName: SystemEventTypeNames): Promise<commonMessageReturn> | undefined {
//     return this.sendSysEvent({
//       eventName,
//       eventStrData: eventName,
//       // eventSeq: 0,
//     });
//   }
//
//   dumpMessageFromQueue(eventName: SystemEventTypeNames, num?: number) {
//     const eventType = systemEventAllType[eventName];
//     if (eventType.persist == 'memory') {
//       console.log('handle persist event for ' + eventName, eventType);
//       const size = eventType.maxPersistNum || 1;
//       const status = EventApiImpl.status[eventName];
//       if (!status) {
//         throw new Error('not got status, why');
//       }
//       if (size == 1 && status.lastEvent) {
//         this.sendSysEvent(status.lastEvent as SystemEvent, true);
//       }
//       if (size > 1) {
//         const element = status.eventMemoryQueue as FixSizeQueue<SystemEvent>;
//         num = num || element?.size() || 0;
//         if (num < 1) return;
//         if (element) {
//           let el;
//           let index = 0;
//           while ((el = element.pop()) && (index++) < num) {
//             this.sendSysEvent(el, true);
//           }
//         }
//       }
//     }
//   }
//
//   private sendFeedback(data: SystemEvent<any>) {
//     const eventType = systemEventAllType[data.eventName];
//     if (eventType.eventType == 'electronMsg' || eventType.eventType == 'workerMsg') {
//       console.log('send feed back:', data);
//       this.postMessage({
//         eventMsg: {
//           feedbackSeq: data.eventSeq,
//         },
//         eventName: data.eventName,
//         eventSeq: data.eventSeq,
//         eventTarget: data.eventFrom,
//       } as SystemEvent, true).then();
//     }
//   }
//
//   private resendSysEvent(data: SystemEvent<any>, noFeedback?: boolean) {
//     const sendPromise = this.sendSysEvent(data, false, true);
//     if (!noFeedback) {
//       if (sendPromise) {
//         sendPromise.then(() => {
//           this.sendFeedback(data);
//         });
//       } else {
//         this.sendFeedback(data);
//       }
//     }
//   }
//
//   private workerListener(ev: MessageEvent) {
//     const data = ev.data as SystemEvent;
//     if (data && data.eventName && EventApiImpl.obMap[data.eventName]) {
//       this.handleReceivedPostMsg(data);
//       // const sendPromise = this.sendSysEvent(data, false, true);
//       // if(sendPromise) {
//       //   sendPromise.then(() => {
//       //
//       //   });
//       // }else{
//       //
//       // }
//       // EventApiImpl.obMap[data.eventName].iterate(ob => ob.func(data)).then(res => {
//       //   console.log(res + ' finished');
//       // });
//     }
//   }
//
//   private workerErrorListener(ev: MessageEvent) {
//     // this.storeApi.put(EventApiImpl.lastErrKey, new Date()).then();
//     console.log('error', ev);
//   }
//
//   watchElectronMsg() {
//     if (inWindow() && this.systemApi.isElectron() && window.electronLib) {
//
//       window.electronLib.windowManage.addExchangeDataListener((res: WindowEventData) => {
//         console.log('*******receive data from ipc:' + res.webId, res);
//         const info = res.data;
//         if (info) {
//           const data = info.data as SystemEvent;
//           data.eventFrom = String(info.webId);
//           this.handleReceivedPostMsg(data);
//         }
//       });
//
//     }
//   }
//
//   private handleReceivedPostMsg(data: SystemEvent<any>) {
//     if (!data || !data.eventName) {
//       return;
//     }
//     if (data.eventMsg && data.eventMsg.feedbackSeq) {
//       const status = EventApiImpl.status[data.eventName];
//       console.log('*******handle feed back event:', data);
//       if (!status || !status.waitingEvents) {
//         throw new Error('内部错误，未生成必要的状态存储');
//       }
//       if (status.waitingEvents[data.eventMsg.feedbackSeq]) {
//         status.waitingEvents[data.eventMsg.feedbackSeq](data);
//       }
//     } else {
//       const eventType = systemEventAllType[data.eventName];
//       if (eventType.eventType == 'electronMsg' || eventType.eventType == 'workerMsg') {
//         this.resendSysEvent(data);
//       }
//     }
//   }
//
//   private async loadEventFromLocal(eventName: SystemEventTypeNames, eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef, noSend?: boolean) {
//     const size = eventType.maxPersistNum || 1;
//     const winInfo = await this.systemApi.getCurrentWinInfo();
//     if (!winInfo) return;
//     const eventKey = this.getStoredEventKey({ eventName, eventTarget: String(winInfo.webId) });
//     // if (size == 1) {
//     const storeData = await this.storeApi.get(eventKey);
//     if (storeData && storeData.data && storeData.suc) {
//       if (size == 1) {
//         const ev = JSON.parse(storeData.data) as SystemEvent;
//         this.handleLocalStoreEventItem(ev, noSend, eventName, eventKey).then();
//       } else {
//         const evs = JSON.parse(storeData.data) as SystemEvent[];
//         if (evs && evs.length > 0) {
//           evs.forEach(it => {
//             this.handleLocalStoreEventItem(it, noSend, eventName, eventKey).then();
//           });
//         }
//       }
//     }
//     // } else {
//     //
//     // }
//   }
//
//   private getStoredEventKey(ev: SystemEvent) {
//     const eventType: SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef = this.checkEvent(ev);
//     const eventName: SystemEventTypeNames = ev.eventName;
//     let id: string | undefined = undefined;
//     if (eventType.eventType == 'electronMsg')
//       id = String(ev.eventTarget);
//     else if (eventType.eventType == 'workerMsg')
//       id = eventType.handlerWorkScript;
//     return EventApiImpl.KEY_STORE_EVENT + (id ? ('-' + id) : '') + '-' + eventName;
//   }
//
//   private async handleLocalStoreEventItem(ev: SystemEvent, noSend: boolean | undefined, eventName: SystemEventTypeNames, eventKey: string) {
//     if (!noSend) {
//       this.resendSysEvent(ev, true);
//     } else {
//       const status = EventApiImpl.status[eventName];
//       status.lastEvent = ev;
//     }
//     // const eventKey = this.getStoredEventKey(ev);
//     await this.storeApi.del(eventKey);
//   }
//
//   init() {
//     console.log('init called', this);
//     systemEventAllType.error.filter = ((ev: SystemEvent) => {
//       const now = new Date().getTime();
//       const lastTime = EventApiImpl.status[ev.eventName].lastEventTime || 0;
//       const eventActionCount = (now - lastTime < 120000) ? EventApiImpl.status[ev.eventName].eventActiveCount || 0 : 0;
//       EventApiImpl.status[ev.eventName].eventActiveCount = eventActionCount;
//       return (!ev.auto || EventApiImpl.focused) && eventActionCount < 1 && ((ev.eventTime || now) - lastTime) > 3500;
//     });
//
//     console.log('handle worker script init');
//     const entries = Object.entries(systemEventAllType);
//     entries.forEach(value => {
//       console.log('enabled event:', value);
//       const eventType = value[1] as SystemEventTypeDef;
//       if (eventType.enable) {
//         const eventName = value[0] as SystemEventTypeNames;
//         EventApiImpl.status[eventName] = new EventProcessingInfo(eventName);
//         if (eventType.eventType == 'electronMsg' || eventType.eventType == 'workerMsg') {
//           eventType.persist = eventType.persist || 'memory';
//         }
//         if (typeof window !== 'undefined' &&
//           (typeof window.SharedWorker !== 'undefined' || typeof window.Worker !== 'undefined')) {
//           if (eventType.eventType == 'workerMsg') {
//             this.setupWebWorker(eventType, eventName);
//           }
//         }
//       }
//       //TODO : load event data from disk if any
//     });
//     return this.name;
//   }
//
//   afterInit() {
//     this.watchElectronMsg();
//     if (inWindow() && this.systemApi.isElectron())
//       this.loadAllEventUnhandledFromLocal();
//     return this.name;
//   }
//
//   afterLogin() {
//     if (inWindow() && this.systemApi.isElectron())
//       this.loadAllEventUnhandledFromLocal();
//     return this.name;
//   }
//
//   private loadAllEventUnhandledFromLocal() {
//     const currentUser = this.storeApi.getCurrentUser();
//     if (!currentUser) return;
//     const entries = Object.entries(systemEventAllType);
//     entries.forEach(value => {
//       const eventType = value[1] as SystemEventTypeDef;
//       if (eventType.enable && (eventType.eventType == 'electronMsg' || eventType.eventType == 'workerMsg')) {
//         const eventName = value[0] as SystemEventTypeNames;
//         this.loadEventFromLocal(eventName, eventType).then();
//       }
//     });
//   }
//
//   onBlur() {
//     EventApiImpl.focused = false;
//     return this.name;
//   }
//
//   onFocus() {
//     this.dataTracker.track('pc_dailyActiveUser', {
//       type: 'restartResult',
//     });
//     EventApiImpl.focused = true;
//     return this.name;
//   }
//
// }
//
// let eventApi: EventApi = new EventApiImpl();
// // const init = function () {
// //     eventApi = new EventApiImpl();
// api.registerEventApi(eventApi);
// // eventApi.init();
// // return eventApi.name;
// // }
// /*const name =*/
// // init();
// export default eventApi;



//-------


/**
 class DataTransApiWrapper extends AbsWrapper implements DataTransApi {
  impl: DataTransApi | undefined;

  // name: string ;

  constructor(impl?: DataTransApi) {
    super("bridgeHttpApi");
    this.impl = impl;
    // this.name="bridgeHttpApi"
  }

  delete(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.delete(url, data, config);
  }

  get(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.get(url, data, config);
  }

  head(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.head(url, data, config);
  }

  options(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.options(url, config);
  }

  patch(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.patch(url, data, config);
  }

  post(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.post(url, data, config);
  }

  put(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.put(url, data, config);
  }

  registerImpl(impl: DataTransApi): void {
    this.impl = impl;
  }

  buildUrl(url: string, req: any): string {
    if (!this.impl)
      this.getImpl();
    return this.impl!.buildUrl(url, req);
  }

  private getImpl() {

    this.impl = api.requireDataTransApi(apis.defaultApiImpl);
  }

  addConfig(conf: RequestHandleConfig): void {
    if (!this.impl)
      this.getImpl();
    this.impl?.addConfig(conf);
  }

}
 **/

/**
 class DBApiWrapper extends AbsWrapper implements NewDBApi {
  impl: NewDBApi | undefined;

  constructor(impl?: NewDBApi) {
    super("bridgeNewDBApi");
    this.impl = impl;
  }

  private getImpl() {
    this.impl = api.requireNewDBApi(apis.newDbApiImpl);
  }

  close(name: DBList): void {
    if (!this.impl)
      this.getImpl();
    return this.impl!.close(name);
  }

  initDb(name: DBList, user?: User | undefined | null): void {
    if (!this.impl)
      this.getImpl();
    return this.impl!.initDb(name, user);
  }

  delete(config: DeleteConfig): Promise<resultObject[]> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.delete(config);
  }

  execute(config: executeConfig): Promise<resultObject[]> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.execute(config);
  }

  getDB(name: DBList): DBCollection<lf.schema.Builder, lf.Database> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.getDB(name);
  }

  insertOrReplace(config: insertConfig): Promise<object[]> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.insertOrReplace(config);
  }

  select(config: SelectConfig): Promise<resultObject[]> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.select(config);
  }

  connect(name: DBList): Promise<identity<lf.Database>> {
    if (!this.impl)
      this.getImpl();
    return this.impl!.connect(name);
  }
}

 class SystemApiWrapper extends AbsWrapper implements SystemApi {
  impl: SystemApi | undefined;

  // name: string;

  constructor(impl: SystemApi | undefined) {
    super("bridgeSystemApi");
    this.impl = impl;

  }

  isNetworkAvailable(): boolean {
    if (!this.impl) this.getImpl();
    return this.impl!.isNetworkAvailable();
  }

  getNetworkFailIndex(): number {
    if (!this.impl) this.getImpl();
    return this.impl!.getNetworkFailIndex();
  }

  afterInit?: (() => string) | undefined;

  getCurrentNode(): string {
    if (!this.impl) this.getImpl();
    return this.impl!.getCurrentNode();
  }

  // timeoutEvent(ms: number, id: string): Promise<any> {
  //     return this.impl.timeoutEvent(ms, id);
  // }
  //
  // intervalEvent(ms: number, id: string): Promise<any> {
  //     return this.impl.intervalEvent(ms, id);
  // }
  //
  // cancelEvent(id: string): boolean {
  //     return this.impl.cancelEvent(id);
  // }
  private getImpl() {
    this.impl = api.requireSystemApi(apis.defaultSystemApiImpl);
  }

  getCurrentUser(): User | undefined | null {
    if (!this.impl) this.getImpl();
    return this.impl!.getCurrentUser();
  }

  openNewWindow(url: string): commonMessageReturn {
    if (!this.impl) this.getImpl();
    return this.impl!.openNewWindow(url);
  }

  cancelEvent(period: IntervalEventPeriod, id: number | string): boolean {
    if (!this.impl) this.getImpl();
    return this.impl!.cancelEvent(period, id);
  }

  decryptMsg(content: string): Promise<string> {
    if (!this.impl) this.getImpl();
    return this.impl!.decryptMsg(content);
  }

  encryptMsg(content: string): Promise<string> {
    if (!this.impl) this.getImpl();
    return this.impl!.encryptMsg(content);
  }

  md5(content: string, short?: boolean): string {
    if (!this.impl) this.getImpl();
    return this.impl!.md5(content, short);
  }

  intervalEvent(ev: IntervalEventParams): number | undefined {
    if (!this.impl) this.getImpl();
    return this.impl!.intervalEvent(ev);
  }

  generateKey(len: number): string {
    if (!this.impl) this.getImpl();
    return this.impl!.generateKey(len);
  }

  handleAccountAndDomain(account: string): Properties {
    if (!this.impl) this.getImpl();
    return this.impl!.handleAccountAndDomain(account);
  }

  isElectron(): boolean {
    if (!this.impl) this.getImpl();
    return this.impl!.isElectron();
  }

  isInWebWorker(): boolean {
    if (!this.impl) this.getImpl();
    return this.impl!.isInWebWorker();
  }

  getUrl(url: URLKey): string {
    if (!this.impl) this.getImpl();
    return this.impl!.getUrl(url);
  }

  get currentShowedNotification(): number {
    if (!this.impl) this.getImpl();
    return this.impl!.currentShowedNotification;
  }

  get notificationAvailableLabel(): number {
    if (!this.impl) this.getImpl();
    return this.impl!.notificationAvailableLabel;
  }

  isSysNotificationAvailable(): NotificationPerm {
    if (!this.impl) this.getImpl();
    return this.impl!.isSysNotificationAvailable();
  }

  requestSysNotificationPerm(): Promise<boolean> {
    if (!this.impl) this.getImpl();
    return Promise.resolve(false);
  }

  showSysNotification(info: PopUpMessageInfo): Promise<boolean> {
    if (!this.impl) this.getImpl();
    return this.impl!.showSysNotification(info);
  }

  updateAppNotification(content: NotificationContent): void {
    if (!this.impl) this.getImpl();
    return this.impl!.updateAppNotification(content);
  }

  setUserProp(key: string, value: string): void {
    if (!this.impl) this.getImpl();
    return this.impl!.setUserProp(key, value);
  }

  watchLogin(ev: SystemEvent): void {
    if (!this.impl) this.getImpl();
    return this.impl!.watchLogin(ev);
  }

  watchPreLogin(ev: SystemEvent): void {
    if (!this.impl) this.getImpl();
    return this.impl!.watchPreLogin(ev);
  }

  // setupWebWorker(script: string): Promise<commonMessageReturn> {
  //     if (!this.impl) this.getImpl();
  //     return this.impl.setupWebWorker(script);
  // }

}

 class EventApiWrapper extends AbsWrapper implements EventApi {

  impl: EventApi | undefined;

  // name: string;

  constructor(impl: EventApi | undefined) {
    super("bridgeEventApi");
    this.impl = impl;

  }

  sendSimpleSysEvent(_: SystemEventTypeNames): Promise<commonMessageReturn> | undefined {
    throw new Error("Method not implemented.");
  }

  afterInit?: (() => string) | undefined;

  private getImpl() {
    this.impl = api.requireEventApi(apis.defaultEventApi);
  }

  registerSysEventObserver(eventName: SystemEventTypeNames, ob: (ev: SystemEvent) => void): number {
    if (!this.impl) this.getImpl();
    return this.impl!.registerSysEventObserver(eventName, ob);
  }

  unregisterSysEventObserver(eventName: SystemEventTypeNames, id: number): void {
    if (!this.impl) this.getImpl();
    return this.impl!.unregisterSysEventObserver(eventName, id);
  }

  sendSysEvent(ev: SystemEvent): Promise<commonMessageReturn> | undefined {
    if (!this.impl) this.getImpl();
    return this.impl!.sendSysEvent(ev);
  }

  postMessage(ev: SystemEvent): string {
    if (!this.impl) this.getImpl();
    return this.impl!.postMessage(ev);
  }

  setupWebWorker(param: SystemEventTypeDef, name: string): number {
    if (!this.impl) this.getImpl();
    return this.impl!.setupWebWorker(param, name);
  }

  terminateWebWorker(id: number): void {
    if (!this.impl) this.getImpl();
    this.impl!.terminateWebWorker(id);
  }
}

 class DataStoreApiWrapper extends AbsWrapper implements DataStoreApi {
  impl: DataStoreApi | undefined;

  // name: string;

  constructor(impl: DataStoreApi | undefined) {
    super("bridgeDataStoreApi");
    this.impl = impl;
  }

  private getImpl() {
    this.impl = api.requireDataStoreApi(apis.defaultDataStoreApiImpl);
  }

  clear(config: Properties): Promise<commonMessageReturn> {
    if (!this.impl) this.getImpl();
    return this.impl!.clear(config);
  }

  get(key: string, config?: Properties): Promise<StoreData> {
    if (!this.impl) this.getImpl();
    return this.impl!.get(key, config);
  }

  put(key: string, data: any, config?: Properties): Promise<commonMessageReturn> {
    if (!this.impl) this.getImpl();
    return this.impl!.put(key, data, config);
  }

  del(key: string, config?: Properties): Promise<commonMessageReturn> {
    if (!this.impl) this.getImpl();
    return this.impl!.del(key, config);
  }

  getSync(key: string, config?: Properties): StoreData {
    if (!this.impl) this.getImpl();
    return this.impl!.getSync(key, config);
  }

  getSeqHelper(name: string, initSeq?: number): StoredSequenceHelper {
    if (!this.impl) this.getImpl();
    return this.impl!.getSeqHelper(name, initSeq);
  }

  setLastAccount(lst: User | undefined): void {
    if (!this.impl) this.getImpl();
    return this.impl!.setLastAccount(lst);
  }

  getCurrentNode(): string {
    if (!this.impl) this.getImpl();
    return this.impl!.getCurrentNode();
  }

  getCurrentUser(): User | undefined | null {
    if (!this.impl) this.getImpl();
    return this.impl!.getCurrentUser();
  }

  setUserProp(key: string, value: string): void {
    if (!this.impl) this.getImpl();
    return this.impl!.setUserProp(key, value);
  }

  setCurrentNode(node: string): void {
    if (!this.impl) this.getImpl();
    return this.impl!.setCurrentNode(node);
  }

}

 class FileApiWrapper extends AbsWrapper implements FileApi {

  impl: FileApi | undefined;

  constructor(impl?: FileApi) {
    super("bridgeFileApi");
    if (impl)
      this.impl = impl;
  }

  download(req: LoaderRequest, conf?: LoaderActionConf): Promise<LoaderResult> {
    console.log(req, conf);
    return Promise.reject(11);
    throw new Error("not implemented");
  }

  openFile(file: FileAttachModel): Promise<boolean> {
    console.log(file);
    return Promise.reject(11);
    throw new Error("not implemented");
  }

  saveAs(file: FileAttachModel): Promise<boolean> {
    console.log(file);
    return Promise.reject(11);
    throw new Error("not implemented");
  }

  testLocalFile(file: FileAttachModel): Promise<boolean> {
    console.log(file);
    return Promise.reject(11);
    throw new Error("not implemented");
  }

  upload(req: LoaderRequest, conf?: LoaderActionConf): Promise<LoaderResult> {
    console.log(req, conf);
    return Promise.reject(11);
    throw new Error("not implemented");
  }

  judgeFileType(mineType: string, appendix: string): FileType {
    console.log(mineType, appendix);
    return "doc";
    throw new Error("not implemented");
  }

}

 // const delegateToOwn= function  (receiver: any, methods:string[], propertyName:string) {
//     methods.forEach(function (methodName) {
//         receiver[methodName] = function () {
//             var toProvider = receiver[propertyName];
//             return toProvider[methodName].apply(receiver, arguments);
//         };
//     });
//
//     return receiver;
// };
 // const commonWrapper : DataStoreApi={
//
// };
 **/