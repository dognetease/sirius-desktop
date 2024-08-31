import { DateTime, EntityCatalog, RecurrenceRuleParam, ReminderAction, ReminderParam, ScheduleModel, SystemApi } from 'api';
// import chineseLunar from "chinese-lunar";
import solarLunar from 'solarlunar';
import { RRule, Options } from 'rrule';
import moment, { Moment } from 'moment';

import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';
import { FullCalendarProps } from './calendar';
import { CatalogPrivilege, InviteType, PartStatus, ScheduleClazz, TimeUnit } from './data';
import { ColorMap } from './constant';
// import { apis, apiHolder, MailConfApi } from 'api';
import { FormSubmitConditon, ScheduleInsertForm } from './components/CreateBox/ScheduleForm';
import { EnmuRecurrenceRule, REMINDER_ACTION_TEXT_MAP, getInsertRecurrenceRule } from './components/CreateBox/util';
import { getIn18Text } from 'api';
// 暂时留着，别删
// const mailConfApi: MailConfApi = (apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown) as MailConfApi;
// const systemApi: SystemApi = apiHolder.api.getSystemApi();
moment.locale('zh-cn');
// export 元旦、春节、清明、端午、劳动、中秋、国庆
export const isCrossDay = (start: Moment, end: Moment): boolean => !(start.year() === end.year() && start.month() === end.month() && start.day() === end.day());
interface DateObj {
  month: number;
  date: number;
}
export const getHoliday = (solarDate: DateObj, lunarDate: DateObj) => {
  const holiday: string[] = [];
  switch (`${solarDate.month}-${solarDate.date}`) {
    case '1-1':
      holiday.push(getIn18Text('YUANDAN'));
      break;
    case '5-1':
      holiday.push(getIn18Text('LAODONGJIE'));
      break;
    case '10-1':
      holiday.push(getIn18Text('GUOQINGJIE'));
      break;
    default:
      break;
  }
  switch (`${lunarDate.month}-${lunarDate.date}`) {
    case '1-1':
      holiday.push(getIn18Text('CHUNJIE'));
      break;
    case '8-15':
      holiday.push(getIn18Text('ZHONGQIUJIE'));
      break;
    case '5-5':
      holiday.push(getIn18Text('DUANWUJIE'));
      break;
    default:
      break;
  }
  // 清明没有固定的时间
  return holiday;
};
export const getLunarDayStr = (date: Date) => {
  const data = solarLunar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  let lunarDay = data.lDay === 1 ? data.monthCn : data.dayCn;
  const weekStr = data.ncWeek.replace(/星期/g, getIn18Text('ZHOU'));
  const holiday = getHoliday(
    {
      month: date.getMonth() + 1,
      date: date.getDate(),
    },
    {
      month: data.lMonth,
      date: data.lDay,
    }
  );
  if (typeof data.term === 'string' && /^清明/.test(data.term)) {
    holiday.push(getIn18Text('QINGMINGJIE'));
  }
  if (holiday.length > 0) {
    lunarDay = holiday.join(' ');
  }
  return {
    solarDay: date.getDate(),
    lunarDay,
    weekStr,
  };
};
export const formatDayPopoverTitle = () => getIn18Text('QUANBURICHENG');
export const getRawTime = (date: DateTime) => {
  const { y, m, d, hr, min, sec } = date;
  return new Date(y, m - 1, d, hr, min, sec);
};
export const getDateTime = (date: Date, dateTime?: Date): DateTime => ({
  y: date.getFullYear(),
  m: date.getMonth() + 1,
  d: date.getDate(),
  hr: (dateTime || date).getHours(),
  min: (dateTime || date).getMinutes(),
  sec: (dateTime || date).getSeconds(),
});
export const getShowClock = (date: DateTime, allDay?: 0 | 1 | boolean) => {
  if (allDay) {
    return getIn18Text('QUANTIAN');
  }
  const { hr, min } = date;
  return `${hr > 9 ? hr : `0${hr}`}:${min > 9 ? min : `0${min}`}`;
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
/**
 * 获取日程开始结束文本
 * @param startDate 开始时间
 * @param endDate  结束时间
 * @param allDay 是否全天日程
 * @param weekDaySuffix 是否显示星期 默认是
 * @param weekDayFloat 是否根据当前时间显示星期（今天、明天、后天）默认否
 * @returns
 */
export const getDurationText = (startDate: Date, endDate: Date, allDay?: boolean, weekDaySuffix: boolean = true, weekDayFloat: boolean = false, timeZone?: string) => {
  let startStr: string = '';
  let endStr: string = '';
  let affixStr: string = '';
  // 暂时留着，别删
  // const timeZone = mailConfApi.getTimezone();
  let startDateFormatStr = getIn18Text('MMYUEDD');
  let endDateFormatStr = getIn18Text('MMYUEDD');
  // 特定时区，如果有转换为特定时区时间
  if (weekDaySuffix) {
    if (!weekDayFloat) {
      startDateFormatStr += '(ddd)';
      endDateFormatStr += '(ddd)';
    } else {
      // 暂时留着，别删
      // const start = moment(systemApi.getDateByTimeZone(startDate, timeZone)).startOf('day');
      // const end = moment(systemApi.getDateByTimeZone(endDate, timeZone)).startOf('day');
      // const today = moment(systemApi.getDateByTimeZone(new Date, timeZone)).startOf('day');
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).startOf('day');
      const today = moment().startOf('day');
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
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  if (allDay && endMoment.diff(startMoment, 'days') > 0) {
    endMoment.add(-1, 'days');
  }
  // 跨天
  const crossDay = !endMoment.isSame(startMoment, 'day');
  // 跨年 不是今年就是跨年
  const crossYear = startMoment.year() !== moment().year() || endMoment.year() !== moment().year();
  startStr = crossYear ? `${startMoment.year()}年` : '';
  endStr = crossYear && crossDay ? `${endMoment.year()}年` : '';
  startStr += startMoment.format(startDateFormatStr + ' ');
  endStr += crossDay ? endMoment.format(endDateFormatStr + ' ') : '';
  affixStr = getDurationTag(startMoment, endMoment, allDay);
  if (!allDay) {
    startStr += startMoment.format('HH:mm');
    endStr += endMoment.format('HH:mm');
  }
  endStr = endStr ? ` ~ ${endStr}` : endStr;
  return {
    startStr,
    endStr,
    affixStr,
  };
};
/**
 * 可怜的日程 只能最低程度显示 基本只是属于“知晓其存在的地步”
 * 订阅日程的最低权限：
 * 所属日历为只可见忙闲且日程遵循日历权限
 * 或日程本身为不公开（私人或机密）
 * @param scheduleEvent
 */
export const isPoorSchedule = (scheduleEvent: ScheduleModel) => {
  const {
    scheduleInfo: { clazz },
    catalogInfo: { isOwner, privilege },
  } = scheduleEvent;
  return (
    !isOwner && ((CatalogPrivilege.BUSY === privilege && clazz === ScheduleClazz.DEFAULT) || clazz === ScheduleClazz.PRIVATE || clazz === ScheduleClazz.CONFIDENTIAL)
  );
};
/**
 * 获取月视图中日程标签文案
 * @param scheduleEvent
 */
const getDisplayTitle = (scheduleEvent: ScheduleModel) => {
  const {
    scheduleInfo: { summary, allDay, start },
    catalogInfo, //: { belonger, isOwner },
  } = scheduleEvent;
  // 订阅日程的最低权限：
  // 所属日历为只可见忙闲且日程遵循日历权限
  // 或日程本身为不公开（私人或机密）
  // const lowestPrivilege = isPoorSchedule(scheduleEvent);
  const prefix =
    getShowClock(getDateTime(new Date(start)), allDay) +
    (catalogInfo && !catalogInfo.isOwner ? ` ${catalogInfo?.belonger?.extNickname || catalogInfo?.belonger?.extDesc}` : '');
  const suffix = summary || getIn18Text('WUZHUTI');
  return [prefix, catalogInfo && !catalogInfo.isOwner ? '，' : ' ', suffix];
};
export const getWeekViewEventHeight = (start: Moment, end: Moment) => {
  const eventHeight = end.diff(start, 'hour', true) * 50;
  const titleHeight = Math.round(eventHeight / 20) - 1;
  return titleHeight * 20 || 20;
};
export const getWeekViewEventDisplayTime = (start: Moment, end: Moment, allDay: boolean) => {
  const aboveHalfHour = moment(start).clone().add(30, 'minute').isSameOrBefore(moment(end));
  const isShowTime = !(allDay || !aboveHalfHour);
  return isShowTime ? `${moment(start).format('HH:mm')}-${moment(end).format('HH:mm')}` : null;
};
/**
 * 日程数据转换，包括全天日程、循环日程等处理
 * @param rawData ScheduleModel 接口拿到的原始数据
 * @returns https://fullcalendar.io/docs/event-object
 */
export const eventDataTransform: FullCalendarProps['eventDataTransform'] = rawData => {
  const {
    scheduleInfo: {
      start,
      end,
      allDay,
      id,
      // partStat,
      // inviteeType,
    },
    catalogInfo,
  } = rawData as ScheduleModel;
  const startDate = moment(start);
  const endDate = moment(end);
  const isEndDateStartOfDay = endDate.isSame(endDate.clone().startOf('day'));
  // 确保开始时间和结束时间是跨天，且结束时间为零点时，结束时间前一天和开始时间也是跨天
  const behaviorAsAllday = isCrossDay(startDate, endDate) && isCrossDay(startDate, isEndDateStartOfDay ? endDate.clone().subtract(1, 'day') : endDate);
  const weekViewEventHight = getWeekViewEventHeight(startDate, endDate);
  const titleArray = getDisplayTitle(rawData as ScheduleModel);
  return {
    id,
    allDay: !!allDay || behaviorAsAllday,
    title: titleArray.join(''),
    start: startDate.toDate(),
    // 结束时间由于FullCalendar的表现
    // 以及跨天日程被表现为全天
    // 需要兼容一下结束的时刻
    end: behaviorAsAllday && !allDay && !isEndDateStartOfDay ? endDate.clone().add(1, 'day').toDate() : endDate.toDate(),
    extendedProps: {
      behaviorAsAllday,
      weekViewEventHight,
      weekViewEventTitle:
        (catalogInfo && !catalogInfo.isOwner ? `${catalogInfo?.belonger?.extNickname || catalogInfo?.belonger?.extDesc}，` : '') + titleArray.slice().pop(),
      weekViewEventDispalyTime: getWeekViewEventDisplayTime(startDate, endDate, behaviorAsAllday),
      customOrder: allDay ? -1 : 0,
      highOrder: 0,
      data: rawData,
      date: {
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
      },
    },
  };
};
export const getPartTextByStatus = (status: PartStatus) => {
  let text = '';
  switch (status) {
    case PartStatus.EVENT_ACCEPTED:
      text = getIn18Text('JIESHOU');
      break;
    case PartStatus.EVENT_DECLINED:
      text = getIn18Text('JUJUE');
      break;
    case PartStatus.EVENT_TENTATIVE:
      text = getIn18Text('DAIDING');
      break;
    case PartStatus.EVENT_NEEDS_ACTION:
      // text = '暂未回应';
      text = getIn18Text('WEIHUIFU');
      break;
    case PartStatus.EVENT_DELEGATED:
      text = getIn18Text('WEIPAI');
      break;
    default:
      text = getIn18Text('WEIHUIFU');
      break;
  }
  return text;
};
export const getTimeUnitTextByEnum = (value: TimeUnit) => {
  switch (value) {
    case TimeUnit.DAY:
      return getIn18Text('TIAN');
    case TimeUnit.MIN:
      return getIn18Text('FENZHONG');
    case TimeUnit.HOUR:
      return getIn18Text('XIAOSHI');
    case TimeUnit.WEEK:
      return getIn18Text('ZHOU');
    default:
      return '';
  }
};
export const getReminderText = (r: ReminderParam, allDay: boolean) => {
  let reminderRule = '';
  if (allDay && r.time) {
    reminderRule = `${r.interval > 0 ? `${getIn18Text('TIQIAN')}${r.interval}` : getIn18Text('DANG')}${getTimeUnitTextByEnum(r.timeUnit)}${moment()
      .hours(r.time?.hr || 0)
      .minutes(0)
      .format('HH:mm')}`;
  } else {
    reminderRule = `${getIn18Text('TIQIAN')}${r.interval}${getTimeUnitTextByEnum(r.timeUnit)}`;
  }
  return `${reminderRule}${REMINDER_ACTION_TEXT_MAP[r.reminderAction || ReminderAction.EMAIL_APP]}`;
};
export const getDateTimeByForm = (date: Moment, time?: Moment | null, allDay: boolean = false) => {
  const dt: DateTime = {
    y: date.year(),
    m: date.month() + 1,
    d: date.date(),
    hr: time && !allDay ? time.hours() : 0,
    min: time && !allDay ? time.minutes() : 0,
    sec: 0,
  };
  return dt;
};
export const getDateByForm = (date: Moment, time?: Moment | null, allDay: boolean = false) => {
  let res = date.clone();
  res.hours(time && !allDay ? time?.hours() : 0);
  res.minutes(time && !allDay ? time.minutes() : 0);
  res.seconds(0);
  return res.toDate();
};
export const diffCatalogList = (list: EntityCatalog[], preList: EntityCatalog[]) => {
  let changed: boolean = preList.length !== list.length;
  for (let index = 0; index < preList.length; index++) {
    const preCatalog = preList[index];
    const curCatalog = list.find(e => e.id === preCatalog.id);
    changed = changed || curCatalog === undefined || curCatalog.updateTime !== preCatalog.updateTime;
    if (changed) {
      break;
    }
  }
  return changed;
};
export const getCatalogPrivilegeText = (privilege: number) => {
  switch (privilege) {
    // case CatalogPrivilege.NONE:
    //     return '无权限';
    case CatalogPrivilege.BUSY:
      return getIn18Text('ZHIKEJIANMANGXIAN');
    case CatalogPrivilege.VIEW:
      return getIn18Text('KECHAKANRICHENG');
    case CatalogPrivilege.OPREATE:
      return getIn18Text('KEYIXINJIAN\u3001');
    default:
      return getIn18Text('WUQUANXIAN');
  }
};
export const colorGhost = (color: string = '') => ColorMap.get(color.toUpperCase()) || color;
const transFormRRuleFromScheduleFormData = (data: ScheduleInsertForm) => {
  const pOption: Partial<Options> = {
    interval: 1,
    dtstart: getRawTime(getDateTimeByForm(data.moments.startDate!, data.moments.startTime!, !!data.time.allDay)),
    until: data.rruleUntil?.toDate(),
  };
  switch (data.enmuRecurrenceRule) {
    case EnmuRecurrenceRule.DAYLY:
      pOption.freq = RRule.DAILY;
      break;
    case EnmuRecurrenceRule.MONTHLY:
      pOption.freq = RRule.MONTHLY;
      break;
    case EnmuRecurrenceRule.YEARLY:
      pOption.freq = RRule.YEARLY;
      break;
    case EnmuRecurrenceRule.WEEKLY:
      pOption.freq = RRule.WEEKLY;
      break;
    case EnmuRecurrenceRule.WEEKDAY:
      pOption.freq = RRule.WEEKLY;
      pOption.byweekday = [RRule.MO, RRule.TU, RRule.TH, RRule.WE, RRule.FR];
      break;
    default:
      return null;
  }
  return pOption;
};
export const createFakeScheduleEventData = (data: ScheduleInsertForm, createTempId: number) => {
  const start = getRawTime(getDateTimeByForm(data.moments.startDate!, data.moments.startTime!, !!data.time.allDay));
  const end = getRawTime(getDateTimeByForm(data.moments.endDate!, data.moments.endTime!, !!data.time.allDay));
  const scheduleFakeData: ScheduleModel = {
    scheduleInfo: {
      id: createTempId.toString(),
      scheduleId: createTempId,
      allDay: data.time.allDay,
      partStat: 1,
      start: start.valueOf(),
      end: end.valueOf(),
      createTime: createTempId,
      updateTime: createTempId,
      summary: data.summary,
      location: data.location,
      clazz: data.clazz,
      transp: data.transp,
      description: data.description,
      color: data.color,
      attachments: data.attachments,
      recurIntro: '',
      recurrenceId: 0,
      reminders: [],
      creator: {
        extDesc: '',
      },
      belonger: {
        extDesc: '',
      },
      organizer: {
        extDesc: '',
      },
      inviteeType: InviteType.ORGANIZER,
      priority: 0,
      status: 2,
      sequence: 0,
      privilege: 1,
      instanceId: 0,
      catalogStatus: 0,
      uid: '',
      catalogId: 0,
    },
    catalogInfo: {
      id: '',
      uid: '',
      // 名称
      name: '',
      // 来源 0.自建默认;1.自建; 2.共享; 3.公开
      status: 1,
      // 闲忙状态
      subscribeStatus: 0,
      // 序号
      seq: 0,
      // 存储类型 1.event; 2.todo ; 3.journal ; 4.alarm
      type: 1,
      // 是否公开
      publish: 1,
      // 公开权限
      privilege: 1,
      // 创建时间
      createTime: 0,
      // 更新时间
      updateTime: 0,
      // 颜色
      color: '',
      // 日历描述
      description: 'string',
      // 是否是我的日历
      isOwner: 1,
      // 创建者信息
      belonger: {
        extDesc: '',
      },
    },
    contactInfo: [],
  };
  const baseData = eventDataTransform(scheduleFakeData);
  const rrule = transFormRRuleFromScheduleFormData(data);
  if (rrule) {
    baseData.rrule = new RRule(rrule).toString();
  }
  // 打个标记 这是为了增强交互临时插入的假数据日程 同步完成后会被删除
  baseData.extendedProps!.fake = !0;
  return baseData;
};
/**
 * 解析循环规则对象为字符串描述
 * @param recur 循环规则对象
 * @returns 循环规则描述
 */
export const parseRecurrence = (recur?: RecurrenceRuleParam) => {
  const recurDesc = '';
  if (!recur) {
    return recurDesc;
  }
  let freqDesc = '';
  let dayDesc = '';
  const { byMonth, byMonthDay, bySetPos } = recur;
  const byDay = (recur.byDay[0] || []).slice().sort();
  switch (recur.freq || recur.userFreq || recur.frequency) {
    case 'DAILY':
      freqDesc = getIn18Text('TIAN');
      break;
    case 'WEEKLY': {
      freqDesc = getIn18Text('ZHOU');
      if (byDay.length > 0) {
        if (byDay.slice().sort().join('') === '12345') {
          freqDesc = getIn18Text('GEGONGZUORI');
        } else {
          dayDesc = byDay
            .slice()
            .map(n =>
              moment()
                .weekday(n - 1)
                .format('dddd')
            )
            .join('、');
        }
      }
      break;
    }
    case 'MONTHLY': {
      freqDesc = getIn18Text('YUE');
      if (Array.isArray(byMonthDay) && byMonthDay.length > 0) {
        const positive = byMonthDay
          .slice()
          .filter(d => d > 0)
          .sort()
          .join('、');
        dayDesc = `${positive}日`;
        const navgtive = byMonthDay
          .slice()
          .filter(d => d < 0)
          .sort()
          .map(Math.abs)
          .join('、');
        dayDesc += navgtive ? getIn18Text('HUODAOSHUDI') + navgtive + getIn18Text('TIAN') : '';
      }
      if (Array.isArray(bySetPos) && bySetPos.length > 0 && byDay.length > 0 && !dayDesc) {
        let setPos = getIn18Text('DI') + bySetPos.slice().join('、') + getIn18Text('GE');
        if (byDay.join('') === '67') {
          setPos += getIn18Text('ZHOUMO');
        } else if (byDay.join('') === '12345') {
          setPos += getIn18Text('GONGZUORI');
        } else if (byDay.join('') === '1234567') {
          setPos += getIn18Text('ZIRANRI');
        } else {
          setPos += byDay
            .map(n =>
              moment()
                .weekday(n - 1)
                .format('dddd')
            )
            .join('、');
        }
        dayDesc += setPos;
      }
      break;
    }
    case 'YEARLY': {
      freqDesc = getIn18Text('NIAN');
      const [month] = byMonth;
      const [date] = byMonthDay;
      if (month && date) {
        dayDesc += moment()
          .month(month - 1)
          .date(date)
          .format(getIn18Text('MMYUEDD'));
      }
      if (Array.isArray(bySetPos) && bySetPos.length > 0 && byDay.length > 0 && !dayDesc && month) {
        freqDesc += `${month}月`;
        let setPos = getIn18Text('DI') + bySetPos.slice().join('、') + getIn18Text('GE');
        if (byDay.join('') === '67') {
          setPos += getIn18Text('ZHOUMO');
        } else if (byDay.join('') === '12345') {
          setPos += getIn18Text('GONGZUORI');
        } else if (byDay.join('') === '1234567') {
          setPos += getIn18Text('ZIRANRI');
        } else {
          setPos += byDay
            .map(n =>
              moment()
                .weekday(n - 1)
                .format('dddd')
            )
            .join('、');
        }
        dayDesc += setPos;
      }
      break;
    }
    default:
      break;
  }
  let desc = `每${recur.interval > 1 ? recur.interval : ''}${freqDesc}${dayDesc ? `的${dayDesc}` : ''}重复`;
  if (recur.count) {
    desc += ` 重复${recur.count}次`;
  }
  if (recur.until) {
    desc += ` 到${moment(getRawTime(recur.until)).format(getIn18Text('YYYYNIAN11'))}结束`;
  }
  return desc;
};
/**
 * 判断是否向原邀请者发送更新邮件
 * 时间、地点、循环规则，附件等参数
 * @param values 表单数据
 * @param event 原始数据
 * @returns boolean
 */
export const senderMailToOriginInvitees = (values: ScheduleInsertForm, event: ScheduleModel, condition: FormSubmitConditon) => {
  const prevDay = Boolean(condition.get('autoPrev'));
  const {
    moments: { startDate, startTime, endDate, endTime },
    time: { allDay: userAllday },
    location: userLocation,
    enmuRecurrenceRule,
    rruleUntil,
    meetingOrderParam,
    attachments: userAttachments,
  } = values;
  const {
    scheduleInfo: { start, end, allDay, location, recur, meetingInfo, attachments },
  } = event;
  /**
   * 用户选择的当前时间范围
   */
  const userStart = getRawTime(getDateTimeByForm(startDate!, startTime, !!userAllday)).valueOf();
  const userEnd = getRawTime(getDateTimeByForm(endDate!, endTime, !!userAllday)).valueOf();
  /**
   * 用户选择的循环规则
   */
  const prevRRule = omit(recur, 'recurIntro');
  const _userRRule =
    enmuRecurrenceRule && enmuRecurrenceRule !== EnmuRecurrenceRule.NONE
      ? getInsertRecurrenceRule(values, prevDay) || {
          ...prevRRule,
          freq: recur?.freq,
          userFreq: recur?.userFreq,
        }
      : {};
  const userRRule = omitBy(_userRRule, isUndefined);
  if (!isEmpty(userRRule) && rruleUntil) {
    userRRule.until = getDateTime(rruleUntil.toDate());
  }
  // 获取附件列表id并排序
  const userAttachmentsIds = userAttachments.map(a => a.accountAttachmentId).sort();
  const attachmentsIds = attachments.map(a => a.accountAttachmentId).sort();
  return (
    // 判断时间是否改变
    userStart !== start ||
    userEnd !== end ||
    !!allDay !== !!userAllday ||
    // 判断地点或会议室信息是否改变
    location !== userLocation ||
    meetingOrderParam?.room_id !== meetingInfo?.room_id ||
    // 判断循环规则是否改变
    !isEqual(prevRRule, userRRule) ||
    // 判断附件是否一致
    !isEqual(userAttachmentsIds, attachmentsIds)
  );
};
