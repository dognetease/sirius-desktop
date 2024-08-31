import React, { useEffect, useRef, useState, useReducer } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, FacebookApi, PagePostListReq, PagePostItem as tableProps } from 'api';
import qs from 'querystring';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { PostsDetail } from './PostsDetail';
import PostsHeader from './components/header';
import Search from './components/search';
import Table from './components/tableData';
import style from './index.module.scss';
import { Pagination } from './type';
import usePrevNext from './usePrevNext';
import { Authorize } from '../components/authorize';
import { useAppSelector } from '@web-common/state/createStore';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { EdmPageProps } from '@web-edm/pageProps';
import ExpiresAlert from './components/expiresAlert';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

const FaceBook: React.FC<EdmPageProps> = () => {
  const { isAuthorized, authorizedLoading } = useAppSelector(state => state.facebookReducer);
  const [visableDetial, setVisableDetial] = useState<boolean>(false);
  const [refreshLoading, setRefreshLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [postListParams, setPostListParams] = useState<PagePostListReq>({
    size: 20,
    page: 1,
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [tableData, setTableData] = useState<tableProps[]>([]);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(tableData.map(item => item.postId));

  const [postValue, setPostValue] = useState<string | undefined>('ALL');
  const jumpUrlIdPrams = useRef<string>('');

  const initRequest = () => {
    return jumpUrlIdPrams.current;
  };
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]);
    if (!['intelliMarketing', 'edm'].includes(moduleName)) {
      return;
    }
    if (params?.page === 'facebookPosts' && params?.id) {
      let urlId = params.id as string;
      jumpUrlIdPrams.current = urlId;
      setPostValue(urlId);
      setPostListParams(prev => ({
        ...prev,
        pageIdList: [urlId],
      }));
    }
    if (params?.page === 'facebookPosts' && params?.postId && params?.type === 'detail') {
      setCurrentId(params?.postId as string);
      setVisableDetial(true);
    }
  }, [location.hash]);

  useEffect(() => {
    getTableData();
    console.log('postListParams', postListParams);
  }, [postListParams]);

  const getTableData = () => {
    // page 从零开始
    let params = {
      ...postListParams,
      page: postListParams.page - 1,
    };
    if (!params.pageIdList?.length) return;
    setTableLoading(true);
    facebookApi.getPagePostList(params).then(res => {
      const { results, page, size, total } = res;
      setTableData([...results]);
      setPagination({
        total,
        page,
        pageSize: size,
      });
      setRefreshLoading(false);
      setTableLoading(false);
    });
  };

  const updateCommentNums = (id: string, readCount: number) => {
    let updataParams = {
      postId: id,
      readCount,
    };
    facebookApi.unReadCommentCount(updataParams);
  };

  return (
    <PermissionCheckPage resourceLabel="FACEBOOK" accessLabel="VIEW" menu="FACEBOOK_MY_POST">
      <div className={classnames(style.postsWrap, layout.container)}>
        {!isAuthorized ? (
          <Authorize loading={authorizedLoading} trackType="post" />
        ) : (
          <>
            <div className={layout.static}>
              <PostsHeader
                refresh={refreshLoading}
                onClick={() => {
                  setRefreshLoading(true);
                  getTableData();
                }}
              />
              <ExpiresAlert />
              <Search onChange={setPostListParams} postValue={postValue} setPostValue={setPostValue} init={initRequest} />
            </div>
            <div className={classnames(layout.grow, style.mainContent)} ref={growRef}>
              <Table
                tableData={tableData}
                scrollY={scrollY}
                loading={tableLoading}
                pagination={pagination}
                currentPage={postListParams.page}
                onChange={setPostListParams}
                openDetial={(id, nums) => {
                  setCurrentId(id);
                  setVisableDetial(true);
                  nums && updateCommentNums(id, nums);
                }}
              />
            </div>
          </>
        )}
        <PostsDetail
          id={currentId}
          visible={visableDetial}
          onPrev={getPrevCompanyId}
          onNext={getNextCompanyId}
          prevDisabled={prevDisabled}
          nextDisabled={nextDisabled}
          onClose={() => {
            setVisableDetial(false);
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};
export default FaceBook;
