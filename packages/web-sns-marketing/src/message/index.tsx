import { SnsMarketingAccount, getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Tabs } from 'antd';
import { apiHolder, apis, SnsMarketingApi, SnsMarketingChat, SnsMarketingMessage } from 'api';
import { Uploader } from '../utils/uploader';
import { chatConverter, messageConverter, messageTypeRecoverMap } from '../utils/message';
import { useSnsIm } from '@web-sns-im';
import { useLocation } from '@reach/router';
import AccountsSelect from '../components/AccountsSelect';
import AgreementModal from '../components/AgreementModal';
import style from './index.module.scss';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { HocOrderState } from '../components/orderStateTip';

const eventApi = apiHolder.api.getEventApi();
const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

interface MessageProps {}

interface MessageFilter {
  accounts: SnsMarketingAccount[];
  onlyShowUnread: boolean;
}

const AgreementCheckedKey = 'sns-marketing-im-agreement';

const Message: React.FC<MessageProps> = props => {
  const location = useLocation();
  const [agreementVisible, setAgreementVisible] = useState<boolean>(false);
  useEffect(() => {
    if (!localStorage.getItem(AgreementCheckedKey)) {
      setAgreementVisible(true);
    }
  }, []);
  const [filter, setFilter] = useState<MessageFilter>({
    accounts: [],
    onlyShowUnread: false,
  });
  const hasChatPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'OP'));

  const { im, chatList, chatContent } = useSnsIm<SnsMarketingChat, SnsMarketingMessage, MessageFilter>({
    appId: 'sns-marketing',
    chatListClassName: style.chatList,
    chatContentClassName: style.chatContent,
    rules: {
      textMaxLength: 1000,
      imageTypes: ['jpg', 'png'],
      imageMaxSize: 7 * 1024 * 1024,
      videoTypes: ['mp4'],
      videoMaxSize: 23 * 1024 * 1024,
      fileSupport: false,
      fileMaxSize: 23 * 1024 * 1024,
    },
    disabledSend: !hasChatPermisson,
    onChatLoad: (cursor, direction, filter) =>
      snsMarketingApi
        .getChatList({
          accounts: filter?.accounts || [],
          dialogId: cursor ? cursor.chatId : undefined,
          limit: 30,
          onlyShowUnRead: filter?.onlyShowUnread || false,
          pullDirection: direction,
        })
        .then(res => ({
          chatList: res.contactList.map(chatConverter),
          hasMore: res.hasMoreDialog,
          unreadCount: res.unReadMsgCount,
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
      snsMarketingApi
        .sendMessage({
          dialogId: chat.chatId,
          content: message.messageText,
          mediaType: messageTypeRecoverMap[message.messageType],
          mediaUrls: message.messageFile ? [message.messageFile.src] : [],
          platform: chat.rawData.platform,
          senderId: chat.rawData.accountId,
          senderAccountType: chat.rawData.accountType,
          receiverId: chat.rawData.contactId,
        })
        .then(res => ({
          message: {
            ...message,
            messageId: res.messageId,
          },
        })),
    onMessageLoad: (chat, cursor, direction) => {
      if (cursor) {
        return snsMarketingApi
          .getMessageList({
            dialogId: chat.chatId,
            limit: 30,
            pullDirection: direction,
            latestMsgId: cursor?.rawData.messageId,
            latestMsgSeqNo: cursor?.rawData.messageSeqNo,
          })
          .then(res => ({
            messageList: res.messageList.map(message => messageConverter(chat.rawData, message)),
            hasMore: res.hasMoreMessage,
          }));
      } else {
        return Promise.resolve({
          messageList: [],
          hasMore: false,
        });
      }
    },
    onMessageRead: chat =>
      snsMarketingApi.readMessage({
        dialogId: chat.chatId,
        readMsgCount: chat.unreadCount || 0,
      }),
    onChatRefresh: (chatIds, filter) =>
      snsMarketingApi
        .getChatListByIds({
          dialogIds: chatIds,
          onlyShowUnRead: filter?.onlyShowUnread || false,
          accounts: filter?.accounts || [],
        })
        .then(res => ({
          chatList: res.contactList.map(chatConverter),
          unreadCount: res.unReadMsgCount,
        })),
  });

  useEffect(() => {
    im.init();

    return im.destory;
  }, []);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('socialMediaNewMsg', {
      func: event => {
        const dialogList: {
          dialogId: string;
          platform: string;
        }[] = event.eventData.dialogList;

        im.refresh(dialogList.map(item => item.dialogId));
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('socialMediaNewMsg', id);
    };
  }, []);

  const unreadCount = im.getState()?.unreadCount || 0;

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_MESSAGE">
      <div className={style.message}>
        <div className={style.header}>
          <AccountsSelect
            className={style.accountsSelect}
            accounts={filter.accounts}
            placeholder={getIn18Text('QUANBUZHUYE')}
            maxTagCount="responsive"
            onChange={nextAccounts => {
              const nextFilters = {
                ...filter,
                accounts: nextAccounts,
              };
              setFilter(nextFilters);
              im.setFilter(nextFilters);
            }}
          />
        </div>
        <div className={style.body}>
          <div className={style.chatListWrapper}>
            <Tabs
              className={style.chatListTabs}
              activeKey={filter.onlyShowUnread ? 'UNREAD' : 'ALL'}
              onChange={nextTabKey => {
                const nextFilters = {
                  ...filter,
                  onlyShowUnread: nextTabKey === 'UNREAD',
                };
                setFilter(nextFilters);
                im.setFilter(nextFilters);
              }}
            >
              <Tabs.TabPane key="ALL" tab={getIn18Text('QUANBU')} />
              <Tabs.TabPane key="UNREAD" tab={`${getIn18Text('WEIDU')}${unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : ''}`} />
            </Tabs>
            {chatList}
          </div>
          {chatContent}
        </div>
        <AgreementModal
          visible={agreementVisible}
          onAgree={() => {
            setAgreementVisible(false);
            localStorage.setItem(AgreementCheckedKey, '1');
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};

export default HocOrderState(Message);
