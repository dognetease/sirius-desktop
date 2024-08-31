import React, { useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, WhatsAppApi, FacebookApi, FacebookMessage, FacebookMessageType, FacebookChatItem } from 'api';
import { Tabs, Alert } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { formatFileSize } from '@web-common/components/util/file';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { FacebookActions } from '@web-common/state/reducer';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { useLocation } from '@reach/router';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { SnsMessage, SnsMessageDirection, SnsChatItem, SnsMessageType, SnsMessageContent } from '@/components/Layout/SNS/types';
import ChatList from '@/components/Layout/SNS/components/ChatList';
import ChatContent, { MessageUpdateType } from '@/components/Layout/SNS/components/ChatContent';
import { ReactComponent as ChatRefreshIcon } from '@/images/icons/SNS/chat-refresh.svg';
import { convertToSnsMessage, getMessageText } from '@/components/Layout/SNS/Facebook/utils';
import { NosUploader } from '@/components/Layout/SNS/nosUploader';
import { getTransText } from '@/components/util/translate';
import ChatContentEmpty from '@/images/icons/SNS/chat-content-empty.png';
import { Authorize } from '../components/authorize';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { ChatContext } from '@/components/Layout/SNS/context';

import style from './index.module.scss';

const eventApi = apiHolder.api.getEventApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const ONE_SECOND = 1000;

const getRemainText = (remainTime: number) => {
  const remainHour = Math.floor(remainTime / ONE_HOUR);
  const remainMinute = Math.floor((remainTime - remainHour * ONE_HOUR) / ONE_MINUTE);
  const remainSecond = Math.floor((remainTime - remainHour * ONE_HOUR - remainMinute * ONE_MINUTE) / ONE_SECOND);
  return (
    <>
      {getTransText('li24hgoutongshixiaohaisheng')}
      <span className={style.remainTime}>
        {`${remainHour.toString().padStart(2, '0')}h:${remainMinute.toString().padStart(2, '0')}m:${remainSecond.toString().padStart(2, '0')}s`}
      </span>
      {getTransText('ninkeyifasongrenyixiaoxichudakehu')}
    </>
  );
};

// const { Option } = Select;

interface FacebookMessageProps {
  qs: Record<string, string>;
}

type MessageTab = 'ALL' | 'UNREAD';

const getId = (pageId: string, contactId: string) => `${pageId}+${contactId}`;

