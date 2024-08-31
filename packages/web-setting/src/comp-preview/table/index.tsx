import React from 'react';
import SiriusTable from '@web-common/components/UI/Table';
import { Divider, Button, message, Descriptions, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import style from './table.module.scss';

export const TableComponent = () => {
  return (
    <>
      <Divider orientation="left"> 基础表格</Divider>
      <SiriusTable pagination={false} columns={columns} dataSource={data} />
      <Divider orientation="left"> 图片类型</Divider>
      <SiriusTable className={style.picTable} pagination={false} columns={columns} dataSource={data3} />
      <Divider orientation="left"> 固定表头</Divider>
      <SiriusTable pagination={false} columns={columns} dataSource={data2} scroll={{ y: 300 }} />
      <Divider orientation="left"> 固定列头</Divider>
      <SiriusTable pagination={false} columns={columnsFixLeft} dataSource={data} scroll={{ x: 1600 }} />
      <Divider orientation="left"> 固定列尾</Divider>
      <SiriusTable pagination={false} columns={columnsFixRight} dataSource={data} scroll={{ x: 1600 }} />
      <Divider orientation="left"> 行hover态</Divider>
      <SiriusTable pagination={false} columns={columns} dataSource={data} />
      <Divider orientation="left"> 零值</Divider>
      <SiriusTable pagination={false} columns={columns} dataSource={data} />
      <Divider orientation="left"> 表格加载</Divider>
      <SiriusTable pagination={false} loading columns={columns} dataSource={data} />
      <Divider orientation="left"> 复选</Divider>
      <SiriusTable
        pagination={false}
        rowSelection={{
          type: 'checkbox',
        }}
        columns={columns}
        dataSource={data}
      />
    </>
  );
};

interface DataType {
  key: React.Key;
  name: string | any;
  age: number;
  address: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
    fixed: 'right',
  },
];

const data: DataType[] = [];
for (let i = 0; i < 3; i++) {
  data.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

data.push({
  key: 5,
  name: `` || '-',
  age: 0,
  address: `London, Park Lane no. `,
});

// FixLeft
const columnsFixLeft: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
    fixed: 'left',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
  },
];

// FixRight
const columnsFixRight: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
    fixed: 'right',
  },
];
const data2: DataType[] = [];

for (let i = 0; i < 100; i++) {
  data2.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}
const data3: DataType[] = [];

for (let i = 0; i < 4; i++) {
  data3.push({
    key: i,
    name: <img width={64} height={64} src="https://waimao.office.163.com/static/favicon_edm-5592538abd957cacd6203748f1f1d71d.png" />,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}
