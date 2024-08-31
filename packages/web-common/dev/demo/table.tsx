import React, { useState, useEffect } from 'react';
import SiriusTable from '@web-common/components/UI/Table';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import { Divider, Button, message, Descriptions, Tooltip, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import style from './table.module.scss';

export const TableComponent = () => {
  return (
    <>
      <Divider orientation="left"> 基础表格</Divider>
      <SiriusTable pagination={false} columns={columns} dataSource={data} />
      <Divider orientation="left"> resize表格</Divider>
      <SiriusTable className={style.picTable} resizable={true} pagination={false} columns={columns} dataSource={data3} />
      <Divider orientation="left"> resize表格 固定列</Divider>
      <SiriusTable resizable={true} pagination={false} columns={columnsFixLeft} dataSource={data} scroll={{ x: 1600 }} />
      <Divider orientation="left"> resize表格 全部列可设置</Divider>
      <SiriusTable resizable={true} pagination={false} columns={columnsAllResiable} dataSource={data} scroll={{ x: 'max-content' }} />
      <Divider orientation="left"> 图片类型</Divider>
      <SiriusTable className={style.picTable} pagination={false} columns={columns} dataSource={data3} />
      <Divider orientation="left"> 固定表头</Divider>
      <SiriusTable
        // pagination ={false}
        columns={columns}
        dataSource={data2}
        scroll={{ y: 300 }}
      />
      <Divider orientation="left"> 固定列头</Divider>
      <SiriusTable
        pagination={{
          size: 'small',
          total: 200,
          // current: params.start,
          // pageSize: params.limit,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
        }}
        columns={columnsFixLeft}
        dataSource={data}
        scroll={{ x: 1600 }}
      />
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
      <Divider orientation="left"> 虚拟列表</Divider>
      <VirtualTable
        pagination={false}
        rowSelection={{
          type: 'checkbox',
        }}
        columns={columns}
        dataSource={createData(500)}
        autoSwitchRenderMode={true}
        enableVirtualRenderCount={50}
        scroll={{ y: 300 }}
      />
      <Alert
        style={{
          marginTop: 25,
        }}
        type="success"
        message="关于VirtualTable更完整的使用场景，可以参考：'packages/web/src/components/Layout/Worktable/employeeRankCard/EmployeeRankCard.tsx'"
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

// columnsAllResiable
const columnsAllResiable: ColumnsType<DataType> = [
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
  { title: 'Column 1', width: 150, dataIndex: 'address', key: '1' },
  { title: 'Column 2', width: 150, dataIndex: 'address', key: '2' },
  { title: 'Column 3', width: 150, dataIndex: 'address', key: '3' },
  { title: 'Column 4', width: 150, dataIndex: 'address', key: '4' },
];

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

const createData = (counts: number) => {
  const data: DataType[] = [];
  for (let i = 0; i < counts; i++) {
    data.push({
      key: i,
      name: `Edward King ${i}`,
      age: 32,
      address: `London, Park Lane no. ${i}`,
    });
  }

  return data;
};

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
    name: <img className="pic" width={64} height={64} src="https://nos.netease.com/rms/6ccbca70e4b453c54562baf540e2e74d?download=POPO%E6%8E%A8%E9%80%81banner.png" />,
    // name: <img className="pic" width={64} height={64} src="https://waimao.office.163.com/static/favicon_edm-5592538abd957cacd6203748f1f1d71d.png" />,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}
