import { useEffect } from 'react';
import { IMUser, NIMApi, apiHolder } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map, first } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { iif } from 'rxjs';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

export function useYunxinAccount(ids: string, scene?: string, noLiveUpdate?: boolean): IMUser | undefined;
export function useYunxinAccount(ids: string, scene = 'p2p', noLiveUpdate = false): any {
  // @todo: 之前的useEffect依赖是空数组 不知道为什么单个会话更新获取用户信息的时候useEffect没有办法执行
  // 需要研究一下原理是什么？
  useEffect(() => {
    if (scene !== 'p2p') {
      return;
    }
    nimApi.imusers.requestUser(ids);
  }, [ids]);
  return useObservable(
    (_, $props) => {
      const $id = $props.pipe(map(([id]) => id));
      // 当检查到用户名字之后就不在响应了 通过这个方式减少触发渲染次数
      const $user = nimApi.imusers.getUserById($id);
      return iif(
        () => {
          return noLiveUpdate;
        },
        $user.pipe(
          first(user => {
            return lodashGet(user, 'nick.length', 0) !== 0;
          })
        ),
        $user
      );
    },
    {},
    [ids]
  );
}
export function useYunxinAccounts(ids: string[]): Record<string, IMUser | undefined>;
export const useYunxinAccounts = (ids: string[]) => {
  useEffect(() => {
    ids
      .filter(item => item.length)
      .forEach(item => {
        nimApi.imusers.requestUser(item);
      });
  }, [ids.join('-')]);
  return useObservable(
    (_, $props) => {
      const $ids = $props.pipe(map(([idlist]) => idlist));
      return nimApi.imusers.getUsersByIds($ids);
    },
    {},
    [ids]
  );
};
