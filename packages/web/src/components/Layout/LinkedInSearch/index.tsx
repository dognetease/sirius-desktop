import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumb, Space, Input, Select, message, Table, Popover, Divider, ConfigProvider, Empty, TablePaginationConfig, PaginationProps, Tooltip } from 'antd';
import { navigate } from '@reach/router';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import {
  api,
  apis,
  GlobalSearchApi,
  IGlobalSearchDeepGrubStat,
  WhatsAppAiSearchTaskStatus,
  AddressBookApi,
  EdmSendBoxApi,
  InvalidEmailSimpleData,
  ILinkedInCompanyRespItem,
  DataStoreApi,
  GlobalSearchItem,
  EdmSendConcatInfo,
} from 'api';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { useMemoizedFn } from 'ahooks';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';

import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { renderDataTagList } from '../utils/index';
import SearchTabs from '../globalSearch/search/SearchTab';
import { ReactComponent as LocationIcon } from '../globalSearch/assets/loc.svg';
import { EmptyPage, IEmptyPageProps } from './EmptyPage';
import { CompanyDetail } from '../globalSearch/detail/CompanyDetail';
import Translate from '@/components/Layout/CustomsData/components/Translate/translate';
import SearchProgress from './searchProgress';
import { ReactComponent as SearchIcon } from '@/images/icons/datasearch/searchIcon.svg';
import { InitSearchPage } from './initSearchPage';
import { TAB_LIST, PersonSearchTypeList, PersonSearchType, SearchType } from './constant';
import { ReactComponent as FacebookIcon } from '../globalSearch/assets/facebook.svg';
import { ReactComponent as TwitterIcon } from '../globalSearch/assets/twitter.svg';
import { ReactComponent as LinkedInOutLine } from './assets/linkedinOutline.svg';
import { MarketingOperation } from './marketingOperation/index';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getTransText } from '@/components/util/translate';
import { LinkedInSearchTracker } from './tracker';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
const eventApi = api.getEventApi();
import { getIn18Text } from 'api';
import SocailMediaLink from '../globalSearch/component/SocialMediaLink/SocialMediaLink';
import { useLeadsAdd } from '../globalSearch/hook/useLeadsAdd';
import CustomerTag from '../globalSearch/component/CustomerTag';
import { generateHandleFilterReceivers, getCustomerAndLeadsTagInList } from '../globalSearch/utils';
import HistoryDropDown from '../globalSearch/search/HistoryDorpDown';
import { useSearchHistory } from './hooks/useSearchHistory';
import { MAX_MARKET_ROWS_LEN, MAX_SELECT_ROWS_LEN } from '../globalSearch/constants';
import { useMarketingWrapper } from '../globalSearch/hook/useMarketingWrapper';
import { asyncTaskMessage$ } from '../globalSearch/search/GrubProcess/GrubProcess';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const addressBookApi = api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const LINKIN_SEARCH_LIST = 'LINKIN_SEARCH_LIST';

interface pageReq {
  page: number;
  pageSize?: number;
  query?: string;
  countries?: string;
  jobTitle?: string;
  industry?: string;
}

type ContactEmail = {
  contactName: string;
  contactEmail: string;
};
interface PageInfo {
  total: number;
  page: number;
  pageSize: number;
}

let timeoutTaskId: null | number = null;

