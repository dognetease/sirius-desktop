import { useState, useEffect } from 'react';

interface Pagination {
  total?: number;
  pageSize?: number;
  current?: number;
}
const defaultPagination = {
  total: 0,
  pageSize: 10,
  current: 1,
};
export default function usePagination(option: Pagination = defaultPagination) {
  const [pagination, setPagination] = useState(option);
  const updatePage = (page: Pagination) => {
    setPagination({
      ...pagination,
      ...page,
    });
  };
  return [
    pagination,
    {
      updatePage: updatePage,
    },
  ];
}
