/* eslint-disable max-len */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { apiHolder as api, apis, locationHelper, LoginApi, SystemApi } from 'api';
import { compose } from '@reduxjs/toolkit';
import classnames from 'classnames';
import { ReactComponent as IconEyeClose } from '@/images/icons/icon-eye-close.svg';
import { ReactComponent as IconEyeOpen } from '@/images/icons/icon-eye-open.svg';
import style from './style.module.scss';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
export interface SubmitData {
  password: string;
}
interface PasswordPrepareFormProps {
  onSuccess: (oldPass: string) => void;
}
export const PasswordPrepareForm = (props: PasswordPrepareFormProps) => {
  const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const systemApi = api.api.getSystemApi() as SystemApi;
  const { onSuccess } = props;
  const { control, getValues, watch } = useForm<SubmitData>({});
  const {
    loginInfo: { loginId = '' },
  } = useAppSelector(state => state.loginReducer);
  const [errMsg, setErrMsg] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const passField = watch('password', '');
  const EyeIconStyle = { marginLeft: 14 };
  const renderIconEye = (visible: boolean) => (visible ? <IconEyeOpen style={EyeIconStyle} /> : <IconEyeClose style={EyeIconStyle} />);
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current?.focus();
    }, 500);
  }, []);
  const handleSubmit = async () => {
    if (!passField) return;
    try {
      const { password } = getValues();
      if (locationHelper.testPathMatch('password_reset')) {
        const _password = compose(atob, atob, atob)(loginId);
        if (password === _password) {
          onSuccess(password);
          return;
        }
        setErrMsg(getIn18Text('MIMACUOWU\uFF0C'));
      } else {
        const email = systemApi.getCurrentUser()?.id || '';
        const pass = await loginApi.doCheckPasswordMatch(password, email);
        if (pass) {
          onSuccess(password);
          setErrMsg('');
          return;
        }
        setErrMsg(getIn18Text('MIMACUOWU\uFF0C'));
      }
    } catch (error) {
      setErrMsg('');
    }
  };
  const handleForgot = () => {
    loginApi.doOpenForgetPwdUrl();
  };
  return (
    <div className={classnames(style.resetPasswordStep1, style.resetPasswordForm)}>
      <div className={style.content}>
        <div className={style.title}>{getIn18Text('SHURUMIMA')}</div>
        <div className={style.desc}>{getIn18Text('WEILENIDEZHANG')}</div>

        <form onSubmit={e => e.preventDefault()}>
          <Controller
            control={control}
            name="password"
            defaultValue=""
            render={({ field }) => (
              <Input.Password
                className={style.resetField}
                allowClear
                placeholder={getIn18Text('QINGSHURUJIUMI')}
                {...field}
                ref={inputRef}
                autoComplete="off"
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
          <Button className={style.buttonConfirm} block type="primary" onClick={handleSubmit} disabled={!passField}>
            {getIn18Text('XIAYIBU')}
          </Button>
          <div className={style.forgotWrap}>
            <div className={style.errMsg}>{errMsg}</div>
            {/* <div className={style.forgotBtn} onClick={handleForgot}>忘记密码</div> */}
          </div>
        </form>
      </div>
    </div>
  );
};
