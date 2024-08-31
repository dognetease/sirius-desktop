import React, { useState } from 'react';
import { CustomerConditionType, DocumentItem, ReqDocumentList, customsRecordItem } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './customsList.module.scss';
import { PaginationProps, Table } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
export type DocumentListFilter = Omit<ReqDocumentList, 'condition' | 'condition_id'>;

export interface DocumentListProps {
  data?: customsRecordItem[];
  onSeeDetail: (title: string, country: string) => void;
  pagination?: {
    total: number;
    current: number;
  };
  pageChange: (page: number) => void;
  tableLoading: boolean;
}

const defaultPagination: PaginationProps = {
  current: 1,
  pageSize: 20,
  showSizeChanger: false,
  className: 'pagination-wrap pagination-customs',
  showTotal: total => `共${total}条`,
  total: 0,
};

export const CustomsList: React.FC<DocumentListProps> = props => {
  const { data, pagination, pageChange, tableLoading } = props;
  const handleTableChange = (pagination: TablePaginationConfig) => {
    const { current } = pagination;
    current && pageChange(current);
  };

  const columns: ColumnsType<any> = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      width: '25%',
      render(title, item) {
        return (
          <div onClick={() => props.onSeeDetail(title, item.country)} style={{ cursor: 'pointer' }}>
            <EllipsisTooltip>
              <a>{title}</a>
            </EllipsisTooltip>
          </div>
        );
      },
    },
    {
      title: '国家地区',
      dataIndex: 'country',
      width: '25%',
      render: text => (
        <EllipsisTooltip>
          <span>{text || '-'}</span>
        </EllipsisTooltip>
      ),
    },
    {
      title: '产品描述',
      dataIndex: 'topProductDesc',
      ellipsis: {
        showTitle: false,
      },
      width: '50%',
      render: text => (
        <EllipsisTooltip textColor={style.customerHeightLimit}>
          <span>{text || '-'}</span>
        </EllipsisTooltip>
      ),
    },
  ];

  return (
    <div className={style.customsListWrap}>
      <Table
        size="small"
        columns={columns}
        dataSource={data}
        loading={tableLoading}
        pagination={{
          ...defaultPagination,
          ...pagination,
        }}
        onChange={handleTableChange}
        rowKey="companyName"
      />
    </div>
  );
};
