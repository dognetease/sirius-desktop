import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CountryList from './component/CountryList';
import DocSearchInput, { CustomsSearchType, DocSearchInputRef, tabs } from './component/SearchInput';
import {
  api,
  apis,
  CustomsRecord,
  CustomsRecordReq as CustomsRecordPostReq,
  DataTrackerApi,
  EdmCustomsApi,
  GlobalSearchCompanyDetail,
  SearchReferer,
  SuggestType,
  resCustomsFollowCountry,
} from 'api';
import { Table, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import FilterForm, { FilterFormRef } from './component/Filter';
import CustomsRecordDetail from './component/CustomsRecordDetail/CustomsRecordDetail';
import moment from 'moment';
import TableItem from './component/TableItem';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import classNames from 'classnames';
import styles from './index.module.scss';
import { getFixedNoneZeroValue } from './component/CustomsRecordDetail/util';
import { CustomsDataTableListClick, customsDataTracker } from '../../tracker/tracker';
import HistoryDropDown from '@/components/Layout/globalSearch/search/HistoryDorpDown';
import usePortListHook, { useHotPortList } from './hooks/usePortListHook';
import PortDropList, { PortItemList } from './component/PortDropList/PortDropList';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import { DetailLevelStatus } from '@/components/Layout/globalSearch/search/search';
import { IGrubProcessItem } from '@/components/Layout/globalSearch/search/GrubProcess/GrubProcess';
import SuggestDropDown from '@/components/Layout/globalSearch/search/SuggestDropDown';
import { aiKeyWrodsAndType } from '@/components/Layout/CustomsData/customs/customs';
import DocSearchEmpty from './component/DocSearchEmpty/DocSearchEmpty';
import RcmdRow from '@/components/Layout/globalSearch/search/RcmdRow/RcmdRow';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import { getIn18Text } from 'api';
import HistroyExtra from '@/components/Layout/globalSearch/search/HistroyExtra';
import { SEARCH_OVER_100_CHAR } from '../constant';
import GuideSearch from '../../../components/guideSearch/guideSearch';
import { endKeyReg, domainReg } from '../../../globalSearch/search/search';
import { ReactComponent as GuideCompany } from '@/images/icons/customs/guide_company.svg';
// import { ReactComponent as GuideCompany } from '@/images/icons/customs/guide_domain.svg';
import { ReactComponent as GuideHscode } from '@/images/icons/customs/guide_hscode.svg';
import CollectData from '@/components/Layout/globalSearch/search/collectDataTrack/collectDataTrack';
import useGuideSearch from '../hooks/useGuideSearch';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { useCustomsCountryHook } from './component/CountryList/customsCountryHook';

const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const CustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const CUSTOMS_RECORD_HISTORY_KEY_PREFIX = 'CUSTOMS_RECORD_HISTORY_KEY_PREFIX_';
const dataStoreApi = api.getDataStoreApi();
const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

interface CustomsRecordReq extends CustomsRecordPostReq {
  nearSynonymList?: string[];
}

const getSugguestType: (type: CustomsSearchType) => SuggestType | undefined = type => {
  switch (type) {
    case 'goodsShipped':
      return 0;
    case 'queryCompany':
      return 3;
    case 'port':
      return 4;
    default:
      return undefined;
  }
};

const { TabPane } = Tabs;

export type DocSearchCondition = {
  type: CustomsSearchType;
  query: string;
} | null;

type customsType = 'customs' | 'buysers' | 'suppliers';
interface DocSearchProps {
  layout: string[];
  onChangeLayout?(len: number): void;
  onViewRecord?(r: CustomsRecord): void;
  getSearchType?(value: string): void;
  aiKeyword?: aiKeyWrodsAndType & { searchType?: SearchReferer };
  aiHistorySearchType?: string;
  cuurentTabType?: string;
  defaultSearchType?: CustomsSearchType;
  searchCondition?: DocSearchCondition;
  getInputValue?(type: string, value: string): void;
  publicSearchValue?: string;
  publicSearchType?: publicType;
  setCollectDataList?(value: CustomsRecord, params: string): void;
  getLoadingStatus?: () => void;
  customsCategoryType: publicType;
  tabCompanyType: Array<{ label: string; value: customsType }>;
  setCompanyType: (value: customsType) => void;
  collectCountry?: resCustomsFollowCountry;
  checkedNearSynonymList?: string[];
  setCusCategory?: (value: publicType) => void;
  getCustomsNearSynonymList?: (value: string[]) => void;
}

type publicType = 'goodsShipped' | 'company' | 'hsCode' | 'port';

export const getDefaultReq = () => {
  const defaultReq: CustomsRecordReq = {
    size: 10,
    page: 1,
    companyType: -1,
    portType: 0,
    recordType: 'Import',
    begin: moment().add(-6, 'month').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD'),
    goodsShipped: '',
    port: '',
    hsCode: '',
    queryCompany: '',
    conCompany: '',
    shpCompany: '',
    conCountryList: [],
    shpCountryList: [],
    otherGoodsShipped: ['en', 'es'],
  };
  return defaultReq;
};

const getHistory = (type: CustomsSearchType) => {
  const { data } = dataStoreApi.getSync(CUSTOMS_RECORD_HISTORY_KEY_PREFIX + type, {
    noneUserRelated: false,
  });
  if (data) {
    try {
      const res: Array<string | string[]> = JSON.parse(data);
      if (Array.isArray(res)) {
        return res.filter(e => typeof e === 'string' || Array.isArray(e));
      }
      return [];
    } catch (error) {
      return [];
    }
  } else {
    return [];
  }
};

const addRawHistory = (type: CustomsSearchType, value: string | string[], _prev?: Array<string | string[]>) => {
  const prev = _prev || getHistory(type);
  const targetValue = typeof value === 'string' ? value : value[0];
  let result = prev.slice();
  const list = prev.slice().map(his => (typeof his === 'string' ? his : his[0]));
  const index = list.indexOf(targetValue);
  if (index > -1) {
    result.splice(index, 1, value);
  } else {
    result.unshift(value);
    result = result.slice(0, 7);
  }
  dataStoreApi.putSync(CUSTOMS_RECORD_HISTORY_KEY_PREFIX + type, JSON.stringify(result), {
    noneUserRelated: false,
  });
  return result;
};

const getDataParams: (params: Partial<CustomsRecordReq>) => {
  searchType: string;
  searchValue: string;
} = params => {
  const raw = {
    goodsShipped: params.goodsShipped,
    hsCode: params.hsCode,
    queryCompany: params.queryCompany,
    port: params.port,
  };
  const searchType: string[] = [];
  const searchValue: string[] = [];
  Object.keys(raw).forEach(key => {
    const val = raw[key as keyof typeof raw];
    if (val) {
      searchType.push(key);
      searchValue.push(val);
    }
  });
  return {
    searchType: searchType.join('-'),
    searchValue: searchValue.join('-'),
  };
};

const tabTypes = tabs.map(t => t.value);

const DocSearch: React.FC<DocSearchProps> = ({
  layout,
  onChangeLayout,
  cuurentTabType,
  defaultSearchType = 'goodsShipped',
  searchCondition,
  getInputValue,
  publicSearchValue,
  customsCategoryType,
  tabCompanyType,
  setCompanyType,
  collectCountry,
  checkedNearSynonymList: docCheckedNearList,
  setCusCategory,
  getCustomsNearSynonymList,
}) => {
  const [req, setReq] = useState<CustomsRecordReq>(getDefaultReq());
  const [requestedReq, setRequestedReq] = useState<Partial<CustomsRecordReq & { searchType: CustomsSearchType }>>({});
  const [goodsShippedKeywords, setGoodsShippedKeywords] = useState<string[]>([]);
  const [list, setList] = useState<CustomsRecord[]>([]);
  const [rcmdList, setRcmdList] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const searchSourceRef = useRef<SearchReferer>('manual');
  const [currentRecord, setCurrentRecord] = useState<CustomsRecord>();
  const [defaultFormValue, setDefaultFormValue] = useState<CustomsRecordReq>();
  const [inputValues, setInputValues] = useState<[CustomsSearchType, string]>([customsCategoryType === 'company' ? 'queryCompany' : customsCategoryType, '']);
  const [currentSearchType] = inputValues;
  const [historyList, setHistoryList] = useState<Array<string | string[]>>(getHistory(currentSearchType));
  const inputRef = useRef<DocSearchInputRef>(null);
  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const [portListOpen, setPortListOpen] = useState<boolean>(false);
  const [tranlateValue, setTranlateValue] = useState<string>('');
  const [originValue, setOriginValue] = useState<string>('');
  const portList = useHotPortList();
  const formRef = useRef<FilterFormRef>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [detailId, setDetailId] = useState<string>('');
  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);
  const getCompanyIdLoading = useRef<boolean>(false);
  const [checkedNearSynonymList, setCheckedNearSynonymList] = useState<string[]>([]);
  const forceUseParamNearSyn = useRef<boolean>(false);
  const [originCountry, setOriginCountry] = useState<{
    shpCountryList: string[][];
    conCountryList: string[][];
  }>({
    shpCountryList: [],
    conCountryList: [],
  });

  const [guideSearchShow, setGuideSearchShow] = useState<boolean>(false);

  const [guideSearchCustoms, guideInfo, style] = useGuideSearch({
    show: guideSearchShow,
    ref: inputRef.current?.getInputWrapper?.(),
    from: 'guomao',
  });

  const [sensitive, setSensitive] = useState<boolean>(false);
  const [continentList] = useCustomsCountryHook(true, true);

  const handleSearchCompany = async (params: { name?: string; country?: string }) => {
    const { name, country } = params;
    if (name && country && !getCompanyIdLoading.current) {
      getCompanyIdLoading.current = true;
      try {
        const [{ id }] = await CustomsApi.doGetIdsByCompanyList({
          companyList: [
            {
              companyName: name,
              country,
            },
          ],
        });
        setDetailId(id as string);
        setShowDetail(true);
      } catch (error) {}
      getCompanyIdLoading.current = false;
    }
  };

  const colums: ColumnsType<CustomsRecord> = [
    // {
    //   title: '',
    //   width: '1px',
    //   render(value, record, index) {
    //     return <CollectData onInterSection={() => {
    //       // handleCollectData(record)
    //       setCollectDataList && setCollectDataList(record, inputValues[1])
    //     }} />;
    //   },
    // },
    {
      dataIndex: 'shpmtDate',
      title: getIn18Text('RIQI'),
      render(value) {
        return <div className={styles.dateWrapper}>{moment(value).format('YYYY-MM-DD')}</div>;
      },
    },
    {
      dataIndex: 'originConName',
      title: getIn18Text('CAIGOUSHANG'),
      render(value, record) {
        return (
          <TableItem
            onSearchCompany={() => {
              customsDataTracker.trackTableListClick(CustomsDataTableListClick.Company, getDataParams(requestedReq));
              handleSearchCompany({
                name: record.conName,
                country: record.conCountry,
              });
            }}
            text={value}
            tag={record.conCountryCn}
            highLightText={requestedReq.queryCompany}
            copy
            tooltip
          />
        );
      },
    },
    {
      dataIndex: 'originShpName',
      title: getIn18Text('GONGYINGSHANG'),
      render(value, record) {
        return (
          <TableItem
            onSearchCompany={() => {
              customsDataTracker.trackTableListClick(CustomsDataTableListClick.Company, getDataParams(requestedReq));
              handleSearchCompany({
                name: record.shpName,
                country: record.shpCountry,
              });
            }}
            text={value}
            tag={record.shpCountryCn}
            highLightText={requestedReq.queryCompany}
            copy
            tooltip
          />
        );
      },
    },
    {
      dataIndex: 'hsCode',
      title: 'HSCode',
      render(value) {
        return <TableItem text={value} highLightText={handleHscodeData(requestedReq.hsCode)} />;
      },
    },
    {
      dataIndex: 'goodsShipped',
      title: getIn18Text('SHANGPINMIAOSHU'),
      render(value) {
        return <TableItem text={value} translate highLightText={goodsShippedKeywords} copy tooltip placement="top" />;
      },
    },
    {
      title: getIn18Text('CHUFAGANG'),
      dataIndex: 'portOfLading',
      render(value) {
        return <TableItem text={value} highLightText={requestedReq.port} tooltip copy />;
      },
    },
    {
      title: getIn18Text('MUDIGANG'),
      dataIndex: 'portOfUnLading',
      render(value) {
        return <TableItem text={value} highLightText={requestedReq.port} copy tooltip />;
      },
    },
    {
      title: getIn18Text('SHULIANG'),
      dataIndex: 'itemQuantity',
      render(value, record) {
        return <TableItem text={Number(value) === 0 ? null : `${value}${record.itemUnit ?? ''}`} noneText={getIn18Text('WEIGONGKAI')} />;
      },
    },
    {
      title: getIn18Text('JINE（MEIYUAN）'),
      dataIndex: 'valueOfGoodsUSD',
      render(value) {
        return <TableItem text={Number(value) === 0 ? null : value} noneText={getIn18Text('WEIGONGKAI')} />;
      },
    },
    {
      title: getIn18Text('GONGJIN'),
      dataIndex: 'weightKg',
      render(value) {
        return <TableItem text={getFixedNoneZeroValue(value)} noneText={getIn18Text('WEIGONGKAI')} />;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      render(_, record) {
        return (
          <span
            className={styles.opBtn}
            onClick={() => {
              customsDataTracker.trackTableListClick(CustomsDataTableListClick.View, getDataParams(requestedReq));
              setCurrentRecord(record);
              try {
                trackerApi.track('pc_markting_customs_data_trade_data_viewdetail', {
                  page: req.page,
                  total: total,
                });
              } catch (error) {}
            }}
          >
            {getIn18Text('CHAKAN')}
          </span>
        );
      },
    },
  ];

  const handleInputChange = (stype: CustomsSearchType, svalue: string) => {
    if (stype !== inputValues[0]) {
      // setRcmdList([]);
      setSearchHistoryOpen(false);
      setReq(getDefaultReq());
      setDefaultFormValue(getDefaultReq());
      setCheckedNearSynonymList([]);
      setRequestedReq({});
    } else {
      setSearchHistoryOpen(!svalue);
      setReq(prev => ({
        ...prev,
        [stype]: svalue,
      }));
    }
    setGuideSearchShow(false);
    setSuggestOpen(!!svalue);
    setOriginValue('');
    setTranlateValue('');
    setInputValues([stype, svalue]);
  };

  useEffect(() => {
    setHistoryList(getHistory(currentSearchType));
  }, [currentSearchType]);

  useEffect(() => {
    handleReset('tab');
    if (cuurentTabType === 'customs' && publicSearchValue) {
      setInputValues([transFromCusType, publicSearchValue]);
      layout.length === 1
        ? ''
        : handleSearch({
            value: publicSearchValue,
            type: transFromCusType,
            conCountryList: req.conCountryList as string[],
          });
    } else if (!publicSearchValue) {
      setInputValues([transFromCusType, '']);
    }
  }, [cuurentTabType]);

  useEffect(() => {
    if (collectCountry?.continent && (cuurentTabType === 'customs' || customsCategoryType === 'port')) {
      const next: CustomsRecordReq = {
        ...req,
        ...formRef.current?.getFieldValues(),
        conCountryList: [collectCountry.country],
        [inputValues[0]]: inputValues[1],
      };
      setReq({
        ...next,
      });
      doFetchData(next);
      setOriginCountry(prv => {
        return {
          conCountryList: [...prv.conCountryList, [collectCountry.continent as string, collectCountry.country]],
          shpCountryList: prv.shpCountryList,
        };
      });
      setDefaultFormValue({
        ...next,
        conCountryList: [[collectCountry?.continent, collectCountry.country]],
      });
    }
  }, [collectCountry]);

  const addHistory = (type: CustomsSearchType, value: string | string[]) => {
    setHistoryList(prev => {
      const result = addRawHistory(type, value, prev);
      return result;
    });
  };

  const getReqType: (tp: CustomsSearchType) => CustomsRecordReq['type'] = tp => {
    switch (tp) {
      case 'goodsShipped':
        return 'goodsShipped';
      case 'hsCode':
        return 'hsCode';
      case 'port':
        return 'port';
      case 'queryCompany':
        return 'company';
      default:
        return 'goodsShipped';
    }
  };

  useEffect(() => {
    if (!guideSearchShow) {
      setInputValues([transFromCusType, '']);
      setList([]);
      setDefaultFormValue(getDefaultReq());
      formRef.current?.resetFieldValues();
      setRequestedReq({});
      setReq(getDefaultReq());
      setGuideSearchShow(false);
      setTotal(0);
      setOriginCountry({
        shpCountryList: [],
        conCountryList: [],
      });
    }
    setGuideSearchShow(false);
    setCheckedNearSynonymList([]);
    // setPublicSearchValue('')
  }, [customsCategoryType]);

  const transFromCusType = useMemo(() => {
    return customsCategoryType === 'company' ? 'queryCompany' : customsCategoryType;
  }, [customsCategoryType]);

  const doFetchData = async (params: CustomsRecordReq, searchType?: CustomsSearchType) => {
    if (
      !(
        params.queryCompany ||
        params.hsCode ||
        params.goodsShipped ||
        params.port ||
        params.conCountryList?.length ||
        params.shpCountryList?.length ||
        params.conCompany ||
        params.shpCompany
      )
    ) {
      message.warn('请输入商品描述或HSCode或公司名称或港口名称或选择国家');
      return;
    } else if (Number(params[searchType || inputValues[0]]?.length) > 100) {
      message.warn(SEARCH_OVER_100_CHAR);
      return;
    } else if (params.countryList && params.countryList.length > 5) {
      message.warn('最多选择5个国家');
      return;
    } else if (!params.begin || !params.end) {
      message.warn('请选择查询时间范围');
      return;
    } else if (/^\s*$/.test(params[searchType || inputValues[0]] ?? '')) {
      message.warn('请输入关键词');
      return;
    }

    params.type = getReqType(searchType || inputValues[0]);
    const lastSearchedValue = requestedReq.goodsShipped;
    let nextNearSynonymList: string[];
    // 上次搜索的关键词和这次不一致或者 type 不是Product
    if (lastSearchedValue !== params.goodsShipped || params.type !== 'goodsShipped') {
      nextNearSynonymList = [];
    } else {
      nextNearSynonymList = params.nearSynonymList || checkedNearSynonymList;
    }
    if (forceUseParamNearSyn.current) {
      nextNearSynonymList = params.nearSynonymList || [];
      forceUseParamNearSyn.current = false;
    }
    setCheckedNearSynonymList(nextNearSynonymList);
    // 考虑layout的情况
    if (layout.length === 2) {
      // 列表页
      tabTypes.forEach(t => {
        const insertV = params[t];
        if (insertV) {
          if (t === 'goodsShipped' && nextNearSynonymList) {
            addRawHistory(t, [insertV, ...nextNearSynonymList]);
          } else {
            addRawHistory(t, insertV);
          }
        }
      });
      setHistoryList(getHistory(inputValues[0]));
    } else if (layout.length === 1) {
      // 首页
      const [type] = inputValues;
      const insertHistory = params[type];
      if (type && insertHistory) {
        if (type === 'goodsShipped' && nextNearSynonymList) {
          addHistory(type, [insertHistory, ...nextNearSynonymList]);
        } else {
          addHistory(type, insertHistory);
        }
      }
    }
    setOriginValue('');
    setTranlateValue('');
    onChangeLayout?.(2);
    setTableLoading(true);
    // setRcmdList([]);
    setReq(params);
    let otherGoodsShipped: string[] = [];
    if (currentSearchType === 'goodsShipped' && params.goodsShipped && params.otherGoodsShipped && params.otherGoodsShipped.length > 0) {
      await Promise.all(
        params.otherGoodsShipped.map(toLang => {
          return CustomsApi.customsTranslate({
            q: params.goodsShipped as string,
            from: 'auto',
            to: toLang,
          }).then(r => {
            const result = r.translation && r.translation.length ? r.translation[0] : '';
            return result;
          });
        })
      ).then(transList => {
        otherGoodsShipped = transList;
      });
    }
    otherGoodsShipped = otherGoodsShipped.concat(nextNearSynonymList);
    delete params.nearSynonymList;
    try {
      trackerApi.track('pc_markting_customs_data_trade_data_search', {
        ...params,
      });
    } catch (error) {}
    CustomsApi.doGetCustomsRecordList({
      ...params,
      referer: searchSourceRef.current,
      otherGoodsShipped,
      hsCode: params.hsCode ? handleHscodeData(params.hsCode) : params.hsCode,
    })
      .then(res => {
        setList(res.records);
        setTotal(res.total);
        setGoodsShippedKeywords(res.goodsShippedKeywords || []);
        // setRcmdList(res.suggests || []);
        const [type] = inputValues;
        customsDataTracker.trackCustomsSearchResult({
          hasResult: res.records.length > 0,
          keyword: params[type] || '',
          searchType: type === 'queryCompany' ? 'company' : type,
          dataType: 'tradeData',
        });
        if (sensitive) {
          setSensitive(false);
        }
      })
      .catch(() => {
        setList([]);
        setReq(prev => ({
          ...prev,
          page: 1,
        }));
        setTotal(0);
        setTableLoading(false);
        setSensitive(true);
        setGuideSearchShow(false);
        // setRcmdList([]);
      })
      .finally(() => {
        setTableLoading(false);
        setRequestedReq({
          ...params,
          searchType: inputValues[0],
        });
        // 每次请求完成后重置搜索来源为手动
        searchSourceRef.current === 'manual';
      });
  };

  const handleHscodeData: (params: string | undefined) => string | undefined = (params: string | undefined) => {
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

  const handleSearch = (params: { value: string; type: CustomsSearchType; nearSynonymList?: string[]; conCountryList?: string[] }) => {
    if (params.type !== 'port' && !!params.value) {
      getInputValue && getInputValue(params.type === 'queryCompany' ? 'company' : params.type, params.value);
    }
    const next: CustomsRecordReq = {
      ...req,
      ...formRef.current?.getFieldValues(),
      nearSynonymList: params.nearSynonymList,
      conCountryList: params.conCountryList ?? formRef.current?.getFieldValues().conCountryList,
      [params.type]: params.value,
      page: 1,
    };
    customsDataTracker.trackCustomsSearchManaul({
      keyword: params.value,
      searchType: params.type,
      dataType: 'tradeData',
    });
    setSuggestOpen(false);
    guideSearchCustoms(params.value, params.type);
    doFetchData(next, params.type);
    // setDefaultFormValue(next);
  };
  const handleFinish = (params: CustomsRecordReq) => {
    const next: CustomsRecordReq = {
      ...req,
      ...params,
      [inputValues[0]]: inputValues[1],
      page: 1,
    };
    if (inputValues[0] !== 'port' && inputValues[1]) {
      getInputValue && getInputValue(inputValues[0] === 'queryCompany' ? 'company' : inputValues[0], inputValues[1]);
    }
    guideSearchCustoms(inputValues[1], inputValues[0]);
    doFetchData(next);
  };

  const handleReset = (param?: string | undefined) => {
    formRef.current?.resetFieldValues();
    if (param === 'tab') {
      setDefaultFormValue({
        ...getDefaultReq(),
        conCountryList: originCountry.conCountryList as unknown as string[],
      });
      setReq({
        ...getDefaultReq(),
        conCountryList: req.conCountryList,
      });
    } else {
      setReq(getDefaultReq());
      setOriginCountry({
        shpCountryList: [],
        conCountryList: [],
      });
    }
    setTotal(0);
    setList([]);
  };

  const level = layout.length;
  useEffect(() => {
    if (level < 3) {
      setCurrentRecord(undefined);
    }
    if (level === 1) {
      setReq(getDefaultReq());
      setRequestedReq({});
      setGuideSearchShow(false);
      setDefaultFormValue(getDefaultReq());
      formRef.current?.resetFieldValues();
      setCheckedNearSynonymList([]);
      setTotal(0);
      setOriginCountry({
        shpCountryList: [],
        conCountryList: [],
      });
      setList([]);
    }
  }, [level]);

  const guideSearchHandle = () => {
    setInputValues([guideInfo.searchType as CustomsSearchType, inputValues[1]]);
    setCusCategory && setCusCategory(guideInfo.searchType === 'queryCompany' ? 'company' : guideInfo.searchType);
    getInputValue && getInputValue(guideInfo.searchType === 'queryCompany' ? 'company' : guideInfo.searchType, inputValues[1]);
    const next: CustomsRecordReq = {
      ...getDefaultReq(),
      ...formRef.current?.getFieldValues(),
      // nearSynonymList: params.nearSynonymList,
      // hsCode: formRef.current?.getFieldValues().hsCode ? handleHscodeData(formRef.current?.getFieldValues().hsCode) : formRef.current?.getFieldValues().hsCode,
      [guideInfo.searchType]: inputValues[1],
      page: 1,
    };
    doFetchData(next, guideInfo.searchType as CustomsSearchType);
    // setGuideSearchShow(false);
  };

  useEffect(() => {
    if (guideInfo.show !== guideSearchShow) {
      setGuideSearchShow(guideInfo.show);
    }
  }, [guideInfo.show]);

  const { type: searchConditionType, query: searchConditionQuery } = searchCondition || {};
  useEffect(() => {
    if (searchConditionType && searchConditionQuery) {
      setInputValues([searchConditionType, searchConditionQuery]);
      const vals = getDefaultReq();
      doFetchData(
        {
          ...vals,
          [searchConditionType]: searchConditionQuery,
        },
        searchConditionType
      );
      setDefaultFormValue(vals);
    }
  }, [searchConditionType, searchConditionQuery]);

  useEffect(() => {
    docCheckedNearList && docCheckedNearList.length > 0 && setCheckedNearSynonymList(docCheckedNearList);
  }, [docCheckedNearList]);

  const renderSearchInput = () => (
    <div style={{ position: 'relative' }}>
      <DocSearchInput
        originValue={originValue}
        tranlateValue={tranlateValue}
        checkedNearSynonymList={checkedNearSynonymList}
        searchedValue={requestedReq.goodsShipped}
        onFocus={() => {
          setSearchHistoryOpen(true);
          setPortListOpen(true);
        }}
        ref={inputRef}
        combineValue={inputValues}
        onCombineChange={handleInputChange}
        layoutLevel={layout.length}
        onDocSearch={value => {
          handleSearch(value);
        }}
        getCustomsNearSynonymList={getCustomsNearSynonymList}
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
      <SuggestDropDown
        hideCount
        blurTarget={inputRef.current?.getInputWrapper()}
        target={inputRef.current?.getWrapperRef()}
        type="customs"
        sugguestType={getSugguestType(inputValues[0])}
        keyword={inputValues[1]}
        open={suggestOpen && (inputValues[0] === 'goodsShipped' || inputValues[0] === 'queryCompany' || inputValues[0] === 'port')}
        changeOpen={setSuggestOpen}
        onSelect={kwd => {
          const [type] = inputValues;
          const next: CustomsRecordReq = {
            ...req,
            ...formRef.current?.getFieldValues(),
            [type]: kwd,
          };
          searchSourceRef.current = 'suggest';
          setInputValues([type, kwd]);
          setSuggestOpen(false);
          if (type !== 'port') {
            getInputValue && getInputValue(type === 'queryCompany' ? 'company' : type, kwd);
          }
          doFetchData(next);
          setDefaultFormValue(next);
        }}
      />
      <HistoryDropDown
        blurTarget={inputRef.current?.getInputWrapper()}
        renderExtra={names => <HistroyExtra names={names} />}
        renderFooter={
          currentSearchType !== 'port'
            ? undefined
            : () => (
                <div className={styles.portListWrapper}>
                  <p className={styles.portListTitle}>
                    <span>热门港口</span>
                  </p>
                  <PortItemList
                    portList={portList}
                    onSelectPort={p => {
                      const next: CustomsRecordReq = {
                        ...req,
                        ...formRef.current?.getFieldValues(),
                        page: 1,
                        port: p.name,
                      };
                      setInputValues(['port', p.name]);
                      setSearchHistoryOpen(false);
                      doFetchData(next, 'port');
                    }}
                  />
                </div>
              )
        }
        hideSearchIcon={currentSearchType === 'port'}
        itemLayout={currentSearchType === 'port' ? 'inline' : 'vertical'}
        onDelete={() => {
          const [type] = inputValues;
          setHistoryList([]);
          dataStoreApi.putSync(CUSTOMS_RECORD_HISTORY_KEY_PREFIX + type, JSON.stringify([]));
        }}
        subBtnVisible={currentSearchType === 'goodsShipped' || currentSearchType === 'hsCode'}
        open={searchHistoryOpen && !inputValues[1] && historyList.length > 0}
        changeOpen={setSearchHistoryOpen}
        target={inputRef.current?.getWrapperRef()}
        searchList={historyList.map(e => ({ query: e, searchType: currentSearchType }))}
        searchType={currentSearchType}
        subType={currentSearchType === 'hsCode' ? 'hscode' : 'product'}
        onClick={params => {
          const [param, ...rest] = typeof params === 'string' ? [params] : params;
          const [type] = inputValues;
          const next: CustomsRecordReq = {
            ...req,
            ...formRef.current?.getFieldValues(),
            page: 1,
            [type]: param,
          };
          setInputValues([type, param]);
          if (type !== 'port') {
            getInputValue && getInputValue(type === 'queryCompany' ? 'company' : type, param);
          }
          setSearchHistoryOpen(false);
          if (rest && rest.length > 0) {
            next.nearSynonymList = rest;
            forceUseParamNearSyn.current = true;
          }
          guideSearchCustoms(param, type);
          doFetchData(next);
          // setDefaultFormValue(next);
        }}
      />
      <PortDropList
        open={portListOpen && inputValues[0] === 'port' && !inputValues[1] && historyList.length <= 0}
        changeOpen={setPortListOpen}
        target={inputRef.current?.getWrapperRef()}
        blurTarget={inputRef.current?.getInputWrapper()}
        type="main"
        onSelectPort={portName => {
          const [type] = inputValues;
          const next: CustomsRecordReq = {
            ...req,
            ...formRef.current?.getFieldValues(),
            [type]: portName,
          };
          setInputValues([type, portName]);
          guideSearchCustoms(portName, type);
          setPortListOpen(false);
          doFetchData(next);
          setDefaultFormValue(next);
        }}
      />
    </div>
  );

  if (layout.length === 1) {
    return <>{renderSearchInput()}</>;
  }

  const totalOverLimited = total > 10000;
  const tableTotal = totalOverLimited ? 10000 : total;
  const displayTotal = totalOverLimited ? `超过${tableTotal}` : tableTotal;
  const handleTotalText = () => {
    return (
      <span>
        {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{total}</span> {getIn18Text('GEJIEGUO')}
      </span>
    );
  };
  return (
    <>
      <div hidden={layout.length === 3 && !!currentRecord}>
        {renderSearchInput()}
        <div className={styles.cusCnt}>
          <div className={styles.cusCntTab}>
            <Tabs
              size={'small'}
              activeKey={cuurentTabType}
              onChange={value => {
                // tabsCompanyChange(value as SearchType)
                setCompanyType(value as customsType);
              }}
            >
              {customsCategoryType === 'port'
                ? tabCompanyType.filter(item => item.value === 'customs').map(item => <TabPane tab={item.label} key={item.value} />)
                : tabCompanyType.map(item => <TabPane tab={item.label} key={item.value} />)}
            </Tabs>
          </div>
          <FilterForm
            ref={formRef}
            searchType={currentSearchType}
            defaultFormValue={defaultFormValue}
            onFinish={handleFinish}
            onReset={handleReset}
            query={inputValues[1]}
            originCountry={(value, type) => {
              setOriginCountry(prv => {
                return type
                  ? {
                      conCountryList: type === 'con' ? value : prv.conCountryList,
                      shpCountryList: type === 'shp' ? value : prv.shpCountryList,
                    }
                  : {
                      conCountryList: [],
                      shpCountryList: [],
                    };
              });
            }}
            continentList={continentList}
          />
          <div className={styles.table}>
            <div className={styles.tableTop}>
              <div>{handleTotalText()}</div>
              <div>
                {Number(tableTotal) > 0 && (
                  <SiriusPagination
                    onChange={(page, pageSize) => {
                      const next: CustomsRecordReq = {
                        ...requestedReq,
                        page,
                        size: pageSize || 10,
                      };
                      doFetchData(next);
                    }}
                    simple
                    pageSize={req.size}
                    current={req?.page}
                    defaultCurrent={1}
                    total={tableTotal}
                  />
                )}
              </div>
            </div>
            <SiriusTable
              loading={tableLoading}
              dataSource={list}
              rowKey="id"
              columns={colums}
              className={classNames('edm-table edm-table-customs customs-scroll')}
              scroll={{ x: true }}
              locale={{
                emptyText: (
                  <DocSearchEmpty
                    hasRcmd={rcmdList.length > 0}
                    params={requestedReq}
                    searchType={requestedReq.searchType}
                    onSearch={({ type, query }, params) => {
                      setInputValues([type, query]);
                      doFetchData(
                        {
                          ...params,
                          page: params.page || req.page,
                          size: params.size || req.size,
                        },
                        type
                      );
                      setDefaultFormValue({
                        ...params,
                        shpCountryList: originCountry.shpCountryList.length > 0 ? originCountry.shpCountryList : params.shpCountryList,
                        conCountryList: originCountry.conCountryList.length > 0 ? originCountry.conCountryList : params.conCountryList,
                      } as CustomsRecordPostReq);
                    }}
                    sensitive={sensitive}
                  />
                ),
              }}
              pagination={false}
            ></SiriusTable>
            <SiriusPagination
              className={styles.pagination}
              {...{
                current: req?.page,
                total: tableTotal,
                showSizeChanger: false,
                showQuickJumper: true,
                // pageSizeOptions: [10, 20, 50] as unknown as string[],
                onChange(page, pageSize) {
                  const next: CustomsRecordReq = {
                    ...requestedReq,
                    page,
                    size: pageSize || 10,
                  };
                  doFetchData(next);
                },
                showTotal: tableTotal => {
                  return handleTotalText();
                },
              }}
            />
          </div>
          <RcmdRow
            from="customs"
            className={styles.boxContainer}
            onChoseRcmd={param => {
              setInputValues(['goodsShipped', param]);
              getInputValue && getInputValue('goodsShipped', param);
              const nextParams = getDefaultReq();
              doFetchData(
                {
                  ...nextParams,
                  goodsShipped: param,
                },
                'goodsShipped'
              );
              setDefaultFormValue(nextParams);
            }}
            rcmdList={rcmdList}
            visible={rcmdList.length > 0}
          />
        </div>
      </div>
      <Drawer
        onClose={() => {
          setCurrentRecord(undefined);
        }}
        visible={!!currentRecord}
      >
        <CustomsRecordDetail
          onSearchCompany={st => {
            if (currentRecord) {
              handleSearchCompany({
                name: st === 'import' ? currentRecord.conName : currentRecord.shpName,
                country: st === 'import' ? currentRecord.conCountry : currentRecord.shpCountry,
              });
            }
          }}
          record={currentRecord}
        />
      </Drawer>

      <Drawer
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
        }}
        width={872}
        zIndex={1000}
      >
        {showDetail && detailId ? (
          <CompanyDetail
            scene="customs"
            id={detailId}
            showSubscribe
            reloadToken={0}
            origin={'custom'}
            queryGoodsShipped={requestedReq.goodsShipped}
            showNextDetail={id => {
              setNextDetailLevels(prev => {
                const [_first, ...rest] = prev;
                return [{ open: true, id }, ...rest];
              });
            }}
            extraParams={{ keyword: requestedReq?.goodsShipped }}
          />
        ) : null}
      </Drawer>
      {nextDetailLevels.map((level, index) => (
        <Drawer
          key={index}
          visible={level.open}
          zIndex={1001 + index}
          onClose={() => {
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
              scene="customs"
              showSubscribe
              id={level.id}
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
              origin={'custom'}
            />
          )}
        </Drawer>
      ))}
    </>
  );
};

export default DocSearch;
