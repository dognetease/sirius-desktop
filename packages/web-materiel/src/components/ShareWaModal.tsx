import React, { useState, useEffect, useMemo, useRef } from 'react';
import classnames from 'classnames';
import { Dropdown, Menu, Empty, Progress } from 'antd';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { TongyongSousuo } from '@sirius/icons';
import { LoadingOutlined } from '@ant-design/icons';
import { api, apis, MaterielShare, MaterielApi, InsertWhatsAppApi, WaMgmtChannel, WaMgmtPageState, WaMgmtChat } from 'api';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { TongyongZhankaiXia } from '@sirius/icons';
import { LoginWaModal } from './LoginWaModal';
import DefaultAvatar from '@web-materiel/images/default-avatar.svg';
import SendProgress from '@web-materiel/images/send-progress.png';
import { enhanceLink } from '@web-materiel/utils';
import style from './ShareWaModal.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const materielApi = api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;

const MAX_SEND_COUNT = 5;

const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getShareCaption = (share: MaterielShare, userId: string, chatId: string) => {
  const shareLink = enhanceLink(share.shareLink, { userId, chatId });

  return [share.title, share.description, shareLink].join('\n');
};

interface ShareWaModalProps {
  visible: boolean;
  share: MaterielShare | null;
  onFinish: (channelId: string, chatId: string) => void;
  onCancel: () => void;
}

enum ShareStep {
  PICKING = 'PICKING',
  SENDING = 'SENDING',
}

interface User extends WaMgmtChannel {
  pageState: WaMgmtPageState | null;
}

