/*
 * @Author: your name
 * @Date: 2022-03-10 10:48:23
 * @LastEditTime: 2022-03-21 11:13:15
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMail.tsx
 */
import React, { useEffect } from 'react';
import { Modal } from 'antd';
import classnames from 'classnames';
import styles from '../mailInfo.module.scss';
import IconCard from '@web-common/components/UI/IconCard/index';
import TaskSetting from './TaskSetting';
import TaskDesc from './TaskMailDesc';
import { MailActions, useAppSelector, useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';
interface Props {
  setVisible: (val) => void;
  visible: boolean;
}
const Task: React.FC<Props> = props => {
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const mailActions = useActions(MailActions);
  const taskShow = infoStatus?.taskMailShow;
  const taskSetting = infoStatus?.taskMailSetting;
  useEffect(() => {
    if (curAccount && !curAccount.isMainAccount && taskShow) {
      // 挂载账号下不支持任务邮件
      deleteConfConfirm();
    }
  }, [curAccount]);

  const deleteConfConfirm = () => {
    mailActions.doTaskShow(false);
    mailActions.doTaskMailSetting(false);
    mailActions.doReplaceReceiver([]);
  };
  const deleteTaskMail = e => {
    remWaittingId(currentMailId, true);
    e.stopPropagation();
    Modal.confirm({
      okButtonProps: { danger: true, type: 'default' },
      title: getIn18Text('QUEDINGSHANCHUREN'),
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: deleteConfConfirm,
      width: 448,
      className: 'im-team',
      centered: true,
    });
  };
  const showSetting = () => {
    mailActions.doTaskMailSetting(true);
  };
  const set = taskShow ? (
    <div className={classnames([styles.infoItem])} onClick={showSetting}>
      <span className={styles.infoLabel}>{getIn18Text('SHIJIAN')}</span>
      <span className={styles.colonLabel}>:</span>
      <div className={classnames([styles.conferenceTime, styles.conferenceTimeDesc])}>
        <TaskDesc />
      </div>
      <div className={classnames([styles.btnBox, styles.closeBtn])}>
        <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deleteTaskMail}>
          <IconCard className="dark-invert" type="close" />
        </span>
      </div>
    </div>
  ) : null;
  return (
    <div className={classnames([styles.guideCardWrapper])}>
      <div className={classnames([styles.conferenceWrap])} style={{ height: taskShow ? 'auto' : 0 }}>
        <div hidden={!taskSetting}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <TaskSetting deleteTaskMail={deleteTaskMail} {...props} />
        </div>
        <div hidden={taskSetting}>{set}</div>
      </div>
    </div>
  );
};
export default Task;
