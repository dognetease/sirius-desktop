/* eslint-disable max-len */
import React, { useEffect, useMemo, useRef, useState, useCallback, ComponentProps } from 'react';
import { PageProps, navigate } from 'gatsby';
import Loadable from '@loadable/component';
import LoadingWithMenu from '@/components/Layout/tab-loading/with-menu';
import LoadingNoMenu from '@/components/Layout/tab-loading/no-menu';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const loadableOption = {
  fallback: <LoadingNoMenu />,
};
const menuLoadableOption = {
  fallback: <LoadingWithMenu />,
};
import {
  apiHolder,
  environment,
  inWindow,
  MailApi,
  apis,
  AdvtertApi,
  NetStorageApi,
  NIMApi,
  ResNotice,
  selectedAppsSpaceCode,
  AdvertConfig,
  bannerSpaceCode,
  AdvertApi,
  api,
  ProductAuthApi,
  getIn18Text,
  InsertWhatsAppApi,
} from 'api';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
/* IFTRUE_USELAZYLOAD */
const Schedule = Loadable(() => import('@web-schedule/schedule'), loadableOption);
const Disk = Loadable(() => import('@web-disk/index'), loadableOption);
const Setting = Loadable(() => import('@web-setting/index'), menuLoadableOption);
const Contact = Loadable(() => import('@web-contact/contact'), loadableOption);
const IM = Loadable(() => import('@web-im/im'), loadableOption);
const Site = Loadable(() => import('@web-site/index'), menuLoadableOption);
const UnitableCrm = Loadable(() => import('@web-unitable-crm/unitable-crm'), {
  resolveComponent: commponents => commponents.UnitableCrm,
  ...menuLoadableOption,
});
// const Apps = Loadable(() => import('@web-apps/apps'), {
//   resolveComponent: components => components.Apps,
//   ...loadableOption,
// });
const Worktable = Loadable(() => import('@/components/Layout/Worktable/workTable'), {
  resolveComponent: components => components.Worktable,
  ...loadableOption,
});
// const HelpCenter = Loadable(() => import('@/components/Layout/helpCenter/index'), {
//   resolveComponent: components => components.HelpCenter,
//   ...loadableOption,
// });
// import Customer from '../components/Layout/Customer/customerIndex';
const BigData = Loadable(() => import('@/components/Layout/SceneAggregation/bigData'), menuLoadableOption);
const Coop = Loadable(() => import('@/components/Layout/SceneAggregation/coop'), menuLoadableOption);
const IntelliMarketing = Loadable(() => import('@/components/Layout/SceneAggregation/intelliMarketing'), menuLoadableOption);
const SystemTask = Loadable(() => import('@/components/Layout/TaskCenter/pages/SystemTask'), loadableOption);
const NoviceTask = Loadable(() => import('@/components/Layout/TaskCenter/pages/NoviceTask'), loadableOption);
const EmailInquiry = Loadable(() => import('@/components/Layout/EmailInquiry'), loadableOption);

const WhatsAppChat = Loadable(() => import('@/components/Layout/WhatsAppChat/container'), loadableOption);

const RbacSetting = Loadable(() => import('@/components/Layout/Rbac/rbac'), loadableOption);
const EnterpriseSetting = Loadable(() => import('@/components/Layout/EnterpriseSetting'), {
  resolveComponent: components => components.EnterpriseSetting,
  ...loadableOption,
});
if (inWindow()) {
  try {
    setTimeout(() => {
      IntelliMarketing.preload();
    }, 100);
  } catch (ex) {
    console.error(`IntelliMarketing preload error`, ex);
  }
}
/* FITRUE_USELAZYLOAD */

/* IFTRUE_NOUSELAZYLOAD */
//@ts-ignore
import Schedule from '@web-schedule/schedule';
//@ts-ignore
import Disk from '@web-disk/index';
//@ts-ignore
import Setting from '@web-setting/index';
//@ts-ignore
import Contact from '@web-contact/contact';
//@ts-ignore
import IM from '@web-im/im';
//@ts-ignore
import Site from '@web-site/index';
//@ts-ignore
import { UnitableCrm } from '@web-unitable-crm/unitable-crm';
//@ts-ignore
// import { Apps } from '@web-apps/apps';
//@ts-ignore
import { Worktable } from '@/components/Layout/Worktable/workTable';
//@ts-ignore
// import { HelpCenter } from '@/components/Layout/helpCenter/index';
//@ts-ignore
import BigData from '@/components/Layout/SceneAggregation/bigData';
//@ts-ignore
import Coop from '@/components/Layout/SceneAggregation/coop';
//@ts-ignore
import IntelliMarketing from '@/components/Layout/SceneAggregation/intelliMarketing';
//@ts-ignore
import SystemTask from '@/components/Layout/TaskCenter/pages/SystemTask';
//@ts-ignore
import EmailInquiry from '@/components/Layout/EmailInquiry';
//@ts-ignore
import NoviceTask from '@/components/Layout/TaskCenter/pages/NoviceTask';
//@ts-ignore
import WhatsAppChat from '@/components/Layout/WhatsAppChat/container';
//@ts-ignore
import RbacSetting from '@/components/Layout/Rbac/rbac';
//@ts-ignore
import { EnterpriseSetting } from '@/components/Layout/EnterpriseSetting';

