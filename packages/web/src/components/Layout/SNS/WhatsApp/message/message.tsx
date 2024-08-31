import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import { apis, apiHolder, getIn18Text, WhatsAppApi, WhatsAppMessage, WhatsAppMessageType, WhatsAppMessageTypeName, WhatsAppChatItem } from 'api';
import {
  getAvatarByName,
  messageTypeRecoverMap,
  messageContentRecoverer,
  chatConverter,
  messageConverter,
  messageLoadDirectionConvertMap,
  chatLoadDirectionConvertMap,
} from '@/components/Layout/SNS/WhatsApp/utils';
import { useSnsIm, SnsImMessageStatus } from '@web-sns-im';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { TongyongSousuo } from '@sirius/icons';
import { Uploader } from '../uploader';
import { ReactComponent as ChatRefreshIcon } from '@/images/icons/SNS/chat-refresh.svg';
import { WACustomerSidebar } from '../components/sideCustomerCard/WACustomerSidebar';
import variables from '@web-common/styles/export.module.scss';
import { BusinessPermissionCheck } from '@/components/Layout/SNS/components/BusinessPermissionCheck';
import style from './message.module.scss';

const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface MessageProps {
  qs: Record<string, string>;
}

interface MessageFilter {
  query: string;
}

interface MessageStatusEventData {
  to: string;
  list: {
    messageId: string;
    deliveryAt: number;
    seenAt: number;
  }[];
}

