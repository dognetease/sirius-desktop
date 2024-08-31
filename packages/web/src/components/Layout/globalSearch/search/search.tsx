/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-shadow */
import classnames from 'classnames';
import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  api,
  apiHolder,
  apis,
  DataStoreApi,
  GlobalSearchApi,
  GlobalSearchItem,
  EdmCustomsApi,
  getIn18Text,
  GloablSearchParams,
  ICountryMap,
  IGlobalSearchDeepGrubStat,
  SearchReferer,
  TGloabalSearchType,
  MergeCompany,
  CountryMapProp,
  IGlobalGuide,
  GlobalSearchParamsProp,
  IsPageSwitchItem,
} from 'api';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Skeleton, Breadcrumb, Tooltip, message, Popover, Input } from 'antd';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import qs from 'querystring';
import { useLocation } from '@reach/router';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { ReactComponent as SearchTipsSvg } from '@/images/globalSearch/show-tips.svg';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import style from '../globalSearch.module.scss';
import { CompanyDetail } from '../detail/CompanyDetail';
import { globalSearchDataTracker } from '../tracker';
import { FilterValue, GlobalSearchFilter } from './filters';
import { GlobalSearchFilterItems } from './filterItems';
import Translate from '../../components/translate/translate';
import { GlobalSearchTableDefault } from './searchTableDemo';
import HistoryDropDown from './HistoryDorpDown';
import SearchTab from './SearchTab';
import ActiveGuide from './ContomFairGuide/ActiveGuide';
import GlobalSearchIntro from './intro';
import { useGlobalSearchStat } from './hooks/useGlobalSearchStat';
import MyCountUp from './MyCountUp/MyCountUp';
import InfoRoll from './InfoRoll/InfoRoll';
import HscodeDropList from '../../CustomsData/customs/docSearch/component/HscodeDropList/HscodeDropList';
import SuggestDropDown from './SuggestDropDown';
import EmptyResult from './EmptyResult/EmptyResult';
import RcmdRow from './RcmdRow/RcmdRow';
import { ReactComponent as QuestionIcon } from '@/images/icons/customs/question.svg';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import NewSubTip from '../component/NewSubTip/NewSubTip';
import GptRcmdList from './GptRcmdList/GptRcmdList';
import GlobalSearchInput from './SearchInput/GlobalSearchInput';
import HistroyExtra from './HistroyExtra';
import { SEARCH_OVER_100_CHAR } from '../../CustomsData/customs/constant';
import GuideSearch from '../../components/guideSearch/guideSearch';
import { ReactComponent as GuideCompany } from '@/images/icons/customs/guide_company.svg';
import { ReactComponent as GuideDomain } from '@/images/icons/customs/guide_domain.svg';
import useInterCollectData from '../../CustomsData/customs/hooks/useInterCollectData';
import { useIsForwarder } from '../../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { SearchGuide } from '../component/SearchGuide/SearchGuide';
import { WmBigDataPageLayoutContext } from '../keywordsSubscribe/KeywordsProvider';
import { asyncTaskMessage$ } from './GrubProcess/GrubProcess';
import { ItemProp } from './HistoryDorpDown/SearchHistoryItem';
import { useCustomsCountryHook } from '../../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { WmDataSentryKey, WmDataSentryOp, errorReportApi, getWmDataSentryKeyPrefix } from '../sentry-utils';
// import { EnhanceSelect, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import useLangOption from '../../CustomsData/customs/search/useLangOption';
import { useMemoizedFn } from 'ahooks';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const SEARCH_HISTORY_KEY = 'GLOBALSEARCH_HISTORY_V2';
const GLOBAL_SEARCH_LIST = 'GLOBAL_SEARCH_LIST';
const SHOW_TIPS_KEY = 'GLOBALSEARCH_SHOW_GUANJIANCI_TIPS';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

const eventApi = api.getEventApi();

// 搜索类型相关接口

export interface ITabOption {
  label: string;
  value: TGloabalSearchType;
}

// table相关接口
export interface ITablePage {
  current: number;
  total: number;
  pageSize: number;
}

// hscode相关接口
export interface IHsCode {
  code: string;
  content: string;
  hasNext: boolean;
}

export type THsCodeFunc = (code: string) => void;

// toast提示相关接口
export interface IToastItem {
  id: string;
  newContactNum: number;
}

export interface DetailLevelStatus {
  id?: string;
  open: boolean;
}

export interface sortBtntype {
  label: string;
  key: number;
}

