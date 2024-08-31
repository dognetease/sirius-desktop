import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
import { Breadcrumb, Checkbox, Skeleton, Tooltip, Empty } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import style from './br.module.scss';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  getIn18Text,
  ICountryMap,
  GlobalSearchItem,
  EdmCustomsApi,
  api,
  DataStoreApi,
  MergeCompany,
  GlobalSearchParamsProp,
  GloablSearchParams,
  SearchReferer,
  IGlobalSearchDeepGrubStat,
  TGloabalSearchType,
} from 'api';
import BrIntro from './components/brIntro';
import BrTab from './components/brTab';
import BrEchar from './components/brEchar';
import { GlobalSearchFilter } from '../globalSearch/search/filters';
import { ImageEmptyNormal } from '../globalSearch/search/EmptyResult/EmptyImge';
import { GlobalSearchFilterItems } from '../globalSearch/search/filterItems';
import GptRcmdList from '../globalSearch/search/GptRcmdList/GptRcmdList';
import HistroyExtra from '../globalSearch/search/HistroyExtra';
import HistoryDropDown from '../globalSearch/search/HistoryDorpDown';
import { ItemProp } from '../globalSearch/search/HistoryDorpDown/SearchHistoryItem';
import { FilterParam } from '../globalSearch/search/search';
import GlobalSearchInput from '../globalSearch/search/SearchInput/GlobalSearchInput';
import { GlobalSearchTableDefault } from '../globalSearch/search/searchTableDemo';
import { globalSearchDataTracker } from '../globalSearch/tracker';
import { FilterValue } from '../globalSearch/search/filters';
import { asyncTaskMessage$ } from '../globalSearch/search/GrubProcess/GrubProcess';
import { ITablePage } from '../globalSearch/search/search';
import Translate from '../components/translate/translate';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { WmBigDataPageLayoutContext } from '../globalSearch/keywordsSubscribe/KeywordsProvider';
import { CompanyDetail } from '../globalSearch/detail/CompanyDetail';
import { isNumber, detailLevels, DetailLevelStatus } from '../globalSearch/search/search';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SEARCH_OVER_100_CHAR } from '../CustomsData/customs/constant';
import { useCustomsCountryHook } from '../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { globalSearchApi } from '../globalSearch/constants';
import useLangOption from '../CustomsData/customs/search/useLangOption';
import { ReactComponent as QuestionIcon } from '@/images/icons/customs/question.svg';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { useMemoizedFn } from 'ahooks';
export interface Prop extends React.HTMLAttributes<HTMLDivElement> {}

export interface LangOptionsProp {
  label?: string;
  to?: string;
  gptValue?: string;
  labelDisplay?: string;
  value: string | number;
}

export const initFilterItemsValue = {
  filterVisited: false,
  hasMail: false,
  notLogisticsCompany: false,
  hasCustomData: false,
  filterEdm: false,
  filterCustomer: false,
  hasWebsite: false,
  excludeValueList: undefined,
  otherGoodsShipped: [],
};

export interface CountryFilterProp {
  label: string;
  value: string;
}

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const BR_SEARCH_LIST = 'BR_SEARCH_LIST';
const eventApi = api.getEventApi();
const BR_HISTORY_KEY = 'BR_HISTORY_V2';
const introList = ['1000万企业名录', '380万采购商', '14亿交易记录'];

