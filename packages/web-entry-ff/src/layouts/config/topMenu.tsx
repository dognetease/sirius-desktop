import React from 'react';

import intelliMarketing from './IntelliMarketing';
import price from './price';
import customer from './customer';
import order from './order';
import statistics from './statistics';
import { TopMenuPath, TopMenuType } from './constant';
import rbacManage from './rbacManage';
import product from './product';
import { ReactComponent as IconBeta } from '../../../../web-common/src/images/icons/beta.svg';
import { ReactComponent as Contomfair } from '../../../../web-common/src/images/icons/contomfair.svg';
import { getIn18Text } from 'api';

export interface ChildrenType {
  name: string;
  icon?: React.ReactNode; // sideMenu icon
  topMenuIcon?: React.ReactNode; // topMenu icon
  path: string;
  subset?: string[]; // 页面内事件触发的路由
  type?: string;
  parent?: string; // 父级节点
  onlyChild?: boolean; // topMenu 里一级节点 && 没有子集的节点
  label?: string; // 权限
  hiddenWithFree?: boolean; // 免费版隐藏
  show?: boolean; // topMenu 菜单是否展示
  children: ChildrenType[];
}

export const topMenu: TopMenuType[] = [
  {
    name: '报价',
    path: TopMenuPath.price,
    open: false,
    children: price,
  },
  {
    name: '运价总览',
    path: TopMenuPath.freightRate,
    open: false,
    children: [],
  },
  {
    name: '客户',
    path: TopMenuPath.customerManagement,
    open: false,
    children: customer,
  },
  {
    name: '订舱申请',
    path: TopMenuPath.order,
    open: false,
    children: order,
  },
  {
    name: '运价页面统计',
    path: TopMenuPath.statistics,
    open: false,
    children: statistics,
  },
  {
    name: getIn18Text('ZHINENGYINGXIAOWEB'),
    path: TopMenuPath.intelliMarketing,
    open: false,
    children: intelliMarketing,
  },
];

function buildPathToNameMap(topMenu: TopMenuType[]) {
  const map: Record<string, string> = {};
  function loop(arr: ChildrenType[], currPath: string = '') {
    arr.forEach(obj => {
      if (obj.children) {
        loop(obj.children, currPath);
      } else if (obj.path) {
        const p = currPath + '/' + obj.path;
        map[p] = obj.name;
        if (obj.children) {
          loop(obj.children, p);
        }
      }
    });
  }
  topMenu.forEach(obj => {
    if (obj.path) {
      map[obj.path] = obj.name;
      loop(obj.children, '/' + obj.path);
    }
  });
  return map;
}

const pathToNameMap = buildPathToNameMap(topMenu);

export function getTitleByPath(hash: string, defaultTitle = '新建页1') {
  const reg = /#(\w+)(?:\?page=(\w+))?/;
  if (reg.test(hash)) {
    const top = RegExp.$1;
    const page = RegExp.$2 || 'index';
    console.log('/' + top + '/' + page);
    return pathToNameMap['/' + top + '/' + page] || defaultTitle;
  }
  return defaultTitle;
}

console.log(getTitleByPath('#wm'));
console.log(getTitleByPath('#wm?page=index'));
console.log(getTitleByPath('#wm?page=clue'));

export const packedData = (filterData: TopMenuType[]) => {
  let ans;
  if (filterData[0]?.path === TopMenuPath.intelliMarketing) {
    ans = {
      name: getIn18Text('ZHINENGYINGXIAOWEB'),
      path: TopMenuPath.intelliMarketing,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.price) {
    ans = {
      name: '报价',
      path: TopMenuPath.price,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.customerManagement) {
    ans = {
      name: '客户',
      path: TopMenuPath.customerManagement,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.order) {
    ans = {
      name: '订舱申请',
      path: TopMenuPath.order,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.statistics) {
    ans = {
      name: '运价页面统计',
      path: TopMenuPath.statistics,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.unitable_crm) {
    ans = {
      name: getIn18Text('KEHUHEYEWUWEB'),
      path: TopMenuPath.unitable_crm,
      topIcon: <IconBeta />,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.wmData) {
    ans = {
      name: getIn18Text('WAIMAODASHUJUWEB'),
      path: TopMenuPath.wmData,
      topIcon: <Contomfair />,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.site) {
    ans = {
      name: '站点管理',
      path: TopMenuPath.site,
      children: filterData,
      topIcon: <IconBeta />,
    };
  } else if (filterData[0]?.path === TopMenuPath.coop) {
    ans = {
      name: getIn18Text('XIETONGBANGONG'),
      path: TopMenuPath.coop,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.rbac) {
    ans = {
      name: '权限管理',
      hidden: true,
      path: TopMenuPath.rbac,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.enterpriseSetting) {
    ans = {
      name: '企业设置',
      hidden: true,
      path: TopMenuPath.enterpriseSetting,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.personal) {
    ans = {
      name: '个人设置',
      hidden: true,
      path: TopMenuPath.personal,
      children: filterData,
    };
  }
  return ans;
};

export const getAllMenuKeys = (curMenu: ChildrenType, keys: string[]) => {
  curMenu?.children?.forEach(item => {
    keys.push(item.path);
    if (item.children.length) {
      getAllMenuKeys(item, keys);
    }
  });
  return keys;
};

export const findActiveKeys = (curMenu: ChildrenType[], page: string) => {
  const stack = [...curMenu];
  while (stack.length) {
    const current = stack.pop();
    if (current?.path === page || current?.subset?.includes(page)) return current;
    if (current?.children) {
      stack.push(
        ...current.children.map(x => {
          return { ...x, xPath: x.path + ',' + current.path };
        })
      );
    }
  }
  return stack;
};
