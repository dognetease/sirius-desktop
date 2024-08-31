import { Fullfilled, HandlerApi, InterceptorManagerApi, NimInterceptorApi } from '@/api/logical/im_plugins';

class IMInterceptor implements NimInterceptorApi {
  request = new InterceptorManager<[string, any]>();

  response = new InterceptorManager<[string, any, any]>();

  constructor() {}
}

export class InterceptorManager<T> implements InterceptorManagerApi<T> {
  handlers: HandlerApi<T>[] = [];

  use(fullfilled: Fullfilled<T>) {
    const _id = `${Math.random()}`.replace('.', '');
    this.handlers.push({
      fullfilled,
      _id,
    });
    return _id;
  }

  eject(id: string) {
    const index = this.handlers.map(item => item?._id).findIndex(item => item === id);
    if (index === -1) {
      return;
    }
    this.handlers.splice(index, 1);
  }

  getHandlers() {
    return this.handlers;
  }

  excute(promise: Promise<T>): Promise<T> {
    const handlers = [...this.handlers].filter(item => item);
    while (handlers.length) {
      const { fullfilled } = handlers.shift() as {
        fullfilled: Fullfilled<T>;
      };
      // @ts-ignore
      promise = promise.then(fullfilled);
    }
    return promise;
  }
}

export default IMInterceptor;
