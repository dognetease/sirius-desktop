/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { api, apis, LoginApi, PwdRule, PwdRuleModel, SystemApi, locationHelper } from 'api';
// import { navigate } from 'gatsby';
import get from 'lodash/get';
import classnames from 'classnames';
import { navigate } from 'gatsby';
import { compose } from '@reduxjs/toolkit';
import { PasswordHintDropDown } from './password-check-tooltips';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { ReactComponent as IconEyeClose } from '@/images/icons/icon-eye-close.svg';
import { ReactComponent as IconEyeOpen } from '@/images/icons/icon-eye-open.svg';
// import { ReactComponent as IconBack } from '../../../images/icons/back-icon.svg';
import { ReactComponent as IconWarning } from '@/images/icons/icon-warning.svg';
import passCheck from './password-check';
import style from './style.module.scss';
import { useActions } from '@web-common/state/createStore';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
export interface SubmitData {
  passwordOld: string;
  password: string;
  passwordCheck: string;
}
interface PasswordResetFormProps {
  onBack?: () => void;
  onSuccess: (pwd: string, redirectUrl?: string) => void;
  passRule?: PwdRuleModel;
  oldPass: string;
  from: 'setting' | 'reset_password';
  account: string | undefined;
}
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const systemApi = api.getSystemApi() as SystemApi;
export const PasswordCheckNew = (props: PasswordResetFormProps) => {
  const { nickName = '', accountName = '' } = systemApi?.getCurrentUser() || {};
  // const { loginAccount } = useAppSelector(state => state.loginReducer.loginInfo);
  // const _accountName = get(loginApi, ['actions', 'currentPreloginRequest', 'account_name'], '');
  // const { passRule, oldPass, onSuccess, from = 'reset_password', } = props;
  const iconCheckRule =
    /([0-9|*|#]\uFE0F\u20E3)|([0-9|#]\u20E3)|([\u203C-\u3299]\uFE0F\u200D)|([\u203C-\u3299]\uFE0F)|([\u2122-\u2B55])|(\u303D)|([A9|AE]\u3030)|(\uA9)|(\uAE)|(\u3030)|([\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF])|([\uDC00-\uDFFF])|([\uD83C|\uD83D|\uD83E])|([\u200D])|[\uFE0F]/;
  const { passRule, onSuccess, oldPass, from = 'reset_password', account } = props;
  const _accountName = account || '';
  const {
    loginInfo: { loginId = '' },
  } = useAppSelector(state => state.loginReducer);
  const { nickname: _nickName = '', pwdrule = {}, sign = '' } = passRule || {};
  const [inputFocus, setInputFocus] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string>('');
  // const inputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // const [passCheckFocus, setPassCheckFocus] = useState(false);
  const loginActions = useActions(LoginActions);
  const EyeIconStyle = { marginLeft: 14 };
  const methods = useForm<SubmitData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });
  const { getValues, formState, control, watch, setError, clearErrors } = methods;
  const passField = watch('password', '');
  const passConfirmField = watch('passwordCheck', '');
  const oldPassField = watch('passwordOld', '');
  const noCheck = passField.length >= 3;

  const getValidatePasswordRules = (rules: PwdRule) => {
    const { charTypeNum = 0, checkAccountName = 0, checkNickName = false, maxLen = 8, minLen = 16, seqCharLen = 0, seqNumLen = 0, seqSameChar = 0 } = rules;
    const rule = {
      长度: (password: string) => passCheck.isValidLength(password, { min: minLen, max: maxLen }),
    };
    if (seqNumLen !== 0) {
      rule[getIn18Text('SHUZILIANXU')] = (password: string) => !passCheck.isStringConsecutive(password, 'number', seqNumLen);
    }
    if (seqCharLen !== 0) {
      rule[getIn18Text('ZIMULIANXU')] = (password: string) => !passCheck.isStringConsecutive(password, 'char', seqCharLen);
    }
    if (seqSameChar !== 0) {
      rule[getIn18Text('ZIFUXIANGTONG')] = (password: string) => !passCheck.isMultiSameChar(password, seqSameChar);
    }
    if (charTypeNum !== 0) {
      rule[getIn18Text('TESHUZIFU')] = (password: string) => passCheck.isContainSpecialChar(password, charTypeNum);
    }
    if (checkNickName) {
      rule[getIn18Text('BAOHANPINYIN')] = (password: string) => !passCheck.isIncludeUsername(password, nickName || _nickName);
    }
    if (checkAccountName) {
      rule[getIn18Text('BAOHANZHANGHAO')] = (password: string) => !passCheck.isIncludeAccount(password, accountName || _accountName);
    }
    return rule;
  };

  const handleForgot = () => {
    loginApi.doOpenForgetPwdUrl();
  };
  const handleSubmit = async () => {
    const submitData = getValues();
    let { password, passwordCheck, passwordOld } = submitData;
    // 如果是from为reset 则从表单中获取， 如果是 强制修改密码， 则从本地中获取
    if (from === 'reset_password') {
      passwordOld = oldPass;
    }

    if (formState.errors?.password) {
      setInputFocus(true);
      return;
    }
    if (password === passwordOld) {
      setError('passwordCheck', { message: getIn18Text('XINMIMABUNENG'), type: 'no-match' });
      return;
    }
    if (passwordCheck !== password) {
      setError('passwordCheck', { message: getIn18Text('LIANGCISHURUMI'), type: 'no-match' });
      return;
    }
    // 校验emoji图标
    if (iconCheckRule.test(password)) {
      setError('passwordCheck', { message: getIn18Text('QINGANZHAOGUIZE'), type: 'no-match' });
      return;
    }

    const { pass, redirectUrl, errmsg } = await loginApi.doUpdatePassword(password, sign, passwordOld);
    if (pass) {
      message.success(getIn18Text('XIUGAIMIMACHENG'));
      clearErrors();
      onSuccess(password, redirectUrl);
    } else {
      setError('passwordCheck', {
        message: errmsg || getIn18Text('XIUGAIMIMASHI'),
        type: 'no-match',
      });
    }
  };
  const renderIconEye = (visible: boolean) => (visible ? <IconEyeOpen style={EyeIconStyle} /> : <IconEyeClose style={EyeIconStyle} />);
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current?.focus();
    }, 500);
  }, []);
  return (
    <div
      className={classnames(style.resetPasswordForm, {
        [style.resetPasswordStep2]: from === 'setting',
      })}
    >
      <div className={style.content}>
        <div className={style.title}>{getIn18Text('XIUGAIMIMA')}</div>
        <div className={style.desc}>{from === 'setting' ? getIn18Text('JIANYININDINGQIXIUGAI') : getIn18Text('WEIBAOZHANGZHANGHU')}</div>

        <FormProvider {...methods}>
          <form onSubmit={e => e.preventDefault()}>
            {from !== 'reset_password' && (
              <Controller
                control={control}
                name="passwordOld"
                defaultValue=""
                render={({ field }) => (
                  <Input.Password
                    className={style.resetField}
                    allowClear
                    placeholder={getIn18Text('QINGSHURUJIUMI')}
                    {...field}
                    ref={inputRef}
                    autoComplete="new-password"
                    type="password"
                    iconRender={renderIconEye}
                    onPressEnter={handleSubmit}
                    onChange={e => {
                      field.onChange(e);
                      setErrMsg('');
                    }}
                  />
                )}
              />
            )}
            <Controller
              control={control}
              name="password"
              defaultValue=""
              rules={{ validate: getValidatePasswordRules(pwdrule as PwdRule) }}
              render={({ field }) => (
                <div className={style.passWrapper}>
                  <PasswordHintDropDown inputFocus={inputFocus} rules={pwdrule as PwdRule}>
                    <Input.Password
                      className={style.resetField}
                      style={Object.keys(formState?.errors?.password || {}).length > 0 && noCheck ? { borderColor: 'rgba(38, 42, 51, 0.11)' } : {}}
                      allowClear
                      placeholder={getIn18Text('SHEZHIXINMIMA')}
                      {...field}
                      autoComplete="new-password"
                      onFocus={() => setInputFocus(true)}
                      onBlur={() => setInputFocus(false)}
                      type="password"
                      iconRender={renderIconEye}
                    />
                  </PasswordHintDropDown>
                </div>
              )}
            />

            <Controller
              name="passwordCheck"
              render={({ field }) => (
                <Input.Password
                  allowClear
                  className={style.resetField}
                  placeholder={getIn18Text('ZAICISHURUMI')}
                  autoComplete="new-password"
                  iconRender={renderIconEye}
                  {...field}
                />
              )}
              control={control}
              defaultValue=""
              rules={{ required: true }}
            />

            <Button
              className={style.buttonConfirm}
              block
              type="primary"
              onClick={handleSubmit}
              disabled={!passField || !passConfirmField || (from !== 'reset_password' && !oldPassField)}
            >
              {getIn18Text('QUEDING')}
            </Button>

            <div className={style.forgetFooter}>
              <span className={style.forgetBtn} onClick={handleForgot}>
                {getIn18Text('WANGJIJIUMIMA')}
              </span>
            </div>
            {formState?.errors?.passwordCheck?.message ? (
              <div className={style.errMsg}>
                <IconWarning style={{ marginRight: 4 }} />
                {formState?.errors?.passwordCheck?.message}
              </div>
            ) : (
              <div style={{ height: 22 }} />
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
