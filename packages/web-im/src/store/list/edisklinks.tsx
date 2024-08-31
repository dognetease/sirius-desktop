import React, { useContext, useState, useEffect } from 'react';
import { MD5 } from 'crypto-js';
import { useEventCallback } from 'rxjs-hooks';
import { from, merge, Observable, timer } from 'rxjs';
import { filter, withLatestFrom, map, bufferToggle, throttleTime, mergeMap, catchError, scan } from 'rxjs/operators';
import lodashGet from 'lodash/get';

import { apiHolder, ApiResponse } from 'api';
import { BatchOpeartionMsgHandle } from './batchHandlelocalMsg';

const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();

const batchOpeartionMsgHandle = new BatchOpeartionMsgHandle();

type EdisklinkInterface = {
  timestamp: number;
  link: string;
  response: {
    title: string | null;
    summary?: string | null;
    content?: string | null;
    fileType: string | null;
  };
  resourceType: 'FILE' | 'DIRECTORY';
};

interface EdiskResponseContent {
  content: null | {
    fileType: string;
    name: string;
  };
  title: string | null;
  icon: string | null;
  summary: string | null;
  type: string;
  result: {
    resourceType: 'FILE' | 'DIRECTORY';
  };
}
type EdisklinkMapInterface = Record<string, EdisklinkInterface>;
type ContextProps = {
  getEdisklinkMap(e: { link: string }): void;
  state: EdisklinkMapInterface;
};
export const Context = React.createContext<ContextProps>({} as ContextProps);

export const useAnnoEdisklink: (link: string) => false | EdisklinkInterface = link => {
  const { state, getEdisklinkMap } = useContext(Context);
  const [md5Key] = useState(MD5(link).toString());
  // 获取数据(todo:从localCustom中筛选功能未开发)
  useEffect(() => {
    getEdisklinkMap({
      link,
    });
  }, []);

  // 如果可以解析出来就展示完整信息,否则直接返回link
  if (lodashGet(state, `${md5Key}.response.title.length`, 0) !== 0) {
    return state[md5Key] as unknown as EdisklinkInterface;
  }
  return false;
};

export const useMsgEdisklink: (link: string, idClient: string) => false | EdisklinkInterface = (link, idClient) => {
  const { state, getEdisklinkMap } = useContext(Context);
  const [md5Key] = useState(MD5(link).toString());
  // 查找聊天信息
  useEffect(() => {
    batchOpeartionMsgHandle
      .read(idClient, `${md5Key}`, false)
      .then(temp => {
        getEdisklinkMap({
          link,
          temp,
        });
      })
      .catch(() => {
        getEdisklinkMap({
          link,
        });
      });
  }, [idClient]);

  // 更新缓存
  const updateStore = async (content: EdisklinkInterface, id: string, field: string) => {
    const result = await batchOpeartionMsgHandle.read(id, `${field}`, false);
    const contextLinkTimestamp = lodashGet(content, 'timestamp', 0);
    const storedLinkTimestamp = lodashGet(result, 'timestamp', 0);
    // 如果context没有link相关内容 或者内容没有更新
    if (contextLinkTimestamp === 0 || contextLinkTimestamp === storedLinkTimestamp) {
      return;
    }
    batchOpeartionMsgHandle.write(idClient, {
      [field]: content,
    });
  };

  useEffect(() => {
    if (lodashGet(state, `${md5Key}.timestamp`, 0) === 0) {
      return;
    }
    updateStore(state[md5Key], idClient, md5Key);
  }, [lodashGet(state, `${md5Key}.timestamp`, 0)]);

  // 如果可以解析出来就展示完整信息,否则直接返回link
  if (lodashGet(state, `${md5Key}.response.title.length`, 0) !== 0) {
    return state[md5Key]! as unknown as EdisklinkInterface;
  }

  return false;
};

export const Provider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const { children } = props;

  const batchRequestlinkContent: (links: string[]) => Promise<ApiResponse<Record<string, EdiskResponseContent>>> = links => {
    const url = systemApi.getUrl('getLinkInfoBatch');
    const request = httpApi.post(
      url,
      {
        linkUrls: links,
      },
      {
        noErrorMsgEmit: true,
      }
    ) as Promise<ApiResponse<Record<string, EdiskResponseContent>>>;
    return request;
  };

  // 将服务端数据转换成客户端格式数据
  const formatResponse = (res: ApiResponse<Record<string, EdiskResponseContent>>) => {
    const ediskMap = res.data!.data as unknown as Record<string, EdiskResponseContent>;
    console.log('[im.edisklink]response:', ediskMap);
    const _list = Object.keys(ediskMap).map(key => {
      const isEdisk = ediskMap[key]!.type === 'edisk';
      const content = isEdisk
        ? {
            title: lodashGet(ediskMap[key], 'content.name', ''),
            fileType: lodashGet(ediskMap[key], 'content.fileType', ''),
            summary: '',
            content: '',
          }
        : {
            title: null,
            fileType: null,
            summary: lodashGet(ediskMap[key], 'summary', null),
            content: null,
          };
      const resourceType = lodashGet(ediskMap[key], 'result.resourceType', 'common') as unknown as string;
      return {
        timestamp: new Date().getTime(),
        link: key,
        // @ts-ignore
        response: content,
        resourceType,
      };
    }) as EdisklinkInterface[];
    return _list;
  };

  const [getEdisklinkMap, edisklinkMap] = useEventCallback(($e: Observable<{ link: string; temp?: false | EdisklinkInterface }>, $state) => {
    const $temp = $e.pipe(
      filter(e => lodashGet(e, 'temp', false) !== false),
      map(e => e.temp as EdisklinkInterface),
      scan(
        (total, current) => ({
          ...total,
          [MD5(current.link).toString()]: current,
        }),
        {} as EdisklinkMapInterface
      )
    );

    const $request = $e.pipe(
      bufferToggle($e.pipe(throttleTime(100)), () => timer(100)),
      withLatestFrom($state),
      map(([list, _state]) => {
        const now = new Date().getTime();
        const duration = 5 * 60 * 1000;
        const _list = list
          .filter(item => {
            const key = MD5(item.link).toString();
            const tempTimestamp = lodashGet(_state, `[${key}].timestamp`, 0) as number;
            return !lodashGet(_state, key, false) || now - tempTimestamp > duration;
          })
          .map(item => item.link);
        return [...new Set(_list)];
      }),
      filter(list => list.length > 0),
      mergeMap(links => {
        const request = batchRequestlinkContent(links);
        return from(request).pipe(
          map(formatResponse),
          catchError(err => {
            console.log('[im.edisklink]err', err);
            return from(Promise.resolve([] as EdisklinkInterface[]));
          })
        );
      }),
      map(result =>
        result.reduce(
          (total, current) => ({
            ...total,
            [MD5(current.link).toString()]: current,
          }),
          {} as EdisklinkMapInterface
        )
      )
    );

    return merge($request, $temp).pipe(
      scan(
        (total, current) => ({
          ...total,
          ...current,
        }),
        {} as EdisklinkMapInterface
      )
    );
  }, {} as EdisklinkMapInterface);

  return (
    <Context.Provider
      value={{
        getEdisklinkMap,
        state: edisklinkMap,
      }}
    >
      {children}
    </Context.Provider>
  );
};
