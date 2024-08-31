import React, { useState, useEffect } from 'react';
import style from '../br.module.scss';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import { CustomsContinent } from 'api';
import { globalSearchApi } from '../../globalSearch/constants';
import { Row, Col } from 'antd';
import countryExtraDictionary from '../../CustomsData/customs/docSearch/component/CountryList/countryExtraDictionary';
import dictionary from '../../CustomsData/components/NationalFlag/dictionary';
import classNames from 'classnames';
import { useMemoizedFn } from 'ahooks';
import { globalSearchDataTracker } from '../../globalSearch/tracker';

export interface Prop {
  setSelectCountry: (param: { key: string; value: string }) => void;
}
type NationMap = {
  [n: string]: {
    component: string;
  };
};

const { TabPane } = Tabs;
const nationComponentMap: NationMap = {};
const flagDictionary = countryExtraDictionary.concat(dictionary);
for (const item of flagDictionary) {
  Object.assign(nationComponentMap, {
    [item.code]: {
      component: item.flag && require(`@/images/flags/${item.flag}`),
    },
  });
}

const BrTab: React.FC<Prop> = ({ setSelectCountry }) => {
  const [countryInfo, setCountryInfo] = useState<CustomsContinent[]>([]);
  // 默认选中hot
  const [activeKey, setActiveKey] = useState<string>('Hot');
  // 默认国家
  const [chartCountry, setChartCountry] = useState<string>('');
  useEffect(() => {
    if (chartCountry) {
      globalSearchDataTracker.trackBrCountry(chartCountry);
    }
  }, [chartCountry]);
  useEffect(() => {
    globalSearchApi.getBrCountry().then(res => {
      setCountryInfo(res);
      setChartCountry(res.find(item => item.continent === 'Hot')?.countries[0].name ?? '');
      setSelectCountry({
        key: res.find(item => item.continent === 'Hot')?.countries[0].name ?? '',
        value: res.find(item => item.continent === 'Hot')?.countries[0].nameCn ?? '',
      });
    });
  }, []);
  const handleTabChange = useMemoizedFn((param: string) => {
    setActiveKey(param);
    setChartCountry(countryInfo.find(item => item.continent === param)?.countries[0].name ?? '');
    setSelectCountry({
      key: countryInfo.find(item => item.continent === param)?.countries[0].name ?? '',
      value: countryInfo.find(item => item.continent === param)?.countries[0].nameCn ?? '',
    });
  });
  return (
    <div className={style.tabContnet}>
      <Tabs activeKey={activeKey} onChange={handleTabChange}>
        {countryInfo.map(item => (
          <TabPane tab={item.continentCn} key={item.continent} />
        ))}
      </Tabs>
      <Row gutter={[12, 8]} className={style.brCountry}>
        {countryInfo
          .find(item => item.continent === activeKey)
          ?.countries.map(vl => {
            const flag = nationComponentMap[vl.name] || {};
            const checked = chartCountry === vl.name;
            return (
              <Col
                flex={'0 0 20%'}
                style={{
                  maxWidth: '16.6%',
                }}
                key={vl.name}
              >
                <div
                  className={classNames(style.item, {
                    [style.itemSelect]: checked,
                  })}
                  onClick={() => {
                    setSelectCountry({
                      key: vl.name,
                      value: vl.nameCn,
                    });
                    setChartCountry(vl.name);
                  }}
                >
                  <i style={{ backgroundImage: flag.component ? `url(${flag.component})` : 'none' }} />
                  <span title={vl.nameCn} className={style.name}>
                    {vl.nameCn}
                  </span>
                </div>
              </Col>
            );
          })}
      </Row>
    </div>
  );
};

export default BrTab;
