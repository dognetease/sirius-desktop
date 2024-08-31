import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { IMMessage, IMUser, NIMApi, apiHolder } from 'api';
import lodashGet from 'lodash/get';
import { useObservable } from 'rxjs-hooks';
import { Observable } from 'rxjs';
import style from '../chatItemTip.module.scss';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { MsgSubtypes } from '../store/msgSubtypes';
import { Context as DrawMsgContext } from '../store/drawmsgProvider';
import { PopoverUser } from '../../common/usercard/userCard';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const systemApi = apiHolder.api.getSystemApi();

// 本地提醒消息
interface ChatTypeTipApi {
  msg: IMMessage;
  classname?: string;
  testId?: string;
}

type removeTeamMemberParams = Record<'teamId' | 'fromNick' | 'from', string> & Record<'removeNicks' | 'removeAccounts', string[]>;

export const RemoveTeamMemberTip: React.FC<{ content: removeTeamMemberParams; classnames: string }> = props => {
  const { content: msgContent } = props;

  const fromUser = useYunxinAccount(msgContent.from, 'p2p', true);
  const removeUser = useYunxinAccount(lodashGet(msgContent, 'removeAccounts[0]', 0), 'p2p', true);
  return (
    <div data-test-id="im_session_content_remove_member_msg" className={realStyle([props.classnames, 'removeMemberMsgWrapper'])}>
      <p className={realStyle('content')}>
        <PopoverUser user={fromUser}>
          <span className={realStyle('recallNick')}>{msgContent.fromNick}</span>
        </PopoverUser>
        将
        <PopoverUser user={removeUser}>
          <span className={realStyle('recallNick')}>{removeUser?.nick || ''}</span>
        </PopoverUser>
        移出群组
      </p>
    </div>
  );
};

interface DrawedMsgApi {
  drawedMsgText: string;
  drawedMsgAccounts: string[];
  drawedTimestmap: number;
}
export const DrawMsgTip: React.FC<ChatTypeTipApi> = props => {
  const { msg, classname = realStyle('msgItemTip') } = props;
  const user = useYunxinAccount(msg.from);
  const $userlist = useObservable(() => nimApi.imusers.getSubject() as Observable<Record<string, IMUser>>, {});
  const MAX_DURATION = 3 * 60 * 1000;
  const { convert2Raw, setRawContent } = useContext(DrawMsgContext);
  const [enableEdit, setEnableEdit] = useState(() => {
    try {
      const result = JSON.parse(msg.custom as string) as DrawedMsgApi;
      if (lodashGet(result, 'drawedTimestmap', 0) !== 0) {
        return new Date().getTime() - result.drawedTimestmap <= MAX_DURATION;
      }
    } catch (ex) {}
    return false;
  });
  // 设置定时器 超过3分钟的消息不允许编辑
  useEffect(() => {
    if (!enableEdit) {
      return () => {};
    }
    const { drawedTimestmap: startTime } = JSON.parse(msg.custom as string) as DrawedMsgApi;
    // 每10s检查一次
    const $t = systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler() {
        const now = new Date().getTime();
        if (now - startTime >= MAX_DURATION) {
          systemApi.cancelEvent('mid', $t!);
          setEnableEdit(false);
        }
      },
      seq: 0,
    });
    return () => {
      systemApi.cancelEvent('mid', $t!);
    };
  }, [enableEdit]);
  // 二次编辑消息
  const editDrawMsg = () => {
    const { drawedMsgText, drawedMsgAccounts } = JSON.parse(msg.custom as string) as DrawedMsgApi;
    const rawContent = convert2Raw(
      drawedMsgText,
      drawedMsgAccounts.map(item => {
        if (item === 'all') {
          return {
            name: getIn18Text('SUOYOUREN'),
            link: '',
            avatar: '#',
            nick: getIn18Text('SUOYOUREN'),
            account: 'all',
            pinyinname: 'all',
          } as unknown as IMUser;
        }
        return $userlist[item];
      })
    );
    setRawContent(rawContent);
  };
  return (
    <div className={classname} data-test-id="im_session_content_revokemsg_msg">
      <PopoverUser user={user}>
        <span className={realStyle('recallNick')}>{user?.nick || ''}</span>
      </PopoverUser>
      &nbsp;{getIn18Text('CHEHUILEYITIAO')}
      {enableEdit && (
        <span onClick={editDrawMsg} className={realStyle('edit')}>
          {getIn18Text('ZHONGXINBIANJI')}
        </span>
      )}
    </div>
  );
};
export const ChatTypeTip: React.FC<ChatTypeTipApi> = props => {
  const { msg, classname = realStyle('msgItemTip') } = props;
  const user = useYunxinAccount(msg.from);
  if (lodashGet(msg, 'subType', 0) === MsgSubtypes.REMOVE_TEAMMEBER) {
    return <RemoveTeamMemberTip content={JSON.parse(msg.custom as string)} classnames={classname} />;
  }

  if (lodashGet(msg, 'subType', 0) === MsgSubtypes.DRAW_TEXT_MSG) {
    return <DrawMsgTip {...props} />;
  }
  return (
    <div className={classname} data-test-id="im_session_content_revokemsg_msg">
      <PopoverUser user={user}>
        <span className={realStyle('recallNick')}>{user?.nick || ''}</span>
      </PopoverUser>
      &nbsp;
      {msg.tip || getIn18Text('CHEHUILEYITIAO')}
    </div>
  );
};
