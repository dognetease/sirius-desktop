import React from 'react';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { GridHeaderProps } from './data';
import styles from './dayviewtimelinegrid.module.scss';
import MoreEvent from '../ScheduleModal/MoreEvent';
import EventCell from '../ScheduleModal/EventCell';
import { rangeInteract } from '../TimeLinePicker/util';
import { isAlldayOrCrossEvent } from '../ScheduleModal/util';

const ALL_DAY_EVENTS_NUM = 4;

const GridHeader: React.FC<GridHeaderProps> = ({ events, busy = false, text = '', indicatorRange }) => {
  // 判断日程是否冲突
  const isBusyEvent = event => {
    if (!indicatorRange) {
      return false;
    }
    return !!event.allDay || rangeInteract([moment(event.start), moment(event.end)], indicatorRange) !== null;
  };
  // 过滤全天和跨天，并且判断颜色
  // const allEvents = events.filter(c => c.allDay || !moment(c.start).isSame(moment(c.end), 'day'));
  const allEvents = events.filter(c => isAlldayOrCrossEvent(c));
  const allDayAndCrossEvents = cloneDeep(allEvents).map(i => {
    i.textColor = isBusyEvent(i) ? '#51555c' : '#a8aaad';
    i.color = isBusyEvent(i) ? 'rgba(247, 79, 79, 0.2)' : 'rgba(232, 232, 232, 0.6)';
    return i;
  });
  // 渲染表头全天日程
  const renderAllDay = (events: any[]) => {
    if (!events || !events.length) {
      return null;
    }
    // 全天日程显示数量限制
    if (events.length <= ALL_DAY_EVENTS_NUM) {
      return events.map(i => (
        <div className={styles.eventOuter} key={i.scheduleId}>
          <EventCell event={i} judgePast={false} />
        </div>
      ));
    }
    return renderMoreAllDayEvent(events);
  };
  // 表头全天日程过多的展示
  const renderMoreAllDayEvent = (events: any[]) => (
    <>
      {events.map((i, idx) =>
        idx < ALL_DAY_EVENTS_NUM - 1 ? (
          <div className={styles.eventOuter} key={i.scheduleId}>
            <EventCell event={i} judgePast={false} />
          </div>
        ) : null
      )}
      <MoreEvent num={ALL_DAY_EVENTS_NUM} events={events} judgePast={false} />
    </>
  );

  return (
    <>
      <div className={styles.gridHeader}>
        <div className={styles.gridHeaderTitle}>
          <span className={styles.headerContent}>
            <span title={text}>{text}</span>
          </span>
          {busy && <i className={styles.busyIcon} />}
        </div>
        {renderAllDay(allDayAndCrossEvents)}
      </div>
    </>
  );
};
export default GridHeader;
