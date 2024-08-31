import React, { useState, useEffect } from 'react';
import { apiHolder, apis, TaskCenterApi, SystemTask, SystemTaskStatus, SystemTaskStatusName, SystemTasksReq, DataTrackerApi } from 'api';
import qs from 'querystring';
import { SiriusPageProps } from '@/components/Layout/model';
import { useLocation } from '@reach/router';
import { Tabs } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import OptionSeparator from '@web-common/components/UI/OptionSeparator';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

interface SystemTaskProps extends SiriusPageProps {}

type TabKey = 'ALL' | 'INCOMPLETE' | 'COMPLETE+CLOSE';

const TabKeyToTaskStatus: Record<TabKey, string> = {
  ALL: '',
  INCOMPLETE: SystemTaskStatus.INCOMPLETE,
  'COMPLETE+CLOSE': [SystemTaskStatus.COMPLETE, SystemTaskStatus.CLOSE].join(','),
};

const TabKeyToTrack: Record<TabKey, string> = {
  ALL: 'all',
  INCOMPLETE: 'todo',
  'COMPLETE+CLOSE': 'done',
};

const SystemTask: React.FC<SystemTaskProps> = props => {
  const location = useLocation();
  const { growRef, scrollY } = useResponsiveTable();
  const [tabKey, setTabKey] = useState<TabKey>('ALL');
  const [data, setData] = useState<SystemTask[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [totalTaskCount, setTotalTaskCount] = useState<number>(0);
  const [pendingTaskCount, setPendingTaskCount] = useState<number>(0);
  const [handledTaskCount, setHandledTaskCount] = useState<number>(0);

  const [params, setParams] = useState<Partial<SystemTasksReq>>({
    page: 1,
    pageSize: 20,
    moduleTypes: '',
    taskTypes: '',
    taskStatus: '',
  });

  const handleTabsChange = (nextTabKey: string) => {
    const nextTaskStatus = TabKeyToTaskStatus[nextTabKey as TabKey];

    setTabKey(nextTabKey as TabKey);
    setParams({
      ...params,
      page: 1,
      pageSize: 20,
      taskStatus: nextTaskStatus,
    });

    trackApi.track('waimao_my_task_tab', {
      tab: TabKeyToTrack[nextTabKey as TabKey],
    });
  };

  const handleSystemTaskFetch = () => {
    setFetching(true);

    taskCenterApi
      .getSystemTasks(params)
      .then(res => {
        setData(res.systemTaskList);
        setTotal(res.totalSize);
        setTotalTaskCount(res.totalTaskCount);
        setPendingTaskCount(res.pendingTaskCount);
        setHandledTaskCount(res.handledTaskCount);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const handleSystemTaskClose = (task: SystemTask) => {
    taskCenterApi
      .updateSystemTaskStatus({
        taskId: task.taskId,
        taskStatus: SystemTaskStatus.CLOSE,
      })
      .then(() => {
        handleSystemTaskFetch();
        taskCenterApi.sendSystemTaskCloseEvent(task);
      });
  };

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];

    if (moduleName === 'systemTask') {
      handleSystemTaskFetch();
    }
  }, [location.hash, params]);

  useEffect(() => {
    const queryString = location.hash.substring(1).split('?')[1];

    if (queryString) {
      const query = qs.parse(queryString);
      const { moduleType, taskType, bizId, bizContent } = query;

      if (moduleType && taskType && bizId && bizContent) {
        taskCenterApi.handleSystemTask({
          moduleType,
          taskType,
          bizId,
          bizContent,
        } as unknown as SystemTask);
      }
    }
  }, [location.hash]);

  const columns: ColumnsType<SystemTask> = [
    {
      dataIndex: 'taskName',
      title: getTransText('RENWUMINGCHENG'),
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      dataIndex: 'createAt',
      title: getTransText('CHUANGJIANSHIJIAN'),
      render: (timestamp: number) => commonDateUnitFormat(timestamp, 'precise'),
    },
    {
      dataIndex: 'taskStatus',
      title: getTransText('ZHUANGTAI'),
      render: (taskStatus: keyof SystemTaskStatus) => SystemTaskStatusName[taskStatus as SystemTaskStatus],
    },
  ];

  if (tabKey !== 'COMPLETE+CLOSE') {
    columns.push({
      dataIndex: 'options',
      title: getTransText('CAOZUO'),
      render: (_, task) => {
        if (task.taskStatus === SystemTaskStatus.INCOMPLETE) {
          return (
            <OptionSeparator>
              <span
                onClick={() => {
                  taskCenterApi.handleSystemTask(task);
                  trackApi.track('waimao_my_task_action', {
                    action: 'todo',
                  });
                }}
              >
                {getTransText('QUCHULI')}
              </span>
              <span
                onClick={() => {
                  handleSystemTaskClose(task);
                  trackApi.track('waimao_my_task_action', {
                    action: 'ignore',
                  });
                }}
              >
                {getTransText('HULVE')}
              </span>
            </OptionSeparator>
          );
        }

        return null;
      },
    });
  }

  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));

  // 系统任务邮件场景中间页
  const isMiddlePage = location.hash.includes('moduleType');

  if (isMiddlePage) return <div className="sirius-loading sirius-root-loading-edm" />;

  if (!visibleSystemTask) return <NoPermissionPage />;

  return (
    <div className={style.systemTask}>
      <div className={style.container}>
        <div className={style.header}>
          <div className={style.content}>
            <div className={style.title}>{getTransText('WODERENWU')}</div>
            <Tabs className={style.tabs} activeKey={tabKey} onChange={handleTabsChange}>
              <Tabs.TabPane disabled={fetching} key="ALL" tab={`${getTransText('QUANBURENWU')} (${totalTaskCount})`} />
              <Tabs.TabPane disabled={fetching} key="INCOMPLETE" tab={`${getTransText('DAICHULI')} (${pendingTaskCount})`} />
              <Tabs.TabPane disabled={fetching} key="COMPLETE+CLOSE" tab={`${getTransText('YICHULI')} (${handledTaskCount})`} />
            </Tabs>
          </div>
        </div>
        <div className={style.body}>
          <div className={style.content} ref={growRef}>
            <Table
              rowKey="taskId"
              scroll={{ y: scrollY }}
              loading={fetching}
              columns={columns}
              dataSource={data}
              pagination={{
                total,
                current: params.page,
                pageSize: params.pageSize,
                showTotal: total => `共 ${total} 条数据`,
                showQuickJumper: true,
                showSizeChanger: true,
                pageSizeOptions: ['20', '50', '100'],
                hideOnSinglePage: true,
              }}
              onChange={pagination => {
                setParams({
                  ...params,
                  pageSize: pagination.pageSize as number,
                  page: pagination.pageSize === params.pageSize ? (pagination.current as number) : 1,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTask;
