import React from 'react';
import { getIn18Text } from 'api';
import { TongyongQuanbu, TongyongRenyuan4, TongyongXunhuan, TongyongZijin, TongyongSuoGuan } from '@sirius/icons';
import { getTransText } from '@/components/util/translate';

export default [
  {
    name: getIn18Text('QIYESHEZHI'),
    path: 'enterpriseSetting',
    type: 'group',
    label: 'ORG_SETTINGS',
    children: [
      {
        name: getIn18Text('QUANXIANGUANLIWM'),
        path: 'privilege',
        icon: <TongyongSuoGuan wrapClassName="ant-menu-item-icon" style={{ color: '#6F7485', strokeWidth: 1.3 }} />,
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
        path: 'customer-development',
        name: getIn18Text('KEHUKAIFA'),
        label: 'ORG_SETTINGS_CUSTOMER_EXLOIT',
        icon: <TongyongXunhuan wrapClassName="ant-menu-item-icon" style={{ color: '#6F7485', strokeWidth: 1.3 }} />,
        children: [
          {
            path: 'variables',
            name: getIn18Text('YOUJIANYINGXIAOMOBANBIANLIANG'),
            label: 'ORG_SETTINGS_TMPL_VARIABLE_SETTING',
            children: [],
          },
          {
            path: 'quota',
            name: getIn18Text('YOUJIANYINGXIAOPEIE'),
            label: 'ORG_SETTINGS_QUOTA_SETTING',
            children: [],
          },
          {
            path: 'marketingSetting',
            name: getIn18Text('YOUJIANYINGXIAOFAJIANXIAN'),
            label: 'ORG_SETTINGS_EMAIL_SEND_QUOTA_SETTING',
            children: [],
          },
          {
            path: 'insertWhatsApp',
            name: getIn18Text('WhatsAppDUIJIE'),
            label: 'ORG_SETTINGS_PEER_SETTING',
            children: [],
          },
        ],
      },
      {
        path: 'customer-management',
        name: getIn18Text('KEHUGUANLISHEZHI'),
        label: 'ORG_SETTINGS_CUSTOMER_MANAGE',
        icon: <TongyongRenyuan4 wrapClassName="ant-menu-item-icon" style={{ color: '#6F7485', strokeWidth: 1.3 }} />,
        children: [
          {
            name: getTransText('XIANSUOHEGONGHAIXIANSUO'),
            path: 'leads-setting',
            label: 'ORG_SETTINGS_CHANNEL_AND_OPEN_SEA',
            children: [],
          },
          {
            name: getTransText('KEHUHEGONGHAIKEHU'),
            path: 'customer-setting',
            label: 'ORG_SETTINGS_CUSTOMER_AND_OPEN_SEA',
            children: [],
          },
          {
            name: getTransText('SHANGJI'),
            path: 'customer_opportunity-setting',
            label: 'ORG_SETTINGS_COMMERCIAL',
            children: [],
          },
          {
            name: `${getTransText('WANGLAIYOUJIAN')}-${getTransText('BAIMINGDAN')}`,
            path: 'authorizationEmail',
            label: 'ORG_SETTINGS_WHITELIST_SETTING',
            children: [],
          },
        ],
      },
      {
        path: 'customer-fulfillment',
        name: getIn18Text('KEHULVYUE'),
        label: 'ORG_SETTINGS_PRODUCT',
        icon: <TongyongZijin wrapClassName="ant-menu-item-icon" style={{ color: '#6F7485', strokeWidth: 1.3 }} />,
        children: [
          {
            name: getTransText('XIAOSHOUDINGDAN'),
            path: 'order-setting',
            label: 'ORG_SETTINGS_ORDER',
            children: [],
          },
          {
            name: getTransText('BENDISHANGPIN'),
            path: 'product-setting',
            label: 'ORG_SETTINGS_LOCAL_PRODUCT',
            children: [],
          },
          {
            name: getTransText('PINGTAISHANGPIN'),
            path: 'platform_product-setting',
            label: 'ORG_SETTINGS_PLATFORM_PRODUCT',
            children: [],
          },
          {
            name: getTransText('GONGYINGSHANGGUANLI'),
            path: 'supplier-setting',
            label: 'ORG_SETTINGS_SUPPLIER',
            children: [],
          },
          {
            name: getTransText('HUILVSHEZHI'),
            path: 'exchange_rate-setting',
            label: 'ORG_SETTINGS_EXCHANGE_SETTING',
            children: [],
          },
        ],
      },
      {
        path: 'others',
        name: getIn18Text('QITA'),
        label: 'ORG_SETTINGS_OTHERS',
        icon: <TongyongQuanbu wrapClassName="ant-menu-item-icon" style={{ color: '#6F7485', strokeWidth: 1.3 }} />,
        children: [
          {
            path: 'mailTag',
            name: getIn18Text('YOUJIANZHINENGBIAOQIAN'),
            label: 'ORG_SETTINGS_AI_TAG_SETTING',
            children: [],
          },
          {
            name: `${getTransText('HUASHUKU')}`,
            path: 'salesPitch',
            label: 'ORG_SETTINGS_WORD_ART_LIBRARY',
            children: [],
          },
          {
            path: 'noticeSetting',
            name: getIn18Text('TONGZHISHEZHI'),
            label: 'ORG_SETTINGS_NOTIFY_SETTING',
            children: [],
          },
          {
            path: 'systemTaskConfig',
            name: getTransText('RENWUGUIZESHEZHI'),
            label: 'ORG_SETTINGS_TASK_CENTER_RULE_SETTING',
            children: [],
          },
        ],
      },
    ],
  },
];
