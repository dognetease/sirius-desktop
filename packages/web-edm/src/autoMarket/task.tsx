import React, { useState, useEffect, useRef } from 'react';
import { useList } from 'react-use';
import { Button, Input, Select, Switch, Dropdown, Menu, Tooltip, Table, Space } from 'antd';
import { Breadcrumb } from 'antd';

import { apiHolder, apis, AutoMarketApi, AutoMarketTask, AutoMarketTaskType, AutoMarketTaskTypeName, AutoMarketTaskObjectTypeName, AutoMarketOpenStatus } from 'api';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { navigate } from '@reach/router';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import Icon from '@ant-design/icons/lib/components/Icon';
import IconSuccess from '@/components/UI/Icons/svgs/Success';
import ArrowIcon from '@web-common/components/UI/Icons/svgs/Arrow';
// import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
// import { useAppSelector } from '@web-common/state/createStore';
import { getTransText } from '@/components/util/translate';
import { ReactComponent as ArrowDown } from '@/images/icons/edm/addressBook/arrow-down.svg';
import { autoMarketTracker } from './tracker';
import Badge, { ColorType } from './badge';
import TaskCreateEntry from './taskCreateEntry';
import style from './task.module.scss';
import { getIn18Text } from 'api';

const { Option } = Select;
const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const TypeColor: Record<string, ColorType> = {
  [AutoMarketTaskType.FIXED_CONTACT]: ColorType.bule3,
  [AutoMarketTaskType.HOLIDAY_GREETING]: ColorType.yellow,
  [AutoMarketTaskType.POTENTIAL_CONTACT]: ColorType.green,
  [AutoMarketTaskType.PREVIOUS_CONTACT]: ColorType.red,
};

