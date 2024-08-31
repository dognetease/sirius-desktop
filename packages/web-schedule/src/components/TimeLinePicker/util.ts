import moment, { Moment } from 'moment';
import { TimeRange } from 'api';
import { getIn18Text } from 'api';
/**
 * 获取标尺数组
 * @param param 开始时间，结束时间，每小时时间段
 */
export const getScacles = ({ startHour, endHour, pieceOfHour, date }: { startHour: number; endHour: number; pieceOfHour: number; date?: Moment }) => {
  const scales: TimeRange[] = new Array((endHour - startHour) * pieceOfHour).fill(null).map((_, index) => {
    const scale = moment(date)
      .startOf('minutes')
      .hour(Math.floor(index / pieceOfHour) + startHour)
      .minutes((index % pieceOfHour) * (60 / pieceOfHour));
    const startTime = scale;
    const endTime = scale.clone().add(1 / pieceOfHour, 'hours');
    return [startTime, endTime];
  });
  return scales;
};
/**
 * 外部时间秒和毫秒置为0
 * @param ranges 时间范围数组
 */
export const fixedDateTimeRange = (ranges?: TimeRange[]) => ranges?.map(e => e.map(d => d.set({ second: 0, milliseconds: 0 })));
/**
 * 计算覆盖range的相关位置和长度
 * @param range 时间段
 * @param scales 总时间尺度
 * @param width 总宽度
 * @param startHour 开始时间
 * @param pieceOfHour 每小时分几个单位时段
 */
export const calculateWidth = (range: TimeRange, scales: TimeRange[], width: number, startHour: number, pieceOfHour: number) => {
  const [rangeStart, rangeEnd] = range;
  const scaleStart = scales[0][0];
  const scaleEnd = scales[scales.length - 1][1];
  const interactRange = rangeInteract(range, [scaleStart, scaleEnd]);
  if (interactRange) {
    const [start, end] = interactRange;
    const startOverflow = scaleStart.isAfter(rangeStart);
    const endOverflow = scaleEnd.isBefore(rangeEnd);
    const duration = end.diff(start, 'hours', true);
    const elementLeft = (start.hours() * pieceOfHour + start.minutes() / (60 / pieceOfHour) - startHour * pieceOfHour) * (width / scales.length);
    const elementWidth = duration * (width / scales.length) * pieceOfHour;
    return {
      elementLeft,
      elementWidth,
      startOverflow,
      endOverflow,
    };
  }
  return {
    elementLeft: 0,
    elementWidth: 0,
  };
};
/**
 * 是否和一些区域有相交 边界条件为默认 “()”
 * @param range
 * @param ranges
 */
export const isRangeInteract = (range: TimeRange, ranges?: TimeRange[]) =>
  ranges?.reduce((prev, curRnage) => {
    const [ocStart, ocEnd] = curRnage;
    return prev || ocStart.isBetween(range[0], range[1]) || (ocStart.isBefore(range[0]) && ocEnd.isAfter(range[0]));
  }, false);
/**
 * 返回两个区域的相交部分
 * @param range1
 * @param range2
 */
export const rangeInteract = (range1: TimeRange, range2: TimeRange) => {
  const [start1, end1] = range1;
  const [start2, end2] = range2;
  // if (end1.isBetween(start2, end2) || start1.isBetween(start2, end2)) {
  //   const start = start1.isBefore(start2) ? start2 : start1;
  //   const end = end1.isAfter(end2) ? end2 : end1;
  //   return [start, end];
  // }
  // if (end2.isBetween(start1, end1) || start2.isBetween(start1, end1)) {
  //   const start = start2.isBefore(start1) ? start1 : start2;
  //   const end = end2.isAfter(end1) ? end1 : end2;
  //   return [start, end];
  // }
  // if (start1.isSame(start2) && end1.isSame(end2)) {
  //   return [start1, end1];
  // }
  // return null;
  const start = start1.isBefore(start2) ? start2 : start1;
  const end = end1.isAfter(end2) ? end2 : end1;
  if (start.isBefore(end)) {
    return [start, end];
  } else {
    return null;
  }
};
/**
 * 根据当前时间返回不可用的时间段
 * @param pieceOfHour 每小时时间片
 */
export const getDefaultForbidden = (pieceOfHour: number) => [
  moment().startOf('day'),
  moment()
    .startOf('hour')
    .minute(Math.ceil(moment().minutes() / (60 / pieceOfHour)) * (60 / pieceOfHour)),
];
export const getDurationText = (range: TimeRange) => {
  const [start, end] = range;
  // todo 中文修改
  const formatter = `${moment().year() === start.year() ? '' : getIn18Text('YYYYNIAN@')}M月D日（星期dd）HH:mm`;
  return start.format(formatter) + '-' + end.format('HH:mm');
};
