import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import {
  AccountApi,
  apiHolder as api,
  apis,
  commonMessageReturn,
  DataTrackerApi,
  EventApi,
  LoginApi,
  LoginModel,
  ResponsePreLoginData,
  StoredAccount,
  SystemApi,
  SystemEvent,
  User,
} from 'api';
import { AutoComplete, Button, Input, message, Modal } from 'antd';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import { ReactComponent as EyeInvisibleOutlined } from './img/EyeInvisibleOutlined.svg';
import { ReactComponent as EyeOutlined } from './img/EyeOutlined.svg';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import classes from './index.module.scss';
import { useActions } from '@web-common/state/createStore';
import SiriusRadio from '@/components/UI/SiriusRadio';
import { doLoginPageViewDataTrack, doLoginPageClickDataTrack } from '../dataTracker';
import { emailPattern } from '@web-common/utils/constant';

const changeHashUrl = /^#\/?((?:doc)|(?:sheet)|(?:share))/i;
const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi() as EventApi;
const inElectron = systemApi.isElectron();
const resendCodeWaitSpan = 60;

interface LoginProps {
  type?: 'common' | 'addAccount';
  initAccount?: string;
  originLoginKey?: string;
  noBorder?: boolean;
  inMobile: boolean;
  handlerResetPassword: (email: string, password?: string) => void;
}

interface UIStoredAccount extends Partial<StoredAccount> {
  value: string;
}

