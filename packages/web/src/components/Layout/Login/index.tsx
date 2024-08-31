import { getIn18Text } from 'api';
import React, { useEffect, useState, useRef } from 'react';
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
} from 'api';
import { AutoComplete, Button, Checkbox, Input } from 'antd';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './index.module.scss';
import CapLockSVG from '../../UI/Icons/svgs/CapLock';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import './index.scss';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import SiriusRadio from '@/components/UI/SiriusRadio';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import MobileValidate from '@/components/Layout/Login/validate/mobile';
import { doLoginPageViewDataTrack, doLoginPageClickDataTrack } from './dataTracker';
import CorpVerfiyCode, { VerifyComponentType } from './components/corp-verify-code';
import { emailPattern } from '@web-common/utils/constant';

const changeHashUrl = /^#\/?((?:doc)|(?:sheet)|(?:share))/i;
const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi() as EventApi;
const storeApi = api.api.getDataStoreApi() as DataStoreApi;
const inElectron = systemApi.isElectron();
const resendCodeWaitSpan = 60;

interface LoginProps {
  type?: 'common' | 'addAccount';
  initAccount?: string;
  originLoginKey?: string;
  noBorder?: boolean;
  handlerResetPassword: (email: string, password?: string) => void;
}

interface UIStoredAccount extends Partial<StoredAccount> {
  value: string;
}

