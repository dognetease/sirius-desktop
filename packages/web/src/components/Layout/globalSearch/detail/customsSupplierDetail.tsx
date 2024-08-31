/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  resSuppliersBase,
  EdmCustomsApi,
  transactionRecordItem as tableItemType,
  customsFreightItem,
  resCustomsStatistics as statisticsType,
  topNCompanyInfoItem as barItemType,
  getIn18Text,
  CustomsContinent,
} from 'api';
import moment, { Moment } from 'moment';
import { useMemoizedFn } from 'ahooks';
// import { Tabs } from '@web-common/components/UI/Tabs';
import BaseInfo from '@/components/Layout/CustomsData/customs/customsDetail/components/baseInfo';
import style from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail.module.scss';
import Record from '@/components/Layout/CustomsData/customs/customsDetail/components/record';
import Supplier from '@/components/Layout/CustomsData/customs/customsDetail/components/supplier';
import Freight from '@/components/Layout/CustomsData/customs/customsDetail/components/freight';
import { recData as recDataType } from '@/components/Layout/CustomsData/customs/customs';
import { handleHscodeData } from '../utils';
import { PurchaseChainTab } from './PurchaseChainTab';
import { useCustomsCountryHook } from '../../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { ForeignParam } from '../../CustomsData/customs/customsDetail/customsBaseDetail';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
const { TabPane } = Tabs;
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

type TabConfig = {
  key: string;
  text: string;
};

const BUYERS_TABS: TabConfig[] = [
  { key: 'records', text: getIn18Text('CHUKOUJILU') },
  { key: 'supplier', text: getIn18Text('CAIGOUSHANG') },
  { key: 'freight', text: getIn18Text('HUOYUNXINXI') },
  { key: 'purchaseChain', text: getIn18Text('CAIGONGLIANCHUANTOU') },
];

interface CustomsDetailProps extends recDataType {
  onShowNext?: (id: string, sourceData: recDataType['content']) => void;
  queryGoodsShipped?: string;
  queryHsCode?: string;
  isPreciseSearch?: boolean;
  checkCompanyChange?: boolean;
  checkCompanyChangeStatus?(): void;
  warnningTextShow?: boolean;
  time: string[];
}

const defaultParams = {
  from: 1,
  size: 20,
};

