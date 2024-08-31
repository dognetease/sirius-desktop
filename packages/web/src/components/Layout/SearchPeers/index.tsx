import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import classnames from 'classnames';
import style from './index.module.scss';
import PerrsSearch from './components/peersSearch';
import FollowNation from '../CustomsData/customs/followNation/followNation';
import { useMemoizedFn } from 'ahooks';
import { getIn18Text, ForwarderRecordItem as tableListItem, ForwarderType, ReqForwarder, ResForwarder, resCustomsFollowCountry } from 'api';
import PeersNav from './components/peersNav';
import BuysersTable from '../CustomsData/customs/table/buysersTable';
import { recData } from '../CustomsData/customs/ForwarderData';
import { defaultInitParams } from '../CustomsData/customs/ForwarderData';
import { ForwarderFormType } from '../CustomsData/customs/ForwarderSearch/ForwarderSearch';
import { edmCustomsApi } from '../globalSearch/constants';
import { SearchRef } from './components/peersSearch';
import LevelDrawer from '../../Layout/CustomsData/components/levelDrawer/levelDrawer';
import { WmBigDataPageLayoutContext } from '../globalSearch/keywordsSubscribe/KeywordsProvider';
import CustomsDetail from '../CustomsData/customs/customsDetail/customsDetail';
import { Skeleton } from 'antd';
import { navigate } from 'gatsby';
import { reqExcludeViewed } from '../CustomsData/customs/customs';
import EmptyResult from '../globalSearch/search/EmptyResult/EmptyResult';
import DataUpdate, { DataUpdateRecord } from '../CustomsData/customs/dataUpdate/dataUpdate';
import { thousandSeparator } from '../CustomsData/customs/ForwarderData';
import { ReactComponent as CloseIcon } from '@/images/icons/customs/close-icon.svg';

export interface Prop {}

