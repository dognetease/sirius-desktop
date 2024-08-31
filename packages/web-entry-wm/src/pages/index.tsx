import { registerRouterInterceptor, ruleEngine } from 'env_def';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useMap, usePrevious } from 'react-use';
import { PageProps, navigate } from 'gatsby';
import { useLocation } from '@reach/router';
import {
  apiHolder,
  inWindow,
  isEdm,
  MailApi,
  apis,
  selectedAppsSpaceCode,
  AdvertConfig,
  AdvertApi,
  bannerSpaceCode,
  ResNotice,
  DataTrackerApi,
  EdmRoleApi,
  apiHolder as api,
  DataStoreApi,
  WarmUpAccountSource,
} from 'api';
import { Layout, Modal } from 'antd';
import SideBar from '@web-entry-wm/layouts/WmMain/sideBar';
import { RenderContainer } from '@web-entry-wm/layouts/WmMain/renderContainer';
import { EdmIcon } from '@web-common/components/UI/Icons/icons';
import { FloatButtonRoot } from '@web-common/components/FloatToolButton/index';
// import { AIFloatButton } from '@web-common/components/AIFloatButton/index';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import SiriusLayout from '@web-entry-wm/layouts';
import { ChildrenType, findActiveKeys, getAllMenuKeys, packedData, topMenu as topMV1 } from '@web-entry-wm/layouts/config/topMenu';
import { speUrl, TopMenuPath, TopMenuType } from '@web-common/conf/waimao/constant';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { useAppSelector, useAppDispatch, useActions } from '@web-common/state/createStore';
import { filterSideTree } from '@web-entry-wm/layouts/utils/filterSideTree';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { ReactComponent as WmDataGuid } from '@web-common/images/wm-data-guide.svg';
import { ReactComponent as IntelliGuid } from '@web-common/images/intelli-guide.svg';
import { ReactComponent as CoopGuid } from '@web-common/images/coop-guide.svg';
import { MarketingModalList } from '@web-edm/components/MarketingModalList/marketingModalList';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import NewbieTask from '@web-common/components/NewbieTask';
import GlobalNotification from '@web-common/components/GlobalNotification';
import ModuleNotifications from '@web-common/components/ModuleNotification';

// import '../styles/global.scss';

// import Disk from '@web-disk/index';
// import MailBox from '@web-mail/mailBox';
// import { TabItemProps } from '../layouts/WmMain/viewTab'
// import { cachedList } from '@web-entry-wm/layouts/WmMain/viewTabData';
import { pageTitleMap } from '@web-entry-wm/layouts/utils/pageTitleMap';
import { defaultTabList, useTabContext, ViewtabContext, ViewtabCtxProvider } from '@web-entry-wm/layouts/WmMain/viewtabContext';
import HollowOutWmWeb from '@web-entry-wm/components/HollowOutWmWeb/hollowOutWmWeb';
import { ConfigActions, WebEntryWmActions } from '@web-common/state/reducer';
import { getIsFreeVersionUser, getMenuVersion } from '@web-common/state/reducer/privilegeReducer';
import { EDMAPI } from '@web-edm/utils';
// import '../styles/global.scss';
import { VersionPrompt } from '@web-common/components/versionPrompt';
import { edmDataTracker } from '@web-edm/tracker/tracker';
import { getCrmPathWithoutPrefix, getUnitableCrmHash, isMatchUnitableCrmHash } from '@web-unitable-crm/api/helper';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { activeKeyToRoutePath, RoutePathToActiveKey, routeMenu } from '@lxunit/app-l2c-crm';
import { FORWARDER_PORT_MENU_LABEL } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { NpsSurvey } from '@/components/Npsmeter';
import { nanoid } from '../layouts/utils/nanoId';
import { Notice } from '@/components/UI/Notice/notice';
import {
  useL2cCrmMenuData,
  onCrmMenuClickHandle,
  useL2cCrmCustomerPerformanceMenuData,
  isMatchCustomerManageRoute,
  isMatchCustomerPerformanceRoute,
  getActiveKeyByPath,
  hasPath,
} from '../layouts/hooks/use-l2c-crm-menu-data';
import { topMenu as topMV2, packedData as packedDataV2 } from '../layouts/config/v2/topMenu';
import { ViewTab } from '../layouts/WmMain/viewTab';
import { HeaderFc, SourceType } from '../layouts/WmMain/HeaderFc';
import NotSupport from './NotSupport';
// import VersionGuide from './versionGuide';
import { devDefaultMenuPermission } from '../layouts/hooks/menu-type';
import { permissionMockData } from '../layouts/hooks/permission-mock';
import { getWaimaoTrailEntryHost } from '@web-common/utils/utils';

