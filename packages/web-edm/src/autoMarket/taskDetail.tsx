import React from 'react';
import { Breadcrumb } from 'antd';
import { navigate } from '@reach/router';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import TaskBasicInfo from './taskBasicInfo';
import TaskStats from './taskStats';
import style from './taskDetail.module.scss';
import { getIn18Text } from 'api';
const TaskDetail = () => (
  <div className={style.container}>
    <Breadcrumb className={style.breadcrumb} separator=">">
      <Breadcrumb.Item>
        <span onClick={() => navigate('#edm?page=autoMarketTask')}>{getIn18Text('ZIDONGHUAYINGXIAO')}</span>
      </Breadcrumb.Item>
      <Breadcrumb.Item>{getIn18Text('YINGXIAONEIRONGXIANGQING')}</Breadcrumb.Item>
    </Breadcrumb>
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_SENDBOX">
      <TaskBasicInfo />
      <TaskStats />
    </PermissionCheckPage>
  </div>
);
export default TaskDetail;
