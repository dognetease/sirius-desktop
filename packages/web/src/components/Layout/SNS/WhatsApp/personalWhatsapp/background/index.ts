import mediaHandler from './mediaHandler';
import { checkSyncedMessages, syncMessages } from './syncMessage';

interface IMessageInfo {
  msgId: string;
  sendType: string;
  type: string;
  sendTime: number;
  body: Record<string, any>;
}

interface SyncMessageReq {
  messageList: IMessageInfo[];
  fromSnsId: string;
  fromSnsName: string;

  toSnsId: string;
  toSnsName: string;
  toSnsAvatar?: string;

  companyId?: string;
}

export function arrayToMap(arr: string[]) {
  const map: Record<string, number> = {};
  arr.forEach((k: string) => {
    map[k] = 1;
  });
  return map;
}

export async function handleSyncMessage(data: SyncMessageReq): Promise<string[]> {
  try {
    console.log('handleSyncMessage', data);
    // eslint-disable-next-line prefer-const
    let { companyId, messageList } = data;
    if (!messageList || messageList.length === 0) {
      return [];
    }

    const messageIds = messageList.map(i => i.msgId);
    const unSyncedMessageIds = await checkSyncedMessages(companyId as string, messageIds);
    if (unSyncedMessageIds.length === 0) {
      return messageIds;
    }

    const mapUnSyncedMessages = arrayToMap(unSyncedMessageIds);
    const unSyncedMessageList = messageList.filter(i => !!mapUnSyncedMessages[i.msgId]);

    const promises: Promise<any>[] = [];
    unSyncedMessageList.forEach(msg => {
      switch (msg.type) {
        case 'image':
        case 'video':
        case 'ptt':
        case 'document':
          promises.push(
            mediaHandler({
              mediaKey: msg.body.mediaKey,
              mediaType: msg.type,
              mimeType: msg.body.mimeType,
              hash: msg.body.hash,

              filename: msg.body.filename,
              directPath: msg.body.directPath,
              encFileHash: msg.body.encFileHash,
            }).then(nosUploadInfo => {
              msg.body.nosUploadInfo = nosUploadInfo;
              return nosUploadInfo;
            })
          );
          break;
        default:
          break;
      }
    });
    return Promise.allSettled(promises).then(links => {
      console.log('download all media', unSyncedMessageList, links);
      const messages = unSyncedMessageList.map(item => ({
        messageId: item.msgId,
        exchangeType: item.sendType === 'in' ? 1 : 0, // 0: 发送 1: 接收
        sendTime: item.sendTime * 1000, // timestamp
        messageType: item.type,
        content: JSON.stringify(item.body),
      }));
      // 同步消息
      return syncMessages({
        from: data.fromSnsId,
        fromName: data.fromSnsName,
        to: data.toSnsId,
        toName: data.toSnsName,
        toAvatar: data.toSnsAvatar,
        resourceId: data.companyId!,
        messages,
      }).then(() => messages.map(i => i.messageId));
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
