import { api, apis, CustomsContinent, CustomsRecordCountry, GlobalSearchApi } from 'api';
import { useEffect, useState } from 'react';

const CustomsApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

type CountryWithContinent = Array<CustomsRecordCountry & { continent: Omit<CustomsContinent, 'countries'> }>;

export const useGlobalSearchCountryHook: (flatContry?: boolean) => [CustomsContinent[], CountryWithContinent] = (flatContry = false) => {
  const [continentList, setContinentList] = useState<CustomsContinent[]>([]);
  useEffect(() => {
    CustomsApi.doGetGlobalSearchCountryList().then(setContinentList);
  }, []);
  const allCountry: CountryWithContinent = [];
  if (flatContry) {
    continentList.map(con => {
      const { continent, continentCn } = con;
      con.countries.map(country => {
        allCountry.push({
          ...country,
          continent: {
            continent: continent,
            continentCn,
          },
        });
      });
    });
  }
  return [continentList, allCountry];
};