const FacebookMessage: React.FC<FacebookMessageProps> = props => {
  const location = useLocation();
  const { qs } = props;
  const { isAuthorized, authorizedLoading } = useAppSelector(state => state.facebookReducer);
  const { setFacebookModalShow } = useActions(FacebookActions);
  const [expiresVisible, setExpiresVisible] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [publicPageFetching, setPublicPageFetching] = useState<boolean>(false);
  const [publicPageList, setPublicPageList] = useState<{ pageId: string; pageName: string }[]>([{ pageId: '-1', pageName: getTransText('QUANBUGONGGONGZHUYE') }]);
  const [publicPageId, setPublicPageId] = useState<string>('-1');
  const [messageList, setMessageList] = useState<SnsMessage<FacebookMessage>[]>([]);
  const [messageUpdateType, setMessageUpdateType] = useState<MessageUpdateType>('append');
  const [bottomLoading, setBottomLoading] = useState(false);
  const [bottomHasMore, setBottomHasMore] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
  const [topHasMore, setTopHasMore] = useState(false);
  const [contacts, setContacts] = useState<SnsChatItem<FacebookMessage, FacebookChatItem>[]>([]);
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);

  const hasChatPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'FACEBOOK', 'OP'));

  const contact = useMemo(() => contacts.find(item => item.id === id), [contacts, id]);

  const syncState = useRef<{
    id: string | null;
    messageList: SnsMessage<FacebookMessage>[];
    publicPageList: { pageId: string; pageName: string }[];
  }>({
    id: null,
    messageList: [],
    publicPageList: [],
  });

  useEffect(() => {
    syncState.current = {
      id,
      messageList,
      publicPageList,
    };
  }, [id, messageList, publicPageList]);

  const [tabKey, setTabKey] = useState<MessageTab>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountText = unreadCount > 99 ? ' 99+' : unreadCount ? ` ${unreadCount}` : '';

  const [editorDisabled, setEditorDisabled] = useState(false);
  const [editorDisabledReason, setEditorDisabledReason] = useState<string>('');
  const [editorRemainText, setEditorRemainText] = useState<React.ReactNode>('');

  useEffect(() => {
    let latestReceiveMsgTime: null | number = null;

    if (contact && contact.originContact.latestReceiveMsgTime) {
      latestReceiveMsgTime = new Date(contact.originContact.latestReceiveMsgTime).valueOf();
    }

    if (!latestReceiveMsgTime) {
      setEditorDisabled(true);
      setEditorDisabledReason(getTransText('DUIFANGHUIFUHOUCAIKEYIFASONGXIAOXI'));
      setEditorRemainText('');
    } else {
      const remainTime = latestReceiveMsgTime + ONE_DAY - Date.now();

      if (remainTime < 0) {
        setEditorDisabled(true);
        setEditorDisabledReason(getTransText('CHAOCHU24HGOUTONGSHIXIAO'));
        setEditorRemainText('');
      } else {
        const handler = () => {
          const remainTime = (latestReceiveMsgTime as number) + ONE_DAY - Date.now();

          if (remainTime < 0) {
            setEditorDisabled(true);
            setEditorDisabledReason(getTransText('CHAOCHU24HGOUTONGSHIXIAO'));
            setEditorRemainText('');
          } else {
            setEditorDisabled(false);
            setEditorDisabledReason('');
            setEditorRemainText(getRemainText(remainTime));
          }
        };
        handler();
        const interval = setInterval(handler, 1000);

        return () => interval && clearInterval(interval);
      }
    }
  }, [contact]);

  const [image, setImage] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const [imageSending, setImageSending] = useState<boolean>(false);
  const imageSendKey = useRef(0);

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(image);
      reader.onload = event => {
        if (event.target && event.target.result) {
          const blob = new Blob([event.target.result], { type: image.type });
          const blobURL = window.URL.createObjectURL(blob);

          setImageSrc(blobURL);
        }
      };
    }
  }, [image]);

  const handleUpdateMessageList = () => {
    const { id, messageList } = syncState.current;

    if (!id) return;

    const latestMessage = messageList[messageList.length - 1];

    if (latestMessage) {
      facebookApi
        .getMessageList({
          contactId: latestMessage.originMessage.contactId as string,
          latestMsgSeqNo: latestMessage.originMessage.messageSeqNo as string,
          latestMsgId: latestMessage.originMessage.messageId as string,
          limit: 30,
          pageId: latestMessage.originMessage.pageId,
          pullDirection: 'ASC',
        })
        .then(data => {
          if (id === syncState.current.id) {
            const payload = data.messageList.map(convertToSnsMessage);

            setMessageList([...messageList, ...payload]);
            setMessageUpdateType('append');
          }
        });
    }
  };

  const handleImageSendStart = () => {
    if (image) {
      const sendKey = Date.now();

      setImageSending(true);
      imageSendKey.current = sendKey;

      const nosUploader = new NosUploader(image);

      nosUploader.on('complete', res => {
        whatsAppApi
          .getNosDownloadUrl({
            fileName: image.name,
            nosKey: res.nosKey,
          })
          .then(downloadUrl => {
            if (imageSendKey.current === sendKey) {
              if (contact) {
                facebookApi
                  .sendMessage({
                    senderId: contact.originContact.pageId,
                    receiverId: contact.originContact.contactId,
                    messageType: FacebookMessageType.IMAGE,
                    messageContent: {
                      messageText: '',
                      mediaUrl: downloadUrl,
                    },
                  })
                  .then(() => {
                    setImage(null);
                    setImageSrc('');
                    setImageVisible(false);
                    setImageSending(false);
                    handleChatListFetch(publicPageId !== '-1' ? [publicPageId] : undefined, tabKey === 'UNREAD');
                    handleUpdateMessageList();
                  });
              }
            }
          });
      });
      nosUploader.on('error', error => {
        console.log('nos-uploader-error', error);
      });
    }
  };

  const handlePublicPageFetch = () => {
    setPublicPageFetching(true);

    return facebookApi
      .getPublicPageBriefList()
      .then(nextPublicPageList => {
        setPublicPageList([{ pageId: '-1', pageName: getTransText('QUANBUGONGGONGZHUYE') }, ...(nextPublicPageList || [])]);

        return nextPublicPageList;
      })
      .finally(() => {
        setPublicPageFetching(false);
      });
  };

  const handleChatListFetch = (pageIdList?: string[], isUnread?: boolean) => {
    const { publicPageList } = syncState.current;

    if (!Array.isArray(pageIdList) || !pageIdList.length) {
      pageIdList = publicPageList.map(item => item.pageId);
    }

    if (pageIdList.length) {
      setContactsLoading(true);

      return facebookApi
        .getChatList({
          onlyShowUnRead: isUnread || false,
          pageIdList: pageIdList.join(','),
        })
        .then(data => {
          let nextUnreadCount = 0;
          const { contactList, count } = data;
          const nextContacts = contactList.map(item => {
            nextUnreadCount += item.msgUnReadCount;

            return {
              id: getId(item.pageId, item.contactId),
              name: item.contactName,
              time: new Date(item.latestMessageInfo.messageTime).valueOf() || null,
              avatar: item.contactAvatar,
              account: `${getTransText('fensisuoshugonggongzhuye')}：${item.pageName}`,
              message: {
                id: item.latestMessageInfo.messageId,
                text: getMessageText(item.latestMessageInfo),
                originMessage: item.latestMessageInfo,
              },
              unreadCount: item.msgUnReadCount || 0,
              originContact: item,
            };
          });

          setContacts(nextContacts);
          setUnreadCount(nextUnreadCount);

          return nextContacts;
        })
        .finally(() => {
          setContactsLoading(false);
        });
    }
    return Promise.resolve([]);
  };

  const handleExpiresAccountFetch = () => {
    facebookApi.getExpiresAccount().then(expiresAccounts => {
      const nextExpiresVisible = (expiresAccounts || []).length > 0;

      setExpiresVisible(nextExpiresVisible);
    });
  };

  useEffect(() => {
    if (location.hash.includes('page=facebookMessage')) {
      handleExpiresAccountFetch();
    }
  }, [location]);

  useEffect(() => {
    if (!qs.pageId || !qs.contactId) {
      handlePublicPageFetch().then(nextPublicPageList => {
        handleChatListFetch(nextPublicPageList.map(item => item.pageId));
      });
    } else {
      const nextId = getId(qs.pageId, qs.contactId);

      if (nextId !== syncState.current.id) {
        syncState.current.id = nextId;

        handlePublicPageFetch().then(nextPublicPageList => {
          handleChatListFetch(nextPublicPageList.map(item => item.pageId)).then(contacts => {
            if (nextId === syncState.current.id) {
              setId(nextId as string);
              setMessageList([]);
              setTopHasMore(false);
              setTopLoading(false);

              const nextContact = contacts.find(item => item.id === nextId);

              if (nextContact && nextContact.message) {
                facebookApi
                  .getMessageList({
                    contactId: nextContact.originContact.contactId as string,
                    latestMsgSeqNo: nextContact.message.originMessage.messageSeqNo as string,
                    latestMsgId: nextContact.message.originMessage.messageId as string,
                    limit: 30,
                    pageId: nextContact.message.originMessage.pageId,
                    pullDirection: 'DESC',
                  })
                  .then(data => {
                    if (nextId === syncState.current.id) {
                      if (nextContact.message) {
                        const payload = data.messageList;
                        const { originMessage } = nextContact.message!;
                        const nextMessageList = [...payload, originMessage].map(convertToSnsMessage);

                        setMessageList(nextMessageList);
                        setMessageUpdateType('append');
                        setTopHasMore(data.hasMoreMessage);
                        setTopLoading(false);
                      }
                    }
                  });
              }
            }
          });
        });
      }
    }
  }, [qs.pageId, qs.contactId]);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('facebookNewMessage', {
      func: () => {
        setPublicPageId('-1');
        handleChatListFetch();
        handleUpdateMessageList();
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('facebookNewMessage', id);
    };
  }, []);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('facebookAccountExpires', {
      func: () => {
        setExpiresVisible(true);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('facebookAccountExpires', id);
    };
  }, []);

  if (!isAuthorized) {
    return (
      <PermissionCheckPage resourceLabel="FACEBOOK" accessLabel="VIEW" menu="FACEBOOK_MSG">
        <div style={{ height: '100%' }}>
          <Authorize loading={authorizedLoading} trackType="message" />
        </div>
      </PermissionCheckPage>
    );
  }

  return (
    <PermissionCheckPage resourceLabel="FACEBOOK" accessLabel="VIEW" menu="FACEBOOK_MSG">
      <ChatContext.Provider
        value={{
          chatBodyColor: '#FFFFFF',
          chatEditorColor: '#FFFFFF',
          receiveMessageColor: '#F6F7FA',
          sendMessageColor: '#F2F5FF',
          onlySendImage: true,
          sendTextMaxLength: 2000,
        }}
      >
        <div className={style.container}>
          <div className={style.chatListWrapper}>
            {expiresVisible && (
              <div className={style.expiresAlertWrapper}>
                <Alert
                  className={style.expiresAlert}
                  type="warning"
                  showIcon
                  closable
                  message={
                    <>
                      {getTransText('bufenzhanghaoshixiaowufatongbu')}
                      <a onClick={() => setFacebookModalShow({ accModal: true })}>{getTransText('chongxinbangding')}</a>
                    </>
                  }
                  afterClose={() => setExpiresVisible(false)}
                />
              </div>
            )}
            <div className={style.chatListFilter}>
              <EnhanceSelect<string>
                className={style.publicPageSelect}
                dropdownClassName={style.publicPageSelectDropdown}
                placeholder={getTransText('qingxuanzegonggongzhuye')}
                suffixIcon={<DownTriangle />}
                value={publicPageId}
                onChange={nextPageId => {
                  nextPageId = nextPageId || '-1';
                  setPublicPageId(nextPageId);
                  handleChatListFetch(nextPageId !== '-1' ? [nextPageId] : undefined, tabKey === 'UNREAD');
                  facebookTracker.trackMessage('filter');
                }}
              >
                {publicPageList.map(item => (
                  <InSingleOption value={item.pageId}>{item.pageName}</InSingleOption>
                ))}
              </EnhanceSelect>
              <ChatRefreshIcon
                className={style.refreshIcon}
                onClick={() => {
                  Toast.success(getTransText('gengxinchenggong'));
                  handleExpiresAccountFetch();
                  handlePublicPageFetch().then(nextPublicPageList => {
                    handleChatListFetch(publicPageId !== '-1' ? [publicPageId] : nextPublicPageList.map(item => item.pageId), tabKey === 'UNREAD');
                    handleUpdateMessageList();
                  });
                  facebookTracker.trackMessage('refresh');
                }}
              />
            </div>
            <Tabs
              className={style.chatListTab}
              activeKey={tabKey}
              onChange={nextTabKey => {
                setTabKey(nextTabKey as MessageTab);
                handleChatListFetch(publicPageId !== '-1' ? [publicPageId] : undefined, nextTabKey === 'UNREAD');

                if (nextTabKey === 'ALL') {
                  facebookTracker.trackMessage('all');
                }
                if (nextTabKey === 'UNREAD') {
                  facebookTracker.trackMessage('unread');
                }
              }}
            >
              <Tabs.TabPane key="ALL" tab={getTransText('QUANBU')} />
              <Tabs.TabPane key="UNREAD" tab={`${getTransText('WEIDU')}${unreadCountText}`} />
            </Tabs>
            <ChatList
              className={style.chatList}
              id={id}
              list={contacts}
              loading={publicPageFetching || contactsLoading}
              onIdChange={nextId => {
                setId(nextId as string);
                setMessageList([]);
                setTopHasMore(false);
                setTopLoading(false);

                const nextContact = contacts.find(item => item.id === nextId);

                if (nextContact && nextContact.message) {
                  facebookApi
                    .getMessageList({
                      contactId: nextContact.originContact.contactId as string,
                      latestMsgSeqNo: nextContact.message.originMessage.messageSeqNo as string,
                      latestMsgId: nextContact.message.originMessage.messageId as string,
                      limit: 30,
                      pageId: nextContact.message.originMessage.pageId,
                      pullDirection: 'DESC',
                    })
                    .then(data => {
                      if (nextId === syncState.current.id) {
                        const payload = data.messageList;
                        const { originMessage } = nextContact.message!;
                        const nextMessageList = [...payload, originMessage].map(convertToSnsMessage);

                        setMessageList(nextMessageList);
                        setMessageUpdateType('append');
                        setTopHasMore(data.hasMoreMessage);
                        setTopLoading(false);
                      }
                    });
                }
              }}
              onChatItemClick={nextId => {
                const nextContact = contacts.find(item => item.id === nextId);

                if (nextContact && nextContact.message) {
                  const contactUnreadCount = nextContact.unreadCount;

                  if (contactUnreadCount) {
                    facebookApi
                      .readMessage({
                        contactId: nextContact.originContact.contactId as string,
                        pageId: nextContact.message.originMessage.pageId,
                        readCount: contactUnreadCount,
                      })
                      .then(() => {
                        const nextContacts = contacts.map(item => {
                          if (item.originContact.contactId !== nextContact.originContact.contactId) return item;

                          return { ...item, unreadCount: 0 };
                        });

                        setContacts(nextContacts);
                        setUnreadCount(previous => Math.max(previous - contactUnreadCount, 0));
                      });
                  }
                }

                facebookTracker.trackMessage('detail');
              }}
              bottomLoading={bottomLoading}
              bottomHasMore={bottomHasMore}
              onScrollToBottom={() => {}}
            />
          </div>
          {contact && (
            <ChatContent
              className={style.chatContent}
              id={contact.originContact.contactId}
              name={contact.name}
              avatar={contact.avatar}
              account={contact.account}
              messageList={messageList}
              messageUpdateType={messageUpdateType}
              topHasMore={topHasMore}
              topLoading={topLoading}
              extraContent={
                messageList.length ? (
                  editorDisabled ? (
                    <Alert className={classnames(style.editorExtraContent, style.editorExtraContentDisabled)} message={editorDisabledReason} type="warning" showIcon />
                  ) : (
                    <Alert className={style.editorExtraContent} message={editorRemainText} type="warning" showIcon />
                  )
                ) : null
              }
              editorDisabled={editorDisabled || !hasChatPermisson}
              onScrollToTop={() => {
                const message = messageList[0];

                if (message) {
                  setTopLoading(true);

                  facebookApi
                    .getMessageList({
                      contactId: contact.originContact.contactId as string,
                      latestMsgSeqNo: message.originMessage.messageSeqNo as string,
                      latestMsgId: message.originMessage.messageId as string,
                      limit: 30,
                      pageId: message.originMessage.pageId,
                      pullDirection: 'DESC',
                    })
                    .then(data => {
                      if (contact.id === syncState.current.id) {
                        const payload = data.messageList.map(convertToSnsMessage);

                        setMessageList([...payload, ...messageList]);
                        setMessageUpdateType('prepend');
                        setTopHasMore(data.hasMoreMessage);
                        setTopLoading(false);
                      }
                    });
                }
              }}
              onSend={text => {
                facebookApi
                  .sendMessage({
                    senderId: contact.originContact.pageId,
                    receiverId: contact.originContact.contactId,
                    messageType: FacebookMessageType.TEXT,
                    messageContent: {
                      messageText: text,
                      mediaUrl: '',
                    },
                  })
                  .then(() => {
                    handleChatListFetch(publicPageId !== '-1' ? [publicPageId] : undefined, tabKey === 'UNREAD');
                    handleUpdateMessageList();
                  });

                facebookTracker.trackMessage('reply');
              }}
              onSendFile={file => {
                const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
                const videoTypes = ['video/mp4', 'video/3gpp'];
                const fileTypes = [
                  'audio/aac',
                  'audio/mp4',
                  'audio/mpeg',
                  'audio/amr',
                  'audio/ogg',
                  'audio/opus',
                  'application/vnd.ms-powerpoint',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/pdf',
                  'text/plain',
                  'application/vnd.ms-excel',
                ];
                const isImage = imageTypes.includes(file.type);
                const isVideo = videoTypes.includes(file.type);
                const isFile = fileTypes.includes(file.type);

                if (isImage) {
                  facebookTracker.trackMessage('picture');

                  if (file.size > 1024 * 1024 * 5) {
                    return Toast.error(`${getTransText('tupiandaxiaochaoguo')} 5MB`);
                  }

                  setImage(file);
                  setImageVisible(true);

                  return;
                }

                return Toast.error(getTransText('buzhichidewenjianleixing'));
              }}
            />
          )}
          {!contact && (
            <div className={style.emptyContent}>
              <img className={style.emptyImage} src={ChatContentEmpty} />
              <div className={style.emptyTitle}>{getTransText('zhuanshuzhanghao-1')}</div>
              <div className={style.emptyTip}>{getTransText('zhuanshuzhanghao-2')}</div>
            </div>
          )}
          <Modal
            title={getTransText('fasongtupian')}
            width={640}
            visible={imageVisible}
            keyboard={false}
            maskClosable={false}
            onOk={handleImageSendStart}
            onCancel={() => {
              setImage(null);
              setImageSrc('');
              setImageVisible(false);
              setImageSending(false);
              imageSendKey.current = 0;
            }}
            okText={!imageSending ? getTransText('QUEDING') : getTransText('FASONGZHONG')}
            okButtonProps={{ loading: imageSending }}
          >
            {image && (
              <>
                <img
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: 292,
                    margin: '0 auto',
                    marginBottom: 16,
                  }}
                  src={imageSrc}
                />
                <div
                  className={style.ellipsis}
                  style={{
                    color: '#272E47',
                    fontSize: 16,
                    lineHeight: '24px',
                    marginBottom: 4,
                    textAlign: 'center',
                  }}
                >
                  {image.name}
                </div>
                <div
                  style={{
                    color: '#272E47',
                    fontSize: 16,
                    lineHeight: '24px',
                    textAlign: 'center',
                  }}
                >
                  {formatFileSize(image.size)}
                </div>
              </>
            )}
          </Modal>
        </div>
      </ChatContext.Provider>
    </PermissionCheckPage>
  );
};

export default FacebookMessage;
