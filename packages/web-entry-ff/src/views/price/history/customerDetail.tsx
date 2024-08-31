import React, { useEffect, useCallback } from 'react';
import { TableProps } from 'antd';
import { apiHolder, apis, FFMSApi } from 'api';
import { useAntdTable } from 'ahooks';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';

interface Props extends TableProps<any> {
  freightHistoryId?: string;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const CustomerDetail: React.FC<Props> = props => {
  const { freightHistoryId, ...restProps } = props;

  const fetchList = useCallback(
    async (pageInfo: { pageSize: number; current: number }) => {
      if (!freightHistoryId) {
        return {
          list: [],
          total: 0,
        };
      }

      const res = await ffmsApi.getPushedCustomerList({
        freightHistoryId,
        page: pageInfo.current,
        pageSize: pageInfo.pageSize,
      });
      return {
        list: res?.content || [],
        total: res?.totalSize || 0,
      };
    },
    [freightHistoryId]
  );

  const { tableProps, refresh } = useAntdTable(fetchList, { defaultPageSize: 20 });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;

  useEffect(() => {
    refresh();
  }, [fetchList]);

  return (
    <Table
      columns={[
        {
          title: '推荐联系人',
          dataIndex: 'contactEmail',
        },
        {
          title: '价格',
          render(_, row: any) {
            return `${row?.price?.price20gp || '--'} / ${row?.price?.price40gp || '--'} / ${row?.price?.price40hc || '--'}`;
          },
        },
      ]}
      scroll={{ y: 200 }}
      {...tableProps}
      {...restProps}
    />
  );
};
