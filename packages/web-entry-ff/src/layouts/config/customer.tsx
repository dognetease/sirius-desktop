import React from 'react';
import { ReactComponent as SiteCustomer } from '../../../../web-common/src/images/icons/site_customer.svg';
import { ReactComponent as FacebookPages } from '../../../../web-common/src/images/icons/facebook_pages.svg';
import { ReactComponent as TopSiteCustomer } from '../../../../web-common/src/images/icons/top_site_customer.svg';
import { TopMenuPath } from './constant';

export default [
  {
    name: '客户',
    path: TopMenuPath.customerManagement,
    label: '',
    children: [
      {
        name: '客户',
        path: 'customerManagement',
        label: '',
        icon: <SiteCustomer />,
        children: [
          {
            name: '客户名单',
            path: 'terminalClient',
            label: '',
            parent: 'customerManagement',
            topMenuIcon: <TopSiteCustomer />,
            children: [],
          },
          {
            name: '差价管理',
            path: 'levelAdmin',
            label: '',
            parent: 'customerManagement',
            topMenuIcon: <FacebookPages />,
            children: [],
          },
        ],
      },
    ],
  },
];
