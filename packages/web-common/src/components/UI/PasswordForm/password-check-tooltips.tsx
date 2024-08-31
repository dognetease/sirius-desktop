/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable max-len */
import React from 'react';
import classNames from 'classnames';
import { useFormContext } from 'react-hook-form';
import { PwdRule, api } from 'api';
import { SubmitData } from './password-reset-form';
import { ReactComponent as IconCorrect } from '@/images/icons/icon-correct.svg';
import { ReactComponent as IconError } from '@/images/icons/icon-error.svg';
import style from './style.module.scss';
import './password-check-tooltips.scss';
import { Popconfirm } from 'antd';
import { getIn18Text } from 'api';
export type RuleType = '长度' | '包含拼音' | '数字连续' | '字母连续' | '字符相同' | '包含账号' | '特殊字符';
interface Rule {
  message: string;
  type: RuleType;
  disable?: boolean;
}
const inElectron = api.getSystemApi().isElectron();
const getRuleList = (rules: PwdRule) => {
  const { charTypeNum = 0, checkNickName = false, maxLen = 16, minLen = 8, seqCharLen = 0, seqNumLen = 0, seqSameChar = 0, checkAccountName = false } = rules;
  const ruleList: Rule[] = [
    {
      message: `必须包含: 数字、大写字母、小写字母、特殊字符中的${charTypeNum}种字符`,
      type: getIn18Text('TESHUZIFU'),
      disable: charTypeNum === 0,
    },
    { message: `密码长度必须为${minLen}至${maxLen}位`, type: getIn18Text('CHANGDU') },
    { message: getIn18Text('MIMABUNENGBAO11'), type: getIn18Text('BAOHANPINYIN'), disable: !checkNickName },
    { message: `连续${seqNumLen}位及以上数字不能连号（例如123、654）`, type: getIn18Text('SHUZILIANXU'), disable: seqNumLen === 0 },
    { message: `连续${seqCharLen}位及以上字母不能连号（例如abc、cba）`, type: getIn18Text('ZIMULIANXU'), disable: seqCharLen === 0 },
    {
      message: `不能包含连续${seqSameChar}个及以上相同字符（例如aaa、rrr）`,
      type: getIn18Text('ZIFUXIANGTONG'),
      disable: seqSameChar === 0,
    },
    { message: getIn18Text('MIMABUNENGBAO'), type: getIn18Text('BAOHANZHANGHAO'), disable: !checkAccountName },
  ];
  return ruleList;
};
interface IPasswordHintProps {
  rules: PwdRule;
  inputFocus: boolean;
  children: any;
}
export const PasswordHintDropDown = (props: IPasswordHintProps) => {
  const { rules, inputFocus, children } = props;
  const {
    formState: { errors },
    watch,
  } = useFormContext<SubmitData>();
  const passErrors = errors.password?.types || {};
  const noCheck = watch('password', '').length >= 3;
  const hasError = (type: RuleType) => Object.keys(passErrors)?.includes(type);
  const ruleList = getRuleList(rules);
  const contentRender = () => {
    return (
      <div className={'password-hint-dropdown'}>
        <div className={'title'}>{getIn18Text('MIMAGUIZE')}</div>
        {ruleList.map(({ message, type, disable }) => (
          <div
            hidden={disable}
            className={`rule-item ${hasError(type) && noCheck ? 'rule-item-error' : null} ${!hasError(type) && noCheck ? 'rule-item-success' : null}`}
          >
            <div className={'rule-icon'}>{!noCheck ? <div className={'blue-dot'} /> : hasError(type) ? <IconError /> : <IconCorrect />}</div>

            {message}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Popconfirm overlayClassName="password-check-viladate" className={style.title} placement="leftTop" title={contentRender} icon={null} visible={inputFocus}>
      {children}
    </Popconfirm>
  );
};
