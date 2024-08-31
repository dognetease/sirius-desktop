import { useState } from 'react';
import WmMenu from '../config/wmManage';
import { TopMenuType } from '@web-common/conf/waimao/constant';

function getMenuPaths(root: TopMenuType[]) {
  let result: string[] = [];
  root.map(item => {
    item.path && result.push(item.path);
    if (item.children.length > 0) {
      result = [...result, ...getMenuPaths(item.children)];
    }
  });
  return result;
}

/**
 * @description 判断当前路由是否为客户下的模块
 * @returns
 */
function useCustomerModuleCheck() {
  const customerModulePathList = getMenuPaths(WmMenu);
  const [isCustomerModule, setIsCustomerModule] = useState(false);

  const checkIsCustomerModule = (path: string) => {
    setIsCustomerModule(customerModulePathList.includes(path));
  };

  return {
    checkIsCustomerModule,
    isCustomerModule,
  };
}

export default useCustomerModuleCheck;
