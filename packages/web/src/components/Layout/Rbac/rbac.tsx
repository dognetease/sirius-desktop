import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { apiHolder, apis, ContactApi, ContactModel, EdmRoleApi, EntityOrg, EventApi, MEMBER_TYPE, OrgApi, OrgModel } from 'api';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useLocation, navigate } from '@reach/router';
import qs from 'querystring';
import { Tree, TreeProps } from 'antd';
import { DataNode } from 'rc-tree/lib/interface';
import classnames from 'classnames';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMyRolesAsync } from '@web-common/state/reducer/privilegeReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import styles from './index.module.scss';
import { RoleMembers } from './member/member';
import { RoleManager } from './roleManager/roleManager';
import { RoleDetail } from './roleManager/roleDetail';
import { RoleDetailV2 } from './roleManager/RoleDetailV2';
import { MenuManage } from './menuManage/menuManage';
import { MenuManageV2 } from './menuManage/menuManageV2';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { navigateTo } from '@/components/util/blockableNavigate';
import { getIn18Text } from 'api';
import { useVersionCheck } from '@web-common/hooks/useVersion';

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
    title: getIn18Text('QIYECHENGYUAN'),
    children: [],
  },
  {
    key: 'roleManage',
    title: getIn18Text('JIAOSEGUANLI'),
    children: [
      {
        key: 'rolePermissions',
        title: getIn18Text('JIAOSEQUANXIAN'),
      },
      /* {
              key: 'userRoles',
              title: '授权管理'
            } */
    ],
  },
  {
    key: 'menuSetting',
    title: getIn18Text('CAIDANGUANLI'),
  },
];
const RbacSetting: React.FC<any> = props => {
  const [activeMenuKey, setActiveMenuKey] = useState('enterprise');
  const [expandedKeys, setExpandedKeys] = useState<Array<string | number>>([]);
  const location = useLocation();
  const [page, setPage] = useState('members');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const { roles: myRoles, loading } = useAppSelector(state => state.privilegeReducer);
  const myRolesMemo = myRoles.map(v => v.roleId).join('');
  const isAdmin = useMemo(() => myRoles.some(role => role.roleType === 'ADMIN'), [myRolesMemo]);
  const v1v2 = useVersionCheck();

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
  }, [location.hash]);
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
    if (!isAdmin) {
      navigate('#mailbox');
    }
  }, [isAdmin]);

  const handleMenuClick: TreeProps['onSelect'] = (_, { node }) => {
    const { key } = node;
    setActiveMenuKey(key as string);
    switch (key) {
      case 'roleManage':
      case 'rolePermissions': {
        navigateTo('#rbac?page=rolePermissions');
        break;
      }
      case 'enterprise': {
        navigateTo('#rbac?page=members&orgId=');
        break;
      }
      case 'userRoles': {
        navigateTo('#rbac?page=roles');
        break;
      }
      case 'menuSetting': {
        navigateTo('#rbac?page=menuSetting');
        break;
      }
      default: {
        navigateTo(`#rbac?page=members&orgId=${key}`);
      }
    }
    const keys = [...expandedKeys];
    if (node.expanded) {
      const idx = keys.indexOf(key);
      if (idx > -1) {
        keys.splice(idx, 1);
      }
    } else {
      keys.push(key);
    }
    setExpandedKeys(keys);
  };
  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      members: <RoleMembers />,
      rolePermissions: <RoleManager />,
      roleDetail: v1v2 === 'v2' ? <RoleDetailV2 qs={qs} /> : <RoleDetail qs={qs} />,
      menuSetting: v1v2 === 'v2' ? <MenuManageV2 /> : <MenuManage v1v2={v1v2 as 'NONE' | 'v1'} />,
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

      {isAdmin ? renderContent(page, pageParams) : <NoPermissionPage />}
    </PageContentLayout>
  );
};
export default RbacSetting;
