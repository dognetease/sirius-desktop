export type SnsChatId = number | string;

export type OriginMessage = any; // 转化前的原始数据，来自 wa、fb ...

export interface SnsChatItem<T = any, C = any> {
  id: SnsChatId;
  name: string;
  time: string | number | null;
  avatar: string | React.ReactChild | null;
  account: string;
  message: {
    id: SnsChatId;
    text: string;
    originMessage: T;
  } | null;
  unreadCount?: number;
  originContact: C;
}

export enum SnsMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  JSX = 'JSX',
}

export enum SnsMessageDirection {
  SEND = 0,
  RECEIVE = 1,
}

export interface SnsMessageTextContent {
  text: string;
}

export interface SnsMessageImageContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  src: string;
}

export interface SnsMessageVideoContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  src: string;
}

export interface SnsMessageAudioContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  src: string;
}

export interface SnsMessageDocumentContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface SnsMessageJsxContent {
  jsx: React.ReactChild;
}

export type SnsMessageContent =
  | SnsMessageTextContent
  | SnsMessageImageContent
  | SnsMessageVideoContent
  | SnsMessageAudioContent
  | SnsMessageDocumentContent
  | SnsMessageJsxContent;

export interface SnsMessage<T = any> {
  id: number | string;
  name: string;
  time: number;
  type: SnsMessageType;
  avatar?: string | React.ReactChild | null;
  content: SnsMessageContent;
  direction: SnsMessageDirection;
  originMessage: T;
  status?: SnsMessageStatus;
}

export enum SnsMessageStatus {
  ERROR = 'ERROR',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERY = 'DELIVERY',
  SEEN = 'SEEN',
}