export const LinkedInSearchPage = () => {
  const [isInit, setIsInit] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TAB_LIST[0].value);
  const [companyTableData, setCompanyTableData] = useState<ILinkedInCompanyRespItem[]>([]);
  const [personTableData, setPersonTableData] = useState<ILinkedInCompanyRespItem[]>([]);
  const [companyPageInfo, setCompanyPageInfo] = useState<PageInfo>({
    page: 1,
    total: 0,
    pageSize: (dataStoreApi.getSync(LINKIN_SEARCH_LIST).data as unknown as number) ?? 10,
  });
  const [personPageInfo, setPersonPageInfo] = useState<PageInfo>({
    page: 1,
    total: 0,
    pageSize: (dataStoreApi.getSync(LINKIN_SEARCH_LIST).data as unknown as number) ?? 10,
  });

  const [industry, setIndustry] = useState('');
  const [industryOptions, setIndustryOptions] = useState<
    {
      label: string;
      value: string;
    }[]
  >([{ label: getIn18Text('QUANBU'), value: '' }]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerId, setDrawerId] = useState('');
  const [noSearchData, setNoSearchData] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkList, setLinkList] = useState<IEmptyPageProps['linkList']>([]);
  const [countries, setCountries] = useState<string | undefined>();
  const [countryList, setCountryList] = useState<
    {
      label: string;
      code: string;
    }[]
  >([]);

  const [translateHoverIndex, setTranslateHoverIndex] = useState(-1);

  // 任务搜索相关
  const [taskSearchVisible, setTaskSearchVisible] = useState(false);
  const [taskMinimize, setTaskMinimize] = useState(false);
  const [taskStatus, setTaskStatus] = useState<WhatsAppAiSearchTaskStatus>(WhatsAppAiSearchTaskStatus.STOP);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskManualStop, setTaskManualStop] = useState(false);

  // table相关
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<ILinkedInCompanyRespItem[]>([]);
  const needCheckEmailList = React.useRef<{ contactName: string; contactEmail: string }[]>([]);
  const [shouldConfirm, setShouldConfirm] = useState<boolean>(false);
  const emailRef = React.useRef<{
    all: ContactEmail[];
    needCheck: ContactEmail[];
    id?: string | null;
  }>({
    all: [],
    needCheck: [],
    id: '',
  });

  const clickType = React.useRef<string>('header');
  const childRef = React.useRef<any>();
  const listRef = React.useRef();
  const [receivers, setReceivers] = useState<Array<ContactEmail>>([]);
  const [draftId, setDraftId] = useState<string>('');
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [checkedEmails, setCheckedEmails] = useState<ContactEmail[]>([]);
  const [tablSendMail, setSendMail] = useState<ContactEmail[]>([]);
  const searchInputRef = useRef<HTMLDivElement>(null);
  // 营销相关
  const [contacts, setContacts] = useState<{
    mobiles: any;
    mails: any;
  }>({
    mobiles: [],
    mails: [],
  });
  const [selectEmailCount, setSelectEmailCount] = useState<number>(0);
  const [selectPhoneCount, setSelectPhoneCount] = useState<number>(0);
  const resetStatus = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setContacts({ mobiles: [], mails: [] });
    if (activeTab === SearchType.person) {
      setPersonPageInfo({ page: 1, pageSize: personPageInfo.pageSize, total: 0 });
      setPersonTableData([]);
    } else {
      setCompanyPageInfo({ page: 1, pageSize: companyPageInfo.pageSize, total: 0 });
      setCompanyTableData([]);
    }
    setNoSearchData(false);
  };
  const onTaskSearchStop = () => {
    setTaskManualStop(true);
    setTaskSearchVisible(false);
    setTaskStatus(WhatsAppAiSearchTaskStatus.STOP);
    if (timeoutTaskId) {
      clearTimeout(timeoutTaskId);
    }
    const total = activeTab === SearchType.person ? personPageInfo.total : companyPageInfo.total;
    message.warn(`${getIn18Text('StopAISearchPrefix')}${total}${getIn18Text('StopAISearchSuffix')}`);
  };
  const onTaskSearchFinish = () => {
    setTaskSearchVisible(false);
  };

  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setContacts({ mobiles: [], mails: [] });
    const gotoGlobalSearch = () => {
      navigate(`#wmData?page=globalSearch&type=company&keywords=${encodeURIComponent(query)}`);
    };
    const gotoCustomerData = () => {
      navigate(`#wmData?page=customs&type=company&keywords=${encodeURIComponent(query)}`);
    };

    if (activeTab === 'company') {
      setLinkList([
        { label: getIn18Text('searchCompanyInGlobal'), onClick: gotoGlobalSearch },
        {
          label: getIn18Text('HAIGUANSHUJU'),
          onClick: gotoCustomerData,
        },
      ]);
    } else {
      setLinkList([{ label: getIn18Text('searchCompanyInGlobal'), onClick: gotoGlobalSearch }]);
    }
  }, [activeTab, query]);

  const onPageChange = (page: number, size?: number) => {
    if (taskSearchVisible) {
      return;
    }
    try {
      if (typeof companyPageInfo.pageSize === 'number') {
        dataStoreApi.putSync(LINKIN_SEARCH_LIST, JSON.stringify(size || companyPageInfo.pageSize), {
          noneUserRelated: false,
        });
      }
    } catch (error) {}
    if (activeTab === 'company') {
      setCompanyPageInfo({
        ...companyPageInfo,
        page,
        pageSize: size || companyPageInfo.pageSize,
      });
      fetchSearchCompany(
        {
          page,
          pageSize: size || companyPageInfo.pageSize,
          query,
        },
        false
      );
    } else {
      setPersonPageInfo({
        ...personPageInfo,
        page,
        pageSize: size || personPageInfo.pageSize,
      });
      fetchSearchPersonCompany(
        {
          page,
          pageSize: size || personPageInfo.pageSize,
          query,
          jobTitle,
          countries,
        },
        false
      );
    }
  };

  const testQuery = (q: string) => {
    q = q ?? '';
    if (q.length < 2) {
      message.error(getIn18Text('queryNotLongTip'));
      return false;
    }
    return true;
  };

  const isTasking = (taskStatus: number) => taskStatus === 1;

  const updateTaskingStatus = (visible: boolean, searched: number, status: WhatsAppAiSearchTaskStatus) => {
    setTaskSearchVisible(visible);
    setTaskTotal(searched);
    setTaskStatus(status);
  };

  const updateTableDataStatus = (list: any) => {
    if (list && Array.isArray(list) && list.length > 0) {
      if (activeTab === SearchType.person) {
        setPersonTableData(list);
      } else {
        setCompanyTableData(list);
      }
      setNoSearchData(false);
      LinkedInSearchTracker.trackListResult(true, query, activeTab, Boolean(industry));
      return;
    }

    setNoSearchData(true);
    LinkedInSearchTracker.trackListResult(false, query, activeTab, Boolean(industry));
    if (activeTab === SearchType.person) {
      setPersonTableData([]);
    } else {
      setCompanyTableData([]);
    }
  };

  const pageInfoComputed = useMemo(() => {
    if (activeTab === SearchType.person) {
      return { ...personPageInfo };
    }
    return { ...companyPageInfo };
  }, [activeTab, personPageInfo, companyPageInfo]);

  // 找人-公司
  const fetchSearchPersonCompany = (reqParams: pageReq, toast = true) => {
    let { query: queryParams } = reqParams;
    queryParams = queryParams ?? query;
    if (!testQuery(queryParams)) {
      resetStatus();
      return;
    }
    reqParams = reqParams ?? {};
    const params = {
      page: reqParams.page,
      size: reqParams.pageSize || companyPageInfo.pageSize,
      searchValue: queryParams,
      countryList: reqParams.countries ? [reqParams.countries] : undefined,
      jobTitle: reqParams.jobTitle ?? jobTitle,
    };
    setLoading(true);
    globalSearchApi
      .getLinkedInSearch(params)
      .then(resp => {
        const { total, totalExtraNums, taskStatus, data = [] } = resp;
        setPersonPageInfo({ pageSize: reqParams.pageSize || companyPageInfo.pageSize, page: reqParams.page, total: total ?? 0 });
        if (isTasking(taskStatus)) {
          timeoutTaskId = window.setTimeout(() => {
            fetchSearchPersonCompany({
              page: pageInfoComputed.page,
              pageSize: pageInfoComputed.pageSize,
              query: queryParams,
              jobTitle: reqParams.jobTitle ?? jobTitle,
              countries: reqParams.countries,
            });
          }, 5000);
          if (data && Array.isArray(data)) {
            setPersonTableData(data);
          }
          updateTaskingStatus(true, totalExtraNums, WhatsAppAiSearchTaskStatus.SEARCHING);
        } else {
          updateTaskingStatus(false, totalExtraNums, WhatsAppAiSearchTaskStatus.STOP);
          updateTableDataStatus(data);
          if (toast) {
            message.success(`${getIn18Text('FinishAISearchPrefix')}${total || 0}${getIn18Text('FinishAISearchSuffix')}`);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchSearchCompany = (reqParams: pageReq, toast = true) => {
    let { query: queryParams, industry: companyIndustry } = reqParams;
    queryParams = queryParams ?? query;
    if (!testQuery(queryParams)) {
      resetStatus();
      return;
    }
    reqParams = reqParams ?? {};
    const params = {
      page: reqParams.page,
      size: reqParams.pageSize || companyPageInfo.pageSize,
      name: queryParams,
      industry: companyIndustry ?? industry,
    };

    setLoading(true);
    globalSearchApi
      .getNewLinkedInCompanySearch(params)
      .then(resp => {
        const { data, total, industries, totalExtraNums, taskStatus } = resp;
        setCompanyPageInfo({ pageSize: reqParams.pageSize || companyPageInfo.pageSize, page: reqParams.page, total: total ?? 0 });
        if (industries) {
          setIndustryOptions(
            [
              {
                label: getIn18Text('QUANBU'),
                value: '',
              },
            ].concat(
              industries.map(value => ({
                label: value,
                value,
              }))
            )
          );
        }
        if (isTasking(taskStatus)) {
          timeoutTaskId = window.setTimeout(() => {
            fetchSearchCompany({
              page: pageInfoComputed.page,
              pageSize: pageInfoComputed.pageSize,
              query: queryParams,
              industry: companyIndustry ?? industry,
            });
          }, 5000);
          updateTaskingStatus(true, totalExtraNums, WhatsAppAiSearchTaskStatus.SEARCHING);
          if (data && Array.isArray(data)) {
            setCompanyTableData(data);
          }
        } else {
          updateTaskingStatus(false, totalExtraNums, WhatsAppAiSearchTaskStatus.STOP);
          if (toast) {
            message.success(`${getIn18Text('FinishAISearchPrefix')}${total || 0}${getIn18Text('FinishAISearchSuffix')}`);
          }
          updateTableDataStatus(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchCountryList = () => {
    globalSearchApi
      .getLinkedInCountryList({
        searchType: 2,
      })
      .then(data => {
        setCountryList(
          data.map(each => ({
            label: each.label,
            code: each.code,
          }))
        );
      });
  };

  useEffect(() => {
    fetchCountryList();
  }, []);

  const onTabChange = (value: string) => {
    // needCheckEmailList.current = []
    setCheckedEmails([]);
    setSendMail([]);
    setActiveTab(value as SearchType);
  };

  const goDetailPage = (id: string) => {
    setDrawerId(id);
    setDrawerVisible(true);
  };

  const paddingUrl = (url: string) => {
    if (url && url.startsWith('http')) {
      return url;
    }
    return 'http://' + url;
  };

  const getTableColumns = () => {
    const enterpriseCellRender = (_text: number | string, record: ILinkedInCompanyRespItem, _index: number) => {
      const { nameHighLight, location, linkedin, id, contactStatus = '', referId, customerLabelType, name, country } = record;
      const customerTagContent = getCustomerAndLeadsTagInList({ referId, customerLabelType });
      return (
        <div
          className={styles.tableEnterpriseWrapper}
          onClick={() => {
            goDetailPage(id);
            LinkedInSearchTracker.trackListClick('companyName');
          }}
        >
          <p className={styles.name}>
            <EllipsisTooltip>
              <span
                dangerouslySetInnerHTML={{
                  __html: nameHighLight,
                }}
              />
            </EllipsisTooltip>
          </p>
          <div style={{ margin: '4px 0px' }}>
            {renderDataTagList([
              {
                content: customerTagContent ? <CustomerTag tagProps={customerTagContent} companyName={name} country={country} source="snsSearch" /> : null,
                priority: true,
                style: 'green',
              },
              {
                content: contactStatus,
                style: 'blue',
              },
            ])}
          </div>
          <p>
            <span className={styles.icon}>
              <LinkedInOutLine />
            </span>
            <SocailMediaLink
              tipType="linkedin"
              className={styles.loc}
              title={linkedin || '-'}
              href={paddingUrl(linkedin)}
              onClick={e => {
                e.stopPropagation();
                LinkedInSearchTracker.trackListClick('link');
              }}
            >
              <span className={styles.linkedinText}>{linkedin || '-'}</span>
            </SocailMediaLink>
          </p>
          <p>
            <span className={styles.icon}>
              <LocationIcon />
            </span>
            <span className={styles.loc}>{location || '-'}</span>
          </p>
        </div>
      );
    };
    const informationCellRender = (_text: number | string, record: any, index: number) => {
      const { overviewDescription, id } = record;
      return (
        <div
          className={classnames(styles.tableGoodDesc, styles.multiLineOverflow)}
          onMouseEnter={() => setTranslateHoverIndex(index)}
          onMouseLeave={() => setTranslateHoverIndex(-1)}
          onClick={() => goDetailPage(id)}
        >
          {overviewDescription}
          {translateHoverIndex === index && overviewDescription && <Translate bodyContainer classnames={styles.translate} title={overviewDescription} />}
        </div>
      );
    };
    const contactMailCellRender = (_text: number | string, record: any, _index: number) => {
      let { id, defaultEmail, emailCount } = record;
      defaultEmail = defaultEmail ?? '-';
      return (
        <div>
          <p>{defaultEmail}</p>
          {emailCount > 1 && (
            <a
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                goDetailPage(id);
              }}
            >
              {getIn18Text('CHAKANQUANBU')}
              {emailCount}
              个邮箱
            </a>
          )}
        </div>
      );
    };
    const contactMobileCellRender = (_text: number | string, record: any, _index: number) => {
      let { id, phoneCount, defaultPhone } = record;
      defaultPhone = defaultPhone ?? '-';
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <p>{defaultPhone}</p>
          {phoneCount?.length > 1 && (
            <a
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                goDetailPage(id);
              }}
            >
              {getIn18Text('CHAKANQUANBU')}
              {phoneCount.length}
              个电话
            </a>
          )}
        </div>
      );
    };
    const operatorCellRender = (_text: number | string, record: any, _index: number) => {
      const { contactList = [], grubStatus, id, emailCount, phoneCount } = record;
      const emails = contactList.filter((e: any) => e.contact && e.contact.length).map((e: any) => e.contact);
      const mobiles = contactList.filter((e: any) => e.phone && e.phone.length).map((e: any) => e.phone);
      // YIWAJUE WAJUEZHONG...
      let btnText;
      switch (grubStatus) {
        case 'GRUBBED':
          btnText = getIn18Text('YIWAJUE');
          break;
        case 'GRUBBING':
          btnText = getIn18Text('WAJUEZHONG...');
          break;
        case 'OFFLINE_GRUBBING':
          btnText = '离线深挖中';
          break;
        case 'OFFLINE_GRUBBED':
          btnText = '离线深挖完成';
          break;
        default:
          btnText = getIn18Text('SHENWALIANXIREN');
      }
      return (
        <Space direction="vertical">
          <Button
            disabled={grubStatus && grubStatus !== 'NOT_GRUBBING'}
            loading={grubStatus === 'GRUBBING'}
            onClick={() => {
              deepSearching(record);
              setCompanyTableData((pre: any[]) =>
                pre.map(each => {
                  if (each.id === id) {
                    return {
                      ...each,
                      grubStatus: 'GRUBBING',
                    };
                  }
                  return each;
                })
              );
              LinkedInSearchTracker.trackListClick('evacuate');
            }}
            btnType="primary"
            style={{ minWidth: 100 }}
          >
            {btnText}
          </Button>
          <MarketingOperation
            id={[id]}
            ref={listRef}
            tablSendMail={tablSendMail}
            activeTab={activeTab}
            clickByYijian={() => {
              companyCreatInfos([id]);
            }}
            shouldConfirm={(mailList, allInvalidEmails) => {
              emailRef.current.id = id;
              setShouldConfirm(true);
              clickType.current = 'table';
              needCheckEmailList.current = mailList;
              emailRef.current.all = allInvalidEmails;
            }}
            emails={emails}
            emailCount={emailCount}
            phoneCount={phoneCount}
            phoneNums={mobiles}
            buttonProps={{ className: styles.marketingOperation }}
          />
        </Space>
      );
    };
    if (activeTab === 'company') {
      return [
        {
          title: getIn18Text('GONGSIMINGCHENG'),
          render: enterpriseCellRender,
          className: styles.tableEnterprise,
        },
        {
          title: getIn18Text('companyDesc'),
          render: informationCellRender,
        },
        {
          title: getIn18Text('LIANXIRENYOUXIANG'),
          render: contactMailCellRender,
        },
        {
          title: getIn18Text('contactMobiles'),
          render: contactMobileCellRender,
        },
        {
          title: getIn18Text('CAOZUO'),
          render: operatorCellRender,
          fixed: 'right',
          align: 'center',
          width: 140,
        },
      ];
    }
    if (activeTab === 'person') {
      return [
        {
          title: getIn18Text('LIANXIREN'),
          width: '200px',
          dataIndex: 'name',
          render(text: string, record: any) {
            const { linkedinUrl, title } = record;
            const { referId, customerLabelType, name, country } = record;
            const customerTagContent = getCustomerAndLeadsTagInList({ referId, customerLabelType });
            return (
              <div className={styles.multiLineOverflow}>
                <SocailMediaLink
                  tipType="linkedin"
                  className={styles.loc}
                  title={title || '-'}
                  href={paddingUrl(linkedinUrl)}
                  onClick={e => {
                    e.stopPropagation();
                    LinkedInSearchTracker.trackListClick('link');
                  }}
                >
                  <span className={styles.linkedinText}>{text || '-'}</span>
                </SocailMediaLink>
                <div style={{ margin: '4px 0px' }}>
                  {renderDataTagList([
                    {
                      content: customerTagContent ? <CustomerTag tagProps={customerTagContent} companyName={name} country={country} source="snsSearch" /> : null,
                      priority: true,
                      style: 'green',
                    },
                  ])}
                </div>
              </div>
            );
          },
        },
        {
          title: getIn18Text('ZHIWEI'),
          dataIndex: 'jobTitle',
          width: '200px',
        },
        {
          title: getIn18Text('GONGSI'),
          dataIndex: 'companyName',
          width: '200px',
          render(text: string) {
            return (
              <span
                dangerouslySetInnerHTML={{
                  __html: text,
                }}
              />
            );
          },
        },
        {
          title: '相关介绍',
          dataIndex: 'summary',
          width: '200px',
          render(text: string) {
            return (
              <>
                {text && (
                  <Tooltip
                    title={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: text,
                        }}
                      />
                    }
                  >
                    <div
                      className={styles.restrictShow}
                      dangerouslySetInnerHTML={{
                        __html: text,
                      }}
                    />
                  </Tooltip>
                )}
              </>
            );
          },
        },
        {
          title: '邮箱',
          dataIndex: 'emailList',
          width: '200px',
          render(text: string[]) {
            return (
              <>
                {text && text[0] ? (
                  <div>
                    {text.map((item, index) => {
                      return (
                        <div key={index} className={styles.iconBox}>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  '--'
                )}
              </>
            );
          },
        },
        {
          title: '其他联系方式',
          width: '260px',
          render(_text: string, record: any) {
            let { facebookUrl, linkedinUrl, twitterUrl, phoneList = [] } = record;
            facebookUrl = facebookUrl ?? '';
            linkedinUrl = linkedinUrl ?? '';
            twitterUrl = twitterUrl ?? '';

            return (
              <>
                {phoneList && phoneList[0] ? (
                  <div>
                    {phoneList.map((item: string, index: number) => {
                      return (
                        <div key={index} className={styles.iconBox}>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <div className={styles.tablePersonSocial}>
                  {facebookUrl.length > 0 && (
                    <a href={paddingUrl(facebookUrl)} target="_blank" rel="noreferrer">
                      <FacebookIcon />
                    </a>
                  )}
                  {twitterUrl.length > 0 && (
                    <a href={paddingUrl(twitterUrl)} target="_blank" rel="noreferrer">
                      <TwitterIcon />
                    </a>
                  )}
                </div>
              </>
            );
          },
        },
        {
          title: getIn18Text('CAOZUO'),
          dataIndex: 'jobTitle',
          fixed: 'right',
          width: '120px',
          render(_text: string, record: any) {
            const { linkedinUrl, title } = record;
            return (
              <div className={styles.multiLineOverflow}>
                <SocailMediaLink
                  tipType="linkedin"
                  className={styles.loc}
                  title={title || '-'}
                  href={paddingUrl(linkedinUrl)}
                  onClick={e => {
                    e.stopPropagation();
                    LinkedInSearchTracker.trackListClick('link');
                  }}
                >
                  <span className={styles.linkedinText}>{'查看主页' || '-'}</span>
                </SocailMediaLink>
              </div>
            );
          },
        },
      ];
    }
  };

  const columns = getTableColumns();

  const deepSearching = (item: any) => {
    asyncTaskMessage$.next({
      eventName: 'globalSearchGrubTaskAdd',
      eventData: {
        type: 'contact',
        data: {
          ...item,
        },
      },
    });
  };

  const onInitSearch = (data: any) => {
    data = data ?? {};
    const { activeTab, query } = data;
    setQuery(query);
    setActiveTab(activeTab);
    setPersonTableData([]);
    setCompanyTableData([]);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setContacts({ mobiles: [], mails: [] });
    setIsInit(false);
    LinkedInSearchTracker.trackSearch(query, activeTab, Boolean(industry));
  };

  const refresh = (re?: string) => {
    if (activeTab === 'company') {
      fetchSearchCompany({
        page: pageInfoComputed.page,
        pageSize: pageInfoComputed.pageSize,
        query,
      });
    } else {
      fetchSearchPersonCompany({
        page: pageInfoComputed.page,
        pageSize: pageInfoComputed.pageSize,
        query,
        jobTitle: re ? undefined : jobTitle,
        countries: re ? undefined : countries,
      });
    }
  };

  const onChangeListItem = (id: string | number, extraData: any) => {
    if (activeTab === SearchType.company) {
      setCompanyTableData((prev: any) =>
        prev.map((it: any) => {
          if (it.id === id) {
            return {
              ...it,
              ...extraData,
            };
          }
          return it;
        })
      );
    }
  };

  useEffect(() => {
    if (!isInit) {
      // 触发搜索
      refresh('refresh');
    }
  }, [isInit]);

  const tableDataComputed = useMemo(() => {
    if (activeTab === SearchType.person) {
      return personTableData.slice();
    }
    return companyTableData.slice();
  }, [activeTab, personTableData, companyTableData]);

  const listUniqueId = companyTableData.map((e: any) => e.id).join('');
  useEffect(() => {
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        if (event?.eventData?.type === 'contact' && event.eventData.data && activeTab === SearchType.company) {
          const { id, newEmails, newPhones, status } = event.eventData.data as IGlobalSearchDeepGrubStat;
          const resultItem = companyTableData.find((it: any) => it.id === id);
          if (resultItem) {
            setCompanyTableData((preState: any) =>
              preState.map((each: any) => {
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
  }, [listUniqueId, activeTab]);

  useEffect(() => {
    if (shouldConfirm) {
      setShouldConfirm(false);
      Confirm('marketing');
    }
  }, [shouldConfirm]);
  const contactInfo = (list: any) => {
    // for(let i = 0; i)
    let email = 0;
    let phone = 0;
    list.forEach((item: any) => {
      email += item.emailCount;
      phone += item.phoneCount;
    });
    setSelectEmailCount(email);
    setSelectPhoneCount(phone);
  };

  const createContactInfos = async (list: any) => {
    // const data: any = await handleGetContactById(list)

    const contact: {
      mobiles: any;
      mails: any;
    } = {
      mobiles: [],
      mails: [],
    };
    emailRef.current.all = [];
    needCheckEmailList.current = [];
    contact.mails = list
      .map((each: any) => each.emailList)
      .flat()
      .filter((each: string) => each && each.length > 0);
    contact.mobiles = list
      .map((each: any) => each.phoneList)
      .flat()
      .filter((each: string) => each && each.length > 0);

    setContacts(contact);
  };

  const companyCreatInfos = async (list: any) => {
    const data: any = await handleGetContactById(list);
    // debugger
    handleCompanyData(data, 'company');
  };

  const handleGetContactById = (list: string[]) => {
    return new Promise((reslove, reject) => {
      try {
        globalSearchApi
          .globalSearchGetContactById(list)
          .then(data => {
            let list: any = [];
            console.log(list, '22222xxxxsxsxsxs');
            Object.values(data).forEach(item => {
              list = [...list, ...item];
            });
            reslove(list);
          })
          .catch(() => {
            reject('接口错误');
          });
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleCompanyData = (list: any, _type: 'company' | 'Lxr') => {
    console.log(list, 'xxxxx');
    handleEmailData(list);
  };

  const handleEmailData = (contactList: any) => {
    let emails;
    emails = contactList
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: '领英搜索',
        increaseSourceName: 'linkedin',
      }))
      .filter((item: any) => item.contactEmail);
    // setHasEmail(emails.length > 0)
    console.log(contactList, 'marketing', 22222);
    // return
    needCheckEmailList.current = contactList
      .filter((item: any) => !item.checkStatus)
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: '领英搜索',
        increaseSourceName: 'linkedin',
      }))
      .filter((item: any) => item.contactEmail);

    if (emails && emails?.length) {
      emailRef.current.all = emails;
    } else {
      emailRef.current.all = [];
    }
  };
  const onCompanyLeadsPost = useMemoizedFn((extraParams?: any) =>
    globalSearchApi.globalBatchAddLeadsV1({
      globalInfoVOList: selectedRows.map(item => ({
        id: item.id,
      })),
      sourceType: 21,
      ...extraParams,
    })
  );
  const onPersonLeadsPost = useMemoizedFn((extraParams?: any) =>
    globalSearchApi.linkedInbatchAddLeads({
      globalInfoVOList: selectedRows.map(item => ({
        id: item.id,
      })),
      sourceType: 2,
      ...extraParams,
    })
  );
  const {
    handleAddLeads: hookHandleAddLeads,
    leadsAddLoading,
    noLeadsWarning,
  } = useLeadsAdd({
    onFetch: activeTab === SearchType.person ? onPersonLeadsPost : onCompanyLeadsPost,
    refresh,
  });
  const handleAddLeads = useMemoizedFn(() => {
    const validRowsLen = selectedRows.length;
    if (validRowsLen <= 0) {
      noLeadsWarning();
      return;
    }
    LinkedInSearchTracker.trackBatchOperation('addLeads', selectedRowKeys.length);
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        hookHandleAddLeads({
          extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: validRowsLen,
          asyncTaskTitle: '条联系人信息',
        }),
    });
  });

  const validateEmail = async () => {
    setReceivers(emailRef.current.all);
    const id = await edmApi.createDraft();
    setDraftId(id);
    setShowValidateEmailModal(true);
  };

  const directSendEmail = () => {
    childRef.current?.directSendEmail(clickType.current === 'header' ? undefined : emailRef.current.all);
  };

  const Confirm = (type: 'marketing' | 'adress') => {
    ShowConfirm({
      title: (
        <div style={{ fontSize: '14px' }}>
          该企业下包含未经验证的邮箱地址，是否需要验证？<div style={{ fontWeight: 'normal', fontSize: '14px' }}>（不扣除邮箱验证次数）</div>
        </div>
      ),
      okText: '验证邮箱',
      cancelText: type === 'marketing' ? '直接发信' : '直接录入',
      content: '向真实邮箱地址发信会提升您的获客成功率',
      type: 'primary',
      makeSure: validateEmail,
      onCancel: directSendEmail,
    });
  };

  const checkCallback = () => {
    if (emailRef.current.id) {
      let emailCheckResult: { key: string; value: string[] }[] = [];
      let validEmails = emailRef.current.all.map(item => item.contactEmail);
      emailCheckResult.push({
        key: 'valid',
        value: validEmails,
      });
      globalSearchApi.globalEmailCheckCallback({
        id: emailRef.current.id,
        emailCheckResult,
      });
    }
  };

  const getHistorySearchType = useCallback((currActiveTab: SearchType) => `${currActiveTab}`, []);
  const { searchHistoryOpen, searchHistory, setSearchHistoryOpen, clearHistory, addToSearchHistory } = useSearchHistory();
  const triggerSearch = (parmasObj: { query?: string; countries?: string; jobTitle?: string; industry?: string }) => {
    const { query: newQuery, countries, jobTitle, industry } = parmasObj;
    const currQuery = newQuery ?? query;
    resetStatus();
    addToSearchHistory({
      query: currQuery,
      searchType: getHistorySearchType(activeTab),
    });
    if (activeTab === SearchType.person) {
      fetchSearchPersonCompany({
        page: 1,
        pageSize: companyPageInfo.pageSize,
        query: currQuery,
        jobTitle,
        countries,
      });
      return;
    }

    fetchSearchCompany({
      page: 1,
      pageSize: companyPageInfo.pageSize,
      query: currQuery,
      industry: industry as string,
    });
    LinkedInSearchTracker.trackSearch(currQuery, activeTab, Boolean(industry));
  };
  const clickHistoryItem = (queryValue: string) => {
    setQuery(queryValue);
    triggerSearch({ query: queryValue, countries, jobTitle, industry });
  };
  const paginationComputed: PaginationProps = useMemo(
    () => ({
      pageSize: pageInfoComputed.pageSize,
      total: pageInfoComputed.total,
      current: pageInfoComputed.page,
      hideOnSinglePage: false,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50] as any,
      showQuickJumper: true,
      onChange: onPageChange,
      showTotal: (_total: number) => (
        <span>
          {getIn18Text('TotalDataPart1')}
          {Number(_total).toLocaleString()}
          {getIn18Text('TotalDataPart2')}
        </span>
      ),
    }),
    [pageInfoComputed, taskSearchVisible, onPageChange]
  );
  const { marketingBtnWrapper, limitLen } = useMarketingWrapper(selectedRowKeys);
  const menuVersion = useVersionCheck();
  let pageJSX = null;
  if (isInit) {
    pageJSX = (
      <InitSearchPage
        activeTab={activeTab}
        query={query}
        onSearch={onInitSearch}
        searchHistoryOpen={searchHistoryOpen}
        searchHistory={searchHistory}
        setSearchHistoryOpen={setSearchHistoryOpen}
        clearHistory={clearHistory}
        addToSearchHistory={addToSearchHistory}
      />
    );
  } else {
    pageJSX = (
      <div className={styles.search}>
        <Breadcrumb className={styles.bread} separator={<SeparatorSvg />}>
          <Breadcrumb.Item>
            <a
              href="javascript:void(0)"
              onClick={e => {
                e.preventDefault();
                setIsInit(true);
                setIndustry('');
                setJobTitle('');
                setCountries(undefined);
              }}
            >
              <span>{menuVersion === 'v2' ? getIn18Text('SHEMEISOUSUO') : getIn18Text('linkedinSearchText')}</span>
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span>{getIn18Text('SOUSUOJIEGUO')}</span>
          </Breadcrumb.Item>
        </Breadcrumb>
        <SearchTabs tabList={TAB_LIST} activeKey={activeTab} onChange={onTabChange} />
        <div className={styles.searchBar}>
          <Input.Group className={styles.inputWrap}>
            <span ref={searchInputRef} style={{ flex: 1 }}>
              <Input
                className={styles.input}
                prefix={<SearchIcon className={styles.inputPreIcon} />}
                placeholder={getIn18Text('QINGSHURUCHANPINMINGCHENGHUOCHANPINMIAOSHU')}
                value={query}
                disabled={taskSearchVisible}
                onFocus={() => {
                  setSearchHistoryOpen(true);
                }}
                onPressEnter={e => triggerSearch({ countries, jobTitle, industry })}
                onChange={({ target: { value } }) => setQuery(value)}
              />
            </span>
            <Button btnType="primary" className={styles.searchBtn} disabled={taskSearchVisible} onClick={() => triggerSearch({ countries, jobTitle, industry })}>
              {getIn18Text('SOUSUO')}
            </Button>
          </Input.Group>
          <HistoryDropDown
            target={searchInputRef.current?.parentElement}
            open={searchHistoryOpen && !query && searchHistory.filter(e => e.searchType === getHistorySearchType(activeTab)).length > 0}
            changeOpen={setSearchHistoryOpen}
            searchList={searchHistory}
            onDelete={clearHistory}
            onClick={clickHistoryItem}
            searchType={getHistorySearchType(activeTab)}
            subBtnVisible={false}
            autoDetectSubType={false}
          />
        </div>
        <div className={styles.companyFilterBox}>
          <div>
            {activeTab === 'company' ? (
              <div className={styles.companyFilter}>
                <div className={styles.item}>
                  <span>{getIn18Text('personIndustry')}</span>
                  <Select
                    dropdownClassName="edm-selector-dropdown"
                    suffixIcon={<DownTriangle />}
                    className={styles.fieldItem}
                    disabled={taskSearchVisible}
                    options={industryOptions}
                    value={industry}
                    placeholder={getTransText('QINGXUANZE')}
                    onChange={value => {
                      setIndustry(value);
                      triggerSearch({ query, industry: value ?? '' });
                    }}
                    onClear={() => {
                      setIndustry('');
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.personFilter}>
                <div className={styles.item}>
                  <span>{getIn18Text('GUOJIADEQU')}</span>
                  <Select
                    showSearch
                    className={styles.fieldItem}
                    dropdownClassName="edm-selector-dropdown"
                    style={{ width: 224 }}
                    // mode="multiple"
                    // maxTagCount="responsive"
                    placeholder={getIn18Text('QUANBU')}
                    disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING || taskSearchVisible}
                    filterOption
                    optionFilterProp="label"
                    options={countryList.map(country => ({
                      label: country.label,
                      value: country.code,
                    }))}
                    value={countries}
                    suffixIcon={<DownTriangle />}
                    autoFocus
                    showArrow
                    allowClear
                    onClear={() => setCountries(undefined)}
                    onChange={values => {
                      setCountries(values);
                      triggerSearch({ query, countries: values, jobTitle });
                    }}
                  />
                </div>
                <div className={styles.item}>
                  <span>{'职位关键词'}</span>
                  <Input
                    placeholder={'请输入职位关键词，按回车确认'}
                    disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING || taskSearchVisible}
                    value={jobTitle}
                    style={{ width: 224 }}
                    onChange={({ target: { value } }) => {
                      setJobTitle(value);
                    }}
                    onPressEnter={() => triggerSearch({ query, countries, jobTitle })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableWrapperTopBox}>
            <div className={styles.btnGroup}>
              <div className={styles.topTip}>
                <span hidden={selectedRowKeys.length > 0}>
                  {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{paginationComputed.total || 0}</span> {getIn18Text('GEJIEGUO')}
                </span>
                <span hidden={!selectedRowKeys.length} className={styles.topTip}>{`${getIn18Text('YIXUAN')} ${selectedRowKeys.length} ${
                  activeTab === SearchType.company ? '家企业' : '个联系人'
                }`}</span>
              </div>

              {activeTab === SearchType.company &&
                marketingBtnWrapper(
                  <MarketingOperation
                    ref={childRef}
                    activeTab={activeTab}
                    id={selectedRowKeys}
                    emailCount={selectEmailCount}
                    phoneCount={selectPhoneCount}
                    clickByYijian={() => {
                      companyCreatInfos(selectedRowKeys);
                    }}
                    shouldConfirm={(mailList, allMailList) => {
                      setShouldConfirm(true);
                      clickType.current = 'header';
                      needCheckEmailList.current = mailList;
                      emailRef.current.all = allMailList;
                    }}
                    disabled={!selectedRowKeys.length || selectedRowKeys.length > limitLen || (selectEmailCount === 0 && selectPhoneCount === 0)}
                    emails={contacts.mails}
                    phoneNums={contacts.mobiles}
                    checkedEmails={checkedEmails}
                  />
                )}
              <Button btnType="minorLine" disabled={selectedRowKeys.length === 0} style={{ marginLeft: '12px' }} onClick={handleAddLeads} loading={leadsAddLoading}>
                {getIn18Text('LURUXIANSUO')}
              </Button>
            </div>
            <div className={styles.toolsPage}>
              {Number(paginationComputed.total) > 0 && (
                <SiriusPagination
                  onChange={(pg, pgsize) => {
                    onPageChange(pg, pgsize);
                  }}
                  simple
                  current={paginationComputed.current}
                  pageSize={paginationComputed.pageSize}
                  defaultCurrent={1}
                  total={paginationComputed.total}
                />
              )}
            </div>
          </div>
          <ConfigProvider
            renderEmpty={() => {
              if (noSearchData) {
                return <EmptyPage linkList={linkList} />;
              }
              return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
            }}
          >
            <SiriusTable
              rowKey="id"
              loading={loading}
              dataSource={tableDataComputed}
              columns={columns}
              scroll={{ x: '1134' }}
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedRowKeys,
                preserveSelectedRowKeys: true,
                onChange: (keys: React.Key[], rows: any[]) => {
                  if (keys.length > MAX_SELECT_ROWS_LEN) {
                    message.warning(`仅可选择${MAX_SELECT_ROWS_LEN}条数据`);
                    return;
                  }
                  setSelectedRowKeys(keys as string[]);
                  setSelectedRows(rows);
                  contactInfo(rows);
                  if (activeTab === 'person') {
                    createContactInfos(rows);
                  }
                },
              }}
            />
            <SiriusPagination className={styles.pagination} {...paginationComputed} />
          </ConfigProvider>
        </div>
        <SearchProgress
          visible={taskSearchVisible}
          total={taskTotal}
          minimize={taskMinimize}
          taskStatus={taskStatus}
          isManualStop={taskManualStop}
          onMinimizeChange={setTaskMinimize}
          onStop={onTaskSearchStop}
          onFinish={onTaskSearchFinish}
          translateKeyList={['startLinkedinSearch', 'ExpandSearchKeywords', 'searchCompanyInLinkedin', 'eatractClientInfo', 'ConsolidateSearchResults']}
        />
        <Drawer
          visible={drawerVisible}
          onClose={() => {
            setDrawerId('');
            setDrawerVisible(false);
          }}
          width={872}
          zIndex={1000}
        >
          {drawerVisible ? (
            <CompanyDetail onChangeListItem={onChangeListItem} showSubscribe origin="linkedIn" scene="linkedin" id={drawerId} reloadToken={0} showNextDetail={() => {}} />
          ) : null}
        </Drawer>
        {showValidateEmailModal && draftId && (
          <AddContact
            directCheck
            visible={showValidateEmailModal}
            receivers={receivers}
            draftId={draftId}
            businessType={'global_search'}
            // onFilter={handleFilterAddress}
            onCancelFilterAndSend={directSendEmail}
            onSendAll={generateHandleFilterReceivers(
              emailRef.current.all,
              newEmails => {
                if (clickType.current === 'header') {
                  setCheckedEmails(newEmails);
                } else {
                  childRef.current?.directSendEmail(newEmails);
                }
              },
              emailRef.current.id
            )}
            onClose={() => {
              setShowValidateEmailModal(false);
            }}
          />
        )}
      </div>
    );
  }
  return <div className={styles.linkedin}>{pageJSX}</div>;
};
