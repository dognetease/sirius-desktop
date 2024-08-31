import { IMMessage } from 'api';
import lodashGet from 'lodash/get';
import { findTag, addTimelineTag, addTimeline } from '../../common/timeline';

export interface InitStateApi {
  hasPrev: boolean; // 是否有历史数据
  oldestMsgTime: number;
  msgList: IMMessage[]; // 消息列表
}

export enum MessageAction {
  UPDATE_OLDEST_MSGTIME,
  RESET_SESSION, // 重置session
  PREPEND_MSGS, // prepend消息
  INIT_MSGS, // 初始化消息
  PUSH_MSG, // 追加消息
  REPLACE_MSG, // 替换消息
  UPDATE_READS, // 更新已读未读状态
  DELETE_MSG, // 删除消息
  UNSHIFT_MSG, // unshift消息
  ADD_REPLY_MSG,
  MERGE_MSGS, // 合并消息
}

export enum FileMessageCustomEvent {
  BEGIN_UPLOAD,
  UPLOAD_PROGRESS,
  UPLOAD_COMPLETE,
  BEFORE_SEND,
}

// 去除重复数据(暂时不考虑数据位置的问题)
const removeDuplicateMsg = (msglist: IMMessage[]): IMMessage[] => {
  const idClients = new Set<string>([]);
  return msglist.filter(item => {
    if (idClients.has(item.idClient)) {
      return false;
    }
    idClients.add(item.idClient);
    return true;
  });
};

export const reduce = (state, action) => {
  const { type, payload } = action;
  const newState = { ...{}, ...state };

  switch (type) {
    case MessageAction.UPDATE_OLDEST_MSGTIME:
      newState.oldestMsgTime = payload.timestamp;
      newState.hasPrev = lodashGet(newState, 'msgList[0].time', 0) > payload.timestamp;
      break;
    case MessageAction.RESET_SESSION:
      newState.msgList = [];
      break;
    case MessageAction.PREPEND_MSGS:
      newState.hasPrev = lodashGet(payload, 'msgList[0].time', 0) > newState.oldestMsgTime;
      const msglistAddedTimelinetag = addTimeline(payload.msgList);
      newState.msgList = msglistAddedTimelinetag;
      break;
    case MessageAction.INIT_MSGS:
      newState.hasPrev = true;
      break;
    case MessageAction.PUSH_MSG:
      const { timeTagIndex: addTagIndex, timeTagValue: addTagValue } = findTag(state.msgList);
      const [aMsgAddedTimeline] = addTimelineTag([payload.msg], addTagValue, addTagIndex);
      newState.msgList.push(aMsgAddedTimeline);
      newState.msgList = removeDuplicateMsg(newState.msgList);
      break;
    case MessageAction.REPLACE_MSG:
      const index = newState.msgList.findIndex(item => item.idClient === payload.msg.idClient);
      const { timeTagIndex: replaceIndex, timeTagValue: replaceVal } = findTag(state.msgList, index - 1);
      const [rMsgAddedTimeline] = addTimelineTag([payload.msg], replaceVal, replaceIndex);
      newState.msgList.splice(index, 1, rMsgAddedTimeline);
      break;
    case MessageAction.DELETE_MSG:
      newState.msgList.splice(
        state.msgList.findIndex(item => item.idClient === payload.idClient),
        1
      );
      break;
    default:
      break;
  }

  console.log('[message]', newState);
  // 过滤忽略信息(CREATE_CONVERSATION_MSG是为了保证会话可以创建成功发送的兜底本地消息)
  newState.msgList = newState.msgList.filter((item: IMMessage) => {
    return lodashGet(item, 'text', '') !== 'CREATE_CONVERSATION_MSG';
  });
  return newState;
};
// 一次拉取100条消息记录
export const MESSAGE_LIMIT = 30;
export const initState: InitStateApi = {
  hasPrev: true,
  oldestMsgTime: Infinity,
  msgList: [],
};
