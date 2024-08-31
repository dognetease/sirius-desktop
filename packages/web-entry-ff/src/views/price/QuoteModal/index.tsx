import React, { useEffect, useState, useCallback } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, FFMSApi, FFMSRate, FFMSCustomer } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as Arrow } from '@web-entry-ff/images/Arrow.svg';
import Table from '@lingxi-common-component/sirius-ui/Table';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import NationFlag from '@web/components/Layout/CustomsData/components/NationalFlag';
import style from './style.module.scss';

interface Props {
  visible: boolean;
  rows: FFMSRate.ListItem[];
  onCancel: () => void;
  onSuccess?: () => void;
}

// getDefaultCustomerList
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const QuoteModal: React.FC<Props> = props => {
  const { visible, onCancel, onSuccess, rows } = props;
  const [selectedRows, setSelectedRows] = useState<FFMSRate.ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendCustomers, setSendCustomers] = useState<FFMSCustomer.List>({ totalPage: 0, totalSize: 0, content: [] });
  const MaxCustomerDisplay = 200;

  const getDefaultCustomerList = useCallback(async () => {
    const res = await ffmsApi.getDefaultCustomerList(1, MaxCustomerDisplay);
    setSendCustomers(res);
  }, []);

  const submit = useCallback(async () => {
    if (!selectedRows.length) {
      return SiriusMessage.error({ content: '请勾选至少一条需要报价的航线' });
    }
    try {
      setLoading(true);
      await ffmsApi.pushToCustomer(selectedRows.map(item => item.freightId));
      if (onSuccess) {
        onSuccess();
      }
      return 0;
    } finally {
      setLoading(false);
    }
  }, [selectedRows]);

  useEffect(() => {
    setSelectedRows(rows || []);
  }, [rows]);

  useEffect(() => {
    getDefaultCustomerList();
  }, []);

  return (
    <SiriusModal
      title="一键报价"
      width={800}
      className={style.modal}
      closable
      destroyOnClose
      onCancel={onCancel}
      visible={visible}
      confirmLoading={loading}
      okButtonProps={{ disabled: !selectedRows.length }}
      onOk={submit}
    >
      <div className={style.wrapper}>
        <div className={style.freightTable}>
          <div className={style.tip}>已选择{selectedRows.length}条报价，确认是否发送</div>
          <Table
            className={style.table}
            rowKey="freightId"
            dataSource={rows}
            pagination={false}
            rowSelection={{
              type: 'checkbox',
              preserveSelectedRowKeys: true,
              onChange: (_, _selectedRows) => {
                setSelectedRows(_selectedRows as FFMSRate.ListItem[]);
              },
              selectedRowKeys: selectedRows.map(item => item.freightId),
            }}
            size="small"
            scroll={{ y: 192 }}
            columns={[
              {
                title: '航线',
                align: 'center',
                render: (_, item) => {
                  const row = item as FFMSRate.ListItem;
                  const isExpired = Boolean(row?.tagList?.includes('EXPIRED'));
                  const departurePortText = row.departurePort
                    ? `${row.departurePort?.enName} ${row.departurePort?.cnName} ${row.departurePort?.countryCnName}`
                    : row.departurePortCode || '--';

                  const destinationPortText = row.destinationPort
                    ? `${row.destinationPort?.enName} ${row.destinationPort?.cnName} ${row.destinationPort?.countryCnName}`
                    : row.destinationPortCode || '--';

                  return (
                    <div className={style.routeInfo}>
                      <div className={style.from}>
                        <div className={classnames(style.portName, style.ellipsis)} title={departurePortText}>
                          {isExpired && <div className={style.tag}>过期</div>}
                          {departurePortText}
                        </div>
                        <div className={classnames(style.date)}>{row.sailingDate || '--'}</div>
                      </div>
                      <div className={style.arrow}>
                        <div className={classnames(style.routeName, style.ellipsis)} title={row.route || '--'}>
                          {row.route || '--'}
                        </div>
                        <Arrow />
                        <div className={classnames(style.voyage, style.ellipsis)}>{row.voyage ? `${row.voyage}天` : '--'}</div>
                      </div>
                      <div className={style.to}>
                        <div className={classnames(style.portName, style.ellipsis)} title={destinationPortText}>
                          {destinationPortText}
                        </div>
                        <div className={classnames(style.date)}>{row.arriveDate || '--'}</div>
                      </div>
                    </div>
                  );
                },
              },
              {
                width: 150,
                title: '价格（$）',
                dataIndex: 'price',
                render(value: string) {
                  return <span className={style.price}>{value}</span>;
                },
              },
            ]}
          />
        </div>
        <div className={style.customerList}>
          <div className={style.tip}>发送至{sendCustomers.totalSize}个订阅客户</div>
          <div className={style.customers}>
            {(sendCustomers?.content || []).map(item => {
              return (
                <div className={style.customer}>
                  {item.email}
                  {Boolean(item?.searchCompany?.country) && <NationFlag style={{ marginLeft: 5 }} showLabel={false} name={item?.searchCompany?.country} />}
                </div>
              );
            })}
            {sendCustomers?.totalSize > MaxCustomerDisplay && <div className={style.customer}>...等</div>}
          </div>
        </div>
      </div>
    </SiriusModal>
  );
};
