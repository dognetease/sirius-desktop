import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { SnsImAppState, SnsImChat, SnsImChatContent, SnsImLoadDirection, SnsImMessage, SnsImMessageFile } from '@web-sns-im';

type SnsImStore = Record<string, SnsImAppState>;

const initialState: Record<string, SnsImAppState> = {};

const initialDirection = {
  [SnsImLoadDirection.NEWER]: false,
  [SnsImLoadDirection.EARLIER]: false,
};

const initialApp: SnsImAppState = {
  filter: null,
  unreadCount: 0,
  chatId: null,
  chatList: [],
  chatIniting: false,
  chatHasMore: { ...initialDirection },
  chatLoading: { ...initialDirection },
  chatContentMap: {},
};

const snsImSlicer = createSlice({
  name: 'snsImSlicer',
  initialState,
  reducers: {
    init: (state, action: PayloadAction<{ appId: string }>) => {
      const { appId } = action.payload;

      state[appId] = { ...initialApp };
    },
    destory: (state, action: PayloadAction<{ appId: string }>) => {
      const { appId } = action.payload;
      const app = state[appId];

      if (app) {
        delete state[appId];
      }
    },
    update: (
      state,
      action: PayloadAction<{
        appId: string;
        payload: Partial<SnsImAppState>;
      }>
    ) => {
      const { appId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        state[appId] = { ...app, ...payload };
      }
    },
    updateChatHasMore: (
      state,
      action: PayloadAction<{
        appId: string;
        payload: Partial<Record<SnsImLoadDirection, boolean>>;
      }>
    ) => {
      const { appId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        state[appId].chatHasMore = {
          ...state[appId].chatHasMore,
          ...payload,
        };
      }
    },
    updateChatLoading: (
      state,
      action: PayloadAction<{
        appId: string;
        payload: Partial<Record<SnsImLoadDirection, boolean>>;
      }>
    ) => {
      const { appId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        state[appId].chatLoading = {
          ...state[appId].chatLoading,
          ...payload,
        };
      }
    },
    updateChat: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        payload: Partial<SnsImChat>;
      }>
    ) => {
      const { appId, chatId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        state[appId].chatList = state[appId].chatList.map(item => {
          if (item.chatId !== chatId) return item;

          return {
            ...item,
            ...payload,
          };
        });
      }
    },
    insertChat: (
      state,
      action: PayloadAction<{
        appId: string;
        chatList: SnsImChat[];
        chatSorter: (a: SnsImChat, b: SnsImChat) => number;
      }>
    ) => {
      const { appId, chatList, chatSorter } = action.payload;
      const app = state[appId];

      if (app) {
        const chatListMap = [...state[appId].chatList, ...chatList].reduce((accumulator, chat) => {
          // 如果不存在, 或存在过时的数据, 则用新对话更新
          if (!accumulator[chat.chatId] || accumulator[chat.chatId].chatTime <= chat.chatTime) {
            accumulator[chat.chatId] = chat;
          }
          return accumulator;
        }, {} as Record<string, SnsImChat>);

        state[appId].chatList = Object.values(chatListMap).sort(chatSorter);
      }
    },
    updateChatContent: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        payload: Partial<SnsImChatContent>;
      }>
    ) => {
      const { appId, chatId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          state[appId].chatContentMap = {
            ...state[appId].chatContentMap,
            [chatId]: {
              ...state[appId].chatContentMap[chatId],
              ...payload,
            },
          };
        }
      }
    },
    updateChatContentMap: (
      state,
      action: PayloadAction<{
        appId: string;
        payload: Record<string, SnsImChatContent>;
      }>
    ) => {
      const { appId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        state[appId].chatContentMap = {
          ...state[appId].chatContentMap,
          ...payload,
        };
      }
    },
    updateMessageHasMore: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        payload: Partial<Record<SnsImLoadDirection, boolean>>;
      }>
    ) => {
      const { appId, chatId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          state[appId].chatContentMap[chatId].messageHasMore = {
            ...state[appId].chatContentMap[chatId].messageHasMore,
            ...payload,
          };
        }
      }
    },
    updateMessageLoading: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        payload: Partial<Record<SnsImLoadDirection, boolean>>;
      }>
    ) => {
      const { appId, chatId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          state[appId].chatContentMap[chatId].messageLoading = {
            ...state[appId].chatContentMap[chatId].messageLoading,
            ...payload,
          };
        }
      }
    },
    insertMessage: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        direction: SnsImLoadDirection;
        messageList: SnsImMessage[];
      }>
    ) => {
      const { appId, chatId, direction, messageList } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          if (direction === SnsImLoadDirection.EARLIER) {
            state[appId].chatContentMap[chatId].messageList = [...messageList, ...state[appId].chatContentMap[chatId].messageList];
          }
          if (direction === SnsImLoadDirection.NEWER) {
            state[appId].chatContentMap[chatId].messageList = [...state[appId].chatContentMap[chatId].messageList, ...messageList];
          }
        }
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        messageId: string;
        payload: Partial<SnsImMessage>;
      }>
    ) => {
      const { appId, chatId, messageId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          // 存在 payload.messageId, 可能是临时消息发送完成后, 替换的场景
          // 需要判断如果 messageList 已经存在相同 messageId (服务端的推送早于发送消息的响应), 就不再执行
          const { messageList } = chatContent;
          const hasUpdatedFromServer = messageList.some(item => item.messageId === payload.messageId);

          if (!hasUpdatedFromServer) {
            state[appId].chatContentMap[chatId].messageList = state[appId].chatContentMap[chatId].messageList.map(item => {
              if (item.messageId !== messageId) return item;

              return {
                ...item,
                ...payload,
              };
            });
          }
        }
      }
    },
    updateMessageFile: (
      state,
      action: PayloadAction<{
        appId: string;
        chatId: string;
        messageId: string;
        payload: Partial<SnsImMessageFile>;
      }>
    ) => {
      const { appId, chatId, messageId, payload } = action.payload;
      const app = state[appId];

      if (app) {
        const chatContent = state[appId].chatContentMap[chatId];

        if (chatContent) {
          state[appId].chatContentMap[chatId].messageList = state[appId].chatContentMap[chatId].messageList.map(item => {
            if (item.messageId !== messageId) return item;
            if (!item.messageFile) return item;

            return {
              ...item,
              messageFile: {
                ...item.messageFile,
                ...payload,
              },
            };
          });
        }
      }
    },
  },
  extraReducers(builder) {
    builder;
  },
});

export const getApp = createSelector(
  (state: SnsImStore, appId: string) => {
    return state[appId] || null;
  },
  (app: SnsImAppState | null) => app
);

export const { actions } = snsImSlicer;

export default snsImSlicer.reducer;
