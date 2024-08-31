import React, { useEffect, useRef, useState, useContext, useMemo, useCallback, ReactNode } from 'react';
import classnames from 'classnames';
import _compact from 'lodash/compact';
import { Menu, Tooltip } from 'antd';
import moment, { Moment } from 'moment';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useMemoizedFn, useUpdateEffect } from 'ahooks';
import {
  apis,
  apiHolder,
  EdmCustomsApi,
  customsFreightItem,
  transactionRecordItem as tableItemType,
  GlobalSearchApi,
  getIn18Text,
  ExcavateCompanyItem,
  GlobalSearchCompanyDetail,
  CustomsContinent,
} from 'api';
import style from './customsDetail.module.scss';
import BaseInfo from './components/baseInfo';
import Record from './components/record';
import Supplier from './components/supplier';
import Freight from './components/freight';
import { recData as recDataType } from '../customs';
import ContactsSelectModal, { OutPutContactItem } from './components/contactsSelectModal/contactsSelectModal';
import DetailDrawer from '../../components/detailDrawer/detailDrawer';
import { getTransText } from '@/components/util/translate';
import { CustomsDataDetailClick, CustomsDataDetailTopbarClick, customsDataTracker } from '../../tracker/tracker';
import { GlobalContext } from '../context';
import SubCompanyButton from './components/subCompany/SubCompanyButton';
import PurchaseChain from './components/purchaseChain';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import ZnCompanyList from './components/znCompanyList/index';
import { SimilarCompany } from '../../../globalSearch/detail/SimilarCompanyTable';
import { CorporateInformation } from '../../../globalSearch/detail/corporateInformation';
import { getDetailCustomerAddBtnShowStatus, getDetailLeadsAddBtnShowStatus, getListItemReferByStatus, handleHscodeData } from '@/components/Layout/globalSearch/utils';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import { CompanyDetailHeader } from '@/components/Layout/globalSearch/detail/CompanyHeader';
import { useCompanyDetailFetch } from '@/components/Layout/globalSearch/hook/useCompanyDetailFetch';
import { useStickyTab } from '@/components/Layout/globalSearch/hook/useStickyTab';
import ProductListIntro from '@/components/Layout/globalSearch/detail/ProductListIntro';
import { DetailContactTable } from '@/components/Layout/globalSearch/detail/DetailContactTable';
import { useIsForwarder } from '../ForwarderSearch/useHooks/useIsForwarder';
import { useCustomsCountryHook } from '../docSearch/component/CountryList/customsCountryHook';
import useTradeQuery from '@/components/Layout/globalSearch/hook/useTradeQuery';
import { timeRangeOptions } from '../search/constant';
import { useCrmOps } from '@/components/Layout/globalSearch/hook/useCrmOps';
import { CustomerEntry } from '@/components/Layout/globalSearch/detail/CustomerEntry';
import { WmDataSentryKey, WmDataSentryOp, errorReportApi, getWmDataSentryKeyPrefix } from '@/components/Layout/globalSearch/sentry-utils';
import FreightRelation from './components/freightRelation';
import BdDetailHeader from '@/components/Layout/Customer/components/bddetailHeader/bddetailHeader';
import { useDetailApiReq } from './hooks/useDetailApiReq';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { TongyongJiantou1You, TongyongJiantou1Zuo } from '@sirius/icons';
const { TabPane } = Tabs;
import { AddContact } from '@web-edm/AIHosting/Receiver';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = apiHolder.api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const eventApi = apiHolder.api.getEventApi();

type TabConfig = {
  key: string;
  text: string;
};

const BUYERS_TABS: TabConfig[] = [
  { key: 'records', text: getIn18Text('JINKOUJILU') },
  { key: 'supplier', text: getIn18Text('GONGYINGSHANG') },
  { key: 'freight', text: getIn18Text('HUOYUNXINXI') },
  { key: 'purchaseChain', text: getIn18Text('CAIGONGLIANCHUANTOU') },
  { key: 'freightRelation', text: '货运关系' },
];

const SUPPLIER_TABS: TabConfig[] = [
  { key: 'records', text: getIn18Text('CHUKOUJILU') },
  { key: 'supplier', text: getIn18Text('CAIGOUSHANG') },
  { key: 'freight', text: getIn18Text('HUOYUNXINXI') },
  { key: 'purchaseChain', text: getIn18Text('CAIGONGLIANCHUANTOU') },
  { key: 'freightRelation', text: '货运关系' },
];

