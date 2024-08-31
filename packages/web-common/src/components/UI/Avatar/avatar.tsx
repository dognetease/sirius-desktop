import { Popover, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import {
  AccountApi,
  anonymousFunction,
  apiHolder,
  apis,
  conf,
  DataTrackerApi,
  DataTransApi,
  EdmRoleApi,
  EventApi,
  isElectron,
  LoginApi,
  MailConfApi,
  ProductAuthApi,
  SystemApi,
  SystemEvent,
  UpgradeAppApi,
  User,
  inWindow,
  DataStoreApi,
} from 'api';
import { navigate } from 'gatsby';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { transAvatarSize } from '@web-common/utils/contact_util';
import styles from './avatar.module.scss';
import { ReactComponent as ExitSvg } from '@/images/icons/exit_icon.svg';
// import { ReactComponent as AboutSvg } from '../../../images/icons/aboud_icon.svg';
import { ReactComponent as ExpandSvg } from '@/images/icons/arrow-expand.svg';
import RightArrowIcon from '@/images/icons/arrow-right-1.svg';
import ExitIcon from '@/images/icons/exit.svg';
import About from '@/components/Electron/About';
import ProductVersion from '@/components/Electron/ProductVersion';
import FeedbackModal from '@/components/Electron/FeedBack/feedbackModal';
import SiriusMessage from '../Message/SiriusMessage';
import AvatarEditor from '../AvatarEditor/avatarEditor';
import { OnToggleParams } from '@/components/defines';
import AvatarTag from './avatarTag';
import { actions } from '@web-common/state/reducer/mailReducer';
import { actions as hollowOutGuideActions } from '@web-common/state/reducer/hollowOutGuideReducer';
import { getMenuSettingsAsync, getMyRolesAsync } from '@web-common/state/reducer/privilegeReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { feedbackUploadLog } from '@web-common/utils/uploadLog';
import UpgradeMeansModal from '@web-mail/components/UpgradeMeansModal/index';
import SuccessModal from '@web-mail/components/UpgradeMeansModal/successModal';
// import WaimaoCustomerService from '../WaimaoCustomerService';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { getTransText } from '@/components/util/translate';
import { handleBackEnd } from '@web-mail/util';
import { getIn18Text } from 'api';
import lodashGet from 'lodash/get';
import { setV1v2, useVersionCheck } from '@web-common/hooks/useVersion';
import { useMount } from 'ahooks';
import { TAB_STORAGE_KEY } from '@/layouts/Main/util';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const loginApi = apiHolder.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as UpgradeAppApi;
const inElectron = apiHolder.env.forElectron;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

// const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
type MenuItemType =
  | 'account'
  | 'taskCenter'
  | 'systemTask'
  | 'noviceTask'
  | 'setting'
  | 'about'
  | 'feedback'
  | 'update'
  | 'logout'
  | 'help'
  | 'mailSetting'
  | 'accountSetting'
  | 'productVersion'
  | 'backend'
  | 'rbac'
  | 'wmWebEntry'
  | 'wmUpdateLog'
  | 'wmOldWebEntry'
  | 'enterprisesetting'
  | 'lockApp'
  | 'knowledgeCenter';
interface IMenuItem {
  onCLick: () => void;
  title: string;
  subItems?: Array<any>;
  type: MenuItemType;
  productName?: string;
}
interface SubMenuItemProps {
  item: any;
}
interface SubMenuProps {
  subItems?: any[];
}
// let loginPage = loginPageBase;
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
const SubMenuItem: React.FC<SubMenuItemProps> = ({ item }) => {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { callback } = item;
    callback();
  };
  return (
    <div className={styles.subMenuItem} onClick={onClick}>
      {item.title}
    </div>
  );
};
const SubMenu: React.FC<SubMenuProps> = ({ subItems }) => (
  <div className={styles.subMenu}>{subItems && subItems.map(item => <SubMenuItem key={item.id} item={item} />)}</div>
);
const MenuItem: React.FC<IMenuItem> = ({ onCLick, title, subItems, type, productName }) => {
  const [showSubMenu, setShowSubMenu] = useState<boolean>(false);
  const mailSettingRemind = useAppSelector(state => state.hollowOutGuideReducer.avatarRemind.mailSettingRemind.isShow);
  const isMailSettingRemindShow = useMemo(() => {
    return mailSettingRemind && type === 'setting';
  }, [title, mailSettingRemind]);
  const onMouseEnter = () => {
    if (subItems && subItems?.length > 0) {
      setShowSubMenu(true);
    }
  };
  const onMouseLeave = () => {
    setShowSubMenu(false);
  };
  return (
    <div className={styles.contentItemWrap} onClick={onCLick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={styles.contentItem}>
        <i className={classnames(styles.itemIcon, styles[type])} />
        <span className={styles.itemLink}>
          <span>{title}</span>
          {type === 'productVersion' && <span className={styles.itemLinkRight}>{productName}</span>}
        </span>
        <span className={styles.itemRemind} hidden={!isMailSettingRemindShow} />
        <img className={styles.itemLinkArrow} src={type === 'backend' ? ExitIcon : RightArrowIcon} alt="arrow-right" />
        {showSubMenu && <SubMenu subItems={subItems} />}
      </div>
    </div>
  );
};
const AvatarContent: React.FC<{
  user: User;
  toggleVisible: () => void;
  mailList?: string[];
  visibleAdmin: boolean;
}> = ({ user, toggleVisible, mailList = [], visibleAdmin }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState<Boolean>(false);
  const [curAvatar, setCurAvatar] = useState<File | string>();
  const [productVisible, setProductVisible] = useState(false);
  const [upGradeVisible, setUpGradeVisible] = useState(false); // 升级留咨弹窗
  const [successVisible, setSuccessVisible] = useState(false); // 留咨成功
  // 联系人id 数字
  const contactId: string = useMemo(() => user?.contact?.contact.id || (user?.prop?.contactId as string) || '', [user]);
  // 联系人email
  const contactEmail = useMemo(() => user?.id || '', [user]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // const { setApplyGenerateHide } = actions;
  const { changeRemind } = hollowOutGuideActions;
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const isEdmAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role.roleType === 'ADMIN'));
  const rbacVisible = useAppSelector(state => state.privilegeReducer.visibleMenuLabels['PRIVILEGE'] === true);
  const version = useAppSelector(state => state.privilegeReducer.version);
  const isNovice = useAppSelector(state => state.noviceTaskReducer.isNovice);
  const dispatch = useAppDispatch();
  let v1v2 = useVersionCheck();
  const [showSwitch, setshowSwitch] = useState(true);
  const openHelpCenter = useOpenHelpCenter();

  // zqstodo: 尊享版管理员后续可能会与普通联系客服做区分
  const vipAdmin = false;
  const usageManual = () => {
    // 产品使用手册链接：
    const helperUrl = 'https://lingxi.office.163.com/help/';
    systemApi.openNewWindow(helperUrl);
    trackApi.track('pcMineCenter_click_usageManual');
  };
  const helperCenter = () => {
    // 企业邮帮助中心文档链接：
    const helperUrl =
      productVersionId === 'free'
        ? 'https://thoughts.teambition.com/sharespace/6364b71e0cf0ba004254a5e1/docs/6364b71b0cf0ba004254a5a6'
        : 'https://qiye.163.com/help/l-1.html';
    systemApi.openNewWindow(helperUrl);
    trackApi.track('pcMineCenter_click_helperCenter');
  };
  // 问题反馈 写邮件
  // const feedbackInMail = async () => {
  //     const hide = message.loading('反馈邮件生成中，请稍等...', 0);
  //     // 6秒后如果没有生成自动消失
  //     setTimeout(() => {
  //     hide();
  //     }, 6000);
  //     dispatch(setApplyGenerateHide(hide));
  //     mailApi.doWriteMailToWaimaoServer();
  // };
  const uploadLog = () => {
    const hide = message.loading(getIn18Text('RIZHISHANGCHUANZHONG，QING'), 0);
    //
    feedbackUploadLog().then(hide);
  };
  // 问题反馈（v.1.12版本取消反馈写邮件，改为反馈表单及日志发送）
  const feedback = async () => {
    // 原逻辑：
    // const hide = message.loading('反馈邮件生成中，请稍等...', 0);
    // // 6秒后如果没有生成自动消失
    // setTimeout(() => {
    //   hide();
    // }, 6000);
    // dispatch(setApplyGenerateHide(hide));
    // mailApi.doWriteMailToServer();
    // 新逻辑：
    if (systemApi.isElectron()) {
      systemApi.createWindow('feedback').then();
    } else {
      setShowFeedbackModal(true);
    }
  };
  // 联系客服
  // u 当前用户id，即邮箱地址
  // wp 未知
  // gid 客服分组id
  // robotShuntSwitch 为1时，访客会先由机器人接待，当转人工咨询时再分配给设置的分流客服
  // robotId 机器人id
  // templateId 自定义配置的对话框样式模板标识
  // qtype 常见问题模板id
  // welcomeTemplateId 欢迎语模板id
  // t encode的'灵犀办公桌面版'
  const contactService = () => {
    const mail = systemApi.getCurrentUser()?.id;
    const serviceUrl =
      (vipAdmin ? 'https://office.163.com/pcwentifankui' : 'https://qiye163.qiyukf.com/client') +
      '?k=abab5b9989e6f898240067f40874a096' +
      (mail ? '&u=' + mail : '') +
      '&wp=1' +
      '&gid=480959804' +
      '&robotShuntSwitch=1' +
      '&robotId=9091' +
      '&templateId=6603268' +
      '&qtype=' +
      (vipAdmin ? '4489138' : '4483243') +
      '&welcomeTemplateId=1151' +
      '&t=%E7%81%B5%E7%8A%80%E5%8A%9E%E5%85%AC%E6%A1%8C%E9%9D%A2%E7%89%88';
    systemApi.openNewWindow(serviceUrl);
    // kfApi.openUrl();
    // if (systemApi.isElectron()) {
    //   systemApi.createWindow('kf');
    // } else {
    //   const host = conf('host');
    //   const url = host + '/kf';
    //   systemApi.openNewWindow(url);
    // }
  };
  const closeFeedback = () => {
    setShowFeedbackModal(false);
  };
  const handleLogout = async () => {
    trackApi.track('pcMineCenter_click_logOut_mineCenterCard');
    await loginApi.doLogout(false, true);
    console.log('------ui will logout------');
    // await navigate('/login');
    jumpToLogin(3);
  };
  // const handleBackEnd = async () => {
  //   const redirectUrl = mailConfigApi.getWebMailHost(true) + '/admin/login.do?hl=zh_CN&uid=' + systemApi.getCurrentUser()?.id + '&app=admin&all_secure=1';
  //   // const url: string | undefined = systemApi.isElectron()
  //   //   ? mailConfigApi.getSettingUrl('', {url: redirectUrl})
  //   //   : await mailConfigApi.getWebSettingUrlInLocal('', {url: redirectUrl});
  //   const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
  //   if (url && url.length > 0) {
  //     // 应用内免登
  //     // systemApi.openNewWindow(url, true, undefined, undefined, true);
  //     // 跳转浏览器
  //     systemApi.openNewWindow(url, false, undefined, undefined, true);
  //   } else {
  //     Toast.warn({
  //       content: getIn18Text('WUFADAKAIZHI'),
  //       duration: 3,
  //     });
  //   }
  // };
  let tgFunc: anonymousFunction<boolean>;
  const handle = (toggle: anonymousFunction<boolean>) => {
    tgFunc = toggle;
    console.log('clicked about page');
  };
  const handleProduct = (visible: boolean) => {
    setProductVisible(visible);
  };
  const onUpgradeModel = async () => {
    // const isOverTime = await productAuthApi.isOverTimeByPubClue();
    // isOverTime ? setUpGradeVisible(true) : setSuccessVisible(true);
    // setProductVisible(false);

    // 点击立即升级，跳转管理后台版本服务页
    handleBackEnd('/valueAdd/versionService', 'lingxioffice');
  };
  // const handleAdmin = () => {
  //   systemApi.openNewWindow('https://qiye.163.com/login', false);
  // };
  const handleAbout = () => {
    trackApi.track('pcMineCenter_click_aboutApplication_mineCenterCard');
    if (inElectron && window.electronLib) {
      systemApi.createWindow('about').then();
    } else {
      tgFunc();
    }
  };
  const handleV1v2 = () => {
    roleApi
      .setMenuListNew({
        menuVersion: v1v2 === 'v2' ? 'OLD' : 'NEW',
      })
      .then(async () => {
        setV1v2(v1v2 === 'v2' ? 'v1' : 'v2');
        await dataStoreApi.del(TAB_STORAGE_KEY);
        // localStorage.setItem('v1v2', v1v2 === 'v2' ? 'v1' : 'v2');

        if (inElectron && window.electronLib) {
          window.electronLib.appManage.reLaunchApp();
        } else {
          window?.location?.reload();
        }
      });

    // localStorage?.setItem('v1v2', v1v2 === 'v2' ? 'v1' : 'v2');
  };
  const checkUpgrade = () => {
    // if (inElectron && window.electronLib) {
    //
    // }
    upgradeAppApi.doUpdateCheck({ forcePopup: true });
  };
  const handleClick = (type: MenuItemType) => {
    toggleVisible();
    switch (type) {
      case 'logout':
        handleLogout();
        break;
      case 'about':
        handleAbout();
        break;
      case 'mailSetting':
        dispatch(changeRemind('avatarRemind.mailSettingRemind'));
        navigate('/#setting', { state: { currentTab: 'mail' } });
        break;
      case 'accountSetting':
        navigate('/#setting', { state: { currentTab: 'account' } });
        break;
      case 'systemTask':
        trackApi.track('waimao_my_task', { action: 'headpic' });
        navigate('#systemTask?page=systemTask');
        break;
      case 'noviceTask':
        trackApi.track('waimao_newusertask', { action: 'headpic_newusertask' });
        navigate('#noviceTask?page=noviceTask');
        break;
      case 'productVersion':
        trackApi.track('pcMineCenter_version_click');
        handleProduct(true);
        break;
      case 'rbac':
        navigate('/#rbac');
        break;
      case 'backend':
        handleBackEnd();
        break;
      case 'wmWebEntry':
        trackApi.track('waimao_desktop_accessweb', { action: 'visit_the_Web_version' });
        systemApi.openNewWindow('https://waimao.office.163.com/', false);
        break;
      case 'wmOldWebEntry':
        const currentUser = systemApi.getCurrentUser();
        if (currentUser?.sessionId) {
          window.location.replace(`https://waimao.office.163.com/jump/index.html?sid=${currentUser.sessionId}`);
        } else {
          window.location.replace('https://waimao.office.163.com/');
        }
        break;
      case 'wmUpdateLog':
        openHelpCenter('/c/1598628690920579073.html');
        // systemApi.openNewWindow('https://waimao.163.com/helpCenter/c/1598628690920579073.html', false);
        break;
      case 'knowledgeCenter':
        openHelpCenter();
        // if (isElectron()) {
        //   navigate('/#helpCenter');
        // } else {
        //   window.open('https://waimao.163.com/knowledgeCenter', '_blank');
        // }
        trackApi.track('waimao_knowledge_square', { action: 'headpic_knowledge_square' });
        break;
      case 'lockApp':
        systemApi.lockApp();
        break;
      default:
        break;
    }
  };
  const aliasPopover = (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: '#A8AAAD', marginBottom: 4 }}>{getIn18Text('ZHUZHANGHAO')}</div>
        <div>{user.id}</div>
      </div>
      <div>
        <div style={{ color: '#A8AAAD', marginBottom: 4 }}>{getIn18Text('BIEMINGYOUXIANG')}</div>
        {mailList?.map(alias => (
          <div key={alias}>{alias}</div>
        ))}
      </div>
    </div>
  );
  const checkAvatar = () => {
    if (isCorpMail) {
      return;
    }
    if (showAvatarEditor) {
      setShowAvatarEditor(false);
      return;
    }
    // 没有头像 唤起选择框
    if (!user?.avatar) {
      avatarInputRef.current?.click();
    } else {
      const bigAvatar = transAvatarSize(user.avatar, 'big');
      console.log('bigAvatar', bigAvatar);
      setCurAvatar(bigAvatar);
      setShowAvatarEditor(true);
    }
  };
  const avatarInputChange = () => {
    const files = avatarInputRef?.current?.files;
    if (files && files[0]) {
      const maxSize = 15 * 1024 * 1024;
      if (files[0].size > maxSize) {
        SiriusMessage.warn({ content: getIn18Text('TUPIANDAXIAOBU') });
        return;
      }
      setCurAvatar(files[0]);
      setShowAvatarEditor(true);
    }
  };
  const hideAvatarEditor = () => {
    setShowAvatarEditor(false);
  };
  const {
    productVersionInfo: { productVersionName, productVersionId },
  } = useGetProductAuth();
  const helpSub = [
    { id: 'usageManual', title: getIn18Text('usageManual'), callback: usageManual },
    { id: 'questionApply', title: getIn18Text('WENTIFANKUI'), callback: feedback },
    // 尊享版管理员与其他区分，跳转不同地址
    { id: 'contactServer', title: vipAdmin ? getIn18Text('VIPKEFU') : getIn18Text('LIANXIKEFU'), callback: contactService },
  ];
  // //   { id: 'waimaoHelp', title: '帮助中心', callback: () => systemApi.handleJumpUrl(-1, 'https://waimao.163.com/helpCenter/index.html') },
  //   { id: 'questionApply', title: '问题反馈', callback: feedbackInMail },
  //   { id: 'uploadLog', title: '上传日志', callback: uploadLog },
  //   { id: 'contactServer', title: <WaimaoCustomerService />, callback: () => {} }
  // ];

  const visibleEnterpriseSetting = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['ORG_SETTINGS']));

  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));
  const taskCenterSubItems = [
    visibleSystemTask && { id: 'systemTask', title: getTransText('WODERENWU'), callback: () => handleClick('systemTask') },
    {
      id: 'noviceTask',
      title: (
        <>
          <span>{getTransText('XINSHOURENWU')}</span>
          {isNovice && <span className={styles.newAccount}>新用户</span>}
        </>
      ),
      callback: () => handleClick('noviceTask'),
    },
  ].filter(Boolean);
  if (systemApi.inWebMail() || productVersionId === 'free') {
    helpSub.unshift({ id: 'helperCenter', title: getIn18Text('BANGZHUZHONGXIN'), callback: helperCenter });
  }
  if (productVersionId === 'free') {
    // 免费版屏蔽入口
    const contactServerIdx = helpSub.findIndex(item => item?.id === 'contactServer');
    if (contactServerIdx !== -1) {
      helpSub.splice(contactServerIdx, 1);
    }
  }
  const isEn = inWindow() ? window.systemLang === 'en' : false;

  useMount(() => {
    process.env.BUILD_ISEDM &&
      roleApi.getMenuSwitch().then(res => {
        setshowSwitch(!!res?.menuVersionWithoutOldSwitch);
      });
  });

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.contentTitle}>
        <div className={styles.avatarNameWarp}>
          <div className={styles.avatar}>
            <AvatarTag
              size={40}
              contactId={user.contact?.contact.id}
              user={{
                name: user?.nickName,
                avatar: user?.avatar,
                color: user?.contact?.contact?.color,
                email: user?.id,
              }}
              cameraStyle={{ width: 24, height: 24 }}
              hasHover={!isCorpMail}
              onClick={checkAvatar}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/gif, image/jpeg, image/jpg, image/png"
              className={styles.avatarInput}
              onClick={e => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={avatarInputChange}
            />
          </div>
          <div className={`${styles.name} sirius-ellipsis-text`}>
            <span>{user?.contact?.contact.contactName || user.nickName || user.id || ''}</span>
          </div>
        </div>
        <div className={styles.accountName}>
          <Tooltip placement="right" trigger="hover" overlayInnerStyle={{ padding: 17 }} title={mailList?.length > 0 ? aliasPopover : user.id}>
            <span style={{ maxWidth: '90%', cursor: 'pointer' }} className="sirius-ellipsis-text">
              {user.loginAccount || user.id}
            </span>
            {mailList?.length > 0 && <ExpandSvg style={{ cursor: 'pointer', marginLeft: 4 }} />}
          </Tooltip>
        </div>
        <div className={styles.company}>
          <Tooltip title={user.company} placement="right" trigger="hover">
            {user.company}
          </Tooltip>
        </div>
      </div>
      <div className={styles.contentMenu}>
        <MenuItem type="account" onCLick={() => handleClick('accountSetting')} title={getIn18Text('ZHANGHAOYUANQUAN')} />
        <MenuItem type="setting" onCLick={() => handleClick('mailSetting')} title={getIn18Text('YOUXIANGSHEZHI')} />
        {process.env.BUILD_ISEDM && visibleEnterpriseSetting && version !== 'WEBSITE' && (
          <MenuItem
            type="enterprisesetting"
            onCLick={() => {
              // 如果把 isWaimaoV2 加入到依赖项，那么后面所有的 useCallback, useMemo 都要加。此处先独立判断
              const isWaimaoV2 = process.env.BUILD_ISEDM && window.localStorage.getItem('v1v2') === 'v2';
              if (isWaimaoV2) trackApi.track('client_1_enterprise_setup', { version: 1 });
              navigate('#enterpriseSetting');
            }}
            title={'企业设置'}
          />
        )}
        {process.env.BUILD_ISEDM && isEdmAdmin && rbacVisible && <MenuItem type="rbac" onCLick={() => handleClick('rbac')} title={getIn18Text('QUANXIANSHEZHI')} />}
        {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && (
          <MenuItem type="knowledgeCenter" onCLick={() => handleClick('knowledgeCenter')} title={getTransText('ZHISHIGUANGCHANG')} />
        )}
        {process.env.BUILD_ISEDM && !!taskCenterSubItems.length && version !== 'WEBSITE' && (
          <MenuItem type="taskCenter" title={getTransText('RENWUZHONGXIN')} onCLick={() => {}} subItems={taskCenterSubItems} />
        )}
        {
          // 外贸、corpMail没有服务套餐
          process.env.BUILD_ISEDM || isCorpMail || isEn ? (
            ''
          ) : (
            <MenuItem type="productVersion" onCLick={() => handleClick('productVersion')} title={getIn18Text('FUWUTAOCAN')} productName={productVersionName} />
          )
        }

        {process.env.BUILD_ISEDM ? (
          <MenuItem onCLick={uploadLog} type="feedback" title={getIn18Text('WENTIFANKUI')} />
        ) : (
          <MenuItem onCLick={() => {}} type="feedback" title={getIn18Text('BANGZHUYUFANKUI')} subItems={helpSub} />
        )}
        {process.env.BUILD_ISELECTRON && (
          <MenuItem
            type="lockApp"
            onCLick={() => {
              handleClick('lockApp');
            }}
            title={getIn18Text('LOCK_APP')}
          ></MenuItem>
        )}
        {process.env.BUILD_ISEDM && process.env.BUILD_ISELECTRON && (
          <MenuItem onCLick={() => handleClick('wmWebEntry')} type="wmWebEntry" title={getIn18Text('WANGYEBANWAIMAOTONG')}></MenuItem>
        )}
        {process.env.BUILD_ISEDM && !inElectron && (
          <MenuItem onCLick={() => handleClick('wmOldWebEntry')} type="wmOldWebEntry" title={getIn18Text('FANGWENXINBAN')}></MenuItem>
        )}
        {process.env.BUILD_ISEDM && <MenuItem onCLick={() => handleClick('wmUpdateLog')} type="wmUpdateLog" title={getIn18Text('UpdateLog')}></MenuItem>}
        {inElectron && <MenuItem type="update" onCLick={() => checkUpgrade()} title={getIn18Text('JIANCHAGENGXIN')} />}
        <MenuItem type="about" onCLick={() => handleAbout()} title={getIn18Text('GUANYU')} />
        {process.env.BUILD_ISEDM && version !== 'WEBSITE' && version !== 'FREE' && showSwitch && (
          <MenuItem type="about" onCLick={() => handleV1v2()} title={v1v2 === 'v2' ? getIn18Text('QIEHUIJIUBAN') : getIn18Text('QIEHUIXINBAN')} />
        )}
        {/* {visibleAdmin && isFreeVersion && <MenuItem type="about" onCLick={() => handleAdmin()} title="管理后台入口" />} */}
        {visibleAdmin && !isCorpMail && <MenuItem type="backend" onCLick={() => handleClick('backend')} title={getIn18Text('GUANLIHOUTAI')} />}

        {(!inElectron || conf('stage') === 'local') && (
          <div className={styles.contentItemWrap} onClick={handleLogout}>
            <div className={styles.contentItem}>
              <span className={styles.icon}>
                <ExitSvg />
              </span>
              <span className={styles.itemLink}>
                <span>{getIn18Text('TUICHUDENGLU')}</span>
              </span>
            </div>
          </div>
        )}
        {/* {isCorpMail && true ? null : <div className={styles.contentItemWrap} onClick={() => handleClick('backEnd')}>
          <div className={styles.contentItem}>
            <span className={styles.icon}>
              <ExitSvg />
            </span>
            <span className={styles.itemLink}>
              <span>管理后台</span>
            </span>
          </div>
        </div>} */}
      </div>
      <About isElectron={false} isVisible={false} toggle={handle} />
      <FeedbackModal visible={showFeedbackModal} cancel={() => closeFeedback()} />
      {showAvatarEditor && curAvatar && (
        <AvatarEditor
          avatar={curAvatar}
          contactId={contactId}
          contactEmail={contactEmail}
          showResetEntry
          onImageError={() => {
            const midAvatar = transAvatarSize(user.avatar, 'middle');
            setCurAvatar(midAvatar);
          }}
          hideAvatarEditor={hideAvatarEditor}
        />
      )}
      <ProductVersion
        productVisible={productVisible}
        cancelMed={() => {
          handleProduct(false);
        }}
        onUpgradeModel={onUpgradeModel}
      />
      <UpgradeMeansModal
        visible={upGradeVisible}
        onClose={showSuccess => {
          showSuccess && setSuccessVisible(true);
          setUpGradeVisible(false);
        }}
      />
      <SuccessModal
        visible={successVisible}
        onClose={() => {
          setSuccessVisible(false);
        }}
      />
    </div>
  );
};
/**
 * 功能包括悬浮窗口展示个人信息、退出等
 */
