import React, { createContext, useReducer } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import lodashGet from 'lodash/get';
import { apiHolder, IMMessage, IMQuickComment, NIMApi } from 'api';
import { useEventCallback, useObservable } from 'rxjs-hooks';
import { forkJoin, from, fromEventPattern, merge, Observable, timer } from 'rxjs';
import { bufferToggle, filter, mergeMap, throttleTime, tap, map, startWith, withLatestFrom, scan, delay } from 'rxjs/operators';
import lodashChunk from 'lodash/chunk';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

// 快捷回复
enum CommentOperators {
  add,
  delete,
  batchAdd,
  batchDelete,
  batch,
}
type CommentsMapApi = Record<string, IMQuickComment[]>;
type CommentStreamInterface =
  | {
      action: CommentOperators.add | CommentOperators.delete;
      idClient: string;
      comment: IMQuickComment;
    }
  | {
      action: CommentOperators.batchAdd | CommentOperators.batchDelete;
      params: [string, IMQuickComment][];
    }
  | {
      action: CommentOperators.batch;
      comments: Record<string, IMQuickComment[]>;
    };

interface CommentsContextApi {
  getCommentByMsg(msg: IMMessage): void;
  commentsMap: CommentsMapApi;
  addComment(param: { msg: IMMessage; body: number }): void;
  deleteComment(param: { msg: IMMessage; body: number }): void;
}
export const CommentsContext = createContext<CommentsContextApi>({
  commentsMap: {},
  getCommentByMsg(msg) {},
  addComment() {},
  deleteComment() {},
});

const reduce = (state: CommentsMapApi, payload: CommentStreamInterface) => {
  let cloneState = { ...state };
  switch (payload.action) {
    case CommentOperators.batch:
      cloneState = { ...cloneState, ...payload.comments };
      break;
    case CommentOperators.add:
      if (!Reflect.has(cloneState, payload.idClient)) {
        cloneState[payload.idClient] = [] as IMQuickComment[];
      }
      cloneState[payload.idClient].push(payload.comment);
      break;
    case CommentOperators.delete:
      const $index = (lodashGet(cloneState, payload.idClient, []) as IMQuickComment[]).findIndex(
        item => item.from === payload.comment.from && item.body === payload.comment.body
      );
      $index !== -1 && cloneState[payload.idClient].splice($index, 1);
      break;
    case CommentOperators.batchAdd:
      payload.params.forEach(([idClient, comment]) => {
        if (!Reflect.has(cloneState, idClient)) {
          cloneState[idClient] = [] as IMQuickComment[];
        }
        cloneState[idClient].push(comment);
      });
      // 强制去重(临时策略2022-03-01by郭超)
      // QIYE163-18940  【IM-快捷表情】回应详情页的成员重复了，见截图
      payload.params.forEach(([idClient]) => {
        const pureMsgs = new Map(cloneState[idClient].map(state => [state.from + '&' + state.body, state]));
        cloneState[idClient] = [...pureMsgs.values()];
      });
      break;
    case CommentOperators.batchDelete:
      payload.params.forEach(([idClient, comment]) => {
        const _index = (lodashGet(cloneState, idClient, []) as IMQuickComment[]).findIndex(item => item.from === comment.from && item.body === comment.body);
        _index !== -1 && cloneState[idClient].splice(_index, 1);
      });
      break;
    default:
      break;
  }
  return cloneState;
};
const initQuickComments = {} as CommentsMapApi;

