import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import ReactDom from 'react-dom';
import { navigate } from 'gatsby';
import { Badge, Divider, Dropdown, Popover, Tooltip, message } from 'antd';
import { SystemApi, apiHolder, User, apis, AccountApi, MailConfApi, MailApi, DataTrackerApi, LoginApi, DataTransApi, anonymousFunction } from 'api';
import { ReactComponent as Logo } from '@web-common/images/logo_pro.svg';
import { ReactComponent as Setting } from '@web-common/images/icons/setting.svg';
import { ReactComponent as Im } from '@web-common/images/icons/im.svg';
import { ChildrenType, packedData, topMenu as topM } from '../config/topMenu';
import type { AlignType } from 'rc-trigger/lib/interface';
import DropMenu from './views/dropMenu';
import { ReactComponent as ExpandRight } from '@web-common/images/icons/expand_right.svg';
import { feedbackUploadLog } from '@web-common/utils/uploadLog';
import UserMenu from './views/userMenu';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { actions } from '@web-common/state/reducer/mailReducer';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { ReadCountActions, WebEntryWmActions } from '@web-common/state/reducer';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { speUrl, TopMenuPath, TopMenuType } from './../config/constant';
import { getIsSomeMenuVisbleSelector, getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import classNames from 'classnames';
import { shallowEqual } from 'react-redux';
import style from './headerfc.module.scss';
import { GlobalContext } from './globalProvider';
import { getIn18Text } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const loginApi = apiHolder.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;

export type SourceType = 'mItem' | 'dItem';
interface HeaderProps {
  onTopItem: (item: ChildrenType, source: SourceType, target?: ChildrenType) => void;
  onChange: (arg: string) => void;
  moduleName: string;
  visibleAdmin: boolean;
}

const alignConfig = {
  points: ['tr', 'br'], // align top left point of sourceNode with top right point of targetNode
  offset: [0, 9], // the offset sourceNode by 0 in x and 9px in y,
  targetOffset: [-13, 0], // the offset targetNode by -13px of targetNode width in x and 0 of targetNode height in y,
  overflow: { adjustX: true, adjustY: false }, // auto adjust position when sourceNode is overflowed
} as AlignType;

const headerClickTracker = (path: TopMenuPath, isChild = false) => {
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
};
type IType = {
  [key: string]: number[];
};
const HeaderFc: React.FC<any> = (props: HeaderProps) => {
  const { onTopItem, onChange, moduleName, visibleAdmin } = props;
  const [activeTab, setActiveTab] = useState('');
  const [user, setUser] = useState<User | undefined>();
  const [mailList, setMailList] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  const unReadCountActions = useActions(ReadCountActions);
  const [topMenu, setTopMenu] = useState<TopMenuType[]>([]);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  let setAboutVisible = () => {};
  const { setApplyGenerateHide } = actions;
  const [curMenu, setCurMenu] = useState('');
  const { updateTopMenu } = useActions(WebEntryWmActions);
  const visibleWorktable = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WORKBENCH']));
  const topItemRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<TopMenuType[]>([]);
  const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  const { state, dispatch } = useContext(GlobalContext);
  const openHelpCenter = useOpenHelpCenter();

  console.log('xxxstate', state);

  useEffect(() => {
    console.log('xxxtopM', topM);
    setTopMenu(topM);
  }, [topM]);

  const privMenu = (menu: TopMenuType[]) => {
    return menu.filter(f => {
      const res = (f.path === TopMenuPath.worktable && visibleWorktable) || f.children?.[0]?.children?.length || f.path === TopMenuPath.mailbox;
      return res;
    });
  };

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
    name: 'navbarNotificationChangeOb',
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
    openHelpCenter();
    // systemApi.handleJumpUrl(-1, 'https://waimao.163.com/helpCenter/index.html');
  };

  const handleUploadLog = () => {
    const hide = message.loading('日志上传中，请稍等', 0);
    //
    feedbackUploadLog().then(hide);
  };

  const tools = [
    // {
    //   label: getIn18Text('XIAZAIKEHUDUAN'),
    //   icon: <Download />,
    //   visible: true,
    //   click: handleDownLoad
    // },
    {
      label: getIn18Text('QIYESHEZHIWEB'),
      icon: <Setting />,
      visible: visibleAdmin,
      click: handleSetting,
    },
    {
      label: getIn18Text('LIAOTIAN'),
      icon: (
        <Badge count={unreadCount.message} overflowCount={999} size="small" offset={[6, -3]}>
          <Im />
        </Badge>
      ),
      visible: true,
      click: handleIm,
    },
  ];

  // const rightMenu = useMemo(() => {
  //   let btnComp = null;
  //   if (isFreeVersionUser) {
  //     if (isAdmin) {
  //       btnComp = (
  //         <div className={style.backOldVersion} onClick={() => handleClickUpgrade('menu')}>
  //           <UpGrade />
  //           付费升级
  //         </div>
  //       );
  //     }
  //   } else {
  //     btnComp = (
  //       // <div ref={versionRef} className={style.backOldVersion} onClick={() => handleOldVersion(2)}>
  //       //   <OldVersion />
  //       //   {getIn18Text('FANHUIJIUBANWEB')}
  //       // </div>
  //       <div
  //         className={classNames(style.backOldVersion, style.noBorder)}
  //         onClick={() => {
  //         goKnowledgeCenter();
  //         trackApi.track('waimao_knowledge_square', {
  //           action: 'guide_knowledge_square'
  //         });

  //         }}
  //       >
  //         <KnowledgeCenter />
  //         知识广场
  //       </div>
  //     )
  //   }
  //   return <>
  //     {btnComp}

  //     {tools.filter(t => t.visible).map(i =>
  //       <Tooltip key={i.label} overlayClassName={style.toolTipOver} placement="bottom" trigger="hover" title={i.label}>
  //         <div className={style.toolsIcon} onClick={i.click}>
  //           {i.icon}
  //         </div>
  //       </Tooltip>
  //     )}
  //   </>
  // }, [unreadCount, visibleAdmin, cachedTabs, isFreeVersionUser, isAdmin])

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
        <span className={style.name}>{user?.nickName}</span>
        <Tooltip placement="bottom" trigger="hover" title={mailList?.length > 0 ? aliasPopover : user?.id}>
          <div className={style.email}>
            <span className={style.des}>{user?.loginAccount || user?.id}</span>
            {mailList?.length > 0 && <ExpandRight />}
          </div>
        </Tooltip>
      </div>
    );
  }, [user, mailList]);

  const menuItem = (item: TopMenuType) => {
    const classnames = classNames(style.topItem, {
      [style.topItemSelected]: item.path === activeTab,
      'web-entry-top-item': true,
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
    } else {
      return (
        <div
          className={classnames}
          onMouseEnter={() => setCurMenu(item.path)}
          onMouseLeave={() => setCurMenu('')}
          onClick={() => {
            headerClickTracker(item.path as TopMenuPath, false);
            // 关闭下拉菜单
            setTopMenu(topMenu.map(m => ({ ...m, open: false })));
            onTopItem(item, 'mItem', item);
          }}
        >
          <span
            className={classNames({
              [style.dotShow]: item.path === TopMenuPath.order && state.hasFollow,
              [style.spe]: item.path === TopMenuPath.wmData,
              [style['prBetaIcon']]: item.topIcon,
            })}
          >
            {item.name}
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
      // case 'feedback':
      //   handleFeedback();
      //   break;
      case 'feedbackUploadLog':
        handleUploadLog();
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
        <Logo onClick={() => navigate(`#${TopMenuPath.price}?page=validPrice`)} />
      </div>
      <div className={style.topMenu} ref={topItemRef}>
        {topMenu.map((item: TopMenuType) => {
          if (item?.hidden || (item.path === TopMenuPath.worktable && !visibleWorktable)) {
            return null;
          }
          if (item.children?.[0]?.children.length === 0) {
            return null;
          }
          return (
            <Dropdown
              trigger={['hover']}
              visible={item.open}
              onVisibleChange={(v: boolean) => {
                setTopMenu(
                  topMenu.map(m => {
                    return { ...m, open: m.path === curMenu };
                  })
                );
              }}
              overlayClassName={style.dropOverlay}
              overlay={
                item.children?.length === 0 || item.children?.[0].show === false ? (
                  <></>
                ) : (
                  <DropMenu
                    order={
                      {
                        // 'intelliMarketing': [0, 3, 1, 2]
                      }
                    }
                    dropMenuItem={item}
                    onTopItem={target => {
                      headerClickTracker(item.path as TopMenuPath, true);
                      setActiveTab(item.path);
                      onTopItem(item, 'dItem', target);
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
        {/* {rightMenu} */}
        {/* <Divider type="vertical" className={style.divider} /> */}
        <Popover
          title={renderTitle}
          content={<UserMenu handleClick={handleUserMenuClick} />}
          trigger="hover"
          visible={visible}
          overlayClassName={style.overlay}
          align={alignConfig}
          onVisibleChange={() => {
            setVisible(!visible);
          }}
        >
          <div className={style.avatar}>{userAvatarEl}</div>
        </Popover>
      </div>
    </div>
  );
};

export { HeaderFc };
