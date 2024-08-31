import React from 'react';
import { Table } from 'antd';
import style from './closeRecord.module.scss';
import { getIn18Text } from 'api';
interface CloseRecordProps {
  data: any;
}
const columns = [
  {
    title: getIn18Text('CAOZUOREN'),
    dataIndex: 'create_by',
  },
  {
    title: getIn18Text('SHIJIAN'),
    dataIndex: 'create_at',
  },
  {
    title: getIn18Text('GUANBISHIZHUANGTAI'),
    dataIndex: 'status_name',
  },
  {
    title: getIn18Text('YUANYIN'),
    dataIndex: 'close_reason',
  },
];
const CloseRecord: React.FC<CloseRecordProps> = props => {
  const { data } = props;
  return (
    <Table
      columns={columns}
      // className={style.closeRecord}
      dataSource={data || []}
      pagination={false}
      size="small"
      rowKey="id"
      bordered
    />
  );
};
export default CloseRecord;
