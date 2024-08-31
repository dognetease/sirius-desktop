import React, { useEffect, useState, useMemo, useRef } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, InsertWhatsAppApi, PersonalWAContactRes, PersonalMessageHistory } from 'api';
import ChatList from '@/components/Layout/SNS/components/ChatList';
import { getMessageText } from '@/components/Layout/SNS/WhatsApp/utils';
import { getTransText } from '@/components/util/translate';
import { MessageItem } from '@/components/Layout/SNS/WhatsApp/components/messageHistory';
import { Input } from 'antd';
import { ReactComponent as ChatSearchIcon } from '@/images/icons/SNS/chat-search.svg';
import style from './style.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
type data = {
  sender: string;
  searchAccId: string;
  startTime?: number;
  endTime?: number;
  name: string;
};
export interface ChatModalProps {
  visible: boolean;
  business?: boolean;
  data?: data;
  onClose?: () => void;
}
export const ChatModal: React.FC<ChatModalProps> = props => {
  const [contacts, setContacts] = useState<PersonalWAContactRes>([]);
  const [listData, setListData] = useState<PersonalMessageHistory>();
  const [activePerson, setActivePerson] = useState<any>(null);
  const [query, setQuery] = useState('');

  const chatList = useMemo(() => {
    return contacts.map((item, index) => {
      const message = item.recorders?.[0].content || '{}';
      let content = {};
      try {
        content = JSON.parse(message);
      } catch (error) {}

      return {
        id: item.to || index,
        name: item.contactName,
        time: item?.recorders?.[0]?.sentAt || null,
        avatar: item?.recorders?.[0]?.toAvatar || null,
        account: item?.recorders?.[0]?.accountName || '',
        message: message
          ? {
              id: message.seqNo,
              text: content?.content || '',
              originMessage: message,
            }
          : null,
        originContact: item,
      };
    });
  }, [contacts]);
  const activePersonName = useMemo(() => {
    return contacts.filter(item => item.to === activePerson)?.[0]?.contactName || '';
  }, [contacts, activePerson]);
  useEffect(() => {
    if (props.visible && props.data) {
      insertWhatsAppApi.getPersonalContactList(props.data).then(data => {
        setContacts(data.contacts);
        if (data.contacts.length > 0) {
          setActivePerson(data.contacts[0].to);
        }
      });
    }
    if (!props.visible) {
      setListData(void 0);
      setQuery('');
    }
  }, [props.visible, props.data]);

  useEffect(() => {
    if (activePerson && props.data) {
      insertWhatsAppApi
        .getPersonalMessageList({
          ...props.data,
          toWaSender: activePerson,
        })
        .then(setListData);
    }
  }, [activePerson, props.data]);

  return (
    <SiriusModal visible={props.visible} title={`${props.data?.name}WA聊天记录`} onCancel={props.onClose} width={820} footer={null}>
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
            loading={false}
            emptyTip={getTransText('QINGSOUSUOWAYONGHUMINGHAOMA')}
            onIdChange={nextId => {
              console.log('nextId', nextId);
              setActivePerson(nextId);
            }}
          />
        </div>
        <div className={style.right}>
          <ul>
            {listData?.recorders?.map(msg => {
              const { messageId } = msg;
              return (
                <li key={messageId}>
                  <MessageItem item={msg} accountName={msg.accountName} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </SiriusModal>
  );
};
