import React, { useEffect, useState, useMemo } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { Space, Button, message, Modal, Table } from 'antd';
import { apiHolder, apis, CustomerDiscoveryApi, CustomerAuthRecord, CustomerAuthGrantRecord, CustomerAuthTypeMap, CustomerAuthGrantStateMap } from 'api';
import { ColumnsType } from 'antd/es/table';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { DetailPanel } from '../../components/detailPanel';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { EmailRelationDetail } from '../../components/EmailRelationDetail';
import style from './style.module.scss';
import { getIn18Text } from 'api';
interface Props {
  data: CustomerAuthRecord;
  canEdit?: boolean;
  onAuth?: (state: number) => void;
}
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AuthorizationDetail: React.FC<Props> = props => {
  const { data, canEdit = true, onAuth } = props;
  const { containerHeight, containerRef } = useContainerHeight();
  const [authRecords, setAuthRecords] = useState<Array<CustomerAuthGrantRecord>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResource, setLoadingResource] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const canSelect = (row: CustomerAuthGrantRecord) => row.state === 0;
  async function fetchAuthRecords() {
    setLoadingResource(true);
    const res = await customerDiscoveryApi.getCustomerAuthGrantRecords(data.recordId);
    setAuthRecords(res?.data || []);
    // 默认全选
    const unAuthRecords = (res?.data || []).filter(canSelect);
    setSelectedRowKeys(unAuthRecords.map(r => r.resourceId));
    setLoadingResource(false);
  }
  const details = useMemo(
    () => [
      {
        label: getIn18Text('SHENQINGREN'),
        value: `${data.accNickname} ${data.accEmail}`,
      },
      {
        label: getIn18Text('SHENQINGSHIJIAN'),
        value: moment(data.applyTime).format('YYYY-MM-DD'),
      },
    ],
    [data]
  );
  useEffect(() => {
    fetchAuthRecords();
  }, []);
  function updateResources(state: number) {
    // 更新状态
    // const newRecords = authRecords.map(record => {
    //   if (checkedList.includes(record.resourceId)) {
    //     return {
    //       ...record,
    //       state
    //     };
    //   }
    //   return record;
    // });
    // setCheckAll(false);
    // setIndeterminate(false);
    // setCheckedList([]);
    // setAuthRecords(newRecords);
    if (onAuth) {
      onAuth(state);
    }
  }
  const passResource = () => {
    if (!selectedRowKeys.length) {
      message.error(getIn18Text('QINGXUANZEWANGLAIGUANXI'));
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUERENTONGGUOSUOXUANWANGLAIGUANXIDECHAKANSHENQING\uFF1F'),
      onOk: async () => {
        try {
          setLoading(true);
          await customerDiscoveryApi.passAuthResource(data.recordId, selectedRowKeys as string[]);
          updateResources(1);
        } finally {
          setLoading(false);
        }
      },
    });
  };
  const rejectResource = () => {
    if (!selectedRowKeys.length) {
      message.error(getIn18Text('QINGXUANZEWANGLAIGUANXI'));
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUERENBOHUISUOXUANWANGLAIGUANXIDECHAKANSHENQING\uFF1F'),
      onOk: async () => {
        try {
          setLoading(true);
          await customerDiscoveryApi.rejectAuthResource(data.recordId, selectedRowKeys as string[]);
          updateResources(2);
        } finally {
          setLoading(false);
        }
      },
    });
  };
  const onRowClick = (row: CustomerAuthGrantRecord) => {
    const rowKey = row.resourceId;
    const index = selectedRowKeys.findIndex(key => key === rowKey);
    if (index > -1) {
      selectedRowKeys.splice(index, 1);
    } else {
      selectedRowKeys.push(rowKey);
    }
    setSelectedRowKeys(selectedRowKeys.slice());
  };
  const columns = [
    {
      title: getIn18Text('WANGLAIGUANXI'),
      render(_: string, row: CustomerAuthGrantRecord) {
        return (
          <div className={classnames([style.flex, style.relationDetailItem])}>
            <AvatarTag
              innerStyle={{ border: 'none' }}
              size={32}
              user={{
                name: row.fromNickname,
                avatar: '',
                email: row.from,
              }}
            />
            <div className={style.relationDesc}>
              <span className={style.nickName}>{row.fromNickname}</span>
              {getIn18Text('YU')}
              <span className={style.nickName}>{row.toNickname}</span>
              {getIn18Text('ZHIJIANGONG')}
              <span className={style.nickName}>{row.emailNum}</span>
              {getIn18Text('FENGYOUJIAN')}
            </div>
          </div>
        );
      },
    },
    !canEdit
      ? {
          title: getIn18Text('ZHUANGTAI'),
          width: 100,
          render(_: string, row: CustomerAuthGrantRecord) {
            const stateName = CustomerAuthGrantStateMap[row.state];
            return <span className={classnames([style.state, style[`linkBtnState${row.state}`]])}>{stateName}</span>;
          },
        }
      : null,
    // {
    //   title: '操作',
    //   width: 100,
    //   render(_: string, row: CustomerAuthGrantRecord) {
    //     return (
    //       <Space>
    //         <span className={style.linkBtn}>授权</span>
    //         <span className={style.linkBtn}>驳回</span>
    //       </Space>
    //     );
    //   }
    // }
  ].filter(Boolean);
  return (
    <div className={style.wrapper}>
      <DetailPanel title={getIn18Text('QIYEXINXI')} data={details} column={2} />
      <div className={style.applyDetail}>
        <span className={style.label}>{getIn18Text('XIANGQING\uFF1A')}</span>
        <span className={style.val}>
          <EmailRelationDetail
            relationName={CustomerAuthTypeMap[data.relationType]}
            from={data?.fromNicknameSet || []}
            to={data?.toNicknameSet || []}
            num={data.totalEmailNum}
          />
        </span>
      </div>
      <div className={classnames([style.flex, style.recordTitle])}>
        <div className={classnames([style.title, style.flex1])}>
          {canEdit ? getIn18Text('QUERENSHIFOUKECHAKANYIXIAWANGLAIGUANXI\uFF1A') : getIn18Text('SHOUQUANXINXI')}
        </div>
      </div>
      <div className={classnames([style.authRecord, canEdit ? style.canEdit : ''])} ref={containerRef}>
        <Table
          columns={columns as ColumnsType<CustomerAuthGrantRecord>}
          rowKey="resourceId"
          dataSource={authRecords}
          loading={loadingResource}
          pagination={false}
          scroll={{
            y: `${containerHeight - 70}px`,
          }}
          onRow={record => ({
            onClick: () => onRowClick(record),
          })}
          rowSelection={
            canEdit
              ? {
                  columnWidth: 28,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys),
                  getCheckboxProps: row => ({ disabled: !canSelect(row) }),
                }
              : undefined
          }
        />
      </div>
      {canEdit ? (
        <div className={style.operation}>
          <Space>
            <Button type="primary" disabled={loading} onClick={passResource}>
              {getIn18Text('TONGGUO')}
            </Button>
            <Button disabled={loading} onClick={rejectResource}>
              {getIn18Text('BOHUI')}
            </Button>
          </Space>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
