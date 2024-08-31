import React, { useEffect, useMemo, useState } from 'react';
import {
  transactionRecordItem,
  resBuysersBase,
  resSuppliersBase,
  resCustomsCountry as countryItemType,
  resCustomsStatistics as statisticsType,
  getIn18Text,
  CustomsContinent,
} from 'api';
import InfoBox from './infoBox/infoBox';
import { Table, PaginationProps, Modal } from 'antd';
import style from './record.module.scss';
import CusotmsDetailSearch from './../components/commonSearch/commonSearch';
import { recData as recDataType } from '../../../customs/customs';
import { LineEcharts } from './customsEchart/customsEchart';
import BlDialog from './blDialog/blModal';
import { getBoxConfig, tableColumns } from './recordColumns';
import { ColumnsType } from 'antd/lib/table';
import CustomScrollTable from './../../table/customsTable';
import SpModal from './blDialog/spModal';
import { Moment } from 'moment';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import classNames from 'classnames';

interface Props {
  dataType: 'buysers' | 'suppliers';
  tableList: transactionRecordItem[];
  detail: Partial<resBuysersBase> & Partial<resSuppliersBase>;
  pagination: any;
  onChange: (pagination: PaginationProps, filter: any, sorter: any) => void;
  openDrawer?: (content: recDataType['content']) => void;
  loading: boolean;
  hsCode?: string;
  goodsShipped?: string;
  preciseSearch?: boolean;
  countryList?: string[];
  allCountry: CustomsContinent[];
  onChangeCountry: (list: string[]) => void;
  onChangeHscode?: (hsCode?: string) => void;
  onChangeGoods?: (goods?: string) => void;
  onChangePreciseSearch?: (preciseSearch?: boolean) => void;
  // onChangeRecordCountRY: (key: string) => void;
  readonlyBoxInfo?: boolean;
  statistics: statisticsType;
  // onChangeYear: (year: number[]) => void;
  // year: number[];
  onChangeDealTime?: (time: [string, string]) => void;
  initDateRange?: [Moment, Moment];
  hasEchar?: boolean;
  hideBaseInfo?: boolean;
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

interface boxItemType {
  key: string;
  label: string;
  isNumber?: boolean;
  content?: string | number;
  isClick?: boolean;
}

const BaseInfo: React.FC<Props> = ({
  detail,
  tableList,
  pagination,
  onChange,
  openDrawer,
  loading,
  hsCode,
  goodsShipped,
  preciseSearch,
  onChangeGoods,
  onChangeHscode,
  onChangePreciseSearch,
  // onChangeRecordCountRY,
  readonlyBoxInfo,
  countryList,
  allCountry,
  onChangeCountry,
  statistics,
  // onChangeYear,
  // year,
  dataType,
  onChangeDealTime,
  initDateRange,
  hasEchar,
  hideBaseInfo,
}) => {
  const [visable, setVisable] = useState<boolean>(false);
  const [recordId, setRecordId] = useState<string>('');
  const [boxInfo, setBoxInfo] = useState<boxItemType[]>([]);
  const [columns, setColumns] = useState<ColumnsType<transactionRecordItem>>([]);
  const [spDataVisible, setSpDataVisible] = useState<boolean>(false);
  useEffect(() => {
    if (detail) {
      let list = getBoxConfig(dataType, detail);
      setBoxInfo([...list]);
      let columns = tableColumns(dataType, openBLDialog, openDrawer);
      setColumns([...columns]);
    }
  }, [detail]);

  const openBLDialog = (recordId: string, isSpecialSource?: boolean) => {
    if (!isSpecialSource) {
      setVisable(true);
    } else {
      setSpDataVisible(true);
    }
    setRecordId(recordId);
  };

  const handlerOpenParams = (companyName: string) => {
    if (dataType === 'buysers') {
      let country = detail.maxSupplierCountry as string;
      openDrawer?.({ to: 'supplier', companyName, country });
    } else {
      let country = detail.maxBuyerCountry as string;
      openDrawer?.({ to: 'buysers', companyName, country });
    }
  };

  const tabeTitle = useMemo(() => (dataType === 'buysers' ? getIn18Text('JINKOUMINGXI') : getIn18Text('CHUKOUMINGXI')), [dataType]);
  return (
    <div className={style.baseInfo} style={{ padding: `${hasEchar ? 0 : '16px'}` }}>
      {/* 引用此组件的地方 都不需要下面这段代码 注释掉 保留记录 留待下期删除 2023-01-03 */}
      {/* <div hidden={hideBaseInfo} className={style.box}>
        {rederInfoBox()}
      </div> */}
      <LineEcharts statistics={statistics} type={dataType} />
      <div style={{ color: '#272E47', fontSize: '14px', fontWeight: 'bold' }}>{tabeTitle}</div>
      <CusotmsDetailSearch
        initDateRange={initDateRange}
        type={dataType}
        hsCode={hsCode}
        goodsShipped={goodsShipped}
        preciseSearch={preciseSearch}
        defaultExpand={Boolean(hsCode)}
        countryList={countryList}
        onChangeCountry={onChangeCountry}
        allCountry={allCountry}
        onChangeHscode={onChangeHscode}
        onChangePreciseSearch={onChangePreciseSearch}
        onChangeGoods={onChangeGoods}
        onChangeDealTime={onChangeDealTime}
        isRecord={true}
        className={style.freightSearch}
      />
      <div className={style.clientTableBox}>
        <CustomScrollTable>
          <SiriusTable
            className={classNames('edm-table', 'customs-scroll', style.tableStyle)}
            rowKey={() => Math.random()}
            columns={columns}
            onChange={onChange}
            loading={loading}
            scroll={{ x: '100%' }}
            dataSource={tableList}
            pagination={{
              ...defaultPagination,
              ...pagination,
            }}
          />
        </CustomScrollTable>
      </div>
      {visable && <BlDialog onCancel={() => setVisable(false)} visible={visable} recordId={recordId} />}
      <SpModal id={recordId} visible={spDataVisible} onCancel={() => setSpDataVisible(false)} />
    </div>
  );
};

export default BaseInfo;
