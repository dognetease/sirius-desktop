import { ipcRenderer } from 'electron';
import { ipcChannelManage } from './ipcChannelManage';
import { MasterBridgeManage, DispatchTaskRequestContent, DispatchTaskParams, TaskResponse, BridgeTaskPriority } from '../declare/BridgeManage';

class MyError extends Error {
  private code = -1;

  private duration: number[] = [];

  private taskConfig: DispatchTaskRequestContent | undefined;

  constructor(message: string, options: { code: number; duration: number[]; taskConfig?: DispatchTaskRequestContent }) {
    super(message);
    this.code = options.code;
    this.duration = options.duration;
    this.taskConfig = options.taskConfig;
  }

  print() {
    console.log('[custom-error]', this.code, this.duration, this.taskConfig);
    return true;
  }
}

interface RequestMapItem {
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
}
class BridgeManageImpl implements MasterBridgeManage {
  private requestList: Map<string, RequestMapItem> = new Map();

  constructor() {
    this.initIpcChannelEvent();
  }

  getConfigureTaskPriority() {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'getConfigureTaskPriority',
      params: {},
    });
  }

  // 监听主进程返回的reply和response事件
  private initIpcChannelEvent() {
    ipcRenderer.addListener('bridge-data-exchange', (e, args: TaskResponse) => {
      this.handleResponseExchangeData(args);
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
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime?: number) {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'configureApiPriority',
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

    if (code === 0) {
      resolve({
        data,
        duration: timestampList,
      });
    } else {
      reject(new MyError(errorMsg as string, { code, duration: timestampList as number[] }));
    }
    this.requestList.delete(ackNo);
  }

  /**
   * @name 销毁当前实例下的所有任务
   * @returns void
   */
  flush(account: string) {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'flush',
      params: account,
    });
  }

  /**
   * @name 派发任务
   * @param args {DispatchTaskRequestContent} 请求参数
   * @param winType {string}
   * @returns 调用结果
   */
  async dispatchTask(args: DispatchTaskRequestContent, seqNo: string, winType = 'main'): Promise<unknown> {
    console.log('[bridge]dispatchTask start,args:', args);

    try {
      await ipcChannelManage.invoke({
        channel: 'bridgeInVoke',
        functionName: 'dispatchTask',
        params: {
          requestContent: args,
          seqNo,
          winType,
        } as DispatchTaskParams,
      });
    } catch (ex) {
      console.log('[bridge]dispatchTask error:', ex, 'args:', args);
      return Promise.reject(ex);
    }

    return new Promise((resolve, reject) => {
      this.requestList.set(seqNo, {
        resolve,
        reject,
      });
    });
  }

  async getAllTasks() {
    const res = await ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'getAllTasks',
      params: '',
    });
    return res;
  }

  getBridgeConnected() {
    return true;
  }

  // 检测当前窗口对应的后台是否可以联通
  async checkBgAlive(account: string) {
    // 是否对应的后台是否存在
    const { data } = (await ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'checkBgAlive',
      params: account,
    })) as { data: boolean };

    if (data === true) {
      await this.dispatchTask(
        {
          namespace: 'common',
          apiname: 'test',
          args: [],
          account,
        },
        `${Math.random()}`.replace('.', '')
      );
      return true;
    }
    return false;
  }

  // 删除主进程中后台窗口记录
  removeBridgeWin(webId: number) {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'removeBridgeWin',
      params: webId,
    });
  }
}

export const bridgeManageImpl = new BridgeManageImpl();
