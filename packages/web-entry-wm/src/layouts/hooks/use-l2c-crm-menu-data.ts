import { useMemo, useRef } from 'react';
import {
  activeKeyToRoutePath,
  RoutePathToActiveKey,
  customerManageMenuList,
  customerPerformanceMenuList,
  customerMangeMenuPathSet,
  customerPerformanceMenuPathSet,
  useL2cCrmMenuDataWithPermission,
  L2cCrmAppContextProps,
  routeMenu,
} from '@lxunit/app-l2c-crm';
import { getUnitableCrmHash, getCrmPathWithoutPrefix } from '@web-unitable-crm/api/helper';
import { useAppSelector } from '@web-common/state/createStore';
import { L2cCrmPageType, L2cCrmSidebarMenuExtra } from '@web-common/conf/waimao/l2c-crm-constant';

import { ChildrenType } from '../config/topMenu';

type MenuData = (typeof customerManageMenuList)[0];
const transMenuItem = (item: MenuData): ChildrenType => ({
  name: item.label,
  icon: item.icon,
  path: item.key,
  children: item.children ? item.children.map(i => transMenuItem(i)) : [],
});

/**
 * 判断当前路由是否是客户管理模块
 * @param crmRoutePath crm的路由path
 * @returns
 * true 当前路由是客户管理模块
 */
export const isL2cCrmManagePath = (crmRoutePath: string): boolean => customerMangeMenuPathSet.has(crmRoutePath);
/**
 * 判断当前路由是否是客户履约模块
 * @param crmRoutePath crm的路由path
 * @returns
 * true 当前路由是客户履约模块
 * false 当前路由不是客户履约模块
 * @description
 */
export const isL2cCrmPerformancePath = (crmRoutePath: string): boolean => customerPerformanceMenuPathSet.has(crmRoutePath);
type PermissionFnParams = Parameters<typeof useL2cCrmMenuDataWithPermission>;
/**
 * 返回客户管理模块的菜单栏数据,已经通过权限过滤
 * @returns
 */
export const useL2cCrmMenuData = (p: PermissionFnParams[1], p1: PermissionFnParams[2]) => {
  const menuList = useL2cCrmMenuDataWithPermission(customerManageMenuList, p, p1);
  const data = useMemo<ChildrenType[]>(() => menuList.map(item => transMenuItem(item)), [menuList]);
  return useMemo<ChildrenType>(
    () => ({
      name: '客户管理',
      path: routeMenu.custom.path,
      children: [
        {
          name: '客户管理',
          path: routeMenu.custom.path,
          children: data,
        },
      ],
    }),
    [data]
  );
};
/**
 * 返回客户履约模块的菜单栏数据,已经通过权限过滤
 * @returns
 */
export const useL2cCrmCustomerPerformanceMenuData = (p: PermissionFnParams[1], p1: PermissionFnParams[2]) => {
  const menuList = useL2cCrmMenuDataWithPermission(customerPerformanceMenuList, p, p1);
  const data = useMemo<ChildrenType[]>(() => menuList.map(item => transMenuItem(item)), [menuList]);
  return useMemo<ChildrenType>(
    () => ({
      name: '客户履约',
      path: routeMenu.sellOrder.path,
      children: [
        {
          name: '客户履约',
          path: routeMenu.sellOrder.path,
          children: data,
        },
      ],
    }),
    [data]
  );
};
/**
 * 点击crm菜单的回调
 * @param key 菜单栏当前的key，可能是个crm路由pah，也可能是个菜单项的key
 */
export const onCrmMenuClickHandle = (key: string) => {
  const paths = activeKeyToRoutePath[key];
  // 存在，说明当前的path不是crm的路由，仅仅是一个菜单项key，因此需要找到对应的路由
  if (paths) {
    window.location.hash = getUnitableCrmHash(paths[0]);
  } else {
    window.location.hash = getUnitableCrmHash(key);
  }
};
/**
 * 判断当前路由是否是客户管理模块，true是客户管理模块 false不是客户管理模块
 * @param hash
 * @returns
 */
