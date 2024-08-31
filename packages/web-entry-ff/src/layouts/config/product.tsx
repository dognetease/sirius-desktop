import React from 'react';

import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { SettingUpdateParam } from 'api';
import { ReactComponent as WmMailSetting } from '../../../../web-common/src/images/icons/wm_mail_setting.svg';
import { ReactComponent as WmContact } from './svg/contact.svg';
import { ReactComponent as WmCustomer } from './svg/customer.svg';
import { ReactComponent as WmLocalProduct } from './svg/local-product.svg';
import { ReactComponent as WmOrder } from './svg/order.svg';
import { ReactComponent as WmPlatformProduct } from './svg/platform-product.svg';
import { ReactComponent as WmSupers } from './svg/supers.svg';
import { ReactComponent as WmAutoFilter } from './svg/auto-filter.svg';
import { ReactComponent as WmOpportunity } from './svg/manual-filter.svg';
import { getIn18Text } from 'api';

/**
 *
 */
export const UniHeaderMenu: Record<
  string,
  {
    path: string;
    uniTableIdFlag: string;
  }
> = {
  /**客户 */
  uniTableCustomer: {
    path: 'uniTableCustomer',
    uniTableIdFlag: 'CUSTOMER',
  },
  /**销售订单 */
  uniTableSellOrder: {
    path: 'uniTableSellOrder',
    uniTableIdFlag: 'SALES_ORDER',
  },
  /**联系人 */
  uniTableContacts: {
    path: 'uniTableContacts',
    uniTableIdFlag: 'CONTACT',
  },
  /**本地商品 */
  uniTableLocalCommodity: {
    path: 'uniTableLocalCommodity',
    uniTableIdFlag: 'PRODUCT',
  },
  /**平台商品 */
  uniTablePlatformCommodity: {
    path: 'uniTablePlatformCommodity',
    uniTableIdFlag: 'PLATFORM_PRODUCT',
  },
  /**供应商 */
  uniTableSupplier: {
    path: 'uniTableSupplier',
    uniTableIdFlag: 'SUPPLIER',
  },
};

export default [
  {
    name: '外贸管理',
    path: TopMenuPath.unitable_crm,
    label: '',
    children: [
      {
        name: '客户管理',
        path: 'uniTableCustomerManage',
        label: 'UNI_CUSTOMER',
        children: [
          {
            name: '客户',
            path: UniHeaderMenu.uniTableCustomer.path,
            label: '',
            topMenuIcon: <WmCustomer />,
            children: [],
          },
          {
            name: '销售订单',
            path: UniHeaderMenu.uniTableSellOrder.path,
            label: '',
            topMenuIcon: <WmOrder />,
            children: [],
          },
          {
            name: '联系人',
            path: UniHeaderMenu.uniTableContacts.path,
            label: '',
            topMenuIcon: <WmContact />,
            children: [],
          },
        ],
      },
      {
        name: '商品管理',
        path: 'commodityManage',
        label: 'UNI_CUSTOMER',
        children: [
          {
            name: '本地商品',
            path: UniHeaderMenu.uniTableLocalCommodity.path,
            label: '',
            topMenuIcon: <WmLocalProduct />,
            children: [],
          },
          {
            name: '平台商品',
            path: UniHeaderMenu.uniTablePlatformCommodity.path,
            label: '',
            topMenuIcon: <WmPlatformProduct />,
            children: [],
          },
          {
            name: '供应商管理',
            path: UniHeaderMenu.uniTableSupplier.path,
            label: '',
            topMenuIcon: <WmSupers />,
            children: [],
          },
        ],
      },

      {
        name: getIn18Text('WANGLAIYOUJIANSHAIXUANWEB'),
        path: 'emailFilter',
        label: 'PREVIOUS_CONTACT',
        icon: <WmMailSetting />,
        children: [
          {
            name: getIn18Text('ZIDONGSHAIXUAN'),
            path: 'autoRecommend',
            label: 'PREVIOUS_CONTACT_AUTO_RECOMMEND',
            topMenuIcon: <WmAutoFilter />,
            children: [],
          },
          {
            name: getIn18Text('SHOUDONGSHAIXUAN'),
            path: 'customRecommend',
            label: 'PREVIOUS_CONTACT_CUSTOM_RECOMMEND',
            topMenuIcon: <WmOpportunity />,
            children: [],
          },
          {
            name: getIn18Text('SHAIXUANJILUZONGLAN'),
            path: 'recommendOperateList',
            label: 'PREVIOUS_CONTACT_OP_LIST',
            show: false,
            children: [],
          },
          {
            name: getIn18Text('SHOUQUANGUANLI'),
            path: 'authorization',
            label: 'PREVIOUS_CONTACT_GRANT_ADMIN',
            show: false,
            children: [],
          },
        ],
      },
    ],
  },
];
