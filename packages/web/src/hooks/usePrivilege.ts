import { useAppSelector } from '@web-common/state/createStore';

const useCanEdit = (resourceLabel: string) => {
  const privilege = useAppSelector(state => state.privilegeReducer.modules[resourceLabel]);
  return privilege?.funcPrivileges.some(item => item.accessLabel === 'OP');
};

const useCanDelete = (resourceLabel: string) => {
  const privilege = useAppSelector(state => state.privilegeReducer.modules[resourceLabel]);
  return privilege?.funcPrivileges.some(item => item.accessLabel === 'DELETE');
};

const useDataRange = (resourceLabel: string) => {
  const privilege = useAppSelector(state => state.privilegeReducer.modules[resourceLabel]);
  return privilege && privilege.dataPrivilege?.accessRange === 'OWNER';
};
