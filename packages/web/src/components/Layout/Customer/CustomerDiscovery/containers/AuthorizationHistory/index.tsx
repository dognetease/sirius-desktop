import React, { useState } from 'react';
import classnames from 'classnames';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { Moment } from 'moment';
import { TablePaginationConfig, DatePicker, Space, Table, Drawer, Select } from 'antd';
import { apiHolder, apis, CustomerDiscoveryApi, CustomerAuthTypeMap, CustomerAuthHistoryRecord, CustomerAuthHistoryList, CustomerAuthHistorySearch } from 'api';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { getTransText } from '@/components/util/translate';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { drawerClassName } from '../../context';
import { useTableSearch } from '../../hooks/useTableSearch';
import { AuthorizationDetail } from '../AuthorizationDetail';
import { EmailRelationDetail } from '../../components/EmailRelationDetail';
import { AuthorizationRelatedDetail } from '../AuthorizationRelatedDetail';
import { AuthUserSelect } from './authUserSelect';
import style from './style.module.scss';
import { getIn18Text } from 'api';

const { RangePicker } = DatePicker;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AuthorizationHistory: React.FC = () => {
  const [authDrawer, setAuthDrawer] = useState<{
    visible: boolean;
    data: CustomerAuthHistoryRecord;
  }>({ visible: false, data: {} as CustomerAuthHistoryRecord });
  const { containerHeight, containerRef } = useContainerHeight(150);
  const [showRelatedDetail, setShowRelatedDetail] = useState({
    rerelationId: '',
    relationType: '',
    visible: false,
  });
  const fetchTableData = async (search: CustomerAuthHistorySearch, pagination: TablePaginationConfig): Promise<[number, CustomerAuthHistoryList]> => {
    const res = await customerDiscoveryApi.getCustomerAuthHistoryList({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, data, searchParams, setSearchParams } = useTableSearch<CustomerAuthHistorySearch, CustomerAuthHistoryList>(
    fetchTableData,
    {},
    500
  );
  const dateChange = async (date: Moment[]) => {
    if (!date || !date.length) {
      setSearchParams({ ...searchParams, beginTime: undefined, endTime: undefined });
      return;
    }
    const [start, end] = date as [Moment, Moment];
    const beginTime = start.startOf('day').valueOf();
    const endTime = end.endOf('day').valueOf();
    setSearchParams({ ...searchParams, beginTime, endTime });
  };
  const accountChange = (account: string) => setSearchParams({ ...searchParams, account });
  const statusChange = (state: string) => setSearchParams({ ...searchParams, state });
  const verifyUserChange = (verifyAccId: string) => setSearchParams({ ...searchParams, verifyAccId });

  const showDetail = (row: CustomerAuthHistoryRecord) => {
    setShowRelatedDetail({
      visible: true,
      relationType: row.relationType,
      rerelationId: row.relationId,
    });
  };
  const showAuthDetail = (row: CustomerAuthHistoryRecord) => {
    setAuthDrawer({
      visible: true,
      data: row,
    });
  };
  const renderRecordState = (item: CustomerAuthHistoryRecord, onClick: React.MouseEventHandler = () => {}) => {
    const text = [getIn18Text('DAISHENPI'), getIn18Text('YITONGGUO'), getIn18Text('YITONGGUO'), getIn18Text('YIBOHUI')][item.state] || getIn18Text('CHAKAN');
    return (
      <span className={classnames([style.linkBtn, style.state, style[`linkBtnState${item.state}`]])} onClick={onClick}>
        {text}
      </span>
    );
  };
  const columns = [
    {
      title: getIn18Text('SHENQINGREN'),
      render(_: string, item: CustomerAuthHistoryRecord) {
        return (
          <>
            <div className={style.accNickname}>{item.accNickname}</div>
            <div className={style.accNickEmail}>{item.accEmail}</div>
          </>
        );
      },
    },
    {
      title: getIn18Text('SHENQINGNEIRONG'),
      render(_: string, item: CustomerAuthHistoryRecord) {
        return (
          <EmailRelationDetail
            relationName={CustomerAuthTypeMap[item.relationType]}
            from={item?.fromNicknameSet || []}
            to={item?.toNicknameSet || []}
            num={item.totalEmailNum}
          />
        );
      },
    },
    {
      title: getTransText('Approver'),
      render(_: string, item: CustomerAuthHistoryRecord) {
        return (
          <>
            <div className={style.accNickname}>{item.verifyAccNickname}</div>
            <div className={style.accNickEmail}>{item.verifyAccEmail}</div>
          </>
        );
      },
    },
    // uni邀测修改
    // {
    //   title: getIn18Text('SHUJUXIANGQING'),
    //   render(_: string, item: CustomerAuthHistoryRecord) {
    //     return (
    //       <span className={style.linkBtn} onClick={() => showDetail(item)}>
    //         {item.relationView ? (String(item.relationView).trim() || '--') : '--'}
    //       </span>
    //     );
    //   }
    // },
    {
      title: getIn18Text('CAOZUO'),
      width: 100,
      render(_: string, item: CustomerAuthHistoryRecord) {
        return renderRecordState(item, () => showAuthDetail(item));
      },
    },
  ];
  return (
    <div className={classnames(style.ruleTable, style.flex1, style.flex, style.flexCol)}>
      <div className={style.search}>
        <Space>
          <Input placeholder={getIn18Text('SOUSUOZHANGHAO')} onChange={({ target: { value } }) => accountChange(value)} prefix={<SearchOutlined />} />
          <Select style={{ width: 120 }} placeholder={getIn18Text('ZHUANGTAI')} allowClear onChange={statusChange}>
            <Select.Option value="1">{getIn18Text('YITONGGUO')}</Select.Option>
            <Select.Option value="3">{getIn18Text('YIBOHUI')}</Select.Option>
          </Select>
          <AuthUserSelect style={{ width: 180 }} placeholder={getTransText('SelectAuthUser')} allowClear onChange={value => verifyUserChange(value as string)} />
          <RangePicker
            separator=" - "
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            format="YYYY/MM/DD"
            onChange={date => dateChange(date as Moment[])}
          />
        </Space>
      </div>

      <div className={classnames([style.table, style.flex1])} ref={containerRef}>
        <Table
          columns={columns}
          className={style.recommendTable}
          scroll={{
            y: `${containerHeight - 120}px`,
          }}
          rowKey="recordId"
          dataSource={data.data}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: pageChange,
          }}
        />
      </div>

      {/* 授权详情 */}
      <Drawer
        title={
          <Space>
            <span>{getIn18Text('SHUJUSHENQINGXIANGQING')}</span>
            {renderRecordState(authDrawer.data)}
          </Space>
        }
        width={872}
        onClose={() => setAuthDrawer({ visible: false, data: {} as CustomerAuthHistoryRecord })}
        visible={authDrawer.visible}
        destroyOnClose={Boolean(true)}
        className={drawerClassName}
      >
        <AuthorizationDetail data={authDrawer.data} canEdit={false} />
      </Drawer>

      <AuthorizationRelatedDetail
        relationId={showRelatedDetail.rerelationId}
        relationType={showRelatedDetail.relationType}
        onClose={() =>
          setShowRelatedDetail({
            rerelationId: '',
            relationType: '',
            visible: false,
          })
        }
      />
    </div>
  );
};
