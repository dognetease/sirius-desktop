import moment, { Moment } from 'moment';
import momentTz from 'moment-timezone';
import { randomString as _randomString } from './randomString';
import { getIn18Text } from 'api';

export const randomString = _randomString;
/**
 * 获取日程开始结束文本
 * @param startDate 开始时间
 * @param endDate  结束时间
 * @param allDay 是否全天日程
 * @param weekDaySuffix 是否显示星期 默认是
 * @param weekDayFloat 是否根据当前时间显示星期（今天、明天、后天）默认否
 * @returns
 */
export const getDurationText = (
  startDate: Date,
  endDate: Date,
  allDay?: boolean,
  weekDaySuffix: boolean = true,
  weekDayFloat: boolean = false,
  totalSeconds?: number = 0
) => {
  let startStr: string = '';
  let endStr: string = '';
  let affixStr: string = '';
  // 暂时留着，别删
  // const timeZone = mailConfApi.getTimezone();
  let startDateFormatStr = getIn18Text('MMYUEDD');
  let endDateFormatStr = getIn18Text('MMYUEDD');
  const timeDiff = totalSeconds ? totalSeconds / 60 / 60 + new Date().getTimezoneOffset() / 60 || 0 : 0;
  const tzStartDate = moment(startDate).add(timeDiff, 'hour');
  const tzEndDate = moment(endDate).add(timeDiff, 'hour');
  const tzNow = moment(endDate).add(timeDiff, 'hour');
  // 特定时区，如果有转换为特定时区时间
  if (weekDaySuffix) {
    if (!weekDayFloat) {
      startDateFormatStr += '(ddd)';
      endDateFormatStr += '(ddd)';
    } else {
      // 暂时留着，别删
      //  const start = moment(timeZone ? momentTz(startDate).tz(timeZone) : startDate).startOf('day');
      //  const end = moment(timeZone ? momentTz(endDate).tz(timeZone) : endDate).startOf('day');
      //  const today = moment(timeZone ? momentTz().tz(timeZone) : Date.now()).startOf('day');
      const start = moment(tzStartDate).startOf('day');
      const end = moment(tzEndDate).startOf('day');
      const today = moment(tzNow).startOf('day');
      const tomorrow = today.clone().add(1, 'day');
      const dayAfterTomorrow = tomorrow.clone().add(1, 'day');
      // 开始时间格式
      if (start.isSame(today)) {
        startDateFormatStr += getIn18Text('(JINTIAN)');
      } else if (start.isSame(tomorrow)) {
        startDateFormatStr += getIn18Text('(MINGTIAN)');
      } else if (start.isSame(dayAfterTomorrow)) {
        startDateFormatStr += getIn18Text('(HOUTIAN)');
      } else {
        startDateFormatStr += '(ddd)';
      }
      // 结束时间格式
      if (end.isSame(today)) {
        endDateFormatStr += getIn18Text('(JINTIAN)');
      } else if (end.isSame(tomorrow)) {
        endDateFormatStr += getIn18Text('(MINGTIAN)');
      } else if (end.isSame(dayAfterTomorrow)) {
        endDateFormatStr += getIn18Text('(HOUTIAN)');
      } else {
        endDateFormatStr += '(ddd)';
      }
    }
  }
  const startMoment = moment(tzStartDate);
  const endMoment = moment(tzEndDate);
  if (allDay && endMoment.diff(startMoment, 'days') > 0) {
    endMoment.add(-1, 'days');
  }
  // 跨天
  const crossDay = !endMoment.isSame(startMoment, 'day');
  // 跨年 不是今年就是跨年
  const crossYear = startMoment.year() !== moment(tzNow).year() || endMoment.year() !== moment(tzNow).year();
  startStr = crossYear ? `${startMoment.year()}年` : '';
  endStr = crossYear && crossDay ? `${endMoment.year()}年` : '';
  startStr += startMoment.format(startDateFormatStr + ' ');
  endStr += crossDay ? endMoment.format(endDateFormatStr + ' ') : '';
  affixStr = getDurationTag(startMoment, endMoment, allDay);
  if (!allDay) {
    startStr += startMoment.format('HH:mm');
    endStr += endMoment.format('HH:mm');
  }
  startStr = endStr ? `${startStr} ~ ` : startStr;
  // endStr = endStr ? ` ~ ${endStr}` : endStr;

  return {
    startStr,
    endStr,
    affixStr,
    crossDay,
    crossYear,
  };
};
/**
 * 获取持续时长
 * @param startMoment 开始时间
 * @param endMoment 结束时间
 * @returns string
 */
