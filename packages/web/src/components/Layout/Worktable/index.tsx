import React, { useEffect, useState } from 'react';
import { Responsive as ResponsiveLayout, Layout, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { SiriusPageProps } from '@/components/Layout/model';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { api, apiHolder, DataStoreApi, SystemApi, User, WorktableApi } from 'api';
import styles from './index.module.scss';
import './worktable-global.scss';
import { EmailCard } from './emailCard/EmailCard';
import { CustomerCard } from './customerCard/customerCard';
import { ScheduleCard } from './scheduleCard/ScheduleCard';
import { FollowsCard } from './followsCard/FollowsCard';
import { EmailPanelModal } from './modal/EmailModal';
import { CustomerPanelModal } from './modal/CustomerModal';
import { EdmCard } from './edmCard/EdmCard';
import { EdmPanelModal } from './modal/EdmModal';
import { FollowsPanelModal } from './modal/FollowsModal';
import { SchedulePanelModal } from './modal/ScheduleModal';
import { ALL_PANEL_KEYS, PanelKeys } from '@web-common/state/reducer/worktableReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getPrivilegeAsync, isEnableFastmailAsync } from '@web-common/state/reducer/privilegeReducer';
import classnames from 'classnames';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';
import { worktableDataTracker } from './worktableDataTracker';
import KnowledgeCard from './knowledgeCard/KnowledgeCard';
import TimeZoneWithRateCard from './timeZoneWithRateCard/TimeZoneWithRateCard';
import useMsgRenderCallback from '../../../../../web-common/src/hooks/useMsgRenderCallback';
import { getTransText } from '@/components/util/translate';
import { useLocation } from 'react-use';
import { getIn18Text } from 'api';
const ResponsiveGridLayout = WidthProvider(ResponsiveLayout);
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;

/**
 * 为了解决web化在快速切换顶部tab时，偶现的工作台内容无法占满宽度的问题
 */
function doResize() {
  if (!systemApi.isWebWmEntry()) return;
  setTimeout(function () {
    //手动触发窗口resize事件
    if (document.createEvent) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent('resize', true, true);
      window.dispatchEvent(event);
    }
  }, 100);
}

