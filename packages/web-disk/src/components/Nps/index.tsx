import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NpsDialog, NpsDialogType } from './NpsDialog';
import styles from './index.module.scss';
import { apiHolder, apis, NetStorageApi, RequestGetAnnouncement, AnnouncementTarget, SystemEventTypeNames, DataStoreApi } from 'api';
import { getIn18Text } from 'api';
interface NpsInfo {
  id: number;
  title: string;
  type: NpsDialogType;
  key: string;
}
export const NPS_EVENT: SystemEventTypeNames = 'diskNps';
export type NpsEventType = 'RANK_DOC' | 'RANK_SHEET' | 'LIKE_DOC_COMMENT' | 'RANK_DISK';
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const NPS_TARGETS: Record<string, AnnouncementTarget> = {
  RANK_DOC: 'DOC',
  RANK_SHEET: 'EXCEL',
  LIKE_DOC_COMMENT: 'COMMENT',
  RANK_DISK: 'LIST',
};
const NPS_TITLES = {
  RANK_DOC: getIn18Text('NINXIANGPENGYOUHUO11'),
  RANK_SHEET: getIn18Text('NINXIANGPENGYOUHUO12'),
  LIKE_DOC_COMMENT: getIn18Text('NINJUEDEPINGLUN'),
  RANK_DISK: getIn18Text('NINXIANGPENGYOUHUO'),
};
// nps-[nps类型]-[埋点类型]
const NPS_KEYS = {
  RANK_DOC: 'nps-rank-doc',
  RANK_SHEET: 'nps-rank-sheet',
  LIKE_DOC_COMMENT: 'nps-like-docComment',
  RANK_DISK: 'nps-rank-disk',
};
const delayTrigger = (fn: () => void) => {
  return setTimeout(() => {
    fn();
  }, 5 * 60 * 1000);
};
const defaultTrigger = (fn: () => void) => fn();
const COUNT_PREFIX = 'nps_count_';
const countTrigger = (fn: () => void, npsKey: string, minCount = 3) => {
  const args = npsKey.split('-');
  const countKey = `${args[1]}_${args[2]}`;
  const data = dataStoreApi.getSync(countKey, { prefix: COUNT_PREFIX });
  let count = 0;
  if (data.data) {
    count = JSON.parse(data.data)[window.siriusVersion] || 0;
  }
  count++;
  if (count % minCount === 0) {
    fn();
  }
  dataStoreApi.put(countKey, JSON.stringify({ [window.siriusVersion]: count }), { prefix: COUNT_PREFIX });
};
const NPS_TRIGGER = {
  RANK_DOC: delayTrigger,
  RANK_SHEET: delayTrigger,
  LIKE_DOC_COMMENT: countTrigger,
};
const eventApi = apiHolder.api.getEventApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const getNps = (req: RequestGetAnnouncement): Promise<number | null> => {
  return new Promise((resolve, reject) => {
    diskApi.getAnnouncement(req).then(res => {
      if (!res) {
        resolve(null);
        return;
      }
      if (['nps_score', 'nps_yes_or_no'].includes(res?.type)) {
        resolve(res.id);
        return;
      }
      resolve(null);
    });
  });
};
interface NpsAreaProps {
  targetLink: string;
}
export const NpsArea: React.FC<NpsAreaProps> = ({ targetLink }) => {
  const [npsDialogs, setNpsDialogs] = useState<NpsInfo[]>([]);
  const delayTimeoutIdRef = useRef<any>(null);
  const onShowNps = useCallback(
    (info: NpsInfo) => {
      if (window.showDiskNps) {
        return;
      }
      window.showDiskNps = true;
      setNpsDialogs([...npsDialogs, info]);
    },
    [npsDialogs]
  );
  const onNpsEvent = useCallback(
    (npsEventType: NpsEventType, used = false) => {
      const npsTarget = NPS_TARGETS[npsEventType];
      const npsTitle = NPS_TITLES[npsEventType];
      const npsKey = NPS_KEYS[npsEventType];
      const npsType = npsKey.split('-')[1] as NpsDialogType;
      const trigger = NPS_TRIGGER[npsEventType] || defaultTrigger;
      // 表格、文档详情页场景先查询【表格&文档详情页】场景，无 nps 再查询对应的详情页
      let target = npsTarget;
      if (!used && ['DOC', 'EXCEL'].includes(target)) {
        target = 'COSPREAD_DETAIL';
      }
      getNps({
        clientType: 'DESK_TOP',
        clientVersion: window.siriusVersion,
        target,
      }).then(res => {
        if (!res) {
          if (!used && target === 'COSPREAD_DETAIL') {
            onNpsEvent(npsEventType, true);
          }
          return;
        }
        delayTimeoutIdRef.current = trigger(() => {
          onShowNps({
            id: res,
            type: npsType,
            title: npsTitle,
            key: npsKey,
          });
        }, npsKey);
      });
    },
    [onShowNps]
  );
  useEffect(() => {
    const id = eventApi.registerSysEventObserver(NPS_EVENT, {
      func: e => {
        if (e.eventTarget === targetLink) {
          onNpsEvent(e.eventData);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver(NPS_EVENT, id);
      if (delayTimeoutIdRef.current) {
        window.clearTimeout(delayTimeoutIdRef.current);
        delayTimeoutIdRef.current = null;
      }
    };
  }, [onNpsEvent]);
  return (
    <div className={styles.npsAreaWrapper}>
      {npsDialogs.map(({ id, title, type, key }, idx) => {
        return (
          <NpsDialog
            npsId={id}
            key={key}
            title={title}
            type={type}
            npsKey={key}
            onClose={() => {
              window.showDiskNps = false;
              npsDialogs.splice(idx, 1);
              setNpsDialogs([...npsDialogs]);
            }}
          />
        );
      })}
    </div>
  );
};
