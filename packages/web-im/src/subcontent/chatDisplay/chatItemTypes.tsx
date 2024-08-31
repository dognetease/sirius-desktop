import React, { useState, useContext } from 'react';
import classnames from 'classnames/bind';
import { IMMessage } from 'api';
import lodashGet from 'lodash/get';
import style from './chatItemTypes.module.scss';
import { ChatTypeUploadingImg } from './chatItemImage';
import { ChatTypeUploadingVideo } from './chatItemVideo';
import { ChatTypeUploadingFile } from './chatItemFile';
import { ChatItemAlt } from './chatItemAlt';
import { ChatItemGraphic } from './chatItemGraphic';
import { CommentsContext } from '../store/quickCommentsList';
import { covert, convertAlt, ContentRawApi } from '../../common/convertServerMsg';
import { ChatItemExpression } from './chatItemExpression';
import { convertCustomizeTplV3, ContentServerFields, ContentRawApiV2 } from '../../common/convertServerMsgV2';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
// 本地提醒消息
export { ChatTypeTip } from './chatItemTip';
// 导出文本消息
export { ChatTypeText } from './chatItemText';
export { ChatTypeImage } from './chatItemImage';
export { ChatTypeVideo } from './chatItemVideo';
export { ChatTypeFile } from './chatItemFile';
export { ChatTypeSys } from './chatItemSys';
// 自定义消息
interface CustomMsgApi {
  msg: IMMessage;
  [key: string]: any;
}
export const ChatTypeCustom: React.FC<CustomMsgApi> = props => {
  const { msg, ...restProps } = props;
  const { commentsMap } = useContext(CommentsContext);
  const [parsedContent] = useState(() => {
    try {
      return JSON.parse(msg.content as string);
    } catch (ex) {
      return {};
    }
  });
  if (!msg.content || lodashGet(parsedContent, 'type', -99) === -99) {
    return <p className={realStyle('msgTextContent')}>{getIn18Text('[DANGQIANBANBEN')}</p>;
  }
  if (parsedContent.type === 3) {
    return <ChatItemExpression options={parsedContent.data} />;
  }
  if (typeof parsedContent.type === 'number' && parsedContent.type === 1014) {
    let altInfo: ContentRawApi;
    try {
      altInfo = JSON.parse(parsedContent.alt);
    } catch (ex) {
      altInfo = {} as ContentRawApi;
    }
    if (lodashGet(altInfo, 'header.length', 0) === 0) {
      return <p className={realStyle('msgTextContent')}>{getIn18Text('[DANGQIANBANBEN')}</p>;
    }
    const result = convertCustomizeTplV3(parsedContent as ContentServerFields);
    return lodashGet(result, 'modules.length', 0) !== 0 ? (
      <ChatItemGraphic data={result as ContentRawApiV2} idClient={msg.idClient} comments={lodashGet(commentsMap, `${msg.idClient}.length`, 0) !== 0} />
    ) : (
      <ChatItemAlt data={convertAlt(typeof result === 'string' ? result : JSON.stringify(result)) as ContentRawApi} />
    );
  }
  if (typeof parsedContent.type === 'number' && parsedContent.type >= 1000) {
    const { data, alt, type } = parsedContent;
    // 如果没有定义data信息 直接返回不支持
    if (!data) {
      return <p className={realStyle('msgTextContent')}>{getIn18Text('[DANGQIANBANBEN')}</p>;
    }
    const result = covert(data, alt, type);
    return lodashGet(result, 'header.length', 0) !== 0 ? (
      <ChatItemAlt data={result} msg={msg} />
    ) : (
      <p className={realStyle('msgTextContent')}>{getIn18Text('[DANGQIANBANBEN')}</p>
    );
  }
  if (parsedContent.type === 'LOCAL_UPLOADING_IMG') {
    return <ChatTypeUploadingImg msg={msg} {...restProps} imgInfo={parsedContent.data} token={parsedContent.token} />;
  }
  if (parsedContent.type === 'LOCAL_UPLOADING_VIDEO') {
    return <ChatTypeUploadingVideo msg={msg} {...restProps} fileInfo={parsedContent.data} token={parsedContent.token} />;
  }
  if (parsedContent.type === 'LOCAL_UPLOADING_FILE') {
    return (
      <ChatTypeUploadingFile msg={msg} {...restProps} fileInfo={parsedContent.data} token={parsedContent.token} />
      // <p>{JSON.stringify(parsedContent.data)}</p>
    );
  }
  if (lodashGet(parsedContent, 'alt.length', 0) !== 0) {
    return <ChatItemAlt data={typeof parsedContent.alt === 'string' ? JSON.parse(parsedContent.alt) : parsedContent.alt} />;
  }
  return <p className={realStyle('msgTextContent')}>{getIn18Text('[DANGQIANBANBEN')}</p>;
};