const SuppliersDetail: React.FC<CustomsDetailProps> = props => {
  const { content, visible, onShowNext, queryGoodsShipped, queryHsCode, isPreciseSearch, checkCompanyChangeStatus, checkCompanyChange, warnningTextShow, time } = props;
  const { companyName: contentCompanyName, country, queryValue, tabOneValue, relationCountryList, companyList, originCompanyName, goPort, endPort } = content;
  const outerValue = useRef<{
    hsCode?: string;
    goodsShipped?: string;
    isPreciseSearch?: boolean;
    relationCountryList?: string[];
    dealtTime?: [string, string];
    originCountry?: string[];
    dealtTimeMoment?: [Moment, Moment];
  }>({
    hsCode: queryHsCode,
    goodsShipped: queryGoodsShipped,
    isPreciseSearch,
    relationCountryList: [],
  });
  const [tabList, setTabList] = useState<TabConfig[]>(() => BUYERS_TABS);
  const [tabKey, setTabKey] = useState<string>(BUYERS_TABS[0]?.key);
  const [baseData, setBaseData] = useState<Partial<resSuppliersBase>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [comePort, setComePort] = useState<ForeignParam[]>(goPort ?? []);
  const [finaPort, setFinaPort] = useState<ForeignParam[]>(endPort ?? []);
  const [recordParams, setRecordParams] = useState<any>({});
  const [hsCode, setHsCode] = useState<string | undefined>(queryHsCode);
  const [goodsShipped, setGoodsShipped] = useState<string | undefined>(queryGoodsShipped);
  const [preciseSearch, setPreciseSearch] = useState<boolean | undefined>(isPreciseSearch);
  const [countryList, setCountryList] = useState<string[]>([]);
  const [allCountry, setAllCountry] = useState<CustomsContinent[]>([]);
  const [usdRecentYear, setUsdRY] = useState<string>('last_one');
  const [recordCountRecentYear, setRecordCountRY] = useState<string>('last_one');

  const [tableList, setTableList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });

  const [statistics, setStatistics] = useState<statisticsType>({} as statisticsType);
  const [year, setYear] = useState<number[]>([new Date().getFullYear(), new Date().getFullYear()]);
  const [barYear, setBarYear] = useState<number[]>([new Date().getFullYear(), new Date().getFullYear()]);
  const [barData, setBarData] = useState<barItemType[]>([]);
  const [continentList] = useCustomsCountryHook();
  const [sortBy, setSortBy] = useState<string>('');
  const [order, setOrder] = useState<string>('');
  const companyName = useMemo(() => baseData.companyName || contentCompanyName, [contentCompanyName, baseData.companyName]);
  useEffect(() => {
    if (continentList && continentList.length > 0) {
      setAllCountry(continentList);
    }
  }, [continentList]);
  useEffect(() => {
    if (tabOneValue === 'hsCode') {
      setHsCode(queryValue);
      setGoodsShipped('');
      outerValue.current.goodsShipped = '';
      outerValue.current.hsCode = queryValue;
    } else if (tabOneValue === 'goodsShipped') {
      setGoodsShipped(queryValue || queryGoodsShipped);
      setHsCode('');
      outerValue.current.goodsShipped = queryValue;
      outerValue.current.hsCode = '';
    } else {
      setGoodsShipped(queryGoodsShipped);
      setHsCode(queryHsCode);
      outerValue.current.goodsShipped = queryGoodsShipped;
      outerValue.current.hsCode = queryHsCode;
    }
    if (relationCountryList) {
      setCountryList([...relationCountryList]);
      outerValue.current.relationCountryList = relationCountryList;
    } else {
      setCountryList([]);
      outerValue.current.relationCountryList = [];
    }
    if (tabKey !== 'freight') {
      outerValue.current.originCountry = [];
    }
  }, [tabKey, tabOneValue, queryValue, queryGoodsShipped, queryHsCode]);

  useEffect(() => {
    setPreciseSearch(isPreciseSearch);
    outerValue.current.isPreciseSearch = isPreciseSearch;
  }, [isPreciseSearch, tabKey]);

  useEffect(() => {
    if (tabKey && companyName && visible) {
      setOrder('');
      setSortBy('');
      handerReqParams();
    }
  }, [tabKey, companyName, visible]);

  const handerReqParams = (order?: string, sortBy?: string) => {
    setTableList([]);
    setPagination({
      current: 1,
      total: 0,
    });
    const otherParams = {
      ...outerValue.current,
    };
    setRecordParams({
      ...defaultParams,
      ...otherParams,
      order: order ?? '',
      sortBy: sortBy ?? '',
      tabKey,
      companyName,
    });
  };

  useEffect(() => {
    if (visible) {
      fetchBase();
    } else {
      setBaseData({});
      setTableList([]);
      setLoading(false);
      setRecordParams({
        ...defaultParams,
        tabKey,
        companyName: '',
      });
      setTabKey(BUYERS_TABS[0].key);
    }
  }, [visible]);

  useEffect(() => {
    if (time && Object.keys(recordParams).length > 0) {
      handleTimeChange();
    }
  }, [time]);

  useEffect(() => {
    if (baseData.hasContact) {
      setTabList(BUYERS_TABS);
    } else {
      const list = [...BUYERS_TABS].filter(item => item.key !== 'contacts');
      setTabList([...list]);
    }
  }, [baseData.hasContact]);

  useEffect(() => {
    //  阻止初始化进入 recordParams 导致的接口调用
    if (recordParams && Object.keys(recordParams).length === 0) {
      return;
    }
    if (tabKey === 'records' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchRecords();
    }
    if (tabKey === 'supplier' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchSupplier();
    }
    if (tabKey === 'freight' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchFreight(
        comePort?.map((item: any) => {
          return {
            name: item.value,
            nameCn: item.label,
          };
        }),
        finaPort?.map((item: any) => {
          return {
            name: item.value,
            nameCn: item.label,
          };
        })
      );
    }
  }, [recordParams]);

  useEffect(() => {
    if (checkCompanyChange && Object.keys(recordParams).length > 0) {
      fetchBase();
      if (tabKey === 'records') {
        setTableList([]);
        setLoading(true);
        fetchRecords();
        fetchStatistics();
      }
      if (tabKey === 'supplier') {
        setTableList([]);
        setLoading(true);
        fetchSupplier();
        fetchBarStatistics();
      }
      if (tabKey === 'freight') {
        setTableList([]);
        setLoading(true);
        fetchFreight(
          comePort?.map((item: any) => {
            return {
              name: item.value,
              nameCn: item.label,
            };
          }),
          finaPort?.map((item: any) => {
            return {
              name: item.value,
              nameCn: item.label,
            };
          })
        );
      }
    }
    checkCompanyChangeStatus && checkCompanyChangeStatus();
  }, [checkCompanyChange]);

  useEffect(() => {
    if (tabKey === 'records' && companyName) {
      fetchStatistics();
    }
  }, [tabKey]);

  useEffect(() => {
    if (tabKey === 'supplier' && companyName) {
      fetchBarStatistics();
    }
  }, [tabKey]);

  const handleTimeChange = useMemoizedFn(() => {
    fetchBase();
    switch (tabKey) {
      case 'records':
        fetchStatistics();
        setTableList([]);
        setLoading(true);
        fetchRecords(1);
        return;
      case 'supplier':
        setTableList([]);
        setLoading(true);
        fetchSupplier(1);
        fetchBarStatistics();
        return;
      case 'freight':
        setTableList([]);
        setLoading(true);
        fetchFreight(
          comePort?.map((item: any) => {
            return {
              name: item.value,
              nameCn: item.label,
            };
          }),
          finaPort?.map((item: any) => {
            return {
              name: item.value,
              nameCn: item.label,
            };
          }),
          1
        );
        return;
      default:
        break;
    }
  });

  const fetchStatistics = () => {
    if (!companyList?.length) return;
    edmCustomsApi
      .globalSuppliersStatistics({
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        // country,
        startYear: '',
        endYear: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'global',
      })
      .then(res => {
        setStatistics(res);
      });
  };
  const fetchBarStatistics = () => {
    if (!companyList?.length) return;
    const [start, end] = barYear;
    const topApi = edmCustomsApi.globalBarTopBuyers;
    topApi
      .bind(edmCustomsApi)({
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        startYear: '',
        endYear: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'global',
      })
      .then(res => {
        setBarData(res.topNCompanyInfo);
      });
  };
  const fetchBase = () => {
    if (!companyList?.length) return;
    edmCustomsApi
      .globalSuppliersBase({
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        // 此处字段无用 后端需要 写死
        usdRecentYear: '',
        // 此处字段无用 后端需要 写死
        recordCountRecentYear: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'global',
      })
      .then(res => {
        setBaseData(res);
      });
  };

  const replaceText = (queryValue: string, data: string) => {
    const reg = new RegExp(handleHscodeData(queryValue), 'gi');
    return data.replace(reg, txt => `<em>${txt}</em>`);
  };
  const handerTalbeData = (data: tableItemType[] | customsFreightItem[], key?: string) => {
    data.map(item => {
      if (item?.highLight?.type === 'goodsShipped') {
        item.highGoodsShpd = item?.highLight?.value;
      } else {
        item.highGoodsShpd = key ? item?.goodsshpd : item.goodsShpd;
      }
      if (hsCode) {
        item.highHsCode = replaceText(hsCode, item.hsCode);
      } else {
        item.highHsCode = item.hsCode;
      }
      return item;
    });
    return data;
  };

  const fetchRecords = (page?: number, pageSize?: number) => {
    if (!companyList?.length) return;
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, isPreciseSearch: paramsPreciseSearch } = recordParams;
    edmCustomsApi
      .globalSuppliersRecord({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        hsCode: handleHscodeData(hsCode),
        goodsShipped,
        exactlySearch: paramsPreciseSearch,
        relationCountry: relationCountryList,
        endTransDate: outerValue.current.dealtTime?.[1],
        startTransDate: outerValue.current.dealtTime?.[0],
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'global',
      })
      .then(res => {
        const { transactionRecords, total } = res;
        setPagination({
          ...pagination,
          current: page ?? pagination.current,
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
    if (!companyList?.length) return;
    const { from, size, sortBy, order } = recordParams;
    edmCustomsApi
      .globalSuppliersBuyers({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: from - 1,
        sortBy,
        order,
        relationCountry: outerValue.current.relationCountryList,
        shpCountryList: outerValue.current.relationCountryList,
        sourceType: 'global',
        beginDate: time[0],
        endDate: time[1],
      })
      .then(res => {
        const { companies, total } = res;
        setPagination({
          ...pagination,
          from: page ? page - 1 : from - 1,
          total,
        });
        setTableList(companies);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const fetchFreight = (goPort?: ForeignParam[], endPort?: ForeignParam[], page?: number, pageSize?: number) => {
    if (!companyList?.length) return;
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, originCountry, isPreciseSearch: paramsPreciseSearch } = recordParams;
    edmCustomsApi
      .suppliersFreight({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        hsCode: handleHscodeData(hsCode),
        goodsShipped,
        exactlySearch: paramsPreciseSearch,
        relationCountry: relationCountryList,
        originCountry,
        portOfLadings: goPort ?? [],
        portOfUnLadings: endPort ?? [],
        sourceType: 'global',
        beginDate: time[0],
        endDate: time[1],
      })
      .then(res => {
        const { freightInfoList, total } = res;
        setPagination({
          ...pagination,
          current: page ?? pagination.current,
          total,
        });
        setTableList(handerTalbeData(freightInfoList, 'goodsshpd'));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const onTableChange = (currentPagination: any, filter: any, sorter: any) => {
    const { current, pageSize } = currentPagination;
    const { field, order } = sorter;
    const sorterParams = {
      sortBy: order ? field : '',
      // eslint-disable-next-line no-nested-ternary
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    setSortBy(sorterParams.sortBy);
    setOrder(sorterParams.order);
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
    setRecordParams({
      ...recordParams,
      ...sorterParams,
      from: current,
      size: pageSize,
    });
  };

  const handleOpenNextDrawer = async (params: recDataType['content']) => {
    const companyItem = { companyName: params.companyName, country: params.country };
    if (onShowNext) {
      const [{ id }] = await edmCustomsApi.doGetIdsByCompanyList({
        companyList: [companyItem],
      });
      onShowNext(id as string, params);
    }
  };
  return (
    <div className={style.customsDataDetail}>
      <div
        key={Number(visible)}
        className={classnames(style.body)}
        style={{
          // paddingLeft: 0,
          background: '#fff',
          padding: 0,
        }}
      >
        <BaseInfo
          dataType="suppliers"
          detail={baseData}
          warnningTextShow={warnningTextShow}
          // usdRY={usdRecentYear}
          // recordCRY={recordCountRecentYear}
          // onChangeUsdRY={setUsdRY}
          // onChangeRecordCountRY={setRecordCountRY}
          openDrawer={handleOpenNextDrawer}
          isCanExactDig={false}
          onDig={() => undefined}
          // year={barYear}
          onChangeYear={(year: number[]) => {
            setBarYear(year);
          }}
          barData={barData}
        />
        <Tabs className={classnames(style.companyTab)} bgmode="white" size="small" type="capsule" activeKey={tabKey} onChange={setTabKey}>
          {tabList.map(item => (
            <TabPane tab={item.text} key={item.key}></TabPane>
          ))}
        </Tabs>
        {tabKey === 'records' && (
          <Record
            initDateRange={outerValue.current.dealtTimeMoment}
            dataType="suppliers"
            detail={baseData}
            hsCode={hsCode}
            goodsShipped={goodsShipped}
            preciseSearch={preciseSearch}
            tableList={tableList}
            loading={loading}
            pagination={pagination}
            // usdRY={usdRecentYear}
            // recordCRY={recordCountRecentYear}
            countryList={countryList}
            allCountry={allCountry}
            statistics={statistics}
            // year={year}
            hideBaseInfo
            onChangeDealTime={(dealtTime: [string, string]) => {
              outerValue.current.dealtTime = dealtTime;
              outerValue.current.dealtTimeMoment = dealtTime.filter(Boolean).length ? [moment(dealtTime[0]), moment(dealtTime[1])] : undefined;
              handerReqParams();
            }}
            // onChangeYear={(year: number[]) => {
            //   setYear(year);
            // }}
            // onChangeUsdRY={setUsdRY}
            // onChangeRecordCountRY={setRecordCountRY}
            onChangeHscode={key => {
              setHsCode(key);
              outerValue.current.hsCode = key;
              handerReqParams(order, sortBy);
            }}
            onChangeGoods={key => {
              setGoodsShipped(key);
              outerValue.current.goodsShipped = key;
              handerReqParams(order, sortBy);
            }}
            onChangePreciseSearch={key => {
              setPreciseSearch(key);
              outerValue.current.isPreciseSearch = key;
              handerReqParams(order, sortBy);
            }}
            onChangeCountry={(key: string[]) => {
              setCountryList(key);
              outerValue.current.relationCountryList = key;
              handerReqParams(order, sortBy);
            }}
            onChange={onTableChange}
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            hasEchar
          />
        )}
        {tabKey === 'supplier' && (
          <Supplier
            countryList={countryList}
            tableList={tableList}
            pagination={pagination}
            title={typeof window !== 'undefined' ? window.getLocalLabel('CAIGOUSHANG') : ''}
            dataType="buysers"
            loading={loading}
            // year={barYear}
            barData={barData}
            // onChangeYear={(year: number[]) => {
            //   setBarYear(year);
            // }}
            companyList={companyList as any}
            allCountry={allCountry}
            type="suppliers"
            onChange={onTableChange}
            suppliersName={companyName}
            suppliersCountry={country}
            buyersCountry={country}
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            onChangeCountry={(key: string[]) => {
              setCountryList(key);
              outerValue.current.relationCountryList = key;
              handerReqParams(order, sortBy);
            }}
            hasEchar
          />
        )}
        {tabKey === 'freight' && (
          <Freight
            type="suppliers"
            tableList={tableList}
            loading={loading}
            pagination={pagination}
            hsCode={hsCode}
            goodsShipped={goodsShipped}
            preciseSearch={preciseSearch}
            countryList={countryList}
            allCountry={allCountry}
            onChangeHscode={key => {
              setHsCode(key);
              outerValue.current.hsCode = key;
              handerReqParams(order, sortBy);
            }}
            onChangeGoods={key => {
              setGoodsShipped(key);
              outerValue.current.goodsShipped = key;
              handerReqParams(order, sortBy);
            }}
            onChangePreciseSearch={key => {
              setPreciseSearch(key);
              outerValue.current.isPreciseSearch = key;
              handerReqParams(order, sortBy);
            }}
            onChange={onTableChange}
            onChangePort={(goPort, endPort) => {
              fetchFreight(goPort, endPort);
            }}
            hasEchar
            goPort={comePort}
            endPort={finaPort}
            setComePort={setComePort}
            setFinaPort={setFinaPort}
            companyName={companyName}
            time={time}
          />
        )}
        {tabKey === 'purchaseChain' && (
          <PurchaseChainTab
            companyList={companyList}
            relationCountryList={relationCountryList}
            from={recordParams.from}
            originCompanyName={originCompanyName ?? ''}
            companyName={companyName}
            country={country}
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            time={time}
          />
        )}
      </div>
    </div>
  );
};
export default SuppliersDetail;
