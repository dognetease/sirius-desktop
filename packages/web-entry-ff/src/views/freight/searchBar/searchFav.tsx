import React, { useContext } from 'react';
import { Descriptions, Switch, Select, DatePicker, Radio, RadioChangeEvent } from 'antd';
import { SearchDispatchContext, Action, SearchContext } from '../searchProvider';
import style from './style.module.scss';

const { RangePicker } = DatePicker;
export const SearchFav: React.FC = () => {
  const dispatch = useContext(SearchDispatchContext);
  const { searchState } = useContext(SearchContext);

  const onSortChange = (e: RadioChangeEvent) => {
    const {
      target: { value },
    } = e;
    dispatch({ type: Action.UpdateSearch, payload: { sort: value } });
  };

  const onDateChange = (sailingDate: any) => {
    dispatch({ type: Action.UpdateSearch, payload: { sailingDate } });
  };

  return (
    <div className={style.searchFav}>
      <Descriptions layout="vertical" column={7}>
        <Descriptions.Item label="默认排序" span={3}>
          <Radio.Group
            options={[
              {
                label: (
                  <>
                    价格低优先
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <Select
                        size="small"
                        style={{ marginLeft: 10 }}
                        value={searchState.priceSortField}
                        onChange={value => dispatch({ type: Action.UpdateSearch, payload: { priceSortField: value } })}
                        options={[
                          { label: '20GP', value: 'price20GP' },
                          { label: '40GP', value: 'price40GP' },
                          { label: '40HC', value: 'price40HC' },
                        ]}
                      />
                    </span>
                  </>
                ),
                value: 'price',
              },
              { label: '耗时短优先', value: 'voyage:asc' },
              { label: '出发时间早优先', value: 'sailingDate:asc' },
            ]}
            value={searchState.sort}
            onChange={onSortChange}
          />
        </Descriptions.Item>
        <Descriptions.Item label="出发日期" span={2}>
          <RangePicker value={searchState.sailingDate} onChange={onDateChange} />
        </Descriptions.Item>
        <Descriptions.Item label="是否展示已过期" span={2}>
          <Switch
            checked={searchState.expireFreight}
            onChange={expireFreight => dispatch({ type: Action.UpdateSearch, payload: { expireFreight } })}
            checkedChildren="是"
            unCheckedChildren="否"
          />
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};
