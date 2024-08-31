import React from 'react';
import classnames from 'classnames';
import moment from 'moment';
import styles from '../mailInfo.module.scss';
import { ConferenceType } from '@web-common/state/state';
import { EnmuRecurrenceRule, loopRules, reminderOpts } from '@web-schedule/components/CreateBox/util';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import { getReminderText } from '@web-schedule/util';
const conferenceDate = (conferenceState: ConferenceType) => {
  const {
    moments: { startDate, startTime, endDate, endTime },
    time: { allDay },
  } = conferenceState;
  const endYYYY = moment(endDate).format(getIn18Text('YYYYNIAN@'));
  const endMMMdo = moment(endDate).format(getIn18Text('MMYUEDD'));
  const enddddd = moment(endDate).format('ddd');
  const endClock = moment(endTime).format('LT');
  const startYYYY = moment(startDate).format(getIn18Text('YYYYNIAN@'));
  const startMMMDo = moment(startDate).format(getIn18Text('MMYUEDD'));
  const startdddd = moment(startDate).format('ddd');
  const startClock = moment(startTime).format('LT');
  const crossYYYY = endYYYY !== moment(new Date()).format(getIn18Text('YYYYNIAN@')); // 跨年
  const crossMMMDo = endMMMdo !== startMMMDo; // 跨天
  let res = '';
  switch (true) {
    case !crossYYYY && !crossMMMDo && allDay: // 全天 不跨年-不跨天
      res = `${endMMMdo} (${enddddd})`;
      break;
    case !crossYYYY && crossMMMDo && allDay: // 全天 不跨年-跨天
      res = `${startMMMDo} (${startdddd}) - ${endMMMdo} (${enddddd})`;
      break;
    case crossYYYY && !crossMMMDo && allDay: // 全天 跨年-不跨天
      res = `${endYYYY}${endMMMdo} (${enddddd})`;
      break;
    case crossYYYY && crossMMMDo && allDay: // 全天 跨年-跨天
      res = `${startYYYY}${startMMMDo} (${startdddd}) - ${endYYYY}${endMMMdo} (${enddddd})`;
      break;
    case !crossYYYY && !crossMMMDo && !allDay: // 非全天 不跨年-不跨天
      res = `${endMMMdo} (${enddddd}) ${startClock}-${endClock}`;
      break;
    case !crossYYYY && crossMMMDo && !allDay: // 非全天 不跨年-跨天
      res = `${startMMMDo} (${startdddd}) ${startClock} - ${endMMMdo} (${enddddd}) ${endClock}`;
      break;
    case crossYYYY && !crossMMMDo && !allDay: // 非全天 跨年-不跨天
      res = `${endYYYY}${endMMMdo} (${enddddd}) ${startClock}-${endClock}`;
      break;
    case crossYYYY && crossMMMDo && !allDay: // 非全天 跨年-跨天
      res = `${startYYYY}${startMMMDo} (${startdddd}) ${startClock} - ${endYYYY}${endMMMdo} (${enddddd}) ${endClock}`;
      break;
    default:
      break;
  }
  return res;
};
const ConferenceDesc: React.FC = () => {
  const conferenceState = useAppSelector(state => state.mailReducer.currentMail.conference);
  if (!conferenceState) return null;
  const {
    enmuRecurrenceRule: fixedEnmuRecurrenceRule,
    enmuReminders,
    reminders,
    time: { allDay },
    location,
  } = conferenceState;
  const date = conferenceDate(conferenceState);
  const [enmuRecurrenceRule] = fixedEnmuRecurrenceRule?.split('/') || [];
  const recurrenceDesc = loopRules.find(i => i.value === enmuRecurrenceRule)?.label;
  const recurrenceRule = EnmuRecurrenceRule.NONE === enmuRecurrenceRule ? '' : `, ${recurrenceDesc}`;
  const reminderDesc = reminders ? getReminderText(reminders, allDay) : ''; // reminderOpts(allDay).find(i => i.value === enmuReminders)?.label;
  const reminderRule = enmuRecurrenceRule === null ? '' : ` ${reminderDesc}`;
  return (
    <>
      <span className={classnames(styles.descItem)}>
        <img className={classnames(styles.conferenceDescIcon)} src={require('@/images/icons/calendarDetail/clock.png')} />
        {date}
        {recurrenceRule}
      </span>
      {!!location && (
        <span className={classnames(styles.descItem)}>
          <img className={classnames(styles.conferenceDescIcon)} src={require('@/images/icons/calendarDetail/location.png')} />
          {location}
        </span>
      )}
      {!!reminderRule && (
        <span className={classnames(styles.descItem)}>
          <img className={classnames(styles.conferenceDescIcon)} src={require('@/images/icons/calendarDetail/bell.png')} />
          {reminderRule}
        </span>
      )}
    </>
  );
};
export default ConferenceDesc;
