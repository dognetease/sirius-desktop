import { useState } from 'react';

export default () => {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });
  // const [total, setTotal] = useState<number>(0);

  return {
    pagination,
    // total,
    // setPage(page) {
    //     setPagination({
    //         page,
    //         pageSize: pagination.pageSize
    //     });
    // },
    // setPageSize(pageSize) {
    //     setPagination({
    //         page: 1,
    //         pageSize
    //     });
    // },
    /**
     * 页面更改
     */
    onPaginationChange(page, pageSize) {
      console.log('page-change', page, pageSize);
      setPagination({
        page,
        pageSize,
      });
    },
  };
};
