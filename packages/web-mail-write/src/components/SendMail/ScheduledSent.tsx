/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useMemo } from 'react';
import moment, { Moment } from 'moment';
import { apiHolder as api, SystemApi, getIn18Text, TimeZoneItem } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { ScheduleDatePicker, ScheduleTimeStepPicker } from '@web-schedule/components/FormComponents';
import TimeZoneSelect from './TimeZoneSelect';
import style from './index.module.scss';

const systemApi = api.api.getSystemApi() as SystemApi;

interface Props {}

const ScheduledSent: React.FC<Props> = (props: Props) => {
  const [timeZoneList, setTimeZoneList] = useState<TimeZoneItem[]>([]);
  // 系统时区
  const [sysTimeZone, setSysTimeZone] = useState<TimeZoneItem>();
  const dispatch = useAppDispatch();
  // 定时发信时间
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate) || undefined;
  // 定时发信时间时区
  const scheduleDateTimeZone = useAppSelector(state => state.mailReducer.currentMail.scheduleDateTimeZone);

  // 系统时间
  const sysTime = useMemo(() => {
    if (!scheduleDate || typeof scheduleDateTimeZone !== 'number' || !sysTimeZone) return '';

    const systemMoment = systemApi.timeZoneTrans(scheduleDate, scheduleDateTimeZone, sysTimeZone?.key || 8);
    if (!systemMoment) return '';
    return systemMoment.format('YYYY-MM-DD HH:mm');
  }, [scheduleDate, scheduleDateTimeZone, sysTimeZone]);

  // 设置定时发送的时区
  const onScheduleTimeZoneChange = (timeZone: number) => {
    dispatch(mailActions.doChangeMailScheduleTimeZone(timeZone));
  };

  // 设置定时发送的日期
  const onScheduleDateChange = (date: Moment) => {
    dispatch(mailActions.doChangeMailSchedule(`${date.format('YYYY-MM-DD')} ${moment(scheduleDate).format('HH:mm:ss')}`));
  };

  // 设置定时发送的时间
  const onScheduleTimeChange = (time: Moment) => {
    dispatch(mailActions.doChangeMailSchedule(`${moment(scheduleDate).format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}`));
  };

  useEffect(() => {
    const timeZoneList = systemApi.getTimeZoneList();
    setTimeZoneList(timeZoneList.filter(item => item.key !== 999) || []);
  }, []);

  useEffect(() => {
    const curTimeZone = systemApi.getSystemTimeZone();
    setSysTimeZone(curTimeZone);
  }, []);

  return (
    <div className={style.scheduleTime}>
      <span className={style.sendTime}>{getIn18Text('FASONGSHIJIAN\uFF1A')}</span>
      {/* 时区 */}
      <TimeZoneSelect timeZoneList={timeZoneList} onChange={onScheduleTimeZoneChange} timeZone={scheduleDateTimeZone} />
      {/* 日 */}
      <ScheduleDatePicker
        allowClear={false}
        onChange={onScheduleDateChange}
        value={moment(scheduleDate)}
        className={style.timeInput}
        style={{
          marginRight: '8px',
          width: '130px',
          // background: '#FFFFFF',
          borderRadius: '4px',
        }}
      />
      {/* 时分 */}
      <ScheduleTimeStepPicker
        onChange={onScheduleTimeChange}
        value={moment(scheduleDate)}
        timeIntervals={15}
        className={style.timeInput}
        style={{
          marginRight: '16px',
          width: '62px',
          // background: '#FFFFFF',
          borderRadius: '4px',
        }}
      />
      <span className={style.willSend}>
        {getIn18Text('YOUJIANJIANGYU')}
        {sysTimeZone ? sysTimeZone.value : ''} {sysTime}
        {getIn18Text('FACHU')}
      </span>
    </div>
  );
};

export default ScheduledSent;
