import { apiHolder, DataStoreApi } from 'api';
import lodashGet from 'lodash/get';

const DataStore = apiHolder.api.getDataStoreApi() as DataStoreApi;

export const useRecentEmoji = (name: string): string[] => {
  const quickReplyDataStore = DataStore.getSync(name, { noneUserRelated: true });
  const resultStr = lodashGet(quickReplyDataStore, 'data', '');
  const resultList = resultStr.split(',');
  return resultList.filter(item => item);
};

export const setRecentEmoji = (list: string[], item: string, max: number, name: string): void => {
  if (!item) {
    return;
  }
  const updateList = list.filter(itm => itm).concat([]);
  const site = updateList.indexOf(item);
  if (site > -1) {
    updateList.splice(site, 1);
  }
  updateList.unshift(item);
  if (updateList.length > max) {
    updateList.pop();
  }
  DataStore.put(name, updateList.join(), { noneUserRelated: true });
};
