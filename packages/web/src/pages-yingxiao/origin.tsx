/* eslint-disable max-statements */
/* eslint-disable max-len */
import React, { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { PageProps, navigate } from 'gatsby';
import { apiHolder, inWindow, MailApi, apis, NIMApi, ResNotice, selectedAppsSpaceCode, AdvertConfig, bannerSpaceCode, AdvertApi, getIn18Text } from 'api';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
import Schedule from '@web-schedule/schedule';
import Disk from '@web-disk/index';
import Setting from '@web-setting/index';
import Site from '@web-site/index';
import MailBox from '@web-mail/mailBox';
import Contact from '@web-contact/contact';
import { UnitableCrm } from '@web-unitable-crm/unitable-crm';
import { isMatchUnitableCrmHash, unitableRouteHashPrefix } from '@web-unitable-crm/api/helper';
// import Edm from '@web-edm/edmIndex';
import { Apps } from '@web-apps/apps';
import { KeyboardModel } from '@web-setting/Keyboard/keyboard';
import IM from '@web-im/im';
import {
  CalenderIcon,
  ContactIcon,
  AppsIcon,
  DiskTabIcon,
  IMIcon,
  MailBoxIcon,
  BigDataIcon,
  IntelliMarketingIcon,
  CustomerIcon,
  BusinessIcon,
  WorktableIcon,
  EnterpriseIcon,
  SiteIcon,
  SystemTaskIcon,
  KnowledgeIcon,
  WaTabIcon,
} from '@web-common/components/UI/Icons/icons';
import { FloatButtonRoot } from '@web-common/components/FloatToolButton';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import { AntdConfig } from '@web-common/components/UI/Config/Config';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { getIsSomeMenuVisbleSelector, getMenuSettingsAsync, getPrivilegeAsync, getVersionAsync } from '@web-common/state/reducer/privilegeReducer';
import { doSharedAccountAsync } from '@web-common/state/reducer/loginReducer';
import { useLocation } from '@reach/router';
import lodashGet from 'lodash/get';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import { useFreeWriteMailErrorHandler } from '@web-mail/components/PaidGuideModal/index';
import { NoviceTaskActions } from '@web-common/state/reducer';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Button } from 'antd';
import { Worktable } from '@/components/Layout/Worktable/workTable';
// 用户中心入口，需要手动分析去掉
// import { HelpCenter } from '@/components/Layout/helpCenter/index';
// import Customer from '../components/Layout/Customer/customerIndex';
import BigData from '@/components/Layout/SceneAggregation/bigData';
import IntelliMarketing from '@/components/Layout/SceneAggregation/intelliMarketing';
import RbacSetting from '@/components/Layout/Rbac/rbac';
import WmEntryNotification from '@/components/UI/WmEntryNotification';
import { EnterpriseSetting } from '@/components/Layout/EnterpriseSetting';
// import Sns from '../components/Layout/SNS/snsIndex';
// import '../styles/global.scss';
// import Config from '../components/Layout/MailConfig/menuIcon';
import { navigateToSchedule } from '@/layouts/Main/util';
import SiriusLayout from '@/layouts';
import UpgradeApp from '@/components/Electron/Upgrade';
import { Notice } from '@/components/UI/Notice/notice';

import { GlobalAdvertNotification } from '@/components/UI/GlobalAdvertNotification/GlobalAdvertNotification';
import { SiriusPageProps } from '@/components/Layout/model';
import { NpsSurvey } from '@/components/Npsmeter';
import SystemTask from '@/components/Layout/TaskCenter/pages/SystemTask';
import NoviceTask from '@/components/Layout/TaskCenter/pages/NoviceTask';
// import NoviceTaskEntry from '@/components/Layout/TaskCenter/components/NoviceTaskEntry';
import { showNoviceTaskCloseTip } from '@/components/Layout/TaskCenter/utils';
import { getTransText } from '@/components/util/translate';
import style from '../styles/pages/index.module.scss';
import WhatsAppChat from '@/components/Layout/WhatsAppChat';
import { getWaimaoTrailEntryHost } from '@web-common/utils/utils';

console.info('---------------------from index page------------------');
// const buildFor = apiHolder.env.forElectron;
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const advertApi = apiHolder.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
const isOfficeDomain = systemApi.getCurrentUser()?.domain === 'office.163.com';

const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const moduleNamePattern = /#(\/?[\w\d_-]+)((?=\?)|($))/;