export const getDurationTag = (startMoment: Moment, _endMoment: Moment, allDay: boolean = false) => {
  const endMoment = _endMoment.clone().add(allDay ? 1 : 0, 'days');
  let diffDays = endMoment.diff(startMoment, 'days');
  const diffHours = endMoment.diff(startMoment, 'hours') - diffDays * 24;
  const diffMinutes = endMoment.diff(startMoment, 'minutes') - (diffDays * 24 + diffHours) * 60;
  if (diffDays > 999) {
    return getIn18Text('999+TIAN');
  }
  // 兼容全天日程
  if (diffDays === 0 && allDay) {
    diffDays = 1;
  }
  return `${diffDays ? `${diffDays}天` : ''}${diffHours ? `${diffHours}小时` : ''}${diffMinutes ? `${diffMinutes}分钟` : ''}`;
};

const rrule = (val, start) => {
  const wk = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dd = moment(start).format('d');
  const d = moment(start).format('D');
  let monthly = d;
  if (+d > 20) {
    monthly = d + ',-1;BYSETPOS=1';
  }
  const map = [
    '',
    'FREQ=DAILY;WKST=MO',
    'FREQ=WEEKLY;WKST=MO;BYDAY=MO,TU,WE,TH,FR',
    'FREQ=WEEKLY;WKST=MO;BYDAY=' + wk[dd],
    'FREQ=MONTHLY;WKST=MO;BYMONTHDAY=' + monthly,
    'FREQ=YEARLY;WKST=MO',
  ];
  return map[val];
};

const attendee = receiver => {
  if (!Array.isArray(receiver)) return '';
  const reveiverMap = receiver.map(
    i => `ATTENDEE;CN="${i.contact.contact.contactName}";CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${i.contact.contact.accountName}`
  );
  const r = navigator.appVersion.indexOf('Win') !== -1 ? '\r\n' : '\n';
  return reveiverMap.join(r);
};

const ics = ({ start, end, name = 'calendar', suffix = '.ics', uid, rruleVal, organizer, receiver, desc = '', location, summary = '' }) => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const DTSTART = `TZID=${timeZone}:${moment(start).format('YYYYMMDDTHHmmss')}`;
  const DTEND = `TZID=${timeZone}:${moment(end).format('YYYYMMDDTHHmmss')}`;
  const CREATED = moment(new Date()).format('YYYYMMDDTHHmmss') + 'Z';
  let RRULE: any[] = [];
  const rCal = rrule(rruleVal, start);
  if (rCal) {
    RRULE = ['RRULE:' + rCal];
  }
  const ORGANIZER = `CN="${organizer.contactName}":mailto:${organizer.accountName}`;
  const ATTENDEE = attendee(receiver);
  // const DTSTAMP = `${moment(start).format('YYYYMMDD')}T${Math.random().toString().slice(-6)}Z`;
  // ics不传这个字段，低版本outllok兼容性会有问题
  const DTSTAMP = CREATED;

  const data = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Netease Corporation//Netease QiyeMail 2.0//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    'DTSTART;' + DTSTART,
    'DTEND;' + DTEND,
    'DTSTAMP:' + DTSTAMP,
    ...RRULE,
    'ORGANIZER;' + ORGANIZER,
    ATTENDEE,
    'UID:' + uid,
    'CREATED:' + CREATED,
    'DESCRIPTION:' + desc,
    'LAST-MODIFIED:' + CREATED,
    'LOCATION:' + location,
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'SUMMARY:' + summary,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const r = navigator.appVersion.indexOf('Win') !== -1 ? '\r\n' : '\n';
  const dataString = data.join(r);
  const daraBlob = new Blob([dataString]);
  return new File([daraBlob], name + suffix);
};

export default ics;
