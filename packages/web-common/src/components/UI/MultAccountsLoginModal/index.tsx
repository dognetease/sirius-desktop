import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, useRef } from 'react';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { EnhanceSelect } from '@web-common/components/UI/Select';
import classnames from 'classnames';
import styles from './index.module.scss';
import {
  apis,
  api,
  LoginApi,
  AccountTypes,
  MultAccountsLoginInfo,
  CloseMultAccountLoginFun,
  ProductAuthApi,
  getIn18Text,
  emailPattern,
  zhPattern,
  MailApi,
  EmailAccountDomainInfo,
  AccountApi,
  BaseLoginInfo,
  SubAccountBindInfo,
  MailSendReceiveInfo,
  intBool,
  SimpleResult,
} from 'api';
import { AutoComplete, Form, message } from 'antd';
import Input from '@web-common/components/UI/Input';
import { TongyongJiantou1Xia } from '@sirius/icons';
import { TongyongJiantou1Shang } from '@sirius/icons';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { TAuthCodeMap, TCodeType, getAccountType, getAuthCodeMap, getBindAccountInfo, getBindEmailMessage } from './data';
import { PasswordProps } from '../Input/types';
import { getEmailSuffix, sendAddAccountTrack } from '@web-common/components/util/webmail-util';
import { TongyongCuowutishiMian } from '@sirius/icons';
import { OptionData } from '../Select/type';

type StepType = 'inputAccount' | 'inputPwd' | 'phoneVaild';

interface AccountForm {
  account: string;
  password: string;
  receiveHost: string;
  receivePort?: number;
  receiveSsl?: intBool;
  sendHost: string;
  sendPort?: number;
  sendSsl?: intBool;
}

const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.getSystemApi();

