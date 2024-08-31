import { SiteApi, api, apis } from 'api';
import { useState } from 'react';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const useCountryData = () => {
  const [countryList, setCountryList] = useState<{ value: string; label: string }[]>([]);

  const fetchCountryList = async () => {
    try {
      const data = (await siteApi.getSiteDataCountryList()) as string[];
      if (Array.isArray(data)) {
        setCountryList(
          data.map(name => {
            return {
              value: name,
              label: name,
            };
          })
        );
      } else {
        setCountryList([]);
      }
    } catch (error) {}
  };

  return {
    countryList,
    fetchCountryList,
  };
};

export default useCountryData;