export interface FilterParam {
  filterVisited?: boolean;
  hasMail?: boolean;
  notLogisticsCompany?: boolean;
  hasCustomData?: boolean;
  filterEdm?: boolean;
  filterCustomer?: boolean;
  hasWebsite?: boolean;
  excludeValueList?: string;
  otherGoodsShipped?: string[];
  containsExpress?: boolean;
  [key: string]: any;
}

export interface CountryFilterProp {
  label: string;
  value: string;
}

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

export const endKeyReg = /(?:CO|CORP|COMPANY|CORPORATION|LTD|LIMITED|LT|GMBH)\b/gi;

export const domainReg = /^(?:https?:\/\/|www\.|\S+\.com|\S+\.cn|\S+\.org|\S+\.net)$/i;

export const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

const SearchTypeOptions: ITabOption[] = [
  {
    label: getIn18Text('ANGUANJIANCI'),
    value: 'product',
  },
  {
    label: getIn18Text('ANGONGSI'),
    value: 'company',
  },
  {
    label: getIn18Text('ANYUMING'),
    value: 'domain',
  },
];

const PlaceholderMap: Record<string, string> = {
  company: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
  domain: getIn18Text('QINGSHURUGONGSIYUMINGHUOLIANXIRENYOUXIANGHOUZHUI'),
  product: getIn18Text('KESHURUCHANPINMIAOSHU\u3001HSCodeHUOGONGSIMIAOSHUJINXINGSOUSUO'),
};

export const isNumber = (str: string) => {
  const lower = '0'.charCodeAt(0);
  const upper = '9'.charCodeAt(0);
  for (const char of str) {
    const charCode = char.charCodeAt(0);
    if (charCode < lower || charCode > upper) {
      return false;
    }
  }
  return true;
};

