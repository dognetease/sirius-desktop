import { TopMenuPath } from '@web-common/conf/waimao/constant';

export default [
  {
    name: '权限管理',
    path: TopMenuPath.rbac,
    icon: '',
    children: [
      {
        name: '企业成员',
        path: 'rbacAccounts',
        children: [],
      },
      {
        name: '角色列表',
        path: 'rolePermissions',
        children: [],
      },
      {
        name: '菜单设置',
        path: 'menuSetting',
        children: [],
      },
    ],
  },
];
