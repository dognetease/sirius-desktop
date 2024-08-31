/**
 *  ⚠️⚠️⚠️ 此文件已经废弃 所有逻辑同 packages/web/src/components/Layout/CustomsData/customs/customsDetail/customsBaseDetail.tsx
 *  最早的设计拆分了供应/采购的详情
 *  交互逻辑和实现是一致的，只是部分接口和接口返回不同
 *  在此做了合并处理，以免后续开发同一个逻辑要实现两次
 *  只需要在新的文件里注意用 DETAIL_TYPE 区分两个详情类型
 */
import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  resSuppliersBase,
  EdmCustomsApi,
  customsFreightItem,
  customsContactItem as contactsType,
  transactionRecordItem as tableItemType,
  RequestBusinessaAddCompany as customerType,
  resCustomsStatistics as statisticsType,
  topNCompanyInfoItem as barItemType,
} from 'api';
import { Button } from 'antd';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import * as clueLogo from '@/images/icons/customerDetail/clue-logo.png';
import style from './customsDetail.module.scss';
import BaseInfo from './components/baseInfo';
import Record from './components/record';
import Supplier from './components/supplier';
import Freight from './components/freight';
import Contacts from './components/contacts';
import PurchaseChain from './components/purchaseChain';
import { customsDataTracker, CustomsDataDetailClick, CustomsDataDetailTopbarClick } from '../../tracker/tracker';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { recData as recDataType } from '../customs';
import ContactsSelectModal from './components/contactsSelectModal/contactsSelectModal';
import CreateNewClientModal from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/customsToNewClientModal';
import DetailDrawer from '../../components/detailDrawer/detailDrawer';
import UniDrawerWrapper from '../../components/uniDrawer/uniDrawer';
import { renderDataTagList } from '@/components/Layout/utils';
import { getTransText } from '@/components/util/translate';
import { GlobalContext } from '../context';
import SubCompanyButton from './components/subCompany/SubCompanyButton';
import { getIn18Text } from 'api';
import { getCustomerAndLeadsTagInDetail, getDetailCustomerAddBtnShowStatus } from '@/components/Layout/globalSearch/utils';
import CustomerTag from '@/components/Layout/globalSearch/component/CustomerTag';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const { TabPane } = Tabs;
type TabConfig = {
  key: string;
  text: string;
};

const BUYERS_TABS: TabConfig[] = [
  { key: 'baseInfo', text: getIn18Text('JIBENXINXI') },
  { key: 'contacts', text: getIn18Text('LIANXIREN') },
  { key: 'records', text: getIn18Text('CHUKOUJILU') },
  { key: 'supplier', text: getIn18Text('CAIGOUSHANG') },
  { key: 'freight', text: getIn18Text('HUOYUNXINXI') },
  { key: 'purchaseChain', text: getIn18Text('CAIGONGLIANCHUANTOU') },
];
// const RESOURCE_LABEL = 'CUSTOMS';
interface CustomsDetailProps extends recDataType {
  onOpen: (content: recDataType['content']) => void;
  onCollectIdChange?(params: { collectId?: string | number | null; country?: string; companyName?: string }): void;
}
interface BuyAndSupportType {
  buy: any;
  supplie: any;
}

const defaultParams = {
  from: 1,
  size: 20,
};

