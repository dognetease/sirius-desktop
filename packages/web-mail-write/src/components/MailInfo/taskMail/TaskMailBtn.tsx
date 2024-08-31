/*
 * @Author: your name
 * @Date: 2022-03-09 15:45:24
 * @LastEditTime: 2022-03-21 11:18:18
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMailBtn.tsx
 */
import React, { useState, useImperativeHandle } from 'react';
import classnames from 'classnames';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, DataTrackerApi, apis } from 'api';
import moment from 'moment';
import { reminderOpts } from '@web-schedule/components/CreateBox/util';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import IconCard from '@web-common/components/UI/IconCard';
import TaskMailModal from './TaskMailModal';
import styles from '../mailInfo.module.scss';
import taskStyle from './taskMail.module.scss';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';

interface Props {
  hidden?: boolean;
  ref?: React.Ref<{
    click: () => void;
  }>;
}

export const initTaskMailState = () => {
  const cur = moment();
  cur.second(0).millisecond(0);
  let minutes = cur.minutes();
  minutes = Math.ceil(minutes / 15) * 15;
  cur.minutes(minutes);
  // 初始任务邮件内容
  const taskMail = {
    endDate: cur,
    endTime: cur.clone(),
    nonEndTime: false,
    nonEndDate: false,
    enmuReminders: reminderOpts(false)[0].value,
    expireRemindEveryday: true,
  };
  return taskMail;
};
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const TaskMailBtn = React.forwardRef((prop: Props, ref) => {
  const mailActions = useActions(MailActions);
  const [modalVisible, setModalVisible] = useState(false);
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail?.cid);
  const isMainAccount = curAccount?.isMainAccount; // 是主账号还是挂载账号
  const taskMailShow = infoStatus?.taskMailShow;
  const conferenceShow = infoStatus?.conferenceShow;
  const praiseMailShow = infoStatus?.praiseMailShow;
  const receiver = useAppSelector(state => state.mailReducer.currentMail.receiver);
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate);
  const clickTaskMail = () => {
    if (!isMainAccount) return;
    remWaittingId(currentMailId, true);
    trackApi.track('pcMail_click_addButton_writeMailPage', { buttonName: getIn18Text('RENWU') });
    if (scheduleDate) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('RENWUYOUJIANZAN'),
      });
      return;
    }
    if (receiver.some(item => item.mailMemberType === 'bcc')) {
      setModalVisible(true);
      return;
    }
    showTaskMail();
  };
  const showTaskMail = () => {
    const taskMail = initTaskMailState();
    mailActions.doTaskShow(true);
    mailActions.doTaskMailSetting(true);
    mailActions.doTaskMailChange(taskMail);
  };

  useImperativeHandle(ref, () => ({
    click: clickTaskMail,
  }));

  const content =
    prop.hidden || taskMailShow || conferenceShow || praiseMailShow ? null : (
      <div
        className={classnames(styles.btnWrapper, taskStyle.btnWrapper, { [styles.disabled]: !isMainAccount })}
        onClick={() => {
          clickTaskMail();
        }}
      >
        <span className={styles.btnIcon}>
          <IconCard type="taskMail" />
        </span>
        <span className={styles.btnText}>{getIn18Text('RENWU')}</span>
      </div>
    );
  return (
    <>
      {content}
      <TaskMailModal isModalVisible={modalVisible} setIsModalVisible={setModalVisible} showTaskMail={showTaskMail} />
    </>
  );
});
export default TaskMailBtn;
