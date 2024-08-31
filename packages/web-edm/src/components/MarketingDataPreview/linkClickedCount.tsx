import React, { FC, useState, useEffect } from 'react';
import { Table } from 'antd';
import { QueryReport, api, SystemApi, isElectron } from 'api';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

const systemApi = api.getSystemApi() as SystemApi;

// 链接、点击人数、点击次数
const columns = [
  {
    title: getIn18Text('LIANJIE'),
    dataIndex: 'traceUrl',
    key: 'traceUrl',
    width: 200,
    render: (item: string) => (
      <>
        {isElectron() ? (
          <a
            style={{
              whiteSpace: 'normal',
              wordBreak: 'break-all',
            }}
            onClick={() => {
              systemApi.openNewWindow(item);
            }}
          >
            {item}
          </a>
        ) : (
          <a
            style={{
              whiteSpace: 'normal',
              wordBreak: 'break-all',
            }}
            href={item}
            target="_blank"
          >
            {item}
          </a>
        )}
      </>
    ),
  },
  {
    title: getIn18Text('DIANJIRENSHU'),
    dataIndex: 'clickCount',
    key: 'clickCount',
  },
  {
    title: getIn18Text('clickTimes'),
    dataIndex: 'clickNum',
    key: 'clickNum',
  },
];

export const LinkClickedCount: FC<{
  data: QueryReport['traceStat']['traceList'];
}> = ({ data }) => {
  return <Table pagination={false} columns={columns} dataSource={data} />;
};
