import React from 'react';
import { Checkbox } from 'antd';
import style from './country.module.scss';
import { resCustomsStateCountry as countryItemType } from 'api';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { getIn18Text } from 'api';
interface countryItem {
  label: string;
  code: string;
}
interface Props {
  list: countryItemType[]; // 原始数据
  otherCountryList: string[];
  onChangeCountry: (list: string[]) => void;
  isChecked: boolean;
  onChangeChecked: (checked: boolean) => void;
}

const Country = (props: Props) => {
  const { list, otherCountryList, onChangeCountry, isChecked, onChangeChecked } = props;
  return (
    <div className={style.countryWrap}>
      {list &&
        list
          .filter(el => el.state === getIn18Text('QITAGUOJIADEQU'))
          .map((item, _index) => {
            return (
              <div className={style.countryItem} style={{ alignItems: 'baseline' }} key={_index}>
                <div className={style.label}>
                  <Checkbox
                    onChange={e => {
                      onChangeChecked(e.target.checked);
                    }}
                    checked={isChecked}
                    indeterminate={otherCountryList.length > 0 && otherCountryList.length < item.countries.length}
                    value={item.code}
                  >
                    {item.state}
                  </Checkbox>
                </div>
                <div className={style.content}>
                  <Select
                    maxTagCount={'responsive'}
                    mode="multiple"
                    showSearch
                    showArrow={true}
                    allowClear={true}
                    optionFilterProp={'children'}
                    style={{ width: 190, verticalAlign: 'top' }}
                    placeholder={getIn18Text('QUANBUQITAGUOJIADEQU')}
                    value={otherCountryList}
                    onChange={e => onChangeCountry(e as string[])}
                  >
                    {item.countries &&
                      item.countries.map((item, index) => {
                        return (
                          <Select.Option key={index} value={item.code}>
                            {item.label}
                          </Select.Option>
                        );
                      })}
                  </Select>
                </div>
              </div>
            );
          })}
    </div>
  );
};
export default Country;
