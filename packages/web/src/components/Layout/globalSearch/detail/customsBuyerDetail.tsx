import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import {
  apis,
  apiHolder,
  resBuysersBase,
  EdmCustomsApi,
  transactionRecordItem as tableItemType,
  customsFreightItem,
  resCustomsStatistics as statisticsType,
  topNCompanyInfoItem as barItemType,
  getIn18Text,
  CustomsContinent,
} from 'api';
import style from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail.module.scss';
import BaseInfo from '@/components/Layout/CustomsData/customs/customsDetail/components/baseInfo';
import Record from '@/components/Layout/CustomsData/customs/customsDetail/components/record';
import Supplier from '@/components/Layout/CustomsData/customs/customsDetail/components/supplier';
import Freight from '@/components/Layout/CustomsData/customs/customsDetail/components/freight';
import { recData as recDataType } from '@/components/Layout/CustomsData/customs/customs';
import { handleHscodeData, transformOrder } from '../utils';
import { PurchaseChainTab } from './PurchaseChainTab';
import { useCustomsCountryHook } from '../../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { ForeignParam } from '../../CustomsData/customs/customsDetail/customsBaseDetail';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { useMemoizedFn } from 'ahooks';

const { TabPane } = Tabs;

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

type TabConfig = {
  key: string;
  text: string;
};

