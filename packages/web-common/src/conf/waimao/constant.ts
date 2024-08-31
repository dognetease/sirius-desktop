import { ChildrenType } from 'web-entry-wm/src/layouts/config/topMenu';

export enum TopMenuPath {
  worktable = 'worktable',
  mailbox = 'mailbox',
  wm = 'wm',
  wmData = 'wmData',
  intelliMarketing = 'intelliMarketing',
  site = 'site',
  coop = 'coop',
  enterpriseSetting = 'enterpriseSetting',
  rbac = 'rbac',
  personal = 'personal',
  systemTask = 'systemTask',
  noviceTask = 'noviceTask',
  whatsAppRegister = 'whatsAppRegister',
  unitable_crm = '/unitable-crm',
  wa = 'wa',
}

export const speUrl = [TopMenuPath.mailbox, TopMenuPath.worktable];

export interface TopMenuType {
  name: React.ReactNode;
  path: string;
  hiddenWithFree?: boolean;
  open?: boolean;
  hidden?: boolean;
  topIcon?: React.ReactNode;
  children: ChildrenType[];
  layout?: number[][];
}

// 客户管理
export const l2cV2forbusinessManage = [
  // 客户列表
  {
    menuLabel: 'CONTACT_LIST',
    url: '/unitable-crm/custom/list',
  },
  // 线索列表
  {
    menuLabel: 'CONTACT_CHANNEL_LIST',
    url: '/unitable-crm/lead/list',
  },
  //  推荐客户（CUSTOMER_RECOMMEND）
  {
    menuLabel: 'CUSTOMER_RECOMMEND',
    url: '/unitable-crm/recommend/list',
  },
  // 商机列表（CONTACT_COMMERCIAL_LIST）
  {
    menuLabel: 'CONTACT_COMMERCIAL_LIST',
    url: '/unitable-crm/business/list',
  },
  // 公海线索
  {
    menuLabel: 'CHANNEL_OPEN_SEA',
    url: '/unitable-crm/lead/public/list',
  },
  // 客户公海
  {
    menuLabel: 'CONTACT_OPEN_SEA',
    url: '/unitable-crm/custom/public/list',
  },

  //  客户标签（CONTACT_TAG_MANAGE）
  {
    menuLabel: 'CONTACT_TAG_MANAGE',
    url: '/unitable-crm/custom/label/list',
  },
  //  邮件筛选（PREVIOUS_CONTACT）
  {
    menuLabel: 'PREVIOUS_CONTACT',
    url: '/unitable-crm/autoRecommend',
  },

  // 授权管理（PREVIOUS_CONTACT_GRANT_ADMIN）
  {
    menuLabel: 'PREVIOUS_CONTACT_GRANT_ADMIN',
    url: '/unitable-crm/authorization',
  },
];

// 客户履约
export const l2cV2forbusinessExec = [
  // 销售订单
  {
    menuLabel: 'ORDER',
    url: '/unitable-crm/sell-order/list',
  },
  // 本地商品
  {
    menuLabel: 'LOCAL_PRODUCT',
    url: '/unitable-crm/product/local/list',
  },

  // 平台管理
  {
    menuLabel: 'PLATFORM_PRODUCT',
    url: '/unitable-crm/product/platform/list',
  },

  // 供应商
  {
    menuLabel: 'SUPPLIER_MANAGE',
    url: '/unitable-crm/supplier/management',
  },
];
