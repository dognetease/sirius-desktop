import { getTransText } from '@/components/util/translate';
import moment from 'moment';
/**
 * @description 符合UI规范的模糊日期单位格式化/精确日期单位格式化函数
 * @param timestamp 要格式化的日期时间戳
 * @param type fuzzy: 使用模糊模式格式化；precise: 使用精确模式格式化
 * 规范参考地址：https://www.figma.com/file/7qZQyGr8hjlhS67YRtFv3v/%E6%A1%8C%E9%9D%A2%E7%AB%AF%E4%BA%A4%E4%BA%92%E8%A7%84%E8%8C%83?node-id=4%3A4&t=DQAPa1ZmicwCwp6Z-0
 */
export function commonDateUnitFormat(timestamp: number, type?: 'fuzzy' | 'precise') {
  if (typeof timestamp !== 'number' || timestamp <= 0) {
    return '';
  }

  const timeGapDuration = Date.now() - timestamp;

  // 不支持未来时间的格式化
  if (timeGapDuration < 0) {
    return '';
  }

  // 小于等于三分钟
  const threeMinutesDuration = 3 * 60 * 1000;
  if (timeGapDuration <= threeMinutesDuration) {
    return getTransText('GANGGANG');
  }

  type = type || 'fuzzy';
  const isFuzzy = type === 'fuzzy';
  const targetMoment = moment(timestamp);

  // 判断是否为今天的日期
  if (targetMoment.isSame(moment(), 'day')) {
    return isFuzzy ? targetMoment.format('HH:mm') : `${getTransText('JINTIAN')} ${targetMoment.format('HH:mm')}`;
  }

  // 判断是否为昨天
  if (targetMoment.isSame(moment().subtract(1, 'day'), 'day')) {
    return isFuzzy ? getTransText('ZUOTIAN') : `${getTransText('ZUOTIAN')} ${targetMoment.format('HH:mm')}`;
  }

  // 判断是否为今年
  if (targetMoment.isSame(moment(), 'year')) {
    return isFuzzy ? targetMoment.format('MM-DD') : targetMoment.format('MM-DD HH:mm');
  }

  // 今年之前
  return isFuzzy ? targetMoment.format('YYYY-MM-DD') : targetMoment.format('YYYY-MM-DD HH:mm');
}
