import React, { useEffect, useState, useRef, useCallback } from 'react';
import lodashGet from 'lodash/get';
import { useLocation } from '@reach/router';
import { apiHolder, apis, IMMessage, NIMApi, SystemApi, IMDiscussApi, MailListRes } from 'api';
import debounce from 'lodash/debounce';
import { judgeMsgType } from '@web-im/utils/im_team_util';
import { reduce, initState, MessageAction, FileMessageCustomEvent, MESSAGE_LIMIT, InitStateApi } from './messagesReduce';
import { getParams } from '../../common/navigate';
import { MsgSubtypes } from './msgSubtypes';
import { getIn18Text } from 'api';

export { MessageAction, FileMessageCustomEvent } from './messagesReduce';
interface removeTeamMemberParams {
  yxIdToNickName: Record<string, string>;
  from: string;
  fromNick: string;
  tid: string;
  timestamp: number;
}

type SendMethodNames = 'sendText' | 'sendFile' | 'sendCustomMsg' | 'sendTipMsg';
interface CustomFileApi {
  url: string;
  name: string;
  size?: number | string;
  ext: string;
}
interface FileMsgParamsApi {
  type: 'image' | 'video' | 'audio' | 'file';
  from: string;
  customFile: CustomFileApi;
  blob?: Blob;
  fileInput?: HTMLInputElement | string;
  [key: string]: any;
}
interface RequestMsgApi {
  sessionId: string;
  start?: number;
  end?: number;
  desc?: boolean;
  limit?: number;
}
const getFileDesc = (param: FileMsgParamsApi) => {
  const typeDesc = {
    image: '[图片]',
    video: '[视频]',
    audio: '[音频]',
    file: '[文件]',
  };
  if (param.type !== 'file') {
    return typeDesc[param.type];
  }
  return `${typeDesc[param.type]}${param.customFile.name}`;
};
interface MessageContextApi {
  state: InitStateApi;
  dispatch: React.Dispatch<any>;
  getMoreMsgs(options: RequestMsgApi[] | RequestMsgApi, isFetchHistory?: boolean): Promise<IMMessage[]>;
  sendTextMessage(options: any): Promise<any>;
  sendFileMessage(options: FileMsgParamsApi): Promise<any>;
  sendCustomMessage(options: any): Promise<any>;
  drawMsg(msg: IMMessage, isTeamDiscuss?: boolean): Promise<any>;
  updateLocalMsg(msg: IMMessage, key: string, val: any): void;
  deleteLocalMsg(msg: IMMessage, isDispatch?: boolean): Promise<any>;
  updateSelectState(sessionId?: string): void;
  setSelectMsgs(msgIdClient: string): void;
  getSelectMsgs(): string[] | null;
  getMailList(): Promise<void>;
  mailListCount?: number;
  mailList?: MailListRes['msgs'];
}
export const Context = React.createContext({} as MessageContextApi);
const nimApi: NIMApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi() as SystemApi;
const discussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as IMDiscussApi;
const createProgressFunction = function (eventName, customIdClient) {
  return (...args) => {
    nimApi.emitCustomEvent(eventName, customIdClient, ...args);
  };
};
export const Provider = props => {
  const [state, dispatch] = React.useReducer(reduce, initState);
  const [newMsgs, setNewMsgs] = useState<IMMessage[]>([]);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [selectList, setSelectList] = useState<string[]>([]);
  const [mailListCount, setMailListCount] = useState<number>(0);
  const [mailList, setMailList] = useState<MailListRes['msgs']>([]);
  const location = useLocation();
  const curSessionId = getParams(location.hash, 'sessionId');
  const curMode = getParams(location.hash, 'mode');
  const isMountedRef = useRef<boolean>(true);

  const mergeMsgs = useCallback(async () => {
    // 异常场景:有可能是这个用户刚才了一条消息.立马切换了会话 这个时候上个会话的发送状态才返回.需要规避这个场景
    /**
     * * 异常场景
     * * 1.这个用户刚才了一条消息
     * * 2.立马切换了会话
     * * 3.这个时候上个会话的发送状态才返回(可能是网络慢 可能是file消息耗时长)
     * * 解决方法:如果当前这条消息不是此会话的不执行插入
     * */
    const unMergedMsgs = newMsgs.filter(item => item.sessionId === curSessionId);
    // @ts-ignore
    const mergedMsgs = nimApi.mergeMsgs(state.msgList, unMergedMsgs);
    dispatch({
      type: MessageAction.PREPEND_MSGS,
      payload: {
        msgList: mergedMsgs,
      },
    });
    setNewMsgs([]);
  }, [newMsgs.length]);

  useEffect(() => {
    if (!newMsgs.length) {
      return;
    }
    mergeMsgs();
  }, [newMsgs.length]);
  // 获取群内邮件列表
  const getMailList = async () => {
    try {
      const { success, data } = await discussApi.getDiscussMail({ teamId: curSessionId ? curSessionId.split('-')[1] ?? '' : '' });
      if (success && data != null) {
        const { total, msgs } = data;
        setMailListCount(total);
        setMailList(msgs);
      }
    } catch (err) {}
  };
  // 删除本地消息
  const deleteLocalMsg = async (msg: IMMessage, isDispatch = true) => {
    // const scene = msg.scene;
    // const to = msg.scene === 'team' ? msg.to : msg.flow === 'out' ? msg.to : msg.from;
    try {
      await nimApi.excute('deleteMsgSelf', { msg });
    } catch (ex) {
      nimApi.excute('deleteLocalMsg', { msg });
    }

    // await nimApi.excute('deleteLocalMsgsBySession', {
    //   msg,
    // });
    if (isDispatch) {
      dispatch({
        type: MessageAction.DELETE_MSG,
        payload: {
          idClient: msg.idClient,
        },
      });
    }
  };
  let newMsgList: IMMessage[] = [];
  const debounceSetNewMsgs = debounce(() => {
    if (newMsgList.length > 0) {
      setNewMsgs(state => [...state, ...newMsgList]);
      newMsgList = [];
    }
  }, 20);
  // 包装nimApi.sendMessage方法
  const sendBasicMessage = async (methodName: SendMethodNames, options, mapFunc?: (IMMessage) => IMMessage): Promise<IMMessage> =>
    new Promise(async (resolve, reject) => {
      const msg = await nimApi.excute(methodName, {
        needMsgReceipt: true,
        isPushable: false,
        needReturn: true,
        done: async (error, result: IMMessage) => {
          newMsgList.push(typeof mapFunc === 'function' ? mapFunc(result) : result);
          debounceSetNewMsgs();
          if (error instanceof Error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
        ...options,
      });
      if (lodashGet(msg, 'idClient.length', 0) !== 0) {
        newMsgList.push(typeof mapFunc === 'function' ? mapFunc(msg) : msg);
        debounceSetNewMsgs();
      }
    });
  const sendCustomMessage = async options => sendBasicMessage('sendCustomMsg', options);
  // 发送文本消息
  const sendTextMessage = async options => sendBasicMessage('sendText', options);
  // 发送文本类消息方法
  const sendFileMessage = async (options: FileMsgParamsApi) => {
    const typeMap = {
      image: 'LOCAL_UPLOADING_IMG',
      video: 'LOCAL_UPLOADING_VIDEO',
    };
    // 创建一个自定义的idClient
    const customKeyId = systemApi.md5(`${Math.random()}`);
    const localCustomMsg = await sendBasicMessage('sendCustomMsg', {
      ...options,
      idClient: customKeyId,
      isLocal: true,
      content: JSON.stringify({
        type: typeMap[options.type] || 'LOCAL_UPLOADING_FILE',
        data: options.customFile,
      }),
    });
    const file = await nimApi.excute('previewFile', {
      type: options.type,
      blob: options.blob,
      beginupload: createProgressFunction(FileMessageCustomEvent.BEGIN_UPLOAD, customKeyId),
      uploadprogress: createProgressFunction(FileMessageCustomEvent.UPLOAD_PROGRESS, customKeyId),
    });
    // 查询当前自定义消息是否还存在 如果不存在 有可能是已经被删除了
    /**
     * 这个逻辑只针对file生效。上传未完成的会话重新切入之后上传没有办法中断.所以会直接吧消息给删除掉。如果上传完成之后检测到之后
     */
    const { msg } = (await nimApi.excute('getLocalMsgByIdClient', {
      idClient: localCustomMsg.idClient,
    })) as {
      msg: IMMessage;
    };
    if (!msg) {
      return Promise.resolve();
    }
    // 删除自定义文件消息
    // @ts-ignore
    const replyOption: Record<{
      reply: IMMessage;
    }> = {};
    if (lodashGet(msg, 'replyMsgIdClient.length', 0) !== 0) {
      const { msg: replyMsg } = (await nimApi.excute('getLocalMsgByIdClient', {
        idClient: msg.replyMsgIdClient,
      })) as {
        msg: IMMessage;
      };
      replyOption.replyMsg = replyMsg;
    }
    await deleteLocalMsg(localCustomMsg);
    ['fileInput', 'filePath', 'blob'].forEach(key => {
      Reflect.deleteProperty(options, key);
    });
    // 需要从历史消息中继承一些信息 比方说reply
    // 给正式的图片消息添加一个本地的URL
    return sendBasicMessage(
      'sendFile',
      {
        file,
        text: getFileDesc(options),
        ...options,
        ...replyOption,
      },
      state => {
        if (options.type === 'image') {
          state.localUrl = options.customFile.url;
        }
        return state;
      }
    );
  };
  // 获取本地消息
  const fetchLocalMsg = async (options = {}, requestRemote = false) => {
    options = {
      sessionId: curSessionId as string,
      desc: true,
      limit: MESSAGE_LIMIT,
      ...options,
    };
    const results = await nimApi.excute('getLocalMsgs', options);

    let hasRetryHistoryMode = false;

    if (results.msgs.length < (options.limit as number) && requestRemote) {
      const [scene, to] = (curSessionId as string).split('-');
      const len = Math.max((options.limit as number) - results.msgs.length, 1);
      hasRetryHistoryMode = true;
      const getHistoryOptions = {
        scene,
        to,
        [Number.isSafeInteger(options.end) ? 'endTime' : 'myEndTime']: options.end,
        [Number.isSafeInteger(options.start) ? 'beginTime' : 'myBeginTime']: options.start,
        limit: len,
        reverse: !options.desc,
      };
      const historyMsgs = await nimApi.excute('getHistoryMsgs', getHistoryOptions);

      // @ts-ignore
      results.msgs = await nimApi.mergeMsgs(results.msgs, historyMsgs.msgs);
      results.msgs = results.msgs.filter(msg => {
        const shouldIgnore = lodashGet(msg, 'attach.type', '') === 'updateTeam' && lodashGet(msg, 'attach.team.serverCustom', '');
        const shouldRemoveMember = lodashGet(msg, 'attach.type', '') === 'removeTeamMembers';

        return !shouldIgnore && !shouldRemoveMember;
      });
    }

    // 新增一种查找历史消息的case(暂时也不优化逻辑 只新增一个处理case)
    // 向下查找的时候的时候找到的第一条消息和当前options.start不一致.表示results.msgs当前时间之间消息有丢失(转历史消息了)
    // 同时拉历史消息有频率限制一次请求只执行一次
    if (
      !hasRetryHistoryMode &&
      !options.desc &&
      lodashGet(results, 'msgs.length', 0) !== 0 &&
      Number.isSafeInteger(options.start) &&
      lodashGet(results, 'msgs[0].time', 0) !== options.start
    ) {
      const [scene, to] = (curSessionId as string).split('-');
      const getHistoryOptions = {
        scene,
        to,
        beginTime: options.start,
        limit: options.limit,
        reverse: true,
      };
      const historyMsgs = await nimApi.excute('getHistoryMsgs', getHistoryOptions);
      // historyMsgs和results.msgs不能进行合并 会导致中间有部分消息丢失
      results.msgs = historyMsgs.msgs.filter(msg => {
        const shouldIgnore = lodashGet(msg, 'attach.type', '') === 'updateTeam' && lodashGet(msg, 'attach.team.serverCustom', '');
        const shouldRemoveMember = lodashGet(msg, 'attach.type', '') === 'removeTeamMembers';

        return !shouldIgnore && !shouldRemoveMember;
      });
    }

    return results.msgs.map(item => {
      item.sourceType = 'pull';
      return item;
    });
  };
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // 初始化当前会话消息
  const getMoreMsgs = async (options: RequestMsgApi, isFetchHistory = false) => {
    let results: IMMessage[] = [];
    if (lodashGet(options, 'limit', MESSAGE_LIMIT) > 100) {
      let limit = lodashGet(options, 'limit', MESSAGE_LIMIT) as number;
      let promise: Promise<IMMessage[]> = Promise.resolve([]);
      while (limit >= 0) {
        const unitLimit = Math.min(limit, MESSAGE_LIMIT);
        promise = promise.then(async list => {
          let remainList: IMMessage[] = [];
          remainList = await fetchLocalMsg(
            {
              ...options,
              limit: unitLimit,
              /**
               * * desc=false 从begin开始向后查找
               * * desc=true|default 从end开始向前查找
               * *
               **/
              [options.desc === false ? 'start' : 'end']: lodashGet(list, `${list.length - 1}.time`, options.desc === false ? 0 : Infinity),
            },
            isFetchHistory
          );
          return [...list, ...remainList];
        });
        limit -= MESSAGE_LIMIT;
      }
      results = await promise;
    } else {
      results = await fetchLocalMsg(options, isFetchHistory);
    }
    if (isMountedRef.current) {
      setNewMsgs(state => [...state, ...results]);
    }
    return Promise.resolve(results);
  };
  // 更新消息多选状态
  const updateSelectState = (sessionId?: string) => {
    if (!sessionId) {
      setSelectList([]);
      setSelecting(false);
      return;
    }
    setSelectList([sessionId]);
    setSelecting(true);
  };
  // 更新多选选中状态
  const setSelectMsgs = (msgIdClient: string) => {
    if (selectList.includes(msgIdClient)) {
      setSelectList(pre => pre.filter(item => item !== msgIdClient));
    } else {
      const newSelectList = [...selectList];
      newSelectList.push(msgIdClient);
      setSelectList(newSelectList);
    }
  };
  // 获取选中消息id列表
  const getSelectMsgs = () => {
    if (!selecting) {
      return null;
    }
    return selectList;
  };
  // 撤回消息
  const drawMsg = async (msg: IMMessage, isTeamDiscuss?: boolean) => {
    // 如果是讨论组邮件消息撤回，先调服务端接口解除与讨论组的绑定，成功后再调云信
    if (isTeamDiscuss && judgeMsgType(msg, 'type', 1014) && judgeMsgType(msg, 'customMsgType', 2000)) {
      const params = {
        teamId: msg?.to || '',
        msgId: msg?.idServer || '',
      };
      const cancelRes = await discussApi.cancelDiscussBind(params);
      if (!cancelRes?.data?.result) {
        throw Error(getIn18Text('XIAOXICHEHUISHI'));
      }
    }
    await nimApi.excute('deleteMsg', {
      msg,
    });
    let accounts: string[] = [];
    // 需要吧被@人的信息给存下来 二次编辑的时候要使用
    if (Reflect.has(msg, 'apns') && lodashGet(msg, 'apns.accounts.length', 0) === 0) {
      accounts.push('all');
      try {
        const { mentions } = JSON.parse(msg.custom as string);
        accounts = [...accounts, ...mentions];
      } catch (ex) {}
    } else if (Reflect.has(msg, 'apns') && lodashGet(msg, 'apns.accounts.length', 0) !== 0) {
      accounts = [...accounts, ...(msg.apns?.accounts as string[])];
    }
    const customDrawedInfo =
      msg.type === 'text'
        ? {
            drawedMsgText: msg.text,
            drawedMsgAccounts: accounts,
            drawedTimestmap: new Date().getTime(),
          }
        : {};
    sendBasicMessage('sendTipMsg', {
      scene: msg.scene === 'p2p' ? 'p2p' : 'team',
      idClient: msg.idClient,
      custom: {
        ...customDrawedInfo,
      },
      subType: msg.type === 'text' ? MsgSubtypes.DRAW_TEXT_MSG : MsgSubtypes.DRAW_MSG,
      localFrom: msg.from,
      time: msg.time,
      to: msg.to,
      tip: getIn18Text('CHEHUILEYITIAO'),
      isLocal: true,
    });
  };
  const onmsg = msg => {
    if (curSessionId !== msg.sessionId && curMode !== 'normal') {
      return;
    }
    newMsgList.push(msg);
    debounceSetNewMsgs();
  };
  const appendDeleteMsg = async (msg: IMMessage) => {
    const localMsg = await nimApi.excute('sendTipMsg', {
      scene: msg.scene,
      to: msg.to,
      custom: {},
      tip: getIn18Text('CHEHUILEYITIAO'),
      localFrom: msg.from,
      time: msg.time,
      isLocal: true,
      idClient: msg.idClient,
      subType: MsgSubtypes.DRAWN_MSG,
    });
    if (curSessionId === msg.sessionId && curMode === 'normal') {
      newMsgList.push(localMsg);
      debounceSetNewMsgs();
    }
    // 如果处于消息多选状态并且撤回消息被选中，则删除选中列表的这条消息id
    if (selectList.length > 0 && selectList.includes(msg.idClient)) {
      setSelectList(pre => pre.filter(item => item !== msg.idClient));
    }
  };
  const onsysmsg = async sysMsg => {
    const { type, msg } = sysMsg;
    switch (type) {
      case 'deleteMsg':
        appendDeleteMsg(msg);
        break;
      default:
        break;
    }
  };
  // 重连成功之后拉最新的一百条消息
  const [$t, setRepullHandle] = useState<ReturnType<typeof setInterval> | false>(false);
  const onconnect = () => {
    if (curMode !== 'normal') {
      return;
    }
    let count = 0;
    const _t = setInterval(() => {
      if (count >= 3) {
        clearInterval(_t);
      }
      getMoreMsgs({
        sessionId: curSessionId as string,
        end: Infinity,
      });
      count += 1;
    }, 2000);
    setRepullHandle(_t);
  };

  // 移除群成员自定义消息
  const insertRemoveMemberMsg = async (params: removeTeamMemberParams) => {
    const { from, fromNick, tid: teamId, yxIdToNickName } = typeof params === 'string' ? JSON.parse(params) : params;
    const removeNicks = Object.values(yxIdToNickName);
    const removeAccounts = Object.keys(yxIdToNickName);
    if (curSessionId !== `team-${teamId}` || curMode !== 'normal') {
      return;
    }

    const msg = await nimApi.excute('sendTipMsg', {
      scene: 'team',
      to: teamId,
      custom: {
        from,
        removeAccounts,
        fromNick: fromNick,
        removeNicks,
      },
      isLocal: true,
      tip: `${fromNick}将${removeNicks.join('、')} 移出群组`,
      subType: MsgSubtypes.REMOVE_TEAMMEBER,
    });
    newMsgList.push(msg);
    debounceSetNewMsgs();
  };

  const oncustomsysmsg = (sysContent: { content: string }) => {
    let subType: string = '';
    let parsedContent: {
      subType: string;
      data: unknown;
    } = {
      subType: '',
      data: undefined,
    };
    try {
      parsedContent = JSON.parse(sysContent.content as string) as {
        subType: string;
        data: unknown;
      };
      subType = parsedContent.subType;
    } catch (ex) {}
    switch (subType) {
      case 'mail_msg':
        getMailList();
        break;
      case 'team_kick': {
        insertRemoveMemberMsg(parsedContent.data as removeTeamMemberParams);
        break;
      }
      default:
        break;
    }
  };
  // 清除interval 避免聊天被销毁了还定时获取数据
  useEffect(
    () => () => {
      $t && clearInterval($t);
    },
    []
  );
  useEffect(() => {
    if (curMode === 'normal') {
      nimApi.subscrible('onmsg', onmsg);
      nimApi.subscrible('onconnect', onconnect);
    }
    nimApi.subscrible('oncustomsysmsg', oncustomsysmsg);
    return () => {
      nimApi.unSubcrible('onmsg', onmsg);
      nimApi.unSubcrible('onconnect', onconnect);
      nimApi.unSubcrible('oncustomsysmsg', oncustomsysmsg);
    };
  }, []);
  useEffect(() => {
    if (curMode === 'normal') {
      nimApi.subscrible('onsysmsg', onsysmsg);
    }
    return () => {
      nimApi.unSubcrible('onsysmsg', onsysmsg);
    };
  }, [selectList]);
  /**
   * 更新本地消息
   * 用途:文本消息正则匹配之后的结果存储,避免二次匹配
   * 用户快捷回复的数据可以更新到本地,避免重复拉取(但是JSON字符串需要考虑数据响应的问题)
   */
  const updateLocalMsg = (msg: IMMessage, key: string, value: any) => {
    let localCustom = {};
    try {
      localCustom = JSON.parse(msg.localCustom || '');
    } catch (ex) {}
    nimApi.excute('updateLocalMsg', {
      idClient: msg.idClient,
      localCustom: JSON.stringify({
        ...localCustom,
        [key]: value,
      }),
    });
  };
  // 获取当前会话第一条消息
  useEffect(() => {
    let isMounted = true;
    nimApi
      .excute('getLocalMsgs', {
        desc: false,
        limit: 1,
      })
      .then(res => {
        if (!isMounted) return;
        const oldestMsgTime = lodashGet(res, 'msgs[0].time');
        dispatch({
          type: MessageAction.UPDATE_OLDEST_MSGTIME,
          payload: {
            timestamp: oldestMsgTime,
          },
        });
      });
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        getMoreMsgs,
        sendTextMessage,
        sendCustomMessage,
        sendFileMessage,
        drawMsg,
        updateLocalMsg,
        deleteLocalMsg,
        updateSelectState,
        setSelectMsgs,
        getSelectMsgs,
        getMailList,
        mailListCount,
        mailList,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
