import { getIn18Text } from 'api';
import React, { ReactNode } from 'react';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { message } from 'antd';

export interface PrivilegeCheckProps {
  accessLabel: string;
  resourceLabel: string;
}

export interface PermissionCheckPageProps {
  accessLabel: string;
  resourceLabel: string;
  menu: string;
  customContent?: ReactNode;
}

export const PrivilegeCheck: React.FC<PrivilegeCheckProps> = ({ children, accessLabel, resourceLabel }) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, accessLabel));
  // 地址簿下，只有导出功能做权限控制，其他直接通过
  if ((resourceLabel === 'ADDRESS_BOOK' && accessLabel !== 'EXPORT') || (resourceLabel === 'ADDRESS_OPEN_SEA' && accessLabel !== 'EXPORT')) {
    return <>{children}</>;
  }
  return hasPermisson ? <>{children}</> : null;
};

export const PermissionCheckPage: React.FC<PermissionCheckPageProps> = ({ children, accessLabel, resourceLabel, menu, customContent }) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, accessLabel));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  if (menu === 'EDM_MULTI_ACCOUNT_INFO') {
    return hasPermisson && menuKeys[menu] === true ? <>{children}</> : <NoPermissionPage children={customContent} />;
  }
  // return hasPermisson && menuKeys[menu] !== false ? <>{children}</> : <NoPermissionPage children={customContent} />;
  return hasPermisson && menuKeys[menu] === true ? <>{children}</> : <NoPermissionPage children={customContent} />;
  // return hasPermisson && menuKeys[menu] !== false ? <>{children}</> : <NoPermissionPage children={customContent} />;
};

export const usePermissionCheck = (accessLabel: string, resourceLabel: string, menu: string) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, accessLabel));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  if (menu === 'EDM_MULTI_ACCOUNT_INFO') {
    return hasPermisson && menuKeys[menu] === true;
  }
  // return hasPermisson && menuKeys[menu] !== false;
  return hasPermisson && menuKeys[menu] === true;
  // return hasPermisson && menuKeys[menu] !== false;
};

export const NoPermissionPage: React.FC<{ title?: string }> = ({ children, title }) => (
  <div className="no-permission-page">
    <div className="sirius-no-permission" />
    <div className="text">{title || '暂无权限，请联系相应管理员进行设置'}</div>
    {children}
  </div>
);

export const PrivilegeCheckForMailPlus: React.FC<PrivilegeCheckProps> = ({ children, accessLabel, resourceLabel }) => {
  const hasPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, accessLabel));
  const noPermissonToast = true;
  if (hasPermisson) {
    return <>{children}</>;
  }
  if (noPermissonToast) {
    return (
      <>
        {React.Children.map(children, child =>
          React.cloneElement(child as React.ReactElement, {
            onClick: (event: React.MouseEvent) => {
              // 阻止冒泡和默认行为
              event?.stopPropagation && event?.stopPropagation();
              event?.preventDefault && event?.preventDefault();
              message.info(getIn18Text('NINHAIMEIYOUCAOZUOQUAN'));
            },
          })
        )}
      </>
    );
  }
  return null;
};
