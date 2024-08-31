import { message } from 'antd';
import { api, apis, SiteApi } from 'api';
import { useState } from 'react';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const useIndustryList = () => {
  const [industryList, setIndustryList] = useState<{ label: string; value: string }[]>([]);

  const fetchIndustryList = async () => {
    setIndustryList([]);
    try {
      const result = await siteApi.getIndustryList();
      if (result.length > 0) {
        setIndustryList(
          result.map(({ description, industry }) => {
            return {
              label: description,
              value: industry,
            };
          })
        );
      }
    } catch (error) {
      message.error(`${error}`);
    }
  };

  return {
    industryList,
    fetchIndustryList,
  };
};

export default useIndustryList;
