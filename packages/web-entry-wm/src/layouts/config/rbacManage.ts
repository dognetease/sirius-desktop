import { getIn18Text } from 'api';
import { TopMenuPath } from '@web-common/conf/waimao/constant';

export default [
  {
    name: getIn18Text('QUANXIANGUANLIWM'),
    path: TopMenuPath.rbac,
    icon: '',
    children: [
      {
        name: getIn18Text('QIYECHENGYUAN'),
        path: 'rbacAccounts',
        children: [],
      },
      {
        name: getIn18Text('JIAOSELIEBIAO'),
        path: 'rolePermissions',
        children: [],
      },
      {
        name: getIn18Text('CAIDANSHEZHI'),
        path: 'menuSetting',
        children: [],
      },
    ],
  },
];
