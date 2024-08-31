import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import { Dropdown } from 'antd';
import lodashGet from 'lodash/get';
import { useLocation } from '@reach/router';
import { Session, apiHolder, NIMApi } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map, combineLatestWith } from 'rxjs/operators';
import styles from './imSessionItem.module.scss';
import { UserAvatar, TeamAvatar } from '../common/imUserAvatar';
import ImLastestMsgDisplay from './imLastestMsgDisplay';
import { ImContextMenu } from './imContextMenu';
import { useYunxinAccount } from '../common/hooks/useYunxinAccount';
import { useImTeam, useImTeamType, useIMTeamField } from '../common/hooks/useTeamInfo';
import { formatTime, isToday, addHHM } from '../common/timeline';
import ChatItemStatus from '../subcontent/chatDisplay/chatItemStatus';
import { openSession } from '../common/navigate';
import { UnreadMsgCount, MuteMark } from './unreadCount';
import { LaterDeal } from './laterDeal';
import { MentionMe } from './sessionMentionMe';
import { renderMsgContent } from '../utils/im_team_util';
import { TeamDiscussTag } from '../components/TeamSetting/teamDiscussTag';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classNames.bind(styles);
const DisplayTime: React.FC<Record<'time', number>> = props => {
  const { time } = props;
  if (isToday(time)) {
    return (
      <span data-test-id="im_list_sessionitem_time" className={realStyle('time')}>
        {addHHM(time)}
      </span>
    );
  }

  return (
    <span data-test-id="im_list_sessionitem_time" className={realStyle('time')}>
      {formatTime(time)}
    </span>
  );
};

const TeamSessionName: React.FC<{ teamId: string; discussGroup: boolean }> = ({ teamId, discussGroup }) => {
  const teamName = useIMTeamField(teamId, 'customTeamName');
  return (
    <p data-test-id="im_list_sessionitem_name" className={realStyle('teamName')}>
      <span className={realStyle('text')}>{teamName || 'default_team'}</span>
      {discussGroup ? <TeamDiscussTag /> : null}
    </p>
  );
};

const P2PSessionName: React.FC<{ uid: string }> = ({ uid }) => {
  const user = useYunxinAccount(uid);
  return (
    <p data-test-id="im_list_sessionitem_name" className={realStyle('name')}>
      {user?.nick || 'default'}
    </p>
  );
};

const TeamSessionAvatar: React.FC<{ teamId: string; discussGroup: boolean }> = ({ teamId, discussGroup }) => {
  const teamInfo = useImTeam(teamId);
  const valid = useIMTeamField(teamId, 'valid') as unknown as boolean;
  useEffect(() => {
    valid === false && nimApi.sessionStream.deleteSession(`team-${teamId}`);
  }, [valid]);
  return <TeamAvatar testId="im_list_sessionitem_groupavatar" teamInfo={teamInfo} teamId={teamId || ''} discussGroup={discussGroup} />;
};
const P2PSessionAvatar: React.FC<{ uid: string }> = ({ uid }) => {
  const user = useYunxinAccount(uid);
  return <UserAvatar user={user} testId="im_list_sessionitem_avatar" />;
};

