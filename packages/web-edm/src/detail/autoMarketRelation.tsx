import React, { useState, useEffect } from 'react';
import { Dropdown, Menu, Button, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import CaretUpOutlined from '@ant-design/icons/CaretUpOutlined';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import { apiHolder, apis, AutoMarketApi, AutoMarketEdmTaskItem, AutoMarketOpenStatus, AutoMarketOpenStatusName, EdmEmailInfo } from 'api';
import { navigate } from '@reach/router';
import { getTransText } from '@/components/util/translate';
import { edmDataTracker, EdmDetailOperateType } from '../tracker/tracker';
import classnames from 'classnames';
import style from './autoMarketRelation.module.scss';
import IconCard from '@web-common/components/UI/IconCard/index';
import { ruleEngine } from 'env_def';

const systemApi = apiHolder.api.getSystemApi();

interface Props {
  className?: string;
  data: EdmEmailInfo;
}

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
export const AutoMarketRelation: React.FC<Props> = props => {
  const [loading, setLoading] = useState(true);
  const [taskList, setTaskList] = useState<AutoMarketEdmTaskItem[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const jumpToAutoMarketing = (url: string) => {
    if (!systemApi.isElectron()) {
      if (systemApi.isWebWmEntry()) {
        systemApi.openNewWindow(ruleEngine(url, null));
      } else {
        navigate(url);
      }
    } else {
      navigate(url);
    }
  };

  async function getAutoMarketTask() {
    try {
      setLoading(true);
      setTaskList([]);
      const { edmEmailId } = props.data || {};
      const res = await autoMarketApi.getAutoMarketEdmTask(edmEmailId);
      setTaskList(res?.autoMarketTasks || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAutoMarketTask();
  }, [props.data]);

  const taskClick = (task: AutoMarketEdmTaskItem) => {
    if (task.taskStatus === AutoMarketOpenStatus.NEW) {
      jumpToAutoMarketing(`#edm?page=autoMarketTaskEdit&taskId=${task.taskId}`);
      return;
    }
    jumpToAutoMarketing(`#edm?page=autoMarketTaskDetail&taskId=${task.taskId}`);
  };

  const createAutoTask = () => {
    edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.CreatAutoJob);
    let backStr = `edm?page=detail&parent=true&owner=true&id=${props?.data?.edmEmailId}`;
    backStr = encodeURIComponent(backStr);
    jumpToAutoMarketing(`#edm?page=autoMarketTask&back=${backStr}&edmEmailId=${props?.data?.edmEmailId}`);
  };

  if (loading) {
    return (
      <div className={classnames(style.wrapper, props?.className || '')}>
        <span className={style.btnSpan}>
          <IconCard type="jichu_jiagou" style={{ marginRight: 5 }} />
          {getTransText('ZIDONGHUAYINGXIAO')}
        </span>
      </div>
    );
  }

  if (String(props?.data?.emailStatus) !== '2') {
    // 不是已发送状态
    return (
      <div className={classnames(style.wrapper, props?.className || '')}>
        <Tooltip title={getTransText('EdmAutomarketRelDisabled')}>
          <span className={style.btnSpan}>
            <IconCard type="jichu_jiagou" style={{ marginRight: 5 }} />
            {getTransText('ZIDONGHUAYINGXIAO')} ：<span className={style.btnSpanHover}>{getTransText('WEIKAIQI')}</span>
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={classnames(style.wrapper, props?.className || '')}>
      {taskList.length ? (
        <Dropdown
          overlay={
            <Menu>
              {taskList.map(task => (
                <Menu.Item key={task.taskId} onClick={() => taskClick(task)}>
                  <div className={style.menuItem}>
                    {task.taskName} : {AutoMarketOpenStatusName[task.taskStatus] || ''}
                  </div>
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['hover']}
          visible={dropdownVisible}
          onVisibleChange={open => setDropdownVisible(open)}
        >
          <span className={style.btnSpan}>
            <IconCard type="jichu_jiagou" style={{ marginRight: 5 }} />
            {getTransText('ZIDONGHUAYINGXIAO')}：<span className={style.btnSpanHover}>{getTransText('HasConfig')}</span>
            {dropdownVisible ? <CaretUpOutlined style={{ marginLeft: 5 }} /> : <CaretDownOutlined style={{ marginLeft: 5 }} />}
          </span>
        </Dropdown>
      ) : (
        <span className={style.btnSpan} onClick={createAutoTask}>
          <IconCard type="jichu_jiagou" style={{ marginRight: 5 }} />
          {getTransText('ZIDONGHUAYINGXIAO')}：<span className={style.btnSpanHover}>{getTransText('WEIKAIQI')}</span>
          <Tooltip title={getTransText('EdmDetailAutoTip')}>
            <QuestionCircleOutlined style={{ marginLeft: 5 }} />
          </Tooltip>
        </span>
      )}
    </div>
  );
};
