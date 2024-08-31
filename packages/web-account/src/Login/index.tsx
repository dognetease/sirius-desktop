import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  apiHolder as api,
  apis,
  commonMessageReturn,
  DataTrackerApi,
  EventApi,
  intBool,
  LoginApi,
  LoginModel,
  StoredAccount,
  SystemApi,
  SystemEvent,
  User,
  EmailAccountDomainInfo,
  ResponsePreLoginData,
  AccountApi,
  DataStoreApi,
  PerformanceApi,
  inWindow,
  StorageKey,
  addAccountPageEmailsKey,
  globalStoreConfig,
} from 'api';
import { AutoComplete, Button, Checkbox, Input } from 'antd';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './index.module.scss';
import CapLockSVG from '@web-common/components/UI/Icons/svgs/CapLock';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import './index.scss';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import MobileValidate from './validate/mobile';
import QrcodeValidate from './validate/qrcode';
import { doLoginPageViewDataTrack, doLoginPageClickDataTrack } from './dataTracker';
import CorpVerfiyCode, { VerifyComponentType } from './components/corp-verify-code';
import HostChange from './components/host-change';
import QRCodeSwitch from './components/qrcode-switch';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { emailPattern, ProductProtocols } from '@web-common/utils/constant';
import MobileBindModal from './modal/edmBindMobile';
import { getIn18Text } from 'api';
import LangMenus from '@/layouts/Main/langMenus';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import SelfUnBlockMobildModal from './self-unblocking/mobile-modal';
import EmailUnBlockModal from './self-unblocking/email-modal';

const changeHashUrl = /^#\/?((?:doc)|(?:sheet)|(?:share)|(?:unitable))/i;
const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi: PerformanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi() as EventApi;
const storeApi = api.api.getDataStoreApi() as DataStoreApi;
const inElectron = systemApi.isElectron();
const isWebFf = systemApi.isWebFfEntry();
const resendCodeWaitSpan = 60;
const searchEmailStr = (() => {
  if (!inWindow()) {
    return '';
  }
  try {
    let urlInfo = new URL(document.location.href);
    let searchParams = urlInfo.searchParams;
    return searchParams.get('login-email') || '';
  } catch (ex) {
    console.error(ex);
    return '';
  }
})();

const getCurrentEmailList = () => {
  if (!inWindow() || !localStorage) {
    return [];
  }
  try {
    const data = storeApi.getSync(addAccountPageEmailsKey, globalStoreConfig);
    if (data && data.data) {
      return JSON.parse(data.data) as Array<string>;
    }
    return [];
  } catch (ex) {
    console.error(ex);
    return [];
  }
};

type LoginType = 'mail' | 'mobile' | 'qrcode';

interface LoginProps {
  type?: 'common' | 'addAccount' | 'addAccountPage' | 'addAccountModal' | 'unlockApp';
  initAccount?: string;
  originLoginKey?: string;
  noBorder?: boolean;
  handlerResetPassword: (email: string, password?: string) => void;
  hideQrCodeLogin?: boolean; // 是否隐藏二维码登录功能
  onAddAccountLoginSuccess?: () => void;
  onAfterLogout?: () => void;
  onBeforeLogin?: () => void;
  onAfterLogin?: (res?: LoginModel) => void;
  onUnLockAppSuccess?: () => void;
  shouldShowBack?: boolean;
  onBackClicked?: () => void;
  backStyle?: React.CSSProperties;
}

interface UIStoredAccount extends Partial<StoredAccount> {
  value: string;
}

const LAST_LOGIN_TYPE_KEY = 'last-login-type';
const lastLoginTypeStoreConfig = { noneUserRelated: true };