const SuppliersDetail: React.FC<CustomsDetailProps> = props => {
  const { onOpen, content, visible, onCollectIdChange } = props;
  const { companyName, country, queryValue, tabOneValue, relationCountryList, originCompanyName } = content;
  const { state } = useContext(GlobalContext);
  const outerValue = useRef<{
    hsCode?: string;
    goodsShipped?: string;
    originCountry?: string[];
    excludeEmail: boolean;
    dealtTime?: [string, string];
    relationCountryList?: string[];
  }>({
    hsCode: '',
    goodsShipped: '',
    relationCountryList: [],
    excludeEmail: true,
    dealtTime: state?.dealtTime ?? [],
  });
  const [tabList, setTabList] = useState<TabConfig[]>(() => BUYERS_TABS);
  const [tabKey, setTabKey] = useState<string>(BUYERS_TABS[0]?.key);
  const [baseData, setBaseData] = useState<Partial<resSuppliersBase>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [clientVisible, setClientVisible] = useState<boolean>(false);
  const [contactsVisible, setContactsVisible] = useState<boolean>(false);
  const [recordParams, setRecordParams] = useState<any>({
    from: 1,
    size: 20,
    tabKey,
    companyName: '',
    hsCode: '',
    goodsShipped: '',
    dealtTime: state?.dealtTime ?? [],
  });
  const [hsCode, setHsCode] = useState<string | undefined>('');
  const [goodsShipped, setGoodsShipped] = useState<string | undefined>('');
  const [countryList, setCountryList] = useState<string[]>([]);
  const [allCountry, setAllCountry] = useState<{ label: string; code: string }[]>([]);
  const [originCountry, setOriginCountry] = useState<{ label: string; code: string }[]>([]);
  const [usdRecentYear, setUsdRY] = useState<string>('last_one');
  const [recordCountRecentYear, setRecordCountRY] = useState<string>('last_one');
  const [tableList, setTableList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [contactsList, setContactsList] = useState<contactsType[]>([]);
  const [contactsDetail, setContactsDetail] = useState<{ mediaCount: number; contactCount: number }>({
    mediaCount: 0,
    contactCount: 0,
  });
  const [emailList, setEmailList] = useState<{ contactName: string; contactEmail: string }[]>([]);
  const [customerData, setCustomerData] = useState<customerType>({} as customerType);
  const [digVisible, setDigVisible] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<statisticsType>({} as statisticsType);
  const [year, setYear] = useState<number[]>(() => [new Date().getFullYear(), new Date().getFullYear()]);
  const [barYear, setBarYear] = useState<number[]>(() => [new Date().getFullYear(), new Date().getFullYear()]);
  const [barData, setBarData] = useState<barItemType[]>([]);
  const [excludeEmail, setExcludeEmail] = useState<boolean>(true);
  const [maketingLoading, setMaketingLoading] = useState<boolean>(false);
  const [uniVisible, setUniVisible] = useState<boolean>(false);
  const [companyRelationState, setCompanyRelationState] = useState<{ companyId: string; status: string; leadsId: string }>({ companyId: '', status: '', leadsId: '' });
  const [buyAndSupport, setBuyAndSupport] = useState<BuyAndSupportType>({} as BuyAndSupportType);

  async function getCompanyRelationState() {
    if (originCompanyName) {
      const res = await edmCustomsApi.getCompanyRelationStatus({ companyName: originCompanyName, country: country || '' });
      // console.log('@@@ getCompanyRelationStatus', res);
      setCompanyRelationState(res);
    }
  }

  const inputCustomerBtn: { show: boolean; text: string } = useMemo(() => getDetailCustomerAddBtnShowStatus(companyRelationState), [companyRelationState]);

  useEffect(() => {
    getCompanyRelationState();
  }, [content]);

  useEdmSendCount(emailList, undefined, undefined, undefined, 'customsData', 'customs');

  useEffect(() => {
    if (tabOneValue === 'hsCode') {
      setHsCode(queryValue);
      setGoodsShipped('');
      outerValue.current.goodsShipped = '';
      outerValue.current.hsCode = queryValue;
    } else if (tabOneValue === 'goodsShipped') {
      setGoodsShipped(queryValue);
      setHsCode('');
      outerValue.current.goodsShipped = queryValue;
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
    if (tabKey !== 'records') {
      // outerValue.current.dealtTime = ['', ''];
    }
    setUsdRY('last_one');
    setRecordCountRY('last_one');
  }, [tabKey, tabOneValue, queryValue]);
  useEffect(() => {
    if (tabKey && companyName && visible) {
      handerReqParams();
    }
  }, [tabKey, companyName, visible]);
  const handerReqParams = () => {
    setTableList([]);
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
      tabKey,
      companyName,
    });
  };
  useEffect(() => {
    if (visible) {
      fetchBase();
      fetchCountryList();
      setYear([new Date().getFullYear(), new Date().getFullYear()]);
      setExcludeEmail(true);
      outerValue.current.excludeEmail = true;
    }
  }, [usdRecentYear, recordCountRecentYear, visible]);
  useEffect(() => {
    if (!visible) {
      setBaseData({});
      setTableList([]);
      setContactsList([]);
      setLoading(false);
      setRecordParams({
        ...defaultParams,
        tabKey,
        companyName: '',
      });
      setTabKey('baseInfo');
      setYear([new Date().getFullYear(), new Date().getFullYear()]);
      setBarYear([new Date().getFullYear(), new Date().getFullYear()]);
    } else {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.detailShow, { country: baseData.country, name: companyName });
    }
  }, [visible]);
  useEffect(() => {
    if (baseData.hasContact) {
      setTabList(BUYERS_TABS);
    } else {
      const list = [...BUYERS_TABS].filter(item => item.key !== 'contacts');
      setTabList([...list]);
    }
  }, [baseData.hasContact]);
  useEffect(() => {
    if (tabKey === 'contacts' && companyName) {
      fetchContacts();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'records' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchRecords();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'supplier' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchSupplier();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'freight' && companyName) {
      setTableList([]);
      setLoading(true);
      fetchFreight();
      setBuyAndSupport({} as BuyAndSupportType);
    }
    if (tabKey === 'purchaseChain' && companyName) {
      // window.alert('你好')
      setLoading(true);
      featchPurchase();
    }
  }, [recordParams]);
  useEffect(() => {
    if (tabKey === 'records' && companyName) {
      fetchStatistics();
    }
  }, [year, tabKey]);
  useEffect(() => {
    if (tabKey === 'supplier' && companyName) {
      fetchBarStatistics();
    }
  }, [barYear, tabKey]);
  const fetchCountryList = () => {
    edmCustomsApi.getBuyersCountry().then(res => {
      setAllCountry(res);
    });
    // 供应原产国
    edmCustomsApi.getSuppliersCountry().then(res => {
      setOriginCountry(res);
    });
  };
  const fetchStatistics = () => {
    edmCustomsApi
      .suppliersStatistics({
        companyName,
        country,
        year: year[0] as any,
        endYear: year[1] as any,
      })
      .then(res => {
        console.log('xxxxres', res);
        setStatistics(res);
      });
  };
  const fetchBarStatistics = () => {
    edmCustomsApi
      .barTopBuyers({
        companyName,
        country,
        year: barYear[0] + '',
        endYear: barYear[1] + '',
      })
      .then(res => {
        setBarData(res.topNCompanyInfo);
      });
  };
  const fetchBase = () => {
    edmCustomsApi
      .suppliersBase({
        companyName,
        country,
        groupByCountry: true,
        usdRecentYear,
        recordCountRecentYear,
        visited: !!content.visited,
      })
      .then(res => {
        setBaseData(res);
        if (res.hasContact && !contactsList.length) {
          fetchContacts();
        }
      });
  };
  const fetchAllContacts = async () => {
    return edmCustomsApi
      .customsContact({
        size: pagination.total || 2000,
        from: 0,
        companyName,
        country,
        excludeCommonEmail: excludeEmail,
        originCompanyName,
      })
      .then(res => {
        const { contacts } = res;
        const newContacts = contacts?.map(item => {
          if (item.email && !item.contactName) {
            item.contactName = item.email.split('@')[0];
          }
          return item;
        });
        return newContacts;
      });
  };
  const fetchContacts = () => {
    const { from, excludeEmail } = recordParams;
    edmCustomsApi
      .customsContact({
        size: 50,
        from: from - 1,
        companyName,
        country,
        excludeCommonEmail: excludeEmail,
        originCompanyName,
      })
      .then(res => {
        const { contacts, total, mediaCount, contactCount } = res;
        setContactsDetail({
          mediaCount,
          contactCount,
        });
        const newContacts = contacts?.map(item => {
          if (item.email && !item.contactName) {
            item.contactName = item.email.split('@')[0];
          }
          return item;
        });
        setContactsList(newContacts);
        setPagination({
          ...pagination,
          total,
        });
      });
  };
  const replaceText = (queryValue: string, data: string) => {
    const reg = new RegExp(queryValue, 'gi');
    data = data.replace(reg, function (txt) {
      return '<em>' + txt + '</em>';
    });
    return data;
  };
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
  const fetchRecords = () => {
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, dealtTime } = recordParams;
    edmCustomsApi
      .suppliersRecord({
        size,
        companyName,
        country,
        groupByCountry: true,
        from: from - 1,
        sortBy,
        order,
        hsCode,
        goodsShipped,
        relationCountry: relationCountryList,
        startTransDate: dealtTime[0],
        endTransDate: dealtTime[1],
      })
      .then(res => {
        const { transactionRecords, total } = res;
        setPagination({
          ...pagination,
          total,
        });
        setTableList(handerTalbeData(transactionRecords));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const fetchSupplier = () => {
    const { from, size, sortBy, order, relationCountryList } = recordParams;
    edmCustomsApi
      .suppliersBuyers({
        size,
        companyName,
        country,
        groupByCountry: true,
        from: from - 1,
        sortBy,
        order,
        buyersCountry: relationCountryList,
      })
      .then(res => {
        const { companies, total } = res;
        setPagination({
          ...pagination,
          total,
        });
        setTableList(companies);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const featchPurchase = async () => {
    const buyers = await featchPurchaseBuyers();
    const support = await featchPurchaseSupplier();
    setBuyAndSupport({
      buy: buyers,
      supplie: support,
    });
    setLoading(false);
  };
  const featchPurchaseBuyers = async () => {
    const { from, size, sortBy, order, relationCountryList } = recordParams;
    // let buyers
    const res = await edmCustomsApi.suppliersBuyers({
      size: 10,
      companyName,
      country,
      groupByCountry: true,
      from: from - 1,
      sortBy: 'percentage',
      order: 'desc',
      buyersCountry: relationCountryList,
      year: new Date().getFullYear() - 3,
      endYear: new Date().getFullYear(),
    });
    // console.log(res,334353535353535);
    return res.companies;
  };
  const featchPurchaseSupplier = async () => {
    const { from, size, sortBy, order, relationCountryList } = recordParams;
    const res = await edmCustomsApi.buyersSuppliers({
      size: 10,
      companyName,
      country,
      groupByCountry: true,
      from: from - 1,
      sortBy: 'percentage',
      order: 'desc',
      suppliersCountry: relationCountryList,
      year: new Date().getFullYear() - 3,
      endYear: new Date().getFullYear(),
    });
    return res.companies;
  };
  const fetchFreight = () => {
    const { from, size, sortBy, order, hsCode, goodsShipped, relationCountryList, originCountry } = recordParams;
    edmCustomsApi
      .suppliersFreight({
        size,
        companyName,
        country,
        groupByCountry: true,
        from: from - 1,
        sortBy,
        order,
        hsCode,
        goodsShipped,
        buyersCountry: relationCountryList,
        originCountry,
      })
      .then(res => {
        const { freightInfoList, total } = res;
        setPagination({
          ...pagination,
          total,
        });
        setTableList(handerTalbeData(freightInfoList, 'goodsshpd'));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const [allContacts, setAllContactList] = useState<contactsType[]>([]);
  const contact_list = useMemo(
    () =>
      allContacts.map((item, index) => ({
        contactName: item.contactName,
        email: item.email,
        telephones: Array.isArray(item.telephones) ? item.telephones : [],
        social_platform: item.socialPlatform,
        job: item.job,
        key: index,
      })),
    [allContacts]
  );
  const inputCustomer = async () => {
    if (contactsList.length <= 1) {
      const customerInfo = {
        name: originCompanyName,
        company_name: originCompanyName,
        area: ['', baseData?.country, '', ''],
        address: baseData.address,
        contact_list: contactsList.map(e => ({
          contact_name: e.contactName,
          email: e.email,
          telephones: e.telephones,
        })),
        company_id: companyRelationState?.companyId || '',
      };
      setCustomerData(customerInfo as any);
      setUniVisible(true);
    } else {
      if (contact_list.length === 0) {
        const _contacts = await fetchAllContacts();
        setAllContactList(_contacts);
      }
      setContactsVisible(true);
    }
    customsDataTracker.trackDetailTopbarClick(CustomsDataDetailTopbarClick.entryCustomer);
  };
  const handleTabTracker = () => {
    if (tabKey === 'baseInfo') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickBasicTab, { country: baseData.country, name: companyName });
    }
    if (tabKey === 'records') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickExportTab, { country: baseData.country, name: companyName });
    }
    if (tabKey === 'supplier') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickBuyerTab, { country: baseData.country, name: companyName });
    }
    if (tabKey === 'freight') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.clickFreightInfoTab, { country: baseData.country, name: companyName });
    }
    if (tabKey === 'purchaseChain') {
      customsDataTracker.trackDetailtClick(CustomsDataDetailClick.purchaseChain, { country: baseData.country, name: companyName });
    }
  };
  const onChangePage = (current: number) => {
    setPagination({
      ...pagination,
      current,
    });
    setRecordParams({
      ...recordParams,
      from: current,
    });
  };
  const triggerMaketing = (rawContacts: contactsType[]) => {
    if (rawContacts && rawContacts.length) {
      const emails = rawContacts
        .map(item => ({
          contactName: item.contactName,
          contactEmail: item.email,
          sourceName: 'customs',
        }))
        .filter(item => item.contactEmail);
      setEmailList(emails.length ? emails : [{ contactEmail: 'noEmials', contactName: '' }]);
    } else {
      setEmailList([{ contactEmail: 'noEmials', contactName: '' }]);
    }
  };
  const onMarketing = () => {
    if (pagination.total && contactsList.length && contactsList.length !== pagination.total) {
      setMaketingLoading(true);
      edmCustomsApi
        .customsContact({
          from: 0,
          size: pagination.total,
          companyName,
          country,
          excludeCommonEmail: recordParams.excludeEmail,
        })
        .then(res => {
          triggerMaketing(res.contacts);
        })
        .finally(() => {
          setMaketingLoading(false);
        });
    } else {
      triggerMaketing(contactsList);
    }
  };
  const handleGetAllContact = async () => {
    if (pagination.total && contactsList.length && contactsList.length !== pagination.total) {
      const res = await edmCustomsApi.customsContact({
        from: 0,
        size: pagination.total,
        companyName,
        country,
        excludeCommonEmail: true,
      });
      return res.contacts;
    }
    return contactsList;
  };
  const onTableChange = (currentPagination: any, filter: any, sorter: any) => {
    const { current, pageSize } = currentPagination;
    const { field, order } = sorter;
    const sorterParams = {
      sortBy: order ? field : '',
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : '',
    };
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
    setRecordParams({
      ...recordParams,
      ...sorterParams,
      from: current,
      size: pageSize,
    });
  };
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInDetail(companyRelationState), [companyRelationState]);
  // const showInputClue = !baseData?.clueStatus;
  // const showInputCustomers = contactsList?.length > 0;
  return (
    <div className={style.customsDataDetail}>
      <DetailHeader
        className={classnames(style.header)}
        defaultLogo={clueLogo as unknown as string}
        isCanToggle={false}
        title={companyName}
        content={
          <>
            {renderDataTagList([
              {
                content: getTransText('GONGYINGSHANG'),
              },
              {
                content: customerTagContent ? (
                  <CustomerTag
                    tagProps={customerTagContent}
                    companyName={originCompanyName}
                    country={country}
                    refresh={() => getCompanyRelationState()}
                    source="customs"
                  />
                ) : null,
                priority: true,
                style: 'green',
              },
              {
                content: baseData?.contactStatus ? baseData?.contactStatus : '',
                style: 'blue',
              },
            ])}
            {/* <div className={style.content}>{getIn18Text('GONGYINGSHANG')}</div>
            {baseData?.customerStatus ? <div className={classnames(style.content)}>{baseData?.customerStatus}</div> : ''}
            {baseData?.orgCustomerStatus ? <div className={classnames(style.content)}>{baseData?.orgCustomerStatus}</div> : ''} */}
          </>
        }
        options={
          <div className={style.options}>
            <SubCompanyButton baseData={baseData} onChangeCollectId={onCollectIdChange} />
            {!!baseData.globalSearchCompanyId && (
              <Button
                onClick={() => {
                  setDigVisible(true);
                }}
              >
                {getIn18Text('CHAKANGONGSIXIANGQING')}
              </Button>
            )}
            {/* {
              InputMoreContact
              baseData?.clueStatus ? '' : <Button onClick={inputClue}>{getIn18Text("LURUXIANSUO")}</Button>
            } */}
            {inputCustomerBtn.show ? (
              <Button onClick={inputCustomer} type="primary">
                {inputCustomerBtn.text}
              </Button>
            ) : (
              ''
            )}
          </div>
        }
      />
      <div key={Number(visible)} className={classnames(style.body)}>
        <FoldCard
          className={style.tabs}
          title={
            <Tabs size="small" tabBarGutter={20} activeKey={tabKey} onChange={setTabKey} onTabClick={handleTabTracker}>
              {tabList.map(item => (
                <TabPane tab={item.text} key={item.key} />
              ))}
            </Tabs>
          }
        >
          {tabKey === 'baseInfo' && (
            <BaseInfo
              dataType="suppliers"
              detail={baseData}
              usdRY={usdRecentYear}
              recordCRY={recordCountRecentYear}
              onChangeUsdRY={setUsdRY}
              onChangeRecordCountRY={setRecordCountRY}
              openDrawer={onOpen}
              isCanExactDig={!!baseData.canExactlyExcavate}
              onDig={() => {
                setDigVisible(true);
              }}
            />
          )}
          {tabKey === 'contacts' && (
            <Contacts
              getAllContacts={handleGetAllContact}
              detail={contactsDetail}
              contactsList={contactsList}
              originCompanyName={originCompanyName}
              pagination={{
                ...pagination,
                pageSize: 50,
              }}
              onChangePage={onChangePage}
              onMarketing={onMarketing}
              maketingLoading={maketingLoading}
              excludeEmail={excludeEmail}
              setExcludeEmail={(excludeEmail: boolean) => {
                outerValue.current.excludeEmail = excludeEmail;
                handerReqParams();
                setExcludeEmail(excludeEmail);
              }}
              companyName={companyName}
              country={country}
            />
          )}
          {tabKey === 'records' && (
            <Record
              dataType="suppliers"
              detail={baseData}
              hsCode={hsCode}
              goodsShipped={goodsShipped}
              tableList={tableList}
              loading={loading}
              pagination={pagination}
              usdRY={usdRecentYear}
              recordCRY={recordCountRecentYear}
              countryList={countryList}
              allCountry={allCountry}
              statistics={statistics}
              year={year}
              onChangeDealTime={(dealtTime: [string, string]) => {
                outerValue.current.dealtTime = dealtTime;
                handerReqParams();
              }}
              onChangeYear={(year: number[]) => {
                setYear(year);
              }}
              onChangeUsdRY={setUsdRY}
              onChangeRecordCountRY={setRecordCountRY}
              onChangeHscode={key => {
                setHsCode(key);
                outerValue.current.hsCode = key;
                handerReqParams();
              }}
              onChangeGoods={key => {
                setGoodsShipped(key);
                outerValue.current.goodsShipped = key;
                handerReqParams();
              }}
              onChangeCountry={(key: string[]) => {
                setCountryList(key);
                outerValue.current.relationCountryList = key;
                handerReqParams();
              }}
              onChange={onTableChange}
              openDrawer={onOpen}
            />
          )}
          {tabKey === 'supplier' && (
            <Supplier
              tableList={tableList}
              pagination={pagination}
              title={getIn18Text('CAIGOUSHANG')}
              dataType="buysers"
              type="suppliers"
              loading={loading}
              year={barYear}
              barData={barData}
              countryList={countryList}
              allCountry={allCountry}
              onChangeCountry={(key: string[]) => {
                setCountryList(key);
                outerValue.current.relationCountryList = key;
                handerReqParams();
              }}
              onChangeYear={(year: number[]) => {
                setBarYear(year);
              }}
              onChange={onTableChange}
              suppliersName={companyName}
              suppliersCountry={country}
              openDrawer={onOpen}
            />
          )}
          {tabKey === 'freight' && (
            <Freight
              type="suppliers"
              tableList={tableList}
              loading={loading}
              pagination={pagination}
              hsCode={hsCode}
              goodsShipped={goodsShipped}
              countryList={countryList}
              allCountry={allCountry}
              originCountry={originCountry}
              onChangeHscode={key => {
                setHsCode(key);
                outerValue.current.hsCode = key;
                handerReqParams();
              }}
              onChangeGoods={key => {
                setGoodsShipped(key);
                outerValue.current.goodsShipped = key;
                handerReqParams();
              }}
              onChangeCountry={(key: string[]) => {
                setCountryList(key);
                outerValue.current.relationCountryList = key;
                handerReqParams();
              }}
              onChangeOriginCountry={(key: string[]) => {
                outerValue.current.originCountry = key;
                handerReqParams();
              }}
              onChange={onTableChange}
            />
          )}
          {tabKey === 'purchaseChain' && (
            <PurchaseChain tabList={buyAndSupport} recordParams={recordParams} companyName={companyName} openDrawer={onOpen} country={country} />
          )}
          {clientVisible && (
            <CreateNewClientModal
              liteField={['main_contact', 'telephones', 'contact_name_box']}
              visible={clientVisible}
              customerData={customerData}
              onCancel={() => {
                setClientVisible(false);
                fetchBase();
              }}
              pageType="new"
            />
          )}
          {contactsVisible && (
            <ContactsSelectModal
              contactsList={contact_list}
              onOk={contact_list => {
                setContactsVisible(false);
                const customerInfo = {
                  company_name: originCompanyName,
                  company_id: companyRelationState?.companyId || '',
                  area: ['', baseData?.country, '', ''],
                  address: baseData.address,
                  contact_list: contact_list.map(e => ({
                    ...e,
                    contact_name: e.contactName,
                  })),
                };
                setCustomerData(customerInfo);
                setUniVisible(true);
                // setClientVisible(true);
              }}
              onCancel={() => {
                setContactsVisible(false);
              }}
              visible={contactsVisible}
            />
          )}
        </FoldCard>
        <UniDrawerWrapper
          visible={uniVisible}
          source="customs"
          customerStage=""
          customerId={Number(companyRelationState.companyId) || undefined}
          customerData={customerData}
          onClose={() => {
            setUniVisible(false);
          }}
          onSuccess={() => {
            setUniVisible(false);
            fetchBase();
            getCompanyRelationState();
          }}
        />

        <DetailDrawer
          companyId={baseData.globalSearchCompanyId}
          onClose={() => {
            setDigVisible(false);
            fetchBase();
          }}
          visible={digVisible}
        />
      </div>
    </div>
  );
};
export default SuppliersDetail;