export interface AvatarProps {
  user?: User;
  notifyBlocking: (flag: boolean) => void;
  activeKey: string;
}
const Avatar: React.FC<AvatarProps> = ({ notifyBlocking }) => {
  // const eventApi:EventApi=apiHolder.api.getEventApi();
  // const [isModalVisible, setModalVisible] = useState<boolean>(false);
  // 邹明亮注释 好像没用到 出了问题解开注释
  // const [showMailSetting, setShowMailSetting] = useState<boolean>(false);
  // const [showAccountSetting, setShowAccountSetting] = useState<boolean>(false);
  const [blockingFunction, setBlockingFunction] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>();
  const [mailList, setMailList] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [visibleAdmin, setVisibleAdmin] = useState(false);
  const dispatch = useAppDispatch();
  // const [needMailUpdate,setNeedMailUpdate]=useState<boolean>(false);
  useEffect(() => {
    if (visible) {
      accountApi
        .doGetMailAliasAccountListV2({ noMain: true })
        .then(res => setMailList(res?.map(item => item?.id)))
        .catch(() => {
          setMailList([]);
        });
      accountApi.doGetAccountIsAdmin().then(res => setVisibleAdmin(res));
    }
  }, [visible]);
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('loginBlock', {
      func: ev => {
        setBlockingFunction(ev.eventData);
        notifyBlocking && notifyBlocking(ev.eventData);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('loginBlock', eid);
    };
  });
  const toggleVisible = () => {
    setVisible(false);
  };
  const showBlockingMsg = () => {
    SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
  };
  const handleSetting = (config: OnToggleParams) => {
    if (!config.from) {
      if (config.type === 'block') {
        setBlockingFunction(true);
        if (notifyBlocking) {
          notifyBlocking(true);
        }
      } else if (config.type === 'unblock') {
        setBlockingFunction(false);
        if (notifyBlocking) {
          notifyBlocking(false);
        }
      }
    } else if (config.from === 'menu' || config.from === 'msg' || config.from === 'avatar') {
      if (!blockingFunction) {
        if (config.type === 'account') {
          trackApi.track('pcMineCenter_click_accountManagement_mineCenterCard');
          // setShowAccountSetting(true);
          // setShowMailSetting(false);
        } else if (config.type === 'mail') {
          trackApi.track('pcMineCenter_click_mailSet_mineCenterCard');
          // setShowAccountSetting(false);
          // setShowMailSetting(true);
        }
      } else {
        showBlockingMsg();
      }
    }
    setVisible(false);
  };
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('settingShow', {
      func: (ev: SystemEvent) => {
        if (ev && ev.eventData && ev.eventData.action === 'show' && ev.eventData.type) {
          handleSetting({ type: ev.eventData.type, from: 'msg' });
        } else if (ev && ev.eventData && ev.eventData.action === 'hide') {
          // setShowAccountSetting(false);
          // setShowMailSetting(false);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('settingShow', eid);
    };
  }, []);
  useEffect(() => {
    setUser(systemApi.getCurrentUser());
  }, [lodashGet(systemApi.getCurrentUser(), 'nickName', ''), lodashGet(systemApi.getCurrentUser(), 'avatar', '')]);

  useMsgRenderCallback('updateUserInfo', () => {
    setUser(systemApi.getCurrentUser());
  });
  useEffect(() => {
    if (visible) {
      dispatch(getMyRolesAsync());
      dispatch(getMenuSettingsAsync());
    }
  }, [visible]);
  const userAvatarEl = (
    <div
      className={styles.avatarWrapper}
      onClick={() => {
        blockingFunction && showBlockingMsg();
      }}
    >
      <AvatarTag
        size={40}
        contactId={user?.contact?.contact.id}
        user={{
          name: user?.nickName,
          avatar: user?.avatar,
          email: user?.id,
          color: user?.contact?.contact?.color,
        }}
      />
    </div>
  );
  return (
    <div>
      {blockingFunction ? (
        userAvatarEl
      ) : (
        <Popover
          overlayStyle={{
            zIndex: 1000,
          }}
          overlayClassName={styles.avatarPopoverWrap}
          className="sirius-no-drag"
          visible={visible}
          trigger="click"
          onVisibleChange={() => {
            setVisible(!visible);
            trackApi.track('pcMineCenter_click_headPortrait_leftNavigationBar');
          }}
          content={user ? <AvatarContent mailList={mailList} visibleAdmin={visibleAdmin} toggleVisible={toggleVisible} user={user} /> : null}
          placement="rightTop"
        >
          {userAvatarEl}
        </Popover>
      )}
    </div>
  );
};
export default Avatar;
