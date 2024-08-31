import { SiteApi, api, apis } from 'api';
import { useState } from 'react';
import { ColumnsType } from 'antd/lib/table';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export interface ExpenseRecordTableDataItem {
  clickTime: string; // 点击时间
  cost: number; // 花费
  country: string; // 国家地区
  keyword: string; // 关键词
}

const useExpenseRecordTable = () => {
  const expenseRecordTableColumns: ColumnsType<ExpenseRecordTableDataItem> = [
    {
      title: '关键词',
      dataIndex: 'keyword',
    },
    {
      title: '点击所在国家地区',
      dataIndex: 'country',
    },
    {
      title: '点击时间',
      dataIndex: 'clickTime',
    },
    {
      title: '费用',
      dataIndex: 'cost',
    },
  ];

  const [expenseRecordTableData, setExpenseRecordTableData] = useState<ExpenseRecordTableDataItem[]>([]);

  const [expenseRecordTableLoading, setExpenseRecordTableLoading] = useState(false);

  const fetchExpenseRecordTableData = async (siteId: string, sTime: string, eTime: string) => {
    setExpenseRecordTableLoading(true);
    try {
      const data = await siteApi.getExpenseRecord({
        siteId,
        sTime,
        eTime,
      });

      if (Array.isArray(data) && data.length > 0) {
        setExpenseRecordTableData([...data]);
      } else {
        setExpenseRecordTableData([]);
      }
    } catch (error) {
      console.error(error);
    }
    setExpenseRecordTableLoading(false);
  };

  return {
    expenseRecordTableColumns,
    expenseRecordTableData,
    expenseRecordTableLoading,
    fetchExpenseRecordTableData,
  };
};

export default useExpenseRecordTable;
