import React, { FC, useState, useEffect } from 'react';
import { QueryReport } from 'api';
import { Table } from 'antd';
import { getIn18Text } from 'api';

const columns = [
  {
    title: getIn18Text('SHEBEILEIXING'),
    dataIndex: 'platForm',
    key: 'platForm',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    dataIndex: 'readCount',
    key: 'readCount',
  },
  {
    title: getIn18Text('DAKAICISHU'),
    dataIndex: 'readNum',
    key: 'readNum',
  },
];

export const OpenedEnds: FC<{
  data: QueryReport['readStat']['platFormList'];
}> = ({ data }) => {
  return <Table pagination={false} columns={columns} dataSource={data} />;
};
