/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-shadow */
import classnames from 'classnames';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  api,
  apis,
  DataStoreApi,
  GlobalSearchApi,
  GlobalSearchContomFairItem,
  IHsCodeBackend,
  ICountryMap,
  AddressBookApi,
  GloablSearchContomFairParams,
  IContomFairCatalog,
  IGlobalSearchDeepGrubStat,
} from 'api';
import { Input, Skeleton, Empty, Switch, Pagination } from 'antd';
import qs from 'querystring';
import { useLocation } from '@reach/router';
import debounce from 'lodash/debounce';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';

// eslint-disable-next-line import/no-extraneous-dependencies
import contomStyle from './contomfair.module.scss';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import style from '../globalSearch.module.scss';
import { CompanyDetail } from '../detail/CompanyDetail';
import { globalSearchDataTracker } from '../tracker';

import { ReactComponent as Emtpy } from '@/images/icons/globalsearch/empty.svg';
import { FilterValue, GlobalSearchFilter } from '../search/filters';
import HistoryDropDown from '../search/HistoryDorpDown';
import { GlobalSearchTable } from '../search/SearchTable';
import ContomFairRecentYearFilter from './components/RecentYearFilter/recentYearFilter';
import { navigate } from 'gatsby';
import SearchValueList, { SearchValueItemList } from './components/SearchValueList/SearchValueList';
import { getIn18Text } from 'api';
import useInterCollectData from '../../CustomsData/customs/hooks/useInterCollectData';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { asyncTaskMessage$ } from '../search/GrubProcess/GrubProcess';
import { CantonFairRecentYear } from './constants';
const addressBookApi = api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const eventApi = api.getEventApi();
const SEARCH_HISTORY_KEY = 'GLOBALSEARCH_HISTORY_CONTOMFAIR';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const CONTOM_FAIR_LIST = 'CONTOM_FAIR_LIST';
export const TAB_VALUE_SORT = 'TAB_VALUE_SORT';

// 搜索类型相关接口
type TSearchType = 'company' | 'domain' | 'product';

// table相关接口
interface ITablePage {
  current: number;
  total: number;
  pageSize: number;
}

// hscode相关接口
interface IHsCode {
  code: string;
  content: string;
  hasNext: boolean;
}

interface DetailLevelStatus {
  id?: string;
  open: boolean;
}

const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

// const SearchTypeOptions: ITabOption[] = [
//   {
//     label: '采购品类',
//     value: 'product',
//   },
//   {
//     label: '公司',
//     value: 'company',
//   },
//   {
//     label: '域名',
//     value: 'domain',
//   },
// ];

const PlaceholderMap: Record<string, string> = {
  company: getIn18Text('QINGSHURUCAIGOUSHANGMINGCHENG'),
  domain: '请输入采购商的公司域名',
  product: '请输入您寻找的采购商经营的产品，建议使用中文',
};

