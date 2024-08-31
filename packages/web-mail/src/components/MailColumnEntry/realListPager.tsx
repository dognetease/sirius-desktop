import React, { CSSProperties, useMemo } from 'react';
import useState2RM from '../../hooks/useState2ReduxMock';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
// import Pagination from '@web-common/components/UI/Pagination';
import Pagination from '@lingxi-common-component/sirius-ui/Pagination';
import { Thunks } from '@web-common/state/reducer/mailReducer';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import Styles from './realListPager.module.scss';
import { apiHolder as api, apis, MailConfApi } from 'api';

const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;

interface IMailRealListPagerProps {
  hideOnSinglePage?: boolean;
  showLessItems?: boolean;
  simple?: boolean;
  showSizeChanger?: boolean;
  hidePaginationItem?: boolean;
  showPageSelector?: boolean;
  style?: CSSProperties;
  showCustomPageSizeSelect?: boolean;
  showCustomPageSelect?: boolean;
  hideQuickJumper?: boolean;
  size?: string;
}

const MailRealListPager: React.FC<IMailRealListPagerProps> = props => {
  const {
    hideOnSinglePage = false,
    showLessItems = false,
    simple = false,
    showSizeChanger = true,
    hidePaginationItem = false,
    style = {},
    showCustomPageSizeSelect = false,
    showCustomPageSelect = false,
    hideQuickJumper = false,
    size = 'normal',
  } = props;
  const totalCount = useAppSelector(state => state.mailReducer.mailTotal);
  const defaultPageSize = useAppSelector(state => state.mailReducer.realListDefaultPageSize);
  const pageSizesOptions = useAppSelector(state => state.mailReducer.realListPageSizes);
  const [currentPage, setCurrentPage] = useState2RM('realListCurrentPage', 'doUpdateRealListPage');
  const [currentPageSize, setCurrentPageSize] = useState2RM('realListCurrentPageSize', 'doUpdateRealListPageSize');
  const dispatch = useAppDispatch();

  const handlePageSizeChange = (page: number, pageSize?: number) => {
    let hasChanged = false;
    if (currentPage !== page || currentPageSize !== pageSize) {
      hasChanged = true;
    }
    let newPage = page;
    if (pageSize && currentPageSize !== pageSize) {
      const startIndex = (page - 1) * pageSize;
      if (startIndex >= totalCount) {
        const lastPage = Math.ceil(totalCount / pageSize);
        newPage = lastPage;
      }
    }
    if (newPage) {
      //@ts-ignore
      setCurrentPage({ page: newPage });
    }
    if (pageSize) {
      //@ts-ignore
      setCurrentPageSize({ pageSize: pageSize });
      mailConfApi.setMailRealListPageSize(pageSize);
    }
    if (hasChanged) {
      dispatch(
        Thunks.loadMailList({
          startIndex: (newPage - 1) * (pageSize || currentPageSize),
          noCache: true,
        })
      );
    }
  };

  const handleCustomPageSizeChange = (value: number) => {
    handlePageSizeChange(currentPage, value);
  };

  const handleCustomPageChange = (value: number) => {
    handlePageSizeChange(value, currentPageSize);
  };

  const pageNum = useMemo(() => Math.ceil(totalCount / currentPageSize), [totalCount, currentPageSize]);

  const pageNumArr = useMemo(() => {
    let res = [];
    if (showCustomPageSelect) {
      for (let i = 1; i <= pageNum; ++i) {
        res.push(i);
      }
    }
    return res;
  }, [pageNum]);

  if (!totalCount) {
    return null;
  }

  if (hideOnSinglePage) {
    if (totalCount <= currentPageSize) {
      return null;
    }
  }

  return (
    <>
      <Pagination
        style={{ ...style }}
        className={
          Styles.realListPager +
          (hidePaginationItem ? ' ' + Styles.hidePageItem : '') +
          (simple ? ' ' + Styles.simple : '') +
          (hideQuickJumper ? ' ' + Styles.hideQuickJumper : '') +
          (size == 'small' ? ' ' + Styles.miniSize : '')
        }
        hideOnSinglePage={hideOnSinglePage}
        simple={simple}
        showLessItems={true}
        // showSizeChanger={showSizeChanger}
        pageSize={currentPageSize}
        current={currentPage}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizesOptions}
        // showQuickJumper={true}
        total={totalCount}
        responsive
        onChange={handlePageSizeChange}
        size={size}
      ></Pagination>
      {/* {showCustomPageSizeSelect && (
        <EnhanceSelect
          dropdownMatchSelectWidth={false}
          className={simple ? Styles.pageSizeSelectSmall : ''}
          value={currentPageSize}
          onChange={handleCustomPageSizeChange}
          defaultValue={currentPageSize}
          size="small"
        >
          {pageSizesOptions.map(pageSize => {
            return <InSingleOption value={Number.parseInt(pageSize)}>{pageSize + '条/页'}</InSingleOption>;
          })}
        </EnhanceSelect>
      )} */}
      {(hideOnSinglePage && pageNum <= 1) || size == 'small'
        ? null
        : showCustomPageSelect && (
            <EnhanceSelect
              className={Styles.pageSelect}
              dropdownClassName={Styles.pageSeletcOption}
              value={currentPage}
              showSearch
              showArrow={false}
              onChange={handleCustomPageChange}
              defaultValue={currentPage}
              size="small"
              style={{ minWidth: '50px', maxWidth: '100px', marginLeft: '8px' }}
            >
              {pageNumArr.map(page => {
                return <InSingleOption value={page}>{page + '/' + pageNum}</InSingleOption>;
              })}
            </EnhanceSelect>
          )}
    </>
  );
};
export default MailRealListPager;
