import { SiteApi, api, apis } from 'api';
import { useState, useMemo } from 'react';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export interface CountryListItem {
  countryCode: string;
  countryNameCn: string;
  countryNameEn: string;
  criteriaId: string;
  dbCreateTime: string;
  dbUpdateTime: string;
  id: number;
}

const useDeliveryCountryList = () => {
  const [countryList, setCountryList] = useState<CountryListItem[]>([]);

  const countryListOptionsData = useMemo(() => {
    return countryList.map(data => {
      return {
        label: data.countryNameCn,
        value: data.criteriaId,
      };
    });
  }, [countryList]);

  const fetchDeliveryCountryList = async () => {
    try {
      const data = await siteApi.getDeliveryCountryList();

      if (Array.isArray(data) && data.length > 0) {
        setCountryList(data);
      } else {
        setCountryList([]);
      }
    } catch (error) {
      setCountryList([]);
    }
  };

  return {
    countryList,
    countryListOptionsData,
    fetchDeliveryCountryList,
  };
};

export default useDeliveryCountryList;