/**
 * 入口整理为按需加载和按需编译
 * todo
 * 1. 如果该模块不是default导出的，需要手动清除组件和组件的导入
 *  方案：直接使用识别 组件名称的方案。
 *  比如：HelpCenter，需要去除 import { HelpCenter } 语句，把组件使用的区域换成 null
 * 2. 如果是默认导出的需要清除组件的使用
 * 3. 为了防止删除引用之后报错，建议声明这个组件，例如：const IM = () => null
 */

// 懒加载逻辑
// ! 注意：必须要传入这样的参数，直接传入路径会报错！
const lazyLoader = (
  promise: () => Promise<{
    default: React.FC<any>;
  }>,
  props: Record<string, any>
) => {
  const Comp = lazy(promise);
  return (
    /* eslint-disable react/jsx-props-no-spreading */
    <Suspense fallback="loading">
      <Comp {...props} />
    </Suspense>
  );
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

// 应用中心入口
const AppStoreEntry: React.FC<SiriusPageProps> = props => {
  const [shouldShowAppTab, setShouldShowAppTab] = useState<boolean>(false);

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
  useEffect(() => {
    fetchSelectedAppConfig();
    fetchBannerConfig();
  }, []);

  if (!shouldShowAppTab) {
    return null;
  }

  return HOCEntry(Apps)(props);
};

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

const IndexPageWrapper: React.FC<any> = ({ children, visibleUpgradeApp, upgradeInfo, setVisible, activeKey }) => (
  <SiriusLayout.ContainerLayout isLogin={false} activeKey={activeKey}>
    {children}
    {process.env.BUILD_ISELECTRON && visibleUpgradeApp === 2 ? <UpgradeApp upgradeInfo={upgradeInfo} setVisibleUpgradeApp={setVisible} /> : null}
  </SiriusLayout.ContainerLayout>
);

const IMarketEntry = lazyEntry(IntelliMarketing, 'edm');

const IndexPage: React.FC<PageProps> = () => {
  const dispatch = useAppDispatch();
  const [visibleUpgradeApp, setVisibleUpgradeApp] = useState<number>(0);
  // const [contactSyncIframeShow, setContactSyncIframeShow] = useState<boolean>(false);
  const [upgradeInfo, setUpgradeInfo] = useState();
  const [visibleKeyboardModel, setVisibleKeyboardModel] = useState<boolean>(false);

  const version = useAppSelector(state => state.privilegeReducer.version);
  const refVisibleUpgradeApp = useRef(visibleUpgradeApp);
  const refVisibleKeyboardModel = useRef(visibleKeyboardModel);
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  const [edmNotice, setEdmNotice] = useState<ResNotice | null>(null);

  const appDispatch = useAppDispatch();

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
  const [activeKey, setActiveKey] = useState('mailbox');

  useEffect(() => {
    if (!currentHash || !currentHash.length) {
      return;
    }
    const matchedArr = currentHash.match(moduleNamePattern);
    /**
     * crm 使用的是react-router-dom hash路由，path存在多个层级，因此这里判断一下是否是以unitable-crm为前缀的路由
     * 如果是则设置当前激活的tab为 /unitable-crm
     * */
    if (isMatchUnitableCrmHash(currentHash)) {
      setActiveKey(unitableRouteHashPrefix);
      return;
    }
    if (!matchedArr) {
      return;
    }
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
  const visibleWA = process.env.BUILD_ISEDM && useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WHATSAPP_PERSONAL']));
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

    appDispatch(getVersionAsync());
  }, [activeKey]);

  // ---- 这种不是默认导出的 ----
  // 帮助中心入口
  // const renderHelpCenter = () => {
  //   const HelpCenterEntry = HOCEntry(HelpCenter);
  //   return (
  //     <div
  //       style={activeKey === 'helpCenter' ? visibleStyle : hiddenStyle}
  //       name="helpCenter"
  //       tag={getTransText('ZHISHIGUANGCHANG')}
  //       hidden={version === 'WEBSITE'}
  //       icon={KnowledgeIcon}
  //     >
  //       <HelpCenterEntry name="helpCenter" activeKey={activeKey} />
  //     </div>
  //   );
  // };
  // 通知设置
  const renderEnterpriseSetting = () => (
    <div
      style={activeKey === 'enterpriseSetting' ? visibleStyle : hiddenStyle}
      name="enterpriseSetting"
      tag={getIn18Text('QIYESHEZHI')}
      icon={EnterpriseIcon}
      hidden={!visilbeEnterpirseSetting}
    >
      <EnterpriseSetting name="enterpriseSetting" />
    </div>
  );
  // 大数据
  const renderBigData = () => {
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
    return (
      <div
        style={activeKey === 'wmData' ? visibleStyle : hiddenStyle}
        name="wmData"
        tag={getIn18Text('BigData')}
        icon={BigDataIcon}
        hidden={!visibleCustomsData && !visilbeGlobalSearch}
        redPoint
      >
        <BigDataEntry name="wmData" activeKey={activeKey} redPoint active={activeKey === 'wmData'} />
      </div>
    );
  };
  // 站点管理
  const renderSite = () => (
    <div style={activeKey === 'site' ? visibleStyle : hiddenStyle} name="site" tag={getIn18Text('ZHANDIANGUANLI')} icon={SiteIcon} hidden={!visilbeSiteManager}>
      <Site name="site" />
    </div>
  );
  // 工作台
  const renderWorktable = () => {
    const WorktableEntry = lazyEntry(Worktable, 'worktable');
    return (
      <div
        style={activeKey === 'worktable' ? visibleStyle : hiddenStyle}
        name="worktable"
        tag={getIn18Text('GONGZUOTAI')}
        icon={WorktableIcon}
        hidden={!visibleWorktable}
      >
        <WorktableEntry activeKey={activeKey} active={activeKey === 'worktable'} name="worktable" />
      </div>
    );
  };
  // 客户和业务
  const renderUnitableCrm = () => (
    <div style={isMatchUnitableCrmHash(activeKey) ? visibleStyle : hiddenStyle} name={unitableRouteHashPrefix} tag={getIn18Text('KEHUHEYEWUWEB')} icon={BusinessIcon}>
      <UnitableCrm name="unitable-crm" tag={getIn18Text('KEHUHEYEWUWEB')} icon={BusinessIcon} />
    </div>
  );
  // --------
  // ---- 这种事默认导出的 ----
  // 权限设置入口
  const renderRbacSetting = () => {
    console.log('renderRbacSetting');
    return (
      <div
        style={activeKey === 'rbac' ? visibleStyle : hiddenStyle}
        name="rbac"
        tag={getIn18Text('QUANXIAN')}
        // hidden
        hideInTab
        icon={CustomerIcon}
      >
        <RbacSetting name="rbac" />
      </div>
    );
  };
  // 智能营销
  const renderIntelliMarketing = () => {
    console.log('renderIntelliMarketing');
    return (
      <div style={activeKey === 'edm' ? visibleStyle : hiddenStyle} name="edm" tag={getIn18Text('intelliMarketing')} icon={IntelliMarketingIcon} hidden={false}>
        <IMarketEntry name="edm" activeKey={activeKey} />
      </div>
    );
  };
  // 外贸消息通知
  const renderWmEntryNotification = () => <WmEntryNotification />;
  // 灵犀办公公共
  // 邮箱模块
  const renderMailBox = () => {
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
        // 需要改成懒加载吗？
        // return lazyLoader(() => import('@web-mail/mailBox'), {});
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
    return (
      <div style={activeKey === 'mailbox' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon}>
        <MailEntry activeKey={activeKey} name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon} />
      </div>
    );
  };
  // 日历模块
  const renderSchedule = () => {
    const ScheduleEntry: React.FC<SiriusPageProps> = HOCEntry(Schedule);
    return (
      <div style={activeKey === 'schedule' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="schedule" tag={getIn18Text('RILI')} icon={CalenderIcon}>
        <ScheduleEntry activeKey={activeKey} name="schedule" tag={getIn18Text('RILI')} icon={CalenderIcon} />
      </div>
    );
  };
  // 联系人模块
  const renderContact = () => {
    // Contact入口
    const ContactEntry: React.FC<SiriusPageProps> = HOCEntry(Contact);
    return <ContactEntry activeKey={activeKey} name="contact" tag={getIn18Text('TONGXUNLU')} icon={ContactIcon} />;
  };
  // IM 模块
  const renderIM = () => (
    <>
      {visibleIM ? (
        <div style={activeKey === 'message' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon}>
          <IMEntry activeKey={activeKey} name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon} />
        </div>
      ) : null}
    </>
  );
  // disk
  const renderDisk = () => {
    const DiskEntry: React.FC<SiriusPageProps> = HOCEntry(Disk);
    return <DiskEntry name="disk" activeKey={activeKey} tag={getIn18Text('YUNWENDANG')} icon={DiskTabIcon} />;
  };
  // Apps
  const renderApps = () => <>{isOfficeDomain ? <AppStoreEntry activeKey={activeKey} name="apps" tag={getIn18Text('YINGYONGZHONGXIN')} icon={AppsIcon} /> : null}</>;
  // 邮箱设置
  const renderSetting = () => {
    const SettingEntry: React.FC<SiriusPageProps> = HOCEntry(Setting);
    return <SettingEntry activeKey={activeKey} active={activeKey === 'setting'} name="setting" tag={getIn18Text('SHEZHI')} icon={DiskTabIcon} hideInTab />;
  };

  // web相关
  const renderWhatsAppChat = () => {
    const WaEntry: React.FC<SiriusPageProps> = HOCEntry(WhatsAppChat);
    return <>{visibleWA && <WaEntry name="wa" activeKey={activeKey} tag="WA" icon={WaTabIcon} />}</>;
  };
  // 系统任务
  const renderSystemTask = () => (
    <>
      {process.env.BUILD_ISEDM && (
        <div style={activeKey === 'systemTask' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="systemTask" tag="任务中心" icon={SystemTaskIcon} hideInTab>
          <SystemTask name="systemTask" />
        </div>
      )}
    </>
  );
  // 新手任务
  const renderNoviceTask = () => (
    <>
      {process.env.BUILD_ISEDM && (
        <div style={activeKey === 'noviceTask' ? visibleStyle : hiddenStyle} activeKey={activeKey} name="noviceTask" tag="新手任务" icon={SystemTaskIcon} hideInTab>
          <NoviceTask name="noviceTask" />
        </div>
      )}
    </>
  );
  // --------

  const edmEntries = process.env.BUILD_ISEDM
    ? [
        renderUnitableCrm(),
        renderIntelliMarketing(),
        renderWorktable(),
        renderBigData(),
        renderSite(),
        renderEnterpriseSetting(),
        renderRbacSetting(),
        // renderHelpCenter(),
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
              cancelText: '结束',
              okText: '继续完成',
              onCancel: showNoviceTaskCloseTip,
              onOk: () => navigate('#noviceTask?page=noviceTask'),
            });
          } else {
            Modal.success({
              title: `恭喜你完成「${taskName}」！`,
              icon: <i className="icon success-icon" />,
              hideCancel: true,
              okText: '知道了',
            });
          }
        },
      });
      return () => {
        eventApi.unregisterSysEventObserver('NoviceTaskFinished', id);
      };
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      appDispatch(getVersionAsync());
    }
  }, []);

  return (
    <IndexPageWrapper visibleUpgradeApp={visibleUpgradeApp} setVisible={setVisible} upgradeInfo={upgradeInfo} activeKey={activeKey}>
      <MemoizedTinymceTooltip />
      {/* 通用Antd配置 */}
      <AntdConfig />
      {process.env.BUILD_ISEDM && renderWmEntryNotification()}
      <SiriusLayout.MainLayout>
        {/* 内层直接引入模块 */}
        {renderMailBox()}

        {renderWhatsAppChat()}

        {renderSchedule()}

        {renderContact()}

        {renderIM()}

        {renderDisk()}

        {renderApps()}

        {process.env.BUILD_ISEDM ? edmEntries : null}

        {renderSetting()}

        {renderSystemTask()}

        {renderNoviceTask()}
      </SiriusLayout.MainLayout>
      <KeyboardModel
        visible={visibleKeyboardModel}
        onCancel={() => {
          setVisibleKeyboardModel(false);
        }}
      />
      {process.env.BUILD_ISEDM && <Notice notice={edmNotice} />}
      {process.env.BUILD_ISEDM && version !== 'WEBSITE' && <FloatButtonRoot visible={activeKey !== 'wmData'} />}
      {process.env.BUILD_ISEDM && <GlobalAdvertNotification />}
      {/* {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && <NoviceTaskEntry />} */}

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
          <p>您的外贸通已过期， 该功能皙时无法使用。 续费后可以继续正常使用该功能，您可以联系您的服务专员进行续费</p>
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
            你还未购买外贸通，无法使用桌面端，可以访问网页版体验外贸通功能
            <button
              className={style.learnmore}
              onClick={() => {
                window?.open(`${getWaimaoTrailEntryHost()}#wmData?page=globalSearch`);
              }}
            >
              访问网页版外贸通
            </button>
          </p>
        </Modal>
      )}

      {process.env.BUILD_ISEDM && <NpsSurvey />}
    </IndexPageWrapper>
  );
};
export default IndexPage;
console.info('---------------------end index page------------------');
