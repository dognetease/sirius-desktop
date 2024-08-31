import { TopMenuType } from '@web-common/conf/waimao/constant';
import { ChildrenType } from '../config/topMenu';

/**
 * @param menus
 * @param visibleKeys
 * @returns
 */
export const filterSideTree = (menus: ChildrenType, visibleKeys: Record<string, boolean>, isRbac = false, hasWarmup = false) => {
  // 灰度期间写死，正式上线后对接接口
  // const isWa = menus.path === 'wa';
  // if (isWa) {
  //   return [menus];
  // }
  const { children } = menus || {};

  let isMatchLoose = false;

  if (/(#coop|#personal)/gi.test(location?.hash) || menus.path === 'coop' || children.some(item => item?.parent === 'coop')) {
    isMatchLoose = true;
  }

  const isOld = window?.localStorage.getItem('v1v2') !== 'v2';

  const ret: TopMenuType[] = [];
  for (let i = 0, l = children.length; i < l; i++) {
    const menu = { ...children[i] };
    const key = menu?.label || '';
    // web端的 visibleKeys[key] 没判断 undefined 情况. 会出现 undefined !== false --> true
    // 这里先暂时针对我的情况单独处理, @hanxu
    if (menu.path === 'warmup') {
      hasWarmup && visibleKeys[key] === true && ret.push(menu);
    } else if (menu.path === 'senderRotateList' || menu.path === 'multiAccount') {
      if (visibleKeys[key] === true) {
        if (menu.children !== undefined) {
          menu.children = filterSideTree(menu, visibleKeys, isRbac, hasWarmup);
        }
        ret.push(menu);
      }
    } else if (
      (menu.path !== 'privilege' && (isMatchLoose || isOld ? visibleKeys[key] !== false : visibleKeys[key] === true)) ||
      // 目的：如果是 isRbac 为 true，保证 privilege 和 privilege 的 children 都要放进来
      ((['enterpriseSetting', 'privilege'].includes(menu.path) || menu.parent === 'privilege') && isRbac)
    ) {
      if (menu.children !== undefined) {
        menu.children = filterSideTree(menu, visibleKeys, isRbac, hasWarmup);
      }
      ret.push(menu);
    }
  }
  return ret;
};
