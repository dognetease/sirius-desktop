import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import { Calendar, Collapse, ConfigProvider } from 'antd';
// import locale from 'antd/es/date-picker/locale/zh_CN';
import styles from './miniCalendar.module.scss';
import stylesOuter from './eventsgroups.module.scss';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import { Lang } from 'api/src/utils/global_label';
import chLocale from 'antd/es/locale/zh_CN';
import enLocale from 'antd/es/locale/en_US';
import { api } from 'api';
export const MINICALENDAR_FORMAT_STR = 'YYYY-MM-DD';
const storeApi = api.getDataStoreApi();

export interface MiniCalendarProps {}
export const isToday = time => {
  const now = moment();
  const timeDayjs = moment(time);
  return timeDayjs.format(MINICALENDAR_FORMAT_STR) === now.format(MINICALENDAR_FORMAT_STR);
};

const { Panel } = Collapse;
const MiniCalendar: React.FC<MiniCalendarProps> = () => {
  const {
    miniSelectedDay: selectedDay,
    scheduledDate,
    weekFirstDay,
    weekNumbersVisible,
    activeStartDate,
    activeEndDate,
  } = useAppSelector(state => state.scheduleReducer);
  const scheduleActions = useActions(ScheduleActions);
  const [language] = useState<string>(() => {
    const result = storeApi.getSync('system_language');
    if (result.suc && result.data) {
      return result.data as Lang;
    }
    return 'zh';
  });
  const weekNumbers: number[] = useMemo(() => {
    const res: number[] = [];
    const momentDate = moment(activeStartDate);
    for (let i = 0; i < 6; i++) {
      res[i] = momentDate.week();
      momentDate.add(1, 'week');
    }
    return res;
  }, [activeStartDate]);
  // 日期是否选中
  const isSelectedDay = time => selectedDay.isSame(time);
  // 是否选中月
  const isMonth = time => selectedDay.month() === time.month();
  // 判断日期是否有日程
  const hasSchedule = (m: Moment): boolean => scheduledDate.includes(m.format(MINICALENDAR_FORMAT_STR));
  // 统一修改选中日期
  const onSelectedDayChange = (m: Moment) => {
    scheduleActions.setMiniSelectedDay(m);
  };
  // 自定义小日历
  const dateFullCellRender = value => {
    const date = value.date();
    // 是否有日程
    const hasScheduleTemp = hasSchedule(value);
    return (
      <div
        className={classnames(styles.miniDay, {
          [styles.today]: isToday(value) && !isSelectedDay(value),
          [styles.todaySelected]: isToday(value) && isSelectedDay(value),
          [styles.notTodaySelected]: !isToday(value) && isSelectedDay(value),
          [styles.notMonth]: !isMonth(value),
        })}
      >
        <span style={{ marginTop: hasScheduleTemp ? -2 : 0 }}>{date}</span>
        {hasScheduleTemp && <div className={styles.minidot}> </div>}
      </div>
    );
  };
  useEffect(() => {
    // 修改英文配置
    moment.updateLocale('en', {
      weekdaysMin: getIn18Text('RI_YI_ER').split('_'),
      week: {
        dow: weekFirstDay, //set sunday as the first day of week
      },
    });

    moment.updateLocale('zh-cn', {
      week: {
        dow: weekFirstDay, //set sunday as the first day of week
      },
    });
    onSelectedDayChange(selectedDay.clone().add(1, 'minute'));
    // console.log('weekFirstDay changed', Ref.current);
  }, [weekFirstDay]);

  // 上个月
  const prevMonth = e => {
    const prev = selectedDay.clone().subtract(1, 'M').date(1).format(MINICALENDAR_FORMAT_STR);
    onSelectedDayChange(moment(prev));
    e.stopPropagation();
  };
  // 下个月
  const nextMonth = e => {
    const next = selectedDay.clone().add(1, 'M').date(1).format(MINICALENDAR_FORMAT_STR);
    onSelectedDayChange(moment(next));
    e.stopPropagation();
  };
  // 小日历头部渲染
  const headerRender = () => (
    <div className={`${styles.miniHeader} miniCalendar-miniHeader`}>
      <span className={styles.miniMonth}>{selectedDay.format(getIn18Text('YYYYNIANMMYUE'))}</span>
      <i
        className={classnames(styles.arrow, 'arrow', styles.left, 'left')}
        onClick={e => {
          prevMonth(e);
        }}
      />
      <i
        className={classnames(styles.arrow, 'arrow', styles.right, 'right')}
        onClick={e => {
          nextMonth(e);
        }}
      />
    </div>
  );
  // 日期变化
  const onChange = date => {
    onSelectedDayChange(date);
  };
  return (
    <Collapse
      className={stylesOuter.collapse}
      ghost
      expandIconPosition="right"
      defaultActiveKey={['0']}
      expandIcon={panelProps => (
        <span className={`dark-invert ${stylesOuter.expandArrow}`}>
          <i
            className={classnames([stylesOuter.expandIcon], {
              [stylesOuter.expandIconCollapse]: !panelProps.isActive,
            })}
          />
        </span>
      )}
    >
      <Panel header={headerRender()} key="0">
        <div className={styles.miniCalendar}>
          <ConfigProvider locale={language === 'zh' ? chLocale : enLocale}>
            <div className={styles.weekNumberWrap} hidden={!weekNumbersVisible}>
              {weekNumbers.map(weekNumber => {
                return <p>{weekNumber}</p>;
              })}
            </div>
            <Calendar
              onPanelChange={(...args) => {
                console.log('onPanelChange', args);
              }}
              fullscreen={false}
              headerRender={() => null}
              value={selectedDay}
              dateFullCellRender={dateFullCellRender}
              onChange={onChange}
            />
          </ConfigProvider>
        </div>
      </Panel>
    </Collapse>
  );
};
export default MiniCalendar;
