import React, { useContext, useEffect } from 'react';
import { useAntdTable } from 'ahooks';
import { FFMSApi, apiHolder, apis } from 'api';
import { ShareLink } from '../shareLink';
import { SearchBar } from '../searchBar';
import { SearchContext } from '../searchProvider';
import { FreightTable } from '../common/freightTable';
import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const SearchTable = () => {
  const { searchState } = useContext(SearchContext);

  async function getOrderList(pageInfo: { pageSize: number; current: number }) {
    if (!searchState.departurePortCode || !searchState.destinationPortCode) {
      return {
        list: [],
        total: 0,
      };
    }

    const params = {
      ...searchState,
      sort: searchState.sort === 'price' ? `${searchState.priceSortField}:asc` : searchState.sort,
      sailingDateScope: (searchState.sailingDate || []).map(moment => moment.format('YYYY/MM/DD')).join(':'),
    };

    const res = await ffmsApi.ffOverviewList({
      ...params,
      pageSize: pageInfo.pageSize,
      page: pageInfo.current,
    });

    await new Promise(r => setTimeout(r, 10));
    return {
      list: res?.content || [],
      total: res?.totalSize || 0,
    };
  }

  const { tableProps, search } = useAntdTable(getOrderList, { defaultPageSize: 20 });
  const { submit } = search;

  useEffect(() => {
    submit();
  }, [searchState]);

  return (
    <div className={style.wrapper}>
      <ShareLink className={style.shareBtn} />
      <div className={style.search}>
        <SearchBar />
      </div>

      <div className={style.content}>
        <div className={style.tableWrapper}>
          <FreightTable rowKey="freightId" {...tableProps} />
        </div>
      </div>
    </div>
  );
};