/* FITRUE_NOUSELAZYLOAD */

import MailBox from '@web-mail/mailBox';
import { SiriusL2cApp } from '@lxunit/app-l2c-crm';
import { L2cCrmPageType } from '@web-common/conf/waimao/l2c-crm-constant';
import { useL2cCrmSidebarMenu } from '../../../web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data';
import { isMatchUnitableCrmHash, unitableRouteHashPrefix } from '@web-unitable-crm/api/helper';
// import Edm from '@web-edm/edmIndex';
import { KeyboardModel } from '@web-setting/Keyboard/keyboard';
import {
  CalenderIcon,
  ContactIcon,
  DiskTabIcon,
  IMIcon,
  MailBoxIcon,
  BigDataIcon,
  IntelliMarketingIcon,
  CustomerIcon,
  BusinessIcon,
  BusinessExecIcon,
  WorktableIcon,
  EnterpriseIcon,
  SiteIcon,
  SystemTaskIcon,
  KnowledgeIcon,
  WaTabIcon,
  CoopIcon,
} from '@web-common/components/UI/Icons/icons';
import { FloatButtonRoot } from '@web-common/components/FloatToolButton';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import { AntdConfig } from '@web-common/components/UI/Config/Config';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import {
  getIsSomeMenuVisbleSelector,
  getMenuSettingsAsync,
  getMenuVersion,
  getPrivilegeAsync,
  getVersionAsync,
  getMyRolesAsync,
} from '@web-common/state/reducer/privilegeReducer';
import { doSharedAccountAsync } from '@web-common/state/reducer/loginReducer';
import { useLocation } from '@reach/router';
import lodashGet from 'lodash/get';
import { useFreeWriteMailErrorHandler } from '@web-mail/components/PaidGuideModal/index';
import { NoviceTaskActions, ReadCountActions } from '@web-common/state/reducer';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Button } from 'antd';
// import { AIFloatButton } from '@web-common/components/AIFloatButton/index';
import { useVersionCheck } from '@web-common/hooks/useVersion';

// import { l2cV2forbusinessManage, l2cV2forbusinessExec } from '@web-common/conf/waimao/constant';
// import Customer from '../components/Layout/Customer/customerIndex';
// import Sns from '../components/Layout/SNS/snsIndex';
// import '../styles/global.scss';
// import Config from '../components/Layout/MailConfig/menuIcon';
import { navigateToSchedule } from '@/layouts/Main/util';
import SiriusLayout from '@/layouts';
import UpgradeApp from '@/components/Electron/Upgrade';
import { Notice } from '@/components/UI/Notice/notice';

import WmEntryNotification from '@/components/UI/WmEntryNotification';
import { GlobalAdvertNotification } from '@/components/UI/GlobalAdvertNotification/GlobalAdvertNotification';
import { SiriusPageProps } from '@/components/Layout/model';
import { NpsSurvey } from '@/components/Npsmeter';

// import NoviceTaskEntry from '@/components/Layout/TaskCenter/components/NoviceTaskEntry';
import { showNoviceTaskCloseTip } from '@/components/Layout/TaskCenter/utils';
import { isMatchCustomerManageRoute, isMatchCustomerPerformanceRoute } from '../../../web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data';
import { getTransText } from '@/components/util/translate';
import style from '../styles/pages/index.module.scss';

// import { l2cV2forbusinessManage, l2cV2forbusinessExec } from '@web-common/conf/waimao/constant';
import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
import { VersionPrompt } from '@web-common/components/versionPrompt';
import { MarketingModalList } from '@web-edm/components/MarketingModalList/marketingModalList';
import { getWaimaoTrailEntryHost } from '@web-common/utils/utils';

type SiriusL2cAppProps = ComponentProps<typeof SiriusL2cApp>;

console.info('---------------------from index page------------------');
// const buildFor = apiHolder.env.forElectron;
// const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
// const advertApi = apiHolder.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
// const inElectron = systemApi.isElectron();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
// const isOfficeDomain = systemApi.getCurrentUser()?.domain === 'office.163.com';
// const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const insertWhatsAppApi = apiHolder.api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const moduleNamePattern = /#(\/?[\w\d_-]+)((?=\?)|($))/;

//是否访问过该hash，用于外贸通懒加载
const activeKeyVisitMap: { [key: string]: boolean } = {
  'unittable-crm-v2-pref': true,
  'unittable-crm-v2': true,
  'unitable-crm-v1': true,
};

const HOCEntry = (WrapElement: React.FunctionComponent<SiriusPageProps>, isSuspense = true) => {
  const ControlSuspenseComponent: React.FC<SiriusPageProps> = props => {
    const { activeKey, name } = props;
    if (activeKey !== name) {
      return null;
    }

    if (isSuspense) {
      return (
        <React.Suspense fallback={<div>loading...</div>}>
          <WrapElement {...props} />
        </React.Suspense>
      );
    }

    return <WrapElement {...props} />;
  };

  return ControlSuspenseComponent;
};

