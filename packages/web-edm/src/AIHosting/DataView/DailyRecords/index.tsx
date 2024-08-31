import React, { FC } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { GetAiDailyStatsRes } from 'api';
import classnames from 'classnames';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { NoData } from '../Nodata';

import styles from './DailyRecords.module.scss';
import { getIn18Text } from 'api';

const columns = (toDetail: (date: string) => void, actionTrace: (action: string) => void): ColumnsType<{}> => [
  {
    title: getIn18Text('RIQI'),
    key: 'date',
    dataIndex: 'date',
    width: 124,
  },
  {
    title: getIn18Text('YINGXIAORENSHU'),
    key: 'receiverCount',
    dataIndex: 'receiverCount',
  },
  {
    title: getIn18Text('HUIFUZONGSHU'),
    key: 'replyCount',
    dataIndex: 'replyCount',
  },
  {
    title: getIn18Text('FASONGFENGSHU'),
    key: 'sendNum',
    dataIndex: 'sendNum',
  },
  {
    title: getIn18Text('SONGDAFENGSHU'),
    key: 'arriveNum',
    dataIndex: 'arriveNum',
  },
  {
    title: getIn18Text('SONGDALV'),
    key: 'arriveRatio',
    dataIndex: 'arriveRatio',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    key: 'readCount',
    dataIndex: 'readCount',
  },
  {
    title: getIn18Text('DAKAILV'),
    key: 'readRatio',
    dataIndex: 'readRatio',
  },
  {
    title: getIn18Text('TUIDINGZONGSHU'),
    key: 'unsubscribeNum',
    dataIndex: 'unsubscribeNum',
  },
  {
    title: getIn18Text('CAOZUO'),
    key: '',
    render: item => (
      <a
        style={{
          color: '#4c6aff',
        }}
        onClick={() => {
          toDetail(item.date);
          actionTrace('dateDetali');
        }}
      >
        {getIn18Text('XIANGQING')}
      </a>
    ),
  },
];

export const DailyRecords: FC<{
  list: GetAiDailyStatsRes['dailyStats'];
  toDetail: (date: string) => void;
  actionTrace: (action: string) => void;
}> = props => {
  const { list, toDetail, actionTrace } = props;

  return (
    <div className={styles.list}>
      <div className={styles.title}>
        <div className={styles.bar}></div>
        <div className={styles.label}>{getIn18Text('MEIRIYINGXIAOJILU')}</div>
      </div>
      <div className={styles.table}>
        <SiriusTable
          className={classnames({
            [styles.tableWrap]: true,
            [styles.tableWrapNoData]: list == null || list.length === 0,
          })}
          columns={columns(toDetail, actionTrace)}
          dataSource={list}
          pagination={false}
          // rowClassName={(record, index) => index % 2 === 1 ? styles.row : ''}
        />
        {list == null || (list.length === 0 && <NoData />)}
      </div>
    </div>
  );
};
