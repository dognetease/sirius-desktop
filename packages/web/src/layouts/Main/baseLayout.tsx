import { navigate } from 'gatsby';
import classNames from 'classnames';
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from '@reach/router';
import lodashGet from 'lodash/get';
import {
  api,
  apiHolder,
  EventApi,
  SystemEvent,
  apis,
  DataTrackerApi,
  AutoReplyApi,
  AutoReplyModel,
  DataStoreApi,
  util,
  LoginApi,
  getIn18Text,
  getOs,
  AccountApi,
  TaskCenterApi,
} from 'api';
import { message, Spin, Modal } from 'antd';
import { GlobalActions, useAppDispatch, AutoReplyActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import {
  JumpOutTradeAcquisitionIcon,
  JumpOutMailMarketingIcon,
  JumpOutWaimaoWebsiteIcon,
  JumpOutMediaMarketingIcon,
  JumpOutCustomBigDataIcon,
} from '@web-common/components/UI/Icons/icons';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getJumpOutRedirectUrl, getWaimaoTrailJumpUrl, isWebmail } from '@web-common/utils/utils';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import LayoutPerf from '@web-common/hooks/LayoutPerf';
import { ActiveKeys } from '@web-common/state/reducer/globalReducer';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import globalKeyInit from '@web-setting/Keyboard/globalKeyInit';
import { isMatchUnitableCrmHash } from '@web-unitable-crm/api/helper';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { L2cCrmPageType, L2cCrmPageTypeSet, L2cCrmSidebarMenuExtra } from '@web-common/conf/waimao/l2c-crm-constant';
import { GlobalAdSpace } from '@web-apps/pages/Home/GlobalAdSpace';
import JumpOutModal from '@/components/Layout/JumpOutModal';
import SideTabBar from './sideBarWaimao';
import { PageName, SiriusPageProps } from '@/components/Layout/model';
import style from './main.module.scss';
import { getTabsFromLocal, TAB_STR_SEP } from '@/layouts/Main/util';
import { isMatchCustomerManageRoute, isMatchCustomerPerformanceRoute } from '../../../../web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data';
import { showNewbieTask } from '@web-common/state/reducer/notificationReducer';
import GlobalNotification from '@web-common/components/GlobalNotification';
import GlassIcon from '@web-mail/components/CustomerMail/NewGuideForAside/icons/GlassIcon';
import ModuleNotifications from '@web-common/components/ModuleNotification';
import NewbieTask, { LastClosedDate as NewbieTaskLastClosedDate } from '@web-common/components/NewbieTask';
import { NoviceTaskActions } from '@web-common/state/reducer';
import image1 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/1.png';
import image2 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/2.png';

const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const autoReplyApi = apiHolder.api.requireLogicalApi(apis.autoReplyApiImpl) as AutoReplyApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;
const systemApi = api.getSystemApi();
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const setScreenCaptureShortcut = apiHolder.api.getSystemApi().setScreenCaptureShortcut;
const setScreenCaptureAccess = apiHolder.api.getSystemApi().setScreenCaptureAccess; // getScreenCapture
const isElectron = systemApi.isElectron();
const isLingxi = process.env.BUILD_ISLINGXI;
const isLingxiWeb = isLingxi && !isElectron;
const isMac = getOs() === 'mac';

const TITLE_PREFIX = process.env.BUILD_ISEDM ? getIn18Text('WANGYIWAIMAOTONG') : getIn18Text('WANGYILINGXIBAN');
if (isElectron) {
  window.electronLib.ipcChannelManage.receiveIpcMain({
    channel: 'capture-screen-message',
    listener: ({ type, text }: { type: string; text: string }) => {
      if (type === 'error') message.error(text);
      if (type === 'succ') message.success(text);
    },
  });
  const storeShortcut = dataStoreApi.getSync('captureScreenShortcut').data;
  const initShortcutDefault = isMac ? `${util.getCommonTxt()} Shift A` : 'Alt A';
  let initShortcut = storeShortcut || initShortcutDefault;
  if (initShortcut === 'noncapture') initShortcut = '';
  setScreenCaptureShortcut({ oldShortcut: '', newShortcut: util.storeShortcutTransform(initShortcut) });

  let accessShow = false;
  window.electronLib.ipcChannelManage.receiveIpcMain({
    channel: 'get-screen-access',
    listener: () => {
      if (accessShow) return;
      accessShow = true;
      SiriusModal.confirmError({
        title: '网易灵犀办公需要截图权限',
        content: '请前往“系统偏好设置-安全性与隐私-屏幕录制”勾选网易灵犀办公，开启截图权限',
        centered: true,
        onOk() {
          console.log('OK');
          setScreenCaptureAccess();
          accessShow = false;
        },
        okText: '前往设置',
        onCancel() {
          accessShow = false;
        },
      });
    },
  });
}

