import { BASE_URL } from './consts';

export interface ReqSyncMessage {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  toAvatar?: string;
  resourceId: string;
  messages: MessageModel[];
}

export interface MessageModel {
  messageId: string;
  exchangeType: number; // 0: 发送 1: 接收
  sendTime: number; // timestamp
  messageType: string;
  content: any;
}

export const getBindInfo = (whatsappId: string) =>
  fetch(`${BASE_URL}/customer/api/biz/wa/getBindCompany`, {
    method: 'POST',
    body: JSON.stringify({
      resourceType: 'company',
      wa: whatsappId,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => res.json())
    .then(res => {
      if (res.success === true) {
        return res.data;
      }
      throw new Error(res.message);
    });

export const checkSyncedMessages = (companyId: string, messageIds: string[]) =>
  fetch(`${BASE_URL}/sns-sender-adapter/api/biz/whatsapp/personal/im/isSync`, {
    method: 'POST',
    body: JSON.stringify({
      resourceId: companyId,
      resourceType: 1,
      messageIds,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => res.json())
    .then(res => {
      if (res.success === true) {
        return res.data;
      }
      throw new Error(res.message);
    });

export const syncMessages = (req: ReqSyncMessage) => {
  const body = {
    ...req,
    resourceType: 1,
    messages: req.messages,
  };
  return fetch(`${BASE_URL}/sns-sender-adapter/api/biz/whatsapp/personal/im/syncMessage`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => res.json())
    .then(res => {
      if (res.success === true) {
        return res.data;
      }
      throw new Error(res.message);
    });
};
