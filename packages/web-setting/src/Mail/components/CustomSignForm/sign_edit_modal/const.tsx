import React from 'react';
import { AddSignReq, AddCustomizeSignReq, SignTemplate, SystemApi, api } from 'api';
import { RegisterOptions } from 'react-hook-form';
import { ReactComponent as WithAvatarIcon } from '@/images/icons/mail/withAvatar.svg';
import { ReactComponent as WithAvatarSelectedIcon } from '@/images/icons/mail/withAvatar-selected.svg';
import { ReactComponent as WithoutAvatarIcon } from '@/images/icons/mail/withoutAvatar.svg';
import { ReactComponent as WithoutAvatarSeletedIcon } from '@/images/icons/mail/withoutAvatar-selected.svg';
import { ReactComponent as CustomSignIcon } from '@/images/icons/mail/custom-sign.svg';
import { ReactComponent as CustomSignSelectedIcon } from '@/images/icons/mail/custom-sign-selected.svg';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface FormSubmitData extends AddSignReq, AddCustomizeSignReq {
  extraFields: Array<{
    field: string;
  }>;
}
export const MacCharRule = { maxLength: { value: 25, message: getIn18Text('QINGSHURU25') } };
export const MacChar100Rule = { maxLength: { value: 100, message: getIn18Text('QINGSHURU10') } };
export const defaultFormFields: InputField[] = [
  {
    name: 'name',
    placeholder: getIn18Text('QINGSHURUXINGMING'),
    rules: {
      ...MacCharRule,
      required: { value: true, message: getIn18Text('XINGMINGBUNENGWEI') },
      validate: value => (value?.trim() === '' ? getIn18Text('XINGMINGBUNENGWEI') : true),
    },
  },
  {
    name: 'position',
    placeholder: getIn18Text('XUANTIAN\uFF0CZHIWEI'),
    rules: MacChar100Rule,
  },
  {
    name: 'companyName',
    placeholder: getIn18Text('XUANTIAN\uFF0CGONGSI'),
    rules: MacChar100Rule,
  },
  {
    name: 'emailAddr',
    placeholder: getIn18Text('QINGSHURUYOUXIANG2'),
    rules: MacChar100Rule,
  },
  {
    name: 'phoneNo',
    placeholder: getIn18Text('XUANTIAN\uFF0CLIANXI11'),
    rules: MacChar100Rule,
  },
  {
    name: 'addr',
    placeholder: getIn18Text('XUANTIAN\uFF0CLIANXI'),
    rules: MacChar100Rule,
  },
];
export const getDefaultValue = (currentAccount?: string) => {
  const systemApi = api.getSystemApi() as SystemApi;
  const { nickName, id } = systemApi?.getCurrentUser(currentAccount) || {};
  return {
    // signTemplateId: 1,
    signTemplateId: 1002,
    name: nickName,
    position: '',
    companyName: '',
    emailAddr: id,
    phoneNo: '',
    addr: '',
    showAppVipTag: false,
    extraFields: [],
    profilePhoto: '',
  };
};
export const getOptions = (templates: SignTemplate[], value: number) =>
  templates
    .map((tep, index) => ({
      label: (
        <div className={`${style.groupItem} group-item-checked`}>
          <span>
            {/* <img src={tep.picUrl} alt="temp" /> */}
            {index === 0 ? value === 1 ? <WithAvatarSelectedIcon /> : <WithAvatarIcon /> : value === 1002 ? <WithoutAvatarSeletedIcon /> : <WithoutAvatarIcon />}
          </span>
        </div>
      ),
      value: tep.id,
    }))
    .concat({
      label: <div className={`${style.groupItem} group-item-checked`}>{value === 0 ? <CustomSignSelectedIcon /> : <CustomSignIcon />}</div>,
      value: 0,
    });
export interface InputField {
  name: keyof FormSubmitData;
  placeholder: string;
  rules?: RegisterOptions;
}
export const EmptyRtxContent =
  '<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body style="line-height: 1.5; font-size: 14px; color: rgba(38, 42, 51, 0.9); font-family: \'Source Han Sans\';">\n\n</body>\n</html>';
