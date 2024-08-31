import { getIn18Text } from 'api';
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useMemo, useState } from 'react';
import { apiHolder, apis, MessageHistoryModel, PersonalMessageContact, PersonalMessageHistory, ReqPersonalMessageHistory, WhatsAppApi } from 'api';
import { Pagination, Select, Space, Spin, Divider, Button, Drawer } from 'antd';
import classnames from 'classnames';
import moment from 'moment';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import DefaultAvatar from '@/images/icons/SNS/default-avatar.svg';

import style from './index.module.scss';
import { EmptyTips } from '@/components/Layout/Customer/components/sidebar/component/emptyTips';
import { ReactComponent as AudioIcon } from '@/images/icons/whatsApp/audio-message.svg';
import { BusinessMessageHistory } from './businessMessageHistory';
import SnsChatFile from '@/components/Layout/SNS/components/ChatMessage/chatFile';
import { getTransText } from '@/components/util/translate';

const handleImagePreview = (src: string) => {
  const previewData = [
    {
      downloadUrl: src,
      previewUrl: src,
      OriginUrl: src,
      size: 480,
      name: `${src}-${Date.now()}`,
    },
  ];

  ImgPreview.preview({ data: previewData, startIndex: 0 });
};

interface MessageHistoryProps {
  companyId: string;
}

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const PersonalMessageHistoryList = (props: MessageHistoryProps & { extraFilter: React.ReactElement }) => {
  const { companyId, extraFilter } = props;
  const [contacts, setContacts] = useState<PersonalMessageContact>();
  const [openSearchPanel, setOpenSearchPanel] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<Partial<ReqPersonalMessageHistory>>({
    limit: 10,
  });
  const [listData, setListData] = useState<PersonalMessageHistory>();

  const handleAccountChange = (key: string) => {
    const [accountId, accountWhatsApp] = key.split('_');
    if (!accountId || !accountWhatsApp) return;
    setSearchParams(prev => ({
      ...prev,
      accountId,
      accountWhatsApp,
    }));
  };
  const handleWAIdChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      whatsappId: value,
    }));
  };

  const handleOpenMessgeSearch = () => {
    console.log('打开搜索面板');
    setOpenSearchPanel(true);
  };
  const handleCloseMessgeSearch = () => {
    setOpenSearchPanel(false);
  };

  const handlePageChange = (page: number, pageSize: number = 10) => {
    setSearchParams(prev => ({
      ...prev,
      start: page - 1,
      limit: pageSize,
    }));
  };

  const fetchContacts = () => {
    whatsAppApi.getContactsByCompanyId(companyId).then(res => {
      setContacts(res);
      if (res.accounts.length > 0) {
        setSearchParams(prev => ({
          ...prev,
          accountId: res.accounts[0].accountId,
          accountWhatsApp: res.accounts[0].accountWhatsApp,
          whatsappId: res.contacts.length ? res.contacts[0].contactWhatsapp : '',
        }));
      }
    });
  };

  const fetchMessageList = () => {
    whatsAppApi
      .getPersonalMessageHistory({
        ...searchParams,
        resourceId: companyId,
      } as ReqPersonalMessageHistory)
      .then(res => {
        setListData(res || []);
      });
  };

  useEffect(() => {
    if (companyId) {
      setSearchParams({
        limit: 10,
      });
      fetchContacts();
    }
  }, [companyId]);

  useEffect(() => {
    if (searchParams.accountId && searchParams.whatsappId) {
      fetchMessageList();
    }
  }, [searchParams]);

  const accountName = useMemo(() => {
    if (contacts?.accounts && searchParams.accountId) {
      const selectAccount = contacts.accounts.find(a => a.accountId === searchParams.accountId);
      if (selectAccount) {
        return selectAccount.accountName;
      }
    }
    return '';
  }, [contacts?.accounts, searchParams.accountId]);

  const page = (searchParams.start || 0) + 1;
  const accountValue = searchParams.accountId && searchParams.accountWhatsApp ? searchParams.accountId + '_' + searchParams.accountWhatsApp : undefined;
  return (
    <div className={style.personalMessageHistory}>
      <div className={style.searchBlock}>
        <Space>
          {extraFilter}
          <Select onChange={handleAccountChange} value={accountValue} style={{ width: '160px' }} placeholder={getIn18Text('YUANGONG')}>
            {contacts?.accounts.map(i => {
              const key = i.accountId + '_' + i.accountWhatsApp;
              return (
                <Select.Option value={key} key={key}>
                  {`${i.accountName} (${i.accountWhatsApp})`}
                </Select.Option>
              );
            })}
          </Select>
          <Select onChange={handleWAIdChange} value={searchParams.whatsappId} style={{ width: '160px' }} placeholder={getIn18Text('LIANXIREN')}>
            {contacts?.contacts.map(i => (
              <Select.Option value={i.contactWhatsapp} key={i.contactWhatsapp}>
                {i.contactName + ' (' + i.contactWhatsapp + ')'}
              </Select.Option>
            ))}
          </Select>
        </Space>
        <Divider />
        <Button onClick={handleOpenMessgeSearch}>{getIn18Text('SOUSUOHUIHUA')}</Button>
      </div>
      <p>mock</p>
      <div className={style.messageList}>
        <ul>
          {listData?.recorders?.map(msg => {
            const { messageId } = msg;
            return (
              <li key={messageId}>
                <MessageItem item={msg} accountName={accountName} />
              </li>
            );
          })}
        </ul>
        {listData && listData.count > (searchParams.limit || 10) ? (
          <Pagination
            size="small"
            className="pagination-wrap"
            total={listData?.count}
            current={page}
            pageSize={searchParams.limit || 10}
            onChange={handlePageChange}
            pageSizeOptions={undefined}
          />
        ) : null}
        {!listData || listData.count === 0 ? <EmptyTips text={getTransText('ZANWUSHUJU，KESHAIXUANQITAYUANGONGYIJILIANXIREN')} /> : null}
      </div>
      <Drawer placement="right" onClose={handleCloseMessgeSearch} visible={openSearchPanel}>
        {getIn18Text('SOUSUOMIANBAN')}
        {/* <MockComponent
          type="personal"
          whatsapp={searchParams.whatsappId}
          accId={searchParams.accountId}
          handleHighlightMessage={messageId => console.log(messageId)}
        /> */}
      </Drawer>
    </div>
  );
};

