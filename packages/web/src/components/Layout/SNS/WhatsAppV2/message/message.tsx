import React, { useState, useEffect, useMemo, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import { getIn18Text, apiHolder, apis, WhatsAppApi, WhatsAppChatItemV2, WhatsAppMessageV2, WhatsAppMessageTypeV2, WhatsAppMessageTypeNameV2 } from 'api';
import {
  chatConverter,
  messageConverter,
  messageTypeRecoverMap,
  messageContentRecoverer,
  loadDirectionConvertMap,
  getAvatarByName,
  chatLoadDirectionConvertMap,
} from '../utils';
import { ReactComponent as RefreshIcon } from './refresh.svg';
import { Uploader } from '../uploader';
import { useSnsIm, SnsImMessageStatus } from '@web-sns-im';
import { PhoneSelect } from '../components/phoneSelect/phoneSelect';
import { useWaContextV2 } from '../context/WaContextV2';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { WACustomerSidebar } from '@/components/Layout/SNS/WhatsApp/components/sideCustomerCard/WACustomerSidebar';
import variables from '@web-common/styles/export.module.scss';
import style from './message.module.scss';

const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface MessageProps {
  qs: Record<string, string>;
}

interface MessageFilter {
  from: string | null;
  query: string;
}

interface MessageStatusEventData {
  from: string;
  chatId: string;
  list: {
    messageId: string;
    deliveryAt: number;
    seenAt: number;
  }[];
}

const Message: React.FC<MessageProps> = props => {
  const { qs } = props;
  const { allotPhones, refreshOrgStatus, refreshAllotPhones } = useWaContextV2();
  const [filter, setFilter] = useState<MessageFilter>({ from: null, query: '' });
  const [expandSidebar, setExpandSidebar] = useState<boolean>(true);
  const hasChatPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP', 'OP'));
  const activePhone = useMemo(() => allotPhones.find(item => item.phone === filter.from), [allotPhones, filter]);
  const phoneBanned = activePhone?.status === 'BANNED';

  const handleFilterChangeDebounced = useRef(
    debounce((filter: MessageFilter) => {
      im.setFilter(filter);
    }, 300)
  ).current;

  const { im, chatList, chatContent } = useSnsIm<WhatsAppChatItemV2, WhatsAppMessageV2, MessageFilter>({
    appId: 'biz-wa-nx',
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
    disabledSend: !hasChatPermisson || phoneBanned,
    chatListEmptyTitle: getIn18Text('ZANWUSHUJU'),
    chatListEmptyTip: getIn18Text('QINGSOUSUOWAYONGHUMINGHAOMA'),
    chatContentEmptyTitle: getIn18Text('ZHUANSHUZHANGHAOGAOXIAOGOUTONG'),
    chatContentEmptyTip: getIn18Text('GUANFANGZHUANSHUZHANGHAOGOUTONGGAOXIAOBIANJIEWEIHUKEHU'),
    customMessageText: message => {
      const { messageText, rawData } = message;
      const { messageType } = rawData;

      if (messageType === WhatsAppMessageTypeV2.text) {
        return messageText || `[${WhatsAppMessageTypeNameV2.text}]`;
      } else {
        return `[${WhatsAppMessageTypeNameV2[messageType]}]`;
      }
    },
    customTempMessage: message => {
      const currentUser = systemApi.getCurrentUser();
      const verifiedAccountName = activePhone?.verified_name;
      const defaultAccountName = currentUser?.accountName || '';
      const accountName = verifiedAccountName ? `${verifiedAccountName} (${defaultAccountName})` : defaultAccountName;
      const accountAvatar = getAvatarByName(defaultAccountName);
      const rawData = {
        messageType: messageTypeRecoverMap[message.messageType],
        content: {
          text: {
            body: message.messageText || '',
          },
        },
      } as WhatsAppMessageV2;

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
          isNewBsp
          chatId={chat.rawData.chatId}
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
        .getChatListV2({
          from: filter?.from || '',
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
      whatsAppApi.getChatInitAroundV2({ chatId, limit: 30 }).then(res => ({
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
        .sendMessageV2({
          chatId: chat.chatId,
          content: messageContentRecoverer(message),
          messageType: messageTypeRecoverMap[message.messageType],
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
          .getMessageListV2({
            chatId: chat.chatId,
            direction: loadDirectionConvertMap[direction],
            lastSeqNo: cursor.rawData.seqNo,
            limit: 30,
          })
          .then(res => ({
            messageList: res.recorders.map(message => messageConverter(chat.rawData, message, activePhone)),
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
        .getChatListByIdsV2({
          chatIds: chatIds,
          query: filter?.query || '',
        })
        .then(res => ({
          chatList: res.contacts.map(chatConverter),
          unreadCount: 0,
        })),
  });

  useEffect(() => {
    refreshAllotPhones();
  }, []);

  useEffect(() => {
    if (allotPhones.length) {
      const nextFilter = {
        from: allotPhones[0].phone,
        query: '',
      };

      if (qs.from && qs.chatId) {
        if (allotPhones.some(item => item.phone === qs.from)) {
          nextFilter.from = qs.from;
        }
        setFilter(nextFilter);
        im.initAround(qs.chatId, nextFilter);
      } else {
        setFilter(nextFilter);
        im.init(nextFilter);
      }
    }

    return im.destory;
  }, [allotPhones.length, qs.from, qs.chatId]);

  // 收到新消息
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('whatsAppMessagesUpdateV2', {
      func: ({ eventData }) => {
        const { from, chatId } = eventData;

        if (filter.from === from) {
          im.refresh([chatId]);
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('whatsAppMessagesUpdateV2', id);
    };
  }, [filter]);

  // 更新消息状态
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('whatsAppMessageStatusV2', {
      func: ({ eventData }) => {
        const { from, chatId, list } = eventData as MessageStatusEventData;

        if (filter.from === from) {
          list.forEach(item => {
            let messageStatus = SnsImMessageStatus.SENT;

            if (item.deliveryAt) messageStatus = SnsImMessageStatus.DELIVERED;
            if (item.seenAt) messageStatus = SnsImMessageStatus.SEEN;

            im.updateMessage(chatId, item.messageId, { messageStatus });
          });
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('whatsAppMessageStatusV2', id);
    };
  }, [filter]);

  useEffect(() => im.destory, []);

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_MSG">
      <div className={style.message}>
        <div className={style.chatListWrapper}>
          <div className={style.phoneSelectWrapper}>
            <PhoneSelect
              className={classnames(style.phoneSelect, 'sirius-no-drag')}
              value={filter.from}
              disableBannedPhone={false}
              onChange={nextFrom => {
                const nextFilter = { ...filter, from: nextFrom };
                setFilter(nextFilter);
                handleFilterChangeDebounced(nextFilter);
              }}
            />
            <RefreshIcon className={classnames(style.refresh, 'sirius-no-drag')} onClick={() => handleFilterChangeDebounced(filter)} />
          </div>
          <div className={style.chatListInner}>
            <Input
              className={style.searchInput}
              value={filter.query}
              placeholder={getIn18Text('SOUSUOLIANXIRENMINGCHENG')}
              allowClear
              onChange={e => {
                const nextFilter = { ...filter, query: e.target.value };
                setFilter(nextFilter);
                handleFilterChangeDebounced(nextFilter);
              }}
            />
            {chatList}
          </div>
        </div>
        {chatContent}
      </div>
    </PermissionCheckPage>
  );
};

export default Message;
