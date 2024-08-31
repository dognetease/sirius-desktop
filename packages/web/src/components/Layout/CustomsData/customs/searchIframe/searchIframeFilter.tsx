import React from 'react';
import styles from './index.module.scss';
import { Input, Tooltip, DatePicker, Select } from 'antd';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { getIn18Text } from 'api';
const dateShowFormat = 'yyyy/MM/DD';
const { RangePicker } = DatePicker;
interface Props {
  handleSearchParmas: (val: any, nameStr: string) => void;
}
export interface ITabOption {
  label: string;
  value?: number;
}
const initSearchTypeOptions: ITabOption[] = [
  {
    label: '全部',
    value: 0,
  },
  {
    label: '线索',
    value: 1,
  },
];
const searchIframeFilter: React.FC<Props> = ({ handleSearchParmas }) => {
  return (
    <>
      <div className={styles.searchBox}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchLabel}>{getIn18Text('GONGSIMINGCHENG')}</span>
          <Input
            type="text"
            size="middle"
            placeholder={`${getIn18Text('QINGSHURUGONGSIMINGCHENG')}`}
            allowClear
            onBlur={e => handleSearchParmas(e.target.value, 'companyName')}
            // onPressEnter={(e, value) => handleSearchParmas(value, 'companyName')}
            style={{ width: '100%' }}
          />
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchLabel}>{'查询时间'}</span>
          <RangePicker
            separator={' - '}
            style={{ width: '100%', marginRight: '8px', verticalAlign: 'top' }}
            placeholder={[getIn18Text('KAISHIRIQI'), getIn18Text('JIESHURIQI')]}
            locale={cnlocale}
            format={dateShowFormat}
            onChange={val => handleSearchParmas(val, 'searchTime')}
          />
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchLabel}>{'查询类型'}</span>
          <Select defaultValue={0} onChange={e => handleSearchParmas(e, 'status')} style={{ width: '100%' }}>
            {initSearchTypeOptions.map((item, index) => {
              return (
                <Select.Option key={index} value={item?.value || 0}>
                  {item.label}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      </div>
    </>
  );
};
export default searchIframeFilter;
