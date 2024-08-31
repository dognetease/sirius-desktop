import React from 'react';
import classNames from 'classnames/bind';
import { IMMessage } from 'api';
import styles from './imLastestMsgDisplay.module.scss';
import { SummaryChatContent } from '../common/summaryChatContent';
import { useYunxinAccount } from '../common/hooks/useYunxinAccount';
import { MsgSubtypes } from '../subcontent/store/msgSubtypes';
import lodashGet from 'lodash/get';

const realStyle = classNames.bind(styles);

interface LastMsgApi {
  lastMsg: IMMessage;
  scene: 'p2p' | 'team';
}

const ImLastestMsgDisplay: React.FC<LastMsgApi> = props => {
  const { lastMsg: msg, scene } = props;
  const fromUser = useYunxinAccount(msg.from);

  return (
    <SummaryChatContent
      testId="im_list_sessionitem_latestmsg"
      msg={msg}
      className={realStyle('latestMsgText')}
      // p2p不显示消息from 移除群成员的本地提醒不显示from
      showName={!(scene == 'p2p' || lodashGet(msg, 'subType', 0) === MsgSubtypes.REMOVE_TEAMMEBER)}
      fromNick={fromUser?.nick || ''}
      subClassname={realStyle('sysMsg')}
    />
  );
};

export default ImLastestMsgDisplay;
