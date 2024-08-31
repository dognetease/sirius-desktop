import React, { useContext } from 'react';
import { Tabs, Row, Col } from 'antd';
import { SearchDispatchContext, Action, SearchContext } from '../searchProvider';
import { PortSelect } from '../select';
import { SearchFav } from './searchFav';
import { ShipMaster } from './shipMaster';
import style from './style.module.scss';

export const SearchBar: React.FC = () => {
  const dispatch = useContext(SearchDispatchContext);
  const { searchState } = useContext(SearchContext);

  return (
    <div className={style.wrapper}>
      <Tabs>
        <Tabs.TabPane tab="运价查询" key="1">
          <div className={style.tabContent}>
            <Row gutter={20}>
              <Col span={8}>
                <PortSelect
                  overlay={<></>}
                  name="起运港"
                  value={searchState.departurePortCode}
                  onChange={departurePortCode => dispatch({ type: Action.UpdateSearch, payload: { departurePortCode } })}
                />
              </Col>
              <Col span={8}>
                <PortSelect
                  overlay={<></>}
                  name="目的港"
                  value={searchState.destinationPortCode}
                  onChange={destinationPortCode => dispatch({ type: Action.UpdateSearch, payload: { destinationPortCode } })}
                />
              </Col>
            </Row>
            <div className={style.tips}>* 必须先选择起运港、目的港后才能查询数据</div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="航线偏好" key="2">
          <div className={style.tabContent}>
            <SearchFav />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="船司" key="3">
          <div className={style.tabContent}>
            <ShipMaster />
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};
