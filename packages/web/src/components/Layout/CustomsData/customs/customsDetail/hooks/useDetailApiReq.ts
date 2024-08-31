import { useState } from 'react';
import { edmCustomsApi } from '@/components/Layout/globalSearch/constants';
import { recData } from '../../customs';
import {
  resBuysersBase,
  resSuppliersBase,
  resCustomsStatistics as statisticsType,
  topNCompanyInfoItem as barItemType,
  transactionRecordItem as tableItemType,
  customsFreightItem,
} from 'api';
import { MergeCompanyType } from '../customsBaseDetail';
import { WmDataSentryKey, WmDataSentryOp, errorReportApi, getWmDataSentryKeyPrefix } from '@/components/Layout/globalSearch/sentry-utils';
import { BuyAndSupportType, ForeignParam } from '../customsBaseDetail';
import { useMemoizedFn } from 'ahooks';

interface Prop extends recData {
  to: 'buysers' | 'supplier' | 'peers';
  companyName: string;
  country: string;
  usdRecentYear: string;
  recordCountRecentYear: string;
  selectedCompanyList: string[];
  year: number[];
  barYear: number[];
  handleHscodeData: (param: string) => string;
  recordParams: any;
  handerTalbeData: (data: tableItemType[] | customsFreightItem[], key?: string) => tableItemType[] | customsFreightItem[];
  time: string[];
}

