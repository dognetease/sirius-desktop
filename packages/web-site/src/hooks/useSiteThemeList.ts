import { message } from 'antd';
import { api, apis, SiteApi } from 'api';
import { useState } from 'react';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const useSiteThemeList = () => {
  const [themeList, setThemeList] = useState<{ label: string; value: string }[]>([]);
  const [defaultTheme, setDefaultTheme] = useState('');

  const fetchThemeList = async () => {
    setThemeList([]);
    try {
      const result = await siteApi.getAiSiteStyleList();
      if (result.length > 0) {
        const hasCommerce = result.find(item => item.theme === 'COMMERCE');
        if (hasCommerce) {
          setDefaultTheme('COMMERCE');
        } else {
          setDefaultTheme(result[0].theme);
        }
        setThemeList(
          result.map(({ description, theme }) => {
            return {
              label: description,
              value: theme,
            };
          })
        );
      }
    } catch (error) {
      message.error(`${error}`);
    }
  };

  return {
    themeList,
    defaultTheme,
    fetchThemeList,
  };
};

export default useSiteThemeList;
