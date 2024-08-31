import React, { useState, useEffect, useContext, useRef } from 'react';
import Select from '../../UI/Select/customerSelect';
const { Option } = Select;
import { customerContext } from '../../../customerContext';
import style from './index.module.scss';
import { apiHolder, DataStoreApi, BaseInfoRes as BaseSelectType } from 'api';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const CUSTOMS_DATA_BASE_INFO = 'CUSTOMS_DATA_BASE_INFO';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
interface ComsProps {
  onChange: (param: string[]) => void;
  value: string[];
}
interface optionProps {
  value: string;
  label: string;
  parentValue?: string;
}
const CascaserArea: React.FC<ComsProps> = props => {
  const { value, onChange } = props;
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  const [area, setArea] = useState<BaseSelectType['area']>([]);
  const [continentOption, setContinentOption] = useState<optionProps[]>([]);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const [provinceOption, setProvinceOption] = useState<optionProps[]>([]);
  const [cityOption, setCityOption] = useState<optionProps[]>([]);
  const setData = [setContinentOption, setCountryOption, setProvinceOption, setCityOption];
  const [continent, setContinent] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [province, setProvince] = useState<string | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const setValueArr = [setContinent, setCountry, setProvince, setCity];
  useEffect(() => {
    const fetch = async () => {
      let newArea: BaseSelectType['area'] = [];
      if (baseSelect?.area) {
        newArea = baseSelect.area;
      } else {
        const { data } = await dataStoreApi.get(CUSTOMS_DATA_BASE_INFO);
        if (data) {
          newArea = JSON.parse(data)?.area;
        }
      }
      setArea(newArea);
    };
    fetch();
  }, [baseSelect?.area]);
  // 默认加载标签
  useEffect(() => {
    if (value && value.length && value.join('')) {
      setValue(value);
      const curr = (parentValue: string[], parentList: BaseSelectType['area'], index: number) => {
        let _value = parentValue.shift();
        let list = (parentList || []).find(item => item.value === _value);
        if (list && list.children && list.children.length) {
          setData[index](list.children);
          parentValue.length && curr([...parentValue], list.children, index + 1);
        }
      };
      curr([...value], area, 1);
    } else {
      if (area) {
        // allCountry
        let allCountry: optionProps[] = [];
        area.forEach(cont => {
          cont?.children.forEach(child => {
            allCountry.push({
              value: child.value,
              label: child.label,
              parentValue: child.parentValue,
            });
          });
        });
        setCountryOption(allCountry);
        setValueArr.forEach(fn => fn(undefined));
      }
    }
    if (area) {
      let options = area.map(item => {
        return {
          value: item.value,
          label: item.label,
        };
      });
      setContinentOption(options);
    }
  }, [value]);
  const setValue = (value: string[]) => {
    if (value.length === 1) {
      setContinent(value[0] || undefined);
      setCountry(undefined);
      setProvince(undefined);
      setCity(undefined);
    }
    if (value.length === 2) {
      setContinent(value[0] || undefined);
      setCountry(value[1] || undefined);
      setProvince(undefined);
      setCity(undefined);
    }
    if (value.length === 3) {
      setContinent(value[0] || undefined);
      setCountry(value[1] || undefined);
      setProvince(value[2] || undefined);
      setCity(undefined);
    }
    if (value.length === 4) {
      setContinent(value[0] || undefined);
      setCountry(value[1] || undefined);
      setProvince(value[2] || undefined);
      setCity(value[3] || undefined);
    }
  };
  const handleChange = (type: string, currentValue: any) => {
    if (type === 'continent') {
      onChange([currentValue]);
      setCountryOption([]);
      setProvinceOption([]);
      setCityOption([]);
    }
    if (type === 'country') {
      if (value && value.length && value[0]) {
        onChange([value[0], currentValue]);
      } else {
        countryOption.forEach(item => {
          if (item.value === currentValue) {
            onChange([item.parentValue, currentValue]);
          }
        });
      }
      setProvinceOption([]);
      setCityOption([]);
    }
    if (type === 'province') {
      value && onChange([value[0], value[1], currentValue]);
      setCityOption([]);
    }
    if (type === 'city') {
      value && onChange([value[0], value[1], value[2], currentValue]);
    }
  };
  return (
    <div className={style.cascaserArea}>
      <Select placeholder={getIn18Text('QINGXUANZEZHOU')} value={continent} showSearch className={style.selectItem} onChange={e => handleChange('continent', e)}>
        {continentOption.map((el, elIndex) => {
          return (
            <Option key={elIndex} value={el.value}>
              {' '}
              {el.label}
            </Option>
          );
        })}
      </Select>
      <Select placeholder={getIn18Text('QINGXUANZEGUOJIA')} value={country} showSearch className={style.selectItem} onChange={e => handleChange('country', e)}>
        {countryOption.map((el, elIndex) => {
          return (
            <Option key={elIndex} value={el.value}>
              {' '}
              {el.label}
            </Option>
          );
        })}
      </Select>
      <Select placeholder={getIn18Text('QINGXUANZESHENG')} value={province} showSearch className={style.selectItem} onChange={e => handleChange('province', e)}>
        {provinceOption.map((el, elIndex) => {
          return (
            <Option key={elIndex} value={el.value}>
              {' '}
              {el.label}
            </Option>
          );
        })}
      </Select>
      <Select placeholder={getIn18Text('QINGXUANZECHENGSHI')} value={city} showSearch className={style.selectItem} onChange={e => handleChange('city', e)}>
        {cityOption.map((el, elIndex) => {
          return (
            <Option key={elIndex} value={el.value}>
              {' '}
              {el.label}
            </Option>
          );
        })}
      </Select>
    </div>
  );
};
export default CascaserArea;
