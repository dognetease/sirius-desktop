import { api, apis, CustomsContinent, CustomsRecordCountry, EdmCustomsApi } from 'api';
import { useEffect, useMemo, useState } from 'react';

const CustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export type CountryWithContinent = Array<CustomsRecordCountry & { continent: Omit<CustomsContinent, 'countries'> }>;

export const useCustomsCountryHook: (flatContry?: boolean, isOld?: boolean) => [CustomsContinent[], CountryWithContinent] = (flatContry = false, isOld = false) => {
  const [continentList, setContinentList] = useState<CustomsContinent[]>([]);
  useEffect(() => {
    const api = isOld ? CustomsApi.doGetCustomsOldCountryList : CustomsApi.doGetCustomsRecordCountryList;
    api
      .bind(CustomsApi)()
      .then(res => {
        if (res) {
          setContinentList(res);
        }
      })
      .catch(() => {
        setContinentList([]);
      });
  }, []);
  const allCountry = useMemo(
    () =>
      flatContry
        ? continentList.reduce((prev, con) => {
            const { continent, continentCn } = con;
            const newConList = con.countries.map(country => ({
              ...country,
              continent: {
                continent,
                continentCn,
              },
            }));
            return [...prev, ...newConList];
          }, [] as CountryWithContinent)
        : [],
    [flatContry, continentList]
  );
  return [continentList, allCountry];
};
