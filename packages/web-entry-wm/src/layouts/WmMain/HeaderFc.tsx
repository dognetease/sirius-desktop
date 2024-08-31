import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDom from 'react-dom';
import { navigate } from 'gatsby';
import { Badge, Divider, Dropdown, Popover, Tooltip, message } from 'antd';
import {
  SystemApi,
  apiHolder,
  User,
  apis,
  AccountApi,
  TaskCenterApi,
  MailConfApi,
  MailApi,
  DataTrackerApi,
  LoginApi,
  DataTransApi,
  api,
  ProductAuthApi,
  EdmMenuVideo,
  EdmRoleApi,
  EventApi,
  InsertWhatsAppApi,
  getIn18Text,
  WorktableApi,
} from 'api';
import { ReactComponent as Logo } from '@web-common/images/logo_pro.svg';
// import { ReactComponent as Setting } from '@web-common/images/icons/setting.svg';
// import { ReactComponent as Download } from '@web-common/images/icons/download.svg';
import { ReactComponent as Noti } from '@web-common/images/icons/noti.svg';
import { ReactComponent as Kf } from '@web-common/images/icons/kf.svg';
import { ReactComponent as More } from '@web-common/images/icons/more.svg';
import { ReactComponent as Im } from '@web-common/images/icons/im.svg';
import { ReactComponent as KnowledgeCenter } from '@web-common/images/icons/knowledge-center-light.svg';
import { ReactComponent as UpGrade } from '@web-common/images/icons/upgrade.svg';
import { ReactComponent as Extension } from '@web-common/images/icons/extension.svg';
import { ChildrenType, packedData, topMenu as topM } from '../config/topMenu';
import { topMenu as topMV2, packedData as packedDataV2 } from '../config/v2/topMenu';
import type { AlignType } from 'rc-trigger/lib/interface';
import DropMenu from './views/dropMenu';
import DropMenuV2 from './views/v2/dropMenu';
import { ReactComponent as ExpandRight } from '@web-common/images/icons/expand_right.svg';
import { feedbackUploadLog } from '@web-common/utils/uploadLog';
import UserMenu from './views/userMenu';
import { LastClosedDate as NewbieTaskLastClosedDate } from '@web-common/components/NewbieTask';
import About from '@/components/Electron/About';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { actions } from '@web-common/state/reducer/mailReducer';
import { showNewbieTask } from '@web-common/state/reducer/notificationReducer';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { UsageGuide } from '@web-common/components/UsageGuide';
import { ReadCountActions, WebEntryWmActions, NoviceTaskActions } from '@web-common/state/reducer';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { speUrl, TopMenuPath, TopMenuType } from '@web-common/conf/waimao/constant';
import { filterSideTree } from '../utils/filterSideTree';
import { getIsSomeMenuVisbleSelector, getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import { usePaidUpgrade } from '@web-entry-wm/layouts/hooks/usePaidUpgrade';
import { getUnitableCrmHash, isMatchUnitableCrmHash } from '@web-unitable-crm/api/helper';
import classNames from 'classnames';
import { shallowEqual } from 'react-redux';
import style from './headerfc.module.scss';
import { getTransText } from '@/components/util/translate';
import _ from 'lodash';
import { getIn18Text, WorktableApi } from 'api';
import { FORWARDER_PORT_MENU_LABEL, deleteFromTreeByLabelName } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { isMatchCustomerManageRoute, isMatchCustomerPerformanceRoute } from '../hooks/use-l2c-crm-menu-data';
import NoticeCard from '@/components/Layout/Worktable/noticeCard/NoticeCard';
import { MoreMenu } from './moreMenu';
import { useLocalStorageState } from 'ahooks';
import { RewardAlreadyGotit } from '@web-common/components/FloatToolButton/index';
import { bus } from '@web-common/utils/bus';
import classnames from 'classnames';
import { useNoticeListData } from '@/components/Layout/Worktable/noticeCard/hooks/useNoticeListData';
import { WmKfEntry } from '@web-common/components/WmKfEntry';
import { config } from 'env_def';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import debounce from 'lodash/debounce';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const loginApi = apiHolder.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const env = config('profile');

export type SourceType = 'mItem' | 'dItem';
interface HeaderProps {
  onTopItem: (item: ChildrenType, source: SourceType, target?: ChildrenType) => void;
  onChange: (arg: string) => void;
  moduleName: string;
  visibleAdmin: boolean;
  hasWarmupEntry?: boolean;
}

const ProductVersion = {
  FREE: 'FREE', // 体验版
  FASTMAIL: 'FASTMAIL', // 外贸版
  WEBSITE: 'WEBSITE', // 建站版
  FASTMAIL_AND_WEBSITE: 'FASTMAIL_AND_WEBSITE', // 外贸和建站版
  FASTMAIL_EXPIRED: 'FASTMAIL_EXPIRED', // 外贸过期版
};

const alignConfig = {
  points: ['tr', 'br'], // align top left point of sourceNode with top right point of targetNode
  offset: [0, 9], // the offset sourceNode by 0 in x and 9px in y,
  targetOffset: [-13, 0], // the offset targetNode by -13px of targetNode width in x and 0 of targetNode height in y,
  overflow: { adjustX: true, adjustY: false }, // auto adjust position when sourceNode is overflowed
} as AlignType;

const headerClickTracker = (path: TopMenuPath, isChild = false, item?: TopMenuType) => {
  const isV2 = window.localStorage.getItem('v1v2');
  if (isV2 && !isChild) return headerClickTrackerV2(path);
  const eventId = isChild ? 'waimao_web_hovertab_click' : 'waimao_web_tab_click';
  const paramKey = isChild ? 'action' : 'tab';
  const pathToTrackTabKey: any = {
    [TopMenuPath.worktable]: 'home_page',
    [TopMenuPath.mailbox]: 'email_management',
    [TopMenuPath.wm]: 'customer_management',
    [TopMenuPath.unitable_crm]: '',
    [TopMenuPath.wmData]: 'big_data_on_foreign_trade',
    [TopMenuPath.intelliMarketing]: 'smart_marketing',
    [TopMenuPath.coop]: 'coordinate_office',
    [TopMenuPath.enterpriseSetting]: 'enterprise_setup',
  };

  pathToTrackTabKey[path] && trackApi.track(eventId, { [paramKey]: pathToTrackTabKey[path] });
  if (!isChild) {
    trackApi.track('pc_topMenuClick', { tab: path });
  } else {
    trackApi.track('waimao_secondary_menu_click', { menuKey: path, name: item?.name, pos: 'topMenuOverlay' });
  }
};

const headerClickTrackerV2 = (path: TopMenuPath) => {
  const trackEventMap: Record<string, string> = {
    [TopMenuPath.worktable]: 'home_page',
    [TopMenuPath.mailbox]: 'email_management',
    [TopMenuPath.wm]: 'customer_management',
    [TopMenuPath.unitable_crm]: 'customer_management',
    [TopMenuPath.wmData]: 'big_data_on_foreign_trade',
    [TopMenuPath.intelliMarketing]: 'smart_marketing',
    [TopMenuPath.coop]: 'coordinate_office',
    [TopMenuPath.enterpriseSetting]: 'enterprise_setup',
    [TopMenuPath.wa]: 'personal_WA_enter_point_click',
    [TopMenuPath.site]: 'brand_build', // 品牌建设
  };
  let trackEventName = trackEventMap[path] || '';
  if (isMatchCustomerManageRoute(path)) {
    trackEventName = 'customer_management'; // 客户管理
  }
  if (isMatchCustomerPerformanceRoute(path)) {
    trackEventName = 'customer_performance'; // 客户履约
  }
  if (trackEventName) {
    trackApi.track(trackEventName, { version: 1 });
  }
};

// type IType = {
//   [key: string]: number[];
// };

const WEBSITE_IGNORE_PATH: TopMenuPath[] = [
  TopMenuPath.worktable,
  TopMenuPath.systemTask,
  TopMenuPath.noviceTask,
  TopMenuPath.wmData,
  TopMenuPath.intelliMarketing,
  TopMenuPath.rbac,
  TopMenuPath.personal,
  TopMenuPath.coop,
];

const HeaderFc: React.FC<any> = (props: HeaderProps) => {
  const { onTopItem, onChange, moduleName, visibleAdmin, hasWarmupEntry = false } = props;
  const [activeTab, setActiveTab] = useState('');
  const [user, setUser] = useState<User | undefined>();
  const [mailList, setMailList] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isNewAccount, setNewAccount] = useState<boolean>(false);
  const { loading, handleClickUpgrade } = usePaidUpgrade();
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const version = useAppSelector(state => state.privilegeReducer.version);
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  const unReadCountActions = useActions(ReadCountActions);
  const { updateNoviceState } = useActions(NoviceTaskActions);
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const [topMenu, setTopMenu] = useState<TopMenuType[]>([]);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  let setAboutVisible = () => {};
  const dispatch = useAppDispatch();
  const { setApplyGenerateHide } = actions;
  const curMenuRef = useRef('');

  const [curMenu, setCurMenu] = useState('');
  // const { updateTopMenu } = useActions(WebEntryWmActions);
  const visibleWorktable = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WORKBENCH']));
  const productCode = useAppSelector(state => state.privilegeReducer.version);
  // const topItemRef = useRef<HTMLDivElement>(null);
  // const versionRef = useRef<HTMLDivElement>(null);
  // const mRef = useRef<TopMenuType[]>([]);
  const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  const showWa = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WA_CHAT_MANAGE', 'WA_FILE_MANAGE', 'WA_CHAT_LIST', 'WHATSAPP_PERSONAL']));
  const v1v2 = useVersionCheck();
  const [videoInfo, setVideoInfo] = useState<EdmMenuVideo | undefined>(undefined);
  const [showTip, setShowTip] = useLocalStorageState(RewardAlreadyGotit, { defaultValue: false });
  const openHelpCenter = useOpenHelpCenter();

  const isV2Version = useMemo(() => {
    return v1v2 === 'v2';
  }, [v1v2]);

  useEffect(() => {
    if (showWa) {
      insertWhatsAppApi.getWAReddot().then(res => {
        unReadCountActions.updateWAReddot(res.redDot);
      });
    }
  }, [showWa]);

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

  useEffect(() => {
    if (showWa) {
      const waReddot = eventApi.registerSysEventObserver('whatsappSubscribeUpdate', {
        func: event => {
          if (event.eventData.type === 'reddot') {
            unReadCountActions.updateWAReddot(event.eventData.reddot);
          }
        },
      });
      return () => {
        eventApi.unregisterSysEventObserver('whatsappSubscribeUpdate', waReddot);
      };
    }
  }, [showWa]);

  const fetchVideoInfo = () => {
    const resString = productApi.getABSwitchSync('edm_menu_video');
    if (resString && typeof resString === 'string') {
      try {
        const resObject: EdmMenuVideo = JSON.parse(resString);
        setVideoInfo(resObject);
      } catch (e) {
        console.error('fetch menu video error', e);
      }
    }
  };

  useEffect(() => {
    // 设置顶部菜单时需要考虑是否为免费版（优先级更高）,如果是走下面的逻辑
    if (isFreeVersionUser) {
      return;
    }
    const filterMenu = (v1v2 === 'v2' ? topMV2 : topM)
      .filter(m => {
        if (m.path !== TopMenuPath.wa) {
          return !speUrl.includes(m.path as TopMenuPath) && !m.hidden;
        }
        return showWa;
      })
      // .filter(m => !speUrl.includes(m.path as TopMenuPath) && !m.hidden)
      // .map(f => packedDataV2(filterSideTree(f, menuKeys)))
      .map(f => (v1v2 === 'v2' ? packedDataV2 : packedData)(filterSideTree(f, menuKeys, false, hasWarmupEntry)))
      .filter(item => !!item);
    let fMenu = [...(v1v2 === 'v2' ? topMV2 : topM).filter(m => speUrl.includes(m.path as TopMenuPath)), ...filterMenu] as TopMenuType[];
    console.log(menuKeys, filterMenu, 'location-ddd');

    // 货代菜单权限
    if (!menuKeys[FORWARDER_PORT_MENU_LABEL]) {
      fMenu = fMenu.map(item => {
        return {
          ...item,
          children: deleteFromTreeByLabelName(FORWARDER_PORT_MENU_LABEL, item.children),
        };
      });
    }
    setTopMenu(fMenu);

    // 获取菜单内视频配置
    if (v1v2 === 'v2') {
      fetchVideoInfo();
    }
  }, [menuKeys, hasWarmupEntry, v1v2]);

  useEffect(() => {
    if (isFreeVersionUser) {
      const fMenu = topM
        .filter(item => {
          return !item.hiddenWithFree;
        })
        .map(item => {
          if (item.children && item.children.length) {
            item.children = item.children.map(subItem => {
              return {
                ...subItem,
                children: subItem.children.filter(x => !x.hiddenWithFree),
              };
            });
          }
          return item;
        });
      setTopMenu(fMenu);
    }
  }, [isFreeVersionUser]);
  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(isAdmin => setIsAdmin(isAdmin));
    (async () => {
      const [isNewAccount, { totalCount, finishedCount }] = await Promise.all([accountApi.doGetAccountIsNewAccount(), taskCenterApi.getNoviceTasks()]);
      setNewAccount(isNewAccount);
      updateNoviceState(isNewAccount);
      const lastCloseDate = localStorage.getItem(NewbieTaskLastClosedDate);
      if (finishedCount < totalCount && isNewAccount && (!lastCloseDate || Date.now() - new Date(lastCloseDate).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        dispatch(showNewbieTask());
      }
    })();
  }, []);

  // useEffect(() => {
  //   const menu: TopMenuType[] = privMenu(topMenu);
  //   insertPos(menu);
  // }, [topMenu, topItemRef.current, versionRef.current]);

  // const privMenu = (menu: TopMenuType[]) => {
  //   return menu.filter(f => {
  //     const res = (f.path === TopMenuPath.worktable && visibleWorktable) || f.children?.[0]?.children?.length || f.path === TopMenuPath.mailbox;
  //     return res;
  //   });
  // };

  // const insertPos = (f: TopMenuType[]) => {
  //   const map: IType = {};
  //   let _f: TopMenuType[] = [];
  //   const posList = topItemRef.current?.querySelectorAll('.web-entry-top-item') || [];
  //   const versionGuidePos = versionRef.current?.getBoundingClientRect();
  //   Array.from(posList)?.forEach((node, idx) => {
  //     const { x, y, width, height } = node.getBoundingClientRect();
  //     map[idx] = [x, y, width, height];
  //   });
  //   if (versionGuidePos) {
  //     const { x, y, width, height } = versionGuidePos;
  //     map[posList.length] = [x, y, width, height];
  //     _f = [...f, { path: 'oldVersion', name: '', children: [] }];
  //   }
  //   updateTopMenu({ topMenu: _f, posMap: map });
  // };

  useEffect(() => {
    setActiveTab(moduleName);
  }, [moduleName]);

  useEffect(() => {
    if (visible) {
      accountApi
        .doGetMailAliasAccountListV2({ noMain: true })
        .then(res => setMailList(res?.map(item => item?.id)))
        .catch(() => {
          setMailList([]);
        });
    }
  }, [visible]);

  useEventObserver('notificationChange', {
    name: 'navbarNotificationChangeOb-HeaderFc',
    func: ev => {
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

  const handleAccount = () => {
    navigate(`#${TopMenuPath.personal}?page=security`);
    onChange(TopMenuPath.personal);
  };

  const handleSystemTask = () => {
    trackApi.track('waimao_my_task', { action: 'headpic' });
    navigate(`#${TopMenuPath.systemTask}?page=${TopMenuPath.systemTask}`);
    onChange(TopMenuPath.systemTask);
  };

  const handleNoviceTask = () => {
    trackApi.track('waimao_newusertask', { action: 'headpic_newusertask' });
    navigate(`#${TopMenuPath.noviceTask}?page=${TopMenuPath.noviceTask}`);
    onChange(TopMenuPath.noviceTask);
  };

  const handleSetting = () => {
    const isV2 = window.localStorage.getItem('v1v2');
    if (isV2) headerClickTrackerV2(TopMenuPath.enterpriseSetting);
    trackApi.track('waimao_web_tab_click', { tab: 'enterprise_setup' });
    navigate(`#${TopMenuPath.enterpriseSetting}?page=members`);
    onChange(TopMenuPath.enterpriseSetting);
  };

  const handleDownLoad = () => {
    const downLoadUrl = 'https://sirius-config.qiye.163.com/api/pub/client/waimao/download';
    window.location.href = downLoadUrl;
  };

  const handleIm = () => {
    const curTab = cachedTabs.find(tab => tab.tab === 'coop');
    trackApi.track('waimao_web_tab_click', { tab: 'message' });
    const params = splitURL(curTab?.query);
    navigate(`#${TopMenuPath.coop}?page=message${params}`);
    onChange(TopMenuPath.coop);
  };

  const splitURL = (query: any = {}) => {
    const urlHalf: string[] = [];
    Object.keys(query)
      .filter(q => q !== 'page')
      .forEach(key => {
        const value = query[key];
        urlHalf.push([key, encodeURIComponent(value)].join('='));
      });
    return urlHalf.length === 0 ? '' : '&' + urlHalf.join('&');
  };

  const handleHelp = () => {
    // systemApi.handleJumpUrl(-1, 'https://waimao.163.com/helpCenter/index.html');
    openHelpCenter();
  };

  const handleFeedback = () => {
    const hide = message.loading('反馈邮件生成中，请稍等...', 0);
    // 6秒后如果没有生成自动消失
    setTimeout(() => {
      hide();
    }, 6000);
    dispatch(setApplyGenerateHide(hide));
    mailApi.doWriteMailToWaimaoServer();
  };

  const handleUploadLog = () => {
    const hide = message.loading('日志上传中，请稍等', 0);
    //
    feedbackUploadLog().then(hide);
  };
  const handleClickExtension = () => {
    const url = document.body.dataset.extensionInstalled
      ? 'https://www.linkedin.com/in/grayson-peng-046074255/?openSidebar=true'
      : 'https://chrome.google.com/webstore/detail/%E7%BD%91%E6%98%93%E5%A4%96%E8%B4%B8%E9%80%9A%E5%8A%A9%E6%89%8B/fbaccmibmbdppbofdglbfakjalaepkna';
    window.open(url);
  };

  const handleDomainManage = async () => {
    const redirectUrl =
      mailConfigApi.getWebMailHost(true) +
      '/admin/login.do?hl=zh_CN&uid=' +
      systemApi.getCurrentUser()?.id +
      '&app=admin&all_secure=1&target=domainManage*tradelink&from=domainManage';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      // 跳转浏览器
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };

  const [shouldShowEntry, setShouldShowEntry] = useState<boolean>(false);

  useEffect(() => {
    roleApi
      .showKfEntry()
      .then(data => {
        setShouldShowEntry(data?.showHelpEntrance);
      })
      .catch(err => console.log(err));
  }, []);

  const handleNoti = async () => {};
  const handleMore = async () => {};

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

  const { noticeList, fetchNoticeList } = useNoticeListData();

  useEffect(() => {
    fetchNoticeList();
  }, []);

  const onVisibleChange = (vis: boolean, type: string) => {
    if (vis) {
      if (type === 'more') {
        trackApi.track('waimao_more', { action: 'show' });
      } else if (type === 'notice') {
        trackApi.track('waimao_notification', { action: 'click' });
      }
    }
  };

  const tools = [
    // {
    //   label: getIn18Text('XIAZAIKEHUDUAN'),
    //   icon: <Download />,
    //   visible: true,
    //   click: handleDownLoad
    // },
    // {
    //   label: getIn18Text('QIYESHEZHIWEB'),
    //   icon: <Setting />,
    //   visible: version === 'WEBSITE' ? false : visibleAdmin,
    //   click: handleSetting,
    // },
    {
      label: getIn18Text('LIAOTIAN'),
      icon: (
        <Badge count={unreadCount.message} overflowCount={999} size="small" offset={[6, -3]}>
          <Im />
        </Badge>
      ),
      visible: false,
      click: handleIm,
    },
    {
      label: '更多',
      icon: <More />,
      visible: version !== 'WEBSITE',
      component: (
        <Dropdown trigger={['click']} overlay={<MoreMenu />} overlayClassName={style.moreMenu} onVisibleChange={vis => onVisibleChange(vis, 'notice')}>
          <Tooltip
            visible={showTip}
            placement="bottomRight"
            trigger="hover"
            overlayClassName={style.more}
            title={
              <div className={style.tip}>
                <span
                  style={{
                    display: 'block',
                  }}
                >
                  {'可点击此处继续查看已收起功能'}
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
        </Dropdown>
      ),
      click: handleMore,
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
        <Tooltip key="在线客服" overlayClassName={style.toolTipOver} placement="bottom" trigger="hover" title="在线客服">
          <WmKfEntry className={style.toolsIcon}>
            <Kf />
          </WmKfEntry>
        </Tooltip>
      ),
      click: () => {},
    },
    {
      label: '通知',
      icon: <Noti />,
      visible: version !== 'WEBSITE',
      component: (
        <Dropdown
          trigger={['click']}
          onVisibleChange={vis => {
            onVisibleChange(vis, 'notice');
            bus.emit('notiUpdate');
          }}
          destroyPopupOnHide={true}
          overlay={
            <NoticeCard
              hasDrag={false}
              className={style.noti}
              style={{
                width: '329px',
              }}
            />
            // <UserMenu visibleAdmin={visibleAdmin} handleClick={(aa:string) => console.log('Noti')} />
          }
          overlayClassName={style.overlay2}
        >
          {/* <div
            className={classnames(style.toolsIcon, {
              // [style.dotShow]: noticeList?.length > 0,
            })}
          >
            <Noti />
          </div> */}
          <div className={classnames(style.toolsIcon)}>
            <Badge count={unreadCountWorkbench} overflowCount={99} size="small" offset={[6, -3]}>
              <Noti />
            </Badge>
          </div>
        </Dropdown>
      ),
      click: handleNoti,
    },
  ];

  const rightMenu = useMemo(() => {
    let btnComp = null;
    if (isFreeVersionUser) {
      if (isAdmin) {
        btnComp = (
          <div className={style.backOldVersion} onClick={() => handleClickUpgrade('menu')}>
            <UpGrade />
            付费升级
          </div>
        );
      }
    } else {
      btnComp = (
        // <div ref={versionRef} className={style.backOldVersion} onClick={() => handleOldVersion(2)}>
        //   <OldVersion />
        //   {getIn18Text('FANHUIJIUBANWEB')}
        // </div>
        <div
          className={classNames(style.backOldVersion, style.noBorder)}
          onClick={() => {
            openHelpCenter();
            trackApi.track('waimao_knowledge_square', {
              action: 'guide_knowledge_square',
            });
          }}
        >
          <KnowledgeCenter />
          {getTransText('ZHISHIGUANGCHANG')}
        </div>
      );

      btnComp = <></>;
    }

    if (version === 'WEBSITE') {
      btnComp = <></>;
    }

    return (
      <>
        <UsageGuide className={classNames(style.usageGuide, style.toolsIcon)} />
        {version !== 'WEBSITE' && !isV2Version && (
          <div className={classNames(style.extension, style.toolsIcon)} onClick={handleClickExtension}>
            <Extension />
            插件
          </div>
        )}

        {btnComp}

        {tools
          .filter(t => t.visible)
          .map(i =>
            i.component ? (
              i.component
            ) : (
              <Tooltip key={i.label} overlayClassName={style.toolTipOver} placement="bottom" trigger="hover" title={i.label}>
                <div className={style.toolsIcon} onClick={i.click}>
                  {i.icon}
                </div>
              </Tooltip>
            )
          )}
      </>
    );
  }, [unreadCount, visibleAdmin, cachedTabs, isFreeVersionUser, isAdmin, showTip, noticeList, unreadCountWorkbench]);

  useEffect(() => {
    setUser(systemApi.getCurrentUser());
  }, []);

  const userAvatarEl = (
    <AvatarTag
      size={30}
      contactId={user?.contact?.contact.id}
      user={{
        name: user?.nickName,
        avatar: user?.avatar,
        email: user?.id,
        color: user?.contact?.contact?.color,
      }}
    />
  );

  const aliasPopover = (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: '#A8AAAD', marginBottom: 4 }}>{getIn18Text('ZHUZHANGHAO')}</div>
        <div>{user?.id}</div>
      </div>
      <div>
        <div style={{ color: '#A8AAAD', marginBottom: 4 }}>{getIn18Text('BIEMINGYOUXIANG')}</div>
        {mailList?.map(alias => (
          <div key={alias}>{alias}</div>
        ))}
      </div>
    </div>
  );

  const renderTitle = useMemo(() => {
    return (
      <div className={style.userInfo}>
        <div className={style.avatorOuter}>
          <AvatarTag
            size={48}
            showAccountSelected={true}
            user={{
              avatar: user?.avatar,
              name: user?.nickName,
              email: user?.loginAccount || user?.id,
            }}
          />
        </div>
        <div className={style.right}>
          <div className={style.name}>{user?.nickName}</div>
          <Tooltip placement="bottom" trigger="hover" title={mailList?.length > 0 ? aliasPopover : user?.id}>
            <div className={style.email}>
              <span className={style.des}>{user?.loginAccount || user?.id}</span>
              {mailList?.length > 0 && <ExpandRight />}
            </div>
          </Tooltip>
        </div>
        {/* <span className={style.name}>
        {user?.nickName}
      </span>
      <Tooltip placement="bottom" trigger="hover" title={mailList?.length > 0 ? aliasPopover : user?.id}>
        <div className={style.email}>
          <span className={style.des}>
            {user?.loginAccount || user?.id}
          </span>
          {mailList?.length > 0 && <ExpandRight />}
        </div>
      </Tooltip> */}
      </div>
    );
  }, [user, mailList]);

  const processMenu = (menuItem: TopMenuType) => {
    if (menuItem.path === '/unitable-crm' && productCode === ProductVersion.WEBSITE) {
      return {
        ...menuItem,
        children: menuItem.children.map(i => ({
          ...i,
          children: i.children
            .filter(i => ['uniTableCustomerManage', 'commodityManage', 'uniTableLeadManage'].includes(i.path))
            .map(i => {
              switch (i.path) {
                case 'uniTableCustomerManage':
                  return {
                    ...i,
                    children: i.children.filter(i => i.path !== '/custom/public/list'),
                  };
                case 'uniTableLeadManage':
                  return {
                    ...i,
                    children: i.children.filter(i => i.path === '/lead/list'),
                  };
                default:
                  return i;
              }
            }),
        })),
      };
    }

    if (menuItem.path === 'site' && version === 'WEBSITE') {
      let copy = _.cloneDeep(menuItem);
      copy.children[0].children = copy.children[0].children.map(menuItem => ({
        ...menuItem,
        children: menuItem.children?.filter(subItem2 => subItem2.label !== 'WEBSITE_TARGET_CONTACT'),
      }));

      return copy;
    }

    return menuItem;
  };

  const setTopMenuFn = useCallback(() => {
    setTopMenu(_topMenu => _topMenu.map(m => ({ ...m, open: m.path === curMenuRef.current })));
  }, []);

  const setTopMenuDebounceFn = useCallback(debounce(setTopMenuFn, 300), []);

  const onMenuVisibleChange = () => {
    const path = curMenuRef.current;
    if (path) {
      setTopMenuDebounceFn();
    } else {
      setTopMenuFn();
      setTopMenuDebounceFn.cancel();
    }
  };

  const menuItem = (item: TopMenuType) => {
    /**判断当前路由是否是untiable的hash路由 */
    const isUnitableRoute = isMatchUnitableCrmHash(location.hash);
    // /**当前是unitbale 路由，则其它item 设置成未选中 */
    const isSelected = item.path === activeTab && !isUnitableRoute;
    /**判断当前item 是unitable 菜单项 */
    const currentPathIsUnitableRoute = isMatchUnitableCrmHash(item.path);

    let isActive = false;

    if (v1v2 === 'v2') {
      if (currentPathIsUnitableRoute) {
        // 客户履约
        if (isMatchCustomerPerformanceRoute()) {
          isActive = item.path === '/unitable-crm/sell-order/list' && isUnitableRoute;
        } else {
          // 客户管理
          isActive = item.path === '/unitable-crm' && isUnitableRoute;
        }
      } else {
        isActive = item.path === activeTab && !isUnitableRoute;
      }
    } else {
      isActive = currentPathIsUnitableRoute ? isUnitableRoute : isSelected;
    }

    const classnames = classNames(style.topItem, {
      [style.topItemSelected]: isActive,
      // [style.topItemSelected]: currentPathIsUnitableRoute ? isUnitableRoute : isSelected,
      'web-entry-top-item': true,
      [style.topItemSite]: v1v2 === 'v2' && item.path === TopMenuPath.site,
    });

    if (item.path === TopMenuPath.mailbox) {
      return (
        <div
          className={classnames}
          onClick={() => {
            headerClickTracker(item.path as TopMenuPath, false);
            onTopItem({} as ChildrenType, 'mItem', item);
            setActiveTab(item.path);
          }}
        >
          <span
            className={classNames({
              [style.dotShow]: item.path === TopMenuPath.mailbox && unreadCount.mailbox,
            })}
          >
            {item.name}
          </span>
        </div>
      );
      // } else if (item.path === TopMenuPath.coop) {
      //   return (
      //     <div
      //       className={classnames}
      //       onMouseEnter={() => setCurMenu(item.path)}
      //       onMouseLeave={() => setCurMenu('')}
      //       onClick={() => {
      //         headerClickTracker(item.path as TopMenuPath, false);
      //         // 关闭下拉菜单
      //         setTopMenu(topMenu.map(m => ({ ...m, open: false })));

      //         onTopItem(item, 'mItem', item);
      //       }}
      //     >
      //       <Badge count={unreadCount.message} overflowCount={999} size="small" offset={[6, -3]}>
      //         <span>{item.name}</span>
      //       </Badge>
      //     </div>
      //   );
    } else {
      return (
        <div
          className={classnames}
          onMouseEnter={() => {
            curMenuRef.current = item.path;
          }}
          onMouseLeave={() => {
            curMenuRef.current = '';
          }}
          onClick={() => {
            headerClickTracker(item.path as TopMenuPath, false);
            // 关闭下拉菜单
            setTopMenu(topMenu.map(m => ({ ...m, open: false })));

            onTopItem(item, 'mItem', item);
          }}
        >
          <span
            className={classNames({
              [style.dotShow]: (item.path === TopMenuPath.coop && unreadCount.message) || (item.path === TopMenuPath.wa && unreadCount.wa),
              [style.spe]: item.path === TopMenuPath.wmData,
              [style['prBetaIcon']]: item.topIcon,
            })}
          >
            {
              // item.name === '站点管理' ? '我的站点': (
              //         item.name === '协同办公' ? '消息' : item.name
              // )
              item.name
            }
            {item.topIcon ? (
              <span
                className={classNames(style.betaIcon, {
                  [style.scaleIcon]: item.path === TopMenuPath.wmData,
                })}
              >
                {item.topIcon}
              </span>
            ) : null}
          </span>
        </div>
      );
    }
  };

  const jumpToLogin = (retry: number) => {
    setTimeout(() => {
      const logoutPage = httpApi.getLogoutPage();
      console.warn('jump to logout page ', logoutPage);
      if (systemApi.getCurrentUser() == undefined) {
        window.location.assign(logoutPage);
      } else if (retry > 0) {
        jumpToLogin(retry - 1);
      } else {
        window.localStorage.clear();
        window.location.assign(logoutPage);
      }
    }, 700);
  };

  // 退出登录
  const handleLogout = async () => {
    trackApi.track('pcMineCenter_click_logOut_mineCenterCard');
    await loginApi.doLogout(false, true);
    console.log('------ui will logout------');
    // await navigate('/login');
    jumpToLogin(3);
  };

  // 关于
  const handleAbout = () => {
    trackApi.track('pcMineCenter_click_aboutApplication_mineCenterCard');
    setAboutVisible();
  };

  // 管理后台
  const handleBackEnd = async () => {
    const redirectUrl = mailConfigApi.getWebMailHost(true) + '/admin/login.do?hl=zh_CN&uid=' + systemApi.getCurrentUser()?.id + '&app=admin&all_secure=1';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      // 应用内免登
      // systemApi.openNewWindow(url, true, undefined, undefined, true);
      // 跳转浏览器
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };

  const handleOldVersion = (type: number) => {
    // temporarily hardcoded
    trackApi.track(type == 1 ? 'waimao_web_new2old' : 'waimao_web_new2old_top', { action: 'back_to_the_old_version' });
    const currentUser = systemApi.getCurrentUser();
    if (currentUser?.sessionId) {
      window.open(`https://waimao-classic.office.163.com/jump/index.html?sid=${currentUser.sessionId}`, '_blank');
    }
  };

  const handleUserMenuClick = (type: string) => {
    switch (type) {
      case 'account':
        handleAccount();
        break;
      case 'enterpriseSetting':
        handleSetting();
        break;
      case 'systemTask':
        handleSystemTask();
        break;
      case 'noviceTask':
        handleNoviceTask();
        break;
      case 'logout':
        handleLogout();
        break;
      case 'about':
        handleAbout();
        break;
      case 'help':
        handleHelp();
        break;
      case 'feedback':
        handleFeedback();
        break;
      case 'feedbackUploadLog':
        handleUploadLog();
        break;
      case 'domainManage':
        handleDomainManage();
        break;
      case 'backend':
        handleBackEnd();
        break;
      case 'oldVersion':
        handleOldVersion(1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={style.navigate}>
      <div className={style.logo}>
        <Logo onClick={() => navigate(`#${TopMenuPath.worktable}?page=worktable`)} />
      </div>
      <div className={style.topMenu}>
        {topMenu.map((item: TopMenuType) => {
          if (item?.hidden || (item.path === TopMenuPath.worktable && !visibleWorktable)) {
            return null;
          }
          if (item.children?.[0]?.children.length === 0) {
            return null;
          }
          if (item.name === '站点管理' && version === 'WEBSITE') {
            item.topIcon = null;
          }
          if (version === 'WEBSITE' && WEBSITE_IGNORE_PATH.includes(item.path as TopMenuPath)) {
            return null;
          }
          const DropMenuView = isV2Version ? DropMenuV2 : DropMenu;
          return (
            <Dropdown
              trigger={['hover']}
              visible={item.open}
              onVisibleChange={() => onMenuVisibleChange()}
              overlayClassName={style.dropOverlay}
              overlay={
                !item.children || item.children?.length === 0 || item.children?.[0].show === false ? (
                  <></>
                ) : (
                  <DropMenuView
                    order={
                      {
                        // 'intelliMarketing': [0, 3, 1, 2]
                      }
                    }
                    onClose={() =>
                      setTopMenu(
                        topMenu.map(m => {
                          return { ...m, open: false };
                        })
                      )
                    }
                    dropMenuItem={processMenu(item)}
                    videoInfo={videoInfo}
                    onTopItem={target => {
                      headerClickTracker(item.path as TopMenuPath, true, item);
                      setActiveTab(item.path);
                      if (item.path.includes('/unitable-crm')) {
                        let targetPath = getUnitableCrmHash(target.path);
                        window.location.hash = targetPath;
                      } else {
                        onTopItem(item, 'dItem', target);
                      }

                      setTopMenu(
                        topMenu.map(m => {
                          return { ...m, open: false };
                        })
                      );
                    }}
                  />
                )
              }
            >
              {menuItem(item)}
            </Dropdown>
          );
        })}
      </div>
      <div className={style.menuRight}>
        {rightMenu}
        <Divider type="vertical" className={style.divider} />
        <Popover
          title={renderTitle}
          content={<UserMenu isNewAccount={isNewAccount} visibleAdmin={visibleAdmin} handleClick={handleUserMenuClick} />}
          trigger="hover"
          visible={visible}
          overlayInnerStyle={{ overflow: 'visible' }}
          overlayClassName={style.overlay}
          align={alignConfig}
          onVisibleChange={() => {
            setVisible(!visible);
          }}
        >
          <div className={style.avatar}>{userAvatarEl}</div>
        </Popover>
      </div>

      {ReactDom.createPortal(
        <About
          isElectron={false}
          isVisible={false}
          toggle={fc => {
            setAboutVisible = fc;
          }}
        />,
        document.body
      )}
    </div>
  );
};

export { HeaderFc };
