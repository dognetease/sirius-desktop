import { DataStoreApi, api } from 'api';
import { useCallback, useState } from 'react';

export interface SearchHistoryItem {
  query: string;
  searchType: string;
}
const SEARCH_HISTORY_KEY = 'LINKEDIN_HISTORY';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
export const useSearchHistory = () => {
  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<Array<SearchHistoryItem>>(() => {
    const { data } = dataStoreApi.getSync(SEARCH_HISTORY_KEY, { noneUserRelated: true });
    if (data) {
      try {
        const oldData = JSON.parse(data);
        if (Array.isArray(oldData)) {
          return oldData;
        }
        return [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const clearHistory = useCallback((st: string) => {
    setSearchHistory(prev => {
      const filteredObj = prev.filter(e => e.searchType !== st);
      try {
        dataStoreApi.putSync(SEARCH_HISTORY_KEY, JSON.stringify(filteredObj), { noneUserRelated: true });
      } catch (error) {
        // do nothing
      }
      return filteredObj;
    });
  }, []);
  const addToSearchHistory = useCallback(
    (value: SearchHistoryItem) => {
      const { query: queryBody, searchType: curSearchType } = value;
      if (queryBody.trim().length === 0) {
        return;
      }
      const targetTypeList = searchHistory.filter(e => e.searchType === curSearchType);
      const restTypeList = searchHistory.filter(e => e.searchType !== curSearchType);
      const keyQueryIndex = targetTypeList.findIndex(historyQuery => historyQuery.query === queryBody);
      // 没出现过
      if (keyQueryIndex === -1) {
        targetTypeList.unshift(value);
      } else {
        targetTypeList.splice(keyQueryIndex, 1, value);
      }
      const resultList = targetTypeList.slice(0, 7).concat(restTypeList);
      setSearchHistory(resultList);
      dataStoreApi.putSync(SEARCH_HISTORY_KEY, JSON.stringify(resultList), {
        noneUserRelated: true,
      });
    },
    [searchHistory]
  );
  return {
    searchHistoryOpen,
    searchHistory,
    setSearchHistoryOpen,
    clearHistory,
    addToSearchHistory,
  };
};
