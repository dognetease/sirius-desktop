import { useAppSelector } from '@web-common/state/createStore';
import { getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';

const useIsFreeVersion = () => {
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));

  return {
    isFreeVersion: isFreeVersionUser,
  };
};

export default useIsFreeVersion;