// eslint-disable-next-line max-statements
const Login: React.FC<LoginProps> = props => {
  const { registerInfo } = useAppSelector(state => state.loginReducer);
  const { setRegisterInfo } = useActions(LoginActions);
  const {
    type,
    initAccount,
    originLoginKey: loginInfoKey,
    noBorder,
    handlerResetPassword,
    hideQrCodeLogin,
    onAfterLogout,
    onBeforeLogin,
    onAddAccountLoginSuccess,
    onAfterLogin,
    onUnLockAppSuccess,
    shouldShowBack = false,
    onBackClicked,
    backStyle = {},
  } = props;
  const valRef = React.useRef<any>(null);
  const inputRef = React.useRef<any>(null);
  // 是否需要二次验证
  const [isValidate, setValidate] = useState<boolean>(false);
  // 二次验证方式
  const [validateWay, setValidateWay] = useState<string>('mobile');
  const { doSetLoginInfo } = useActions(LoginActions);
  // #region corpMail相关的state
  const [corpMailNeedImgVerifyCode, setCorpMailNeedImgVerifyCode] = useState<boolean>(false);
  const [isCorpMail, setIsCorpMail] = useState<boolean>(false);
  const [corpImgVerifyCode, setCorpImgVerifyCode] = useState<string>('');
  const [corpPreloginSid, setCorpPreLoginSid] = useState<string>('');
  const [accountInfo, setAccountInfo] = useState<EmailAccountDomainInfo | null>(null);
  const corpVerifyImgCodeInstanceRef = useRef<VerifyComponentType>(null);
  // #endregion

  const [mobileUnBlockVisible, setMobileUnBlockVisible] = useState<boolean>(false);
  const [unBlockMobile, setUnBlockMobile] = useState<string>('');
  const [emailUnBlockVisible, setEmailUnBlockVisible] = useState<boolean>(false);

  // @ts-ignore
  const { history } = global;
  let _email;
  // 兼容ssr，路由有问题
  if (history) {
    _email = history.state ? history.state.email : initAccount || '';
  }
  const isAddAccountPage = type === 'addAccountPage';
  if (isAddAccountPage) {
    _email = searchEmailStr || '';
  }
  const [email, setEmail] = useState<string>(_email);
  const [defaultEmail] = useState<string>(_email);
  const [password, setPwd] = useState<string>('');
  const isUnLockApp = type === 'unlockApp';
  const [protocolChecked, setProtocolChecked] = useState<boolean>(isWebFf || isUnLockApp);
  // 校验警告
  const [warning, setWarning] = useState<string>('');
  const [ok, setOk] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<UIStoredAccount[]>([]);
  const [needPersist, setNeedPersist] = useState<boolean>(true);
  const [autoLogin, setAutoLogin] = useState<boolean>(!!loginInfoKey);
  const [time, setTime] = useState<number>(resendCodeWaitSpan);
  const [capsLock, setCapsLock] = useState(false);
  const isAddAccount = type === 'addAccount' || type === 'addAccountPage' || type === 'addAccountModal';
  const [currentTab, setCurrentTab] = useState<LoginType>(isWebFf || isUnLockApp ? 'mail' : isAddAccount ? 'mail' : 'mobile');
  const pageSource = isAddAccount ? getIn18Text('YUANSHIQIDONGDENG') : getIn18Text('ZHANGHAOGUANLI-');

  // 二次校验电话号码
  const [mobile, setMobile] = useState<string>('');
  // 二次校验邮箱
  const [eauthEmail, setEauthEmail] = useState<string>('');
  // 二次校验电话号码 输入验证码
  const [code, setCode] = useState<string>('');
  // 二次校验邮箱 输入验证码
  const [emailCode, setEmailCode] = useState<string>('');
  // 短信验证码发送中
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState<boolean>(false);
  // 邮件验证码发送中
  const [isSendingEmailCode, setIsSendingEmailCode] = useState<boolean>(false);
  // 短信验证码登录中
  const [isLoginingWithCode, setIsLoginingWithCode] = useState<boolean>(false);
  // 邮箱验证码登录中
  const [isLoginingWithEmailCode, setIsLoginingWithEmailCode] = useState<boolean>(false);
  // 获取验证码图片失败的次数，corp的验证码有一定概率失效，估计是corp有一定防刷策略
  const [verifyImgErrorCount, setVerifyImgErrorCount] = useState<number>(0);

  const [visibleBindMobileModal, setVisibleBindMobileModal] = useState<boolean>(false);

  // 主标题
  const mainTitle = useMemo(() => {
    if (isValidate) {
      if (validateWay === 'mobile') return getIn18Text('SHOUJIDUANXINYAN');
      if (validateWay === 'mail') return getIn18Text('ANQUANYOUXIANGYANZ');
    }
    return getIn18Text(isWebFf ? 'DENGLUYUNJIAHOUTAI' : isUnLockApp ? 'LOCK_LOGIN_MODAL_TITLE' : process.env.BUILD_ISEDM ? 'DENGLUWANGYIWAIMAO' : 'DENGLUWANGYILING');
  }, [isValidate, validateWay]);

  // const visibleMailLogin = currentTab === 'mail';
  const openPromptPage = () => {
    trackApi.track('pcLogin_click_free');
    setRegisterInfo({
      isValidate: false,
      mobile: '',
      code: '',
      visible: true,
    });
    // loginApi.doOpenPromptPage();
  };
  const openForgetPwdUrl = () => {
    trackApi.track('pcLogin_click_forget_password');
    loginApi.doOpenForgetPwdUrl(isCorpMail, email && email.trim ? email.trim() : '');
  };
  const refreshImgVerifyCode = () => {
    const currentRef = corpVerifyImgCodeInstanceRef.current;
    if (currentRef) {
      currentRef.refreshVerifyImgCode();
    }
  };
  const handleVerifyCodeChanged = (val: string): void => {
    if (!val || !val.length || !val.trim()) {
      setCorpImgVerifyCode('');
    } else {
      const trimedVal = val.trim();
      setCorpImgVerifyCode(trimedVal);
    }
  };
  const handleVerifyCodeLoadError = (): void => {
    // 最多只刷新三次，避免无限刷新的情况
    let newErrorCount = verifyImgErrorCount + 1;
    if (newErrorCount > 4) {
      newErrorCount = 0;
    } else {
      refreshImgVerifyCode();
    }
    setVerifyImgErrorCount(newErrorCount);
  };
  // sid变化，需要刷新验证码
  useEffect(() => {
    if (corpPreloginSid) {
      refreshImgVerifyCode();
    }
  }, [corpPreloginSid]);
  const handleMouseMove = (e: MouseEvent) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };
  const handleKeyup = (e: KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };
  const goBack = () => {
    if (onBackClicked) {
      onBackClicked();
      return;
    }
    setOk('');
    setWarning('');
    setCode('');
    setValidate(false);
    loginApi.refreshStatus();
  };

  // 直接进入主页
  const routerUrl = () => {
    const search = location.search;
    let url = '/';
    // 当在外贸情况 且 记录了上次退出时的模块地址，跳转到相对应模块
    if (process.env.BUILD_ISEDM && /(?:^|\?|&)redirect_url=([^&#]+)/.test(search)) {
      url = safeDecodeURIComponent(RegExp.$1);
    }
    setTimeout(() => {
      window.location.assign(url);
    }, 12);
  };

  const loginSucc = (visibleBindPhone?: boolean) => {
    console.log(`login success ${type}`);
    performanceApi.saveLog().then(() => {
      // 从登录页面登录
      if (!type || type === 'common') {
        const search = location.search;
        // 是否包含需要重定向地址
        if (/(?:^|\?|&)redirectUrl=([^&#]+)/.test(search)) {
          const url = safeDecodeURIComponent(RegExp.$1);
          window.location.href = url;
          return;
        }
        const hash = safeDecodeURIComponent(window.location.hash);
        // 是否是来自于文档/unit 页面
        if (hash && changeHashUrl.test(hash)) {
          let href = hash.slice(1);
          if (!href.startsWith('/')) {
            href = `/${href}`;
          }
          setTimeout(() => {
            window.location.assign(href);
          }, 12);
          return;
        }
        // 是否要展示绑定手机号弹窗
        if (visibleBindPhone) {
          !isWebFf && setVisibleBindMobileModal(true);
          return;
        }
        // 直接进入页面
        routerUrl();
        return;
      }
      if (isUnLockApp) {
        return;
      }
      // 是否来自于登录弹窗（调用组建形式）
      if (type === 'addAccountModal' && onAddAccountLoginSuccess) {
        onAddAccountLoginSuccess();
        return;
      }
      // 来自于设置页面
      eventApi.sendSysEvent({
        eventName: 'accountAdded',
        eventStrData: 'loginSucc',
        eventData: undefined,
        eventSeq: 0,
      } as SystemEvent);
    });
  };
  const needChangePwd = () => {
    Modal.info({
      title: getIn18Text('WEIBAOZHANGZHANGHU'),
      okText: getIn18Text('XIUGAIMIMA'),
      onCancel: () => {
        loginApi.setPreLoginPassed(false);
      },
      onOk: () => {
        if (isCorpMail) {
          // 忘记密码和修改密码同一个地址
          loginApi.doOpenForgetPwdUrl(isCorpMail, email.trim());
          return;
        }
        handlerResetPassword(email.trim(), password.trim());
      },
      centered: true,
    });
  };
  const needOpenSecondCheck = () => {
    Modal.info({
      title: `检测到您需要开启二次登录验证${isCorpMail ? getIn18Text('\uFF0CQINGQUWe') : ''}`,
      okText: getIn18Text('QUKAIQI'),
      onOk: () => {
        if (isCorpMail) {
          return;
        }
        // 开启二次登录验证
        loginApi.doOpenConfigPage();
      },
      content: getIn18Text('JIJIANGTIAOZHUANDAO'),
    });
  };
  const testLoginCurrentAccount = (currentUser: User | undefined) => {
    if (isAddAccountPage) {
      const emailList = getCurrentEmailList();
      if (!emailList || !emailList.length) {
        return false;
      }
      return emailList.some(it => it === email);
    }
    if (currentUser && currentUser.prop && currentUser.prop.accountAlias) {
      const curAlias = currentUser.prop.accountAlias as string[];
      if (curAlias && curAlias.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const it of curAlias) {
          if (it === email) {
            return true;
          }
        }
      }
    }
    return currentUser?.id === email;
  };
  const LoginProtocol = (isDialog?: boolean) => (
    <span className={styles.uProtocol} onClick={e => e.stopPropagation()}>
      <span>{isDialog ? getIn18Text('QINGXIANTONGYI') : getIn18Text('WOYIYUEDUBING')}</span>
      <a href={ProductProtocols.agreement} target="_blank" rel="noreferrer">
        {getIn18Text('FUWUTIAOKUAN')}
      </a>
      <span>{getIn18Text('HE')}</span>
      <a href={ProductProtocols.privacy} target="_blank" rel="noreferrer">
        {getIn18Text('YINSIZHENGCE')}
      </a>
    </span>
  );
  const openProtocolDialog = () => {
    Modal.info({
      title: LoginProtocol(true),
      okText: getIn18Text('ZHIDAOLE'),
      centered: true,
    });
  };
  const getInputEmptyErrorMsg = (propName: string): string => {
    if (!propName || !propName.length) return '';
    return `请输入${propName}`;
  };
  const getIsEmptyString = (str: string): boolean => {
    if (!str || !str.length || !str.trim()) {
      return true;
    }
    return false;
  };
  // 处理loginApi.doPreLogin的返回，主要设置错误，设置mailMode，设置是否需要图形验证码，设置sid
  const handlePreLoginResponse = (res: ResponsePreLoginData | string | undefined, needShowWarning = false) => {
    if (!res) return;
    // 可能返回一个对象或一个错误字符串
    if (typeof res === 'object') {
      if (res.errmsg && res.errmsg.length) {
        needShowWarning && setWarning(res.errmsg);
        return;
      }
      const _isCorpMail = res.isCorpMailMode;
      setIsCorpMail(res.isCorpMailMode as boolean);
      if (_isCorpMail) {
        setCorpMailNeedImgVerifyCode(Boolean(res.verify_code));
        setCorpPreLoginSid(res.sid as string);
      } else {
        // 非corpMailMode，清空
        setCorpMailNeedImgVerifyCode(false);
        setCorpPreLoginSid('');
      }
    } else {
      needShowWarning && setWarning(res);
    }
  };
  const onFocusInput = () => {
    setOk('');
    setWarning('');
  };
  const setEmailAccount = () => {
    const _accountInfo = systemApi.handleAccountAndDomain(email) as unknown as EmailAccountDomainInfo;
    if (!_accountInfo || !_accountInfo.account || !_accountInfo.domain) {
      setAccountInfo(null);
    } else {
      setAccountInfo(_accountInfo);
    }
  };
  const doPreLogin = (mail: string, needShowWarning: boolean = false) => {
    loginApi
      .doPreLogin(mail.trim())
      .then(res => {
        // blur的情况不展示错误信息
        handlePreLoginResponse(res, needShowWarning);
      })
      .catch(err => {
        // 不会走到这里
        console.log('doPrelogin error', err);
      });
  };
  const onPreLogin = () => {
    if (email) {
      // const pattern = /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']*)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
      const pattern = emailPattern;
      if (pattern.test(email)) {
        doPreLogin(email, false);
      } else {
        setWarning(getIn18Text('YOUXIANGZHANGHAOGE'));
      }
    }
  };
  const onEmailInputBlur = () => {
    // if (visibleMailLogin) {
    //     onPreLogin();
    //     setEmailAccount();
    // }
    if (currentTab === 'mail') {
      onPreLogin();
      setEmailAccount();
    }
  };

  // 60s倒计时
  function startCountDown() {
    setTime(prev => {
      setTimeout(() => {
        if (prev > 0) {
          if (prev > 5) {
            setOk('');
          }
          startCountDown();
        } else {
          setTime(resendCodeWaitSpan);
        }
      }, 1000);
      return prev > 0 ? prev - 1 : 0;
    });
  }

  // 发送短信验证码
  const onGetCode = () => {
    setWarning('');
    if (isSendingPhoneCode) return;
    setIsSendingPhoneCode(true);
    loginApi
      .doSendVerifyCode()
      .then(r => {
        console.log(r);
        if (r) {
          setWarning(r);
        } else {
          startCountDown();
        }
      })
      .catch(err => {
        console.error('onGetCode error', err);
      })
      .finally(() => {
        setIsSendingPhoneCode(false);
      });
  };

  // 发送邮件验证码
  const onGetEmailCode = () => {
    setWarning('');
    if (isSendingEmailCode) return;
    setIsSendingEmailCode(true);
    const emailArr = email.trim().split('@');
    if (!emailArr[0] || !emailArr[1]) return;
    loginApi
      .doSendVerifyMail()
      .then(r => {
        console.log(r);
        if (r) {
          setWarning(r);
        } else {
          startCountDown();
        }
      })
      .catch(err => {
        console.error('onGetEmailCode error', err);
      })
      .finally(() => {
        setIsSendingEmailCode(false);
      });
  };

  // 手机号二次验证
  const onLoginWithCode = () => {
    if (getIsEmptyString(code)) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YANZHENGMA')));
    } else {
      performanceApi.time({ statKey: 'login', statSubKey: 'login_code' }).then();
      setIsLoginingWithCode(true);
      loginApi.doLoginWithCode(code.trim(), (needPersist ? 1 : 0) as intBool).then(value => {
        if (value.pass) {
          performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_code' }).then();
          loginSucc();
          trackApi.track('pcLogin_click_confirm_verificationPage', { pageSource, confirmResult: 'true', currentTab });
        } else if (value.errmsg) {
          // 有错误提示
          setWarning(value.errmsg);
          performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_code' }, true).then();
          doLoginPageClickDataTrack(pageSource, 'false', value.errmsg);
          performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_code_failed', value: 1, valueType: 4, flushAndReportImmediate: true }).then();
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            checkFalseReason: value.errmsg,
            currentTab,
          });
        } else if (value.showResetPass) {
          needChangePwd();
          // trackApi.track('pcLogin_click_login_loginPage', {
          //   pageSource,
          //   loginResult: 'false',
          //   loginFalseReason: '需更换密码(二次验证后)',
          // });
          performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_code' }, true).then();
          performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_code_need_change_pwd', value: 1, valueType: 4 }).then();
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            checkFalseReason: getIn18Text('XUGENGHUANMIMA'),
            currentTab,
          });
        }
        if (!value.pass) {
          // 不通过需要设定
          setIsLoginingWithCode(false);
        }
      });
    }
  };

  // 邮箱二次验证
  const onLoginWithEmailCode = () => {
    // 判空
    if (getIsEmptyString(emailCode)) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YANZHENGMA')));
    } else {
      setIsLoginingWithEmailCode(true);
      loginApi.doLoginWithMail(emailCode.trim(), (needPersist ? 1 : 0) as intBool).then(value => {
        setIsLoginingWithEmailCode(false);
        if (value.pass) {
          loginSucc();
          trackApi.track('pcLogin_click_confirm_verificationPage', { pageSource, confirmResult: 'true', currentTab });
        } else if (value.errmsg) {
          // 有错误提示
          setWarning(value.errmsg);
          doLoginPageClickDataTrack(pageSource, 'false', value.errmsg);
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            checkFalseReason: value.errmsg,
            currentTab,
          });
          // 需要重新设置密码
        } else if (value.showResetPass) {
          needChangePwd();
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            checkFalseReason: getIn18Text('XUGENGHUANMIMA'),
            currentTab,
          });
        }
        if (!value.pass) {
          // 不通过需要设定
          setIsLoginingWithEmailCode(false);
        }
      });
    }
  };

  // 监听键盘输入
  const keyDownHandler = (e: React.KeyboardEvent<HTMLDivElement>, validateWay: 'mobile' | 'mail') => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (validateWay === 'mobile') onLoginWithCode();
        if (validateWay === 'mail') onLoginWithCode();
        break;
      default:
        console.log('press for login');
    }
  };

  const onQrCodeLogin = (value: LoginModel) => {
    handleLoginReturn(value);
  };

  // login return
  const handleLoginReturn = (value: LoginModel) => {
    const { checkType } = value;
    setLoading(false);
    setAutoLogin(false);
    const loginType = currentLoginType === 'QRCodeLogin' ? 'qrcode' : 'email';
    if (value.pass) {
      if (isUnLockApp) {
        onUnLockAppSuccess && onUnLockAppSuccess();
        return;
      }
      doLoginPageClickDataTrack(pageSource, 'true', '', loginType);
      performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_common' }).then();
      const needVisibleBindMobile = needBindMobile(value.mobile || (value as unknown as { res: LoginModel }).res?.mobile);
      loginSucc(needVisibleBindMobile);
      // 正常情况下，才展示loading状态
      setLoading(isAddAccountPage ? true : false);
    } else if (value.errmsg) {
      // 有错误提示
      doLoginPageClickDataTrack(pageSource, 'false', value.errmsg, loginType);
      performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_common_failed', value: 1, valueType: 4, flushAndReportImmediate: true }).then();
      performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_common' }, true).then();
      setWarning(value.errmsg);
    } else if (value.secondCheck) {
      if (value.showConfig) {
        // 未开通二次验证，展示弹窗
        doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUKAIQIERCI'), loginType);
        performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_common_need_second_pop', value: 1, valueType: 4 }).then();
        performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_common' }, true).then();
        needOpenSecondCheck();
        loginApi.refreshStatus();
      } else {
        // 进入二次验证
        setValidate(true);
        // 验证码二次验证
        if (checkType === 'mobile') {
          setValidateWay('mobile');
          autoGetCode('mobile');
          setMobile(value.mobile || '***********');
          performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_common_need_mobile_code', value: 1, valueType: 4 }).then();
        }
        // 邮件二次验证
        if (checkType === 'mail') {
          setValidateWay('mail');
          autoGetCode('mail');
          setEauthEmail(value.eauthEmail || '***********');
          performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_common_need_mail_code', value: 1, valueType: 4 }).then();
        }
        trackApi.track('pcLogin_view_verificationPage', { pageSource });
        performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_common' }, true).then();
        doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUERCIYANZHENG'), loginType);
      }
    } else if (value.showResetPass) {
      needChangePwd();
      doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUGENGHUANMIMA'), loginType);
      performanceApi.point({ statKey: 'login_ev', statSubKey: 'login_common_need_change_pwd', value: 1, valueType: 4 }).then();
      performanceApi.timeEnd({ statKey: 'login', statSubKey: 'login_common' }, true).then();
    } else if (value.spamLock) {
      if (value.spamType === 'auto') {
        setMobileUnBlockVisible(true);
        setUnBlockMobile(value.mobile || '');
      } else if (value.spamType === 'apply') {
        setEmailUnBlockVisible(true);
      }
    }
    if (!value.pass && isCorpMail) {
      const msgErrorCode = value.errCode;
      if (msgErrorCode === 'ERR.SESSIONNULL') {
        // 当前会话失效，调用doPrelogin刷新sid
        doPreLogin(email, false);
      } else {
        // corpMail出现错误，验证码已经使用过了，需要刷新验证码
        refreshImgVerifyCode();
      }
    }
  };
  const onLogin = () => {
    performanceApi.time({ statKey: 'login', statSubKey: 'login_common' }).then();
    if (!email && !password) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YOUXIANGDEZHIHE')));
    } else if (!email) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YOUXIANGDEZHIHE')));
    } else if (!password) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('MIMA')));
    } else if (!protocolChecked) {
      openProtocolDialog();
    } else if (corpMailNeedImgVerifyCode && getIsEmptyString(corpImgVerifyCode)) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YANZHENGMA')));
    } else {
      setLoading(true);
      if (isUnLockApp) {
        const currentUser = systemApi.getCurrentUser();
        if (currentUser) {
          if ((currentUser.loginAccount && email !== currentUser.id && email !== currentUser.loginAccount) || (!currentUser.loginAccount && email !== currentUser.id)) {
            setWarning(getIn18Text('UNLOCK_OTRER_ACCOUNT_ERROR'));
            setLoading(false);
            return;
          }
        }
        if (!navigator.onLine) {
          const loginAccount = email;
          const pwd = password;
          loginApi
            .doCheckPasswordMatch(pwd, loginAccount)
            .then(isMatch => {
              if (isMatch) {
                onUnLockAppSuccess && onUnLockAppSuccess();
              } else {
                setWarning(getIn18Text('UNLOCK_AFTER_NETWORK_TIP'));
              }
            })
            .catch(err => {
              console.error('doCheckPasswordMatch-catch', err);
              setWarning(getIn18Text('UNLOCK_AFTER_NETWORK_TIP'));
            })
            .finally(() => {
              setLoading(false);
            });
          return;
        }
      }
      const currentUser = systemApi.getCurrentUser();
      if (isAddAccount) {
        if (testLoginCurrentAccount(currentUser)) {
          if (isAddAccountPage) {
            SiriusMessage.warn({ content: getIn18Text('GAIZHANGHAOYIDENG') });
          } else {
            eventApi.sendSysEvent({
              eventName: 'accountAdded',
              eventStrData: 'loginCurrentAccount',
              eventData: undefined,
              eventSeq: 0,
            } as SystemEvent);
          }
          setLoading(false);
          return;
        }
        if (type !== 'addAccountModal') {
          eventApi.sendSysEvent({
            eventName: 'accountAdded',
            eventStrData: 'loginStart',
            eventData: undefined,
            eventSeq: 0,
          } as SystemEvent);
        }
      }
      doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('DENGLUDIANJI'));
      // corp在登录接口调用前，保存了信息到loginApi.actionStore，不需要在logout时清空
      const noClearActionStore = !!isCorpMail;
      const logoutPromise: Promise<commonMessageReturn | void> =
        isAddAccount && !isAddAccountPage && !isUnLockApp
          ? loginApi.doLogout(true, true, noClearActionStore).then(() => {
              if (onAfterLogout) {
                onAfterLogout();
              }
              return Promise.resolve();
            })
          : Promise.resolve();
      logoutPromise
        .then(() => loginApi.doPreLogin(email.trim()))
        .then(res => {
          handlePreLoginResponse(res, true);
          const errMsg = typeof res === 'object' ? res.errmsg : '';
          return !errMsg;
        })
        .then((flag: boolean) => {
          if (flag) {
            // if (type === 'addAccount') {
            //   return loginApi.doLogout(true).then(()=>{return loginApi.doLogin(email, password)});
            // } else {
            if (onBeforeLogin) {
              onBeforeLogin();
            }
            return loginApi.doLogin({
              account: email.trim(),
              pwd: password.trim(),
              verifyCode: corpImgVerifyCode,
              isUnLockApp: isUnLockApp,
            });
            // }
          } else {
            setLoading(false);
          }
          throw Error('prelogin failed');
        })
        .then(value => {
          if (onAfterLogin) {
            onAfterLogin(value);
          }
          handleLoginReturn(value);
        })
        .catch(ex => {
          if (onAfterLogin) {
            onAfterLogin();
          }
          setLoading(false);
          console.error('login error', ex);
        })
        .finally(() => {
          doSetLoginInfo({ loginAccount: email, loginId: password, nickName: '' });
        });
    }
  };
  useEffect(() => {
    doLoginPageViewDataTrack(pageSource);
    if (initAccount) {
      setEmail(initAccount);
    }
  }, []);
  useEffect(() => {
    if (isUnLockApp) {
      return;
    }
    if (type !== 'addAccount' && type !== 'addAccountModal') {
      const { suc, data } = storeApi.getSync('loginCurrentTab', { noneUserRelated: true });
      if (suc && data) {
        setCurrentTab(data as LoginType);
      }
    }
  }, []);
  useEffect(() => {
    if (isUnLockApp) return;
    const currentUser = systemApi.getCurrentUser();
    if (currentUser && currentUser.id && !isAddAccount && !systemApi.isBkLoginInit()) {
      trackApi.track('pc_login_page_has_account_already_sign_in', { currentUser });
      console.warn('[login] auto login triggered', currentUser);
      loginApi.doTryLoginWithCurrentState(currentUser.id, currentUser.sessionId).then((re: LoginModel) => {
        if (re.pass) {
          console.warn('[login] auto login triggered success', currentUser, re);
          loginSucc();
        }
      });
    }
  }, []);
  useEffect(() => {
    if (currentTab === 'mail') {
      // 异步获取自动补全
      accountApi.doGetAccountList().then(({ localList }) => {
        if (localList.length) {
          const list = localList.map(item => ({
            value: item.id,
          }));
          setOptions(list);
        }
      });
      // 注册error事件
      // eventApi.registerSysEventObserver("error", (ev: SystemEvent) => {
      //     if (ev && ev.eventData) {
      //         showDialog({
      //             title: ev.eventData.title,
      //             content: ev.eventData.content
      //         });
      //     }
      // });
      // 获取账号焦点
      inputRef?.current?.focus({
        cursor: 'end',
      });
    }
  }, [currentTab]);

  const autoGetCode = (way: 'mobile' | 'mail') => {
    valRef.current!.focus({
      cursor: 'start',
    });
    if (way === 'mobile') onGetCode();
    if (way === 'mail') onGetEmailCode();
  };

  useEffect(() => {
    console.log('[login-tsx] loginInfoKey', loginInfoKey);
    if (loginInfoKey && loginInfoKey.length > 0) {
      // setWarning(undefined);
      eventApi.sendSysEvent({
        eventName: 'loginBlock',
        eventData: true,
      });
      setOk(getIn18Text('ZHENGZAIZIDONGDENG'));
      setAutoLogin(true);
      setLoading(true);
      loginApi
        .doLoadDataAndAutoLogin(loginInfoKey)
        .then((res: LoginModel) => {
          handleLoginReturn(res);
        })
        .catch(reason => {
          // setOk('');
          setWarning(reason);
          setAutoLogin(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loginInfoKey]);

  useEffect(() => {
    if (document && document.addEventListener) {
      document.addEventListener('keyup', handleKeyup, false);
      document.addEventListener('keydown', handleKeyDown, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      return () => {
        window.removeEventListener('keyup', handleKeyup, false);
        window.removeEventListener('keydown', handleKeyDown, false);
        window.removeEventListener('mousemove', handleMouseMove, false);
      };
    }
    return () => {};
  }, []);

  // 手机号二次校验
  const msgValidateDiv = (
    <div className={styles.msgValidateWrap}>
      <div className={styles.uPhone}>
        {getIn18Text('YANZHENGMAYITONG')}
        <span className="blue">{mobile}</span>
      </div>
      <div className={classnames(styles.uInput, styles.uCode)}>
        <Input
          allowClear
          data-test-id="mobile-code-input"
          // corpMail验证码位数不固定，但为了输入方便，不会超过10位
          maxLength={isCorpMail ? 10 : 6}
          placeholder={`请输入${isCorpMail ? '' : 6}位验证码`}
          value={code}
          onFocus={onFocusInput}
          onChange={e => {
            setCode(e.target.value);
          }}
          onKeyDown={e => keyDownHandler(e, 'mobile')}
          ref={valRef}
        />
        <div className={styles.uCodeText}>
          {time < resendCodeWaitSpan ? (
            `${time}s后重试`
          ) : (
            <span className="blue" onClick={onGetCode}>
              {getIn18Text('HUOQUYANZHENGMA')}
            </span>
          )}
        </div>
      </div>
      <div style={{ width: '100%' }}>
        <Button type="primary" data-test-id="mobile-code-login-btn" className={styles.uPrimaryBtn} onClick={onLoginWithCode} block loading={isLoginingWithCode}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );

  // 邮箱二次校验
  const mailValidateDiv = (
    <div className={styles.msgValidateWrap}>
      <div className={styles.uPhone}>
        {getIn18Text('YANZHENGMAYITONGGYJFSZ')}
        <span className="blue">{eauthEmail}</span>
      </div>
      <div className={classnames(styles.uInput, styles.uCode)}>
        <Input
          allowClear
          data-test-id="mobile-code-input"
          maxLength={isCorpMail ? 10 : 6}
          placeholder={`请输入${isCorpMail ? '' : 6}位验证码`}
          value={emailCode}
          onFocus={onFocusInput}
          onChange={e => {
            setEmailCode(e.target.value);
          }}
          onKeyDown={e => keyDownHandler(e, 'mail')}
          ref={valRef}
        />
        {/* 重新获取验证码 */}
        <div className={styles.uCodeText}>
          {time < resendCodeWaitSpan ? (
            `${time}s后重试`
          ) : (
            <span className="blue" onClick={onGetEmailCode}>
              {getIn18Text('HUOQUYANZHENGMA')}
            </span>
          )}
        </div>
      </div>
      <div style={{ width: '100%' }}>
        <Button type="primary" data-test-id="mobile-code-login-btn" className={styles.uPrimaryBtn} onClick={onLoginWithEmailCode} block loading={isLoginingWithEmailCode}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );

  // 登录form
  const loginFormDiv = (
    <div>
      <div className={styles.uInput}>
        <AutoComplete
          style={{ width: '100%' }}
          options={options}
          key="auto"
          value={email}
          maxLength={128}
          defaultValue={defaultEmail}
          dropdownClassName="sirusDrop"
          filterOption={(inputValue, option) => option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) === 0}
          onChange={value => {
            setEmail(value);
          }}
        >
          <Input
            spellCheck="false"
            data-test-id="account"
            placeholder={getIn18Text('WANGYIQIYEYOU')}
            value={email}
            ref={inputRef}
            onChange={e => {
              setEmail(e.target.value);
            }}
            onBlur={onEmailInputBlur}
            onFocus={onFocusInput}
            autoComplete="off"
            suffix={<span />}
            disabled={autoLogin}
          />
        </AutoComplete>
      </div>
      <div className={classnames(styles.uInput, styles.uInputPwd)}>
        <Input.Password
          spellCheck="false"
          data-test-id="pwd"
          className={styles.passwordInput}
          value={password}
          placeholder={getIn18Text('QINGSHURUMIMA')}
          onFocus={onFocusInput}
          onPressEnter={onLogin}
          autoComplete="off"
          onChange={e => {
            const { value } = e.target as HTMLInputElement;
            setPwd(value.replace(/[\u4e00-\u9fa5]+/g, ''));
            // setPwd(e.target.value);
          }}
          disabled={autoLogin}
        />
        {capsLock ? (
          <div className={styles.iCloseBtn}>
            <CapLockSVG />
          </div>
        ) : (
          ''
        )}
      </div>

      {
        // #region corpMail图形验证码
        isCorpMail && corpMailNeedImgVerifyCode && accountInfo && corpPreloginSid ? (
          <div className={styles.uInput}>
            <CorpVerfiyCode
              accountName={accountInfo.account}
              accountDomain={accountInfo.domain}
              sid={corpPreloginSid}
              ref={corpVerifyImgCodeInstanceRef}
              onChange={handleVerifyCodeChanged}
              onVerifyCodeLoadError={handleVerifyCodeLoadError}
            />
          </div>
        ) : null
        // #endregion
      }
      {isWebFf ? (
        <div data-test-id="bt-protocol-checked" className={styles.uCheckProtocol}></div>
      ) : (
        !isUnLockApp && (
          <div className={styles.uCheckProtocol} onClick={() => setProtocolChecked(!protocolChecked)}>
            <SiriusRadio checked={protocolChecked}>{LoginProtocol()}</SiriusRadio>
          </div>
        )
      )}
      <div className={styles.uSubmitBtn}>
        <Button data-test-id="bt-login-trigger" className={styles.uPrimaryBtn} type="primary" onClick={onLogin} block loading={loading}>
          {loading ? ok : isUnLockApp ? getIn18Text('LOGIN_UNLOCK_BTN_TXT') : getIn18Text('DENGLU')}
        </Button>
      </div>
    </div>
  );
  const visibleBack = isValidate;
  const validateContent = (
    // 60天内免登录不支持
    <div className={styles.uLinkAccount} key="account" hidden={inElectron}>
      <Checkbox
        onChange={e => {
          setNeedPersist(e.target.checked);
        }}
        checked={needPersist}
      >
        <span className={styles.validate}>{getIn18Text('60TIANNEIMIAN')}</span>
      </Checkbox>
    </div>
  );
  const registerContent = (
    <div className={styles.uLinkAccount} key="account">
      <span>{getIn18Text('HAIMEIYOUTUANDUI')}</span>
      <span className="blue" onClick={openPromptPage}>
        {getIn18Text('LIJIZHUCE')}
      </span>
    </div>
  );
  const pwdContent = (
    <div className={styles.uLinkPwd} onClick={openForgetPwdUrl} key="pwd">
      {getIn18Text('WANGJIMIMA')}
    </div>
  );
  let unLinkContent = (
    <>
      {!isCorpMail && !isAddAccount && !isUnLockApp && registerContent}
      <div className={styles.hostChangeWrapper}>
        {pwdContent}
        {!isCorpMail && !isAddAccount && !isUnLockApp && <div className={styles.splitLine}></div>}
        {!isCorpMail && !isAddAccount && !isUnLockApp && <HostChange></HostChange>}
      </div>
    </>
  );
  if (isValidate && !isCorpMail) {
    unLinkContent = validateContent;
  }
  const switchTab = (tabName: LoginType) => {
    storeApi.putSync('loginCurrentTab', tabName, { noneUserRelated: true });
    setCurrentTab(tabName);
  };
  const switchTabMail = () => {
    switchTab('mail');
  };
  const switchTabMobile = () => {
    switchTab('mobile');
  };
  const getLastLoginType = () => {
    const defaultType = 'QRCodeLogin';
    if (isWebFf || isUnLockApp) return 'PCLogin';
    if (!inWindow()) return defaultType;
    let res = storeApi.getSync(LAST_LOGIN_TYPE_KEY, lastLoginTypeStoreConfig);
    if (res.suc && res.data) {
      return res.data;
    }
    return defaultType;
  };
  const setLastLoginType = (type: string) => {
    storeApi.putSync(LAST_LOGIN_TYPE_KEY, type, lastLoginTypeStoreConfig);
  };

  const [currentLoginType, setCurrentLoginType] = useState<'QRCodeLogin' | 'PCLogin'>(getLastLoginType() as 'QRCodeLogin' | 'PCLogin');
  const handleLoginTypeChange = (type: 'QRCodeLogin' | 'PCLogin') => {
    trackApi.track('pcLogin_switch_loginMode_loginPage', { mode: type });
    setCurrentLoginType(type);
    if (!isUnLockApp) {
      setLastLoginType(type);
    }
  };

  const supportQRCodeLogin = isWebFf ? false : inWindow() ? (window.featureSupportInfo.supportNativeProxy ? true : false) : false;
  // 是否展示二维码登录,如果强制隐藏了二维码登录，或者是客户端单独的增加账号弹窗，则不展示二维码登录
  const showQRCodeLogin = hideQrCodeLogin ? false : supportQRCodeLogin;

  const isQRCodeMode = showQRCodeLogin ? currentLoginType === 'QRCodeLogin' : false;

  // 是否需要展示绑定手机号
  const needBindMobile = useCallback(
    (mobile?: string) => {
      /*
       * 1.当前没有绑定手机号
       * 2.外贸账号登录情况
       * 3.账号密码登陆
       * 以下登陆方式不允许
       * 4.二维码登陆
       * 5.添加账号
       * 6.文档跳转
       * 7.账号管理页面添加账号
       * 8.单点登录
       * 9.修改密码后
       * 10.crop登录
       * 11.第三方账号登录 //TODO
       * 12.公共账号
       * 13.自动登录
       * 14.手机号登录和手机号关联账号登录
       */

      if (mobile || !process.env.BUILD_ISEDM || !(type === 'common' || !type) || isQRCodeMode || isCorpMail) {
        return false;
      }
      const { data, suc } = storeApi.getSync(StorageKey.LoginSkipBindMobile, { noneUserRelated: true });
      if (suc && data) {
        const bindMobileMap = JSON.parse(data || '{}') as Record<string, 'true' | undefined>;
        if (email && bindMobileMap[email]) {
          return false;
        }
      }
      return true;
    },
    [type, isQRCodeMode, email, isCorpMail]
  );

  return (
    <div
      className={classnames(styles.loginContainer, [type === 'addAccount' && styles.addAccountLoginWrap])}
      style={noBorder ? { border: 'none' } : {}}
      hidden={registerInfo.visible}
    >
      {shouldShowBack && (
        <div className={styles.backWrap} onClick={goBack} style={{ ...backStyle }}>
          <div className={styles.backIcon + ' dark-invert'}>
            <i />
          </div>
          <span key="back" className={styles.back}>
            {getIn18Text('FANHUI')}
          </span>
        </div>
      )}
      {showQRCodeLogin && <QRCodeSwitch useType={isUnLockApp ? 'unLockApp' : 'common'} type={currentLoginType} onTypeChange={handleLoginTypeChange}></QRCodeSwitch>}
      {isQRCodeMode && <QrcodeValidate type={type} key="mailQrCodeLogin" onLogin={onQrCodeLogin} onUnLockAppSuccess={onUnLockAppSuccess} />}
      <div key="mailPwdLogin" className={styles.loginWrap} style={{ display: isQRCodeMode ? 'none' : 'block' }}>
        {/* 返回按钮 */}
        <div className={styles.backWrap} hidden={!visibleBack} onClick={goBack} style={{ ...backStyle }}>
          <div className={styles.backIcon + ' dark-invert'}>
            <i />
          </div>
          <span key="back" className={styles.back}>
            {getIn18Text('FANHUI')}
          </span>
        </div>

        {/* 主标题 */}
        <div className={styles.title}>{mainTitle}</div>

        <div className={styles.loginFormWrap}>
          {/* 登录tab 邮箱/电话 */}
          <div className={styles.loginTabs} hidden={isAddAccount || isValidate || isUnLockApp}>
            <div
              data-test-id="sw-mail-login"
              className={classnames(styles.tab, {
                [styles.active]: currentTab === 'mail',
              })}
              onClick={switchTabMail}
            >
              <span className={styles.tabTxt}>{getIn18Text('YOUXIANG')}</span>
              <b className={styles.tabLine} />
            </div>
            <div
              data-test-id="sw-mobile-login"
              hidden={isWebFf}
              className={classnames(styles.tab, {
                [styles.active]: currentTab === 'mobile',
              })}
              onClick={switchTabMobile}
            >
              <span className={styles.tabTxt}>{getIn18Text('SHOUJIHAO')}</span>
              <b className={styles.tabLine} />
            </div>
          </div>

          {/* 校验主体 */}
          <div className={styles.loginContent} style={{ height: isUnLockApp ? '244px' : '304px' }}>
            <div className={styles.mailWrap} hidden={currentTab !== 'mail'}>
              {isValidate ? (validateWay === 'mobile' ? msgValidateDiv : validateWay === 'mail' ? mailValidateDiv : '') : loginFormDiv}
              {/* 60天免验证 */}
              <div hidden={isWebFf} className={styles.uLink}>
                {unLinkContent}
              </div>
              {/* 错误警告 */}
              <div className={styles.uWarning} hidden={!warning}>
                <ErrorIcon width={14} height={14} className={styles.uWarningIcon} />
                <span className={styles.uWarningText}>{warning}</span>
              </div>
            </div>
            <div className={styles.mobileWrap} hidden={currentTab !== 'mobile' || type === 'addAccount'}>
              <MobileValidate from="login" toRegister={isAddAccountPage ? undefined : openPromptPage} />
            </div>
          </div>
        </div>
      </div>
      {systemApi.getIsAddAccountPage() || isUnLockApp ? null : (
        <div className={styles.langMenusWrapper}>
          <LangMenus iconColor="#7d8085" iconClassName={styles.langMenuIcon} />
        </div>
      )}
      <MobileBindModal
        visible={visibleBindMobileModal}
        setVisible={v => {
          setVisibleBindMobileModal(v);
        }}
        onSuccess={() => {
          routerUrl();
        }}
      />
      {mobileUnBlockVisible && (
        <SelfUnBlockMobildModal
          mobile={unBlockMobile}
          visible={mobileUnBlockVisible}
          onCancel={() => {
            setMobileUnBlockVisible(false);
          }}
          onClose={() => {
            setMobileUnBlockVisible(false);
          }}
          onFail={errMsg => {
            Modal.error({
              content: errMsg,
              maskClosable: false,
              okText: getIn18Text('ZHIDAOLE'),
              hideCancel: true,
            });
          }}
          onSuccess={() => {
            setMobileUnBlockVisible(false);
            setTimeout(() => {
              Modal.success({
                content: getIn18Text('SPAM_UNLOCK_SUC'),
                maskClosable: false,
                okText: getIn18Text('ZHIDAOLE'),
                hideCancel: true,
              });
            }, 0);
          }}
        ></SelfUnBlockMobildModal>
      )}
      {emailUnBlockVisible && (
        <EmailUnBlockModal
          visible={emailUnBlockVisible}
          onCancel={() => {
            setEmailUnBlockVisible(false);
          }}
          onClose={() => {
            setEmailUnBlockVisible(false);
          }}
        ></EmailUnBlockModal>
      )}
    </div>
  );
};
export default Login;
