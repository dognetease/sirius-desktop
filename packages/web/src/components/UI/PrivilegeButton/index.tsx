import { useAppSelector } from '@web-common/state/createStore';
import { Button, ButtonProps } from 'antd';
import React from 'react';

export interface IPrivilegeButtonProps extends ButtonProps {
  accessLabel: string;
  resourceLabel: string;
  noPermission?: 'disabled' | 'hidden';
}

export const PrivilegeButton = ({ accessLabel, resourceLabel, noPermission = 'hidden', children, ...props }: IPrivilegeButtonProps) => {
  const privilege = useAppSelector(state => state.privilegeReducer.modules[resourceLabel]);
  const hasPermisson = privilege !== undefined && privilege.funcPrivileges.some(i => i.accessLabel === accessLabel);

  if (!hasPermisson) {
    if (noPermission === 'hidden') {
      return null;
    }
    return (
      <Button {...props} disabled>
        {children}
      </Button>
    );
  }
  return <Button {...props}>{children}</Button>;
};
