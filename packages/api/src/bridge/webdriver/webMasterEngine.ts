import { DispatchTaskParams } from '../interface/webMasterDriver';
import { TaskResponse } from '../interface/register';
import { WebMasterBridgeInterface } from '../interface/webMainDriver';
import { DispatchTaskRequestContent } from '../interface/proxy';
import { BridgeTaskPriority } from '../interface/common';
import { CommonBridgeEngine } from './commonBridgeEngine';

interface RequestMapItem {
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
}

class MyError extends Error {
  private code = -1;

  private duration: number[] = [];

  constructor(message: string, options: { code: number; duration: number[] }) {
    super(message);
    this.code = options.code;
    this.duration = options.duration;
  }

  print() {
    console.log('[custom-error]', this.code, this.duration);
    return true;
  }
}

// web环境下前台页面入口
export class MasterBridgeEngine extends CommonBridgeEngine implements WebMasterBridgeInterface {
  private requestList: Map<string, RequestMapItem> = new Map();

  private requestStarttimeMap: Map<string, number> = new Map();

  constructor() {
    super();
    this.init();
  }

  getConfigureTaskPriority() {
    return this.renderChannelApi.invoke({
      eventName: 'getConfigureTaskPriority',
      params: {},
    });
  }

  // 监听主进程返回的response事件
  private init() {
    this.renderChannelApi.addResponseListener(args => {
      this.handleResponseExchangeData(args as TaskResponse);
      return true;
    });
  }

  /**
   * @name 定义任务优先级(默认不设置都是medium)
   * @param taskInfo  任务模块 apiname
   * @param priority 任务优先级 支持high/medium/low
   * @param overtime 当前接口对应的超时响应时长
   * @returns void
   */
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args'>, priority: BridgeTaskPriority, overtime?: number) {
    return this.renderChannelApi.invoke({
      eventName: 'configureApiPriority',
      params: {
        taskInfo,
        priority,
        overtime,
      },
    });
  }

  // 处理response数据(表示数据窗口是否处理了请求并返回结果)
  private async handleResponseExchangeData(args: TaskResponse) {
    const { ackNo, data, code, errorMsg, duration: timestampList } = args;

    if (!this.requestList.has(ackNo)) {
      return;
    }
    const { reject, resolve } = this.requestList.get(ackNo) as RequestMapItem;
    this.requestList.delete(ackNo);

    if (code === 0) {
      resolve({
        data,
        duration: timestampList,
      });
    } else {
      const error = new MyError(errorMsg as string, {
        code,
        duration: timestampList as number[],
      });

      reject(error);
    }
    this.requestStarttimeMap.delete(ackNo);
  }

  /**
   * @name 销毁当前实例下的所有任务
   * @returns void
   */
  flush() {
    return this.renderChannelApi.invoke({
      eventName: 'flush',
      params: {},
    });
  }

  /**
   * @name 派发任务
   * @param args {DispatchTaskRequestContent} 请求参数
   * @param winType {string}
   * @returns 调用结果
   */
  async dispatchTask(args: DispatchTaskRequestContent, seqNo: string, winType = 'main'): Promise<unknown> {
    this.requestStarttimeMap.set(seqNo, Date.now());
    try {
      await this.renderChannelApi.invoke({
        eventName: 'dispatchTask',
        params: {
          requestContent: args,
          seqNo,
          winType,
          // 需要给主进程传一个markId 这样主进程拿到结果之后才能知道要回传给谁
          channelId: this.renderChannelApi.getChannelId(),
        } as DispatchTaskParams,
      });
    } catch (ex) {
      console.log('[bridge]dispatchTask error:', ex, 'args:', args);
      return Promise.reject(typeof ex === 'string' ? new Error(ex) : ex);
    }

    return new Promise((resolve, reject) => {
      this.requestList.set(seqNo, {
        resolve,
        reject,
      });
    });
  }

  async getAllTasks() {
    const res = await this.renderChannelApi.invoke({
      eventName: 'getAllTasks',
      params: {},
    });
    return res;
  }

  async forbiddenBgWin() {
    return this.renderChannelApi.invoke({
      eventName: 'forbiddenBgWin',
      params: {},
    });
  }

  async enableBgWin() {
    return this.renderChannelApi.invoke({
      eventName: 'enableBgWin',
      params: {},
    });
  }

  // todo: 检测当前窗口对应的后台是否可以联通
  async checkBgAlive(account: string) {
    console.log('[web-bridge]checkBgAlive:', account);
    return true;
  }

  // 删除主进程中后台窗口记录
  async removeBridgeWin(webId: number) {
    console.log('[web-bridge]removeBridgeWin:', webId);
    return true;
  }
}

// export const bridgeManageImpl = new BridgeManageImpl();
