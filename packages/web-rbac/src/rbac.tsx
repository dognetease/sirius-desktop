import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { apiHolder, apis, ContactApi, ContactModel, EdmRoleApi, EntityOrg, EventApi, MEMBER_TYPE, OrgApi, OrgModel } from 'api';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useLocation, navigate } from '@reach/router';
import qs from 'querystring';
import { Tree, TreeProps } from 'antd';
import { DataNode } from 'rc-tree/lib/interface';
import classnames from 'classnames';

import styles from './index.module.scss';
import { RoleMembers } from './member/member';
import { RoleManager } from './roleManager/roleManager';
import { RoleDetail } from './roleManager/roleDetail';
import { MenuManage } from './menuManage/menuManage';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { getMyRolesAsync } from '@web-common/state/reducer/privilegeReducer';
import { navigateTo } from '@/components/util/blockableNavigate';

const renderTitle: TreeProps['titleRender'] = node => (
  <span
    className={classnames({
      [styles.leafNode]: node.children?.length,
    })}
  >
    {node.title}
  </span>
);

const menuData: DataNode[] = [
  {
    key: 'enterprise',
    title: '企业成员',
    children: [],
  },
  {
    key: 'roleManage',
    title: '角色管理',
    children: [
      {
        key: 'rolePermissions',
        title: '角色权限',
      },
      /*{
      key: 'userRoles',
      title: '授权管理'
    }*/
    ],
  },
  {
    key: 'menuSetting',
    title: '菜单管理',
  },
];

const RbacSetting: React.FC<any> = props => {
  const [activeMenuKey, setActiveMenuKey] = useState('enterprise');
  const [expandedKeys, setExpandedKeys] = useState<Array<string | number>>([]);
  const location = useLocation();
  const [page, setPage] = useState('members');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const { roles: myRoles, loading } = useAppSelector(state => state.privilegeReducer);
  const appDispatch = useAppDispatch();

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'rbac') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    const page = params.page as string;
    setPage(page);
    setPageParams(params);
    // const matchMenu = [...menuData].some((menu) => {
    //     return menu.children?.some(i => i.key === page);
    // });
    if (page === 'members') {
      setActiveMenuKey((params.orgId as string) || 'enterprise');
    } else {
      setActiveMenuKey(page);
    }
  }, [location]);

  useEffect(() => {
    // appDispatch(getEdmUserTreeAsync());
    appDispatch(getMyRolesAsync());

    // // 监听通讯录变化
    // const OBSERVE_SYNC_ID = eventApi.registerSysEventObserver('contactNotify', {
    //   name: 'contact.tsxRbacNotifyOb',
    //   func: () => {
    //     appDispatch(getEdmUserTreeAsync());
    //   }
    // });
    // return () => {
    //   eventApi.unregisterSysEventObserver('contactNotify', OBSERVE_SYNC_ID);
    // };
  }, []);

  useEffect(() => {
    if (!myRoles.some(role => role.roleType === 'ADMIN')) {
      navigate('#mailbox');
    }
  }, [myRoles]);

  const handleMenuClick: TreeProps['onSelect'] = (_, { node }) => {
    const key = node.key;
    setActiveMenuKey(key as string);
    switch (key) {
      case 'roleManage':
      case 'rolePermissions': {
        navigateTo(`#rbac?page=rolePermissions`);
        break;
      }
      case 'enterprise': {
        navigateTo(`#rbac?page=members&orgId=`);
        break;
      }
      case 'userRoles': {
        navigateTo(`#rbac?page=roles`);
        break;
      }
      case 'menuSetting': {
        navigateTo(`#rbac?page=menuSetting`);
        break;
      }
      default: {
        navigateTo(`#rbac?page=members&orgId=${key}`);
      }
    }
    let keys = [...expandedKeys];
    if (node.expanded) {
      const idx = keys.indexOf(key);
      if (idx > -1) keys.splice(idx, 1);
    } else {
      keys.push(key);
    }
    setExpandedKeys(keys);
  };

  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      members: <RoleMembers />,
      rolePermissions: <RoleManager />,
      roleDetail: <RoleDetail qs={qs} />,
      menuSetting: <MenuManage />,
    };
    return map[key] || map.members;
  };

  return (
    /** 页面内容外出包裹PageContentLayout组件 */
    <PageContentLayout>
      <SideContentLayout borderRight minWidth={FIR_SIDE} className={styles.configSettingWrap} defaultWidth={220}>
        <div className={styles.treeContainer}>
          <Tree
            blockNode
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            onSelect={handleMenuClick}
            titleRender={renderTitle}
            selectedKeys={[activeMenuKey]}
            treeData={menuData}
            className="sirius-no-drag"
          />
        </div>
      </SideContentLayout>

      {myRoles.some(role => role.roleType === 'ADMIN') ? renderContent(page, pageParams) : <NoPermissionPage />}
    </PageContentLayout>
  );
};

export default RbacSetting;
