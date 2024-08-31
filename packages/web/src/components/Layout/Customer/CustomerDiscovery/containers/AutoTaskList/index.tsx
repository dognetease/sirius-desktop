import React, { useContext, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import classnames from 'classnames';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { Moment } from 'moment';
import { TablePaginationConfig, DatePicker, Select, Space, Table, Tag, Checkbox, Spin, Modal } from 'antd';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { CustomerAutoTaskRow, CustomerAutoTaskReq, CustomerAutoTaskList, apiHolder, apis, CustomerDiscoveryApi } from 'api';
import { CustomerDiscoveryContext, ActionType, TaskStatus, CustomerRecommendType, AutoTaskStatusList, TaskStatusMap, drawerClassName } from '../../context';
import { ReactComponent as IconWarning } from '@/images/icons/regularcustomer/icon_warning.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/regularcustomer/close.svg';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { useTableSearch } from '../../hooks/useTableSearch';
import { DateFormat } from '../../../components/dateFormat';
import { CustomerList } from '../CustomerList';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';

const { RangePicker } = DatePicker;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AutoTaskList = forwardRef((prop, ref) => {
  const [drawer, setDrawer] = useState<{
    visible: boolean;
    data: Partial<CustomerAutoTaskRow>;
  }>({ visible: false, data: {} });
  const { state, dispatch } = useContext(CustomerDiscoveryContext);
  const { containerHeight, containerRef } = useContainerHeight(150);
  const rootRef = useRef<HTMLDivElement>(null);
  const fetchTableData = async (search: CustomerAutoTaskReq, pagination: TablePaginationConfig): Promise<[number, CustomerAutoTaskList]> => {
    const res = await customerDiscoveryApi.getCustomerAutoTaskList({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    dispatch({ type: ActionType.UpdateAutoTaskTable, payload: res.data });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, reload, searchParams, setSearchParams } = useTableSearch<CustomerAutoTaskReq, CustomerAutoTaskList>(fetchTableData, {});
  useImperativeHandle(ref, () => ({
    reload(resetSearch = false) {
      reload(resetSearch);
    },
  }));
  const dateChange = async (date: Moment[]) => {
    const [start, end] = date || [];
    const startDate = start?.startOf('day')?.valueOf();
    const endDate = end?.endOf('day')?.valueOf();
    setSearchParams({ ...searchParams, startDate, endDate });
  };
  const statusChange = async (taskStatus: string) => setSearchParams({ ...searchParams, taskStatus });
  // 判断是否为已完成状态
  const isFinish = (row: CustomerAutoTaskRow): boolean => row.taskStatus === TaskStatus.done;
  const getStatusInfo = (row: CustomerAutoTaskRow): [string, string] => {
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
      default:
        style.tagSuccess;
    }
    return [className, statusText];
  };
  const checkClick = async (row: CustomerAutoTaskRow) => {
    const { taskId } = row;
    const taskInfo = await customerDiscoveryApi.getRecommendTaskInfo(taskId);
    if (taskInfo.taskStatus === TaskStatus.done) {
      // 如果已经是已完成（操作过程中，任务状态已变），则直接置为已完成
      dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, taskStatus: TaskStatus.done, opFlag: 1 } });
      return;
    }
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
          dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, isLoading: true } });
          // if (isFinish(row)) {
          //   // 撤销已完成
          //   const res = await customerDiscoveryApi.unFinishCustomerTask(taskId);
          //   dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, taskStatus: res?.data?.taskStatus } });
          //   return;
          // }
          // 标记为已完成
          await customerDiscoveryApi.changeCustomerTaskStatus(taskId, TaskStatus.done);
          regularCustomerTracker.trackAutoFinish();
          dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, taskStatus: TaskStatus.done, opFlag: 1 } });
        } finally {
          if (searchParams.taskStatus) {
            // 如果处于状态筛选模式，则需要刷新列表
            reload(false);
          }
          dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload: { taskId, isLoading: false } });
        }
      },
    });
  };
  const showDetail = (row: CustomerAutoTaskRow) => {
    setDrawer({
      visible: true,
      data: row,
    });
  };
  const columns = [
    {
      title: getIn18Text('SHAIXUANSHIJIANDUAN'),
      className: style.noWrap,
      render: (v: string, row: CustomerAutoTaskRow) => (
        <>
          <span className={style.linkBtn} onClick={() => showDetail(row)}>
            <DateFormat value={row.startTime} format="YY年M月" />
            -
            <DateFormat value={row.endTime} format="YY年M月" />
          </span>
          <div>{row.opFlag === 0 ? <Tag className={style.tagNew}>NEW</Tag> : ''}</div>
        </>
      ),
    },
    // {
    //   title: '任务名称',
    //   ellipsis: true,
    //   showTitle: true,
    //   key: 'taskName',
    //   render(_: string, row: CustomerAutoTaskRow) {
    //     return (
    //       <>
    //         <div className={style.taskNameWrapper}>
    //           <div className={classnames([style.taskName, style.linkBtn])} title={row.taskName} onClick={() => showDetail(row)}>{row.taskName}</div>
    //         </div>
    //         <div>
    //           {row.opFlag === 0 ? <Tag className={style.tagNew}>NEW</Tag> : ''}
    //         </div>
    //       </>
    //     );
    //   }
    // },
    {
      title: getIn18Text('SHUJULIANG'),
      render(_: string, row: CustomerAutoTaskRow) {
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
      // width: 120,
      dataIndex: 'finishTime',
      render: (v: string) => <DateFormat value={v} />,
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      // width: 90,
      render(_: string, row: CustomerAutoTaskRow) {
        const [className, statusText] = getStatusInfo(row);
        return <Tag className={className}>{statusText}</Tag>;
      },
    },
    {
      title: getIn18Text('WANCHENGSHAIXUAN'),
      width: 90,
      render(_: string, row: CustomerAutoTaskRow) {
        return (
          <div className={style.opCol}>{row.isLoading ? <Spin /> : <Checkbox checked={isFinish(row)} disabled={isFinish(row)} onClick={() => checkClick(row)} />}</div>
        );
      },
    },
  ];
  const renderTitle = (row: CustomerAutoTaskRow) => {
    const [className, statusText] = getStatusInfo(row);
    return (
      <div className={style.drawerTitle}>
        <span className={style.title}>{row.taskName}</span>
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
      <div className={style.search}>
        <Space>
          <RangePicker
            separator=" - "
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            format="YYYY/MM/DD"
            onChange={date => dateChange(date as Moment[])}
          />
          <Select style={{ width: 120 }} value={searchParams.taskStatus} placeholder={getIn18Text('ZHUANGTAI')} allowClear onChange={statusChange}>
            {AutoTaskStatusList.map(status => (
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
          dataSource={state.autoTaskTable}
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
        title={renderTitle(drawer.data as CustomerAutoTaskRow)}
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
        <CustomerList data={drawer.data as CustomerAutoTaskRow} type={CustomerRecommendType.Auto} getContainer={() => rootRef.current as HTMLDivElement} />
      </Drawer>
    </div>
  );
});
