import React, { useMemo, useState } from 'react';
import { PrevScene, topNCompanyInfoItem as barItemType, resCustomsCountry as countryItemType, getIn18Text, CustomsContinent, MergeCompany } from 'api';
import { Table, PaginationProps } from 'antd';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './supplier.module.scss';
import RecordsModal from '../../recordsModal/recordsModal';
import { BarEcharts } from './customsEchart/customsBar';
import { recData as recDataType } from '../../../customs/customs';
import CusotmsDetailSearch from './../components/commonSearch/commonSearch';
import { customsDataTracker } from '../../../tracker/tracker';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import classNames from 'classnames';

interface Props {
  tableList: any;
  pagination: any;
  title: string;
  onChange: (pagination: PaginationProps, filter: any, sorter: any) => void;
  loading: boolean;
  buyersName?: string;
  scene?: PrevScene;
  suppliersName?: string;
  buyersCountry?: string;
  suppliersCountry?: string;
  // onChangeYear: (year: number[]) => void;
  // year: number[];
  dataType: 'buysers' | 'suppliers';
  type: 'buysers' | 'suppliers';
  barData: barItemType[];
  openDrawer?: (content: recDataType['content']) => void;
  countryList?: string[];
  allCountry: CustomsContinent[];
  onChangeCountry: (list: string[]) => void;
  hasEchar?: boolean;
  companyList?: Array<MergeCompany>;
}

const defaultPagination: PaginationProps = {
  current: 1,
  pageSize: 20,
  showSizeChanger: false,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
  total: 0,
  className: 'pagination-wrap pagination-customs',
};

const CompanyList: React.FC<Props> = ({
  tableList,
  pagination,
  onChange,
  title,
  loading,
  allCountry,
  onChangeCountry,
  countryList,
  buyersName,
  scene,
  buyersCountry,
  suppliersName,
  suppliersCountry,
  // year,
  // onChangeYear,
  companyList,
  dataType,
  barData,
  openDrawer,
  type,
  hasEchar,
}) => {
  const [currRecord, setCurrRecord] = useState<any>({});
  const [visible, setVisible] = useState<boolean>(false);
  const seeList = (record: any) => {
    setCurrRecord(record);
    setVisible(true);
  };

  const handlerOpenParams = (companyName: string, country: string) => {
    if (dataType === 'buysers') {
      openDrawer?.({ to: 'buysers', companyName, country });
    } else {
      openDrawer?.({ to: 'supplier', companyName, country });
    }
    customsDataTracker.trackCustomClickTicketViewCompany();
  };
  const columns = [
    {
      title,
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: {
        showTitle: false,
      },
      // width: 200,
      render: (text: any, record: any) => (
        <EllipsisTooltip>
          {text ? (
            text === getIn18Text('WEIGONGKAI') ? (
              <span>{text}</span>
            ) : (
              <span onClick={() => handlerOpenParams(text, record?.country)} className={openDrawer ? style.link : ''}>
                {text}
              </span>
            )
          ) : (
            <span>'-'</span>
          )}
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      dataIndex: 'country',
      key: 'country',
      ellipsis: {
        showTitle: false,
      },
      // width: 200,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JIAOYIJINE'),
      dataIndex: 'valueOfGoodsUSD',
      key: 'valueOfGoodsUSD',
      width: 156,
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHANBI'),
      dataIndex: 'percentage',
      key: 'percentage',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      width: 90,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIHOUJIAOYISHIJIAN'),
      dataIndex: 'lastTransactionDate',
      key: 'lastTransactionDate',
      sortDirections: ['descend', 'ascend'],
      sorter: true,
      width: 126,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JIAOYICISHU'),
      sortDirections: ['descend', 'ascend'],
      sorter: true,
      width: 100,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JIAOYILIEBIAO'),
      width: 90,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: any) =>
        record.companyName ? (
          <a
            onClick={() => {
              seeList(record);
            }}
          >
            {getIn18Text('CHAKAN')}
          </a>
        ) : (
          '-'
        ),
    },
  ];
  const tabeTitle = useMemo(() => (dataType === 'buysers' ? getIn18Text('QUANBUCAIGOUSHANG') : getIn18Text('QUANBUGONGYINGSHANG')), [dataType]);
  return (
    <div className={style.baseInfo} style={{ padding: `${hasEchar ? 0 : '16px'}` }}>
      <BarEcharts barData={barData} type={dataType} />
      <div style={{ color: '#272E47', fontSize: '14px', fontWeight: 'bold' }}>{tabeTitle}</div>
      <CusotmsDetailSearch
        type={type}
        countryList={countryList}
        onChangeCountry={onChangeCountry}
        allCountry={allCountry}
        className={style.freightSearch}
        isSupplier={true}
      />
      <SiriusTable
        className={classNames('edm-table', style.tableStyle)}
        rowKey={() => Math.random()}
        columns={columns}
        onChange={onChange}
        scroll={{ x: '100%' }}
        dataSource={tableList}
        loading={loading}
        pagination={{
          ...defaultPagination,
          ...pagination,
        }}
      />
      {visible && (
        <RecordsModal
          type={dataType}
          scene={scene}
          companyName={currRecord.companyName || ''}
          country={currRecord.country || ''}
          originCompanyName={currRecord.originCompanyName || ''}
          buyersName={buyersName}
          buyersCountry={buyersCountry}
          suppliersName={suppliersName}
          companyList={companyList}
          suppliersCountry={suppliersCountry}
          visible={visible}
          onCancel={() => setVisible(false)}
        />
      )}
    </div>
  );
};
export default CompanyList;
