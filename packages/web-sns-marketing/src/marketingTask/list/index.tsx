import React, { useState, useEffect } from 'react';
import { ColumnsType } from 'antd/lib/table';
import {
  api,
  apis,
  DataTrackerApi,
  SnsAccountInfoShort,
  SnsMarketingApi,
  SnsTaskListReq,
  SnsTaskListRes,
  SnsTaskModel,
  SnsTaskStatus,
  SnsTaskStatusOptions,
  getIn18Text,
} from 'api';
import { navigate } from '@reach/router';
import moment from 'moment';
import style from './index.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { Alert, Tooltip, Menu, Dropdown } from 'antd';
import { TongyongCuowutishiMian } from '@sirius/icons';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AvatarList } from './avatarList';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { PageLoading } from '@/components/UI/Loading';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { ReactComponent as ArrowDown } from '@/images/icons/edm/addressBook/arrow-down.svg';
import { HocOrderState } from '../../components/orderStateTip';

const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;
const trackerApi: DataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const TaskStatusMap: Record<string, string> = {
  DRAFT: getIn18Text('CAOGAO'),
  GENERATING: getIn18Text('TIEZISHENGCHENGZHONG'),
  FINISH_GENERATE: getIn18Text('TIEZISHENGCHENGWANCHENG'),
  START: getIn18Text('JINXINGZHONG'),
  RUNNING: getIn18Text('JINXINGZHONG'),
  PAUSE: getIn18Text('YIZANTING'),
  FINISH: getIn18Text('YIWANCHENG'),
};

