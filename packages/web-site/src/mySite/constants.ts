import { getIn18Text } from 'api';

export type Theme = 'INDEX' | 'PRODUCT_DETAIL';

export const DETAIL_IMG_URL = 'https://cowork-storage-public-cdn.lx.netease.com/common/2022/12/29/84231eb241f54680a839069b62593207.png';

export const DROPDOWN_OPTIONS = [
  {
    key: 'rename',
    label: '网站管理',
  },
  {
    key: 'bindDomain',
    label: '绑定域名',
  },
  {
    key: 'recordDomain',
    label: '域名备案',
  },
  {
    key: 'optimizeSeo',
    label: 'SEO优化',
  },
  {
    key: 'configHttps',
    label: '配置证书',
  },
  {
    key: 'bindAnalysis',
    label: '自定义代码',
  },
  {
    key: 'viewService',
    label: '查看服务',
  },
  {
    key: 'delete',
    label: getIn18Text('SHANCHU'),
  },
  {
    key: 'offline',
    label: getIn18Text('XIAXIAN'),
  },
];

export const SITE_SWITCH_OPTIONS = [
  {
    value: 'all',
    label: getIn18Text('QUANBUZHANDIAN'),
  },
  {
    value: 'index',
    label: getIn18Text('GUANWANG'),
  },
  {
    value: 'details',
    label: getIn18Text('SHANGPINXIANGQINGYE'),
  },
];

export const STATUS_LABEL: Record<STATUS_ENUM, string> = {
  ONLINE: getIn18Text('SHANGXIANZHONG'),
  OFFLINE: getIn18Text('WEISHANGXIAN'),
  DRAFT: getIn18Text('WEISHANGXIAN'),
  INIT: getIn18Text('WEISHANGXIAN'),
};

export enum STATUS_ENUM {
  ONLINE = 'ONLINE',
  // 下线，暂时没有下线，所以展示未上线
  OFFLINE = 'OFFLINE',
  // 草稿
  DRAFT = 'DRAFT',
  INIT = 'INIT',
}

export enum THEME {
  INDEX = 'INDEX',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
}

export enum DOMAIN_STATUS {
  INIT = 0, // 初始状态
  CHECK_READY = 1, // 检测完成（完成 TXT 检测，等待配置cdn域名）
  CONFIG_READY = 3, // 配置完成（已经配置完 CDN 域名，等待用户 cname）
  EFFECTED = 7, // 已生效（用户已配置 cname，可以使用的状态）
  SECURED = 15, // 开启HTTPS
}

export enum SEO_CONFIG_TYPE {
  TITLE = 'title',
  KEYWORD = 'keyword',
  DESCRIPTION = 'description',
}