interface ImSessionItemProps {
  session: Session;
  intoViewId: string;
  intersectioninstance: IntersectionObserver;
  reportTime: number;
  source?: string;
}
const ImSessionItem: React.FC<ImSessionItemProps> = prop => {
  // 获取列表数据
  const { session, intoViewId, intersectioninstance, reportTime, source = 'all' } = prop;

  const { hash: locationHash } = useLocation();

  // 邮件讨论组
  const discussGroup = useImTeamType(session.to, 'team') === 'discuss';

  const ref = useRef<HTMLLIElement | null>(null);
  // forceScroll 是否强制滚动
  const scrollToView = async (forceScroll = false) => {
    [0, 200].forEach(async time => {
      await new Promise(resolve => {
        setTimeout(resolve, 200);
      });
      const curNode = ref.current as unknown as HTMLElement;

      if ('scrollIntoViewIfNeeded' in document.body && !forceScroll) {
        curNode && curNode.scrollIntoViewIfNeeded(true);
      } else {
        curNode && curNode.scrollIntoView(true);
      }
    });
  };
  useEffect(() => {
    const checked = locationHash.indexOf(session.id) !== -1;
    if (!checked) {
      return;
    }
    scrollToView();
  }, [locationHash]);

  // 支持点击消息ICON 快速滚到到最近的一条未读session功能
  useEffect(() => {
    const intoViewSessionId = intoViewId.replace(/\^\d+$/, '');
    if (intoViewSessionId === session.id) {
      scrollToView(true);
    }
  }, [intoViewId]);

  // 当前会话是否不执行观测
  const $mute = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(args => args[0] as string));
      return nimApi.imnotify.subscribeMuteStatus($sessionId);
    },
    false,
    [session.id]
  );
  const $skipObserver = useObservable(
    (_, $props) => {
      const $param = $props.pipe(map(([sessionId, field]) => [sessionId, field] as [string, string]));
      const _mute = $props.pipe(map(([, , mute]) => mute));
      return nimApi.sessionStream.getSessionField($param).pipe(
        combineLatestWith(_mute),
        map(([unread, isMute]) => {
          if (isMute) {
            return true;
          }
          return !unread;
        })
      );
    },
    false,
    [session.id, 'unread', $mute]
  );

  // 上报当前节点位置
  useEffect(() => {
    if (reportTime === 0 || $skipObserver) {
      return () => {};
    }
    intersectioninstance.observe(ref.current as HTMLLIElement);
    return () => {
      intersectioninstance.unobserve(ref.current as HTMLLIElement);
    };
  }, [reportTime]);

  const [visibleContextmenu, setVisibleContextmenu] = useState(false);

  const setCurSession = () => {
    openSession({
      mode: 'normal',
      sessionId: session.id,
      way: source,
    });
  };

  const [draftMsg, setDraftMsg] = useState<null | string>(null);
  useEffect(() => {
    if (location.hash.indexOf(session.id) !== -1) {
      setDraftMsg(null);
      return;
    }
    try {
      const content = session.localCustom;
      if (lodashGet(content, 'plainText.length', 0) !== 0) {
        setDraftMsg(content.plainText);
      } else {
        setDraftMsg(null);
      }
    } catch (ex) {
      setDraftMsg(null);
    }
  }, [session.id, location.hash, lodashGet(session, 'localCustom.plainText.length', 0)]);

  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    try {
      const content = JSON.parse(session.localCustom);
      const draftTime = lodashGet(content, 'time', 0);
      setDisplayTime(Math.max(session.updateTime, draftTime));
    } catch (ex) {
      setDisplayTime(session.updateTime);
    }
  }, [session.id, lodashGet(session, 'lastMsg.idClient', '')]);

  const [showStatus, setShowStatus] = useState(false);
  useEffect(() => {
    const flag = [
      () => lodashGet(session, 'lastMsg.flow', '') === 'out',
      () => session.scene === 'p2p',
      () => lodashGet(session, 'lastMsg.isLocal', false) !== true,
      () => lodashGet(session, 'lastMsg.from', '') !== lodashGet(session, 'lastMsg.to', ''),
    ].every(callback => callback());
    return setShowStatus(flag);
  }, [lodashGet(session, 'lastMsg.idClient', '')]);

  return (
    <Dropdown
      visible={visibleContextmenu}
      onVisibleChange={flag => {
        setVisibleContextmenu(flag);
      }}
      overlay={
        <ImContextMenu
          session={session}
          close={() => {
            setVisibleContextmenu(false);
          }}
        />
      }
      trigger={['contextMenu']}
    >
      <li
        role="button"
        ref={ref}
        data-test-id="im_list_sessionitem"
        // @ts-ignore
        onClick={e => {
          e.preventDefault();
          // dispatchCurSession(session);
          setCurSession();
        }}
        className={realStyle([
          'sessionListItem',
          {
            checked: location.hash.indexOf(session.id) !== -1,
          },
        ])}
        data-sessionid={session.id}
      >
        {/* 用户有设置头像 */}
        {session?.scene === 'p2p' && <P2PSessionAvatar uid={session.to} />}

        {/* <p>{JSON.stringify(user)}</p> */}

        {session?.scene === 'team' && <TeamSessionAvatar teamId={session.to} discussGroup={discussGroup} />}

        <div className={realStyle(['convItemContent'])}>
          <div className={realStyle(['nameWrap'])}>
            {/* 单聊 */}
            {session.scene === 'p2p' && <P2PSessionName uid={session.to} />}
            {/* 群聊 */}
            {session.scene === 'team' && <TeamSessionName teamId={session.to} discussGroup={discussGroup} />}

            <DisplayTime time={displayTime} />
          </div>

          <div className={realStyle('latestMsgInfo')}>
            {/* 草稿信息 */}
            {!!draftMsg ? (
              <p data-test-id="im_list_sessionitem_draft" className={realStyle('draftContent')}>
                <span className={realStyle('icon')}>[草稿]&nbsp;</span>
                <span dangerouslySetInnerHTML={{ __html: renderMsgContent(draftMsg) }} />
              </p>
            ) : null}
            {/* 最后一条信息 */}
            {!draftMsg && lodashGet(session, 'lastMsg.idClient.length', 0) !== 0 ? (
              <>
                {/* p2p中自己发送信息 */}
                {showStatus && <ChatItemStatus className={realStyle('lastMsgStatus')} msg={session.lastMsg} />}

                <MentionMe msg={session.lastMsg} unread={session.unread} />

                <ImLastestMsgDisplay scene={session.scene} lastMsg={session.lastMsg} />
              </>
            ) : null}
            {/* 无信息 */}
            {!draftMsg && lodashGet(session, 'lastMsg.idClient.length', 0) === 0 ? <span className={realStyle('latestMsgPlaceholder')} /> : null}

            <LaterDeal session={session} />
            {session.unread ? <UnreadMsgCount sessionId={session.id} count={session.unread} /> : <MuteMark sessionId={session.id} />}
          </div>
        </div>
      </li>
    </Dropdown>
  );
};

export default ImSessionItem;
