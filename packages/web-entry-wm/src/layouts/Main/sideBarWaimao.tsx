import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  AppDescParmas,
  conf,
  DataStoreApi,
  DataTrackerApi,
  EventApi,
  inWindow,
  MailApi,
  NetStorageApi,
  SystemApi,
  SystemEvent,
  UpgradeAppApi,
  util,
} from 'api';
import { Popover, Tooltip } from 'antd';
// import { navigate } from 'gatsby';
import debounce from 'lodash/debounce';
import { DiskTipKeyEnum } from '@web-disk/disk';
import Avatar from '@web-common/components/UI/Avatar/avatar';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { DiskActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { ExpandMenuActions, ReadCountActions } from '@web-common/state/reducer';
import { AvatarList } from '@web-common/components/UI/AvatarList/avatar-list';
import { ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { shallowEqual } from 'react-redux';
import style from './main.module.scss';
import { PageName, SiriusPageProps, KeyProps } from '../../components/Layout/model';
import { navigateToSchedule } from './util';
import UpdateApp from './updateApp';
import { useTabs } from './tabsToDisplay';
import { ReactComponent as MenuFoldIcon } from '@web/images/icons/edm/menu-fold.svg';
import { ReactComponent as MenuExpandIcon } from '@web/images/icons/edm/menu-expand.svg';

const systemApi = apiHolder.api.getSystemApi();
const inElectron = systemApi.isElectron;
const stage = conf('stage');
const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
// const visibleAvatarList = inElectron() || stage === 'local';
const visibleAvatarList = false;
const sideBarStyle = inElectron() && stage !== 'prod' ? { background: stage === 'local' ? '#802ec7' : '#569fa7' } : {};
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
// const imApi: NIMApi = apiHolder.api.requireLogicalApi(apis.imApiImpl) as unknown as NIMApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const sysApi: SystemApi = apiHolder.api.getSystemApi();
console.log('stage', stage, inElectron(), isMac, visibleAvatarList);
// 创建一个定时，处理mouseLeave不触发的问题
let timer: any = null;
const preparedTabs: Map<string, number> = new Map<string, number>();

const STORAGE_KEY = 'SIDEBAR_ORDER';
const DEFAULT_ORDER = [
  'mailbox',
  'edm',
  'customer',
  'customs',
  'customsData',
  'globalSearch',
  'sns',
  'worktable',
  'enterpriseSetting',
  'message',
  'schedule',
  'disk',
  'contact',
];
const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as UpgradeAppApi;

export function sortByOrder(tabs: SiriusPageProps[], order: string[]) {
  const mapIndex: Record<string, number> = {};

  order.forEach((key, index) => {
    mapIndex[key] = index;
  });
  const copy = [...tabs].sort((a, b) => {
    const i = mapIndex[a.name];
    const j = mapIndex[b.name];
    if (i === undefined && j === undefined) {
      return 0;
    }
    if (i !== undefined && j === undefined) {
      return -1;
    }
    if (i === undefined && j !== undefined) {
      return 1;
    }
    return i - j;
  });
  return copy;
}

let isFirstRun = true;

const SideTabBar: React.FC<{
  onChange?: (activeKey: string) => void;
  activeKey?: string;
  tabs?: Array<SiriusPageProps>;
}> = ({ onChange, activeKey = '', tabs = [] }) => {
  // const keyMapToAction = {
  //     "mailbox": "mail_clear",
  //     "message": "im_clear"
  // };
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  const isNewUser = useAppSelector(state => state.diskReducer.isNewUser);
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo, shallowEqual);
  const unReadCountActions = useActions(ReadCountActions);
  const [block, setBlock] = useState(false);
  const [keyBoardList, setKeyBoardList] = useState<KeyProps[]>([]);
  const [hoverKey, setHoverKey] = useState<PageName | undefined>();
  const [tooltip, setTooltip] = useState<string>('');
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const [tabsWithOrder, setTabsWithOrder] = useState(() => {
    let order: string[] = DEFAULT_ORDER;
    try {
      const { data } = dataStoreApi.getSync(STORAGE_KEY);
      if (data) {
        order = JSON.parse(data);
      }
    } catch (e) {
      console.warn('moveTab', 'init failed', e);
    }
    const copy = sortByOrder(tabs, Array.isArray(order) ? order : DEFAULT_ORDER);
    return copy;
  });
  const tabsOrderRef = useRef(tabsWithOrder);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const { localList, mobileList } = useAppSelector(state => state.loginReducer.accountList);
  const accountCount = localList.filter(i => !i.expired).length + mobileList.length;
  const { tabToDisplay, tabInMore } = useTabs(tabsOrderRef.current, tabBarRef, accountCount);

  useEffect(() => {
    const order = tabsWithOrder.map(i => i.name);
    const sortedTabs = sortByOrder(tabs, order);
    const needReorder =
      sortedTabs.length !== tabsWithOrder.length ||
      sortedTabs.some((tab, index) => {
        const item = tabsWithOrder[index];
        if (tab.name !== item.name || tab.tag !== item.tag || Boolean(tab.hidden) !== Boolean(item.hidden)) {
          return true;
        }
        return false;
      });
    // 在改变高亮时，无需重新渲染
    if (needReorder) {
      setTabsWithOrder(sortedTabs);
      console.log('activeTabChanged', tabs);
    }
  }, [tabs]);

  const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  const showBlockingMsg = () => {
    SiriusMessage.warn({ content: '请切换至其他账号或添加新账号后使用' }).then();
  };

  const handleClick = (key?: string) => () => {
    setBlock(blk => {
      if (blk) {
        showBlockingMsg();
        trackApi.track('pc_leftNavigationBarTab', { tabName: key, operate: 'blocking' });
        return blk;
      }
      setTimeout(() => {
        if (key) {
          if (key === 'mailbox') {
            mailApi.doUpdateMailBoxStat();
          }
          const count = preparedTabs.get(key) || 0;
          if (count < 2) {
            if (key === 'mailbox') {
              // mailApi.doUpdateMailBoxStat();
            } else if (key === 'message') {
              // imApi.doUpdateUnreadCount();
            } else if (key === 'schedule') {
              sysApi.prepareWindow('scheduleOpPage').then();
              // setTimeout(() => {
              //   sysApi.prepareWindow('schedule').then();
              // }, 1500);
            } else if (key === 'disk') {
              // sysApi.prepareWindow('resources').then();
            }
            preparedTabs.set(key, count + 1);
          }
        }
      }, 500);
      // TODO: 临时添加日历tab拦截，考虑后续更优雅的处理方案
      if (key === 'schedule' && navigateToSchedule()) {
        return blk;
      }
      if (onChange && key) {
        onChange(key);
      }
      eventApi.sendSysEvent({
        eventName: 'settingShow',
        eventData: {
          type: '',
          action: 'hide',
          activeKey: key,
        },
      });
      trackApi.track('pc_leftNavigationBarTab', { tabName: key, operate: 'click' });
      return blk;
    });
  };

  const handleDoubleClick = (key?: string, focus?: boolean) => () => {
    if (key !== 'message' || !focus) {
      return;
    }
    eventApi.sendSysEvent({
      eventName: 'messageDoubleClick',
    });
  };

  const handleMouseEnter = debounce((key: PageName) => {
    clearTimeout(timer);
    setTooltip(key);
    setHoverKey(key);
  }, 200);
  const handleMouseLeave = debounce(() => {
    setTooltip('');
    setHoverKey(undefined);
    clearTimeout(timer);
    timer = setTimeout(() => {
      setHoverKey(undefined);
      setTooltip('');
    }, 2000);
  }, 200);
  // 调用接口获取是否是未进入过云文档
  const checkIsNewUser = () => {
    diskApi.getNewUserAnnouncement().then(res => {
      dispatch(DiskActions.setIsNewUser(!!res));
      if (res) {
        const announcementId = res.id;
        let firstDocUrl = '';
        try {
          firstDocUrl = JSON.parse(res.content)?.firstDocUrl;
          // eslint-disable-next-line no-empty
        } catch (e) {}
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
  };
  // const pushApi: PushHandleApi = apiHolder.api.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
  useEffect(() => {
    // 在这里调用获取当前未读总数的接口，并分发
    // 例如
    const lsId = eventApi.registerSysEventObserver('notificationChange', {
      func: (ev: SystemEvent) => {
        if (ev.eventStrData) {
          if (ev.eventStrData === 'mail') {
            unReadCountActions.updateMailboxUnreadCount(ev.eventData);
          }
          if (ev.eventStrData === 'im') {
            unReadCountActions.updateIMUnreadCount(ev.eventData);
          }
        }
      },
    });
    systemApi.getCurrentUser() && checkIsNewUser();
    if (inWindow()) {
      const command = util.getCommonTxt(' ');
      const separator = '';
      setKeyBoardList([
        {
          id: 'setting',
          name: '设置',
          key: command + separator + '0',
          show: inElectron(),
        },
        {
          id: 'mailbox',
          name: '邮箱',
          key: command + separator + '1',
          // show: inElectron()
          show: true,
        },
        {
          id: 'message',
          name: '消息',
          key: command + separator + '2',
          show: inElectron(),
        },
        {
          id: 'schedule',
          name: '日历',
          key: command + separator + '3',
          show: inElectron(),
        },
        {
          id: 'disk',
          name: '“云文档”',
          key: command + separator + '4',
          show: inElectron(),
        },
        {
          id: 'contact',
          name: '“通讯录”',
          key: command + separator + '5',
          show: inElectron(),
        },
        {
          id: 'edm',
          name: '营销',
          key: command + separator + '6',
          show: inElectron(),
        },
        {
          id: 'customer',
          name: '客户',
          key: command + separator + '7',
          show: inElectron(),
        },
      ]);
    }
    return () => {
      eventApi.unregisterSysEventObserver('notificationChange', lsId);
    };
  }, []);
  // 监听路由变化全局事件
  // useEffect(() => {
  //   const eid = eventApi.registerSysEventObserver('routeChange', e => {
  //     const {
  //       eventData: { name, url, state },
  //       eventStrData,
  //     } = e;
  //     if (!eventStrData) {
  //       onChange && name && onChange(name);
  //     } else if (eventStrData === 'gatsbyStateNav') {
  //       navigate(url, { state });
  //     } else if (eventStrData === 'gatsbyNav') {
  //       navigate(url);
  //     }
  //   });
  //   return () => {
  //     eventApi.unregisterSysEventObserver('routeChange', eid);
  //   };
  // }, []);
  const blockFunc = (flag: boolean) => {
    setBlock(flag);
  };

  const handleMoveTab = useCallback((id: string, hoverId: string) => {
    // console.log('moveTab', id, hoverId);
    setTabsWithOrder(prev => {
      const copy = [...prev];
      const dragIndex = copy.findIndex(i => i.name === id);
      const hoverIndex = copy.findIndex(i => i.name === hoverId);
      if (dragIndex > -1 && hoverIndex > -1) {
        copy.splice(dragIndex, 1);
        copy.splice(hoverIndex, 0, prev[dragIndex]);
      }
      return copy;
    });
  }, []);

  const handleMoveEnd = useCallback(() => {
    const data = tabsOrderRef.current.map(i => i.name);
    dataStoreApi.put(STORAGE_KEY, JSON.stringify(data), {
      noneUserRelated: false,
    });
    trackApi.track(
      'pc_marketing_workbench_left_bar',
      tabsOrderRef.current.filter(tab => !tab.hidden)
    );
  }, [tabsOrderRef]);

  useEffect(() => {
    tabsOrderRef.current = tabsWithOrder;
  }, [tabsWithOrder]);

  const renderTabItem = useCallback(
    (
      tab: SiriusPageProps,
      unreadCount: { [key in PageName]?: number },
      activeKey: string,
      hoverKey: string | undefined,
      keyboardItems: KeyProps[],
      showTooltip: boolean
    ) => {
      const { name, tag, hidden } = tab;
      const focus = activeKey === tab.name;
      const hover = hoverKey === tab.name;
      const unread = unreadCount[name];
      const isNew = name === 'disk' && isNewUser;
      const keyboardItem = keyboardItems.find(item => item.id === tab.name);
      const title = tag + (keyboardItem?.show ? ' (' + keyboardItem?.key + ')' : '');
      const realTitle = (
        <>
          <div className={style.sdiBarTipArrow} />
          {title}
        </>
      );
      return (
        <SideBarTabItem
          key={name}
          tab={tab}
          title={realTitle}
          className={classnames(
            {
              [style.sideBarTabFocus]: focus,
              [style.sideBarTabHover]: hover,
            },
            hidden && [style.sideBarTabHide]
          )}
          active={focus}
          hover={hover}
          onClick={handleClick(name)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick(name, focus)}
          unread={unread}
          showNewTag={isNew}
          showTooltip={showTooltip}
          onMove={handleMoveTab}
          onMoveEnd={handleMoveEnd}
        />
      );
    },
    []
  );

  const [shouldUpdateApp, setShouldUpdateApp] = useState<boolean>(false);

  useEffect(() => {
    if (!window || !window.electronLib) {
      setShouldUpdateApp(false);
      return () => {};
    }
    const EVENT_NAME = 'shouldUpdateAppChanged';
    const eventId = eventApi.registerSysEventObserver(EVENT_NAME, {
      func: () => {
        setShouldUpdateApp(true);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver(EVENT_NAME, eventId);
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={style.sideBarTicky}>
        <div className={classnames(style.sideBar, style.sideBarWaimao)} style={sideBarStyle} id="sirius-side-bar-root">
          <div style={{ width: '100%', height: inElectron() && isMac ? ELECTRON_TITLE_FIX_HEIGHT : 0 }} />
          <Avatar notifyBlocking={blockFunc} activeKey={activeKey} />
          {shouldUpdateApp && <UpdateApp />}
          <div style={{ flex: 1 }} ref={tabBarRef}>
            {tabToDisplay.map(tab => renderTabItem(tab, unreadCount, activeKey, hoverKey, keyBoardList, tab.name === tooltip))}
            {tabInMore.length > 0 && (
              <Popover
                placement="rightTop"
                getPopupContainer={() => document.getElementById('sirius-side-bar-root')!}
                content={() => (
                  <div className={style.sideBarDropdown}>
                    {tabInMore.map(tab => renderTabItem(tab, unreadCount, activeKey, hoverKey, keyBoardList, tab.name === tooltip))}
                  </div>
                )}
              >
                <div className={classnames(style.sideBarTab, style.sideBarTabMore)} />
              </Popover>
            )}
          </div>
          {systemApi.isElectron() && <AvatarList isBlock={block} onBlock={showBlockingMsg} />}
        </div>
        <div className={style.sideBarFooter}>
          <div className={style.expandMenuIcon} onClick={() => dispatch(ExpandMenuActions.setIsFold(!isFoldMenu))}>
            {isFoldMenu ? <MenuFoldIcon /> : <MenuExpandIcon />}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
export default SideTabBar;

export interface SideBarTabItemProps {
  tab: SiriusPageProps;
  title: JSX.Element;
  unread?: number;
  active?: boolean;
  hover?: boolean;
  className?: string;
  showNewTag?: boolean;
  showTooltip?: boolean;
  onClick?: (name: PageName) => void;
  onMouseEnter?: (name: PageName, title: string) => void;
  onMouseLeave?: (name: PageName) => void;
  onDoubleClick?: (name: PageName, focus: boolean) => void;
  onMove?: (dragId: string, hoverId: string) => void;
  onMoveEnd?: () => void;
}

const SideBarTabItem: React.FC<SideBarTabItemProps> = ({ tab, unread, className, active, hover, showNewTag, showTooltip, ...props }) => {
  const { name, tag, icon: Icon } = tab;
  const title = tag as string;
  const realTitle = (
    <>
      <div className={style.sdiBarTipArrow} />
      {title}
    </>
  );
  const handleClick = useCallback(() => {
    if (!active) {
      props.onClick && props.onClick(name);
    }
  }, [active, name]);
  const handelMouseEnter = useCallback(() => {
    props.onMouseEnter && props.onMouseEnter(name, title);
  }, [name, title]);
  const handleMouseLeave = useCallback(() => {
    props.onMouseLeave && props.onMouseLeave(name);
  }, [name]);
  const handleDoubleClick = useCallback(() => {
    if (active) {
      props.onDoubleClick && props.onDoubleClick(name, active);
    }
  }, [active, name]);

  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: 'SidebarTabItem',
    hover(item: { id: string }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.id;
      const hoverIndex = name;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      props.onMove && props.onMove(dragIndex, hoverIndex);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'SidebarTabItem',
    item: () => ({ id: name }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end() {
      props.onMoveEnd && props.onMoveEnd();
    },
  });

  drag(drop(ref));
  return (
    <Tooltip key={name} title={realTitle} visible={showTooltip} overlayClassName={style.sideBarTipWrap} placement="right">
      <div
        ref={ref}
        className={classnames([style.sideBarTab], className)}
        style={{ opacity: isDragging ? 0 : 1 }}
        onClick={handleClick}
        onMouseEnter={handelMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        key={name}
      >
        {Icon && (
          <div className={style.iconWrapper}>
            <Icon enhance={active || hover} />
            {showNewTag ? (
              <span className={style.iconTag}>
                <span className={style.text}>new</span>
              </span>
            ) : (
              unread !== undefined &&
              unread > 0 && (
                <span className={style.iconTag}>
                  <span className={style.text}>{unread < 1000 ? unread : '···'}</span>
                </span>
              )
            )}
          </div>
        )}
        {Icon && <div className={style.sideBarTabLabel}>{tag}</div>}
      </div>
    </Tooltip>
  );
};
