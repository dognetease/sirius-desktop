import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from 'antd';

import Button from '@lingxi-common-component/sirius-ui/Button';
import { navigate } from '@reach/router';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { removeNewbieTask } from '@web-common/state/reducer/notificationReducer';
import styles from './style.module.scss';

export const LastClosedDate = 'NewbieTaskLastClosedDate';
interface NewbieTaskProps {}

const NewbieTask: React.FC<NewbieTaskProps> = () => {
  const dispatch = useAppDispatch();
  const newbieTask = useAppSelector(state => state.notificationReducer.newbieTask);

  const onClose = () => {
    dispatch(removeNewbieTask());
    localStorage.setItem(LastClosedDate, new Date().toDateString());
  };

  const goNewbieTaskPage = () => {
    dispatch(removeNewbieTask());
    localStorage.setItem(LastClosedDate, new Date().toDateString());
    navigate('#noviceTask?page=noviceTask');
  };

  // 是否超过提示时间（7 天）
  const isOversize7day = useMemo(() => {
    const lastClosedDate = localStorage.getItem(LastClosedDate);
    if (lastClosedDate) {
      if (new Date().getTime() - new Date(lastClosedDate).getTime() > 7 * 24 * 60 * 60 * 1000) {
        return true;
      }
    }
    return false;
  }, []);

  const showModal = useMemo(() => {
    const lastClosedDate = localStorage.getItem(LastClosedDate);
    return Boolean(newbieTask) && (!lastClosedDate || isOversize7day);
  }, [newbieTask]);

  return (
    <Modal maskStyle={{ left: 0 }} maskClosable={false} className={styles.modal} visible={showModal} footer={null} onCancel={onClose} centered>
      <div className={styles.content}>
        {isOversize7day ? '继续完成新手任务，开启全新的外贸获客营销管理之路' : '🎉 欢迎来到外贸通！专属新手任务帮你快速上手，即刻开启新手旅程~'}
      </div>
      <div className={styles.action}>
        <Button btnType="primary" onClick={goNewbieTaskPage}>
          {isOversize7day ? '继续了解' : '现在就去'}
        </Button>
      </div>
    </Modal>
  );
};

export default NewbieTask;
