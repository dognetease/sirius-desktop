import React from 'react';
import bigData from './bigData';
import coopOffice from './coopOffice';
import intelliMarketing from './IntelliMarketing';
import companySetting from './companySetting';
import personalSetting from './personalSetting';
import wmManage from './wmManage';
import WA from './v2/wa';
import webSite from './webSite';
import { TopMenuPath, TopMenuType } from '@web-common/conf/waimao/constant';
import rbacManage from './rbacManage';
import product from './product';

import { ReactComponent as IconBeta } from '../../../../web-common/src/images/icons/beta.svg';
import { ReactComponent as IconFree } from '../../../../web-common/src/images/icons/free.svg';
import { ReactComponent as Contomfair } from '../../../../web-common/src/images/icons/contomfair.svg';
import { getIn18Text } from 'api';

export interface ChildrenType {
  layout?: number[][];
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
  showNewBadge?: boolean; // 是否展示 "New" 标签
  children: ChildrenType[];
  suffix?: React.ReactNode;
}

export const topMenu: TopMenuType[] = [
  {
    name: getIn18Text('SHOUYE'),
    path: TopMenuPath.worktable,
    open: false,
    children: [],
  },
  {
    name: getIn18Text('WODERENWU'),
    path: TopMenuPath.systemTask,
    hidden: true,
    children: [],
  },
  {
    name: getIn18Text('XINSHOURENWU'),
    path: TopMenuPath.noviceTask,
    hidden: true,
    children: [],
  },
  {
    name: getIn18Text('SHANGYE WA ZHU'),
    path: TopMenuPath.whatsAppRegister,
    hidden: true,
    children: [],
  },
  {
    name: getIn18Text('YOUJIAN'),
    path: TopMenuPath.mailbox,
    open: false,
    children: [],
  },
  {
    name: 'WA',
    path: TopMenuPath.wa,
    open: false,
    children: WA,
  },
  {
    name: getIn18Text('WAIMAODASHUJUWEB'),
    path: TopMenuPath.wmData,
    open: false,
    // topIcon: <Contomfair />,
    children: bigData,
  },
  {
    name: getIn18Text('ZHINENGYINGXIAOWEB'),
    path: TopMenuPath.intelliMarketing,
    open: false,
    children: intelliMarketing,
  },
  // {
  //   name: getIn18Text('KEHUGUANLI'),
  //   path: TopMenuPath.wm,
  //   open: false,
  //   children: wmManage
  // },
  {
    name: getIn18Text('KEHUHEYEWUWEB'),
    path: TopMenuPath.unitable_crm,
    open: false,
    hiddenWithFree: true,
    children: product,
  },
  {
    name: getIn18Text('SITE_PINPAIJIANSHE'),
    path: TopMenuPath.site,
    children: webSite,
    topIcon: <IconFree />,
  },
  {
    name: getIn18Text('XIETONGBANGONG'),
    path: TopMenuPath.coop,
    open: false,
    children: coopOffice,
  },
  {
    name: getIn18Text('QUANXIANGUANLIWM'),
    hidden: true,
    path: TopMenuPath.rbac,
    children: rbacManage,
  },
  {
    name: getIn18Text('QIYESHEZHI'),
    hidden: true,
    path: TopMenuPath.enterpriseSetting,
    children: companySetting,
  },
  {
    name: getIn18Text('GERENSHEZHI'),
    hidden: true,
    path: TopMenuPath.personal,
    children: personalSetting,
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
    // } else if (filterData[0]?.path === TopMenuPath.wm) {
    //   ans = {
    //     name:  getIn18Text('KEHUGUANLI'),
    //     path: TopMenuPath.wm,
    //     children: filterData
    //   };
  } else if (filterData[0]?.path === TopMenuPath.unitable_crm) {
    ans = {
      name: getIn18Text('KEHUHEYEWUWEB'),
      path: TopMenuPath.unitable_crm,
      // topIcon: <IconBeta />,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.wmData) {
    ans = {
      name: getIn18Text('WAIMAODASHUJUWEB'),
      path: TopMenuPath.wmData,
      // topIcon: <Contomfair />,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.site) {
    ans = {
      name: getIn18Text('SITE_PINPAIJIANSHE'),
      path: TopMenuPath.site,
      children: filterData,
      // topIcon: <IconFree />,
    };
  } else if (filterData[0]?.path === TopMenuPath.coop) {
    ans = {
      name: getIn18Text('XIETONGBANGONG'),
      path: TopMenuPath.coop,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.rbac) {
    ans = {
      name: getIn18Text('QUANXIANGUANLIWM'),
      hidden: true,
      path: TopMenuPath.rbac,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.enterpriseSetting) {
    ans = {
      name: getIn18Text('QIYESHEZHI'),
      hidden: true,
      path: TopMenuPath.enterpriseSetting,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.personal) {
    ans = {
      name: getIn18Text('GERENSHEZHI'),
      hidden: true,
      path: TopMenuPath.personal,
      children: filterData,
    };
  } else if (filterData[0]?.path === TopMenuPath.wa) {
    ans = {
      name: 'WA',
      path: TopMenuPath.wa,
      children: filterData,
    };
  }
  return ans;
};

export const getAllMenuKeys = (curMenu: ChildrenType, keys: string[]) => {
  curMenu?.children?.forEach(item => {
    keys.push(item.path);
    if (item.children?.length) {
      getAllMenuKeys(item, keys);
    }
  });
  return keys;
};

export const findActiveKeys = (curMenu: ChildrenType[], page: string) => {
  const stack = [...curMenu];

  let isNew = window?.localStorage.getItem('v1v2') === 'v2';

  if (isNew && page === 'emailFilter') {
    return {
      xPath: 'emailFilter,ioEmail',
    };
  }

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
