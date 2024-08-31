/*
 * @Author: your name
 * @Date: 2022-03-18 16:52:33
 * @LastEditTime: 2022-03-18 19:59:30
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/SendMail/utils.ts
 */
import { TaskMail, ReminderParam } from 'api';
import moment from 'moment';
import { getInsertReminders } from '@/components/Layout/Schedule/components/CreateBox/util';
import { ViewMail, TaskMailType } from '@/state/state';

export const dealTaskMail = (data: ViewMail) => {
  const { taskMail, entry } = data;
  const { nonEndDate, nonEndTime, enmuReminders, endTime, expireRemindEveryday: alert } = taskMail as TaskMailType;
  let type: 0 | 1 | 2 = nonEndTime ? 2 : 1;
  let alertTime = 0;
  let alertAt = 0;
  let deadline = 0;
  const executorList = data.receiver.filter(item => item.mailMemberType === 'to').map(item => item.contact.contact.accountId);
  const focusList = data.receiver.filter(item => item.mailMemberType === 'cc').map(item => item.contact.contact.accountId);
  if (nonEndDate) type = 0;
  if (enmuReminders !== undefined && !nonEndTime) {
    const { timeUnit, interval } = getInsertReminders(enmuReminders) as ReminderParam;
    switch (timeUnit) {
      case 1:
        alertTime = interval;
        break;
      case 2:
        alertTime = interval * 60;
        break;
      case 3:
        alertTime = 24 * 60;
        break;
      default:
        break;
    }
  }
  if (enmuReminders !== undefined && nonEndTime) {
    const { interval, time = { hr: 0 } } = getInsertReminders(enmuReminders) as ReminderParam;
    const hor = interval * 24;
    alertAt = (hor + time.hr) * 60 * 60;
  }
  if (!nonEndDate) {
    const time = moment(endTime);
    if (nonEndTime) {
      time.second(0).millisecond(0);
      time.hour(0).minutes(0);
    }
    deadline = time.unix();
  }

  data.task = {
    type,
    alertTime,
    alertAt,
    deadline,
    alert,
    title: entry.title,
    executorList,
    focusList,
  };
  return data;
};