export const CommentsProvider: React.FC<{ to: string }> = props => {
  const { to, children } = props;
  const [commentsMap, dispatch] = useReducer(reduce, initQuickComments);
  // 使用Rxjs优化业务逻辑

  const grepCommentRequest: (msg: IMMessage) => boolean = msg => {
    const now = new Date().getTime();
    return now - new Date(msg.time).getTime() <= 7 * 24 * 60 * 60 * 1000 && msg.sourceType === 'pull';
  };

  // 将消息列表数据转换成commentMap数据
  const switchMsgToComments: (msglist: IMMessage[]) => CommentsMapApi = list =>
    list
      .filter(item => Array.isArray(item.comments) && item.comments.length > 0)
      .reduce(
        (total, current) => ({
          [current.idClient]: current.comments,
          ...total,
        }),
        {} as CommentsMapApi
      );

  const [getCommentByMsg] = useEventCallback(($event: Observable<IMMessage>, $state) => {
    const $bufferStart = $event.pipe(throttleTime(200));

    const $bufferRequest = $event.pipe(
      filter(msg => lodashGet(msg, 'idServer.length', 0) !== 0),
      // 已经请求过的数据直接过滤掉
      bufferToggle($bufferStart, () => timer(200))
    );

    // 缓存请求数据 避免重复请求
    const $requestRecords = $bufferRequest.pipe(
      delay(50),
      map(msglist => msglist.map(msg => msg.idClient)),
      scan((totalIds, _ids) => [...new Set([...totalIds, ..._ids])], [] as string[]),
      startWith([] as string[])
    );
    return $bufferRequest.pipe(
      withLatestFrom($requestRecords),
      // 过滤掉已经请求过的数据
      tap(args => {
        console.log('[quickComment]request', args);
      }),
      map(([list, records]) => list.filter(item => !records.includes(item.idClient))),
      // 删除重复请求数据
      map(list => {
        const _list = list.map(item => [item.idClient, item]);
        const _map = new Map(_list);
        return Array.from(_map)
          .flat()
          .filter(item => typeof item !== 'string') as IMMessage[];
      }),
      filter(item => item.length > 0),
      mergeMap(msgs => {
        // 如果消息中包含comments可以先直接使用
        const requestMsgs = lodashChunk(msgs.filter(grepCommentRequest), 20);
        const $request = forkJoin(requestMsgs.map(list => nimApi.excute('getQuickComments', { msgs: list }) as Promise<IMMessage[]>)).pipe(
          map(totalList => totalList.reduce((total, cmsgs) => [...total, ...cmsgs], [] as IMMessage[]))
        );
        return merge(from(Promise.resolve(msgs)), $request);
      }),
      map(list => switchMsgToComments(list)),
      tap(comments => {
        console.log('[quickComments]result', comments);
        dispatch({
          action: CommentOperators.batch,
          comments,
        });
      })
    );
  }, {} as CommentsMapApi);

  const [addQuickComment] = useEventCallback(
    ($e: Observable<{ msg: IMMessage; body: number }>, _: unknown) =>
      $e.pipe(
        mergeMap(opt => {
          const { msg, body } = opt;
          const $request = nimApi.excute('addQuickComment', {
            msg,
            body: Number(body),
          }) as Promise<{ comment: IMQuickComment }>;
          return from($request.then(args => [msg, args.comment] as [IMMessage, IMQuickComment]));
        }),
        tap(arg => {
          dispatch({
            action: CommentOperators.add,
            idClient: arg[0].idClient,
            comment: arg[1],
          });
        })
      ),
    [] as unknown as [IMMessage, IMQuickComment]
  );

  const [deleteQuickComment] = useEventCallback(
    ($e: Observable<{ msg: IMMessage; body: number }>) =>
      $e.pipe(
        mergeMap(opt => {
          const { msg, body } = opt;
          const $request = nimApi.excute('deleteQuickComment', {
            msg,
            body: Number(body),
          }) as Promise<{ comment: IMQuickComment }>;
          return from($request.then(args => [msg, args.comment] as [IMMessage, IMQuickComment]));
        }),
        tap(arg => {
          dispatch({
            action: CommentOperators.delete,
            idClient: arg[0].idClient,
            comment: arg[1],
          });
        })
      ),
    [] as unknown as [IMMessage, IMQuickComment]
  );

  // 监听评论事件 然后批量处理
  useObservable(
    (_, $props: Observable<[string]>) => {
      const onQuickComment = handler => {
        nimApi.subscrible('onQuickComment', handler);
      };
      const offQuickComment = handler => {
        nimApi.unSubcrible('onQuickComment', handler);
      };
      const $to = $props.pipe(map(([_to]) => _to));
      const $event = fromEventPattern(onQuickComment, offQuickComment) as Observable<[IMMessage, IMQuickComment]>;
      return $event.pipe(
        withLatestFrom($to),
        // 只展示当前会话
        filter(([args, toAccount]) => {
          if (args[0].scene === 'p2p') {
            return [args[0].from, args[0].to].includes(toAccount);
          }
          return args[0].to === toAccount;
        }),
        map(([args]) => args),
        bufferToggle($event, () => timer(100)),
        map(args =>
          args.map(arg => {
            const [msg, comment] = arg;
            return [msg.idClient, comment] as [string, IMQuickComment];
          })
        ),
        tap(args => {
          dispatch({
            action: CommentOperators.batchAdd,
            params: args,
          });
        })
      );
    },
    [] as unknown as [IMMessage, IMQuickComment][],
    [to]
  );

  // 监听取消评论 然后批量处理
  useObservable(
    (_, $props: Observable<[string]>) => {
      const onDeleteQuickComment = handler => {
        nimApi.subscrible('onDeleteQuickComment', handler);
      };
      const offDeleteQuickComment = handler => {
        nimApi.unSubcrible('onDeleteQuickComment', handler);
      };
      const $to = $props.pipe(map(([toAccount]) => toAccount));
      const $event = fromEventPattern(onDeleteQuickComment, offDeleteQuickComment) as Observable<[IMMessage, IMQuickComment]>;
      return $event.pipe(
        withLatestFrom($to),
        filter(([args, toAccount]) => {
          if (args[0].scene === 'p2p') {
            return [args[0].from, args[0].to].includes(toAccount);
          }
          return args[0].to === toAccount;
        }),
        map(([args]) => args),
        bufferToggle($event, () => timer(100)),
        map(args =>
          args.map(arg => {
            const [msg, comment] = arg;
            return [msg.idClient, comment] as [string, IMQuickComment];
          })
        ),
        tap(args => {
          dispatch({
            action: CommentOperators.batchDelete,
            params: args,
          });
        })
      );
    },
    [] as unknown as [IMMessage, IMQuickComment][],
    [to]
  );

  return (
    <CommentsContext.Provider
      value={{
        getCommentByMsg,
        commentsMap,
        addComment: addQuickComment,
        deleteComment: deleteQuickComment,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};
