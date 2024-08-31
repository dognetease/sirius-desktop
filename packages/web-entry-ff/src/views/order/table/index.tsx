import React, { useState, useMemo } from 'react';
import { TableProps, Space, message } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { FFMSApi, FFMSOrder, apiHolder, apis } from 'api';
import { ColumnsType } from 'antd/es/table';
import { OrderDetail } from '../detail';
import FfConfirm from '@web-entry-ff/views/customer/components/popconfirm';
import style from './style.module.scss';
import Tag from '../tag';
import { showData } from '../../customer/levelAdmin/table';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface OrderTableProps extends TableProps<any> {
  refresh: Function;
  discountType: string;
  followStatus: FFMSOrder.ORDER_TYPE;
}
export const OrderTable: React.FC<OrderTableProps> = props => {
  const [currentId, setCurrentId] = useState<string>('');
  const { refresh, discountType, followStatus, ...restProps } = props;

  const canDelete = useMemo(() => {
    return followStatus === FFMSOrder.ORDER_TYPE.FOLLOWING;
  }, [followStatus]);

  const onDelete = (id: string) => {
    ffmsApi
      .deleteFfBook({
        bookingIdList: [id],
      })
      .then(() => {
        message.success('删除成功');
        setCurrentId('');
      })
      .finally(() => {
        refresh();
      });
  };

  const onDone = (id: string) => {
    let status = FFMSOrder.NEXT_ORDER_TYPE[followStatus] as unknown as FFMSOrder.ORDER_TYPE;
    if (!status) return;
    ffmsApi
      .changeffBookStatus({
        bookingId: id,
        followStatus: status,
      })
      .then(() => {
        message.success(followStatus === FFMSOrder.ORDER_TYPE.NOT_FOLLOWED ? '跟进的订舱申请，请到跟进中列表查看' : '完成的订舱申请，请到完成列表查看');
        setCurrentId('');
      })
      .finally(() => {
        refresh();
      });
  };

  const onCheckDetail = (id: string) => {
    setCurrentId(id);
  };

  const columns: ColumnsType<FFMSOrder.ListItem> = [
    {
      title: '企业名称',
      dataIndex: 'customerName',
      className: style.maxWidthCell,
      ellipsis: true,
      render: (value, row) => (
        <div className={style.ffTagBox}>
          <span className={style.text}>{value || '-'}</span>
          <Tag color={row.customerTypeColor} text={row.customerTypeName}></Tag>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      render: value => value || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: value => value || '-',
    },
    {
      title: '等级',
      dataIndex: 'levelName',
      render: (value, item) => <span>{`${value}(${showData(discountType === 'PERCENT', item.advance20gp, item.advance40gp, item.advance40hc)})`}</span>,
    },
    {
      title: '申请时间',
      dataIndex: 'bookingAt',
    },
    {
      title: '操作',
      width: 200,
      render(_, row) {
        return (
          <Space size={20}>
            {followStatus === FFMSOrder.ORDER_TYPE.NOT_FOLLOWED ? (
              <span className={style.linkBtn} onClick={() => onDone(row.bookingId)}>
                跟进
              </span>
            ) : null}
            {canDelete ? (
              <FfConfirm title="是否完成该订舱申请的跟进？" onConfirm={() => onDone(row.bookingId)}>
                <span className={style.linkBtn}>完成</span>
              </FfConfirm>
            ) : null}
            <span className={style.linkBtn} onClick={() => onCheckDetail(row.bookingId)}>
              {canDelete ? '编辑' : '查看'}
            </span>
            {canDelete ? (
              <FfConfirm title="确认删除吗？" onConfirm={() => onDelete(row.bookingId)}>
                <span className={style.linkBtn}>{'删除'}</span>
              </FfConfirm>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table columns={columns} scroll={{ x: 'max-content' }} {...restProps} />
      <OrderDetail
        id={currentId}
        followStatus={followStatus}
        onClose={() => {
          setCurrentId('');
        }}
        onDelete={onDelete}
        onDone={onDone}
      />
    </>
  );
};