const BUYERS_TABS: TabConfig[] = [
  { key: 'records', text: getIn18Text('JINKOUJILU') },
  { key: 'supplier', text: getIn18Text('GONGYINGSHANG') },
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

const BuyersDetail: React.FC<CustomsDetailProps> = props => {
  const { content, visible, onShowNext, queryGoodsShipped, queryHsCode, isPreciseSearch, checkCompanyChange, checkCompanyChangeStatus, warnningTextShow, time } = props;
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
    isPreciseSearch,
    goodsShipped: queryGoodsShipped,
    relationCountryList: [],
  });
  const [tabList, setTabList] = useState<TabConfig[]>(() => BUYERS_TABS);
  const [tabKey, setTabKey] = useState<string>(BUYERS_TABS[0]?.key);
  const [baseData, setBaseData] = useState<Partial<resBuysersBase>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [recordParams, setRecordParams] = useState<any>({});
  const [hsCode, setHsCode] = useState<string | undefined>(queryHsCode);
  const [goodsShipped, setGoodsShipped] = useState<string | undefined>(queryGoodsShipped);
  const [preciseSearch, setPreciseSearch] = useState<boolean | undefined>(isPreciseSearch);
  const [tableList, setTableList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [statistics, setStatistics] = useState<statisticsType>({} as statisticsType);
  const [countryList, setCountryList] = useState<string[]>([]);
  const [allCountry, setAllCountry] = useState<CustomsContinent[]>([]);
  const [barYear, setBarYear] = useState<number[]>([new Date().getFullYear(), new Date().getFullYear()]);
  const [barData, setBarData] = useState<barItemType[]>([]);
  const [continentList] = useCustomsCountryHook();
  const [comePort, setComePort] = useState<ForeignParam[]>(goPort ?? []);
  const [finaPort, setFinaPort] = useState<ForeignParam[]>(endPort ?? []);
  const [sortBy, setSortBy] = useState<string>('');
  const [order, setOrder] = useState<string>('');
  const companyName = useMemo(() => baseData.companyName || contentCompanyName, [contentCompanyName, baseData.companyName]);
  useEffect(() => {
    if (continentList && continentList.length > 0) {
      setAllCountry(continentList);
    }
  }, [continentList]);
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

  const fetchBase = () => {
    if (!companyList?.length) return;
    edmCustomsApi
      .globalBuyersBase({
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        // 字段无用 写死 后端需要
        usdRecentYear: '',
        // 字段无用 写死 后端需要
        recordCountRecentYear: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'global',
      })
      .then(res => {
        setBaseData(res);
      });
  };
  // const fetchCountryList = () => {
  //   edmCustomsApi.getSuppliersCountry().then(res => {
  //     setAllCountry(res);
  //   });
  // };

  const fetchStatistics = () => {
    if (!companyList?.length) return;
    edmCustomsApi
      .globalBuyersStatistics({
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
    const topApi = edmCustomsApi.barGlobalTopSuppliers;
    topApi
      .bind(edmCustomsApi)({
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        // country,
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

  const replaceText = (newQueryValue: string, data: string) => {
    const reg = new RegExp(handleHscodeData(newQueryValue), 'gi');
    data = data.replace(reg, function (txt) {
      return '<em>' + txt + '</em>';
    });
    return data;
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

  const featchRecords = (page?: number, pageSize?: number) => {
    if (!companyList?.length) return;
    const { from, size, sortBy, order, hsCode: paramsHsCode, goodsShipped: paramsGoodsShipped, isPreciseSearch: paramsPreciseSearch } = recordParams;
    edmCustomsApi
      .globalBuyersRecord({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        exactlySearch: paramsPreciseSearch,
        hsCode: handleHscodeData(paramsHsCode),
        goodsShipped: paramsGoodsShipped,
        relationCountry: outerValue.current.relationCountryList,
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
  const featchSupplier = (page?: number, pageSize?: number) => {
    if (!companyList?.length) return;
    const { from, size, sortBy, order } = recordParams;
    edmCustomsApi
      .globalBuyersSuppliers({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        relationCountry: outerValue.current.relationCountryList,
        conCountryList: outerValue.current.relationCountryList,
        sourceType: 'global',
        beginDate: time[0],
        endDate: time[1],
      })
      .then(res => {
        const { companies, total } = res;
        setPagination({
          ...pagination,
          current: page ?? pagination.current,
          total,
        });
        setTableList(companies);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const featchFreight = (goPort?: ForeignParam[], endPort?: ForeignParam[], page?: number, pageSize?: number) => {
    if (!companyList?.length) return;
    const {
      from,
      size,
      sortBy,
      order,
      hsCode: paramsHsCode,
      goodsShipped: paramsGoodsShipped,
      relationCountryList: paramsRelationCountryList,
      originCountry: paramsOriginCountry,
      isPreciseSearch: paramsPreciseSearch,
    } = recordParams;
    edmCustomsApi
      .buyersFreight({
        size,
        companyList: companyList?.map(item => ({ companyName: item.name, country: item.country })),
        country,
        groupByCountry: true,
        from: page ? page - 1 : from - 1,
        sortBy,
        order,
        hsCode: handleHscodeData(paramsHsCode),
        goodsShipped: paramsGoodsShipped,
        exactlySearch: paramsPreciseSearch,
        relationCountry: paramsRelationCountryList,
        originCountry: paramsOriginCountry,
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
      order: transformOrder(order),
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
  useEffect(() => {
    if (tabOneValue === 'hsCode') {
      setHsCode(queryValue);
      setGoodsShipped('');
      outerValue.current.goodsShipped = '';
      outerValue.current.hsCode = queryValue;
    } else if (tabOneValue === 'goodsShipped') {
      setGoodsShipped(queryValue);
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
  }, [tabKey, tabOneValue, queryValue, relationCountryList, queryGoodsShipped, queryHsCode]);

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

  useEffect(() => {
    if (visible) {
      fetchBase();
    } else {
      setBaseData({});
      setTableList([]);
      // setContactsList([]);
      setLoading(false);
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
      featchRecords();
    }
    if (tabKey === 'supplier' && companyName) {
      setTableList([]);
      setLoading(true);
      featchSupplier();
    }
    if (tabKey === 'freight' && companyName) {
      setTableList([]);
      setLoading(true);
      featchFreight(
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
    if (tabKey === 'records' && companyName) {
      fetchStatistics();
    }
  }, [tabKey]);

  useEffect(() => {
    if (tabKey === 'supplier' && companyName) {
      fetchBarStatistics();
    }
  }, [tabKey]);

  useEffect(() => {
    if (checkCompanyChange && Object.keys(recordParams).length > 0) {
      fetchBase();
      if (tabKey === 'records') {
        setTableList([]);
        setLoading(true);
        featchRecords();
        fetchStatistics();
      }
      if (tabKey === 'supplier') {
        setTableList([]);
        setLoading(true);
        featchSupplier();
        fetchBarStatistics();
      }
      if (tabKey === 'freight') {
        setTableList([]);
        setLoading(true);
        featchFreight(
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

  const handleTimeChange = useMemoizedFn(() => {
    fetchBase();
    switch (tabKey) {
      case 'records':
        fetchStatistics();
        setTableList([]);
        setLoading(true);
        featchRecords(1);
        return;
      case 'supplier':
        setTableList([]);
        setLoading(true);
        featchSupplier(1);
        fetchBarStatistics();
        return;
      case 'freight':
        setTableList([]);
        setLoading(true);
        featchFreight(
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

  return (
    <div className={style.customsDataDetail}>
      <div
        key={Number(visible)}
        className={classnames(style.body)}
        style={{
          padding: 0,
          background: '#fff',
        }}
      >
        <BaseInfo
          dataType="buysers"
          warnningTextShow={warnningTextShow}
          detail={baseData}
          openDrawer={handleOpenNextDrawer}
          onDig={() => {}}
          isCanExactDig={false}
          year={barYear}
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
            dataType="buysers"
            detail={baseData}
            hsCode={hsCode}
            countryList={countryList}
            goodsShipped={goodsShipped}
            preciseSearch={preciseSearch}
            tableList={tableList}
            loading={loading}
            pagination={pagination}
            allCountry={allCountry}
            onChange={onTableChange}
            onChangeDealTime={(dealtTime: [string, string]) => {
              // 公共搜索内时间逻辑取消
              // outerValue.current.dealtTime = dealtTime;
              // outerValue.current.dealtTimeMoment = dealtTime.filter(Boolean).length ? [moment(dealtTime[0]), moment(dealtTime[1])] : undefined;
              // handerReqParams();
            }}
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            statistics={statistics}
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
            readonlyBoxInfo
            hasEchar
            hideBaseInfo
          />
        )}
        {tabKey === 'supplier' && (
          <Supplier
            tableList={tableList}
            title={typeof window !== 'undefined' ? window.getLocalLabel('GONGYINGSHANG') : ''}
            dataType="suppliers"
            buyersName={companyName}
            buyersCountry={country}
            countryList={countryList}
            suppliersCountry={country}
            loading={loading}
            companyList={companyList as any}
            barData={barData}
            pagination={pagination}
            onChange={onTableChange}
            type="buysers"
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            allCountry={allCountry}
            onChangeCountry={(list: string[]) => {
              setCountryList(list);
              outerValue.current.relationCountryList = list;
              handerReqParams(order, sortBy);
            }}
            hasEchar
          />
        )}
        {tabKey === 'freight' && (
          <Freight
            type="buysers"
            tableList={tableList}
            pagination={pagination}
            countryList={countryList}
            loading={loading}
            hsCode={hsCode}
            preciseSearch={preciseSearch}
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
            goPort={comePort}
            endPort={finaPort}
            setComePort={setComePort}
            setFinaPort={setFinaPort}
            goodsShipped={goodsShipped}
            onChange={onTableChange}
            hasEchar
            onChangePort={(goPort, endPort, type) => {
              featchFreight(goPort, endPort);
            }}
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
            tabKey={tabKey}
            country={country}
            openDrawer={onShowNext ? handleOpenNextDrawer : undefined}
            time={time}
          />
        )}
      </div>
    </div>
  );
};
export default BuyersDetail;