// // 应用中心入口
// const AppStoreEntry: React.FC<SiriusPageProps> = props => {
//   const { activeKey, name } = props;
//   const appsVisible = activeKey && name && activeKey === name;
//   const [shouldShowAppTab, setShouldShowAppTab] = useState<boolean>(false);

//   const fetchSelectedAppConfig = async () => {
//     const response = await advertApi.fetchConfig(selectedAppsSpaceCode);
//     if (response.data) {
//       const temp = (response.data.itemList as AdvertConfig[]) || [];
//       const filterTemp = temp.filter(t => {
//         const res = t.advertResourceList[0];
//         return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
//       });
//       if (filterTemp && filterTemp.length > 0) {
//         setShouldShowAppTab(true);
//       }
//     }
//   };

//   const fetchBannerConfig = async () => {
//     const response = await advertApi.fetchConfig(bannerSpaceCode);
//     if (response.data) {
//       const temp = (response.data.itemList as AdvertConfig[]) || [];
//       const filterTemp = temp.filter(t => {
//         const res = t.advertResourceList[0];
//         return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
//       });
//       if (filterTemp && filterTemp.length > 0) {
//         setShouldShowAppTab(true);
//       }
//     }
//   };
//   useEffect(() => {
//     fetchSelectedAppConfig();
//     fetchBannerConfig();
//   }, []);

//   if (!shouldShowAppTab || !appsVisible) {
//     return null;
//   }

//   return HOCEntry(Apps)(props);
// };

// IM入口
const visibleIM = nimApi.getIMAuthConfig();
const IMEntry: React.FC<SiriusPageProps> = React.memo(
  (props: SiriusPageProps) => {
    const { activeKey, name } = props;

    const [enableRenderIM, setEnableRenderIM] = useState(false);

    // 想办法刚上来的时候不要触发渲染.
    useEffect(() => {
      setEnableRenderIM(flag => {
        if (flag) {
          return flag;
        }
        return activeKey === name;
      });
    }, [activeKey]);

    if (!enableRenderIM) {
      return null;
    }

    return <IM />;
  },
  (prevProps, props) => {
    if (lodashGet(props, 'activeKey', '') !== 'message') {
      return true;
    }
    if (lodashGet(props, 'activekey', '') === lodashGet(prevProps, 'activeKey', '')) {
      return true;
    }
    return false;
  }
);

// 邮件入口
const MailEntry: React.FC<SiriusPageProps> = React.memo(
  props => {
    const dispatch = useAppDispatch();
    const { hash } = useLocation();
    // 这个逻辑可以考虑迁走;
    useEffect(() => {
      const eventId = listenWriteMail(dispatch);
      if (inWindow() && hash && writeToPattern.test(hash)) {
        const exec = writeToPattern.exec(hash);
        if (exec && exec[1]) {
          const writeTo = safeDecodeURIComponent(exec[1]);
          mailApi.doWriteMailToContact([writeTo]);
        }
      }
      return () => {
        eventApi.unregisterSysEventObserver('writeLatter', eventId);
      };
    }, []);
    return <MailBox />;
  },
  (prevProps, props) => {
    const { name = 'mail' } = props;
    // 只要不是邮件就跳过渲染
    if (lodashGet(props, 'activeKey', '') !== name) {
      return true;
    }

    if (lodashGet(props, 'activekey', '') === lodashGet(prevProps, 'activeKey', '')) {
      return true;
    }
    return false;
  }
);

// 日历入口
// const ScheduleEntry:React.FC<SiriusPageProps> = HOCEntry(Schedule);
const ScheduleEntry: React.FC<SiriusPageProps> = HOCEntry(Schedule);

const lazyEntry = (Comp: React.FunctionComponent<SiriusPageProps>, activeName: string) => {
  const WrapElement = React.memo(
    (props: SiriusPageProps) => {
      const { activeKey, name } = props;

      const [enableRender, setEnableRender] = useState(false);

      useEffect(() => {
        setEnableRender(flag => {
          if (flag) {
            return flag;
          }
          return activeKey === name;
        });
      }, [activeKey]);

      if (!enableRender) {
        return null;
      }

      return <Comp {...props} />;
    },
    (prevProps, props) => {
      if (lodashGet(props, 'activeKey', '') !== activeName) {
        return true;
      }
      return false;
    }
  );

  return WrapElement;
};

const WorktableEntry = lazyEntry(Worktable, 'worktable');
const IMarketEntry = lazyEntry(IntelliMarketing, 'edm');

const BigDataEntry: React.FC<SiriusPageProps> = React.memo(
  (props: SiriusPageProps) => {
    const { activeKey, name } = props;

    const [enableRender, setEnableRender] = useState(false);

    useEffect(() => {
      setEnableRender(flag => {
        if (flag) {
          return flag;
        }
        return activeKey === name;
      });
    }, [activeKey]);

    if (!enableRender) {
      return null;
    }

    return <BigData name={name} redPoint active={activeKey === 'wmData'} />;
  },
  (prevProps, props) => {
    if (lodashGet(props, 'activeKey', '') !== 'wmData') {
      return true;
    }
    return false;
  }
);

