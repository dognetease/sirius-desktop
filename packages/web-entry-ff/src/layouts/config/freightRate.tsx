import React from 'react';
import { ReactComponent as SiteMarketing } from '../../../../web-common/src/images/icons/site_market.svg';
import { TopMenuPath } from './constant';

export default [
  {
    name: '报价',
    path: TopMenuPath.price,
    label: '',
    children: [
      {
        name: '后台报价',
        path: 'price',
        label: '',
        icon: <SiteMarketing />,
        children: [
          {
            name: '生效报价',
            path: 'validPrice',
            label: '',
            parent: 'price',
            children: [],
          },
          {
            name: '待生效报价',
            path: 'invalidPrice',
            label: '',
            parent: 'price',
            children: [],
          },
          {
            name: '运价预览',
            path: 'freight',
            label: '',
            children: [],
          },
        ],
      },
    ],
  },
];
