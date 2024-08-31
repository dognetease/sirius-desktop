import React, { ReactElement, useContext } from 'react';
import classnames from 'classnames/bind';
import { Checkbox } from 'antd';
import { IMMessage, IMUser } from 'api';
import { Context as MessageContext } from '../store/messageProvider';
import style from './chatItemContent.module.scss';
import ChatItemMenu from './chatItemMenu';
import { ChatTypeText, ChatTypeCustom, ChatTypeImage, ChatTypeVideo, ChatTypeFile } from './chatItemTypes';
import { PopoverUser } from '../../common/usercard/userCard';
import { UserAvatar } from '../../common/imUserAvatar';
import { notSupportVideo } from '../../common/imgVideoHandle';
import { MsgTextItem } from './chatItemTextUnit';
import { judgeMsgType } from '@web-im/utils/im_team_util';

const realStyle = classnames.bind(style);

interface ChatMsgFromApi {
  user: IMUser | undefined;
  msg: IMMessage;
}

const ChatMsgFromInfo: React.FC<ChatMsgFromApi> = props => {
  const { user, msg } = props;

  return (
    <div className={realStyle('msgFromInfo', 'custom-msg-from')}>
      {user?.nick || ''}
      {props.children}
    </div>
  );
};

interface ChatMsgItemContentApi {
  msg: IMMessage;
  user: IMUser | undefined;
  quotedMsgContent: ReactElement | null;
  quickComments: ReactElement | null;
  containComplexEle: boolean;
  containerMsgMenu?: boolean;
  wrapperClassname?: string;
  displayNick?: boolean;
  timeTag?: ReactElement | null;
}
// 单个文本消息
export const ChatItemContent: React.FC<ChatMsgItemContentApi> = props => {
  const { msg, user, quotedMsgContent, quickComments, containComplexEle, containerMsgMenu = true, wrapperClassname = '', displayNick = false, timeTag = null } = props;
  const { getSelectMsgs, setSelectMsgs } = useContext(MessageContext);

  const isMe = msg.flow === 'out' || msg.from === msg.to;

  const previewParams = {
    sessionId: msg.sessionId,
    limit: 30,
    // 往前推10ms
    start: msg.time - 10,
    // 向后退10ms
    end: msg.time + 10,
  };

  const noSupVideo = notSupportVideo(msg?.type, msg?.file?.videoCodec);
  const checkList = getSelectMsgs();
  const checked = !!(checkList && checkList.includes(msg?.idClient));

  // 1014消息不支持多选选中，并且在有快捷回复时不需要增加背景
  let isCustomMsg = judgeMsgType(msg, 'type', 1014);
  return (
    <div
      className={realStyle('msgItem', isMe ? 'my' : '', wrapperClassname, checked ? 'msgItemChecked' : '')}
      data-msg-wrapper={checkList ? 'false' : 'true'}
      data-test-id={checkList ? 'im_session_content_single_msg_checkbox_wrapper' : ''}
    >
      {checkList && <span className={realStyle('msgItemCheckedMask')} onClick={() => (isCustomMsg ? {} : setSelectMsgs(msg?.idClient))} />}
      {checkList && !isMe && (
        <Checkbox disabled={isCustomMsg} className={realStyle('msgCheckbox')} checked={checked} onChange={() => (isCustomMsg ? {} : setSelectMsgs(msg.idClient))} />
      )}
      {!displayNick && timeTag}
      <PopoverUser user={user}>
        <div>
          <UserAvatar testId="im_session_content_single_msg_avatar" user={user} />
        </div>
      </PopoverUser>
      <div
        className={realStyle('msgBubble', 'custom-msg-bubble', {
          reverse: isMe,
          'team-msg': msg.scene === 'team' && !isMe,
        })}
      >
        {displayNick && (
          <ChatMsgFromInfo msg={msg} user={user}>
            {timeTag}
          </ChatMsgFromInfo>
        )}
        {/* 消息内容 */}
        <div
          className={realStyle('type-' + msg.type, 'custom-msgcontent', {
            my: isMe,
            [realStyle('wrapperBg')]: !isCustomMsg && (msg.type === 'text' || containComplexEle),
          })}
        >
          {/* 被引用消息 */}
          {quotedMsgContent}
          {msg.type === 'text' && <ChatTypeText testId="im_session_content_single_msg_text" msg={msg} renderComponent={MsgTextItem} />}

          {msg.type === 'image' && (
            <ChatTypeImage
              // @ts-ignore
              imgInfo={msg.file as File}
              // @ts-ignore
              backupSrc={msg.localUrl}
              previewParams={previewParams}
            />
          )}

          {msg.type === 'video' && !noSupVideo && <ChatTypeVideo testId="im_session_content_single_msg_video" msg={msg} previewParams={previewParams} />}

          {msg.type === 'video' && noSupVideo && <ChatTypeFile testId="im_session_content_single_msg_file" msg={msg} previewParams={previewParams} />}

          {['file', 'audio'].includes(msg.type) && <ChatTypeFile testId="im_session_content_single_msg_file" msg={msg} previewParams={previewParams} />}

          {msg.type === 'custom' && <ChatTypeCustom msg={msg} />}

          {/* 快捷回复 */}
          {quickComments}
        </div>
        {props.children}
        {containerMsgMenu && <ChatItemMenu msg={msg} />}
      </div>
      {checkList && isMe && (
        <Checkbox disabled={isCustomMsg} className={realStyle('msgCheckbox', 'msgCheckboxMy')} checked={checked} onChange={() => setSelectMsgs(msg.idClient)} />
      )}
    </div>
  );
};
