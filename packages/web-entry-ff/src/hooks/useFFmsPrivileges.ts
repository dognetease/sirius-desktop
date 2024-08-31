import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { getModuleAccessSelector, getModuleDataPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';

export function useFFmsPrivileges(): { hasAdminPermission: boolean; hasAllDataPermission: boolean } {
  const resourceLabel = 'SUBSCRIBE_CUSTOMER_LIST';
  const hasAdminPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, 'OP'));
  const moduleAccess = useAppSelector(state => state.privilegeReducer.moduleAccessRange);
  const dispatch = useAppDispatch();
  const moduleAccessList = moduleAccess[resourceLabel] || [];
  const hasAllDataPermission = !(moduleAccessList.length === 1 && moduleAccessList[0] === 'OWNER');
  useEffect(() => {
    dispatch(getModuleDataPrivilegeAsync(resourceLabel));
  }, []);

  return { hasAdminPermission, hasAllDataPermission };
}
