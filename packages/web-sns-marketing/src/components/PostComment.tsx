import { getIn18Text } from 'api';
import * as React from 'react';
import { useState } from 'react';
import classnames from 'classnames';
import { SnsMarketingPost, SnsMarketingMediaType, SnsPostCommentType, SnsPostParentComment, SnsPostChildComment, SnsPlatformName } from 'api';
import Avatar from './Avatar';
import MediaList from './MediaList';
import PostCommentEditor from './PostCommentEditor';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { ReactComponent as MoreCommentIcon } from '@web-sns-marketing/images/more-comment.svg';
import style from './PostComment.module.scss';

interface PostCommentProps {
  className?: string;
  post: SnsMarketingPost;
  comment: SnsPostParentComment | SnsPostChildComment;
  commentType: SnsPostCommentType;
  parentCommentId: string;
  parentOriginCommentId: string;
  childDisplayCount?: number;
  onReplySuccess: () => void;
  onDetailClick?: () => void;
}

const PostComment: React.FC<PostCommentProps> = props => {
  const { className, post, comment, commentType, parentCommentId, parentOriginCommentId, childDisplayCount = Infinity, onReplySuccess, onDetailClick } = props;

  const [replying, setReplying] = useState<boolean>(false);

  return (
    <div
      className={classnames(style.postComment, className, {
        [style.childComment]: commentType === 'child',
      })}
    >
      <Avatar className={style.avatar} size={28} platform={post.platform} avatar={comment.commentatorAvatar} />
      <div className={style.body}>
        <div className={style.contentWrapper}>
          <div className={style.name}>{comment.commentator}</div>
          <div className={style.content}>{comment.commentContent}</div>
          {!!comment.mediaList?.length &&
            (comment.mediaType === SnsMarketingMediaType.IMAGE ? (
              <MediaList className={style.mediaList} mediaList={comment.mediaList} itemGap={8} itemSize={38} />
            ) : (
              `[不支持的文件类型 请前往 ${SnsPlatformName[post.platform]} 查看]`
            ))}
        </div>
        <div className={style.options}>
          <div className={style.createTime}>{commonDateUnitFormat(+comment.createTime, 'precise')}</div>
          <div className={style.replyTrigger} onClick={() => setReplying(!replying)}>
            {!replying ? getIn18Text('HUIFU') : getIn18Text('QUXIAOHUIFU')}
          </div>
        </div>
        {replying && (
          <PostCommentEditor
            className={style.postCommentEditor}
            post={post}
            comment={comment}
            commentType={commentType}
            parentCommentId={parentCommentId}
            parentOriginCommentId={parentOriginCommentId}
            onReplySuccess={() => {
              onReplySuccess();
              setReplying(false);
            }}
          />
        )}
        {commentType === 'parent' && !!(comment as SnsPostParentComment).childCommentCount && (
          <>
            <div className={style.childComments}>
              {(comment as SnsPostParentComment).childComments.slice(0, childDisplayCount).map(item => (
                <PostComment
                  className={style.childComment}
                  post={post}
                  comment={item}
                  commentType="child"
                  parentCommentId={parentCommentId}
                  parentOriginCommentId={parentOriginCommentId}
                  onReplySuccess={onReplySuccess}
                />
              ))}
            </div>
            {(comment as SnsPostParentComment).childCommentCount > childDisplayCount && (
              <div className={style.commentDetailEntry} onClick={onDetailClick}>
                <span>
                  {getIn18Text('GONG')}
                  {(comment as SnsPostParentComment).childCommentCount}
                  {getIn18Text('TIAOHUIFU')}
                </span>
                <MoreCommentIcon />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PostComment;
