import React, { ReactNode } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getIn18Text } from 'api';
// import LxTag from '@web-common/components/UI/Tag/tag';
import LxTag from '@lingxi-common-component/sirius-ui/Tag';
import { Divider } from 'antd';
import styles from './utils.module.scss';

dayjs.extend(isoWeek);

export const getIn18TextWithPlaceholder = (key: string, value: string | number) => {
  if (typeof window === 'undefined') {
    return '';
  }
  const val = getIn18Text(key) || '';
  return val.replace('${}', value + '');
};

export interface DataTagItem {
  content: ReactNode | null | undefined;
  style?: 'blue' | 'yellow' | 'green' | 'default';
  priority?: boolean;
}

/**
 * @desc 公共的数据打标函数，没有提供容器节点，只返回列表节点
 * @param tags
 * @returns
 */
export const renderDataTagList = (propsTags: DataTagItem[]) => {
  const renderChild = (item: DataTagItem) => {
    const { content = '', style = 'default' } = item;
    return content ? (
      <span key={`${content}`} className={styles.customsTagLabel}>
        <LxTag type={style === 'blue' ? 'label-1-1' : style === 'yellow' ? 'label-4-1' : style === 'green' ? 'label-2-1' : 'label-1-1'}>{content}</LxTag>
      </span>
    ) : null;
  };
  const tags = propsTags.filter(item => Boolean(item.content));
  const priorityTags = tags.filter(item => item.priority);
  const normalTags = tags.filter(item => !item.priority);
  return tags.length < 1 ? null : (
    <>
      {priorityTags.map(renderChild)}
      {Boolean(priorityTags.length) && Boolean(normalTags.length) && (
        <Divider type="vertical" style={{ height: 16, marginRight: '8px', marginLeft: 0, background: 'rgba(255,255,255,0.2)' }} />
      )}
      {normalTags.map(renderChild)}
    </>
  );
};

// 获取上一周的周一-周日
export const getLastDayInWeek = (day: number, format?: string): string | number => {
  const today = dayjs();
  const result = today.isoWeekday(1).startOf('week').subtract(7, 'day').day(day);
  return format ? result.format(format) : result.valueOf();
};

// 获取最近的一个周几（注意，周日 === 0）
export const getRecentWeekday = (day: number, format?: string): string | number => {
  const now = dayjs();
  const dayOfWeek = now.day(); // 获取今天是星期几
  let result: Dayjs;

  // 以获取周二为例
  if (dayOfWeek === day) {
    // 如果今天就是周二，返回今天的日期
    result = now.startOf('day');
  } else if (dayOfWeek < day) {
    // 如果今天是周一或之前的日期，返回上一周的周二日期
    result = now.startOf('week').subtract(7 - day, 'day');
  } else {
    // 如果今天是周三或之后的日期，返回昨天的日期
    result = now.startOf('week').add(day, 'day');
  }
  return format ? result.format(format) : result.valueOf();
};