export const ShareWaModal: React.FC<ShareWaModalProps> = props => {
  const { visible, share, onFinish, onCancel } = props;
  const [step, setStep] = useState<ShareStep>(ShareStep.PICKING);
  const [channelList, setChannelList] = useState<WaMgmtChannel[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [chatList, setChatList] = useState<WaMgmtChat[]>([]);
  const [chatListLoading, setChatListLoading] = useState<boolean>(false);
  const [pickedChatIds, setPickedChatIds] = useState<string[]>([]);
  const [query, setQuery] = useState<string>('');
  const [loginVisible, setLoginVisible] = useState<boolean>(false);
  const [loginChannelId, setLoginChannelId] = useState<string | null>(null);
  const [loginWhatsAppNumber, setLoginWhatsAppNumber] = useState<string | undefined>(undefined);
  const [sendProgress, setSendProgress] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timer | null>(null);
  const previewSrc = share ? enhanceLink(share.shareLink, { preview: 1 }) : undefined;

  const handleChannelListFetch = (initialChannelId?: string) => {
    insertWhatsAppApi.getMgmtChannelList().then(res => {
      const nextChannelList = res.channels || [];
      setChannelList(nextChannelList);
      initialChannelId = initialChannelId || nextChannelList[0]?.channelId;
      if (initialChannelId) {
        handleChannelChange(initialChannelId, nextChannelList);
      }
    });
  };

  const handleTimerClear = () => {
    timerRef.current && clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (visible) {
      handleChannelListFetch();
    } else {
      setStep(ShareStep.PICKING);
      setChannelList([]);
      setChannelId(null);
      setUser(null);
      setChatList([]);
      setPickedChatIds([]);
      setQuery('');
      setSendProgress(0);
      handleTimerClear();
    }
  }, [visible]);

  useEffect(() => handleTimerClear, []);

  const handleCancel = () => {
    onCancel();
  };

  const handleChannelChange = (nextChannelId: string, channelList: WaMgmtChannel[]) => {
    const nextUser = channelList.find(item => item.channelId === nextChannelId);
    setChannelId(nextChannelId || null);
    setChatList([]);
    setPickedChatIds([]);
    setQuery('');
    if (nextUser) {
      setUser({ ...nextUser, pageState: null });
      insertWhatsAppApi
        .getMgmtQrCode({
          transportId: nextChannelId,
        })
        .then(res => {
          setUser(
            user =>
              user && {
                ...user,
                pageState: res.pageState,
              }
          );
        });
      setChatListLoading(true);
      insertWhatsAppApi
        .getMgmtChatList({
          userId: nextUser.whatsApp,
          replied: true,
        })
        .then(res => {
          setChatList(res.content || []);
        })
        .finally(() => {
          setChatListLoading(false);
        });
    } else {
      setUser(null);
    }
  };

  const overlay = (
    <div className={style.channelListWrapper}>
      <div className={style.channelList}>
        {channelList.map(channel => (
          <div
            key={channel.channelId}
            className={classnames(style.channel, {
              [style.active]: channel.channelId === channelId,
            })}
            onClick={() => {
              if (channel.channelId !== channelId) {
                handleChannelChange(channel.channelId, channelList);
              }
            }}
          >
            <img className={style.avatar} src={channel.avatarUrl || DefaultAvatar} />
            <div className={style.name}>{`${channel.accountName} (${channel.whatsAppNumber})`}</div>
          </div>
        ))}
      </div>
      <a onClick={() => handleWaLogin(null)}>添加账号</a>
    </div>
  );

  const chatListFiltered = useMemo(() => {
    const queryLower = query.toLowerCase();

    return chatList.filter(chat => !chat.group).filter(chat => chat.formattedTitle.toLowerCase().includes(queryLower) || chat.chatId.toLowerCase().includes(queryLower));
  }, [chatList, query]);

  const handleWaLogin = (channelId: string | null) => {
    setLoginVisible(true);
    setLoginChannelId(channelId);
    setLoginWhatsAppNumber(channelId ? user?.whatsAppNumber : undefined);
  };

  const handleWaSend = () => {
    if (!share) return;

    setStep(ShareStep.SENDING);
    const userId = user!.whatsApp;
    const sendMessage = (index: number) => {
      const chatId = pickedChatIds[index];
      const shareCaption = getShareCaption(share, userId, chatId);
      const delayTime = index === 0 ? 0 : getRandomDelay(5000, 10000);
      timerRef.current = setTimeout(() => {
        insertWhatsAppApi
          .sendMgmtImgByUrl({
            transportId: channelId!,
            chatId,
            url: share.coverLink,
            caption: shareCaption,
          })
          .then(res => {
            materielApi.reportWaShare({
              userId,
              chatId,
              messageId: res.id.id,
              shareId: share?.shareId || '',
              state: 'SENT',
            });
          })
          .catch(() => {
            materielApi.reportWaShare({
              userId,
              chatId,
              messageId: '',
              shareId: share?.shareId || '',
              state: 'FAILED',
            });
          })
          .finally(() => {
            if (index < pickedChatIds.length - 1) {
              sendMessage(index + 1);
              setSendProgress(index + 1);
            } else {
              onFinish(channelId!, chatId);
              handleTimerClear();
            }
          });
      }, delayTime);
    };

    sendMessage(0);
  };

  return (
    <>
      <Modal
        className={style.shareWaModal}
        title="分享到 WhatsApp"
        width={790}
        visible={visible && step === ShareStep.PICKING}
        footerTopLine
        okButtonProps={{ disabled: !share || !user || user.pageState !== WaMgmtPageState.READY || !pickedChatIds.length }}
        onOk={handleWaSend}
        onCancel={handleCancel}
      >
        <div className={style.header}>
          {user ? (
            <div className={style.user}>
              <img className={style.avatar} src={user.avatarUrl || DefaultAvatar} />
              <div className={style.name}>{user.accountName}</div>
              {user.pageState && user.pageState !== WaMgmtPageState.READY && <a onClick={() => handleWaLogin(user.channelId)}>去登录</a>}
            </div>
          ) : (
            <a onClick={() => handleWaLogin(null)}>添加账号</a>
          )}
          <Dropdown overlay={overlay} trigger={['click']}>
            <div className={style.channelListTrigger}>
              <TongyongZhankaiXia wrapClassName="wmzz" />
            </div>
          </Dropdown>
        </div>
        <div className={style.filter}>
          <Input
            className={style.query}
            placeholder="搜索联系人"
            value={query}
            allowClear
            prefix={<TongyongSousuo wrapClassName={classnames('wmzz', style.searchIcon)} />}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={style.body}>
          <div className={style.chatListWrapper}>
            <div className={style.chatListTitle}>联系人列表 ({`已选 ${pickedChatIds.length}/${MAX_SEND_COUNT}`})</div>
            {chatListLoading ? (
              <div className={style.chatListLoading}>
                <LoadingOutlined spin className={style.loadingIcon} />
              </div>
            ) : chatListFiltered.length ? (
              <div className={style.chatList}>
                {chatListFiltered.map((chat: WaMgmtChat) => {
                  const checked = pickedChatIds.includes(chat.chatId);
                  const disabled = !checked && pickedChatIds.length === MAX_SEND_COUNT;
                  return (
                    <div
                      className={classnames(style.chat, {
                        [style.disabled]: disabled,
                      })}
                      key={chat.chatId}
                      onClick={() => {
                        if (disabled) return;
                        if (checked) {
                          setPickedChatIds(pickedChatIds.filter(id => id !== chat.chatId));
                        } else {
                          setPickedChatIds([...pickedChatIds, chat.chatId]);
                        }
                      }}
                    >
                      <Checkbox className={style.checkbox} checked={checked} disabled={disabled} />
                      <img className={style.avatar} src={chat.avatarUrl || DefaultAvatar} />
                      <div className={style.name}>{chat.formattedTitle}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={style.chatListEmpty}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </div>
          <div className={style.previewWrapper}>
            <div className={style.previewTitle}>分享预览</div>
            <div className={style.previewContent}>
              <iframe className={style.previewIframe} src={previewSrc} />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        className={style.sendWaProgressModal}
        title={null}
        width={384}
        visible={visible && step === ShareStep.SENDING}
        footer={null}
        onCancel={() =>
          Modal.confirm({
            title: '提示',
            content: '关闭弹窗，会导致终止分享',
            onOk: handleCancel,
          })
        }
      >
        <div className={style.sendWaProgress}>
          <img className={style.sendImg} src={SendProgress} />
          <div className={style.sendTitle}>正在发送中...</div>
          <div className={style.sendDesc}>已发送 {sendProgress} 个联系人，关闭弹窗，会分享失败哦~</div>
          <Progress percent={(sendProgress / pickedChatIds.length) * 100} showInfo={false} />
        </div>
      </Modal>
      <LoginWaModal
        visible={loginVisible}
        channelId={loginChannelId}
        whatsAppNumber={loginWhatsAppNumber}
        onCancel={() => {
          setLoginVisible(false);
          setLoginChannelId(null);
        }}
        onFinish={nextChannelId => {
          handleChannelListFetch(nextChannelId);
          setLoginVisible(false);
          setLoginChannelId(null);
        }}
      />
    </>
  );
};
