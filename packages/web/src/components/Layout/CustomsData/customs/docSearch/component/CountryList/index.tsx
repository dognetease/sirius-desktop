import { Tabs, Row, Col } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './countrylist.module.scss';
import { useCustomsCountryHook } from './customsCountryHook';
import dictionary from '../../../../components/NationalFlag/dictionary';
import extraFlagDictionary from './countryExtraDictionary';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { getIn18Text } from 'api';

const flagDictionary = extraFlagDictionary.concat(dictionary);

type NationMap = {
  [n: string]: {
    component: string;
  };
};
const nationComponentMap: NationMap = {};
for (const item of flagDictionary) {
  Object.assign(nationComponentMap, {
    [item.code]: {
      component: item.flag && require(`@/images/flags/${item.flag}`),
    },
  });
}

interface CountryListProps {
  onCountrySelect?(country: string[], continent?: string): void;
}

const CountryList: React.FC<CountryListProps> = ({ onCountrySelect }) => {
  const [allContinents] = useCustomsCountryHook();

  return (
    <div className={styles.container}>
      <p className={styles.title}>{getIn18Text('QUANQIUGEGUOMAOYISHUJU')}</p>
      <Tabs defaultActiveKey="North America" className={styles.tab} tabBarGutter={24}>
        {allContinents.map(con => (
          <Tabs.TabPane className={styles.tabpanel} key={con.continent} tab={con.continentCn}>
            <OverlayScrollbarsComponent
              options={{
                scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
                overflowBehavior: {
                  x: 'hidden',
                  y: 'scroll',
                },
              }}
              className={styles.listWrap}
            >
              <Row gutter={[16, 8]} className={styles.list}>
                {con.countries.map(el => {
                  const flag = nationComponentMap[el.name] || {};
                  return (
                    <Col span={4} key={el.name}>
                      <div
                        className={classNames(styles.item)}
                        onClick={() => {
                          onCountrySelect?.([el.name], con.continent);
                        }}
                      >
                        <i style={{ backgroundImage: flag.component ? `url(${flag.component})` : 'none' }} />
                        <span title={el.nameCn} className={styles.name}>
                          {el.nameCn}
                        </span>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </OverlayScrollbarsComponent>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default CountryList;
