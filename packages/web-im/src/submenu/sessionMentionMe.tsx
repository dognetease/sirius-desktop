import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { IMMessage, apiHolder, NIMApi, IMUser } from 'api';
import lodashGet from 'lodash/get';
import { useObservable } from 'rxjs-hooks';
import { switchMap, scan, withLatestFrom, map, pairwise, startWith } from 'rxjs/operators';
import { Observable, iif, from } from 'rxjs';
import styles from './imSessionItem.module.scss';
import { getIn18Text } from 'api';
const realStyle = classNames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface MentionMeApi {
  msg: IMMessage;
  unread: number;
}
const findMentionType = (msg: IMMessage, myAccount: string) => {
  if (msg.flow === 'out') {
    return 'none';
  }
  if (lodashGet(msg, 'apns.accounts', []).includes(myAccount)) {
    return 'me';
  }
  if (Reflect.has(msg, 'apns') && lodashGet(msg, 'apns.accounts.length', 0) === 0) {
    let mentions: string[] = [];
    try {
      mentions = JSON.parse(msg.custom as string).mentions;
    } catch (ex) {}
    const other = Array.isArray(msg?.apns?.accounts) ? 'none' : 'all';
    return (Array.isArray(mentions) ? mentions : []).includes(myAccount) ? 'me' : other;
  }
  return 'none';
};
// 被人@
export const MentionMe: React.FC<MentionMeApi> = props => {
  const { msg, unread } = props;
  const $myinfo = nimApi.imself.getSubject() as Observable<IMUser>;
  const $lastmsgMentionType = useObservable(
    (_, $props) =>
      $props.pipe(
        // 只有unread清过0更新状态
        withLatestFrom($myinfo),
        map(args => {
          const [_props, myinfo] = args;
          const [_unread, msg] = _props;
          return [_unread, findMentionType(msg, myinfo.account)] as unknown as [number, string];
        }),
        scan((total, current) => {
          const [count, currentType] = current;
          if (count === 0) {
            return 'none';
          }
          const AuthMap = {
            me: 3,
            all: 2,
            none: 1,
          };
          // 如果上次的@权限高于这次 则使用上次的结果
          if (Math.max(AuthMap[currentType] as number, AuthMap[total] as number) === AuthMap[total]) {
            return total;
          }
          return currentType;
        }, 'none')
      ),
    'none',
    [unread, msg]
  );
  const $historymsgMentionType = useObservable(
    (_, $props) => {
      const $request = $props.pipe(
        switchMap(([nums, _id]) => {
          const _request = nimApi.excute('getLocalMsgs', {
            desc: true,
            type: 'text',
            sessionId: _id,
            // 最多找20条
            limit: Math.min(nums, 20),
          }) as Promise<{
            msgs: IMMessage[];
          }>;
          return from(_request);
        }),
        withLatestFrom($myinfo),
        map(([{ msgs }, myinfo]) => {
          const mentionMe = msgs.some(msg => findMentionType(msg, myinfo.account) === 'me');
          const mentionAll = msgs.some(msg => findMentionType(msg, myinfo.account) === 'all');
          if (mentionMe) {
            return 'me';
          }
          if (mentionAll) {
            return 'all';
          }
          return 'none';
        })
      );
      const $unread = $props.pipe(map(([count]) => count));
      const $currentType = $props.pipe(map(([, , type]) => type));
      // 如果消息是递增或者递减的就不需要查询了
      return $unread.pipe(
        startWith(0),
        pairwise(),
        switchMap(([prevCount, nextCount]) => iif(() => nextCount === 0 || Math.abs(prevCount - nextCount) === 1, $currentType, $request))
      );
    },
    'none',
    [unread, msg.sessionId, $lastmsgMentionType]
  );
  const [mentionType, setMentionType] = useState('none');
  useEffect(() => {
    if (unread === 0) {
      setMentionType('none');
      return;
    }
    if ([$lastmsgMentionType, $historymsgMentionType].includes('me')) {
      setMentionType('me');
      return;
    }
    if ([$lastmsgMentionType, $historymsgMentionType].includes('all')) {
      setMentionType('all');
      return;
    }
    setMentionType('none');
  }, [unread, $lastmsgMentionType, $historymsgMentionType]);
  if (mentionType === 'me') {
    return (
      <span data-test-id="im_list_sessionitem_mentionme" className={realStyle('hightlight')}>
        {getIn18Text('[YOUREN@NI')}&nbsp;
      </span>
    );
  }
  if (mentionType === 'all') {
    return (
      <span data-test-id="im_list_sessionitem_mentionall" className={realStyle('hightlight', 'all')}>
        {getIn18Text('[@SUOYOUREN')}&nbsp;
      </span>
    );
  }
  return null;
};
