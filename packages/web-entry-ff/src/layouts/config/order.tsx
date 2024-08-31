import React from 'react';
import { ReactComponent as AddressBook } from '../../../../web-common/src/images/icons/address_book.svg';
import { ReactComponent as WdProductSub } from '../../../../web-common/src/images/icons/product_sub.svg';
import { TopMenuPath } from './constant';

export default [
  {
    name: '订舱申请',
    path: TopMenuPath.order,
    label: '',
    children: [
      {
        name: '订舱申请',
        path: 'order',
        label: '',
        icon: <AddressBook />,
        children: [
          {
            name: '订舱申请管理',
            path: 'application',
            label: '',
            parent: 'order',
            topMenuIcon: <WdProductSub />,
            children: [],
          },
        ],
      },
    ],
  },
];
