import classnames from 'classnames';
import { Calendar } from 'antd';
import moment, { Moment } from 'moment';
import React from 'react';
import styles from './left.module.scss';
import { isToday } from '../../miniCalendar';
import scheduleTracker from '../../tracker';
import { getIn18Text } from 'api';
// 日期格式
const FORMAT_STR = 'YYYY-MM-DD';
// 修改英文配置
moment.locale('en', {
  weekdaysMin: getIn18Text('RI_YI_ER').split('_'),
});
// 修正为中文
moment.locale('zh-cn');
interface LeftProps {
  loading: boolean;
  setLoading(loading: boolean): void;
  selectedDay: Moment;
  setSelectedDay(selectedDay: Moment): void;
  addSchedule(temp: boolean, hour: number): void;
}
const Left: React.FC<LeftProps> = ({ loading, setLoading, selectedDay, setSelectedDay, addSchedule }) => {
  // 日期是否选中
  const isSelectedDay = time => selectedDay.isSame(time);
  // 是否选中月
  const isMonth = time => selectedDay.month() === time.month();
  // 自定义小日历
  const dateFullCellRender = value => {
    const date = value.date();
    return (
      <div
        className={classnames(styles.miniDay, {
          [styles.today]: isToday(value) && !isSelectedDay(value),
          [styles.todaySelected]: isToday(value) && isSelectedDay(value),
          [styles.notTodaySelected]: !isToday(value) && isSelectedDay(value),
          [styles.notMonth]: !isMonth(value),
        })}
      >
        {date}
      </div>
    );
  };
  // 上个月
  const prevMonth = e => {
    const prev = selectedDay.clone().subtract(1, 'M').date(1).format(FORMAT_STR);
    setSelectedDay(moment(prev));
    e.stopPropagation();
  };
  // 下个月
  const nextMonth = e => {
    const next = selectedDay.clone().add(1, 'M').date(1).format(FORMAT_STR);
    setSelectedDay(moment(next));
    e.stopPropagation();
  };
  // 小日历头部渲染
  const headerRender = () => (
    <div className={styles.miniHeader}>
      <span className={styles.miniMonth}>{selectedDay.format(getIn18Text('YYYYNIANMMYUE'))}</span>
      <i
        className={classnames(styles.arrow, styles.left)}
        onClick={e => {
          prevMonth(e);
        }}
      />
      <i
        className={classnames(styles.arrow, styles.right)}
        onClick={e => {
          nextMonth(e);
        }}
      />
    </div>
  );
  // 点击新建日程
  const onAdd = () => {
    const hour = moment().hour();
    addSchedule(true, hour);
    scheduleTracker.scheduleContact({
      action: 'create',
      type: 'create_button',
    });
  };
  // 日期变化
  const onChange = date => {
    setSelectedDay(date);
  };
  return (
    <>
      <div className={styles.outer}>
        <div className={styles.header}>
          <button
            type="button"
            onClick={() => {
              onAdd();
            }}
            className={classnames('sirius-no-drag', styles.button)}
          >
            <i className={styles.addIcon} />
            <span className={styles.text}>{getIn18Text('XINJIANRICHENG')}</span>
          </button>
          <i
            onClick={() => setLoading(true)}
            className={classnames('sirius-no-drag', styles.syncIcon, {
              'sirius-spin': loading,
            })}
          />
        </div>
        {headerRender()}
        <div className={styles.miniCalendar}>
          <Calendar fullscreen={false} headerRender={() => null} value={selectedDay} dateFullCellRender={dateFullCellRender} onChange={onChange} />
        </div>
      </div>
    </>
  );
};
export default Left;
