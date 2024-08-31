import React from 'react';
import { Table, Tooltip } from 'antd';
import style from './mergeClientModal.module.scss';

const BusinessTable = () => {
  const columns = [
    {
      title: '商机名称',
      dataIndex: 'name',
      width: 116,
      fixed: 'left',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record, index) => (
        <Tooltip placement="topLeft" title={text}>
          <span className={style.companyName} onClick={() => {}}>
            {' '}
            {text || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '商机阶段',
      width: 86,
      dataIndex: 'stage_name',
      render: text => text || '-',
    },
    {
      title: '预估商机金额',
      width: 108,
      dataIndex: 'estimate',
      render: text => text || '-',
    },
    {
      title: '成交日期',
      dataIndex: 'deal_at',
      width: 112,
      render: text => text || '-',
      sorter: true,
    },
    {
      title: '成交金额',
      width: 100,
      dataIndex: 'turnover',
      render: text => text || '-',
    },
  ] as any;
  return (
    <div style={{ width: 554, padding: 16 }}>
      <h3>商机{}</h3>
      <Table className="edm-table" scroll={{ y: 316 }} columns={columns} pagination={false} dataSource={list} />
    </div>
  );
};

export default BusinessTable;
