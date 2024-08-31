import { ReturnTaskParams, WorkerBridgeMange } from '../interface/webWorkerDriver';
import { WorkerTaskParams } from '../interface/webMainDriver';
import { CommonBridgeEngine } from './commonBridgeEngine';

export class WorkerBridgeImpl extends CommonBridgeEngine implements WorkerBridgeMange {
  // 向主进程报活——每10s报一次,如果returnTask在10s内执行过就跳过上报 避免重复上报
  ping(params: string) {
    return this.renderChannelApi.invoke({
      eventName: 'ping',
      params,
    });
  }

  // 返回任务结果
  async returnTaskResult(params: ReturnTaskParams): Promise<unknown> {
    // 绑定一个channelId
    const list = (await this.renderChannelApi.invoke({
      eventName: 'returnTaskResult',
      params,
    })) as { data: WorkerTaskParams[] };
    return list.data;
  }
}
