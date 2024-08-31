import { SnsMarketingPlatform, getIn18Text } from 'api';
import * as React from 'react';
import { useState, useRef } from 'react';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  SnsMarketingApi,
  SnsMarketingPost,
  SnsMarketingMedia,
  SnsMarketingMediaType,
  SnsPostParentComment,
  SnsPostChildComment,
  SnsPostCommentType,
} from 'api';
import Avatar from './Avatar';
import MediaList from './MediaList';
import { ReactComponent as SendIcon } from '@web-sns-marketing/images/comment-send.svg';
import { ReactComponent as LoadingIcon } from '@web-sns-marketing/images/loading.svg';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import style from './PostCommentEditor.module.scss';

const { TextArea } = Input;

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

interface PostCommentEditorProps {
  className?: string;
  post: SnsMarketingPost;
  comment: SnsPostParentComment | SnsPostChildComment;
  commentType: SnsPostCommentType;
  parentCommentId: string;
  parentOriginCommentId: string;
  onReplySuccess: (commentType: SnsPostCommentType) => void;
}

const PostCommentEditor: React.FC<PostCommentEditorProps> = props => {
  const { className, post, comment, commentType, parentCommentId, parentOriginCommentId, onReplySuccess } = props;

  const [sending, setSending] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [mediaList, setMediaList] = useState<SnsMarketingMedia[]>([]);
  const sendable = !!content.length;
  const textAreaRef = useRef<TextAreaRef | null>(null);

  const handleCommentSend = () => {
    const mediaType = Array.isArray(mediaList) && mediaList.length ? SnsMarketingMediaType.IMAGE : undefined;

    setSending(true);

    snsMarketingApi
      .sendSnsPostComment({
        postId: post.postId,
        postDbId: post.postDbId,
        accountId: post.accountId,
        accountType: post.accountType,
        authorizeType: post.authorizeType,
        platform: post.platform,
        commentId: parentCommentId,
        originCommentId: parentOriginCommentId,
        content,
        mediaList,
        mediaType,
      })
      .then(() => {
        onReplySuccess(commentType);
      })
      .finally(() => {
        setSending(false);
      });
  };

  return (
    <div className={classnames(style.postCommentEditor, className)}>
      <Avatar className={style.avatar} size={28} platform={post.platform} avatar={post.publishedAvatar} />
      <div className={style.body}>
        <TextArea
          className={style.textarea}
          ref={textAreaRef}
          value={content}
          bordered={false}
          autoSize
          autoFocus
          placeholder={getIn18Text('QINGSHURUTIEZIHUIFU')}
          onChange={e => setContent(e.target.value)}
        />
        <div className={style.options} onClick={() => textAreaRef.current?.focus()}>
          {post.platform !== SnsMarketingPlatform.INSTAGRAM && (
            <MediaList className={style.mediaList} mediaList={mediaList} maxMediaCount={1} onChange={setMediaList} itemGap={8} itemSize={38} deletable uploadable />
          )}
          {sending ? (
            <LoadingIcon className={style.sending} />
          ) : (
            <SendIcon
              className={classnames(style.send, {
                [style.disabled]: !sendable,
              })}
              onClick={() => sendable && handleCommentSend()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCommentEditor;