export const useDetailApiReq = (param: Prop) => {
  const {
    to: DETAIL_TYPE,
    companyName,
    country,
    usdRecentYear,
    recordCountRecentYear,
    content,
    selectedCompanyList,
    year,
    barYear,
    handleHscodeData,
    recordParams,
    handerTalbeData,
    time,
  } = param;
  const [baseData, setBaseData] = useState<Partial<resBuysersBase & resSuppliersBase>>({});
  const [baseInfoTableData, setBaseInfoTableData] = useState<MergeCompanyType[]>([]);
  const [rowKey, setSelectedRowKeys] = useState<number[]>([]);
  const [statistics, setStatistics] = useState<statisticsType>({} as statisticsType);
  const [barData, setBarData] = useState<barItemType[]>([]);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [tableList, setTableList] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [purchaseChainData, setBuyAndSupport] = useState<BuyAndSupportType>({} as BuyAndSupportType);
  const fetchBase = (sentryId?: number) => {
    const apiBase = {
      buysers: edmCustomsApi.globalBuyersBase,
      supplier: edmCustomsApi.globalSuppliersBase,
      peers: edmCustomsApi.getPeersCompanyBase,
    }[DETAIL_TYPE];
    const param = {
      companyName,
      country,
      groupByCountry: true,
      // 此字段无用 后端需要 写死
      usdRecentYear: '',
      // 此字段无用 后端需要 写死
      recordCountRecentYear: '',
      visited: !!content.visited,
      mergedCompanyNames: selectedCompanyList,
      companyList: [
        {
          companyName: companyName,
          country: country,
        },
      ],
      beginDate: time[0],
      endDate: time[1],
      sourceType:
        ({
          buysers: 'customs',
          supplier: 'customs',
          peers: 'transport',
        }[DETAIL_TYPE] as 'customs' | 'transport') || 'customs',
    };
    apiBase
      .bind(edmCustomsApi)(param)
      .then(res => {
        setBaseData(res);
        // setBaseInfoTableData
        if (res.mergedCompanyNames && res.mergedCompanyNames.length > 0) {
          setBaseInfoTableData(
            res.mergedCompanyNames.map((item, index) => {
              return {
                id: index + 1,
                companyName: item,
                country: country,
              };
            })
          );
        }
        // 未选择默认全选
        if (res.mergedCompanyNames && selectedCompanyList.length == 0) {
          setSelectedRowKeys(
            res.mergedCompanyNames.map((item, index) => {
              return index + 1;
            })
          );
        }
        if (sentryId) {
          errorReportApi.endTransaction({ id: sentryId });
        }
      });
  };
  const fetchStatistics = () => {
    const apiStatic = DETAIL_TYPE === 'buysers' ? edmCustomsApi.globalBuyersStatistics : edmCustomsApi.globalSuppliersStatistics;
    apiStatic
      .bind(edmCustomsApi)({
        companyList: [
          {
            companyName: companyName,
            country: country,
          },
        ],
        // year endYear  后端需要 已无用
        year: '',
        endYear: '',
        mergedCompanyNames: selectedCompanyList,
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'customs',
      })
      .then(res => {
        setStatistics(res);
      });
  };
  const fetchBarStatistics = () => {
    const apiBarTop = DETAIL_TYPE === 'buysers' ? edmCustomsApi.barGlobalTopSuppliers : edmCustomsApi.globalBarTopBuyers;
    apiBarTop
      .bind(edmCustomsApi)({
        companyList: [
          {
            companyName: companyName,
            country: country,
          },
        ],
        // year 均已无用 仅服务端需要
        year: '',
        endYear: '',
        startYear: '',
        mergedCompanyNames: selectedCompanyList,
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'customs',
      })
      .then(res => {
        setBarData(res.topNCompanyInfo);
      });
  };
  const fetchRecords = (page?: number, pageSize?: number) => {
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, isPreciseSearch: paramsPreciseSearch, dealtTime } = recordParams;
    setLoading(true);
    const recordApi = DETAIL_TYPE === 'buysers' ? edmCustomsApi.globalBuyersRecord : edmCustomsApi.globalSuppliersRecord;
    recordApi
      .bind(edmCustomsApi)({
        size,
        companyList: [
          {
            companyName: companyName,
            country: country,
          },
        ],
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        hsCode: handleHscodeData(hsCode),
        exactlySearch: paramsPreciseSearch,
        goodsShipped,
        relationCountry: relationCountryList,
        startTransDate: '',
        endTransDate: '',
        mergedCompanyNames: selectedCompanyList,
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'customs',
      })
      .then(res => {
        const { transactionRecords, total } = res;
        setPagination({
          ...pagination,
          current: res.from + 1,
          total,
        });
        setTableList(handerTalbeData(transactionRecords));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const fetchSupplier = (page?: number, pageSize?: number) => {
    const { from, size, sortBy, order, relationCountryList, mergedCompanyNames } = recordParams;
    const buyerOrSuppliersApi = DETAIL_TYPE === 'buysers' ? edmCustomsApi.globalBuyersSuppliers : edmCustomsApi.globalSuppliersBuyers;
    const countryKey: keyof Parameters<typeof buyerOrSuppliersApi>[0] = DETAIL_TYPE === 'buysers' ? 'shpCountryList' : 'conCountryList';
    setLoading(true);
    buyerOrSuppliersApi
      .bind(edmCustomsApi)({
        size,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        companyList: [
          {
            companyName: companyName,
            country: country,
          },
        ],
        [countryKey]: relationCountryList,
        relationCountry: relationCountryList,
        mergedCompanyNames: selectedCompanyList,
        sourceType: 'customs',
        beginDate: time[0],
        endDate: time[1],
      })
      .then(res => {
        const { companies, total } = res;
        setPagination({
          ...pagination,
          current: res.from + 1,
          total,
        });
        setTableList(companies);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const featchPurchase = async () => {
    setLoading(true);
    try {
      const buyers = await featchPurchaseBuyers();
      const support = await featchPurchaseSupplier();
      setBuyAndSupport({
        buy: buyers,
        supplie: support,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const featchPurchaseBuyers = async () => {
    const { from, size, sortBy, order, relationCountryList, mergedCompanyNames } = recordParams;
    // let buyers
    const res = await edmCustomsApi.getBuyersCompanyList({
      size: 10,
      companyList: [
        {
          companyName: companyName,
          country,
          originCompanyName: content.originCompanyName,
        },
      ],
      groupByCountry: true,
      from: from - 1,
      sortBy: 'relationCompanyCnt',
      order: 'desc',
      conCountryList: relationCountryList,
      relationCountry: relationCountryList,
      shpCountryList: relationCountryList,
      year: '',
      endYear: '',
      mergedCompanyNames: selectedCompanyList,
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'customs',
    });
    // console.log(res,334353535353535);
    return res.companies;
  };
  const featchPurchaseSupplier = async () => {
    const { from, size, sortBy, order, relationCountryList, mergedCompanyNames } = recordParams;
    const res = await edmCustomsApi.getSuppliersCompanyList({
      size: 10,
      companyList: [
        {
          companyName: companyName,
          country,
          originCompanyName: content.originCompanyName,
        },
      ],
      groupByCountry: true,
      from: from - 1,
      sortBy: 'relationCompanyCnt',
      order: 'desc',
      shpCountryList: relationCountryList,
      relationCountry: relationCountryList,
      conCountryList: relationCountryList,
      year: '',
      endYear: '',
      mergedCompanyNames: selectedCompanyList,
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'customs',
    });
    return res.companies;
  };
  const fetchFreight = (goPort?: ForeignParam[], endPort?: ForeignParam[], currentPage?: number) => {
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, originCountry, isPreciseSearch: paramsPreciseSearch } = recordParams;
    setLoading(true);
    const freightApi = {
      buysers: edmCustomsApi.buyersFreight,
      supplier: edmCustomsApi.suppliersFreight,
      peers: edmCustomsApi.listAreaStatisticsRecord,
    }[DETAIL_TYPE];
    freightApi
      .bind(edmCustomsApi)({
        size,
        companyList: [
          {
            companyName: companyName,
            country: country,
          },
        ],
        sortBy,
        order,
        hsCode: handleHscodeData(hsCode),
        goodsShipped,
        exactlySearch: paramsPreciseSearch,
        originCountry,
        groupByCountry: true,
        from: currentPage ? currentPage - 1 : from - 1,
        relationCountry: relationCountryList,
        mergedCompanyNames: selectedCompanyList,
        portOfLadings: goPort && goPort.length > 0 ? goPort : [],
        portOfUnLadings: endPort && endPort.length > 0 ? endPort : [],
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'customs',
      })
      .then(res => {
        const { freightInfoList, total } = res;
        setPagination({
          ...pagination,
          current: res.from + 1,
          total,
        });
        setTableList(handerTalbeData(freightInfoList, 'goodsshpd'));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  return {
    baseData,
    baseInfoTableData,
    rowKey,
    statistics,
    barData,
    fetchBase,
    fetchStatistics,
    fetchBarStatistics,
    fetchRecords,
    fetchSupplier,
    featchPurchase,
    fetchFreight,
    tableList,
    loading,
    purchaseChainData,
    pagination,
  };
};
