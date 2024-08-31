import React from 'react';
import { ReactComponent as SiteMarketing } from '../../../../web-common/src/images/icons/site_market.svg';
import { ReactComponent as TopSiteMarket } from '../../../../web-common/src/images/icons/top_site_market.svg';
import { ReactComponent as IntelliBook } from '../../../../web-common/src/images/icons/intelli_book.svg';
import { TopMenuPath } from './constant';

export default [
  {
    name: '报价',
    path: TopMenuPath.price,
    label: '',
    children: [
      {
        name: '后台报价',
        path: 'ffmsPrice',
        label: '',
        icon: <SiteMarketing />,
        children: [
          {
            name: '生效报价',
            path: 'validPrice',
            label: '',
            parent: 'ffmsPrice',
            topMenuIcon: <TopSiteMarket />,
            subset: ['uploadPrice', 'addPrice'],
            children: [],
          },
          {
            name: '待生效报价',
            path: 'invalidPrice',
            label: '',
            parent: 'ffmsPrice',
            topMenuIcon: <IntelliBook />,
            children: [],
          },
        ],
      },
    ],
  },
];
