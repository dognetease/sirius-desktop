import { useLocation } from '@reach/router';
import { apiHolder, apis, DataTrackerApi, IMDiscussApi, IMUser } from 'api';
import React, { useContext, useEffect, useState } from 'react';
import { LOG_DECLARE } from '../common/logDeclare';
import { getParams } from '../common/query';
import ChatUnReply from './chatDisplay/chatUnReply';
import { HistoryChatlist } from './chatlist/historyMsgList';
import { NormalChatList } from './chatlist/normalMsgList';
import { Context as MemberContext } from './store/memberProvider';
import { Context as MessageContext } from './store/messageProvider';

const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const discussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as IMDiscussApi;

interface ChatCommonHistoryApi {
  sessionId: string;
  userlist: Record<string, IMUser>;
  scene: string;
  toAccount: string;
  idClient?: string;
  mode: 'normal' | 'history';
  teamType?: string;
  isOwner?: boolean;
  uid?: string;
}

export const IMChatList: React.FC<ChatCommonHistoryApi> = props => {
  const { getMailList, mailList = [], mailListCount } = useContext(MessageContext);
  const { state: teamMemberList } = useContext(MemberContext);

  const [isAdmin, setIsAdmin] = useState(false);
  const { mode, scene, sessionId, teamType, isOwner = false, uid } = props;
  const location = useLocation();

  // 日志打点
  useEffect(() => {
    datatrackApi.track(LOG_DECLARE.CHAT.ENTER, {
      chatMode: scene === 'p2p' ? 'single' : 'group',
      source: getParams(location.hash, 'way') || 'all',
    });
  }, []);

  // 是否是群管理员
  useEffect(() => {
    if (!Array.isArray(teamMemberList) || !teamMemberList.length) {
      return;
    }
    const member = teamMemberList.find(member => member.type === 'manager' && member.account === uid);
    if (member != null) {
      // 如果该成员是管理员
      setIsAdmin(true);
    }
  }, [teamMemberList, uid]);

  useEffect(() => {
    // 获取列表
    if (teamType === 'discuss') {
      getMailList();
    }
  }, [teamType]);

  if (mode === 'normal') {
    return (
      <>
        <NormalChatList isAdmin={isAdmin} isOwner={isOwner} total={mailListCount} list={mailList} {...props} />
        <ChatUnReply />
      </>
    );
  }
  return (
    <>
      <HistoryChatlist isAdmin={isAdmin} isOwner={isOwner} total={mailListCount} list={mailList} {...props} />
      <ChatUnReply />
    </>
  );
};
