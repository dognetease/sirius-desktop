import debounce from 'lodash/debounce';
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
interface DebouncedFunc<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}
import lodashGet from 'lodash/get';

import { IMMessage, NIMApi, apiHolder } from 'api';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 因为一条消息内可能会有多条文档链接 为了避免出现一个消息频繁read/write DB的情况。实现一个类来支持消息的批量读写
interface WriteBufferApi {
  params: Record<string, unknown>;
  storeFunc: DebouncedFunc<() => Promise<void>>;
}
export class BatchOpeartionMsgHandle {
  private readBufferArray: Map<string, Promise<Record<string, unknown>>> = new Map();

  private writeBufferArray: Map<string, WriteBufferApi> = new Map();

  private readMsg = async (idClient: string) => {
    const { msg } = (await nimApi.excute('getLocalMsgByIdClient', {
      idClient,
    })) as { msg: IMMessage };

    let localCustom: Record<string, unknown> = {};
    try {
      localCustom = JSON.parse(msg.localCustom || '');
    } catch (ex) {}

    return localCustom;
  };

  private createBufferRequest(idClient: string) {
    const _sleep = () =>
      new Promise(resolve => {
        setTimeout(resolve, 20);
      });
    const $promise = new Promise(async resolve => {
      await _sleep();
      const result = await this.readMsg(idClient);
      this.readBufferArray.delete(idClient);
      resolve(result);
    });

    this.readBufferArray.set(idClient, $promise as Promise<Record<string, unknown>>);
    return $promise;
  }

  read(idClient: string, field: string, bkData: unknown) {
    return new Promise(resolve => {
      if (!this.readBufferArray.has(idClient)) {
        this.createBufferRequest(idClient);
      }
      this.readBufferArray.get(idClient)?.then(obj => {
        const content = lodashGet(obj, field, bkData);
        return resolve(content);
      });
    });
  }

  write(idClient: string, content: { [key: string]: unknown }) {
    if (!this.writeBufferArray.has(idClient)) {
      const $this = this;
      const _storeFunc = async () => {
        console.log('[batchInvoke]write2', idClient, this.writeBufferArray.get(idClient));

        if (!$this.writeBufferArray.has(idClient)) {
          return;
        }

        // 这块有可能有BUG 如果setTimeout(宏任务)刚调到之前有其他任务(微任务)刚刚执行了删除 这块就会读不到params
        const _tempContennt = $this.writeBufferArray.get(idClient)!.params;

        const localCustom = await $this.readMsg(idClient);
        nimApi.excute('updateLocalMsg', {
          idClient,
          localCustom: JSON.stringify({
            ...localCustom,
            ..._tempContennt,
          }),
        });

        $this.writeBufferArray.delete(idClient);
      };

      this.writeBufferArray.set(idClient, {
        params: {},
        storeFunc: debounce(_storeFunc, 100),
      });
    }

    const { params } = this.writeBufferArray.get(idClient) as WriteBufferApi;
    const { storeFunc } = this.writeBufferArray.get(idClient) as WriteBufferApi;
    // 存储
    this.writeBufferArray.get(idClient)!.params = { ...params, ...content };
    storeFunc.apply(this);
  }
}
