import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { api } from 'api';
import Styles from './search-history-list.module.scss';
const dataStoreApi = api.getDataStoreApi();

export interface ISearchItem {
  desc: string;
  filter: any;
  id: string;
}

export interface ISearchItemProps {
  data: ISearchItem;
  handleClick: (item: ISearchItem) => void;
  handleDelete: (item: ISearchItem) => void;
}

const SearchListItem: React.FC<ISearchItemProps> = props => {
  const { data, handleClick, handleDelete } = props;
  return (
    <div
      className={Styles.searchListItem}
      onClick={_ => {
        handleClick(data);
      }}
    >
      <div className={Styles.searchListItemDesc} title={data.desc}>
        {data.desc}
      </div>
      <div
        className={Styles.searchListItemDel}
        onClick={ev => {
          ev.preventDefault();
          ev.stopPropagation();
          handleDelete(data);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4L12 12M12 4L4 12" stroke="#6F7485" stroke-linecap="round" />
        </svg>
      </div>
    </div>
  );
};

export const SAVE_KEY = 'ADDRESS_BOOK_SEARCH_HISTORY';

export async function getSearchHistoryList() {
  try {
    const data = await dataStoreApi.getFromDB(SAVE_KEY);
    if (data && data.suc && data.data) {
      let res: Array<ISearchItem> = JSON.parse(data.data);
      res = res.filter(_ => _.filter.relation); // 筛选项升级后，过滤掉不符合新版的历史记录
      return res as Array<ISearchItem>;
    }
    return [];
  } catch (ex) {
    return [];
  }
}

export async function saveSearchHistoryList(items: Array<ISearchItem>) {
  try {
    await dataStoreApi.putToDB(SAVE_KEY, JSON.stringify(items));
  } catch (ex) {
    console.error('saveSearchHistList-error', ex);
  }
}

export interface ISearchHistoryListCompoentRef {
  saveSearchItem(item: ISearchItem): void;
  searchList: Array<ISearchItem>;
}

const MAX_SAVE_LEN = 3;
const SearchHistoryList = forwardRef<
  ISearchHistoryListCompoentRef,
  {
    handleSearchChange(item: ISearchItem): void;
    setSearchHistoryList?: (item: Array<ISearchItem>) => void;
  }
>((props, ref) => {
  const { handleSearchChange, setSearchHistoryList } = props;
  const [searchList, setSearchList] = useState<Array<ISearchItem>>([]);

  useImperativeHandle(ref, () => {
    return {
      saveSearchItem,
      searchList,
    };
  });

  const saveSearchItem = (item: ISearchItem) => {
    const newSearchList = [...searchList];
    if (newSearchList.length >= MAX_SAVE_LEN) {
      newSearchList.pop();
    }
    newSearchList.unshift(item);
    saveSearchHistoryList(newSearchList);
    setSearchList(newSearchList);
    setSearchHistoryList && setSearchHistoryList(newSearchList);
  };

  const deleteSearchItem = (item: ISearchItem) => {
    const newSearchList = searchList.filter(i => i.id !== item.id);
    saveSearchHistoryList(newSearchList);
    setSearchList(newSearchList);
    setSearchHistoryList && setSearchHistoryList(newSearchList);
  };

  useEffect(() => {
    getSearchHistoryList().then(res => {
      setSearchList(res);
      setSearchHistoryList && setSearchHistoryList(res);
    });
  }, []);

  if (!searchList || !searchList.length) {
    return null;
  }

  return (
    <>
      <div className={Styles.searchList}>
        <div className={Styles.searchListLabel}>历史筛选：</div>
        {searchList.map(item => {
          return <SearchListItem data={item} handleClick={handleSearchChange} handleDelete={deleteSearchItem}></SearchListItem>;
        })}
      </div>
    </>
  );
});

export default SearchHistoryList;
