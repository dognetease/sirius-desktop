import { Observable, fromEventPattern, timer } from 'rxjs';
import { filter, bufferToggle, map } from 'rxjs/operators';
import { apiHolder, NIMApi, NIMEventOptions } from 'api';
import lodashGet from 'lodash/get';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
/**
 * 一个根据不同的频率来合并发送事件的函数
 * ex:可以根据接受消息的频率来控制消息的合并吐出策略
 * 如果1S内只能接受到一条消息就直接吐出。
 * 如果1S内接受到10条消息 那么就50ms内吐出一次
 * 如果1S内接受到20条消息 那么就100ms内吐出一次
 * 如果1S内接受到50条消息 那么就500ms内吐出一次
 * 如果1S内接受到100条消息 那么就1s内吐出一次(自己来控制这个力度)
 */
interface FilterFunc<T> {
  (param: T, ...args: unknown[]): boolean;
}

interface YunxinEventApi<T> {
  (param: T, ...args: unknown[]): void;
}

export function createFrequencyValve<T>(eventName: keyof NIMEventOptions, levels: [number, number][], filterFunc: FilterFunc<T>): Observable<number> {
  const $on = (handler: YunxinEventApi<T>) => {
    nimApi.subscrible(eventName, handler);
  };
  const $off = (handler: YunxinEventApi<T>) => {
    nimApi.unSubcrible(eventName, handler);
  };

  const $event = fromEventPattern($on, $off) as Observable<T>;

  return $event
    .pipe(
      filter(filterFunc),
      bufferToggle($event, () => timer(2000))
    )
    .pipe(
      map(list => list.length),
      map(len => {
        if (levels.length === 0) {
          return -1;
        }
        const index = levels.findIndex(range => {
          const [min, max] = range;
          return len > min && len <= max;
        });

        if (index !== -1) {
          return index;
        }
        // 如果低于最低级别
        if (len < lodashGet(levels, '[0][1]', -Infinity)) {
          return 0;
        }

        if (len > lodashGet(levels, `[${levels.length - 1}][1]`, Infinity)) {
          return levels.length - 1;
        }
        return -1;
      })
    );
}
