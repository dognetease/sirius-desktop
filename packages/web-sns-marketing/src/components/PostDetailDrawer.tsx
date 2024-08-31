import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import { apis, apiHolder, SnsMarketingApi, SnsMarketingPost, SnsPostParentComment, SnsMarketingPlatform } from 'api';
import { Empty, Tabs } from 'antd';
import classnames from 'classnames';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import PostPreview from './PostPreview';
import QuickSwitch from './QuickSwitch';
import PostComment from './PostComment';
import CommentDetailModal from './CommentDetailModal';
import { PostState } from './PostState';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as ArrowUpIcon } from '@web-sns-marketing/images/comment-arrow-up.svg';
import { ReactComponent as ArrowDownIcon } from '@web-sns-marketing/images/comment-arrow-down.svg';
import { ReactComponent as WarningIcon } from '@web-sns-marketing/images/state/warning.svg';
import { camelToPascal } from '../utils';
import style from './PostDetailDrawer.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

interface PostDetailDrawerProps {
  visible: boolean;
  postId?: string | null;
  platform?: SnsMarketingPlatform | null;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

const PostDetailDrawer: React.FC<PostDetailDrawerProps> = props => {
  const { visible, postId, platform, prevDisabled, nextDisabled, onPrev, onNext, onClose } = props;

  const [fetching, setFetching] = useState<boolean>(false);
  const [post, setPost] = useState<SnsMarketingPost | null>(null);
  const [comments, setComments] = useState<SnsPostParentComment[]>([]);
  const [commentTotal, setCommentsTotal] = useState<number>(0);
  const [createTimeOrder, setCreateTimeOrder] = useState<'ASC' | 'DESC' | ''>('');
  const [commentDetailVisible, setCommentDetailVisible] = useState<boolean>(false);
  const [detailComment, setDetailComment] = useState<SnsPostParentComment | null>(null);

  const handleOrderNext = () => {
    const nextOrderMap: Record<'ASC' | 'DESC' | '', 'ASC' | 'DESC' | ''> = {
      '': 'ASC',
      ASC: 'DESC',
      DESC: '',
    };
    setCreateTimeOrder(nextOrderMap[createTimeOrder]);
  };

  const handleChildCommentsUpdate = (comment: SnsPostParentComment) => {
    snsMarketingApi
      .getSnsPostChildComments({
        commentId: comment.commentId,
        postId: post!.postId,
        page: 1,
        size: 500,
        order: createTimeOrder,
        sortBy: createTimeOrder ? camelToPascal('createTime') : '',
      })
      .then(res => {
        setComments(list =>
          list.map(item =>
            item.commentId === comment.commentId
              ? {
                  ...item,
                  childComments: res.results,
                  childCommentCount: res.total,
                }
              : item
          )
        );
        setDetailComment(detailComment => {
          if (!detailComment) return null;

          return {
            ...detailComment,
            childComments: res.results,
            childCommentCount: res.total,
          };
        });
      });
  };

  useEffect(() => {
    if (visible && postId && platform) {
      setFetching(true);

      snsMarketingApi
        .getSnsPostComments({
          page: 1,
          size: 500,
          postId,
          platform,
          order: createTimeOrder,
          sortBy: createTimeOrder ? camelToPascal('createTime') : '',
        })
        .then(res => {
          setPost(res.postInfo);
          setComments(res.results);
          setCommentsTotal(res.total);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [visible, postId, platform, createTimeOrder]);

  useEffect(() => {
    if (!visible) {
      setPost(null);
      setComments([]);
      setCommentsTotal(0);
      setCreateTimeOrder('');
    }
  }, [visible]);

  return (
    <Drawer
      className={style.postDetailDrawer}
      contentWrapperStyle={{ width: 535 }}
      visible={visible}
      onClose={onClose}
      title={
        <div className={style.title}>
          <span>{getIn18Text('TIEZIXIANGQING')}</span>
          <QuickSwitch className={style.switch} prevDisabled={prevDisabled || fetching} nextDisabled={nextDisabled || fetching} onPrev={onPrev} onNext={onNext} />
        </div>
      }
    >
      <div className={style.top}>
        <PostPreview className={style.postPreview} post={post} />
      </div>
      <div className={style.tabs}>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab={getIn18Text('SHUJUFENXI')} key="1">
            <PostState post={post} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={getIn18Text('PINGLUN')} key="2">
            {post?.platform === SnsMarketingPlatform.INSTAGRAM && (
              <div className={style.warning}>
                <WarningIcon />
                <div className={style.warningText}>{getIn18Text('Instagr')}</div>
              </div>
            )}
            <div className={style.commentsWrapper}>
              <div className={style.header}>
                <div>
                  {getIn18Text('GONG')}
                  {commentTotal}
                  {getIn18Text('NTIAOPINGLUN')}
                </div>
                <div className={style.createTimeOrder} onClick={handleOrderNext}>
                  <span>{getIn18Text('PINGLUNSHIJIAN')}</span>
                  <div className={style.arrows}>
                    <ArrowUpIcon
                      className={classnames(style.arrow, {
                        [style.active]: createTimeOrder === 'ASC',
                      })}
                    />
                    <ArrowDownIcon
                      className={classnames(style.arrow, {
                        [style.active]: createTimeOrder === 'DESC',
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className={style.comments}>
                {!comments.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                {comments.map(comment => (
                  <PostComment
                    className={style.parentComment}
                    key={comment.commentDbId}
                    post={post!}
                    comment={comment}
                    commentType="parent"
                    parentCommentId={comment.commentId}
                    parentOriginCommentId={comment.originCommentId}
                    childDisplayCount={2}
                    onReplySuccess={() => {
                      Message.success(getIn18Text('HUIFUCHENGGONG11'));
                      handleChildCommentsUpdate(comment);
                    }}
                    onDetailClick={() => {
                      setCommentDetailVisible(true);
                      setDetailComment(comment);
                      handleChildCommentsUpdate(comment);
                    }}
                  />
                ))}
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
      <CommentDetailModal
        visible={commentDetailVisible}
        post={post}
        comment={detailComment}
        onReplySuccess={() => {
          Message.success(getIn18Text('HUIFUCHENGGONG11'));
          handleChildCommentsUpdate(detailComment!);
        }}
        onCancel={() => setCommentDetailVisible(false)}
      />
    </Drawer>
  );
};

export default PostDetailDrawer;
