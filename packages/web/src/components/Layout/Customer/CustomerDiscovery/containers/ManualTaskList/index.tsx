import React, { useContext, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import classnames from 'classnames';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { TablePaginationConfig, Select, Space, Table, Tag, Checkbox, Spin, Button, Modal } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { CustomerManualTaskRow, CustomerManualTask, CustomerManualTaskListReq, CustomerManualTaskList, apiHolder, apis, CustomerDiscoveryApi } from 'api';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { ReactComponent as InfoIcon } from '@/images/icons/edm/info.svg';
import { ReactComponent as InfoIconBlue } from '@/images/icons/edm/info-blue-fill.svg';
import { ReactComponent as IconWarning } from '@/images/icons/regularcustomer/icon_warning.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/regularcustomer/close.svg';
import {
  CustomerDiscoveryContext,
  ActionType,
  TaskStatus,
  CustomerRecommendType,
  TaskStatusMap,
  TaskStatusList,
  TaskRuleFieldList,
  drawerClassName,
} from '../../context';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { useTableSearch } from '../../hooks/useTableSearch';
import { DateFormat } from '../../../components/dateFormat';
import { RuleDetail } from '../../components/RuleDetail';
import { CustomerList } from '../CustomerList';
import { AddTaskModal } from '../../components/AddTaskModal';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const ManualTaskList = forwardRef((prop, ref) => {
  const [drawer, setDrawer] = useState<{
    visible: boolean;
    data: Partial<CustomerManualTaskRow>;
  }>({ visible: false, data: {} });
  const { state, dispatch } = useContext(CustomerDiscoveryContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingTask, setPendingTask] = useState(0);
  const { containerHeight, containerRef } = useContainerHeight(150);
  const rootRef = useRef<HTMLDivElement>(null);
  const fetchTableData = async (search: CustomerManualTaskListReq, pagination: TablePaginationConfig): Promise<[number, CustomerManualTaskList]> => {
    const res = await customerDiscoveryApi.getCustomerManualTaskList({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    setPendingTask(res.prepareCount || 0);
    dispatch({ type: ActionType.UpdateManualTaskTable, payload: res.data });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, reload, searchParams, setSearchParams } = useTableSearch<CustomerManualTaskListReq, CustomerManualTaskList>(
    fetchTableData,
    { taskStatus: undefined, taskName: '', conditionType: undefined },
    500
  );
  useImperativeHandle(ref, () => ({
    reload(resetSearch = false) {
      reload(resetSearch);
    },
  }));
  const statusChange = (taskStatus: string) => setSearchParams({ ...searchParams, taskStatus });
  const conditionTypeChange = (conditionType: string) => setSearchParams({ ...searchParams, conditionType });
  const taskNameChange = (taskName: string) => setSearchParams({ ...searchParams, taskName });
  const addTaskRule = () => {
    setShowAddModal(true);
  };
  const onAddTaskSubmit = async (taskInfo: CustomerManualTask) => {
    await customerDiscoveryApi.addManualTask(taskInfo);
    regularCustomerTracker.trackNewTask(taskInfo);
    reload();
  };
  // 判断是否为已完成状态
  const isFinish = (row: CustomerManualTaskRow): boolean => row.taskStatus === TaskStatus.done;
  const getStatusInfo = (row: CustomerManualTaskRow): [string, string] => {
    let className;
    const statusText = TaskStatusMap[row.taskStatus];
    switch (row.taskStatus) {
      case TaskStatus.doing:
        className = style.tagWarning;
        break;
      case TaskStatus.done:
        className = style.tagSuccess;
        break;
      case TaskStatus.undo:
        className = style.tagDefault;
        break;
      case TaskStatus.suspend:
        className = style.tagDefault;
        break;
      default:
        className = style.tagSuccess;
    }
    return [className, statusText];
  };
  const checkClick = async (row: CustomerManualTaskRow) => {
    const { taskId } = row;
    const taskInfo = await customerDiscoveryApi.getRecommendTaskInfo(taskId);
    Modal.confirm({
      closable: true,
      title: (
        <div className={style.markModalTitle}>
          <IconWarning />
          <span>{getIn18Text('BIAOJIYIWANCHENG')}</span>
        </div>
      ),
      centered: true,
      icon: '',
      closeIcon: <CloseIcon />,
      content: (
        <div className={style.markModalContent}>
          {getIn18Text('GAIRENWUGONG')}
          {taskInfo.totalDomainCount}
          {getIn18Text('TIAOTUIJIANJIEGUO\uFF0C          QIZHONG')}
          {taskInfo.validDomainCount}
          {getIn18Text('TIAOYOUXIAOJIEGUO\uFF0C')}
          {taskInfo.invalidDomainCount}
          {getIn18Text('TIAOWUXIAOJIEGUO          RUODIANJIWANCHENGSHAIXUAN\uFF0CSHENGYU')}
          {taskInfo.unmarkDomainCount}
          {getIn18Text('TIAOTUIJIANJIEGUOJIANGZIDONGZHIWEIDAIDINGZHUANGTAI\uFF0CQINGQUERENSHIFOUWANCHENGSHAIXUAN')}
        </div>
      ),
      onOk: async () => {
        try {
          Object.assign(row, { isLoading: true });
          dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: true } });
          // if (isFinish(row)) {
          //   // 撤销已完成
          //   const res = await customerDiscoveryApi.unFinishCustomerTask(taskId);
          //   dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, taskStatus: res?.data?.taskStatus } });
          //   return;
          // }
          // 标记为已完成
          await customerDiscoveryApi.changeCustomerTaskStatus(taskId, TaskStatus.done);
          regularCustomerTracker.trackManualFinish();
          dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, taskStatus: TaskStatus.done, opFlag: 1 } });
        } finally {
          if (searchParams.taskStatus) {
            // 如果处于状态筛选模式，则需要刷新列表
            reload(false);
          }
          dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: false } });
        }
      },
    });
  };
  /**
   * 暂停任务
   * @param row
   */
  const pauseTask = async (row: CustomerManualTaskRow) => {
    const { taskId } = row;
    Object.assign(row, { isLoading: true });
    dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: true } });
    try {
      await customerDiscoveryApi.changeCustomerTaskStatus(taskId, TaskStatus.suspend);
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, taskStatus: TaskStatus.suspend } });
    } finally {
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: false } });
    }
  };
  /**
   * 重新开始任务
   * @param row
   */
  const restartTask = async (row: CustomerManualTaskRow) => {
    const { taskId } = row;
    try {
      Object.assign(row, { isLoading: true });
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: true } });
      await customerDiscoveryApi.changeCustomerTaskStatus(taskId, TaskStatus.preparation);
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, taskStatus: TaskStatus.preparation } });
    } finally {
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: false } });
    }
  };
  /**
   * 删除任务
   * @param row
   */
  const delTask = async (row: CustomerManualTaskRow) => {
    const { taskId } = row;
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUERENSHANCHUZHETIAOSHUJU'),
      onOk: async () => {
        try {
          Object.assign(row, { isLoading: true });
          dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: true } });
          await customerDiscoveryApi.deleteManualTask(taskId);
          reload();
        } finally {
          dispatch({ type: ActionType.UpdateManualTaskTableRow, payload: { taskId, isLoading: false } });
        }
      },
    });
  };
  const showDetail = (row: CustomerManualTaskRow) => {
    setDrawer({
      visible: true,
      data: row,
    });
  };
  const columns = [
    {
      title: getIn18Text('RENWUMINGCHENG'),
      ellipsis: true,
      showTitle: true,
      render(_: string, row: CustomerManualTaskRow) {
        return (
          <>
            <div className={style.taskNameWrapper}>
              <div className={classnames([style.taskName, style.linkBtn])} title={row.taskName} onClick={() => showDetail(row)}>
                {row.taskName}
              </div>
              <div className={style.taskTip}>
                <RuleDetail rule={row.ruleContent}>
                  <InfoIcon />
                </RuleDetail>
              </div>
            </div>
            <div>
              {row.opFlag === 0 ? <Tag className={style.tagNew}>NEW</Tag> : ''}
              {row.taskStatus === TaskStatus.preparation && row.expectTime ? (
                <Tag className={style.tagRestTime}>
                  {row.expectTime}
                  {getIn18Text('HOUKECHAKAN')}
                </Tag>
              ) : (
                ''
              )}
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('SHUJULIANG'),
      render(_: string, row: CustomerManualTaskRow) {
        return (
          <span className={style.talbeCellNum}>
            <span className={style.num} onClick={() => showDetail(row)}>
              {row.totalDomainCount}
            </span>
            {row.taskStatus === TaskStatus.doing || row.taskStatus === TaskStatus.done ? (
              <>
                <Tag className={style.tagSuccess}>
                  {getIn18Text('YOUXIAO\uFF1A')}
                  {row.validDomainCount}
                </Tag>
                <Tag className={style.tagError}>
                  {getIn18Text('WUXIAO\uFF1A')}
                  {row.invalidDomainCount}
                </Tag>
              </>
            ) : (
              ''
            )}
          </span>
        );
      },
    },
    {
      title: getIn18Text('RENWUWANCHENGSHIJIAN'),
      dataIndex: 'finishTime',
      className: style.noWrap,
      render: (v: string) => <DateFormat value={v} />,
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      render(_: string, row: CustomerManualTaskRow) {
        const [className, statusText] = getStatusInfo(row);
        return <Tag className={className}>{statusText}</Tag>;
      },
    },
    {
      title: getIn18Text('WANCHENGSHAIXUAN'),
      width: 126,
      render(_: string, row: CustomerManualTaskRow) {
        if (row.isLoading) {
          return <Spin />;
        }
        if (row.taskStatus === TaskStatus.preparation) {
          // 数据准备中展示操作按钮
          return (
            <Space>
              <span className={style.linkBtn} onClick={() => pauseTask(row)}>
                {getIn18Text('ZANTING')}
              </span>
              <span className={style.linkBtn} onClick={() => delTask(row)}>
                {getIn18Text('SHANCHU')}
              </span>
            </Space>
          );
        }
        if (row.taskStatus === TaskStatus.suspend) {
          return (
            <Space>
              <span className={style.linkBtn} onClick={() => restartTask(row)}>
                {getIn18Text('ZHONGXINKAISHI')}
              </span>
              <span className={style.linkBtn} onClick={() => delTask(row)}>
                {getIn18Text('SHANCHU')}
              </span>
            </Space>
          );
        }
        return <Checkbox checked={isFinish(row)} disabled={isFinish(row)} onClick={() => checkClick(row)} />;
      },
    },
  ];
  const renderTitle = (row: CustomerManualTaskRow) => {
    const [className, statusText] = getStatusInfo(row);
    if (row.taskStatus === TaskStatus.preparation || row.taskStatus === TaskStatus.suspend) {
      return (
        <div className={style.drawerTitle}>
          <span className={style.title}>{row.taskName}</span>
          <Tag className={classnames([style.tag, className])}>{statusText}</Tag>
        </div>
      );
    }
    return (
      <div className={style.drawerTitle}>
        <div className={style.title}>{row.taskName}</div>
        <Tag className={classnames([style.tag, className])}>{statusText}</Tag>
        {row.isLoading ? (
          <Spin />
        ) : (
          <Checkbox checked={isFinish(row)} disabled={isFinish(row)} onClick={() => checkClick(row)}>
            {getIn18Text('WANCHENGSHAIXUAN')}
          </Checkbox>
        )}
      </div>
    );
  };
  return (
    <div ref={rootRef} className={classnames(style.ruleTable, style.flex1, style.flex, style.flexCol)}>
      <Button type="primary" className={style.addTask} onClick={addTaskRule}>
        {getIn18Text('XINJIANRENWU')}
      </Button>
      {pendingTask > 0 ? (
        <div className={style.tips}>
          <InfoIconBlue />
          <span>
            {getIn18Text('DANGQIAN')}
            {pendingTask}
            {getIn18Text('GEDINGZHIRENWU\uFF0CCHUYUSHUJUZHUNBEIZHONG\u3002')}
          </span>
        </div>
      ) : (
        ''
      )}
      <div className={style.search}>
        <Space>
          <Input
            placeholder={getIn18Text('RENWUMINGCHENG')}
            allowClear
            value={searchParams.taskName}
            prefix={<SearchOutlined />}
            onChange={({ target: { value } }) => taskNameChange(value)}
          />
          <Select style={{ width: 120 }} allowClear value={searchParams.conditionType} onChange={conditionTypeChange} placeholder={getIn18Text('GUIZELEIXINGSHAIXUAN')}>
            {TaskRuleFieldList.map(status => (
              <Select.Option value={status.value} key={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>

          <Select style={{ width: 120 }} allowClear value={searchParams.taskStatus} onChange={statusChange} placeholder={getIn18Text('ZHUANGTAISHAIXUAN')}>
            {TaskStatusList.map(status => (
              <Select.Option value={status.value} key={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <div className={classnames([style.table, style.flex1])} ref={containerRef}>
        <Table
          columns={columns}
          className={style.recommendTable}
          scroll={{
            y: `${containerHeight - 120}px`,
          }}
          rowKey="taskId"
          dataSource={state.manualTaskTable}
          loading={loading}
          rowClassName={row => (isFinish(row) ? 'rule-table-finished' : '')}
          pagination={{
            ...pagination,
            onChange: pageChange,
          }}
        />
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title={renderTitle(drawer.data as CustomerManualTaskRow)}
        width={872}
        getContainer={false}
        onClose={() => {
          setDrawer({ visible: false, data: {} });
          dispatch({ type: ActionType.UpdateCustomerTable, payload: [] });
        }}
        visible={drawer.visible}
        destroyOnClose={Boolean(true)}
        className={drawerClassName}
      >
        <CustomerList data={drawer.data as CustomerManualTaskRow} type={CustomerRecommendType.Manual} getContainer={() => rootRef.current as HTMLDivElement} />
      </Drawer>

      {/* 新建任务弹窗 */}
      <AddTaskModal visible={showAddModal} onSubmit={onAddTaskSubmit} onCancel={() => setShowAddModal(false)} />
    </div>
  );
});
