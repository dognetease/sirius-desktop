import React from 'react';
import { getIn18Text } from 'api';
import { ReactComponent as SettingCustoms } from '../../../../web-common/src/images/icons/setting_customs.svg';
import { ReactComponent as SettingEdm } from '../../../../web-common/src/images/icons/setting_edm.svg';
import { ReactComponent as SettingEmail } from '../../../../web-common/src/images/icons/setting_email.svg';
import { ReactComponent as SettingNotice } from '../../../../web-common/src/images/icons/setting_notice.svg';
import { ReactComponent as SettingTags } from '../../../../web-common/src/images/icons/setting_tags.svg';
import { ReactComponent as SettingWhatsapp } from '../../../../web-common/src/images/icons/setting_whatsapp.svg';
import { ReactComponent as SettingSystemTask } from '../../../../web-common/src/images/icons/setting_system_task.svg';
import { getTransText } from '@/components/util/translate';

export default [
  {
    name: getIn18Text('QIYESHEZHI'),
    path: 'enterpriseSetting',
    type: 'group',
    children: [
      {
        name: getIn18Text('QUANXIANGUANLIWM'),
        path: 'privilege',
        icon: <SettingEmail />,
        children: [
          {
            name: getIn18Text('QIYECHENGYUAN'),
            path: 'members',
            parent: 'privilege',
            children: [],
          },
          {
            name: getIn18Text('JIAOSEGUANLI'),
            path: 'rolePermissions',
            parent: 'privilege',
            subset: ['roleDetail'],
            children: [],
          },
          {
            name: getIn18Text('CAIDANGUANLI'),
            path: 'menuSetting',
            parent: 'privilege',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('KEHUSHEZHI'),
        path: 'customSetting',
        icon: <SettingCustoms />,
        children: [
          {
            name: getIn18Text('XIANSUOHEGONGHAIXIANSUO'),
            path: 'leads-setting',
            icon: '',
            children: [],
          },
          {
            name: getTransText('KEHU') + getTransText('HE') + getTransText('GONGHAIKEHU'),
            path: 'customer-setting',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('XIAOSHOUDINGDAN'),
            path: 'order-setting',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('SHANGJI'),
            path: 'customer_opportunity-setting',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('WANGLAIYOUJIANBAIMINGDAN'),
            path: 'authorizationEmail',
            label: 'ORG_SETTINGS_WHITELIST_SETTING',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('HUASHUKU'),
            path: 'salesPitch',
            label: 'ORG_SETTINGS_WORD_ART_LIBRARY',
            icon: '',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('SHANGPINGUANLISHEZHI'),
        path: 'goodSetting',
        icon: <SettingEdm />,
        children: [
          {
            name: getIn18Text('BENDISHANGPIN'),
            path: 'product-setting',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('PINGTAISHANGPIN'),
            path: 'platform_product-setting',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('GONGYINGSHANGGUANLI'),
            path: 'supplier-setting',
            icon: '',
            children: [],
          },
          {
            name: getTransText('HUILVSHEZHI'),
            path: 'exchange_rate-setting',
            icon: '',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('YOUJIANYINGXIAOSHEZHI'),
        path: 'edmSetting',
        icon: <SettingEdm />,
        children: [
          {
            name: getIn18Text('YOUJIANYINGXIAOMOBANBIANLIANG'),
            path: 'variables',
            label: 'ORG_SETTINGS_TMPL_VARIABLE_SETTING',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('YOUJIANYINGXIAOPEIE'),
            path: 'quota',
            label: 'ORG_SETTINGS_QUOTA_SETTING',
            icon: '',
            children: [],
          },
          {
            name: getIn18Text('YOUJIANYINGXIAOFAJIANXIAN'),
            path: 'marketingSetting',
            label: 'ORG_SETTINGS_EMAIL_SEND_QUOTA_SETTING',
            icon: '',
            children: [],
          },
        ],
      },
      {
        name: 'WhatsApp',
        path: '',
        icon: <SettingWhatsapp />,
        children: [
          {
            name: getIn18Text('WhatsAppDUIJIE'),
            path: 'insertWhatsApp',
            label: 'ORG_SETTINGS_PEER_SETTING',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('YOUJIANZHINENGBIAOQIAN'),
        path: 'mailTag',
        label: 'ORG_SETTINGS_AI_TAG_SETTING',
        icon: <SettingTags />,
        children: [],
      },
      {
        name: getIn18Text('TONGZHISHEZHI'),
        path: 'noticeSetting',
        babel: 'ORG_SETTINGS_NOTIFY_SETTING',
        icon: <SettingNotice />,
        children: [],
      },
      {
        name: getIn18Text('RENWUGUIZESHEZHI'),
        path: 'systemTaskConfig',
        babel: 'ORG_SETTINGS_TASK_CENTER_RULE_SETTING',
        icon: <SettingSystemTask />,
        children: [],
      },
    ],
  },
];
