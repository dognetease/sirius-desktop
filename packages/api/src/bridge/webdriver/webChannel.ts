// 实现一个类似ipcRender&ipChannel的库类方法
import lodashGet from 'lodash/get';
import { SequenceHelper } from '@/api/commonModel';
import { inWindow, isElectron } from '@/config';
import {
  ChannelParams,
  ChannelEventData,
  WebChannelApiParams,
  ExcuteParams,
  ChannelExcuteParams,
  ChannelReplyParams,
  ChannelResponseParams,
} from '../interface/webChannel';

type BroadcaseEventName = 'bridgeConnected' | string;

interface ChannelBroadcastOptions {
  excludeSelf?: boolean;
  selfChannelId?: string;
}

export interface RenderChannelApi {
  invoke(params: ExcuteParams): Promise<unknown>;
  // 添加一个响应监听
  addResponseListener(calllback: (args: unknown) => unknown): void;
  // 添加一个事件监听
  addEventListener(eventname: BroadcaseEventName, calllback: (args: unknown) => unknown): void;
  getChannelId(): string;
}

interface HandleCallbackApi {
  (e: MessageEvent<ChannelParams>, args: any): Promise<unknown>;
}

export interface MainChannelApi {
  broadcast(params: ChannelEventData, options?: ChannelBroadcastOptions): void;

  send2Render(portId: string, params: unknown): void;
  // 注册一个针对
  registerHandleCallback(eventName: string, callback: HandleCallbackApi): void;
}

const isDev = () =>
  inWindow() && (window?.location.href.includes('su-desktop-web.cowork.netease.com') || window?.location.href.includes('su-desktop-web.office.163.com'));

// sendChannel 类似于ipcChannel
export class RenderChannel implements RenderChannelApi {
  private myPort: MessagePort | undefined;

  // private otherendPort: MessagePort;

  private sequenceHelper = new SequenceHelper();

  private channelId: string;

  private promiseMap: Map<string, Record<'resolve' | 'reject', (args: unknown) => unknown>> = new Map();

  constructor(params: WebChannelApiParams) {
    console.log('[web-channel]createChannel:', params);
    this.channelId = params.channelId;
    if (inWindow() && !isElectron()) {
      this.bindMessageEvent();
    }
  }

  getChannelId() {
    return this.channelId;
  }

  private bindMessageEvent() {
    const { port1: sendPort, port2: receivePort } = new MessageChannel();

    this.myPort = sendPort;
    // this.otherendPort = receivePort;
    window.top!.postMessage(
      {
        type: 'createdPort',
        channelId: this.channelId,
      },
      '*',
      [receivePort]
    );
    this.myPort.addEventListener('message', (args: MessageEvent<ChannelParams>) => {
      const { data } = args;
      switch (data.channel) {
        // 如果是response 响应resolve/reject
        case 'reply': {
          const { ackno, code, msg, data: responseData } = data;
          if (this.promiseMap.has(ackno)) {
            const { resolve, reject } = this.promiseMap.get(ackno) as Record<'resolve' | 'reject', (args: unknown) => void>;
            code === 0 ? resolve(responseData) : reject(msg);
          }
          break;
        }
        case 'event': {
          if (this.eventMap.has(data.data.eventname)) {
            [...this.eventMap.get(data.data.eventname)!.values()].forEach(callback => {
              callback(data.data);
            });
          }
          break;
        }
        default: {
          break;
        }
      }
    });
    this.myPort.start();
  }

  addResponseListener(callback: (res: unknown) => unknown) {
    this.myPort?.addEventListener('message', (args: MessageEvent<ChannelParams>) => {
      const { data } = args;
      if (data.channel !== 'response') {
        return;
      }
      callback(data.data);
    });
  }

  private eventMap: Map<string, Map<string, (res: unknown) => unknown>> = new Map();

  /**
   * @name: 添加监听器(由mainChannel trigger)
   * @todo: 这个事件管理器可能需要更严格的姿势管理 不过目前用的不多可以先着这样
   * @param e:事件名
   * @param callback
   * @returns:void
   */
  addEventListener(e: BroadcaseEventName, callback: (res: unknown) => unknown) {
    const eventId = [this.getChannelId(), e, this.sequenceHelper.next()].join('-');

    if (!this.eventMap.has(e)) {
      this.eventMap.set(e, new Map());
    }

    this.eventMap.get(e)!.set(eventId, callback);
    return eventId;
  }

