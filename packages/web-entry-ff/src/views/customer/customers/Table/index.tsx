import React, { useCallback } from 'react';
import { TableProps, Space } from 'antd';
import { FFMSCustomer } from 'api';
import NationFlag from '@web/components/Layout/CustomsData/components/NationalFlag';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import classnames from 'classnames';
import type { ColumnsType } from 'antd/es/table';
import FfConfirm from '../../components/popconfirm';
import { showData } from '../../levelAdmin/table';
import style from './style.module.scss';

export enum ViewType {
  Company = 'Company',
  Email = 'Email',
  Task = 'Task',
}

interface CustomerTableProps<T> extends TableProps<T> {
  discountType: string;
  onEdit: (row: FFMSCustomer.ListItem) => void;
  onDelete: (id: string) => void;
  onView?: (type: ViewType, row: FFMSCustomer.ListItem) => void;
}

export const CustomerTable = <T extends object>(props: CustomerTableProps<T>) => {
  const { discountType, onDelete, onEdit, onView, ...restProps } = props;
  const handleView = useCallback(
    (type: ViewType, row: FFMSCustomer.ListItem) => {
      if (onView) {
        onView(type, row);
      }
    },
    [onView]
  );

  const columns: ColumnsType<FFMSCustomer.ListItem> = [
    {
      title: '企业名称',
      dataIndex: 'customerName',
      ellipsis: true,
      render(value, item) {
        const hasData = Boolean(item?.searchCompany?.id);
        return (
          <div className={style.companyName}>
            <div className={hasData ? style.ellipsis : style.wrap}>{value || '--'}</div>
            {hasData ? (
              <div className={style.searchData}>
                <span>关联海关公司：</span>
                <div className={classnames(style.linkBtn, style.ellipsis)} onClick={() => handleView(ViewType.Company, item)}>
                  {item?.searchCompany?.name || '--'}
                </div>
                <NationFlag style={{ marginLeft: 5 }} showLabel={false} name={item?.searchCompany?.country} />
              </div>
            ) : (
              ''
            )}
          </div>
        );
      },
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      render(value) {
        return <div className={style.phoneNumber}>{value || '--'}</div>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      render(value, item) {
        return (
          <div className={classnames(style.linkBtn, style.email)} onClick={() => handleView(ViewType.Email, item)}>
            {item?.unsubscribed && <div className={style.tag}>退订</div>}
            {value}
          </div>
        );
      },
    },
    {
      title: '订阅任务',
      ellipsis: true,
      render(_, item) {
        if (!item.edmEmailId) {
          return '--';
        }

        return (
          <div className={classnames(style.linkBtn, style.task)} onClick={() => handleView(ViewType.Task, item)}>
            {item.edmSubject || '--'}
          </div>
        );
      },
    },
    {
      title: '等级',
      dataIndex: 'levelName',
      sorter: true,
      render: (value, item) => (
        <Tooltip title={showData(discountType === 'PERCENT', item.advance20gp, item.advance40gp, item.advance40hc)}>
          <span>{value}</span>
        </Tooltip>
      ),
    },
    {
      title: '最终价格',
      dataIndex: 'finalDiscount',
      render: (value, item) => <span>{showData(discountType === 'PERCENT', item.finalPrice20gp, item.finalPrice40gp, item.finalPrice40hc)}</span>,
    },
    {
      title: '添加时间',
      dataIndex: 'createAt',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render(_: string, row: any) {
        return (
          <Space size={20}>
            <span className={style.linkBtn} onClick={() => onEdit(row)}>
              编辑
            </span>
            <FfConfirm title="确认删除 ?" onConfirm={() => onDelete(row.customerId)}>
              <span className={style.linkBtn}>删除</span>
            </FfConfirm>
          </Space>
        );
      },
    },
  ];

  return <Table scroll={{ x: 'max-content' }} columns={columns} {...restProps} showTotal={(total: number) => `共${total}条`} />;
};
