import React from 'react';
import { ReactComponent as AccountManage } from '../../../../web-common/src/images/icons/account_manage.svg';
import { getIn18Text } from 'api';

export default [
  {
    name: '账号查询',
    path: 'personal',
    type: 'group',
    children: [
      {
        name: getIn18Text('ZHANGHAOSHEZHI'),
        path: 'accountQuery',
        icon: <AccountManage />,
        children: [
          {
            name: getIn18Text('ZHANGHAOYUANQUAN'),
            path: 'security',
            parent: 'accountQuery',
            children: [],
          },
          {
            name: getIn18Text('YOUXIANGSHEZHI'),
            path: 'emailSetting',
            parent: 'accountQuery',
            children: [],
          },
          {
            name: getIn18Text('KUAIJIEJIANSHEZHI'),
            path: 'shortcutSetting',
            parent: 'accountQuery',
            children: [],
          },
          {
            name: getIn18Text('XITONGSHEZHI'),
            path: 'sysSetting',
            parent: 'accountQuery',
            children: [],
          },
        ],
      },
    ],
  },
];