const SearchPeers: React.FC<Prop> = () => {
  const [initLayout, setInitLayout] = useState<boolean>(true);
  const [tableList, setTableList] = useState<tableListItem[]>([]);
  const [sortOrderParam, setSortOrderParam] = useState<{ sortBy: string; order: string }>({
    sortBy: '',
    order: '',
  });
  const [pagination, setPagination] = useState<{ from: number; pageSize: number; total: number }>({
    from: 1,
    total: 0,
    pageSize: 10,
  });
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'peers',
    zIndex: 0,
    content: {
      country: '',
      to: 'peers',
      companyName: '',
      tabOneValue: '',
      queryValue: '',
      originCompanyName: '',
      visited: false,
      otherGoodsShipped: [],
      hideTransPortBtn: true,
      hideSubBtn: true,
    },
  });
  const totalCache = useRef<number | null>(null);
  const [reqParams, setReqParams] = useState<ReqForwarder>({
    ...defaultInitParams,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const reqNum = useRef<number>(0);
  const searchRef = useRef<SearchRef>(null);
  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  const [dataRecord, setDataRecord] = useState<DataUpdateRecord | null>(null);
  const [excludeViewedObj, setExcludeViewedObj] = useState<reqExcludeViewed>({
    excludeViewedIndex: 0,
    excludeViewedList: [0],
    startFrom: 0,
  });

  useEffect(() => {
    if (reqNum.current > 0) {
      fetchTableData(reqParams);
    }
    reqNum.current += 1;
  }, [reqParams]);
  useEffect(() => {
    if (initLayout) {
      setTableList([]);
      setPagination({
        ...pagination,
        from: 1,
      });
      resetExcludeViewedObj();
      setDataRecord(null);
    }
  }, [initLayout]);
  const handleNationClick = useMemoizedFn((nation: resCustomsFollowCountry) => {
    searchRef.current?.setValues({
      countryList: [nation.country],
    });
    const currentValues = searchRef.current?.getValues();
    setReqParams({
      ...reqParams,
      ...currentValues,
      from: 1,
      size: pagination.pageSize,
    });
    setInitLayout(false);
  });
  const fetchTableData = useMemoizedFn((value: ReqForwarder) => {
    if (!tableLoading) {
      setLoading(true);
    }
    const { from, updateTime } = value;
    const params: ReqForwarder = {
      ...value,
      updateTime: dataRecord?.updateTime || updateTime || '',
      from: from - 1,
      groupByCountry: true,
    };
    if (totalCache.current) {
      params.total = totalCache.current;
    }
    params.startFrom = params.excludeViewed || params.notViewed ? excludeViewedObj.startFrom : undefined;
    edmCustomsApi
      .getSearchPeersList({
        ...params,
        async: true,
      })
      .then(res => {
        handleResData(res, params);
        if (res.asyncId) {
          setSkeletonLoading(true);
          edmCustomsApi
            .getBuyersListAsync({ asyncId: res.asyncId })
            .then(data => {
              handleResData(data, params);
            })
            .finally(() => {
              setTableLoading(false);
              setLoading(false);
              setSkeletonLoading(false);
            });
        }
      })
      .catch(() => {
        setTableLoading(false);
        setLoading(false);
      })
      .finally(() => {
        totalCache.current = null;
      });
  });
  const refresh = () => {
    setReqParams(prv => {
      return {
        ...prv,
        from: pagination.from,
      };
    });
  };
  const handleResData = useMemoizedFn((res: ResForwarder, param: ReqForwarder) => {
    const { records, total } = res;
    setTableLoading(false);
    setLoading(false);
    setPagination(prev => {
      return {
        ...prev,
        total: total && total > 0 ? total : 0,
      };
    });
    (param.excludeViewed || param.notViewed) && setExcludeViewedObj({ ...excludeViewedObj, startFrom: res.startFrom });
    records.map(item => {
      item.name = item.companyName;
      item.topHsCodeStart = item.topHsCode;
      item.topProductDescStart = item.topProductDesc;
      return item;
    });
    setTableList(records);
  });
  const onSearch = useMemoizedFn((value: ForwarderFormType) => {
    setInitLayout(false);
    setReqParams({
      ...reqParams,
      ...value,
      from: 1,
      size: pagination.pageSize,
      sortBy: '',
      order: '',
    });
    setPagination(prev => ({
      ...prev,
      from: 1,
      total: 0,
    }));
  });

  const afterReset = () => {
    setTableList([]);
    setPagination(prev => ({
      ...prev,
      from: 1,
      total: 0,
    }));
    setSortOrderParam({
      order: '',
      sortBy: '',
    });
    setDataRecord(null);
  };
  const onTableChange = (currentPagination: any, filter?: any, sorter?: any) => {
    const { field = sortOrderParam.sortBy, order } = sorter || sortOrderParam;
    // 如果是翻页，则只loading表格
    if (currentPagination) {
      setTableLoading(true);
    }
    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    let { current = pagination.from, pageSize = pagination.pageSize } = currentPagination || {};
    // 如果是翻页，直接缓存total
    totalCache.current = pagination.total;
    // 如果是排序 则返回第一页
    if (sorter) {
      current = 1;
      pageSize = 20;
      totalCache.current = null;
    }
    setPagination({
      ...pagination,
      from: current as number,
      pageSize: pageSize as number,
    });
    setSortOrderParam({
      ...sorterParams,
      order,
    });
    setReqParams({
      ...reqParams,
      ...sorterParams,
      from: current as number,
      size: pageSize as number,
    });
  };
  const resetExcludeViewedObj = () => {
    setExcludeViewedObj({
      excludeViewedIndex: 0,
      excludeViewedList: [0],
      startFrom: 0,
    });
  };
  const searchRecData = useMemo(() => {
    return {
      ...recData,
      content: {
        ...recData.content,
        tabOneValue: 'all',
        goPort: searchRef.current?.getValues().portOfLadings,
        endPort: searchRef.current?.getValues().portOfUnLadings,
      },
    };
  }, [recData, searchRef.current?.getValues().portOfLadings, searchRef.current?.getValues().portOfUnLadings]);
  const onDrawerOpen = useMemoizedFn((content: recData['content'], zIndex: number, origin?: string) => {
    const rec = (currentIndex: number, recData: recData) => {
      if (recData) {
        if (currentIndex === zIndex) {
          recData.visible = true;
          recData.to = content.to;
          // 注意数据兼容性
          recData.content = { ...recData.content, ...content };
          if (zIndex === 0 && reqParams.relationCountryList?.length) {
            recData.content.relationCountryList = [...reqParams.relationCountryList];
          }
        } else {
          if (!recData.children) {
            recData.children = {
              visible: false,
              zIndex: currentIndex + 1,
              to: content.to,
              // 注意数据兼容性
              content: { ...content, hideSubBtn: true },
            };
          }
          rec(currentIndex + 1, recData.children);
        }
      }
    };
    rec(0, recData);
    setRecData({ ...recData, origin });
    console.log('_recDataArr-open', recData);
  });
  const onDrawerClose = (closeIndex: number, all?: boolean) => {
    const rec = (currentIndex: number, recData: any) => {
      if (currentIndex === closeIndex) {
        recData.visible = false;
        recData.children && delete recData.children;
      } else {
        const _recData = recData.children;
        rec(currentIndex + 1, _recData);
      }
    };
    if (all) {
      recData.visible = false;
      recData.children && delete recData.children;
      setRecData(recData);
    } else {
      rec(0, recData);
      setRecData({ ...recData });
    }
    console.log('_recDataArr-close', recData);
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
  const onSamilPageChange = (sorter?: any) => {
    const { field = sortOrderParam.sortBy, order } = sorter || sortOrderParam;

    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    setReqParams({
      ...reqParams,
      ...sorterParams,
      startFrom: excludeViewedObj.startFrom,
    });
  };
  const handleCloseIcon = () => {
    searchRef.current?.setValues({
      updateTime: '',
    });
    setReqParams({
      ...reqParams,
      ...searchRef.current?.getValues(),
      updateTime: '',
      from: 1,
      size: pagination.pageSize,
      sortBy: '',
      order: '',
    });
    setTableList([]);
    setPagination({
      from: 1,
      total: 0,
      pageSize: 10,
    });
    setDataRecord(null);
  };
  const renderUpdateData = useMemo(() => {
    if (!dataRecord) {
      return null;
    }
    return (
      <Skeleton active loading={loading} paragraph={false}>
        <div className={style.latestData}>
          <span>{dataRecord.updateTime}</span>
          共更新了
          <span>{thousandSeparator(dataRecord.transactions + '')}</span>
          条贸易数据
          {(dataRecord.transactions ?? 1) >= 10000 && <>，为您展示前10000条数据</>}
          <div className={style.icon} onClick={handleCloseIcon}>
            <CloseIcon />
          </div>
        </div>
      </Skeleton>
    );
  }, [dataRecord, loading, handleCloseIcon]);

  const onCell = useMemoizedFn((record: DataUpdateRecord) => {
    const nextParams: ReqForwarder = {
      ...defaultInitParams,
      from: 1,
      size: pagination.pageSize,
      portOfLadings: [],
      portOfUnLadings: [],
      updateTime: record.updateTime,
      timeFilter: 'all',
    };
    searchRef.current?.setValues(nextParams);
    setPagination({
      ...pagination,
      from: 1,
      total: 0,
    });
    setReqParams(nextParams);
    setInitLayout(false);
    setDataRecord({
      ...record,
    });
  });
  return (
    <div
      className={classnames(style.container, {
        [style.containerList]: !initLayout,
      })}
    >
      {initLayout && (
        <div
          className={style.wcaBanner}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            navigate(`#wmData?page=wca`);
          }}
        >
          <div className={style.icon}>进入</div>
          <div className={style.wcaText}>WCA世界货物运输联盟成员数据</div>
        </div>
      )}
      {initLayout && (
        <>
          <div className={style.containerInner}>
            <div className={style.header}>
              <h1>在海关数据中检索货代同行</h1>
            </div>
          </div>
          <div className={style.containerCountry}>
            <FollowNation onClick={handleNationClick} />
            <DataUpdate type="peers" onCell={onCell} />
          </div>
        </>
      )}
      {!initLayout && (
        <PeersNav
          setInitLayout={() => {
            setInitLayout(true);
          }}
        />
      )}
      <PerrsSearch
        initLayout={initLayout}
        defaultValues={defaultInitParams}
        setInitLayout={() => {
          setInitLayout(false);
        }}
        ref={searchRef}
        afterReset={afterReset}
        onSearch={onSearch}
        onValuesChange={() => {
          resetExcludeViewedObj();
        }}
      />
      {!initLayout && (
        <>
          <Skeleton active loading={loading} className={style.peersLoading} paragraph={{ rows: 4 }}>
            <div className={style.peersTable}>
              {renderUpdateData}
              <BuysersTable
                scence="peers"
                sticky={{
                  offsetHeader: 106,
                }}
                refresh={refresh}
                searchType="forwarder"
                tableList={tableList}
                type={'peers'}
                onChangeTable={setTableList}
                sortOrderParam={sortOrderParam}
                pagination={pagination}
                onChange={onTableChange}
                excludeViewed={reqParams.excludeViewed || reqParams.notViewed}
                onDrawerOpen={onDrawerOpen}
                skeletonLoading={skeletonLoading}
                tableLoading={tableLoading}
                setExcludeViewedObj={setExcludeViewedObj}
                excludeViewedObj={excludeViewedObj}
                onSamilPageChange={onSamilPageChange}
                hideSubBtn={true}
                locale={{
                  emptyText: () => <EmptyResult query={undefined} defaultDesc={'暂无数据'} />,
                }}
              />
              {/* 详情栏 */}
              <LevelDrawer
                getContainer={detailRootDom || undefined}
                type="forwarder"
                recData={searchRecData}
                onClose={(index, all) => {
                  onDrawerClose(index, all);
                }}
                onOpen={onDrawerOpen}
                onCollectIdChange={handleCollectIdChange}
                onChangeListItem={onChangeListItem}
              >
                <CustomsDetail />
              </LevelDrawer>
            </div>
          </Skeleton>
        </>
      )}
    </div>
  );
};

export default SearchPeers;
