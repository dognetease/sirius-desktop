import React, { useEffect, useState, useMemo, useRef } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, InsertWhatsAppApi, PersonalWAContactRes, PersonalMessageHistory, WhatsAppMessage } from 'api';
import ChatList from '@/components/Layout/SNS/components/ChatList';
import { getMessageText, convertToSnsMessage } from '@/components/Layout/SNS/WhatsApp/utils';
import { getTransText } from '@/components/util/translate';
import { SnsMessage, SnsChatItem } from '@/components/Layout/SNS/types';
import { MessageItem } from '@/components/Layout/SNS/WhatsApp/components/messageHistory';
import ChatContent, { MessageUpdateType } from '@/components/Layout/SNS/components/ChatContent';
import { Input } from 'antd';
import { ReactComponent as ChatSearchIcon } from '@/images/icons/SNS/chat-search.svg';
import style from './style.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
type data = {
  sender: string;
  searchAccId: string;
  startTime?: number;
  endTime?: number;
};
export interface ChatModalProps {
  visible: boolean;
  business?: boolean;
  data?: data;
  onClose?: () => void;
}
export const ChatModal: React.FC<ChatModalProps> = props => {
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);
  const [contacts, setContacts] = useState<PersonalWAContactRes>([]);
  const [listData, setListData] = useState<PersonalMessageHistory>();
  const [activePerson, setActivePerson] = useState<any>(null);
  const [messageList, setMessageList] = useState<SnsMessage<WhatsAppMessage>[]>([]);
  const [query, setQuery] = useState('');

  const contact = useMemo(() => {
    return contacts.find(item => item.to === activePerson) || null;
  }, [contacts, activePerson]);
  const chatList = useMemo(() => {
    return contacts.map(item => {
      const message = item.recorders[0] || null;

      return {
        id: item.to,
        name: item.contactName || item.to,
        time: message ? message.sentAt : null,
        avatar: null,
        account: item.to,
        message: message
          ? {
              id: message.seqNo,
              text: getMessageText(message),
              originMessage: message,
            }
          : null,
        unreadCount: 0,
        originContact: item,
      };
    });
  }, [contacts]);
  useEffect(() => {
    if (props.visible && props.data) {
      if (!contacts.length) {
        setContactsLoading(true);
      }
      insertWhatsAppApi
        .getBusinessContactList(props.data)
        .then(data => {
          setContacts(data.contacts);
          if (data.contacts.length > 0) {
            setActivePerson(data.contacts[0].to);
          }
        })
        .finally(() => {
          setContactsLoading(false);
        });
    }
    if (!props.visible) {
      setQuery('');
    }
  }, [props.visible, props.data]);

  useEffect(() => {
    setMessageList([]);
    if (activePerson && props.data && Object.keys(props.data).length > 0) {
      insertWhatsAppApi
        .getBusinessMessageList({
          ...props.data,
          toWaSender: activePerson,
        })
        .then(data => {
          setListData(data);
          Promise.all(data.recorders.map(convertToSnsMessage)).then(payload => {
            setMessageList([...payload]);
          });
        });
    }
  }, [activePerson, props.data]);

  return (
    <SiriusModal visible={props.visible} title="WA聊天记录" onCancel={props.onClose} width={820} footer={null}>
      <div className={style.content}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            width: 318,
            flexShrink: 0,
            border: `1px solid rgb(235, 237, 242)`,
            borderRadius: 4,
            backgroundColor: '#FFFFFF',
            marginRight: 12,
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          {chatList.length > 0 && (
            <div
              style={{
                display: 'flex',
                padding: '16px 12px 8px',
                alignItems: 'center',
              }}
            >
              <Input
                className={style.queryInput}
                style={{
                  flexGrow: 1,
                  marginRight: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgb(246, 247, 250)',
                  borderColor: 'transparent',
                }}
                placeholder={getTransText('QINGSHURUSOUSUO')}
                value={query}
                prefix={<ChatSearchIcon />}
                onChange={event => setQuery(event.target.value)}
              />
            </div>
          )}
          <ChatList
            style={{
              padding: 8,
              flexGrow: 1,
            }}
            id={1}
            list={chatList.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.account?.includes(query))}
            loading={contactsLoading}
            emptyTip={getTransText('QINGSOUSUOWAYONGHUMINGHAOMA')}
            onIdChange={nextId => {
              console.log('nextId', nextId);
              setActivePerson(nextId);
            }}
          />
        </div>
        <div className={style.right}>
          {contact && messageList && (
            <ChatContent
              style={{
                flexGrow: 1,
                overflow: 'hidden',
                overflowY: 'auto',
              }}
              id={contact.to}
              name={contact.name || contact.to}
              avatar=""
              account={contact.account || contact.to}
              messageList={messageList}
              messageUpdateType="append"
              topHasMore={false}
              topLoading={false}
              extraContent={null}
              editorDisabled={true}
              onScrollToTop={() => {}}
              onSend={text => {}}
              onSendFile={file => {}}
            />
          )}
          {/* <ul>
            {listData?.recorders?.map(msg => {
              const { messageId } = msg;
              return (
                <li key={messageId}>
                  <MessageItem item={msg} accountName={'test'} />
                </li>
              );
            })}
          </ul> */}
        </div>
      </div>
    </SiriusModal>
  );
};
