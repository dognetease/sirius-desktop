import React from 'react';
import { getIn18Text } from 'api';
import { TopMenuPath } from '@web-common/conf/waimao/constant';

import { ReactComponent as IconWodezhandian } from '../svg/v2/wodezhandian.svg';
import { ReactComponent as IconHaiwaishemei } from '../svg/v2/haiwaishemei.svg';
import { ReactComponent as IconPinpaijianshe } from '../svg/v2/pinpaijianshe.svg';
import { ReactComponent as IconToufangguanli } from '../svg/v2/toufangguanli.svg';
import { getTransText } from '@/components/util/translate';

export default [
  {
    name: getIn18Text('SITE_PINPAIJIANSHE'),
    path: TopMenuPath.site,
    label: 'WEBSITE_ADMIN',
    layout: [[0], [1], [2], [3]],
    children: [
      {
        name: '品牌首页',
        path: 'brand',
        label: 'WEBSITE_MAIN_PAGE',
        icon: <IconPinpaijianshe />,
        onlyChild: true,
      },
      {
        name: '建站管理',
        path: 'WEBSITE_ADMIN_MINE',
        label: 'WEBSITE_MANAGE',
        icon: <IconWodezhandian />,
        children: [
          {
            name: getTransText('WODEZHANDIAN'),
            path: 'mySite',
            label: 'WEBSITE_ADMIN_MINE',
            children: [],
          },
          {
            name: getTransText('YINGXIAOLUODIYE'),
            path: 'market',
            label: 'WEBSITE_ADMIN_MARKET',
            children: [],
          },
          {
            name: getTransText('ZHANDIANSHUJU'),
            path: 'stat',
            label: 'WEBSITE_ADMIN_DATA',
            children: [],
          },
          {
            path: 'myDomain',
            name: getIn18Text('YUMINGGUANLI'),
            label: 'DOMAIN_ADMIN',
            children: [],
          },
          {
            path: 'articleList',
            name: getIn18Text('SITE_WENZHANGGUANLI'),
            label: 'ARTICLE_ADMIN',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('HAIWAISHEMEI'),
        path: 'snsMarketing',
        icon: <IconHaiwaishemei />,
        label: 'SOCIAL_MEDIA',
        children: [
          {
            name: getIn18Text('ZHANGHAOBANGDING'),
            path: 'snsAccountBinding',
            label: 'SOCIAL_MEDIA_ACCOUNT',
            _label: 'SOCIAL_MEDIA_ACCOUNT',
            children: [],
            subset: ['snsAccountDataAnalysis'],
          },
          {
            name: getIn18Text('SHEMEISHUJU'),
            path: 'snsGlobalDataAnalysis',
            label: 'SOCIAL_MEDIA_DATA',
            _label: 'SOCIAL_MEDIA_DATA',
            children: [],
          },
          {
            path: 'snsMarketingTask',
            name: getIn18Text('YINGXIAORENWU'),
            label: 'SOCIAL_MEDIA_TASK',
            _label: 'SOCIAL_MEDIA_TASK',
            children: [],
            subset: ['snsMarketingTaskEdit', 'snsMarketingTaskDetail'],
          },
          {
            path: 'snsCalendar',
            name: getIn18Text('YINGXIAORILI'),
            label: 'SOCIAL_MEDIA_CALENDAR',
            _label: 'SOCIAL_MEDIA_CALENDAR',
            children: [],
          },
          {
            path: 'snsPostManage',
            name: getIn18Text('TIEZIGUANLIv16'),
            label: 'SOCIAL_MEDIA_POST',
            _label: 'SOCIAL_MEDIA_POST',
            children: [],
            subset: ['snsSendPost'],
          },
          {
            path: 'snsMessage',
            name: getIn18Text('SnsMessage'),
            label: 'SOCIAL_MEDIA_MESSAGE',
            _label: 'SOCIAL_MEDIA_MESSAGE',
            children: [],
          },
        ],
      },
      {
        name: '投放管理',
        path: 'PLACEMENT_MAMAGE',
        label: 'PLACEMENT_MAMAGE',
        icon: <IconToufangguanli />,
        children: [
          {
            name: '流量投放',
            path: 'trafficDelivery',
            label: 'TRAFFIC_PLACEMENT',
            _label: 'TRAFFIC_PLACEMENT',
            children: [],
          },
        ],
      },
    ],
  },
];
