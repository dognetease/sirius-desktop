import React, { useRef, useState } from 'react';
import { Table, PaginationProps } from 'antd';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './freight.module.scss';
import CusotmsDetailSearch from './../components/commonSearch/commonSearch';
import { resCustomsCountry as countryItemType, customsFreightItem as resItemType, CustomsContinent } from 'api';
import Translate from '../../../components/Translate/translate';
import CustomScrollTable from './../../table/customsTable';
import { getIn18Text } from 'api';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { ForeignParam } from '../customsBaseDetail';
import FrieihtEchar from './freightEchar';
import { recData as recDataType } from '../../customs';
interface Props {
  tableList: resItemType[];
  pagination: any;
  onChange: (pagination: PaginationProps, filter: any, sorter: any, goPort: any, endPort: any) => void;
  loading: boolean;
  hsCode?: string;
  goodsShipped?: string;
  preciseSearch?: boolean;
  onChangeHscode?: (hsCode?: string) => void;
  onChangeGoods?: (goods?: string) => void;
  onChangePreciseSearch?: (preciseSearch?: boolean) => void;
  countryList?: string[];
  allCountry: CustomsContinent[];
  originCountry?: countryItemType[];
  onChangeOriginCountry?: (list: string[]) => void;
  onChangeCountry?: (list: string[]) => void;
  type: 'buysers' | 'suppliers' | 'peers';
  hasEchar?: boolean;
  onChangePort?: (goPort: ForeignParam[], endPort: ForeignParam[], type: 'first' | 'second') => void;
  goPort?: any;
  endPort?: any;
  country?: string;
  companyName: string;
  setFinaPort?: (param: ForeignParam[]) => void;
  setComePort?: (param: ForeignParam[]) => void;
  openDrawer?: (content: recDataType['content']) => void;
  time: string[];
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
const BaseInfo: React.FC<Props> = ({
  tableList,
  pagination,
  onChange,
  loading,
  hsCode,
  goodsShipped,
  preciseSearch,
  countryList,
  type,
  allCountry,
  onChangeCountry,
  onChangeGoods,
  onChangeHscode,
  onChangePreciseSearch,
  onChangeOriginCountry,
  originCountry,
  hasEchar,
  onChangePort,
  goPort,
  endPort,
  country,
  companyName,
  setComePort,
  setFinaPort,
  openDrawer,
  time,
}) => {
  const tableId = type + '-freight-edm-table';
  const columns = [
    {
      title: getIn18Text('DAODARIQI'),
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      ellipsis: {
        showTitle: false,
      },
      width: 120,
      // defaultSortOrder: 'descend' as 'ascend' | 'descend',
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: '出发港',
      dataIndex: 'portOfLading',
      key: 'portOfLading',
      ellipsis: {
        showTitle: false,
      },
      width: 240,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: '目的港',
      dataIndex: 'portOfUnLading',
      key: 'portOfUnLading',
      ellipsis: {
        showTitle: false,
      },
      width: 240,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: '采购商',
      dataIndex: 'conName',
      key: 'conName',
      ellipsis: {
        showTitle: false,
      },
      width: 240,
      render: (text: any, record: any) => (
        <>
          <EllipsisTooltip>
            {text ? (
              text === getIn18Text('WEIGONGKAI') ? (
                <span>{text}</span>
              ) : (
                <span
                  onClick={() => {
                    openDrawer &&
                      openDrawer({
                        to: 'buysers',
                        companyName: text,
                        country: record.conCountry,
                      });
                  }}
                  className={style.link}
                >
                  {text}
                </span>
              )
            ) : (
              <span>'-'</span>
            )}
          </EllipsisTooltip>
        </>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'shpName',
      key: 'shpName',
      ellipsis: {
        showTitle: false,
      },
      width: 240,
      render: (text: any, record: any) => (
        <>
          <EllipsisTooltip>
            {text ? (
              text === getIn18Text('WEIGONGKAI') ? (
                <span>{text}</span>
              ) : (
                <span
                  onClick={() => {
                    openDrawer &&
                      openDrawer({
                        to: 'supplier',
                        companyName: text,
                        country: record.shpCountry,
                      });
                  }}
                  className={style.link}
                >
                  {text}
                </span>
              )
            ) : (
              <span>'-'</span>
            )}
          </EllipsisTooltip>
        </>
      ),
    },
    {
      title: getIn18Text('YUNSHUGONGSI'),
      dataIndex: 'transportCompany',
      key: 'transportCompany',
      ellipsis: {
        showTitle: false,
      },
      width: 240,
      render: (text: any, record: any) => (
        <>
          <EllipsisTooltip>
            {text ? (
              text === getIn18Text('WEIGONGKAI') ? (
                <span>{text}</span>
              ) : (
                <span
                  onClick={() => {
                    openDrawer &&
                      openDrawer({
                        to: 'peers',
                        companyName: text,
                        country: record.originCountry,
                      });
                  }}
                  className={style.link}
                >
                  {text}
                </span>
              )
            ) : (
              <span>'-'</span>
            )}
          </EllipsisTooltip>
        </>
      ),
    },
    {
      title: getIn18Text('HSBIANMA'),
      dataIndex: 'highHsCode',
      key: 'highHsCode',
      width: 100,
      render: (text: string) => <EllipsisTooltip>{<span className={'customs-company'} dangerouslySetInnerHTML={{ __html: text || '-' }}></span>}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHANPINMIAOSHU'),
      dataIndex: 'highGoodsShpd',
      key: 'highGoodsShpd',
      width: 260,
      render: (text: string, record: resItemType) => (
        <div className={'company-name-item'}>
          <EllipsisTooltip>{<span className={'customs-company'} dangerouslySetInnerHTML={{ __html: text || '-' }}></span>}</EllipsisTooltip>
          <Translate title={record.goodsshpd} bodyContainer classnames={'company-text'}></Translate>
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
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHULIANG'),
      dataIndex: 'quantity',
      key: 'quantity',
      ellipsis: {
        showTitle: false,
      },
      width: 120,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHONGLIANG'),
      dataIndex: 'weight',
      key: 'weight',
      ellipsis: {
        showTitle: false,
      },
      width: 120,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YUANCHANDE'),
      dataIndex: 'originCountry',
      key: 'originCountry',
      ellipsis: {
        showTitle: false,
      },
      width: 200,
      render: (text: any) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    // {
    //     title: '发货人',
    //     dataIndex: 'shipper',
    //     key: 'shipper',
    //     ellipsis: {
    //         showTitle: false
    //     },
    //     width: 200,
    //     render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
    // },
    // {
    //     title: '收货人',
    //     dataIndex: 'consignee',
    //     key: 'consignee',
    //     ellipsis: {
    //         showTitle: false
    //     },
    //     width: 200,
    //     render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
    // }
  ];
  const handleColumns = (param: []) => {
    if (type === 'peers') {
      param.splice(5, 1);
      return param;
    } else {
      param.splice(3, 2);
      return param;
    }
  };
  return (
    <div className={style.customsFreight} style={{ padding: `${hasEchar ? 0 : '16px'}` }}>
      {type === 'peers' && <FrieihtEchar time={time} country={country} companyName={companyName} />}
      <CusotmsDetailSearch
        type={type}
        hsCode={hsCode}
        goodsShipped={goodsShipped}
        preciseSearch={preciseSearch}
        countryList={countryList}
        onChangeCountry={onChangeCountry}
        allCountry={allCountry}
        onChangeOriginCountry={onChangeOriginCountry}
        onChangeHscode={onChangeHscode}
        onChangeGoods={onChangeGoods}
        onChangePreciseSearch={onChangePreciseSearch}
        onChangePort={onChangePort}
        goPort={goPort}
        endPort={endPort}
        setComePort={setComePort}
        setFinaPort={setFinaPort}
        className={hasEchar ? style.freightSearchPadding : style.freightSearch}
        showPort={true}
      />
      <CustomScrollTable>
        <SiriusTable
          id={tableId}
          className="edm-table freight-edm-table customs-scroll"
          rowKey={() => Math.random()}
          columns={handleColumns(columns as any)}
          onChange={(pagination, filter, sort) => {
            onChange(pagination, filter, sort, goPort, endPort);
          }}
          scroll={{ x: '100%' }}
          loading={loading}
          dataSource={tableList}
          pagination={{
            ...defaultPagination,
            ...pagination,
          }}
        />
      </CustomScrollTable>
    </div>
  );
};
export default BaseInfo;
