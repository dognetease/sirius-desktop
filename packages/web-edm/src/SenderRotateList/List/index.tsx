import React, { FC, useState, useRef } from 'react';
import { DatePicker, Skeleton } from 'antd';
import { getIn18Text } from 'api';
import { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';

import styles from './List.module.scss';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';
// function disabledDate(current: Moment) {
//   if (timeType === 'createTime' || timeType === 'recentlyUpdateTime') {
//     return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
//   }
//   return false;
// }

export const List: FC = props => {
  const [timeRange, setTimeRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const statisticsList = useRef<HTMLDivElement>(null);
  const timeToggle = (values: any) => {
    setTimeRange(values);
    // setSearchCondition({
    //   ...searchCondition,
    //   ...getCurrentTime(timeType, values),
    //   page: 1,
    //   pageSize: 20,
    // });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>{getIn18Text('DUOYUMINGYINGXIAOSHUJU')}</div>
        <div className={styles.right}>
          <RangePicker
            separator=""
            style={{ width: 266, height: 32 }}
            // className={searchCondition.recentlyUpdateTime ? '' : 'edm-range-picker'}
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            value={timeRange}
            format={dateFormat}
            onChange={timeToggle}
            // disabledDate={disabledDate}
            dropdownClassName="edm-date-picker-dropdown-wrap"
            className={styles.rangePicker}
          />
        </div>
      </div>
    </div>
  );
};
