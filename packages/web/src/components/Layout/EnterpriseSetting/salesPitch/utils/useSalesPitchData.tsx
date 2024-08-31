import { useMemo } from 'react';
import { SalesPitchDataMap } from 'api';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { filterSalesPitchDataMap } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';

const useSalesPitchData = (): [SalesPitchDataMap, (data: SalesPitchDataMap) => void] => {
  const [searchInput] = useState2ReduxMock('searchInput');
  const isSearching = useMemo(() => !!searchInput, [searchInput]);

  const [config] = useState2ReduxMock('config');

  const [dataMap, setDataMap] = useState2ReduxMock('dataMap');
  const [searchDataMap, setSearchDataMap] = useState2ReduxMock('searchDataMap');

  const salesPitchDataMap = filterSalesPitchDataMap(isSearching ? searchDataMap : dataMap, {
    type: config.showEnterprise ? 'ALL' : 'PERSONAL',
  });

  return [salesPitchDataMap, isSearching ? setSearchDataMap : setDataMap];
};

export default useSalesPitchData;
