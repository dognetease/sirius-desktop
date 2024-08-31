import React from 'react';
import { routeMenu } from '@lxunit/app-l2c-crm';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { SettingUpdateParam, getIn18Text } from 'api';
import { ReactComponent as WmMailSetting } from '../../../../web-common/src/images/icons/wm_mail_setting.svg';
import { ReactComponent as WmPublicSeaCustomer } from './svg/customer-public-sea.svg';
import { ReactComponent as WmCustomer } from './svg/customer.svg';
import { ReactComponent as WmLocalProduct } from './svg/local-product.svg';
import { ReactComponent as WmOrder } from './svg/order.svg';
import { ReactComponent as WmPlatformProduct } from './svg/platform-product.svg';
import { ReactComponent as WmSupers } from './svg/supers.svg';
import { ReactComponent as WmAutoFilter } from './svg/auto-filter.svg';
import { ReactComponent as WmOpportunity } from './svg/manual-filter.svg';
import { ReactComponent as WmBusiness } from './svg/business.svg';
import { ReactComponent as WmLeads } from './svg/leads.svg';
import { ReactComponent as WmOpenSeaLeads } from './svg/open-sea-leads.svg';
import { ReactComponent as WmCustomerLabel } from './svg/customer-label.svg';
import { ReactComponent as WmRecommend } from './svg/recommend.svg';

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
    path: TopMenuPath.unitable_crm,
    label: '',
    children: [
      {
        name: getIn18Text('XIANSUOGUANLI'),
        path: 'uniTableLeadManage',
        label: 'UNI_LEAD',
        children: [
          {
            name: getIn18Text('XIANSUOLIEBIAO'),
            path: UniHeaderMenu.uniTableLead.path,
            label: '',
            topMenuIcon: <WmLeads />,
            children: [],
          },
          {
            name: getIn18Text('GONGHAIXIANSUO'),
            path: UniHeaderMenu.uniTableLeadPublicSea.path,
            label: '',
            topMenuIcon: <WmOpenSeaLeads />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('KEHUGUANLI'),
        path: 'uniTableCustomerManage',
        label: 'UNI_CUSTOMER',
        children: [
          {
            name: getIn18Text('KEHULIEBIAO'),
            path: UniHeaderMenu.uniTableCustomer.path,
            label: '',
            topMenuIcon: <WmCustomer />,
            children: [],
          },
          {
            name: getIn18Text('GONGHAIKEHU'),
            path: UniHeaderMenu.uniTableCustomerPublicSea.path,
            label: '',
            topMenuIcon: <WmPublicSeaCustomer />,
            children: [],
          },
          {
            name: getIn18Text('KEHUBIAOQIAN'),
            path: UniHeaderMenu.uniTableCustomerLabel.path,
            label: '',
            topMenuIcon: <WmCustomerLabel />,
            children: [],
          },

          // {
          //     name:"联系人",
          //     path: UniHeaderMenu.uniTableContacts.path,
          //     label:'',
          //     topMenuIcon: <WmContact />,
          //     children: []
          // }
        ],
      },
      {
        name: getIn18Text('SHANGJIGUANLI'),
        path: 'uniTableBusiness',
        label: 'CUSTOMER_BUSINESS',
        children: [
          {
            name: getIn18Text('SHANGJI'),
            path: UniHeaderMenu.uniTableBusiness.path,
            label: '',
            topMenuIcon: <WmBusiness />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('DINGDANGUANLI'),
        path: 'uniTableOrderManage',
        label: 'CUSTOMER_PUBLIC_SEA',
        children: [
          {
            name: getIn18Text('XIAOSHOUDINGDAN'),
            path: UniHeaderMenu.uniTableSellOrder.path,
            label: '',
            topMenuIcon: <WmOrder />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('SHANGPINGUANLI'),
        path: 'commodityManage',
        label: 'UNI_CUSTOMER',
        children: [
          {
            name: getIn18Text('BENDISHANGPIN'),
            path: UniHeaderMenu.uniTableLocalCommodity.path,
            label: '',
            topMenuIcon: <WmLocalProduct />,
            children: [],
          },
          {
            name: getIn18Text('PINGTAISHANGPIN'),
            path: UniHeaderMenu.uniTablePlatformCommodity.path,
            label: '',
            topMenuIcon: <WmPlatformProduct />,
            children: [],
          },
          {
            name: getIn18Text('GONGYINGSHANGGUANLI'),
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
            name: getIn18Text('TUIJIANKEHU'),
            path: UniHeaderMenu.uniRecommendCustomer.path,
            label: '',
            topMenuIcon: <WmRecommend />,
            children: [],
          },
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
