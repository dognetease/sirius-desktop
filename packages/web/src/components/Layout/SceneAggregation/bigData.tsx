import React, { ReactNode, useEffect, useState, useRef, useMemo, createContext } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { navigate, useLocation } from '@reach/router';
import qs from 'querystring';
import { parse as qsParse } from 'querystring';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { filterTree } from '@web-edm/utils';
import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import CustomsData from '../CustomsData/customs/customs';
import Star from '../CustomsData/starMark/star';
import '../Customer/customer.antd.scss';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { FoldableMenu, MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { CustomsDataMenuClick, customsDataTracker, customsDataTrackerHelper } from '../CustomsData/tracker/tracker';
import { apiHolder, apis, EdmCustomsApi, TGloabalSearchType, api, DataTrackerApi } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import KeywordsProvider from '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider';
import { SearchPage } from '@/components/Layout/globalSearch/search/search';
import { ComTomFairSearch } from '@/components/Layout/globalSearch/cantonFairSearch/ContomFairSearch';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import KeywordsSubscribe from '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsSubscribe';
import Extension from '../Customer/Extension/Index';
import LbsSearch from '../globalSearch/lbsSearch/LbsSearch';
import { LinkedInSearchPage } from '../LinkedInSearch';
import IntelligentSearch from '../Data/IntelligentSearch';
import { getTransText } from '@/components/util/translate';
import { LinkedInSearchTracker } from '@/components/Layout/LinkedInSearch/tracker';
import { globalSearchDataTracker, globalSearchTrackerHelper } from '../globalSearch/tracker';
import { ReactComponent as DataStat } from '../../../../../web-common/src/images/icons/data_stat.svg';
import { ReactComponent as DataMedia } from '../../../../../web-common/src/images/icons/data_facebook.svg';
import { ReactComponent as DataSubscribe } from '../../../../../web-common/src/images/icons/subscribe.svg';
import { useNewSubEnable } from '../globalSearch/hook/useNewSubEnableHook';
import NewKeywordsPage from '../globalSearch/keywordsSubscribe/NewKeywordsPage';
import { getIn18Text } from 'api';
import SmartRcmd from '../globalSearch/SmartRcmd/SmartRcmd';
import ForwarderData from '../CustomsData/customs/ForwarderData';
import WcaSeach from '../CustomsData/customs/wca';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { TongyongWhatsAppB, TongyongRenyuan5 } from '@sirius/icons';
import SearchIframe from '../CustomsData/customs/searchIframe';
import { FORWARDER_PORT_MENU_LABEL, useIsForwarder } from '../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import TradeAnalysis from '../tradeAnalysis/tradeAnalysis';
import TradeProvider from '../tradeAnalysis/context/tradeProvider';
import { linkedInSearchTrackerHelper } from '../LinkedInSearch/tracker';
import BR from '../BR';
import SearchPeers from '../SearchPeers';
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const storeApi = api.getDataStoreApi();

const customerMenuData: () => MenuItemData[] = () => [
  {
    title: getTransText('CustomerAcquisitionByData'),
    key: 'customsData',
    label: 'GLOBAL_SEARCH',
    icon: <DataStat />,
    children: [
      {
        key: 'globalSearch',
        title: getTransText('QUANQIUWEB'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.GlobalSearchIcon />
      },
      {
        key: 'customs',
        title: getTransText('HAIGUANSHUJU'),
        label: 'CUSTOMS',
        // icon: <MenuIcons.CustomsDataIcon />
      },
      {
        key: 'beltRoad',
        title: '一带一路专题',
        label: 'GLOBAL_SEARCH',
        newBadge: !storeApi.getSync('VisitedBeltRoadMenu').suc,
        // icon: <MenuIcons.LbsMenuIcon />
      },
      {
        key: 'forwarder',
        title: getIn18Text('GANGKOUSOUSUO'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
      },
      {
        key: 'industryCommerceSearch',
        title: getIn18Text('GONGSHANGSOUSUO（GUONEI'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
      },
      {
        key: 'intelligentSearch',
        title: getIn18Text('ZHINENGSOUSUO（GUONEI'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
      },
      {
        key: 'searchPeers',
        title: '货代同行',
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
        newBadge: !storeApi.getSync('VisitedPeersMenu').suc,
      },
      {
        key: 'lbs',
        title: getIn18Text('LBSSOUSUO'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
      },
      {
        key: 'contomfair',
        title: getIn18Text('ZHANHUISHUJU'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
      },
      {
        key: 'intelligent',
        title: getTransText('IntelligentSearch'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.GoogleIcon />
      },
      {
        key: 'extension',
        title: getTransText('CHAJIANHUOKE'),
        label: 'BROWSER_EXTENSION',
        newBadge: !storeApi.getSync('VisitedExtensionMenu').suc,
        // icon: <MenuIcons.PluginIcon />
      },
      {
        key: 'tradeAnalysis',
        title: getIn18Text('MAOYIFENXI'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
      },
    ],
  },
  {
    title: getTransText('getClientFromSocial'),
    key: 'mediaSearch',
    label: 'GLOBAL_SEARCH',
    icon: <DataMedia />,
    children: [
      {
        key: 'linkedin',
        title: getTransText('LinkedInCustomerAcquisition'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LinkinIcon />
      },
      // {
      //   key: 'facebook',
      //   title: getTransText('facebookAcquireClients'),
      //   label: 'FACEBOOK_SEARCH',
      //   icon: <MenuIcons.FacebookIcon />
      // }
    ],
  },
  {
    title: getIn18Text('ZHINENGDINGYUE'),
    key: 'subscribe',
    label: 'CUSTOMS',
    icon: <DataSubscribe />,
    children: [
      {
        key: 'star',
        title: getTransText('GONGSIDINGYUE'),
        label: 'CUSTOMS',
      },
      {
        key: 'keywords',
        title: getTransText('CHANPINDINGYUE'),
        label: 'GLOBAL_SEARCH',
      },
      {
        key: 'smartrcmd',
        title: getTransText('ZHINENGTUIJIAN'),
        label: 'GLOBAL_SEARCH',
        newBadge: !storeApi.getSync('VisitedSmartRcmdMenu').suc,
      },
    ],
  },
];
const customerMenuDataV2: () => MenuItemData[] = () => [
  {
    title: getTransText('CustomerAcquisitionByData'),
    key: 'customsData',
    label: 'GLOBAL_SEARCH',
    icon: <DataStat />,
    trackEventId: 'client_2_Data_customer_acquisition',
    children: [
      {
        key: 'globalSearch',
        title: getTransText('QUANQIUWEB'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.GlobalSearchIcon />
        trackEventId: 'client_3_Global_search',
      },
      {
        key: 'customs',
        title: getTransText('HAIGUANSHUJU'),
        label: 'CUSTOMS',
        // icon: <MenuIcons.CustomsDataIcon />
        trackEventId: 'client_3_Customs_Data',
      },
      {
        key: 'beltRoad',
        title: '一带一路专题',
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.GlobalSearchIcon />
        newBadge: !storeApi.getSync('VisitedBeltRoadMenu').suc,
        trackEventId: 'client_3_Belt_road',
      },
      {
        key: 'forwarder',
        title: getIn18Text('GANGKOUSOUSUO'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
        trackEventId: 'client_3_Harbor_search',
      },
      {
        key: 'industryCommerceSearch',
        title: getIn18Text('GONGSHANGSOUSUO（GUONEI'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
        trackEventId: 'client_3_Industrial_commercial_search（China）',
      },
      {
        key: 'intelligentSearch',
        title: getIn18Text('ZHINENGSOUSUO（GUONEI'),
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
        trackEventId: 'client_3_Smart_search（China）',
      },
      {
        key: 'searchPeers',
        title: '货代同行',
        // todo
        label: FORWARDER_PORT_MENU_LABEL,
        trackEventId: 'client_3_Search_peers',
        newBadge: !storeApi.getSync('VisitedPeersMenu').suc,
      },
      {
        key: 'intelligent',
        title: getTransText('IntelligentSearch'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.GoogleIcon />
        trackEventId: 'client_3_Smart_search',
      },
      {
        key: 'smartrcmd',
        title: getTransText('ZHINENGTUIJIAN'),
        label: 'GLOBAL_SEARCH',
        newBadge: !storeApi.getSync('VisitedSmartRcmdMenu').suc,
        trackEventId: 'client_3_Smart_recommendation',
      },
      {
        key: 'contomfair',
        title: getIn18Text('ZHANHUIMAIJIA'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
        trackEventId: 'client_3_Exhibition_data',
      },
      {
        key: 'lbs',
        title: getIn18Text('DITUSOUSUO'),
        label: 'GLOBAL_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
        trackEventId: 'client_3_LBS_search',
      },
      {
        key: 'linkedin',
        title: getIn18Text('SHEMEISOUSUO'),
        label: 'SOCIAL_MEDIA_SEARCH',
        // icon: <MenuIcons.LbsMenuIcon />
        trackEventId: 'client_3_Social_Media_Search',
      },
    ],
  },
  {
    title: getIn18Text('SHICHANGDONGCHA'),
    key: 'marketing_insight',
    label: 'MARKETING_INSIGHT',
    icon: <TongyongWhatsAppB color="#6F7485" />,
    trackEventId: 'client_2_market_insights',
    children: [
      {
        key: 'tradeAnalysis',
        title: getIn18Text('MAOYIFENXI'),
        label: 'TRADE_ANALYSIS',
        trackEventId: 'client_3_Trade_Analysis',
      },
      {
        key: 'star',
        title: getTransText('GONGSIDINGYUE'),
        label: 'CUSTOMS',
        trackEventId: 'client_3_Corporate_subscription',
      },
      {
        key: 'keywords',
        title: getTransText('CHANPINDINGYUE'),
        label: 'GLOBAL_SEARCH',
        trackEventId: 'client_3_Product_Subscription',
      },
    ],
  },
  {
    title: getIn18Text('ZHAOKEGONGJU'),
    key: 'customer_prospecting_tool',
    label: 'CUSTOMER_PROSPECTING_TOOL',
    icon: <TongyongRenyuan5 color="#6F7485" />,
    trackEventId: 'client_2_search_tool',
    children: [
      {
        key: 'extension',
        title: getIn18Text('LIULANQICHAJIANHUOKE'),
        label: 'BROWSER_PLUGIN_TOOL',
        newBadge: !storeApi.getSync('VisitedExtensionMenu').suc,
        // icon: <MenuIcons.PluginIcon />
        trackEventId: 'client_3_Browser_plugin',
      },
    ],
  },
];
const WmBigData: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [activeMenuKey, setActiveMenuKey] = useState('customs');
  const [activedPage, setActivedPage] = useState<Set<string>>(new Set([activeMenuKey]));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const emailGuessPortalElRef = useRef<HTMLDivElement>(null);

  const companySubCount = useAppSelector(state => state.readCountReducer.unreadCount.customsData);
  const productSubCount = useAppSelector(state => state.readCountReducer.unreadCount.globalSearch);
  const appDispatch = useAppDispatch();
  const locationHash = location.hash;
  const modules = useAppSelector(state => state.privilegeReducer.modules);
  const lastHash = useRef<string>('');
  const [newProductSubEnable] = useNewSubEnable();

  const [query, setQuery] = useState<string>('');
  const [detailDrawId, setDetailDrawId] = useState<string>('');
  const [queryType, setQueryType] = useState<TGloabalSearchType>('product');
  const v1v2 = useVersionCheck();
  const selectedMenuData = useMemo(() => {
    return v1v2 === 'v2' ? customerMenuDataV2 : customerMenuData;
  }, [v1v2]);

  const isForwarder = useIsForwarder();

  useEffect(() => {
    if (!isForwarder) return;
    // 货代版本埋点增加forwarder参数
    globalSearchTrackerHelper.setExtraParams({ forwarder: isForwarder });
    customsDataTrackerHelper.setExtraParams({ forwarder: isForwarder });
    linkedInSearchTrackerHelper.setExtraParams({ forwarder: isForwarder });
  }, [isForwarder]);

  useEffect(() => {
    const params = qs.parse(locationHash.split('?')[1]);
    const qsPage = (Array.isArray(params.page) ? params.page[0] : params.page) || 'globalSearch';
    setActiveMenuKey(qsPage);
    setActivedPage(last => {
      const current = new Set(last);
      current.add(qsPage);
      return current;
    });
  }, [locationHash]);

  useEffect(() => {
    const params = qsParse(locationHash.split('?')[1]);
    const moduleName = locationHash.substring(1).split('?')[0];
    const lastHashValue = lastHash.current.slice();
    lastHash.current = locationHash;
    if (moduleName === 'wmData' && params.page === 'globalSearch') {
      if (params.type) {
        const cType = Array.isArray(params.type) ? params.type[0] : params.type;
        setQueryType(cType as TGloabalSearchType);
      }
      if (params.id) {
        const cID = Array.isArray(params.id) ? params.id[0] : params.id;
        setDetailDrawId(cID);
      }
      if (params.keywords) {
        const cKeywords = Array.isArray(params.keywords) ? params.keywords[0] : params.keywords;
        setQuery(cKeywords);
      }
    } else {
      setQueryType('product');
      setDetailDrawId('');
      setQuery('');
    }
    // 数据埋点
    if (moduleName === 'wmData') {
      globalSearchDataTracker.trackPageChange(params.page as any, {
        from: lastHashValue.startsWith('#message') ? 'im' : 'tab',
      });
    }
  }, [locationHash]);

  useEffect(() => {
    const changeSubkeywordRedPoint = (prevMenu: MenuItemData[]) => {
      const newMenu: MenuItemData[] = prevMenu.map(e => {
        const men: MenuItemData = {
          ...e,
          children: undefined,
        };
        if (e.key === 'star') {
          men.renPoint = !!companySubCount;
        }
        if (e.key === 'keywords') {
          men.renPoint = !!productSubCount;
        }
        if (e.children) {
          men.children = changeSubkeywordRedPoint(e.children);
        }
        return men;
      });
      return newMenu;
    };
    if (props.active) {
      setMenuData(changeSubkeywordRedPoint(filterTree(selectedMenuData(), menuKeys)));
    }
  }, [menuKeys, props.active, companySubCount, productSubCount, newProductSubEnable, selectedMenuData]);

  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      appDispatch(getCompanyCheckRules());
    }
  }, [props.active]);

  useEffect(() => {
    customsDataTracker.trackMenuClick(CustomsDataMenuClick.CustomsMenu);
  }, []);

  const handleMenuClick = (current: { key: string }) => {
    const { key } = current;
    if (key === 'contomfair') {
      trackApi.track('pc_leftNavigationBarTab', { tabName: 'exhibitionData', operate: 'click' });
    }
    navigate(`#${props.name}?page=${key}`);
    if (key === 'linkedin') {
      LinkedInSearchTracker.trackMenuClick();
    } else if (key === 'extension' && !storeApi.getSync('VisitedExtensionMenu').suc) {
      storeApi.putSync('VisitedExtensionMenu', '1');
      deleteExtensionNewBadge();
    } else if (key === 'smartrcmd' && !storeApi.getSync('VisitedSmartRcmdMenu').suc) {
      storeApi.putSync('VisitedSmartRcmdMenu', '1');
      deleteSmartRcmdNewBadge();
    } else if (key === 'beltRoad' && !storeApi.getSync('VisitedBeltRoadMenu').suc) {
      storeApi.putSync('VisitedBeltRoadMenu', '1');
      deleteBletRoadBadge();
    } else if (key === 'searchPeers' && !storeApi.getSync('VisitedPeersMenu').suc) {
      storeApi.putSync('VisitedPeersMenu', '1');
      deletePeersBadge();
    }
  };

  const deleteSmartRcmdNewBadge = () => {
    setMenuData(prev =>
      prev.map(item => {
        if (item.key === 'customsData') {
          return {
            ...item,
            children: item.children?.map(subItem => {
              if (subItem.key === 'smartrcmd') {
                return {
                  ...subItem,
                  newBadge: false,
                };
              }
              return subItem;
            }),
          };
        }
        return item;
      })
    );
  };

  const deleteExtensionNewBadge = () => {
    setMenuData(
      menuData.map(item => {
        if (item.key === 'customer_prospecting_tool') {
          return {
            ...item,
            children: item.children?.map(subItem => {
              if (subItem.key === 'extension') {
                return {
                  ...subItem,
                  newBadge: false,
                };
              }
              return subItem;
            }),
          };
        }
        return item;
      })
    );
  };

  const deleteBletRoadBadge = () => {
    setMenuData(
      menuData.map(item => {
        if (item.key === 'customsData') {
          return {
            ...item,
            children: item.children?.map(subItem => {
              if (subItem.key === 'beltRoad') {
                return {
                  ...subItem,
                  newBadge: false,
                };
              }
              return subItem;
            }),
          };
        }
        return item;
      })
    );
  };

  const deletePeersBadge = () => {
    setMenuData(
      menuData.map(item => {
        if (item.key === 'customsData') {
          return {
            ...item,
            children: item.children?.map(subItem => {
              if (subItem.key === 'searchPeers') {
                return {
                  ...subItem,
                  newBadge: false,
                };
              }
              return subItem;
            }),
          };
        }
        return item;
      })
    );
  };

  const pageModules: Array<{
    key: string;
    node: ReactNode;
    noCache?: boolean;
  }> = [
    {
      key: 'customs',
      node: (
        <CustomsData
          defaultTabCompanyType={[
            {
              label: getTransText('CAIGOUSHANG'),
              value: 'buysers',
            },
            {
              label: getTransText('GONGYINGSHANG'),
              value: 'suppliers',
            },
            {
              value: 'customs',
              label: getTransText('HAIGUANMAOYISHUJU'),
            },
          ]}
          defaultCustomsDataType={'buysers'}
          defaultContentTab={[
            {
              label: getIn18Text('ANCHANPIN'),
              value: 'goodsShipped',
            },
            {
              label: getIn18Text('ANGONGSI'),
              value: 'company',
            },
            {
              value: 'hsCode',
              label: getIn18Text('ANHSCode'),
            },
            {
              value: 'port',
              label: getIn18Text('ANGANGKOU'),
            },
          ]}
        />
      ),
    },
    {
      key: 'forwarder',
      node: <ForwarderData />,
    },
    {
      key: 'industryCommerceSearch',
      node: <SearchIframe key={'industryCommerceSearch'} ifranmeUrlType={1} />,
    },
    {
      key: 'intelligentSearch',
      node: <SearchIframe key={'intelligentSearch'} ifranmeUrlType={2} />,
    },
    {
      key: 'star',
      node: <Star />,
      noCache: true,
    },
    {
      key: 'globalSearch',
      node: modules?.['GLOBAL_SEARCH'] ? (
        <SearchPage defautQuery={query && query.length > 0 ? { query } : undefined} detailDrawId={detailDrawId} queryType={queryType} />
      ) : (
        <NoPermissionPage />
      ),
    },
    {
      key: 'keywords',
      noCache: true,
      node: modules?.['GLOBAL_SEARCH'] ? newProductSubEnable ? <NewKeywordsPage /> : <KeywordsSubscribe /> : <NoPermissionPage />,
    },
    {
      key: 'contomfair',
      node: modules?.['GLOBAL_SEARCH'] ? <ComTomFairSearch /> : <NoPermissionPage />,
    },
    {
      key: 'lbs',
      node: modules?.['GLOBAL_SEARCH'] ? <LbsSearch /> : <NoPermissionPage />,
    },
    {
      key: 'extension',
      node: <Extension />,
    },
    {
      key: 'linkedin',
      node: modules?.['GLOBAL_SEARCH'] ? <LinkedInSearchPage /> : <NoPermissionPage />,
    },
    {
      key: 'intelligent',
      node: <IntelligentSearch />,
    },
    {
      key: 'tradeAnalysis',
      node: (
        <TradeProvider>
          {' '}
          <TradeAnalysis />
        </TradeProvider>
      ),
    },
    {
      key: 'smartrcmd',
      noCache: true,
      node: <SmartRcmd />,
    },
    {
      key: 'wca',
      node: <WcaSeach />,
    },
    {
      key: 'beltRoad',
      node: modules?.['GLOBAL_SEARCH'] ? <BR /> : <NoPermissionPage />,
    },
    {
      key: 'searchPeers',
      node: <SearchPeers />,
    },
    // {
    //   key :'facebook',
    //   node: modules?.['GLOBAL_SEARCH'] ? <FaceBookSearchPage /> : <NoPermissionPage />,
    // }
  ];

  return (
    <ConfigProvider autoInsertSpaceInButton={false} locale={zhCN}>
      <KeywordsProvider emailGuessPortalEl={emailGuessPortalElRef.current}>
        <PageContentLayout>
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu
              isFold={false}
              handleMenuClick={handleMenuClick}
              menuData={menuData}
              activeMenuKey={activeMenuKey}
              defaultOpenKeys={selectedMenuData().map(item => item.key)}
            />
          </ExpandableSideContent>
          <PermissionCheckPage resourceLabel="CUSTOMS" accessLabel="VIEW" menu="CUSTOMS">
            <OverlayScrollbarsComponent
              style={{
                height: '100%',
              }}
              options={{
                scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
                overflowBehavior: {
                  y: 'scroll',
                },
              }}
            >
              {pageModules.map(mod => {
                if (mod.noCache) {
                  return mod.key === activeMenuKey && <React.Fragment key={mod.key}>{mod.node}</React.Fragment>;
                }
                return (
                  activedPage.has(mod.key) && (
                    <div style={{ height: '100%' }} key={mod.key} hidden={mod.key !== activeMenuKey}>
                      {mod.node}
                    </div>
                  )
                );
              })}
            </OverlayScrollbarsComponent>
            <div ref={emailGuessPortalElRef}></div>
            {/* {
              activeMenuKey !== 'customs'
                ? (
                  <div style={{ height: '100%' }}>

                  </div>
                )
                : null
            }
            <div style={{ display: activeMenuKey === 'customs' ? 'block' : 'none', height: '100%' }}>
              {renderContent('customs')}
            </div> */}
          </PermissionCheckPage>
        </PageContentLayout>
      </KeywordsProvider>
    </ConfigProvider>
  );
};

export default WmBigData;
