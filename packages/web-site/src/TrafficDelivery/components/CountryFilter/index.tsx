import React, { useState, useEffect, useMemo } from 'react';
import { Input, AutoComplete } from 'antd';
import styles from './index.module.scss';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import { CustomerApi, apiHolder, apis, getIn18Text } from 'api';

const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}

const CountryFilter = () => {
  const [searchKey] = useState('location');
  const [rule, setRule] = useState<string>('LIKE');
  const onRuleChange = (value: unknown) => {
    setRule(value as string);
  };

  const [currContinent, setCurrContinent] = useState('');
  const [continents, setContinents] = useState<CascaderType[]>([]);
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  const onContinentChange = (value: unknown) => {
    setCurrContinent(value as string);
  };

  const countries = useMemo(() => {
    return continents.find(item => item.value === currContinent)?.children || [];
  }, [continents, currContinent]);

  useEffect(() => {
    handleContinentsFetch();
  }, []);

  return (
    <div className={styles.countryFilter}>
      <Input.Group compact>
        <Select value={searchKey} style={{ width: 100 }} disabled>
          {/* <Option value="contactAddressInfo">{getIn18Text('YOUXIANG')}</Option>
          <Option value="emailStatus">{getIn18Text('YOUXIANGZHUANGTAI')}</Option>
          <Option value="contactName">{getIn18Text('XINGMING')}</Option> */}
          <Option value="location">{getIn18Text('GUOJIADEQU')}</Option>
          {/* <Option value="companyName">{getIn18Text('GONGSIMINGCHENG')}</Option>
          <Option value="jobTitle">{getIn18Text('ZHIWEI')}</Option> */}
        </Select>
        <Select value={rule} style={{ width: 90 }} onChange={onRuleChange}>
          <Option value="LIKE">{getIn18Text('BAOHAN')}</Option>
          <Option value="NOT_LIKE">{getIn18Text('BUBAOHAN')}</Option>
        </Select>
        <Select style={{ width: 125 }} allowClear placeholder={getIn18Text('QINGXUANZEZHOU')} value={currContinent} onChange={onContinentChange}>
          {continents.map(continent => (
            <Option value={continent.value}>{continent.label}</Option>
          ))}
        </Select>
        <AutoComplete
          style={{ width: 125 }}
          allowClear
          placeholder={getIn18Text('QINGXUANZEGUOJIA')}
          filterOption={(inputValue, option) => option?.value.includes(inputValue)}
          options={countries.map(country => ({
            value: country.value,
            label: country.label,
          }))}
        />
      </Input.Group>
    </div>
  );
};

export default CountryFilter;
