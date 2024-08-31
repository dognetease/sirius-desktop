import React, { useEffect, useRef, useState, useCallback } from 'react';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { apiHolder, apis, FacebookApi, FbCommentListReq as reqParams, FbCommentListRes } from 'api';
import { Skeleton } from 'antd';
import { DetailHeader } from './detailHeader';
import { PostsContent } from './detailContent';
import debounce from 'lodash/debounce';
import style from './index.module.scss';
import cloneDeep from 'lodash/cloneDeep';
import { PostEditorSuccess } from './../type';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

interface PostsDetailProps {
  visible: boolean;
  id: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
}
const PostsDetail = (props: PostsDetailProps) => {
  const { visible, onClose, id, onPrev, onNext, prevDisabled, nextDisabled } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);
  const [commentListParams, setCommentListParams] = useState<reqParams>({
    size: 20,
    page: 0,
    postId: '',
  });
  const [postInfo, setPostInfo] = useState<FbCommentListRes>();
  const needAddData = useRef<boolean>(true);

  useEffect(() => {
    visible && id && setCommentListParams(prev => ({ ...prev, postId: id }));
    !visible && init();
  }, [visible, id]);
  useEffect(() => {
    if (commentListParams.postId) {
      getFbCommentList();
    }
  }, [commentListParams]);

  const init = () => {
    setCommentListParams({
      size: 20,
      page: 0,
      postId: '',
    });
    setLoading(false);
    setPostInfo(undefined);
    setInitLoading(true);
  };
  // 数据叠加
  const getFbCommentList = () => {
    facebookApi.getFbCommentList(commentListParams).then(res => {
      let { results } = res;
      initLoading && setInitLoading(false);
      if (needAddData.current) {
        setPostInfo(prev => ({
          ...res,
          results: prev ? [...prev.results, ...results] : results,
        }));
      } else {
        setPostInfo(res);
      }
      needAddData.current = true;
      setLoading(false);
    });
  };

  const getChildCommentList = (commentId: string, size: number) => {
    let params = {
      commentId,
      page: 0,
      size,
    };
    facebookApi.getFbChildCommmetList(params).then(res => {
      let data = cloneDeep(postInfo);
      if (data) {
        data.results.map(item => {
          if (item.commentId === commentId) {
            item.childComments = [...res.results];
            item.childCommentCount = res.total;
          }
          return item;
        });
        data.postInfo.commentCount += 1;
        setPostInfo({ ...data });
      }
    });
  };
  const onSuccess = ({ id, nums }: PostEditorSuccess) => {
    getChildCommentList(id, nums ? nums + 1 : 1);
  };

  // 节流获取下一页
  const debounceGetNextPage = useCallback(
    debounce(async () => {
      let hasMore = postInfo ? postInfo.total > postInfo.results.length : false;
      if (!loading && hasMore && postInfo) {
        setLoading(true);
        setCommentListParams(prev => ({ ...prev, page: prev.page + 1 }));
      }
    }, 500),
    [loading, postInfo]
  );
  // 滚动加载
  const onScrollCapture = e => {
    const { target } = e;
    const { scrollHeight, scrollTop, clientHeight } = target as HTMLDivElement;
    console.log('xxxx-current-loading', scrollHeight, scrollTop, clientHeight);
    // 快要触底 加载下一页文件
    if (scrollHeight - scrollTop - clientHeight < 50) debounceGetNextPage();
  };

  return (
    <Drawer className={style.postsDetailWrap} contentWrapperStyle={{ width: 504 }} visible={visible} onClose={() => onClose()}>
      <DetailHeader
        onPrev={() => {
          onPrev();
          init();
        }}
        onNext={() => {
          onNext();
          init();
        }}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
      ></DetailHeader>
      <div className={style.mainContent} onScrollCapture={onScrollCapture}>
        {!initLoading && postInfo && (
          <PostsContent
            sortChange={sort => {
              needAddData.current = false;
              setCommentListParams(prev => ({ ...prev, page: 0, sort }));
            }}
            data={postInfo}
            loading={loading}
            onSuccess={onSuccess}
            onFailure={() => {}}
          />
        )}
        {initLoading && (
          <div className={style.outerLoading}>
            <Skeleton avatar paragraph={{ rows: 4 }} />
          </div>
        )}
      </div>
    </Drawer>
  );
};
export { PostsDetail };
