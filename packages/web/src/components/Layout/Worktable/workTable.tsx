import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-use';
import { Responsive as ResponsiveLayout, Layout, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { SiriusPageProps } from '@/components/Layout/model';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { AdvertConfig, api, apiHolder, apis, DataStoreApi, DataTrackerApi, SystemApi, User, WorktableApi } from 'api';
import styles from './workTable.module.scss';
import './worktable-global.scss';
import { EmailCard } from './emailCard/EmailCard';
import { CustomerCard } from './customerCard/customerCard';
import { ScheduleCard } from './scheduleCard/ScheduleCard';
import SystemTaskCard from './SystemTaskCard';
import { EdmCard } from './edmCard/EdmCard';
import { ALL_PANEL_KEYS, PanelKeys, getEmailInquirySwitchAsync } from '@web-common/state/reducer/worktableReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getPrivilegeAsync, isEnableFastmailAsync } from '@web-common/state/reducer/privilegeReducer';
import classnames from 'classnames';
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';
import { worktableDataTracker } from './worktableDataTracker';
import KnowledgeCard from './knowledgeCard/KnowledgeCard';
import TimeZoneWithRateCard from './timeZoneWithRateCard/TimeZoneWithRateCard';
import useMsgRenderCallback from '../../../../../web-common/src/hooks/useMsgRenderCallback';
import { getTransText } from '@/components/util/translate';
import EmployeeRankCard from './employeeRankCard/EmployeeRankCard';
import NoticeCard from './noticeCard/NoticeCard';
import { TodoCard } from './todoCard';
import { PopularCourseCard } from './PopularCourseCard/PopularCourseCard';
import { AnnouceScrollBanner } from './components/AnnouceScrollBanner/AnnouceScrollBanner';
import { MyCustomerStageCard } from './myCustomerStageCard';
import { TeamCustomerStageCard } from './teamCustomerStageCard';
import { SystemUsageOverview } from './systemUsageOverview';
import ForwardEmailInquiry from './forwardEmailInquiryCard';

const ResponsiveGridLayout = WidthProvider(ResponsiveLayout);
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;

/**
 * 为了解决web化在快速切换顶部tab时，偶现的工作台内容无法占满宽度的问题
 */
function doResize() {
  // if (!systemApi.isWebWmEntry()) return
  setTimeout(function () {
    //手动触发窗口resize事件
    if (document.createEvent) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent('resize', true, true);
      window.dispatchEvent(event);
    }
  }, 100);
}

const mapKeyToAccessLabel: Record<PanelKeys, string> = {
  employeeRankCard: 'VIEW_STAFF_PK_LIST',
  allCustomer: 'VIEW_ALL_CONTACT_BOARD',
  allEdm: 'VIEW_ALL_EDM_EMAIL',
  myCustomer: 'VIEW_MY_CONTACT_BOARD',
  myEmail: 'VIEW_MY_CONTACT_EMAIL',
  myEdm: 'VIEW_MY_EDM_EMAIL',
  schedule: 'VIEW_RECENTLY_SCHEDULE',
  systemTask: 'systemTask',
  // myCustomerFollows: 'VIEW_MY_CONTACT_STATE',
  // allCustomerFollows: 'VIEW_ALL_CONTACT_STATE',
  knowledgeList: '',
  timeZoneWithRate: '',
  todoCard: 'todoCard',
  popularCourse: '',
  myCustomerStage: 'VIEW_MY_CONTACT_STAGE',
  teamCustomerStage: 'VIEW_ALL_CONTACT_STAGE',
  systemUsageOverview: 'systemUsageOverview',
  forwardEmailInquiry: 'forwardEmailInquiry',
};

