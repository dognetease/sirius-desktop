import React, { useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { IMUser, IMMessage } from 'api';
import lodashGet from 'lodash/get';
import style from '../imChatList.module.scss';
// import { IMMessage } from 'api/src/api/logical/im';
import { useYunxinAccounts } from '../../common/hooks/useYunxinAccount';
import { EmojiContent, AnnoLinkContent } from './chatItemTextUnit';
import { lookupApnText, lookupEmoji, lookupLink, matchTextContent } from './splitMsgTextcontent';

const realStyle = classnames.bind(style);

interface TextApi {
  msg: IMMessage;
  renderComponent: React.FC<{
    users: IMUser[];
    msgContent: TextContentApi;
    idClient: string;
  }>;
  customClassnames?: string;
  testId?: string;
  lookupFuncMap?: Partial<Record<'lookupLink' | 'lookupEmoji' | 'lookupApnText', ReplaceCallback>>;
}

interface TextContentApi {
  type: 'text' | 'emoji' | 'link' | 'apnText' | 'wrap';
  content: string;
}

type ReplaceCallback = (str: string, ...args: any[]) => TextContentApi[];

export const ChatTypeText: React.FC<TextApi> = props => {
  const {
    msg,
    renderComponent,
    lookupFuncMap = {
      lookupApnText,
      lookupEmoji,
      lookupLink,
    },
    customClassnames = realStyle('text'),
    testId = '',
  } = props;

  const [msgContents, setMsgContents] = useState<TextContentApi[]>([]);

  const [mentionAccounts] = useState<string[]>(() => {
    const apnText = lodashGet(msg, 'apns.accounts', []);
    try {
      if (Reflect.has(msg, 'custom')) {
        const customContent = JSON.parse(msg.custom as string);
        return [...new Set([...lodashGet(customContent, 'mentions', []), ...apnText])];
      }
    } catch (ex) {}
    return apnText;
  });
  const userlist = useYunxinAccounts(mentionAccounts);

  useEffect(() => {
    const msgText = msg.text as string;
    const params = [
      {
        type: 'text',
        content: msgText,
      },
    ] as TextContentApi[];
    const lookupArr: ReplaceCallback[] = [lookupFuncMap.lookupEmoji!];
    if (Reflect.has(lookupFuncMap, 'lookupEmoji')) {
      lookupArr.push(lookupFuncMap!.lookupEmoji!);
    }

    // 如果有http的话就执行匹配,尽量避免一上来就全量匹配
    if (msgText.toLowerCase().indexOf('http') !== -1 && Reflect.has(lookupFuncMap, 'lookupLink')) {
      lookupArr.push(lookupFuncMap!.lookupLink!);
    }

    if (Reflect.has(msg, 'apns') && Reflect.has(lookupFuncMap, 'lookupApnText')) {
      lookupArr.push(lookupFuncMap!.lookupApnText!);
    }

    const newContents = lookupArr.reduce((total, cur) => matchTextContent(total, cur), params);
    setMsgContents(newContents);
  }, [msg.idClient]);

  return (
    <p className={customClassnames} data-test-id={testId}>
      {msgContents.map((msgContent, index) =>
        React.createElement(renderComponent, {
          key: index,
          msgContent,
          idClient: msg.idClient,
          users: Object.values(userlist).filter(item => lodashGet(item, 'nick.length', 0) !== 0) as IMUser[],
        })
      )}
    </p>
  );
};

const MsgItem = (props: { msgContent: TextContentApi }) => {
  const { msgContent } = props;
  if (msgContent.type === 'emoji') {
    return <EmojiContent emojiKey={msgContent.content} />;
  }
  if (msgContent.type === 'link') {
    return <AnnoLinkContent link={msgContent.content} />;
  }
  // msgContent中的\r\n需要换行
  // 1.27版本:之前为什么要按照html来执行渲染？原因追踪不到了。但是基于目前来看有什么预期之外的字符被转义。而且文本本身没有样式，应该是不需要html渲染的
  // const htmlStr = () => ({
  //   __html: msgContent.content
  //     .replace(/</g, '&lt;')
  //     .replace(/>/g, '&gt;')
  //     .replace(/[\n\r]/g, '<br/>')
  //     .replace(/\s/g, '&nbsp;'),
  // });
  // return <span dangerouslySetInnerHTML={htmlStr()} />;

  return (
    <>
      {msgContent.content.split(/[\n\r]/).map((subContent, index) => {
        if (index === 0) {
          return <span>{subContent}</span>;
        }
        return (
          <>
            <br />
            <span>{subContent}</span>
          </>
        );
      })}
    </>
  );
};

// 富文本(群公告)
// 文本消息的展现形式可以复用到很多地方(@todo:之后)
interface RichTextContentApi {
  originTextContent: string;
  lookupFuncMap?: Partial<Record<string, ReplaceCallback>>;
  classnames?: string;
}
export const RichTextContent: React.FC<RichTextContentApi> = props => {
  const {
    originTextContent,
    lookupFuncMap = {
      lookupApnText,
      lookupEmoji,
      lookupLink,
    },
    classnames = '',
  } = props;

  const [msgContents, setMsgContents] = useState<TextContentApi[]>([]);

  useEffect(() => {
    const params = [
      {
        type: 'text',
        content: originTextContent,
      },
    ] as TextContentApi[];

    const newContents = Object.values(lookupFuncMap).reduce((total, cur) => matchTextContent(total, cur), params);
    setMsgContents(newContents);
  }, []);

  return (
    <p className={classnames}>
      {msgContents.map((msgContent, index) => (
        <MsgItem key={index} msgContent={msgContent} />
      ))}
    </p>
  );
};
