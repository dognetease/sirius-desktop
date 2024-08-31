import { MergeCompany } from 'api/src';
import React, { FC } from 'react';
import { TableColumnsType } from 'antd';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import style from './companyDetail.module.scss';

export const mergeDomainHeadercolumns: TableColumnsType<{ name: string; country?: string; location?: string }> = [
  {
    title: '公司名称',
    dataIndex: 'name',
  },
  {
    title: '国家/地区',
    dataIndex: 'country',
  },
  {
    title: '地址',
    dataIndex: 'location',
  },
];

export const MergeCompanyTable: FC<{
  list: Array<MergeCompany>;
  rowKey: string;
}> = ({ list, rowKey }) => (
  <>
    <div className={style.virtualTable}>
      <div className={style.virtualTableHeader}>
        <div className={style.virtualTableHeaderTitle}>
          <span>全部相关公司</span>
        </div>
        <div className={style.virtualTableHeaderIntro}>以下公司由于官网一致，系统已对下列公司的介绍、联系人合并展示。</div>
      </div>
      <VirtualTable
        rowKey={rowKey}
        rowHeight={46}
        columns={mergeDomainHeadercolumns}
        dataSource={list}
        autoSwitchRenderMode
        enableVirtualRenderCount={50}
        scroll={{ y: 368 }}
        pagination={false}
      />
    </div>
  </>
);
