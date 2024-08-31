import React from 'react';
import classnames from 'classnames';
import { Table, Input, Spin, Tag, TablePaginationConfig, message } from 'antd';
import { RuleViewPermissionList, RuleViewPermissionReq, RuleViewPermissionData, apiHolder, apis, CustomerDiscoveryApi } from 'api';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { useTableSearch } from '../../hooks/useTableSearch';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const ViewPermissionList: React.FC = () => {
  const { containerRef, containerHeight } = useContainerHeight();
  const fetchTableData = async (search: RuleViewPermissionReq, pagination: TablePaginationConfig): Promise<[number, RuleViewPermissionList]> => {
    const res = await customerDiscoveryApi.getRuleViewPermissionPage({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    return [res.total || 0, res];
  };
  const { loading, data, setData, searchParams, pagination, pageChange, setPagination, setSearchParams } = useTableSearch<RuleViewPermissionReq, RuleViewPermissionList>(
    fetchTableData,
    {},
    500
  );
  const accountChange = async (keyword: string) => {
    setSearchParams({ ...searchParams, keyword });
    setPagination({ ...pagination, current: 1 });
  };
  const changeState = async (row: RuleViewPermissionData) => {
    try {
      Object.assign(row, { loading: true });
      setData({ ...data });
      const state = String(row.state) === '1' ? 0 : 1;
      await customerDiscoveryApi.changeRuleViewPermission([row.accId], state);
      if (state === 1) {
        regularCustomerTracker.trackPermissionListReject();
      }
      Object.assign(row, { state });
      setData({ ...data });
      message.success(getIn18Text('CAOZUOCHENGGONG'));
    } finally {
      Object.assign(row, { loading: false });
      setData({ ...data });
    }
  };
  const columns = [
    {
      title: getIn18Text('RENYUAN'),
      dataIndex: 'ownerAccNickname',
      key: 'ownerAccNickname',
      render(_: string, row: RuleViewPermissionData) {
        return (
          <>
            <div className={style.nickName}>{row.accNickname}</div>
            <div className={style.nickEmail}>{row.accEmail || ''}</div>
          </>
        );
      },
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      width: 120,
      dataIndex: 'state',
      render(state: string) {
        if (String(state) === '1') {
          return <Tag className={style.state1}>{getIn18Text('KEBEICHAKAN')}</Tag>;
        }
        return <Tag className={style.state2}>{getIn18Text('BUKECHAKAN')}</Tag>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 120,
      render(_: string, row: RuleViewPermissionData) {
        if (row.loading) {
          return <Spin />;
        }
        return (
          <span className={style.linkBtn} onClick={() => changeState(row)}>
            {String(row.state) === '1' ? getIn18Text('JINZHI') : getIn18Text('YUNXU')}
          </span>
        );
      },
    },
  ];
  return (
    <div className={classnames(style.ruleDetail, style.flex1, style.flex, style.flexCol)}>
      <div className={classnames([style.searchLine, style.flex])}>
        <Input
          style={{ width: '200px' }}
          placeholder={getIn18Text('SOUSUOZHANGHAO')}
          allowClear
          onChange={({ target: { value } }) => accountChange(value)}
          prefix={<SearchOutlined />}
        />
      </div>
      <div className={style.table} ref={containerRef}>
        <Table
          columns={columns}
          className={style.recommendTable}
          scroll={{
            y: `${containerHeight - 120}px`,
          }}
          rowKey="ownerAccId"
          dataSource={data.data}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: pageChange,
          }}
        />
      </div>
    </div>
  );
};