const Task = () => {
  const taskCreateEntryRef = useRef<any>(null);
  const [list, { set: setList, updateAt }] = useList<AutoMarketTask>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchCondition, setSearchCondition] = useState({
    taskName: '',
    taskStatus: undefined,
    sort: undefined,
    page: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);
  // const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'OP'));
  // const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'DELETE'));
  // const hasOverlay = hasOp || hasDelete;

  useEffect(() => {
    search();
  }, [searchCondition]);

  const deleteConfirm = (taskId: string) => {
    ShowConfirm({
      title: getTransText('QUEDINGSHANCHU\uFF1F'),
      type: 'danger',
      okText: getTransText('SHANCHU'),
      cancelText: getTransText('QUXIAO'),
      makeSure: () => deleteTask(taskId),
    });
  };

  const deleteTask = async (taskId: string) => {
    await autoMarketApi.deleteTaskDetail({ taskId });
    Toast.success({ content: `删除成功` });
    search();
  };

  const updateTaskStatus = async (task: AutoMarketTask, index: number, checked: boolean) => {
    const taskStatus = checked ? 'OPEN' : 'CLOSED';
    try {
      updateAt(index, {
        ...task,
        loading: true,
      });
      await autoMarketApi.updateTaskStatus({
        taskId: task.taskId,
        taskStatus: taskStatus as AutoMarketOpenStatus,
      });
      updateAt(index, {
        ...task,
        loading: false,
        taskStatus: taskStatus as AutoMarketOpenStatus,
      });
      Toast.success({
        className: style.customMessage,
        icon: <Icon component={() => <IconSuccess />} />,
        content: `${task.taskName}的自动化任务设置成功`,
      });
    } catch (error) {
      updateAt(index, {
        ...task,
        loading: false,
      });
    }
  };

  const search = async () => {
    setLoading(true);
    try {
      const { autoMarketTasks = [], totalSize = 0 } = await autoMarketApi.getTaskList(searchCondition);
      if (Array.isArray(autoMarketTasks)) {
        setList(autoMarketTasks);
      }
      if (Number.isInteger(totalSize)) {
        setTotal(totalSize);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleDetail = (taskId: string) => {
    navigate(`#edm?page=autoMarketTaskDetail&taskId=${taskId}`);
  };

  const changeTaskTemplate = async (item: AutoMarketTask, index: number) => {
    try {
      if (item.loading) {
        return;
      }
      updateAt(index, {
        ...item,
        loading: true,
      });
      await autoMarketApi.setTaskTemplateStatus(item.taskId, !item.template);
      item.template = !item.template;
      setList(list.slice());
    } finally {
      updateAt(index, {
        ...item,
        loading: false,
      });
    }
  };

  const columns = [
    {
      title: getTransText('RENWUMINGCHENG'),
      width: 200,
      render(_: string, item: AutoMarketTask) {
        return (
          <div style={{ width: 200 }}>
            <div className={style.taskNameWrapper}>
              <div className={style.taskName} title={item.taskName} onClick={() => handleDetail(item.taskId)}>
                {item.taskName}
              </div>
              {item.template ? <Badge className={style.taskTag} colorType={ColorType.blue2} text={getTransText('AutoMarketTemplate')} /> : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: getTransText('MarketingScene'),
      render(_: string, item: AutoMarketTask) {
        return <Badge className={style.taskTag} colorType={TypeColor[item.taskType]} text={AutoMarketTaskTypeName[item.taskType]} />;
      },
    },
    {
      title: getTransText('MUBIAO'),
      render(_: string, item: AutoMarketTask) {
        return AutoMarketTaskObjectTypeName[item.objectType] || '--';
      },
    },
    {
      title: getTransText('ExecutionTimes'),
      dataIndex: 'execCount',
    },
    {
      title: getTransText('GENGXINSHIJIAN'),
      dataIndex: 'recentlyUpdateTime',
    },
    {
      title: getTransText('ZHUANGTAI'),
      render(_: string, item: AutoMarketTask, index: number) {
        return item.taskStatus === AutoMarketOpenStatus.NEW ? (
          <Badge className={style.tag} colorType={ColorType.yellow} text={getTransText('BIANQIZHONG')} />
        ) : item.taskStatus === AutoMarketOpenStatus.DEAD ? (
          <Badge className={style.tag} colorType={ColorType.green} text={getTransText('YIWANCHENG')} />
        ) : (
          <Switch size="small" loading={item.loading} checked={item.taskStatus === 'OPEN'} onChange={checked => updateTaskStatus(item, index, checked)} />
        );
      },
    },
    {
      title: getTransText('CAOZUO'),
      render(_: string, item: AutoMarketTask, index: number) {
        return (
          <Space>
            {item.taskStatus !== 'NEW' && (
              <a
                className={style.btnLink}
                // type="link"
                onClick={e => {
                  e.preventDefault();
                  handleDetail(item.taskId);
                }}
              >
                {getTransText('CHAKAN')}
              </a>
            )}
            {item.taskStatus === 'NEW' && item.objectType !== 'CLUE' && (
              <a
                className={style.btnLink}
                // type="link"
                onClick={e => {
                  e.preventDefault();
                  navigate(`#edm?page=autoMarketTaskEdit&taskId=${item.taskId}`);
                }}
              >
                {getTransText('BIANJI')}
              </a>
            )}
            <Dropdown
              placement="bottomRight"
              overlayStyle={{
                width: 102,
              }}
              overlay={
                <Menu className={style.menuMore}>
                  <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
                    {item.objectType !== 'CLUE' ? (
                      <>
                        <Menu.Item key="edit" disabled={item.taskStatus !== 'NEW'} onClick={() => navigate(`#edm?page=autoMarketTaskEdit&taskId=${item.taskId}`)}>
                          {getTransText('BIANJI')}
                          <Tooltip overlayStyle={{ zIndex: 10000 }} title={getTransText('RUORENWUZENGJINGQIDONG\uFF0CZEBUZHICHIZAICIBIANJI')}>
                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </Menu.Item>
                        <Menu.Item
                          key="copy"
                          onClick={() => {
                            navigate(`#edm?page=autoMarketTaskEdit&copyTaskId=${item.taskId}`);
                            autoMarketTracker.copyClick();
                          }}
                        >
                          {getTransText('FUZHI')}
                        </Menu.Item>
                        {item.taskStatus !== 'NEW' && item.taskStatus !== 'DEAD' && item.taskType !== AutoMarketTaskType.PREVIOUS_CONTACT && (
                          <Menu.Item key="template" onClick={() => changeTaskTemplate(item, index)}>
                            {item.template ? getTransText('CancelAutoMarketTemplate') : getTransText('SetAutoMarketTemplate')}
                          </Menu.Item>
                        )}
                      </>
                    ) : null}
                  </PrivilegeCheck>
                  <PrivilegeCheck resourceLabel="EDM" accessLabel="DELETE">
                    <Menu.Item key="delete" onClick={() => deleteConfirm(item.taskId)}>
                      {getIn18Text('SHANCHU')}
                    </Menu.Item>
                  </PrivilegeCheck>
                </Menu>
              }
            >
              <a onClick={e => e.preventDefault()}>
                {getTransText('GENGDUO')}
                <ArrowDown style={{ marginBottom: -3 }} />
              </a>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const CrumbComp = () => {
    return (
      <Breadcrumb className={style.breadcrumb} separator=">">
        <Breadcrumb.Item>
          <span onClick={() => navigate('#edm?page=index')}>任务列表</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{getIn18Text('ZIDONGHUAYINGXIAO')}</Breadcrumb.Item>
      </Breadcrumb>
    );
  };

  return (
    <div className={style.containerWrapper}>
      <div className={style.container}>
        <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_SENDBOX">
          <div className={style.row}>
            {CrumbComp()}
            <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
              <Button
                type="primary"
                onClick={() => {
                  taskCreateEntryRef.current && taskCreateEntryRef.current.toggle();
                  autoMarketTracker.createClick();
                }}
              >
                {getTransText('XINJIANZIDONGHUARENWU')}
              </Button>
            </PrivilegeCheck>
          </div>
          <div className={style.row}>
            <div className={style.search}>
              <Input
                value={searchCondition.taskName}
                placeholder={getTransText('SHURURENWUMINGCHENG')}
                style={{ width: 226, marginRight: 12 }}
                onChange={e => setSearchCondition({ ...searchCondition, taskName: e.target.value })}
              />
              <Select
                value={searchCondition.taskStatus}
                onChange={value => setSearchCondition({ ...searchCondition, taskStatus: value })}
                placeholder={getTransText('QUANBU')}
                allowClear
                suffixIcon={<ArrowIcon />}
                style={{ width: 132 }}
              >
                <Option value="OPEN">{getTransText('YIQIDONG')}</Option>
                <Option value="CLOSED">{getTransText('WEIQIDONG')}</Option>
                <Option value="NEW">{getTransText('BIANQIZHONG')}</Option>
                <Option value="DEAD">{getTransText('YIWANCHENG')}</Option>
                <Option value="">{getTransText('QUANBU')}</Option>
              </Select>
            </div>
            <Select
              value={searchCondition.sort}
              onChange={value => setSearchCondition({ ...searchCondition, sort: value })}
              placeholder={getTransText('PAIXU')}
              allowClear
              suffixIcon={<ArrowIcon />}
              style={{ width: 80 }}
            >
              <Option value="taskStatus">{getTransText('ZHUANGTAI')}</Option>
              <Option value="recentlyUpdateTime">{getTransText('RIQI')}</Option>
            </Select>
          </div>
          <Table
            className={style.table}
            columns={columns}
            dataSource={list}
            rowKey="email"
            pagination={{
              className: 'pagination-wrap',
              size: 'small',
              current: searchCondition.page,
              pageSize: searchCondition.pageSize,
              pageSizeOptions: ['10', '20', '50'],
              showSizeChanger: true,
              disabled: loading,
              total,
              showTotal: total => `共${total}条`,
            }}
            loading={loading}
            onChange={pagination => {
              setSearchCondition(previous => ({
                ...searchCondition,
                pageSize: pagination.pageSize as number,
                page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
              }));
            }}
            // scroll={{ y: `calc(100vh - ${getBodyFixHeight(true) ? 438 : 470}px)` }}
          />
        </PermissionCheckPage>
      </div>
      <TaskCreateEntry ref={taskCreateEntryRef} />
    </div>
  );
};
export default Task;
