/* eslint-disable max-statements */
/**
 * 此文件复制自customs.tsx，是海关的货代版本
 * 海关货代在UI上做了比较大的调整，因此入口文件复制出来重做一份，
 * 以免兼容逻辑过多带来更多的心智负担
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Breadcrumb, message, Skeleton } from 'antd';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  ForwarderRecordItem as tableListType,
  EdmCustomsApi,
  ResForwarder,
  resCustomsFollowCountry,
  SearchReferer,
  ReqForwarder,
  ForwarderType,
  DataStoreApi,
  api,
} from 'api';
import styles from './forwarder.module.scss';
import { ForwarderFormType, ForwarderSearchRef } from './ForwarderSearch/ForwarderSearch';
import CustomsDetail from './customsDetail/customsDetail';
import LevelDrawer from '../components/levelDrawer/levelDrawer';
import BuysersTable from './table/buysersTable';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import FollowNation from './followNation/followNation';
import DataUpdate, { DataUpdateRecord } from './dataUpdate/dataUpdate';
import { ReactComponent as CloseIcon } from '@/images/icons/customs/close-icon.svg';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import useCustomsStat from './hooks/useCustomsStat';
import MyCountUp from '../../globalSearch/search/MyCountUp/MyCountUp';
import InfoRoll from '../../globalSearch/search/InfoRoll/InfoRoll';
import { useGlobalSearchStat } from '../../globalSearch/search/hooks/useGlobalSearchStat';
import { forwarderBreadList as breadList, tips } from './constant';
import { getIn18Text, CustomsRecord } from 'api';
import { WmBigDataPageLayoutContext } from '../../globalSearch/keywordsSubscribe/KeywordsProvider';
import ForwarderSearch from './ForwarderSearch/ForwarderSearch';
import { reqExcludeViewed } from './customs';
import CustomsUpdateTime from './customsSearch/CustomsUpdateTime';
import ForwarderProvider from './ForwarderSearch/context/ForwarderProvider';
import { ForwarderContext } from './ForwarderSearch/context/forwarder';
import ForwarderDataEmpty from './table/forwarderDataEmpty';
import { navigate } from 'gatsby';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import ForwardTable from './table/forwardTable';
import { customsDataTracker } from '../tracker/tracker';
const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;
const { TabPane } = Tabs;

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const isWebWmEntry = apiHolder.api.getSystemApi().isWebWmEntry();
const FORWARDER_LIST = 'FORWARDER_LIST';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const FORWARD_MODEL = 'FORWARD_MODEL';
// 搜索结果总数少于10，则展示Empty提示
const SHOW_EMPTY_NUM = 10;

export type SearchType = 'buysers' | 'suppliers' | 'peers';

export interface recData {
  visible: boolean;
  zIndex: number;
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
    originCompanyName: string;
    companyList?: Array<{
      name: string;
      country?: string;
      companyId: number;
      location?: string;
    }>;
    otherGoodsShipped?: string[];
    hideTransPortBtn?: boolean;
    hideSubBtn?: boolean;
  };
  children?: recData;
}

export const defaultInitParams: ReqForwarder = {
  containsExpress: false,
  timeFilter: 'last_one_year',
  onlyContainsChina: false,
  from: 1,
  size: (dataStoreApi.getSync(FORWARDER_LIST).data as unknown as number) ?? 20,
  isHuodaiQuery: true,
  countryList: [],
  relationCountryList: [],
  queryKeys: [],
  queryType: ForwarderType.Port,
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
export type Model = 'document' | 'company' | 'peers';

export interface aiKeyWrodsAndType {
  keyword: string;
  type: string;
}
export const thousandSeparator = (n?: string) => n?.toString().replace(/(?!^)(?=(\d{3})+$)/g, ',');

const ForwarderData: React.FC<{}> = () => {
  // layout 3层 首页、列表页、详情页（只有单据搜索有）
  const [layout, setLayout] = useState<string[]>(breadList.slice(0, 1));
  const [{ curExcavate }, forwarderDispatch] = useContext(ForwarderContext);
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  // const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  // const searchFilterRef = useRef<ForwarderSearchRef>(null);
  const searchSourceRef = useRef<SearchReferer>('manual');
  const [currentCompanyType, setCompanyType] = useState<SearchType>('buysers');
  const [forwarderType, setForwarderType] = useState<ForwarderType>(ForwarderType.Port);
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
  // const [searchList, setSearchList] = useState<Array<string>>([]);
  // const [searchData, setSearchData] = useState<HistoryType>();
  const [tableList, setTableList] = useState<tableListType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [isMorePage, setIsMorePage] = useState<boolean>(false);

  const [excludeViewedObj, setExcludeViewedObj] = useState<reqExcludeViewed>({
    excludeViewedIndex: 0,
    excludeViewedList: [0],
    startFrom: 0,
  });
  const [pagination, setPagination] = useState<{ from: number; pageSize: number; total: number }>(() => {
    try {
      const { data } = dataStoreApi.getSync(FORWARDER_LIST);
      if (data) {
        return {
          from: 1,
          total: 0,
          pageSize: JSON.parse(data),
        };
      } else {
        return {
          from: 1,
          total: 0,
          pageSize: 10,
        };
      }
    } catch (error) {
      return {
        from: 1,
        total: 0,
        pageSize: 10,
      };
    }
  });
  const [reqBuyParams, setReqBuyParams] = useState<ReqForwarder>({
    ...defaultInitParams,
  });
  const reqSeq = useRef<number>(0);
  // const [translatorsOtherGoodsShipped, setTranslatorsOtherGoodsShipped] = useState<string[]>([]);

  // const [searchValue, setSearchValue] = useState<string[]>([]);
  const [sortOrderParam, setSortOrderParam] = useState<{ sortBy: string; order: string }>({
    sortBy: '',
    order: '',
  });
  // const [isExactSearch, setIsExactSearch] = useState<boolean>(false);
  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);
  const [dataRecord, setDataRecord] = useState<DataUpdateRecord | null>(null);
  const [model, setModel] = useState<Model>(() => {
    try {
      if (dataStoreApi.getSync(FORWARD_MODEL)?.data) {
        return JSON.parse(dataStoreApi.getSync(FORWARD_MODEL).data ?? '') === 'company' ? 'company' : 'document';
      } else {
        return 'document';
      }
    } catch (error) {
      return 'document';
    }
  });

  const customsSearchInputRef = useRef<ForwarderSearchRef>(null);

  const [documentList, setDocumentList] = useState<CustomsRecord[]>([]);

  const totalCache = useRef<number | null>(null);

  const layoutLen = layout.length;

  const refresh = useCallback(() => {
    setReqBuyParams(prev => ({
      ...prev,
    }));
  }, []);

  // 搜索类型 采购/供应 改变
  const tabsCompanyChange = (type: SearchType) => {
    const nextValues: ReqForwarder = {
      // page相关保留
      ...defaultInitParams,
      // 上部字段保留
      ...customsSearchInputRef.current?.getValues(),
      // 下面的字段重置
      relationCountryList: [],
      size: pagination.pageSize,
      countryList: [],
      containsExpress: false,
      excludeViewed: false,
      notViewed: false,
    };
    customsSearchInputRef.current?.setValues(nextValues);
    setDataRecord(null);
    resetExcludeViewedObj();
    setReqBuyParams(nextValues);
    setPagination({
      ...pagination,
      from: 1,
      total: 0,
    });
    setSortOrderParam({ ...defaultSortOrderParam });
    setCompanyType(type);
  };
  // to: 'buysers'|'supplier' -> 'goodsShipped' 'company' 'hsCode'
  const handleForwarderChange = (type: ForwarderType) => {
    setDataRecord(null);
    setForwarderType(type);
  };

  const fetchData = (value: ForwarderFormType) => {
    customsDataTracker.trackForwarderSearchManaul({
      keywords: value.queryKeys,
      forwarderType,
      portOfLadings: value.portOfLadings,
      portOfUnLadings: value.portOfUnLadings,
      airlines: value.airlines,
      exactlySearch: value.exactlySearch,
      dataType: {
        buysers: 'buyer',
        suppliers: 'supplier',
        peers: 'peers',
      }[currentCompanyType] as any,
    });
    setReqBuyParams({
      ...value,
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
    layout.length === 1 && setLayout(breadList.slice(0, 2));
  };

  const resetExcludeViewedObj = () => {
    setExcludeViewedObj({
      excludeViewedIndex: 0,
      excludeViewedList: [0],
      startFrom: 0,
    });
  };

  useEffect(() => {
    if (reqSeq.current > 0) {
      model === 'company' ? fetchTableList(reqBuyParams) : fetchDocumentList(reqBuyParams);
    }
    reqSeq.current = reqSeq.current + 1;
  }, [reqBuyParams]);

  const handerTableData = (queryValue: string[], res: ResForwarder) => {
    const { records, total } = res;
    // setRcmdList(res.suggests || []);
    setPagination(prev => {
      return {
        ...prev,
        total: total && total > 0 ? total : 0,
      };
    });
    setIsMorePage(total >= 10000);
    records.map(item => {
      item.name = item.companyName;
      item.topHsCodeStart = item.topHsCode;
      item.topProductDescStart = item.topProductDesc;
      return item;
    });

    setTableList(records);
    setIsLoading(false);
    setTableLoading(false);
  };

  const fetchDocumentList = (currentParams: ReqForwarder) => {
    if (!tableLoading) {
      setIsLoading(true);
    }
    const { from, queryKeys, updateTime } = currentParams;
    const params: ReqForwarder = {
      ...currentParams,
      updateTime: dataRecord?.updateTime || updateTime || '',
      from: from - 1,
      groupByCountry: true,
      async: true,
    };
    if (totalCache.current) {
      params.total = totalCache.current;
    }
    const reqType = currentCompanyType === 'buysers' ? 'buyer' : 'supplier';
    params.startFrom = params.excludeViewed || params.notViewed ? excludeViewedObj.startFrom : undefined;
    edmCustomsApi
      .getRecordListForward({ ...params, async: true, isHuodaiQuery: true }, reqType)
      .then(res => {
        const { records, total } = res;
        setPagination(prev => {
          return {
            ...prev,
            total: total && total > 0 ? total : 0,
          };
        });
        setDocumentList(records);
        setIsLoading(false);
        setSkeletonLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setTableLoading(false);
      })
      .finally(() => {
        searchSourceRef.current = 'manual';
        totalCache.current = null;
        if (tableLoading) {
          setTableLoading(false);
        }
      });
  };

  const fetchTableList = async (currentParams: ReqForwarder) => {
    if (!tableLoading) {
      setIsLoading(true);
    }
    const { from, queryKeys, updateTime } = currentParams;

    const params: ReqForwarder = {
      ...currentParams,
      updateTime: updateTime || dataRecord?.updateTime || '',
      from: from - 1,
      groupByCountry: true,
      // advanceHsCode: currentParams.advanceHsCode ? handleHscodeData(currentParams.advanceHsCode) : currentParams.advanceHsCode,
      async: true,
    };
    if (totalCache.current) {
      params.total = totalCache.current;
    }
    const reqType = currentCompanyType === 'buysers' ? 'buyer' : 'suppler';
    params.startFrom = params.excludeViewed || params.notViewed ? excludeViewedObj.startFrom : undefined;

    edmCustomsApi
      .doGetForwarderList({ ...params, async: true, isHuodaiQuery: true }, reqType)
      .then(res => {
        if (currentParams.from <= 1 && res.records.length < SHOW_EMPTY_NUM && reqType === 'buyer' && forwarderType === ForwarderType.Port) {
          setTableList([]);
          setIsLoading(false);
          setSkeletonLoading(false);
          setTableLoading(false);
        } else {
          handerTableData(queryKeys, res);
          (params.excludeViewed || params.notViewed) && setExcludeViewedObj({ ...excludeViewedObj, startFrom: res.startFrom });
          if (res.asyncId) {
            setSkeletonLoading(true);
            edmCustomsApi
              .doGetForwarderAsyncList({ asyncId: res.asyncId }, reqType)
              .then(data => {
                handerTableData(queryKeys, data);
                setSkeletonLoading(false);
              })
              .finally(() => {
                setSkeletonLoading(false);
              });
          }
        }
      })
      .catch(() => {
        setTableList([]);
        setIsLoading(false);
        setTableLoading(false);
        // setRequestedParams(undefined);
        // setRcmdList([]);
      })
      .finally(() => {
        searchSourceRef.current = 'manual';
        totalCache.current = null;
        // setDocSearchCondition(null);
      });
  };

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
  const onDrawerOpen = (content: recData['content'], zIndex: number, origin?: string) => {
    const rec = (currentIndex: number, recData: recData) => {
      if (recData) {
        if (currentIndex === zIndex) {
          recData.visible = true;
          recData.to = content.to;
          // 注意数据兼容性
          recData.content = { ...content };
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
              content: { ...content },
            };
          }
          rec(currentIndex + 1, recData.children);
        }
      }
    };
    rec(0, recData);
    setRecData({ ...recData, origin });
    console.log('_recDataArr-open', recData);
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
    try {
      if (typeof pageSize === 'number') {
        dataStoreApi.putSync(FORWARDER_LIST, JSON.stringify(pageSize), {
          noneUserRelated: false,
        });
      }
    } catch (error) {}
    setPagination({
      ...pagination,
      from: current as number,
      pageSize: pageSize as number,
    });
    setSortOrderParam({
      ...sorterParams,
      order,
    });
    setReqBuyParams({
      ...reqBuyParams,
      ...sorterParams,
      from: current as number,
      size: pageSize as number,
    });
  };

  const handleCloseIcon = () => {
    customsSearchInputRef.current?.setValues({
      updateTime: '',
    });
    setReqBuyParams({
      ...reqBuyParams,
      ...customsSearchInputRef.current?.getValues(),
      updateTime: '',
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
    setDataRecord(null);
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

  useEffect(() => {
    if (layout.length !== 2) {
      setDataRecord(null);
    }
    if (layout.length === 1) {
      customsSearchInputRef.current?.updateSearchHistoryList();
    }
  }, [layout.length]);

  const renderUpdateData = useMemo(() => {
    if (!dataRecord) {
      return null;
    }
    const showCount = dataRecord.formCompany === 'buysers' ? dataRecord?.buyersUpdateCount : dataRecord.suppliersUpdateCount;
    return (
      <Skeleton active loading={isLoading} paragraph={false}>
        <div className={styles.latestData}>
          <span>{dataRecord.updateTime}</span>
          共更新了
          <span>{thousandSeparator(showCount + '')}</span>
          条贸易数据
          {showCount >= 10000 && <>，为您展示前10000条数据</>}
          <div className={styles.icon} onClick={handleCloseIcon}>
            <CloseIcon />
          </div>
        </div>
      </Skeleton>
    );
  }, [dataRecord, isLoading]);

  const onCell = (record: DataUpdateRecord, _: number, colName: string) => {
    const nextParams: ReqForwarder = {
      ...reqBuyParams,
      ...defaultInitParams,
      from: 1,
      size: pagination.pageSize,
      portOfLadings: [],
      portOfUnLadings: [],
      queryType: ForwarderType.Port,
      updateTime: record.updateTime,
      timeFilter: 'all',
    };
    customsSearchInputRef.current?.setValues(nextParams);
    setPagination({
      ...pagination,
      from: 1,
      total: 0,
    });
    setReqBuyParams(nextParams);
    setLayout(breadList.slice(0, 2));
    if (colName !== 'suppliersUpdateCount') {
      setCompanyType('buysers');
    } else {
      setCompanyType('suppliers');
    }
    // TODO 原逻辑是搜公司的，货代这里没有「公司」这个类型了 怎么整
    setDataRecord({
      ...record,
      formCompany: colName === 'suppliersUpdateCount' ? 'suppliers' : 'buysers',
    });
  };

  const handleNationClick = (nation: resCustomsFollowCountry) => {
    customsSearchInputRef.current?.setValues({
      countryList: [nation.country],
    });
    const currentValues = customsSearchInputRef.current?.getValues();
    const params: ReqForwarder = {
      ...reqBuyParams,
      ...currentValues,
      from: 1,
      size: pagination.pageSize,
    };
    setReqBuyParams(params);
    setLayout(breadList.slice(0, 2));
  };

  const [customsStatCount, customsStatDate] = useCustomsStat(layoutLen === 1);
  const gloababSearchStat = useGlobalSearchStat(layoutLen === 1);

  const renderCountUp = useCallback(
    () => <MyCountUp prefix={getIn18Text('LEIJIHAIGUANSHUJU')} className={styles.countup} end={customsStatCount} date={customsStatDate} />,
    [customsStatCount, customsStatDate]
  );

  useEffect(() => {
    if (curExcavate) {
      setTableList(prev => {
        const targetIndex = prev.findIndex(item => item.chineseCompanyId === curExcavate.chineseCompanyId);
        if (targetIndex > -1) {
          return prev.map((item, index) => {
            if (index !== targetIndex) {
              return item;
            } else {
              return {
                ...item,
                chineseCompanyId: curExcavate.chineseCompanyId,
                excavateCnCompanyStatus: 1,
                chineseCompanyContactCount: curExcavate.chineseCompanyContactCount,
              };
            }
          });
        } else {
          return prev;
        }
      });
    }
    return () => {
      forwarderDispatch({
        type: 'CHANGE',
        payload: null,
      });
    };
  }, [curExcavate, forwarderDispatch]);

  const searchRecData = useMemo(() => {
    const queryKeys = customsSearchInputRef.current?.getValues().queryKeys;
    const hscodeList: string[] = [];
    const goodsShippedList: string[] = [];
    queryKeys &&
      queryKeys.forEach(item => {
        if (/^\d+$/g.test(item)) {
          hscodeList.push(item);
        } else {
          goodsShippedList.push(item);
        }
      });
    const hscodeValue = hscodeList.length ? hscodeList.join('|') : '';
    return {
      ...recData,
      content: {
        ...recData.content,
        tabOneValue: 'all',
        queryValue: hscodeValue,
        otherGoodsShipped: goodsShippedList,
        goPort: customsSearchInputRef.current?.getValues().portOfLadings,
        endPort: customsSearchInputRef.current?.getValues().portOfUnLadings,
      },
    };
  }, [
    customsSearchInputRef.current?.getValues().queryKeys,
    recData,
    customsSearchInputRef.current?.getValues().portOfLadings,
    customsSearchInputRef.current?.getValues().portOfUnLadings,
  ]);
  const searchSimilarity = () => {
    const nextValues: ReqForwarder = {
      // page相关保留
      ...defaultInitParams,
      // 上部字段保留
      ...customsSearchInputRef.current?.getValues(),
      // 出发港口改成固定的相似港口
      portOfLadings: [
        { value: 'NHAVA SHEVA', label: '印度果阿邦' },
        { value: 'NEW DELHI', label: '德里' },
        { value: 'CHENNAI', label: '钦奈' },
        { value: 'HOCHIMINH', label: '胡志明市' },
        { value: 'HANOI', label: '河内市' },
      ],
    };
    customsSearchInputRef.current?.setValues(nextValues);
    fetchData(nextValues);
  };

  return (
    <div
      style={{ minHeight: isWebWmEntry ? 'auto' : '100%', position: 'relative' }}
      className={classnames(styles.customsContainer, {
        [styles.customsContainerInit]: layout.length === 1,
        [styles.customsContainerInitCopyright]: layout.length === 1,
      })}
    >
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
                <h3 className={styles.title}>{layout[0]}</h3>
                <div className={styles.content}>
                  {tips.map((item, index) => (
                    <span key={index}>
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
            <CustomsUpdateTime className={styles.updateTime} initLayout={layout.length === 1} />
            {layout.length === 2 && (
              <CustomerTabs
                className={styles.companyTabs}
                defaultActiveKey="buysers"
                tabList={[
                  {
                    label: '搜采购商',
                    value: 'buysers',
                  },
                  {
                    label: '搜供应商',
                    value: 'suppliers',
                  },
                ]}
                onChange={tabsCompanyChange}
                activeKey={currentCompanyType}
              />
            )}
            {/* 进出口商的搜索栏 */}
            <ForwarderSearch
              ref={customsSearchInputRef}
              className={styles.serarchTop}
              onSearch={fetchData}
              needValitor={!dataRecord}
              searchType={currentCompanyType}
              defaultValues={defaultInitParams}
              onForwarderTypeChange={handleForwarderChange}
              afterReset={() => {
                setTableList([]);
                setDocumentList([]);
                setPagination(prev => ({
                  ...prev,
                  from: 1,
                  total: 0,
                }));
                setSortOrderParam({
                  order: '',
                  sortBy: '',
                });
              }}
              onValuesChange={() => {
                resetExcludeViewedObj();
              }}
              initLayout={layout.length === 1}
              model={model}
            />
            {layout.length > 1 && (
              <>
                {/* 表格栏 */}
                <div className={styles.showArea}>
                  <div className={styles.cusCntTab}>
                    <Tabs
                      size={'small'}
                      activeKey={model}
                      onChange={value => {
                        if (value === 'document') {
                          fetchDocumentList({
                            ...reqBuyParams,
                            ...customsSearchInputRef.current?.getValues(),
                            from: 1,
                          });
                        } else {
                          fetchTableList({
                            ...reqBuyParams,
                            ...customsSearchInputRef.current?.getValues(),
                            from: 1,
                          });
                          dataStoreApi.putSync(FORWARD_MODEL, JSON.stringify('company'), {
                            noneUserRelated: false,
                          });
                        }
                        setPagination(prev => ({
                          ...prev,
                          from: 1,
                          total: 0,
                        }));
                        setModel(value as Model);
                      }}
                    >
                      <TabPane tab="单据" key="document" />
                      <TabPane tab="公司" key="company" />
                    </Tabs>
                  </div>
                  <section className={styles.filterData}>
                    {/* {renderFilterRes} */}
                    {renderUpdateData}
                  </section>
                  <Skeleton active loading={isLoading} paragraph={{ rows: 4 }}>
                    {model === 'company' && (
                      <BuysersTable
                        scence="forwarder"
                        sticky={{
                          offsetHeader: 106,
                        }}
                        refresh={refresh}
                        searchType="forwarder"
                        excludeViewed={reqBuyParams.excludeViewed || reqBuyParams.notViewed}
                        setExcludeViewedObj={setExcludeViewedObj}
                        excludeViewedObj={excludeViewedObj}
                        onSamilPageChange={onSamilPageChange}
                        tableList={tableList}
                        type={currentCompanyType}
                        onChangeTable={setTableList}
                        sortOrderParam={sortOrderParam}
                        pagination={pagination}
                        onChange={onTableChange}
                        onDrawerOpen={onDrawerOpen}
                        isMorePage={isMorePage}
                        skeletonLoading={skeletonLoading}
                        tableLoading={tableLoading}
                        // 只有采购商和港口的搜索使用搜相似出发港的缺省文案
                        locale={
                          currentCompanyType === 'buysers' && forwarderType === ForwarderType.Port
                            ? {
                                emptyText: <ForwarderDataEmpty onSearch={searchSimilarity} />,
                              }
                            : undefined
                        }
                      />
                    )}
                    {model === 'document' && (
                      <ForwardTable
                        tableLoading={tableLoading}
                        tableList={documentList}
                        pagination={pagination}
                        onChange={onTableChange}
                        onDrawerOpen={onDrawerOpen}
                        type={currentCompanyType}
                        queryKey={customsSearchInputRef.current?.getValues().queryKeys}
                      />
                    )}
                  </Skeleton>
                </div>
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
              </>
            )}
            {/* 首页状态下的 收藏国家栏 数据更新记录栏 版权栏 */}
            {layout.length === 1 && <FollowNation onClick={handleNationClick} />}
            {layout.length === 1 && <DataUpdate type="forwarder" onCell={onCell} />}
          </div>
        </div>
      </div>
      {layout.length === 1 && (
        <div className={styles.copyRight}>
          {getIn18Text('BANQUANSUOYOU\uFF1A2022\uFF0CBIAOPUQUANQIUSHICHANGQINGBAOGONGSI\uFF08S&P Global Market Intelligence\uFF09JIFUSHUJIGOU\uFF0CBAOLIUSUOYOUQUANLI')}
          <a href="https://qiye.163.com/sirius/doc/hgmz.html" target="_blank" rel="noreferrer">
            免责声明
          </a>
        </div>
      )}
    </div>
  );
};
export default () => {
  return (
    <ForwarderProvider>
      <ForwarderData />
    </ForwarderProvider>
  );
};
