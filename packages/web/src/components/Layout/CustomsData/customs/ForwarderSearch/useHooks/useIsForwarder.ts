import { useAppSelector } from '@web-common/state/createStore';
import { ChildrenType } from 'web-entry-wm/src/layouts/config/topMenu';

export const FORWARDER_PORT_MENU_LABEL = 'FREIGHT_FORWARDING_PORT_SEARCH';

export const useIsForwarder = () => {
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  return menuKeys[FORWARDER_PORT_MENU_LABEL];
};

export const deleteFromTreeByLabelName: (labelName: string, tree?: ChildrenType[]) => ChildrenType[] = (labelName, tree = []) => {
  return tree
    .filter(item => {
      return item.label !== labelName;
    })
    .map(item2 => ({
      ...item2,
      children: deleteFromTreeByLabelName(labelName, item2.children),
    }));
};
