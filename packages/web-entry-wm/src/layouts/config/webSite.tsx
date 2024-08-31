import React from 'react';
import { getIn18Text } from 'api';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { ReactComponent as TopSnsMarketing } from '@web-common/images/icons/top_sns_marketing.svg';
import { ReactComponent as Site } from '../../../../web-common/src/images/icons/site.svg';
import { ReactComponent as TopSite } from '../../../../web-common/src/images/icons/top_site.svg';
import { ReactComponent as TopSiteStat } from '../../../../web-common/src/images/icons/top_site_stat.svg';
import { ReactComponent as TopSiteMarket } from '../../../../web-common/src/images/icons/top_site_market.svg';
import { ReactComponent as TopSiteMyDomain } from '../../../../web-common/src/images/icons/top_site_my_domain.svg';
import { ReactComponent as SnsAccountsIcon } from '../../../../web-common/src/images/icons/sns_my_accounts.svg';
import { ReactComponent as SnsMarketingTaskIcon } from '../../../../web-common/src/images/icons/sns_marketing_task.svg';
import { ReactComponent as SnsMarketingCalendarIcon } from '../../../../web-common/src/images/icons/sns_marketing_calendar.svg';
import { ReactComponent as SnsPostManageIcon } from '../../../../web-common/src/images/icons/sns_post_manage.svg';
import { ReactComponent as SnsMessageIcon } from '../../../../web-common/src/images/icons/sns_message.svg';
import { ReactComponent as ArticleListIcon } from '../../../../web-common/src/images/icons/article_list.svg';
import { ReactComponent as IconToufangguanli } from '../../../../web-common/src/images/icons/toufangguanli.svg';
import { ReactComponent as IconPinpaijianshe } from './svg/v2/pinpaijianshe.svg';
import { getTransText } from '@/components/util/translate';

export default [
  {
    name: getTransText('ZHANDIANGUANLI'),
    path: TopMenuPath.site,
    label: 'WEBSITE_ADMIN',
    children: [
      {
        name: '品牌首页',
        path: 'brand',
        label: 'WEBSITE_MAIN_PAGE',
        icon: <IconPinpaijianshe />,
        topMenuIcon: <IconPinpaijianshe />,
        onlyChild: true,
      },
      {
        name: '建站管理',
        path: 'WEBSITE_ADMIN_MINE',
        label: 'WEBSITE_ADMIN_MINE',
        icon: <Site />,
        children: [
          {
            name: getTransText('WODEZHANDIAN'),
            path: 'mySite',
            label: 'WEBSITE_ADMIN_MINE',
            topMenuIcon: <TopSite />,
            children: [],
          },
          {
            name: getTransText('YINGXIAOLUODIYE'),
            path: 'market',
            label: 'WEBSITE_ADMIN_MARKET',
            topMenuIcon: <TopSiteMarket />,
            children: [],
          },
          {
            name: getTransText('ZHANDIANSHUJU'),
            path: 'stat',
            label: 'WEBSITE_ADMIN_DATA',
            topMenuIcon: <TopSiteStat />,
            children: [],
          },
          {
            path: 'myDomain',
            name: getIn18Text('YUMINGGUANLI'),
            label: 'DOMAIN_ADMIN',
            topMenuIcon: <TopSiteMyDomain />,
            children: [],
          },
          {
            path: 'articleList',
            name: getIn18Text('SITE_WENZHANGGUANLI'),
            label: 'ARTICLE_ADMIN',
            topMenuIcon: <ArticleListIcon />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('HAIWAISHEMEI'),
        path: 'snsMarketing',
        icon: <TopSnsMarketing />,
        label: 'SOCIAL_MEDIA',
        children: [
          {
            name: getIn18Text('ZHANGHAOBANGDING'),
            path: 'snsAccountBinding',
            label: '',
            _label: 'SOCIAL_MEDIA_ACCOUNT',
            children: [],
            subset: ['snsAccountDataAnalysis'],
            topMenuIcon: <SnsAccountsIcon />,
          },
          {
            name: getIn18Text('SHEMEISHUJU'),
            path: 'snsGlobalDataAnalysis',
            label: '',
            _label: 'SOCIAL_MEDIA_DATA',
            children: [],
            topMenuIcon: <TopSiteStat />,
          },
          {
            path: 'snsMarketingTask',
            name: getIn18Text('YINGXIAORENWU'),
            label: '',
            _label: 'SOCIAL_MEDIA_TASK',
            children: [],
            subset: ['snsMarketingTaskEdit', 'snsMarketingTaskDetail'],
            topMenuIcon: <SnsMarketingTaskIcon />,
          },
          {
            path: 'snsCalendar',
            name: getIn18Text('YINGXIAORILI'),
            label: '',
            _label: 'SOCIAL_MEDIA_CALENDAR',
            children: [],
            topMenuIcon: <SnsMarketingCalendarIcon />,
          },
          {
            path: 'snsPostManage',
            name: getIn18Text('TIEZIGUANLIv16'),
            label: '',
            _label: 'SOCIAL_MEDIA_POST',
            children: [],
            subset: ['snsSendPost'],
            topMenuIcon: <SnsPostManageIcon />,
          },
          {
            path: 'snsMessage',
            name: getIn18Text('SnsMessage'),
            label: '',
            _label: 'SOCIAL_MEDIA_MESSAGE',
            children: [],
            topMenuIcon: <SnsMessageIcon />,
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
            topMenuIcon: <IconToufangguanli />,
            children: [],
          },
        ],
      },
    ],
  },
];
