import React, { useState } from 'react';
import classnames from 'classnames';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { Moment } from 'moment';
import { TablePaginationConfig, DatePicker, Space, Table, Drawer, Button, message, Modal } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { apiHolder, apis, CustomerDiscoveryApi, CustomerAuthorizationSearch, CustomerAuthRecord, CustomerAuthList, CustomerAuthTypeMap } from 'api';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { useTableSearch } from '../../hooks/useTableSearch';
import { drawerClassName } from '../../context';
import { AuthorizationDetail } from '../AuthorizationDetail';
import { EmailRelationDetail } from '../../components/EmailRelationDetail';
import { AuthorizationRelatedDetail } from '../AuthorizationRelatedDetail';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';
const { RangePicker } = DatePicker;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AuthorizationList: React.FC = () => {
  const [authDrawer, setAuthDrawer] = useState<{
    visible: boolean;
    data: CustomerAuthRecord;
  }>({ visible: false, data: {} as CustomerAuthRecord });
  const { containerHeight, containerRef } = useContainerHeight(150);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [showRelatedDetail, setShowRelatedDetail] = useState<{
    visible: boolean;
    data: CustomerAuthRecord;
  }>({ visible: false, data: {} as CustomerAuthRecord });
  const fetchTableData = async (search: CustomerAuthorizationSearch, pagination: TablePaginationConfig): Promise<[number, CustomerAuthList]> => {
    const res = await customerDiscoveryApi.getCustomerAuthList({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, data, reload, searchParams, setSearchParams } = useTableSearch<CustomerAuthorizationSearch, CustomerAuthList>(
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
  const accountChange = async (account: string) => setSearchParams({ ...searchParams, account });
  const showDetail = (row: CustomerAuthRecord) => {
    setShowRelatedDetail({
      visible: true,
      data: row,
    });
  };
  const showAuthDetail = (row: CustomerAuthRecord) => {
    setAuthDrawer({
      visible: true,
      data: row,
    });
  };
  const columns = [
    {
      title: getIn18Text('SHENQINGREN'),
      render(_: string, item: CustomerAuthRecord) {
        return (
          <>
            <div>{item.accNickname}</div>
            <div>{item.accEmail}</div>
          </>
        );
      },
    },
    {
      title: getIn18Text('SHENQINGNEIRONG'),
      render(_: string, item: CustomerAuthRecord) {
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
    // uni邀测修改
    // {
    //     title: getIn18Text("SHUJUXIANGQING"),
    //     render(_: string, item: CustomerAuthRecord) {
    //         return (<span className={style.linkBtn} onClick={() => showDetail(item)}>
    //     {item.relationView ? (String(item.relationView).trim() || '--') : '--'}
    //   </span>);
    //     }
    // },
    {
      title: getIn18Text('CAOZUO'),
      width: 100,
      render(_: string, item: CustomerAuthRecord) {
        return (
          <span className={style.linkBtn} onClick={() => showAuthDetail(item)}>
            {getIn18Text('CHAKAN')}
          </span>
        );
      },
    },
  ];
  const selectRowChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  let lock = false;
  const passRecords = (row?: CustomerAuthRecord) => {
    if (!selectedRowKeys.length && !row) {
      message.error(getIn18Text('QINGXUANZESHENQINGJILU'));
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUANBUTONGYISUOXUANDEWANGLAIGUANXIDECHAKANSHENQING\uFF1F'),
      onOk: async () => {
        if (lock) {
          return;
        }
        lock = true;
        try {
          setDisabled(true);
          await customerDiscoveryApi.passAuth(row ? [row.recordId] : (selectedRowKeys as string[]));
          regularCustomerTracker.trackAuthAgree();
          setSelectedRowKeys([]);
          setShowRelatedDetail({
            data: {} as CustomerAuthRecord,
            visible: false,
          });
          reload();
        } finally {
          setDisabled(false);
          lock = false;
        }
      },
    });
  };
  const rejectRecords = (row?: CustomerAuthRecord) => {
    if (!selectedRowKeys.length && !row) {
      message.error(getIn18Text('QINGXUANZESHENQINGJILU'));
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUANBUBOHUISUOXUANDEWANGLAIGUANXIDECHAKANSHENQING\uFF1F'),
      onOk: async () => {
        if (lock) {
          return;
        }
        lock = true;
        try {
          setDisabled(true);
          await customerDiscoveryApi.rejectAuth(row ? [row.recordId] : (selectedRowKeys as string[]));
          setSelectedRowKeys([]);
          setShowRelatedDetail({
            data: {} as CustomerAuthRecord,
            visible: false,
          });
          reload();
        } finally {
          setDisabled(false);
          lock = false;
        }
      },
    });
  };
  const onAuth = () => {
    setAuthDrawer({ visible: false, data: {} as CustomerAuthRecord });
    reload();
  };
  return (
    <div className={classnames(style.ruleTable, style.flex1, style.flex, style.flexCol)}>
      <div className={classnames([style.search, style.flex])}>
        <Space>
          <Input placeholder={getIn18Text('SOUSUOZHANGHAO')} allowClear onChange={({ target: { value } }) => accountChange(value)} prefix={<SearchOutlined />} />
          <RangePicker
            separator=" - "
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            format="YYYY/MM/DD"
            allowClear
            onChange={date => dateChange(date as Moment[])}
          />
        </Space>
        <div className={classnames([style.flex1, style.alr])}>
          <Space>
            <Button type="primary" onClick={() => passRecords()} disabled={disabled}>
              {getIn18Text('TONGGUO')}
            </Button>
            <Button onClick={() => rejectRecords()} disabled={disabled}>
              {getIn18Text('BOHUI')}
            </Button>
          </Space>
        </div>
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
          rowSelection={{
            selectedRowKeys,
            onChange: selectRowChange,
            // getCheckboxProps: (row: CustomerAuthRecord) => ({ disabled: false })
          }}
        />
      </div>

      {/* 授权详情 */}
      <Drawer
        title={getIn18Text('SHUJUSHENQINGXIANGQING')}
        width={872}
        onClose={() => {
          setAuthDrawer({ visible: false, data: {} as CustomerAuthRecord });
          reload();
        }}
        visible={authDrawer.visible}
        destroyOnClose={Boolean(true)}
        className={drawerClassName}
      >
        <AuthorizationDetail data={authDrawer.data} onAuth={onAuth} />
      </Drawer>

      <AuthorizationRelatedDetail
        relationId={showRelatedDetail.data.relationId}
        relationType={showRelatedDetail.data.relationType}
        onClose={() =>
          setShowRelatedDetail({
            data: {} as CustomerAuthRecord,
            visible: false,
          })
        }
      >
        <div>
          <div className={style.quickAuthTitle}>{getIn18Text('SHENQINGREN')}</div>
          <div className={style.quickAuthCard}>
            <AvatarTag
              innerStyle={{ border: 'none' }}
              size={32}
              user={{
                name: showRelatedDetail.data.accNickname,
                email: showRelatedDetail.data.accEmail,
              }}
            />
            <div className={style.accDetail}>
              <div className={style.accName}>{showRelatedDetail.data.accNickname}</div>
              <div className={style.accEmail}>{showRelatedDetail.data.accEmail}</div>
            </div>
            <Space>
              <Button type="primary" ghost onClick={() => rejectRecords(showRelatedDetail.data)}>
                {getIn18Text('BOHUI')}
              </Button>
              <Button type="primary" onClick={() => passRecords(showRelatedDetail.data)}>
                {getIn18Text('SHOUQUAN')}
              </Button>
            </Space>
          </div>
        </div>
      </AuthorizationRelatedDetail>
    </div>
  );
};
