import React, { FC, useState, useEffect } from 'react';
import { Table } from 'antd';
import { QueryReport, isElectron } from 'api';
import { OpenEdmDetail, getDetailPath } from './util';
import { getIn18Text } from 'api';

// 营销任务、邮件标题（点击支持查看邮件详情）、送达人数、打开人数、退订人数
const columns = [
  {
    title: getIn18Text('YINGXIAORENWU'),
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
    title: getIn18Text('YOUJIANBIAOTI'),
    // dataIndex: 'age',
    key: 'emailSubject',
    render: (item: any) => (
      <>
        {item.emailSubject.map((title: string) => (
          <div key={title}>{title}</div>
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
    title: getIn18Text('TUIDINGZONGSHU'),
    dataIndex: 'unsubscribeCount',
    key: 'unsubscribeCount',
  },
];

export const TdPeople: FC<{
  data: QueryReport['unsubscribeStat']['unsubscribeList'];
}> = ({ data }) => {
  return <Table pagination={false} columns={columns} dataSource={data} />;
};
