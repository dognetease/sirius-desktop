import React, { useState } from 'react';
import { apiHolder, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { Tooltip, Dropdown } from 'antd';
import { useObservable } from 'rxjs-hooks';
import { iif, Observable, switchMap, defer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import styles from './imStickTop.module.scss';
import { UserAvatar, TeamAvatar } from '../common/imUserAvatar';
import { ImTopContextmenu } from './imContextMenu';
import { useYunxinAccount } from '../common/hooks/useYunxinAccount';
import { useImTeam } from '../common/hooks/useTeamInfo';
import { truncate } from '@web-common/utils/utils';
import { openSession } from '../common/navigate';
import { UnreadMsgCount } from './unreadCount';
import { useLocation } from '@reach/router';

const realStyle = classnames.bind(styles);
// @ts-ignore
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

const TeamItem: React.FC<{ teamId: string; testId?: string; nickNameTestId?: string }> = ({ teamId, testId, nickNameTestId }) => {
  const teamInfo = useImTeam(teamId);
  return (
    <>
      {/* 群聊头像 */}
      <TeamAvatar teamInfo={teamInfo} teamId={teamId} testId={testId} />

      <p data-test-id={nickNameTestId} className={realStyle('topNickname')}>
        {truncate(teamInfo?.customTeamName || 'default', 3)}
      </p>
    </>
  );
};

const UserItem: React.FC<{ to: string; testId?: string; nickNameTestId?: string }> = ({ to, testId, nickNameTestId }) => {
  const userInfo = useYunxinAccount(to);
  return (
    <>
      {/* 单聊头像 */}
      <UserAvatar user={userInfo} testId={testId} />
      {/* 单聊名称 */}
      <p data-test-id={nickNameTestId} className={realStyle('topNickname')}>
        {truncate(userInfo?.nick || 'default', 3)}
      </p>
    </>
  );
};

// 单个置顶UI
interface StickTopItemApi {
  sessionId: string;
}
export const ImStickTopItem: React.FC<StickTopItemApi> = props => {
  const { sessionId } = props;
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // 打开会话
  const navigateTo = () => {
    openSession(
      {
        mode: 'normal',
        sessionId,
      },
      {
        createSession: true,
      }
    );
  };

  const { hash: locationHash } = useLocation();
  const sessionName = useObservable(
    (_, $props) =>
      $props.pipe(
        switchMap(([id]) => {
          const account = id.replace(/^(p2p|team)-/, '');
          const $username = defer(() => nimApi.imusers.getUserProp(of(account), of('nick')));
          const $teamname = defer(() => nimApi.imteamStream.getTeamField(of(account).pipe(map(id => [id, 'customTeamName']))));
          return iif(() => /^p2p/.test(id), $username, $teamname);
        })
      ),
    '',
    [sessionId]
  );

  // const sessionName = useState('测试');

  const $unread = useObservable(
    (_, $props) => {
      const $hash = $props.pipe(
        map(list => {
          return list[2];
        })
      );
      const $field = $props.pipe(
        map(list => {
          return list.slice(0, 2) as [string, string];
        })
      );
      return nimApi.sessionStream.getSessionField($field, $hash) as Observable<number>;
    },
    0,
    [sessionId, 'unread', locationHash]
  );

  const currentSessionId = useObservable(() => nimApi.currentSession.getSubject() as Observable<string>, '');
  const $isMuted = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(([id]) => id));
      return nimApi.imnotify.subscribeMuteStatus($sessionId);
    },
    false,
    [sessionId]
  );

  return (
    <Tooltip
      visible={showTooltip}
      color="rgba(0,0,0,.1)"
      placement="bottom"
      overlayClassName={realStyle('customTooltipStyle')}
      title={sessionName}
      mouseEnterDelay={0.3}
      data-test-id="im_top_sessionitem_tooltip"
      autoAdjustOverflow
    >
      <Dropdown trigger={['contextMenu']} overlay={<ImTopContextmenu id={sessionId} />}>
        <div
          data-test-id="im_top_sessionitem"
          onClick={navigateTo}
          className={realStyle('topSessionItem', currentSessionId === sessionId ? 'topSessionItemSelect' : '')}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/^p2p/.test(sessionId) ? (
            <UserItem to={sessionId.replace('p2p-', '')} testId="im_top_sessionitem_avatar" nickNameTestId="im_top_sessionitem_nickname" />
          ) : (
            <TeamItem teamId={sessionId.replace('team-', '')} testId="im_top_sessionitem_groupavatar" nickNameTestId="im_top_sessionitem_nickname" />
          )}
          {$unread ? <UnreadMsgCount count={$unread} sessionId={sessionId} className={realStyle('topSessionUnread', $isMuted ? 'mute' : '')} /> : null}
        </div>
      </Dropdown>
    </Tooltip>
  );
};
