import React, { FC } from 'react';
import { getIn18Text } from 'api';
import moment from 'moment';
import './index.scss';

// 读信-附件卡片 云附件空间 写信-附件卡片 选择云附件
// 格式化过期时间组件
export const FormatExpiredDate: FC<{
  date?: number; // 需要格式化的日期
}> = ({ date }) => {
  // 永不过期 黑
  const time = Number(date);
  if (!time) {
    return <>{getIn18Text('YONGBUGUOQI')}</>;
  }
  if (time == null || time === 0) {
    // 不存在该字段或者字段值为0，永不过期
    return <>{getIn18Text('YONGBUGUOQI')}</>;
  }
  const targetDate = moment(time); // 目标日期
  // 一位数转换为2位数，只能转换2位以下的
  const digitOne2double = (data: number): string => {
    if (String(data).length < 2) {
      return `0${data}`;
    }
    return `${data}`;
  };
  if (targetDate.isValid()) {
    // 格式正确
    const currentDate = moment();
    // 已过期 红
    if (targetDate.diff(currentDate) < 0) {
      return <span className="expired">{getIn18Text('YIGUOQI')}</span>;
    }

    const totalMinute = targetDate.diff(currentDate) / (1000 * 60); // 剩余总分钟
    const restDays = Math.floor(totalMinute / (60 * 24)); // 剩余天数
    const restHours = Math.floor((totalMinute - restDays * 60 * 24) / 60); // 剩余小时
    const restMinute = Math.floor((totalMinute - restDays * 60 * 24) % 60); // 剩余分钟
    // 超过/等于1d
    if (restDays >= 1) {
      return <span className="over-1-day">{`${digitOne2double(restDays)}天${digitOne2double(restHours)}小时`}</span>;
    } else if (restHours >= 1) {
      // 大于等于1小时
      return <span className="in-1-day">{`${digitOne2double(restHours)}小时${digitOne2double(restMinute)}分钟`}</span>;
    } else {
      // 小于一小时
      return <span className="in-1-day">{`${digitOne2double(restMinute)}分钟`}</span>;
    }
  }
  return <></>; // 格式不正确不展示
};
