import React, { useEffect } from 'react';
import { Modal, Table, Popover, Descriptions } from 'antd';
import { apiHolder, apis, FFMSApi, FFMSStatic } from 'api';
import { useAntdTable } from 'ahooks';
import style from './style.module.scss';

interface Props {
  visitId: string;
  open: boolean;
  onClose: () => void;
}

interface PageInfo {
  current: number;
  pageSize: number;
}

const OperateTypeText = {
  [FFMSStatic.OperateType.BOOKING]: '申请舱位',
  [FFMSStatic.OperateType.COLLECT]: '收藏航线',
  [FFMSStatic.OperateType.DETAIL]: '查看详情',
  [FFMSStatic.OperateType.SEARCH]: '查询航线',
};

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const OperationDetail: React.FC<Props> = props => {
  const { visitId, open, onClose } = props;

  const getTableData = async ({ current, pageSize }: PageInfo) => {
    if (!visitId) {
      return { total: 0, list: [] };
    }

    const params = {
      visitId: visitId,
      page: current,
      pageSize,
    };

    const res = await ffmsApi.getVisiteDetail(params);
    return {
      total: res?.totalSize ?? 0,
      list: res?.content ?? [],
    };
  };

  const { tableProps, search } = useAntdTable(getTableData, {
    defaultPageSize: 20,
  });

  useEffect(() => {
    if (visitId) {
      search?.submit();
    }
  }, [visitId]);

  const renderRouteDetail = (row: FFMSStatic.VisitDetailItem) => {
    const { content } = row;
    return (
      <div className={style.routPop}>
        <Descriptions bordered size="small">
          <Descriptions.Item label="起运港">
            {row?.departurePort?.cnName} {row?.departurePort?.enName}
          </Descriptions.Item>
          <Descriptions.Item label="目的港">
            {row?.destinationPort?.cnName} {row?.destinationPort?.enName}
          </Descriptions.Item>
          <Descriptions.Item label="开航日">{content?.sailingDate || '--'} </Descriptions.Item>
          <Descriptions.Item label="参考到港日">{content?.arriveDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="航程">{content?.voyage || '--'}天</Descriptions.Item>
          <Descriptions.Item label="截止日">{content?.expiryDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="船司">{content?.carrier || '--'}</Descriptions.Item>
          <Descriptions.Item label="航线">{content?.route || '--'}</Descriptions.Item>
          <Descriptions.Item label="船只">{content?.vessel || '--'}</Descriptions.Item>
          <Descriptions.Item label="20GP价格">${content?.price20GP || '--'}</Descriptions.Item>
          <Descriptions.Item label="40GP价格">${content?.price40GP || '--'}</Descriptions.Item>
          <Descriptions.Item label="40HQ价格">${content?.price40HC || '--'}</Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  const columns = [
    {
      title: '操作时间',
      width: 180,
      dataIndex: 'operateAt',
    },
    {
      title: '起始港口',
      render(_: string, row: FFMSStatic.VisitDetailItem) {
        return `${row?.departurePort?.cnName} ${row?.departurePort?.enName}`;
      },
    },
    {
      title: '目的港口',
      render(_: string, row: FFMSStatic.VisitDetailItem) {
        return `${row?.destinationPort?.cnName} ${row?.destinationPort?.enName}`;
      },
    },
    {
      title: '操作类型',
      width: 100,
      dataIndex: 'operateAt',
      render(_: string, row: FFMSStatic.VisitDetailItem) {
        return OperateTypeText[row.operateType] || '--';
      },
    },
    {
      title: '航线详情',
      width: 100,
      render(_: string, row: FFMSStatic.VisitDetailItem) {
        if (row.content) {
          return (
            <Popover content={renderRouteDetail(row)}>
              <span className={style.linkBtn}>查看</span>
            </Popover>
          );
        }

        return '--';
      },
    },
  ];

  return (
    <Modal visible={open} width={900} centered destroyOnClose title="操作详情" onCancel={onClose} footer={null}>
      <Table {...tableProps} columns={columns} scroll={{ y: 350 }} />
    </Modal>
  );
};
