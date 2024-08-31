import React from 'react';

export enum SnsImPlatform {
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  INSTAGRAM = 'INSTAGRAM',
}

export enum SnsImMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  JSX = 'JSX',
}

export interface SnsImMessageFile {
  src: string;
  fileName?: string;
  fileSize?: number;
  // fileType?: string;
}

export enum SnsImMessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  ERROR = 'ERROR',
  DELIVERED = 'DELIVERED',
  SEEN = 'SEEN',
}

export enum SnsImMessageDirection {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
}

export type SnsImAvatar = string | React.ReactChild;

export interface SnsImMessage<M = any> {
  isTemp?: boolean;
  chatId: string;
  accountName: string;
  accountAvatar?: SnsImAvatar;
  contactName: string;
  contactAvatar?: SnsImAvatar;
  messageId: string;
  messageText?: string;
  messageType: SnsImMessageType;
  messageFile?: SnsImMessageFile;
  messageJsx?: React.ReactChild;
  messageTime: number;
  messageStatus: SnsImMessageStatus;
  messageDirection: SnsImMessageDirection;
  quoteMessageId?: string;
  rawData: M;
}

export interface SnsImChat<C = any, M = any> {
  chatId: string;
  chatTime: number;
  platform?: SnsImPlatform;
  accountName: string;
  accountAvatar?: SnsImAvatar;
  contactName: string;
  contactAvatar?: SnsImAvatar;
  contactDescription?: string;
  latestMessage?: SnsImMessage<M>;
  latestReceivedMessageTime?: number;
  unreadCount?: number;
  rawData: C;
}

export enum SnsImLoadDirection {
  EARLIER = 'EARLIER',
  NEWER = 'NEWER',
}

export interface SnsImRules {
  textMaxLength: number;
  imageSupport: boolean;
  imageTypes: string[]; // ['jpg', 'png', ...]
  imageMaxSize: number;
  videoSupport: boolean;
  videoTypes: string[]; // ['mp4', ...]
  videoMaxSize: number;
  fileSupport: boolean;
  fileTypes: string[] | true; // ['pdf', ...]
  fileMaxSize: number;
}

export interface SnsImApp<C = any, M = any, F = any> {
  init: (filter?: F | null) => Promise<void>;
  initAround: (chatId: string, filter?: F | null) => Promise<void>;
  destory: () => void;
  refresh: (chatIds: string[]) => void;
  setChat: (chatId: string) => void;
  setFilter: (filter: F | null) => void;
  getChat: () => SnsImChat<C, M> | null;
  getChatId: () => string | null;
  getMessageList: () => SnsImMessage<M>[] | [];
  getState: () => SnsImAppState | null;
  updateMessage: (chatId: string, messageId: string, payload: Partial<SnsImMessage>) => void;
}

export interface SnsImConfig<C = any, M = any, F = any> {
  appId: string;
  rules?: Partial<SnsImRules>;
  chatListClassName?: string;
  chatContentClassName?: string;
  chatLimit24Hour?: boolean;
  disabledSend?: boolean;
  chatListFilter?: (chat: SnsImChat<C, M>) => boolean;
  chatListEmptyTitle?: string;
  chatListEmptyTip?: string;
  chatContentEmptyTitle?: string;
  chatContentEmptyTip?: string;
  showBackTop?: boolean;
  chatSorter?: (a: SnsImChat<C, M>, b: SnsImChat<C, M>) => number;
  messageSorter?: (a: SnsImMessage<M>, b: SnsImMessage<M>) => number;
  renderChat?: (chat: SnsImChat<C, M>) => React.ReactChild;
  renderChatListEmpty?: () => React.ReactChild;
  renderChatPlaceholder?: (chat: SnsImChat<C, M>) => string;
  renderChatContentEmpty?: () => React.ReactChild;
  renderMessage?: (message: SnsImMessage<M>) => React.ReactChild;
  renderSidebarContent?: (chat: SnsImChat<C, M>) => React.ReactChild;
  customMessageText?: (message: SnsImMessage<M>) => string;
  customTempMessage?: (message: SnsImMessage<M>) => SnsImMessage<M>;
  onChatLoad: (
    cursor: SnsImChat<C, M> | null,
    direction: SnsImLoadDirection,
    filter: F | null
  ) => Promise<{ chatList: SnsImChat<C, M>[]; hasMore: boolean; unreadCount: number }>;
  onChatInitAround?: (chatId: string, filter?: F | null) => Promise<{ chatList: SnsImChat<C, M>[]; earlierHasMore: boolean; newerHasMore: boolean; unreadCount: number }>;
  onFileUpload: (chat: SnsImChat<C, M>, file: File) => Promise<{ src: string }>;
  onMessageSend: (chat: SnsImChat<C, M>, message: SnsImMessage<M>) => Promise<{ message: SnsImMessage<M> }>;
  onMessageLoad: (chat: SnsImChat<C, M>, cursor: SnsImMessage<M> | null, direction: SnsImLoadDirection) => Promise<{ messageList: SnsImMessage<M>[]; hasMore: boolean }>;
  onMessageRead?: (chat: SnsImChat<C, M>) => Promise<void>;
  onChatRefresh: (chatIds: string[], filter: F | null) => Promise<{ chatList: SnsImChat[]; unreadCount: number }>;
}

export interface SnsImAppState<C = any, M = any> {
  filter: any;
  unreadCount: number;
  chatId: string | null;
  chatList: SnsImChat<C, M>[];
  chatIniting: Boolean;
  chatHasMore: Record<SnsImLoadDirection, boolean>;
  chatLoading: Record<SnsImLoadDirection, boolean>;
  chatContentMap: Record<string, SnsImChatContent<M>>;
}

export interface SnsImChatContent<M = any> {
  messageList: SnsImMessage<M>[];
  messageInited: Boolean;
  messageIniting: Boolean;
  messageHasMore: Record<SnsImLoadDirection, boolean>;
  messageLoading: Record<SnsImLoadDirection, boolean>;
}
