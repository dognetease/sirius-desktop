import React, { FC, useState, useEffect } from 'react';
import { Table } from 'antd';
import { QueryReport, isElectron } from 'api';

import { OpenEdmDetail, getDetailPath } from './util';
import { getIn18Text } from 'api';
/**
 * edmSubject: string;
    emailSubjects: string[];
    arriveCount: number;
    readCount: number;
    readRatio: string;
 */

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
    title: getIn18Text('YOUJIANZHUTI'),
    dataIndex: 'emailSubjects',
    key: 'emailSubjects',
    render: (items: Array<string>) => (
      <>
        {items.map(item => (
          <div>{item}</div>
        ))}
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
    title: getIn18Text('DAKAILV'),
    dataIndex: 'readRatio',
    key: 'readRatio',
  },
];

export const OpenedData: FC<{
  originData: QueryReport['readStat']['readList'];
}> = ({ originData }) => {
  const [data, setData] = useState();

  return <Table pagination={false} columns={columns} dataSource={originData} />;
};
