import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import { Space, Select, Pagination, Spin, Divider, Button, Drawer } from 'antd';
import qs from 'querystring';
import {
  apis,
  apiHolder,
  ContactApi,
  OrgApi,
  WhatsAppApi,
  WhatsAppMessage,
  WhatsAppMessageType,
  WhatsAppBusinessMessageAccount,
  WhatsAppBusinessMessageContact,
  WhatsAppBusinessMessageRequest,
  WhatsAppMessageDirection,
  WhatsAppTemplate,
  WhatsAppTemplatePlaceholders,
} from 'api';
import { getHandyTime } from '@/components/Layout/SNS/utils';
import DefaultAvatar from '@/images/icons/SNS/default-avatar.svg';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ChatImage } from '@/components/Layout/SNS/WhatsApp/components/chat/ChatItem/ChatImage';
import { ChatVideo } from '@/components/Layout/SNS/WhatsApp/components/chat/ChatItem/ChatVideo';
import { ChatFile } from '@/components/Layout/SNS/WhatsApp/components/chat/ChatItem/ChatFile';
import SnsChatMessage from '@/components/Layout/SNS/components/ChatMessage/chatImage';
import SnsChatVideo from '@/components/Layout/SNS/components/ChatMessage/chatVideo';
import SnsChatFile from '@/components/Layout/SNS/components/ChatMessage/chatFile';
import { EmptyTips } from '@/components/Layout/Customer/components/sidebar/component/emptyTips';
import { fillTemplateWithTemplatePlaceholders, getMessageText } from '@/components/Layout/SNS/WhatsApp/utils';
import TemplatePreview, { showTemplatePreviewModal } from '@/components/Layout/SNS/WhatsApp/components/template/templatePreview';
import { getTransText } from '@/components/util/translate';
import style from './businessMessageHistory.module.scss';

interface BusinessMessageHistoryProps {
  extraFilter: React.ReactElement;
  companyId: string;
}

const { Option } = Select;

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const getAccountInfo = (accountId: string, whatsApp: string) => {
  return contactApi.doGetContactById(accountId).then(accounts => {
    if (accounts[0]) {
      const accountInfo = accounts[0].contact;
      const name = accountInfo?.contactName;
      const email = accountInfo?.accountName;

      return {
        name: `${name} (${whatsApp})`,
        avatar: <AvatarTag user={{ name, email }} size={30} />,
      };
    }

    return {
      name: '',
      avatar: null,
    };
  });
};

const PAGE_SIZE = 10;

interface WhatsAppHistoryMessage extends WhatsAppMessage {
  name: string;
  avatar: any;
}

