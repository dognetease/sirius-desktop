import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Breadcrumb, message, Skeleton } from 'antd';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  customsDataType,
  customsRecordItem as tableListType,
  DataStoreApi,
  EdmCustomsApi,
  reqBuyers,
  resBuyers,
  resCustomsFollowCountry,
  SearchReferer,
  IsPageSwitchItem,
} from 'api';
import { useMemoizedFn } from 'ahooks';
import omit from 'lodash/omit';
import { actions } from '@web-common/state/reducer/customerReducer';
import { ReactComponent as GuideTipsSvg } from '@/images/globalSearch/guide.svg';
import { ReactComponent as GuideVideoTipsSvg } from '@/images/globalSearch/videoTips.svg';
import styles from './customs.module.scss';
import CustomsSearch, { CustomsSearchRef } from './customsSearch/customsSearch';
import CustomsDetail from './customsDetail/customsDetail';
import LevelDrawer from '../components/levelDrawer/levelDrawer';
import BuysersTable from './table/buysersTable';
import { CustomsDataSelectClick, customsDataTracker } from '../tracker/tracker';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import FollowNation from './followNation/followNation';
import DataUpdate, { DataUpdateRecord } from './dataUpdate/dataUpdate';
import DocSearch, { DocSearchCondition } from './docSearch';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import HistoryDropDown from '../../globalSearch/search/HistoryDorpDown';
import useCustomsStat from './hooks/useCustomsStat';
import MyCountUp from '../../globalSearch/search/MyCountUp/MyCountUp';
import InfoRoll from '../../globalSearch/search/InfoRoll/InfoRoll';
import { useGlobalSearchStat } from '../../globalSearch/search/hooks/useGlobalSearchStat';
import { breadList, CUSTOMS_DATA_BASE_INFO, CUSTOMS_DATA_SEARCH_HISTORY, NotAllowCustomsSearch, SEARCH_OVER_100_CHAR, tabList, tips } from './constant';
import SearchFilter, { CustomsSearchFilterRef, FilterFormData } from './search/searchFilter';
import SuggestDropDown from '../../globalSearch/search/SuggestDropDown';
import CustomsSearchEmpty from './table/CustomsSearchEmpty/CustomsSearchEmpty';
import RcmdRow from '../../globalSearch/search/RcmdRow/RcmdRow';
import { getIn18Text, api, customsTimeFilterType } from 'api';
import qs from 'querystring';
import HistroyExtra from '../../globalSearch/search/HistroyExtra';
import lodashOmit from 'lodash/omit';
import SearchTab from '../../globalSearch/search/SearchTab';
import GuideSearch from '../../components/guideSearch/guideSearch';
import { ReactComponent as GuideCompany } from '@/images/icons/customs/guide_company.svg';
import { ReactComponent as GuideHscode } from '@/images/icons/customs/guide_hscode.svg';
import { globalSearchDataTracker } from '@/components/Layout/globalSearch/tracker';
import useGuideSearch from './hooks/useGuideSearch';
import useInterCollectData from './hooks/useInterCollectData';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import { WmBigDataPageLayoutContext } from '../../globalSearch/keywordsSubscribe/KeywordsProvider';
import { CountryFilterProp, FilterParam } from '../../globalSearch/search/search';
import { CountryWithContinent } from './docSearch/component/CountryList/customsCountryHook';
import { defaultOptions } from './search/useLangOption';
import { timeRangeOptions } from './search/constant';
import { WmDataSentryKey, WmDataSentryOp, errorReportApi, getWmDataSentryKeyPrefix } from '../../globalSearch/sentry-utils';
import { navigate } from 'gatsby';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const isWebWmEntry = apiHolder.api.getSystemApi().isWebWmEntry();
const { TabPane } = Tabs;
const CUSTOMS_LIST = 'CUSTOMS_LIST';

export type SearchType = 'customs' | 'buysers' | 'suppliers';

export type customsCategorySearch = 'goodsShipped' | 'company' | 'hsCode' | 'port';

type TSearchType = 'company' | 'domain' | 'product';

export interface recData {
  visible: boolean;
  zIndex: number;
  type?: string;
  to: 'buysers' | 'supplier' | 'peers';
  origin?: string;
  content: {
    country: string;
    to: 'buysers' | 'supplier' | 'peers';
    companyName: string;
    tabOneValue?: string;
    queryValue?: string;
    relationCountryList?: string[];
    visited?: boolean;
    originCompanyName?: string;
    companyList?: Array<{
      name: string;
      country?: string;
      companyId: number;
      location?: string;
    }>;
    otherGoodsShipped?: string[];
    [prop: string]: any;
  };
  switchOption?: IsPageSwitchItem; // 详情页翻页参数
  children?: recData;
}

interface moreRequestParams extends reqBuyers {
  currentCompanyType?: string;
  nearSynonymList?: string[];
}

const defaultInitParams: Omit<moreRequestParams, 'type' | 'queryValue'> = {
  relationCountryList: [],
  countryList: [],
  advanceGoodsShipped: '',
  advanceHsCode: '',
  containsExpress: true,
  excludeViewed: false,
  hasEmail: false,
  timeFilter: 'last_five_year',
  otherGoodsShipped: ['en', 'es'],
  onlyContainsChina: false,
  from: 1,
  size: dataStoreApi.getSync(CUSTOMS_LIST).data ? JSON.parse(dataStoreApi.getSync(CUSTOMS_LIST).data as any) : 20,
  advanceHsCodeSearchType: 0,
  advanceGoodsShippedSearchType: 0,
  updateTime: '',
};
const defaultSortOrderParam = {
  sortBy: '',
  order: '',
};

export type RegionType = {
  countryName: string;
  countryCode: string;
};
export type FilterResultType = {
  name: string;
  code: string;
  value: RegionType[] | string;
  display?: boolean;
};

export type publicType = 'goodsShipped' | 'company' | 'hsCode' | 'port' | 'queryCompany';

type HistoryType = {
  [key in customsDataType]?: Array<string | string[]>;
};

interface HistoryItem {
  query: string | string[];
  searchType: customSearchType;
  filterParams?: FilterParam;
  country?: CountryFilterProp[];
  language?: CountryFilterProp[];
  time?: CountryFilterProp[];
}

export interface aiKeyWrodsAndType {
  keyword: string;
  type: string;
}

export interface reqExcludeViewed {
  excludeViewedIndex: number;
  excludeViewedList: number[];
  startFrom: number;
}

type customSearchType = 'goodsShipped' | 'company' | 'hsCode' | 'port';

