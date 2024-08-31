import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Tooltip, Divider, Dropdown, Menu, Radio, Image } from 'antd';
import {
  apiHolder,
  apis,
  SystemApi,
  User,
  AccountApi,
  DataTrackerApi,
  LoginApi,
  DataTransApi,
  inWindow,
  WebMailApi,
  MailConfApi,
  conf,
  // Lang,
  // DEFAULT_LANG,
  getIn18Text,
  ContactApi,
  ISharedAccount,
  ContactModel,
} from 'api';
import classnames from 'classnames';
import { navigate } from 'gatsby';
import { transAvatarSize } from '@web-common/utils/contact_util';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { OldVersionModal } from '@web-mail/components/OldVersionEntry/OldVersionModal';
import ToolbarDownloadModal from '@web-common/components/ToolbarDownloadModal/toolbarDownloadModal';
import AvatarEditor from '@web-common/components/UI/AvatarEditor/avatarEditor';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { WelcomeModal } from '@web-common/components/UI/welcome_guide/welcome_guide';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import {
  actions as LoginActions,
  doSharedAccountAsync,
  doSwitchSharedAccountAsync,
  doSwitchAccountAsync,
  doListAccountsAsync,
} from '@web-common/state/reducer/loginReducer';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
// import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import variables from '@web-common/styles/export.module.scss';
import FeedbackModal from '@/components/Electron/FeedBack/feedbackModal';
import { ReactComponent as IconSetting } from '@/images/icons/account_setting_white.svg';
import { ReactComponent as IconComputer } from '@/images/icons/toolbar_computer.svg';
import { ReactComponent as IconSelfQuery } from '@/images/icons/self-query.svg';
import { ReactComponent as IconVip } from '@/images/icons/toolbar_vip.svg';
import { ReactComponent as IconTriangleDown } from '@/images/icons/toolbar_triangle_down.svg';
import { ReactComponent as AddIcon } from '@/images/icons/im/add-icon.svg';
import style from './webToolbar.module.scss';
import LangSwitchMenus from './langMenus';
import { debounce, cloneDeep } from 'lodash';

const isEnLang = inWindow() && window.systemLang === 'en';
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const webmailApi = apiHolder.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const storeApi = apiHolder.api.getDataStoreApi();
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const loginApi = apiHolder.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;
const eventApi = apiHolder.api.getEventApi();

// let langTemp: Lang = DEFAULT_LANG;

