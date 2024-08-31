import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  conf,
  DataStoreApi,
  DataTrackerApi,
  EventApi,
  inWindow,
  MailApi,
  NetStorageApi,
  SystemApi,
  SystemEvent,
  util,
  UpgradeAppApi,
  AppDescParmas,
} from 'api';
import { Tooltip } from 'antd';
// import { navigate } from 'gatsby';
import debounce from 'lodash/debounce';
import { DiskTipKeyEnum } from '@web-disk/disk';
import Avatar from '@web-common/components/UI/Avatar/avatar';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { DiskActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { ReadCountActions } from '@web-common/state/reducer';
import { AvatarList } from '@web-common/components/UI/AvatarList/avatar-list';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { WelcomeModal } from '@web-common/components/UI/welcome_guide/welcome_guide';
import { ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { shallowEqual } from 'react-redux';
import style from './main.module.scss';
import { PageName, SiriusPageProps, KeyProps } from '../../components/Layout/model';
import { navigateToSchedule } from './util';
import UpdateApp from './updateApp';
// import {  } from 'api/src';
// import  from 'api/dist/impl/api_system/system_impl';
// import { DataTrackerApi } from 'api/src';
// import MailConfig from '../../components/Layout/MailConfig/configPage';
import { getIn18Text } from 'api';
// const keyEventMapToDispatchAction = {
//   'mail': UpdateModuleUnread.UPDATE_MAILBOX_UNREAD,
//   'im': UpdateModuleUnread.UPDATE_IM_UNREAD,
// };
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
// const SIDE_BAR_MAX_ITEM = 5;
const STORAGE_KEY = 'SIDEBAR_ORDER';
const DEFAULT_ORDER = ['mailbox', 'edm', 'customer', 'worktable', 'message'];
const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as UpgradeAppApi;
export interface SideBarTabItemProps {
  tab: SiriusPageProps;
  // eslint-disable-next-line no-undef
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
  const handleMouseEnter = useCallback(() => {
    if (!active) {
      props.onMouseEnter && props.onMouseEnter(name, title);
    }
  }, [active, name, title]);
  const handleMouseLeave = useCallback(() => {
    if (!active) {
      props.onMouseLeave && props.onMouseLeave(name);
    }
  }, [active, name]);
  const handleDoubleClick = useCallback(() => {
    if (active) {
      props.onDoubleClick && props.onDoubleClick(name, true);
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
        style={{ opacity: isDragging ? 0 : 1 }}
        className={classnames([style.sideBarTab], className)}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
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
  const avatarRemind = useAppSelector(state => state.hollowOutGuideReducer.avatarRemind.isShow);
  const unReadCountActions = useActions(ReadCountActions);
  const [block, setBlock] = useState(false);
  const [keyBoardList, setKeyBoardList] = useState<KeyProps[]>([]);
  const [hoverKey, setHoverKey] = useState<PageName | undefined>();
  const [tooltip, setTooltip] = useState<string>('');
  const [tabsWithOrder, setTabsWithOrder] = useState(() => {
    let order: string[] = DEFAULT_ORDER;
    try {
      const { data } = dataStoreApi.getSync(STORAGE_KEY);
      if (data) {
        order = JSON.parse(data);
      }
    } catch (e) {
      console.log('moveTab', 'init failed', e);
    }
    const copy = sortByOrder(tabs, Array.isArray(order) ? order : DEFAULT_ORDER);
    console.log('moveTab', 'init finish', tabs, copy);
    return copy;
  });
  const tabsOrderRef = useRef(tabsWithOrder);
  useEffect(() => {
    const order = tabsWithOrder.map(i => i.name);
    setTabsWithOrder(sortByOrder(tabs, order));
  }, [tabs]);
  const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  const showBlockingMsg = () => {
    SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
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
  const handleMouseEnter = debounce((key: PageName, name: string) => {
    clearTimeout(timer);
    setTooltip(name);
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
          name: getIn18Text('SHEZHI'),
          key: command + separator + '0',
          show: inElectron(),
        },
        {
          id: 'mailbox',
          name: getIn18Text('YOUXIANG'),
          key: command + separator + '1',
          // show: inElectron()
          show: true,
        },
        {
          id: 'message',
          name: getIn18Text('XIAOXI'),
          key: command + separator + '2',
          show: inElectron(),
        },
        {
          id: 'schedule',
          name: getIn18Text('RILI'),
          key: command + separator + '3',
          show: inElectron(),
        },
        {
          id: 'disk',
          name: getIn18Text('\u201CYUNWENDANG\u201D'),
          key: command + separator + '4',
          show: inElectron(),
        },
        {
          id: 'contact',
          name: getIn18Text('\u201CTONGXUNLU\u201D'),
          key: command + separator + '5',
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
    // bug 这里被缓存住了
    // const data = tabsWithOrder.map(i => i.name);
    // console.log('moveTab', 'saveOrder', data);
    // dataStoreApi.put(STORAGE_KEY, JSON.stringify(data), {
    //   noneUserRelated: false
    // });
    const data = tabsOrderRef.current.map(i => i.name);
    console.log('moveTab', 'tabsChanged', data);
    dataStoreApi.put(STORAGE_KEY, JSON.stringify(data), {
      noneUserRelated: false,
    });
    trackApi.track(
      'pc_marketing_workbench_left_bar',
      tabsOrderRef.current.filter(tab => !tab.hidden)
    );
  }, [tabsOrderRef]);
  useEffect(() => {
    // const data = tabsWithOrder.map(i => i.name);
    // console.log('moveTab', 'tabsChanged', data);
    // dataStoreApi.put(STORAGE_KEY, JSON.stringify(data), {
    //   noneUserRelated: false
    // });
    tabsOrderRef.current = tabsWithOrder;
  }, [tabsWithOrder]);
  const renderTabItem = useCallback(
    (
      tab: SiriusPageProps,
      _unreadCount: {
        [key in PageName]?: number;
      },
      _activeKey: string,
      _hoverKey: string | undefined,
      keyboardItems: KeyProps[],
      showTooltip: boolean
      // eslint-disable-next-line max-params
    ) => {
      const { name, tag, hidden } = tab;
      const focus = _activeKey === tab.name;
      const hover = _hoverKey === tab.name;
      const unread = _unreadCount[name];
      const isNew = name === 'disk' && isNewUser;
      const keyboardItem = keyBoardList.find(item => item.id === tab.name);
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
  // let count = 0;
  // const idx = tabsWithOrder.findIndex(item => {
  //   if (!item.hidden) {
  //     count++;
  //   }
  //   if (count === SIDE_BAR_MAX_ITEM) {
  //     return true;
  //   }
  //   return false;
  // });
  // let tabToShow: Array<SiriusPageProps>;
  // let tabInMore: Array<SiriusPageProps> = [];
  // if (idx > -1 && idx < tabsWithOrder.length - 1) {
  //   // 出现更多
  //   tabToShow = tabsWithOrder.slice(0, SIDE_BAR_MAX_ITEM);
  //   tabInMore = tabsWithOrder.slice(SIDE_BAR_MAX_ITEM);
  //   // 若全是隐藏tab，不需要出现更多
  //   tabInMore = tabsWithOrder.some(tab => !tab.hidden) ? tabInMore : [];
  // } else {
  //   tabToShow = tabsWithOrder;
  // }
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
        <div className={classnames(style.sideBar, { [style.sideBarHeight]: inElectron() })} style={sideBarStyle}>
          <div style={{ width: '100%', height: inElectron() && isMac ? ELECTRON_TITLE_FIX_HEIGHT : 0 }} />
          <HollowOutGuide
            guideId="sideBarAvatarGuideHasShowed"
            title={getIn18Text('XINZENGTONGLANSHI')}
            intro={getIn18Text('ANXUSHEZHIYOU')}
            borderRadius={26}
            padding={[-18, 6, -34, 6]}
          >
            <Avatar notifyBlocking={blockFunc} activeKey={activeKey} />
            <span hidden={!avatarRemind} className={style.avatarRemind} style={{ top: inElectron() && isMac ? '87px' : '55px' }} />
          </HollowOutGuide>
          {/* 从旧版进入，欢迎页modal */}
          <WelcomeModal />
          {shouldUpdateApp && <UpdateApp />}
          {tabsWithOrder.map(tab => renderTabItem(tab, unreadCount, activeKey, hoverKey, keyBoardList, tab.name === tooltip))}
          {systemApi.isElectron() && <AvatarList isBlock={block} onBlock={showBlockingMsg} />}
        </div>
      </div>
    </DndProvider>
  );
};
export default SideTabBar;
