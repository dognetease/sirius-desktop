import React, { useEffect, createContext } from 'react';
import { Session, apiHolder, NIMApi, IMUser } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map, tap, debounceTime, take } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { Observable } from 'rxjs';
import { closeSession } from '../../common/navigate';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { useImTeam } from '../../common/hooks/useTeamInfo';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface CurSessionInfoContextApi {
  toName: string;
  firstFrameSession: Session;
  getMsgReceiptTime(): number;
  userInfo: IMUser | undefined;
}
// 当前会话的信息
export const CurSessionContext = createContext<CurSessionInfoContextApi>({} as CurSessionInfoContextApi);

// 当前个人会话信息
export const P2PSessionProvider: React.FC<Record<'sessionId' | 'to', string>> = props => {
  const { sessionId, to } = props;
  const userInfo = useYunxinAccount(to, sessionId.split('-')[0]);

  const $sessionExist = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(
        tap(args => {}),
        map(args => args[0])
      );
      const $flag = nimApi.sessionStream.getSession($sessionId).pipe(map(session => lodashGet(session, 'to.length', 0) !== 0));
      return $flag;
    },
    true,
    [sessionId]
  );

  const msgReceiptTime = useObservable((_, $props) => nimApi.sessionStream.getSessionField($props) as Observable<number>, 0, [sessionId, 'msgReceiptTime']);

  const firstFrameSession = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(args => args[0]));
      return nimApi.sessionStream.getSession($sessionId).pipe(take(1));
    },
    {} as Session,
    [sessionId]
  );

  // 当前会话被删除
  useEffect(() => {
    if (!$sessionExist) {
      closeSession();
    }
  }, [$sessionExist]);

  const getMsgReceiptTime = () => msgReceiptTime;

  return (
    <CurSessionContext.Provider
      value={{
        toName: userInfo?.nick as string,
        userInfo,
        firstFrameSession,
        getMsgReceiptTime,
      }}
    >
      {props.children}
    </CurSessionContext.Provider>
  );
};

export const TeamSessionProvider: React.FC<any> = props => {
  const { sessionId, to } = props;

  const teamInfo = useImTeam(to);
  const $sessionExist = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(args => args[0]));
      const $flag = nimApi.sessionStream.getSession($sessionId).pipe(
        debounceTime(100),
        map(session => lodashGet(session, 'to.length', 0) !== 0)
      );
      return $flag;
    },
    true,
    [sessionId]
  );

  const msgReceiptTime = useObservable((_, $props) => nimApi.sessionStream.getSessionField($props) as Observable<number>, 0, [sessionId, 'msgReceiptTime']);

  const firstFrameSession = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(args => args[0]));
      return nimApi.sessionStream.getSession($sessionId).pipe(take(1));
    },
    {} as Session,
    [sessionId]
  );

  const getMsgReceiptTime = () => msgReceiptTime;

  // 当前会话被删除
  useEffect(() => {
    if (!$sessionExist) {
      closeSession();
    }
  }, [$sessionExist]);

  return (
    <CurSessionContext.Provider
      value={{
        toName: teamInfo?.customTeamName as string,
        firstFrameSession,
        getMsgReceiptTime,
      }}
    >
      {props.children}
    </CurSessionContext.Provider>
  );
};
