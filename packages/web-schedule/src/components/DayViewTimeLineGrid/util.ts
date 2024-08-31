import { FreeBusyModel } from 'api';
import moment, { Moment } from 'moment';
import { rangeInteract } from '../TimeLinePicker/util';

// 形成整点时间
export const fixNumber = (num: number) => {
  return `${num < 10 ? '0' : ''}${num}:00`;
};

// 根据忙闲状态排序，默认第一个为创建者，然后忙碌，然后空闲
export const sortByFreeBusy = (formStart: Moment | null, formEnd: Moment | null, userFreeBusyNotSort: FreeBusyModel[]) => {
  if (userFreeBusyNotSort && userFreeBusyNotSort.length > 1) {
    const first = userFreeBusyNotSort[0];
    const busyArr: FreeBusyModel[] = [];
    const freeArr: FreeBusyModel[] = [];
    userFreeBusyNotSort.forEach((item, idx) => {
      if (idx) {
        let busy = false;
        if (formStart && formEnd) {
          for (let i = 0; i < item.freeBusyItems.length; i++) {
            const element = item.freeBusyItems[i];
            busy = rangeInteract([moment(element.start), moment(element.end)], [formStart, formEnd]) !== null;
            if (busy) {
              break;
            }
          }
        }
        if (busy) {
          busyArr.push(item);
        } else {
          freeArr.push(item);
        }
      }
    });
    return [first, ...busyArr, ...freeArr];
  } else {
    return userFreeBusyNotSort;
  }
};