const EXTRA_TABS = [
  {
    activeKey: 'jumpOut_acquisition',
    icon: JumpOutTradeAcquisitionIcon,
    tag: getIn18Text('WAIMAOHUOKE'),
    name: 'jumpOut_acquisition' as PageName,
  },
  {
    activeKey: 'jumpOut_customsBigData',
    icon: JumpOutCustomBigDataIcon,
    tag: getIn18Text('HAIGUANSHUJU'),
    name: 'jumpOut_customsBigData' as PageName,
  },
  {
    activeKey: 'jumpOut_mailMarketing',
    icon: JumpOutMailMarketingIcon,
    tag: getIn18Text('YOUJIANYINGXIAO'),
    name: 'jumpOut_mailMarketing' as PageName,
  },
  {
    activeKey: 'jumpOut_website',
    icon: JumpOutWaimaoWebsiteIcon,
    tag: getIn18Text('WAIMAOJIANZHAN'),
    name: 'jumpOut_website' as PageName,
  },
  {
    activeKey: 'jumpOut_mediaMarketing',
    icon: JumpOutMediaMarketingIcon,
    tag: getIn18Text('SHEMEIYIGNXIAO'),
    name: 'jumpOut_mediaMarketing' as PageName,
  },
];

const BaseMainLayout: React.FC<
  PropsWithChildren<{
    l2cCrmSidebarMenuExtra?: React.MutableRefObject<L2cCrmSidebarMenuExtra>;
  }>
