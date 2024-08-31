import React from 'react';
import classnames from 'classnames';
import styles from './daycellcontent.module.scss';
import { CalendarProps, FullCalendarProps } from '../../calendar';
import { getLunarDayStr } from '../../util';

type RenderDayCellContent = CalendarProps;

const renderDayCellContent: RenderDayCellContent = arg => {
  const {
    date,
    isToday,
    view: { type },
    weekFirstDay,
    weekNumbersVisible,
  } = arg;
  const { lunarDay, solarDay, weekStr } = getLunarDayStr(date);

  // 周视图
  if (type === 'timeGridWeek') {
    return (
      <div
        className={classnames(styles.timeGridContainer, {
          [styles.timeGridToday]: isToday,
        })}
      >
        <div className={styles.timeWeek}>{weekStr}</div>
        <div className={styles.timeWeekDay}>
          <span className={styles.timeSolarDay}>{solarDay}</span>
          <span className={styles.timeLunarDay}>{lunarDay}</span>
        </div>
      </div>
    );
  }
  return (
    <span
      className={classnames([
        styles.container,
        {
          [styles.visibleWeekNumberCell]: weekNumbersVisible && date.getDay() === weekFirstDay,
        },
      ])}
    >
      <span
        className={classnames([
          styles.solarDay,
          {
            [styles.solarToday]: isToday,
          },
        ])}
      >
        {solarDay}
      </span>
      <span className={styles.lunarDay}>{lunarDay}</span>
    </span>
  );
};

export default renderDayCellContent;
