import {
  MeetingRoomListModel,
  RecurrenceRuleParam,
  ReminderParam,
  apiHolder,
  apis,
  ContactApi,
  ScheduleModel,
  MeetingRoomListAvailableCondition,
  EntitySchedule,
  day as WeekDayType,
  ScheduleApi,
  CatalogApi,
  MeetingRoomApi,
  FreeBusyApi,
  ReminderAction,
} from 'api';
import moment, { Moment } from 'moment';
import { Key } from 'react';
import lodashInRange from 'lodash/inRange';
import omit from 'lodash/omit';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isEqual from 'lodash/isEqual';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { rangeInteract } from '../TimeLinePicker/util';
import { MatchedRoomInfoType } from './MeetingRoomForm';
import { ScheduleInsertForm } from './ScheduleForm';
import { getDateTimeByForm, isCrossDay } from '../../util';
import { ContactItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi;
const catalogApi = apiHolder.api.requireLogicalApi(apis.catalogApiImpl) as unknown as ScheduleApi & CatalogApi & MeetingRoomApi & FreeBusyApi;
const storeApi = apiHolder.api.getDataStoreApi();
export interface OptionData {
  value: Key;
  label?: string;
  tipTitle?: string;
}
export enum EnmuRecurrenceRule {
  NONE = 'NONE',
  DAYLY = 'DAYLY',
  WEEKDAY = 'WEEKDAY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM', // 自定义规则
  TEMP_INSERT = 'TEMP_INSERT',
}
export const loopRules: Array<OptionData> = [
  {
    value: EnmuRecurrenceRule.NONE,
    label: getIn18Text('BUZHONGFU'),
  },
  {
    value: EnmuRecurrenceRule.DAYLY,
    label: getIn18Text('MEITIANZHONGFU'),
  },
  {
    value: EnmuRecurrenceRule.WEEKDAY,
    label: getIn18Text('MEIGEGONGZUORI'),
  },
  {
    value: EnmuRecurrenceRule.WEEKLY,
    label: getIn18Text('MEIZHOUZHONGFU'),
  },
  {
    value: EnmuRecurrenceRule.MONTHLY,
    label: getIn18Text('MEIYUEZHONGFU'),
  },
  {
    value: EnmuRecurrenceRule.YEARLY,
    label: getIn18Text('MEINIANZHONGFU'),
  },
  {
    value: EnmuRecurrenceRule.CUSTOM,
    label: getIn18Text('customRepeat'),
  },
];
export const parseRecurrenceRuleToFormRule = (rrule: EntitySchedule['recur']) => {
  switch (rrule?.freq || rrule?.userFreq) {
    case 'DAILY':
      // 如果不是每天，就属于自定义
      if (rrule?.interval === 1) {
        return EnmuRecurrenceRule.DAYLY;
      }
      return EnmuRecurrenceRule.TEMP_INSERT;
    case 'MONTHLY':
      // 不是每月就属于自定义,第几个周几也属于自定义
      if (rrule?.interval === 1 && rrule.byMonth?.length === 0) {
        return EnmuRecurrenceRule.MONTHLY;
      }
      return EnmuRecurrenceRule.TEMP_INSERT;
    case 'WEEKLY':
      // 每周
      if (rrule?.interval === 1) {
        // 每个工作日
        if (Array.isArray(rrule?.byDay[0]) && isEqual(rrule?.byDay[0].slice().sort(), [1, 2, 3, 4, 5])) {
          return EnmuRecurrenceRule.WEEKDAY;
        } else if (Array.isArray(rrule?.byDay[0]) && rrule?.byDay[0]?.length !== 1) {
          // 自定义
          return EnmuRecurrenceRule.TEMP_INSERT;
        }
        // 每个周几
        return EnmuRecurrenceRule.WEEKLY;
      }
      // 自定义
      return EnmuRecurrenceRule.TEMP_INSERT;
    case 'YEARLY':
      if (rrule?.interval === 1) {
        return EnmuRecurrenceRule.YEARLY;
      }
      return EnmuRecurrenceRule.TEMP_INSERT;
    default:
      return EnmuRecurrenceRule.NONE;
  }
};
// 根据循环字段生成循环规则，自定义规则下，此方法需要改动，入参从EnmuRecurrenceRule改为ScheduleInsertForm，因为form中存储了循环信息
export const getInsertRecurrenceRule = (form: ScheduleInsertForm, autoPrev?: boolean) => {
  const { enmuRecurrenceRule: t, interval, byDay, byMonthDay, bySetPos } = form;
  const recurrenceRule: Partial<RecurrenceRuleParam> = {
    // freq: 'DAILY',
    // userFreq: 'DAILY',
    interval: interval || 1,
    // until: {
    //     y: 0, d: 0, m: 0, hr: 0, min: 0, sec: 0
    // },
    byDay: {},
    byMonthDay: [],
    byMonth: [],
    bySetPos: [],
  };
  const [actEnmuRecurrenceRule] = (t as string)?.split('/');
  switch (actEnmuRecurrenceRule) {
    case EnmuRecurrenceRule.DAYLY:
      recurrenceRule.freq = 'DAILY';
      recurrenceRule.userFreq = recurrenceRule.freq;
      break;
    case EnmuRecurrenceRule.WEEKDAY:
      recurrenceRule.freq = 'WEEKLY';
      recurrenceRule.userFreq = recurrenceRule.freq;
      recurrenceRule.byDay = {
        0: [1, 2, 3, 4, 5],
      };
      break;
    case EnmuRecurrenceRule.WEEKLY:
      recurrenceRule.freq = 'WEEKLY';
      recurrenceRule.userFreq = recurrenceRule.freq;
      // recurrenceRule.byDay = {
      //   0: [startTime.isoWeekday() as WeekDayType]
      // };
      recurrenceRule.byDay = byDay || {};
      break;
    case EnmuRecurrenceRule.MONTHLY:
      recurrenceRule.freq = 'MONTHLY';
      recurrenceRule.userFreq = recurrenceRule.freq;
      recurrenceRule.byMonthDay = byMonthDay || [];
      recurrenceRule.byDay = byDay || {};
      recurrenceRule.bySetPos = bySetPos || [];
      if (autoPrev) {
        recurrenceRule.byMonthDay.push(-1);
        recurrenceRule.bySetPos = [1];
      }
      break;
    case EnmuRecurrenceRule.YEARLY:
      recurrenceRule.freq = 'YEARLY';
      recurrenceRule.userFreq = recurrenceRule.freq;
      break;
    default:
      return null;
  }
  return recurrenceRule;
};
export enum EnmuReminders {
  // 相对时间提前
  RT_MIN_5,
  RT_MIN_10,
  RT_MIN_30,
  RT_HOUR_1,
  RT_HOUR_2,
  RT_DAY_1,
  // 绝对时间
  AT_CUR_8,
  AT_CUR_9,
  AT_PRE_1_9,
  AT_PRE_2_9,
}
export enum ReminderTimeUnit {
  // 相对时间提前
  MINUTE = 1,
  HOUR = 2,
  DAY = 3,
  WEEK = 4,
}
/**
 * time reminders 映射
 * {timeUnit}_{interval}_{time?.hr}
 */
export const TIME_REMINDER_MAP: any = {
  '1_5': EnmuReminders.RT_MIN_5,
  '1_10': EnmuReminders.RT_MIN_10,
  '1_30': EnmuReminders.RT_MIN_30,
  '2_1': EnmuReminders.RT_HOUR_1,
  '2_2': EnmuReminders.RT_HOUR_2,
  '3_1': EnmuReminders.RT_DAY_1,
  '3_1_9': EnmuReminders.AT_PRE_1_9,
  '3_2_9': EnmuReminders.AT_PRE_2_9,
  '3_0_8': EnmuReminders.AT_CUR_8,
  '3_0_9': EnmuReminders.AT_CUR_9,
};
export const DEFAULT_REMINDER = { action: 2, reminderAction: 1, interval: 5, timeUnit: 1, beforeOpt: 'before' };
export const DEFAULT_REMINDER_ALL_DAY = { action: 2, reminderAction: 1, interval: 1, timeUnit: 3, time: { hour: 8, min: 0, sec: 0 }, beforeOpt: 'before' };
export const REMINDER_ACTION_TEXT_MAP: any = {
  [ReminderAction.EMAIL_APP]: getIn18Text('YOUJIANJIYINGYONGNTX'),
  [ReminderAction.EMAIL]: getIn18Text('YOUJIANTIXING'),
  [ReminderAction.APP]: getIn18Text('YINGYONGNEITANKUANGTX'),
};
export const reminderActionOpts: () => Array<OptionData> = () => {
  return [
    {
      value: ReminderAction.EMAIL_APP,
      label: getIn18Text('YOUJIANJIYINGYONGNTX'),
    },
    {
      value: ReminderAction.EMAIL,
      label: getIn18Text('YOUJIANTIXING'),
    },
    {
      value: ReminderAction.APP,
      label: getIn18Text('YINGYONGNEITANKUANGTX'),
    },
  ];
};
export const SCHEDULE_REMINDER_ACTION = 'ScheduleReminderAction';
export const getReminderByDefaultReminderAction = (isAllDay = false) => {
  const reminders = Object.assign({}, isAllDay ? DEFAULT_REMINDER_ALL_DAY : DEFAULT_REMINDER);
  const storeRes = storeApi.getSync(SCHEDULE_REMINDER_ACTION);
  reminders.reminderAction = Number(storeRes.suc ? storeRes.data : reminders.reminderAction);
  return reminders;
};
export const backfillReminder = (reminder?: ReminderParam, allDay?: boolean) => {
  let res = EnmuReminders.RT_MIN_5;
  if (reminder) {
    const { timeUnit, interval, time = { hr: 0 } } = reminder;
    let key = `${timeUnit}_${interval}_${time?.hr}`;
    if (!allDay) {
      key = `${timeUnit}_${interval}`;
    }
    if (TIME_REMINDER_MAP[key]) {
      res = TIME_REMINDER_MAP[key];
    }
  }
  return res;
};
export const reminderTimeUnitOpts: (allday?: boolean) => Array<OptionData> = allDay => {
  if (!allDay) {
    return [
      {
        value: ReminderTimeUnit.MINUTE,
        label: getIn18Text('FENZHONG'),
      },
      {
        value: ReminderTimeUnit.HOUR,
        label: getIn18Text('XIAOSHI'),
      },
      {
        value: ReminderTimeUnit.DAY,
        label: getIn18Text('TIAN'),
      },
    ];
  } else {
    return [
      {
        value: ReminderTimeUnit.DAY,
        label: getIn18Text('TIAN'),
      },
      {
        value: ReminderTimeUnit.WEEK,
        label: getIn18Text('ZHOU'),
      },
    ];
  }
};
export const reminderOpts: (allDay?: boolean) => Array<OptionData> = allDay => {
  if (!allDay) {
    return [
      {
        value: EnmuReminders.RT_MIN_5,
        label: getIn18Text('TIQIAN5FENZHONG'),
      },
      {
        value: EnmuReminders.RT_MIN_10,
        label: getIn18Text('TIQIAN10FEN'),
      },
      {
        value: EnmuReminders.RT_MIN_30,
        label: getIn18Text('TIQIAN30FEN'),
      },
      {
        value: EnmuReminders.RT_HOUR_1,
        label: getIn18Text('TIQIAN1XIAOSHI'),
      },
      {
        value: EnmuReminders.RT_HOUR_2,
        label: getIn18Text('TIQIAN2XIAOSHI'),
      },
      {
        value: EnmuReminders.RT_DAY_1,
        label: getIn18Text('TIQIAN1TIAN'),
      },
    ];
  }
  return [
    {
      value: EnmuReminders.AT_CUR_8,
      label: getIn18Text('DANGTIAN08:'),
    },
    {
      value: EnmuReminders.AT_CUR_9,
      label: getIn18Text('DANGTIAN09:'),
    },
    {
      value: EnmuReminders.AT_PRE_1_9,
      label: getIn18Text('TIQIAN1TIAN0'),
    },
    {
      value: EnmuReminders.AT_PRE_2_9,
      label: getIn18Text('TIQIAN2TIAN0'),
    },
  ];
};
export const getDefaultReminderOpts: (allDay?: boolean) => Array<OptionData> = allDay => {
  if (!allDay) {
    return [
      {
        value: EnmuReminders.RT_MIN_5,
        label: getIn18Text('TIQIAN5FENZHONG'),
      },
      {
        value: EnmuReminders.RT_MIN_10,
        label: getIn18Text('TIQIAN10FEN'),
      },
      {
        value: EnmuReminders.RT_MIN_30,
        label: getIn18Text('TIQIAN30FEN'),
      },
      {
        value: EnmuReminders.RT_HOUR_1,
        label: getIn18Text('TIQIAN1XIAOSHI'),
      },
      {
        value: EnmuReminders.RT_HOUR_2,
        label: getIn18Text('TIQIAN2XIAOSHI'),
      },
      {
        value: EnmuReminders.RT_DAY_1,
        label: getIn18Text('TIQIAN1TIAN'),
      },
    ];
  }
  return [
    {
      value: EnmuReminders.AT_CUR_8,
      label: getIn18Text('DANGTIAN08:'),
    },
    {
      value: EnmuReminders.AT_CUR_9,
      label: getIn18Text('DANGTIAN09:'),
    },
    {
      value: EnmuReminders.AT_PRE_1_9,
      label: getIn18Text('TIQIAN1TIAN0'),
    },
    {
      value: EnmuReminders.AT_PRE_2_9,
      label: getIn18Text('TIQIAN2TIAN0'),
    },
  ];
};
export const getInsertReminders = (t: EnmuReminders) => {
  const reminder: ReminderParam = {
    action: 2,
    interval: 1,
    timeUnit: 1,
  };
  switch (t) {
    case EnmuReminders.RT_MIN_5:
      reminder.interval = 5;
      reminder.timeUnit = 1;
      break;
    case EnmuReminders.RT_MIN_10:
      reminder.interval = 10;
      reminder.timeUnit = 1;
      break;
    case EnmuReminders.RT_MIN_30:
      reminder.interval = 30;
      reminder.timeUnit = 1;
      break;
    case EnmuReminders.RT_HOUR_1:
      reminder.interval = 1;
      reminder.timeUnit = 2;
      break;
    case EnmuReminders.RT_HOUR_2:
      reminder.interval = 2;
      reminder.timeUnit = 2;
      break;
    case EnmuReminders.RT_DAY_1:
      reminder.interval = 1;
      reminder.timeUnit = 3;
      break;
    case EnmuReminders.AT_PRE_1_9:
      reminder.interval = 1;
      reminder.timeUnit = 3;
      reminder.time = {
        hr: 9,
        min: 0,
        sec: 0,
      };
      break;
    case EnmuReminders.AT_PRE_2_9:
      reminder.interval = 2;
      reminder.timeUnit = 3;
      reminder.time = {
        hr: 9,
        min: 0,
        sec: 0,
      };
      break;
    case EnmuReminders.AT_CUR_8:
      reminder.interval = 0;
      reminder.timeUnit = 3;
      reminder.time = {
        hr: 8,
        min: 0,
        sec: 0,
      };
      break;
    case EnmuReminders.AT_CUR_9:
      reminder.interval = 0;
      reminder.timeUnit = 3;
      reminder.time = {
        hr: 9,
        min: 0,
        sec: 0,
      };
      break;
    default:
      return null;
  }
  return reminder;
};
export const clazzMap: Array<OptionData> = [
  {
    value: 0,
    label: getIn18Text('TONGGUISHURILI'),
    tipTitle: '遵循此日历的公开范围设置。订阅该日历的用户，如果有权查看该日历的日程详情，那么就能看到此日程的详情',
  },
  {
    value: 1,
    label: getIn18Text('GONGKAI'),
    tipTitle: '订阅该日历的用户，都能查看此日程详情',
  },
  {
    value: 2,
    label: getIn18Text('BUGONGKAI'),
    tipTitle: '订阅该日历的用户，无法查看此日程的详情，除非他们是该日历的共享编辑者',
  },
];
export const busyStatus: Array<OptionData> = [
  {
    value: 0,
    label: getIn18Text('MANGLU'),
    tipTitle: '该日程占据时间段对外会展示为忙碌',
  },
  {
    value: 1,
    label: getIn18Text('KONGXIAN'),
    tipTitle: '该日程占据时间段对外会展示为有空',
  },
];
export const valiteMoment = (
  moments: {
    startDate: Moment | null;
    endDate: Moment | null;
    startTime?: Moment | null;
    endTime?: Moment | null;
  },
  desc = getIn18Text('JIESHUSHIJIANBU')
) => {
  const { startDate, endDate, startTime, endTime } = moments;
  if (startDate === null || endDate === null) {
    siriusMessage.error({ content: getIn18Text('QINGXUANZESHIJIAN') });
    return false;
  }
  const start = startDate
    .clone()
    .hours(startTime ? startTime.hours() : 0)
    .minutes(startTime ? startTime.minutes() : 0)
    .seconds(startTime ? startTime.seconds() : 0);
  const end = endDate
    .clone()
    .hours(endTime ? endTime.hours() : 0)
    .minutes(endTime ? endTime.minutes() : 0)
    .seconds(endTime ? endTime.seconds() : 0);
  if (end.diff(start) < 0) {
    siriusMessage.error({ content: desc });
    return false;
  }
  return true;
};
export const generateTimeRange = (timeline: Array<0 | 1 | 2>, startAxis: number, interval: number, date?: Moment) =>
  timeline.map((status, index) => {
    const start = moment(date)
      .startOf('days')
      .hours(startAxis)
      .minutes(index * interval * 60);
    const end = start.clone().add(interval, 'hours');
    return {
      range: [start, end],
      occupied: status === 1,
      valited: status === 0,
      expired: status === 2,
    };
  });
export const getSeqNo = (time: Moment, interval: number) => {
  const hours = time.hours();
  const minutes = time.minutes();
  const index = Math.floor((hours + minutes / 60) / interval);
  return index;
};
export const getMatchedRoom = ({
  room4MatchList,
  formStartTime,
  formEndTime,
}: {
  room4MatchList?: MeetingRoomListModel[];
  formStartTime: Moment;
  formEndTime: Moment;
}) => {
  if (room4MatchList === undefined || room4MatchList.length === 0) {
    return [];
  }
  const list: MatchedRoomInfoType[] = [];
  room4MatchList.forEach(roomInfo => {
    const {
      roomBookInfoVO: {
        // eslint-disable-next-line camelcase
        time_axis,
        interval,
        start,
        end,
      },
    } = roomInfo;
    // const startSeqNo = getSeqNo(formStartTime, interval);
    // const endSeqNo = getSeqNo(formEndTime, interval) -1 ;
    const rangeStart = formStartTime.clone().startOf('day').hours(start);
    const rangeEnd = rangeStart.clone().hours(end);
    if (formStartTime.isBefore(rangeStart) || formEndTime.isBefore(rangeStart) || formStartTime.isAfter(rangeEnd) || formEndTime.isAfter(rangeEnd)) {
      return;
    }
    let interact = false;
    for (let index = 0; index < time_axis.length; index++) {
      if (time_axis[index] !== 0) {
        const invaliteStart = formStartTime
          .clone()
          .startOf('day')
          .hours(start + index / 2)
          .minutes((index % (1 / interval)) * interval * 60);
        const invaliteEnd = invaliteStart.clone().add(interval * 60, 'minutes');
        if (rangeInteract([invaliteStart, invaliteEnd], [formStartTime, formEndTime])) {
          interact = !0;
          break;
        }
      }
    }
    if (!interact) {
      list.push({
        roomInfo,
        // startSeqNo: getSeqNo(formStartTime, interval),
        // endSeqNo: getSeqNo(formEndTime, interval) - 1
      });
    }
    // const beforeStartTimeAxis = new Array(start / interval).fill(0);
    // const afterEndTimeAxis = new Array((24 - end) / interval).fill(0);
    // const wholeAxis = [...beforeStartTimeAxis, ...time_axis, ...afterEndTimeAxis];
    // const wanttedAxis = wholeAxis.slice(startSeqNo, endSeqNo + 1);
    // if (!wanttedAxis.some(e => e !== 0)) {
    //     list.push({
    //         roomInfo,
    //         startSeqNo,
    //         endSeqNo : endSeqNo - 1,
    //     });
    // }
  });
  return list;
};
/**
 * 重置时间到整点或半点
 * @param time 时间
 * @param tail 是否向后重置
 */
export const resetMomentToHourOrHalfHour = (time: Moment, tail = false) => {
  if (moment.isMoment(time)) {
    const compareTime = time.clone().startOf('minutes');
    const startHourTime = moment(compareTime).startOf('hours');
    const startQuarterTime = moment(compareTime).minutes(15);
    const middleHourTime = moment(compareTime).minutes(30);
    const threeQuarterTime = moment(compareTime).minutes(45);
    const endHourTime = compareTime.hours() !== 23 ? moment(compareTime).add(1, 'hours').startOf('hours') : compareTime;
    if (tail) {
      if (compareTime.isBetween(startHourTime, startQuarterTime)) {
        return startQuarterTime;
      } else if (compareTime.isBetween(startQuarterTime, middleHourTime)) {
        return middleHourTime;
      } else if (compareTime.isBetween(middleHourTime, threeQuarterTime)) {
        return threeQuarterTime;
      } else if (compareTime.isBetween(threeQuarterTime, endHourTime)) {
        return endHourTime;
      }
      return compareTime;
    }
    if (compareTime.isBetween(startHourTime, startQuarterTime)) {
      return startHourTime;
    } else if (compareTime.isBetween(startQuarterTime, middleHourTime)) {
      return startQuarterTime;
    } else if (compareTime.isBetween(middleHourTime, threeQuarterTime)) {
      return middleHourTime;
    } else if (compareTime.isBetween(threeQuarterTime, endHourTime)) {
      return threeQuarterTime;
    }
  }
  return time;
};
export const serializeFormMoments = (values?: any, dese = false) => {
  const customizer = (pv: any) => {
    if (pv) {
      if (dese && pv instanceof Date) {
        return moment(pv);
      }
      if (!dese && moment.isMoment(pv)) {
        return pv.toDate();
      }
      return undefined;
    }
    return pv;
  };
  if (typeof values === 'object') {
    return cloneDeepWith(values, customizer);
  }
  return values;
};
export const getContanctObjs = async (emails: string[]) => {
  const contactInfo = await contactApi.doGetContactByEmails(
    emails.map(e => ({ mail: e, contactName: '' })),
    ''
  );
  return contactInfo.map(e => {
    const c: ContactItem = {
      name: e.inContactBook ? e.contact.contact.contactName : e.contact.contact.accountName,
      email: e.contact.contact.accountName,
      avatar: e.contact.contact.avatar,
    };
    return c;
  });
};
export const isWeekday = (t: Moment) => lodashInRange(t.day(), 1, 6);
// 转换会议室需要的日期参数
export const handleMeetingFormTimeRange = (values: {
  startDate?: Moment | null;
  endDate?: Moment | null;
  startTime?: Moment | null;
  endTime?: Moment | null;
  allDay?: boolean;
}) => {
  const { startDate, startTime, endDate, endTime, allDay } = values;
  const formStartDate: Moment = moment.isMoment(startDate) ? startDate.clone() : moment();
  const formStartTime: Moment = resetMomentToHourOrHalfHour(moment.isMoment(startTime) ? startTime?.clone() : formStartDate.clone());
  const formEndDate: Moment = moment.isMoment(endDate) ? endDate?.clone() : moment();
  const formEndTime: Moment = resetMomentToHourOrHalfHour(moment.isMoment(endTime) ? endTime?.clone() : formEndDate?.clone(), !0);
  // 如果是全天日程，设定固定的开始结束时间
  if (allDay) {
    formStartTime.hours(7).startOf('hours');
    formEndTime.hours(23).startOf('hours');
  }
  // 如果日期不是同一天，置为同一天
  if (isCrossDay(formStartDate, formEndDate)) {
    formEndDate.set({
      year: formStartDate.year(),
      month: formStartDate.month(),
      date: formStartDate.date(),
    });
    // 跨天截止时间直接到23点
    formEndTime.hours(23).startOf('hours');
  }
  // 对齐时间和日期
  formStartTime.set({
    year: formStartDate.year(),
    month: formStartDate.month(),
    date: formStartDate.date(),
  });
  formEndTime.set({
    year: formEndDate.year(),
    month: formEndDate.month(),
    date: formEndDate.date(),
  });
  if (formEndTime.isBefore(formStartTime)) {
    formEndTime.endOf('day');
  }
  return {
    formStartDate,
    formStartTime,
    formEndDate,
    formEndTime,
  };
};
export const constructAvailableMeetingRoomParam = async (formValue?: ScheduleInsertForm, event?: ScheduleModel | null) => {
  if (!formValue) {
    return null;
  }
  const {
    enmuRecurrenceRule,
    moments,
    time: { allDay },
  } = formValue;
  const {
    formStartDate: startDate,
    formStartTime: startTime,
    formEndDate: endDate,
    formEndTime: endTime,
  } = handleMeetingFormTimeRange({
    ...moments,
    allDay: !!allDay,
  });
  let recurrenceRule: RecurrenceRuleParam | undefined;
  if (enmuRecurrenceRule !== undefined && enmuRecurrenceRule !== EnmuRecurrenceRule.NONE) {
    recurrenceRule = getInsertRecurrenceRule(formValue) as RecurrenceRuleParam;
    if (!recurrenceRule && event?.scheduleInfo?.recur) {
      recurrenceRule = {
        ...omit(event.scheduleInfo.recur, 'recurIntro'),
        freq: event.scheduleInfo.recur?.freq || (event.scheduleInfo.recur as any)?.frequency,
        userFreq: event.scheduleInfo.recur?.userFreq || (event.scheduleInfo.recur as any)?.userFrequency,
      };
    }
  }
  const start = getDateTimeByForm(startDate, startTime, !!allDay);
  const end = getDateTimeByForm(allDay ? endDate.clone().add(1, 'days') : endDate, endTime, !!allDay);
  const condtion: MeetingRoomListAvailableCondition = {
    time: {
      allDay: allDay ? 1 : 0,
      start,
      end,
      startZoneId: await catalogApi.getZoneId(),
      endZoneId: await catalogApi.getZoneId(),
    },
    addr: '',
    capacity_code: 0,
    instruments: [],
    page: 1,
    page_size: 999,
  };
  if (recurrenceRule) {
    // 去掉入参中的until，防止影响服务端判断，今后完全依赖服务端设置
    // recurrenceRule.until = getDateTimeByForm(startDate!.clone().add(1, 'month'), startTime?.clone().add(1, 'month'), !!allDay);
    condtion.time.recurrenceRule = recurrenceRule;
  }
  if (event && event.scheduleInfo.meetingInfo?.order_id) {
    condtion.order_id = event.scheduleInfo.meetingInfo?.order_id;
  }
  return condtion;
};
export const initDefaultMoment = (date?: Moment) => {
  const cur = moment();
  const startMoment = date ? date.clone() : cur;
  startMoment.second(0).millisecond(0);
  startMoment.minutes(startMoment.minutes() > 30 ? 60 : 30);
  const endMoment = startMoment.clone().add(1, 'hour');
  return {
    startDate: startMoment,
    startTime: startMoment.clone(),
    endDate: endMoment,
    endTime: endMoment.clone(),
  };
};
