/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Button, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { api, apis, LoginApi, PwdRule, PwdRuleModel, SystemApi } from 'api';
// import { navigate } from 'gatsby';
import get from 'lodash/get';
import classnames from 'classnames';
import { navigate } from 'gatsby';
import { PasswordHintDropDown } from './password-check-tooltips';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { ReactComponent as IconEyeClose } from '@/images/icons/icon-eye-close.svg';
import { ReactComponent as IconEyeOpen } from '@/images/icons/icon-eye-open.svg';
// import { ReactComponent as IconBack } from '../../../images/icons/back-icon.svg';
import { ReactComponent as IconWarning } from '@/images/icons/icon-warning.svg';
import passCheck from './password-check';
import style from './style.module.scss';
import { useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
export interface SubmitData {
  password: string;
  passwordCheck: string;
}
interface PasswordResetFormProps {
  onBack?: () => void;
  onSuccess: (pwd: string, redirectUrl?: string) => void;
  passRule?: PwdRuleModel;
  oldPass: string;
  from: 'setting' | 'reset_password';
}
export const PasswordResetForm = (props: PasswordResetFormProps) => {
  const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const systemApi = api.getSystemApi() as SystemApi;
  const { nickName = '', accountName = '' } = systemApi?.getCurrentUser() || {};
  // const { loginAccount } = useAppSelector(state => state.loginReducer.loginInfo);
  const _accountName = get(loginApi, ['actions', 'currentPreloginRequest', 'account_name'], '');
  const { passRule, oldPass, onSuccess, from = 'reset_password' } = props;
  const { nickname: _nickName = '', pwdrule = {}, sign = '' } = passRule || {};
  const [inputFocus, setInputFocus] = useState<boolean>(false);
  // const inputRef = useRef<HTMLInputElement>(null);
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
  // useEffect(() => {
  //   setTimeout(() => {
  //     if (inputRef.current) inputRef.current?.focus();
  //   }, 500);
  // }, []);
  const handleSubmit = async () => {
    console.log('[handleSubmit] oldPass', oldPass);
    const submitData = getValues();
    const { password, passwordCheck } = submitData;
    if (formState.errors?.password) {
      setInputFocus(true);
      return;
    }
    if (password === oldPass) {
      setError('passwordCheck', { message: getIn18Text('XINMIMABUNENG'), type: 'no-match' });
      return;
    }
    if (passwordCheck !== password) {
      setError('passwordCheck', { message: getIn18Text('LIANGCISHURUMI'), type: 'no-match' });
      return;
    }
    const { pass, redirectUrl } = await loginApi.doUpdatePassword(password, sign, oldPass);
    // loginActions.doSetPasswordResetVisible(false);
    if (pass) {
      message.success(getIn18Text('XIUGAIMIMACHENG'));
      clearErrors();
      onSuccess(password, redirectUrl);
    } else {
      setError('passwordCheck', { message: getIn18Text('XIUGAIMIMASHI'), type: 'no-match' });
    }
  };
  const renderIconEye = (visible: boolean) => (visible ? <IconEyeOpen style={EyeIconStyle} /> : <IconEyeClose style={EyeIconStyle} />);
  return (
    <div
      className={classnames(style.resetPasswordForm, {
        [style.resetPasswordStep2]: from === 'setting',
      })}
    >
      {/* {onBack && (
           <div className={style.back} onClick={() => navigate('/login')}>
           {(systemApi.isElectron() && window.location.hash !== '#setting') && (
           <div style={{ display: 'flex' }}>
           <IconBack style={{ marginRight: 12 }} />
           返回
           </div>
           ) }
           </div>
           )} */}
      <div className={style.content}>
        <div className={style.title}>{getIn18Text('XIUGAIMIMA')}</div>
        <div className={style.desc}>{from === 'setting' ? getIn18Text('QINGANZHAOGUIZE') : getIn18Text('WEIBAOZHANGZHANGHU')}</div>

        <FormProvider {...methods}>
          <form onSubmit={e => e.preventDefault()}>
            <Controller
              control={control}
              name="password"
              defaultValue=""
              rules={{ validate: getValidatePasswordRules(pwdrule as PwdRule) }}
              render={({ field }) => (
                <div className={style.passWrapper}>
                  <Input.Password
                    className={style.resetField}
                    style={Object.keys(formState?.errors?.password || {}).length > 0 && noCheck ? { borderColor: 'rgba(38, 42, 51, 0.11)' } : {}}
                    allowClear
                    autoFocus
                    placeholder={getIn18Text('SHEZHIXINMIMA')}
                    {...field}
                    // ref={inputRef}
                    autoComplete="off"
                    onFocus={() => setInputFocus(true)}
                    onBlur={() => setInputFocus(false)}
                    type="password"
                    iconRender={renderIconEye}
                  />
                  {inputFocus && <PasswordHintDropDown rules={pwdrule as PwdRule} />}
                </div>
              )}
            />
            {/* {inputFocus && <PasswordHintDropDown rules={passRule} />} */}

            <Controller
              name="passwordCheck"
              render={({ field }) => (
                <Input.Password
                  allowClear
                  className={style.resetField}
                  placeholder={getIn18Text('ZAICISHURUMI')}
                  autoComplete="off"
                  iconRender={renderIconEye}
                  {...field}
                />
              )}
              control={control}
              defaultValue=""
              rules={{ required: true }}
            />

            <Button className={style.buttonConfirm} block type="primary" onClick={handleSubmit} disabled={!passField || !passConfirmField}>
              {getIn18Text('QUEDING')}
            </Button>
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
