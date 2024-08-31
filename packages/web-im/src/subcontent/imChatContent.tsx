import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { NIMApi, apiHolder, SystemApi, apis, AccountApi } from 'api';
import styles from './imChatContent.module.scss';
import ImP2PChatHead, { ImSysChatHead } from './imP2PChatHead';
import ImTeamChatHead from './imTeamChatHead';
import { IMChatList } from './imChatList';
import { Operation } from './operation/operation';
import { P2PCollectionInfo, TeamCollectionInfo } from './store/chatProvider';
import { ChatAccountWarning } from './chatAccountWarning';
import { ChatDrop } from './chatDrop';
import { TreadMsgTreeContainer } from './treadMsgTree';
import { useImTeamType, useImTeam } from '../common/hooks/useTeamInfo';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const realStyle = classnames.bind(styles);
const ImSessionContent: React.FC<any> = props => {
  const { sessionId, scene, toAccount, ...restProps } = props;
  const [isOwner, setIsOwner] = useState(false);

  const [owner, setOwner] = useState<string>(); // owner id
  const [uid, setUid] = useState<string>(); // 当前用户 id
  let teamType = 'normal';
  // 判断是否是群主
  if (scene === 'team') {
    teamType = useImTeamType(props.toAccount, 'team');
  }

  const team = useImTeam(sessionId.split('-')[1], true);
  useEffect(() => {
    if (team != null) {
      setOwner(team.owner);
    }
  }, [team]);

  // 是否是owner，两个都是异步操作需要监听
  useEffect(() => {
    if (uid != null && owner != null) setIsOwner(uid === owner);
  }, [uid, owner]);

  // 查询当前用户的uid和originId
  const requestOrgAndUserInfo = () => {
    const userInfo = systemApi.getCurrentUser();
    const uid = lodashGet(userInfo, 'contact.contactInfo', []).find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';

    const originId = lodashGet(userInfo, 'contact.orgs.[0].originId', '');
    return {
      uid,
      originId,
    };
  };
  useEffect(() => {
    const { uid, originId } = requestOrgAndUserInfo();
    setUid(uid);
    const $id = nimApi.interceptor.request.use(([command, options]) => {
      try {
        (options as unknown as Record<string, any>).custom = {
          ...lodashGet(options, 'custom', {}),
          accid: uid,
          orgId: originId,
        };
      } catch (ex) {}
      return Promise.resolve([command, options]);
    });

    return () => {
      return nimApi.interceptor.request.eject($id);
    };
  }, []);

  return (
    <div style={{ height: '100%' }}>
      {/* 群聊聊天列表 */}
      {scene === 'team' && (
        <TeamCollectionInfo to={toAccount} {...props}>
          <ChatDrop classnames={realStyle('imSessionContentWrap', 'DropWrapper')}>
            {/* 群聊头 */}
            <ImTeamChatHead sessionId={sessionId} teamId={toAccount} />
            <IMChatList isOwner={isOwner} scene="team" sessionId={sessionId} toAccount={toAccount} teamType={teamType} uid={uid} {...restProps} />
            <Operation scene={scene} sessionId={sessionId} toAccount={toAccount} />
            <TreadMsgTreeContainer />
          </ChatDrop>
        </TeamCollectionInfo>
      )}

      {/* 单聊聊天列表 */}
      {scene === 'p2p' && (
        <P2PCollectionInfo to={toAccount} {...props}>
          <ChatDrop classnames={realStyle('imSessionContentWrap')}>
            {/* 系统推送头 */}
            {/^lx_/.test(toAccount) && <ImSysChatHead toAccount={toAccount} />}
            {/* 单聊头 */}
            {!/^lx_/.test(toAccount) && <ImP2PChatHead sessionId={sessionId} toAccount={toAccount} />}
            <ChatAccountWarning to={toAccount} />

            <IMChatList scene="team" sessionId={sessionId} toAccount={toAccount} {...restProps} />

            {toAccount.indexOf('lx_') === -1 && <Operation scene={scene} sessionId={sessionId} toAccount={toAccount} />}
            <TreadMsgTreeContainer />
          </ChatDrop>
        </P2PCollectionInfo>
      )}
    </div>
  );
};

export default ImSessionContent;
