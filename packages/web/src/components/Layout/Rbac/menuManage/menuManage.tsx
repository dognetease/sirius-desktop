import React, { useState, useEffect } from 'react';
import { Skeleton, Tree } from 'antd';
import { apiHolder, apis, EdmRoleApi, MenuItem } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './index.module.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useAppSelector } from '@web-common/state/createStore';
import { versionConflictHandler } from '@web-common/utils/waimao/menuVersion';
import { getIn18Text } from 'api';
const getCheckedLeaf = (menus: MenuItem[], keys: string[]) => {
  for (let i = 0, l = menus.length; i < l; i++) {
    const menu = menus[i];
    if (menu.subMenuItems?.length) {
      getCheckedLeaf(menu.subMenuItems, keys);
    } else if (menu.showMenu) {
      keys.push(menu.menuLabel);
    }
  }
  return keys;
};
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
interface MenuTreeNode {
  key: string;
  title: string;
  data: MenuItem;
  showMenu?: boolean;
  children?: MenuTreeNode[];
}
function transMenuItemToTreeData(menuItems: MenuItem[]) {
  const treeData: MenuTreeNode[] = [];
  for (let i = 0, l = menuItems.length; i < l; i++) {
    const node: MenuTreeNode = {
      key: menuItems[i].menuLabel,
      showMenu: menuItems[i].showMenu,
      data: menuItems[i],
      title: menuItems[i].menuName,
    };
    if (menuItems[i].subMenuItems?.length) {
      node.children = transMenuItemToTreeData(menuItems[i].subMenuItems as MenuItem[]);
    }
    // uni邀测排除客户模块
    if (node.key === 'ORG_SETTINGS') {
      // 企业设置下屏蔽 字段设置 销售阶段设置 公海设置 字段查重
      const filterOrgChildren = [
        // 关闭话术库的配置
        'ORG_SETTINGS_WORD_ART_LIBRARY',
      ];
      console.log('xxxx-ORG', node);
      node.children = node.children?.filter((ele: any) => !filterOrgChildren.includes(ele.key));
    }
    if (node.key === 'CONTACT') {
      // 客户模块屏蔽子项列表
      const filterOrgChildren = [
        // 线索公海
        // 'CHANNEL_OPEN_SEA',
        // 关闭线索列表
        // 'CONTACT_CHANNEL_LIST',
        // 网易外贸通助手
        'BROWSER_EXTENSION',
        // 数据迁移
        'CONTACT_DATA_MIGRATION',
      ];
      node.children = node.children?.filter(ele => !filterOrgChildren.includes(ele.key));
    }
    treeData.push(node);
  }
  return treeData;
}
function visitTree(treeData: MenuTreeNode[], fn: (node: MenuTreeNode) => void) {
  for (let i = 0, l = treeData.length; i < l; i++) {
    const node = treeData[i];
    fn(node);
    if (node.children?.length) {
      visitTree(node.children, fn);
    }
  }
}
interface MenuManageProps {
  v1v2: 'NONE' | 'v1';
}
export const MenuManage: React.FC<MenuManageProps> = props => {
  const { v1v2 } = props;
  const [menuData, setMenuData] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandKeys, setExpandKeys] = useState<string[]>([]);
  const user = apiHolder.api.getSystemApi().getCurrentUser();
  const myRoles = useAppSelector(state => state.privilegeReducer.roles);
  const fetchData = () => {
    if (v1v2 === 'NONE') {
      setLoading(true);
      roleApi
        .getMenuList()
        .then(res => {
          const keys = getCheckedLeaf(res, []);
          const tree = transMenuItemToTreeData(res);
          setCheckedKeys(keys);
          setMenuData(tree);
          const expandedKeys: string[] = [];
          visitTree(tree, node => {
            if (node.children?.length) {
              expandedKeys.push(node.key);
            }
          });
          setExpandKeys(expandedKeys);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      roleApi
        .getMenuListV2()
        .then(res => {
          if (res.menuVersion === 'OLD') {
            const keys = getCheckedLeaf(res.menuItems, []);
            const tree = transMenuItemToTreeData(res.menuItems);
            setCheckedKeys(keys);
            setMenuData(tree);
            const expandedKeys: string[] = [];
            visitTree(tree, node => {
              if (node.children?.length) {
                expandedKeys.push(node.key);
              }
            });
            setExpandKeys(expandedKeys);
          } else {
            versionConflictHandler();
          }
        })
        .finally(() => setLoading(false));
    }
  };
  const handleCheck = (checked: any, e: any) => {
    setCheckedKeys(checked);
    handleSave(checked);
  };
  const handleSave = (checked?: string[]) => {
    const keys = checked ?? checkedKeys;
    const menuItems: Array<Partial<MenuItem>> = [];
    visitTree(menuData, node => {
      if (!node.children || node.children.length === 0) {
        menuItems.push({
          menuLabel: node.data.menuLabel,
          showMenu: keys.indexOf(node.key) > -1,
        });
      }
    });
    if (v1v2 === 'NONE') {
      roleApi.saveMenuSetting({ menuItems }).then(() => {
        toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
      });
    } else {
      roleApi.saveMenuSettingV2({ menuItems }).then(() => {
        toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
      });
    }
  };
  useEffect(() => {
    fetchData();
  }, [v1v2]);
  return (
    <div className={style.menuSetting}>
      <div className={style.pageHeader}>
        <div className={style.pageTitle}>{getIn18Text('WODEJIAOSE')}</div>
        <div className={style.currentUser}>
          <AvatarTag
            size={32}
            user={{
              name: user?.nickName,
              avatar: user?.avatar,
              email: user?.id,
              color: user?.contact?.contact?.color,
            }}
          />
          <span>{user?.id}</span>
          {myRoles.map(role => (
            <div className={style.roleTag} key={role.roleId}>
              {role.roleName}
            </div>
          ))}
        </div>
      </div>
      <div className={style.titleWrap}>
        <span className={style.title}>{getIn18Text('CAIDANKEJIANSHEZHI')}</span>
        <p className={style.subText}>{getIn18Text('ZAIQUANYUFANWEI\uFF0CZHENDUI\uFF08WAIMAO\uFF09XIANGGUANGONGNENGMOKUAIDECAIDANJINXINGSHEZHI')}</p>
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton loading={loading} active>
          <Tree checkable expandedKeys={expandKeys} checkedKeys={checkedKeys} selectable={false} treeData={menuData} onCheck={handleCheck} switcherIcon={<></>} />
          {/* <Button type="primary" onClick={handleSave}>保存</Button> */}
        </Skeleton>
      </div>
    </div>
  );
};
