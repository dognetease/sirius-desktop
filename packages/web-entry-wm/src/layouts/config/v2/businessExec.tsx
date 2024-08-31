import React from 'react';
import { routeMenu } from '@lxunit/app-l2c-crm';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { getIn18Text } from 'api';
import { ReactComponent as IconJiaoyiguanli } from '../svg/v2/jiaoyiguanli.svg';
import { ReactComponent as IconShangpinguanli } from '../svg/v2/shangpinguanli.svg';
import { ReactComponent as IconGongyingshangguanli } from '../svg/v2/gongyingshangguanli.svg';
import { ReactComponent as IconTransportfee } from '../svg/v2/transportfee.svg';
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
  uniTableLead: {
    path: routeMenu.lead.path,
    uniTableIdFlag: 'LEADS',
  },
  uniTableLeadPublicSea: {
    path: routeMenu.publicLeadList.path,
    uniTableIdFlag: 'LEAD_PUBLIC_SEA',
  },
  /** 客户 */
  uniTableCustomer: {
    path: routeMenu.custom.path,
    uniTableIdFlag: 'CUSTOMER',
  },
  /** 公海客户 */
  uniTableCustomerPublicSea: {
    path: routeMenu.publicCustom.path,
    uniTableIdFlag: 'CUSTOMER_PUBLIC_SEA',
  },
  /** 商机 */
  uniTableBusiness: {
    path: routeMenu.business.path,
    uniTableIdFlag: 'CUSTOMER_BUSINESS',
  },
  /** 客户标签 */
  uniTableCustomerLabel: {
    path: routeMenu.customLabel.path,
    uniTableIdFlag: 'CUSTOMER_CUSTOMER_LABEL',
  },
  /** 销售订单 */
  uniTableSellOrder: {
    path: routeMenu.sellOrder.path,
    uniTableIdFlag: 'SALES_ORDER',
  },

  /** 联系人 */
  uniTableContacts: {
    path: routeMenu.contacts.path,
    uniTableIdFlag: 'CONTACT',
  },
  /** 本地商品 */
  uniTableLocalCommodity: {
    path: routeMenu.localProduct.path,
    uniTableIdFlag: 'PRODUCT',
  },
  /** 平台商品 */
  uniTablePlatformCommodity: {
    path: routeMenu.platformProduct.path,
    uniTableIdFlag: 'PLATFORM_PRODUCT',
  },
  /** 供应商 */
  uniTableSupplier: {
    path: routeMenu.supplierManagement.path,
    uniTableIdFlag: 'SUPPLIER',
  },
  /** 推荐客户 */
  uniRecommendCustomer: {
    path: routeMenu.recommendList?.path,
    uniTableIdFlag: 'RECOMMEND_CUSTOMER',
  },
};

export default [
  {
    name: getIn18Text('WAIMAOGUANLI'),
    path: '/unitable-crm/sell-order/list',
    label: 'CUSTOMER_PROMISE',
    layout: [[0], [1], [2]],
    children: [
      {
        name: getIn18Text('JIAOYIGUANLI'),
        path: 'sellManage',
        // path: 'uniTableOrderManage',
        label: 'TRADE_MANAGE',
        icon: <IconJiaoyiguanli />,
        children: [
          {
            name: getIn18Text('XIAOSHOUDINGDAN'),
            path: UniHeaderMenu.uniTableSellOrder.path,
            label: 'ORDER',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('SHANGPINGUANLI'),
        path: 'product',
        // path: 'commodityManage',
        label: 'PRODUCT',
        icon: <IconShangpinguanli />,
        children: [
          {
            name: getIn18Text('BENDISHANGPIN'),
            path: UniHeaderMenu.uniTableLocalCommodity.path,
            label: 'LOCAL_PRODUCT',
            children: [],
          },
          {
            name: getIn18Text('PINGTAISHANGPIN'),
            path: UniHeaderMenu.uniTablePlatformCommodity.path,
            label: 'PLATFORM_PRODUCT',
            children: [],
          },
        ],
      },
      {
        name: '运价管理',
        icon: <IconTransportfee />,
        label: 'FREIGHT_CHARGE_MANAGE',
        path: 'price',
        children: [
          {
            name: '生效报价',
            label: 'EFFECT_FREIGHT_CHARGE',
            path: '/price/effective',
            children: [],
          },
          {
            name: '待生效报价',
            label: 'WAITING_APPROVAL_FREIGHT_CHARGE',
            path: '/price/pending',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('GONGYINGSHANGGUANLI'),
        path: UniHeaderMenu.uniTableSupplier.path,
        label: 'SUPPLIER_MANAGE',
        onlyChild: true,
        icon: <IconGongyingshangguanli />,
        children: [],
      },
      // {
      //   name: getIn18Text('GONGYINGSHANGGUANLI'),
      //   path: 'commodityManage',
      //   label: 'UNI_CUSTOMER',
      //   children: [
      //     {
      //       name: getIn18Text('GONGYINGSHANGGUANLI'),
      //       path: UniHeaderMenu.uniTableSupplier.path,
      //       label: '',
      //       topMenuIcon: <WmSupers />,
      //       children: [],
      //     },
      //   ],
      // },
    ],
  },
];