export const isMatchCustomerManageRoute = (hash?: string) => {
  const routePah = getCrmPathWithoutPrefix(hash ?? window.location.hash);
  return customerMangeMenuPathSet.has(routePah);
};
/**
 * 判断当前路由是否是客户履约模块，true是客户履约模块 false不是客户履约模块
 * @param hash
 * @returns
 */
export const isMatchCustomerPerformanceRoute = (hash?: string) => {
  const routePath = getCrmPathWithoutPrefix(hash ?? window.location.hash);
  return customerPerformanceMenuPathSet.has(routePath);
};
/**
 * 返回当前路由对应的activeKey
 * @param hash
 * @returns
 */
export const getActiveKeyByPath = (hash: string) => {
  const routePath = getCrmPathWithoutPrefix(hash);
  const activeKey = RoutePathToActiveKey[routePath];
  if (activeKey) {
    return activeKey;
  }
  return routePath;
};
/**
 * 返回当前路由对应的菜单数据类型，提供给l2c-crm app使用
 * @param isV2
 * @returns
 */
export const getMenuDataType = (isV2: boolean): Required<L2cCrmAppContextProps>['menuDataType'] => {
  let menuDataType: L2cCrmAppContextProps['menuDataType'] = 'all';
  if (isV2) {
    if (isMatchCustomerPerformanceRoute()) {
      menuDataType = 'performance';
    } else {
      menuDataType = 'customer';
    }
  }
  return menuDataType;
};
/**
 * 判断某个path是否存在target中
 * @param target
 * @param curPath
 * @returns
 */
export const hasPath = (target: ChildrenType, curPath: string) => {
  const walk = (target: ChildrenType): boolean => {
    if (target.children?.length) {
      for (const item of target.children) {
        const path = walk(item);
        if (path) {
          return path;
        }
      }
    }
    return curPath === target.path;
  };
  return walk(target);
};
/**
 * 获取第一个菜单项的路由
 * @param menuList
 * @returns
 */
const getFirstMenuPath = (menuList: MenuData[]) => {
  let nextPath = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const val of menuList) {
    if (val && val.children && val.children.length) {
      nextPath = getFirstMenuPath(val.children);
      break;
    } else {
      nextPath = val.key;
      break;
    }
  }
  const paths = activeKeyToRoutePath[nextPath];
  if (paths) {
    return paths[0];
  }
  return nextPath;
};
const hasL2cPath = (menuList: MenuData[], path: string): boolean => {
  const walk = (menuData: MenuData[]): boolean => {
    for (let index = 0; index < menuData.length; index++) {
      const element = menuData[index];
      if (element.children?.length) {
        const r = walk(element.children);
        if (r) {
          return r;
        }
      } else if (element.key === path) {
        return true;
      }
    }
    return false;
  };

  return walk(menuList);
};

export const useL2cCrmSidebarMenu = () => {
  const modulePermission = useAppSelector(s => s.privilegeReducer.modules);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const managementList = useL2cCrmMenuDataWithPermission(customerManageMenuList, modulePermission, menuKeys);
  const performanceList = useL2cCrmMenuDataWithPermission(customerPerformanceMenuList, modulePermission, menuKeys);
  const l2cMenuRef = useRef<L2cCrmSidebarMenuExtra>({
    [L2cCrmPageType.customerManagement]: { defaultPath: '' },
    [L2cCrmPageType.customerPerformance]: { defaultPath: '' },
    [L2cCrmPageType.customerAndBusiness]: { defaultPath: '' },
  });
  useMemo(() => {
    const customerManagementPath = hasL2cPath(managementList, routeMenu.custom.path) ? routeMenu.custom.path : getFirstMenuPath(managementList);
    const performancePath = getFirstMenuPath(performanceList);

    l2cMenuRef.current[L2cCrmPageType.customerManagement].defaultPath = customerManagementPath;
    l2cMenuRef.current[L2cCrmPageType.customerPerformance].defaultPath = performancePath;
    l2cMenuRef.current[L2cCrmPageType.customerAndBusiness].defaultPath = customerManagementPath;
  }, [managementList, performanceList]);
  return l2cMenuRef;
};
