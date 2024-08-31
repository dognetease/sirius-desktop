import React from 'react';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import style from './table.module.scss';
import type { ColumnsType } from 'antd/es/table';

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

const Table = () => {
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
  return (
    <div className={style.uploadTable}>
      <VirtualTable pagination={false} columns={columns} dataSource={createData(500)} autoSwitchRenderMode={true} enableVirtualRenderCount={50} scroll={{ y: 300 }} />
    </div>
  );
};

export default Table;
