import { api } from '@/api/api';

const storeApi = api.getDataStoreApi();
const UPGRADE_TIME_V12 = 'UPGRADE_TIME_V12'; // 12 版本更新时间

export const getTime = (): string | null => {
  const result = storeApi.getSync(UPGRADE_TIME_V12);
  if (result.suc && result.data != null) {
    // 不存在
    return result.data;
  }
  return null;
};

export const setTime = (): void => {
  storeApi.putSync(UPGRADE_TIME_V12, String(Date.now()));
};

export const updateTime = (): void => {
  if (getTime() == null) {
    setTime();
  }
};
