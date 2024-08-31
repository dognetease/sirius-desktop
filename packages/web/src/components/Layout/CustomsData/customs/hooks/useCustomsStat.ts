import { api, apis, EdmCustomsApi } from 'api';
import moment from 'moment';
import { useEffect, useState, useCallback } from 'react';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const sysApi = api.getSystemApi();

const getDateString = () => {
  return moment().format('YYYY年MM月DD日');
};

export default function (visible: boolean = false): [number, string] {
  const [count, setCount] = useState<number>(0);
  const [updateDate, setUpdateDate] = useState<string>(getDateString());
  const updateFunc = useCallback(() => {
    edmCustomsApi.doGetCustomsStat().then(c => {
      setCount(c);
      setUpdateDate(getDateString());
    });
  }, []);

  useEffect(() => {
    if (visible) {
      updateFunc();
    }
  }, [visible, updateFunc]);
  useEffect(() => {
    const id = sysApi.intervalEvent({
      eventPeriod: 'long',
      handler: () => {
        updateFunc();
      },
      seq: 0,
    });

    return () => {
      id && sysApi.cancelEvent('long', id);
    };
  }, [updateFunc]);

  return [count, updateDate];
}
