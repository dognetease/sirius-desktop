import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from 'antd';
import debounce from 'lodash/debounce';
import { apiHolder, apis, TaskCenterApi, SystemTask, SystemTaskStatus, DataTrackerApi } from 'api';
import { navigate } from '@reach/router';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import OptionSeparator from '@web-common/components/UI/OptionSeparator';
import { ReactComponent as SystemTaskIcon } from '@/images/icons/edm/taskCenter/system-task-icon.svg';
import NoDataIcon from '@web-common/images/icons/no_data.png';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';
import { bus } from '@web-common/utils/bus';
import { TaskActions } from '@web-common/state/reducer/taskReducer';
import { useActions } from '@web-common/state/createStore';

const eventApi = apiHolder.api.getEventApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

const PAGE_SIZE = 30;

declare type getContainerFunc = () => HTMLElement;

interface SystemTaskEntryProps {
  moduleName: string;
  moduleTypes: string[];
  showIcon?: boolean;
  openTask?: boolean;
  getDrawerContainer?: string | HTMLElement | getContainerFunc | false;
}

const FETCH_DELAY = 2 * 60 * 1000; // 相同参数，每隔 2min 做一次请求

const SystemTaskEntry: React.FC<SystemTaskEntryProps> = props => {
  const { moduleName, moduleTypes, getDrawerContainer, showIcon = true, openTask = false } = props;
  const [visible, setVisible] = useState(false);
  const [bottomLoading, setBottomLoading] = useState(false);
  const [bottomHasMore, setBottomHasMore] = useState<boolean>(false);
  const [tasks, setTasks] = useState<SystemTask[]>([]);
  const [taskCount, setTaskCount] = useState<number>(0);
  const latestModuleTypes = useRef<string | null>(null);
  const latestFetchTime = useRef<number>(0);

  const handleSystemTasksInitFetch = () => {
    const fetchTime = Date.now();
    const moduleTypesStr = moduleTypes.join(',');

    // 减少重复请求:
    // 当模块类型变化后, 或距离相同模块类型请求超过了 2min 后, 再发起请求
    if (moduleTypesStr !== latestModuleTypes.current || fetchTime - latestFetchTime.current > FETCH_DELAY) {
      latestFetchTime.current = fetchTime;
      latestModuleTypes.current = moduleTypesStr;
      taskCenterApi
        .getSystemTasks({
          lastId: -1,
          pageSize: PAGE_SIZE,
          moduleTypes: moduleTypesStr,
          taskTypes: '',
          taskStatus: SystemTaskStatus.INCOMPLETE,
        })
        .then(res => {
          if (fetchTime === latestFetchTime.current) {
            setTasks(res.systemTaskList);
            setTaskCount(res.filterTaskCount);
            setBottomHasMore(res.totalPage > 1);
          }
        });
    }
  };

  const handleOpen = () => {
    setVisible(true);
    handleSystemTasksInitFetch();
    trackApi.track('waimao_my_task_pop', { action: 'click' });
  };

  const handleClose = () => {
    setVisible(false);
    setBottomHasMore(false);
    handleSystemTasksInitFetch();
  };

  const handleNavigateAll = () => {
    setVisible(false);
    navigate('#systemTask?page=systemTask');
  };

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const reachBottom = clientHeight === scrollHeight - scrollTop;

    if (reachBottom && bottomHasMore && !bottomLoading && tasks.length) {
      const lastId = tasks[tasks.length - 1].id;

      setBottomLoading(true);

      taskCenterApi
        .getSystemTasks({
          lastId,
          pageSize: PAGE_SIZE,
          moduleTypes: moduleTypes.join(','),
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
    handleSystemTasksInitFetch();

    return () => {
      setTasks([]);
      setTaskCount(0);
      setVisible(false);
      setBottomHasMore(false);
    };
  }, [moduleTypes]);

  useEffect(() => {
    bus.on('openTask', handleOpen);
  }, []);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('SystemTaskNewTask', {
      func: event => {
        const data = event.eventData || {};
        const { moduleType } = data;
        const initFetchDebounced = debounce(handleSystemTasksInitFetch, 300);
        const includeNewTaskModule = !moduleTypes.length || moduleTypes.includes(moduleType);

        if (includeNewTaskModule && !visible) {
          initFetchDebounced();
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('SystemTaskNewTask', id);
    };
  }, [moduleTypes, visible]);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('SystemTaskStatusUpdate', {
      func: event => {
        const data = event.eventData || {};
        const { moduleType, taskId, taskStatus } = data;
        const includeUpdateTaskModule = !moduleTypes.length || moduleTypes.includes(moduleType);
        const shouldUpdateTaskStatus = [SystemTaskStatus.COMPLETE, SystemTaskStatus.CLOSE].includes(taskStatus);

        if (includeUpdateTaskModule && shouldUpdateTaskStatus) {
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
  }, [moduleTypes, tasks, taskCount]);

  const { updateTaskCount } = useActions(TaskActions);

  useEffect(() => {
    if (!taskCount) {
      setVisible(false);
      return;
    }

    updateTaskCount({ taskCount });
    bus.emit('taskCount', taskCount);
  }, [taskCount]);

  return (
    <>
      {showIcon && (
        <Tooltip title={getTransText('WODERENWU')} mouseEnterDelay={0.3} placement="left">
          <div className={style.systemTaskEntry} onClick={handleOpen}>
            {!!taskCount && <div className={style.dot}>{taskCount > 99 ? '99+' : taskCount}</div>}
            <SystemTaskIcon />
          </div>
        </Tooltip>
      )}
      <Drawer
        style={{
          zIndex: 1111,
        }}
        className={style.drawer}
        title={`${moduleName}${getTransText('DAICHULIRENWU')} (${taskCount})`}
        visible={visible}
        maskStyle={{ backgroundColor: 'transparent' }}
        closable={false}
        onClose={handleClose}
        getContainer={getDrawerContainer}
        footer={
          !!taskCount && (
            <div className={style.footer}>
              <Button
                btnType="minorLine"
                onClick={() => {
                  handleClose();
                  trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                    action: 'close',
                  });
                }}
              >
                {getTransText('GUANBI')}
              </Button>
              <Button
                btnType="minorLine"
                onClick={() => {
                  handleNavigateAll();
                  trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                    action: 'view_all',
                  });
                  trackApi.track('waimao_my_task', {
                    action: 'floatwindow',
                  });
                }}
              >
                {getTransText('CHAKANQUANBU')}
              </Button>
            </div>
          )
        }
      >
        {!taskCount ? (
          <div className={style.empty}>
            <img className={style.emptyIcon} src={NoDataIcon} />
            <div className={style.emptyTip}>
              {moduleTypes.length ? `${getTransText('ZANWU')}${moduleName}${getTransText('DAICHULIRENWU')}` : getTransText('WUDAICHULIRENWU')}
            </div>
            <div className={style.emptyButtons}>
              <Button
                onClick={() => {
                  handleClose();
                  trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                    action: 'close',
                  });
                }}
              >
                {getTransText('GUANBI')}
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  handleNavigateAll();
                  trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                    action: 'view_all',
                  });
                  trackApi.track('waimao_my_task', {
                    action: 'floatwindow',
                  });
                }}
              >
                {getTransText('CHAKANQUANBURENWU')}
              </Button>
            </div>
          </div>
        ) : (
          <div className={style.tasks} onScroll={handleScroll}>
            {tasks.map(task => (
              <div className={style.task} key={task.taskId}>
                <div className={style.taskName}>{task.taskName}</div>
                <OptionSeparator className={style.options}>
                  <span
                    onClick={() => {
                      taskCenterApi.handleSystemTask(task);
                      setVisible(false);
                      trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                        action: 'todo',
                      });
                    }}
                  >
                    {getTransText('QUCHULI')}
                  </span>
                  <span
                    onClick={() => {
                      handleSystemTaskClose(task);
                      trackApi.track('waimao_floatwindow_todo_my_task_operation', {
                        action: 'ignore',
                      });
                    }}
                  >
                    {getTransText('HULVE')}
                  </span>
                </OptionSeparator>
              </div>
            ))}
            {bottomLoading && <div className={style.bottomLoading} />}
          </div>
        )}
      </Drawer>
    </>
  );
};

export default SystemTaskEntry;