export const SnsMarketingTaskList = () => {
  const [searchParam, setSearchParam] = useState<SnsTaskListReq>({
    page: 1,
    size: 20,
    taskName: '',
    status: '',
  });

  const [data, setData] = useState<SnsTaskListRes>();
  const [loading, setLoading] = useState(false);

  const hasOpPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'OP'));
  const hasDelPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'DELETE'));

  const fetchData = (searchParam: SnsTaskListReq) => {
    setLoading(true);
    return snsMarketingApi
      .getSnsTaskList(searchParam)
      .then(setData)
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(searchParam);
  }, []);

  const handleTaskNameChange = (e: any) => {
    const newSearchParam = {
      ...searchParam,
      taskName: e.target.value,
    };
    setSearchParam(newSearchParam);
    fetchData(newSearchParam);
    trackerApi.track('waimao_SoMediaOperation__tasks_action', {
      type: 'search',
    });
  };
  const handleStatusChange = (status: string) => {
    const newSearchParam = {
      ...searchParam,
      status,
    };
    setSearchParam(newSearchParam);
    fetchData(newSearchParam);
    trackerApi.track('waimao_SoMediaOperation__tasks_action', {
      type: 'filter',
    });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    const newSearchParam = {
      ...searchParam,
      page: page,
      size: pageSize,
    };
    setSearchParam(newSearchParam);
    fetchData(newSearchParam);
  };

  const handleView = (taskId: string) => {
    navigate('#site?page=snsMarketingTaskEdit&id=' + taskId);
  };

  const handleDetail = (taskId: string) => {
    navigate('#site?page=snsMarketingTaskDetail&id=' + taskId);
  };

  const handlePause = (taskId: string) => {
    snsMarketingApi.pauseSnsTask(taskId).then(() => fetchData(searchParam));
  };
  const handleEnable = (taskId: string) => {
    snsMarketingApi.enableSnsTask(taskId).then(() => fetchData(searchParam));
  };
  const handleCopy = (taskId: string) => {
    snsMarketingApi.copySnsTask({ taskId }).then(task => {
      navigate('#site?page=snsMarketingTaskEdit&id=' + task.taskId);
    });
  };
  const handleDelete = (taskId: string) => {
    SiriusModal.confirm({
      title: typeof window !== 'undefined' ? window.getLocalLabel('CAOZUOTISHI') : '',
      content: getIn18Text('SHANCHURENWUJIANGWUFA'),
      onOk: () => {
        snsMarketingApi.delSnsTask(taskId).then(() => fetchData(searchParam));
      },
    });
  };

  const columns: ColumnsType<SnsTaskModel> = [
    {
      key: 'taskName',
      dataIndex: 'taskName',
      title: getIn18Text('RENWUMINGCHENG'),
      render(name) {
        return (
          <div title={name} style={{ maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
        );
      },
    },
    {
      key: 'accounts',
      dataIndex: 'accounts',
      title: getIn18Text('FABUZHANGHAO'),
      render(accounts: SnsAccountInfoShort[]) {
        return <AvatarList accounts={accounts} />;
      },
    },
    {
      dataIndex: 'status',
      title: getIn18Text('ZHUANGTAI'),
      width: 120,
      render(status: string) {
        const tagTypeMap: Record<string, string> = {
          RUNNING: 'label-2-1',
          START: 'label-2-1',
          PAUSE: 'label-5-1',
          FINISH: 'label-4-1',
        };
        const tagType = tagTypeMap[status] || 'label-6-1';
        return (
          <Tag type={tagType as any} hideBorder width={status === 'GENERATING' || status === 'FINISH_GENERATE' ? undefined : 48}>
            {TaskStatusMap[status]}
          </Tag>
        );
      },
    },
    {
      dataIndex: 'firstSendTime',
      title: getIn18Text('JIHUASHOUCIFATIE'),
      width: 160,
      render(t: number) {
        if (!t) {
          return '-';
        }
        return moment(t).format('YYYY-MM-DD HH:mm');
      },
    },
    {
      dataIndex: 'startTime',
      title: getIn18Text('FATIEZHOUQI'),
      width: 220,
      render(t: number, item) {
        if (!t) {
          return '-';
        }
        return moment(t).format('YYYY-MM-DD') + ' ~ ' + moment(item.endTime).format('YYYY-MM-DD');
      },
    },
    {
      dataIndex: 'sendPostCount',
      title: getIn18Text('FATIESHU(SHIJI/'),
      width: 220,
      render(total: number, item) {
        if (item.status === 'DRAFT') {
          return '-';
        }
        const errorTooltip =
          item.failedGenPostCount > 0 ? (
            <span className={style.postErrorTip}>
              <Tooltip title={`计划生成${total}篇帖子，生成失败${item.failedGenPostCount}篇`} destroyTooltipOnHide>
                <TongyongCuowutishiMian />
              </Tooltip>
              {getIn18Text('SHENGCHENGSHIBAI')}
              {item.failedGenPostCount}
              {getIn18Text('PIAN')}
            </span>
          ) : null;
        return (
          <>
            <span className={style.lxNumber}>{item.alreadySendPostCount + '/' + total}</span>
            {errorTooltip}
          </>
        );
      },
    },
    {
      dataIndex: 'commentCount',
      title: getIn18Text('PINGLUNSHU'),
      width: 120,
      render(commentCount: number, item) {
        if (item.status === 'DRAFT') {
          return '-';
        }
        return <span className={style.lxNumber}>{commentCount}</span>;
      },
    },
    {
      key: 'createByName',
      dataIndex: 'createByName',
      width: 120,
      title: getIn18Text('CHUANGJIANYUANGONG'),
    },
    {
      key: 'operation',
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      width: 216,
      render(_, item) {
        const canPause = item.status === SnsTaskStatus.START || item.status === SnsTaskStatus.RUNNING;
        const canEnable = item.status === SnsTaskStatus.PAUSE;

        return (
          <div className={style.btnGroup}>
            <a onClick={() => handleDetail(item.taskId)}>{getIn18Text('FENXI')}</a>
            <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
              <a onClick={() => handleView(item.taskId)}>{item.status === SnsTaskStatus.DRAFT ? getIn18Text('BIANJI') : getIn18Text('CHAKAN')} </a>
              {canPause && <a onClick={() => handlePause(item.taskId)}>{getIn18Text('ZANTING')}</a>}
              {canEnable && <a onClick={() => handleEnable(item.taskId)}>{getIn18Text('KAIQI')}</a>}
            </PrivilegeCheck>
            {(hasOpPermisson || hasDelPermisson) && (
              <Dropdown
                overlayClassName="address_contact_dropdown"
                overlay={
                  <Menu>
                    {hasOpPermisson && (
                      <Menu.Item
                        onClick={() => {
                          handleCopy(item.taskId);
                        }}
                      >
                        {getIn18Text('FUZHI')}
                      </Menu.Item>
                    )}
                    {hasDelPermisson && (
                      <Menu.Item
                        onClick={() => {
                          handleDelete(item.taskId);
                        }}
                      >
                        {getIn18Text('SHANCHU')}
                      </Menu.Item>
                    )}
                  </Menu>
                }
                placement="bottomRight"
              >
                <a onClick={e => e.preventDefault()} className={style.showmorebtn}>
                  {getIn18Text('GENGDUO')}
                  <ArrowDown style={{ marginBottom: -3 }} />
                </a>
              </Dropdown>
            )}
          </div>
        );
      },
    },
  ];

  const handleCreate = () => {
    navigate('#site?page=snsMarketingTaskEdit');
    trackerApi.track('waimao_SoMediaOperation__tasks_action', {
      type: 'create',
    });
  };

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_TASK">
      <div className={style.page}>
        <div className={style.header}>{getIn18Text('YINGXIAORENWU')}</div>
        <Alert className={style.notice} message={getIn18Text('NINKEZAICICHUANGJIANZI')} type="warning" showIcon closable />
        <div className={style.searchBox}>
          <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')} style={{ width: 220 }} onBlur={handleTaskNameChange} onPressEnter={handleTaskNameChange} />
            <EnhanceSelect placeholder={getIn18Text('QUANBUZHUANGTAI')} style={{ width: 160 }} onChange={handleStatusChange} options={SnsTaskStatusOptions} allowClear />
          </div>
          <div>
            <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
              <Button btnType="primary" onClick={handleCreate}>
                {getIn18Text('CHUANGJIANYINGXIAORENWU')}
              </Button>
            </PrivilegeCheck>
          </div>
        </div>
        <div className={style.tableWrapper}>
          <Table
            className={style.snsTaskList}
            columns={columns}
            dataSource={data?.results}
            scroll={{ x: 'max-content' }}
            rowKey="taskId"
            pagination={{
              pageSize: searchParam.size,
              current: searchParam.page,
              total: data?.total,
              onChange: handlePageChange,
            }}
          />
          {loading && <PageLoading />}
        </div>
      </div>
    </PermissionCheckPage>
  );
};

export default HocOrderState(SnsMarketingTaskList);
