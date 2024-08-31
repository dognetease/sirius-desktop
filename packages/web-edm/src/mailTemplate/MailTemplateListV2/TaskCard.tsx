import React, { FC } from 'react';
import { apiHolder, GetTaskBriefRes } from 'api';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import { message, Popover } from 'antd';
import Button from '@web-common/components/UI/Button';
import UnionIcon from '@/images/icons/edm/union-icon.svg';

import { handlePreviewImage } from '../../utils';
import styles from './MailTemplateListV2.module.scss';
import { getTaskContent } from './template-util';
import { setTemplateContent } from '../template-util';
import { edmDataTracker } from '../../tracker/tracker';

const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

export const TaskCard: FC<{
  task: GetTaskBriefRes['tasks'][number];
  addNewTemplate?: (content?: string) => Promise<void>;
  isFormWrite?: boolean;
  onUse?: (templateId?: string, content?: string) => void;
  isFromModal?: boolean;
}> = ({ task, addNewTemplate, isFormWrite, onUse, isFromModal }) => {
  const useTaskAsTemplate = async (id: string) => {
    try {
      const content = await getTaskContent(id);
      if (isFormWrite && !isFromModal) {
        onUse && onUse('', content);
      } else {
        // 这是邮件模板的跳转
        setTemplateContent(content);
        navigate(`${routerWord}?page=write&from=template`);
      }
    } catch (err) {
      message.error('获取任务详情失败，请稍后重试！');
    }
  };

  const saveTaskAsTemplate = async (id: string) => {
    edmDataTracker.templatePageOp('save', 'task');
    try {
      const content = await getTaskContent(id);
      // 这是邮件模板的跳转
      addNewTemplate && addNewTemplate(content);
    } catch (err) {
      message.error('获取任务详情失败，请稍后重试！');
    }
  };

  const renderImg = () => {
    const images = (task.thumbnail || '').split(',');
    return <img src={images[1] ?? images[0]} alt="" />;
  };

  const renderCardOp = () => {
    if (isFromModal) {
      return (
        <Button
          className={classnames(styles.templateBtn, styles.templateBtn2)}
          style={{
            width: 74,
            height: 28,
          }}
          // type="primary"
          btnType="primary"
          onClick={() => useTaskAsTemplate(task.edmEmailId)}
        >
          使用
        </Button>
      );
    }
    return (
      <>
        <Popover
          title={null}
          trigger="click"
          getPopupContainer={node => node}
          placement="topLeft"
          content={
            <>
              <div className={styles.popoverContent}>
                <div className={classnames(styles.popoverBtn)} onClick={() => saveTaskAsTemplate(task.edmEmailId)}>
                  保存为个人模板
                </div>
              </div>
            </>
          }
        >
          <div className={styles.popoverWrap}>
            <img src={UnionIcon} alt="" />
          </div>
        </Popover>
        {!isFormWrite && (
          <Button
            className={styles.templateBtn}
            style={{
              width: 74,
              height: 28,
            }}
            onClick={() => {
              edmDataTracker.templatePageOp('viewTask', 'task');
              navigate(`${routerWord}?page=index&detailId=${task.edmEmailId}`);
            }}
            btnType="minorLine"
          >
            查看任务
          </Button>
        )}
        <Button
          className={styles.templateBtn}
          style={{
            width: 74,
            height: 28,
          }}
          // type="primary"
          btnType="primary"
          onClick={() => useTaskAsTemplate(task.edmEmailId)}
        >
          使用
        </Button>
      </>
    );
  };

  return (
    <div className={styles.taskItem}>
      <div className={classnames(styles.taskCard, isFormWrite ? styles.taskCardMin : '')}>
        <div className={classnames(styles.taskCardTitle, styles.ellipsis)}>{task.edmSubject}</div>
        <div
          className={styles.taskCardImg}
          onClick={() => {
            edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
              type: 'preview',
            });
            handlePreviewImage(task.thumbnail, task.edmSubject);
          }}
        >
          {renderImg()}
        </div>
        <div className={styles.labels}>
          {task.readRatio != null && <div className={styles.labelItem}>打开率: {task.readRatio}</div>}
          {task.replyRatio != null && <div className={styles.labelItem}>回复率: {task.replyRatio}</div>}
        </div>
        <div className={classnames(styles.cardOp, isFormWrite ? styles.cardOpMin : '')}>{renderCardOp()}</div>
      </div>
      <div className={styles.taskTime}>创建时间：{task.createTime}</div>
    </div>
  );
};