const ProductVersion = {
  FREE: 'FREE', // 体验版
  FASTMAIL: 'FASTMAIL', // 外贸版
  WEBSITE: 'WEBSITE', // 建站版
  FASTMAIL_AND_WEBSITE: 'FASTMAIL_AND_WEBSITE', // 外贸和建站版
  FASTMAIL_EXPIRED: 'FASTMAIL_EXPIRED', // 外贸过期版
};

const trackEventMap: Record<string, string> = {
  dataAcquisition: 'web_2_Data_customer_acquisition', // 数据获客
  marketing_insight: 'web_2_market_insights', // 市场洞察
  foo6: 'web_2_search_tool', // 找客工具
  autoExloit: 'web_2_automatic_develop', // 自动开发
  manualExloit: 'web_2_Manual_develop', // 手动开发
  marketDataStat: 'web_2_marketing_statistics', // 营销统计
  emailAidTool: 'web_2_Email_develop_Auxiliary_tools', // 邮件开发辅助工具
  whatsappPersonalMarketing: 'web_2_WA_personal_marketing', // whatsapp个人营销
  whatsappBusinessMarketing: 'web_2_WA_business_marketing', // whatsapp商业营销
  facebook: 'web_2_Facebook_marketing', // Facebook营销
  '/lead': 'web_2_Leads', // 线索
  custom: 'web_2_customers', // 客户
  '/business/list': 'web_2_business_opportunities', // 商机
  ioEmail: 'web_2_Recommended_Center', // 推荐
  sellManage: 'web_2_Trade_management', // 交易管理
  product: 'web_2_Product_management', // 商品管理
  '/supplier/management': 'web_2_Supplier_management', // 供应商管理
  mySite: 'web_2_My_Site', // 我的站点
  market: 'web_2_Marketing_landing_page', // 营销落地页
  siteData: 'web_2_Site_Data', // 站点数据
  domainManage: 'web_2_Domain_management', // 域名管理
  articleManage: 'web_2_Article_management', // 文章管理
  snsMarketing: 'web_2_Overseas_social_media', // 海外社媒
  message: 'web_2_Message_notification', // 消息
  schedule: 'web_2_calendar', // 日历
  disk: 'web_2_Cloud_Document', // 云文档
  lxContact: 'web_2_Contacts', // 通讯录
};

const images = [<WmDataGuid />, <IntelliGuid />, <CoopGuid />, <div style={{ height: 28 }} />];
const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const systemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = apiHolder.api.getEventApi();
const advertApi = apiHolder.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
// const isEdm = systemApi.inEdm();
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

const pathArray = [TopMenuPath.intelliMarketing, TopMenuPath.wmData, TopMenuPath.wm, TopMenuPath.coop, TopMenuPath.site, TopMenuPath.wa];
const IndexPageWrapper: React.FC<any> = ({ children }) => <SiriusLayout.ContainerLayout isLogin={false}>{children}</SiriusLayout.ContainerLayout>;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// const webGuideId = 'web-entry-wm-guide';
// const newVId = 'web-entry-wm-new-version';