// Contact入口
const ContactEntry: React.FC<SiriusPageProps> = HOCEntry(Contact);

const DiskEntry: React.FC<SiriusPageProps> = HOCEntry(Disk);

const WaEntry: React.FC<SiriusPageProps> = HOCEntry(WhatsAppChat);

const SettingEntry: React.FC<SiriusPageProps> = HOCEntry(Setting);

const IndexPageWrapper: React.FC<any> = ({ children, visibleUpgradeApp, upgradeInfo, setVisible, activeKey }) => (
  <SiriusLayout.ContainerLayout isLogin={false} activeKey={activeKey}>
    {children}
    {process.env.BUILD_ISELECTRON && visibleUpgradeApp === 2 ? <UpgradeApp upgradeInfo={upgradeInfo} setVisibleUpgradeApp={setVisible} /> : null}
  </SiriusLayout.ContainerLayout>
);

const IndexPage: React.FC<PageProps> = () => {
  const SalesPitchPage = useMemo(() => (process.env.BUILD_ISEDM ? SalesPitchPageHoc('settingBoard') : <></>), []);

  const dispatch = useAppDispatch();
  const [visibleUpgradeApp, setVisibleUpgradeApp] = useState<number>(0);
  // const [contactSyncIframeShow, setContactSyncIframeShow] = useState<boolean>(false);
  const [upgradeInfo, setUpgradeInfo] = useState();
  const [visibleKeyboardModel, setVisibleKeyboardModel] = useState<boolean>(false);

  const version = useAppSelector(state => state.privilegeReducer.version);
  const refVisibleUpgradeApp = useRef(visibleUpgradeApp);
  const refVisibleKeyboardModel = useRef(visibleKeyboardModel);
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  const v1v2 = useVersionCheck();
  const isWaimaoV2 = process.env.BUILD_ISEDM && v1v2 === 'v2';
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);

  const [edmNotice, setEdmNotice] = useState<ResNotice | null>(null);

  const appDispatch = useAppDispatch();

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      appDispatch(getMyRolesAsync());
    }
  }, []);

  const setVisible = process.env.BUILD_ISWEB
    ? (bool: boolean) => {
        console.log(bool);
      }
    : useCallback((bool: boolean) => {
        setVisibleUpgradeApp(bool ? 2 : 1);
      }, []);

  const preHandler = useFreeWriteMailErrorHandler();
  useCommonErrorEvent('indexCommonErrorOb', undefined, preHandler);

  useEventObserver('keyboard', {
    name: 'global-keyboard-listener',
    func: ev => {
      const { eventData } = ev;
      if (ev.eventStrData === 'global' && eventData) {
        if (eventData.action === 'visibleKeyboardModel') {
          setVisibleKeyboardModel(true);
        } else if (eventData.action === 'navigate') {
          if (eventData.module === 'schedule' && navigateToSchedule()) {
            return;
          }
          navigate(eventData.url);
        }
      }
    },
  });

  if (process.env.BUILD_ISELECTRON) {
    useEffect(() => {
      refVisibleUpgradeApp.current = visibleUpgradeApp;
    }, [visibleUpgradeApp]);
  }

  useEffect(() => {
    refVisibleKeyboardModel.current = visibleKeyboardModel;
  }, [visibleKeyboardModel]);

  useEffect(() => {
    // electron主页面 监听邮件是否发送成功
    if (process.env.BUILD_ISELECTRON) {
      eventApi.registerSysEventObserver('upgradeApp', {
        func: ev => {
          console.log('visibleUpgradeApp', ev, refVisibleUpgradeApp.current);
          if (ev?.eventData?.forcePopup) {
            setVisibleUpgradeApp(2);
          } else {
            refVisibleUpgradeApp.current === 0 && setVisibleUpgradeApp(2);
          }
          if (ev && ev.eventData) {
            setUpgradeInfo(ev.eventData);
          }
        },
      });
    }
    if (process.env.BUILD_ISEDM) {
      appDispatch(getMenuSettingsAsync());
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      appDispatch(getMenuSettingsAsync());
    }
  }, [v1v2]);

  useEffect(() => {
    const eventId = eventApi.registerSysEventObserver('sharedAccountLogout', {
      name: 'mainpage-sharedAccoutLogout',
      func: _ => {
        setTimeout(() => {
          dispatch(doSharedAccountAsync());
        }, 10);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('sharedAccountLogout', eventId);
    };
  }, []);

  // const [isDevEnv] = useState(environment === 'dev');

  const { hash: currentHash } = useLocation();
  const defaultActiveKey = 'mailbox';
  const [activeKey, setActiveKey] = useState(defaultActiveKey);
  activeKeyVisitMap[defaultActiveKey] = true;

  useEffect(() => {
    if (!currentHash || !currentHash.length) {
      return;
    }
    const matchedArr = currentHash.match(moduleNamePattern);
    /**
     * crm 使用的是react-router-dom hash路由，path存在多个层级，因此这里判断一下是否是以unitable-crm为前缀的路由
     * 如果是则设置当前激活的tab为 /unitable-crm
     * */
    let activeKey = '';
    if (v1v2 !== 'v2' && isMatchUnitableCrmHash(currentHash)) {
      activeKey = unitableRouteHashPrefix;
      setActiveKey(activeKey);
      activeKeyVisitMap[activeKey] = true;
      return;
    }

    if (v1v2 === 'v2' && isCustomerManageRoute) {
      activeKey = unitableRouteHashPrefix + '/tab1';
      setActiveKey(activeKey);
      activeKeyVisitMap[activeKey] = true;
      return;
    }

    if (v1v2 === 'v2' && isCustomerPerformanceRoute) {
      activeKey = unitableRouteHashPrefix + '/tab2';
      setActiveKey(activeKey);
      activeKeyVisitMap[activeKey] = true;
      return;
    }

    if (!matchedArr) {
      return;
    }
    activeKeyVisitMap[matchedArr[1] as string] = true;
    setActiveKey(matchedArr[1] as string);
  }, [currentHash]);

  const [visibleStyle] = useState({
    display: 'flex',
    flex: '1 1 0%',
    overflow: 'hidden',
  });

  const [hiddenStyle] = useState({
    display: 'none',
  });

  // const visibleEdm = useAppSelector(state => getIsSomeMenuVisbleSelector(
  //   state.privilegeReducer,
  //   [
  //     'EDM_SENDBOX', 'EDM_DATA_STAT', 'EDM_DRAFT_LIST', 'EDM_BLACKLIST',
  //     'ADDRESS_BOOK_LIST', 'ADDRESS_OPEN_SEA', 'MARKET_DATA_STAT',
  //   ],
  // ));
  // const visibleCustomer = useAppSelector(state => getIsSomeMenuVisbleSelector(
  //   state.privilegeReducer,
  //   ['CONTACT_COMMERCIAL_LIST', 'CONTACT_CHANNEL_LIST', 'CONTACT_TAG_MANAGE', 'CONTACT_LIST', 'CHANNEL_OPEN_SEA']
  // ));
  const visibleWorktable = process.env.BUILD_ISLINGXI ? false : useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WORKBENCH']));
  const visibleCustomsData = process.env.BUILD_ISLINGXI ? false : useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CUSTOMS']));
  const visilbeGlobalSearch = process.env.BUILD_ISELECTRON ? false : useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['GLOBAL_SEARCH']));
  const visilbeEnterpirseSetting = process.env.BUILD_ISLINGXI ? false : useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['ORG_SETTINGS']));
  const visibleWA =
    process.env.BUILD_ISEDM &&
    useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WA_CHAT_MANAGE', 'WA_FILE_MANAGE', 'WA_CHAT_LIST', 'WHATSAPP_PERSONAL']));
  const visibleCUSTOMER_MANAGE = process.env.BUILD_ISEDM && useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CUSTOMER_MANAGE']));
  const visibleCUSTOMER_PROMISE = process.env.BUILD_ISEDM && useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CUSTOMER_PROMISE']));
  const visibleCUSTOMER_EXLOIT = process.env.BUILD_ISEDM && useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CUSTOMER_EXLOIT']));
  // const visibleSns = useAppSelector(state => getIsSomeMenuVisbleSelector(
  //   state.privilegeReducer,
  //   [
  //     'WHATSAPP_SEND_TASK',
  //     'WHATSAPP_MSG',
  //     'WHATSAPP_MSG_TPL_SETTING',
  //     'WHATSAPP_DATA_STAT',
  //   ],
  // ));

  const visilbeSiteManager = process.env.BUILD_ISLINGXI ? false : useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WEBSITE_ADMIN']));
  // const enalbeFastMail = useAppSelector(state => state?.privilegeReducer?.enableFastMail);
  if (process.env.BUILD_ISEDM) {
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
  }

  // useEffect(() => {
  //   if (process.env.BUILD_ISEDM && enalbeFastMail === undefined && systemApi.getCurrentUser()?.prop?.enable_fastmail === undefined) {
  //     // 权限失败，重新获取
  //     dispatch(isEnableFastmailAsync());
  //   }
  // }, [enalbeFastMail]);

  useEffect(() => {
    if (!process.env.BUILD_ISEDM) {
      return;
    }
    if (activeKey === 'edm' || activeKey === 'worktable' || activeKey === 'wmData') {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
    }

    appDispatch(getMenuVersion());
    appDispatch(getVersionAsync());
  }, [activeKey]);
  const __hash__ = inWindow() ? window.location.hash : '';
  const isCrmRouteMatch = isMatchUnitableCrmHash(__hash__);
  const isCustomerManageRoute = isCrmRouteMatch && isMatchCustomerManageRoute(__hash__);
  if (isCustomerManageRoute) {
    activeKeyVisitMap['unittable-crm-v2'] = true;
  }
  const isCustomerPerformanceRoute = isCrmRouteMatch && isMatchCustomerPerformanceRoute(__hash__);
  if (isCustomerPerformanceRoute) {
    activeKeyVisitMap['unittable-crm-v2-pref'] = true;
  }

  const l2cCrmSidebarMenuExtra = useL2cCrmSidebarMenu();

  // const HelpCenterEntry = HOCEntry(HelpCenter);
  // const IMarketEntry = HOCEntry(IntelliMarketing);
  // const WorktableEntry = HOCEntry(Worktable);
  // const BigDataEntry = HOCEntry(BigData);
  if (isMatchUnitableCrmHash(activeKey)) {
    activeKeyVisitMap['unitable-crm-v1'] = true;
  }
  const edmEntries = process.env.BUILD_ISEDM
    ? [
        v1v2 !== 'v2' ? (
          <div
            style={isMatchUnitableCrmHash(activeKey) && v1v2 !== 'v2' ? visibleStyle : hiddenStyle}
            name={L2cCrmPageType.customerAndBusiness}
            tag={getIn18Text('KEHUHEYEWUWEB')}
            icon={BusinessIcon}
          >
            {activeKeyVisitMap['unitable-crm-v1'] && (
              <UnitableCrm
                name="unitable-crm"
                tag={getIn18Text('KEHUHEYEWUWEB')}
                icon={BusinessIcon}
                sidebarMenuVisible
                // menuDataType 解释可以看props的注释
                menuDataType="all"
              />
            )}
          </div>
        ) : null,
        v1v2 === 'v2' ? (
          <div
            style={isCustomerManageRoute ? visibleStyle : hiddenStyle}
            hidden={!visibleCUSTOMER_MANAGE}
            name={L2cCrmPageType.customerManagement}
            tag={getIn18Text('KEHUGUANLI')}
            icon={BusinessIcon}
          >
            {activeKeyVisitMap['unittable-crm-v2'] && (
              <UnitableCrm
                tag={getIn18Text('KEHUGUANLI')}
                icon={BusinessIcon}
                sidebarMenuVisible
                // menuDataType 解释可以看props的注释
                menuDataType="customer"
              />
            )}
          </div>
        ) : null,
        v1v2 === 'v2' ? (
          <div
            style={isCustomerPerformanceRoute ? visibleStyle : hiddenStyle}
            sidebarMenuVisible
            hidden={!visibleCUSTOMER_PROMISE}
            name={L2cCrmPageType.customerPerformance}
            tag={getIn18Text('KEHULVYUE')}
            icon={BusinessExecIcon}
          >
            {activeKeyVisitMap['unittable-crm-v2-pref'] && (
              <UnitableCrm
                tag={getIn18Text('KEHULVYUE')}
                icon={BusinessExecIcon}
                // menuDataType 解释可以看props的注释
                menuDataType="performance"
              />
            )}
          </div>
        ) : null,
        <div
          style={activeKey === 'edm' ? visibleStyle : hiddenStyle}
          name="edm"
          // tag={getIn18Text('intelliMarketing')}
          // icon={IntelliMarketingIcon}
          {...(v1v2 === 'v2'
            ? {
                tag: getIn18Text('KEHUKAIFA'),
                icon: IntelliMarketingIcon,
                hidden: !visibleCUSTOMER_EXLOIT,
              }
            : {
                tag: getIn18Text('intelliMarketing'),
                icon: IntelliMarketingIcon,
                hidden: false,
              })}
        >
          {activeKeyVisitMap['edm'] && <IMarketEntry name="edm" activeKey={activeKey} />}
        </div>,
        <div
          style={activeKey === 'worktable' ? visibleStyle : hiddenStyle}
          name="worktable"
          tag={getIn18Text('GONGZUOTAI')}
          icon={WorktableIcon}
          hidden={!visibleWorktable}
        >
          {activeKeyVisitMap['worktable'] && <WorktableEntry activeKey={activeKey} active={activeKey === 'worktable'} name="worktable" />}
        </div>,
        isWaimaoV2 ? (
          <div style={activeKey === 'coop' ? visibleStyle : hiddenStyle} name="coop" tag={getIn18Text('XIETONGBANGONG')} icon={CoopIcon}>
            {activeKeyVisitMap['coop'] && <Coop name="coop" activeKey={activeKey} redPoint active={activeKey === 'coop'} />}
          </div>
        ) : null,
        <div
          style={activeKey === 'wmData' ? visibleStyle : hiddenStyle}
          name="wmData"
          // tag={getIn18Text('BigData')}
          // icon={BigDataIcon}
          {...(v1v2 === 'v2'
            ? {
                tag: getIn18Text('KEHUFAXIAN'),
                icon: BigDataIcon,
              }
            : {
                tag: getIn18Text('BigData'),
                icon: BigDataIcon,
              })}
          hidden={!visibleCustomsData && !visilbeGlobalSearch}
          redPoint
        >
          {activeKeyVisitMap['wmData'] && <BigDataEntry name="wmData" activeKey={activeKey} redPoint active={activeKey === 'wmData'} />}
        </div>,
        <div
          style={activeKey === 'site' ? visibleStyle : hiddenStyle}
          name="site"
          tag={v1v2 === 'v2' ? getIn18Text('ZHANDIANGUANLI') : getIn18Text('ZHANDIANGUANLI')}
          icon={SiteIcon}
          hidden={!visilbeSiteManager}
        >
          {activeKeyVisitMap['site'] && <Site name="site" />}
        </div>,
        <div
          style={activeKey === 'enterpriseSetting' ? visibleStyle : hiddenStyle}
          name="enterpriseSetting"
          tag={getIn18Text('QIYESHEZHI')}
          icon={EnterpriseIcon}
          hidden={!visilbeEnterpirseSetting}
        >
          {activeKeyVisitMap['enterpriseSetting'] && <EnterpriseSetting name="enterpriseSetting" />}
        </div>,
        <div
          style={activeKey === 'rbac' ? visibleStyle : hiddenStyle}
          name="rbac"
          tag={getIn18Text('QUANXIAN')}
          // hidden
          hideInTab
          icon={CustomerIcon}
        >
          {activeKeyVisitMap['rbac'] && <RbacSetting name="rbac" />}
        </div>,
        // <div
        //   style={activeKey === 'helpCenter' ? visibleStyle : hiddenStyle}
        //   name="helpCenter"
        //   tag={getTransText('ZHISHIGUANGCHANG')}
        //   hidden={version === 'WEBSITE'}
        //   hideInTab
        //   icon={KnowledgeIcon}
        // >
        //   {activeKeyVisitMap['helpCenter'] && <HelpCenterEntry name="helpCenter" activeKey={activeKey} />}
        // </div>,
      ]
    : [];

  // console.log('cccc', enalbeFastMail, process.env.BUILD_ISEDM, edmEntries);

  const noviceTaskActions = useActions(NoviceTaskActions);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      const id = eventApi.registerSysEventObserver('NoviceTaskRegister', {
        func: event => {
          noviceTaskActions.registerNoviceTask(event.eventData);
        },
      });
      return () => {
        eventApi.unregisterSysEventObserver('NoviceTaskRegister', id);
      };
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      const id = eventApi.registerSysEventObserver('NoviceTaskFinished', {
        func: event => {
          const { taskName, shouldRemind } = event.eventData;

          if (shouldRemind) {
            Modal.success({
              title: `恭喜你完成「${taskName}」，是否继续完成其他新手引导？`,
              icon: <i className="icon success-icon" />,
              cancelText: getIn18Text('JIESHU'),
              okText: getIn18Text('JIXUWANCHENG'),
              onCancel: showNoviceTaskCloseTip,
              onOk: () => navigate('#noviceTask?page=noviceTask'),
            });
          } else {
            Modal.success({
              title: `恭喜你完成「${taskName}」！`,
              icon: <i className="icon success-icon" />,
              hideCancel: true,
              okText: getIn18Text('ZHIDAOLE'),
            });
          }
        },
      });
      return () => {
        eventApi.unregisterSysEventObserver('NoviceTaskFinished', id);
      };
    }
  }, []);
  const readcountActions = useActions(ReadCountActions);
  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      appDispatch(getVersionAsync());
      insertWhatsAppApi.getWAReddot().then(res => {
        console.log('waReddot', res);
        readcountActions.updateWAReddot(res.redDot);
      });
    }
  }, []);

  return (
    <IndexPageWrapper visibleUpgradeApp={visibleUpgradeApp} setVisible={setVisible} upgradeInfo={upgradeInfo} activeKey={activeKey}>
      <MemoizedTinymceTooltip />
      {/* 通用Antd配置 */}
      <AntdConfig />
      {/* {process.env.BUILD_ISEDM && <WmEntryNotification />} */}
      <SiriusLayout.MainLayout l2cCrmSidebarMenuExtra={l2cCrmSidebarMenuExtra}>
        {/* 内层直接引入模块 */}
        <div style={activeKey === 'mailbox' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon}>
          <MailEntry activeKey={activeKey} name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon} />
        </div>

        {visibleWA && <WaEntry name="wa" activeKey={activeKey} tag="WA" icon={WaTabIcon} redPoint />}

        {!isWaimaoV2 && (
          <div style={activeKey === 'schedule' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="schedule" tag={getIn18Text('RILI')} icon={CalenderIcon}>
            {(process.env.BUILD_ISEDM ? activeKeyVisitMap['schedule'] : true) && (
              <ScheduleEntry activeKey={activeKey} name="schedule" tag={getIn18Text('RILI')} icon={CalenderIcon} />
            )}
          </div>
        )}

        {!isWaimaoV2 && <ContactEntry activeKey={activeKey} name="contact" tag={getIn18Text('TONGXUNLU')} icon={ContactIcon} />}

        {visibleIM
          ? !isWaimaoV2 && (
              <div style={activeKey === 'message' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon}>
                {(process.env.BUILD_ISEDM ? activeKeyVisitMap['message'] : true) && (
                  <IMEntry activeKey={activeKey} name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon} />
                )}
              </div>
            )
          : null}

        {!isWaimaoV2 && <DiskEntry name="disk" activeKey={activeKey} tag={getIn18Text('YUNWENDANG')} icon={DiskTabIcon} />}

        {/* {isOfficeDomain ? <AppStoreEntry activeKey={activeKey} name="apps" tag={getIn18Text('YINGYONGZHONGXIN')} icon={AppsIcon} /> : null} */}

        {process.env.BUILD_ISEDM ? edmEntries : null}

        {(process.env.BUILD_ISEDM ? activeKeyVisitMap['setting'] : true) && (
          <SettingEntry activeKey={activeKey} active={activeKey === 'setting'} name="setting" tag={getIn18Text('SHEZHI')} icon={DiskTabIcon} hideInTab />
        )}

        {process.env.BUILD_ISEDM && (
          <div
            style={{ paddingTop: '32px', ...(activeKey === 'phase' ? visibleStyle : hiddenStyle) }}
            activeKey={activeKey}
            name="phase"
            tag={getIn18Text('HUASHUKU')}
            icon={SystemTaskIcon}
            hideInTab
          >
            <SalesPitchPage name="phase" />
          </div>
        )}
        {process.env.BUILD_ISEDM && (
          <div
            style={activeKey === 'systemTask' ? visibleStyle : hiddenStyle}
            activeKey={activeKey}
            name="systemTask"
            tag={getIn18Text('RENWUZHONGXIN')}
            icon={SystemTaskIcon}
            hideInTab
          >
            {(process.env.BUILD_ISEDM ? activeKeyVisitMap['systemTask'] : true) && <SystemTask name="systemTask" />}
          </div>
        )}
        {process.env.BUILD_ISEDM && (
          <div
            style={activeKey === 'emailInquiry' ? visibleStyle : hiddenStyle}
            activeKey={activeKey}
            name="emailInquiry"
            tag={getIn18Text('QUANBUXUNPAN')}
            icon={SystemTaskIcon}
            hideInTab
          >
            {(process.env.BUILD_ISEDM ? activeKeyVisitMap['emailInquiry'] : true) && <EmailInquiry name="emailInquiry" />}
          </div>
        )}

        {process.env.BUILD_ISEDM && (
          <div
            style={activeKey === 'noviceTask' ? visibleStyle : hiddenStyle}
            activeKey={activeKey}
            name="noviceTask"
            tag={getIn18Text('XINSHOURENWU')}
            icon={SystemTaskIcon}
            hideInTab
          >
            {(process.env.BUILD_ISEDM ? activeKeyVisitMap['noviceTask'] : true) && <NoviceTask name="noviceTask" />}
          </div>
        )}
      </SiriusLayout.MainLayout>
      <KeyboardModel
        visible={visibleKeyboardModel}
        onCancel={() => {
          setVisibleKeyboardModel(false);
        }}
      />
      {process.env.BUILD_ISEDM && <Notice notice={edmNotice} />}
      {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && <FloatButtonRoot visible showGrubProcess={activeKey === 'wmData'} />}
      {process.env.BUILD_ISEDM && <GlobalAdvertNotification />}
      {/* {process.env.BUILD_ISEDM && version !== 'WEBSITE' && <AIFloatButton />} */}
      {/* {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && <NoviceTaskEntry />} */}
      {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && <VersionPrompt />}
      {process.env.BUILD_ISEDM && <div id="unidrawer-root" />}
      {process.env.BUILD_ISEDM && version === 'FASTMAIL_EXPIRED' && (
        <Modal
          getContainer={false}
          maskStyle={{
            left: 68,
          }}
          visible={
            version === 'FASTMAIL_EXPIRED' &&
            (location.hash.includes('#wmData') ||
              location.hash.includes('#intelliMarketing') ||
              location.hash.includes('#edm') ||
              location.hash.includes('unitable') ||
              location.hash.includes('#site'))
          }
          title={null}
          footer={null}
          keyboard={false}
          maskClosable={false}
          closable={false}
        >
          <p>{getIn18Text('NINDEWAIMAOTONGYIGUO')}</p>
        </Modal>
      )}
      {process.env.BUILD_ISEDM && version === 'FREE' && (
        <Modal
          getContainer={false}
          maskStyle={{
            left: 68,
          }}
          visible={
            version === 'FREE' &&
            (location.hash.includes('#wmData') ||
              location.hash.includes('#intelliMarketing') ||
              location.hash.includes('#edm') ||
              location.hash.includes('unitable') ||
              location.hash.includes('#site'))
          }
          title={null}
          footer={null}
          keyboard={false}
          maskClosable={false}
          closable={false}
        >
          <p>
            {getIn18Text('NIHAIWEIGOUMAIWAIMAO')}
            <button
              className={style.learnmore}
              onClick={() => {
                window?.open(`${getWaimaoTrailEntryHost()}#wmData?page=globalSearch`);
              }}
            >
              {getIn18Text('FANGWENWANGYEBANWAIMAO')}
            </button>
          </p>
        </Modal>
      )}
      {process.env.BUILD_ISEDM && <NpsSurvey />}
      {process.env.BUILD_ISEDM && <MarketingModalList />}
    </IndexPageWrapper>
  );
};
export default IndexPage;
console.info('---------------------end index page------------------');
