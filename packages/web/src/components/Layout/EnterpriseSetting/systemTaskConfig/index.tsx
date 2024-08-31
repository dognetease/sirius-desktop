import React, { useState, useEffect } from 'react';
import { apiHolder, apis, TaskCenterApi, SystemTaskConfig, SystemTaskConfigStatus, SystemTaskConfigListReq } from 'api';
import { Switch } from 'antd';
// import Pagination from '@web-common/components/UI/Pagination';
import Pagination from '@lingxi-common-component/sirius-ui/Pagination';
import { getTransText } from '@/components/util/translate';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import style from './index.module.scss';

const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

interface SystemTaskConfigProps {}

const SystemTaskConfig: React.FC<SystemTaskConfigProps> = props => {
  const [data, setData] = useState<SystemTaskConfig[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [params, setParams] = useState<SystemTaskConfigListReq>({
    page: 1,
    pageSize: 20,
  });

  const handleConfigStatusUpdate = (taskTypeId: string, taskConfigStatus: SystemTaskConfigStatus) => {
    setUpdatingId(taskTypeId);

    taskCenterApi
      .updateSystemTaskConfigStatus({
        taskTypeId,
        taskConfigStatus,
      })
      .then(() => {
        setData(data.map(item => (item.taskTypeId === taskTypeId ? { ...item, taskConfigStatus } : item)));
      })
      .finally(() => {
        setUpdatingId(null);
      });
  };

  useEffect(() => {
    taskCenterApi.getSystemTaskConfigList(params).then(res => {
      setData(res.systemTaskConfigList);
      setTotal(res.totalSize);
    });
  }, [params]);

  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="TASK_CENTER_RULE_SETTING" menu="ORG_SETTINGS_TASK_CENTER_RULE_SETTING">
      <div className={style.systemTaskConfig}>
        <div className={style.title}>{getTransText('RENWUGUIZESHEZHI')}</div>
        <div className={style.configList}>
          {data.map(item => {
            const checked = item.taskConfigStatus === SystemTaskConfigStatus.IN_USE;

            return (
              <div className={style.config} key={item.taskTypeId}>
                <div className={style.name}>{item.taskTypeName}</div>
                <PrivilegeCheck accessLabel="TASK_CENTER_RULE_SETTING" resourceLabel="ORG_SETTINGS">
                  <Switch
                    className={style.switch}
                    checked={checked}
                    loading={item.taskTypeId === updatingId}
                    onChange={() => {
                      const nextStatus = checked ? SystemTaskConfigStatus.DELETED : SystemTaskConfigStatus.IN_USE;

                      handleConfigStatusUpdate(item.taskTypeId, nextStatus);
                    }}
                  />
                </PrivilegeCheck>
              </div>
            );
          })}
        </div>
        <Pagination
          className={style.pagination}
          total={total}
          current={params.page}
          pageSize={params.pageSize}
          showSizeChanger
          pageSizeOptions={['20', '50', '100']}
          hideOnSinglePage
          onChange={(page, pageSize) => {
            setParams({
              ...params,
              pageSize: pageSize as number,
              page: pageSize === params.pageSize ? (page as number) : 1,
            });
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};

export { SystemTaskConfig };
