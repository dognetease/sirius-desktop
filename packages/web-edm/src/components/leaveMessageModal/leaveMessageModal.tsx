import React from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Table, Button } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { apiHolder, apis, EdmProductDataApi, getIn18Text } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './modal.module.scss';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';

interface Props {
  visible: boolean;
  clueIds: string[];
  onClose: () => void;
  showDetail: (id: string) => void;
}

interface ColumnHandler {
  showDetail: (id: string) => void;
}

interface LeaveMessageRecord {
  name: string;
  email: string;
  companyName: string;
  clueId: string;
}

const edmProductApi = apiHolder.api.requireLogicalApi(apis.edmProductDataImpl) as EdmProductDataApi;

const getDetailColumns = (props: ColumnHandler) => {
  const { showDetail } = props;
  const detailColumns: ColumnsType<LeaveMessageRecord> = [
    {
      title: getIn18Text('KEHUMINGCHENG'),
      dataIndex: 'name',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YOUXIANGDEZHIv16'),
      dataIndex: 'email',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'companyName',
      render: value => <EllipsisTooltip>{value || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'clueId',
      render: value => <a onClick={() => showDetail(value)}>{getIn18Text('CHAKANXIANGQING')}</a>,
    },
  ];
  return detailColumns;
};

export const LeaveMessageModal: React.FC<Props> = props => {
  const { visible, clueIds, onClose, showDetail } = props;
  const [dataSource, setDataSource] = React.useState<LeaveMessageRecord[]>([]);
  const [currentData, setCurrentData] = React.useState<LeaveMessageRecord[]>([]);
  const [current, setCurrent] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const detailColumns = React.useMemo(
    () =>
      getDetailColumns({
        showDetail,
      }),
    [showDetail]
  );

  React.useEffect(() => {
    if (!visible || !clueIds.length) {
      setDataSource([]);
      setTotal(0);
      setCurrent(1);
      setPageSize(20);
      setCurrentData([]);
      return;
    }
    const promise = edmProductApi.getEdmCustomerClueInfo({ clueIds });

    setLoading(true);
    promise
      .then(res => {
        setDataSource(res);
        setTotal(res.length);
        setCurrentData(res.slice(0, 20));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clueIds, visible]);

  const onTableEventChange = (pagination: any) => {
    const { current: newCurrent, pageSize: newPageSize } = pagination;
    setCurrent(newCurrent);
    setPageSize(newPageSize);
    setCurrentData(dataSource.slice((newCurrent - 1) * newPageSize, newCurrent * newPageSize));
  };

  return (
    <Modal
      title={getIn18Text('LIUZIXIANGQING')}
      visible={visible}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#666' }}>{getIn18Text('ZHU：RUOSHOUDONGSHANCHU')}</div>
          <Button type="primary" onClick={() => onClose()}>
            {getIn18Text('ZHIDAOLE')}
          </Button>
        </div>
      }
      width={816}
      onCancel={onClose}
      bodyStyle={{
        paddingBottom: '4px',
      }}
    >
      <SiriusTable
        columns={detailColumns}
        dataSource={currentData}
        loading={loading}
        onChange={onTableEventChange}
        // pagination={{
        //   size: 'small',
        //   total: total,
        //   pageSizeOptions: ['20', '50', '100'],
        //   pageSize,
        //   className: 'pagination-wrap',
        //   showSizeChanger: true,
        //   showQuickJumper: true,
        //   current: current,
        //   defaultCurrent: 1,
        // }}
        pagination={false}
        scroll={{ y: 300 }}
        rowKey="clueId"
        className={style.clueTable}
      />
      <SiriusPagination
        showTotal={() => `共${currentData.length}条数据`}
        showQuickJumper
        current={current}
        pageSize={pageSize}
        total={currentData.length}
        onChange={onTableEventChange}
        pageSizeOptions={['20', '50', '100']}
        hideOnSinglePage={true}
      />
    </Modal>
  );
};
