import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, TaskCenterApi, SystemTask, SystemTaskStatus, DataTrackerApi, ErrorReportApi, api } from 'api';
import { ConfigProvider } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { WorktableCard } from '../card';
import { navigate } from '@reach/router';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import OptionSeparator from '@web-common/components/UI/OptionSeparator';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { getTransText } from '@/components/util/translate';
import NoDataIcon from '../icons/NoData';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import style from './index.module.scss';

const eventApi = apiHolder.api.getEventApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;
const errorReportApi: ErrorReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;

const PAGE_SIZE = 30;

const renderEmpty = () => {
  return (
    <div className={style.empty}>
      <NoDataIcon />
      <div className={style.emptyText}>{getTransText('ZANWUSHUJU')}</div>
    </div>
  );
};

interface SystemTaskCardProps {}

const SystemTaskCard: React.FC<SystemTaskCardProps> = () => {
  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [bottomLoading, setBottomLoading] = useState<boolean>(false);
  const [bottomHasMore, setBottomHasMore] = useState<boolean>(false);
  const [tasks, setTasks] = useState<SystemTask[]>([]);
  const [taskCount, setTaskCount] = useState<number>(0);
  const tableBodyRef = useRef<HTMLDivElement | null>(null);

  const handleSystemTasksInitFetch = (id?: number) => {
    setLoading(true);
    taskCenterApi
      .getSystemTasks({
        lastId: -1,
        pageSize: PAGE_SIZE,
        moduleTypes: '',
        taskTypes: '',
        taskStatus: SystemTaskStatus.INCOMPLETE,
      })
      .then(res => {
        setTasks(res.systemTaskList);
        setTaskCount(res.filterTaskCount);
        setBottomHasMore(res.totalPage > 1);
        if (id) errorReportApi.endTransaction({ id });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSystemTaskClose = (task: SystemTask) => {
    taskCenterApi
      .updateSystemTaskStatus({
        taskId: task.taskId,
        taskStatus: SystemTaskStatus.CLOSE,
      })
      .then(() => {
        taskCenterApi.sendSystemTaskCloseEvent(task);
      });
  };

  useEffect(() => {
    const id = errorReportApi.startTransaction({
      name: 'worktable_sysTasks_init',
      op: 'loaded',
    });
    handleSystemTasksInitFetch(id);
  }, []);

  useEffect(() => {
    tableBodyRef.current = document.querySelector(`.${style.table} .ant-table-body`);
  }, []);

  useEffect(() => {
    if (tableBodyRef.current) {
      const scrollHandler: React.MouseEventHandler = event => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        const reachBottom = clientHeight === scrollHeight - scrollTop;

        if (reachBottom && bottomHasMore && !bottomLoading && tasks.length) {
          const lastId = tasks[tasks.length - 1].id;

          setBottomLoading(true);

          taskCenterApi
            .getSystemTasks({
              lastId,
              pageSize: PAGE_SIZE,
              moduleTypes: '',
              taskTypes: '',
              taskStatus: SystemTaskStatus.INCOMPLETE,
            })
            .then(res => {
              setTasks([...tasks, ...res.systemTaskList]);
              setTaskCount(res.filterTaskCount);
              setBottomHasMore(res.totalPage > 1);
            })
            .finally(() => {
              setBottomLoading(false);
            });
        }
      };

      tableBodyRef.current.addEventListener('scroll', scrollHandler as unknown as EventListener);

      return () => {
        tableBodyRef.current?.removeEventListener('scroll', scrollHandler as unknown as EventListener);
      };
    } else {
      return () => {};
    }
  }, [tableBodyRef.current, bottomHasMore, bottomLoading, tasks]);

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
      dataIndex: 'options',
      title: getTransText('CAOZUO'),
      render: (_, task) => {
        return (
          <OptionSeparator>
            <span
              onClick={() => {
                taskCenterApi.handleSystemTask(task);
                trackApi.track('waimao_worktable_todo_my_task_operation', {
                  action: 'todo',
                });
              }}
            >
              {getTransText('QUCHULI')}
            </span>
            <span
              onClick={() => {
                handleSystemTaskClose(task);
                trackApi.track('waimao_worktable_todo_my_task_operation', {
                  action: 'ignore',
                });
              }}
            >
              {getTransText('HULVE')}
            </span>
          </OptionSeparator>
        );
      },
    },
  ];

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('SystemTaskStatusUpdate', {
      func: event => {
        const data = event.eventData || {};
        const { taskId, taskStatus } = data;

        if ([SystemTaskStatus.COMPLETE, SystemTaskStatus.CLOSE].includes(taskStatus)) {
          const filterItem = tasks.find(item => item.taskId === taskId);

          if (filterItem) {
            setTasks(tasks.filter(item => item !== filterItem));
            setTaskCount(Math.max(taskCount - 1, 0));
          }
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('SystemTaskStatusUpdate', id);
    };
  }, [tasks, taskCount]);

  return (
    <WorktableCard
      title={`${getTransText('DAICHULIRENWU')} (${taskCount})`}
      loading={loading || updating}
      headerToolsConfig={[
        {
          tools: (
            <Button
              btnType="minorLine"
              onClick={() => {
                if (visibleSystemTask) {
                  navigate('#systemTask?page=systemTask');
                } else {
                  Message.error({ content: getTransText('ZANWUQUANQINGLIANXIGUANLIYUANKAITONG') });
                }
                trackApi.track('waimao_worktable_todo_my_task_operation', {
                  action: 'view_all',
                });
              }}
            >
              {getTransText('QUANBURENWU')}
            </Button>
          ),
        },
        {
          onRefresh: () => {
            setTasks([]);
            setTaskCount(0);
            setBottomHasMore(false);
            handleSystemTasksInitFetch();
          },
        },
      ]}
    >
      <div className={style.tableWrapper}>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            className={classnames(style.table, {
              [style.tableBottomLoading]: bottomLoading,
            })}
            rowKey={''}
            scroll={{ y: 138 }}
            columns={columns}
            dataSource={tasks}
            pagination={false}
          />
        </ConfigProvider>
      </div>
    </WorktableCard>
  );
};

export default SystemTaskCard;
