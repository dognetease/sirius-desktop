import { useCallback, useState } from 'react';
import { api } from 'api';

const dataStoreApi = api.getDataStoreApi();

const CUSTOMS_RECORD_DETAIL_USELESS_HIDE_KEY = 'CUSTOMS_RECORD_DETAIL_USELESS_HIDE_KEY';
const CUSTOMS_RECORD_DETAIL_USELESS_HIDE_VALUE = 'CUSTOMS_RECORD_DETAIL_USELESS_HIDE_VALUE';

type UseUselessHideHook = () => [boolean, (state: boolean) => void];

const useUselessHideHook: UseUselessHideHook = () => {
  const [useLess, setUseLess] = useState<boolean>(() => {
    const { data } = dataStoreApi.getSync(CUSTOMS_RECORD_DETAIL_USELESS_HIDE_KEY);
    return data === CUSTOMS_RECORD_DETAIL_USELESS_HIDE_VALUE;
  });
  const changeUseLessState = useCallback((state: boolean) => {
    setUseLess(state);
    dataStoreApi.putSync(CUSTOMS_RECORD_DETAIL_USELESS_HIDE_KEY, state ? CUSTOMS_RECORD_DETAIL_USELESS_HIDE_VALUE : '');
  }, []);

  return [useLess, changeUseLessState];
};

export default useUselessHideHook;
