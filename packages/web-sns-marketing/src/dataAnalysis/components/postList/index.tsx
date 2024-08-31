import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { SnsDataAnalysis } from 'api';
import { PostCard } from './postCard';
import PostDetailDrawer from '../../../components/PostDetailDrawer';
import style from './post.module.scss';

interface Props {
  data: SnsDataAnalysis.HotPost[];
}

export const PostList: React.FC<Props> = props => {
  const { data = [] } = props;
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailPost, setDetailPost] = useState<SnsDataAnalysis.HotPost | null>(null);
  const macyRef = useRef<any>();

  const postCardClick = useCallback((post: SnsDataAnalysis.HotPost) => {
    setDetailPost(post);
    setDetailVisible(true);
  }, []);

  const detailPostIndex = useMemo(() => {
    if (!detailPost) return -1;

    return (data || []).findIndex(item => item.postDbId === detailPost.postDbId);
  }, [detailPost, data]);

  const initMacy = useCallback(async () => {
    if (macyRef.current) {
      setTimeout(() => macyRef.current?.reInit(), 500);
      return;
    }
    // @ts-ignore
    const { default: Macy } = await import('macy');
    if (Macy) {
      macyRef.current = new Macy({
        container: '#snsHotPost',
        trueOrder: true,
        waitForImages: false,
        margin: 20,
        columns: 3,
      });
    }
  }, [macyRef]);

  useEffect(() => {
    initMacy();
  }, [data]);

  return (
    <>
      <div className={style.postList} id="snsHotPost">
        {data.map((post, index) => (
          <div className={`${style.postWrapper} ${style[`postIndex${index}`]}`}>
            <PostCard key={post.postId} data={post} onClick={() => postCardClick(post)} />
          </div>
        ))}
      </div>

      <PostDetailDrawer
        visible={detailVisible}
        platform={detailPost?.platform}
        postId={detailPost?.postId}
        prevDisabled={detailPostIndex < 1 || data?.slice(0, detailPostIndex).every(item => !item.postId)}
        nextDisabled={detailPostIndex > data?.length - 2 || data?.slice(detailPostIndex + 1).every(item => !item.postId)}
        onPrev={() => setDetailPost(data?.slice(0, detailPostIndex).findLast(item => item.postId) || null)}
        onNext={() => setDetailPost(data?.slice(detailPostIndex + 1).find(item => item.postId) || null)}
        onClose={() => {
          setDetailVisible(false);
          // submit();
        }}
      />
    </>
  );
};
