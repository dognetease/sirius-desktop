import React from 'react';
import { ReactComponent as IconXiansuo } from '../svg/v2/xiansuo.svg';
import { ReactComponent as IconKehu } from '../svg/v2/kehu.svg';
import { ReactComponent as IconTuijian } from '../svg/v2/tuijian.svg';
import { ReactComponent as IconShangji } from '../svg/v2/shangji.svg';
import { routeMenu } from '@lxunit/app-l2c-crm';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { getIn18Text } from 'api';
import { TongyongShujutongji } from '@sirius/icons';

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
    label: 'CUSTOMER_MANAGE',
    // layout 里面只有四项，当前的第五项是『销售设置』，只是为了侧边栏点击高亮，并不在header中展示，所以故意设置
    // 如果需要展示『销售设置』，则需要处理 layout，并且其中的『销售目标设置』只有管理员权限可以查看
    layout: [[0], [1], [2], [3]],
    children: [
      {
        name: getIn18Text('XIANSUO'),
        path: '/lead',
        label: 'CHANNEL',
        icon: <IconXiansuo />,
        children: [
          {
            name: getIn18Text('XIANSUOLIEBIAO'),
            path: '/lead/list',
            // path: UniHeaderMenu.uniTableLead.path,
            label: 'CONTACT_CHANNEL_LIST',
            children: [],
          },
          {
            name: getIn18Text('GONGHAIXIANSUO'),
            path: UniHeaderMenu.uniTableLeadPublicSea.path,
            label: 'CHANNEL_OPEN_SEA',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('KEHU'),
        path: 'custom',
        // path: 'uniTableCustomerManage',
        label: 'CONTACT',
        icon: <IconKehu />,
        children: [
          {
            name: getIn18Text('KEHULIEBIAO'),
            path: UniHeaderMenu.uniTableCustomer.path,
            label: 'CONTACT_LIST',
            children: [],
          },
          {
            name: getIn18Text('GONGHAIKEHU'),
            path: UniHeaderMenu.uniTableCustomerPublicSea.path,
            label: 'CONTACT_OPEN_SEA',
            children: [],
          },
          {
            name: getIn18Text('KEHUBIAOQIAN'),
            path: UniHeaderMenu.uniTableCustomerLabel.path,
            label: 'CONTACT_TAG_MANAGE',
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
      // {
      //   name: getIn18Text('DINGDANGUANLI'),
      //   path: 'uniTableOrderManage',
      //   label: 'CUSTOMER_PUBLIC_SEA',
      //   children: [
      //     {
      //       name: getIn18Text('XIAOSHOUDINGDAN'),
      //       path: UniHeaderMenu.uniTableSellOrder.path,
      //       label: '',
      //       topMenuIcon: <WmOrder />,
      //       children: [],
      //     },
      //   ],
      // },
      // {
      //   name: getIn18Text('SHANGPINGUANLI'),
      //   path: 'commodityManage',
      //   label: 'UNI_CUSTOMER',
      //   children: [
      //     {
      //       name: getIn18Text('BENDISHANGPIN'),
      //       path: UniHeaderMenu.uniTableLocalCommodity.path,
      //       label: '',
      //       topMenuIcon: <WmLocalProduct />,
      //       children: [],
      //     },
      //     {
      //       name: getIn18Text('PINGTAISHANGPIN'),
      //       path: UniHeaderMenu.uniTablePlatformCommodity.path,
      //       label: '',
      //       topMenuIcon: <WmPlatformProduct />,
      //       children: [],
      //     },
      //     // {
      //     //   name: getIn18Text('GONGYINGSHANGGUANLI'),
      //     //   path: UniHeaderMenu.uniTableSupplier.path,
      //     //   label: '',
      //     //   topMenuIcon: <WmSupers />,
      //     //   children: [],
      //     // },
      //   ],
      // },
      {
        name: getIn18Text('TUIJIAN'),
        path: 'ioEmail',
        // path: 'recommendCustomer',
        label: 'RECOMMEND',
        icon: <IconTuijian />,
        children: [
          {
            name: getIn18Text('TUIJIANKEHU'),
            path: UniHeaderMenu.uniRecommendCustomer.path,
            label: 'CUSTOMER_RECOMMEND',
            children: [],
          },
          {
            name: getIn18Text('YOUJIANSHAIXUAN'),
            path: '/autoRecommend',
            label: 'PREVIOUS_CONTACT',
            children: [],
          },
          {
            name: getIn18Text('SHOUQUANGUANLI'),
            path: '/authorization',
            label: 'PREVIOUS_CONTACT_GRANT_ADMIN',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('SHANGJI'),
        path: UniHeaderMenu.uniTableBusiness.path,
        // path: 'uniTableBusiness',
        label: 'COMMERCIAL',
        onlyChild: true,
        icon: <IconShangji />,
        // children: [
        //   {
        //     name: '商机列表',
        //     path: UniHeaderMenu.uniTableBusiness.path,
        //     label: 'CONTACT_COMMERCIAL_LIST',
        //     children: [],
        //   },
        // ],
      },
      {
        name: getIn18Text('XIAOSHOUSEHZHI'),
        path: '/sale',
        label: 'SALES_TARGET',
        icon: <TongyongShujutongji />,
        children: [
          {
            name: getIn18Text('XIAOSHOUMUBIAOSEHZHI'),
            path: '/sale/setting',
            label: 'SALES_TARGET_ANALYSIS',
            children: [],
          },
          {
            name: getIn18Text('MUBIAOWANCHENGFENXI'),
            path: '/sale/dashboard',
            label: 'SALES_TARGET_SETTINGS',
            children: [],
          },
        ],
      },
    ],
  },
];
