import { EdmCustomsApi, apiHolder, apis, resCustomsDataUpdate } from 'api';
import { useEffect, useState } from 'react';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export const useDateUpdateTime = () => {
  const [dateUpdateData, setdateUpdateData] = useState<resCustomsDataUpdate[]>([]);
  useEffect(() => {
    edmCustomsApi
      .customsDataUpdate()
      .then(res => {
        console.log('customsDataUpdate-res: ', res);
        setdateUpdateData(res);
      })
      .catch(() => setdateUpdateData([]));
  }, []);
  return dateUpdateData;
};
