import React, { useEffect, useState } from 'react';
import lodashGet from 'lodash/get';
import { IMMessage } from 'api';
import classnames from 'classnames/bind';
import { renderMsgContent } from '../utils/im_team_util';
import { ChatTypeText } from '../subcontent/chatDisplay/chatItemText';
import { MsgSummaryTextItem } from '../subcontent/chatDisplay/chatItemTextUnit';
import { lookupEmoji, lookupLink } from '../subcontent/chatDisplay/splitMsgTextcontent';
import { ChatTypeSys } from '../subcontent/chatDisplay/chatItemTypes';
import style from './summaryChatContent.module.scss';
import { getTextFromMarkdown, supportList as SUPPORT_MODULE_LIST } from './convertServerMsgV2';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface PropTypesApi {
  fromNick?: string;
  msg: IMMessage;
  className?: string;
  subClassname?: string;
  showName?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  customMsgContent?: (msg: IMMessage) => string | false;
  testId?: string;
}
interface CustomContentApi {
  type: number;
  data: Record<'header' | 'body' | 'footer', string> | object | string;
  alt?: Record<'header' | 'body' | 'footer', string> | string;
}
const customMessageType = {
  1: getIn18Text('[SHITOUJIANDAO'),
  2: '[阅后即焚]',
  3: '[表情]',
  LOCAL_UPLOADING_IMG: getIn18Text('TUPIANSHANGCHUANZHONG'),
  LOCAL_UPLOADING_FILE: getIn18Text('WENJIANSHANGCHUANZHONG'),
  LOCAL_UPLOADING_VIDEO: getIn18Text('SHIPINSHANGCHUANZHONG'),
  1010: getIn18Text('QUANXIANBIANGENG'),
};
const fileTypes = {
  image: getIn18Text('TUPIAN'),
  video: getIn18Text('SHIPIN'),
  audio: getIn18Text('YINPIN'),
  file: getIn18Text('WENJIAN'),
};
type GetMsgDesc = (msg: IMMessage) => string;
// 纯文本消息
export const SummaryTextContent = () => {};
export const SummaryChatContent: React.FC<PropTypesApi> = props => {
  const { msg, className = 'summary-default-msg', showName = true, fromNick, subClassname = '', onClick = e => {}, customMsgContent = msg => false, testId = '' } = props;
  const [msgContent, setMsgContent] = useState<string>('');
  const getTextContent: GetMsgDesc = msg => msg.text as string;
  const getFileContent: GetMsgDesc = msg => {
    const content = `[${fileTypes[msg.type]}]` + (msg.type === 'file' ? msg.file?.name : '');
    return content;
  };
  const getTipContent: GetMsgDesc = msg => customMsgContent(msg) || (msg.tip as string);
  const getCustomContent: GetMsgDesc = msg => {
    let content: CustomContentApi;
    try {
      content = JSON.parse(msg.content as string) as CustomContentApi;
    } catch (ex) {
      content = {} as CustomContentApi;
    }
    if (lodashGet(content, 'type', -99) === -99) {
      return getIn18Text('[DANGQIANBANBEN');
    }
    const { type: contentType, data, alt } = content;
    return [
      () => {
        if (lodashGet(msg, 'text.length', 0) !== 0 && contentType !== 3) {
          return msg.text;
        }
        return false;
      },
      () =>
        // 自定义消息(表情/石头剪刀布...)
        lodashGet(customMessageType, contentType, false),
      // 1014兜底消息
      () => {
        const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
        if (lodashGet(dataObj, 'header.content.length', 0) === 0) {
          return false;
        }
        // 如果当前版本有不支持的module
        if (lodashGet(content, 'necessary.length', 0) !== 0 && lodashGet(content, 'necessary', []).some(item => !SUPPORT_MODULE_LIST.includes(item))) {
          return false;
        }
        const title = getTextFromMarkdown(dataObj.header.content).trim();
        return title.length > 0 ? title : getIn18Text('SHOUDAOYITIAOXIN');
      },
      () => {
        // 服务端返回消息解析(data中的header字段)
        const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
        return lodashGet(dataObj, 'header', false);
      },
      () => {
        // 服务端兜底消息
        const backupContent = typeof alt === 'string' ? JSON.parse(alt) : alt;
        return lodashGet(backupContent, 'header', false);
      },
      () => getIn18Text('[DANGQIANBANBEN'),
    ].reduce((total, current) => {
      if (lodashGet(total, 'length', 0) === 0) {
        return current();
      }
      return total;
    }, '');
  };
  useEffect(() => {
    let content = getIn18Text('[DANGQIANBANBEN');
    if (msg.type === 'text') {
      content = getTextContent(msg);
    } else if (Object.keys(fileTypes).includes(msg.type)) {
      content = getFileContent(msg);
    } else if (msg.type === 'tip') {
      content = getTipContent(msg);
    } else if (msg.type === 'custom') {
      content = getCustomContent(msg);
    }
    setMsgContent(content);
  }, [msg.idClient]);
  if (!msg || !msg.type) {
    return null;
  }
  if (msg.type === 'notification') {
    return <ChatTypeSys subClassname={subClassname} className={className} msg={msg} type="summary" />;
  }
  return (
    <div data-test-id={testId || null} className={className} onClick={onClick} key={msg.idClient}>
      {/* 昵称 */}
      {showName && `${fromNick || msg.fromNick}: `}
      {props.children}
      {msg.type !== 'text' ? (
        <span dangerouslySetInnerHTML={{ __html: renderMsgContent(msgContent) }} />
      ) : (
        <ChatTypeText
          msg={msg}
          renderComponent={MsgSummaryTextItem}
          customClassnames={realStyle('summaryMsgTextContent')}
          lookupFuncMap={{
            lookupEmoji,
            lookupLink,
          }}
        />
      )}
    </div>
  );
};