const IndexPage: React.FC<PageProps> = ({ location }) => {
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  const [sideMenuData, setSideMenuData] = useState<ChildrenType>();
  const [titlePath, setTitlePath] = useState('');
  const [sidePath, setSidePath] = useState<string[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>();
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const modulePermission = useAppSelector(s => s.privilegeReducer.modules);
  const isEdmAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role.roleType === 'ADMIN'));
  const version = useAppSelector(state => state.privilegeReducer.version);
  const visibleWorktable = menuKeys?.WORKBENCH;
  const rbacVisible = useAppSelector(state => state.privilegeReducer.visibleMenuLabels.PRIVILEGE === true);
  const isOrg = useAppSelector(state => state.privilegeReducer.visibleMenuLabels.ORG_SETTINGS === true);
  const isRbac = isEdm && isEdmAdmin && rbacVisible; // 有权限设置 权限
  const showComSetting = isRbac || isOrg;
  const [isVisitedExtension, setIsVisitedExtension] = useState<boolean>(storeApi.getSync('VisitedExtensionMenu').suc);
  const [isVisitedRcmd, setIsVisitedRcmd] = useState<boolean>(storeApi.getSync('VisitedSmartRcmdMenu').suc);
  const [isVisitedBeltRoad, setIsVisitedBeltRoad] = useState<boolean>(storeApi.getSync('VisitedBeltRoadMenu').suc);
  const dispatch = useAppDispatch();
  const locationTag = useLocation();
  const productCode = useAppSelector(state => state.privilegeReducer.version);
  // const isAdmin = process.env.BUILD_ISEDM && isEdmAdmin && rbacVisible;
  const isWebSite = productCode === ProductVersion.WEBSITE;
  // const { topMenu: toMenu, posMap, lastPageInModule } = useAppSelector(state => state.webEntryWmReducer);
  const { lastPageInModule } = useAppSelector(state => state.webEntryWmReducer);
  // const [guideState, setGuideState] = useState<TopMenuType[]>([]);
  const { setPageInModuleMap } = useActions(WebEntryWmActions);
  const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  // const prevModuleName = usePrevious(titlePath);
  const isOfficeDomain = systemApi.getCurrentUser()?.domain === 'office.163.com';
  const [shouldShowAppTab, setShouldShowAppTab] = useState<boolean>(false);
  // const [guideMap, { set: setGuide, setAll }] = useMap<{ versionModal: boolean; guideVisible: boolean }>({
  //   versionModal: false,
  //   guideVisible: false,
  // });
  const [edmNotice, setEdmNotice] = useState<ResNotice | null>(null);

  const v1v2 = useVersionCheck();

  let topMenu: TopMenuType[] = [];
  topMenu = v1v2 === 'v2' ? topMV2 : topMV1;

  // if (inWindow()) {
  //   let v1v2 = useVersionCheck();
  //   topMenu = v1v2 === 'v2' ? topMV2:topMV1
  // }

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('edmGlobalNotice', {
      func: ev => {
        if (ev.eventData) {
          setEdmNotice(ev.eventData);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('edmGlobalNotice', id);
    };
  }, []);

  // useEffect(() => {
  //   const guideList: any = [];
  //   toMenu?.forEach((ch: TopMenuType, idx: number) => {
  //     if (ch.path === TopMenuPath.wmData) {
  //       guideList.push({
  //         type: ch.path,
  //         title: '外贸大数据板块',
  //         intro: '外贸大数据支持一键搜索20亿权威海关数据，助力精准网罗海外客户，原有的「海关数据」「全球搜」已转移到这里',
  //         placement: 'bottom-center',
  //         targetHeight: 54,
  //         targetView: {
  //           content: images[0],
  //           offset: { x: posMap[idx]?.[0], y: posMap[idx]?.[3] - 7 },
  //         },
  //       });
  //     }
  //
  //     if (ch.path === TopMenuPath.intelliMarketing) {
  //       guideList.push({
  //         type: ch.path,
  //         title: '智能营销板块',
  //         intro: '营销场景的功能都将聚合到该板块，原有的「邮件营销」「WhatsApp营销」「自动化营销」已转移到这里',
  //         placement: 'right-center',
  //         targetHeight: 54,
  //         targetView: {
  //           content: images[1],
  //           offset: { x: posMap[idx]?.[0], y: posMap[idx]?.[3] - 7 },
  //         },
  //       });
  //     }
  //
  //     if (ch.path === TopMenuPath.coop) {
  //       guideList.push({
  //         type: ch.path,
  //         title: '协同办公板块',
  //         intro: '协同办公的相关功能都将聚合到该板块，「云文档」「日历」「消息」等已转移到这里',
  //         placement: 'bottom-center',
  //         targetHeight: 54,
  //         targetView: {
  //           content: images[2],
  //           offset: { x: posMap[idx]?.[0], y: posMap[idx]?.[3] - 7 },
  //         },
  //       });
  //     }
  //
  //     if (ch.path === 'oldVersion' && !isFreeVersionUser) {
  //       guideList.push({
  //         type: ch.path,
  //         title: '返回旧版',
  //         intro: '点击「返回旧版」，您可以继续使用旧版本',
  //         placement: 'bottom-center',
  //         targetHeight: 54,
  //         targetView: {
  //           content: images[3],
  //           offset: { x: posMap[idx]?.[0] + 47, y: posMap[idx]?.[3] - 3 },
  //         },
  //       });
  //     }
  //   });
  //
  //   setGuideState(guideList);
  // }, [toMenu, posMap, isFreeVersionUser]);

  // let  [tabList, setTablist] =  useTabContext()
  const [tabList, setTablist] = useState(defaultTabList);

  if (inWindow()) {
    document.title = '网易外贸通';
    window.systemApi = systemApi;
    window.isEdm = isEdm;
    window.tabList = tabList;
    window.setTablist = setTablist;
  }

  useCommonErrorEvent('indexCommonErrorOb');

  useEffect(() => {
    registerRouterInterceptor();
    window.navigate = navigate;

    const eventId = listenWriteMail(dispatch);
    if (inWindow() && window.location.hash && writeToPattern.test(window.location.hash)) {
      const exec = writeToPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const writeTo = safeDecodeURIComponent(exec[1]);
        mailApi.doWriteMailToContact([writeTo]);
      }
    }
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);

  const onMenuClick = (current: { key: string; keyPath: string[] }) => {
    handleMenuTrack(current);
    const { key, keyPath } = current;

    // 新旧版埋点
    trackerApi.track('web_waimao_secondary_menu_click', {
      menuKey: key,
      version: v1v2,
      name: (current as any).item?.elementRef?.current?.innerText,
    });

    // unicrm
    const isUnitableRoute = isMatchUnitableCrmHash(location.hash);

    if (isUnitableRoute) {
      // 传入具体跳的路径
      onCrmMenuClickHandle(key);

      if (key === 'emailFilter') {
        setSidePath(['emailFilter']);
      } else {
        setSidePath(keyPath);
      }
      return;
    }

    trackerApi.track('waimao_secondary_menu_click', {
      menuKey: key,
      name: (current as any).item?.elementRef?.current?.innerText,
    });
    if (key === 'contomfair') {
      trackerApi.track('pc_leftNavigationBarTab', {
        tabName: 'exhibitionData',
        operate: 'click',
      });
    }

    // 个人whatsapp独立tab打开
    if (key === 'pernsonalWhatsapp') {
      window.open('/personalWhatsapp/', 'personalWhatsapp');
      return;
    }
    if (key === 'extension') {
      storeApi.putSync('VisitedExtensionMenu', '1');
      setIsVisitedExtension(true);
    } else if (key === 'smartrcmd') {
      storeApi.putSync('VisitedSmartRcmdMenu', '1');
      setIsVisitedRcmd(true);
    } else if (key === 'beltRoad') {
      storeApi.putSync('VisitedBeltRoadMenu', '1');
      setIsVisitedBeltRoad(true);
    } else if (key === 'searchPeers') {
      storeApi.putSync('VisitedPeersMenu', '1');
    }
    setSidePath(keyPath);

    // 地址簿web端埋点
    if (key === 'addressBookIndex') {
      edmDataTracker.track('waimao_address_book');
    } else if (key === 'addressBookOpenSea') {
      edmDataTracker.track('waimao_address_book_sea');
    }

    const isUniqTab = !tabList.some(e => e.path.includes(key));

    if (isUniqTab) {
      const title = pageTitleMap[key] || '默认';

      setTablist([
        ...tabList.map(e => ({ ...e, isActive: false })),
        {
          id: nanoid(),
          path: `#${titlePath}?page=${key}`,
          title,
          isActive: true,
          isCached: false,
        },
      ]);
    } else {
      const tabListNew = tabList.map(e => ({
        ...e,
        isActive: !!e.path.includes(key),
      }));
      setTablist(tabListNew);
    }
    navigate(`#${titlePath}?page=${key}`);
  };

  const onTopItem = (item: ChildrenType, source: SourceType, target: ChildrenType) => {
    // 切换模块时关闭视频播放弹窗
    setTimeout(() => {
      dispatch(ConfigActions.closeVideoDrawer());
    }, 50);

    // 个人whatsapp独立tab打开
    if (target.path === 'pernsonalWhatsapp') {
      window.open('/personalWhatsapp/', 'personalWhatsapp');

      // 新旧版埋点
      trackerApi.track('web_waimao_secondary_menu_click', {
        menuKey: 'pernsonalWhatsapp',
        version: v1v2,
      });
      return;
    }
    if (target.path === TopMenuPath.mailbox) {
      navigate(`#${TopMenuPath.mailbox}?page=${TopMenuPath.mailbox}`);

      // 新旧版埋点
      trackerApi.track('web_waimao_secondary_menu_click', {
        menuKey: 'mailbox',
        version: v1v2,
      });
    } else {
      let finalPath = [`${target.parent}`];
      let finalTitlePath = item.path;
      if (target.children?.length) {
        // 有多级子菜单，默认选中第一级子菜单
        const _path = getPath(target, []);
        finalPath = [..._path, ...finalPath];
        finalTitlePath = `${target.children?.[0].path}`;
      } else {
        finalPath = [`${target.path}`, `${target.parent}`];
      }
      // 菜单高亮
      // setSidePath(finalPath)
      if (pathArray.includes(finalTitlePath as TopMenuPath)) finalTitlePath = finalPath[0]; // 点击顶部标题时默认选中第一级

      let _key = target.children?.length ? finalTitlePath : target.path;
      if (item.path === 'intelliMarketing' && target.children?.length) {
        _key = 'addressBookIndex';
      }
      const key = source === 'mItem' ? lastPageInModule[item.path] || _key : _key;
      const isUniqTab = !tabList.some(e => e.path.includes(key));

      if (isUniqTab) {
        const title = pageTitleMap[key] || '默认';

        setTablist([
          ...tabList.map(e => ({ ...e, isActive: false })),
          {
            id: nanoid(),
            path: `#${item.path}?page=${key}`,
            title,
            isActive: true,
            isCached: false,
          },
        ]);
      } else {
        const tabListNew = tabList.map(e => ({
          ...e,
          isActive: !!e.path.includes(key),
        }));
        setTablist(tabListNew);
      }

      const curTab = cachedTabs.find(tab => tab.tab === item.path);
      const params = splitURL(curTab?.query);
      // uni crm 使用了react-router-dom的hash路由写法，因此特殊处理一下
      if (isMatchUnitableCrmHash(item.path)) {
        if (v1v2 === 'v2') {
          // window.location.hash = item.path;

          const targetPath = getPath(target, []);
          const hash = hasPath(target, routeMenu.custom.path) ? routeMenu.custom.path : targetPath[0];

          window.location.hash = getUnitableCrmHash(hash);

          // 客户管理
          if (item.path === TopMenuPath.unitable_crm) {
          }

          // 客户履约
          if (item.path === '/unitable-crm/sell-order/list') {
          }

          // 新旧版埋点
          trackerApi.track('web_waimao_secondary_menu_click', {
            menuKey: getUnitableCrmHash(hash),
            version: v1v2,
          });

          return;
        }

        const targetPath = getUnitableCrmHash(key);
        // 使用navigate l2c 无法获取hash变化
        // navigate(targetPath);
        window.location.hash = targetPath;
      } else {
        navigate(`#${item.path}?page=${key}${params}`);

        // 新旧版埋点
        trackerApi.track('web_waimao_secondary_menu_click', {
          menuKey: key,
          version: v1v2,
        });
      }
    }
  };

  const splitURL = (query: any = {}) => {
    const urlHalf: any = [];
    Object.keys(query)
      .filter(q => q !== 'page')
      .forEach(key => {
        const value = query[key];
        urlHalf.push([key, encodeURIComponent(value)].join('='));
      });
    return urlHalf.length === 0 ? '' : '&' + urlHalf.join('&');
  };

  const getPath = (arg: ChildrenType, temp: string[]) => {
    temp.unshift(arg?.path || '');
    if (arg?.children?.length) {
      getPath(arg.children?.[0], temp);
    }
    return temp;
  };

  const renderContent = useMemo(() => <RenderContainer name="edm" tag="营销" active icon={EdmIcon} isAdmin={isRbac} />, [titlePath, isRbac]);

  // 企业设置、IM 事件
  const handleChange = useCallback((type: string) => {
    if (type === TopMenuPath.enterpriseSetting) return;
    if (type === TopMenuPath.personal) {
      setSidePath(['security', 'accountQuery']);
    } else {
      setSidePath(['message', TopMenuPath.coop]);
    }
  }, []);

  const showSideBar = () => {
    // 如果是uni crm 路由，则不展示左侧菜单栏
    if (inWindow()) {
      const { hash } = window.location;
      const params = new URLSearchParams(hash.split('?')[1]);

      if (params.get('showSidebar') === 'false') {
        return false;
      }

      if (v1v2 !== 'v2') {
        if (isMatchUnitableCrmHash(hash)) {
          return false;
        }
      }
    }

    return !speUrl.includes(titlePath as TopMenuPath) && titlePath !== '' && !!sideMenuData?.children?.[0].children.length;
  };

  const [showWebSideBar, setWebShowSideBar] = useState(true);

  useEffect(() => {
    if (inWindow()) {
      const { hash } = window.location;
      const params = new URLSearchParams(hash.split('?')[1]);

      setWebShowSideBar(() => {
        if (params.get('showSidebar') === 'false') {
          return false;
        }

        if (v1v2 !== 'v2') {
          if (isMatchUnitableCrmHash(hash)) {
            return false;
          }
        }

        if (speUrl.includes(titlePath as TopMenuPath)) {
          return false;
        }

        if (titlePath === '') {
          return false;
        }

        const targetSideMenuData = sideMenuData?.children?.[0]?.children?.length;

        if (typeof targetSideMenuData === 'number' && targetSideMenuData > 0) {
          return true;
        }

        return false;
      });
    }

    // return !speUrl.includes(titlePath as TopMenuPath) && titlePath !== '' && !!sideMenuData?.children?.[0].children.length;
  }, [v1v2, menuKeys, version, locationTag, sideMenuData, titlePath]);

  useEffect(() => {
    const targetData = topMenu.find(i => i.path === titlePath);
    const keys = getAllMenuKeys(targetData!, []);
    setAllKeys(keys);
  }, [titlePath, isRbac]);

  useEffect(() => {
    if (version === 'WEBSITE' && !location.hash.startsWith('#site')) {
      navigate('#site?page=mySite');
      return;
    }

    if (version === 'FREE') {
      gotoTrial();
    }
  }, [version]);

  const gotoTrial = () => {
    // temporarily hardcoded
    const currentUser = systemApi.getCurrentUser();
    if (currentUser?.sessionId && inWindow()) {
      window.location.href = `${getWaimaoTrailEntryHost()}jump/index.html?sid=${currentUser.sessionId}`;
    }
  };

  const [hasWarmUpPermission, setHasWarmUpPermission] = useState(false);
  useEffect(() => {
    fetchBindingWarmUpInfo();
  }, []);

  const fetchBindingWarmUpInfo = async () => {
    const resp = await EDMAPI().multiAccountOverview({ days: 14, sources: [WarmUpAccountSource.system, WarmUpAccountSource.custom] });
    setHasWarmUpPermission(resp.totalAccounts > 0);
  };

  useEffect(() => {
    let moduleName = locationTag.hash.substring(1).split('?')[0];
    if (v1v2 === 'v2') {
      // 客户履约
      if (isMatchCustomerPerformanceRoute()) {
        moduleName = '/unitable-crm/sell-order/list';
      }
      // 客户管理
      if (isMatchCustomerManageRoute()) {
        moduleName = '/unitable-crm';
      }
    }
    const params = new URLSearchParams(location.hash.split('?')[1]);
    registerRouterInterceptor();
    const targetData = topMenu.find(i => i.path === moduleName);
    if (!topMenu.map(t => t.path).includes(moduleName)) return;
    if (!speUrl.includes(moduleName as TopMenuPath) && moduleName !== '') {
      let filterData;
      if (targetData) {
        filterData = filterSideTree(targetData, menuKeys, isRbac, hasWarmUpPermission);
      } else {
        filterData = filterSideTree(topMenu[1], menuKeys, false, hasWarmUpPermission);
      }
      // 应用中心特殊处理
      if (filterData[0]?.path === TopMenuPath.coop && !shouldShowAppTab && !isOfficeDomain) {
        filterData[0].children = filterData[0].children.filter(item => item.path !== 'apps');
      }
      // 免费版用户屏蔽菜单
      if (isFreeVersionUser) {
        filterData = filterData.map(item => ({
          ...item,
          children: item.children.filter(subItem => !['EDM_SENDBOX', 'FACEBOOK'].includes(subItem.label)),
        }));
      }
      // 插件获客特殊处理：进入该页面后消除 New 标识
      if (isVisitedExtension) {
        const extensionMenuItem = filterData[0]?.children?.[0]?.children?.find(item => item.label === 'BROWSER_EXTENSION');
        if (extensionMenuItem?.showNewBadge) {
          extensionMenuItem.showNewBadge = false;
        }
      }
      if (isVisitedRcmd) {
        const extensionMenuItem = filterData[0]?.children[2]?.children?.find(item => item.label === 'GLOBAL_SEARCH_RCMD');
        if (extensionMenuItem?.showNewBadge) {
          extensionMenuItem.showNewBadge = false;
        }
      }
      // 如无货代权限 隐藏货代二级菜单
      if (!menuKeys[FORWARDER_PORT_MENU_LABEL]) {
        filterData = filterData.map(item => ({
          ...item,
          children: item.children?.map(subItem => ({
            ...subItem,
            children: subItem.children?.filter(subItem2 => FORWARDER_PORT_MENU_LABEL !== subItem2.label),
          })),
        }));
      }
      if (version === 'WEBSITE') {
        filterData = filterData.map(item => ({
          ...item,
          children: item.children?.map(subItem => ({
            ...subItem,
            children: subItem.children?.filter(subItem2 => subItem2.label !== 'WEBSITE_TARGET_CONTACT'),
          })),
        }));
      }

      const ans: any = findActiveKeys(
        filterData,
        v1v2 === 'v2' && isMatchUnitableCrmHash(location.hash) ? getActiveKeyByPath(location.hash) : (params.get('page') as string)
      );
      setSidePath(ans?.xPath?.split(','));
      // 品牌建设合并tab
      if (['stat', 'siteCustomer'].includes(params.get('page') as string)) {
        setSidePath(['stat']);
      }
      if (['articleList', 'categoryList'].includes(params.get('page') as string)) {
        setSidePath(['articleList']);
      }
      if (isWebSite && filterData[0]?.path === TopMenuPath.enterpriseSetting) {
        filterData[0].children = filterData[0].children
          .filter(i => ['customSetting', 'goodSetting'].includes(i.path))
          .map(i => {
            if (i.path === 'customSetting') {
              return { ...i, children: i.children.filter(it => it.path === 'customer-setting') };
            }
            if (i.path === 'goodSetting') {
              return { ...i, children: i.children.filter(it => it.path === 'product-setting') };
            }
            return i;
          });
      }
      setSideMenuData(packedData(filterData));
    }
    setTitlePath(moduleName);
    setPageInModuleMap({ mpMap: { [`${moduleName}`]: params.get('page') as string }, key: moduleName });
  }, [locationTag, menuKeys, isRbac, shouldShowAppTab, isFreeVersionUser, isVisitedExtension, isVisitedRcmd, hasWarmUpPermission]);

  useEffect(() => {
    const moduleName = locationTag.hash.substring(1).split('?')[0];
    if (moduleName === TopMenuPath.mailbox) {
      navigate(ruleEngine(locationTag.hash, null));
      return;
    }
    if (isMatchUnitableCrmHash(location.hash) || moduleName === 'emailInquiry') {
      return;
    }

    if (speUrl.includes(moduleName as TopMenuPath) || moduleName == '' || !topMenu.map(t => t.path).includes(moduleName)) redirectUrl();
  }, [visibleWorktable]);

  const data = useL2cCrmMenuData(modulePermission, menuKeys);
  if (isMatchUnitableCrmHash(location.hash) && sideMenuData !== data && isMatchCustomerManageRoute()) {
    setTitlePath('/unitable-crm');
    setSideMenuData(data);
  }

  // 客户履约
  const uniExec = useL2cCrmCustomerPerformanceMenuData(modulePermission, menuKeys);
  if (isMatchUnitableCrmHash(location.hash) && sideMenuData !== uniExec && isMatchCustomerPerformanceRoute()) {
    // 非路由 仅标记
    setTitlePath('/unitable-crm/sell-order/list');
    setSideMenuData(uniExec);
  }

  const redirectUrl = () => {
    if (visibleWorktable === undefined) return;
    if (visibleWorktable) {
      navigate(`#${TopMenuPath.worktable}?page=${TopMenuPath.worktable}`);
    } else {
      navigate(`#${TopMenuPath.mailbox}?page=${TopMenuPath.mailbox}`);
    }
  };

  useEffect(() => {
    fetchSelectedAppConfig();
    fetchBannerConfig();
    dispatch(getMenuVersion());
  }, []);

  const fetchSelectedAppConfig = async () => {
    const response = await advertApi.fetchConfig(selectedAppsSpaceCode);
    if (response.data) {
      const temp = (response.data.itemList as AdvertConfig[]) || [];
      const filterTemp = temp.filter(t => {
        const res = t.advertResourceList[0];
        return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
      });
      if (filterTemp && filterTemp.length > 0) {
        setShouldShowAppTab(true);
      }
    }
  };

  const fetchBannerConfig = async () => {
    const response = await advertApi.fetchConfig(bannerSpaceCode);
    if (response.data) {
      const temp = (response.data.itemList as AdvertConfig[]) || [];
      const filterTemp = temp.filter(t => {
        const res = t.advertResourceList[0];
        return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
      });
      if (filterTemp && filterTemp.length > 0) {
        setShouldShowAppTab(true);
      }
    }
  };

  // useEffect(() => {
  //   const newVersionShowStore = storeApi.getSync(newVId);
  //   const { data, suc } = newVersionShowStore;
  //   if (suc && data === 'true') {
  //     return;
  //   }
  //   setGuide('versionModal', true);
  // }, []);

  const menuDataFinal = inWindow() && isMatchCustomerPerformanceRoute() ? uniExec : inWindow() && isMatchCustomerManageRoute() ? data : sideMenuData;

  const handleMenuTrack = (current: { key: string }) => {
    if (v1v2 !== 'v2') return;
    const trackEventId = trackEventMap[current.key];
    if (trackEventId) trackerApi.track(trackEventId, { version: 1 });
  };

  return (
    <>
      <IndexPageWrapper>
        <MemoizedTinymceTooltip />
        <ViewtabContext.Provider value={{ tabList, setTablist }}>
          <Layout style={{ height: '100%' }} className="web-wm-entry-container">
            <HeaderFc
              setTablist={setTablist}
              onTopItem={onTopItem}
              onChange={handleChange}
              moduleName={titlePath}
              visibleAdmin={showComSetting}
              hasWarmupEntry={hasWarmUpPermission}
            />
            <ViewTab tabList={tabList} setTablist={setTablist} />
            <Layout>
              {showWebSideBar && (
                <SideBar
                  sideMenuData={menuDataFinal}
                  sidePath={sidePath}
                  allKeys={allKeys}
                  moduleName={titlePath}
                  onMenuClick={onMenuClick}
                  onSubMenuClick={handleMenuTrack}
                />
              )}
              {renderContent}
              {/* <VersionGuide */}
              {/*  quickStart={() => { */}
              {/*    storeApi.put(newVId, 'true'); */}
              {/*    setAll({ guideVisible: true, versionModal: false }); */}
              {/*  }} */}
              {/*  visible={version === 'WEBSITE' ? false : guideMap.versionModal} */}
              {/* /> */}
              <VersionPrompt />
              <NewbieTask />
              <GlobalNotification />
              <ModuleNotifications />
            </Layout>
          </Layout>
        </ViewtabContext.Provider>
        {process.env.BUILD_ISEDM && <Notice notice={edmNotice} />}
        {process.env.BUILD_ISEDM && <div id="unidrawer-root" />}
        {process.env.BUILD_ISEDM && version !== 'WEBSITE' && <FloatButtonRoot visible showGrubProcess={titlePath === 'wmData' && !isFreeVersionUser} />}
        {/* {isEdm() && version !== 'WEBSITE' && <AIFloatButton />} */}
        <NpsSurvey />
        <MarketingModalList />
        {/* <NpsVpnSurvey /> */}
        {/* <NpsLinkedIn /> */}
      </IndexPageWrapper>
      {/* {guideState.map((item: any, idx: number) => ( */}
      {/*  <HollowOutWmWeb */}
      {/*    guideId={webGuideId} */}
      {/*    title={item.title} */}
      {/*    intro={item.intro} */}
      {/*    targetHeight={item.targetHeight} */}
      {/*    placement={item.placement} */}
      {/*    refresh={idx} */}
      {/*    step={idx + 1} */}
      {/*    extraView={item.targetView} */}
      {/*    enable={guideMap.guideVisible} */}
      {/*    skip */}
      {/*  > */}
      {/*    {item.type !== 'bookmark' ? ( */}
      {/*      <div style={{ height: 54, width: '100%', position: 'absolute', top: 0 }} /> */}
      {/*    ) : ( */}
      {/*      <div style={{ height: 38, width: '100%', position: 'absolute', top: 54 }} /> */}
      {/*    )} */}
      {/*  </HollowOutWmWeb> */}
      {/* ))} */}
    </>
  );
};

export default IndexPage;
