import { useEffect, useRef, useState } from 'react';
import { api, WorktableApi } from 'api';
import { getCityGroupName } from '../../worktableUtils';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const WORKTABLE_RATE_DEFAULT_VALUE_CITY_CODE = 'WORKTABLE_RATE_DEFAULT_VALUE_CITY_CODE';

export function useTimeZone() {
  const [timeZoneList, setTimeZoneList] = useState<{ label: string; value: string; momentId: string }[]>([]);
  const [currTimeZone, setCurrTimeZone] = useState({
    momentId: '',
    label: '',
    value: '-1',
  });
  const [currTime, setCurrTime] = useState(-1);
  const localTime = useRef(0);

  const fetchCityList = async () => {
    const { currentTimeMillis, defaultCity: serverDefaultCity, cityList } = await worktableApi.getWorkBenchCityList();
    const localDefaultCityId = parseInt(localStorage.getItem(WORKTABLE_RATE_DEFAULT_VALUE_CITY_CODE) || '') || serverDefaultCity.cityId;
    let defaultCity = cityList.find(item => item.cityId === localDefaultCityId);
    if (!defaultCity) {
      defaultCity = {
        ...serverDefaultCity,
      };
    }
    setCurrTimeZone({
      label: getCityGroupName(defaultCity.timezone.name, defaultCity.cityName, defaultCity.countryName),
      value: `${defaultCity.cityId}`,
      momentId: defaultCity.timezone.momentId,
    });
    setTimeZoneList(
      cityList.map(item => {
        return {
          label: getCityGroupName(item.timezone.name, item.cityName, item.countryName),
          value: `${item.cityId}`,
          momentId: item.timezone.momentId,
        };
      })
    );

    setTimeout(() => {
      setCurrTime(currentTimeMillis);
      localTime.current = Date.now();
    });
  };

  const fetchCityInfoById = async () => {
    const { currentTimeMillis } = await worktableApi.getWorkBenchCityInfo({ id: parseInt(currTimeZone.value) });
    setCurrTime(currentTimeMillis);
    localTime.current = Date.now();
  };

  const handleCurrTimeZoneChange = async (label: string, value: string) => {
    const { currentTimeMillis, city } = await worktableApi.getWorkBenchCityInfo({ id: parseInt(value) });
    setCurrTimeZone({
      momentId: city.timezone.momentId,
      label: getCityGroupName(city.timezone.name, city.cityName, city.countryName),
      value: `${city.cityId}`,
    });
    localStorage.setItem(WORKTABLE_RATE_DEFAULT_VALUE_CITY_CODE, `${city.cityId}`);
    setTimeout(() => {
      setCurrTime(currentTimeMillis);
      localTime.current = Date.now();
    });
  };

  const timer = useRef(-1);
  const countDownTime = () => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCurrTime(currTime + (Date.now() - localTime.current));
      localTime.current = Date.now();
    }, 1000);
  };

  useEffect(() => {
    if (parseInt(currTimeZone.value) < 0) return;
    fetchCityInfoById();
  }, [currTimeZone]);

  useEffect(() => {
    if (currTime < 0) return;
    countDownTime();
  }, [currTime]);

  return {
    timeZoneList,
    currTimeZone,
    currTime,
    localTime,
    fetchCityList,
    fetchCityInfoById,
    handleCurrTimeZoneChange,
  };
}
