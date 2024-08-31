import React from 'react';
import classnames from 'classnames/bind';
import { IMUser, apiHolder } from 'api';
import lodashGet from 'lodash/get';
// import { IMMessage } from 'api/src/api/logical/im';
import { PopoverUser } from '../../common/usercard/userCard';
import { emojiList, emojiSourceMap } from '../../common/emojiList';
import style from './chatItemTextUnit.module.scss';
import { useMsgEdisklink, useAnnoEdisklink } from '../../store/list/edisklinks';
import IconCard, { iconMap } from '@web-mail/components/Icon/index';
// import { IMMessage } from 'api/src/api/logical/im';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
// @ts-ignore
const systemApi = apiHolder.api.getSystemApi();
export const returnFileType = (resourceType: 'FILE' | 'DIRECTORY', fileType: 'file' | string, title: string) => {
  if (resourceType === 'DIRECTORY') {
    return 'folder';
  }
  if (fileType === 'file') {
    return lodashGet(title.match(/\.([\w\d]+)$/), '[1]', '')
      .replace('gif', 'jpeg')
      .replace('excel', 'lxxls');
  }
  return fileType.replace('excel', 'lxxls');
};
interface EmojiContentApi {
  emojiKey: string;
}
export const EmojiContent: React.FC<EmojiContentApi> = props => {
  let { emojiKey } = props;
  if (emojiKey.indexOf(getIn18Text('BAOJIN')) !== -1) {
    emojiKey = emojiKey.replace(getIn18Text('BAOJIN'), getIn18Text('BAOQUAN'));
  }
  const emojiUrl = lodashGet(emojiSourceMap, `${emojiList.get(emojiKey)}`, '');
  if (!emojiUrl || !emojiUrl.length) {
    return <span>{emojiKey}</span>;
  }
  return <img className={realStyle('emojiLink')} src={emojiUrl} alt={emojiKey} />;
};
interface ApnContentApi {
  member: IMUser | null;
  content: string;
}
export const ApnContent: React.FC<ApnContentApi> = props => {
  const { member, content } = props;
  if (content.indexOf(getIn18Text('SUOYOUREN')) !== -1) {
    return (
      <>
        <span className={realStyle('mentionUserLink')}>{getIn18Text('@SUOYOUREN')}</span>
        &nbsp;
        {content.substring(4)}
      </>
    );
  }
  if (!member) {
    return <>{content}</>;
  }
  return (
    <>
      <PopoverUser user={member}>
        <span className={realStyle('mentionUserLink')}>@{member.nick}</span>
      </PopoverUser>
      {new RegExp(`@${member.nick}(?=(\\s|$))`).test(content) ? '' : ' '}
      {content.substring(member.nick.length + 1)}
    </>
  );
};
export const MsgLinkContent: React.FC<{
  link: string;
  idClient: string;
  enableRedirect?: boolean;
}> = props => {
  const { link, idClient, enableRedirect = true } = props;
  const openNewWin = e => {
    e.preventDefault();
    systemApi.handleJumpUrl('' + new Date().getTime(), link);
  };
  const linkContent = useMsgEdisklink(link, idClient);
  const cssStyle = {
    color: '#386EE7',
    cursor: 'pointer',
    wordBreak: 'break-all',
  } as React.CSSProperties;
  if (linkContent === false) {
    return enableRedirect ? (
      <a style={cssStyle} href={link} onClick={openNewWin}>
        {link}
      </a>
    ) : (
      <>{link}</>
    );
  }
  return enableRedirect ? (
    <a href={link} onClick={openNewWin} className={realStyle('ediskLink', linkContent.type)}>
      {/* <Icon type={linkContent.type} className={realStyle('ediskLinkIcon', linkContent.type)} /> */}
      <IconCard width={15} height={18} type={returnFileType(linkContent.resourceType, linkContent.response.fileType, linkContent.response.title)} />
      {linkContent.response.title}
    </a>
  ) : (
    <>[{linkContent.response.title}]</>
  );
};
export const AnnoLinkContent: React.FC<{
  link: string;
}> = props => {
  const { link } = props;
  const openNewWin = e => {
    e.preventDefault();
    systemApi.handleJumpUrl('' + new Date().getTime(), link);
  };
  const linkContent = useAnnoEdisklink(link);
  const cssStyle = {
    color: '#386EE7',
    cursor: 'pointer',
    wordBreak: 'break-all',
  } as React.CSSProperties;
  if (linkContent === false) {
    return (
      <a style={cssStyle} href={link} onClick={openNewWin}>
        {link}
      </a>
    );
  }
  return (
    <a href={link} onClick={openNewWin} className={realStyle('ediskLink', linkContent.type)}>
      {/* <Icon type={linkContent.type} className={realStyle('ediskLinkIcon', linkContent.type)} /> */}
      <IconCard
        width={16}
        height={16}
        style={{ marginRight: '8px' }}
        type={returnFileType(linkContent.resourceType, linkContent.response.fileType, linkContent.response.title)}
      />
      {linkContent.response.title}
    </a>
  );
};

const PureMsgTextRender = (props: { msgContent: TextContentApi }) => {
  const { msgContent } = props;

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

interface TextContentApi {
  type: 'text' | 'emoji' | 'link' | 'apnText' | 'wrap';
  content: string;
}
export const MsgTextItem: React.FC<{
  users: IMUser[];
  msgContent: TextContentApi;
  idClient: string;
}> = props => {
  const { users, msgContent, idClient } = props;
  if (msgContent.type === 'emoji') {
    return <EmojiContent emojiKey={msgContent.content} />;
  }
  if (msgContent.type === 'link') {
    return <MsgLinkContent link={msgContent.content} idClient={idClient} />;
  }
  if (msgContent.type === 'apnText') {
    return <ApnContent member={users.find(item => msgContent.content.indexOf(`@${(item as IMUser).nick}`) !== -1)} content={msgContent.content} />;
  }

  return <PureMsgTextRender msgContent={msgContent}></PureMsgTextRender>;
  // msgContent中的\r\n需要换行
  // 1.27备注：之前为什么要按照html来执行渲染？原因追踪不到了。但是基于目前来看有什么预期之外的字符被转义。而且文本本身没有样式，应该是不需要html渲染的
  // const htmlStr = () => ({
  //   __html: msgContent.content
  //     .replace(/</g, '&lt;')
  //     .replace(/>/g, '&gt;')
  //     .replace(/[\n\r]/g, '<br/>')
  //     .replace(/\s/g, '&nbsp;'),
  // });
  // return <span dangerouslySetInnerHTML={htmlStr()} />;
};
export const MsgSummaryTextItem: React.FC<{
  users: IMUser[];
  msgContent: TextContentApi;
  idClient: string;
}> = props => {
  const { users, msgContent, idClient } = props;
  if (msgContent.type === 'emoji') {
    return <EmojiContent emojiKey={msgContent.content} />;
  }
  if (msgContent.type === 'link') {
    return <MsgLinkContent enableRedirect={false} link={msgContent.content} idClient={idClient} />;
  }
  // msgContent中的\r\n需要换行
  // const htmlStr = () => ({
  //   __html: msgContent.content.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  // });
  return <span>{msgContent.content}</span>;
};