const PEERS_TABS: TabConfig[] = [
  { key: 'freight', text: getIn18Text('HUOYUNXINXI') },
  { key: 'freightRelation', text: '货运关系' },
];

interface CustomsDetailProps extends recDataType {
  onOpen: (content: recDataType['content']) => void;
  onCollectIdChange?(params: { collectId?: string | number | null; country?: string; companyName?: string }): void;
  onChangeListItem?(params: { extraData: any; country?: string; companyName?: string }): void;
  onClose?: (zIndex: number, all: boolean) => void;
}
export interface BuyAndSupportType {
  buy: any;
  supplie: any;
}

export interface MergeCompanyType {
  id: number;
  companyName: string;
  country: string;
}

export interface ForeignParam {
  name: string;
  nameCn: string;
}

const defaultParams = {
  from: 1,
  size: 20,
};

const CustomsBaseDetail: React.FC<CustomsDetailProps> = props => {
  const { onOpen, content, visible, onCollectIdChange, to: DETAIL_TYPE = 'buysers', onChangeListItem, type, onClose, zIndex, origin, switchOption } = props;
  const {
    companyName,
    country,
    queryValue,
    tabOneValue,
    relationCountryList,
    otherGoodsShipped,
    reqBuyParams,
    isPreciseSearch,
    goPort,
    endPort,
    hideTransPortBtn,
    hideSubBtn,
  } = content;
  const { state } = useContext(GlobalContext);
  const outerValue = useRef<{
    hsCode?: string;
    goodsShipped?: string;
    originCountry?: string[];
    excludeEmail: boolean;
    dealtTime?: [string, string];
    relationCountryList?: string[];
    isPreciseSearch?: boolean;
  }>({
    hsCode: '',
    goodsShipped: '',
    relationCountryList: [],
    excludeEmail: true,
    isPreciseSearch,
    dealtTime: state?.dealtTime ?? [],
  });
  const BASE_TABS = {
    buysers: BUYERS_TABS,
    supplier: SUPPLIER_TABS,
    peers: PEERS_TABS,
  }[DETAIL_TYPE];
  const isForwarder = useIsForwarder();
  const [continentList] = useCustomsCountryHook();
  const [tabList, setTabList] = useState<TabConfig[]>(() => BASE_TABS);
  const [tabKey, setTabKey] = useState<string>(BASE_TABS[0]?.key);
  const [contactsVisible, setContactsVisible] = useState<boolean>(false);
  const [recordParams, setRecordParams] = useState<any>({});
  const [hsCode, setHsCode] = useState<string | undefined>('');
  const [preciseSearch, setPreciseSearch] = useState<boolean | undefined>(isPreciseSearch);
  const [dealtTimeMoment, setDealtTimeMoment] = useState<[Moment, Moment] | undefined>();
  const [znCompanyList, setZnCompanyList] = useState<ExcavateCompanyItem[]>([]);
  const [goodsShipped, setGoodsShipped] = useState<string | undefined>('');
  const [countryList, setCountryList] = useState<string[]>([]);
  const [allCountry, setAllCountry] = useState<CustomsContinent[]>([]);
  const [usdRecentYear, setUsdRY] = useState<string>('last_one');
  const [recordCountRecentYear, setRecordCountRY] = useState<string>('last_one');
  const [tableList, setTableList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [digVisible, setDigVisible] = useState<boolean>(false);
  const [year, setYear] = useState<number[]>(() => [new Date().getFullYear(), new Date().getFullYear()]);
  const [barYear, setBarYear] = useState<number[]>(() => [new Date().getFullYear(), new Date().getFullYear()]);
  const [companyRelationState, setCompanyRelationState] = useState<{ companyId: string; status: string; leadsId: string }>({ companyId: '', status: '', leadsId: '' });
  const [buyAndSupport, setBuyAndSupport] = useState<BuyAndSupportType>({} as BuyAndSupportType);
  const [mergeCompanyVisible, setMergeCompanyVisible] = useState<boolean>(false);
  const [selectedCompanyList, setSelectCompanyList] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [inputType, setInputType] = useState<string>('');
  const [comePort, setComePort] = useState<ForeignParam[]>(goPort ?? []);
  const [finaPort, setFinaPort] = useState<ForeignParam[]>(endPort ?? []);
  const [sortBy, setSortBy] = useState<string>('');
  const [order, setOrder] = useState<string>('');
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [addContactProp, setAddContactProp] = useState<any>({});
  const {
    fetchData,
    headerCompanyList,
    data: companyDetailData,
    originData,
    setData,
    similarCompanyData,
    reqSimilarCompanyData,
  } = useCompanyDetailFetch({ queryGoodsShipped: goodsShipped });
  const [time, setTime] = useState<string[]>([moment().add(-2, 'year').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]);
  const {
    isSticky,
    onContentScroll,
    handleStickyTabChange,
    stickyTab,
    companyInfoRef,
    relationProductRef,
    customsDataRef,
    stickyNode,
    selectStickyTab,
    similarCompanyRef,
    corporateInformationRef,
  } = useStickyTab({
    data: companyDetailData,
    similarCompanyData,
    showBuyer: DETAIL_TYPE === 'buysers',
    showSupplier: DETAIL_TYPE === 'supplier',
    showFreight: DETAIL_TYPE === 'peers',
  });
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
  const {
    baseData,
    baseInfoTableData,
    rowKey: rowKeys,
    statistics,
    barData,
    fetchBase,
    fetchStatistics,
    fetchBarStatistics,
    fetchRecords,
    fetchSupplier,
    featchPurchase,
    fetchFreight,
    tableList: apiTableList,
    loading,
    purchaseChainData,
    pagination: apiPagination,
  } = useDetailApiReq({
    companyName,
    country,
    to: DETAIL_TYPE,
    usdRecentYear,
    recordCountRecentYear,
    selectedCompanyList,
    year,
    barYear,
    content,
    visible,
    zIndex,
    handleHscodeData,
    recordParams,
    handerTalbeData,
    time,
  });
  const refreshCompanyData = useMemoizedFn(() => {
    if (!baseData?.excavatedCompanyInfo?.id) return;
    fetchData(baseData.excavatedCompanyInfo.id);
  });
  const getCompanyRelationState = useCallback(
    async (syncList?: boolean) => {
      if (baseData.originCompanyName) {
        const res = await edmCustomsApi.getCompanyRelationStatus({
          companyName: baseData.originCompanyName,
          country: baseData.country || '',
          countryId: baseData.countryId,
          companyNameId: baseData.companyNameId,
        });
        if (syncList) {
          onChangeListItem?.({
            country: country || '',
            companyName: baseData.originCompanyName,
            extraData: getListItemReferByStatus(res),
          });
        }
        setCompanyRelationState(res);
      }
    },
    [baseData, country]
  );

  const onToggleHideCommon = useCallback((hide: boolean) => {
    if (originData.current) {
      setData({
        ...originData.current,
        contactList: originData.current.contactList.filter(contact => !(hide && contact.isHidden)),
      });
    }
  }, []);
  const close = useCallback(() => {
    onClose && onClose(zIndex, true);
  }, [onClose, zIndex]);
  useEffect(() => {
    getCompanyRelationState(true);
  }, [baseData]);

  useEffect(() => {
    if (tabOneValue === 'all') {
      const newGoodShipped = otherGoodsShipped?.length ? otherGoodsShipped.join('|') : '';
      const newQueryValue = queryValue
        ? queryValue
            .split('|')
            .map(item => handleHscodeData(item))
            .join('|')
        : '';
      setHsCode(newQueryValue);
      setGoodsShipped(newGoodShipped);
      outerValue.current.goodsShipped = newGoodShipped;
      outerValue.current.hsCode = newQueryValue;
    } else if (tabOneValue === 'hsCode') {
      setHsCode(queryValue);
      setGoodsShipped('');
      outerValue.current.goodsShipped = '';
      outerValue.current.hsCode = queryValue;
    } else if (tabOneValue === 'goodsShipped') {
      const handleInitGoodsShipped = (queryValue?: string, otherGoodsShipped?: string[]) => {
        let str = queryValue + (otherGoodsShipped?.join(',') ? ',' + otherGoodsShipped.join(',') : '');
        let mergeStr = str?.split(',')?.join('|');
        return mergeStr || '';
      };
      let initGoodsShipped = handleInitGoodsShipped(queryValue, otherGoodsShipped);
      setGoodsShipped(initGoodsShipped);
      setHsCode('');
      outerValue.current.goodsShipped = initGoodsShipped;
      outerValue.current.hsCode = '';
    } else {
      setGoodsShipped('');
      setHsCode('');
      outerValue.current.goodsShipped = '';
      outerValue.current.hsCode = '';
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
    // setRecordCountRY('last_one');
  }, [tabKey, tabOneValue, queryValue, relationCountryList]);
  // 记录里的时间逻辑取消 暂时先同步外层 时间选择器时间  先留存 后续可能会启用
  // useEffect(() => {
  //   const outerTimeValue = timeRangeOptions.find(item => item.value === reqBuyParams?.timeFilter)?.monthCount;
  //   if (outerTimeValue) {
  //     const startDate = moment().add(outerTimeValue, 'month');
  //     const endDate = moment();
  //     setDealtTimeMoment([startDate, endDate]);
  //     outerValue.current.dealtTime = [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')];
  //   }
  // }, [reqBuyParams]);
  useEffect(() => {
    setPreciseSearch(isPreciseSearch);
    outerValue.current.isPreciseSearch = isPreciseSearch;
  }, [tabKey, isPreciseSearch]);
  useEffect(() => {
    if (baseData.excavatedCompanyInfo?.id) {
      fetchData(baseData.excavatedCompanyInfo.id);
      reqSimilarCompanyData(baseData.excavatedCompanyInfo.id);
    }
  }, [baseData]);
  useEffect(() => {
    const dataId = companyDetailData?.id;
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        if (dataId && (event?.eventData?.type === 'contact' || event?.eventData?.type === 'refresh') && event.eventData.data?.id === dataId) {
          fetchData(dataId);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('globalSearchGrubTaskFinish', eventID);
    };
  }, [companyDetailData?.id]);
  useEffect(() => {
    if (tabKey && companyName && visible) {
      setOrder('');
      setSortBy('');
      handerReqParams();
    }
  }, [tabKey, companyName, visible]);
  useEffect(() => {
    if (rowKeys.length > 0) {
      setSelectedRowKeys(rowKeys);
    }
  }, [rowKeys]);
  useEffect(() => {
    setTableList(apiTableList);
  }, [apiTableList]);
  useEffect(() => {
    setBuyAndSupport(purchaseChainData);
  }, [purchaseChainData]);
  useEffect(() => {
    setPagination(apiPagination);
  }, [apiPagination]);

  const handerReqParams = (order?: string, sortBy?: string) => {
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
  const { makeTradeReport, info } = useTradeQuery({
    country: content.country,
    name: DETAIL_TYPE === 'peers' ? baseData.nameAndCountry ?? '' : content.companyName,
    closeDraw: close,
    showBtn: isForwarder,
    isPeers: DETAIL_TYPE === 'peers',
  });
  useEffect(() => {
    if (visible) {
      const sentryId = errorReportApi.startTransaction({
        name: `${getWmDataSentryKeyPrefix('customs')}${WmDataSentryKey.Detail}`,
        op: WmDataSentryOp.Loaded,
      });
      fetchBase(sentryId);
      // setYear([new Date().getFullYear(), new Date().getFullYear()]);
      outerValue.current.excludeEmail = true;
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.detailShow, { country: baseData.country, name: baseData.companyName });
    }
  }, [visible]);

  useEffect(() => {
    setTabList(BASE_TABS);
    // 港口搜索入口 默认为货运信息
    setTabKey(origin === 'forward' ? 'freight' : BASE_TABS[0]?.key);
  }, []);

  useEffect(() => {
    if (tabKey === 'records' && recordParams.companyName) {
      fetchRecords();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'supplier' && recordParams.companyName) {
      fetchSupplier();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'freight' && recordParams.companyName) {
      fetchFreight(
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
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'purchaseChain' && recordParams.companyName) {
      featchPurchase();
    }
  }, [recordParams]);

  useEffect(() => {
    setTableList([]);
    if (tabKey === 'records' && companyName) {
      fetchStatistics();
    }
    if (tabKey === 'supplier' && companyName) {
      fetchBarStatistics();
    }
  }, [tabKey]);

  useEffect(() => {
    if (recordParams && Object.keys(recordParams).length > 0) {
      handleTimeChange();
    }
  }, [time]);

  const handleTimeChange = useMemoizedFn(() => {
    fetchBase();
    switch (tabKey) {
      case 'records':
        fetchStatistics();
        setTableList([]);
        fetchRecords(1);
        return;
      case 'supplier':
        setTableList([]);
        fetchSupplier(1);
        fetchBarStatistics();
        return;
      case 'freight':
        setTableList([]);
        fetchFreight(
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

  useEffect(() => {
    if (continentList && continentList.length > 0) {
      setAllCountry(continentList);
    }
  }, [continentList]);

  const replaceText = (queryValue: string, data: string) => {
    const reg = new RegExp(handleHscodeData(queryValue), 'gi');
    data = data.replace(reg, function (txt) {
      return '<em>' + txt + '</em>';
    });
    return data;
  };
  const contactsList = useMemo(
    () =>
      (companyDetailData?.contactList ?? []).map((e, index) => ({
        type: e.type,
        key: index,
        contactName: e.name,
        email: e.contact,
        telephones: [e.phone],
        job: e.jobTitle,
        whatsApp: '',
        linkedinUrl: e.linkedinUrl,
        facebookUrl: e.facebookUrl,
        twitterUrl: e.twitterUrl,
        id: e.contactId,
      })),
    [companyDetailData]
  );
  const refreshRelationState = useCallback(() => getCompanyRelationState(true), [getCompanyRelationState]);

  const onLeadsFetch = useMemoizedFn(async (extraFetchParams?: any) => {
    await globalSearchApi.customsSingleAddLeads({
      name: companyName,
      originName: baseData.originCompanyName,
      country,
      sourceType: 1,
      ...extraFetchParams,
    });
  });
  const { handleAddLeads, leadsAddLoading } = useLeadsAdd({
    onFetch: onLeadsFetch,
    refresh: refreshRelationState,
    onNavigate: close,
  });
  const { checkCompanyContacts, fetchCustomerLimit } = useCrmOps({
    data: {
      ...companyDetailData,
      ...baseData,
    } as any,
    refreshData: refreshCompanyData,
    scene: 'customs',
    companyRelationState,
    refreshRelationState,
    znCompanyList,
    onLeadsPost: (extraFetchParams: any) => handleAddLeads({ extraFetchParams }),
    crmOpsCallback: param => crmOpsCallback(param),
  });

  const crmOpsCallback = (param: any) => {
    setAddContactProp(param);
    setShowValidateEmailModal(true);
  };

  const inputLeads = () => {
    setInputType('leads');
    if (!contactsList.length) {
      checkCompanyContacts([], 'leads');
    } else {
      setContactsVisible(true);
    }
    customsDataTracker.trackDetailTopbarClick(CustomsDataDetailTopbarClick.entryLeads);
  };

  const inputCustomer = async () => {
    const limitReached = await fetchCustomerLimit();
    if (limitReached) return;
    setInputType('customer');
    if (!contactsList.length) {
      checkCompanyContacts([], 'customer');
    } else {
      setContactsVisible(true);
    }
    customsDataTracker.trackDetailTopbarClick(CustomsDataDetailTopbarClick.entryCustomer);
  };
  const onContactSelectOk = useMemoizedFn((selected: OutPutContactItem[]) => {
    setContactsVisible(false);
    checkCompanyContacts(selected, inputType);
  });
  const handleTabTracker = (tabKey: string) => {
    if (tabKey === 'records') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickBuyingRecordTab, { country: baseData.country, name: baseData.companyName });
    }
    if (tabKey === 'supplier') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickSupplierTab, { country: baseData.country, name: baseData.companyName });
    }
    if (tabKey === 'freight') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickFreightInfoTab, { country: baseData.country, name: baseData.companyName });
    }
    if (tabKey === 'purchaseChain') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.purchaseChain, { country: baseData.country, name: baseData.companyName });
    }
  };

  const onTableChange = (currentPagination: any, filter: any, sorter: any, goPort?: any, endPort?: any) => {
    const { current, pageSize } = currentPagination;
    const { field, order } = sorter;
    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
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
      goPort: goPort ?? recordParams.goPort,
      endPort: endPort ?? recordParams.endPort,
      from: current,
      size: pageSize,
    });
  };

  const rowKey = 'id';

  const handleTabCheck = () => {
    if (tabKey === 'records' && companyName) {
      fetchStatistics();
    }
    if (tabKey === 'supplier' && companyName) {
      fetchBarStatistics();
    }
    fetchBase();
    setRecordParams({
      ...recordParams,
      mergedCompanyNames: selectedCompanyList,
    });
  };

  useEffect(() => {
    if (selectedCompanyList.length > 0) {
      handleTabCheck();
    }
  }, [selectedCompanyList]);

  const tableColumns = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'companyName',
    },
    {
      title: '企业所在国家/地区',
      dataIndex: 'country',
    },
  ];
  const extraTags = useMemo(
    () =>
      _compact([
        DETAIL_TYPE === 'buysers'
          ? {
              content: getTransText('CAIGOUSHANG'),
            }
          : null,
        DETAIL_TYPE === 'supplier'
          ? {
              content: getTransText('GONGYINGSHANG'),
            }
          : null,
        DETAIL_TYPE === 'peers'
          ? {
              content: '运输公司',
            }
          : null,
      ]),
    [DETAIL_TYPE]
  );
  // domainCountry是详情页头部展示的国家地区字段，全球搜取domainCountry，海关取base里的country
  const headerDetailData = useMemo(
    () => ({ ...(companyDetailData ?? {}), domainCountry: baseData?.standardCountry } as GlobalSearchCompanyDetail),
    [companyDetailData, baseData]
  );
  const handleOnPagTurn = (num: number) => {
    switchOption?.onPagTurn && switchOption?.onPagTurn(num);
  };
  return (
    <OverlayScrollbarsComponent
      className={style.customsDataDetail}
      options={{
        callbacks: {
          onScroll: onContentScroll,
        },
      }}
    >
      <div className={style.customsDataDetail}>
        <div ref={companyInfoRef}>
          <CompanyDetailHeader
            data={headerDetailData}
            recommendShowName={companyName}
            scene="customs"
            origin="customs"
            headerCompanyList={headerCompanyList}
            isSticky={isSticky}
            onStickyTabChange={handleStickyTabChange}
            selectStickyTab={selectStickyTab}
            stickyTab={stickyTab}
            companyRelationState={companyRelationState}
            refreshRelationState={refreshRelationState}
            extraTags={extraTags}
            hideMerge
            ButtonGroup={
              <>
                {switchOption && (
                  <>
                    <Tooltip title={switchOption?.hasLast ? '上一个公司' : '已是此页的第一个公司了，请返回列表页翻页'}>
                      <div
                        className={classnames(style.iconStyle, style.iconZuo, {
                          [style.disablePage]: !switchOption?.hasLast,
                        })}
                        onClick={() => handleOnPagTurn(-1)}
                      >
                        <TongyongJiantou1Zuo />
                      </div>
                    </Tooltip>

                    <Tooltip title={switchOption?.hasNext ? '下一个公司' : '已是此页的最后一个公司了，请返回列表页翻页'}>
                      <div
                        className={classnames(style.iconStyle, style.iconYou, {
                          [style.disablePage]: !switchOption?.hasNext,
                        })}
                        onClick={() => handleOnPagTurn(1)}
                      >
                        <TongyongJiantou1You />
                      </div>
                    </Tooltip>
                  </>
                )}
                {!hideSubBtn && DETAIL_TYPE !== 'peers' && <SubCompanyButton baseData={baseData} onChangeCollectId={onCollectIdChange} />}
                {isForwarder && !hideTransPortBtn && (DETAIL_TYPE === 'peers' ? (baseData.nameAndCountry ? true : false) : true) ? (
                  <Button style={{ marginLeft: 8 }} onClick={makeTradeReport}>
                    {info.searchFlag ? '查看报告' : '分析报告'}
                  </Button>
                ) : (
                  ''
                )}
                <CustomerEntry
                  inputCustomer={inputCustomer}
                  inputLeads={inputLeads}
                  companyRelationState={companyRelationState}
                  leadsAddLoading={leadsAddLoading}
                  btnStyle={{ marginLeft: 8 }}
                />
              </>
            }
          />
        </div>
        <div style={{ padding: '12px 20px 12px', position: 'relative' }}>
          <div key={Number(visible)} ref={customsDataRef} className={classnames([style.block, style.body])}>
            <BdDetailHeader
              title={DETAIL_TYPE === 'peers' ? '货运数据' : '海关数据'}
              mergeCompanys={baseData.mergedCompanyNames}
              selectCompanys={() => {
                setMergeCompanyVisible(true);
              }}
              selectedCompanyList={selectedCompanyList}
              detailType={DETAIL_TYPE}
              time={time}
              setTime={setTime}
            />
            <div style={{ padding: '0px 16px 0' }}>
              <BaseInfo
                dataType={DETAIL_TYPE === 'buysers' ? 'buysers' : DETAIL_TYPE === 'supplier' ? 'suppliers' : 'peers'}
                detail={baseData}
                // onChangeRecordCountRY={setRecordCountRY}
                openDrawer={onOpen}
                isCanExactDig={false}
                onDig={() => {
                  setDigVisible(true);
                }}
                warnningTextShow={true}
              />
            </div>
            <div className={style.customsInfoBase} style={{ background: '#fff', borderRadius: '4px' }} key={content.companyName + content.country}>
              <Tabs activeKey={tabKey} bgmode="white" size="small" type="capsule" onChange={setTabKey} onTabClick={handleTabTracker}>
                {tabList.map(item => (
                  <TabPane tab={item.text} key={item.key} />
                ))}
              </Tabs>
              {tabKey === 'records' && (
                <Record
                  dataType={DETAIL_TYPE === 'buysers' ? 'buysers' : 'suppliers'}
                  detail={baseData}
                  hsCode={hsCode}
                  goodsShipped={goodsShipped}
                  preciseSearch={preciseSearch}
                  countryList={countryList}
                  allCountry={allCountry}
                  tableList={tableList}
                  loading={loading}
                  pagination={pagination}
                  statistics={statistics}
                  // year={year}
                  // initDateRange={dealtTimeMoment}
                  // onChangeDealTime={(dealtTime: [string, string]) => {
                  //   outerValue.current.dealtTime = dealtTime;
                  //   handerReqParams();
                  // }}
                  // onChangeYear={(year: number[]) => {
                  //   setYear(year);
                  // }}
                  // onChangeRecordCountRY={setRecordCountRY}
                  onChange={onTableChange}
                  openDrawer={onOpen}
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
                  hideBaseInfo={true}
                />
              )}
              {tabKey === 'supplier' && (
                <Supplier
                  tableList={tableList}
                  scene="customs"
                  title={DETAIL_TYPE === 'buysers' ? getIn18Text('GONGYINGSHANG') : getIn18Text('CAIGOUSHANG')}
                  dataType={DETAIL_TYPE === 'buysers' ? 'suppliers' : 'buysers'}
                  type={DETAIL_TYPE === 'buysers' ? 'buysers' : 'suppliers'}
                  buyersName={companyName}
                  buyersCountry={country}
                  suppliersName={companyName}
                  suppliersCountry={country}
                  loading={loading}
                  // year={barYear}
                  barData={barData}
                  countryList={countryList}
                  allCountry={allCountry}
                  onChangeCountry={(key: string[]) => {
                    setCountryList(key);
                    outerValue.current.relationCountryList = key;
                    handerReqParams(order, sortBy);
                  }}
                  // onChangeYear={(year: number[]) => {
                  //   setBarYear(year);
                  // }}
                  pagination={pagination}
                  onChange={onTableChange}
                  openDrawer={onOpen}
                />
              )}
              {tabKey === 'freight' && (
                <Freight
                  type={DETAIL_TYPE === 'buysers' ? 'buysers' : DETAIL_TYPE === 'peers' ? 'peers' : 'suppliers'}
                  tableList={tableList}
                  pagination={pagination}
                  loading={loading}
                  hsCode={hsCode}
                  preciseSearch={preciseSearch}
                  countryList={countryList}
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
                  onChangePort={(goPort, endPort, type) => {
                    fetchFreight(goPort, endPort, 1);
                  }}
                  goodsShipped={goodsShipped}
                  onChange={onTableChange}
                  goPort={comePort}
                  endPort={finaPort}
                  setComePort={setComePort}
                  setFinaPort={setFinaPort}
                  country={country}
                  companyName={companyName}
                  openDrawer={onOpen}
                  time={time}
                />
              )}
              {tabKey === 'purchaseChain' && (
                <PurchaseChain
                  tabList={buyAndSupport}
                  recordParams={recordParams}
                  companyName={companyName}
                  openDrawer={onOpen}
                  country={country}
                  tabKey={tabKey}
                  selectCompanyList={selectedCompanyList}
                  time={time}
                />
              )}
              {tabKey === 'freightRelation' && (
                <FreightRelation
                  companyName={companyName}
                  openDrawer={onOpen}
                  tabKey={tabKey}
                  selectCompanyList={selectedCompanyList}
                  country={country}
                  detailType={DETAIL_TYPE}
                  time={time}
                />
              )}
            </div>
            {contactsVisible && (
              <ContactsSelectModal
                contactsList={contactsList}
                onOk={onContactSelectOk}
                title={inputType === 'leads' ? getIn18Text('LURUXIANSUO') : getIn18Text('LURUKEHU')}
                onCancel={() => {
                  setContactsVisible(false);
                }}
                visible={contactsVisible}
              />
            )}
            {baseData.excavatedCompanyInfo && baseData.excavatedCompanyInfo.id && (
              <DetailDrawer
                companyId={baseData.excavatedCompanyInfo.id}
                goodsShipped={queryValue}
                onClose={() => {
                  setDigVisible(false);
                  fetchBase();
                }}
                visible={digVisible}
              />
            )}
          </div>
          {companyDetailData?.productList && companyDetailData.productList.length > 0 && (
            <div ref={relationProductRef} className={style.block}>
              <ProductListIntro scene="customs" list={companyDetailData.productList} />
            </div>
          )}
          {isForwarder && (
            <ZnCompanyList
              className={style.znCompanyListBox}
              companyName={companyName}
              originCompanyName={baseData.originCompanyName ?? ''}
              country={country}
              onZnCompanyListChange={setZnCompanyList}
            />
          )}
          <div ref={stickyNode} key={content.companyName + content.country}>
            <DetailContactTable
              data={
                {
                  ...companyDetailData,
                  ...baseData,
                } as any
              }
              refreshData={refreshCompanyData}
              onLeadsFetch={onLeadsFetch}
              companyRelationState={companyRelationState}
              refreshRelationState={refreshRelationState}
              productSubPage={false}
              scene="customs"
              title={getIn18Text('LIANXIREN')}
              onToggleHideCommon={onToggleHideCommon}
              setShowDetailClose={close}
            />
          </div>
          {similarCompanyData.length > 0 && (
            <div ref={similarCompanyRef}>
              <SimilarCompany tableData={similarCompanyData} id={companyDetailData?.id || ''} />
            </div>
          )}
          {companyDetailData?.newsList && companyDetailData.newsList.length > 0 && (
            <div ref={corporateInformationRef}>
              <CorporateInformation newsList={companyDetailData?.newsList || []} htmlChild={<h3>企业资讯</h3>} />
            </div>
          )}
        </div>
        <SiriusModal
          visible={mergeCompanyVisible}
          title="合并企业列表"
          width={568}
          maskClosable={false}
          onCancel={() => {
            if (selectedCompanyList.length === 0) {
              setSelectedRowKeys(baseInfoTableData.map(item => item.id));
            } else {
              setSelectedRowKeys(baseInfoTableData.filter(item => selectedCompanyList.includes(item.companyName)).map(item => item.id));
            }
            setMergeCompanyVisible(false);
          }}
          onOk={() => {
            if (selectedRowKeys.length === 0) {
              message.warning({
                content: '至少选择一个公司',
              });
              return;
            }
            customsDataTracker.trackDetailMergedOkClick({
              companyName,
              uncheck: baseInfoTableData
                .filter(item => !selectedRowKeys.includes(item.id))
                .map(item => item.companyName)
                .join(';'),
            });
            setSelectCompanyList(baseInfoTableData.filter(item => selectedRowKeys.includes(item.id)).map(item => item.companyName));
            setMergeCompanyVisible(false);
            message.success({
              content: '已生效',
            });
          }}
          className={style.selectModal}
          bodyStyle={{ padding: '12px 24px 20px' }}
        >
          <div className={style.selectBody}>
            <div className={style.selectBodyIntro}>以下公司已合并显示，您可以通过勾选/取消勾选，来查看其中部分公司的信息。</div>
            <VirtualTable
              rowKey={rowKey}
              rowSelection={{
                type: 'checkbox',
                onChange: (keys: any[]) => {
                  setSelectedRowKeys(keys);
                },
                selectedRowKeys,
              }}
              rowHeight={52}
              columns={tableColumns}
              autoSwitchRenderMode
              enableVirtualRenderCount={20}
              dataSource={baseInfoTableData}
              scroll={{ y: 368 }}
              // tableLayout={'fixed'}
              pagination={false}
            />
          </div>
        </SiriusModal>
      </div>
      {showValidateEmailModal && (
        <AddContact
          {...addContactProp}
          directCheck
          visible={showValidateEmailModal}
          onClose={() => {
            setShowValidateEmailModal(false);
          }}
        />
      )}
    </OverlayScrollbarsComponent>
  );
};

export default CustomsBaseDetail;
