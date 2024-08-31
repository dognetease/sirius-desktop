import { InterceptorApi, InterceptorParams, InterceptorFilterCondition } from '../interface/interceptor';

export class Interceptor<T = unknown> implements InterceptorApi<T> {
  private type = 'request';

  private list: (InterceptorParams<T> & { interceptorId: string })[] = [];

  constructor(type: 'request' | 'response') {
    this.type = type;
  }

  // 注册拦截器
  use(params: InterceptorParams<T>, priority: 'normal' | 'high' = 'normal') {
    const interceptorId = `${this.type}-${Math.random()}`.replace('.', '');
    const { resolve, reject, namespace = 'common', type = 'normal' } = params;
    this.list[priority === 'high' ? 'unshift' : 'push']({
      resolve,
      reject,
      namespace,
      type,
      interceptorId,
    });
    return interceptorId;
  }

  // 删除拦截器
  eject(interceptorId: string) {
    const index = this.list.findIndex(item => item.interceptorId === interceptorId);
    index !== -1 && this.list.splice(index, 1);
  }

  // 执行拦截器
  excute(params: Promise<T>, _filterCondition?: InterceptorFilterCondition) {
    return this.list
      .filter(item => {
        if (typeof _filterCondition === 'function') {
          return _filterCondition(item.namespace || 'common', item.type || 'normal');
        }
        return true;
      })
      .reduce((total, current) => {
        const { resolve, reject } = current;
        total = total.then(resolve);
        if (typeof reject === 'function') {
          total = total.catch(reject);
        }
        return total;
      }, params);
  }
}
