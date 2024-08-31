import { navigate, PageProps } from 'gatsby';
import classNames from 'classnames';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { api, apiHolder, EventApi, SystemEvent, apis, DataTrackerApi, AutoReplyApi, AutoReplyModel, DataStoreApi, inWindow, conf } from 'api';
import { message, Spin, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
import { shallowEqual } from 'react-redux';
import { GlobalActions, useAppDispatch, AutoReplyActions, useActions } from '@web-common/state/createStore';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { ActiveKeys } from '@web-common/state/reducer/globalReducer';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import style from './main.module.scss';
import SideTabBarWaimao from './sideBarWaimao';
import SideTabBar from './sideBar';
// import { apis, DataTrackerApi } from 'api/src';
import { getIn18Text } from 'api';
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const autoReplyApi = apiHolder.api.requireLogicalApi(apis.autoReplyApiImpl) as AutoReplyApi;
const systemApi = api.getSystemApi();
const hashRegex = /^#([a-zA-Z]+)\??([\w-]+)?$/;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const inElectron = apiHolder.api.getSystemApi().isElectron;
const MainLayout: React.FC<{
  location: PageProps['location'];
}> = ({ children, location }) => {
  const { hash } = location;
  const exec = hashRegex.exec(hash);
  const hashPageName = exec && exec[1] ? exec[1] : '';
  const idPart = exec && exec[2] ? exec[2] : '';
  const [activeKey, setActiveKey] = useState<string>();
  const [activedKeys, setActivedKeys] = useState<Map<string, number>>(new Map());
  const [title, setTitle] = useState<string>(''); // 页面名称
  const [company, setCompany] = useState<string>(''); // 公司名称
  const firstLoad = useRef(true);
  const hashQueryMap = useRef<Map<string, string>>(new Map());
  const STORAGE_KEY = 'SIDEBAR_ORDER';
  const tabProps = React.useMemo(
    () =>
      React.Children.toArray(children)
        .filter(child => React.isValidElement(child) && !child.props.hideInTab)
        ?.map(e => (e as ReactElement).props),
    [children]
  );
  const pageKeys = React.useMemo(() => React.Children.toArray(children).map(e => (React.isValidElement(e) ? e.props.name : null)), [children]);
  const dispatch = useAppDispatch();
  // 未读数
  // const { mailbox } = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  const [unread, setUnread] = useState<number | null>(null);
  const { updateAutoReplyDetail } = useActions(AutoReplyActions);
  const switchPage = React.useCallback(
    (page: string, forceNav: boolean = true) => {
      firstLoad.current = false;
      const hashQuery = hashQueryMap.current.get(page);
      let query = '';
      if (hashQuery) {
        query += `?${hashQuery}`;
      }
      setActiveKey(currentKey => {
        if (page !== currentKey) {
          forceNav && navigate(`#${page + query}`);
          dispatch(GlobalActions.setActiveKey(page as ActiveKeys));
        }
        return page;
      });
    },
    [setActiveKey]
  );
  // 监听全局消息
  // useEffect(() => {
  //   const func = (ev: SystemEvent) => {
  //     if (ev && ev.eventData) {
  //       const data = ev.eventData as PopUpMessageInfo;
  //       if (data.popupType && data.popupType === 'window') {
  //         if (data.popupLevel && data.popupLevel in Alert) {
  //           const conf = {
  //             title: data.content ? data.title : undefined,
  //             content: data.content || data.title,
  //             onOk: (e) => {
  //               if (data.confirmCallback) {
  //                 data.confirmCallback(e);
  //               }
  //               eventApi.confirmEvent(ev);
  //               al.destroy();
  //             },
  //           }, al = Alert[data.popupLevel](conf);
  //         }
  //       } else if (data.popupType && data.popupType === 'toast') {
  //         // if(data.popupType && data.popupType==="toast"){
  //         if (data.popupLevel && data.popupLevel in Toast) {
  //           Toast[data.popupLevel]({
  //             content: data.title + (data.content ? (' - ' + data.content) : ''),
  //             duration: 3,
  //             onClose: () => {
  //               eventApi.confirmEvent(ev);
  //             },
  //           });
  //         }
  //       }
  //       // }
  //     }
  //   };
  //   const id = eventApi.registerSysEventObserver('error', {
  //     func,
  //     name: "mainLayoutErrorOb"
  //   });
  //   return () => {
  //     eventApi.unregisterSysEventObserver('error', id);
  //   };
  // }, []);
  // hash匹配不上时 默认定位到首页
  // 第一次进入页面是config的时候 跳回首页
  useEffect(() => {
    const [pageWithHash, query] = hash.split('?');
    const [, page] = pageWithHash.split('#');
    const newHashQM = new Map(hashQueryMap.current);
    newHashQM.set(page, query);
    hashQueryMap.current = newHashQM;
    if (!pageKeys.includes(page) || (page === 'config' && firstLoad.current === true)) {
      let defaultBar = pageKeys[0];
      // 默认获取排序后的Sidebar的第一个 begin
      try {
        const { data } = dataStoreApi.getSync(STORAGE_KEY);
        if (data) {
          const orderedTabs = JSON.parse(data);
          const firtTab = orderedTabs[0];
          if (pageKeys.includes(firtTab)) {
            defaultBar = firtTab;
          }
        }
      } catch (e) {
        console.warn(getIn18Text('mainL'), e);
      }
      // -----默认获取排序后的Sidebar的第一个 end---- //
      switchPage(defaultBar);
      trackApi.track('pc_leftNavigationBarTab', { tabName: defaultBar, operate: 'default' });
      return;
    }
    if (pageKeys.includes(page)) {
      switchPage(page, firstLoad.current);
    }
  }, [hash, pageKeys]);
  // 一些事件触发
  useEffect(() => {
    if (idPart && idPart.length > 0) {
      // eventApi.sendSysEvent({
      //   eventName: 'initPage',
      //   // eventLevel: '',
      //   // eventType: '',
      //   eventData: {
      //     hashPageName,
      //     idPart,
      //   } as PageInitData,
      //   eventSeq: 0,
      // });
    }
  }, [hashPageName, idPart]);
  // 激活过的页面放入Map维护
  useEffect(() => {
    if (!activeKey) {
      return;
    }
    setActivedKeys(prev => {
      if (prev.has(activeKey)) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(activeKey, 1);
      return newMap;
    });
  }, [activeKey]);
  // 全局发信状态提示
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('writePageDataExchange', {
      func: (ev: SystemEvent) => {
        if (ev.eventStrData === 'start') {
          // eslint-disable-next-line no-nested-ternary
          const content =
            ['forward', 'forwardAsAttach'].indexOf(ev.eventData?.writeType) !== -1
              ? getIn18Text('ZHUANFAYOUJIANSHENG')
              : ['reply', 'replyAll', 'replyAllWithAttach', 'replyWithAttach'].indexOf(ev.eventData?.writeType) !== -1
              ? getIn18Text('HUIFUYOUJIANSHENG')
              : '';
          content && ev.eventData?.id && message.loading({ content, duration: 35, key: ev.eventData.id });
        } else if (ev.eventStrData === 'writeTabCreated') {
          ev.eventData?.entry?.id && message.destroy(ev.eventData.entry.id);
        } else if (ev.eventStrData === 'sending') {
          message.loading({ content: getIn18Text('XINJIANFASONGZHONG'), duration: 35, key: ev.eventData });
        } else if (ev.eventStrData === 'sendSucceed') {
          message.success({ content: getIn18Text('XINJIANFASONGCHENG'), duration: 2.5, key: ev.eventData });
        } else if (ev.eventStrData === 'scheduleDateSucceed') {
          message.success({ content: getIn18Text('DINGSHIRENWUSHE'), duration: 2.5, key: ev.eventData });
        } else if (ev.eventStrData === 'sendFailed') {
          message.destroy();
          // 不让toast弹窗 和 modal弹窗同时出现
          // 案例 通栏模式 或 web 模式下 邮箱被拉黑，发不了邮件会同事存在 modal弹窗和toast提示
          // 不过有可能存在 没有modal弹窗的情况吗？？
          // message.error({ content: getIn18Text("XINJIANFASONGSHI"), duration: 1.5, key: ev.eventData });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('writePageDataExchange', eid);
    };
  }, []);
  useEffect(() => {
    const spinWrap = (
      <div className={style.siriusSpinWrap}>
        <i className={style.siriusSpinIcon} />
        <span className={'spin-label ' + style.siriusSpinLabel}>{getIn18Text('JIAZAIZHONG..')}</span>
      </div>
    );
    Spin.setDefaultIndicator(spinWrap);
  }, []);
  const isWebmail = inWindow() && conf('profile') ? conf('profile').toString().includes('webmail') : false;
  useEffect(() => {
    autoReplyApi.getMailRulesByAutoReply().then((autoReply: AutoReplyModel) => {
      updateAutoReplyDetail(autoReply);
    });
  }, []);
  const currentTabTitle = tabProps.reduce((prev, curv) => {
    if (curv.name === activeKey) {
      return curv.tag;
    }
    return prev;
  }, '');
  useEventObserver('notificationChange', {
    name: 'navbarNotificationChangeOb',
    func: ev => {
      if (ev.eventStrData) {
        if (ev.eventStrData === 'mail') {
          // ev.eventData
          setUnread(ev.eventData);
        }
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
  useEffect(() => {
    if (isWebmail) {
      const userInfo = systemApi.getCurrentUser();
      if (userInfo != null && userInfo.company !== company) {
        setCompany(userInfo.company);
      }
      const unreadTitle = unread != null ? `（${unread > 9999 ? '9999+' : unread}封未读）` : '';
      setTitle(`${unreadTitle}${company ? `${company}-` : ''}${currentTabTitle}`);
    } else {
      setTitle(`网易灵犀办公${currentTabTitle ? `-${currentTabTitle}` : ''}`);
    }
  }, [currentTabTitle, company, unread]);
  return (
    <div className={classNames(style.mainLayoutContainer, activeKey === 'message' ? style.forbidSelect : {})}>
      {/* 避免影响其他内容，仅在消息tab内设置禁止选中 */}
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </Helmet>
      {systemApi.inEdm() ? (
        <SideTabBarWaimao activeKey={activeKey} onChange={switchPage} tabs={tabProps} />
      ) : (
        <SideTabBar activeKey={activeKey} onChange={switchPage} tabs={tabProps} />
      )}
      <ErrorBoundary name="mainLayout">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && activedKeys.has(child.props.name)) {
            const { name } = child.props;
            return (
              <div
                className={classNames('main-content', name === 'mailbox' ? style.overflowContent : {})}
                key={name}
                style={{ display: activeKey === name ? 'flex' : 'none', flex: 1 }}
              >
                {React.cloneElement(child, {
                  active: activeKey === name,
                  reshow: activedKeys.get(name) === 1,
                  idPart,
                  ...child.props,
                })}
              </div>
            );
          }
          return null;
        })}
      </ErrorBoundary>
    </div>
  );
};
const MailLayoutLocale: React.FC<{
  location: PageProps['location'];
}> = ({ location, children }) => (
  <ConfigProvider locale={zhCN}>
    <MainLayout location={location}>{children}</MainLayout>
  </ConfigProvider>
);
export default MailLayoutLocale;
