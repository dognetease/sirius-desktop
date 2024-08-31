import { apiHolder, apis, DataStoreApi, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';
import React, { FC, useEffect, useState } from 'react';
import { navigate, useLocation } from '@reach/router';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';

// 任务列表的hash
const TaskListHash = ['#intelliMarketing?page=index', '#edm?page=index'];
const READ_DIAGNOSIS_DATE = 'READ_DIAGNOSIS_DATE';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

export const useTaskDiagnosis = (visible: boolean) => {
  const [data, setData] = useState<GetDiagnosisDetailRes>();
  const [hasRead, setHasRead] = useState(false);
  const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
  const location = useLocation();
  const { changeDiagnosisDetail } = useActions(AiWriteMailReducer);

  const checkHasRead = () => {
    const data = dataStoreApi.getSync(READ_DIAGNOSIS_DATE);
    if (data.suc && data.data != null) {
      if (new Date(+data.data).getDate() != new Date().getDate() || new Date(+data.data).getDay() != new Date().getDay()) {
        setHasRead(false);
      } else {
        setHasRead(true);
      }
    } else {
      setHasRead(false);
    }
  };

  const queryData = async () => {
    // setShow(true);
    try {
      const data = await edmApi.getDiagnosisDetail();
      setData(data);
      changeDiagnosisDetail({
        diagnosisDetail: data,
      });
      // 今天是否看过了
      checkHasRead();
    } catch (err) {}
  };

  useEffect(() => {
    // if (TaskListHash.some(hash => location.hash.includes(hash))) {
    //   queryData();
    // }
    queryData();
    // 如果打开了诊断与建议
    if (location.hash.includes('zhenduanentry=true')) {
      setHasRead(true);
      dataStoreApi.putSync(READ_DIAGNOSIS_DATE, Date.now() + '');
    }
  }, [location]);

  return {
    data,
    hasRead,
  };
};
