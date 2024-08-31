import React, { useEffect } from 'react';
import { ColumnsType } from 'antd/es/table';
import classnames from 'classnames';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { useAntdTable } from 'ahooks';
import { TongyongJiantou1You, TongyongJiantou1Xia } from '@sirius/icons';
import { ReactComponent as Arrow } from '@web-entry-ff/images/Arrow.svg';
import { EdmSendDetail } from './edmSendDetail';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import SiriusModal from '@web-common/components/UI/SiriusModal';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { CustomerDetail } from './customerDetail';
import style from './style.module.scss';

interface Props {
  id: string;
  visible: boolean;
  rowDetail?: FFMSRate.ListItem;
  onCancel: () => void;
  onSuccess?: () => void;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const Detail: React.FC<Props> = ({ id, visible, rowDetail, onCancel }) => {
  const getPiceList = async (pageInfo: { pageSize: number; current: number }) => {
    const params = {
      pageSize: pageInfo.pageSize,
      page: pageInfo.current,
      freightId: id,
    };
    if (!id) return { total: 0, list: [] };
    const res = await ffmsApi.getFFmsRateHistoryList(params);
    return {
      total: res?.totalSize,
      list: res?.content,
    };
  };

  const { tableProps, refresh } = useAntdTable(getPiceList, { defaultPageSize: 10 });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;
  tableProps.dataSource = tableProps.dataSource.map(item => {
    item.key = item.freightHistoryId;
    return item;
  });

  useEffect(() => {
    if (id && visible) {
      refresh();
    }
  }, [id, visible]);

  const columns: ColumnsType<FFMSRate.ListItem> = [
    {
      title: '价格（$）',
      dataIndex: 'price',
      className: style.maxWidthCell,
      ellipsis: true,
    },
    {
      title: '截止日期',
      dataIndex: 'expiryDate',
      width: 150,
      render: (value, row) => {
        const invalid = row.tagList?.includes('INVALID');
        return (
          <div>
            {value || '--'}
            <div className={classnames(style.tag, invalid ? style.invalid : '')}>{invalid ? '失效' : '生效'}</div>
          </div>
        );
      },
    },
    {
      title: '出发日',
      dataIndex: 'sailingDate',
      width: 100,
      render: value => value || '--',
    },
    {
      title: '航线',
      dataIndex: 'route',
      render: value => <div className={style.routeCell}>{value || '-'}</div>,
    },
    {
      title: '参考到港日',
      dataIndex: 'arriveDate',
      width: 100,
      render: value => value || '--',
    },
  ];

  const departurePortText = rowDetail?.departurePort
    ? `${rowDetail.departurePort?.enName} ${rowDetail.departurePort?.cnName} ${rowDetail.departurePort?.countryCnName}`
    : rowDetail?.departurePortCode || '--';

  const destinationPortText = rowDetail?.destinationPort
    ? `${rowDetail.destinationPort?.enName} ${rowDetail.destinationPort?.cnName} ${rowDetail.destinationPort?.countryCnName}`
    : rowDetail?.destinationPortCode || '--';

  return (
    <SiriusModal
      title="报价历史"
      width={800}
      className={style.ffmsHistoryDetail}
      closable={!!true}
      destroyOnClose={!!true}
      onCancel={onCancel}
      visible={visible}
      footer={null}
    >
      <div className={style.wrapper}>
        <div className={style.header}>
          <div className={style.shipInfo}>
            <div className={classnames(style.shipMaster, style.ellipsis)}>
              {rowDetail?.freightCarrier?.carrier} {rowDetail?.freightCarrier?.cnName}
            </div>
            <div className={classnames(style.shipCount)}>创建时间：{rowDetail?.createAt || '--'}</div>
          </div>

          <div className={style.routeInfo}>
            <div className={style.from}>
              <div className={classnames(style.portName, style.ellipsis)} title={departurePortText}>
                {/* {isExpired && <div className={style.tag}>过期</div>} */}
                {departurePortText}
              </div>
              <div className={classnames(style.date)}>{rowDetail?.sailingDate || '--'}</div>
            </div>
            <div className={style.arrow}>
              <div className={classnames(style.routeName, style.ellipsis)} title={rowDetail?.route || '--'}>
                {rowDetail?.route || '--'}
              </div>
              <Arrow />
              <div className={classnames(style.voyage, style.ellipsis)}>{rowDetail?.voyage ? `${rowDetail?.voyage}天` : '--'}</div>
            </div>
            <div className={style.to}>
              <div className={classnames(style.portName, style.ellipsis)} title={destinationPortText}>
                {destinationPortText}
              </div>
              <div className={classnames(style.date)}>{rowDetail?.arriveDate || '--'}</div>
            </div>
          </div>
        </div>
        <Table
          scroll={{ x: 'max-content', y: 400 }}
          key="freightHistoryId"
          columns={columns}
          expandable={{
            childrenColumnName: '推送客户',
            expandIconColumnIndex: 6,
            columnWidth: 90,
            expandRowByClick: true,
            expandedRowRender(record) {
              return <EdmSendDetail row={record as FFMSRate.ListItem} />;
            },
            rowExpandable(record: any) {
              return record?.pushCustomerCount > 0;
            },
            expandIcon: ({ expanded, onExpand, record }) => {
              const row = record as FFMSRate.ListItem;
              if (!row?.pushCustomerCount) {
                return (
                  <div className={style.customerCount}>
                    {row?.pushCustomerCount || 0}
                    <span className={style.arrowRight}>
                      <TongyongJiantou1You />
                    </span>
                  </div>
                );
              }

              return (
                <div className={style.customerCount} onClick={e => onExpand(record, e)}>
                  {row?.pushCustomerCount || 0}
                  {expanded ? (
                    <span className={style.arrowRight}>
                      <TongyongJiantou1Xia />
                    </span>
                  ) : (
                    <span className={style.arrowRight}>
                      <TongyongJiantou1You />
                    </span>
                  )}
                </div>
              );
            },
          }}
          {...tableProps}
        />
      </div>
    </SiriusModal>
  );
};

export default Detail;
