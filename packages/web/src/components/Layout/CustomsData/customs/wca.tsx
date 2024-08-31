import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, apiHolder, apis, DataStoreApi, GlobalSearchApi, ICountryMap, WcaReq, GlobalSearchContomFairItem, AddressBookApi, IGlobalSearchDeepGrubStat } from 'api';
import { Input, Skeleton, Empty, Switch } from 'antd';
import style from './wca.module.scss';
import contomStyle from '../../globalSearch/cantonFairSearch/contomfair.module.scss';
import { getIn18Text } from 'api';
import { GlobalSearchFilter } from '../../globalSearch/search/filters';
import classnames from 'classnames';
import { GlobalSearchTable } from '../../globalSearch/search/SearchTable';
import { ReactComponent as Emtpy } from '@/images/icons/globalsearch/empty.svg';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { CompanyDetail } from '../../globalSearch/detail/CompanyDetail';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { FilterValue } from '../../globalSearch/search/filters';
import { navigate } from 'gatsby';
import { asyncTaskMessage$ } from '../../globalSearch/search/GrubProcess/GrubProcess';

interface ITablePage {
  current: number;
  total: number;
  pageSize: number;
}

interface DetailLevelStatus {
  id?: string;
  open: boolean;
}

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

const addressBookApi = api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

const eventApi = api.getEventApi();

const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

const WcaSeach: React.FC<{}> = () => {
  const [query, setQuery] = useState('');

  const searchInputRef = useRef<HTMLElement>(null);

  const [countryMap, setCountryMap] = useState<ICountryMap | undefined>();

  const [resetFilterToken, setResetFilterToken] = useState<string | number>('');

  const [page, setPage] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: 10,
  });

  const [searchResult, setSearchResult] = useState<Array<GlobalSearchContomFairItem & { grubCount?: number }>>([]);

  const [searchLoading, setSearchLoading] = useState(false);

  const [hasMail, setHasMail] = useState<boolean>(false);

  const [filterVisited, setFilterVisited] = useState<boolean>(false);

  const [detailId, setDetailId] = useState<string>('');

  const [showDetail, setShowDetail] = useState(false);

  const [reloadDetailToken, setReloadDetailToken] = useState(Date.now());

  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);

  const [req, setReq] = useState<WcaReq>({
    page: 1,
    size: 10,
    name: '',
    hasEmail: false,
    hasBrowsed: false,
  });

  // const filterRef = useRef<FilterValue>({});

  const hanldeFilterChange = (filters: FilterValue) => {
    // filterRef.current = filters;
    setCountryMap({});
    doGetWcaList({
      ...req,
      name: query,
      country: filters.country,
      page: 1,
      size: 10,
    });
  };

  useEffect(() => {
    doGetWcaList({
      page: page.current,
      size: page.pageSize,
    });
  }, []);

  const doGetWcaList = (param: WcaReq) => {
    const { page: currentPage = 1 } = param;

    const reqParams = {
      ...req,
      ...param,
    };

    setSearchLoading(true);

    setReq(reqParams);

    globalSearchApi
      .doGetWcaList(reqParams)
      .then(res => {
        setPage({
          total: res.pageableResult.total,
          current: currentPage,
          pageSize: param.size,
        });
        setSearchResult(res.pageableResult.data || []);
        if (res.queryInfoBO && res.queryInfoBO.countryBOMap && Object.keys(res.queryInfoBO.countryBOMap).length > 0) {
          setCountryMap(res.queryInfoBO.countryBOMap);
        } else {
          setCountryMap({});
        }
        setSearchLoading(false);
      })
      .catch(() => {
        setPage({
          current: 1,
          total: 0,
          pageSize: 10,
        });
        setSearchResult([]);
        setSearchLoading(false);
      });
  };

  const toggleCheckEmail = (checked: boolean) => {
    setHasMail(checked);
    doGetWcaList({
      ...req,
      name: query,
      hasEmail: checked,
    });
  };

  const toggleFilterVisited = (checked: boolean) => {
    setFilterVisited(checked);
    doGetWcaList({
      ...req,
      name: query,
      hasBrowsed: checked,
    });
  };

  // table相关
  const onTableChange = (tablePage: ITablePage) => {
    setPage({
      current: tablePage.current || 1,
      total: tablePage.total,
      pageSize: tablePage.pageSize,
    });
    doGetWcaList({
      name: query,
      page: tablePage.current,
      size: tablePage.pageSize,
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

  const wcaFilter = () => {
    return (
      <div className={style.searchInputWrapper}>
        <span className={style.inputLabel}>{getIn18Text('GONGSIMINGCHENG')}</span>
        <span ref={searchInputRef}>
          <Input
            type="text"
            // onFocus={() => setSearchHistoryOpen(true)}
            className={contomStyle.searchInput}
            value={query}
            size="middle"
            placeholder={getIn18Text('QINGSHURUGONGSIMINGCHENG')}
            onChange={e => setQuery(e.target.value)}
            allowClear
            onPressEnter={() => {
              return doGetWcaList({
                name: query,
                page: 1,
                size: 10,
              });
            }}
          />
        </span>
      </div>
    );
  };
  return (
    <div className={classnames(style.wcaContainer)}>
      <div className={style.searchHeader}>
        <div
          className={style.back}
          onClick={() => {
            navigate('#wmData?page=searchPeers');
          }}
        >
          {' '}
        </div>
        <div className={classnames(style.headerBody)}>
          <div className={style.textWrap}>
            <h1>世界货物运输联盟 (WCA)</h1>
            <div className={style.intro}>
              <div className={style.introItem}>
                <span>致力于资源共享，全球货代合作共赢。</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={style.wcaFilterWrapper}>
        {wcaFilter()}
        <div className={style.filterItem} hidden={!countryMap}>
          <span className={style.filterTitle}>{getIn18Text('GUOJIA/DEQU')}</span>
          <GlobalSearchFilter hideLabel countryMap={countryMap || {}} onChange={hanldeFilterChange} resetToken={resetFilterToken} />
        </div>
      </div>
      <div className={classnames(style.searchResult)}>
        <Skeleton loading={searchLoading} paragraph={{ rows: 10 }} active>
          <GlobalSearchTable
            renderHeaderFilter={() => (
              <div className={style.filterSwitchGroup}>
                <div className={style.checkBox}>
                  <Switch className={style.switch} checked={hasMail} onChange={toggleCheckEmail} />
                  <span className={style.checkboxText}>隐藏不包含邮箱的数据</span>
                </div>
                <div className={style.checkBox}>
                  <Switch className={style.switch} checked={filterVisited} onChange={toggleFilterVisited} />
                  <span className={style.checkboxText}>过滤已浏览</span>
                </div>
              </div>
            )}
            scene="cantonfair"
            descType="wca"
            query={query}
            data={searchResult}
            onDeepSearch={handleDeepSearch}
            onTableChange={onTableChange}
            tableType={'company'}
            page={page}
            onGotoDetail={showDetailPage}
            locale={{
              emptyText: () => <Empty description="暂时没有相关企业信息" image={<Emtpy />}></Empty>,
            }}
          />
        </Skeleton>
      </div>
      <Drawer
        visible={showDetail}
        onClose={() => {
          // setDetailGrubTaskId(undefined);
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

export default WcaSeach;
