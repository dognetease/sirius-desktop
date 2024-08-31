import React, { useEffect, useState } from 'react';
import { apis, apiHolder, EdmCustomsApi, getIn18Text, PrevScene, MergeCompany } from 'api';
import { PaginationProps, Table } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './recordsModal.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Translate from '../../components/Translate/translate';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface Props {
  visible: boolean;
  onCancel: () => void;
  companyName: string;
  originCompanyName?: string;
  type: 'buysers' | 'suppliers';
  buyersName?: string;
  suppliersName?: string;
  country?: string;
  buyersCountry?: string;
  suppliersCountry?: string;
  scene?: PrevScene;
  companyList?: Array<MergeCompany>;
}
const defaultPagination: PaginationProps = {
  current: 1,
  defaultPageSize: 20,
  showSizeChanger: false,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
  total: 0,
  className: 'pagination-wrap pagination-customs',
};
const RecordsModal = ({
  visible,
  onCancel,
  companyName,
  originCompanyName,
  type,
  companyList,
  buyersName,
  suppliersName,
  country,
  buyersCountry,
  suppliersCountry,
  scene,
}: Props) => {
  const [tableList, setTableList] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recordParams, setRecordParams] = useState<any>({
    from: 1,
    size: 20,
    companyName: '',
  });
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const onTableChange = (currentPagination: any, filter: any, sorter: any) => {
    console.log('onTableChange', currentPagination);
    const { current } = currentPagination;
    const { field, order } = sorter;
    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    setPagination({
      ...pagination,
      current,
    });
    setRecordParams({
      ...recordParams,
      ...sorterParams,
      from: current,
    });
  };
  useEffect(() => {
    if (companyName) {
      console.log('xxxxxxcompanyName', buyersName, companyName, suppliersName);
      setLoading(true);
      if (type === 'buysers') {
        featchSuppliersRecords();
      } else {
        featchRecords();
      }
    }
  }, [recordParams, companyName]);
  const featchRecords = () => {
    const { from, size, sortBy, order } = recordParams;
    const params = {
      from: from - 1,
      sortBy,
      order,
      size,
    };
    const doFetch = () =>
      edmCustomsApi.globalSuppliersRecordList({
        ...params,
        relationCompany: buyersName,
        relationCountry: buyersCountry,
        companyList:
          scene === 'customs'
            ? [
                {
                  companyName: buyersName ?? '',
                  country: buyersCountry ?? '',
                },
              ]
            : companyList?.map(item => ({ companyName: item.name, country: item.country, originCompanyName: item.originCompanyName })),
        relationCompanyList: [{ companyName, country: country || '', originCompanyName }],
        sourceType: scene === 'customs' ? 'customs' : 'global',
      });
    doFetch()
      .then(res => {
        const { transactionRecords, total } = res;
        setPagination({
          ...pagination,
          total,
        });
        setTableList(transactionRecords);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const featchSuppliersRecords = () => {
    const { from, size, sortBy, order } = recordParams;
    const params = {
      size,
      from: from - 1,
      sortBy,
      order,
    };
    const doFetch = () =>
      edmCustomsApi.globalBuyersRecordList({
        ...params,
        relationCompanyList: [{ companyName, country: country || '', originCompanyName }],
        relationCompany: suppliersName,
        relationCountry: suppliersCountry,
        companyList:
          scene === 'customs'
            ? [
                {
                  companyName: buyersName ?? '',
                  country: buyersCountry ?? '',
                },
              ]
            : companyList?.map(item => ({ companyName: item.name, country: item.country, originCompanyName: item.originCompanyName })),
        sourceType: scene === 'customs' ? 'customs' : 'global',
      });
    doFetch()
      .then(res => {
        const { transactionRecords, total } = res;
        setPagination({
          ...pagination,
          total,
        });
        setTableList(transactionRecords);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const columns = [
    {
      title: 'HSCode',
      dataIndex: 'hsCode',
      key: 'hsCode',
      ellipsis: true,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('HSMIAOSHU'),
      dataIndex: 'hsCodeDesc',
      key: 'hsCodeDesc',
      render: (text: string) => (
        <div className="company-name-item">
          <EllipsisTooltip>
            <span className="customs-company">{text}</span>
          </EllipsisTooltip>
          <Translate title={text} classnames="company-text" />
        </div>
      ),
    },
    {
      title: getIn18Text('CHANPINMIAOSHU'),
      dataIndex: 'goodsShpd',
      key: 'goodsShpd',
      render: (text: string) => (
        <div className="company-name-item">
          <EllipsisTooltip>
            <span className="customs-company">{text}</span>
          </EllipsisTooltip>
          <Translate title={text} classnames="company-text" />
        </div>
      ),
    },
    {
      title: getIn18Text('JIAOYIJINE'),
      dataIndex: 'valueOfGoodsUSD',
      key: 'valueOfGoodsUSD',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      width: 150,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JIAOYISHIJIAN'),
      dataIndex: 'shpmtDate',
      key: 'shpmtDate',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      width: 150,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
  ];
  return (
    <Modal
      className={style.modalWrap}
      title={getIn18Text('JIAOYIJILU')}
      width={706}
      bodyStyle={{ height: '308px', padding: '0px' }}
      visible={visible}
      destroyOnClose
      footer={null}
      onCancel={onCancel}
    >
      <>
        <div className={style.modalContent}>
          <Table
            className="edm-table edm-table-customs"
            columns={columns}
            loading={loading}
            onChange={onTableChange}
            rowKey={() => Math.random()}
            // scroll={{ x: '100%' }}
            dataSource={tableList}
            pagination={{
              ...defaultPagination,
              ...pagination,
            }}
          />
        </div>
      </>
    </Modal>
  );
};
export default RecordsModal;
