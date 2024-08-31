import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import ChatMessage from './ChatMessage';
import { EmptyList } from '@web-edm/components/empty/empty';
import { Spin } from 'antd';
import CssVariables from '@web-common/styles/export.module.scss';
import { fillTemplateWithTemplateParams } from '@/components/Layout/SNS/WhatsAppV2/utils';
import TemplatePreview, { showTemplatePreviewModal } from '@/components/Layout/SNS/WhatsAppV2/components/template/templatePreview';
import { getTransText } from '@/components/util/translate';
import { api, apis, CustomerApi, PersonalWhatsappHistory, WhatsAppApi, WhatsAppTemplate, WhatsAppTemplatePlaceholders } from 'api';
import './ChatMessageList.css';

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const whatsAppApi = api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const loadingIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface MessageListProps {
  type: 'person' | 'business';
  fromWhatsapp: string; // whatsapp 发送人号码
  toWhatsapp: string; // whatsapp 接收人号码
  resourceId: string; // 资源ID
  resourceType: 1 | 2 | 3; // 资源类型：1-客户，2-线索，3-商机
  accId: string; // 外贸通账号id
}
export default forwardRef(function MessageList(props: MessageListProps, ref: any) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [listData, setListData] = useState<PersonalWhatsappHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState('');
  const isPersonal = props.type === 'person';

  // 个人号获取历史消息
  useEffect(() => {
    if (props.type === 'person') {
      if (props.fromWhatsapp && props.toWhatsapp && props.accId) {
        setLoading(true);
        setListData([]);
        customerApi
          .getPersonalWhatsappHistory({
            fromNumber: props.fromWhatsapp,
            toNumber: props.toWhatsapp,
            fromAccId: props.accId,
          })
          .then(res => {
            if (res.content) {
              setListData(res.content);
            }
          })
          .finally(() => setLoading(false));
      } else {
        setListData([]);
      }
    }
  }, [props.fromWhatsapp, props.toWhatsapp, props.accId, props.type]);
  // 商业号获取历史消息
  useEffect(() => {
    if (props.type === 'business') {
      if (props.fromWhatsapp && props.toWhatsapp && props.resourceId && props.resourceType) {
        setLoading(true);
        setListData([]);
        whatsAppApi
          .getMessageListCRM({
            direction: 'DESC',
            from: props.fromWhatsapp,
            to: props.toWhatsapp,
            resourceId: props.resourceId,
            resourceType: props.resourceType,
            size: 100,
          })
          .then(res => {
            if (res.content) {
              const newListData = res.content.map(item => {
                item.id = item.messageId;
                return item;
              }) as unknown as PersonalWhatsappHistory[];
              setListData(newListData);
            }
          })
          .finally(() => setLoading(false));
      } else {
        setListData([]);
      }
    }
  }, [props.fromWhatsapp, props.toWhatsapp, props.resourceId, props.resourceId, props.type]);

  // 检查是否滚动到底部
  const isScrolledToBottom = () => {
    if (messageContainerRef.current) {
      const container = messageContainerRef.current;
      return container.scrollHeight - container.scrollTop === container.clientHeight;
    }
    return false;
  };

  const loadMorePersonalMessage = (messageId: string) => {
    return customerApi.getPersonalWhatsappHistoryAround({ fromNumber: props.fromWhatsapp, messageId: messageId, fromAccId: props.accId }).then(res => {
      if (res.content) {
        const newListData = listData.concat(res.content.filter(item => listData.every(subItem => subItem.id !== item.id))).sort((a, b) => a.t - b.t);
        setListData(newListData);
      }
    });
  };
  const loadMoreBusinessMessage = (seqNo: string) => {
    return whatsAppApi.getMessageListCRMAround({ seqNo }).then(res => {
      if (res.content) {
        // @ts-ignore
        const newListData = listData
          .concat(res.content.filter(item => listData.every(subItem => subItem.messageId !== item.messageId)))
          .sort((a, b) => a.sentAt - b.sentAt);
        newListData.forEach(item => {
          item.id = item?.messageId;
        });
        setListData(newListData);
      }
    });
  };

  const renderBusinessMessage = (message: any) => {
    switch (message.messageType) {
      case 'text':
        return message?.content?.text?.body;
      case 'template':
        try {
          const filledTemplate = fillTemplateWithTemplateParams({
            template: message.template,
            templateParams: message.content.template!.components,
          });
          return (
            <div
              style={{
                border: `0.5px solid ${CssVariables.fill3}`,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => showTemplatePreviewModal(filledTemplate)}
            >
              <TemplatePreview template={filledTemplate} />
            </div>
          );
        } catch (error) {
          return getTransText('[BUZHICHIDEMOBANLEIXING]');
        }
      default:
        return '暂不支持此消息类型';
    }
  };

  useImperativeHandle(
    ref,
    () => {
      let timer: NodeJS.Timeout | null = null;
      return {
        async scrollToMessage(message: PersonalWhatsappHistory) {
          // 滚动到某条消息
          // console.log('高亮显示这条消息', message);
          if (timer) {
            clearTimeout(timer);
          }
          if (props.type === 'person') {
            const found = listData.find(item => item.id === message.id);
            if (!found) {
              await loadMorePersonalMessage(message.id);
            }
          } else if (props.type === 'business') {
            // @ts-ignore
            const found = listData.find(item => item.messageId === message.messageId);
            if (!found) {
              await loadMoreBusinessMessage(message.seqNo);
            }
          }
          setHighlightedMessageId(message.id || message.messageId);
          timer = setTimeout(() => {
            setHighlightedMessageId('');
            timer = null;
          }, 3000);
        },
      };
    },
    [listData]
  );
  if (!listData?.length) {
    return (
      <EmptyList>
        <div>暂无数据</div>
      </EmptyList>
    );
  }
  return (
    <section className="chat-container">
      <div className="chat__bg"></div>
      {loading && <Spin indicator={loadingIcon} />}
      {listData.map((item, index) => (
        <ChatMessage
          key={index}
          isUser={isPersonal ? item.fromMe : item.messageDirection === 0}
          avatarUrl=""
          message={isPersonal ? item.body : renderBusinessMessage(item)}
          timestamp={new Date(isPersonal ? item.t * 1000 : item.sentAt).toLocaleString()}
          isHighlight={highlightedMessageId === item.id}
        />
      ))}
    </section>
  );
});
