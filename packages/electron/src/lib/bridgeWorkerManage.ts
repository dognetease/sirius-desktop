import { ipcRenderer } from 'electron';
import { ipcChannelManage } from './ipcChannelManage';
import { ReturnTaskParams, WorkerBridgeMange } from '../declare/BridgeManage';

class WorkerBridgeImpl implements WorkerBridgeMange {
  constructor() {
    ipcRenderer.addListener('bridge-error', (...args) => {
      console.log('[bridge]mainerror', args);
      return true;
    });
  }

  // 向主进程报活
  ping(params: string) {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'ping',
      params,
    });
  }

  // 返回任务结果
  returnTaskResult(params: ReturnTaskParams): Promise<unknown> {
    return ipcChannelManage.invoke({
      channel: 'bridgeInVoke',
      functionName: 'returnTaskResult',
      params,
    });
  }
}

export const bridgeWorkerImpl = new WorkerBridgeImpl();
