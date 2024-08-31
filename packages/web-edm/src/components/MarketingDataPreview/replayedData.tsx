import React, { FC, useState, useEffect } from 'react';
import { QueryReport, isElectron } from 'api';
import { Table } from 'antd';
import { OpenEdmDetail, getDetailPath } from './util';
import { getIn18Text } from 'api';

// 任务名称、送达人数、打开人数、回复总数、回复率
const columns = [
  {
    title: getIn18Text('RENWUMINGCHENG'),
    // dataIndex: 'edmSubject',
    key: 'edmSubject',
    render: (item: any) => (
      <>
        {isElectron() ? (
          <a target="_blank" onClick={() => OpenEdmDetail(item.edmEmailId, item.edmMode)}>
            {item.edmSubject}
          </a>
        ) : (
          <a target="_blank" href={`${location.origin}${getDetailPath()}&detailId=${item.edmEmailId}&isParent=${item.edmMode}`}>
            {item.edmSubject}
          </a>
        )}
      </>
    ),
  },
  {
    title: getIn18Text('SONGDAZONGSHU'),
    dataIndex: 'arriveCount',
    key: 'arriveCount',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    dataIndex: 'readCount',
    key: 'readCount',
  },
  {
    title: getIn18Text('HUIFUZONGSHU'),
    dataIndex: 'replyCount',
    key: 'replyCount',
  },
  {
    title: getIn18Text('HUIFULV'),
    dataIndex: 'replyRatio',
    key: 'replyRatio',
  },
];

export const ReplayedData: FC<{
  data: QueryReport['replyStat']['replyList'];
}> = ({ data }) => {
  return <Table pagination={false} columns={columns} dataSource={data} />;
};
