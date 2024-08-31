import React, { useState, useEffect } from 'react';
import { apiHolder, apis, AutoMarketApi, GroupAutoMarketTask, AutoMarketTaskType, AutoMarketTaskTypeName, AutoMarketOpenStatus, AutoMarketOpenStatusName } from 'api';
import { Tag, Dropdown, Menu } from 'antd';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { getTransText } from '@/components/util/translate';
import { ReactComponent as HolidayGreetingIcon } from '@/images/icons/edm/autoMarket/holidayGreeting.svg';
import { ReactComponent as PotentialContactIcon } from '@/images/icons/edm/autoMarket/potentialContact.svg';
// import { ReactComponent as PreviousContactIcon } from '@/images/icons/edm/autoMarket/previousContact.svg';
import MoreActionIcon from '@/components/UI/Icons/svgs/MoreAction';
import classnames from 'classnames';
import style from './automarketCard.module.scss';
import { jumpToAutoMarketing } from './../../../autoMarket/utils';
import { getIn18Text } from 'api';

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;

interface Props {
  data: GroupAutoMarketTask;
  onDelete?: Function;
}

enum TaskOperate {
  Close = 'Close',
  Open = 'Open',
  Detail = 'Detail',
  Del = 'Del',
  Edit = 'Edit',
}

export const AutoMarketCard: React.FC<Props> = ({ data, onDelete }) => {
  const [taskData, setTaskData] = useState(data);

  useEffect(() => {
    setTaskData(data);
  }, [data]);

  function renderTaskType() {
    const text = AutoMarketTaskTypeName[taskData.taskType];
    const className = taskData.taskType === AutoMarketTaskType.HOLIDAY_GREETING ? style.taskTypeHol : style.taskTypeNew;
    return <Tag className={classnames(className, style.taskStateTag)}>{text}</Tag>;
  }

  function renderTaskState() {
    const text = AutoMarketOpenStatusName[taskData.taskStatus];
    let className = '';
    switch (taskData.taskStatus) {
      case AutoMarketOpenStatus.CLOSED:
        className = style.taskStatusClose;
        break;
      case AutoMarketOpenStatus.NEW:
        className = style.taskStatusNew;
        break;

      case AutoMarketOpenStatus.OPEN:
        className = style.taskStatusOpen;
        break;
    }
    return <Tag className={classnames(className)}>{text}</Tag>;
  }

  const taskOperate = async (key: string) => {
    switch (key) {
      case TaskOperate.Detail:
        jumpToAutoMarketing(`#edm?page=autoMarketTaskDetail&taskId=${data.taskId}`);
        return;
      case TaskOperate.Edit:
        jumpToAutoMarketing(`#edm?page=autoMarketTaskEdit&taskId=${data.taskId}`);
        return;
      case TaskOperate.Open:
        await autoMarketApi.updateTaskStatus({
          taskId: data.taskId,
          taskStatus: AutoMarketOpenStatus.OPEN,
        });
        setTaskData({ ...taskData, taskStatus: AutoMarketOpenStatus.OPEN });
        break;

      case TaskOperate.Close:
        await autoMarketApi.updateTaskStatus({
          taskId: data.taskId,
          taskStatus: AutoMarketOpenStatus.CLOSED,
        });
        setTaskData({ ...taskData, taskStatus: AutoMarketOpenStatus.CLOSED });
        break;

      case TaskOperate.Del:
        ShowConfirm({
          title: getIn18Text('QUEDINGSHANCHU\uFF1F'),
          type: 'danger',
          okText: getIn18Text('SHANCHU'),
          cancelText: getIn18Text('QUXIAO'),
          makeSure: async () => {
            await autoMarketApi.deleteTaskDetail({ taskId: data.taskId });
            onDelete && onDelete();
          },
        });
        break;
    }
  };

  return (
    <div className={style.cardWrapper}>
      <div className={style.execTag}>
        {getTransText('YIZHIXING1')}
        <span className={style.number}>{taskData.triggerCount}</span>
        {getTransText('YIZHIXING2')}
      </div>
      <div className={style.icon}>{taskData.taskType === AutoMarketTaskType.HOLIDAY_GREETING ? <HolidayGreetingIcon /> : <PotentialContactIcon />}</div>
      <div className={style.content}>
        <div className={style.head}>
          <div className={style.headContent}>
            <div className={classnames(style.taskName, style.ellipsis)} title={taskData.taskName}>
              {taskData.taskName}
            </div>
          </div>
          <Dropdown
            overlay={
              <Menu onClick={({ key }) => taskOperate(key)}>
                {taskData.taskStatus === AutoMarketOpenStatus.OPEN ? (
                  <Menu.Item key={TaskOperate.Close}>
                    <div className={style.menuItem}>{getTransText('GUANBI')}</div>
                  </Menu.Item>
                ) : (
                  ''
                )}
                {taskData.taskStatus === AutoMarketOpenStatus.NEW ? (
                  <Menu.Item key={TaskOperate.Edit}>
                    <div className={style.menuItem}>{getTransText('BIANJI')}</div>
                  </Menu.Item>
                ) : (
                  ''
                )}
                {taskData.taskStatus === AutoMarketOpenStatus.NEW ? (
                  <Menu.Item key={TaskOperate.Del}>
                    <div className={style.menuItem}>{getTransText('SHANCHU')}</div>
                  </Menu.Item>
                ) : (
                  ''
                )}
                {taskData.taskStatus === AutoMarketOpenStatus.CLOSED ? (
                  <Menu.Item key={TaskOperate.Open}>
                    <div className={style.menuItem}>{getTransText('KAIQI')}</div>
                  </Menu.Item>
                ) : (
                  ''
                )}
                {taskData.taskStatus !== AutoMarketOpenStatus.NEW ? (
                  <Menu.Item key={TaskOperate.Detail}>
                    <div className={style.menuItem}>{getTransText('CHAKANXIANGQING')}</div>
                  </Menu.Item>
                ) : (
                  ''
                )}
              </Menu>
            }
          >
            <div className={style.showMore}>
              <MoreActionIcon />
            </div>
          </Dropdown>
        </div>
        <div className={style.trigger}>
          {renderTaskType()}
          {renderTaskState()}
        </div>
      </div>
    </div>
  );
};
