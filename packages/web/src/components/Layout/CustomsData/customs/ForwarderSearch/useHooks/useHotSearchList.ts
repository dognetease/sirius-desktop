import { AirlineItem, EdmCustomsApi, ForwarderSearchTop, ForwarderTopSearchReq, apiHolder, apis } from 'api';
import { useCallback, useEffect, useState } from 'react';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export const useForwarderHotSearchList = (req?: ForwarderTopSearchReq) => {
  const [list, setList] = useState<ForwarderSearchTop[]>([]);
  const [refleshToken, setRefleshToken] = useState<number>(0);

  const flesh = useCallback(() => {
    setRefleshToken(prev => prev + 1);
  }, []);

  useEffect(() => {
    edmCustomsApi
      .doGetForwarderSearchTop(req || {})
      .then(res => {
        res && setList(res);
      })
      .catch(() => {
        setList([]);
      });
  }, [refleshToken, req]);

  return {
    list,
    update: flesh,
  };
};
