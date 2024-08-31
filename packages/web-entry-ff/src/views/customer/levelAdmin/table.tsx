import React, { useMemo } from 'react';
import { Space } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { FFMSLevelAdmin, FFMSCustomer } from 'api';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import FfConfirm from '../components/popconfirm';
import { activeProps } from './index';

interface Props {
  type: activeProps;
  priceType: string;
  dataSource: FFMSLevelAdmin.ListItem[] | FFMSCustomer.TypeItem[];
  loading: boolean;
  onChangeRow: (levelId: string) => void;
  onChangeCustomerRow: (id: string) => void;
  onDelete: (levelId: string) => void;
  onCustomerDelete: (id: string) => void;
}

export const _ = (value: string) => (value?.includes('-') ? value : `+${value}`);
export const showData = (isDefault: boolean, val1: string, val2: string, val3: string) => {
  if (isDefault) {
    return `${_(val1)}% /${_(val2)}% /${_(val3)}%`;
  }
  return `${_(val1)} /${_(val2)} /${_(val3)}`;
};

const CustomerTable: React.FC<Props> = props => {
  const { dataSource, type, onChangeRow, onChangeCustomerRow, onDelete, onCustomerDelete, loading, priceType } = props;
  const disabled = useMemo(() => type === FFMSLevelAdmin.CUSTOMER_TYPE.POTENTIAL_CLIENT, []);

  let columns;
  if (type === 'CUSTOMER_LEVEL') {
    columns = [
      {
        title: '等级',
        dataIndex: 'levelName',
        render: (value, row) => <span>{`${value} ${row.defaultLevel ? '（默认）' : ''}`}</span>,
      },
      {
        title: '等级/价差',
        dataIndex: 'advance',
        render: (value, item) => <span>{showData(priceType === 'PERCENT', item.advance20gp, item.advance40gp, item.advance40hc)}</span>,
      },
      {
        title: '更新时间',
        dataIndex: 'updateAt',
        render: value => <span>{value ? value : '-'}</span>,
      },
      {
        title: '操作',
        width: 200,
        render(_, row) {
          return disabled ? (
            '-'
          ) : (
            <Space size={20}>
              <a type="link" onClick={() => onChangeRow(row.levelId)}>
                修改
              </a>
              <FfConfirm title="确认删除 ?" onConfirm={() => onDelete(row.levelId)}>
                {row.defaultLevel ? null : <a type="link">删除</a>}
              </FfConfirm>
            </Space>
          );
        },
      },
    ] as ColumnsType<FFMSLevelAdmin.ListItem>;
  } else {
    columns = [
      {
        title: '客户类型',
        dataIndex: 'customerTypeName',
      },
      {
        title: '价差',
        dataIndex: 'advance',
        render: (value, row: FFMSCustomer.TypeItem) => {
          if (row?.defaultType) {
            return '自定义';
          }
          return <span>{priceType === 'PERCENT' ? `${_(value)}%` : `${_(value)}`}</span>;
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updateAt',
        render: value => <span>{value ? value : '-'}</span>,
      },
      {
        title: '操作',
        width: 200,
        render(_, row) {
          return (
            <Space size={20}>
              <a type="link" onClick={() => onChangeCustomerRow(row.customerTypeId)}>
                修改
              </a>
              <FfConfirm title="确认删除 ?" onConfirm={() => onCustomerDelete(row.customerTypeId)}>
                {type === FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT && !row.defaultType ? <a type="link">删除</a> : null}
              </FfConfirm>
            </Space>
          );
        },
      },
    ] as ColumnsType<FFMSCustomer.TypeItem>;
  }
  return <Table pagination={false} loading={loading} columns={columns} dataSource={dataSource} />;
};

export default CustomerTable;