interface SearchPageProps extends React.HTMLAttributes<HTMLDivElement> {
  disableKeyWordSubTip?: boolean;
  defautQuery?: {
    query: string;
    createTime?: string;
    renderHeader?(): React.ReactNode;
  };
  detailDrawId?: string;
  queryType?: TGloabalSearchType;
  listOnly?: boolean;
  hideSearchResultTips?: boolean;
}
// eslint-disable-next-line max-statements
export const SearchPage: React.FC<SearchPageProps> = ({
  className,
  defautQuery,
  detailDrawId = '',
  queryType = 'product',
  disableKeyWordSubTip,
  listOnly,
  hideSearchResultTips,
  ...rest
}) => {
  const [initLayout, setInitLayout] = useState(true);
  const [query, setQuery] = useState(defautQuery?.query || '');
  const gloablSearchStats = useGlobalSearchStat(initLayout);

  const [pageConfig, setPageConfig] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: (dataStoreApi.getSync(GLOBAL_SEARCH_LIST).data as unknown as number) ?? 10,
  });
  const [searchHistory, setSearchHistory] = useState<
    Array<{ query: string | string[]; searchType: TGloabalSearchType; filterParams: FilterParam; country: CountryFilterProp[] }>
  >(() => {
    const { data } = dataStoreApi.getSync(SEARCH_HISTORY_KEY, { noneUserRelated: true });
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

  const [searchResult, setSearchResult] = useState<Array<GlobalSearchItem>>([]);
  const [realTotalCount, setRealTotalCount] = useState<number>(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(() => detailDrawId.length > 0);
  const [detailId, setDetailId] = useState<string>(detailDrawId);
  const [detailData, setDetailData] = useState<GlobalSearchItem>();
  const [recommendShowName, setRecommendShowName] = useState<string | undefined>('');

  const [filterItemsValue, setFilterItemsValue] = useState<FilterParam>(initFilterItemsValue);

  const [isPreciseSearch, setIsPreciseSearch] = useState(!!listOnly);
  const [searchType, setSearchType] = useState<TGloabalSearchType>(queryType);
  const [countryMap, setCountryMap] = useState<ICountryMap>({});
  const [resetFilterToken, setResetFilterToken] = useState<string | number>('');
  const [showTips, setShowTips] = useState<boolean>(!localStorage.getItem(SHOW_TIPS_KEY));
  const filterRef = useRef<FilterValue>({});
  const location = useLocation();

  // hscode部分
  const [isHsCodeListVisible, setIsHsCodeListVisible] = useState(false);

  // 有道翻译部分
  const [translateValue, setTranslateValue] = useState('');
  const [translateStyle, setTranslateStyle] = useState<React.CSSProperties>({});
  const [displayTranslateWidth, setDisplayTranslateWidth] = useState<number>(0);

  const [reloadDetailToken, setReloadDetailToken] = useState(Date.now());

  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const searchSourceRef = useRef<SearchReferer>('manual');

  const [searchedParams, setSearchedParams] = useState<Partial<GloablSearchParams>>();

  const [rcmdList, setRcmdList] = useState<string[]>([]);

  const [showInput, setShowInput] = useState<boolean>(false);

  const [sortField, setSortField] = useState<string | undefined>('default');
  const [isFouse, setIsFouse] = useState<boolean>(false);
  const [isClickHscode, setIsClickHscode] = useState<boolean>(false);
  const [checkedNearSynonymList, setCheckedNearSynonymList] = useState<string[]>([]);
  const [publicSearchValue, setPublicSearchValue] = useState<string>('');
  const isForwarder = useIsForwarder();
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  const [guideSearchPart, setGuideSearchPart] = useState<{
    show: boolean;
    searchType: TGloabalSearchType;
    width?: number;
  }>({
    show: false,
    searchType: 'product',
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

  const [sensitive, setSensitive] = useState<boolean>(false);

  const [selectedCountry, setSelectedCountry] = useState<
    {
      label: string;
      name: string;
    }[]
  >([]);
  const [searchGuideVisible, setSearchGuideVisible] = useState<boolean>(false);

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

  const findIdInd = () => {
    return searchResult.findIndex(item => item.id === detailId);
  };
  const handlePagTurn = (num: number) => {
    if ((num > 0 && findIdInd() === searchResult.length - 1) || (num < 0 && !findIdInd())) return;
    if (num > 0) {
      setDetailId(searchResult[findIdInd() + 1]?.id);
      setRecommendShowName(searchResult[findIdInd() + 1]?.recommendShowName);
    } else {
      setDetailId(searchResult[findIdInd() - 1]?.id);
      setRecommendShowName(searchResult[findIdInd() + 1]?.recommendShowName);
    }
  };

  const [switchOption, setSwitchOption] = useState<IsPageSwitchItem>({
    hasLast: false,
    hasNext: false,
    onPagTurn: handlePagTurn,
  });

  const [updata] = useInterCollectData({
    data: collectDataList.data,
    keywords: collectDataList.keyword,
    origin: '全球搜',
    module: 'wmData',
    pageKeywords: 'globalSearch',
  });

  const closeSearchTips = useCallback(() => {
    if (!showTips) return;
    setShowTips(false);
    localStorage.setItem(SHOW_TIPS_KEY, '1');
  }, [showTips]);

  useEffect(() => {
    setCollectDataList(prv => {
      return {
        keyword: '',
        data: [],
      };
    });
  }, [updata]);

  const searchTranslatedVal = () => {
    setQuery(translateValue);
    setDisplayTranslateWidth(0);
    doSearch({
      value: translateValue,
    });
  };

  useEffect(() => {
    if (defautQuery && defautQuery.query && defautQuery.query !== '') {
      setQuery(defautQuery.query);
    }
  }, [defautQuery]);

  useEffect(() => {
    if (listOnly) {
      setInitLayout(false);
    }
  }, [listOnly]);

  useEffect(() => {
    setDetailId(detailDrawId);
    if (detailDrawId && detailDrawId.length > 0) {
      setShowDetail(true);
    }
  }, [detailDrawId]);

  useEffect(() => {
    setSearchType(queryType);
  }, [queryType]);

  useEffect(() => {
    if (initLayout) {
      // 返回首页重置筛选项
      setFilterItemsValue(initFilterItemsValue);
      setShowInput(false);
    }
  }, [initLayout]);

  useEffect(() => {
    if (!initLayout) {
      // 搜索结果页 触发全局引导
      eventApi.sendSysEvent({
        eventName: 'requireModuleGuide',
        eventData: {
          moduleType: IGlobalGuide.ModuleType.BIG_DATA,
          moduleName: ['wmData'],
          page: ['globalSearch', ''],
        },
      });
    }
  }, [initLayout, location.hash]);

  useEffect(() => {
    if (detailId) {
      setSwitchOption({
        hasNext: findIdInd() < searchResult.length - 1,
        hasLast: findIdInd() > 0,
        onPagTurn: handlePagTurn,
      });
      setSearchResult(prev =>
        prev.map(e => {
          if (e.id === detailId) {
            return {
              ...e,
              browsed: true,
            };
          }
          return e;
        })
      );
    }
  }, [detailId]);

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

  const guideSearch = (value: string, type: TGloabalSearchType) => {
    if (hasChinese(value)) {
      return;
    }
    if (/(?:CO|CORP|COMPANY|CORPORATION|LTD|LIMITED|LT|GMBH)$/gi.test(value)) {
      type === 'company'
        ? setGuideSearchPart(prv => {
            return {
              show: false,
              searchType: 'company',
              width: calculateTextWidth(value),
            };
          })
        : setGuideSearchPart(prv => {
            return {
              show: true,
              searchType: 'company',
              width: calculateTextWidth(value),
            };
          });
      // setSearchType('company')
    } else if (/^(?:https?:\/\/|https?:\/\/[a-zA-Z0-9.-]{0,62}|www\.|www\.[a-zA-Z0-9.-]{0,62}|\S+\.com|\S+\.cn|\S+\.org|\S+\.net)$/i.test(value)) {
      type === 'domain'
        ? setGuideSearchPart(prv => {
            return {
              show: false,
              searchType: 'domain',
              width: calculateTextWidth(value),
            };
          })
        : setGuideSearchPart(prv => {
            return {
              show: true,
              searchType: 'domain',
              width: calculateTextWidth(value),
            };
          });
    } else {
      guideSearchPart.show
        ? ''
        : setGuideSearchPart(prv => {
            return {
              ...prv,
              show: false,
            };
          });
    }
  };

  const guideSearchHandle = () => {
    setSearchType(guideSearchPart.searchType);
    setGuideSearchPart(prv => {
      return {
        ...prv,
        show: false,
      };
    });
  };

  useEffect(() => {
    if ((displayTranslateWidth > 0 || guideSearchPart.show) && searchInputRef.current) {
      const { offsetLeft, offsetTop, offsetHeight } = searchInputRef.current;
      const positionLeft = (displayTranslateWidth > 0 ? displayTranslateWidth : guideSearchPart.width ?? 0) + 15;
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
  }, [displayTranslateWidth, searchInputRef.current?.offsetLeft, searchInputRef.current?.offsetTop, searchInputRef.current?.offsetHeight, guideSearchPart.show]);

  useEffect(() => {
    setDisplayTranslateWidth(0);
  }, [query]);

  const searchedValue =
    searchedParams && searchedParams.searchType ? (searchedParams.searchType === 'company' ? searchedParams.name : searchedParams[searchedParams.searchType]) : undefined;

  const doSearch = async (params: GlobalSearchParamsProp, onlyTableLoading?: boolean) => {
    if (params.value.length > 100) {
      return message.warn(SEARCH_OVER_100_CHAR);
    }
    const sentryId = errorReportApi.startTransaction({
      name: `${getWmDataSentryKeyPrefix('globalSearch')}${WmDataSentryKey.Search}`,
      op: WmDataSentryOp.Search,
    });
    closeSearchTips();
    const {
      type = searchType,
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
    setSuggestOpen(false);
    guideSearch(value, type);
    if (from !== 'pageChange') {
      // (query + "+" + list.join('|'))
      let str;
      if (paramsNearSynonymList && paramsNearSynonymList.length > 0) {
        value ? (str = value + '+' + paramsNearSynonymList.join('|')) : (str = query + '+' + paramsNearSynonymList.join('|'));
      } else {
        str = value || query;
      }
      globalSearchDataTracker.trackDoSearch(str, type, !!allMatchQuery);
    }
    let keyName: string = type;
    if (keyName === 'company') {
      keyName = 'name';
    }
    const lastSearchedValue = searchedValue;
    let nextNearSynonymList: string[];
    // 上次搜索的关键词和这次不一致或者 type 不是Product
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
      referer: searchSourceRef.current,
      nearSynonymList: nextNearSynonymList,
      ...filterRef.current,
    };
    country ? (searchParam.country = country) : '';
    setCheckedNearSynonymList(nextNearSynonymList);
    if (createTime) {
      const createTimeNum = new Date(createTime).getTime();
      if (!isNaN(createTimeNum)) {
        searchParam.createTime = createTimeNum;
      }
    }
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
    setPublicSearchValue(value);
    return globalSearchApi
      .newSearch({
        ...searchParam,
        version: 1,
      })
      .then(res => {
        setPageConfig({
          pageSize: searchParam.size,
          total: res.realTotalCount || res.pageableResult.total,
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
          // if (res.queryInfoBO.recommendWordList) {
          //   setRcmdList(res.queryInfoBO.recommendWordList);
          // }
        } else {
          setCountryMap({});
        }
        if (sensitive) {
          setSensitive(false);
        }
        errorReportApi.endTransaction({ id: sentryId });
      })
      .catch(() => {
        setSearchResult([]);
        setPageConfig({
          total: 0,
          current: 1,
          pageSize: pageConfig.pageSize,
        });
        setSensitive(true);
        setGuideSearchPart(prv => {
          return {
            ...prv,
            show: false,
          };
        });
        setDisplayTranslateWidth(0);
      })
      .finally(() => {
        setTableLoading(false);
        setSearchLoading(false);
        setSuggestOpen(false);
        searchSourceRef.current = 'manual';
      });
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
      setSearchHistory(resultList);
      dataStoreApi.putSync(SEARCH_HISTORY_KEY, JSON.stringify(resultList), {
        noneUserRelated: true,
      });
    },
    [searchHistory]
  );

  const handleContryMap = useCallback((map: ICountryMap) => {
    let countryList: Array<CountryMapProp> = [];
    Object.values(map).forEach(item => {
      countryList = [...item, ...countryList];
    });
    return countryList;
  }, []);

  const handleSearch = (query: string, createTime?: string) => {
    // 翻译
    if (!displayTranslateWidth) {
      translate(query);
    }
    setIsHsCodeListVisible(false);
    setSuggestOpen(false);
    sortField === 'default' ? '' : setSortField('default');
    filterRef.current = {};
    doSearch({
      value: query,
      createTime,
      sortField: 'default',
    });
    setResetFilterToken(Date.now());
  };

  useEffect(() => {
    if (defautQuery && listOnly) {
      handleSearch(defautQuery.query, defautQuery.createTime);
    }
    return () => {};
  }, [defautQuery, listOnly]);

  const clearHistory = useCallback((st: string) => {
    setSearchHistory(prev => {
      const filteredObj = prev.filter(e => e.searchType !== st);
      try {
        dataStoreApi.putSync(SEARCH_HISTORY_KEY, JSON.stringify(filteredObj), { noneUserRelated: true });
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

  const handleSearchTypeChange = (type: TGloabalSearchType) => {
    if (type !== 'product') {
      setFilterItemsValue?.({
        ...filterItemsValue,
        excludeValueList: undefined,
      });
      setShowInput(false);
    }
    setResetFilterToken(Date.now());
    if (publicSearchValue) {
      setQuery(publicSearchValue);
    } else if (!publicSearchValue && initLayout) {
      setQuery('');
    }
    setSearchType(type);
    resetTable();
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

  // table相关
  const onTableChange = (tablePage: ITablePage) => {
    setPageConfig({
      current: tablePage.current || 1,
      total: realTotalCount || tablePage.total,
      pageSize: tablePage.pageSize,
    });
    try {
      if (typeof tablePage.pageSize === 'number') {
        dataStoreApi.putSync(GLOBAL_SEARCH_LIST, JSON.stringify(tablePage.pageSize), {
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
        createTime: defautQuery?.createTime,
      },
      true
    );
  };

  const resetTable = () => {
    setRcmdList([]);
    setSearchedParams({});
    setSearchResult([]);
    setCheckedNearSynonymList([]);
    setPageConfig({
      current: 0,
      total: 0,
      pageSize: pageConfig.pageSize,
    });
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

  const locationHash = location.hash;

  const [paramQ, paramT] = useMemo(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    if (!['globalSearch', 'wmData'].includes(moduleName)) {
      return ['', ''];
    }
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.q && typeof params.q === 'string') {
      return [params.q, params.searchType];
    }
    return ['', ''];
  }, [locationHash]);

  const [paramKeywords, paramType] = useMemo(() => {
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.keywords && typeof params.keywords === 'string' && params.type && typeof params.type === 'string') {
      return [params.keywords, params.type];
    }
    return ['', ''];
  }, [locationHash]);

  useEffect(() => {
    if (paramKeywords && paramType) {
      setQuery(paramKeywords);
      setSearchType(paramType as TGloabalSearchType);
      filterRef.current = {};
      setResetFilterToken(Date.now());
      setInitLayout(true);
      setSearchedParams({});
    }
  }, [paramKeywords, paramType]);

  useEffect(() => {
    setGuideSearchPart(prv => {
      return {
        ...prv,
        show: false,
      };
    });
  }, [locationHash]);

  useEffect(() => {
    if (paramQ) {
      setQuery(paramQ);
      setSearchType(paramT === 'domain' ? 'domain' : paramT === 'product' ? 'product' : 'company');
      filterRef.current = {};
      setResetFilterToken(Date.now());
      setInitLayout(true);
      setSearchedParams({});
    }
  }, [paramQ, paramT]);

  const { quit, start, commit, handling, getPopoverByStep } = useNoviceTask({
    moduleType: 'GLOBAL_SEARCH',
    taskType: 'FIND_CUSTOMER',
  });

  const Popover1 = getPopoverByStep(1);

  useEffect(() => {
    if (handling) {
      // 重置页面状态
      setInitLayout(true);
      setQuery('');
      setShowDetail(false);
      setNextDetailLevels(detailLevels);
      setSearchHistoryOpen(false);
      // 开始引导
      start();
    }
  }, [handling]);

  // 离开搜索页面时, 结束新手任务
  useEffect(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    const isSearchPage = ['globalSearch', 'wmData'].includes(moduleName);
    return isSearchPage ? quit : () => {};
  }, [locationHash]);

  const selectHsTitle = (code: string) => {
    setQuery(code);
  };

  const formatTranslateValue = useMemo(() => (translateValue.length > 30 ? `${translateValue.slice(0, 30)}...` : translateValue), [translateValue]);

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

  const searchSuffix = () => {
    if (searchType === 'domain') {
      return null;
    }
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
      <div className={style.searchComp}>
        <div className={style.searchTabWrapper}>
          <Popover
            visible={showTips}
            placement="topLeft"
            overlayClassName={style.productSearchTips}
            getPopupContainer={trigger => trigger}
            title="【按产品搜索】升级为【按关键词搜索】啦！"
            content={
              <>
                <div>可使用经营产品、公司描述、行业类型进行搜索</div>
                <Button btnType="primary" onClick={closeSearchTips}>
                  {getIn18Text('ZHIDAOLE')}
                </Button>
              </>
            }
          >
            <SearchTab defaultActiveKey="1" tabList={SearchTypeOptions} activeKey={searchType} onChange={handleSearchTypeChange} />
          </Popover>
          {!initLayout && (
            <div className={style.showTipsWrapper} onClick={() => setSearchGuideVisible(true)}>
              <SearchTipsSvg />
              <div className={style.searchTipsText}>如何搜到更多公司</div>
            </div>
          )}
        </div>
        <div
          className={classnames(style.searchInputWrapper, {
            [style.searchInputWrapperTank]: !initLayout && searchType === 'product',
          })}
        >
          <Popover1>
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
                setIsFouse(true);
              }}
              className={classnames(style.searchInput, {
                [style.searchInputInit]: initLayout,
              })}
              value={query}
              placeholder={PlaceholderMap[searchType]}
              onChange={e => {
                setIsClickHscode(false);
                setQuery(e.target.value);
                setSuggestOpen(!!e.target.value);
                guideSearchPart.show
                  ? setGuideSearchPart(prv => {
                      return {
                        ...prv,
                        show: false,
                      };
                    })
                  : '';
              }}
              onBlur={() => {
                setIsFouse(false);
              }}
              onSearch={text => {
                handleSearch(text);
                commit(1);
              }}
              enterButton={getIn18Text('SOUSUO')}
              prefix={<SearchGlobalIcon />}
              suffix={searchSuffix()}
            />
          </Popover1>
          {!initLayout && searchType === 'product' && searchedValue && (
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
          {guideSearchPart.show && !initLayout && (
            <GuideSearch
              content={<span>{guideSearchPart.searchType === 'domain' ? '按域名搜索获得更准确的结果' : '按公司搜索获得更准确的结果'}</span>}
              onClose={() =>
                setGuideSearchPart(prv => {
                  return {
                    ...prv,
                    show: false,
                  };
                })
              }
              btnText={guideSearchPart.searchType === 'domain' ? '按域名搜索' : '按公司搜索'}
              icon={guideSearchPart.searchType === 'domain' ? <GuideDomain /> : <GuideCompany />}
              onGuideSearch={guideSearchHandle}
              style={{ ...translateStyle, height: 32 }}
            />
          )}
        </div>
      </div>
    </>
  );

  const hsSelectComp = (
    <HscodeDropList
      isFouse={isFouse}
      onSelect={value => {
        // setIsFouse(false)
        setIsClickHscode(true);
        selectHsTitle(value);
        handleSearch(value);
        commit(1);
      }}
      visible={isHsCodeListVisible}
      onChangeVisible={setIsHsCodeListVisible}
      searchValue={isHsCodeListVisible ? query : undefined}
      target={searchInputRef.current?.parentElement}
      blurTarget={searchInputRef.current?.parentElement}
    />
  );

  const resetFilterOptions = () => {
    setSortField('default');
    filterRef.current = {};
  };

  useEffect(() => {
    if (searchType === 'product' && query.length > 0 && isNumber(query)) {
      setIsHsCodeListVisible(true);
    } else {
      setIsHsCodeListVisible(false);
    }
    resetFilterOptions();
  }, [searchType]);
  useEffect(() => {
    if (query && !initLayout) {
      doSearch({
        value: publicSearchValue ? publicSearchValue : query,
        hasMail: filterItemsValue?.hasMail,
        filterVisited: filterItemsValue?.filterVisited,
        notLogisticsCompany: filterItemsValue?.notLogisticsCompany,
        hasCustomData: filterItemsValue?.hasCustomData,
        hasWebsite: filterItemsValue?.hasWebsite,
        filterEdm: filterItemsValue?.filterEdm,
        filterCustomer: filterItemsValue?.filterCustomer,
        excludeValueList: filterItemsValue?.excludeValueList,
        country: [],
        sortField: 'default',
        allMatchQuery: isPreciseSearch && searchType === 'domain' ? false : isPreciseSearch,
      });
    }
    if (isPreciseSearch && searchType === 'domain') {
      setIsPreciseSearch(false);
    }
    setSelectedCountry([]);
  }, [searchType]);
  useEffect(() => {
    if (searchType === 'product' && query.length > 0 && isNumber(query)) {
      // setIsHsCodeListVisible(true);
      // 点击hscode隐藏
      isClickHscode ? '' : setIsHsCodeListVisible(true);
    } else {
      setIsHsCodeListVisible(false);
    }
  }, [query]);

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
    if (['filterVisited', 'hasMail', 'notLogisticsCompany', 'hasCustomData', 'hasWebsite', 'filterEdm'].includes(name)) {
      globalSearchDataTracker.tractCheckEmail({
        hasViewed: name === 'filterVisited' ? (bl as boolean) : filterItemsValue?.filterVisited,
        hasEmail: name === 'hasMail' ? (bl as boolean) : filterItemsValue?.hasMail,
        noLogistics: name === 'notLogisticsCompany' ? (bl as boolean) : filterItemsValue?.notLogisticsCompany,
        hasCustomData: name === 'hasCustomData' ? (bl as boolean) : filterItemsValue?.hasCustomData,
        hasWebsite: name === 'hasWebsite' ? (bl as boolean) : filterItemsValue?.hasWebsite,
        noEdm: name === 'filterEdm' ? (bl as boolean) : filterItemsValue?.filterEdm,
      });
    }
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

  const resetFilter = () => {
    setFilterItemsValue(initFilterItemsValue);
    if (!initLayout) {
      doSearch({
        value: query,
        ...initFilterItemsValue,
      });
    }
    globalSearchDataTracker.tractCheckEmail({
      hasViewed: false,
      hasEmail: false,
      noLogistics: false,
      hasCustomData: false,
      hasWebsite: false,
      noEdm: false,
    });
  };

  const renderHistoryRecord = () => (
    <>
      <HistoryDropDown
        target={searchInputRef.current?.parentElement}
        open={searchHistoryOpen && !query && searchHistory.filter(e => e.searchType === searchType).length > 0}
        changeOpen={setSearchHistoryOpen}
        searchList={searchHistory}
        onDelete={clearHistory}
        onClick={(name, data) => {
          clickHistoryItem(name, data);
        }}
        renderExtra={handleRenderExtra}
        searchType={searchType}
        subBtnVisible={searchType === 'product'}
        autoDetectSubType
      />
      <SuggestDropDown
        target={searchInputRef.current?.parentElement}
        type="global_search"
        sugguestType={searchType === 'product' && !isNumber(query) ? 0 : undefined}
        desc={'公司'}
        keyword={query}
        open={suggestOpen && !!query && query.length > 2}
        changeOpen={setSuggestOpen}
        onSelect={kwd => {
          setQuery(kwd);
          setResetFilterToken(Date.now());
          filterRef.current = {};
          searchSourceRef.current = 'suggest';
          doSearch({
            value: kwd,
          });
        }}
      />
    </>
  );

  useEffect(() => {
    if (searchLoading && collectDataList.data.length > 0) {
      globalSearchDataTracker.trackCollectData({
        info: collectDataList.data,
        keywords: collectDataList.keyword,
        count: collectDataList.data.length,
        origin: '全球搜',
        searchType,
      });
      setCollectDataList(prv => {
        return {
          keyword: '',
          data: [],
        };
      });
    }
  }, [searchLoading]);

  const onCloseSearchGuideVisible = () => {
    setSearchGuideVisible(false);
  };

  return (
    <>
      <div
        className={classnames(style.container, className, {
          [style.containerList]: !initLayout,
          [style.containerAuto]: !initLayout,
        })}
        {...rest}
      >
        {!initLayout && !listOnly && (
          <Breadcrumb className={style.bread} separator={<SeparatorSvg />}>
            <Breadcrumb.Item>
              <a
                href="javascript:void(0)"
                onClick={e => {
                  e.preventDefault();
                  resetFilterOptions();
                  setInitLayout(true);
                }}
              >
                <span>{getIn18Text('QUANQIUSOUSUO')}</span>
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span>{getIn18Text('SOUSUOJIEGUO')}</span>
            </Breadcrumb.Item>
          </Breadcrumb>
        )}
        {initLayout && (
          <div className={style.header}>
            <InfoRoll className={style.inforoll} infos={gloablSearchStats.rollInfos} />
            <div className={style.headerInner}>
              <div className={style.textWrap}>
                <h1>{getIn18Text('QUANQIUSOUSUO')}</h1>
                <GlobalSearchIntro />
                <MyCountUp
                  className={style.countup}
                  date={gloablSearchStats.date}
                  end={gloablSearchStats.companyNums}
                  prefix={`${getIn18Text('LEIJIQUANQIUQIYESHUJU')}`}
                />
              </div>
              <div style={{ position: 'relative' }}>
                {SearchInput}
                {hsSelectComp}
                {/* {renderAiBox()} */}
              </div>
              {renderHistoryRecord()}
            </div>
          </div>
        )}
        {!initLayout && (
          <div className={style.searchResult}>
            {defautQuery?.renderHeader !== undefined ? (
              <div>{defautQuery.renderHeader()}</div>
            ) : (
              <>
                <div className={style.searchInputWrapper}>
                  <div style={{ width: '100%' }}>
                    {SearchInput} {hsSelectComp}
                  </div>
                </div>
                {renderHistoryRecord()}
              </>
            )}
            <div className={style.filterWrapper}>
              <GlobalSearchFilter
                countryMap={countryMap}
                clearSelectedCountry={setSelectedCountry}
                selectedCountryList={selectedCountry}
                onChange={hanldeFilterChange}
                resetToken={resetFilterToken}
              />
              <GlobalSearchFilterItems
                resetFilter={resetFilter}
                showInput={showInput}
                searchType={searchType}
                filterItemsValue={filterItemsValue}
                toggleFilter={toggleFilter}
                setShowInput={setShowInput}
                langOptions={langOptions}
                searchLoading={searchLoading}
              />
            </div>
            {!listOnly && <NewSubTip />}
            <div className={style.resultContainer}>
              <Skeleton loading={searchLoading} active>
                <GlobalSearchTableDefault
                  searchedParams={searchedParams}
                  enableMoreDataSelect={searchType === 'product'}
                  sticky={listOnly ? undefined : { offsetHeader: 106 }}
                  checkedRcmdList={checkedNearSynonymList}
                  showSubscribe
                  onDeepSearch={handleDeepSearch}
                  query={query}
                  data={searchResult}
                  onTableChange={onTableChange}
                  tableType={searchType}
                  page={pageConfig}
                  onGotoDetail={showDetailPage}
                  realTotalCount={realTotalCount}
                  locale={{
                    emptyText: () => (
                      <EmptyResult
                        hasRcmd={rcmdList.length > 0}
                        searchType={searchedParams?.searchType}
                        query={searchedParams?.name || searchedParams?.domain || searchedParams?.product}
                        disableKeyWordSubTip={disableKeyWordSubTip}
                        onSearch={param => {
                          setQuery(param);
                          setResetFilterToken(Date.now());
                          filterRef.current = {};
                          doSearch({
                            value: param,
                          });
                        }}
                        sensitive={sensitive}
                      />
                    ),
                  }}
                  loading={tableLoading}
                  hideSearchResultTips={hideSearchResultTips || guideSearchPart.show || displayTranslateWidth > 0}
                  sortField={sortField}
                  onChangeSelect={value => {
                    globalSearchDataTracker.trackEmailSort(value === 'default' ? 'general' : 'updateTime');
                    toggleSortFiled(value);
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
                />
              </Skeleton>
            </div>
            <RcmdRow
              className={style.rcmdContainer}
              onChoseRcmd={param => {
                setQuery(param);
                setSearchType('product');
                setResetFilterToken(Date.now());
                filterRef.current = {};
                searchSourceRef.current = 'recommend';
                doSearch({
                  value: param,
                  type: 'product',
                });
              }}
              rcmdList={rcmdList}
              visible={rcmdList.length > 0}
            />
            {/* {renderAiBox()} */}
          </div>
        )}
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
              key={detailId}
              origin={'global'}
              queryGoodsShipped={searchType === 'product' && !isNumber(query) ? query : ''}
              queryHsCode={searchType === 'product' && isNumber(query) ? query : ''}
              isPreciseSearch={searchType !== 'domain' ? isPreciseSearch : undefined}
              showSubscribe
              id={detailId}
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
              switchOption={switchOption}
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
                origin={'global'}
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
      {initLayout && (
        <div className={style.containerLink}>
          <div className={style.containerLinkContent}>
            <ActiveGuide />
          </div>
        </div>
      )}
      {searchGuideVisible && <SearchGuide visible={searchGuideVisible} onClose={onCloseSearchGuideVisible} />}
    </>
  );
};