> = ({ children, l2cCrmSidebarMenuExtra }) => {
  const { hash } = useLocation();
  const dispatch = useAppDispatch();

  const { updateAutoReplyDetail } = useActions(AutoReplyActions);
  const { updateNoviceState } = useActions(NoviceTaskActions);

  const activeKey = useRef<undefined | string>('');
  const hashQueryMap = useRef<Map<string, string>>(new Map());
  const switchPageClickRef = useRef(false);

  const [unread, setUnread] = useState<number | null>(null); // 未读数
  const [company, setCompany] = useState<string>(''); // 公司名称
  const [tabProps, setTabProps] = useState<SiriusPageProps[]>([]);

  const version = useAppSelector(state => state.privilegeReducer.version);
  const [visibleJumpOut, setVisibleJumpOut] = useState(false);
  const [jumpOutModalMemoVisible, setJumpOutModalMemoVisible] = useState(false);

  const childrenList = useMemo<React.ReactElement<SiriusPageProps>[]>(() => {
    const list = (React.Children.toArray(children) as React.ReactElement<SiriusPageProps>[]) || [];
    return list.filter(e => e && React.isValidElement(e));
  }, [children]);
  const v1v2 = useVersionCheck();

  // const noHiddenChildrenList = useMemo(() => childrenList.filter(v => !lodashGet(v, 'props.hidden', false)), [childrenList.length]);

  const pageKeysStr = useMemo(() => {
    if (!childrenList.length) {
      return '';
    }
    return childrenList.map(item => item.props.name).join(TAB_STR_SEP);
  }, [childrenList]);

  const currentTabTitle = useMemo(() => {
    const checkedTab = tabProps.find(item => item.name === activeKey.current);
    return checkedTab ? (checkedTab.tag as string) : '';
  }, [tabProps.length, activeKey.current]);

  const title = useMemo(() => {
    if (isWebmail()) {
      const unreadTitle = unread != null ? `（${unread > 9999 ? '9999+' : unread}封未读）` : '';
      return `${unreadTitle}${company ? `${company}-` : ''}${currentTabTitle}`;
    }
    return `${TITLE_PREFIX}${currentTabTitle ? `-${currentTabTitle}` : ''}`;
  }, [unread, company, currentTabTitle]);

  // 页面切换
  const switchPage = useCallback(
    (page: string, forceSwitch?: boolean, useHashJump = false) => {
      if (page !== activeKey.current || forceSwitch) {
        activeKey.current = page;
        if (v1v2 === 'v2' && isMatchCustomerPerformanceRoute(page)) {
          activeKey.current = L2cCrmPageType.customerPerformance;
        } else if (v1v2 === 'v2' && isMatchCustomerManageRoute(page)) {
          activeKey.current = L2cCrmPageType.customerManagement;
        } else if (isMatchUnitableCrmHash(page)) {
          activeKey.current = L2cCrmPageType.customerAndBusiness;
        }
        const hashQuery = hashQueryMap.current.get(page);
        const query = hashQuery ? `?${hashQuery}` : '';
        if (useHashJump) {
          if (l2cCrmSidebarMenuExtra && L2cCrmPageTypeSet.has(page as any)) {
            window.location.hash = `#/unitable-crm${l2cCrmSidebarMenuExtra.current[page as any].defaultPath}`;
          } else {
            window.location.hash = `#${page + query}`;
          }
        } else {
          navigate(`#${page + query}`);
        }
        dispatch(GlobalActions.setActiveKey(page as ActiveKeys));
      }
    },
    [v1v2]
  );

  const onSwitchPageClick = useCallback((page: string) => {
    switchPageClickRef.current = true;
    const isUniPage = isMatchUnitableCrmHash(page) || L2cCrmPageTypeSet.has(page);
    switchPage(page, false, isUniPage);
  }, []);

  const onSetPageClickTick = useCallback(() => {
    switchPageClickRef.current = false;
  }, []);

  const errorBoundaryReset = useCallback(() => {
    util.reload();
    return false;
  }, []);

  // 从 localStorage 中获取已经排过序的 Tab 中的第一位
  const getSortedSidebar = useCallback((pageKeysArr: string[]): string => {
    if (pageKeysArr.length === 0) {
      return '';
    }
    const tabsFromLocal = getTabsFromLocal();
    const firstTab = tabsFromLocal[0];
    return firstTab || '';
  }, []);

  useEffect(() => {
    globalKeyInit();
  }, []);

  // 初始化一些乱七八糟的状态和逻辑
  useEffect(() => {
    const spinWrap = (
      <div className={`${style.siriusSpinWrap} baselayout-sirius-spin-wrap`}>
        <i className={`${style.siriusSpinIcon} sirius-spin-icon`} />
        <span className={'spin-label ' + style.siriusSpinLabel}>{getIn18Text('JIAZAIZHONG..')}</span>
      </div>
    );
    Spin.setDefaultIndicator(spinWrap);

    autoReplyApi.getMailRulesByAutoReply().then((autoReply: AutoReplyModel) => {
      updateAutoReplyDetail(autoReply);
    });

    const userInfo = systemApi.getCurrentUser();
    if (userInfo != null && userInfo.company !== company) {
      setCompany(userInfo.company);
    }
  }, []);

  // 全局发信状态提示
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('writePageDataExchange', {
      func: (ev: SystemEvent) => {
        const { eventStrData, eventData = {} } = ev;
        if (eventStrData === 'start') {
          const { writeType, id } = eventData;
          let content = '';
          if (['forward', 'forwardAsAttach'].includes(writeType)) {
            content = getIn18Text('ZHUANFAYOUJIANSHENG');
          } else if (['reply', 'replyAll', 'replyAllWithAttach', 'replyWithAttach'].includes(writeType)) {
            content = getIn18Text('HUIFUYOUJIANSHENG');
          }
          if (content && id) {
            message.loading({ content, duration: 35, key: ev.eventData.id });
          }
        } else if (eventStrData === 'writeTabCreated') {
          if (eventData.entry?.id) {
            setTimeout(() => {
              message.destroy(eventData.entry.id);
            }, 0);
          }
        } else if (eventStrData === 'sending') {
          message.loading({
            content: getIn18Text('XINJIANFASONGZHONG'),
            duration: 35,
            key: ev.eventData,
          });
        } else if (eventStrData === 'sendSucceed') {
          const sendRevokeRes = dataStoreApi.getSync('sendRevoke');
          const sendRevokeOpen = sendRevokeRes.suc && sendRevokeRes.data === 'ON';
          const contentStr = sendRevokeOpen ? 'XINJIANFASONGCHENGKECHEXIAO' : 'XINJIANFASONGCHENG';
          message.success({
            content: getIn18Text(contentStr),
            duration: 2.5,
            key: ev.eventData,
          });
        } else if (eventStrData === 'scheduleDateSucceed') {
          message.success({
            content: getIn18Text('DINGSHIRENWUSHE'),
            duration: 2.5,
            key: ev.eventData,
          });
        } else if (ev.eventStrData === 'sendFailed') {
          setTimeout(() => {
            message.destroy();
          }, 0);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('writePageDataExchange', eid);
    };
  }, []);

  // child name变化不会导致originTabs相应变化，目前有问题
  // 设置 Tabs
  useEffect(() => {
    if (!childrenList.length) {
      return;
    }
    // 从 childrenList 获取 tabs
    const originTabs: SiriusPageProps[] = (React.Children.toArray(children) as React.ReactElement<SiriusPageProps>[])
      .filter(child => !child.props.hideInTab)
      // 不要把 children & style 带过来
      .map(({ props }) => ({
        name: props.name,
        tag: props.tag,
        icon: props.icon,
        active: props.active,
        reshow: props.reshow,
        hidden: props.hidden,
        hideInTab: props.hideInTab,
        redPoint: props.redPoint,
      }));
    // 根据服务端配置获取更新后的 tabs
    // insertTabFromServer(originTabs, version).then(newTabs => {
    //   setTabProps(newTabs);
    // });
    if (visibleJumpOut) {
      setTabProps(prevTabs => {
        // 这里，所有的EXTRA_TABS作为一个整体插入的，没考虑细分的情况，因为产品经理说了，不需要。。。
        const exist = prevTabs.some(v => v.name === EXTRA_TABS[0].name);
        if (!exist) {
          trackApi.track('pc_leftNavigationBarTab_waimaoShow');
          return [...prevTabs, ...EXTRA_TABS];
        }
        return prevTabs;
      });
    } else if (version === 'WEBSITE') {
      const websiteTabProps = originTabs.filter(tab => ['message', 'mailbox', 'site', L2cCrmPageType.customerAndBusiness].includes(tab.name));
      setTabProps(websiteTabProps);
    } else {
      setTabProps(originTabs);
    }
  }, [React.Children.toArray(children).filter(item => React.isValidElement(item) && !lodashGet(item, 'props.hidden', false)).length, version, visibleJumpOut]);

  // 监听 HASH 变化，完成的功能
  // 1 如果加载的是根路径，那么跳转到一个指定的页面，这个页面如果在本地有记录，取本地记录，没有的话，取外部传入的 children 的第一个
  // 2 如果加载的不是根路径，那么直接跳转
  useEffect(() => {
    const pageKeys = pageKeysStr.split(TAB_STR_SEP);
    const [pageWithHash, query] = hash.split('?');
    const [, page] = pageWithHash.split('#');
    const isUniPage = isMatchUnitableCrmHash(page);
    // 记录query参数
    if (query) {
      hashQueryMap.current.set(page, query);
    }
    // 如果是crm的页面，更新最新的query
    if (isUniPage) {
      hashQueryMap.current.set(page, query);
    }
    if ((page === 'edm' || page === 'intelliMarketing') && !query) {
      hashQueryMap.current.set(page, query);
    }
    // 客户和业务模块
    // 不匹配的路径（刨除了客户与业务模块）
    const emptyPage = !pageKeys.includes(page) && !isUniPage;
    // 根路径或者是不匹配的路径
    if (!page || emptyPage) {
      const defaultPage = getSortedSidebar(pageKeys) || pageKeys[0];
      if (defaultPage) {
        switchPage(defaultPage, emptyPage, false);
        trackApi.track('pc_leftNavigationBarTab', { tabName: defaultPage, operate: 'default' });
      }
    } else {
      switchPage(page, false, isUniPage);
    }
  }, [hash, pageKeysStr]);

  useEffect(() => {
    if (isLingxiWeb) {
      loginApi
        .getEntranceVisibleConfig()
        .then(visibleConfig => {
          if (visibleConfig.showTab) {
            setVisibleJumpOut(true);
          }
          if (visibleConfig.showPopup) {
            setJumpOutModalMemoVisible(true);
            trackApi.track('pc_waimaoAttracts_show');
          }
        })
        .catch(e => {
          console.error('getEntranceVisibleConfig error', e);
        });
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      loginApi.reportEdmLogin();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [isNewAccount, { totalCount, finishedCount }] = await Promise.all([accountApi.doGetAccountIsNewAccount(), taskCenterApi.getNoviceTasks()]);
      updateNoviceState(isNewAccount);
      const lastCloseDate = localStorage.getItem(NewbieTaskLastClosedDate);
      if (finishedCount < totalCount && isNewAccount && (!lastCloseDate || Date.now() - new Date(lastCloseDate).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        dispatch(showNewbieTask());
      }
    })();
  }, []);

  useEventObserver('notificationChange', {
    name: 'navbarNotificationChangeOb',
    func: ev => {
      if (ev.eventStrData === 'mail') {
        setUnread(ev.eventData);
      }
    },
  });

  useEventObserver('updateUserInfo', {
    name: 'changeTitle',
    func: ev => {
      if (ev.eventStrData) {
        const { company: companyName } = ev.eventData;
        setCompany(companyName ?? '');
      }
    },
  });

  // 跳转到外贸体验版的点击事件，不走原有逻辑，直接跳走
  const onHandleJumpOutClick = useCallback((page: string) => {
    trackApi.track('pc_leftNavigationBarTab_waimaoClick');
    loginApi
      .getLoginCode()
      .then(code => {
        if (code) {
          const redirectUrl = getJumpOutRedirectUrl(systemApi.getCurrentUser()?.sessionId, page);
          const jumpUrl = getWaimaoTrailJumpUrl(code, redirectUrl);
          window.location.assign(jumpUrl);
        } else {
          SiriusMessage.warn({ content: getIn18Text('TIAOZHUANSHIBAI，QINGSHAO') }).then();
        }
      })
      .catch(e => {
        SiriusMessage.warn({ content: typeof e === 'string' ? e : getIn18Text('TIAOZHUANSHIBAI，QINGSHAO') }).then();
      });
  }, []);

  const SdeTabBarCompMemo = useMemo(() => {
    if (tabProps.length === 0) {
      return null;
    }
    return <SideTabBar activeKey={activeKey.current} onChange={onSwitchPageClick} tabs={tabProps} handleJumpOutClick={onHandleJumpOutClick} />;
  }, [tabProps.length, activeKey.current]);

  const onJumpOutCancel = () => {
    setJumpOutModalMemoVisible(false);
  };

  const onJumpOutConfirm = () => {
    setJumpOutModalMemoVisible(false);
    onHandleJumpOutClick('globalSearch');
  };

  const JumpOutModalMemo = useMemo(() => {
    if (isLingxiWeb) {
      return <JumpOutModal visible={jumpOutModalMemoVisible} onJumpOutCancel={onJumpOutCancel} onJumpOutConfirm={onJumpOutConfirm} />;
    }
    return null;
  }, [jumpOutModalMemoVisible, setJumpOutModalMemoVisible]);

  return (
    <>
      <div className={classNames(style.mainLayoutContainer, activeKey.current === 'message' ? style.forbidSelect : {})}>
        {/* 避免影响其他内容，仅在消息tab内设置禁止选中 */}
        <Helmet>
          <meta charSet="utf-8" />
          <title>{title}</title>
        </Helmet>
        {SdeTabBarCompMemo}
        <GlobalAdSpace />
        <NewbieTask />
        <GlobalNotification />
        <ModuleNotifications />
        <ErrorBoundary name="baseLayout" onReset={errorBoundaryReset}>
          <LayoutPerf activeKey={activeKey.current} tickStart={switchPageClickRef.current} setClickTick={onSetPageClickTick}>
            {children}
          </LayoutPerf>
        </ErrorBoundary>
        {JumpOutModalMemo}
      </div>
    </>
  );
};
export default BaseMainLayout;
