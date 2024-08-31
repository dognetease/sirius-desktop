/**
 * 表格加载
 */
import { useEffect, useState } from 'react';
import { TablePaginationConfig } from 'antd';

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function useTableSearch<Tsearch, TResponse>(
  api: (search: Tsearch, pagination: TablePaginationConfig) => Promise<[number, TResponse]>,
  initSearch?: Partial<Tsearch>,
  searchDelay: number = 0
) {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<Tsearch>(({ ...initSearch } || {}) as Tsearch);
  const [data, setData] = useState<TResponse>({} as TResponse);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    pageSize: 20,
    current: 1,
    total: 0,
    size: 'small',
    className: 'pagination-wrap',
    showSizeChanger: true,
    // hideOnSinglePage: true
  });
  const debouncedSearch = useDebounce<Tsearch>(searchParams, searchDelay);

  function pageChange(current: number, pageSize: number | undefined) {
    setPagination({ ...pagination, current, pageSize });
  }

  async function fetchData() {
    try {
      setLoading(true);
      const [total = 0, resData] = await api(searchParams, pagination);
      setPagination({ ...pagination, total, className: total > 20 ? 'pagination-wrap' : 'pagination-wrap-hidden' });
      setData(resData);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 刷新 重置搜索和分页
   */
  function reload(resetSearch = true) {
    if (!resetSearch && pagination.current === 1) {
      fetchData();
      return;
    }

    if (resetSearch) {
      setSearchParams({ ...(initSearch as Tsearch) });
    }

    setPagination({ ...pagination, current: 1 });
  }

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [debouncedSearch]);

  return {
    pagination,
    pageChange,
    setPagination,
    loading,
    fetchData,
    data,
    setData,
    setSearchParams,
    searchParams,
    reload,
  };
}
