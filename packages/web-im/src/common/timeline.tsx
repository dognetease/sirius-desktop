import dayjs, { UnitType } from 'dayjs';
import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import { apis, IMMessage, MailConfApi } from 'api';
import { apiHolder, SystemApi } from 'api';
import { getIn18Text } from 'api';
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const durationMin = 5 * 60 * 1000;
const DURATION_MIN = 5 * 60 * 1000;
export const addHHM = (
  time: number,
  param: {
    format: 'hh:mm' | 'HH:mm';
    [key: number]: string;
  } = {
    format: 'HH:mm',
    [5 * 60 * 1000]: getIn18Text('GANGGANG'),
  }
) => {
  const timeZone = mailConfApi.getTimezone();
  const now = systemApi.getDateByTimeZone(new Date(), timeZone);
  const timeDayjs = dayjs(systemApi.getDateByTimeZone(time, timeZone));

  const aliasKeyList = Object.keys(param)
    .filter(item => !Number.isNaN(item))
    .map(item => Number(item));
  const duration = now.valueOf() - timeDayjs.valueOf();
  while (aliasKeyList.length) {
    const minNumber = Math.min(...aliasKeyList);
    if (minNumber >= duration) {
      return param[`${minNumber}`];
    }
    const $index = aliasKeyList.indexOf(minNumber);
    aliasKeyList.splice($index, 1);
  }
  return timeDayjs.format(param.format);
};

export const isToday = (time: number) => {
  const timeZone = mailConfApi.getTimezone();
  const now = dayjs(systemApi.getDateByTimeZone(new Date(), timeZone)).format('YYYY-MM-DD');
  const timeDayjs = dayjs(systemApi.getDateByTimeZone(time, timeZone)).format('YYYY-MM-DD');
  return now === timeDayjs;
};
export const formatTime = (time: number) => {
  const timeZone = mailConfApi.getTimezone();
  const now = dayjs(systemApi.getDateByTimeZone(new Date(), timeZone));
  const timeDayjs = dayjs(systemApi.getDateByTimeZone(time, timeZone));
  const realDuration = now.valueOf() - timeDayjs.valueOf();

  const keys: UnitType[] = ['year', 'month', 'day', 'date'];
  const [year, month, day, date] = keys.map(key => now.get(key));
  const today = dayjs(`${year}/${month + 1}/${date}`);
  const firstDayOfWeek = today.subtract(day);
  if (timeDayjs.year() !== now.year()) {
    // 非同一年
    return timeDayjs.format(getIn18Text('YYYYNIANMYDR'));
  }
  if (timeDayjs.month() !== now.month() && firstDayOfWeek.valueOf() > timeDayjs.valueOf()) {
    // 非同一个月同周
    return timeDayjs.format(getIn18Text('MYUEDRIIM'));
  }
  if (now.date() - timeDayjs.date() === 1) {
    // return timeDayjs.format(getIn18Text('ZUOTIAN'));
    return getIn18Text('ZUOTIAN');
  }
  if (timeDayjs.date() !== now.date()) {
    // 非同一个月同(和非同月规则保持一致)
    return timeDayjs.format(getIn18Text('MYUEDRIIM'));
  }
  if (realDuration >= durationMin) {
    // 非五分钟内
    return timeDayjs.format('a').replace('am', getIn18Text('SHANGWU')).replace('pm', getIn18Text('XIAWU'));
  }
  return '';
};

/**
 * @name:给消息添加时间线.
 * @description:获取到重新merge消息之后。先根据消息列表中是否打Tag拆分成三段
 *
 * @param msgs
 */

export type TimelinesplitValidateApi<T> = (msg: T) => number;
export const validate: TimelinesplitValidateApi<IMMessage> = (msg: IMMessage): number => lodashGet(msg, 'timeTagIndex', -1);

/**
 * @name:给消息列表中每条消息添加timeTagIndex参数
 * @param msgs
 * @param callback
 * @returns
 */
export const addTimeline = (msgs: IMMessage[], callback = validate): IMMessage[] => {
  const twoDimensionalArr = splitMsgs<IMMessage>(msgs, callback);
  // 给没有timeTagIndex的元素添加timeTagIndex属性
  const result = twoDimensionalArr.reduce((total: IMMessage[][], subArr: IMMessage[]) => {
    const startTagIndex = lodashGet(subArr, '[0].timeTagIndex', -1);
    // 如果当前这个子数组已经打过Tag 直接push到数组中
    if (startTagIndex !== -1) {
      total.push(subArr);
      return total;
    }
    // 计算当前这个
    const preSubArr = total[total.length - 1] || [];
    const curTimetagIndex = computeTagIndex(
      lodashGet(preSubArr, '[0].time', 0),
      lodashGet(preSubArr, `[${preSubArr.length}-1].timeTagIndex`, 0),
      lodashGet(subArr, '[0].time')
    );

    // 塞入timeTagIndex
    lodashSet(subArr, '[0].timeTagIndex', curTimetagIndex);
    if (curTimetagIndex === 0) {
      total.push(subArr);
    } else {
      total[total.length - 1] = [...total[total.length - 1], ...subArr];
    }
    return total;
  }, [] as IMMessage[][]);
  // 将二维数组转成一维数组
  return result.reduce((total, cur) => [...total, ...cur], [] as IMMessage[]);
};
// 计算新Tag
export const computeTagIndex = (startTime: number, lastIndex: number, curTime: number): number => {
  if (curTime - startTime <= DURATION_MIN) {
    return lastIndex + 1;
  }
  return 0;
};
/**
 * @name 根据checkMethod方法返回的value将数组拆分为二维数组
 * @param msgs
 * @param checkMethod
 * @returns
 */
const splitMsgs = <T,>(msgs: T[], checkMethod: (args: any) => number): T[][] => {
  const twoDimensionalArr: T[][] = [];

  return msgs.reduce((total, item) => {
    if (checkMethod(item) === -1) {
      total.push([item]);
    } else if (checkMethod(item) === 0) {
      total.push([item]);
    } else {
      const lastSubMsgs = total[total.length - 1];
      lastSubMsgs.push(item);
    }
    return total;
  }, twoDimensionalArr);
};
//

/**
 * @deprecated
 * @name:给消息打时间线Tag 五分钟内的消息为同一个timelines
 * @param msgs
 * @param currentTime
 * @param currentIndex
 * @returns
 */
export const addTimelineTag = (msgs, currentTime = 0, currentIndex = 0) => {
  const maxDistance = 5 * 60 * 1000;
  return msgs.map(item => {
    const { time } = item;
    if (time - currentTime >= maxDistance) {
      item.timeTagIndex = 0;
      item.timeTagValue = time;
      currentIndex = 0;
      currentTime = time;
    }
    return item;
  });
};

/**
 * @deprecated
 * @name 寻找Tag
 * @param msgs
 * @param pos
 * @returns
 */
export const findTag = (msgs, pos?: number) => {
  const lastMsg = msgs[pos || msgs.length - 1] || {
    timeTagIndex: 0,
    timeTagValue: 0,
  };
  const { timeTagIndex, timeTagValue } = lastMsg;
  return {
    timeTagIndex,
    timeTagValue,
  };
};

export const findPreTag = () => {};
