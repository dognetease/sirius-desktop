import React, { useState, useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { getIn18Text } from 'api';
import { useCustomsCountryHook } from '@web/components/Layout/CustomsData/customs/docSearch/component/CountryList/customsCountryHook';

interface Props extends SelectProps<{ label: string; value: string }> {}

export const CountrySelect: React.FC<Props> = props => {
  const [search, setSearch] = useState('');
  const allCountry = useCustomsCountryHook(true)?.[1] || [];

  const filterOption = (inputValue: string) => {
    setSearch(inputValue);
    return true;
  };

  const optionCpmputed = useMemo(() => {
    if (!allCountry?.length) {
      return [];
    }
    return allCountry
      .filter(item => {
        const searchVal = String(search).toLowerCase();
        return !searchVal || String(item.nameCn).toLowerCase().includes(searchVal) || String(item.name).toLowerCase().includes(searchVal);
      })
      .slice(0, 200)
      .map(item => ({
        label: item.nameCn,
        value: item.code,
      }));
  }, [search, allCountry]);

  return <Select allowClear placeholder={getIn18Text('QINGXUANZEGUOJIA')} showSearch filterOption={filterOption} options={optionCpmputed} {...props} />;
};
