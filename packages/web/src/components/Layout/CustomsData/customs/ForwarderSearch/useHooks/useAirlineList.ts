import { AirlineItem, EdmCustomsApi, apiHolder, apis } from 'api';
import { useEffect, useState } from 'react';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export const useAirLineList: () => [
  AirlineItem[],
  Array<{
    timeFilter?: string;
    label: string;
    value: string;
    tag?: string;
  }>
] = () => {
  const [airline, setAirline] = useState<AirlineItem[]>([]);
  useEffect(() => {
    edmCustomsApi
      .doGetAirlineList()
      .then(setAirline)
      .catch(() => {});
  }, []);
  return [airline, airline.map(al => ({ label: al.nameCn || al.name, value: al.name, timeFilter: al.timeFilter, tag: al.tags?.[0] }))];
};