const isNumber = (str: string) => {
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

// 静态时间戳
let hsTimeStamp = 0;

interface SearchPageProps extends React.HTMLAttributes<HTMLDivElement> {
  disableKeyWordSubTip?: boolean;
  defautQuery?: {
    query: string;
    createTime?: string;
    renderHeader?(): React.ReactNode;
  };
  detailDrawId?: string;
  queryType?: TSearchType;
}

const sysApi = api.getSystemApi();

// eslint-disable-next-line max-statements
export const ComTomFairSearch: React.FC<SearchPageProps> = ({ className, defautQuery, detailDrawId = '', queryType = 'company', disableKeyWordSubTip, ...rest }) => {
  const [query, setQuery] = useState(defautQuery?.query || '');
  const [page, setPage] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: (dataStoreApi.getSync(CONTOM_FAIR_LIST).data as unknown as number) ?? 20,
  });
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; searchType: TSearchType }>>(() => {
    const { data } = dataStoreApi.getSync(SEARCH_HISTORY_KEY);
    if (data) {
      try {
        const oldData = JSON.parse(data);
        if (Array.isArray(oldData)) {
          return oldData.map(e => {
            if (typeof e === 'string') {
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

  const [searchResult, setSearchResult] = useState<Array<GlobalSearchContomFairItem & { grubCount?: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(() => detailDrawId.length > 0);
  const [detailId, setDetailId] = useState<string>(detailDrawId);
  const [hasMail, setHasMail] = useState<boolean>(false);
  const [filterVisited, setFilterVisited] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<TSearchType>(queryType);
  const [countryMap, setCountryMap] = useState<ICountryMap | undefined>();
  const [resetFilterToken, setResetFilterToken] = useState<string | number>('');
  const filterRef = useRef<FilterValue>({});
  const location = useLocation();
  // const [deepSearchCompanyLoading, setDeepSearchCompanyLoading] = useState(false);

  // hscode部分
  const [hsCodeList, setHsCodeList] = useState<IHsCode[]>([]);
  const [isHsCodeListVisible, setIsHsCodeListVisible] = useState(false);

  const [isValidCompanyName, setIsValidCompanyName] = useState(false);
  const [reloadDetailToken, setReloadDetailToken] = useState(Date.now());

  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLElement>(null);
  const [detailGrubTaskId, setDetailGrubTaskId] = useState<GlobalSearchContomFairItem | undefined>();

  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);
  const [yearList, setYearList] = useState<number[]>([CantonFairRecentYear]);
  const [searchValueList, setSearchValueList] = useState<Array<string>>([]);

  const [catalogs, setCatalogs] = useState<IContomFairCatalog[]>([]);
  const [catalogRootKey, setCatalogRootKey] = useState<string>('all');
  const [searchedParams, setSearchedParams] = useState<GloablSearchContomFairParams>();
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

  const [updata] = useInterCollectData({
    data: collectDataList.data,
    keywords: query,
    origin: '展会数据',
    module: 'wmData',
    pageKeywords: 'contomfair',
  });

  useEffect(() => {
    setCollectDataList(prv => {
      return {
        keyword: '',
        data: [],
      };
    });
  }, [updata]);

  useEffect(() => {
    globalSearchApi.doGetContomfairSearchCatalog().then(res => {
      const { data } = dataStoreApi.getSync(TAB_VALUE_SORT);
      if (data) {
        try {
          const valueList = JSON.parse(data);
          if (Array.isArray(valueList)) {
            setCatalogs(handleCatalog(valueList, res) as IContomFairCatalog[]);
          } else {
            setCatalogs(res);
          }
        } catch (e) {
          setCatalogs(res);
        }
      } else {
        setCatalogs(res);
      }
    });
  }, []);

  useEffect(() => {
    if (defautQuery && defautQuery.query && defautQuery.query !== '') {
      setQuery(defautQuery.query);
    }
  }, [defautQuery]);

  useEffect(() => {
    setDetailId(detailDrawId);
    if (detailDrawId && detailDrawId.length > 0) {
      setShowDetail(true);
    }
  }, [detailDrawId]);

  useEffect(() => {
    setSearchType(queryType);
  }, [queryType]);

  const handleCatalog = (localeData: string[], param: IContomFairCatalog[]) => {
    if (localeData.length === param.length) {
      let arr = param.filter(item => !localeData.includes(item.key));
      if (arr.length === 0) {
        return localeData.map(item => {
          return {
            ...param.find(e => e.key === item),
          };
        });
      } else {
        return param;
      }
    } else {
      return param;
    }
  };

  const doSearch = (
    params: {
      value: string;
      page?: number;
      size?: number;
      from?: string;
      createTime?: string;
      hasEmail?: boolean;
      filterVisited?: boolean;
    },
    alterParam?: GloablSearchContomFairParams,
    onlyTableLoading?: boolean
  ) => {
    const { value, page: currentPage = 1, size = page.pageSize, from = '', createTime, hasEmail: paramHasEmail, filterVisited: paramFilterVisited } = params;
    if (onlyTableLoading) {
      setTableLoading(true);
    } else {
      setSearchLoading(true);
    }
    let keyName: string = searchType;
    if (keyName === 'company') {
      keyName = 'name';
    }
    const searchParam: GloablSearchContomFairParams = {
      searchType,
      [keyName]: value === undefined ? query : value,
      page: currentPage,
      hasEmail: 'hasEmail' in params ? paramHasEmail : hasMail,
      hasBrowsed: 'filterVisited' in params ? paramFilterVisited : filterVisited,
      size: size,
      yearList,
      searchValueList,
      ...filterRef.current,
    };
    if (createTime) {
      const createTimeNum = new Date(createTime).getTime();
      if (!isNaN(createTimeNum)) {
        searchParam.createTime = createTimeNum;
      }
    }
    const finalParam = alterParam ? alterParam : searchParam;
    setSearchedParams(finalParam);
    try {
      globalSearchDataTracker.trackDoContomFairSearch({
        keyword: finalParam.name || finalParam.product || finalParam.domain,
        searchType: searchType,
      });
    } catch (_e) {}
    return globalSearchApi
      .contomNewFairSearach({
        ...finalParam,
        version: 1,
      })
      .then(res => {
        setPage({
          total: res.pageableResult.total,
          current: currentPage,
          pageSize: searchParam.size,
        });
        setSearchResult(res.pageableResult.data || []);
        if (from !== 'pageChange') {
          globalSearchDataTracker.trackSearchResult(!!res.pageableResult.data && res.pageableResult.data.length > 0, query);
        }
        if (res.queryInfoBO && res.queryInfoBO.countryBOMap && Object.keys(res.queryInfoBO.countryBOMap).length > 0) {
          setCountryMap(res.queryInfoBO.countryBOMap);
        } else if (finalParam.country?.includes('other')) {
          setCountryMap({});
        } else {
          setCountryMap(undefined);
        }

        // 搜公司正确返回结果
        if (searchType === 'company') {
          setIsValidCompanyName(true);
        }
      })
      .catch(() => {
        setSearchResult([]);
        setPage({
          total: 0,
          current: 1,
          pageSize: page.pageSize,
        });
        if (searchType === 'company') {
          setIsValidCompanyName(false);
        }
      })
      .finally(() => {
        setTableLoading(false);
        setSearchLoading(false);
      });
  };

  const addToSearchHistory = useCallback(
    (value: { query: string; searchType: TSearchType }) => {
      if (value.query.trim().length === 0) return;
      const targetTypeList = [...searchHistory].filter(e => e.searchType === value.searchType);
      const restTypeList = [...searchHistory].filter(e => e.searchType !== value.searchType);
      if (targetTypeList.findIndex(e => e.query === value.query) === -1) {
        targetTypeList.unshift(value);
        const resultList = targetTypeList.slice(0, 7).concat(restTypeList);
        setSearchHistory(resultList);
        dataStoreApi.putSync(SEARCH_HISTORY_KEY, JSON.stringify(resultList), {
          noneUserRelated: false,
        });
      }
    },
    [searchHistory]
  );

  const handleSearch = (query: string, createTime?: string) => {
    addToSearchHistory({ query, searchType });
    filterRef.current = {};
    doSearch({
      value: query,
      createTime,
    });
    setResetFilterToken(Date.now());

    // hscode相关
    hiddenHsSelect();
  };

  useEffect(() => {
    if (defautQuery) {
      handleSearch(defautQuery.query, defautQuery.createTime);
    }
    return () => {};
  }, [defautQuery]);

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

  const clickHistoryItem = (param: string) => {
    setQuery(param);
    setResetFilterToken(Date.now());
    filterRef.current = {};
    doSearch({
      value: param,
    });
  };

  // table相关
  const onTableChange = (tablePage: ITablePage) => {
    setPage({
      current: tablePage.current || 1,
      total: tablePage.total,
      pageSize: tablePage.pageSize,
    });
    try {
      if (typeof tablePage.pageSize === 'number') {
        dataStoreApi.putSync(CONTOM_FAIR_LIST, JSON.stringify(tablePage.pageSize), {
          noneUserRelated: false,
        });
      }
    } catch (error) {}
    doSearch(
      {
        value: query,
        page: tablePage.current,
        size: tablePage.pageSize,
        from: 'pageChange',
        createTime: defautQuery?.createTime,
      },
      undefined,
      true
    );
  };

  const showDetailPage = (id: string) => {
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
    setDetailId(id);
    setShowDetail(true);
    setReloadDetailToken(Date.now());
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

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'globalSearch') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    if (params.q) {
      setQuery(params.q as string);
      setSearchType(params.searchType === 'domain' ? 'domain' : 'company');
      filterRef.current = {};
      setResetFilterToken(Date.now());
    }
  }, [location]);

  // Hscode 相关
  const getHsCodeList = (query: string, parentId: string = ''): Promise<IHsCodeBackend[]> => {
    const params = {
      queryValue: query,
      hsCodeParent: parentId,
    };
    return globalSearchApi.getHsCodeList(params);
  };

  const formatHsList = (list: IHsCodeBackend[]) => {
    setHsCodeList(
      list.map(({ hsCode, hsCodeDesc, hasChildNode }) => ({
        code: hsCode,
        content: hsCodeDesc,
        hasNext: hasChildNode,
      }))
    );
  };

  const debouncedGetHsCodeList = debounce((query: string) => {
    const timeStamp = Date.now();
    hsTimeStamp = timeStamp;
    getHsCodeList(query).then(result => {
      if (timeStamp === hsTimeStamp) {
        formatHsList(result);
      }
    });
  }, 200);

  const onQueryChange = (query: string) => {
    setQuery(query);
    if (searchType === 'product' && query.length > 2 && isNumber(query)) {
      debouncedGetHsCodeList(query);
    } else {
      setHsCodeList([]);
    }
  };

  const listUniqueId = searchResult.map(e => e.id).join('');
  useEffect(() => {
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        if (event?.eventData?.type === 'contact' && event.eventData.data) {
          const { id, newEmails, newPhones, status } = event.eventData.data as IGlobalSearchDeepGrubStat;
          const resultItem = searchResult.find(it => it.id === id);
          if (resultItem) {
            setSearchResult(preState =>
              preState.map(each => {
                if (each.id === id) {
                  const prevAllContactCount = each.contactCount * 1;
                  let addedCount = 0;
                  if (newEmails) {
                    each.emailCount += newEmails.length;
                    each.defaultEmail = newEmails[0];
                    each.defaultEmailNew = true;
                    addedCount += newEmails.length;
                  }
                  if (newPhones) {
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

  const SearchInput = (
    <div className={contomStyle.searchInputWrapper}>
      <span className={contomStyle.inputLabel} style={{ color: '#545A6E', fontWeight: 'normal' }}>
        {getIn18Text('CAIGOUSHANG')}
      </span>
      <span ref={searchInputRef}>
        <Input
          type="text"
          onFocus={() => setSearchHistoryOpen(true)}
          className={contomStyle.searchInput}
          value={query}
          size="middle"
          placeholder={PlaceholderMap[searchType]}
          onChange={e => onQueryChange(e.target.value)}
          allowClear
          onPressEnter={() => {
            return handleSearch(query);
          }}
        />
      </span>
    </div>
  );

  const toggleFilterVisited = (checked: boolean) => {
    setFilterVisited(checked);
    doSearch({
      value: query,
      filterVisited: checked,
    });
    globalSearchDataTracker.trackDoContomFairSearchFilter({
      hasViewed: checked,
    });
  };

  const formFilter = useCallback(() => {
    return (
      <div className={contomStyle.searchInputWrapper} style={{ marginBottom: '12px' }}>
        <span className={contomStyle.inputLabel} style={{ color: '#545A6E', fontWeight: 'normal' }}>
          {getIn18Text('SHAIXUAN')}
        </span>
        <span style={{ marginRight: '32px' }}>
          <SiriusCheckbox
            checked={filterVisited}
            onChange={e => {
              toggleFilterVisited(e.target.checked);
            }}
            style={{ color: '#272E47' }}
          >
            {getIn18Text('WEILIULAN')}
          </SiriusCheckbox>
        </span>
        <span>
          <SiriusCheckbox
            checked={hasMail}
            onChange={e => {
              toggleCheckEmail(e.target.checked);
            }}
            style={{ color: '#272E47' }}
          >
            {getIn18Text('YOUYOUXIANGDIZHI')}
          </SiriusCheckbox>
        </span>
      </div>
    );
  }, [filterVisited, hasMail, toggleFilterVisited, doSearch]);

  const hiddenHsSelect = () => {
    setIsHsCodeListVisible(false);
    setHsCodeList([]);
  };

  useEffect(() => {
    if (searchType === 'product' && query.length > 2 && isNumber(query)) {
      setIsHsCodeListVisible(true);
    } else {
      hiddenHsSelect();
    }
  }, [searchType, query]);

  const toggleCheckEmail = (checked: boolean) => {
    setHasMail(checked);
    doSearch({
      value: query,
      hasEmail: checked,
    });
    globalSearchDataTracker.trackDoContomFairSearchFilter({
      hasEmail: checked,
    });
  };

  useEffect(() => {
    doSearch({
      value: query,
    });
  }, [yearList, searchValueList]);

  useEffect(() => {
    if (catalogRootKey === 'all' && yearList.length === 0) {
      setYearList([CantonFairRecentYear]);
    }
  }, [catalogRootKey]);

  const locationHash = location.hash;

  useEffect(() => {
    if (searchLoading && collectDataList.data.length > 0) {
      globalSearchDataTracker.trackCollectData({
        info: collectDataList.data,
        keywords: collectDataList.keyword,
        count: collectDataList.data.length,
        origin: '展会数据',
      });
      setCollectDataList(prv => {
        return {
          keyword: '',
          data: [],
        };
      });
    }
  }, [searchLoading]);

  const handleValueChange = useCallback(
    (index: number) => {
      let arr = [...catalogs];
      let item = arr[9];
      arr.splice(9, 1, arr[index]);
      arr.splice(index, 1);
      arr.splice(10, 0, item);
      return arr;
    },
    [catalogs]
  );

  const renderHistoryRecord = () => (
    <HistoryDropDown
      target={searchInputRef.current}
      open={searchHistoryOpen && !query && searchHistory.filter(e => e.searchType === searchType).length > 0}
      changeOpen={setSearchHistoryOpen}
      searchList={searchHistory}
      onDelete={clearHistory}
      onClick={clickHistoryItem}
      searchType={searchType}
      subBtnVisible={false}
    />
  );

  return (
    <div className={classnames(contomStyle.container, className)} {...rest}>
      <div className={contomStyle.searchHeader}>
        <div
          className={contomStyle.back}
          onClick={() => {
            navigate('#wmData?page=globalSearch');
          }}
        >
          {' '}
        </div>
        <div className={classnames(contomStyle.headerBody)}>
          <div className={contomStyle.textWrap}>
            <h1>{getIn18Text('QUANQIUXIANXIAZHANHUIMAIJIAKU')}</h1>
            <div className={contomStyle.intro}>
              <div className={contomStyle.introItem}>
                <i className={classnames(contomStyle.icon, contomStyle.iconCompany)}></i>
                <span>{getIn18Text('WUSHIJIAWANCAIGOUSHANG')}</span>
              </div>
              <div className={contomStyle.introItem}>
                <i className={classnames(contomStyle.icon, contomStyle.iconGlobal)}></i>
                <span>{getIn18Text('JINSHINIANCANZHANXINXI')}</span>
              </div>
              <div className={contomStyle.introItem}>
                <i className={classnames(contomStyle.icon, contomStyle.iconCatalog)}></i>
                <span>{getIn18Text('FUGAIYIBAIJIAPINLEI')}</span>
              </div>
            </div>
          </div>
          {renderHistoryRecord()}
          <SearchValueList
            onChange={setSearchValueList}
            onChangeRootKey={setCatalogRootKey}
            rootKey={catalogRootKey}
            catalogs={catalogs}
            changeCataLogSort={(index, key) => {
              setCatalogs(handleValueChange(index));
              dataStoreApi.put(TAB_VALUE_SORT, JSON.stringify(handleValueChange(index).map(item => item.key)));
              setCatalogRootKey(key);
            }}
          />
        </div>
      </div>
      <div className={contomStyle.filterWrapper}>
        <SearchValueItemList catalogs={catalogs} onChange={setSearchValueList} rootKey={catalogRootKey} />
        <div className={contomStyle.filterItem} hidden={!countryMap}>
          <span className={contomStyle.filterTitle} style={{ color: '#545A6E', fontWeight: 'normal' }}>
            {getIn18Text('GUOJIA/DIQU')}
          </span>
          <GlobalSearchFilter hideLabel countryMap={countryMap || {}} onChange={hanldeFilterChange} resetToken={resetFilterToken} />
        </div>
        <ContomFairRecentYearFilter
          value={yearList}
          onChange={val => {
            setYearList(val);
            globalSearchDataTracker.trackDoContomFairSearchFilter({
              yearList: val,
            });
          }}
          rootKey={catalogRootKey}
        />
        {formFilter()}
        {SearchInput}
      </div>
      <div className={classnames(style.searchResult, contomStyle.searchResult)}>
        <div className={style.resultContainer} style={{ paddingTop: '16px', marginTop: 0 }}>
          <Skeleton loading={searchLoading} paragraph={{ rows: 10 }} active>
            <GlobalSearchTable
              scene="cantonfair"
              descType="cantonfair"
              searchedParams={searchedParams}
              query={query}
              data={searchResult}
              enableMoreDataSelect
              onDeepSearch={handleDeepSearch}
              onTableChange={onTableChange}
              tableType={searchType}
              page={page}
              loading={tableLoading}
              onGotoDetail={showDetailPage}
              locale={{
                emptyText: () => <Empty description="暂时没有相关企业信息" image={<Emtpy />}></Empty>,
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
        {/* <GrubProcess /> */}
      </div>
      <Drawer
        visible={showDetail}
        onClose={() => {
          setDetailGrubTaskId(undefined);
          setShowDetail(false);
        }}
        width={872}
        zIndex={1000}
      >
        {showDetail ? (
          <CompanyDetail
            isContomFair
            scene="cantonfair"
            origin="cantonfair"
            showSubscribe
            id={detailId}
            reloadToken={reloadDetailToken}
            onChangeListItem={onChangeListItem}
            showNextDetail={id => {
              setNextDetailLevels(prev => {
                const [_first, ...rest] = prev;
                return [{ open: true, id }, ...rest];
              });
            }}
          />
        ) : null}
      </Drawer>
      {nextDetailLevels.map((level, index) => (
        <Drawer
          key={index}
          visible={level.open}
          zIndex={1001 + index}
          onClose={() => {
            setDetailGrubTaskId(undefined);
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
              isContomFair
              id={level.id}
              reloadToken={0}
              showSubscribe
              origin="cantonfair"
              scene="cantonfair"
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
  );
};
