import React from 'react';
import { SnsMarketingPost, SnsPostParentComment } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import PostComment from './PostComment';
import style from './CommentDetailModal.module.scss';

interface CommentDetailModalProps {
  visible?: boolean;
  post: SnsMarketingPost | null;
  comment: SnsPostParentComment | null;
  onReplySuccess: () => void;
  onCancel?: () => void;
}

const CommentDetailModal: React.FC<CommentDetailModalProps> = props => {
  const { visible, post, comment, onReplySuccess, onCancel } = props;

  let title: null | string = null;
  let postComment: React.ReactElement | null = null;

  if (post && comment) {
    title = `共 ${comment.childCommentCount} 条回复`;
    postComment = (
      <PostComment
        post={post!}
        comment={comment}
        commentType="parent"
        parentCommentId={comment.commentId}
        parentOriginCommentId={comment.originCommentId}
        onReplySuccess={onReplySuccess}
      />
    );
  }

  return (
    <Modal className={style.commentDetailModal} visible={visible} title={title} width={620} footer={null} onCancel={onCancel}>
      {postComment}
    </Modal>
  );
};

export default CommentDetailModal;
