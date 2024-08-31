import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, useImperativeHandle } from 'react';
import { Breadcrumb, Checkbox, Skeleton } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import style from '../br.module.scss';
import { GlobalSearchFilter } from '../../globalSearch/search/filters';
import {
  getIn18Text,
  ICountryMap,
  GlobalSearchItem,
  api,
  DataStoreApi,
  MergeCompany,
  GlobalSearchParamsProp,
  GloablSearchParams,
  SearchReferer,
  IGlobalSearchDeepGrubStat,
} from 'api';
import { ReactComponent as Reset } from '@/images/icons/globalSearch/reset.svg';
import { TongyongJiantou1Shang, TongyongJiantou1Xia, TongyongTianjia } from '@sirius/icons';
import { GlobalSearchTableDefault } from '../../globalSearch/search/searchTableDemo';
import { globalSearchDataTracker } from '../../globalSearch/tracker';
import { FilterValue } from '../../globalSearch/search/filters';
import { asyncTaskMessage$ } from '../../globalSearch/search/GrubProcess/GrubProcess';
import { ITablePage } from '../../globalSearch/search/search';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { WmBigDataPageLayoutContext } from '../../globalSearch/keywordsSubscribe/KeywordsProvider';
import { CompanyDetail } from '../../globalSearch/detail/CompanyDetail';
import { isNumber, detailLevels, DetailLevelStatus } from '../../globalSearch/search/search';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SEARCH_OVER_100_CHAR } from '../../CustomsData/customs/constant';
import { globalSearchApi } from '../../globalSearch/constants';
export interface Prop extends React.HTMLAttributes<HTMLDivElement> {
  searchInput: React.ReactNode;
  initLayout: boolean;
  query: string;
  setInitLayout: (param: boolean) => void;
  checkedRcmdList: string[];
  setCheckedNearSynonymList: (param: string[]) => void;
  setSearchedValue: (param: string) => void;
}
export interface SearchRef {
  handleSearh(param: GlobalSearchParamsProp): void;
}

const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const BR_SEARCH_LIST = 'GLOBAL_SEARCH_LIST';
const eventApi = api.getEventApi();

