import React, { useEffect } from 'react';
import { useObservable } from 'rxjs-hooks';
import { NIMApi, apiHolder } from 'api';
import { takeUntil, map, filter, mergeMap } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { from, Observable, of } from 'rxjs';
import { Modal } from 'antd';
import { closeSession } from '../../common/navigate';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';

const nimApi = apiHolder.api.requireLogicalApi('nim') as unknown as NIMApi;
export const Destroy: React.FC<{ sessionId: string }> = props => {
  const { sessionId } = props;

  const createDismissTeam: (flow: string) => Observable<boolean> = flow => {
    if (flow === 'out') {
      return of(true);
    }
    return from(
      new Promise(resolve => {
        Modal.warn({
          title: '当前群已经解散',
          okText: '确定',
          width: '448px',
          centered: true,
          afterClose() {
            resolve(true);
          },
        });
      }) as Promise<boolean>
    );
  };

  const isExit = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(([id]) => id));
      const $myinfo = nimApi.imself.getSubject();
      return nimApi.sessionStream.getSession($sessionId).pipe(
        takeUntil(session => lodashGet(session, 'id.length', 0) !== 0),
        filter(session => {
          const attatchType = lodashGet(session, 'lastMsg.attach?.type', '');
          const checkTypes = ['dismissTeam', 'leaveTeam', 'removeTeamMembers'];
          return checkTypes.includes(attatchType);
        }),
        mergeMap(session => {
          const attatchType = lodashGet(session, 'lastMsg.attach?.type', '');
          if (attatchType === 'dismissTeam') {
            const flow = session.lastMsg?.flow as string;
            return createDismissTeam(flow);
          }
          if (attatchType === 'leaveTeam') {
            return of(session.lastMsg?.flow === 'out');
          }
          if (attatchType === 'removeTeamMembers') {
            return nimApi.imself.getMyField().pipe(
              map(account => {
                const accounts = lodashGet(session, 'lastMsg.attach.accounts', []) as string[];
                return accounts.includes(account as string);
              })
            );
          }
          return of(false);
        })
      );
    },
    false,
    [sessionId]
  );

  useEffect(() => {
    isExit && closeSession();
  }, [isExit]);

  return null;
};
