import React from 'react';
import { SiteApi, api, apis } from 'api';
import { useState } from 'react';
import { ColumnsType } from 'antd/lib/table';
import { ExpenseStatisticDimensions } from '../GoogleDelivery';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export interface ExpenseStatisTableDataItem {
  averageCost: number;
  clicks: number;
  country: string;
  totalCost: number;
  impressions: number;
  unit: string;
}

const useExpenseStatisticsTable = () => {
  const expenseStatisTableColumns: ColumnsType<ExpenseStatisTableDataItem> = [
    {
      title: '平均点击花费',
      dataIndex: 'averageCost',
      render: (value, record) => {
        return `${value}${record.unit}`;
      },
    },
    {
      title: '总花费',
      dataIndex: 'totalCost',
      render: (value, record) => {
        return `${value}${record.unit}`;
      },
    },
    {
      title: '展示次数',
      dataIndex: 'impressions',
    },
    {
      title: '点击次数',
      dataIndex: 'clicks',
    },
  ];

  const getExpenseStatisTableColumns = (dimension: ExpenseStatisticDimensions) => {
    let firstColumn = null;
    if (dimension === ExpenseStatisticDimensions.country) {
      firstColumn = {
        title: '国家/地区',
        dataIndex: ExpenseStatisticDimensions.country,
        ellipsis: {
          showTitle: false,
        },
        render: (value: any) => <EllipsisTooltip>{value}</EllipsisTooltip>,
      };
    } else if (dimension === ExpenseStatisticDimensions.keyword) {
      firstColumn = {
        title: '关键词',
        dataIndex: ExpenseStatisticDimensions.keyword,
        ellipsis: {
          showTitle: false,
        },
        render: (value: any) => <EllipsisTooltip>{value}</EllipsisTooltip>,
      };
    } else {
      firstColumn = {
        title: '日期',
        dataIndex: ExpenseStatisticDimensions.date,
        ellipsis: {
          showTitle: false,
        },
        render: (value: any) => <EllipsisTooltip>{value}</EllipsisTooltip>,
      };
    }
    return [firstColumn, ...expenseStatisTableColumns] as ColumnsType<ExpenseStatisTableDataItem>;
  };

  const [expenseStatisTableData, setExpenseStatisTableData] = useState<ExpenseStatisTableDataItem[]>([]);

  const [expenseStatisTableLoading, setExpenseStatisTableLoading] = useState(false);

  const fetchExpenseStatisTableData = async (siteId: string, sTime: string, eTime: string, currDimension: ExpenseStatisticDimensions) => {
    setExpenseStatisTableLoading(true);
    try {
      const data = await siteApi.getExpenseStatistics({
        siteId,
        sTime,
        eTime,
        type: currDimension,
      });

      if (Array.isArray(data) && data.length > 0) {
        setExpenseStatisTableData([...data]);
      } else {
        setExpenseStatisTableData([]);
      }
    } catch (error) {
      console.error(error);
    }
    setExpenseStatisTableLoading(false);
  };

  return {
    getExpenseStatisTableColumns,
    expenseStatisTableData,
    expenseStatisTableLoading,
    fetchExpenseStatisTableData,
  };
};

export default useExpenseStatisticsTable;
