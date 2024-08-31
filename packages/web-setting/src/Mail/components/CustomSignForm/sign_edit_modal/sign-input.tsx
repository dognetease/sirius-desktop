import React from 'react';
import { Input, InputProps } from 'antd';
import style from './style.module.scss';

interface SignInputProps extends InputProps {
  errorMsg?: string;
}

const SignInput = (props: SignInputProps) => (
  <div className={style.inputWrapper}>
    <Input style={props.errorMsg ? { borderColor: '#F74F4F', boxShadow: 'none' } : {}} className={style.inputField} {...props} />
    {props.errorMsg && <div className={style.errMsg}>{props.errorMsg}</div>}
  </div>
);

export default SignInput;
