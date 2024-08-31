import React from 'react';
import { ColumnType } from 'antd/lib/table';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';

const getColumns = (): ColumnType<any>[] => {
  const renderEllipsisTooltip = (text: string) => (
    <EllipsisTooltip>
      <span className="double-row">{text || '-'}</span>
    </EllipsisTooltip>
  );

  return [
    {
      title: getIn18Text('SHANGPINZHONGWENMINGCHENG'),
      dataIndex: 'product_name_cn',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: renderEllipsisTooltip,
    },
    {
      title: getIn18Text('SHANGPINYINGWENMINGCHENG'),
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'product_name_en',
      render: renderEllipsisTooltip,
    },
    {
      title: getIn18Text('SHANGPINBIANHAO'),
      width: 140,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'product_number',
      render: renderEllipsisTooltip,
    },
    {
      title: getIn18Text('YANSE'),
      width: 80,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'color',
      render: renderEllipsisTooltip,
    },
    {
      title: getIn18Text('XIAOSHOUBIZHONG'),
      width: 100,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'price_currency',
      render: renderEllipsisTooltip,
    },
    {
      title: getIn18Text('XIAOSHOUDANJIA'),
      width: 80,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'price',
      render: (text, record) => renderEllipsisTooltip(record.priceRange || text), // 优先展示价格区间
    },
    {
      title: getIn18Text('SHANGPINXINGHAO'),
      width: 110,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'length',
      render: (text, record) => {
        let str = '';
        if (record.length) {
          str += `L(${record.length})`;
        }
        if (record.width) {
          if (str) {
            str += '*';
          }
          str += `W(${record.width})`;
        }
        if (record.height) {
          if (str) {
            str += '*';
          }
          str += `H(${record.height})`;
        }
        return renderEllipsisTooltip(str);
      },
    },
  ];
};

export { getColumns };
