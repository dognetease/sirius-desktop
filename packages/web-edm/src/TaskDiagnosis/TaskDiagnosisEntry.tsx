import { apiHolder, apis, DataStoreApi, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';
import React, { FC, useEffect, useState } from 'react';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';
import { PermissionCheckPage, PrivilegeCheck, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { useTaskDiagnosis } from './useTaskDiagnosis';

import styles from './TaskDiagnosis.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const TaskDiagnosisEntry: FC<{
  title?: string;
}> = ({ title }) => {
  const { data, hasRead } = useTaskDiagnosis(true);
  const [hasRecord, setHasRecord] = useState(false);
  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');

  // 获取是否有营销记录（包括普通任务和分批任务）
  const fetchRecordData = async () => {
    const result = await edmApi.getSendBoxRecord();
    // 请求未正常返回或者有营销记录，继续后续请求
    if (!result || result.hasEdmRecord) {
      return true;
    }
    return false;
  };

  const fetchRecord = async () => {
    try {
      const hasRecord = await fetchRecordData();
      setHasRecord(hasRecord);
    } catch (err) {}
  };

  useEffect(() => {
    fetchRecord();
  }, []);

  const renderCount = () => {
    if (data && data.lastPeriodAccSendCount != null) {
      if (data.lastPeriodAccSendCount < 4000) {
        return <div className={styles.count}>1</div>;
      }
      return <>{data.diagnosisList.length > 0 && <div className={styles.count}>{data.diagnosisList.length}</div>}</>;
    }
    return null;
  };

  return (
    <>
      <span>{title ?? '任务列表'}</span>
      {!hasRead && hasEdmPermission && hasRecord && renderCount()}
    </>
  );
};
