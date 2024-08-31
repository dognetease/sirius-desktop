import React from 'react';
import { Checkbox } from 'antd';
import Flag from './flag';
import style from './country.module.scss';
import { resCustomsStateCountry as countryItemType } from 'api';
import { getIn18Text } from 'api';
interface Props {
  list: countryItemType[];
}
const Country = (props: Props) => {
  const { list } = props;
  return (
    <div className={style.countryWrap}>
      {list &&
        list
          .filter(el => el.state !== getIn18Text('QITAGUOJIADEQU'))
          .map((item, _index) => {
            return (
              <div className={style.countryItem} key={_index}>
                <div className={style.label}>
                  <Checkbox indeterminate={item.indeterminate} value={item.code}>
                    {item.state}
                  </Checkbox>
                </div>
                <div className={style.content}>
                  {item.countries &&
                    item.countries.map((item, index) => {
                      return (
                        <Checkbox value={item.code} key={index}>
                          <Flag IconName={item.code} />
                          {item.label}
                        </Checkbox>
                      );
                    })}
                </div>
              </div>
            );
          })}
    </div>
  );
};
export default Country;