  removeEventListener(e: BroadcaseEventName, eventId?: string) {
    if (!e || !this.eventMap.has(e)) {
      return;
    }
    if (eventId && eventId.length) {
      this.eventMap.get(e)!.delete(eventId);
      return;
    }

    [...this.eventMap.get(e)!.keys()]
      .filter(eventname => eventname.indexOf(e) !== -1)
      .forEach(_id => {
        this.eventMap.delete(_id);
      });
  }

  async invoke(params: ExcuteParams) {
    const seqNo = [this.getChannelId(), this.sequenceHelper.next()].join('-');
    return new Promise((resolve, reject) => {
      this.promiseMap.set(seqNo, { resolve, reject });
      this.myPort!.postMessage({
        channel: 'excute',
        seqno: seqNo,
        args: params,
        channelId: this.channelId,
      } as ChannelExcuteParams);
    });
  }
}

// receiveChannel 类似于ipcMain
export class MainChannel implements MainChannelApi {
  private ports: Map<string, MessagePort> = new Map();

  private handleCallbackMap: Map<string, HandleCallbackApi> = new Map();

  constructor() {
    // 如果不是顶层页面 || 在electron环境下 不执行receiveChannel任何逻辑
    if (!inWindow() || window.top !== window || isElectron()) {
      return;
    }
    window.onmessage = this.onCreatedPorts.bind(this);
  }

  // 注册处理函数(类似于ipcMain.handle方法)
  registerHandleCallback(eventName: string, callback: HandleCallbackApi) {
    this.handleCallbackMap.set(eventName, callback);
  }

  // 给所有的sendChannel广播消息
  broadcast(params: ChannelEventData, option: ChannelBroadcastOptions = { selfChannelId: '', excludeSelf: false }) {
    const { selfChannelId, excludeSelf } = option;

    [...this.ports.keys()].forEach(_id => {
      // 是否要排除自己
      if (_id === selfChannelId && excludeSelf) {
        return;
      }
      this.ports.get(_id)!.postMessage({
        channel: 'event',
        data: params,
      });
    });
  }

  // 接受创建port的时候接受
  private onCreatedPorts(e: MessageEvent<Record<'channelId' | 'type', string>>) {
    if (lodashGet(e, 'data.type', '') !== 'createdPort') {
      return;
    }
    const { type, channelId } = e.data;

    console.log('[channel]createdport', type, channelId);

    const myPort = e.ports[0];
    this.ports.set(channelId, myPort);
    // 新增port绑定onmessage事件

    myPort.addEventListener('message', e => {
      this.onPortMessage(e, myPort);
    });
    myPort.start();
  }

  // 响应portMessage
  private onPortMessage(e: MessageEvent<ChannelParams>, port: MessagePort) {
    const { data: params } = e;

    // 如果没有channel的消息直接忽略
    if (lodashGet(params, 'channel', '') === '') {
      return;
    }

    switch (params.channel) {
      case 'excute': {
        const { seqno: ackNo } = e.data as ChannelExcuteParams;
        this.handleRequest(e as MessageEvent<ChannelExcuteParams>)
          .then(data => {
            this.reportResult({
              error: null,
              ackNo,
              port,
              data,
              channelId: e.data.channelId!,
            });
          })
          .catch(error => {
            this.reportResult({
              error,
              ackNo,
              port,
              data: undefined,
              channelId: e.data.channelId!,
            });
          });
        break;
      }
      default:
        break;
    }
  }

  // 处理sendChannel发送请求
  private handleRequest(e: MessageEvent<ChannelExcuteParams>) {
    const { args } = e.data;
    const { eventName, params } = args;
    // 检查是否注册了对应处理函数
    if (!this.handleCallbackMap.has(eventName)) {
      if (isDev()) {
        return Promise.resolve();
      }
      throw new Error('un-register-event:' + eventName);
    }

    const callback = this.handleCallbackMap.get(eventName) as HandleCallbackApi;
    return callback(e, params);
  }

  // 上报结果
  private reportResult(params: { error: null | Error; data?: unknown; ackNo: string; port: MessagePort; channelId: string }) {
    const { error, data, ackNo, port } = params;

    port.postMessage({
      channel: 'reply',
      ackno: ackNo,
      code: error instanceof Error ? -1 : 0,
      msg: error instanceof Error ? error.message : 'ok',
      data,
    } as ChannelReplyParams);
  }

  // 主动向sendChannel发送消息
  send2Render(portId: string, data: unknown) {
    // 查找port
    if (!this.ports.has(portId)) {
      return;
    }
    const port = this.ports.get(portId) as MessagePort;
    port.postMessage({
      channel: 'response',
      data,
    } as ChannelResponseParams);
  }
}
