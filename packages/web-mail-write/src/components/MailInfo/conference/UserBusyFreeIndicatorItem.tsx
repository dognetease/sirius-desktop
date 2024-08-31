import React, { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import { FreeBusyModel } from 'api';
import moment from 'moment';
import styles from '../mailInfo.module.scss';
import { MailActions, useActions } from '@web-common/state/createStore';
import useReceiverStateSelector from '../../../hooks/useReceiverStateSelector';
import { queryFreeBusyList } from '@web-schedule/service';
import useConferenceSelector from '../../../hooks/useConferenceSelector';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import { getIn18Text } from 'api';
function getBusyCount(list: FreeBusyModel[]) {
  return list.filter(e => e.freeBusyItems.length > 0).length;
}
function getBusyFreeDesc(allCount: number, busyCount: number) {
  if (allCount === 0) {
    return getIn18Text('ZANWUHUIYICHENG');
  }
  if (busyCount === 0) {
    return getIn18Text('DANGQIANCHENGYUANJUN');
  }
  if (busyCount !== allCount) {
    return `${allCount}名成员中，${busyCount}在忙`;
  }
  return getIn18Text('SUOYOUCHENGYUANJUN');
}
function getQueryDateParams(conference: Exclude<ReturnType<typeof useConferenceSelector>, undefined>) {
  const { startDate = moment(), startTime = moment(), endDate = moment(), endTime = moment() } = conference || {};
  const start = startDate
    ?.clone()
    .set({
      hours: startTime?.hours(),
      minutes: startTime?.minutes(),
      seconds: 0,
      millisecond: 0,
    })
    .toDate();
  const end = endDate
    ?.clone()
    .set({
      hours: endTime?.hours(),
      minutes: endTime?.minutes(),
      seconds: 0,
      millisecond: 0,
    })
    .toDate();
  return { start, end };
}
const UserBusyFreeIndicatorItem: React.FC<{}> = () => {
  const mailActions = useActions(MailActions);
  const conference = useConferenceSelector();
  const receivers = useReceiverStateSelector();
  const allCount = receivers.length;
  const [busyCount, setBusyCount] = useState<number>(0);
  const handleBusyFreeClick = () => {
    if (allCount > 0) {
      mailActions.doShowUserBusyFree(true);
    }
  };
  const descStr = useMemo(getBusyFreeDesc.bind(null, allCount, busyCount), [allCount, busyCount]);
  useEffect(() => {
    if (conference) {
      const { start, end } = getQueryDateParams(conference);
      queryFreeBusyList({
        start,
        end,
        users: receivers,
      })
        .then(getBusyCount)
        .then(setBusyCount);
    }
  }, [receivers, conference]);
  return (
    <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
      <span className={styles.infoLabel}>{getIn18Text('MANGXIAN')}</span>
      <span className={styles.colonLabel}>:</span>
      <div className={classnames(styles.conferenceTime)}>
        <span
          onClick={handleBusyFreeClick}
          className={classnames(styles.busyFreeDesc, {
            [styles.enable]: allCount > 0,
            [styles.free]: busyCount === 0,
            [styles.busy]: busyCount > 0,
          })}
        >
          <span>{descStr}</span>
          {allCount > 0 && <ArrowRight opcacity={1} stroke={busyCount === 0 ? '#386ee7' : '#f74f4f'} />}
        </span>
      </div>
    </div>
  );
};
export default UserBusyFreeIndicatorItem;