const accountList: AccountTypes[] = ['NeteaseQiYeMail', '163Mail', '126Mail', 'QQMail', 'TencentQiye', 'Gmail', 'Others'];
const domainList: string[] = [
  '163.com',
  '126.com',
  'qq.com',
  'foxmail.com',
  // '@outlook.com',
  'gmail.com',
  'yeah.net',
  'sina.com',
  '139.com',
  '189.cn',
];
// 绑定账号和重新绑定账号都在当前组件
const MultAccountsLogin: React.FC<{
  loginInfo: MultAccountsLoginInfo;
  closeModel: CloseMultAccountLoginFun;
}> = props => {
  // 'Microsoft', 'MicrosoftGlobal', 'Outlook' 暂时屏蔽
  const [accountTypes, setAccountTypes] = useState<AccountTypes[]>(accountList);
  const { closeModel, loginInfo } = props;
  const [accountType, setAccountType] = useState<AccountTypes>('Others');

  // 账号类型对应的授权码映射
  const authMap = useRef<TAuthCodeMap | undefined>();

  // 当前账号类型对应的授权码
  const [authUrl, setAuthUrl] = useState<string | undefined>();

  // 高级设置
  const [visibleSetting, setVisibleSetting] = useState<boolean>(false);

  // 点击下一步或者确定的loading
  const [loading, setLoading] = useState<boolean>(false);

  // 设置当前在哪个步骤
  const [step, setStep] = useState<StepType>('inputAccount');

  // 表单 （账号 + 密码/授权码 + imap + smtp）
  const [form] = Form.useForm<AccountForm>();

  // 绑定 + 重绑定错误消息
  const [errMsg, setErrMsg] = useState<string | React.ReactElement>();

  // 设置错误
  const [settingError, setSettingError] = useState<string>();

  // 二次验证手机号
  const [mobile, setMobile] = useState<string>();

  // 当前是否是绑定弹窗（或者重新绑定弹窗）
  const [isBind, setIsBind] = useState<boolean>(loginInfo.type === 'bind');

  // 二次验证手机号组件ref
  const phoneVaildRef = useRef<{ onLoginWithCode: () => Promise<void> }>();

  // 密码标题
  const pwdTitle = useMemo(() => {
    let result;
    switch (accountType) {
      case 'NeteaseQiYeMail':
        result = getIn18Text('YOUXIANGMIMA');
        break;
      case '163Mail':
      case '126Mail':
      case 'QQMail':
      case 'Gmail':
        result = getIn18Text('SHOUQUANMA');
        break;
      case 'TencentQiye':
      case 'Others':
        result = getIn18Text('MIMASHOUQUANMA');
        break;
      default:
        result = getIn18Text('MIMASHOUQUANMA');
    }
    return result;
  }, [accountType]);

  // 弹窗标题
  const title = useMemo(() => {
    if (step === 'inputAccount') {
      return getIn18Text('TIANJIAYOUXIANGZHANG');
    }
    if (step === 'inputPwd') {
      if (isBind) {
        return getIn18Text('SHURU') + pwdTitle;
      } else {
        return getIn18Text('CHONGXINYANZHENGYOUXZH');
      }
    }
    return getIn18Text('SHOUJIDUANXINYAN');
  }, [isBind, step, pwdTitle]);

  // 确认按钮文案
  const sureText = useMemo(() => {
    return step === 'inputAccount' ? getIn18Text('XIAYIBU') : getIn18Text('QUEREN');
  }, [step]);

  // 授权码
  const authText = useMemo(() => {
    return authUrl ? (
      <div
        className={styles.authTextWrap}
        onClick={() => {
          systemApi.openNewWindow(authUrl, false);
        }}
      >
        <div className={styles.authLine}></div>
        <span className={styles.authText}> {getIn18Text('SHOUQUANMAHUOQUSM')}</span>
      </div>
    ) : null;
  }, [authUrl]);

  // 是否展示上一步
  const visiblePrevStep = (step === 'inputPwd' && loginInfo.type === 'bind') || step === 'phoneVaild';

  // 获取邮箱对应类型配置
  const getEmailConfig = useCallback(async () => {
    const account = form.getFieldValue('account');
    try {
      const data = await mailApi.guessUserSetting(account);
      if (data) {
        const _accountType = getAccountType(data.domainType);
        setAccountType(_accountType);
        setVisibleSetting(_accountType === 'Others');
        if (authMap.current && _accountType in authMap.current) {
          setAuthUrl(authMap.current[_accountType as TCodeType]);
        } else {
          setAuthUrl('');
        }
        form.setFieldsValue({
          receiveHost: data.imapHost,
          receivePort: data.imapPort || 993,
          receiveSsl: data.receiveSsl || data.receiveSsl === null ? 1 : 0,
          sendHost: data.smtpHost,
          sendPort: data.smtpPort || 465,
          sendSsl: data.sendSsl || data.receiveSsl === null ? 1 : 0,
        });
      } else {
        setVisibleSetting(true);
        setSettingError(getIn18Text('NINDEIMAPFUWU'));
      }
    } catch (e) {
      console.error('error', e);
      setVisibleSetting(true);
      setSettingError(getIn18Text('NINDEIMAPFUWU'));
    }
  }, []);

  // 首次进入获取服务端授权码对象
  useEffect(() => {
    getAuthCodeMap().then(res => {
      authMap.current = res;
    });
  }, []);

  // 获取已经绑定过的账号的配置
  const reBindAccount = useCallback(
    async (account: string) => {
      form.setFieldsValue({
        account,
      });
      // 进入输入密码步骤
      setStep('inputPwd');
      // 因为多个状态共用错误变量，所以切换step需要重置
      setErrMsg('');
      // 设置为绑定账号状态
      setIsBind(false);
      const info = await getBindAccountInfo(account);
      if (info) {
        const _accountType = getAccountType(info.emailType);
        setVisibleSetting(_accountType === 'Others');
        setAccountType(_accountType);
        if (authMap.current && _accountType in authMap.current) {
          setAuthUrl(authMap.current[_accountType as TCodeType]);
        } else {
          setAuthUrl('');
        }
        form.setFieldsValue({
          receiveHost: info.receiveHost,
          receivePort: info.receivePort,
          receiveSsl: info.receiveSsl,
          sendHost: info.sendHost,
          sendPort: info.sendPort,
          sendSsl: info.sendSsl,
        });
      }
    },
    [form]
  );

  //  绑定账号成功
  const onBindSuccess = useCallback(() => {
    const account = form.getFieldValue('account');
    message.success(getIn18Text('BANGDINGCHENGGONG！'));
    sendAddAccountTrack(loginInfo.way, accountType, 'success');
    setErrMsg('');
    closeModel({ refresh: true, email: account });
  }, [accountType]);

  // 绑定账号错误
  const onBindFail = useCallback(
    (res: SimpleResult) => {
      //手机号验证，errCode为600时，errMsg为手机号。
      if (res.errCode === 600) {
        setErrMsg('');
        setStep('phoneVaild');
        setMobile(res.errMsg);
        return;
      }
      // 开启二次验证
      if (res.errCode === 500) {
        setErrMsg(
          <>
            {getIn18Text('JIANCEDAONINXUYKQECDLYZ')}
            <span
              className={styles.blue}
              onClick={() => {
                loginApi.doOpenConfigPage();
              }}
            >
              {getIn18Text('，QINGQUWe')}
            </span>
          </>
        );
      } else if (res.errMsg) {
        setErrMsg(res.errMsg);
      }
      sendAddAccountTrack(loginInfo.way, accountType, 'fail', res.errMsg);
      return;
    },
    [accountType]
  );

  // 绑定或者重绑定企业邮箱账号
  const bindNeteaseQiYeMail = useCallback(async () => {
    const formData = form.getFieldsValue();
    const { account, password } = formData;
    const agentNickname = getEmailSuffix(account)[0] || 'nickName';
    const promise = isBind
      ? loginApi.bindSubAccount({
          agentEmail: account,
          password,
          accountType,
          agentNickname,
        })
      : accountApi.editSubAccount({
          accountType: accountType === 'NeteaseQiYeMail' ? 'qyEmail' : 'personalEmail',
          agentEmail: account,
          password,
          agentNickname,
        });
    const res = await promise;
    if (!res.success) {
      onBindFail(res);
      return;
    }
    onBindSuccess();
  }, [isBind, accountType, form]);

  // 绑定或者重绑定三方邮箱账号
  const bindThirdMail = useCallback(async () => {
    const formData = form.getFieldsValue();
    const { account, password, ...sendReceiveInfo } = formData;
    const agentNickname = getEmailSuffix(account)[0] || 'nickName';
    const promise = isBind
      ? loginApi.bindSubAccount({
          ...sendReceiveInfo,
          accountType,
          agentEmail: account,
          password,
          agentNickname,
        })
      : accountApi.editSubAccount({
          ...sendReceiveInfo,
          agentEmail: account,
          password,
          accountType: loginInfo.accountType === 'NeteaseQiYeMail' ? 'qyEmail' : 'personalEmail',
          agentNickname: loginInfo.agentNickname || 'nickName',
        });
    const res = await promise;
    if (!res.success) {
      onBindFail(res);
      return;
    }
    onBindSuccess();
  }, [accountType, form, isBind]);

  // 点击取消
  const onClose = useCallback(() => {
    closeModel({ refresh: false });
  }, []);

  //  点击上一步
  const onPrevStep = useCallback(() => {
    setAuthUrl('');
    setErrMsg('');
    setSettingError('');
    if (step === 'inputPwd') {
      form.setFieldsValue({
        password: '',
      });
      setStep('inputAccount');
    } else if (step === 'phoneVaild') {
      setStep('inputPwd');
    }
  }, [step, isBind]);

  // 点击确定/下一步
  const onFinish = useCallback(async () => {
    setLoading(true);
    try {
      if (step === 'inputAccount') {
        const account = form.getFieldValue('account');
        const errorMessage = await getBindEmailMessage(account);
        if (errorMessage) {
          // 如果是已经过期的账号单独处理
          const isExpiredError = errorMessage === getIn18Text('BIND_SUBACCOUNT_EXPIRED');
          const expiredError = (
            <>
              {errorMessage}
              <span className={styles.blue} onClick={() => reBindAccount(account)}>
                {getIn18Text('recheck')}
              </span>
            </>
          );
          setErrMsg(isExpiredError ? expiredError : errorMessage);
          return;
        }
        await getEmailConfig();
        setErrMsg('');
        setStep('inputPwd');
        return;
      }
      if (step === 'inputPwd') {
        // 完成配置
        setErrMsg('');
        if (accountType === 'NeteaseQiYeMail') {
          await bindNeteaseQiYeMail();
        } else {
          await bindThirdMail();
        }
        return;
      }
      if (step === 'phoneVaild') {
        // 手机号验证
        await phoneVaildRef.current?.onLoginWithCode();
      }
    } catch (e) {
      console.error('onSubmit error', e);
    } finally {
      setLoading(false);
    }
  }, [step, isBind, getEmailConfig, form, accountType]);

  // 当form发生变化
  const onValuesChange = useCallback(
    (changedValue: Partial<AccountForm>) => {
      if (changedValue.hasOwnProperty('sendSsl')) {
        const sendSsl = changedValue.sendSsl;
        form.setFieldsValue({ sendPort: sendSsl ? 465 : 25 });
      } else if (changedValue.hasOwnProperty('receiveSsl')) {
        const receiveSsl = changedValue.receiveSsl;
        form.setFieldsValue({ receivePort: receiveSsl ? 993 : 143 });
      }
    },
    [form]
  );

  // 获取表单字段的错误信息
  const getValidatorFieldMessage = useCallback(
    (value: any, field?: keyof AccountForm) => {
      let message = '';
      if (field === 'account') {
        if (!value) {
          message = getIn18Text('QINGSHURUYOUXIANGZHANG');
        } else if (!emailPattern.test(value)) {
          message = getIn18Text('YOUXIANGZHANGHAOGESYW');
        }
      } else if (field === 'password') {
        if (!value) {
          message = getIn18Text('QINGSHURU') + pwdTitle;
        } else if (zhPattern.test(value)) {
          message = pwdTitle + getIn18Text('BUNENGYOUZHONGWEN');
        }
      } else if (!value.receiveHost || !value.sendHost) {
        message = getIn18Text('WEIHUOQUDAOFUWQDZ，QTX');
      }
      return message;
    },
    [pwdTitle, step, accountType]
  );

  // 账号输入框
  const renderAccount = () => {
    return (
      <Form.Item
        hidden={step !== 'inputAccount'}
        className={styles.accountWrap}
        validateStatus={errMsg ? 'error' : undefined}
        help={errMsg ? <ErrorMsg message={errMsg} /> : undefined}
        rules={[
          () => ({
            validator(_, value) {
              const msg = getValidatorFieldMessage(value, 'account');
              return msg ? Promise.reject(<ErrorMsg message={msg} />) : Promise.resolve();
            },
          }),
        ]}
        validateTrigger={false}
        name="account"
        label={<span className={classnames(styles.label)}>{getIn18Text('SHURUNINYAOTIANJDYXZH')}：</span>}
      >
        <AccountAutoComplete disabled={loading} />
      </Form.Item>
    );
  };

  // 密码输入框
  const renderPwd = () => {
    return step === 'inputPwd' ? (
      <Form.Item
        rules={[
          () => ({
            validator(_, value) {
              const msg = getValidatorFieldMessage(value, 'password');
              return msg ? Promise.reject(<ErrorMsg message={msg} />) : Promise.resolve();
            },
          }),
        ]}
        validateStatus={errMsg ? 'error' : undefined}
        help={errMsg ? <ErrorMsg message={errMsg} /> : undefined}
        validateTrigger={false}
        name="password"
        label={<span className={styles.passwordLabel}>{form.getFieldValue('account') + getIn18Text('DE') + pwdTitle}：</span>}
      >
        <InputPassword autoFocus disabled={loading} suffix={authText} placeholder={getIn18Text('QINGSHURU') + pwdTitle} />
      </Form.Item>
    ) : null;
  };

  // 高级设置
  const renderSetting = () => {
    return step === 'inputPwd' && accountType !== 'NeteaseQiYeMail' ? (
      <Form.Item noStyle>
        <div className={styles.settingWrap}>
          {/* 高级设置切换按钮 */}
          <div
            className={styles.setting}
            onClick={() => {
              setVisibleSetting(!visibleSetting);
            }}
          >
            <div className={styles.textLine}></div>
            <div className={styles.text}>
              <span>{getIn18Text('GAOJISHEZHI')}</span>
              {visibleSetting ? (
                <TongyongJiantou1Shang wrapClassName={styles.iconWrap} className={styles.icon} />
              ) : (
                <TongyongJiantou1Xia wrapClassName={styles.iconWrap} className={styles.icon} />
              )}
            </div>
            <div className={styles.textLine}></div>
          </div>
          <div className={styles.hostContainer} hidden={!visibleSetting}>
            {/* IMAP 服务器 */}
            <div className={styles.hostWrap}>
              <Form.Item
                label={getIn18Text('IMAPFUWUQI') + '：'}
                name="receiveHost"
                className={classnames(styles.host)}
                rules={[
                  ({ getFieldsValue }) => ({
                    validator(_, value) {
                      const msg = getValidatorFieldMessage(getFieldsValue());
                      setSettingError(msg);
                      return !value ? Promise.reject() : Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input disabled={loading} placeholder={getIn18Text('QINGSHURU') + getIn18Text('IMAPFUWUQI')} allowClear />
              </Form.Item>
              <Form.Item name="receiveSsl" className={styles.ssl} label={getIn18Text('JIAMI') + '：'}>
                <EnhanceSelect
                  disabled={loading}
                  options={[
                    { value: 1, label: 'SSL' },
                    { value: 0, label: getIn18Text('WU') },
                  ]}
                />
              </Form.Item>
              <Form.Item name="receivePort" label={getIn18Text('DUANKOU') + '：'} className={classnames(styles.port)}>
                <Input placeholder={getIn18Text('XUANTIAN')} disabled={loading} />
              </Form.Item>
            </div>
            {/* SMTP 服务器 */}
            <div className={styles.hostWrap}>
              <Form.Item
                label={getIn18Text('SMTPFUWUQI') + '：'}
                name="sendHost"
                rules={[
                  ({ getFieldsValue }) => ({
                    validator(_, value) {
                      const msg = getValidatorFieldMessage(getFieldsValue());
                      setSettingError(msg);
                      return !value ? Promise.reject() : Promise.resolve();
                    },
                  }),
                ]}
                className={classnames(styles.host)}
              >
                <Input disabled={loading} placeholder={getIn18Text('QINGSHURU') + getIn18Text('SMTPFUWUQI')} allowClear />
              </Form.Item>
              <Form.Item name="sendSsl" className={styles.ssl} label={getIn18Text('JIAMI') + '：'}>
                <EnhanceSelect
                  disabled={loading}
                  options={[
                    { value: 1, label: 'SSL' },
                    { value: 0, label: getIn18Text('WU') },
                  ]}
                />
              </Form.Item>
              <Form.Item name="sendPort" label={getIn18Text('DUANKOU') + '：'} className={classnames(styles.port)}>
                <Input placeholder={getIn18Text('XUANTIAN')} disabled={loading} />
              </Form.Item>
            </div>
          </div>
          <div className={styles.settingErrorWrap}>
            <ErrorMsg message={settingError} />
          </div>
        </div>
      </Form.Item>
    ) : null;
  };

  // 手机号验证
  const renderPhoneValid = () => {
    return step === 'phoneVaild' ? <PhoneVaild mobile={mobile} onBindSuccess={onBindSuccess} onBindFail={onBindFail} ref={phoneVaildRef} /> : null;
  };

  useEffect(() => {
    if (loginInfo?.type === 'rebind' && loginInfo?.agentEmail) {
      reBindAccount(loginInfo.agentEmail);
    }
  }, [loginInfo]);

  useEffect(() => {
    const newAccountTypes = [...accountTypes];
    // if (productAuthApi.getABSwitchSync('disable_ui_binding_outlook')) {
    //   newAccountTypes.splice(newAccountTypes.indexOf('Outlook'), 1);
    // }
    if (productAuthApi.getABSwitchSync('disable_ui_binding_gmail')) {
      newAccountTypes.splice(newAccountTypes.indexOf('Gmail'), 1);
    }
    if (productAuthApi.getABSwitchSync('disable_ui_binding_qiyeqq')) {
      newAccountTypes.splice(newAccountTypes.indexOf('TencentQiye'), 1);
    }

    if (newAccountTypes.length !== accountTypes.length) {
      setAccountTypes(newAccountTypes);
    }
  }, []);

  return (
    <SiriusHtmlModal visible closable={false} width={480}>
      <div className={styles.modalWrap}>
        <div className={styles.title}>{title}</div>
        <div className={styles.content}>
          <Form hidden={step === 'phoneVaild'} layout="vertical" form={form} onValuesChange={onValuesChange} onFinish={onFinish}>
            {/* 密码输入框 */}
            {renderPwd()}
            {/* 账号输入框 */}
            {renderAccount()}
            {/* 高级设置 */}
            {renderSetting()}
          </Form>
          {renderPhoneValid()}
        </div>
        <div className={styles.footer}>
          <Button btnType="minorLine" onClick={onClose}>
            {getIn18Text('QUXIAO')}
          </Button>
          {visiblePrevStep && (
            <Button btnType="minorLine" onClick={onPrevStep}>
              {getIn18Text('SHANGYIBU')}
            </Button>
          )}
          <Button
            btnType="primary"
            loading={loading}
            onClick={() => {
              form.submit();
            }}
          >
            {sureText}
          </Button>
        </div>
      </div>
    </SiriusHtmlModal>
  );
};

const MultAccountsLoginModal = (props: { loginInfo: MultAccountsLoginInfo; closeModel: CloseMultAccountLoginFun; visible: boolean }) => {
  const { visible, ...opt } = props;
  return visible ? <MultAccountsLogin {...opt} /> : null;
};

const AccountAutoComplete = (props: { onChange?: (val: string) => void; value?: string; disabled?: boolean }) => {
  const { onChange, disabled } = props;
  const [options, setOptions] = useState<OptionData[]>([]);

  const onSearch = useCallback((value: string) => {
    if (!value || zhPattern.test(value)) {
      setOptions([]);
      return;
    }
    const valueArr = value.split('@');
    if (valueArr.length > 2) {
      setOptions([]);
      return;
    }
    const opts: OptionData[] = [];
    domainList.forEach(domain => {
      if (valueArr.length === 1) {
        opts.push({
          value: value + '@' + domain,
          label: value + '@' + domain,
        });
      } else if (domain.startsWith(valueArr[1])) {
        opts.push({
          value: valueArr[0] + '@' + domain,
          label: valueArr[0] + '@' + domain,
        });
      }
    });
    setOptions(opts);
  }, []);

  return (
    <AutoComplete
      options={options}
      allowClear
      backfill
      autoFocus
      disabled={disabled}
      defaultActiveFirstOption
      dropdownClassName={styles.inputPopupWrap}
      onChange={onChange}
      // @ts-ignore
      autoComplete="new-password"
      className={styles.inputWrap}
      notFoundContent={null}
      placeholder={getIn18Text('QINGSHURUYOUXIANGZHANG')}
      onSearch={onSearch}
      onSelect={value => {
        onChange && onChange(value);
      }}
    />
  );
};

const InputPassword = (props: PasswordProps) => {
  const { suffix, ...opt } = props;
  const passwordRef = useRef<any>();
  useEffect(() => {
    setTimeout(() => {
      passwordRef?.current?.focus();
    }, 500);
  }, []);
  return (
    <div className={styles.passwordWrap}>
      <Input.Password
        ref={passwordRef}
        autoComplete="new-password"
        className={classnames(styles.password, {
          [styles.hasSuffix]: !!suffix,
        })}
        {...opt}
      />
      {suffix}
    </div>
  );
};

const ErrorMsg = ({ message }: { message?: string | React.ReactElement }) => {
  return message ? (
    <span className={styles.errorMsgWarp}>
      <TongyongCuowutishiMian className={styles.icon} wrapClassName={styles.iconWrap} />
      <span className={styles.text}>{message}</span>
    </span>
  ) : null;
};

const resendCodeWaitSpan = 60;
const PhoneVaild = React.forwardRef(
  (
    props: {
      mobile?: string;
      onBindSuccess: () => void;
      onBindFail: (res: SimpleResult) => void;
    },
    ref
  ) => {
    const { mobile, onBindSuccess, onBindFail } = props;
    const [code, setCode] = useState<string>();
    const [loading, setLoading] = useState<boolean>();
    const [time, setTime] = useState<number>(resendCodeWaitSpan);

    const [warning, setWarning] = useState<string>();

    useImperativeHandle(ref, () => ({
      onLoginWithCode,
    }));

    const keyDownHandler: React.KeyboardEventHandler = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onLoginWithCode();
      }
    }, []);

    const startCountDown = useCallback(() => {
      setTime(prev => {
        setTimeout(() => {
          if (prev > 0) {
            if (prev > 5) {
            }
            startCountDown();
          } else {
            setTime(resendCodeWaitSpan);
          }
        }, 1000);
        return prev > 0 ? prev - 1 : 0;
      });
    }, []);

    const onGetCode = useCallback(async () => {
      if (loading) {
        return;
      }
      const res = await loginApi.sendBindAccountVerifyCode();
      if (res.success) {
        startCountDown();
      } else {
        setWarning(res.errMsg || '');
      }
    }, []);

    const onLoginWithCode = useCallback(async () => {
      if (!code) {
        setWarning(getIn18Text('QINGSHURU') + getIn18Text('YANZHENGMA'));
        return;
      }
      if (loading) {
        return;
      }
      setLoading(true);
      setWarning('');
      const res = await loginApi.bindAccountLoginWithCode(code);
      setLoading(false);
      if (res.success) {
        onBindSuccess();
        return;
      }
      if (res.errMsg) {
        setWarning(res.errMsg);
      }
    }, [code, loading]);

    useEffect(() => {
      if (mobile) {
        onGetCode();
      }
    }, [mobile]);

    if (!mobile) {
      return null;
    }

    return (
      <div className={styles.phoneVaildWrap}>
        <div className={styles.uPhone}>
          {getIn18Text('YANZHENGMAYITONG')}
          <span className="blue">{mobile}</span>
        </div>
        <div className={styles.uInput}>
          <Input
            autoFocus
            allowClear
            disabled={loading}
            maxLength={6}
            className={styles.uCodeInput}
            placeholder={getIn18Text('QINGSHURU6WEI')}
            value={code}
            status={warning ? 'error' : undefined}
            onChange={e => {
              setCode(e.target.value);
            }}
            onKeyDown={keyDownHandler}
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
        <div className={styles.errorWrap}>
          <ErrorMsg message={warning} />
        </div>
      </div>
    );
  }
);
export default MultAccountsLoginModal;