const BR: React.FC = () => {
  const [initLayout, setInitLayout] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  // 默认国家
  const [chartCountry, setChartCountry] = useState<
    | {
        key: string;
        value: string;
      }
    | undefined
  >(undefined);
  const [checkedNearSynonymList, setCheckedNearSynonymList] = useState<string[]>([]);

  const [isPreciseSearch, setIsPreciseSearch] = useState<boolean>(false);

  const [countryMap, setCountryMap] = useState<ICountryMap>({});
  const [resetFilterToken, setResetFilterToken] = useState<string | number>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [filterItemsValue, setFilterItemsValue] = useState<FilterParam>(initFilterItemsValue);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Array<GlobalSearchItem>>([]);
  const [recommendShowName, setRecommendShowName] = useState<string | undefined>('');
  const [detailId, setDetailId] = useState<string>('');
  const [detailData, setDetailData] = useState<GlobalSearchItem>();
  const [showDetail, setShowDetail] = useState<boolean>(false);
  // 有道翻译部分
  const [translateValue, setTranslateValue] = useState('');
  const [translateStyle, setTranslateStyle] = useState<React.CSSProperties>({});
  const [displayTranslateWidth, setDisplayTranslateWidth] = useState<number>(0);

  const [reloadDetailToken, setReloadDetailToken] = useState(Date.now());
  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<
    Array<{ query: string | string[]; searchType: TGloabalSearchType; filterParams: FilterParam; country: CountryFilterProp[] }>
  >(() => {
    const { data } = dataStoreApi.getSync(BR_HISTORY_KEY, { noneUserRelated: true });
    if (data) {
      try {
        const oldData = JSON.parse(data);
        if (Array.isArray(oldData)) {
          return oldData.map(e => {
            if (typeof e === 'string' || Array.isArray(e)) {
              return {
                query: e,
                searchType: 'product',
              };
            }
            return e;
          });
        }
        return [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [realTotalCount, setRealTotalCount] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortField, setSortField] = useState<string | undefined>('default');
  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);
  const searchSourceRef = useRef<SearchReferer>('manual');
  const [searchedParams, setSearchedParams] = useState<Partial<GloablSearchParams>>();
  const [pageConfig, setPageConfig] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: 10,
  });
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
  const [selectedCountry, setSelectedCountry] = useState<
    {
      label: string;
      name: string;
    }[]
  >([]);
  const [_con, newAllCountry] = useCustomsCountryHook(true);
  const langOptions = useLangOption(query, true, [
    {
      label: '阿拉伯语',
      to: 'ar',
      gptValue: '阿拉伯语',
    },
    {
      label: '德语',
      to: 'de',
      gptValue: '德语',
    },
  ]);
  const filterRef = useRef<FilterValue>({});
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  const searchTranslatedVal = () => {
    setQuery(translateValue);
    setDisplayTranslateWidth(0);
    doSearch({
      value: translateValue,
    });
  };
  const searchedValue =
    searchedParams && searchedParams.searchType ? (searchedParams.searchType === 'company' ? searchedParams.name : searchedParams[searchedParams.searchType]) : undefined;

  const formatTranslateValue = useMemo(() => (translateValue.length > 30 ? `${translateValue.slice(0, 30)}...` : translateValue), [translateValue]);

  const searchSuffix = () => {
    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 0,
            height: 28,
            borderRight: '1px solid #F0F3F5',
            marginRight: 16,
          }}
        />
        <Checkbox
          className={style.preciseSearch}
          checked={isPreciseSearch}
          onChange={e => {
            setIsPreciseSearch(e.target.checked);
            if (!initLayout) {
              doSearch({
                value: query,
                allMatchQuery: e.target.checked,
              });
            }
          }}
        >
          {getIn18Text('JINGQUE')}
        </Checkbox>
        <Tooltip title={<span>勾选后，搜索结果将完全匹配搜索词中的全部关键词。</span>}>
          <QuestionIcon />
        </Tooltip>
      </span>
    );
  };
  const SearchInput = (
    <>
      <GlobalSearchInput
        checkedRcmdList={checkedNearSynonymList}
        onRemoveRcmd={name => {
          const nextList = checkedNearSynonymList.filter(e => e !== name);
          doSearch({ value: query, nearSynonymList: nextList });
        }}
        ref={searchInputRef}
        type="text"
        onFocus={() => {
          setSearchHistoryOpen(true);
        }}
        className={classnames(style.searchInput, {
          [style.searchInputInit]: initLayout,
        })}
        value={query}
        placeholder={'请输入关键词'}
        onChange={e => {
          setQuery(e.target.value);
        }}
        onSearch={text => {
          handleSearch(text);
          // if (initLayout) {
          //   setInitLayout(false);
          // }
          // doSearch({
          //   value: text,
          // });
        }}
        enterButton={getIn18Text('SOUSUO')}
        prefix={<SearchGlobalIcon />}
        suffix={searchSuffix()}
      />
      {!initLayout && searchedValue && (
        <GptRcmdList
          searchedValue={searchedValue}
          checkedRcmdList={checkedNearSynonymList}
          onCheckRmcd={(list, dosearch) => {
            dosearch && doSearch({ value: query, nearSynonymList: list });
          }}
        />
      )}
      {displayTranslateWidth > 0 && !initLayout && (
        <Translate
          content={
            <span>
              {getIn18Text('FANYICHENG\u201C')}
              {formatTranslateValue}
              {getIn18Text('\u201DYIHUOQUGENGZHUNQUEDEJIEGUO')}
            </span>
          }
          onClose={() => setDisplayTranslateWidth(0)}
          onTranslate={searchTranslatedVal}
          style={{ ...translateStyle, height: 32 }}
        />
      )}
    </>
  );

  useEffect(() => {
    if (searchLoading && collectDataList.data.length > 0) {
      globalSearchDataTracker.trackCollectData({
        info: collectDataList.data,
        keywords: collectDataList.keyword,
        count: collectDataList.data.length,
        origin: '一带一路',
        searchType: 'product',
      });
      setCollectDataList(prv => {
        return {
          keyword: '',
          data: [],
        };
      });
    }
  }, [searchLoading]);
  useEffect(() => {
    if (searchedParams?.product) {
      setQuery(searchedParams?.product);
    }
  }, [searchedParams?.product]);
  // 用这个来更新effect内部的list
  const listUniqueId = searchResult.map(e => e.id).join('');
  useEffect(() => {
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        console.log(`listUniqueId`, listUniqueId);
        if (event?.eventData?.type === 'contact' && event.eventData.data) {
          // debugger
          const { id, newEmails, newPhones, status } = event.eventData.data as IGlobalSearchDeepGrubStat;
          const resultItem = searchResult.find(it => it.id === id);
          if (resultItem) {
            setSearchResult(preState =>
              preState.map(each => {
                if (each.id === id) {
                  const prevAllContactCount = each.contactCount * 1;
                  let addedCount = 0;
                  if (newEmails && newEmails.length > 0) {
                    each.emailCount += newEmails.length;
                    each.defaultEmail = newEmails[0];
                    each.defaultEmailNew = true;
                    addedCount += newEmails.length;
                  }
                  if (newPhones && newPhones.length > 0) {
                    each.phoneCount += newPhones.length;
                    each.defaultPhone = newPhones[0];
                    each.defaultPhoneNew = true;
                    addedCount += newPhones.length;
                  }
                  return {
                    ...each,
                    grubStatus: status,
                    prevContactCount: prevAllContactCount,
                    contactCount: each.contactCount + addedCount,
                  };
                }
                return each;
              })
            );
          }
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('globalSearchGrubTaskFinish', eventID);
    };
  }, [listUniqueId]);

  const resetFilterOptions = () => {
    setSortField('default');
    filterRef.current = {};
  };

  useEffect(() => {
    if (initLayout) {
      // 返回首页重置筛选项
      setFilterItemsValue(initFilterItemsValue);
      setShowInput(false);
    }
  }, [initLayout]);

  const hasChinese = (str: String): boolean => {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 255) {
        return true;
      }
    }
    return false;
  };

  const calculateTextWidth = (str: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 50;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.font = '14px 苹方-简,sans-serif';
    ctx.textBaseline = 'top';
    return ctx.measureText(str).width;
  };

  const getTranslatedVal = (origin: string) =>
    edmCustomsApi
      .customsTranslate({
        q: origin,
        from: 'auto',
        to: 'en',
      })
      .then(res => {
        if (res.translation && res.translation.length) {
          return res.translation[0];
        }
        throw new Error('translate error');
      });

  const translate = (origin: string): void => {
    if (!hasChinese(origin)) {
      return;
    }
    getTranslatedVal(origin)
      .then(translated => {
        setTranslateValue(translated);
        const textWidth = calculateTextWidth(origin);
        setDisplayTranslateWidth(textWidth);
      })
      .catch(err => console.log(err));
  };

  const clearHistory = useCallback((st: string) => {
    setSearchHistory(prev => {
      const filteredObj = prev.filter(e => e.searchType !== st);
      try {
        dataStoreApi.putSync(BR_HISTORY_KEY, JSON.stringify(filteredObj), { noneUserRelated: true });
      } catch (error) {}
      return filteredObj;
    });
  }, []);

  const hanldeFilterChange = (filters: FilterValue) => {
    filterRef.current = filters;
    setCountryMap({});
    doSearch({
      value: query,
    });
  };

  const toggleFilter = (name: string, bl: boolean | string | string[], noReq?: string) => {
    setFilterItemsValue({
      ...filterItemsValue,
      [name]: bl,
    });
    if (!initLayout && !noReq) {
      doSearch({
        value: query,
        [name]: bl,
      });
    }
  };

  const clickHistoryItem = (param: string | string[], data?: ItemProp) => {
    const [queryValue, ...rest] = typeof param === 'string' ? [param] : param;
    setQuery(queryValue);
    if (!displayTranslateWidth) {
      translate(queryValue);
    }
    setResetFilterToken(Date.now());
    filterRef.current = {};
    const historyFilterParam = {
      value: queryValue,
      filterEdm: data?.filterParams?.filterEdm ?? false,
      filterCustomer: data?.filterParams?.filterCustomer ?? false,
      hasMail: data?.filterParams?.hasMail ?? false,
      filterVisited: data?.filterParams?.filterVisited ?? false,
      notLogisticsCompany: data?.filterParams?.notLogisticsCompany ?? false,
      hasCustomData: data?.filterParams?.hasCustomData ?? false,
      hasWebsite: data?.filterParams?.hasWebsite ?? false,
      country: data?.country?.map(item => item.value) ?? [],
      allMatchQuery: data?.filterParams?.allMatchQuery ?? false,
      otherGoodsShipped: data?.language && data?.language.length > 0 ? data?.language.map(item => item.value) : [],
      excludeValueList: data?.excludeValueList,
    };
    handleFilterOption({
      excludeValueList: data?.excludeValueList,
      otherGoodsShipped: data?.language && data?.language.length > 0 ? data?.language.map(item => item.value) : [],
      ...data?.filterParams,
    });
    if ((data?.language && data?.language.length > 0) || data?.excludeValueList) {
      setShowInput(true);
    }
    handleFilterOtherOption(data);
    if (!rest || rest.length === 0) {
      doSearch({
        ...historyFilterParam,
      });
    } else {
      doSearch({
        nearSynonymList: rest,
        forceSetNearSynonymList: true,
        ...historyFilterParam,
      });
    }
    setSearchHistoryOpen(false);
  };

  const handleFilterOtherOption = useMemoizedFn((data?: ItemProp) => {
    setSelectedCountry(
      data?.country && data?.country.length > 0
        ? data.country.map(item => {
            return {
              label: item.label,
              name: item.value,
            };
          })
        : []
    );
    filterRef.current = {
      country: data?.country?.map(item => item.value) || [],
    };
  });

  const handleFilterOption = useCallback((data?: FilterParam) => {
    setFilterItemsValue({
      filterEdm: data?.filterEdm ?? false,
      filterCustomer: data?.filterCustomer ?? false,
      hasMail: data?.hasMail ?? false,
      filterVisited: data?.filterVisited ?? false,
      notLogisticsCompany: data?.notLogisticsCompany ?? false,
      hasCustomData: data?.hasCustomData ?? false,
      hasWebsite: data?.hasWebsite ?? false,
      excludeValueList: data?.excludeValueList ?? undefined,
      otherGoodsShipped: data?.otherGoodsShipped ?? [],
    });
    setIsPreciseSearch(data?.allMatchQuery ?? false);
  }, []);

  const handleRenderExtra = (names?: string[]) => {
    if (names && names.length > 0) {
      return <HistroyExtra names={names} />;
    }
    return null;
  };

  const handleTranslate = async (params: { value: string; type?: TGloabalSearchType; language?: string[] }) => {
    if (params.type && params.type === 'product' && params.language && params.language.length > 0) {
      try {
        let list = [];
        list = await Promise.all(
          params.language.map(toLang => {
            return edmCustomsApi
              .chromeTranslate({
                q: params.value,
                from: 'auto',
                to: toLang,
              })
              .then(r => {
                const result = r.translation && r.translation.length ? r.translation[0] : '';
                return result;
              })
              .finally(() => {
                return [];
              });
          })
        )
          .then(transList => {
            return transList;
          })
          .catch(() => {
            return [];
          })
          .finally(() => {
            return [];
          });
        return list;
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  };

  const handleHscodeData: (params: string) => string = (params: string) => {
    if (params && params.length <= 2) {
      return params;
    }
    if (params && params.length % 2 === 0) {
      if (params.slice(-2) == '00') {
        return params.length === 2 ? params : handleHscodeData(params.slice(0, params.length - 2));
      } else {
        return params;
      }
    } else {
      if (params && params.slice(-1) == '0') {
        return handleHscodeData(params.slice(0, params.length - 1));
      } else {
        return params;
      }
    }
  };

  const addToSearchHistory = useCallback(
    (value: {
      query: string | string[];
      searchType: TGloabalSearchType;
      filterParams: FilterParam;
      country: CountryFilterProp[];
      language: CountryFilterProp[];
      excludeValueList?: string;
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
      console.log(resultList, 'resultList');
      setSearchHistory(resultList);
      dataStoreApi.putSync(BR_HISTORY_KEY, JSON.stringify(resultList), {
        noneUserRelated: true,
      });
    },
    [searchHistory]
  );

  const resetFilter = () => {
    setFilterItemsValue(initFilterItemsValue);
    if (!initLayout) {
      doSearch({
        value: query,
        ...initFilterItemsValue,
      });
    }
  };

  const renderHistoryRecord = () => (
    <>
      <HistoryDropDown
        target={searchInputRef.current?.parentElement}
        open={searchHistoryOpen && !query && searchHistory.filter(e => e.searchType === 'product').length > 0}
        changeOpen={setSearchHistoryOpen}
        searchList={searchHistory}
        onDelete={clearHistory}
        onClick={(name, data) => {
          clickHistoryItem(name, data);
        }}
        renderExtra={handleRenderExtra}
        searchType={'product'}
        subBtnVisible={true}
        autoDetectSubType
      />
    </>
  );

  useEffect(() => {
    if (displayTranslateWidth > 0 && searchInputRef.current) {
      const { offsetLeft, offsetTop, offsetHeight } = searchInputRef.current;
      const positionLeft = (displayTranslateWidth > 0 ? displayTranslateWidth : 0) + 15;
      if (offsetTop <= 0) return;
      if (positionLeft > 300) {
        setTranslateStyle({
          left: offsetLeft,
          top: offsetTop + offsetHeight,
        });
      } else {
        setTranslateStyle({
          left: positionLeft + offsetLeft,
          top: offsetTop,
        });
      }
    }
  }, [displayTranslateWidth, searchInputRef.current?.offsetLeft, searchInputRef.current?.offsetTop, searchInputRef.current?.offsetHeight]);

  useEffect(() => {
    setDisplayTranslateWidth(0);
  }, [query]);

  const doSearch = async (params: GlobalSearchParamsProp, onlyTableLoading?: boolean) => {
    if (params.value.length > 100) {
      return SiriusMessage.warn({
        content: SEARCH_OVER_100_CHAR,
      });
    }
    globalSearchDataTracker.trackBrDoSearch(params.value, 'product', true);
    const {
      type = 'product',
      pageSize = pageConfig.pageSize,
      value,
      page = 1,
      from = '',
      createTime,
      allMatchQuery,
      forceSetNearSynonymList,
      hasMail: paramHasEmail,
      filterVisited: paramFilterVisited,
      notLogisticsCompany: paramNotLogisticsCompany,
      hasCustomData: paramHasCustomData,
      hasWebsite: paramHasWebsite,
      filterEdm: paramFilterEdm,
      filterCustomer: paramFilterCustomer,
      excludeValueList: paramExcludeValueList,
      sortField: paramsSortField,
      nearSynonymList: paramsNearSynonymList,
      country,
    } = params;
    setInitLayout(false);
    if (onlyTableLoading) {
      setTableLoading(true);
    } else {
      setSearchLoading(true);
    }
    if (from !== 'pageChange') {
      // (query + "+" + list.join('|'))
      let str;
      if (paramsNearSynonymList && paramsNearSynonymList.length > 0) {
        value ? (str = value + '+' + paramsNearSynonymList.join('|')) : (str = query + '+' + paramsNearSynonymList.join('|'));
      } else {
        str = value || query;
      }
    }
    let keyName: string = type;
    if (keyName === 'company') {
      keyName = 'name';
    }
    const lastSearchedValue = searchedValue;
    let nextNearSynonymList: string[];
    if (lastSearchedValue !== (value || query) || type !== 'product') {
      nextNearSynonymList = [];
    } else {
      nextNearSynonymList = paramsNearSynonymList || checkedNearSynonymList;
    }
    if (forceSetNearSynonymList) {
      nextNearSynonymList = paramsNearSynonymList || [];
    }
    const searchParam: GloablSearchParams = {
      searchType: type,
      [keyName]: value === undefined ? (/^\d+$/.test(query) ? handleHscodeData(query) : query) : /^\d+$/.test(value) ? handleHscodeData(value) : value,
      page,
      hasEmail: 'hasMail' in params ? paramHasEmail : filterItemsValue?.hasMail,
      allMatchQuery: 'allMatchQuery' in params ? allMatchQuery : isPreciseSearch,
      hasBrowsed: 'filterVisited' in params ? paramFilterVisited : filterItemsValue?.filterVisited,
      size: pageSize,
      excludeExpressCompany: 'notLogisticsCompany' in params ? paramNotLogisticsCompany : filterItemsValue?.notLogisticsCompany,
      hasCustomsData: 'hasCustomData' in params ? paramHasCustomData : filterItemsValue?.hasCustomData,
      hasDomain: 'hasWebsite' in params ? paramHasWebsite : filterItemsValue?.hasWebsite,
      filterEdm: 'filterEdm' in params ? paramFilterEdm : filterItemsValue?.filterEdm,
      filterCustomer: 'filterCustomer' in params ? paramFilterCustomer : filterItemsValue?.filterCustomer,
      excludeValueList: 'excludeValueList' in params ? [paramExcludeValueList || ''] : [filterItemsValue?.excludeValueList || ''],
      sortField: 'sortField' in params ? paramsSortField : sortField || 'default',
      nearSynonymList: nextNearSynonymList,
      referer: searchSourceRef.current,
      ...filterRef.current,
    };
    country ? (searchParam.country = country) : '';
    setCheckedNearSynonymList(nextNearSynonymList);
    // if (createTime) {
    //   const createTimeNum = new Date(createTime).getTime();
    //   if (!isNaN(createTimeNum)) {
    //     searchParam.createTime = createTimeNum;
    //   }
    // }
    setSearchedParams(searchParam);
    const insertHisQuery = searchParam.nearSynonymList ? [value || query, ...searchParam.nearSynonymList] : value || query;
    const insertFilterParam: FilterParam = {
      filterVisited: searchParam.hasBrowsed ?? false,
      hasMail: searchParam.hasEmail ?? false,
      hasWebsite: searchParam.hasDomain ?? false,
      hasCustomData: searchParam.hasCustomsData ?? false,
      notLogisticsCompany: searchParam.excludeExpressCompany ?? false,
      filterEdm: searchParam.filterEdm ?? false,
      filterCustomer: searchParam.filterCustomer ?? false,
      allMatchQuery: searchParam.allMatchQuery ?? false,
    };
    searchParam.otherLanguages = await handleTranslate({
      type: searchParam.searchType,
      value: value || query,
      language: params.otherGoodsShipped || filterItemsValue?.otherGoodsShipped || [],
    });
    Object.keys(insertFilterParam).forEach(item => {
      if (!insertFilterParam[item]) {
        delete insertFilterParam[item];
      }
    });
    addToSearchHistory({
      query: insertHisQuery,
      searchType: type,
      filterParams: insertFilterParam,
      country: searchParam.country
        ? searchParam.country
            .map(item => newAllCountry.find(name => name.name === item))
            .map(v => {
              return {
                label: v?.nameCn as string,
                value: v?.name as string,
              };
            })
        : [],
      language:
        searchParam.searchType === 'product'
          ? langOptions
              .filter(item => {
                if (params.otherGoodsShipped) {
                  return params.otherGoodsShipped.includes(item.value);
                } else {
                  return filterItemsValue?.otherGoodsShipped?.includes(item.value);
                }
              })
              .map(item => {
                return {
                  label: item.label,
                  value: item.value,
                };
              })
          : [],
      excludeValueList: searchParam?.excludeValueList ? searchParam?.excludeValueList[0] : undefined,
    });
    return globalSearchApi
      .getBrSearchResult({
        ...searchParam,
      })
      .then(res => {
        setPageConfig({
          pageSize: searchParam.size,
          total: res.pageableResult.total,
          current: page,
        });
        setSearchResult(res.pageableResult.data || []);
        setRealTotalCount(res.realTotalCount || 0);
        if (from !== 'pageChange') {
          globalSearchDataTracker.trackSearchResult(!!res.pageableResult.data && res.pageableResult.data.length > 0, query);
        }
        if (res.queryInfoBO) {
          if (res.queryInfoBO.countryBOMap) {
            setCountryMap(res.queryInfoBO.countryBOMap);
          } else {
            setCountryMap({});
          }
        } else {
          setCountryMap({});
        }
      })
      .catch(() => {
        setSearchResult([]);
        setPageConfig({
          total: 0,
          current: 1,
          pageSize: pageConfig.pageSize,
        });
        setDisplayTranslateWidth(0);
      })
      .finally(() => {
        setTableLoading(false);
        setSearchLoading(false);
        searchSourceRef.current = 'manual';
      });
  };

  const handleSearch = (query: string, createTime?: string) => {
    // 翻译
    if (!displayTranslateWidth) {
      translate(query);
    }
    sortField === 'default' ? '' : setSortField('default');
    filterRef.current = {};
    doSearch({
      value: query,
      createTime,
      sortField: 'default',
    });
    setResetFilterToken(Date.now());
  };

  const handleDeepSearch = (id: string) => {
    const processItem = searchResult.find(e => e.id === id && e.grubStatus === 'NOT_GRUBBING');
    asyncTaskMessage$.next({
      eventName: 'globalSearchGrubTaskAdd',
      eventData: {
        type: 'contact',
        data: processItem,
      },
    });
  };

  const onTableChange = (tablePage: ITablePage) => {
    setPageConfig({
      current: tablePage.current || 1,
      total: tablePage.total,
      pageSize: tablePage.pageSize,
    });
    try {
      if (typeof tablePage.pageSize === 'number') {
        dataStoreApi.putSync(BR_SEARCH_LIST, JSON.stringify(tablePage.pageSize), {
          noneUserRelated: false,
        });
      }
    } catch (error) {}
    doSearch(
      {
        value: query,
        page: tablePage.current,
        pageSize: tablePage.pageSize,
        from: 'pageChange',
      },
      true
    );
  };

  const showDetailPage = (id: string, from?: string, recommendShowName?: string) => {
    setSearchResult(prev =>
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            browsed: true,
          };
        }
        return e;
      })
    );
    setRecommendShowName(recommendShowName);
    setDetailId(id);
    setDetailData(searchResult.find(item => item.id === id));
    setShowDetail(true);
    setReloadDetailToken(Date.now());
  };

  const toggleSortFiled = (param: string | undefined) => {
    setSortField(param);
    if (!initLayout) {
      doSearch({
        value: query,
        sortField: param,
      });
    }
  };

  const handleToggleSub = (id: string | number, cId?: string | number) => {
    setSearchResult(prev =>
      prev.map(it => {
        if (it.id === id) {
          return {
            ...it,
            collectId: cId,
          };
        }
        return {
          ...it,
        };
      })
    );
  };

  const onChangeListItem = (id: string | number, extraData: any) => {
    setSearchResult(prev =>
      prev.map(it => {
        if (it.id === id) {
          return {
            ...it,
            ...extraData,
          };
        }
        return it;
      })
    );
  };

  const handleToggleCompanySub = (cId: string, colId?: string | number) => {
    setSearchResult(prev =>
      prev.map(it => {
        let mergeCompanys: MergeCompany[] | null = null;
        if (it.companyId === cId) {
          return {
            ...it,
            collectId: colId,
          };
        }
        if (it.mergeCompanys) {
          mergeCompanys = it.mergeCompanys.map(cp => {
            if (cp.companyId === cId) {
              return {
                ...cp,
                collectId: colId || null,
              };
            }
            return cp;
          });
        }
        return {
          ...it,
          mergeCompanys,
        };
      })
    );
  };

  return (
    <div
      className={classnames(style.container, {
        [style.containerList]: !initLayout,
      })}
    >
      {initLayout && (
        <>
          <div className={style.containerInner}>
            <div className={style.header}>
              <h1>一带一路专题</h1>
              <BrIntro list={introList} />
              <div style={{ position: 'relative', margin: '32px 0 20px' }}>{SearchInput}</div>
              {renderHistoryRecord()}
            </div>
          </div>
          <div className={style.containerEchar}>
            <div className={style.indexContent}>
              <BrTab setSelectCountry={setChartCountry} />
              <Skeleton loading={!chartCountry?.value} active>
                <BrEchar country={chartCountry?.key ?? ''} countryCn={chartCountry?.value ?? ''} />
              </Skeleton>
            </div>
          </div>
        </>
      )}
      {!initLayout && (
        <>
          <Breadcrumb className={style.bread} separator={<SeparatorSvg />}>
            <Breadcrumb.Item>
              <a
                href="javascript:void(0)"
                onClick={e => {
                  e.preventDefault();
                  resetFilterOptions();
                  setInitLayout(true);
                  setChartCountry(undefined);
                }}
              >
                <span>一带一路</span>
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span>{getIn18Text('SOUSUOJIEGUO')}</span>
            </Breadcrumb.Item>
          </Breadcrumb>
          <div className={style.searchResult}>
            <>
              <div className={style.searchInputWrapper}>
                <div style={{ width: '100%' }} className={style.brResutl}>
                  {SearchInput}
                </div>
              </div>
              {renderHistoryRecord()}
            </>
            <div className={style.filterWrapper}>
              <GlobalSearchFilter
                clearSelectedCountry={setSelectedCountry}
                selectedCountryList={selectedCountry}
                countryMap={countryMap}
                onChange={hanldeFilterChange}
                resetToken={resetFilterToken}
              />
              <GlobalSearchFilterItems
                resetFilter={resetFilter}
                showInput={showInput}
                searchType={'product'}
                filterItemsValue={filterItemsValue}
                toggleFilter={toggleFilter}
                setShowInput={setShowInput}
                langOptions={langOptions}
                searchLoading={searchLoading}
              />
            </div>
            <div className={style.resultContainer}>
              <Skeleton loading={searchLoading} active>
                <GlobalSearchTableDefault
                  enableMoreDataSelect={true}
                  searchedParams={searchedParams}
                  sticky={{ offsetHeader: 106 }}
                  showSubscribe
                  onDeepSearch={handleDeepSearch}
                  query={query}
                  data={searchResult}
                  onTableChange={onTableChange}
                  checkedRcmdList={checkedNearSynonymList}
                  tableType={'product'}
                  page={pageConfig}
                  onGotoDetail={showDetailPage}
                  realTotalCount={realTotalCount}
                  loading={tableLoading}
                  hideSearchResultTips={displayTranslateWidth > 0}
                  sortField={sortField}
                  onChangeSelect={value => {
                    globalSearchDataTracker.trackEmailSort(value === 'default' ? 'general' : 'updateTime');
                    toggleSortFiled(value);
                  }}
                  locale={{
                    emptyText: () => <Empty className={style.empty} description="暂无数据，建议更换搜索词" image={<ImageEmptyNormal />}></Empty>,
                  }}
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
                              companyId: record.companyId,
                            },
                          ],
                        };
                      });
                    }
                  }}
                  scene={'br'}
                />
              </Skeleton>
            </div>
            <Drawer
              visible={showDetail}
              onClose={() => {
                setShowDetail(false);
              }}
              width={872}
              zIndex={10}
              getContainer={detailRootDom || document.body}
            >
              {showDetail ? (
                <CompanyDetail
                  origin={'global'}
                  queryGoodsShipped={!isNumber(query) ? query : ''}
                  queryHsCode={isNumber(query) ? query : ''}
                  showSubscribe
                  id={detailId}
                  scene={'br'}
                  outerDetail={detailData as any}
                  recommendShowName={recommendShowName}
                  reloadToken={reloadDetailToken}
                  onToggleSub={handleToggleSub}
                  onChangeListItem={onChangeListItem}
                  onToggleMergeCompanySub={handleToggleCompanySub}
                  showNextDetail={id => {
                    setNextDetailLevels(prev => {
                      const [_first, ...rest] = prev;
                      return [{ open: true, id }, ...rest];
                    });
                  }}
                  setShowDetailClose={() => {
                    setShowDetail(false);
                  }}
                  extraParams={{ keyword: query }}
                />
              ) : null}
            </Drawer>
            {nextDetailLevels.map((level, index) => (
              <Drawer
                key={index}
                visible={level.open}
                zIndex={11 + index}
                getContainer={detailRootDom || document.body}
                onClose={() => {
                  // setDetailGrubTaskId(undefined);
                  setNextDetailLevels(prev => {
                    return prev.map((e, jndex) => {
                      if (index === jndex) {
                        return {
                          open: false,
                        };
                      } else {
                        return e;
                      }
                    });
                  });
                }}
                width={872}
                destroyOnClose
              >
                {level.open && !!level.id && (
                  <CompanyDetail
                    showSubscribe
                    id={level.id}
                    // onDeepSearchContact={(_, data) => {
                    //   if (data) {
                    //     setDetailGrubTaskId(data)
                    //   }
                    // }}
                    origin={'global'}
                    scene={'br'}
                    reloadToken={0}
                    showNextDetail={id => {
                      if (index < nextDetailLevels.length - 1) {
                        setNextDetailLevels(prev => {
                          return prev.map((e, jndex) => {
                            if (index + 1 === jndex) {
                              return {
                                id,
                                open: true,
                              };
                            } else {
                              return e;
                            }
                          });
                        });
                      } else {
                        SiriusMessage.warn(`最多打开${nextDetailLevels.length}层`);
                      }
                    }}
                  />
                )}
              </Drawer>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BR;
