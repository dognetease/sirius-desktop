/* eslint-disable global-require */
/*
 * @Author: your name
 * @Date: 2022-03-10 10:58:15
 * @LastEditTime: 2022-03-21 11:34:41
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMailDesc.tsx
 */
import React from 'react';
import classnames from 'classnames';
import moment from 'moment';
import styles from '../mailInfo.module.scss';
import { TaskMailType } from '@web-common/state/state';
import { reminderOpts } from '@web-schedule/components/CreateBox/util';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const taskMailDate = (taskMailState: TaskMailType) => {
  const { endDate, endTime, nonEndTime } = taskMailState;
  const endYYYY = moment(endDate).format(getIn18Text('YYYYNIAN@'));
  const endMMMdo = moment(endDate).format(getIn18Text('MMYUEDD'));
  const endClock = moment(endTime).format('LT');
  let res = `${endYYYY}${endMMMdo}`;
  if (!nonEndTime) {
    res += ` ${endClock}`;
  }
  return res;
};
const TaskMailDesc: React.FC = () => {
  const taskMailState = useAppSelector(state => state.mailReducer.currentMail.taskMail);
  if (!taskMailState) return null;
  const { expireRemindEveryday, enmuReminders, nonEndDate, nonEndTime } = taskMailState as TaskMailType;
  const date = taskMailDate(taskMailState);
  const reminderDesc = reminderOpts(nonEndTime).find(i => i.value === enmuReminders)?.label;
  const expireRemind = expireRemindEveryday ? getIn18Text('YUQIHOUMEITIAN11') : null;
  return nonEndDate ? (
    <span>{getIn18Text('CIRENWUWUJIE')}</span>
  ) : (
    <>
      <span className={classnames(styles.descItem)}>
        <img className={classnames(styles.conferenceDescIcon)} src={require('@/images/icons/calendarDetail/clock.png')} alt="" />
        {date}
        {getIn18Text('JIEZHI')}
      </span>
      <span className={classnames(styles.descItem)}>
        {reminderDesc && <img className={classnames(styles.conferenceDescIcon)} src={require('@/images/icons/calendarDetail/bell.png')} alt="" />}
        {reminderDesc}
        {reminderDesc && expireRemind && ' | '}
        {expireRemind}
      </span>
    </>
  );
};
export default TaskMailDesc;
