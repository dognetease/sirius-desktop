import React, { useEffect, useRef, useState } from 'react';
import { apiHolder, EventApi, NIMApi, Session, apis, DataTrackerApi } from 'api';
import classnames from 'classnames/bind';
import { useEventCallback, useObservable } from 'rxjs-hooks';
import { Observable, timer } from 'rxjs';
import { withLatestFrom, map, bufferToggle, throttleTime, tap, combineLatestWith, filter, delay, distinctUntilChanged } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import ImSessionItem from './imSessionItem';
import styles from './imSessionList.module.scss';
import { LOG_DECLARE } from '../common/logDeclare';
import { useLocation } from '@reach/router';

const realStyle = classnames.bind(styles);
const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const getNestedSessionId: (entries: IntersectionObserverEntry[]) => string = entries => {
  // 寻找entry中最靠近顶部位置的target
  let targetEntry: IntersectionObserverEntry | undefined;
  const bottomlineRef = entries.find(entry => entry.target.getAttribute('data-type') === 'session-bottom-line');
  // 当前会话列表是否已经滚动到底部
  const hasScrollBottom = bottomlineRef && bottomlineRef.intersectionRatio > 0;

  const sessionEntries = entries.filter(entry => entry.target.getAttribute('data-type') !== 'session-bottom-line');
  targetEntry = sessionEntries
    .filter(entry => {
      const { y } = entry.boundingClientRect;
      const { y: parentY } = entry.rootBounds;
      return y - parentY > 0;
      // entry.boundingClientRect.y > 0
    })
    .find(entry => {
      const { y } = entry.boundingClientRect;
      // 找到列表中第一个可以滚动的元素(在当前窗口顶部以下 & 父窗口可以滚动)
      if (y >= 0 && !hasScrollBottom) {
        return true;
      }
      return false;
    });
  // 如果找不到 向上寻找返回第一个会话
  if (!targetEntry) {
    targetEntry = sessionEntries.find(entry => {
      const { y } = entry.boundingClientRect;
      const { y: parentY } = entry.rootBounds;
      return y - parentY <= 0;
    });
  }

  if (targetEntry) {
    const { target } = targetEntry;
    const sessionId = target.getAttribute('data-sessionid') as string;
    return [sessionId, new Date().getTime()].join('^');
  }
  return '';
};

const eventApi: EventApi = apiHolder.api.getEventApi();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

const ImSessionList: React.FC<{
  type?: 'all' | 'later';
}> = props => {
  const sessionBoxRef = useRef(null);
  const sessionBottomlineRef = useRef<HTMLParagraphElement>(null);
  const { type = 'all' } = props;
  const { hash: locationHash } = useLocation();
  const $sessionlist = useObservable(
    (_, $props) => {
      const $type = $props.pipe(map(args => args[0]));
      const $enableUpdateSession = $props.pipe(
        delay(20),
        map(args => args[1].includes('message'))
      );
      const $sessionStream = nimApi.sessionStream.getSubject() as Observable<Session[]>;
      return $sessionStream.pipe(
        combineLatestWith($enableUpdateSession),
        filter(([, flag]) => {
          return flag;
        }),
        map(([sessions]) => {
          return sessions;
        }),
        withLatestFrom($type),
        map(args => {
          const [sessionlist, type] = args;
          if (type !== 'later') {
            return sessionlist;
          }
          return sessionlist.filter(item => lodashGet(item, 'localCustom.later', false) === true);
        })
      );
    },
    [] as Session[],
    [type, locationHash]
  );
  const [reportChildBoundTimestamp, setReportChildBoundTime] = useState(0);

  // 将未读会话跳转到窗口顶部
  const unreadIntersection = useRef<IntersectionObserver>();

  const [intersectionCallback, viewSessionId] = useEventCallback(($event: Observable<IntersectionObserverEntry[]>, $state) => {
    const $bufferToggle = $event.pipe(throttleTime(100));
    const $bufferEvents = $event.pipe(
      tap(entries => {
        // 先将所有的entries全部卸载 避免重复触发
        entries.forEach(entry => {
          unreadIntersection.current!.unobserve(entry.target);
        });
      }),
      bufferToggle($bufferToggle, () => timer(100)),
      throttleTime(50),
      map(args => args.reduce((total, current) => [...total, ...current], [] as IntersectionObserverEntry[]))
    );
    return $bufferEvents.pipe(map(entries => getNestedSessionId(entries)));
  }, '');

  useEffect(() => {
    unreadIntersection.current = new IntersectionObserver(intersectionCallback, {
      root: sessionBoxRef.current,
      // 完全可视才属于可视
      threshold: 1,
    });
    const eventId = eventApi.registerSysEventObserver('messageDoubleClick', {
      func: () => {
        unreadIntersection.current!.observe(sessionBottomlineRef.current as HTMLParagraphElement);
        setReportChildBoundTime(new Date().getTime());
        datatrackApi.track(LOG_DECLARE.MSG_CORNER.DOUBLE_CLICK);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('messageDoubleClick', eventId);
      unreadIntersection.current!.unobserve(sessionBottomlineRef.current as HTMLParagraphElement);
      unreadIntersection.current?.disconnect();
    };
  }, []);

  // todo:执行表情素材下载
  // useEffect(() => {
  //   downloadEmoji();
  // }, []);

  return (
    <div className={realStyle('imSessionsWrap')} ref={sessionBoxRef} data-test-id="im_sessionlist_scrollwrap">
      <ul className={realStyle('list')} data-test-id="im_sessionlist">
        {$sessionlist.map(session => (
          <ImSessionItem
            key={session.id}
            session={session}
            intoViewId={viewSessionId}
            reportTime={reportChildBoundTimestamp}
            intersectioninstance={unreadIntersection.current as IntersectionObserver}
            source={type}
          />
        ))}
        <p className={realStyle('getMoreSessions')} ref={sessionBottomlineRef} data-type="session-bottom-line" />
      </ul>
    </div>
  );
};

export default ImSessionList;
