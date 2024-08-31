import React, { useState, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { getIn18Text, apiHolder, apis, EdmRoleApi, MenuItem } from 'api';
import { Skeleton } from 'antd';
import { versionConflictHandler } from '@web-common/utils/waimao/menuVersion';
import { useAppSelector } from '@web-common/state/createStore';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import style from './menuManageV2.module.scss';
import { setV1v2 } from '@web-common/hooks/useVersion';

console.log(1);

interface MenuItemWithParent extends MenuItem {
  parent?: MenuItemWithParent;
  subMenuItems?: MenuItemWithParent[];
}

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

// 为 menus 拓展 parent 属性
const extendMenusParent = (menus: MenuItemWithParent[], parent?: MenuItemWithParent) => {
  menus.forEach(menu => {
    menu.parent = parent;
    if (menu.subMenuItems) {
      extendMenusParent(menu.subMenuItems, menu);
    }
  });
};

// 寻找当前操作的 item
const findMenusItem = (menus: MenuItemWithParent[], target: MenuItemWithParent): MenuItemWithParent | undefined => {
  for (const menu of menus) {
    if (menu.menuLabel === target.menuLabel) {
      return menu;
    }
    if (menu.subMenuItems) {
      const foundItem = findMenusItem(menu.subMenuItems, target);
      if (foundItem) {
        return foundItem;
      }
    }
  }
  return undefined;
};

// 用于通过子节点选中状态，判断 Checkbox.indeterminate 属性
const getSubItemsAllChecked = (menu: MenuItem): boolean => {
  if (menu.subMenuItems) {
    return menu.subMenuItems.every(subMenu => {
      return !!subMenu.showMenu && getSubItemsAllChecked(subMenu);
    });
  } else {
    return true;
  }
};

// 更新子节点选中状态
const updateSubItemsChecked = (menu: MenuItemWithParent) => {
  if (menu.subMenuItems) {
    menu.subMenuItems.forEach(subMenu => {
      subMenu.showMenu = menu.showMenu;
      updateSubItemsChecked(subMenu);
    });
  }
};

// 更新父节点选中状态
const updateParentChecked = (menu: MenuItemWithParent) => {
  if (menu.parent && menu.parent.subMenuItems) {
    menu.parent.showMenu = menu.parent.subMenuItems.some(subMenu => subMenu.showMenu);
    updateParentChecked(menu.parent);
  }
};

// 获取 menus 叶子节点
const getLeafItems = (menus: MenuItemWithParent[], res: Partial<MenuItem>[] = []): Partial<MenuItem>[] => {
  menus.forEach(menu => {
    if (menu.subMenuItems && menu.subMenuItems.length) {
      getLeafItems(menu.subMenuItems, res);
    } else {
      res.push({
        menuLabel: menu.menuLabel,
        showMenu: menu.showMenu,
      });
    }
  });
  return res;
};

export const MenuManageV2 = () => {
  const [menus, setMenus] = useState<MenuItemWithParent[]>([]);
  const [loading, setLoading] = useState(false);
  const user = apiHolder.api.getSystemApi().getCurrentUser();
  const roles = useAppSelector(state => state.privilegeReducer.roles);

  useEffect(() => {
    setLoading(true);

    roleApi
      .getMenuListV2()
      .then(res => {
        if (res.menuVersion === 'NEW') {
          // 处理顺序，优化视觉展示
          // const order: string[] = ['TASK_CENTER', 'WORKBENCH', 'ORG_SETTINGS'];
          // res.menuItems.sort((a, b) => order.indexOf(a.menuLabel) - order.indexOf(b.menuLabel));

          // 处理父子关系，便于更新父节点、子节点
          extendMenusParent(res.menuItems);
          setMenus(res.menuItems);
        } else {
          setV1v2('v1');
          versionConflictHandler();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleMenuUpdate = (target: MenuItemWithParent) => {
    const previousMenus = cloneDeep(menus);
    const nextMenus = cloneDeep(menus);
    const menu = findMenusItem(nextMenus, target);

    if (!menu) return;

    menu.showMenu = !(menu.showMenu && getSubItemsAllChecked(menu));

    updateSubItemsChecked(menu); // 先处理子节点
    updateParentChecked(menu); // 再处理父节点

    setMenus(nextMenus);

    const leafItems = getLeafItems(nextMenus);

    roleApi
      .saveMenuSettingV2({ menuItems: leafItems })
      .then(() => {
        Message.success(getIn18Text('BAOCUNCHENGGONG'));
      })
      .catch(error => {
        Message.error(error?.message || getIn18Text('BAOCUNSHIBAI'));
        setMenus(previousMenus);
      });
  };

  return (
    <div className={style.menuManageV2}>
      <div className={style.title}>{getIn18Text('CAIDANGUANLI')}</div>
      <div className={style.header}>
        <AvatarTag
          className={style.avatar}
          size={32}
          user={{
            name: user?.nickName,
            avatar: user?.avatar,
            email: user?.id,
            color: user?.contact?.contact?.color,
          }}
        />
        <div className={style.email}>{user?.id}</div>
        <div className={style.roles}>
          {roles.map(role => (
            <div className={style.role} key={role.roleId}>
              {role.roleName}
            </div>
          ))}
        </div>
      </div>
      <div className={style.body}>
        <div className={style.bodyTitleWrapper}>
          <div className={style.bodyTitle}>{getIn18Text('CAIDANKEJIANSHEZHI')}</div>
          <div className={style.bodySubTitle}>{getIn18Text('ZAIQUANYUFANWEI，ZHENDUI（WAIMAO）XIANGGUANGONGNENGMOKUAIDECAIDANJINXINGSHEZHI')}</div>
        </div>
        <Skeleton loading={loading} active>
          <div className={style.bodyContent}>
            {menus.map(menu => {
              return (
                <div className={style.menu} key={menu.menuLabel}>
                  <div className={style.menuTitle}>{menu.menuName}</div>
                  <div className={style.subMenus}>
                    {(menu.subMenuItems || []).map(subMenu => {
                      return (
                        <div className={style.subMenu} key={subMenu.menuLabel}>
                          <div className={style.subMenuTitle}>{subMenu.menuName}</div>
                          <div className={style.thridMenus}>
                            <Checkbox
                              className={style.thridMenu}
                              key={`${subMenu.menuLabel}_ALL`}
                              checked={subMenu.showMenu}
                              indeterminate={subMenu.showMenu && !getSubItemsAllChecked(subMenu)}
                              onChange={() => handleMenuUpdate(subMenu)}
                            >
                              {getIn18Text('QUANBU')}
                            </Checkbox>
                            {(subMenu.subMenuItems || []).map(thridMenu => {
                              return (
                                <Checkbox className={style.thridMenu} key={thridMenu.menuLabel} checked={thridMenu.showMenu} onChange={() => handleMenuUpdate(thridMenu)}>
                                  {thridMenu.menuName}
                                </Checkbox>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {!(menu.subMenuItems || []).length && (
                      <div className={style.subMenu} key={`${menu.menuLabel}_ALL`}>
                        <div className={style.subMenuTitle}>{menu.menuName}</div>
                        <div className={style.thridMenus}>
                          <Checkbox
                            className={style.thridMenu}
                            checked={menu.showMenu}
                            indeterminate={menu.showMenu && !getSubItemsAllChecked(menu)}
                            onChange={() => handleMenuUpdate(menu)}
                          >
                            {getIn18Text('QUANBU')}
                          </Checkbox>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Skeleton>
      </div>
    </div>
  );
};