// 高度：1 = 40px
const defaultSize = {
  w: 12,
  h: {
    myEmail: 8,
    myEdm: 8,
    allEdm: 6,
    myCustomer: 6,
    allCustomer: 6,
    schedule: 7,
    systemTask: 7,
    myCustomerFollows: 8,
    allCustomerFollows: 8,
    knowledgeList: 9,
    noticeCard: 11,
    timeZoneCard: 5,
    rateCard: 5,
    employeeRankCard: 10,
    todoCard: 12,
    popularCourse: 15.5,
    myCustomerStage: 9.975,
    teamCustomerStage: 9.975,
    systemUsageOverview: 11.2,
    forwardEmailInquiry: 8,
  },
};
const genLayouts = (items: string[], defaultBottom: number = 0) => {
  let bottom = defaultBottom;
  return items.map(id => {
    bottom += defaultSize.h[id];
    const item: Layout = {
      i: id,
      x: 0,
      y: bottom,
      w: defaultSize.w,
      h: defaultSize.h[id],
      isResizable: false,
    };
    return item;
  });
};

const LEFT_STORAGE_KEY = `worktableLayouts-0510-${systemApi.getCurrentUser()?.accountName}`;
const RIGHT_STORAGE_KEY = `worktableRightBlockLayouts-0615-${systemApi.getCurrentUser()?.accountName}`;
const ALL_CARDS = Object.values(mapKeyToAccessLabel).join('|');
const rightBlockCards: any[] = ['timeZoneCard', 'rateCard', 'knowledgeList', 'popularCourse', 'noticeCard'];
const permissionRightCards: PanelKeys[] = ['myCustomerStage', 'teamCustomerStage'];
export const WorktableInner: React.FC<SiriusPageProps> = props => {
  const enalbeFastMail = useAppSelector(state => state?.privilegeReducer?.enableFastMail);
  const emailInquirySwitch = useAppSelector(state => state?.worktableReducer?.emailInquirySwitch?.data);
  const dispatch = useAppDispatch();
  const [cartsRight, setCartsRight] = useState<PanelKeys[]>([]);
  const location = useLocation();
  useEffect(() => {
    if (enalbeFastMail === undefined && systemApi.getCurrentUser()?.prop?.enable_fastmail === undefined) {
      // 权限失败，重新获取
      dispatch(isEnableFastmailAsync());
    }
  }, [enalbeFastMail]);
  const [layouts, updateLayouts] = useState<Layout[]>(() => {
    try {
      const str = dataStoreApi.getSync(LEFT_STORAGE_KEY).data;
      if (!str) return [];
      const json = JSON.parse(str);
      return json;
    } catch (e) {
      console.warn(e);
      return [];
    }
  });
  const [rightLayouts, updateRightLayouts] = useState<Layout[]>(() => {
    try {
      const str = dataStoreApi.getSync(RIGHT_STORAGE_KEY).data;
      if (!str) return [];
      return JSON.parse(str);
    } catch (error) {
      return [];
    }
  });
  const [storeRightLy, setStoreRightLy] = useState<Layout[]>(() => {
    try {
      const str = dataStoreApi.getSync(RIGHT_STORAGE_KEY).data;
      if (!str) return [];
      return JSON.parse(str);
    } catch (error) {
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
    if (!emailInquirySwitch) {
      appDispatch(getEmailInquirySwitchAsync());
    }
    worktableDataTracker.trackTabClick();
  }, []);
  useEffect(() => {
    setUser(systemApi.getCurrentUser());
  }, []);
  useMsgRenderCallback('updateUserInfo', () => {
    setUser(systemApi.getCurrentUser());
  });

  const forceUpdateLayout = (storeRightLy: Layout[]) => {
    if (!storeRightLy.length) return storeRightLy;
    return storeRightLy.map(item => {
      if (item.i === 'myCustomerStage' || item.i === 'teamCustomerStage') {
        return { ...item, w: 12, h: 9.975, isResizable: false };
      }
      if (item.i === 'popularCourse') {
        return { ...item, w: 12, h: 15.5, isResizable: false };
      }
      if (item.i === 'knowledgeList') {
        return { ...item, w: 12, h: 9, isResizable: false };
      }
      if (item.i === 'noticeCard') {
        return { ...item, w: 12, h: 11, isResizable: false };
      }
      if (item.i === 'rateCard' || item.i === 'timeZoneCard') {
        return { ...item, w: 12, h: 5, isResizable: false };
      }
      return item;
    });
  };

  useEffect(() => {
    const map: Record<string, boolean> = {};
    (permissions?.funcPrivileges ?? []).forEach(i => {
      map[i.accessLabel] = true;
    });
    // map['todoCard'] = true;
    map['systemUsageOverview'] = true;
    map['systemTask'] = true;
    if (emailInquirySwitch?.entranceSwitch) {
      map['forwardEmailInquiry'] = true;
    }
    const newCards = ALL_PANEL_KEYS.filter(key => map[mapKeyToAccessLabel[key]]);
    const newPRightCards = permissionRightCards.filter(key => map[mapKeyToAccessLabel[key]]);
    // 加入到 kl 后面
    const index = rightBlockCards.indexOf('knowledgeList');
    const newRightCards = [...rightBlockCards.slice(0, index + 1), ...newPRightCards, ...rightBlockCards.slice(index + 1)];
    // 保证emailInquiry权限获取到
    if (!arrayEqual(newCards, cards) && emailInquirySwitch) {
      setCards(newCards);
      // forwardEmailInquiry第一次出现需要出现在最上面
      const needLayoutCards = newCards.filter(key => layouts.every(item => item.i !== key));
      let currentLayouts: Layout[] = [...layouts];
      if (layouts.every(item => item.i !== 'forwardEmailInquiry') && newCards.some(key => key === 'forwardEmailInquiry')) {
        currentLayouts = genLayouts(['forwardEmailInquiry', ...layouts.map(item => item.i)]);
      }

      if (needLayoutCards.length) {
        let appendLayouts: Layout[] = [];
        const appendLayoutCards = needLayoutCards.filter(key => key !== 'forwardEmailInquiry');
        if (appendLayoutCards.length) {
          appendLayouts = layoutToTail(currentLayouts, needLayoutCards, defaultSize);
        }
        updateLayouts([...currentLayouts, ...appendLayouts]);
      }
    }

    if (!arrayEqual(newRightCards, cartsRight)) {
      setCartsRight(newRightCards);
      const needRLayoutCards = newRightCards.filter(key => rightLayouts.every(item => item.i !== key));
      if (needRLayoutCards.length) {
        // 引入 storeRightLy 避免初始化时 handleRightLayoutChange 自动执行修改布局
        const rNewLayouts = layoutToAnyPosition(storeRightLy.length ? storeRightLy : rightLayouts, needRLayoutCards, defaultSize, 2);
        console.log('forceUpdateLayout');
        const _storeRightLy = forceUpdateLayout(storeRightLy);
        updateRightLayouts(storeRightLy.length ? [..._storeRightLy] : [...rNewLayouts]);
      } else {
        console.log('forceUpdateLayout else');
        const _storeRightLy = forceUpdateLayout(storeRightLy);
        // 避免 web 端切换顶部 tab 之后，布局紊乱
        setTimeout(() => {
          updateRightLayouts([..._storeRightLy]);
        }, 10);
      }
    }
  }, [permissions, emailInquirySwitch]);

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
        isResizable: i.isResizable,
      }));
      dataStoreApi.put(LEFT_STORAGE_KEY, JSON.stringify(data), {
        noneUserRelated: false,
      });
      worktableDataTracker.trackLayout(data);
    }
  };
  const handleRightLayoutChange = (currentLayout: Layout[]) => {
    updateRightLayouts(currentLayout);
    if (currentLayout.length) {
      const data = currentLayout.map(i => ({
        i: i.i,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        isResizable: i.isResizable,
      }));
      dataStoreApi.putSync(RIGHT_STORAGE_KEY, JSON.stringify(data), {
        noneUserRelated: false,
        storeMethod: 'localStorage',
      });
    }
  };

  // 工作台广告banner曝光埋点
  const handleAnnouceScrollBannerChange = (currentSlide: number, data: AdvertConfig) => {
    if (!props.active) return;
    trackerApi.track('waimao_worktable_adver_exposure', {
      advertId: data.id,
    });
  };

  const handleAnnouceScrollBannerClick = (data: AdvertConfig) => {
    trackerApi.track('waimao_worktable_adver_click', {
      advertId: data.id,
    });
  };
  const onChange = e => {
    console.log(`checked = ${e.target.checked}`);
  };
  return (
    <PageContentLayout className={`${systemApi.isWebWmEntry() && styles.pageContentWm}`}>
      <ConfigProvider locale={zhCN}>
        <div className={classnames(styles.worktable, 'worktable-global')} id="worktable-page-root">
          {/* <PermissionCheckPage resourceLabel="" accessLabel={ALL_CARDS} menu="WORKBENCH"> */}
          <div className={styles.worktableScrollContainer}>
            <div className={styles.worktableContainer}>
              {enalbeFastMail && (
                <div className={styles.greetBar}>
                  <div className={styles.mainCont}>
                    <span className={styles.userName}>
                      {getTransText('NIHAO')}，{user?.nickName}！
                    </span>
                    {/* <span className={styles.saHuaIcon}>
                    <Sahua/>
                  </span> */}
                    <span className={styles.mailCountShowArea}>
                      {getTransText('JINRIKEFAXINLIANG')}
                      {mailCount.enableSendCountToday}，{getTransText('SHENGYUFAXINLIANG')}
                      {mailCount.restTotalSendCount}
                    </span>
                  </div>
                </div>
              )}
              <div className={styles.worktableContent}>
                <div className={styles.leftBlock}>
                  <AnnouceScrollBanner active={props.active} handleChange={handleAnnouceScrollBannerChange} handleSlideClick={handleAnnouceScrollBannerClick} />
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
                      margin={[16, 16]}
                      containerPadding={[0, 16]}
                      onLayoutChange={handleLayoutChange}
                      draggableCancel=".wk-no-drag"
                    >
                      {cards.map(key => (
                        <div className={styles.card} key={key}>
                          <CardWithKey panelKey={key} />
                        </div>
                      ))}
                    </ResponsiveGridLayout>
                  )}
                </div>
                <div className={styles.rightBlock}>
                  <ResponsiveGridLayout
                    className={styles.layout}
                    layouts={{ lg: rightLayouts }}
                    cols={{ lg: 12 }}
                    rowHeight={24}
                    breakpoints={{ lg: 1000 }}
                    measureBeforeMount={false}
                    compactType="vertical"
                    preventCollision={false}
                    margin={[16, 16]}
                    containerPadding={[0, 16]}
                    onLayoutChange={handleRightLayoutChange}
                    draggableCancel=".wk-no-drag"
                  >
                    {cartsRight.map(key => {
                      return (
                        <div className={styles.card} key={key}>
                          <RightCardWithKey active={props.active} panelKey={key} />
                        </div>
                      );
                    })}
                  </ResponsiveGridLayout>
                </div>
              </div>
            </div>
          </div>
          {/* </PermissionCheckPage> */}
        </div>
      </ConfigProvider>
    </PageContentLayout>
  );
};
export const Worktable = (props: SiriusPageProps) => {
  return <WorktableInner {...props} />;
};
export const CardWithKey = (props: { panelKey: PanelKeys }) => {
  switch (props.panelKey) {
    case 'myEmail':
      return <EmailCard />;
    case 'myEdm':
      return <EdmCard type="myEdm" />;
    case 'allEdm':
      return <EdmCard type="allEdm" />;
    case 'schedule':
      return <ScheduleCard />;
    case 'systemTask':
      return <SystemTaskCard />;
    case 'myCustomer':
      return <CustomerCard type="myCustomer" />;
    case 'allCustomer':
      return <CustomerCard type="allCustomer" />;
    // case 'myCustomerFollows':
    //   return <FollowsCard type="my" />;
    // case 'allCustomerFollows':
    //   return <FollowsCard type="all" />;
    case 'employeeRankCard':
      return <EmployeeRankCard />;
    case 'todoCard':
      return <TodoCard />;
    case 'systemUsageOverview':
      return <SystemUsageOverview />;
    case 'forwardEmailInquiry':
      return <ForwardEmailInquiry />; // 专属询盘（原信转发）
    default:
      return null;
  }
};
const RightCardWithKey = (props: { panelKey: string; active?: boolean }) => {
  switch (props.panelKey) {
    case 'noticeCard':
      return <NoticeCard />;
    case 'knowledgeList':
      return <KnowledgeCard type="wmInfos" />;
    case 'timeZoneCard':
      return <TimeZoneWithRateCard type="time" />;
    case 'rateCard':
      return <TimeZoneWithRateCard type="rate" />;
    case 'popularCourse':
      return <PopularCourseCard active={props.active} />;
    case 'myCustomerStage':
      return <MyCustomerStageCard />;
    case 'teamCustomerStage':
      return <TeamCustomerStageCard />;
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
const layoutToTail = (
  currentLayouts: Layout[],
  items: string[],
  defaultSize: {
    w: number;
    h: Record<string, number>;
  }
) => {
  const { w } = defaultSize;
  let left: number, right: number, top: number, bottom: number;
  if (currentLayouts.length > 0) {
    const lastMaxLayout = getLayoutPosition(currentLayouts);
    // left = lastMaxLayout.x;
    // right = lastMaxLayout.x + lastMaxLayout.w;
    bottom = lastMaxLayout.y + lastMaxLayout.h;
    top = lastMaxLayout.y;
  } else {
    // left = right = top = bottom = 0;
    top = bottom = 0;
  }
  const layouts = items.map(id => {
    let x1: number, y1: number;
    x1 = 0;
    y1 = bottom;
    right = x1 + w;
    top = bottom;
    bottom += defaultSize.h[id];
    const item: Layout = {
      i: id,
      x: x1,
      y: y1,
      w: defaultSize.w,
      h: defaultSize.h[id],
      isResizable: false,
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

const layoutToAnyPosition = (
  currentLayouts: Layout[],
  items: string[],
  defaultSize: {
    w: number;
    h: Record<string, number>;
  },
  position: number
) => {
  const { w } = defaultSize;

  let left: number, right: number, top: number, bottom: number;
  if (currentLayouts.length > 0) {
    const hasOne = position < currentLayouts.length;
    if (hasOne) {
      const positionLayout = currentLayouts[position];
      bottom = positionLayout.y + positionLayout.h;
      top = positionLayout.y;
    } else {
      const positionLayout = currentLayouts[currentLayouts.length - 1];
      bottom = positionLayout.y + positionLayout.h;
      top = positionLayout.y;
    }
  } else {
    top = bottom = 0;
  }

  const itemLayouts = items.map(id => {
    let x1, y1;
    x1 = 0;
    y1 = bottom;
    right = x1 + w;
    top = bottom;
    bottom += defaultSize.h[id];
    const item = {
      i: id,
      x: x1,
      y: y1,
      w: defaultSize.w,
      h: defaultSize.h[id],
      isResizable: false,
    };
    return item;
  });

  let itemBottom = 0;
  if (itemLayouts.length) {
    const itemLastPosition = itemLayouts[itemLayouts.length - 1];
    itemBottom = itemLastPosition.y + itemLastPosition.h;
  }

  const tailLayouts = currentLayouts.slice(position).map(m => {
    let x1, y1;
    x1 = 0;
    y1 = itemBottom;
    right = x1 + w;
    top = itemBottom;
    itemBottom += defaultSize.h[m.i];
    const item = {
      i: m.i,
      x: x1,
      y: y1,
      w: defaultSize.w,
      h: defaultSize.h[m.i],
      isResizable: false,
    };
    return item;
  });

  const layouts: Layout[] = [...currentLayouts.slice(0, position), ...itemLayouts, ...tailLayouts];

  return layouts;
};
