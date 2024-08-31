import React, { useRef } from 'react';
import { SnsImApp, SnsImConfig, SnsImAppState, SnsImLoadDirection, SnsImChat, SnsImMessageStatus, SnsImMessage, SnsImChatContent } from '../types';
import { getApp } from '@web-common/state/reducer/snsImReducer';
import { SnsImActions } from '@web-common/state/reducer';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { ChatList, ChatListMethods } from '../components/ChatList';
import { ChatContent } from '../components/ChatContent';
import { mergeWithDefaultRules, extractFileToMessage, createTempMessage, getLatestNonTempMessage } from '../utils';
import { useLimit24Hour } from './useLimit24Hour';

interface ComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

function useSnsIm<C, M, F>(
  config: SnsImConfig<C, M, F>
): {
  im: SnsImApp<C, M, F>;
  chatList: React.ReactElement;
  chatContent: React.ReactElement;
} {
  const {
    appId,
    rules: rulesFromConfig,
    chatListClassName,
    chatContentClassName,
    chatLimit24Hour = true,
    chatSorter: chatSorterFromConfig,
    messageSorter: messageSorterFromConfig,
    disabledSend,
    chatListFilter,
    chatListEmptyTitle,
    chatListEmptyTip,
    chatContentEmptyTitle,
    chatContentEmptyTip,
    showBackTop,
    renderChat,
    renderChatListEmpty,
    renderChatPlaceholder,
    renderChatContentEmpty,
    renderMessage,
    renderSidebarContent,
    customMessageText,
    customTempMessage,
    onChatLoad,
    onChatInitAround,
    onFileUpload,
    onMessageSend,
    onMessageLoad,
    onMessageRead,
    onChatRefresh,
  } = config;

  const rules = mergeWithDefaultRules(rulesFromConfig);
  const chatSorter = chatSorterFromConfig || ((a, b) => b.chatTime - a.chatTime);
  const messageSorter = messageSorterFromConfig || ((a, b) => a.messageTime - b.messageTime);

  const appDispatch = useAppDispatch();
  const app = useAppSelector(state => getApp(state.snsImReducer, appId));
  const appRef = useRef<SnsImAppState<C, M> | null>(null);
  const chatListRef = useRef<ChatListMethods | null>(null);

  appRef.current = app;

  const getChatByChatId = (chatId: string | null) => {
    if (!chatId) return null;

    return appRef.current?.chatList.find(item => item.chatId === chatId) || null;
  };

  const getChatContentByChatId = (chatId: string | null) => {
    if (!chatId) return null;

    return appRef.current?.chatContentMap[chatId] || null;
  };

  const getAddChatContentMapPayload = (chatList: SnsImChat[]) => {
    const initialChatContent: SnsImChatContent<M> = {
      messageList: [],
      messageInited: false,
      messageIniting: false,
      messageHasMore: {
        [SnsImLoadDirection.EARLIER]: false,
        [SnsImLoadDirection.NEWER]: false,
      },
      messageLoading: {
        [SnsImLoadDirection.EARLIER]: false,
        [SnsImLoadDirection.NEWER]: false,
      },
    };

    return chatList.reduce((accumulator, chat) => {
      const shouldAddToMap = !appRef.current?.chatContentMap[chat.chatId];

      if (shouldAddToMap) {
        return {
          ...accumulator,
          [chat.chatId]: { ...initialChatContent },
        };
      }

      return accumulator;
    }, {} as Record<string, SnsImChatContent>);
  };

  const init = (filter: F | null = null) => {
    appDispatch(SnsImActions.init({ appId }));
    appDispatch(
      SnsImActions.update({
        appId,
        payload: {
          filter,
          chatIniting: true,
        },
      })
    );
    return handleChatLoad(null, SnsImLoadDirection.EARLIER, filter).then(scrollToTopChat);
  };

  const initAround = (chatId: string, filter: F | null = null) => {
    if (!onChatInitAround) return Promise.resolve();

    appDispatch(SnsImActions.init({ appId }));
    appDispatch(
      SnsImActions.update({
        appId,
        payload: {
          filter,
          chatIniting: true,
        },
      })
    );
    return handleChatInitAround(chatId, filter);
  };

  const destory = () => {
    appDispatch(SnsImActions.destory({ appId }));
  };

  const handleChatLoad = (cursor: SnsImChat<C, M> | null, direction: SnsImLoadDirection, filter: F | null) => {
    appDispatch(
      SnsImActions.updateChatLoading({
        appId,
        payload: {
          [direction]: true,
        },
      })
    );
    return onChatLoad(cursor, direction, filter)
      .then(res => {
        const chatContentMapPayload = getAddChatContentMapPayload(res.chatList);

        appDispatch(
          SnsImActions.insertChat({
            appId,
            chatList: res.chatList,
            chatSorter,
          })
        );
        appDispatch(
          SnsImActions.updateChatHasMore({
            appId,
            payload: {
              [direction]: res.chatList.length ? res.hasMore : false,
            },
          })
        );
        appDispatch(
          SnsImActions.updateChatLoading({
            appId,
            payload: {
              [direction]: false,
            },
          })
        );
        appDispatch(
          SnsImActions.updateChatContentMap({
            appId,
            payload: chatContentMapPayload,
          })
        );
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              unreadCount: res.unreadCount,
            },
          })
        );
      })
      .finally(() => {
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              chatIniting: false,
            },
          })
        );
      });
  };

  const handleChatInitAround = (chatId: string, filter: F | null) => {
    if (!onChatInitAround) return Promise.resolve();

    return onChatInitAround(chatId, filter)
      .then(res => {
        const chatContentMapPayload = getAddChatContentMapPayload(res.chatList);

        appDispatch(
          SnsImActions.insertChat({
            appId,
            chatList: res.chatList,
            chatSorter,
          })
        );
        appDispatch(
          SnsImActions.updateChatHasMore({
            appId,
            payload: {
              [SnsImLoadDirection.EARLIER]: res.earlierHasMore,
              [SnsImLoadDirection.NEWER]: res.newerHasMore,
            },
          })
        );
        appDispatch(
          SnsImActions.updateChatContentMap({
            appId,
            payload: chatContentMapPayload,
          })
        );
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              unreadCount: res.unreadCount,
            },
          })
        );
        handleChatChange(chatId);
        chatListRef.current?.scrollToChat(chatId);
      })
      .finally(() => {
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              chatIniting: false,
            },
          })
        );
      });
  };

  const handleChatChange = (chatId: string) => {
    const chat = getChatByChatId(chatId);
    const chatContent = getChatContentByChatId(chatId);

    if (chat && chatContent) {
      appDispatch(
        SnsImActions.update({
          appId,
          payload: {
            chatId,
          },
        })
      );

      if (!chatContent.messageInited) {
        appDispatch(
          SnsImActions.updateChatContent({
            appId,
            chatId,
            payload: {
              messageIniting: true,
            },
          })
        );
        onMessageLoad(chat, chat.latestMessage || null, SnsImLoadDirection.EARLIER).then(res => {
          const { messageList } = res;

          if (chat.latestMessage) {
            messageList.push(chat.latestMessage);
          }

          appDispatch(
            SnsImActions.updateChatContent({
              appId,
              chatId,
              payload: {
                messageInited: true,
                messageIniting: false,
              },
            })
          );
          appDispatch(
            SnsImActions.insertMessage({
              appId,
              chatId,
              direction: SnsImLoadDirection.EARLIER,
              messageList: messageList.sort(messageSorter),
            })
          );
          appDispatch(
            SnsImActions.updateMessageHasMore({
              appId,
              chatId,
              payload: {
                [SnsImLoadDirection.EARLIER]: res.hasMore,
              },
            })
          );
        });
      }
    }
  };

  const handleChatClick = (chatId: string) => {
    const chat = getChatByChatId(chatId);

    if (chat && onMessageRead) {
      onMessageRead(chat).then(() => {
        appDispatch(
          SnsImActions.updateChat({
            appId,
            chatId,
            payload: {
              unreadCount: 0,
            },
          })
        );
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              unreadCount: chatUnreadCount - (chat.unreadCount || 0),
            },
          })
        );
      });
    }
  };

  const lastRefreshTime = useRef<number>(0);

  const handleChatRefresh = (chatIds: string[]) => {
    if (chatTopHasMore) {
      chatListRef.current?.setRedPointVisible(true);
    } else {
      const currentTime = Date.now();

      lastRefreshTime.current = currentTime;

      onChatRefresh(chatIds, appRef.current?.filter).then(res => {
        if (lastRefreshTime.current !== currentTime) return;

        const chatContentMapPayload = getAddChatContentMapPayload(res.chatList);

        appDispatch(
          SnsImActions.insertChat({
            appId,
            chatList: res.chatList,
            chatSorter,
          })
        );
        appDispatch(
          SnsImActions.updateChatContentMap({
            appId,
            payload: chatContentMapPayload,
          })
        );
        appDispatch(
          SnsImActions.update({
            appId,
            payload: {
              unreadCount: res.unreadCount,
            },
          })
        );

        const chatId = appRef.current?.chatId || null;
        const chatList = appRef.current?.chatList || [];
        const chatContentMap = appRef.current?.chatContentMap || {};
        const chat = chatList.find(item => item.chatId === chatId) || null;
        const chatContent = (chatId && chatContentMap[chatId]) || null;

        res.chatList.forEach(item => {
          if (item.chatId !== chatId) {
            // 如果是未打开的对话: 置为未初始化, 打开后依据新的 latestMessage 重新请求数据
            appDispatch(
              SnsImActions.updateChatContent({
                appId,
                chatId: item.chatId,
                payload: {
                  messageInited: false,
                  messageList: [],
                },
              })
            );
          } else {
            // 如果是当前对话有更新: 拉取最新消息
            if (chat && chatContent) {
              const cursor = chatContent.messageInited ? getLatestNonTempMessage(chatContent.messageList) : chat.latestMessage || null;

              handleMessageLoad(chat, cursor, SnsImLoadDirection.NEWER);
            }
          }
        });
      });
    }
  };

  const handleMessageLoad = (chat: SnsImChat, cursor: SnsImMessage | null, direction: SnsImLoadDirection) => {
    appDispatch(
      SnsImActions.updateMessageLoading({
        appId,
        chatId: chat.chatId,
        payload: {
          [direction]: true,
        },
      })
    );
    onMessageLoad(chat, cursor, direction).then(res => {
      if (res.messageList.length) {
        appDispatch(
          SnsImActions.insertMessage({
            appId,
            chatId: chat.chatId,
            direction,
            messageList: res.messageList.sort(messageSorter),
          })
        );
      }
      appDispatch(
        SnsImActions.updateMessageHasMore({
          appId,
          chatId: chat.chatId,
          payload: {
            [direction]: res.hasMore,
          },
        })
      );
      appDispatch(
        SnsImActions.updateMessageLoading({
          appId,
          chatId: chat.chatId,
          payload: {
            [direction]: false,
          },
        })
      );
    });
  };

  const handleFilterChange = (filter: F | null) => {
    return init(filter);
  };

  const handleMessageSend = (chat: SnsImChat, message: SnsImMessage) => {
    onMessageSend(chat, message)
      .then(res => {
        const nextMessage = {
          ...message,
          ...res.message,
          isTemp: false,
          messageId: res.message.messageId,
          messageStatus: SnsImMessageStatus.SENT,
          rawData: {
            ...message.rawData,
            ...res.message.rawData,
          },
        };
        appDispatch(
          SnsImActions.updateMessage({
            appId,
            chatId: chat.chatId,
            messageId: message.messageId,
            payload: nextMessage,
          })
        );
        if (appRef.current?.chatHasMore.NEWER) {
          init(appRef.current?.filter);
        } else {
          appDispatch(
            SnsImActions.insertChat({
              appId,
              chatList: [
                {
                  ...chat,
                  chatTime: message.messageTime,
                  latestMessage: message,
                },
              ],
              chatSorter,
            })
          );
        }
      })
      .catch(() => {
        appDispatch(
          SnsImActions.updateMessage({
            appId,
            chatId: chat.chatId,
            messageId: message.messageId,
            payload: {
              messageStatus: SnsImMessageStatus.ERROR,
            },
          })
        );
      });
  };

  const handleFileSend = (chat: SnsImChat, file: File) => {
    extractFileToMessage(file, rules).then(({ messageType, messageFile }) => {
      let message = createTempMessage(chat, {
        messageType,
        messageFile,
      });
      if (customTempMessage) {
        message = customTempMessage(message);
      }
      appDispatch(
        SnsImActions.insertMessage({
          appId,
          chatId: chat.chatId,
          direction: SnsImLoadDirection.NEWER,
          messageList: [message],
        })
      );
      onFileUpload(chat, file).then(res => {
        appDispatch(
          SnsImActions.updateMessageFile({
            appId,
            chatId: chat.chatId,
            messageId: message.messageId,
            payload: {
              src: res.src,
            },
          })
        );
        handleMessageSend(chat, {
          ...message,
          messageFile: {
            ...messageFile,
            src: res.src,
          },
        });
      });
    });
  };

  const handleTextSend = (chat: SnsImChat, text: string) => {
    let message = createTempMessage(chat, {
      messageText: text,
    });
    if (customTempMessage) {
      message = customTempMessage(message);
    }
    appDispatch(
      SnsImActions.insertMessage({
        appId,
        chatId: chat.chatId,
        direction: SnsImLoadDirection.NEWER,
        messageList: [message],
      })
    );
    handleMessageSend(chat, message);
  };

  const handleMessageUpdate = (chatId: string, messageId: string, payload: any) => {
    appDispatch(
      SnsImActions.updateMessage({
        appId,
        chatId,
        messageId,
        payload,
      })
    );
  };

  const scrollToTopChat = () => {
    const chatList = appRef.current?.chatList || [];
    const topChat = chatList[0];

    if (topChat) {
      chatListRef.current?.scrollToChat(topChat.chatId, {
        block: 'start',
        behavior: 'smooth',
      });
    }
  };

  const handleBackTop = () => {
    if (chatTopHasMore) {
      init(filter);
      chatListRef.current?.setRedPointVisible(false);
    } else {
      scrollToTopChat();
    }
  };

  // 以下变量只用于 jsx 渲染, 异步方法中应使用 appRef.current 再次获取
  const filter = appRef.current?.filter;
  const chatId = appRef.current?.chatId || null;
  const chatList = appRef.current?.chatList || [];
  const chatContentMap = appRef.current?.chatContentMap || {};
  const chat = chatList.find(item => item.chatId === chatId) || null;
  const chatContent = (chatId && chatContentMap[chatId]) || null;
  const chatIniting = !!appRef.current?.chatIniting;
  const chatBottomHasMore = appRef.current?.chatHasMore.EARLIER;
  const chatBottomLoading = appRef.current?.chatLoading.EARLIER;
  const chatTopHasMore = appRef.current?.chatHasMore.NEWER;
  const chatTopLoading = appRef.current?.chatLoading.NEWER;
  const chatUnreadCount = chat?.unreadCount || 0;

  const { exceeded, alert } = useLimit24Hour(chat?.latestReceivedMessageTime || 0);

  return {
    im: {
      init,
      initAround,
      destory,
      refresh: handleChatRefresh,
      setChat: handleChatChange,
      setFilter: handleFilterChange,
      getChat: () => getChatByChatId(chatId),
      getChatId: () => chatId,
      getMessageList: () => getChatContentByChatId(chatId)?.messageList || [],
      getState: () => app,
      updateMessage: handleMessageUpdate,
    },
    chatList: (
      <ChatList
        ref={chatListRef}
        className={chatListClassName}
        chatId={chatId}
        chatList={chatList.filter(chatListFilter || (() => true))}
        chatIniting={chatIniting}
        onChange={handleChatChange}
        onItemClick={handleChatClick}
        showBackTop={showBackTop}
        bottomHasMore={chatBottomHasMore}
        bottomLoading={chatBottomLoading}
        topHasMore={chatTopHasMore}
        topLoading={chatTopLoading}
        chatListEmptyTitle={chatListEmptyTitle}
        chatListEmptyTip={chatListEmptyTip}
        renderChat={renderChat}
        renderChatListEmpty={renderChatListEmpty}
        customMessageText={customMessageText}
        onScrollToBottom={() => {
          const cursor = chatList[chatList.length - 1] || null;
          handleChatLoad(cursor, SnsImLoadDirection.EARLIER, appRef.current?.filter);
        }}
        onScrollToTop={() => {
          const cursor = chatList[0] || null;
          handleChatLoad(cursor, SnsImLoadDirection.NEWER, appRef.current?.filter);
        }}
        onBackTop={handleBackTop}
      />
    ),
    chatContent: (
      <ChatContent
        chat={chat}
        chatContent={chatContent}
        className={chatContentClassName}
        rules={rules}
        editorDisabled={(chatLimit24Hour && exceeded) || disabledSend}
        editorTimeExceeded={chatLimit24Hour && exceeded}
        extraContent={chatLimit24Hour ? alert : null}
        chatContentEmptyTitle={chatContentEmptyTitle}
        chatContentEmptyTip={chatContentEmptyTip}
        sidebarContent={renderSidebarContent && chat ? renderSidebarContent(chat) : null}
        renderChatContentEmpty={renderChatContentEmpty}
        renderMessage={renderMessage}
        renderChatPlaceholder={renderChatPlaceholder}
        onScrollToTop={chat => {
          const chatContent = getChatContentByChatId(chat.chatId);

          if (chatContent) {
            const cursor = chatContent.messageList[0];
            handleMessageLoad(chat, cursor, SnsImLoadDirection.EARLIER);
          }
        }}
        onFileSend={handleFileSend}
        onTextSend={handleTextSend}
      />
    ),
  };
}

export { useSnsIm };
