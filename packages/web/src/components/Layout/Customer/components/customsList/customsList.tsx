import React, { useState } from 'react';
import { CustomerConditionType, DocumentItem, ReqDocumentList, customsRecordItem } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './customsList.module.scss';
import { PaginationProps, Table } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import classnames from 'classnames';
import { getIn18Text } from 'api';
export type DocumentListFilter = Omit<ReqDocumentList, 'condition' | 'condition_id'>;
const tabCompanyType = [
  {
    label: getIn18Text('CAIGOU'),
    value: 'buysers',
  },
  {
    label: getIn18Text('GONGYING'),
    value: 'suppliers',
  },
];
export interface DocumentListProps {
  data?: customsRecordItem[];
  onSeeDetail: (title: string, country: string) => void;
  pagination?: {
    total: number;
    current: number;
  };
  tabsCompanyChange: (key: string) => void;
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
  const { data, pagination, tabsCompanyChange, pageChange, tableLoading } = props;
  const handleTableChange = (pagination: TablePaginationConfig) => {
    const { current } = pagination;
    current && pageChange(current);
  };
  const columns: ColumnsType<any> = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
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
      title: getIn18Text('GUOJIADEQU'),
      dataIndex: 'country',
      width: '25%',
      render: text => (
        <EllipsisTooltip>
          <span>{text || '-'}</span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('CHANPINMIAOSHU'),
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
      <CustomerTabs className={classnames(style.tabsTypeTop)} defaultActiveKey="1" tabList={tabCompanyType} onChange={tabsCompanyChange} />
      <div>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          loading={tableLoading}
          // scroll={{ x: 'max-content' }}
          pagination={{
            ...defaultPagination,
            ...pagination,
          }}
          onChange={handleTableChange}
          rowKey="companyName"
        />
      </div>
    </div>
  );
};