export const MessageItem = ({ item, accountName }: { item: MessageHistoryModel; accountName: string }) => {
  const { messageDirection, from, toAvatar, contactName, sentAt, messageType, content, to } = item;
  const avatar = messageDirection === 1 && toAvatar ? toAvatar : '';
  const name = messageDirection === 0 ? accountName : contactName;
  const snsId = messageDirection === 0 ? from : to;
  return (
    <div className={classnames(style.messageItem, messageDirection === 0 ? style.messageOut : style.messageIn)}>
      <div className={style.avatar}>
        <span>
          <img src={avatar || DefaultAvatar} alt={name} />
        </span>
      </div>
      <div className={style.messageItemMain}>
        <div className={style.messageItemHeader}>
          <div>
            {name}
            &nbsp; ({snsId})
          </div>
          <div>{moment(sentAt).format('MM-DD HH:mm:SS')}</div>
        </div>
        <div className={style.messageItemBody}>
          <MessageContent messageType={messageType} content={content} />
        </div>
      </div>
    </div>
  );
};

const MessageContent = (props: { messageType: string; content: any }) => {
  const { messageType, content } = props;
  try {
    const body = JSON.parse(content);
    switch (messageType) {
      case 'chat':
        return <div>{body.content}</div>;
      case 'image':
        return <MediaRenderer body={body} renderFc={src => <img src={src} className={style.imageThumbnail} onClick={() => handleImagePreview(src)} />} />;
      case 'document': {
        const getDownloadUrl = () => {
          if (!body.nosUploadInfo || !body.nosUploadInfo.nosKey) {
            return Promise.resolve('');
          }
          return whatsAppApi.getNosDownloadUrl({ nosKey: body.nosUploadInfo.nosKey, fileName: body.filename || '' });
        };
        return <SnsChatFile fileName={body.filename} getDownloadUrl={getDownloadUrl} fileSize={body.size} className={style.chatFileContainer} />;
      }
      case 'audio':
      case 'ptt':
        return <AudioMessage body={body} />;
      case 'video':
        return <MediaRenderer body={body} errorText={getTransText('SHIPINTONGBUSHIBAI')} renderFc={src => <video src={src} controls />} />;
      // case 'location':
      //   return <div>暂不支持此消息类型</div>;
      case 'revoked':
        return <div style={{ fontStyle: 'italic', color: '#8696a0' }}>{getTransText('GAIXIAOXIYIBEISHANCHU')}</div>;
      default:
        return (
          <div>
            {getTransText('ZANBUZHICHICIXIAOXILEIXING')}
            {messageType}
          </div>
        );
    }
  } catch (e) {
    console.log('errorMessage', content);
    return <div>{getIn18Text('ZANBUZHICHICIXIAOXI')}</div>;
  }
};
interface MediaContent {
  filename?: string;
  mimeType: string;
  aspectRatio?: number;
  nosUploadInfo: {
    nosKey: string;
  };
}
interface MediaRendererProps {
  defaultSize?: number;
  body: MediaContent;
  renderFc: (src: string) => React.ReactNode;
  errorText?: string;
}
const MediaRenderer = ({ body, renderFc, defaultSize = 160, errorText = getTransText('TUPIANJIAZAISHIBAI') }: MediaRendererProps) => {
  const [loading, setLoading] = useState(false);
  const [realSrc, setRealSrc] = useState<string>();
  const aspectRatio = body.aspectRatio || 1;
  const width = aspectRatio >= 1 ? defaultSize : aspectRatio * defaultSize;
  const height = aspectRatio <= 1 ? defaultSize : aspectRatio * defaultSize;

  useEffect(() => {
    if (body.nosUploadInfo) {
      setLoading(true);
      whatsAppApi
        .getNosDownloadUrl({ nosKey: body.nosUploadInfo.nosKey, fileName: body.filename || '' })
        .then(url => setRealSrc(url))
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);
  const isError = !body.nosUploadInfo || !body.nosUploadInfo.nosKey;
  return (
    <div className={classnames(style.imageMessageWrap, !realSrc ? style.imageBg : '', isError ? style.imageError : '')} style={realSrc ? undefined : { width, height }}>
      {
        // eslint-disable-next-line no-nested-ternary
        loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /> : realSrc ? renderFc(realSrc) : null
      }
      {isError && <span className={style.errorText}>{errorText}</span>}
    </div>
  );
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};
const AudioMessage = ({ body }: { body: MediaContent }) => {
  const [ready, setReady] = useState(false);
  const [realSrc, setRealSrc] = useState<string>();
  const duration = (body as any).duration || 0;

  const handleClick = () => {
    if (body.nosUploadInfo) {
      whatsAppApi
        .getNosDownloadUrl({ nosKey: body.nosUploadInfo.nosKey, fileName: body.filename || '' })
        .then(url => setRealSrc(url))
        .finally(() => {
          setReady(true);
        });
    }
  };

  if (ready && realSrc) {
    return <audio src={realSrc} controls />;
  }
  return (
    <div className={style.audioMsgWrap} onClick={handleClick}>
      <AudioIcon />
      <span>{formatDuration(duration)}</span>
    </div>
  );
};

export const MessageHistory = (props: MessageHistoryProps) => {
  const [type, setType] = useState<'personal' | 'business'>('personal');

  const extraFilter = (
    <Select style={{ width: 140 }} value={type} onChange={setType}>
      <Select.Option value="personal">{getTransText('WhatsApp_GERENHAO')}</Select.Option>
      <Select.Option value="business">{getTransText('WhatsApp_SHANGYEHAO')}</Select.Option>
    </Select>
  );

  if (type === 'personal') {
    return <PersonalMessageHistoryList extraFilter={extraFilter} companyId={props.companyId} />;
  }

  if (type === 'business') {
    return <BusinessMessageHistory extraFilter={extraFilter} companyId={props.companyId} />;
  }

  return null;
};