const BrResult = React.forwardRef<SearchRef, Prop>(
  ({ searchInput, initLayout, query, setInitLayout, checkedRcmdList = [], setCheckedNearSynonymList, setSearchedValue }, ref) => {
    const [countryMap, setCountryMap] = useState<ICountryMap>({});
    const [resetFilterToken, setResetFilterToken] = useState<string | number>('');
    const [filterVisited, setFilterVisited] = useState<boolean>(false);
    const [hasMail, setHasMail] = useState<boolean>(false);
    const [notLogisticsCompany, setNotLogisticsCompany] = useState<boolean>(false);
    const [hasCustomData, setHasCustomData] = useState<boolean>(false);
    const [hasWebsite, setHasWebsite] = useState<boolean>(false);
    const [filterEdm, setFilterEdm] = useState<boolean>(false);
    const [showInput, setShowInput] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<Array<GlobalSearchItem>>([]);
    const [recommendShowName, setRecommendShowName] = useState<string | undefined>('');
    const [detailId, setDetailId] = useState<string>('');
    const [detailData, setDetailData] = useState<GlobalSearchItem>();
    const [showDetail, setShowDetail] = useState<boolean>(false);
    const [reloadDetailToken, setReloadDetailToken] = useState(Date.now());
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
    const filterRef = useRef<FilterValue>({});
    const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
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
        setSearchedValue(searchedParams?.product);
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
    const hanldeFilterChange = (filters: FilterValue) => {
      filterRef.current = filters;
      setCountryMap({});
      doSearch({
        value: query,
      });
    };
    const toggleFilterVisited = (checked: boolean) => {
      setFilterVisited(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          filterVisited: checked,
        });
      }
    };
    const toggleCheckEmail = (checked: boolean) => {
      setHasMail(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          hasEmail: checked,
        });
      }
    };
    const toggleNoLogistics = (checked: boolean) => {
      setNotLogisticsCompany(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          notLogisticsCompany: checked,
        });
      }
    };
    const toggleCustomData = (checked: boolean) => {
      setHasCustomData(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          hasCustomData: checked,
        });
      }
    };
    const toggleHasWebsite = (checked: boolean) => {
      setHasWebsite(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          hasWebsite: checked,
        });
      }
    };
    const toggleFilterEdm = (checked: boolean) => {
      setFilterEdm(checked);
      if (!initLayout) {
        doSearch({
          value: query,
          filterEdm: checked,
        });
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
    const resetFilter = () => {
      setNotLogisticsCompany(false);
      setHasCustomData(false);
      setHasWebsite(false);
      setFilterEdm(false);
      // setExcludeValueList(undefined);
      // setFromWCA(false);
      setHasMail(false);
      setFilterVisited(false);
      if (!initLayout) {
        doSearch({
          value: query,
          fromWca: false,
          filterVisited: false,
          hasEmail: false,
          notLogisticsCompany: false,
          hasCustomData: false,
          hasWebsite: false,
          filterEdm: false,
          excludeValueList: undefined,
        });
      }
    };
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
        hasEmail: paramHasEmail,
        filterVisited: paramFilterVisited,
        notLogisticsCompany: paramNotLogisticsCompany,
        hasCustomData: paramHasCustomData,
        hasWebsite: paramHasWebsite,
        filterEdm: paramFilterEdm,
        excludeValueList: paramExcludeValueList,
        sortField: paramsSortField,
        nearSynonymList: paramsNearSynonymList,
        fromWca: paramsFromWca,
        country,
      } = params;
      setInitLayout(false);
      if (onlyTableLoading) {
        setTableLoading(true);
      } else {
        setSearchLoading(true);
      }
      let keyName: string = type;
      if (keyName === 'company') {
        keyName = 'name';
      }
      let nextNearSynonymList: string[];
      if (searchedParams?.product !== (value || query)) {
        nextNearSynonymList = [];
      } else {
        nextNearSynonymList = paramsNearSynonymList || checkedRcmdList;
      }
      const searchParam: GloablSearchParams = {
        searchType: type,
        [keyName]: value === undefined ? (/^\d+$/.test(query) ? handleHscodeData(query) : query) : /^\d+$/.test(value) ? handleHscodeData(value) : value,
        page,
        hasEmail: 'hasEmail' in params ? paramHasEmail : hasMail,
        allMatchQuery: 'allMatchQuery' in params ? allMatchQuery : true,
        hasBrowsed: 'filterVisited' in params ? paramFilterVisited : filterVisited,
        size: pageSize,
        excludeExpressCompany: 'notLogisticsCompany' in params ? paramNotLogisticsCompany : notLogisticsCompany,
        hasCustomsData: 'hasCustomData' in params ? paramHasCustomData : hasCustomData,
        hasDomain: 'hasWebsite' in params ? paramHasWebsite : hasWebsite,
        filterEdm: 'filterEdm' in params ? paramFilterEdm : filterEdm,
        // excludeValueList: 'excludeValueList' in params ? [paramExcludeValueList || ''] : [excludeValueList || ''],
        fromWca: 'fromWca' in params ? paramsFromWca : false,
        sortField: 'sortField' in params ? paramsSortField : sortField || 'default',
        nearSynonymList: nextNearSynonymList,
        referer: searchSourceRef.current,
        ...filterRef.current,
      };
      country ? (searchParam.country = country) : '';
      setCheckedNearSynonymList(nextNearSynonymList ?? []);
      // if (createTime) {
      //   const createTimeNum = new Date(createTime).getTime();
      //   if (!isNaN(createTimeNum)) {
      //     searchParam.createTime = createTimeNum;
      //   }
      // }
      setSearchedParams(searchParam);
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
        })
        .finally(() => {
          setTableLoading(false);
          setSearchLoading(false);
          searchSourceRef.current = 'manual';
        });
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

    useImperativeHandle(
      ref,
      () => {
        return {
          handleSearh: vals => {
            filterRef.current = {};
            doSearch(vals);
            setResetFilterToken(Date.now());
          },
        };
      },
      [doSearch]
    );

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
      <>
        <Breadcrumb className={style.bread} separator={<SeparatorSvg />}>
          <Breadcrumb.Item>
            <a
              href="javascript:void(0)"
              onClick={e => {
                e.preventDefault();
                setSearchedParams({});
                setInitLayout(true);
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
          <div className={style.searchInputWrapper}>
            <div style={{ width: '100%' }} className={style.brResutl}>
              {searchInput}
            </div>
          </div>
          <div className={style.filterWrapper}>
            <GlobalSearchFilter countryMap={countryMap} onChange={hanldeFilterChange} resetToken={resetFilterToken} />
            <div className={style.filterContact}>
              <div className={style.filterGroup}>
                <div className={style.label}>{getIn18Text('SHAIXUAN')}</div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={filterVisited}
                    onChange={e => {
                      toggleFilterVisited(e.target.checked);
                    }}
                  >
                    {getIn18Text('WEILIULAN')}
                  </Checkbox>
                </div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={hasMail}
                    onChange={e => {
                      toggleCheckEmail(e.target.checked);
                    }}
                  >
                    {getIn18Text('YOUYOUXIANG')}
                  </Checkbox>
                </div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={notLogisticsCompany}
                    onChange={e => {
                      toggleNoLogistics(e.target.checked);
                    }}
                  >
                    {getIn18Text('FEIWULIUGONGSI')}
                  </Checkbox>
                </div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={hasCustomData}
                    onChange={e => {
                      toggleCustomData(e.target.checked);
                    }}
                  >
                    {getIn18Text('YOUHAIGUANSHUJU')}
                  </Checkbox>
                </div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={hasWebsite}
                    onChange={e => {
                      toggleHasWebsite(e.target.checked);
                    }}
                  >
                    {getIn18Text('YOUGUANWANG')}
                  </Checkbox>
                </div>
                <div className={style.filterCheckBox}>
                  <Checkbox
                    checked={filterEdm}
                    onChange={e => {
                      toggleFilterEdm(e.target.checked);
                    }}
                  >
                    {getIn18Text('WEIFASONGGUOYINGXIAOYOUJIAN')}
                  </Checkbox>
                </div>
              </div>
              <div className={style.resetWrapper}>
                <span className={style.resetWrapper} onClick={resetFilter}>
                  {getIn18Text('ZHONGZHI')}
                  <span className={style.resetIcon}>
                    <Reset />
                  </span>
                </span>
                {/* <div className={style.showMore} onClick={() => setShowInput(!showInput)}>
                {!showInput ? (
                  <div className={style.showText}>
                    {getIn18Text('GENGDUO')}
                    <span className={style.icon}>
                      <TongyongJiantou1Xia color="#4C6AFF" fontSize={16} />
                    </span>
                  </div>
                ) : (
                  <div className={style.showText}>
                    {getIn18Text('SHOUQI')}
                    <span className={style.icon}>
                      <TongyongJiantou1Shang color="#4C6AFF" fontSize={16} />
                    </span>
                  </div>
                )}
              </div> */}
              </div>
            </div>
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
                checkedRcmdList={checkedRcmdList}
                tableType={'product'}
                page={pageConfig}
                onGotoDetail={showDetailPage}
                realTotalCount={realTotalCount}
                loading={tableLoading}
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
    );
  }
);

export default BrResult;
