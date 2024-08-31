import React, { useState, useRef, useEffect } from 'react';
import { Input, Dropdown, Menu } from 'antd';
import {
  anonymousFunction,
  api,
  apis,
  LoginApi,
  AccountApi,
  MobileAccountInfo,
  RegisterApi,
  ResponsePreLoginData,
  SystemApi,
  DataTrackerApi,
  apiHolder,
  PerformanceApi,
} from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import mobileList, { Area } from '@web-common/components/util/mobileArea';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ProductProtocols } from '@web-common/utils/constant';
import styles from './moblie.module.scss';
import { getIn18Text } from 'api';

// login: 登录页面-手机号 register: 登录页面-手机号注册 account: 账号管理页面-绑定/解绑/换绑手机 loginAccount: 登录页面-账号登陆
export type MobileValidateFrom = 'login' | 'register' | 'account' | 'loginAccount';
export type submitFunc = (mobile: string, code: string, data?: any) => void;
export type sendCodeFunc = (mobile: string) => Promise<string | undefined>;
export type preLoginFunc = (mobile: string) => Promise<string | undefined | ResponsePreLoginData>;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;
const performanceApi: PerformanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const systemApi = api.getSystemApi() as SystemApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const isWebWmEntry = systemApi.isWebWmEntry();

interface MobileValidateFormProp {
  defaultValue?: string;
  defaultArea?: string;
  showProtocol?: boolean;
  onSubmit: (mobile: string, code: string, data?: any) => Promise<string>;
  onPreLogin: preLoginFunc;
  onSendCode: sendCodeFunc;
  submitTxt: string;
  hideMobileInput?: boolean;
  toRegister?: anonymousFunction;
  loadingTxt?: string;
  disable?: boolean;
  renderSubmitBottom?: () => React.ReactElement | string;
}
interface MobileValidateProp extends Partial<MobileValidateFormProp> {
  // 登陆来源
  from: MobileValidateFrom;
  // 验证登陆或者绑定成功
  onSuccess?: submitFunc;
  // 点击去注册
  toRegister?: anonymousFunction;
  // 是否需要展示绑定手机号
  isBind?: boolean;
  // 是否展示换绑手机号
  isUpdate?: boolean;
  // 绑定的手机号
  defaultMobile?: string;
  // 绑定的手机号区域
  defaultArea?: string;
  // 是否隐藏手机号的输入框
  hideMobileInput?: boolean;
  // 渲染提交按钮下面区域的内容
  renderSubmitBottom?: () => React.ReactElement | string;
}
interface MobileAreaDropdownProp {
  onSelect?: (areaNumber: string) => void;
}
const pattern = /^\d*$/;
const areaPattern = /^1\d{10}$/;
const codePattern = /^\d{6}$/;
const MobileAreaDropdown: React.FC<MobileAreaDropdownProp> = props => {
  const { onSelect } = props;
  const [current, setCurrent] = useState<string>('86');
  const [areaVisible, setAreaVisible] = useState<boolean>(false);
  const onSwitch = (areaNumber: string) => {
    setCurrent(areaNumber);
    setAreaVisible(false);
    onSelect && onSelect(areaNumber);
  };
  const menuItem = (item: Area) => (
    <Menu.Item key={item.prefix} className={styles.menuItem} onClick={() => onSwitch(item.prefix)}>
      <span className={item.prefix === current ? 'blue' : ''}>{item.name}</span>
      <span className={item.prefix === current ? 'blue' : ''}>{'+' + item.prefix}</span>
    </Menu.Item>
  );
  const menu = (
    <Menu>
      {mobileList.map(item => {
        if (item.title) {
          return (
            <Menu.ItemGroup key={item.title} className={styles.menuGroup} title={item.title}>
              {item.children.map(area => menuItem(area))}
            </Menu.ItemGroup>
          );
        }
        return menuItem(item);
      })}
    </Menu>
  );
  return (
    <Dropdown
      overlay={menu}
      getPopupContainer={node => node.parentElement || document.body}
      overlayClassName={styles.mobileAreaWrap}
      trigger={['click']}
      onVisibleChange={(visible: boolean) => {
        setAreaVisible(visible);
      }}
    >
      <div className={styles.mobileAreaTxt}>
        <span>{'+' + current}</span>
        <i className={`dark-invert ${areaVisible ? styles.arrowUp : styles.arrowDown}`} />
      </div>
    </Dropdown>
  );
};
export const MobileValidateForm: React.FC<MobileValidateFormProp> = props => {
  const {
    defaultValue = '',
    defaultArea,
    hideMobileInput,
    showProtocol = true,
    onSubmit,
    onPreLogin,
    onSendCode,
    submitTxt,
    toRegister,
    loadingTxt = '',
    disable = false,
    renderSubmitBottom,
  } = props;
  const reSendTime = 60;
  const inputRef = useRef<any>(null);
  const [mobileArea, setMobileArea] = useState<string>(defaultArea || '86');
  const [phone, setPhone] = useState<string>(defaultValue);
  const [mobile, setMobile] = useState<string>('');
  const [code, setCode] = useState<string>('');
  // const [hasSendCode, setHasSendCode] = useState<boolean>(false);
  const [errorTxt, setErrorTxt] = useState<string>('');
  const [codeTime, setCodeTime] = useState<number>(reSendTime);
  const [interValTimer, setInterValTimer] = useState<number>();
  const [protocolChecked, setProtocolChecked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const checkPhone = () => (mobileArea === '86' && !areaPattern.test(phone)) || !pattern.test(phone);
  const submit = async () => {
    if (loading || disable) {
      return;
    }
    if (!phone) {
      setErrorTxt(getIn18Text('QINGWANSHANNINDE11'));
      return;
    }
    if (checkPhone()) {
      setErrorTxt(getIn18Text('QINGSHURUZHENGQUE'));
      return;
    }
    if (!code) {
      setErrorTxt(getIn18Text('QINGSHURUYANZHENG'));
      return;
    }
    if (!codePattern.test(code)) {
      setErrorTxt(getIn18Text('QINGSHURU6WEI11'));
      return;
    }
    if (!protocolChecked) {
      const t = (
        <span className={styles.uProtocol} onClick={e => e.stopPropagation()}>
          <span>{getIn18Text('QINGXIANTONGYI')}</span>
          <a href={ProductProtocols.agreement} target="_blank" rel="noreferrer">
            {getIn18Text('FUWUTIAOKUAN')}
          </a>
          <span>{getIn18Text('HE')}</span>
          <a href={ProductProtocols.privacy} target="_blank" rel="noreferrer">
            {getIn18Text('YINSIZHENGCE')}
          </a>
        </span>
      );
      SiriusModal.error({
        title: t,
        okText: getIn18Text('ZHIDAOLE'),
        centered: true,
        hideCancel: true,
      });
      return;
    }
    performanceApi.time({ statKey: 'login', statSubKey: 'mobile_code' }).then();
    setLoading(true);
    const errMsg = await onSubmit(mobile, code);
    setLoading(false);
    performanceApi
      .point({
        statKey: 'login_ev',
        statSubKey: 'mobile_code_failed',
        value: 1,
        valueType: 4,
        flushAndReportImmediate: true,
      })
      .then();
    setErrorTxt(errMsg);
  };
  const onPhoneBlur = () => {
    if (phone) {
      if (pattern.test(phone)) {
        onPreLogin(mobile);
      } else {
        setErrorTxt(getIn18Text('QINGSHURUZHENGQUE'));
      }
    }
  };
  const sendCode = async () => {
    if (!phone) {
      return;
    }
    if (checkPhone()) {
      setErrorTxt(getIn18Text('QINGSHURUZHENGQUE'));
      return;
    }
    if (!hideMobileInput) {
      const res = await onPreLogin(mobile);
      if (typeof res === 'string') {
        setErrorTxt(res);
        return;
      }
      if (typeof res === 'object' && res.errmsg) {
        setErrorTxt(res.errmsg);
        return;
      }
    }
    setCodeTime(reSendTime - 1);
    const timer = window.setInterval(() => {
      setCodeTime(time => {
        if (time < 1) {
          clearInterval(timer);
          return reSendTime;
        }
        return time - 1;
      });
    }, 1000);
    setInterValTimer(timer);
    console.warn('[bind mobile] mobile', mobile, mobileArea, phone);
    const errorMsg = await onSendCode(mobile);
    if (errorMsg) {
      setErrorTxt(errorMsg);
      clearInterval(timer);
      setInterValTimer(undefined);
      setCodeTime(reSendTime);
    }
  };
  useEffect(() => {
    inputRef?.current?.focus({
      cursor: 'end',
    });
    return () => {
      interValTimer && clearInterval(interValTimer);
    };
  }, []);
  useEffect(() => {
    setMobile(`(${mobileArea})${phone}`);
  }, [phone, mobileArea]);
  return (
    <div className={styles.wrap}>
      <div className={styles.mobileControl}>
        {hideMobileInput ? (
          <div className={styles.defaultMobile}>{`当前手机号：${defaultValue}`}</div>
        ) : (
          <>
            <MobileAreaDropdown onSelect={setMobileArea} />
            <Input
              placeholder={getIn18Text('QINGSHURUNINDE11')}
              allowClear
              className={styles.mobileInput}
              value={phone}
              ref={inputRef}
              maxLength={11}
              onChange={e => {
                const { value } = e.target;
                const reg = /^\d*$/;
                if (reg.test(value)) {
                  setPhone(value);
                }
              }}
              onBlur={onPhoneBlur}
              onFocus={() => {
                setErrorTxt('');
              }}
              autoComplete="off"
            />
          </>
        )}
      </div>
      <div className={styles.codeControl}>
        <Input
          allowClear
          className={styles.codeInput}
          maxLength={6}
          placeholder={getIn18Text('QINGSHURU6WEI')}
          value={code}
          onFocus={() => {
            setErrorTxt('');
          }}
          onChange={e => {
            const { value } = e.target;
            const reg = /^\d*$/;
            if (reg.test(value)) {
              setCode(value);
            }
          }}
        />
        <div className={styles.codeTime}>
          {codeTime < reSendTime ? (
            `${codeTime}s后重试`
          ) : (
            <span className={phone ? 'blue' : styles.disabled} onClick={sendCode}>
              {getIn18Text('HUOQUYANZHENGMA')}
            </span>
          )}
        </div>
      </div>
      <div
        hidden={!showProtocol}
        className={styles.protocolWrap}
        onClick={e => {
          setProtocolChecked(checked => !checked);
          e.stopPropagation();
        }}
      >
        <SiriusRadio checked={protocolChecked}>
          <span className={styles.uProtocol} onClick={e => e.stopPropagation()}>
            <span>{getIn18Text('WOYIYUEDUBING')}</span>
            <a href={ProductProtocols.agreement} target="_blank" rel="noreferrer">
              {getIn18Text('FUWUTIAOKUAN')}
            </a>
            <span>{getIn18Text('HE')}</span>
            <a href={ProductProtocols.privacy} target="_blank" rel="noreferrer">
              {getIn18Text('YINSIZHENGCE')}
            </a>
          </span>
        </SiriusRadio>
      </div>
      <div className={styles.submitBtn} onClick={submit}>
        {loading && loadingTxt ? loadingTxt : submitTxt + (loading ? getIn18Text('ZHONG...') : '')}
      </div>
      {renderSubmitBottom
        ? renderSubmitBottom()
        : toRegister && (
            <div className={styles.toRegister}>
              <span>{getIn18Text('HAIMEIYOUTUANDUI')}</span>
              <span className={styles.blue} onClick={toRegister}>
                {getIn18Text('LIJIZHUCE')}
              </span>
            </div>
          )}
      <div className={styles.errorWrap} hidden={!errorTxt}>
        <ErrorIcon width={14} height={14} className={styles.errorIcon} />
        <span className={styles.errorText}>{errorTxt}</span>
      </div>
    </div>
  );
};

const MobileValidate: React.FC<MobileValidateProp> = props => {
  const { registerSuccess, goLoginNoConfirm } = useAppSelector(state => state.loginReducer);
  const { setMobileBindAccountListInfo, setVisibleSwitchModal, setRegisterInfo, setGoLoginNoConfirm, setRegisterSuccess } = useActions(LoginActions);
  const { from, onSuccess, isBind, isUpdate, toRegister, defaultMobile, hideMobileInput, defaultArea, renderSubmitBottom } = props;
  const submitTxtMap: Record<MobileValidateFrom | 'newRegister', string> = {
    register: getIn18Text('XIAYIBU'),
    newRegister: registerSuccess ? getIn18Text('ZHUCE') + getIn18Text('CHENGGONG') : goLoginNoConfirm ? getIn18Text('CHULIZHONG') : getIn18Text('LIJIZHUCE'),
    login: getIn18Text('DENGLU'),
    account: getIn18Text('YANZHENG'),
    loginAccount: getIn18Text('YANZHENG'),
  };
  useEffect(() => {
    if (from === 'register') {
      // pc_register_mobile_code_page
      trackApi.track('pc_register_mobile_code_page');
    }
  }, []);
  const mobileLogin = async (lastLoginAccount: MobileAccountInfo) => {
    const { pass, errmsg } = await loginApi.doMobileTokenLogin({
      domain: lastLoginAccount.domain,
      token: lastLoginAccount.token,
      account_name: lastLoginAccount.accountName,
    });
    if (pass) {
      performanceApi.timeEnd({ statKey: 'login', statSubKey: 'mobile_code' }).then();
      await performanceApi.saveLog();
      window.location.assign('/');
      return '';
    }
    performanceApi.timeEnd({ statKey: 'login', statSubKey: 'mobile_code' }, true).then();
    return errmsg;
  };
  const onSubmit = async (mobile: string, code: string): Promise<string> => {
    console.log('submit');
    if (from === 'register') {
      const { success, message, data, isRegister, domain, adminAccount } = await registerApi.doValidateCode({
        mobile,
        code,
        source: isWebWmEntry ? 'waimao_web' : undefined,
      });
      console.log('doValidateCode');
      if (!success) {
        setGoLoginNoConfirm(false);
        setRegisterSuccess(false);
        trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'error', result: message });
        return message || '';
      }
      if (isRegister && data) {
        // 处理选择注册流程(注册单个账号不能选中)
        if (data.length) {
          setMobileBindAccountListInfo({
            accountList: data,
            from: 'register',
            visibleList: true,
            visibleAccount: false,
          });
          trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_select' });
        } else {
          trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_has_registered' });
          return getIn18Text('MEIGESHOUJIHAO');
        }
      } else if (isWebWmEntry) {
        const domainPrefix = domain ? domain.split('.')[0] : '';
        if (!domainPrefix || !adminAccount) {
          setGoLoginNoConfirm(false);
          setRegisterSuccess(false);
          return getIn18Text('WANGLUOQINGQIUCHAO11');
        }
        // 新的外贸Web端，省略了填写资料的过程
        setRegisterInfo({
          mobile,
          code,
          domainPrefix: domainPrefix,
          adminAccount: adminAccount,
          registerTime: new Date().getTime(),
        });
        setGoLoginNoConfirm(true);
      } else {
        setRegisterInfo({
          mobile,
          code,
          isValidate: true,
          visible: true,
        });
        trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_no_account' });
      }
    }
    if (from === 'login') {
      const { success, message, data } = await loginApi.doMobileVerifyCode(code);
      if (!success) {
        trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'error', result: message });
        return message || '';
      }
      if (data?.length) {
        const loginAccount = data.filter(item => item.token);
        if (loginAccount.length === 1) {
          const result = await mobileLogin(loginAccount[0]);
          trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_enter', result });
          return result;
        }
        // 处理是否选择登录流程(登录单个账号直接选中)
        trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_select' });
        setMobileBindAccountListInfo({
          accountList: data,
          from: 'login',
          visibleList: true,
        });
      } else {
        setRegisterInfo({
          mobile,
          code,
          isValidate: true,
        });
        setVisibleSwitchModal(true);
        trackApi.track('pc_bind_email_account_page_result', { pageSource: from, actionResult: 'mobile_login_no_account' });
      }
    }
    if (from === 'account') {
      const promise = isBind
        ? accountApi.doBindMobile.bind(accountApi)
        : isUpdate
        ? accountApi.doUpdateBindMobile.bind(accountApi)
        : accountApi.doUnBindMobile.bind(accountApi);
      const { success, message } = await promise(code, mobile);
      if (!success) {
        trackApi.track('pc_phone_number_operation_result', { action: isBind || isUpdate, result: message });
        return message || '';
      }
      const email = systemApi.getCurrentUser()!.id;
      const { mobile: phone, mobileArea } = accountApi.doGetMobileAndArea(mobile);
      if (isBind || isUpdate) {
        SiriusModal.success({
          title: getIn18Text('SHOUJIHAOBANGDING'),
          content: `账号${email}和手机号(+${mobileArea})${phone}绑定成功。`,
          hideCancel: true,
        });
      } else {
        SiriusModal.success({
          title: getIn18Text('SHOUJIHAOJIEBANG'),
          content: `账号${email}和手机号(+${mobileArea})${phone}解绑成功。`,
          hideCancel: true,
        });
      }
      trackApi.track('pc_phone_number_operation_result', { action: isBind || isUpdate, result: true });
    }
    if (from === 'loginAccount') {
      const { success, message } = await accountApi.doBindMobile(code, mobile);
      if (!success) {
        trackApi.track('pc_phone_number_operation_result', { action: isBind, result: message });
        return message || '';
      }
    }
    onSuccess && onSuccess(mobile, code);
    return '';
  };
  const onSendCode = async (phone: string) => {
    if (from === 'login' || from === 'register') {
      const res = await loginApi.doMobilePreLogin(phone, from === 'register' ? 2 : 1);
      if (typeof res === 'object' && res.errmsg) {
        return res.errmsg;
      }
      if (typeof res === 'string') {
        return res;
      }
      return loginApi.doSendVerifyCode();
    }
    const { message } = await accountApi.doGetVerifyCode(phone, !isBind && !isUpdate);
    return message;
  };
  const onPreLogin = async (phone: string) => {
    if (from === 'login') {
      return loginApi.doMobilePreLogin(phone);
    }
    if (from === 'register') {
      return loginApi.doMobilePreLogin(phone, 2);
    }
    return undefined;
  };
  const submitTxt = isWebWmEntry && from === 'register' ? submitTxtMap.newRegister : submitTxtMap[from];
  const loadingTxtMap = { register: getIn18Text('CHULIZHONG'), account: '', login: '', loginAccount: '' };
  const loadingTxt = loadingTxtMap[from];
  return (
    <MobileValidateForm
      hideMobileInput={hideMobileInput}
      defaultValue={defaultMobile}
      defaultArea={defaultArea}
      onSubmit={onSubmit}
      onPreLogin={onPreLogin}
      onSendCode={onSendCode}
      loadingTxt={loadingTxt}
      submitTxt={submitTxt}
      toRegister={toRegister}
      renderSubmitBottom={renderSubmitBottom}
      disable={registerSuccess && isWebWmEntry}
    />
  );
};
export default MobileValidate;
