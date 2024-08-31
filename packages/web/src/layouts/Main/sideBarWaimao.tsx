import React, { CSSProperties, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  DataTrackerApi,
  EventApi,
  inWindow,
  isElectron,
  MailApi,
  NetStorageApi,
  SystemEvent,
  PerformanceApi,
  getIn18Text,
  EdmRoleApi,
  WorktableApi,
  api,
} from 'api';
import { Badge, Dropdown, Popover, Tooltip, message } from 'antd';
import { DragDropContext, DropResult, Droppable, Draggable } from 'react-beautiful-dnd';
import { navigate } from 'gatsby';
import debounce from 'lodash/debounce';
import { DiskTipKeyEnum } from '@web-disk/disk';
import Avatar from '@web-common/components/UI/Avatar/avatar';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { UsageGuide } from '@web-common/components/UsageGuide';
import { DiskActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { ConfigActions, ExpandMenuActions, ReadCountActions } from '@web-common/state/reducer';
import { AvatarList } from '@web-common/components/UI/AvatarList/avatar-list';
import { ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { shallowEqual } from 'react-redux';
import { getIsFreeVersionUser, getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { registerRouterInterceptorDesktop, registerRouterInterceptorDesktopV2 } from 'env_def';
import { ReactComponent as Noti } from '@web-common/images/icons/noti.svg';
import { ReactComponent as Kf } from '@web-common/images/icons/kf.svg';
import { ReactComponent as More } from '@web-common/images/icons/more.svg';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { useLocalStorageState } from 'ahooks';
import { RewardAlreadyGotit } from '@web-common/components/FloatToolButton/const';
import { bus } from '@web-common/utils/bus';
import { WmKfEntry } from '@web-common/components/WmKfEntry/index';
import style from './main.module.scss';
import { PageName, SiriusPageProps, KeyProps } from '@/components/Layout/model';
import { getDefaultOrderFromLocal, getKeyBoardList, navigateToSchedule, recordDragList, saveTabsToLocal, sortByOrder, TAB_STR_SEP } from './util';
import UpdateApp from './updateApp';
import { useTabs } from './tabsToDisplay';
import SideBarTabItem from '@/layouts/Main/sideBarTabItem';

import { ReactComponent as MenuFoldIcon } from '@/images/icons/edm/menu-fold.svg';
import { ReactComponent as MenuExpandIcon } from '@/images/icons/edm/menu-expand.svg';
import { ReactComponent as MenuDownLoadIcon } from '@/images/icons/edm/menu-download.svg';
import { ReactComponent as Setting } from '@/images/icons/sidebar/setting.svg';
import { isMatchCustomerManageRoute, isMatchCustomerPerformanceRoute } from '../../../../web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data';
import NoticeCard from '@/components/Layout/Worktable/noticeCard/NoticeCard';
import { MoreMenu } from '../../../../web-entry-wm/src/layouts/WmMain/moreMenu';
import { useNoticeListData } from '@/components/Layout/Worktable/noticeCard/hooks/useNoticeListData';
import { config } from 'env_def';
import VideoDrawer from '@web-common/components/UI/VideoDrawer';

const systemApi = apiHolder.api.getSystemApi();
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const env = config('profile');

const inElectron = systemApi.isElectron;
const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
const inEdm = process.env.BUILD_ISEDM;
const isClassicEdmWeb = !isElectron() && inEdm; // 外贸的老版本Web端，https://waimao-classic.cowork.netease.com

const trackEventMap: Record<string, string> = {
  worktable: 'client_1_home_page',
  mailbox: 'client_1_email_management',
  wa: 'client_1_personal_WA_enter_point_click',
  wmData: 'client_1_big_data_on_foreign_trade',
  edm: 'client_1_smart_marketing',
  customerManage: 'client_1_customer_management',
  customerPerformance: 'client_1_customer_performance',
  coop: 'client_1_coordinate_office',
  site: 'client_1_brand_build',
  enterpriseSetting: 'client_1_enterprise_setup',
};

type TabListType = 'display' | 'coop' | 'more';

interface RenderTabItemProps {
  index: number;
  tab: SiriusPageProps;
  tabListType: TabListType;
  _unreadCount: { [key in PageName]?: number };
  _activeKey: string;
  _keyboardList: KeyProps[];
  _isNewUser?: boolean;
  isDragDisabled?: boolean;
}

const UN_DRAGGABLE_INDEX = 1000;

const SideTabBar: React.FC<{
  onChange?: (activeKey: string) => void;
  activeKey?: string;
  tabs?: Array<SiriusPageProps>;
  handleJumpOutClick?: (page: string) => void;
}> = ({ onChange, activeKey = '', tabs = [], handleJumpOutClick }) => {
  const v1v2 = useVersionCheck();
  const isWaimaoV2 = process.env.BUILD_ISEDM && v1v2 === 'v2';
  const tabsNameStr = tabs.map(v => v.name).join(TAB_STR_SEP);

  const dispatch = useAppDispatch();
  const unReadCountActions = useActions(ReadCountActions);

  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  const isNewUser = useAppSelector(state => state.diskReducer.isNewUser);
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo, shallowEqual);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const version = useAppSelector(state => state.privilegeReducer.version);
  const visibleEnterpriseSetting = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['ORG_SETTINGS']));
  const { sharedAccount } = useAppSelector(state => state.loginReducer);
  const { localList, mobileList } = useAppSelector(state => state.loginReducer.accountList);
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));

  const coop = useMemo(() => tabs.filter(tab => ['schedule', 'disk', 'contact', 'apps'].includes(tab.name)), [tabsNameStr]);
  const coopStr = coop.map(v => v.name).join('');

  const shareAccountNum = useMemo<number>(() => {
    const isLoginCount = sharedAccount.isSharedAccountLogin ? 1 : 0;
    const sharedAccounts = sharedAccount.sharedAccounts ? sharedAccount.sharedAccounts.filter(s => !s.isCurrentAccount).length : 0;
    return isLoginCount + sharedAccounts;
  }, [sharedAccount.isSharedAccountLogin, sharedAccount.sharedAccounts]);
  const accountCount = localList.filter(i => !i.expired).length + mobileList.length;

  const [block, setBlock] = useState(false);
  const [keyBoardList, setKeyBoardList] = useState<KeyProps[]>([]);
  const [shouldUpdateApp, setShouldUpdateApp] = useState(false);

  const [tabsWithOrder, setTabsWithOrder] = useState<SiriusPageProps[]>(() => getDefaultOrderFromLocal(tabs));
  const tabsWithOrderNameStr = tabsWithOrder.map(v => v.name).join('');

  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);

  const { tabToDisplay, tabInMore } = useTabs(tabsWithOrder, tabBarRef, shareAccountNum + accountCount);
  const tabToDisplayStr = useMemo(() => tabToDisplay.map(v => v.name).join(''), [tabToDisplay]);
  const tabImMoreStr = tabInMore.map(v => v.name).join('');

  const showBlockingMsg = useCallback(() => {
    SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
  }, []);

  const doUpdateMailBoxStat = useCallback(
    debounce(() => mailApi.doUpdateMailBoxStat(), 500, { maxWait: 2000 }),
    []
  );

  const setBlockFn = useCallback((blk: boolean, page?: string): boolean => {
    if (page) {
      console.time('sidebar click ' + page);
      performanceApi.time({
        statKey: 'side_bar_click_time' + (inEdm ? '_inEdm' : ''),
        statSubKey: page,
      });
    }
    if (blk) {
      showBlockingMsg();
      trackApi.track('pc_leftNavigationBarTab', { tabName: page, operate: 'blocking' });
      console.timeEnd('sidebar click ' + page);
      return blk;
    }
    setTimeout(() => {
      if (page === 'mailbox') {
        doUpdateMailBoxStat();
      }
    }, 0);

    // TODO: 临时添加日历tab拦截，考虑后续更优雅的处理方案
    if (page === 'schedule' && navigateToSchedule()) {
      return blk;
    }
    if (onChange && page) {
      onChange(page);
    }
    trackApi.track('pc_leftNavigationBarTab', { tabName: page, operate: 'click' });
    return blk;
  }, []);

  const handleClick = useCallback(
    (page?: string) => () => {
      // 切换模块时关闭视频播放弹窗
      setTimeout(() => {
        dispatch(ConfigActions.closeVideoDrawer());
      }, 50);

      if (page && page.startsWith('jumpOut_') && handleJumpOutClick) {
        const jumpOutTarget = page.split('jumpOut_');
        handleJumpOutClick(jumpOutTarget[1] || '');
        return;
      }
      // 如果把 isWaimaoV2 加入到依赖项，那么后面所有的 useCallback, useMemo 都要加。此处先独立判断
      const isWaimaoV2 = process.env.BUILD_ISEDM && window.localStorage.getItem('v1v2') === 'v2';
      if (isWaimaoV2) {
        let trackName = page || '';
        if (isMatchCustomerManageRoute(page)) {
          trackName = 'customerManage';
        }
        if (isMatchCustomerPerformanceRoute(page)) {
          trackName = 'customerPerformance';
        }
        const trackEventId = trackEventMap[trackName];
        if (trackEventId) {
          trackApi.track(trackEventId, { version: 1 });
        }
      }
      setBlock(blk => setBlockFn(blk, page));
    },
    []
  );

  const handleDoubleClick = useCallback(
    (page?: string, focus?: boolean) => () => {
      if (page !== 'message' || !focus) {
        return;
      }
      eventApi.sendSysEvent({
        eventName: 'messageDoubleClick',
      });
    },
    []
  );

  // 调用接口获取是否是未进入过云文档
  const checkIsNewUser = useCallback(() => {
    diskApi.getNewUserAnnouncement().then(res => {
      dispatch(DiskActions.setIsNewUser(!!res));
      if (res) {
        const announcementId = res.id;
        let firstDocUrl = '';
        try {
          firstDocUrl = JSON.parse(res.content)?.firstDocUrl;
        } catch (e) {
          console.error('checkIsNewUser error', e);
        }
        dispatch(DiskActions.setIsNewUser(!!res));
        dispatch(
          DiskActions.setGuideTipsInfoByKey({
            key: DiskTipKeyEnum.WELCOME_TIP,
            value: {
              ...guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP],
              content: {
                announcementId,
                firstDocUrl,
              },
            },
          })
        );
      }
    });
  }, []);

  const renderTabItem = useCallback((tabProps: RenderTabItemProps) => {
    const { tab, _unreadCount, _activeKey, _isNewUser, _keyboardList, tabListType, index, isDragDisabled = false } = tabProps;
    const inMoreTab = tabListType === 'more';
    const { name, tag, hidden, redPoint } = tab;
    const focus = _activeKey === tab.name;
    const unread = name === 'coop' ? _unreadCount.message : _unreadCount[name];
    const isNew = name === 'disk' && _isNewUser;
    const showTag = !inMoreTab && name === 'jumpOut_acquisition';
    const iconTagText = name === 'jumpOut_acquisition' ? getIn18Text('freeTrail') : '';
    const jumpOutTagStyle = {
      height: '22px',
      lineHeight: '22px',
      left: '-8px',
      top: '-10px',
      padding: '0px 2px',
      transform: 'scale(0.7)',
    };
    const iconTagStyle: CSSProperties = name === 'jumpOut_acquisition' ? jumpOutTagStyle : {};
    const keyboardItem = _keyboardList.find(item => item.id === tab.name);
    const title = tag + (keyboardItem?.show ? ' (' + keyboardItem?.key + ')' : '');
    const realTitle = (
      <>
        <div className={style.sdiBarTipArrow} />
        {title}
      </>
    );
    return (
      <Draggable draggableId={name} index={index} key={name} isDragDisabled={isDragDisabled}>
        {provided => (
          <div
            className={style.sideBarItemContainer}
            ref={provided.innerRef}
            {...provided.dragHandleProps}
            {...provided.draggableProps}
            style={{ ...provided.draggableProps.style }}
          >
            <SideBarTabItem
              tab={tab}
              title={realTitle}
              redPoint={redPoint}
              className={classnames([focus ? style.sideBarTabFocus : '', hidden ? style.sideBarTabHide : ''])}
              active={focus}
              onClick={handleClick(name)}
              onDoubleClick={handleDoubleClick(name, focus)}
              unread={unread}
              showNewTag={isNew || showTag}
              iconTagText={iconTagText}
              iconTagStyle={iconTagStyle}
            />
          </div>
        )}
      </Draggable>
    );
  }, []);

  const TabToDisplayMemo = useMemo(() => {
    const tabList = tabToDisplay.map((tab, index) => {
      const item = renderTabItem({
        index,
        tab,
        tabListType: 'display',
        _unreadCount: unreadCount,
        _activeKey: activeKey,
        _keyboardList: keyBoardList,
        _isNewUser: isNewUser,
      });
      return item;
    });
    return <div>{tabList}</div>;
  }, [tabToDisplayStr, unreadCount, activeKey, keyBoardList.length, isNewUser]);

  const AvatarCompMemo = useMemo(() => {
    if (inElectron() || inEdm) {
      return <Avatar notifyBlocking={setBlock} activeKey={activeKey} />;
    }
    return null;
  }, [activeKey]);

  const AvatarListCompMemo = useMemo(() => {
    if (inElectron()) {
      return <AvatarList isBlock={block} onBlock={showBlockingMsg} />;
    }
    return null;
  }, [block]);

  const UpdateAppCompMemo = useMemo(() => (shouldUpdateApp ? <UpdateApp /> : null), [shouldUpdateApp]);

  const DownloadIconCompMemo = useMemo(() => {
    if (isClassicEdmWeb) {
      const handleDownLoadClientClick = () => {
        window.location.href = 'https://sirius-config.qiye.163.com/api/pub/client/waimao/download';
      };
      const TitleContent = (
        <>
          <div className={style.sdiBarTipArrow} />
          {getIn18Text('XIAZAIKEHUDUAN')}
        </>
      );
      return (
        <Tooltip placement="right" trigger="hover" title={TitleContent} overlayClassName={classnames(style.sideBarTipWrap)}>
          <div className={style.downloadMenuIcon} onClick={handleDownLoadClientClick}>
            <MenuDownLoadIcon />
          </div>
        </Tooltip>
      );
    }
    return null;
  }, []);

  const CoopCompMemo = useMemo(() => {
    if (inEdm && version !== 'WEBSITE') {
      const tabItems = coop.map(tab =>
        renderTabItem({
          index: 100,
          tab,
          tabListType: 'coop',
          _unreadCount: unreadCount,
          _activeKey: activeKey,
          _keyboardList: keyBoardList,
          isDragDisabled: true,
        })
      );
      const content = <div className={style.sideBarDropdown}>{tabItems}</div>;
      return (
        <Draggable draggableId="tabCoop" index={UN_DRAGGABLE_INDEX} isDragDisabled>
          {provided => (
            <Popover placement="rightTop" trigger="click" getPopupContainer={() => document.getElementById('sirius-side-bar-root')!} content={content}>
              <div
                ref={provided.innerRef}
                {...provided.dragHandleProps}
                {...provided.draggableProps}
                className={classnames(style.sideBarTab, style.coop, {
                  [style.siriusIconCoopEnhance]: ['schedule', 'disk', 'contact', 'apps'].includes(activeKey),
                })}
              >
                <>
                  <div className={classnames(style.siriusIconCoop, style.icon, 'sirius-icon-coop')} />
                  <div className={classnames(style.text, 'sirius-icon-coop')}>{getIn18Text('XIETONGBANGONG')}</div>
                </>
              </div>
            </Popover>
          )}
        </Draggable>
      );
    }
    return null;
  }, [coopStr, unreadCount, keyBoardList.length, version, activeKey]);

  const TabInMoreCompMemo = useMemo(() => {
    if (tabInMore.length > 0) {
      // 更多图标高亮
      const isActive = tabInMore.map(m => m.name).includes(activeKey as PageName);
      const tabItems = tabInMore.map((tab, index) =>
        renderTabItem({
          index: tabToDisplay.length + index,
          tab,
          tabListType: 'more',
          _unreadCount: unreadCount,
          _activeKey: activeKey,
          _keyboardList: keyBoardList,
        })
      );
      const content = (
        <Droppable droppableId="moreTab">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={style.sideBarDropdown} style={{ height: tabInMore.length * 64 }}>
              {tabItems}
            </div>
          )}
        </Droppable>
      );

      return (
        <Draggable draggableId="tabMore" index={UN_DRAGGABLE_INDEX} isDragDisabled>
          {provided => (
            <Popover placement="rightTop" trigger="click" getPopupContainer={() => document.getElementById('sirius-side-bar-root')!} content={content}>
              <div
                ref={provided.innerRef}
                {...provided.dragHandleProps}
                {...provided.draggableProps}
                style={{ ...provided.draggableProps.style }}
                className={classnames([
                  style.sideBarTab,
                  style.sideBarTabMore,
                  {
                    [style.sideBarTabMoreEnhance]: isActive,
                  },
                  isDragging.current ? style.isDragging : '',
                ])}
              />
            </Popover>
          )}
        </Draggable>
      );
    }
    return null;
  }, [tabImMoreStr, tabToDisplayStr, unreadCount, keyBoardList.length, isDragging.current, activeKey]);

  const [shouldShowEntry, setShouldShowEntry] = useState<boolean>(false);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      roleApi
        .showKfEntry()
        .then(data => {
          setShouldShowEntry(data?.showHelpEntrance);
        })
        .catch(err => console.log(err));
    }
  }, []);

  const { noticeList, fetchNoticeList } = useNoticeListData();

  useEffect(() => {
    fetchNoticeList();
  }, []);

  const [showTip, setShowTip] = useLocalStorageState(RewardAlreadyGotit, { defaultValue: false });

  const listener = () => {
    setShowTip(true);
  };

  const notilistener = () => {
    fetchUnreadCount();
  };

  useEffect(() => {
    bus.on('closeReward', listener);
    bus.on('closeTask', listener);
    bus.on('notiUpdate', notilistener);

    return () => {
      bus.off('closeReward', listener);
      bus.off('closeTask', listener);
      bus.off('notiUpdate', notilistener);
    };
  }, []);

  const onVisibleChange = (visible: boolean, type: string) => {
    if (visible) {
      if (type === 'more') {
        trackApi.track('waimao_more', { action: 'show' });
      } else if (type === 'notice') {
        trackApi.track('waimao_notification', { action: 'click' });
      }
    }
  };

  const [unreadCountWorkbench, setUnreadCountWorkbench] = useState(0);

  let isprod = (env as string).includes('prod') || (env as string).includes('pre');

  useEffect(() => {
    fetchUnreadCount();

    let timer = setInterval(async () => {
      let res = await fetchUnreadCount();
    }, (isprod ? 3600 : 20) * 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      let { unreadCount } = await worktableApi.getUnreadCount();
      setUnreadCountWorkbench(unreadCount);
    } catch (error) {
      console.log(error);
    }
  };

  const tools = isFreeVersionUser
    ? []
    : [
        {
          label: '更多',
          icon: <More />,
          visible: version !== 'WEBSITE',
          component: (
            <Popover placement="rightBottom" trigger="click" content={<MoreMenu />} onVisibleChange={visible => onVisibleChange(visible, 'more')}>
              <Tooltip
                visible={showTip}
                placement="right"
                overlayClassName={style.more}
                trigger="hover"
                title={
                  <div className={style.tip}>
                    <span
                      style={{
                        display: 'block',
                      }}
                    >
                      可点击此处继续查看已收起功能
                    </span>
                    <div
                      style={{
                        textAlign: 'right',
                        marginTop: '12px',
                      }}
                    >
                      <span
                        className={style.tipOk}
                        onClick={e => {
                          setShowTip(false);
                          e.stopPropagation();
                        }}
                      >
                        {getIn18Text('ZHIDAOLE')}
                      </span>
                    </div>
                  </div>
                }
              >
                <div className={style.toolsIcon}>
                  <More />
                </div>
              </Tooltip>
            </Popover>
          ),
          click: () => {},
        },
        {
          label: '在线客服',
          icon: (
            <WmKfEntry>
              <Kf />
            </WmKfEntry>
          ),
          visible: version !== 'WEBSITE' && shouldShowEntry,
          component: (
            <WmKfEntry className={style.toolsIcon}>
              <Kf />
            </WmKfEntry>
          ),
          click: () => {},
        },
        {
          label: '通知',
          icon: <Noti />,
          visible: version !== 'WEBSITE',
          component: (
            <Popover
              style={{
                transform: 'translateX(22px)',
                width: '329px',
              }}
              placement="rightBottom"
              overlayClassName={style.overlay}
              trigger="click"
              onVisibleChange={visible => {
                onVisibleChange(visible, 'notice');
                bus.emit('notiUpdate');
              }}
              destroyTooltipOnHide={true}
              content={
                <NoticeCard
                  hasDrag={false}
                  className={style.noti}
                  style={{
                    width: '329px',
                    background: 'white',
                    boxShadow: '0px 4px 30px rgba(78, 86, 130, 0.2)',
                  }}
                />
              }
            >
              {/* <div className={classnames(style.toolsIcon)}>
            <div className={classnames(style.toolsIcon, noticeList?.length > 0 && style.dotShow)}>
            <Noti />
          </div> */}
              <div className={classnames(style.toolsIcon)}>
                <Badge count={unreadCountWorkbench} overflowCount={99} size="small" offset={[6, 0]}>
                  <Noti />
                </Badge>
              </div>
            </Popover>
          ),
          click: () => {},
        },
      ];

  const EnterpriseSettingMemo = useMemo(() => {
    if (inEdm) {
      if (visibleEnterpriseSetting && version !== 'WEBSITE') {
        return (
          <div
            className={style.expandMenuIcon}
            onClick={() => {
              // 如果把 isWaimaoV2 加入到依赖项，那么后面所有的 useCallback, useMemo 都要加。此处先独立判断
              const isWaimaoV2 = process.env.BUILD_ISEDM && window.localStorage.getItem('v1v2') === 'v2';
              if (isWaimaoV2) trackApi.track('client_1_enterprise_setup', { version: 1 });
              navigate('#enterpriseSetting');
            }}
          >
            <Setting />
          </div>
        );
      }
      return (
        <div className={style.expandMenuIcon} onClick={() => dispatch(ExpandMenuActions.setIsFold(!isFoldMenu))}>
          {isFoldMenu ? <MenuFoldIcon /> : <MenuExpandIcon />}
        </div>
      );
    }
    return null;
  }, [visibleEnterpriseSetting, isFoldMenu, version]);

  const ToolSetMemo = useMemo(() => {
    if (inEdm) {
      return (
        <div className={classnames([style.toolSets])}>
          <UsageGuide className={classnames('sirius-no-drag', style.newUsageGuide, style.usageGuide)} placement="rightBottom" />
          {tools
            .filter(t => t.visible)
            .map(i =>
              i.component ? (
                i.component
              ) : (
                <div className={style.toolsIcon} onClick={i.click}>
                  {i.icon}
                </div>
              )
            )}
        </div>
      );
    }
    return null;
  }, [version, shouldShowEntry, noticeList, showTip, unreadCountWorkbench]);

  useEffect(() => {
    const orderNames = tabsWithOrder.map(i => i.name);
    const sortedTabs = sortByOrder(tabs, orderNames);

    let needReorder = false;
    if (sortedTabs.length !== orderNames.length) {
      needReorder = true;
    } else {
      const isDff = sortedTabs.some((tab, index) => {
        const item = tabsWithOrder[index];
        return tab.name !== item.name || tab.tag !== item.tag || !!tab.hidden !== !!item.hidden;
      });
      if (isDff) {
        needReorder = true;
      }
    }

    // 在改变高亮时，无需重新渲染
    if (needReorder) {
      setTabsWithOrder(sortedTabs);
    }
  }, [tabs]);

  useEffect(() => {
    // 在这里调用获取当前未读总数的接口，并分发
    const lsId = eventApi.registerSysEventObserver('notificationChange', {
      func: (ev: SystemEvent) => {
        if (ev.eventStrData === 'mail') {
          unReadCountActions.updateMailboxUnreadCount(ev.eventData);
        }
        if (ev.eventStrData === 'im') {
          unReadCountActions.updateIMUnreadCount(ev.eventData);
        }
      },
    });
    if (systemApi.getCurrentUser()) {
      checkIsNewUser();
    }
    if (inWindow()) {
      setKeyBoardList(getKeyBoardList());
    }
    return () => {
      eventApi.unregisterSysEventObserver('notificationChange', lsId);
    };
  }, []);

  useEffect(() => {
    if (inEdm) {
      if (v1v2 === 'v2') {
        registerRouterInterceptorDesktopV2();
      } else {
        registerRouterInterceptorDesktop();
      }
    }
    const id = eventApi.registerSysEventObserver('globalSearchSubscribeUpdate', {
      func: event => {
        const { eventData = {} } = event;
        const { type: subType, subCount = 0 } = eventData as { type: 'globalSearch-redPoint' | 'globalSearch-collect-redPoint'; subCount?: number };
        unReadCountActions.updateWmdataUnreadCount(subCount);
        subType === 'globalSearch-collect-redPoint' && unReadCountActions.updateCustomStarUnreadCount(subCount);
        subType === 'globalSearch-redPoint' && unReadCountActions.updateGloablSearchUnreadCount(subCount);
      },
    });
    const waReddot = eventApi.registerSysEventObserver('whatsappSubscribeUpdate', {
      func: event => {
        if (event.eventData.type === 'reddot') {
          unReadCountActions.updateWAReddot(event.eventData.reddot);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('globalSearchSubscribeUpdate', id);
      eventApi.unregisterSysEventObserver('whatsappSubscribeUpdate', waReddot);
    };
  }, [v1v2]);

  useEffect(() => {
    let eventId: number;
    const EVENT_NAME = 'shouldUpdateAppChanged';
    if (window && window.electronLib) {
      eventId = eventApi.registerSysEventObserver(EVENT_NAME, {
        func: ev => {
          setShouldUpdateApp(!!ev.eventData);
        },
      });
    }
    return () => {
      if (eventId) {
        eventApi.unregisterSysEventObserver(EVENT_NAME, eventId);
      }
    };
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      isDragging.current = false;
      const { source, destination } = result;
      // 拖拽到列表外时
      if (!destination) {
        return;
      }
      const fromIndex = source.index;
      const toIndex = destination.index;
      if (fromIndex === toIndex) {
        return;
      }
      const newList = recordDragList<SiriusPageProps>(tabsWithOrder, fromIndex, toIndex);
      setTabsWithOrder(newList);
      saveTabsToLocal(newList.map(v => v.name));
      trackApi.track(
        'pc_marketing_workbench_left_bar',
        newList.filter(tab => !tab.hidden)
      );
    },
    [tabsWithOrderNameStr]
  );

  return (
    <div id="sirius-side-bar-root-container" className={classnames(style.sideBarTicky, inEdm ? style.sideBarTickyWaimao : '', inEdm ? 'waimao-sidebar' : '')}>
      <div id="sirius-side-bar-root" className={classnames(style.sideBar, inEdm ? style.sideBarWaimao : '')}>
        <div style={{ width: '100%', height: inElectron() && isMac ? ELECTRON_TITLE_FIX_HEIGHT : 0 }} />
        {AvatarCompMemo}
        {UpdateAppCompMemo}
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={() => {
            isDragging.current = true;
          }}
        >
          <Droppable droppableId="display">
            {provided => (
              <div
                ref={ref => {
                  provided.innerRef(ref);
                  tabBarRef.current = ref;
                }}
                {...provided.droppableProps}
                style={{ flex: 1 }}
              >
                {TabToDisplayMemo}
                {!isWaimaoV2 && CoopCompMemo}
                {TabInMoreCompMemo}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {AvatarListCompMemo}
      </div>
      {process.env.BUILD_ISEDM ? (
        <div className={style.sideBarFooter}>
          {DownloadIconCompMemo}
          {version === 'WEBSITE' && EnterpriseSettingMemo}
          {version !== 'WEBSITE' && ToolSetMemo}
        </div>
      ) : null}
      {/* 放在这里，没有放在 index 里面，是因为层级关系 */}
      {process.env.BUILD_ISEDM && <VideoDrawer getContainer={() => document.getElementById('sirius-side-bar-root-container')!} />}
    </div>
  );
};

export default SideTabBar;
