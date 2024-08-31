import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import { FreeBusyModel } from 'api';

// 整理非全天，非跨天日程信息 ,计算right和left
export const transfer = (arr: any[], cellHeight: number) => {
  // 如果空数组，直接返回数组
  if (!arr.length) return [];
  // 去掉跨天和全天的日程
  const notAllDayOrCrossEvents = arr.filter(e => !isAlldayOrCrossEvent(e));
  const events = cloneDeep(notAllDayOrCrossEvents);
  if (!events.length) return [];
  // timeObj key：开始时间，value：相关日程
  const timeObj = {};
  events.forEach(e => {
    // 计算top
    const dayStart = moment(e.start).startOf('day');
    let top = moment(e.start).diff(dayStart, 'hour', true) * cellHeight;
    // 计算height
    const height = moment(e.end).diff(moment(e.start), 'hour', true) * cellHeight;
    // 计算参与计算的结束时间
    const belowHalf = moment(e.start).clone().add(30, 'minute').isAfter(moment(e.end));
    // 赋值返回
    e.top = top;
    // 最小高度半小时高度
    e.height = height < cellHeight / 2 ? cellHeight / 2 : height;
    e.fakeEnd = belowHalf ? +e.start + 1000 * 60 * 30 : e.end;
    // 按照开始时间存储
    if (!timeObj[e.start]) {
      timeObj[e.start] = [e];
    } else {
      timeObj[e.start].push(e);
    }
  });
  // 时间相关的日程
  Object.keys(timeObj).forEach(key => {
    const linkEvents = events.filter(e => key > e.start && key < e.fakeEnd);
    timeObj[key] = eventsSort([...timeObj[key], ...linkEvents]);
  });
  Object.keys(timeObj)
    .sort((a, b) => a - b)
    .forEach((key, index) => {
      const sortArr = timeObj[key];
      sortArr.forEach(e => {
        const item = parseFloat((100 / sortArr.length).toFixed(4));
        const width = e.width;
        if (!width) {
          e.width = item;
          e.minWidthArr = [item];
        } else if (width > item) {
          e.width = item;
          e.minWidthArr.push(item);
        }
      });
    });
  Object.keys(timeObj)
    .sort((a, b) => a - b)
    .forEach(key => {
      const sortArr = timeObj[key];
      // 等待放大
      const waitEvents: any[] = [];
      // 确定使用了的宽度
      let usedWidth = 0;
      sortArr.forEach((e, idx) => {
        if (e.minWidthArr.length === 1) {
          // 查看宽度是否放大过,没有放大则放大
          if (e.width === e.minWidthArr[0]) {
            waitEvents.push(e);
          } else if (e.width > e.minWidthArr[0]) {
            // 已经放大过了
            usedWidth += e.width;
          }
        } else if (e.minWidthArr.length > 1) {
          e.width = Math.min(...e.minWidthArr);
          usedWidth += e.width;
        }
      });
      // 剩余的宽度
      const leftWidth = 100 - usedWidth;
      if (waitEvents.length) {
        const aveWidth = parseFloat((leftWidth / waitEvents.length).toFixed(4));
        waitEvents.forEach(e => {
          e.width = aveWidth;
        });
      }
    });
  Object.keys(timeObj)
    .sort((a, b) => a - b)
    .forEach(key => {
      const sortArr = timeObj[key];
      sortArr.forEach((e, idx) => {
        if (e.width === 100) {
          e.left = 0;
          e.right = 0;
        } else if (!e.left && !e.right) {
          const [realLeft, realRight] = getLeft(sortArr, e);
          e.left = realLeft;
          e.right = realRight;
        }
      });
    });
  return events;
};

// 根据区间获取左右值
const getLeft = (sortArr: any[], event: { width: any }) => {
  const width = event.width;
  // 获取已经使用的区间
  const usedArr: number[][] = [];
  sortArr.forEach(e => {
    if (e.left || e.right) {
      usedArr.push([parseFloat(e.left.toFixed(4)), parseFloat((100 - e.right).toFixed(4))]);
    }
  });
  // 如果都没有使用
  let left = 0;
  let right = parseFloat((100 - width).toFixed(4));
  if (!usedArr.length) {
    return [left, right];
  }
  // 获取可以使用的区间
  const arr = usedArr.sort((a, b) => a[0] - b[0]);
  const canUseArr = [];
  if (arr[0][0] > 0) {
    canUseArr.push([0, arr[0][0]]);
  }
  if (Math.ceil(arr[arr.length - 1][1]) < 100) {
    canUseArr.push([arr[arr.length - 1][1], 100]);
  }
  if (arr.length > 1) {
    for (let idx = 1; idx < arr.length; idx++) {
      const start = arr[idx - 1][1];
      const end = arr[idx][0];
      canUseArr.push([start, end]);
    }
  }
  let fitArr = [0, 100];
  canUseArr
    .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
    .forEach((a, index) => {
      if (index === 0) {
        fitArr = a;
      }
      if (parseFloat((a[1] - a[0]).toFixed()) >= parseFloat(width.toFixed())) {
        fitArr = a;
      }
    });
  if (parseFloat((fitArr[1] - fitArr[0]).toFixed()) >= parseFloat(width.toFixed())) {
    left = fitArr[0];
    right = parseFloat((100 - fitArr[0] - width).toFixed(4));
  } else {
    left = fitArr[0];
    right = parseFloat((100 - fitArr[1]).toFixed(4));
  }
  right = right < 0 ? 0 : right;
  event.width = parseFloat((100 - left - right).toFixed(4));
  return [left, right];
};

// 日程排序
const eventsSort = events => {
  // 按照开始时间排序
  return events.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    } else {
      if (a.end !== b.end) {
        return b.end - a.end;
      } else {
        return a.summary - b.summary;
      }
    }
  });
};

// 请求返回的日程按照入参的顺序，排序一下
export const sortByUser = (res: FreeBusyModel[], users: any[]) => {
  const result: FreeBusyModel[] = [];
  users.forEach(user => {
    const item = res.find(i => i?.account?.extDesc === user);
    if (item) {
      result.push(item);
    }
  });
  return result;
};

// 全天或者跨天日程，判断函数
export const isAlldayOrCrossEvent = e => {
  // 如果全天
  if (+e.allDay) {
    return true;
  } else if (moment(e.start).isSame(moment(e.end), 'day')) {
    return false;
  } else {
    if (moment(e.start).clone().add(1, 'day').isSame(moment(e.end), 'day') && moment(e.end).hour() === 0 && moment(e.end).minute() === 0) {
      return false;
    } else {
      return true;
    }
  }
};
