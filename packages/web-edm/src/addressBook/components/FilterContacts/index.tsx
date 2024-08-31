import React from 'react';
import { Select, Space, AutoComplete } from 'antd';
import styles from './index.module.scss';
import { ReactComponent as AddIcon } from '../../assets/addIcon.svg';
import { ReactComponent as SubIcon } from '../../assets/subIcon.svg';
import classnames from 'classnames';
import { getIn18Text } from 'api';
const { Option } = Select;
export interface IFilterContactsProps {
  conditions: {
    id: number;
    type: string;
    logicalCondition: 'include' | 'exclude';
    values: any;
    options: any;
  }[];
  onAddFilter: () => void;
  onSubFilter: (id: number) => void;
  onAllCondChange: (value: 'and' | 'or') => void;
  onCondTypeChange: (id: number, value: string) => void;
  onCondLogicChange: (id: number, value: 'exclude' | 'include') => void;
  onValueChange: (id: number, value: any) => void;
  conditionType: 'and' | 'or';
  onContinentChange: (id: number, value: string) => void;
  onCountryChange: (id: number, value: string) => void;
}
export function FilterContacts(props: IFilterContactsProps) {
  const { conditions, conditionType, onAddFilter, onSubFilter, onAllCondChange, onCondLogicChange, onCondTypeChange, onValueChange, onContinentChange, onCountryChange } =
    props;
  return (
    <div className={styles.filter}>
      <div className={styles.filterHeader}>
        <Select value={conditionType} onChange={val => onAllCondChange(val)} className={styles.filterHeaderSelect}>
          <Option key="and" value="and">
            {getIn18Text('SUOYOUTIAOJIAN')}
          </Option>
          <Option key="or" value="or">
            {getIn18Text('RENYITIAOJIAN2')}
          </Option>
        </Select>
        <span className={styles.filterHeaderText}>{getIn18Text('MANZU')}</span>
      </div>
      <div className={styles.filterBody}>
        {conditions.map((each, idx) => {
          const { type, values, logicalCondition, id, options } = each;
          const typeSelectJSX = (
            <Select value={type} className={classnames(styles.filterBodyType)} onChange={value => onCondTypeChange(id, value)}>
              <Option value="email" key="email">
                {getIn18Text('YOUXIANG')}
              </Option>
              <Option value="name" key="name">
                {getIn18Text('XINGMING')}
              </Option>
              <Option value="country" key="country">
                {getIn18Text('GUOJIADEQU')}
              </Option>
              <Option value="company" key="company">
                {getIn18Text('GONGSIMINGCHENG')}
              </Option>
            </Select>
          );
          const logicJSX = (
            <Select value={logicalCondition} className={styles.filterBodyLogic} onChange={value => onCondLogicChange(id, value)}>
              <Option key="exclude" value="exclude">
                {getIn18Text('BUBAOHAN')}
              </Option>
              <Option key="include" value="include">
                {getIn18Text('BAOHAN')}
              </Option>
            </Select>
          );
          let valuesJSX = null;
          switch (type) {
            case 'email':
              valuesJSX = (
                <Select
                  placeholder={getIn18Text('KESHURUDUOGEZHUTI\uFF0CANHUICHEQUEREN')}
                  mode="tags"
                  maxTagCount="responsive"
                  open={false}
                  value={values}
                  onChange={values => onValueChange(id, values)}
                  className={styles.filterBodyValues}
                  allowClear
                ></Select>
              );
              break;
            case 'name':
              valuesJSX = (
                <Select
                  placeholder={getIn18Text('SHURUDUOGEGUANJIANCI\uFF0CANHUICHEQUEREN')}
                  mode="tags"
                  maxTagCount="responsive"
                  style={{ width: '100%' }}
                  open={false}
                  value={values}
                  onChange={values => onValueChange(id, values)}
                  className={styles.filterBodyValues}
                  allowClear
                ></Select>
              );
              break;
            case 'country':
              let continent = '';
              let country = '';
              if (Array.isArray(values)) {
                if (values.length === 1) {
                  continent = values[0] || '';
                } else if (values.length === 2) {
                  continent = values[0] || '';
                  country = values[1];
                }
              }
              const continentOptions = options.map((el: { label: string; value: string }) => {
                return {
                  label: el.label,
                  value: el.value,
                };
              });
              let countryOptions = [];
              if (continent.length > 0) {
                const found = options.find((el: any) => el.value === continent);
                countryOptions = found.children;
              }
              valuesJSX = (
                <Space>
                  <Select
                    placeholder={getIn18Text('QINGXUANZEZHOU')}
                    options={continentOptions}
                    value={continent.length === 0 ? undefined : continent}
                    style={{
                      width: 118,
                      marginLeft: 16,
                    }}
                    allowClear
                    onChange={value => onContinentChange(id, value)}
                    onClear={() => onCountryChange(id, '')}
                  ></Select>
                  <AutoComplete
                    style={{
                      width: 150,
                    }}
                    filterOption={(inputValue, option) => option?.value.includes(inputValue)}
                    placeholder={getIn18Text('QINGXUANZEGUOJIA')}
                    options={countryOptions}
                    value={country}
                    allowClear
                    onChange={value => onCountryChange(id, value)}
                    onClear={() => onCountryChange(id, '')}
                  ></AutoComplete>
                </Space>
              );
              break;
            case 'company':
              valuesJSX = (
                <Select
                  placeholder={getIn18Text('SHURUDUOGEGUANJIANCI\uFF0CANHUICHEQUEREN')}
                  mode="tags"
                  maxTagCount="responsive"
                  style={{ width: '100%' }}
                  open={false}
                  value={values}
                  onChange={values => onValueChange(id, values)}
                  className={styles.filterBodyValues}
                  allowClear
                ></Select>
              );
              break;
            default:
              break;
          }
          const operationJSX = <div className={styles.filterBodyOp}>{idx === 0 ? <AddIcon onClick={onAddFilter} /> : <SubIcon onClick={() => onSubFilter(id)} />}</div>;
          return (
            <div key={id} className={styles.filterBodyRow}>
              {typeSelectJSX}
              {logicJSX}
              {valuesJSX}
              {operationJSX}
            </div>
          );
        })}
      </div>
    </div>
  );
}
