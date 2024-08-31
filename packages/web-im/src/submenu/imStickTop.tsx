import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { apiHolder, Session, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { useObservable } from 'rxjs-hooks';
import { map, distinctUntilChanged, switchMap, delay, tap, filter, combineLatestWith } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import lodashGet from 'lodash/get';
import styles from './imStickTop.module.scss';
import { FoldAvatar } from '../common/imUserAvatar';
import { ImStickTopItem } from './imStickTopItem';
import { useLocation } from '@reach/router';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
// @ts-ignore
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const PlaceHolder: React.FC<any> = () => (
  <>
    <i />
    <i />
    <i />
    <i />
    <i />
    <i />
    <i />
    <i />
  </>
);
const ONE_LINE_HEIGHT = 64; // 头像高度
const SHOW_FOLD_LINES = 2; // 超过2行展示展开按钮
const compareSessionByCreateTime: (list: Session[]) => Session[] = list => {
  const getTopCustom = topCustom => {
    let topCustomObj = {};
    try {
      topCustomObj = typeof topCustom === 'string' ? JSON.parse(topCustom) : topCustom;
    } catch (err) {}
    return topCustomObj;
  };
  const oldlist = list.filter(session => {
    const topCustomObj = getTopCustom(session.topCustom);
    return lodashGet(topCustomObj, 'createTime', 0) === 0;
  });
  // const isFixedOrder = oldlist.some(item => {
  //   const { localCustom } = item;
  //   if (typeof localCustom === 'string') {
  //     return localCustom.indexOf('stickOrder') !== -1;
  //   }
  //   return false;
  // });
  // if (!isFixedOrder) {
  //   oldlist.forEach((session, index) => {
  //     nimApi.sessionStream.updateLocalCustom(session.id, { stickOrder: index });
  //   });
  // } else {
  //   oldlist = oldlist.sort((prev, next) => {
  //     let prevOrder = 1;
  //     let nextOrder = 1;
  //     try {
  //       prevOrder = (JSON.parse((prev.localCustom as unknown) as string) as { stickOrder: number }).stickOrder;
  //       nextOrder = (JSON.parse((prev.localCustom as unknown) as string) as { stickOrder: number }).stickOrder;
  //     } catch (ex) {}
  //     return prevOrder - nextOrder;
  //   });
  // }
  const newlist = list
    .filter(session => {
      const topCustomObj = getTopCustom(session.topCustom);
      return lodashGet(topCustomObj, 'createTime', 0) !== 0;
    })
    .map(session => {
      session.topCustom = getTopCustom(session.topCustom);
      return session;
    })
    .sort((oldSession, newSession) => {
      const { createTime: oldCreateTime } = oldSession.topCustom;
      const { createTime: newCreateTime } = newSession.topCustom;
      return oldCreateTime - newCreateTime;
    });
  return [...oldlist, ...newlist];
};
// 置顶会话
const IMStickTop: React.FC<any> = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showExpandBtn, setShowExpandBtn] = useState<boolean>(false);
  const refTopSessionList = useRef<HTMLDivElement>(null);
  // sticktoplist要过滤掉不存在的会话(这里面不执行取消置顶 因为重新加入之后有可能需要恢复置顶)

  const { hash: locationHash } = useLocation();

  // 当session数量发生变化之后重新获取置顶列表
  const sticktoplist = useObservable(
    (_, $props) => {
      const $event = nimApi.sessionStream.getSubject() as Observable<Session[]>;

      const $enableUpdateSession = $props.pipe(
        map(([hash]) => {
          return hash.includes('message');
        }),
        delay(20),
        distinctUntilChanged()
      );

      const $stickTopCount = $event.pipe(
        map(sessions => sessions.filter(item => item.isTop).length),
        distinctUntilChanged()
      );

      return $stickTopCount.pipe(
        delay(100),
        switchMap(() => {
          const $request = nimApi.excute('getStickTopSessions', {
            findDelete: true,
          }) as Promise<Session[]>;
          return from($request);
        }),
        tap(list => {
          console.log('[im.stickTopChanged]', list);
        }),
        map(compareSessionByCreateTime),
        combineLatestWith($enableUpdateSession),
        filter(([, flag]) => {
          return flag;
        }),
        map(([data]) => {
          return data;
        })
      );
    },
    [] as Session[],
    [locationHash]
  );

  const calcListSize = listDiv => {
    if (!listDiv) return;
    const { scrollHeight } = listDiv;
    const scrollLines = Math.floor(scrollHeight / ONE_LINE_HEIGHT);
    setShowExpandBtn(scrollLines > SHOW_FOLD_LINES);
  };
  const expand = () => {
    if (expanded) {
      refTopSessionList.current?.scrollTo({ top: 0 });
    }
    setExpanded(expanded => !expanded);
  };
  useLayoutEffect(() => {
    calcListSize(refTopSessionList.current);
  });
  useEffect(() => {
    if (refTopSessionList.current) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          calcListSize(entry.target);
        }
      });
      ro.observe(refTopSessionList.current);
    }
  }, []);
  return (
    <div
      className={realStyle('topSessionWrap', {
        hidden: sticktoplist.length === 0,
      })}
    >
      <div data-test-id="im_top_sessionlist" className={realStyle('topSessionList', { listExpanded: expanded })} ref={refTopSessionList}>
        {sticktoplist.map(item => (
          <ImStickTopItem sessionId={item.id} key={item.id} />
        ))}
        {showExpandBtn && (
          <div
            data-test-id={!expanded ? 'im_top_sessionlist_expand' : 'im_top_sessionlist_unexpand'}
            onClick={expand}
            className={realStyle('topSessionItem', { itemUnexpanded: !expanded })}
          >
            <FoldAvatar fold={expanded} />
            <p className={realStyle('topNickname', 'topOperate')}>{expanded ? getIn18Text('SHOUQI') : getIn18Text('ZHANKAI')}</p>
          </div>
        )}
        <PlaceHolder />
      </div>
    </div>
  );
};
export default IMStickTop;