const Message: React.FC<MessageProps> = props => {
  const { qs } = props;
  const [filter, setFilter] = useState<MessageFilter>({ query: '' });
  const [expandSidebar, setExpandSidebar] = useState<boolean>(true);
  const hasChatPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP', 'OP'));

  const handleFilterChangeDebounced = useRef(
    debounce((filter: MessageFilter) => {
      im.setFilter(filter);
    }, 300)
  ).current;

  const { im, chatList, chatContent } = useSnsIm<WhatsAppChatItem, WhatsAppMessage, MessageFilter>({
    appId: 'biz-wa-ib',
    chatListClassName: style.chatList,
    chatContentClassName: style.chatContent,
    rules: {
      textMaxLength: 2000,
      imageTypes: ['jpg', 'png', 'webp'],
      imageMaxSize: 5 * 1024 * 1024,
      videoTypes: ['mp4'],
      videoMaxSize: 16 * 1024 * 1024,
      fileTypes: ['aac', 'mp3', 'mp4', 'amr', 'ogg', 'opus', 'txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'],
      fileMaxSize: 100 * 1024 * 1024,
    },
    showBackTop: true,
    disabledSend: !hasChatPermisson,
    chatListEmptyTitle: getIn18Text('ZANWUSHUJU'),
    chatListEmptyTip: getIn18Text('QINGSOUSUOWAYONGHUMINGHAOMA'),
    chatContentEmptyTitle: getIn18Text('ZHUANSHUZHANGHAOGAOXIAOGOUTONG'),
    chatContentEmptyTip: getIn18Text('GUANFANGZHUANSHUZHANGHAOGOUTONGGAOXIAOBIANJIEWEIHUKEHU'),
    customMessageText: message => {
      const { messageText, rawData } = message;
      const { messageType } = rawData;

      if (messageType === WhatsAppMessageType.TEXT) {
        return messageText || `[${WhatsAppMessageTypeName.TEXT}]`;
      } else {
        return `[${WhatsAppMessageTypeName[messageType]}]`;
      }
    },
    customTempMessage: message => {
      const currentUser = systemApi.getCurrentUser();
      const accountName = currentUser?.accountName || '';
      const accountAvatar = getAvatarByName(accountName);
      const rawData = {
        messageType: messageTypeRecoverMap[message.messageType],
        content: JSON.stringify({
          text: message.messageText || '',
        }),
      } as WhatsAppMessage;

      return { ...message, accountName, accountAvatar, rawData };
    },
    renderSidebarContent: chat => (
      <div
        className={style.waSidebarContainer}
        style={{
          width: expandSidebar ? 340 : 0,
          borderLeft: expandSidebar ? `1px solid ${variables.line2}` : 'none',
        }}
      >
        <WACustomerSidebar
          className={style.waSidebar}
          from="wa-business"
          chatId={chat.rawData.to}
          snsInfo={{
            snsId: chat.rawData.to,
            snsName: chat.contactName,
          }}
        />
        <div className={classnames(style.toggleBtn, !expandSidebar && style.isFold)} onClick={() => setExpandSidebar(!expandSidebar)} />
      </div>
    ),
    onChatLoad: (cursor, direction, filter) =>
      whatsAppApi
        .getChatList({
          direction: chatLoadDirectionConvertMap[direction],
          lastSeqNo: cursor?.latestMessage?.rawData.seqNo || '',
          query: filter?.query || '',
          limit: 30,
        })
        .then(res => ({
          chatList: res.chats.map(chatConverter),
          hasMore: res.hasMore,
          unreadCount: 0,
        })),
    onChatInitAround: (chatId, filter) =>
      whatsAppApi.getChatInitAround({ to: chatId, limit: 30 }).then(res => ({
        chatList: res.chats.map(chatConverter),
        earlierHasMore: res.earlierHasMore,
        newerHasMore: res.newerHasMore,
        unreadCount: 0,
      })),
    onFileUpload: (chat, file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = event => {
          if (event.target && event.target.result) {
            const uploader = new Uploader(file);

            uploader.on('complete', data => {
              resolve({ src: data.downloadUrl });
            });
            uploader.on('error', () => {
              reject();
            });
          }
        };
      }),
    onMessageSend: (chat, message) =>
      whatsAppApi
        .sendMessage({
          from: chat.rawData.latestReceiveMsgSender,
          to: chat.rawData.to,
          messageType: messageTypeRecoverMap[message.messageType],
          content: messageContentRecoverer(message),
        })
        .then(res => ({
          message: {
            ...message,
            messageId: res.messageId,
            rawData: {
              ...message.rawData,
              messageId: res.messageId,
              seqNo: res.seqNo,
            },
          },
        })),
    onMessageLoad: (chat, cursor, direction) => {
      if (cursor) {
        return whatsAppApi
          .getMessageList({
            contactWhatsApp: chat.rawData.to,
            direction: messageLoadDirectionConvertMap[direction],
            lastSeqNo: cursor.rawData.seqNo,
            limit: 30,
          })
          .then(res => ({
            messageList: res.recorders.map(message => messageConverter(chat.rawData, message)),
            hasMore: res.hasMore,
          }));
      } else {
        return Promise.resolve({
          messageList: [],
          hasMore: false,
        });
      }
    },
    onChatRefresh: (chatIds, filter) =>
      whatsAppApi
        .getChatListByIds({
          tos: chatIds,
          query: filter?.query || '',
        })
        .then(res => ({
          chatList: res.chats.map(chatConverter),
          unreadCount: 0,
        })),
  });

  useEffect(() => {
    if (qs.chatId) {
      im.initAround(qs.chatId);
    } else {
      im.init();
    }
  }, [qs.chatId]);

  // 收到新消息
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('whatsAppMessagesUpdate', {
      func: ({ eventData }) => {
        const chatIds = eventData.toList || [];
        im.refresh(chatIds);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('whatsAppMessagesUpdate', id);
    };
  }, []);

  // 更新消息状态
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('whatsAppMessageStatus', {
      func: ({ eventData }) => {
        const { to: chatId, list } = eventData as MessageStatusEventData;

        list.forEach(item => {
          let messageStatus = SnsImMessageStatus.SENT;

          if (item.deliveryAt) messageStatus = SnsImMessageStatus.DELIVERED;
          if (item.seenAt) messageStatus = SnsImMessageStatus.SEEN;

          im.updateMessage(chatId, item.messageId, { messageStatus });
        });
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('whatsAppMessageStatus', id);
    };
  }, []);

  useEffect(() => im.destory, []);

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_MSG">
      <BusinessPermissionCheck>
        <div className={style.message}>
          <div className={style.chatListWrapper}>
            <div className={style.filterWrapper}>
              <Input
                className={style.query}
                placeholder={getIn18Text('SOUSUOLIANXIRENMINGCHENG')}
                value={filter.query}
                allowClear
                prefix={<TongyongSousuo wrapClassName={classnames('wmzz', style.searchIcon)} />}
                onChange={event => {
                  const nextFilter: MessageFilter = { ...filter, query: event.target.value };
                  setFilter(nextFilter);
                  handleFilterChangeDebounced(nextFilter);
                }}
              />
              <ChatRefreshIcon className={classnames(style.refresh, 'sirius-no-drag')} onClick={() => handleFilterChangeDebounced(filter)} />
            </div>
            {chatList}
          </div>
          {chatContent}
        </div>
      </BusinessPermissionCheck>
    </PermissionCheckPage>
  );
};

export default Message;