const defaultLayouts: Layout[] = [
  {
    i: 'myEmail',
    x: 0,
    y: 0,
    w: 6,
    h: 8,
    minH: 5,
    minW: 3,
  },
  {
    i: 'myEdm',
    x: 6,
    y: 0,
    w: 6,
    h: 8,
    minH: 5,
    minW: 3,
  },
  {
    i: 'mySchedule',
    x: 0,
    y: 8,
    w: 8,
    h: 8,
    minH: 5,
    minW: 3,
  },
  {
    i: 'myCustomer',
    x: 8,
    y: 8,
    w: 4,
    h: 8,
    minH: 5,
    minW: 3,
  },
  {
    i: 'customerFollows',
    x: 0,
    y: 16,
    w: 12,
    h: 8,
    minW: 3,
    minH: 5,
  },
  // {
  //     i: 'knowledgeList',
  //     x: 0,
  //     y: 32,
  //     w: 6,
  //     h: 8,
  //     isResizable: false
  // }
];
const titleMap: Record<string, string> = {
  myEmail: getIn18Text('WODEKEHUYOUJIAN'),
  myEdm: getIn18Text('WODEYOUJIANYINGXIAO'),
  mySchedule: getIn18Text('ZUIXINRICHENG'),
  myCustomer: getIn18Text('WODEKEHUKANBAN'),
  allCustomer: getIn18Text('QUANBUKEHUKANBAN'),
  customerFollows: getIn18Text('WODEKEHUDONGTAI'),
  allCustomerFollows: getIn18Text('QUANBUKEHUDONGTAI'),
};
const mapKeyToAccessLabel: Record<PanelKeys, string> = {
  myEmail: 'VIEW_MY_CONTACT_EMAIL',
  myEdm: 'VIEW_MY_EDM_EMAIL',
  allEdm: 'VIEW_ALL_EDM_EMAIL',
  myCustomer: 'VIEW_MY_CONTACT_BOARD',
  allCustomer: 'VIEW_ALL_CONTACT_BOARD',
  schedule: 'VIEW_RECENTLY_SCHEDULE',
  myCustomerFollows: 'VIEW_MY_CONTACT_STATE',
  allCustomerFollows: 'VIEW_ALL_CONTACT_STATE',
  knowledgeList: 'VIEW_KNOWLEDGE_LIST',
  timeZoneWithRate: 'VIEW_TIMEZONE_BOARD',
};
const defaultSize = {
  w: 6,
  h: 8,
};
const STORAGE_KEY = 'worktableLayouts';
const ALL_CARDS = Object.values(mapKeyToAccessLabel).join('|');
export const WorktableInner: React.FC<SiriusPageProps> = props => {
  const enalbeFastMail = useAppSelector(state => state?.privilegeReducer?.enableFastMail);
  const dispatch = useAppDispatch();
  const location = useLocation();
  useEffect(() => {
    if (enalbeFastMail === undefined && systemApi.getCurrentUser()?.prop?.enable_fastmail === undefined) {
      // 权限失败，重新获取
      dispatch(isEnableFastmailAsync());
    }
  }, [enalbeFastMail]);
  const [layouts, updateLayouts] = useState<Layout[]>(() => {
    try {
      const str = dataStoreApi.getSync(STORAGE_KEY).data;
      if (!str) {
        return [];
      }
      const json = JSON.parse(str);
      return json;
    } catch (e) {
      console.warn(e);
      return [];
    }
  });
  const [user, setUser] = useState<User | undefined>();
  const [mailCount, setMailCount] = useState({
    enableSendCountToday: '-',
    restTotalSendCount: '-',
  });
  const [cards, setCards] = useState<PanelKeys[]>([]);
  const permissions = useAppSelector(state => state.privilegeReducer.modules.WORKBENCH);
  const appDispatch = useAppDispatch();
  useEffect(() => {
    appDispatch(getPrivilegeAsync());
    worktableDataTracker.trackTabClick();
  }, []);
  useEffect(() => {
    setUser(systemApi.getCurrentUser());
  }, []);
  useMsgRenderCallback('updateUserInfo', () => {
    setUser(systemApi.getCurrentUser());
  });
  useEffect(() => {
    // 在当前页面刷新，在权限列表返回之前，不执行该逻辑
    // if (!permissions?.funcPrivileges.length) {
    //     return
    // }
    const map: Record<string, boolean> = {};
    permissions?.funcPrivileges.forEach(i => {
      map[i.accessLabel] = true;
    });
    map['VIEW_KNOWLEDGE_LIST'] = true;
    map['VIEW_TIMEZONE_BOARD'] = true;
    const newCards = ALL_PANEL_KEYS.filter(key => map[mapKeyToAccessLabel[key]]);
    if (!arrayEqual(newCards, cards)) {
      setCards(newCards);
      const needLayoutCards = newCards.filter(key => layouts.every(item => item.i !== key));
      if (needLayoutCards.length) {
        const newLayouts = layoutToTail(layouts, needLayoutCards, defaultSize);
        updateLayouts([...layouts, ...newLayouts]);
      }
      // console.log('worktableCards', 'cards changed', needLayoutCards.length);
    }
  }, [permissions]);
  useEffect(() => {
    if (!systemApi.inEdm()) return;
    worktableApi.getWorktableSendCount().then(res => {
      const { availableSendCount = '-', orgAvailableSendCount = '-' } = res;
      setMailCount({
        enableSendCountToday: `${availableSendCount}`,
        restTotalSendCount: `${orgAvailableSendCount}`,
      });
    });
  }, []);
  useEffect(() => {
    if (location.hash && location.hash.indexOf('worktable') > -1) {
      doResize();
    }
  }, [location]);
  const handleLayoutChange = (currentLayout: Layout[]) => {
    updateLayouts(currentLayout);
    if (currentLayout.length) {
      // 保存布局信息
      const data = currentLayout.map(i => ({
        i: i.i,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        minW: i.minW,
        minH: i.minH,
      }));
      dataStoreApi.put(STORAGE_KEY, JSON.stringify(data), {
        noneUserRelated: false,
      });
      worktableDataTracker.trackLayout(data);
    }
  };
  console.log('worktableCards', cards, layouts);
  return (
    <PageContentLayout className={`${systemApi.isWebWmEntry() && styles.pageContentWm}`}>
      <ConfigProvider locale={zhCN}>
        <div className={classnames(styles.worktable, 'worktable-global')} id="worktable-page-root">
          <h3 className={styles.pageTitle}>{getIn18Text('GONGZUOTAI')}</h3>
          {/* <PermissionCheckPage resourceLabel="WORKBENCH" accessLabel={ALL_CARDS} menu="WORKBENCH"> */}
          {enalbeFastMail && (
            <div className={styles.greetBar}>
              <div className={styles.mainCont}>
                <span className={styles.userName}>
                  {getTransText('NIHAO')}，{user?.nickName}！
                </span>
                <span className={styles.mailCountShowArea}>
                  {getTransText('JINRIKEFAXINLIANG')}
                  {mailCount.enableSendCountToday}，{getTransText('SHENGYUFAXINLIANG')}
                  {mailCount.restTotalSendCount}
                </span>
              </div>
            </div>
          )}
          {cards.length > 0 && (
            <ResponsiveGridLayout
              className={styles.layout}
              layouts={{ lg: layouts }}
              cols={{ lg: 12 }}
              rowHeight={24}
              breakpoints={{ lg: 1000 }}
              measureBeforeMount={false}
              compactType="vertical"
              preventCollision={false}
              margin={[12, 12]}
              containerPadding={[24, 16]}
              onLayoutChange={handleLayoutChange}
            >
              {cards.map(key => (
                <div className={styles.card} key={key}>
                  <CardWithKey panelKey={key} />
                </div>
              ))}
            </ResponsiveGridLayout>
          )}

          {/* </PermissionCheckPage> */}
          <EmailPanelModal />
          <EdmPanelModal type="allEdm" />
          <EdmPanelModal type="myEdm" />
          <CustomerPanelModal type="allCustomer" />
          <CustomerPanelModal type="myCustomer" />
          <FollowsPanelModal type="myCustomerFollows" />
          <FollowsPanelModal type="allCustomerFollows" />
          <SchedulePanelModal />
        </div>
      </ConfigProvider>
    </PageContentLayout>
  );
};
export const Worktable = (props: SiriusPageProps) => {
  // const { active } = props;
  // const [isInit, setIsInit] = useState(active);
  // useEffect(() => {
  //     if (active) {
  //         setIsInit(true);
  //     }
  // }, [active]);
  // if (isInit) {
  return <WorktableInner {...props} />;
  // }
  // return null;
};
export const CardWithKey = (props: { panelKey: PanelKeys }) => {
  switch (props.panelKey) {
    case 'myEmail':
      return <EmailCard />; // 我的客户邮件
    case 'myEdm':
      return <EdmCard type="myEdm" />; // 我的邮件营销
    case 'allEdm':
      return <EdmCard type="allEdm" />; // 全部邮件营销
    case 'schedule':
      return <ScheduleCard />; // 最近日程
    case 'myCustomer':
      return <CustomerCard type="myCustomer" />; // 我的客户看版
    case 'allCustomer':
      return <CustomerCard type="allCustomer" />; // 全部客户看版
    case 'myCustomerFollows':
      return <FollowsCard type="my" />; // 我的客户动态
    case 'allCustomerFollows':
      return <FollowsCard type="all" />; // 全部客户动态
    case 'knowledgeList':
      return <KnowledgeCard type="wmInfos" />; // 外贸资讯/使用帮助
    case 'timeZoneWithRate':
      return <TimeZoneWithRateCard />; // 时区汇率
    default:
      return null;
  }
};
const getLayoutPosition = (layouts: Layout[]) => {
  let l = layouts[0];
  for (let i = 1, len = layouts.length; i < len; i++) {
    const item = layouts[i];
    const h = item.y + item.h;
    const h1 = l.y + l.h;
    if (h > h1) {
      l = item;
    } else if (h === h1) {
      l = item.x + item.w > l.x + l.y ? item : l;
    }
  }
  return l;
};
const maxColumn = 12;
const layoutToTail = (
  currentLayouts: Layout[],
  items: string[],
  defaultSize: {
    w: number;
    h: number;
  }
) => {
  const { w, h } = defaultSize;
  let left: number, right: number, top: number, bottom: number;
  if (currentLayouts.length > 0) {
    const lastMaxLayout = getLayoutPosition(currentLayouts);
    left = lastMaxLayout.x;
    right = lastMaxLayout.x + lastMaxLayout.w;
    bottom = lastMaxLayout.y + lastMaxLayout.h;
    top = lastMaxLayout.y;
  } else {
    left = right = top = bottom = 0;
  }
  const layouts = items.map(id => {
    let x1: number, y1: number;
    if (right + w > maxColumn) {
      x1 = left = 0;
      y1 = bottom;
      right = x1 + w;
      top = bottom;
      bottom += h;
    } else {
      x1 = left = right;
      y1 = top;
      left = x1;
      right = left + w;
      bottom = Math.max(bottom, y1 + h);
    }
    const item: Layout = {
      i: id,
      x: x1,
      y: y1,
      w: defaultSize.w,
      h: defaultSize.h,
      minW: 3,
      minH: 5,
    };
    return item;
  });
  return layouts;
};
function arrayEqual<T>(arr1: T[], arr2: T[]) {
  return (
    arr1.length === arr2.length &&
    arr1.every((item, index) => {
      return item === arr2[index];
    })
  );
}
