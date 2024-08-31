import { useAppSelector } from '@web-common/state/createStore';
import { FLOLDER } from './../common/constant';

const useShouldUseRealList = () => {
  const useRealList = useAppSelector(state => state.mailReducer.useRealList);
  const isSearching = useAppSelector(state => state.mailReducer.mailSearching);
  const selectKeys = useAppSelector(state => state.mailReducer.selectedKeys);
  const isTaskFolder = selectKeys && selectKeys.id ? selectKeys.id === FLOLDER.TASK : false;
  return useRealList && !isSearching && !isTaskFolder;
};
export default useShouldUseRealList;
