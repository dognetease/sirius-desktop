import { ChildrenType } from '../config/topMenu';
import { TopMenuType } from '@web-common/conf/waimao/constant';

/**
 * @param menus
 * @param visibleKeys
 * @returns
 */
export const filterSideTree = (menus: ChildrenType, visibleKeys: Record<string, boolean>, isRbac: boolean = false) => {
  const { children } = menus || {};
  const ret: TopMenuType[] = [];
  for (let i = 0, l = children.length; i < l; i++) {
    const menu = { ...children[i] };
    const key = menu?.label || '';
    if ((menu.path !== 'privilege' && visibleKeys[key] !== false) || (menu.path === 'privilege' && isRbac)) {
      if (menu.children !== undefined) {
        menu.children = filterSideTree(menu, visibleKeys, isRbac);
      }
      ret.push(menu);
    }
  }
  return ret;
};