// eslint-disable-next-line max-statements
const Login: React.FC<LoginProps> = props => {
  const { registerInfo } = useAppSelector(state => state.loginReducer);
  const { setRegisterInfo } = useActions(LoginActions);
  const { type, initAccount, originLoginKey: loginInfoKey, noBorder, handlerResetPassword } = props;
  const valRef = React.useRef<any>(null);
  const inputRef = React.useRef<any>(null);
  const [isValidate, setValidate] = useState<boolean>(false);
  const { doSetLoginInfo } = useActions(LoginActions);

  // #region corpMail相关的state
  const [corpMailNeedImgVerifyCode, setCorpMailNeedImgVerifyCode] = useState<boolean>(false);
  const [isCorpMail, setIsCorpMail] = useState<boolean>(false);
  const [corpImgVerifyCode, setCorpImgVerifyCode] = useState<string>('');
  const [corpPreloginSid, setCorpPreLoginSid] = useState<string>('');
  const [accountInfo, setAccountInfo] = useState<EmailAccountDomainInfo | null>(null);
  const corpVerifyImgCodeInstanceRef = useRef<VerifyComponentType>(null);
  // #endregion

  // @ts-ignore
  const { history } = global;
  let _email;
  // 兼容ssr，路由有问题
  if (history) {
    _email = history.state ? history.state.email : initAccount || '';
  }
  const [email, setEmail] = useState<string>(_email);
  const [defaultEmail] = useState<string>(_email);
  const [password, setPwd] = useState<string>('');
  const [protocolChecked, setProtocolChecked] = useState<boolean>(false);
  const [warning, setWarning] = useState<string>('');
  const [ok, setOk] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mobile, setMobile] = useState<string>('');
  const [options, setOptions] = useState<UIStoredAccount[]>([]);
  const [needPersist, setNeedPersist] = useState<boolean>(true);
  const [autoLogin, setAutoLogin] = useState<boolean>(!!loginInfoKey);
  const [time, setTime] = useState<number>(resendCodeWaitSpan);
  const [capsLock, setCapsLock] = useState(false);
  const [currentTab, setCurrentTab] = useState<'mail' | 'mobile'>(type === 'addAccount' ? 'mail' : 'mobile');
  const pageSource = type !== 'addAccount' ? getIn18Text('YUANSHIQIDONGDENG') : getIn18Text('ZHANGHAOGUANLI-');

  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState<boolean>(false);
  // 验证码登录中
  const [isLoginingWithCode, setIsLoginingWithCode] = useState<boolean>(false);
  // 获取验证码图片失败的次数，corp的验证码有一定概率失效，估计是corp有一定防刷策略
  const [verifyImgErrorCount, setVerifyImgErrorCount] = useState<number>(0);
  const visibleMailLogin = currentTab === 'mail';

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
    setOk('');
    setWarning('');
    setCode('');
    setValidate(false);
    loginApi.refreshStatus();
  };

  const loginSucc = () => {
    console.log(`login success ${type}`);
    if (!type || type === 'common') {
      const hash = safeDecodeURIComponent(window.location.hash);
      if (hash && changeHashUrl.test(hash)) {
        let href = hash.slice(1);
        if (!href.startsWith('/')) {
          href = `/${href}`;
        }
        window.location.assign(href);
      } else {
        // window.location.assign('/launch');
        window.location.assign('/');
      }
    } else {
      eventApi.sendSysEvent({
        eventName: 'accountAdded',
        eventStrData: 'loginSucc',
        eventData: undefined,
        eventSeq: 0,
      } as SystemEvent);
    }
  };

  const needChangePwd = () => {
    Modal.info({
      title: getIn18Text('WEIBAOZHANGZHANGHU'),
      okText: getIn18Text('XIUGAIMIMA'),
      onOk: () => {
        if (isCorpMail) {
          // 忘记密码和修改密码同一个地址
          loginApi.doOpenForgetPwdUrl(isCorpMail, email);
          return;
        }
        handlerResetPassword(email, password);
      },
      centered: true,
    });
  };

  const needOpenSecondCheck = () => {
    Modal.info({
      title: `检测到您需要开启二次登录验证${isCorpMail ? getIn18Text('，QINGQUWe') : ''}`,
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
      <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank" rel="noreferrer">
        {getIn18Text('FUWUTIAOKUAN')}
      </a>
      <span>{getIn18Text('HE')}</span>
      <a href="https://qiye.163.com/sirius/privacy_waimao/index.html" target="_blank" rel="noreferrer">
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
      .doPreLogin(mail)
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
      // const pattern = /^([a-zA-Z0-9][a-zA-Z0-9_\-.]*)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
      const pattern = emailPattern;
      if (pattern.test(email)) {
        doPreLogin(email, false);
      } else {
        setWarning(getIn18Text('YOUXIANGZHANGHAOGE'));
      }
    }
  };

  const onEmailInputBlur = () => {
    if (visibleMailLogin) {
      onPreLogin();
      setEmailAccount();
    }
  };

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

  const onGetCode = () => {
    setWarning('');
    // setOk('验证码已发送');
    if (isSendingPhoneCode) {
      return;
    }
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
  const onLoginWithCode = () => {
    if (getIsEmptyString(code)) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YANZHENGMA')));
    } else {
      loginApi.doLoginWithCode(code, (needPersist ? 1 : 0) as intBool).then(value => {
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
        } else if (value.showResetPass) {
          needChangePwd();
          // trackApi.track('pcLogin_click_login_loginPage', {
          //   pageSource,
          //   loginResult: 'false',
          //   loginFalseReason: '需更换密码(二次验证后)',
          // });
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
  const keyDownHandler: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onLoginWithCode();
        break;
      default:
        console.log('press for login');
    }
  };

  const handleLoginReturn = (value: LoginModel) => {
    setLoading(false);
    setAutoLogin(false);
    if (value.pass) {
      doLoginPageClickDataTrack(pageSource, 'true');
      loginSucc();
    } else if (value.errmsg) {
      // 有错误提示
      doLoginPageClickDataTrack(pageSource, 'false', value.errmsg);
      setWarning(value.errmsg);
    } else if (value.secondCheck) {
      // 进入二次验证
      if (value.showConfig) {
        // 未开通二次验证，展示弹窗
        doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUKAIQIERCI'));
        needOpenSecondCheck();
      } else {
        // 开通二次验证，跳转验证
        setValidate(true);
        setMobile(value.mobile || '***********');
        trackApi.track('pcLogin_view_verificationPage', { pageSource });
        doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUERCIYANZHENG'));
      }
    } else if (value.showResetPass) {
      needChangePwd();
      doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('XUGENGHUANMIMA11'));
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
      const currentUser = systemApi.getCurrentUser();
      if (type === 'addAccount') {
        if (testLoginCurrentAccount(currentUser)) {
          eventApi.sendSysEvent({
            eventName: 'accountAdded',
            eventStrData: 'loginCurrentAccount',
            eventData: undefined,
            eventSeq: 0,
          } as SystemEvent);
          setLoading(false);
          return;
        }
        eventApi.sendSysEvent({
          eventName: 'accountAdded',
          eventStrData: 'loginStart',
          eventData: undefined,
          eventSeq: 0,
        } as SystemEvent);
      }
      doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('DENGLUDIANJI'));
      // corp在登录接口调用前，保存了信息到loginApi.actionStore，不需要在logout时清空
      const noClearActionStore = !!isCorpMail;
      const logoutPromise: Promise<commonMessageReturn | void> = type === 'addAccount' ? loginApi.doLogout(true, true, noClearActionStore) : Promise.resolve();
      logoutPromise
        .then(() => loginApi.doPreLogin(email))
        .then(res => {
          setLoading(false);
          handlePreLoginResponse(res, true);
          const errMsg = typeof res === 'object' ? res.errmsg : '';
          return !errMsg;
        })
        .then((flag: boolean) => {
          if (flag) {
            // if (type === 'addAccount') {
            //   return loginApi.doLogout(true).then(()=>{return loginApi.doLogin(email, password)});
            // } else {
            return loginApi.doLogin({
              account: email,
              pwd: password,
              verifyCode: corpImgVerifyCode,
            });
            // }
          }
          throw Error('prelogin failed');
        })
        .then(value => {
          handleLoginReturn(value);
        })
        .catch(ex => {
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
    if (type !== 'addAccount') {
      const { suc, data } = storeApi.getSync('loginCurrentTab', { noneUserRelated: true });
      if (suc && data) {
        setCurrentTab(data as 'mobile' | 'mail');
      }
    }
  }, []);
  useEffect(() => {
    const currentUser = systemApi.getCurrentUser();
    if (currentUser && currentUser.id && type !== 'addAccount') {
      trackApi.track('pc_login_page_has_account_already_sign_in', { currentUser });
      loginSucc();
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
  useEffect(() => {
    if (isValidate) {
      valRef.current!.focus({
        cursor: 'start',
      });
      onGetCode();
    }
  }, [isValidate]);
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

  const msgValidateDiv = (
    <div className={styles.msgValidateWrap}>
      <div className={styles.uPhone}>
        {getIn18Text('YANZHENGMAYITONG')}
        <span className="blue">{mobile}</span>
      </div>
      <div className={classnames(styles.uInput, styles.uCode)}>
        <Input
          allowClear
          // corpMail验证码位数不固定，但为了输入方便，不会超过10位
          maxLength={isCorpMail ? 10 : 6}
          placeholder={`请输入${isCorpMail ? '' : 6}位验证码`}
          value={code}
          onFocus={onFocusInput}
          onChange={e => {
            setCode(e.target.value);
          }}
          onKeyDown={keyDownHandler}
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
        <Button type="primary" className={styles.uPrimaryBtn} onClick={onLoginWithCode} block loading={isLoginingWithCode}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );

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
      <div className={styles.uCheckProtocol} onClick={() => setProtocolChecked(!protocolChecked)}>
        <SiriusRadio checked={protocolChecked}>{LoginProtocol()}</SiriusRadio>
      </div>
      <div className={styles.uSubmitBtn}>
        <Button className={styles.uPrimaryBtn} type="primary" onClick={onLogin} block loading={loading}>
          {loading ? ok : getIn18Text('DENGLU')}
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
      {!isCorpMail && type !== 'addAccount' && registerContent}
      {pwdContent}
    </>
  );
  if (isValidate && !isCorpMail) {
    unLinkContent = validateContent;
  }

  const switchTab = (tabName: 'mobile' | 'mail') => {
    storeApi.putSync('loginCurrentTab', tabName, { noneUserRelated: true });
    setCurrentTab(tabName);
  };

  const switchTabMail = () => {
    switchTab('mail');
  };
  const switchTabMobile = () => {
    switchTab('mobile');
  };

  return (
    <div
      className={classnames(styles.loginContainer, [type === 'addAccount' && styles.addAccountLoginWrap])}
      style={noBorder ? { border: 'none' } : {}}
      hidden={registerInfo.visible}
    >
      <div className={styles.loginWrap}>
        {/* 返回按钮 */}
        <div className={styles.backWrap} hidden={!visibleBack} onClick={goBack}>
          <div className={styles.backIcon}>
            <i />
          </div>
          <span key="back" className={styles.back}>
            {getIn18Text('FANHUI')}
          </span>
        </div>
        {/* 标题 */}
        <div className={styles.title}>{isValidate ? getIn18Text('SHOUJIDUANXINYAN') : getIn18Text('DENGLUWANGYIWAIMAO')}</div>
        <div className={styles.loginFormWrap}>
          <div className={styles.loginTabs} hidden={type === 'addAccount' || isValidate}>
            <div
              className={classnames(styles.tab, {
                [styles.active]: visibleMailLogin,
              })}
              onClick={switchTabMail}
            >
              <span className={styles.tabTxt}>{getIn18Text('YOUXIANG')}</span>
              <b className={styles.tabLine} />
            </div>
            <div
              className={classnames(styles.tab, {
                [styles.active]: !visibleMailLogin,
              })}
              onClick={switchTabMobile}
            >
              <span className={styles.tabTxt}>{getIn18Text('SHOUJIHAO')}</span>
              <b className={styles.tabLine} />
            </div>
          </div>
          <div className={styles.loginContent}>
            <div className={styles.mailWrap} hidden={!visibleMailLogin}>
              {isValidate ? msgValidateDiv : loginFormDiv}
              <div className={styles.uLink}>{unLinkContent}</div>
              <div className={styles.uWarning} hidden={!warning}>
                <ErrorIcon width={14} height={14} className={styles.uWarningIcon} />
                <span className={styles.uWarningText}>{warning}</span>
              </div>
            </div>
            <div className={styles.mobileWrap} hidden={visibleMailLogin || type === 'addAccount'}>
              <MobileValidate from="login" toRegister={openPromptPage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
