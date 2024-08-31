import React from 'react';
import { ReactComponent as Site } from '../../../../web-common/src/images/icons/site.svg';
import { ReactComponent as SiteStat } from '../../../../web-common/src/images/icons/site_stat.svg';
import { ReactComponent as SiteMarketing } from '../../../../web-common/src/images/icons/site_market.svg';
import { ReactComponent as SiteCustomer } from '../../../../web-common/src/images/icons/site_customer.svg';
import { ReactComponent as TopSite } from '../../../../web-common/src/images/icons/top_site.svg';
import { ReactComponent as TopSiteStat } from '../../../../web-common/src/images/icons/top_site_stat.svg';
import { ReactComponent as TopSiteMarket } from '../../../../web-common/src/images/icons/top_site_market.svg';
import { ReactComponent as TopSiteCustomer } from '../../../../web-common/src/images/icons/top_site_customer.svg';
import { TopMenuPath } from '@web-common/conf/waimao/constant';

export default [
  {
    name: '站点管理',
    path: TopMenuPath.site,
    label: 'WEBSITE_ADMIN',
    children: [
      {
        name: '我的站点',
        path: 'mySite',
        label: 'WEBSITE_ADMIN_MINE',
        icon: <Site />,
        topMenuIcon: <TopSite />,
        onlyChild: true,
        children: [],
      },
      {
        name: '营销落地页',
        path: 'market',
        label: 'WEBSITE_ADMIN_MARKET',
        icon: <SiteMarketing />,
        topMenuIcon: <TopSiteMarket />,
        onlyChild: true,
        children: [],
      },
      {
        name: '站点数据',
        path: 'stat',
        label: 'WEBSITE_ADMIN_DATA',
        icon: <SiteStat />,
        topMenuIcon: <TopSiteStat />,
        onlyChild: true,
        children: [],
      },
      {
        name: '站点潜在客户',
        path: 'siteCustomer',
        label: 'WEBSITE_TARGET_CONTACT',
        icon: <SiteCustomer />,
        topMenuIcon: <TopSiteCustomer />,
        onlyChild: true,
        children: [],
      },
    ],
  },
];