const messageKey = 'mobile-login-message-key';
const showMsg = (text: string) => {
  message.open({
    className: classes.mobileMessage,
    content: <div className={classes.content}>{text}</div>,
    duration: 3,
    key: messageKey,
  } as any);
};
const showConfirm = (text: string) => {
  const modal = Modal.info({
    icon: '',
    title: '',
    okText: getIn18Text('HAODE'),
    content: text,
    maskClosable: false,
    centered: true,
    maskStyle: { background: 'rgba(0, 0, 0, 0.5)' },
    className: classes.mobileModal,
    modalRender: _ => (
      <div className={classes.mobileModalBody}>
        <div className={classes.mobileModalContent}>{text}</div>
        <div
          className={classes.mobileModalBtn}
          onClick={() => {
            modal.destroy();
          }}
        >
          {getIn18Text('HAODE')}
        </div>
      </div>
    ),
  });
};
// eslint-disable-next-line max-statements
const MobileLogin: React.FC<LoginProps> = ({ type, initAccount, originLoginKey: loginInfoKey, noBorder, handlerResetPassword, inMobile = false }) => {
  const valRef = React.useRef<any>(null);
  const inputRef = React.useRef<any>(null);
  const [isValidate, setValidate] = useState<boolean>(false);
  const { doSetLoginInfo } = useActions(LoginActions);

  const { history } = global;
  let _email;
  const openPromptPage = () => {
    trackApi.track('pcLogin_click_free');
    loginApi.doOpenPromptPage();
  };
  // const openForgetPwdUrl = () => {
  //   trackApi.track('pcLogin_click_forget_password');
  //   loginApi.doOpenForgetPwdUrl();
  // };
  // 兼容ssr，路由有问题
  if (history) {
    _email = history.state ? history.state.email : initAccount || '';
  }
  const [email, setEmail] = useState<string>(_email);
  const [defaultEmail] = useState<string>(_email);
  const [password, setPwd] = useState<string>('');
  const [protocolChecked, setProtocolChecked] = useState<boolean>(false);
  const [emailInvaild, setEmailInvaild] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mobile, setMobile] = useState<string>('');
  const [options, setOptions] = useState<UIStoredAccount[]>([]);
  const [autoLogin, setAutoLogin] = useState<boolean>(!!loginInfoKey);
  const [time, setTime] = useState<number>(resendCodeWaitSpan);
  const [isCorpMail, setIsCorpMail] = useState<boolean>(false);
  const pageSource = getIn18Text('H5QIDONGDENG');
  const goBack = () => {
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
        // iPhone safari 中, 登录后跳转回去没有立刻跳转, 限制下不让跳转回去
        // window.location.assign(href);
        window.location.replace(href);
      } else {
        window.location.replace('/launch');
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
    showConfirm(getIn18Text('WEILEBAOZHANGZHANG'));
  };

  const needOpenSecondCheck = () => {
    showConfirm(getIn18Text('JIANCEDAONINXU'));
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

  const handleLoginReturn = (value: LoginModel) => {
    setLoading(false);
    setAutoLogin(false);
    if (value.pass) {
      doLoginPageClickDataTrack(pageSource, 'true');
      loginSucc();
    } else if (value.errmsg) {
      // 有错误提示
      doLoginPageClickDataTrack(pageSource, 'false', value.errmsg);
      showMsg(value.errmsg);
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
  };
  // 处理loginApi.doPreLogin的返回，主要设置错误，设置mailMode，设置是否需要图形验证码，设置sid
  const handlePreLoginResponse = (res: ResponsePreLoginData | string | undefined, needShowWarning = false) => {
    if (!res) return;
    // 可能返回一个对象或一个错误字符串
    if (typeof res === 'object') {
      if (res.errmsg && res.errmsg.length) {
        needShowWarning && showMsg(res.errmsg);
      }
    } else {
      needShowWarning && showMsg(res);
    }
  };

  const vaildateLoginForm = (isShowMsg = false) => {
    if (!email && !password) {
      isShowMsg && showMsg(getIn18Text('QINGSHURUYOUXIANG1'));
    } else if (!email) {
      isShowMsg && showMsg(getIn18Text('QINGSHURUYOUXIANG2'));
    } else if (!password) {
      isShowMsg && showMsg(getIn18Text('QINGSHURUMIMA'));
    } else if (!protocolChecked) {
      isShowMsg && showMsg(getIn18Text('QINGYUEDUBINGGOU'));
    } else {
      return true;
    }
    return false;
  };
  const onLogin = () => {
    if (vaildateLoginForm(true)) {
      doLoginPageClickDataTrack(pageSource, 'false', getIn18Text('DENGLUDIANJI'));
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
      const logoutPromise: Promise<commonMessageReturn | void> = type === 'addAccount' ? loginApi.doLogout(true, true, true) : Promise.resolve();
      logoutPromise
        .then(() => loginApi.doPreLogin(email))
        .then(res => {
          setLoading(false);
          handlePreLoginResponse(res, true);
          const errMsg = typeof res === 'object' ? res.errmsg : '';
          // TODO: 暂不支持 corp 邮箱场景下登录
          const isCorpMailMode = !!(res && typeof res === 'object' && res.isCorpMailMode);
          setIsCorpMail(isCorpMailMode);
          if (isCorpMailMode) {
            const msg = getIn18Text('CorpYOU');
            showConfirm(msg);
            throw new Error(msg);
          }
          return !errMsg;
        })
        .then((flag: boolean) => {
          if (flag) {
            return loginApi.doLogin({ account: email, pwd: password });
          }
          throw Error('prelogin failed');
        })
        .then(value => {
          handleLoginReturn(value);
        })
        .catch(ex => {
          console.warn(ex);
        })
        .finally(() => {
          doSetLoginInfo({ loginAccount: email, loginId: password, nickName: '' });
        });
    }
  };
  const onPreLogin = () => {
    if (email) {
      // const pattern = /^([a-zA-Z0-9][a-zA-Z0-9_\-.]*)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
      const pattern = emailPattern;
      if (pattern.test(email)) {
        setEmailInvaild(false);
        loginApi
          .doPreLogin(email)
          .then()
          .catch(res => {
            console.log(res);
          });
      } else {
        setEmailInvaild(true);
      }
    } else {
      setEmailInvaild(false);
    }
  };
  function startCountDown() {
    setTime(prev => {
      setTimeout(() => {
        if (prev > 0) {
          startCountDown();
        } else {
          setTime(resendCodeWaitSpan);
        }
      }, 1000);
      return prev > 0 ? prev - 1 : 0;
    });
  }

  const onGetCode = () => {
    loginApi
      .doSendVerifyCode()
      .then(r => {
        if (r) {
          showMsg(r);
        } else {
          startCountDown();
        }
      })
      .catch(r => {
        console.log(r);
      });
  };
  const onLoginWithCode = () => {
    if (!code) {
      showMsg(getIn18Text('QINGSHURUYANZHENG'));
    } else {
      loginApi.doLoginWithCode(code).then(value => {
        if (value.pass) {
          loginSucc();
          trackApi.track('pcLogin_click_confirm_verificationPage', { pageSource, confirmResult: 'true', isMobile: 'true' });
        } else if (value.errmsg) {
          // 有错误提示
          showMsg(value.errmsg);
          doLoginPageClickDataTrack(pageSource, 'false', value.errmsg);
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            isMobile: 'true',
            checkFalseReason: value.errmsg,
          });
        } else if (value.showResetPass) {
          needChangePwd();
          trackApi.track('pcLogin_click_confirm_verificationPage', {
            pageSource,
            confirmResult: 'false',
            isMobile: 'true',
            checkFalseReason: getIn18Text('XUGENGHUANMIMA'),
          });
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
  useEffect(() => {
    doLoginPageViewDataTrack(pageSource);
    if (initAccount) {
      setEmail(initAccount);
    }
  }, []);
  useEffect(() => {
    const currentUser = systemApi.getCurrentUser();
    if (currentUser && currentUser.id && type !== 'addAccount') {
      trackApi.track('pc_login_page_has_account_already_sign_in', { currentUser, isMobile: 'true' });
      loginSucc();
    }
  }, []);
  useEffect(() => {
    // 异步获取自动补全
    accountApi.doGetAccountList().then(({ localList }) => {
      if (localList.length) {
        const list = localList.map(item => ({
          value: item.accountName,
        }));
        setOptions(list);
      }
    });
    inputRef?.current?.focus({
      cursor: 'end',
    });
  }, []);
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
      eventApi.sendSysEvent({
        eventName: 'loginBlock',
        eventData: true,
      });
      showMsg(getIn18Text('ZHENGZAIZIDONGDENG'));
      setAutoLogin(true);
      setLoading(true);
      loginApi
        .doLoadDataAndAutoLogin(loginInfoKey)
        .then((res: LoginModel) => {
          handleLoginReturn(res);
        })
        .catch(reason => {
          showMsg(reason);
          setAutoLogin(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loginInfoKey]);

  const msgValidateDiv = (
    <div>
      <div className={classes.msgTipText}>
        {getIn18Text('YIJIANGDUANXINYAN')}
        <span className={classes.phoneNumber}>{mobile}</span>
      </div>
      <div className={classes.codeInputWrapper}>
        <Input
          allowClear
          maxLength={6}
          className={classes.codeInput}
          placeholder={getIn18Text('QINGSHURUDUANXIN')}
          value={code}
          onChange={e => {
            setCode(e.target.value);
          }}
          onKeyDown={keyDownHandler}
          ref={valRef}
          suffix={
            <div className={classes.retryTip}>
              {time < resendCodeWaitSpan ? (
                `${time}s后重试`
              ) : (
                <span className={classes.retryBtn} onClick={onGetCode}>
                  {getIn18Text('HUOQUYANZHENGMA')}
                </span>
              )}
            </div>
          }
        />
      </div>
      <Button
        type="primary"
        className={{
          [classes.submitBtn]: true,
          [classes.disabled]: !code,
        }}
        onClick={onLoginWithCode}
        block
      >
        {getIn18Text('QUEDING')}
      </Button>
      <div className={classes.help}>{getIn18Text('RUXUBANGZHU，')}</div>
    </div>
  );

  const loginFormDiv = (
    <div className={classes.form}>
      <div className={classes.nameInputWrapper}>
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
            placeholder={getIn18Text('QINGSHURUWANGYI')}
            className={{
              [classes.nameInput]: true,
              [classes.warn]: emailInvaild,
            }}
            value={email}
            ref={inputRef}
            allowClear
            onChange={e => {
              setEmail(e.target.value);
            }}
            onBlur={onPreLogin}
            autoComplete="off"
            suffix={<span />}
            disabled={autoLogin}
          />
        </AutoComplete>
      </div>
      <div className={classes.warningText} hidden={!emailInvaild}>
        {getIn18Text('YOUXIANGGESHICUO')}
      </div>
      <div className={classes.pwdInputWrapper}>
        <Input.Password
          className={classes.pwdInput}
          value={password}
          placeholder={getIn18Text('QINGSHURUYOUXIANGMIMA')}
          onPressEnter={onLogin}
          allowClear
          autoComplete="off"
          onChange={e => {
            const { value } = e.target as HTMLInputElement;
            setPwd(value.replace(/[\u4e00-\u9fa5]+/g, ''));
          }}
          iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          disabled={autoLogin}
        />
      </div>
      <div className={classes.policy} onClick={() => setProtocolChecked(!protocolChecked)}>
        <SiriusRadio checked={protocolChecked}>
          <span onClick={e => e.stopPropagation()}>
            <span>{getIn18Text('WOYIYUEDUBING')}</span>
            <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank" rel="noreferrer">
              {getIn18Text('《FUWUTIAOKUAN')}
            </a>
            <span>{getIn18Text('JI')}</span>
            <a href="https://qiye.163.com/sirius/privacy_waimao/index.html" target="_blank" rel="noreferrer">
              {getIn18Text('《YINSIZHENGCE')}
            </a>
          </span>
        </SiriusRadio>
      </div>
      <Button className={{ [classes.submitBtn]: true, [classes.disabled]: !vaildateLoginForm() }} type="primary" onClick={onLogin} block loading={loading}>
        {getIn18Text('DENGLU')}
      </Button>
      <div className={classes.bottomBtn}>
        {/* <div className={classes.forgetPwdBtn} onClick={openForgetPwdUrl}>
          忘记密码
        </div> */}
        <div />
        <div className={classes.registerBtn} onClick={openPromptPage}>
          {getIn18Text('MIANFEISHIYONG')}
        </div>
      </div>
    </div>
  );

  return (
    <div className={classes.mobileLoginWrapper}>
      {isValidate ? (
        <div className={classes.validateWrapper}>
          <header className={classes.headerBar}>
            <div className={classes.backBtnWrapper} onClick={goBack}>
              <div className={classes.backBtn} />
            </div>
            <div className={classes.title}>{getIn18Text('ERCIYANZHENG')}</div>
          </header>
          <section className={classes.content}>{msgValidateDiv}</section>
        </div>
      ) : (
        <div className={classes.loginWrapper}>
          <div className={classes.iconWrapper}>
            <div className={classes.icon} />
            <div className={classes.text}>{getIn18Text('WANGYIWAIMAOTONG')}</div>
          </div>
          <header className={classes.title}>{getIn18Text('DENGLUWANGYIWAIMAO')}</header>
          <section className={classes.content}>{loginFormDiv}</section>
        </div>
      )}
    </div>
  );
};
export default MobileLogin;