const Customs: React.FC<{
  defaultCustomsDataType: SearchType;
  defaultTabCompanyType: Array<{
    value: SearchType;
    label: string;
  }>;
  defaultContentTab: Array<{
    value: customSearchType;
    label: string;
  }>;
}> = ({ defaultCustomsDataType, defaultTabCompanyType, defaultContentTab }) => {
  // layout 3层 首页、列表页、详情页（只有单据搜索有）
  const [layout, setLayout] = useState<string[]>(breadList.slice(0, 1));
  const [currentCompanyType, setCompanyType] = useState<SearchType>(defaultCustomsDataType);
  const [customsCategoryType, setCustomsCategoryType] = useState<customSearchType>('goodsShipped');
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const searchFilterRef = useRef<CustomsSearchFilterRef>(null);
  const searchSourceRef = useRef<SearchReferer>('manual');
  const forceUseParamNearSynonym = useRef<boolean>(false);
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
      tabOneValue: '',
      queryValue: '',
      originCompanyName: '',
      visited: false,
      otherGoodsShipped: [],
    },
  });
  const [switchOption, setSwitchOption] = useState<IsPageSwitchItem>({
    hasLast: false,
    hasNext: false,
  });
  const [tableList, setTableList] = useState<tableListType[]>([]);
  const [realTotalCount, setRealTotalCount] = useState<number | undefined>(0);
  const [isInit, setIsInit] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [isMorePage, setIsMorePage] = useState<boolean>(false);

  const [pagination, setPagination] = useState<{ from: number; pageSize: number; total: number }>(() => {
    try {
      const { data } = dataStoreApi.getSync(CUSTOMS_LIST);
      if (data) {
        return {
          from: 1,
          total: 0,
          pageSize: JSON.parse(data) as any,
        };
      } else {
        return {
          from: 1,
          total: 0,
          pageSize: 20,
        };
      }
    } catch (error) {
      return {
        from: 1,
        total: 0,
        pageSize: 20,
      };
    }
  });
  const [reqBuyParams, setReqBuyParams] = useState<moreRequestParams>({
    type: customsCategoryType,
    currentCompanyType,
    queryValue: '',
    ...defaultInitParams,
  });
  const [translatorsOtherGoodsShipped, setTranslatorsOtherGoodsShipped] = useState<string[]>([]);

  const [searchValue, setSearchValue] = useState<string>('');
  const [sortOrderParam, setSortOrderParam] = useState<{ sortBy: string; order: string }>({
    sortBy: '',
    order: '',
  });
  const [isExactSearch, setIsExactSearch] = useState<boolean>(false);
  const { setBaseSelect } = actions;
  const tabCompanyType = useMemo(
    () =>
      defaultTabCompanyType.map(option => ({
        ...option,
        label: `${option.label}`,
      })),
    []
  );

  const [dataRecord, setDataRecord] = useState<DataUpdateRecord | null>(null);

  const [docSearchCondition, setDocSearchCondition] = useState<DocSearchCondition>(null);

  const [rcmdList, setRcmdList] = useState<string[]>([]);

  const customsSearchInputRef = useRef<CustomsSearchRef>(null);

  const totalCache = useRef<number | null>(null);

  const allowEmpty = useRef<boolean>(false);

  const [publicSearchValue, setPublicSearchValue] = useState<string>('');

  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);

  const [searchedValue, setSearchedValue] = useState<string>('');
  const [checkedNearSynonymList, setCheckedNearSynonymList] = useState<string[]>([]);

  const [customsDeepParams, setCustomsDeepParams] = useState<reqBuyers>();

  // 原始采购供应目的
  const [originReCountry, setOriginReCountry] = useState<Array<string[]>>([]);

  const [excludeViewedObj, setExcludeViewedObj] = useState<reqExcludeViewed>({
    excludeViewedIndex: 0,
    excludeViewedList: [0],
    startFrom: 0,
  });

  const [guideSearchShow, setGuideSearchShow] = useState<boolean>(false);

  const [collectDataList, setCollectDataList] = useState<{
    keyword: string;
    data: {
      name: string;
      country: string;
      id?: string | number;
      companyId?: string | number;
    }[];
  }>({
    keyword: '',
    data: [],
  });

  const [guideSearchCustoms, guideInfo, style] = useGuideSearch({
    show: guideSearchShow,
    ref: customsSearchInputRef.current?.getInputWrapper?.(),
    from: 'customs',
  });

  const [collectCountry, setCollectCountry] = useState<resCustomsFollowCountry>({
    id: '',
    country: '',
    countryChinese: '',
    code: '',
  });

  const [sensitive, setSensitive] = useState<boolean>(false);

  const [searchHistory, setSearchHistory] = useState<Array<HistoryItem>>([]);

  const [allCountry, setAllCountry] = useState<CountryWithContinent>([]);

  const [updata] = useInterCollectData({
    data: collectDataList.data,
    keywords: collectDataList.keyword,
    origin: '海关数据',
    module: 'wmData',
    pageKeywords: 'customs',
  });

  useEffect(() => {
    setCollectDataList(() => {
      return {
        keyword: '',
        data: [],
      };
    });
  }, [updata]);

  // to: 'buysers'|'supplier' -> 'goodsShipped' 'company' 'hsCode'
  // 获取默认参数,并请求不同的接口
  const tabsCompanyChange = (type: SearchType) => {
    if (type === 'customs') {
    } else {
      if (layoutLen === 1 && !publicSearchValue) {
        setSearchValue('');
      } else if (publicSearchValue) {
        setSearchValue(publicSearchValue);
      }
      searchFilterRef.current?.setFormValues({
        ...defaultInitParams,
        uncontainsExpress: !defaultInitParams.containsExpress,
        countryList: reqBuyParams.countryList,
        timeFilter: reqBuyParams.timeFilter,
        updateTime: dataRecord?.updateTime || '',
      });
      setOriginReCountry([]);
      setReqBuyParams({
        ...defaultInitParams,
        type: customsCategoryType,
        queryValue: publicSearchValue ? publicSearchValue : searchValue,
        currentCompanyType: type,
        countryList: reqBuyParams.countryList,
        timeFilter: reqBuyParams.timeFilter,
        size: pagination.pageSize,
        updateTime: dataRecord?.updateTime || '',
      });
      setPagination({
        ...pagination,
        from: 1,
        total: 0,
      });
      setRequestedParams(undefined);
      setSortOrderParam({ ...defaultSortOrderParam });
    }
    setCompanyType(type);
    // setCustomsCategoryType(type);
  };

  const locationHash = location.hash;

  const [taskId] = useMemo(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    if (!['customs', 'wmData'].includes(moduleName)) {
      return [''];
    }
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.taskId && typeof params.taskId === 'string') {
      return [params.taskId];
    }
    return [''];
  }, [locationHash]);

  useEffect(() => {
    if (taskId) {
      edmCustomsApi
        .doGetGlobalTaskInfo({
          taskId: taskId,
        })
        .then(data => {
          // console.log(data, 'handleCustomsDeep');
          const parseData = JSON.parse(data.context);
          setSearchValue(parseData.queryValue);
          setCustomsCategoryType(parseData.type);
          setCompanyType(data.code === 'CUSTOMS_DEEP_GRUB_BUYERS' ? 'buysers' : 'suppliers');
          let parsedExtInfo: {
            otherGoodsShipped?: string[];
            originReCountry?: Array<string[]>;
          } = {};
          try {
            parsedExtInfo = JSON.parse(parseData.extInfo);
          } catch (error) {}
          data.context &&
            fetchTableList(
              {
                ...parseData,
                from: parseData.from + 1,
                otherGoodsShipped: parsedExtInfo.otherGoodsShipped ? parsedExtInfo.otherGoodsShipped : parseData.otherGoodsShipped,
              },
              data.code === 'CUSTOMS_DEEP_GRUB_BUYERS' ? 'buysers' : 'suppliers'
            );
          searchFilterRef.current?.setFormValues({
            ...defaultInitParams,
            ...transFormParams(parseData, defaultInitParams),
            otherGoodsShipped: parsedExtInfo.otherGoodsShipped,
            relationCountryList: parsedExtInfo.originReCountry ? parsedExtInfo.originReCountry : parseData.originReCountry,
            uncontainsExpress: !parseData.containsExpress,
          });
          // setFormValues 无触发onchange
          parsedExtInfo.originReCountry ? setOriginReCountry(parsedExtInfo.originReCountry) : '';
          layout.length === 1 && setLayout(breadList.slice(0, 2));
        });
    }
  }, [taskId]);

  const transFormParams = (param: any, initParams: Omit<moreRequestParams, 'type' | 'queryValue'>) => {
    // const
    const obj: any = {};
    for (let key in initParams) {
      if (param[key]) {
        obj[key] = param[key];
      }
    }
    return obj;
  };

  const handleChangeExactSearch = (r: boolean) => {
    customsDataTracker.trackSelectClick(CustomsDataSelectClick.precise, r);
    resetExcludeViewedObj();
    setIsExactSearch(r);
    setReqBuyParams(prev => ({
      ...prev,
      ...searchFilterRef.current?.getFormValues(),
      type: customsCategoryType,
      from: 1,
      queryValue: searchValue,
    }));
  };

  useEffect(() => {
    getLocalData();
  }, []);
  const getLocalData = useCallback(() => {
    const { data } = dataStoreApi.getSync(CUSTOMS_DATA_SEARCH_HISTORY, { noneUserRelated: true });
    if (data) {
      try {
        const oldData: any = JSON.parse(data);
        setSearchHistory(Array.isArray(oldData) ? oldData : []);
        return Array.isArray(oldData) ? oldData : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  }, []);
  const addToSearchHistory = useCallback(
    (value: {
      query: string | string[];
      searchType: customSearchType;
      filterParams: FilterParam;
      country: CountryFilterProp[];
      language: CountryFilterProp[];
      time: CountryFilterProp[];
    }) => {
      const { query: queryBody, searchType: curSearchType, filterParams, country } = value;
      const [keyQuery, ...restQuery] = typeof queryBody === 'string' ? [queryBody] : queryBody;
      if (keyQuery.trim().length === 0) {
        return;
      }
      const targetTypeList = [...searchHistory].filter(e => e.searchType === curSearchType);
      const restTypeList = [...searchHistory].filter(e => e.searchType !== curSearchType);
      const keyQueryIndex = targetTypeList.findIndex(historyQuery => {
        const [targetQuery] = typeof historyQuery.query === 'string' ? [historyQuery.query] : historyQuery.query;
        return targetQuery === keyQuery;
      });
      // 没出现过
      if (keyQueryIndex === -1) {
        targetTypeList.unshift(value);
      } else {
        targetTypeList.splice(keyQueryIndex, 1, value);
      }
      const resultList = targetTypeList.slice(0, 7).concat(restTypeList);
      setSearchHistory(resultList);
      dataStoreApi.putSync(CUSTOMS_DATA_SEARCH_HISTORY, JSON.stringify(resultList), {
        noneUserRelated: true,
      });
    },
    [searchHistory]
  );
  useEffect(() => {
    if (customsCategoryType === 'hsCode' && isExactSearch) {
      setIsExactSearch(false);
    }
  }, [customsCategoryType]);

  const fetchData = (value: string, paramsNearSynonymList?: string[], containsExpress?: boolean) => {
    if (value && value.length > 100) {
      message.warn(SEARCH_OVER_100_CHAR);
    } else if (/^\s*$/.test(value) && !reqBuyParams.updateTime) {
      message.warn(NotAllowCustomsSearch);
    } else {
      resetExcludeViewedObj();
      setSuggestOpen(false);
      setHistoryOpen(false);
      if (value) {
        // guideSearchCustoms(value, tabOneValue);
        setReqBuyParams({
          ...omit(reqBuyParams, ['otherCountry']),
          ...searchFilterRef.current?.getFormValues(),
          queryValue: value,
          type: customsCategoryType,
          from: 1,
          size: pagination.pageSize,
          sortBy: '',
          order: '',
          nearSynonymList: paramsNearSynonymList,
          containsExpress: typeof containsExpress === 'undefined' ? searchFilterRef.current?.getFormValues().containsExpress : containsExpress,
        });
        setPagination({
          ...pagination,
          from: 1,
          total: 0,
        });
        setSortOrderParam(defaultSortOrderParam);
        layout.length === 1 && setLayout(breadList.slice(0, 2));
      } else {
        message.warn(NotAllowCustomsSearch);
      }
      customsDataTracker.trackCustomsSearchManaul({
        keyword: searchValue,
        searchType: customsCategoryType,
        isFuzzySearch: !isExactSearch,
        dataType: currentCompanyType === 'buysers' ? 'buyer' : currentCompanyType === 'suppliers' ? 'supplier' : undefined,
      });
    }
  };

  const onBaseSearch = (param: FilterFormData) => {
    if (/^\s*$/.test(searchValue) && !reqBuyParams.updateTime) {
      message.warn(NotAllowCustomsSearch);
    } else if (searchValue && searchValue.length <= 100) {
      resetExcludeViewedObj();
      setReqBuyParams({
        ...omit(reqBuyParams, 'nearSynonymList', 'currentCompanyType'),
        ...param,
        queryValue: searchValue,
        type: customsCategoryType,
        from: 1,
        size: pagination.pageSize,
      });
      setPagination({
        ...pagination,
        from: 1,
        total: 0,
      });
    } else if (searchValue.length > 100) {
      message.warn(SEARCH_OVER_100_CHAR);
    } else {
      message.warn(NotAllowCustomsSearch);
    }
  };

  const handleHscodeData: (params: string) => string = (params: string) => {
    //  return  params && params.length <=2 ? params :
    if (params && params.length <= 2) {
      return params;
    }
    if (params.length % 2 === 0) {
      if (params.slice(-2) == '00') {
        return params.length === 2 ? params : handleHscodeData(params.slice(0, params.length - 2));
      } else {
        return params;
      }
    } else {
      if (params.slice(-1) == '0') {
        return handleHscodeData(params.slice(0, params.length - 1));
      } else {
        return params;
      }
    }
  };

  const layoutLen = layout.length;

  const refresh = () => {
    const currentParams = omit(reqBuyParams, 'currentCompanyType');
    if (currentParams.queryValue || allowEmpty.current || currentParams.updateTime) {
      setRcmdList([]);
      fetchTableList(currentParams, currentCompanyType);
    } else {
      setTableList([]);
      setPagination({
        ...pagination,
        from: 1,
        total: 0,
      });
      setRealTotalCount(0);
    }
    allowEmpty.current = false;
  };

  useEffect(() => {
    if (!isInit && layout.length > 1 && currentCompanyType !== 'customs') {
      refresh();
    }
    isInit && setIsInit(false);
  }, [reqBuyParams, isExactSearch]);

  const replaceText = (queryValue: string, data: string) => {
    const reg = new RegExp(queryValue, 'gi');
    return data.replace(reg, txt => '<em>' + txt + '</em>');
  };
  const initTableBaseData = (res: resBuyers) => {
    const { total, realTotalCount: count } = res;
    setPagination({
      ...pagination,
      total: total && total > 0 ? total : 0,
    });
    setIsMorePage(total >= 10000);
    setRealTotalCount(count);
    setIsLoading(false);
    setTableLoading(false);
  };
  const initTableRecords = (res: resBuyers) => {
    const { records } = res;
    setTableList(records);
    initTableBaseData(res);
  };
  const handleTableData = (queryValue: string, res: resBuyers) => {
    const { records } = res;
    const newRecords = records.map(item => {
      const extra = {
        name: item.companyName,
        topHsCodeStart: item.topHsCode,
        topProductDescStart: item.topProductDesc,
      };
      if (customsCategoryType === 'hsCode') {
        return {
          ...item,
          ...extra,
          topHsCode: replaceText(handleHscodeData(queryValue), item.topHsCode),
        };
      }
      if (customsCategoryType === 'goodsShipped') {
        return {
          ...item,
          ...extra,
          topProductDesc: item.highLight?.value || '',
        };
      }
      if (customsCategoryType === 'company') {
        return {
          ...item,
          ...extra,
          name: item.highLight?.value || '',
        };
      }
      return {
        ...item,
        ...extra,
      };
    });
    setTableList(newRecords);
    initTableBaseData(res);
  };

  const [requestedParams, setRequestedParams] = useState<reqBuyers>();
  const fetchTableList = async (currentParams: moreRequestParams, listType: SearchType) => {
    const { from, queryValue, nearSynonymList: paramsNearSynonymList } = currentParams;
    if (queryValue.length > 100) {
      message.warn(SEARCH_OVER_100_CHAR);
      return;
    } else if (/^\s*$/.test(queryValue) && !currentParams.updateTime) {
      // 空格无效 但存在更新时间时 可通过
      message.warn(NotAllowCustomsSearch);
      return;
    }
    if (!tableLoading) {
      setIsLoading(true);
    }
    const sentryId = errorReportApi.startTransaction({
      name: `${getWmDataSentryKeyPrefix('customs')}${WmDataSentryKey.Search}`,
      op: WmDataSentryOp.Search,
    });
    setPublicSearchValue(currentParams.queryValue);
    // setPublicSearchType(currentParams.type);
    const params: reqBuyers = {
      ...lodashOmit(currentParams, 'nearSynonymList', 'currentCompanyType'),
      from: from - 1,
      groupByCountry: true,
      exactlySearch: isExactSearch,
      queryValue: currentParams.type === 'hsCode' ? handleHscodeData(currentParams.queryValue) : currentParams.queryValue,
      advanceHsCode: currentParams.advanceHsCode ? handleHscodeData(currentParams.advanceHsCode) : currentParams.advanceHsCode,
      async: true,
    };
    if (totalCache.current) {
      params.total = totalCache.current;
      params.realTotalCount = realTotalCount;
    }
    delete params.extInfo;
    setRequestedParams({ ...params, otherGoodsShipped: currentParams.otherGoodsShipped });
    setCompanyType(listType);
    let otherGoodsShipped: string[] = [];
    const lastSearchedValue = searchedValue;
    let nextNearSynonymList: string[];
    // 上次搜索的关键词和这次不一致或者 type 不是Product
    if (lastSearchedValue !== params.queryValue || customsCategoryType !== 'goodsShipped') {
      nextNearSynonymList = [];
    } else {
      nextNearSynonymList = paramsNearSynonymList || checkedNearSynonymList;
    }
    if (forceUseParamNearSynonym.current) {
      nextNearSynonymList = paramsNearSynonymList || [];
      forceUseParamNearSynonym.current = false;
    }
    setCheckedNearSynonymList(nextNearSynonymList);
    if (params.type === 'goodsShipped' && params.otherGoodsShipped && params.otherGoodsShipped.length > 0) {
      try {
        await Promise.all(
          params.otherGoodsShipped.map(toLang => {
            return edmCustomsApi
              .chromeTranslate({
                q: params.queryValue,
                from: 'auto',
                to: toLang,
              })
              .then(r => {
                const result = r.translation && r.translation.length ? r.translation[0] : '';
                return result;
              });
          })
        ).then(transList => {
          otherGoodsShipped = transList;
          setTranslatorsOtherGoodsShipped(otherGoodsShipped);
        });
      } catch (error) {
        setTranslatorsOtherGoodsShipped([]);
      }
    } else {
      setTranslatorsOtherGoodsShipped([]);
    }
    // params.otherGoodsShipped = otherGoodsShipped;
    params.otherGoodsShipped = otherGoodsShipped.concat(nextNearSynonymList);

    setCustomsDeepParams({
      ...params,
      extInfo: JSON.stringify({
        otherGoodsShipped: currentParams.otherGoodsShipped,
        originReCountry,
      }),
    });
    forceUseParamNearSynonym.current = false;
    const listApi = listType === 'suppliers' ? edmCustomsApi.suppliersList : edmCustomsApi.buyersList;
    const asyncListApi = listType === 'suppliers' ? edmCustomsApi.suppliersAsyncList : edmCustomsApi.buyersAsyncList;
    params.startFrom = params.excludeViewed || params.hasEmail ? excludeViewedObj.startFrom : undefined;
    listApi
      .bind(edmCustomsApi)({ ...params, referer: searchSourceRef.current, async: true })
      .then(res => {
        (params.excludeViewed || params.hasEmail) && setExcludeViewedObj({ ...excludeViewedObj, startFrom: res.startFrom });
        if (sensitive) {
          setSensitive(false);
        }
        initTableRecords(res);
        errorReportApi.endTransaction({ id: sentryId });
        if (res.asyncId && res.records.length > 0) {
          setSkeletonLoading(true);
          asyncListApi
            .bind(edmCustomsApi)({ asyncId: res.asyncId })
            .then(data => {
              handleTableData(queryValue, data);
              setSkeletonLoading(false);
              customsDataTracker.trackCustomsSearchResult({
                hasResult: data.records.length > 0,
                keyword: params.queryValue,
                searchType: params.type,
                dataType: listType as any,
              });
            })
            .finally(() => {
              setSkeletonLoading(false);
            });
        } else {
          customsDataTracker.trackCustomsSearchResult({
            hasResult: res.records.length > 0,
            keyword: params.queryValue,
            searchType: params.type,
            dataType: listType as any,
          });
        }
        if (params.queryValue) {
          const insertHisQuery = nextNearSynonymList && nextNearSynonymList.length > 0 ? [params.queryValue, ...nextNearSynonymList] : params.queryValue;
          const insertFilterParam: FilterParam = {
            excludeViewed: params.excludeViewed,
            hasEmail: params.hasEmail,
            containsExpress: !params.containsExpress,
            allMatchQuery: params.exactlySearch,
          };
          Object.keys(insertFilterParam).forEach(item => {
            if (!insertFilterParam[item]) {
              delete insertFilterParam[item];
            }
          });
          addToSearchHistory({
            query: insertHisQuery,
            searchType: params.type,
            filterParams: insertFilterParam,
            language:
              params.type === 'goodsShipped'
                ? defaultOptions
                    .filter(item => currentParams.otherGoodsShipped?.includes(item.to))
                    .map(item => {
                      return {
                        label: item.label,
                        value: item.to,
                      };
                    })
                : [],
            country: params.countryList
              ? params.countryList
                  .map(item => allCountry.find(name => name.name === item))
                  .map(v => {
                    return {
                      label: v?.nameCn as string,
                      value: v?.name as string,
                    };
                  })
              : [],
            time:
              params.timeFilter && timeRangeOptions.find(item => item.value === params.timeFilter)
                ? timeRangeOptions
                    .filter(item => item.value === params.timeFilter)
                    .map(item => {
                      return {
                        label: item.label,
                        value: item.value,
                      };
                    })
                : [],
          });
        }
      })
      .catch(() => {
        setTableList([]);
        setIsLoading(false);
        setTableLoading(false);
        setRequestedParams(undefined);
        setRcmdList([]);
        setGuideSearchShow(false);
        setSensitive(true);
      })
      .finally(() => {
        searchSourceRef.current = 'manual';
        totalCache.current = null;
        setDocSearchCondition(null);
        setSearchedValue(params.queryValue);
      });
    guideSearchCustoms(currentParams.queryValue, currentParams.type);
  };

  const onDrawerClose = (closeIndex: number) => {
    const rec = (currentIndex: number, recData: any) => {
      if (currentIndex === closeIndex) {
        recData.visible = false;
        recData.children && delete recData.children;
      } else {
        const _recData = recData.children;
        rec(currentIndex + 1, _recData);
      }
    };
    rec(0, recData);
    setRecData({ ...recData });
    console.log('_recDataArr-close', recData);
  };
  const onDrawerOpen = (content: recData['content'], zIndex: number) => {
    const rec = (currentIndex: number, recData: recData) => {
      if (recData) {
        if (currentIndex === zIndex) {
          recData.visible = true;
          recData.to = content.to;
          // 注意数据兼容性
          recData.content = {
            ...content,
            reqBuyParams,
            isPreciseSearch: isExactSearch,
            tabOneValue: customsCategoryType,
            queryValue: searchValue,
            otherGoodsShipped: translatorsOtherGoodsShipped,
          };
          if (zIndex === 0 && reqBuyParams.relationCountryList?.length) {
            recData.content.relationCountryList = [...reqBuyParams.relationCountryList];
          }
        } else {
          if (!recData.children) {
            recData.children = {
              visible: false,
              zIndex: currentIndex + 1,
              to: content.to,
              // 注意数据兼容性
              content: {
                ...content,
                reqBuyParams,
                isPreciseSearch: isExactSearch,
                tabOneValue: customsCategoryType,
                queryValue: searchValue,
                otherGoodsShipped: translatorsOtherGoodsShipped,
              },
            };
          }
          rec(currentIndex + 1, recData.children);
        }
      }
    };
    rec(0, recData);
    setRecData({ ...recData });
    console.log('_recDataArr-open', recData);
  };

  const onChangeListItem = (params: { extraData?: any; country?: string; companyName?: string }) => {
    const { extraData, country, companyName } = params;
    setTableList(prev => {
      const targetIt = prev.find(it => it.country === country && it.originCompanyName === companyName);
      if (targetIt) {
        return prev.map(it => {
          if (it.id === targetIt.id) {
            return {
              ...it,
              ...(extraData || {}),
            };
          }
          return it;
        });
      }
      return prev;
    });
  };

  const handleCollectIdChange = (params: { collectId?: string | number | null; country?: string; companyName?: string }) => {
    const { collectId, country, companyName } = params;
    setTableList(prev => {
      const targetIt = prev.find(it => it.country === country && it.companyName === companyName);
      if (targetIt) {
        return prev.map(it => {
          if (it.id === targetIt.id) {
            return {
              ...it,
              collectId,
            };
          } else {
            return it;
          }
        });
      } else {
        return prev;
      }
    });
  };
  const onTableChange = (currentPagination: any, filter?: any, sorter?: any) => {
    const { field = sortOrderParam.sortBy, order } = sorter || sortOrderParam;

    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    // 如果是翻页而且搜索值存在则进行表格loading以及缓存total / 会存在通过首页的更新记录进行搜索 不需要搜索值 预防此时进行翻页发生的问题
    if (currentPagination && searchValue) {
      setTableLoading(true);
      // 如果是翻页，直接缓存total
      totalCache.current = pagination.total;
    }
    let { current = pagination.from, pageSize = pagination.pageSize } = currentPagination || {};
    // 如果是排序 则返回第一页
    if (sorter) {
      current = 1;
      pageSize = 20;
      totalCache.current = null;
    }
    resetExcludeViewedObj();
    setPagination({
      ...pagination,
      from: current as number,
      pageSize: pageSize as number,
    });
    try {
      if (typeof pageSize === 'number') {
        dataStoreApi.putSync(CUSTOMS_LIST, JSON.stringify(pageSize), {
          noneUserRelated: false,
        });
      }
    } catch (error) {}
    setSortOrderParam({
      ...sorterParams,
      order,
    });
    setReqBuyParams({
      ...reqBuyParams,
      ...sorterParams,
      ...searchFilterRef.current?.getFormValues(),
      from: current as number,
      size: pageSize as number,
    });
  };

  const onSamilPageChange = (sorter?: any) => {
    const { field = sortOrderParam.sortBy, order } = sorter || sortOrderParam;

    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    setReqBuyParams({
      ...reqBuyParams,
      ...sorterParams,
      startFrom: excludeViewedObj.startFrom,
    });
  };
  const onCell = (record: DataUpdateRecord, _: number, colName: string) => {
    console.log('onCell-record: ', record);
    allowEmpty.current = true;
    const params: moreRequestParams = {
      ...omit(reqBuyParams, ['currentCompanyType']),
      ...defaultInitParams,
      queryValue: searchValue,
      timeFilter: 'all',
      from: 1,
      size: pagination.pageSize,
      type: 'company',
      updateTime: record.updateTime,
    };
    setPagination({
      ...pagination,
      from: 1,
      total: 0,
    });
    searchFilterRef.current?.setFormValues({
      ...defaultInitParams,
      uncontainsExpress: !defaultInitParams.containsExpress,
      timeFilter: 'all',
      updateTime: record.updateTime,
    });
    setReqBuyParams(params);
    customsDataTracker.trackCustomClickDataUpdateRecord(params.type);

    if (colName !== 'suppliersUpdateCount') {
      setCompanyType('buysers');
    } else {
      setCompanyType('suppliers');
    }
    setLayout(breadList.slice(0, 2));
    setDataRecord({
      ...record,
      formCompany: colName === 'suppliersUpdateCount' ? 'suppliers' : 'buysers',
    });
    setCustomsCategoryType('company');
  };

  const handleNationClick = (nation: resCustomsFollowCountry) => {
    resetExcludeViewedObj();
    allowEmpty.current = true;
    const params: moreRequestParams = {
      ...omit(reqBuyParams, ['currentCompanyType']),
      countryList: [nation.country],
      from: 1,
      size: pagination.pageSize,
      type: customsCategoryType,
      queryValue: searchValue,
    };
    // setCustomsCategoryType('company');
    searchFilterRef.current?.setFormValues({
      ...defaultInitParams,
      countryList: [nation.country],
    });
    setReqBuyParams(params);
    // setCustomsCategoryType('company');
    setCollectCountry(nation);
    setLayout(breadList.slice(0, 2));
  };

  useEffect(() => {
    if (layoutLen === 1) {
      searchFilterRef.current?.setFormValues({
        ...defaultInitParams,
        uncontainsExpress: !defaultInitParams.containsExpress,
      });
      setSearchedValue('');
      setCheckedNearSynonymList([]);
      setGuideSearchShow(false);
      setPagination({
        ...pagination,
        from: 1,
        total: 0,
      });
      setReqBuyParams({
        type: customsCategoryType,
        currentCompanyType,
        queryValue: '',
        ...defaultInitParams,
      });
      setRequestedParams(undefined);
      setRealTotalCount(0);
      setPublicSearchValue('');
      setDataRecord(null);
      setTableList([]);
      setSortOrderParam({ ...defaultSortOrderParam });
      allowEmpty.current = false;
    }
    if (layout.length !== 2) {
      setDataRecord(null);
    }
  }, [layoutLen]);

  useEffect(() => {
    if (guideInfo.show !== guideSearchShow) {
      setGuideSearchShow(guideInfo.show);
    }
  }, [guideInfo.show]);

  const [customsStatCount, customsStatDate] = useCustomsStat(layoutLen === 1);
  const gloababSearchStat = useGlobalSearchStat(layoutLen === 1);

  const getSuggestType = () => {
    switch (customsCategoryType) {
      case 'goodsShipped':
        return 0;
      case 'company':
        if (currentCompanyType === 'buysers') {
          return 1;
        } else if (currentCompanyType === 'suppliers') {
          return 2;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const renderCountUp = useMemoizedFn(() => (
    <MyCountUp prefix={getIn18Text('LEIJIHAIGUANSHUJU')} className={styles.countup} end={customsStatCount} date={customsStatDate} />
  ));

  const resetExcludeViewedObj = () => {
    setExcludeViewedObj({
      excludeViewedIndex: 0,
      excludeViewedList: [0],
      startFrom: 0,
    });
  };

  const guideSearchHandle = () => {
    setCustomsCategoryType(guideInfo.searchType as customsDataType);
    setReqBuyParams({
      ...reqBuyParams,
      type: guideInfo.searchType as customsDataType,
    });
    setGuideSearchShow(false);
  };

  const onSearchChange = useMemoizedFn(value => {
    setCustomsCategoryType(value);
    setTableList([]);
    setSearchValue('');
    setGuideSearchShow(false);
    setPublicSearchValue('');
    setRequestedParams(undefined);
    setRealTotalCount(0);
    setDataRecord(null);
    setCheckedNearSynonymList([]);
    searchFilterRef.current?.setFormValues({
      ...defaultInitParams,
      uncontainsExpress: !defaultInitParams.containsExpress,
    });
    setReqBuyParams({
      type: customsCategoryType,
      currentCompanyType,
      queryValue: '',
      ...defaultInitParams,
    });
    setSearchedValue('');
    setIsExactSearch(false);
    setPagination({
      ...pagination,
      from: 1,
      total: 0,
    });
    allowEmpty.current = false;
    if (value === 'port') {
      setCompanyType('customs');
    }
  });

  useEffect(() => {
    if (isLoading && collectDataList.data.length > 0) {
      globalSearchDataTracker.trackCollectData({
        info: collectDataList.data,
        keywords: collectDataList.keyword,
        count: collectDataList.data.length,
        origin: '海关数据',
        searchType: customsCategoryType,
      });
      setCollectDataList(() => {
        return {
          keyword: '',
          data: [],
        };
      });
    }
  }, [isLoading]);

  useEffect(() => {
    setSwitchOption({
      hasNext: findIdInd() < tableList.length - 1,
      hasLast: findIdInd() > 0,
      onPagTurn: handlePagTurn,
    });
    setTableList(
      tableList.map(e => {
        if (e.id === tableList[findIdInd()].id) {
          return {
            ...e,
            visited: true,
          };
        }
        return e;
      })
    );
  }, [recData.content]);

  const clearHistory = useCallback((st: string) => {
    setSearchHistory(prev => {
      const filteredObj = prev.filter(e => e.searchType !== st);
      try {
        dataStoreApi.putSync(CUSTOMS_DATA_SEARCH_HISTORY, JSON.stringify(filteredObj), { noneUserRelated: true });
      } catch (error) {}
      return filteredObj;
    });
  }, []);
  const dispatch = useAppDispatch();
  const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
    const { videoId, source, scene } = params;
    dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };

  const findIdInd = () => {
    return tableList.findIndex(item => item.companyName === recData.content?.companyName && item.country === recData.content?.country);
  };
  const handlePagTurn = (num: number) => {
    if ((num > 0 && findIdInd() === tableList.length - 1) || (num < 0 && !findIdInd())) return;
    if (num > 0) {
      setRecData({
        ...recData,
        content: {
          ...recData.content,
          companyName: tableList[findIdInd() + 1]?.companyName,
          country: tableList[findIdInd() + 1]?.country,
          visited: tableList[findIdInd() + 1]?.visited,
        },
      });
    } else {
      setRecData({
        ...recData,
        content: {
          ...recData.content,
          companyName: tableList[findIdInd() - 1]?.companyName,
          country: tableList[findIdInd() - 1]?.country,
          visited: tableList[findIdInd() - 1]?.visited,
        },
      });
    }
  };
  return (
    <div
      style={{ minHeight: isWebWmEntry ? 'auto' : '100%' }}
      className={classnames(styles.customsContainer, {
        [styles.customsContainerInit]: layout.length === 1,
        [styles.customsContainerInitCopyright]: layout.length === 1 && currentCompanyType !== 'customs',
      })}
    >
      {/* 表头栏 */}
      {layout.length > 1 && (
        <Breadcrumb className={styles.bread} separator={<SeparatorSvg />}>
          {layout.map((e, index) => (
            <Breadcrumb.Item key={e}>
              <a
                onClick={e => {
                  e.preventDefault();
                  setLayout(breadList.slice(0, index + 1));
                }}
              >
                {e}
              </a>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}
      <div
        className={classnames(styles.customsBody, {
          [styles.customsBodyHeight]: layout.length > 1,
        })}
      >
        <div
          className={classnames(styles.customsMain, {
            [styles.customsBodyWidth]: layout.length > 1,
          })}
        >
          {/* 首页状态下 顶部的“海关数据”标题以及副标题 */}
          {layout.length === 1 && (
            <div className={styles.header}>
              <InfoRoll infos={gloababSearchStat.rollInfos} className={styles.rollinfo} />
              <div className={styles.textWrap}>
                <h3 className={styles.title}>{getIn18Text('HAIGUANSHUJU')}</h3>
                <div className={styles.content}>
                  {tips.map(item => (
                    <span key={item}>
                      <CheckIcon />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {renderCountUp()}
            </div>
          )}
          <div
            style={{ position: 'relative' }}
            className={classnames(styles.dataBody, {
              [styles.dataBodyInit]: layout.length === 1,
            })}
          >
            {/* 搜索栏上方的tab 标签 */}
            {layout.length < 3 && (
              <div className={styles.searchTabWrapper}>
                <SearchTab defaultActiveKey="goodsShipped" tabList={defaultContentTab} onChange={onSearchChange} activeKey={customsCategoryType} />
                {layout.length === 1 && (
                  <div className={styles.tipsBox}>
                    <span
                      className={classnames(styles.showTipsWrapper, styles.showTipsWrapperLight)}
                      onClick={() => onPlayVideo({ videoId: 'V7', source: 'kehufaxian', scene: 'kehufaxian_4' })}
                    >
                      <GuideTipsSvg />
                      <span className={styles.searchTipsText}>如何利用海关数据？</span>
                    </span>
                    <span
                      className={classnames(styles.showTipsWrapper, styles.showTipsWrapperLight)}
                      onClick={() => onPlayVideo({ videoId: 'V26', source: 'kehufaxian', scene: 'kehufaxian_8' })}
                    >
                      <GuideVideoTipsSvg />
                      <span className={styles.searchTipsText}>如何拓展更多客户</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div hidden={customsCategoryType === 'port' || currentCompanyType === 'customs'} style={{ position: 'relative' }}>
              {/* 进出口商的搜索栏 */}
              <CustomsSearch
                searchedValue={searchedValue}
                checkedNearSynonymList={checkedNearSynonymList}
                ref={customsSearchInputRef}
                onFocus={e => {
                  setHistoryOpen(!e.target.value);
                }}
                className={styles.serarchTop}
                placeholder={tabList.filter(item => item.value === customsCategoryType)[0]?.label}
                tabValue={customsCategoryType}
                onSearch={fetchData}
                initLayout={layout.length === 1}
                value={searchValue}
                isExactSearch={isExactSearch}
                onSearchType={handleChangeExactSearch}
                onChangeCurrentValue={(params: string) => {
                  setGuideSearchShow(false);
                  setSearchValue(params);
                  setHistoryOpen(!params);
                  setSuggestOpen(!!params);
                  resetExcludeViewedObj();
                }}
              />
              {guideInfo.show && (
                <GuideSearch
                  content={<span>{guideInfo.searchType === 'hsCode' ? '按HSCode搜索获得更准确的结果' : '按公司搜索获得更准确的结果'}</span>}
                  icon={guideInfo.searchType === 'hsCode' ? <GuideHscode /> : <GuideCompany />}
                  onClose={() => setGuideSearchShow(false)}
                  onGuideSearch={guideSearchHandle}
                  style={{ ...style, height: 32 }}
                  btnText={guideInfo.searchType === 'hsCode' ? '按HSCode搜索' : '按公司搜索'}
                />
              )}
              {/* 进出口商的搜索历史记录栏 */}
              <HistoryDropDown
                open={historyOpen && searchHistory.filter(item => item.searchType === customsCategoryType).length > 0}
                changeOpen={setHistoryOpen}
                blurTarget={customsSearchInputRef.current?.getInputWrapper?.()}
                target={customsSearchInputRef.current?.getSearchWrapper?.()}
                searchList={searchHistory}
                searchType={customsCategoryType}
                subBtnVisible={customsCategoryType === 'goodsShipped' || customsCategoryType === 'hsCode'}
                subType={customsCategoryType === 'hsCode' ? 'hscode' : 'product'}
                onDelete={clearHistory}
                renderExtra={(names?: string[]) => {
                  if (names && names.length > 0) {
                    return <HistroyExtra names={names} />;
                  }
                  return null;
                }}
                onClick={(param, data) => {
                  const [searchValue, ...rest] = typeof param === 'string' ? [param] : param;
                  setHistoryOpen(false);
                  setPublicSearchValue(searchValue);
                  setSearchValue(searchValue);
                  setIsExactSearch(data?.filterParams?.allMatchQuery ?? false);
                  forceUseParamNearSynonym.current = true;
                  searchFilterRef.current?.setFormValues({
                    ...defaultInitParams,
                    uncontainsExpress: data?.filterParams?.containsExpress ? data?.filterParams?.containsExpress : false,
                    excludeViewed: data?.filterParams?.excludeViewed ?? false,
                    hasEmail: data?.filterParams?.hasEmail ?? false,
                    otherGoodsShipped: data?.language ? data?.language?.map(item => item.value) : ['en', 'es'],
                    countryList: data?.country?.map(item => item.value),
                    timeFilter: (data?.time?.map(item => item.value)[0] as customsTimeFilterType) ?? defaultInitParams.timeFilter,
                  });
                  fetchData(searchValue, rest, !data?.filterParams?.containsExpress);
                  resetExcludeViewedObj();
                }}
              />
              <SuggestDropDown
                blurTarget={customsSearchInputRef.current?.getInputWrapper?.()}
                target={customsSearchInputRef.current?.getSearchWrapper?.()}
                type="customs"
                sugguestType={getSuggestType()}
                desc={currentCompanyType === 'buysers' ? getIn18Text('CAIGOUSHANG') : getIn18Text('GONGYINGSHANG')}
                keyword={searchValue}
                open={suggestOpen}
                changeOpen={setSuggestOpen}
                onSelect={kwd => {
                  searchSourceRef.current = 'suggest';
                  setSuggestOpen(false);
                  setPublicSearchValue(kwd);
                  setSearchValue(kwd);
                  fetchData(kwd);
                }}
              />
              <div className={styles.cusCnt} hidden={layout.length <= 1}>
                <div className={styles.cusCntTab}>
                  <Tabs
                    size={'small'}
                    activeKey={currentCompanyType}
                    onChange={value => {
                      tabsCompanyChange(value as SearchType);
                    }}
                  >
                    {tabCompanyType.map(item => (
                      <TabPane tab={item.label} key={item.value} />
                    ))}
                  </Tabs>
                </div>
                {/* 搜索筛选栏 */}
                <div>
                  <SearchFilter
                    query={searchValue}
                    queryType={customsCategoryType}
                    onSearch={onBaseSearch}
                    className={styles.serarchTop}
                    searchType={currentCompanyType}
                    initValue={defaultInitParams}
                    originInitValue={defaultInitParams}
                    ref={searchFilterRef}
                    searchParams={reqBuyParams}
                    originReCountry={value => {
                      resetExcludeViewedObj();
                      setOriginReCountry(value);
                    }}
                    resetExcludeViewedObj={resetExcludeViewedObj}
                    setDataRecord={() => {
                      setDataRecord(null);
                    }}
                    layout={layout}
                  />
                </div>
                {/* 进出口商的搜索筛选栏 表格栏 详情栏 */}
                {/* 表格栏 */}
                <div className={styles.showArea}>
                  <Skeleton active loading={isLoading} paragraph={{ rows: 4 }}>
                    <BuysersTable
                      scence="customs"
                      sticky={{
                        offsetHeader: 106,
                      }}
                      refresh={refresh}
                      searchType={reqBuyParams.type}
                      query={reqBuyParams.queryValue}
                      excludeViewed={reqBuyParams.excludeViewed}
                      hasEmail={reqBuyParams.hasEmail}
                      setExcludeViewedObj={setExcludeViewedObj}
                      excludeViewedObj={excludeViewedObj}
                      tableList={tableList}
                      type={currentCompanyType}
                      onChangeTable={setTableList}
                      sortOrderParam={sortOrderParam}
                      pagination={pagination}
                      onChange={onTableChange}
                      tableLoading={tableLoading}
                      onSamilPageChange={onSamilPageChange}
                      onDrawerOpen={onDrawerOpen}
                      isMorePage={isMorePage}
                      realTotalCount={realTotalCount}
                      locale={{
                        emptyText: (
                          <CustomsSearchEmpty
                            hasRcmd={rcmdList.length > 0}
                            params={requestedParams}
                            deepParams={customsDeepParams}
                            onSearch={res => {
                              setSearchValue(res.queryValue);
                              setReqBuyParams({
                                ...res,
                                type: customsCategoryType,
                                from: 1,
                                size: pagination.pageSize,
                                sortBy: '',
                                order: '',
                              });
                              setPagination({
                                ...pagination,
                                from: 1,
                                total: 0,
                              });
                              setSortOrderParam({ ...defaultSortOrderParam });
                              searchFilterRef.current?.setFormValues({
                                ...res,
                                relationCountryList: originReCountry.length > 0 ? (originReCountry as unknown as string[]) : res.relationCountryList,
                                uncontainsExpress: !res.containsExpress,
                              });
                            }}
                            searchTabType={currentCompanyType}
                            onSwitchSearch={({ type, value }) => {
                              setCompanyType('customs');
                              setDocSearchCondition({
                                type,
                                query: value,
                              });
                            }}
                            originReCountry={originReCountry}
                            sensitive={sensitive}
                          />
                        ),
                      }}
                      skeletonLoading={skeletonLoading}
                      setCollectDataList={(record, keyword) => {
                        if (!collectDataList.data.some(item => item.id === record.id)) {
                          setCollectDataList(prv => {
                            return {
                              ...prv,
                              keyword: keyword ?? '',
                              data: [
                                ...prv.data,
                                {
                                  name: record.name,
                                  country: record.country,
                                  id: record.id,
                                  companyId: '',
                                },
                              ],
                            };
                          });
                        }
                      }}
                    />
                  </Skeleton>
                </div>
                <RcmdRow
                  from="customs"
                  rcmdList={rcmdList}
                  visible={rcmdList.length > 0}
                  className={styles.showContainer}
                  onChoseRcmd={params => {
                    if (params) {
                      setCustomsCategoryType('goodsShipped');
                      setSearchValue(params);
                      // setPublicSearchType('goodsShipped');
                      setPublicSearchValue(params);
                      setSuggestOpen(false);
                      setHistoryOpen(false);
                      setReqBuyParams({
                        ...omit(reqBuyParams, ['otherCountry']),
                        ...searchFilterRef.current?.getFormValues(),
                        queryValue: params,
                        type: 'goodsShipped',
                        from: 1,
                        size: pagination.pageSize,
                        sortBy: '',
                        order: '',
                      });
                      setPagination({
                        ...pagination,
                        from: 1,
                        total: 0,
                      });
                      setSortOrderParam({ ...defaultSortOrderParam });
                    }
                  }}
                />
                {/* 详情栏 */}
                <LevelDrawer
                  recData={recData}
                  onClose={onDrawerClose}
                  onOpen={onDrawerOpen}
                  onCollectIdChange={handleCollectIdChange}
                  onChangeListItem={onChangeListItem}
                  getContainer={detailRootDom || undefined}
                  switchOption={switchOption}
                >
                  <CustomsDetail key={recData?.content.companyName + recData?.content.country} />
                </LevelDrawer>
              </div>
            </div>
            <div hidden={customsCategoryType !== 'port' && currentCompanyType !== 'customs'}>
              <DocSearch
                searchCondition={docSearchCondition}
                onChangeLayout={len => {
                  setLayout(breadList.slice(0, len));
                }}
                layout={layout}
                getInputValue={(type, value) => {
                  setPublicSearchValue(value);
                }}
                checkedNearSynonymList={checkedNearSynonymList}
                getCustomsNearSynonymList={setCheckedNearSynonymList}
                publicSearchValue={publicSearchValue}
                cuurentTabType={currentCompanyType}
                customsCategoryType={customsCategoryType}
                setCusCategory={value => {
                  setCustomsCategoryType(value);
                }}
                tabCompanyType={tabCompanyType}
                setCompanyType={tabsCompanyChange}
                collectCountry={collectCountry}
              />
            </div>
            {/* 首页状态下的 收藏国家栏 数据更新记录栏 版权栏 */}
            {layout.length === 1 && <FollowNation onClick={handleNationClick} setAllCountry={setAllCountry} />}
            {layout.length === 1 && <DataUpdate onCell={onCell} />}
          </div>
        </div>
      </div>
      {layout.length === 1 && (
        <div className={styles.customsContainerHeader}>
          <div className={styles.customsContainerHeaderTrigger}>
            一带一路专题
            <Button size="mini" onClick={() => navigate('#wmData?page=beltRoad')}>
              立即查看
            </Button>
          </div>
          <div className={styles.customsContainerHeaderImg}></div>
        </div>
      )}
    </div>
  );
};
export default Customs;