export const BusinessMessageHistory: React.FC<BusinessMessageHistoryProps> = props => {
  const { companyId, extraFilter } = props;
  const [accounts, setAccounts] = useState<WhatsAppBusinessMessageAccount[]>([]);
  const [contacts, setContacts] = useState<WhatsAppBusinessMessageContact[]>([]);
  const [messageList, setMessageList] = useState<WhatsAppHistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState<WhatsAppBusinessMessageRequest>({
    accountIds: [],
    contactWhatsApps: [],
    start: 0,
    limit: PAGE_SIZE,
    resourceId: companyId,
    resourceType: 1,
  });
  const [openSearchPanel, setOpenSearchPanel] = useState<boolean>(false);

  const handleOpenMessgeSearch = () => {
    console.log('打开搜索面板');
    setOpenSearchPanel(true);
  };
  const handleCloseMessgeSearch = () => {
    setOpenSearchPanel(false);
  };

  useEffect(() => {
    whatsAppApi
      .getBusinessMessageContacts({
        resourceId: companyId,
        resourceType: 1,
      })
      .then(data => {
        setAccounts(data.accounts);
        setContacts(data.contacts);

        const payload = {
          accountIds: data.accounts[0] ? [data.accounts[0].accountId] : [],
          contactWhatsApps: data.contacts[0] ? [data.contacts[0].contactWhatsapp] : [],
        };

        setParams({
          ...params,
          ...payload,
        });
      });
  }, []);

  useEffect(() => {
    if (params.accountIds.length && params.contactWhatsApps.length) {
      setLoading(true);

      whatsAppApi
        .getBusinessMessageHistory(params)
        .then(data => {
          const nextMessageList = data.recorders;

          Promise.all(
            nextMessageList.map(message => {
              if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
                return Promise.resolve({
                  name: message.contactName ? `${message.contactName} (${message.to})` : message.contactWhatsApp,
                  avatar: null as any,
                });
              } else {
                return getAccountInfo(message.accountId, message.from);
              }
            })
          ).then(userInfos => {
            userInfos.forEach((info, index) => {
              const message = nextMessageList[index] as WhatsAppHistoryMessage;

              message.name = info.name || '';
              message.avatar = info.avatar;
            });

            setMessageList(nextMessageList as WhatsAppHistoryMessage[]);
            setLoading(false);
          });
          setTotal(data.count);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setMessageList([]);
      setTotal(0);
    }
  }, [params]);

  const renderMessage = (message: WhatsAppMessage) => {
    try {
      const content = JSON.parse(message.content);

      if (message.messageType === WhatsAppMessageType.TEXT) {
        return content.text;
      }

      if (message.messageType === WhatsAppMessageType.IMAGE) {
        if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
          return <ChatImage style={{ borderColor: 'rgba(38, 42, 51, 0.16)' }} content={content} />;
        }
        if (message.messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
          return <SnsChatMessage src={content.mediaUrl} />;
        }
      }

      if (message.messageType === WhatsAppMessageType.VIDEO) {
        if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
          return <ChatVideo style={{ borderColor: 'rgba(38, 42, 51, 0.16)' }} content={content} />;
        }
        if (message.messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
          return <SnsChatVideo src={content.mediaUrl} />;
        }
      }

      if (message.messageType === WhatsAppMessageType.DOCUMENT) {
        if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
          return <ChatFile style={{ border: '0.5px solid rgba(38, 42, 51, 0.16)' }} content={content} />;
        }
        if (message.messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
          const downloadUrl = content.mediaUrl;
          const query = qs.parse(downloadUrl);

          return (
            <SnsChatFile
              style={{ borderColor: 'rgba(38, 42, 51, 0.16)' }}
              fileName={content.filename || query.download || ''}
              fileType={content.fileType || ''}
              fileSize={content.fileSize || 0}
              downloadUrl={downloadUrl}
            />
          );
        }
      }

      if (message.messageType === WhatsAppMessageType.TEMPLATE) {
        try {
          let template = content.template as WhatsAppTemplate;
          const structure = JSON.parse(template.structure as unknown as string);
          template = { ...template, structure };
          const templateFilled = fillTemplateWithTemplatePlaceholders({
            template,
            templatePlaceholders: JSON.parse(content.params) as WhatsAppTemplatePlaceholders,
          });
          return (
            <div
              style={{
                border: '0.5px solid rgba(38, 42, 51, 0.16)',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => showTemplatePreviewModal(templateFilled)}
            >
              <TemplatePreview template={templateFilled} />
            </div>
          );
        } catch (error) {
          return getTransText('[BUZHICHIDEMOBANLEIXING]');
        }
      }

      return getMessageText(message) || `[${getTransText('ZANBUZHICHIDEXIAOXILEIXING')}]`;
    } catch (error) {
      return `[${getTransText('ZANBUZHICHIDEXIAOXILEIXING')}]`;
    }
  };

  return (
    <div className={style.businessMessageHistory}>
      <Spin spinning={loading}>
        <div className={style.filter}>
          <Space>
            {extraFilter}
            <Select<string>
              style={{ width: 160 }}
              allowClear
              placeholder={getIn18Text('YUANGONG')}
              maxTagCount="responsive"
              value={params.accountIds[0]}
              onChange={value =>
                setParams({
                  ...params,
                  start: 0,
                  accountIds: value ? [value] : [],
                })
              }
            >
              {accounts.map(item => (
                <Option value={item.accountId}>{item.accountName}</Option>
              ))}
            </Select>
            <Select<string>
              style={{ width: 160 }}
              allowClear
              placeholder={getIn18Text('LIANXIREN')}
              maxTagCount="responsive"
              value={params.contactWhatsApps[0]}
              onChange={value =>
                setParams({
                  ...params,
                  start: 0,
                  contactWhatsApps: value ? [value] : [],
                })
              }
            >
              {contacts.map(item => (
                <Option value={item.contactWhatsapp}>{item.contactName}</Option>
              ))}
            </Select>
          </Space>
          <Divider />
          <Button onClick={handleOpenMessgeSearch}>{getIn18Text('SOUSUOHUIHUA')}</Button>
        </div>
        <div className={style.messageList}>
          {messageList.length ? (
            messageList.map(message => (
              <div className={style.message}>
                <div className={style.avatar}>{message.avatar || <img style={{ width: 30, height: 30 }} src={DefaultAvatar} />}</div>
                <div className={style.content}>
                  <div className={style.header}>
                    <div className={style.name}>{message.name}</div>
                    <div className={style.time}>{getHandyTime(message.sentAt)}</div>
                  </div>
                  <div className={style.body}>{renderMessage(message)}</div>
                </div>
              </div>
            ))
          ) : (
            <EmptyTips />
          )}
        </div>
        <div className={style.pagination}>
          <Pagination
            className="pagination-wrap"
            size="small"
            current={params.start + 1}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={page =>
              setParams({
                ...params,
                start: page - 1,
              })
            }
          />
        </div>
        <Drawer placement="right" onClose={handleCloseMessgeSearch} visible={openSearchPanel}>
          {getIn18Text('SOUSUOMIANBAN')}
          {/* <MockComponent
            type="business"
            whatsapp={params.whatsappId}
            accId={params.contactWhatsApps[0]}
            handleHighlightMessage={messageId => console.log(messageId)}
          /> */}
        </Drawer>
      </Spin>
    </div>
  );
};
