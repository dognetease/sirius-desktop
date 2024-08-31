import React, { useState, useMemo } from 'react';
import { Select, SelectProps } from 'antd';

interface Props extends SelectProps<{ label: string; value: string }> {}

export const PortSelect: React.FC<Props> = props => {
  const { options, ...restProps } = props;
  const [search, setSearch] = useState('');

  const filterOption = (inputValue: string) => {
    setSearch(inputValue);
    return true;
  };

  const optionCpmputed = useMemo(() => {
    if (!options) {
      return [];
    }
    return options
      .filter(item => {
        const searchVal = String(search).toLowerCase();
        return !searchVal || String(item.label).toLowerCase().includes(searchVal) || String(item.value).toLowerCase().includes(searchVal);
      })
      .slice(0, 200);
  }, [search, options]);

  return <Select style={{ width: 200 }} allowClear placeholder="请选择港口" {...restProps} showSearch filterOption={filterOption} options={optionCpmputed} />;
};