const WebToolbar: React.FC = () => {
  const [showAvatarEditor, setShowAvatarEditor] = useState<Boolean>(false);
  const [curAvatar, setCurAvatar] = useState<File | string>();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | undefined>();
  const [mailList, setMailList] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [backOldVisible, setBackOldVisible] = useState<boolean>(false);
  const [isSharedAccount, setIsSharedAccount] = useState<boolean>(false);
  // eslint-disable-next-line max-len
  const [defaultLogo, setDefaultLogo] = useState<string>(
    (systemApi.getCurrentUser()?.prop?.domainLogo as string) || 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/02/d795092a0a4a4285af86924eecd723ee.png'
  );
  const dispatch = useAppDispatch();
  const { sharedAccount, accountList, switchingAccount } = useAppSelector(state => state.loginReducer);

  const { localList } = accountList;
  const { setLoginModalData } = useActions(LoginActions); // 设置登录弹出框
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const [showEntry, setShowEntry] = useState(false); // 是否展示返回旧版入口
  const [showActivity, setShowActivity] = useState(false); // 是否展示活动入口
  const isWebmail = inWindow() && conf('profile') ? conf('profile').toString().includes('webmail') : false;
  const [downloadVisible, setDownloadVisible] = useState(false); // 是否展示下载弹窗
  const [visibleAdmin, setVisibleAdmin] = useState(false);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const vipAdmin = false;
  const [event, setEvent] = useState<CustomEvent | null>(null);
  // 联系人id 数字
  const contactId: string = useMemo(() => user?.contact?.contact.id || (user?.prop?.contactId as string) || '', [user]);
  // 联系人email
  const contactEmail = useMemo(() => user?.id || '', [user]);
  const paidGuideModal = useNiceModal('paidGuide');
  const SHOW_ACTIVITY = 'show_activity';
  const WELCOME_GUIDE = 'welcome_guide';
  const closeFeedback = () => {
    setShowFeedbackModal(false);
  };

  const getStore = (key: string): boolean => {
    const result = storeApi.getSync(key);
    if (result.suc && result.data === 'true') {
      return true;
    }
    return false;
  };
  const handleBackEnd = async () => {
    const redirectUrl = mailConfigApi.getNewWebMailHost() + '/admin/login.do?hl=zh_CN&uid=' + systemApi.getCurrentUser()?.id + '&app=admin&all_secure=1';
    // const url: string | undefined = systemApi.isElectron()
    //   ? mailConfigApi.getSettingUrl('', {url: redirectUrl})
    //   : await mailConfigApi.getWebSettingUrlInLocal('', {url: redirectUrl});
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
  const checkIsSharedAccount = () => {
    accountApi.getIsSharedAccountAsync().then(res => {
      setIsSharedAccount(res);
    });
  };

  useEffect(() => {
    if (inWindow()) {
      setEvent(new CustomEvent(SHOW_ACTIVITY));
      const state = webmailApi.getState();
      if (state.show_old != null && +(state.show_old as string) === 1) {
        setShowEntry(true);
      }

      const { startTime, endTime } = webmailApi.getTimeRange().yun_bi_ji;
      const time = Date.now();
      if (!getStore(WELCOME_GUIDE) && time > startTime && time < endTime && isWebmail) {
        setShowActivity(true);
      }
      dispatch(doSharedAccountAsync());
      dispatch(doListAccountsAsync(false));
      checkIsSharedAccount();
    }
    const eid = eventApi.registerSysEventObserver('storeUserChangeEvent', {
      func: () => {
        const logo = systemApi.getCurrentUser()?.prop?.domainLogo;
        if (logo !== defaultLogo) {
          setDefaultLogo(logo as string);
        }

        // setUser(systemApi.getCurrentUser());
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('storeUserChangeEvent', eid);
    };
  }, []);

  useEffect(() => {
    if (!process.env.BUILD_ISEDM && productVersionId === 'free') {
      trackApi.track('web_show_freeup', { type: visibleAdmin ? '管理员' : '成员' });
    }
  }, [productVersionId]);

  const jumpToLogin = (retry: number) => {
    setTimeout(() => {
      const logoutPage = httpApi.getLogoutPage();
      console.warn('jump to logout page ', logoutPage);
      if (systemApi.getCurrentUser() === undefined) {
        window.location.assign(logoutPage);
      } else if (retry > 0) {
        jumpToLogin(retry - 1);
      } else {
        window.localStorage.clear();
        window.location.assign(logoutPage);
      }
    }, 700);
  };
  const logout = async () => {
    trackApi.track('pcMineCenter_click_logOut_mineCenterCard');
    await loginApi.doLogout(false, true);
    console.log('------ui will logout------');
    // await navigate('/login');
    jumpToLogin(3);
  };
  const backToOldVersion = () => {
    setBackOldVisible(true);
  };
  const joinVip = () => {
    if (event != null) {
      window.dispatchEvent(event);
    }
  };
  const usageManual = () => {
    // 产品使用手册链接：
    const helperUrl = 'https://lingxi.office.163.com/help/';
    systemApi.openNewWindow(helperUrl);
    trackApi.track('pcMineCenter_click_usageManual');
  };
  const helperCenter = () => {
    // 企业邮帮助中心文档链接：
    // 在灵犀Web端，针对【邮箱版本为灵犀免费版的用户】：
    const helperUrl =
      productVersionId === 'free'
        ? 'https://thoughts.teambition.com/sharespace/6364b71e0cf0ba004254a5e1/docs/6364b71b0cf0ba004254a5a6'
        : 'https://qiye.163.com/help/l-1.html';
    systemApi.openNewWindow(helperUrl);
    trackApi.track('pcMineCenter_click_helperCenter');
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
  // eslint-disable-next-line no-nested-ternary
  const kefu = vipAdmin ? getIn18Text('VIPKEFU') : getIn18Text('LIANXIKEFU');

  const menu = (
    <Menu className={style.toobarHelpMenu}>
      <Menu.Item
        key="usageManual"
        onClick={({ domEvent }) => {
          domEvent.stopPropagation();
          usageManual();
        }}
      >
        {getIn18Text('usageManual')}
      </Menu.Item>
      <Menu.Item
        key="questionApply"
        onClick={({ domEvent }) => {
          domEvent.stopPropagation();
          feedback();
        }}
      >
        {getIn18Text('WENTIFANKUI')}
      </Menu.Item>
      {productVersionId !== 'free' && (
        <Menu.Item
          key="contactServer"
          onClick={({ domEvent }) => {
            domEvent.stopPropagation();
            contactService();
          }}
        >
          {kefu}
        </Menu.Item>
      )}
      {systemApi.inWebMail() && (
        <Menu.Item
          key="questionApply"
          onClick={({ domEvent }) => {
            domEvent.stopPropagation();
            helperCenter();
          }}
        >
          {getIn18Text('BANGZHUZHONGXIN')}
        </Menu.Item>
      )}
    </Menu>
  );

  useMsgRenderCallback('updateUserInfo', () => {
    setUser(systemApi.getCurrentUser());
  });
  // dd
  useEffect(() => {
    accountApi
      .doGetMailAliasAccountListV2({ noMain: true })
      .then(res => setMailList(res?.map(item => item?.id)))
      .catch(() => {
        setMailList([]);
      });
    accountApi.doGetAccountIsAdmin().then(res => setVisibleAdmin(res));
    setUser(systemApi.getCurrentUser());
  }, []);
  // 切换账号
  const handleMenuClick = (e: any) => {
    e?.stopPropagation();
    e?.preventDefault();
    // 原逻辑，仅仅切换公共账号
    // loginApi.switchSharedAccount(e.target.value).then(res => {
    //   if (!res.success) {
    //     console.error('switchSharedAccount error', res, res.errMsg);
    //     dispatch(doSharedAccountAsync(true));
    //     SiriusModal.error({
    //       content: getIn18Text('SWITCH_SHARED_ACCOUNT_ERROR'),
    //       okText: getIn18Text('ZHIDAOLE'),
    //       hideCancel: true
    //     });
    //   }
    // });
    if (switchingAccount) {
      return;
    }
    // 新逻辑，需要判断是否是公共账号
    const id = e.target.value;
    const isSwitchingSharedAccount =
      sharedAccount.sharedAccounts.some(item => item.email === id) ||
      (sharedAccount.isSharedAccountLogin && !sharedAccount.isSharedAccountExpired && sharedAccount.email === id);
    // 如果是公共账号
    if (isSwitchingSharedAccount) {
      dispatch(doSwitchSharedAccountAsync(id));
    } else {
      dispatch(doSwitchAccountAsync(id));
    }
  };

  const renderMainAccountTip = (_isSharedAccount: boolean, hasShareAccount = true) => {
    const showNickName = _isSharedAccount ? sharedAccount.nickName : user?.nickName;
    const showEmail = _isSharedAccount ? sharedAccount.email : user?.id;
    const mainAccountTip = (
      <div className={style.toolbarMainAccountWrap}>
        <div className={classnames(style.toolbarAccountPopoverAvatar, { [style.toolbarAccountSelected]: _isSharedAccount })} style={{ marginBottom: 14 }}>
          {/* <div style={{ color: '#A8AAAD', marginBottom: 4 }}>{getIn18Text('BANGZHUYUFANKUI')}</div> */}
          <AvatarTag
            size={40}
            showAccountSelected={!_isSharedAccount && hasShareAccount}
            user={{
              name: showNickName,
              avatar: _isSharedAccount ? '' : user?.avatar,
              email: showEmail,
              color: user?.contact?.contact?.color,
            }}
          />
        </div>
        <div className={style.toolbarAccountPopoverDesc}>
          {showNickName && <div className={style.toolbarAccountPopoverNickname}>{showNickName}</div>}
          {showEmail && <div className={style.toolbarAccountPopoverId}>{showEmail}</div>}
          {user?.company && <div className={style.toolbarAccountPopoverCompanyname}>{user?.company}</div>}
          {!_isSharedAccount && mailList?.length ? <div style={{ color: `${variables.text5}`, marginTop: 12 }}>{getIn18Text('BIEMINGYOUXIANG')}</div> : ''}
          {!_isSharedAccount &&
            mailList?.map(alias => (
              <div className={style.toolbarAccountPopoverId} key={alias}>
                {alias}
              </div>
            ))}
          {_isSharedAccount && sharedAccount.alias?.length && (
            <div style={{ color: `${variables.text5}`, marginBottom: 4, marginTop: 12 }}>{getIn18Text('BIEMINGYOUXIANG')}</div>
          )}
          {_isSharedAccount &&
            sharedAccount.alias?.map(alias => (
              <div className={style.toolbarAccountPopoverId} key={alias}>
                {alias}
              </div>
            ))}
        </div>
      </div>
    );
    return mainAccountTip;
  };

  // 添加账号
  const addAccount = () => {
    if (!systemApi.isElectron()) {
      dispatch(setLoginModalData({ visible: true }));
    }
  };

  // 头像悬浮内容
  const aliasPopover = (
    <div className={style.toolbarAccountPopover}>
      {/* 如果包含公共账号 */}
      {sharedAccount.sharedAccounts.length || localList.length ? (
        <Radio.Group
          value={user?.id}
          key={user?.id}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: 388,
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
          onChange={handleMenuClick}
        >
          <Radio value={sharedAccount.email} defaultChecked={!isSharedAccount}>
            {renderMainAccountTip(isSharedAccount)}
          </Radio>
          {sharedAccount.sharedAccounts.map((it, idx) => (
            <div className={style.sharedAccountRadio} key={idx}>
              <Radio value={it.email} defaultChecked={it.isCurrentAccount}>
                <div className={style.toolbarSharedAccount}>
                  <div className={style.avator}>
                    {switchingAccount === it?.email ? (
                      <div className={style.avatarLoadingWrap}>
                        <div className={style.avatarLoading} />
                      </div>
                    ) : (
                      <AvatarTag
                        size={40}
                        showAccountSelected={it.isCurrentAccount}
                        user={{
                          name: it?.nickName,
                          email: it?.email,
                          avatar: (it.isCurrentAccount ? systemApi.getCurrentUser()?.avatar : it?.avatar || '') || '',
                        }}
                      />
                    )}
                  </div>
                  <div className={style.toolbarSharedAccountField}>
                    <div className={style.toolbarSharedAccountFieldNickname}>
                      {it?.nickName}
                      <div className={style.tagWrapper}>
                        <span className={style.sharedAccountTag}>{getIn18Text('GONGGONGZHANGHAO')}</span>
                      </div>
                    </div>
                    <div className={style.toolbarSharedAccountFieldEmail}>{it?.email}</div>
                  </div>
                </div>
              </Radio>
            </div>
          ))}
          {/* {localList.filter(it => !it.expired).map((it, idx) => (
            <div className={style.sharedAccountRadio} key={idx}>
              <Radio value={it.email || it.id} defaultChecked={false}>
                <div className={style.toolbarSharedAccount}>
                  <div className={style.avator}>
                    {
                      (switchingAccount === it?.email || switchingAccount === it?.id) ?
                        <div className={style.avatarLoadingWrap}>
                          <div className={style.avatarLoading}></div>
                        </div> :
                        <AvatarTag
                          size={40}
                          showAccountSelected={it.isCurrentAccount}
                          user={{
                            name: it?.nickName,
                            email: it?.email
                          }}
                        />
                    }
                  </div>
                  <div className={style.toolbarSharedAccountField}>
                    <div className={style.toolbarSharedAccountFieldNickname}>
                      {it?.nickName}
                    </div>
                    <div className={style.toolbarSharedAccountFieldEmail}>{it?.email || it.id}</div>
                  </div>
                </div>
              </Radio>
            </div>
          ))} */}
        </Radio.Group>
      ) : (
        <div className={style.toolbarAccountSingle}>{renderMainAccountTip(false, false)}</div>
      )}
      {/* 新增按钮，办公下先隐藏 */}
      {process.env.BUILD_ISEDM && (
        <div className={style.addbtn} onClick={addAccount}>
          <div className={style.avator}>
            <AddIcon />
          </div>
          <div className={style.right}>{getIn18Text('TIANJIAQITAQIYEZHANG')}</div>
        </div>
      )}
    </div>
  );

  const checkAvatar = (e: any) => {
    e?.stopPropagation();
    e?.preventDefault();
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
      setCurAvatar(bigAvatar);
      setShowAvatarEditor(true);
    }
  };
  const avatarInputChange = () => {
    const files = avatarInputRef?.current?.files;
    if (files && files[0]) {
      const maxSize = 15 * 1024 * 1024;
      if (files[0].size > maxSize) {
        Toast.warn({ content: getIn18Text('TUPIANDAXIAOBU') });
        return;
      }
      setCurAvatar(files[0]);
      setShowAvatarEditor(true);
    }
  };
  const hasSharedAccount = sharedAccount && sharedAccount.sharedAccounts.length > 0;
  const [accountTooltipVisible, setAccountToolTipVisible] = useState<boolean>(false);

  // 设置公共账号头像
  const debounceSetAvatar = debounce(async (sharedAccounts: ISharedAccount[]) => {
    let contactInfos: ContactModel[] = [];
    try {
      contactInfos = await contactApi.doGetContactByItem({ type: 'EMAIL', value: sharedAccounts.map(item => item.email) });
      if (!contactInfos?.length) return;
    } catch (error) {
      console.error('debounceSetAvatar', error);
      return;
    }
    const newAccounts = sharedAccounts.map(oldItem => {
      const item = cloneDeep(oldItem);
      const findOne = contactInfos.find(contact => contact?.contact?.accountName === item.email);
      if (findOne?.contact?.avatar) {
        item.avatar = findOne?.contact?.avatar;
      }
      return item;
    });
    // 更换头像
    dispatch(LoginActions.setSharedAccount({ ...sharedAccount, sharedAccounts: newAccounts }));
  }, 200);

  const handleAccountToolTipVisibleChanged = (visible: boolean) => {
    setAccountToolTipVisible(visible);
    // 展现
    if (visible) {
      const sharedAccounts = sharedAccount.sharedAccounts || [];
      sharedAccounts?.length && debounceSetAvatar(sharedAccounts);
    }
  };

  return (
    <div className={style.toolbarContainer}>
      <div className={style.toolbarLeft}>
        <div
          className={style.toolbarLogoWrap}
          onClick={() => {
            dispatch(mailTabActions.doChangeCurrentTab('-1/-1'));
            navigate('/#mailbox');
          }}
        >
          {defaultLogo ? (
            <Image width={150} height={40} preview={false} src={defaultLogo} />
          ) : (
            <span
              className={style.toolbarLogo}
              onClick={() => {
                dispatch(mailTabActions.doChangeCurrentTab('-1'));
                navigate('/#mailbox');
              }}
            />
          )}
        </div>
        <div className={style.toolbarAccount}>
          <Tooltip
            overlayClassName={style.toolbarAccountInner}
            className={style.toolbarAccountSender}
            placement="bottomLeft"
            trigger="hover"
            title={aliasPopover}
            onVisibleChange={handleAccountToolTipVisibleChanged}
          >
            <AvatarTag
              size={26}
              hasHover={!isCorpMail}
              user={{
                name: user?.nickName,
                avatar: user?.avatar,
                email: user?.id,
                color: user?.contact?.contact?.color,
              }}
              propEmail={user?.id}
              contactId={user?.contact?.contact?.id}
              onClick={checkAvatar}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/gif, image/jpeg, image/jpg, image/png"
              className={style.avatarInput}
              onClick={e => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={avatarInputChange}
            />
            <span className={style.toolbarAccountSenderShowName}>{user?.loginAccount || user?.id}</span>
            {hasSharedAccount && <span style={{ transform: `rotateZ(${accountTooltipVisible ? '0' : '180deg'})` }} className={style.toolbarAccountOpenIcon} />}
          </Tooltip>
        </div>
        <Divider className={style.toolbarDivider} type="vertical" />
        <div
          className={style.toolbarItem}
          onClick={() => {
            navigate('/#setting', { state: { currentTab: 'account' } });
          }}
        >
          <IconSetting className={style.toolbarItemIcon} />
          <span className={style.toolbarItemLabel}>{getIn18Text('SHEZHI')}</span>
        </div>
        <Divider className={style.toolbarDivider} type="vertical" />
        {isEnLang ? null : (
          <>
            <div
              className={style.toolbarItem}
              onClick={() => {
                const currentSid = systemApi.getCurrentUser()?.sessionId;
                if (currentSid) {
                  const host = mailConfigApi.getNewWebMailHost();
                  const url = `${host}/rdmailquery/main.ftl?sid=${currentSid}`;
                  systemApi.openNewWindow(url, true);
                }
              }}
            >
              <IconSelfQuery className={style.toolbarItemIcon} />
              <span className={style.toolbarItemLabel}>{getIn18Text('ZIZHUCHAXUN')}</span>
            </div>
            <Divider className={style.toolbarDivider} type="vertical" />
          </>
        )}
        <div
          className={style.toolbarItem}
          onClick={() => {
            setDownloadVisible(true);
          }}
        >
          <IconComputer className={style.toolbarItemIcon} />
          <span className={style.toolbarItemLabel}>{getIn18Text('XIAZAI')}</span>
        </div>
        {visibleAdmin && !isCorpMail && (
          <>
            {' '}
            <Divider className={style.toolbarDivider} type="vertical" />
            <div
              className={style.toolbarItem}
              onClick={() => {
                handleBackEnd();
              }}
            >
              <IconComputer className={style.toolbarItemIcon} />
              <span className={style.toolbarItemLabel}>{getIn18Text('GUANLIHOUTAI')}</span>
            </div>
          </>
        )}
        {/* 免费版展示升级付费版按钮 */}
        {!process.env.BUILD_ISEDM && productVersionId === 'free' && (
          <>
            <Divider className={style.toolbarDivider} type="vertical" />
            <div
              className={style.toolbarItem}
              onClick={() => {
                paidGuideModal.show({ errType: '5', origin: getIn18Text('DINGBUCAOZUOLAN') });
              }}
            >
              <span className={`${style.toolbarItemIconWrap} ${style.toolbarItemIcon}`} />
              <span className={`${style.toolbarItemLabelWarning} ${style.toolbarItemLabel}`}>{getIn18Text('SHENGJIFUFEIBAN')}</span>
            </div>
          </>
        )}
      </div>
      <div className={style.toolbarRight}>
        {showActivity && (
          <>
            <div className={style.toolbarItemRight} onClick={joinVip}>
              <IconVip className={style.toolbarItemIcon} />
              <span className={style.toolbarItemLabel}>{getIn18Text('LINGHUIYUAN')}</span>
            </div>
            <Divider className={style.toolbarDivider} type="vertical" />
          </>
        )}

        <div className={classnames(showActivity ? style.toolbarItem : style.toolbarItemRight)}>
          <Dropdown overlay={menu}>
            <div>
              <span className={style.toolbarItemLabel}>{getIn18Text('BANGZHUYUFANKUI')}</span>
              <IconTriangleDown className={style.toolbarItemTriangle} />
            </div>
          </Dropdown>
        </div>
        <Divider className={style.toolbarDivider} type="vertical" />
        <div className={classnames(style.toolbarItem)}>
          <LangSwitchMenus labelClassName={style.toolbarItemLabel} iconClassName={style.toolbarItemTriangle} menuClassName={style.toobarHelpMenu} />
        </div>
        <Divider className={style.toolbarDivider} type="vertical" />
        <div className={style.toolbarItem} onClick={logout}>
          <span className={style.toolbarItemLabel}>{getIn18Text('TUICHUDENGLU')}</span>
        </div>
        {showEntry && (
          <>
            <Divider className={style.toolbarDivider} type="vertical" />
            <div className={style.toolbarItem} onClick={backToOldVersion}>
              <span className={style.toolbarItemLabel}>{getIn18Text('HUIDAOJIUBAN')}</span>
            </div>
          </>
        )}
      </div>
      {/* 切换语言弹窗 */}
      <FeedbackModal visible={showFeedbackModal} cancel={() => closeFeedback()} />
      <OldVersionModal defaultVisible={backOldVisible} closeModal={() => setBackOldVisible(false)} />
      <ToolbarDownloadModal
        visible={downloadVisible}
        onClose={() => {
          setDownloadVisible(false);
        }}
      />
      {isWebmail && <WelcomeModal />}
      {/* <WelcomeModal /> */}
      {showAvatarEditor && curAvatar && (
        <AvatarEditor
          avatar={curAvatar}
          contactId={contactId}
          contactEmail={contactEmail}
          showResetEntry
          onImageError={() => {
            const midAvatar = transAvatarSize(user?.avatar || '', 'middle');
            setCurAvatar(midAvatar);
          }}
          hideAvatarEditor={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  );
};

export default WebToolbar;
