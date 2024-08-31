import React, { useCallback, useEffect } from 'react';
import { apiHolder, NIMApi, Session, apis, DataTrackerApi, PerformanceApi } from 'api';
import classnames from 'classnames/bind';
import { Progress, Tabs } from 'antd';
import { useObservable } from 'rxjs-hooks';
import { Observable } from 'rxjs';
import { map, withLatestFrom, filter, delay } from 'rxjs/operators';
import styles from './imSessionList.module.scss';
import ImSessionList from './imSessionList';
import { LOG_DECLARE, performanceLogDeclare } from '../common/logDeclare';
import { getIn18Text } from 'api';
const { TabPane } = Tabs;
const realStyle = classnames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const imLoadSessionStatKey = [performanceLogDeclare.PREFIX_KEY, performanceLogDeclare.SUB_KEYS.INIT_SESSION_LIST].join('_');
interface EmptySessionApi {
  type?: string | 'all';
}
export const EmptySession: React.FC<EmptySessionApi> = props => {
  const { type } = props;
  const createTeamSession = () => {
    nimApi.emitCustomEvent('TRIGGER_CONTACT_MODAL');
  };
  return (
    <div data-test-id="im_sessionlist_empty" className={realStyle('noSession')}>
      <p className={realStyle('tips')}>{getIn18Text('ZANWUHUIHUA')}</p>
      {type !== 'later' && (
        <div onClick={createTeamSession} className={realStyle('action')}>
          {getIn18Text('FAQIHUIHUA')}
        </div>
      )}
    </div>
  );
};
const imLoadSession: React.FC<{}> = () => {
  /**
      * const time = contactApi.getContactSyncTimes();
      if (time > 0) {
          return Promise.resolve(true);
      }
      return new Promise(resolve => {
          const eventId = eventApi.registerSysEventObserver('contactNotify', { func: () => {
              // 注销监听
              try {
                  eventApi.unregisterSysEventObserver('contactNotify', eventId);
              } catch (ex) {}
              resolve(true);
          });
      */
  const $step1 = 1;
  const onTabChange = useCallback(key => {
    if (key === '2') {
      datatrackApi.track(LOG_DECLARE.LATER.VIEW_LATER_LIST);
      nimApi.imlater.getLaterList();
    }
  }, []);
  const $step2 = useObservable(() => {
    const $session = (nimApi.sessionStream.getSubject() as Observable<Session[]>).pipe(map(list => (list.length > 0 ? 2 : 1)));
    return $session;
  }, 0);
  const $laterSessionCount = useObservable(() => {
    const list = nimApi.imlater.getSubject() as Observable<string[]>;
    return list.pipe(map(_list => _list.length));
  }, 0);
  const unExistLaterSessionlist = useObservable(() => {
    const alllist = (nimApi.sessionStream.getSubject() as Observable<Session[]>).pipe(map(list => list.map(item => item.id)));
    const laterlist = nimApi.imlater.getSubject() as Observable<string[]>;
    return laterlist.pipe(
      filter(list => list.length > 0),
      delay(50),
      withLatestFrom(alllist),
      filter(([, _alllist]) => _alllist.length > 0),
      map(([_laterlist, _alllist]) => _laterlist.filter(id => !_alllist.includes(id)).join(','))
    );
  }, []);
  useEffect(() => {
    unExistLaterSessionlist.length > 0 &&
      unExistLaterSessionlist.split(',').forEach(id => {
        // todo: 需要添加对应的会话
        console.log('[会话]:', id, getIn18Text('ZAIDAIBANLIEBIAO'));
        nimApi.currentSession.createSession(...(id.split('-') as [string, string]));
      });
  }, [unExistLaterSessionlist]);
  useEffect(() => {
    if ($step2 === 0) {
      performanceApi.time({
        statKey: imLoadSessionStatKey,
      });
    } else {
      performanceApi.timeEnd({
        statKey: imLoadSessionStatKey,
        params: {
          isEmpty: $step2 === 1 ? 'yes' : 'no',
        },
      });
    }
  }, [$step2]);
  useEffect(() => {
    if ($step2 <= 1) {
      return;
    }
    nimApi.imlater.getLaterList();
  }, [$step2]);
  if ($step2 === 0) {
    return (
      <div className={realStyle('waitContactReady')}>
        <p className={realStyle('sessionLoadingStep')}>
          {getIn18Text('JIAZAIXIAOXILIE')}
          <span className={`dark-invert ${realStyle('ellipse')}`} />
        </p>

        <Progress percent={($step1 + $step2) * 50} showInfo={false} status="active" strokeColor="#386EE7" trailColor="rgba(38, 42, 51, 0.1)" strokeWidth={4} />

        <p className={realStyle('sessionLoadingText')}>
          {getIn18Text('JINDU')}
          {($step1 + $step2) * 50 + '%'}
        </p>
      </div>
    );
  }
  if ($step2 === 1) {
    return <EmptySession />;
  }
  return (
    <div data-test-id="im_sessionlist_tabs_wrapper" className={realStyle('imSessionsTotal')}>
      <Tabs defaultActiveKey="1" tabBarGutter={24} animated={false} onChange={onTabChange}>
        <TabPane tab={getIn18Text('QUANBU')} key="1">
          <ImSessionList type="all" />
        </TabPane>
        <TabPane tab={`${getIn18Text('SHAOHOUCHULI')} ${$laterSessionCount || ''}`} key="2">
          <ImSessionList type="later" />
          {!$laterSessionCount && <EmptySession type="later" />}
        </TabPane>
      </Tabs>
    </div>
  );
};
export default imLoadSession;
