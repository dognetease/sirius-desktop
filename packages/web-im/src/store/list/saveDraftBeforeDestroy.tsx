import { apiHolder, NIMApi, apis, PerformanceApi, DataTrackerApi } from 'api';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useLocation } from '@reach/router';
import { useEventCallback } from 'rxjs-hooks';
import { Observable, timer } from 'rxjs';
import { bufferToggle, tap, withLatestFrom, map, pairwise, delay } from 'rxjs/operators';
import { getParams } from '../../common/query';
import { LOG_DECLARE, performanceLogDeclare } from '../../common/logDeclare';

const logApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;

interface ContextApi {
  saveDraft: (e: Record<string, unknown>) => void;
  setRenderCompleteTime: Dispatch<SetStateAction<number>>;
}
export const Context = React.createContext<ContextApi>({} as ContextApi);
export const Provider = props => {
  const location = useLocation();
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  useEffect(() => {
    if (location.hash.indexOf('sessionId') === -1) {
      return;
    }
    const mode = getParams(location.hash, 'mode');
    const sessionId = getParams(location.hash, 'sessionId') as string;
    performanceApi.time({
      statKey: performanceLogDeclare.PREFIX_KEY,
      statSubKey: mode === 'history' ? performanceLogDeclare.SUB_KEYS.LOAD_SESSION_BYSEARCH : performanceLogDeclare.SUB_KEYS.LOAD_SESSION,
      params: { sessionId },
    });

    setStartTime(new Date().getTime());
  }, [location.hash]);
  // 渲染完成 执行打点
  useEffect(() => {
    const sessionId = getParams(location.hash, 'sessionId') as string;
    const mode = getParams(location.hash, 'mode');
    const duration = (endTime - startTime) / 1000;
    console.log(`[render]finished.sessionId:${sessionId}.mode:${mode}.duration:${duration.toFixed(2)}`);
    logApi.track(LOG_DECLARE.CHAT.DURATION, {
      duration,
      sessionId,
      mode,
    });
    performanceApi.timeEnd({
      statKey: performanceLogDeclare.PREFIX_KEY,
      statSubKey: mode === 'history' ? performanceLogDeclare.SUB_KEYS.LOAD_SESSION_BYSEARCH : performanceLogDeclare.SUB_KEYS.LOAD_SESSION,
      params: { sessionId },
    });
  }, [endTime]);

  const [saveDraft] = useEventCallback(
    ($e: Observable<Record<string, unknown>>, _, $props) => {
      const $lastSessionId = $props.pipe(
        map(([_id]) => _id),
        pairwise(),
        map(([prevId]) => getParams(prevId, 'sessionId'))
      );

      return $e.pipe(bufferToggle($e, () => timer(50))).pipe(
        delay(30),
        withLatestFrom($lastSessionId),
        tap(([params, _id]) => {
          const args = params.reduce((total, current) => ({ ...total, ...current }), {});
          console.log(`[saveDraft]$sessionId:${_id}.draftInfo:`, args);
          nimApi.sessionStream.updateLocalCustom(_id, args);
        }),
        map(() => '')
      );
    },
    '',
    [location.hash]
  );
  return (
    <Context.Provider
      value={{
        setRenderCompleteTime: setEndTime,
        saveDraft,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
