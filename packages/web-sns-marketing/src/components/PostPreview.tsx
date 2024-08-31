import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, EdmSendBoxApi, SnsMarketingApi, SnsMarketingPost, SnsPostStatus, SnsMarketingMediaType, SnsPlatformName } from 'api';
import moment from 'moment';
import { Skeleton } from 'antd';
import { EditorState, ContentState } from 'draft-js';
import Editor from '@draft-js-plugins/editor';
import createLinkifyPlugin from '@draft-js-plugins/linkify';
import createHashtagPlugin from '@draft-js-plugins/hashtag';
import Avatar from './Avatar';
import PostPreviewImage from './PostPreviewImage';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { ReactComponent as PostEditIcon } from '@web-sns-marketing/images/post-edit.svg';
import { ReactComponent as LoadingIcon } from '@web-sns-marketing/images/loading.svg';
import { ReactComponent as PostErrorIcon } from '@web-sns-marketing/images/post-error.svg';
import { ReactComponent as GlobalIcon } from '@web-sns-marketing/images/global.svg';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import style from './PostPreview.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

const linkifyPlugin = createLinkifyPlugin({ target: '_blank' });
const hashtagPlugin = createHashtagPlugin({ theme: { hashtag: style.hashtag } });

interface PostPreviewProps {
  className?: string;
  postDbId?: string;
  post?: SnsMarketingPost | null;
  editable?: boolean;
  translatable?: boolean;
  translateAppear?: 'always' | 'hover';
  showSendTime?: boolean;
  contentGenerating?: boolean;
  mode?: 'pc' | 'mobile';
  onEdit?: (postDbId: string) => void;
  onTranslate?: (checked: boolean, contentHTML: string) => void;
}

const SkeletonParagraph: React.FC<{ mode: 'pc' | 'mobile' }> = ({ mode }) => {
  const paragraphProps = mode === 'pc' ? { rows: 2, width: ['100%', '65.1%'] } : { rows: 6, width: ['20.83%', '100%', '100%', '100%', '100%', '62.5%'] };

  return <Skeleton className={style.skeletonParagraph} title={false} active paragraph={paragraphProps} />;
};

export const translateHandler = (contentHTML: string) => {
  const req = {
    htmlList: [new DOMParser().parseFromString(contentHTML, 'text/html').documentElement.outerHTML],
    from: 'auto',
    to: 'zh-CHS',
  };
  return edmApi.doTranslateGPTAiContent(req, Date.now()).then(res => {
    if (res.success) {
      if (res.data.translations[0]) {
        return new DOMParser().parseFromString(res.data.translations[0], 'text/html').documentElement.innerHTML;
      } else {
        return Promise.reject(new Error('翻译出错'));
      }
    } else {
      return Promise.reject(new Error(res.message));
    }
  });
};

const PostPreview: React.FC<PostPreviewProps> = props => {
  const {
    className,
    postDbId,
    post: postFromProps,
    editable,
    translatable,
    translateAppear = 'hover',
    showSendTime = true,
    contentGenerating,
    mode = 'pc',
    onEdit,
    onTranslate,
  } = props;

  const [fetching, setFetching] = useState<boolean>(false);
  const [fetchedPost, setFetchedPost] = useState<SnsMarketingPost | null>(null);

  const editorRef = useRef<Editor>(null);
  const translationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (postDbId) {
      setFetching(true);

      snsMarketingApi
        .getSnsPost({ postDbId })
        .then(nextPost => {
          setFetchedPost(nextPost);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [postDbId]);

  const post = useMemo(() => {
    if (postDbId) return fetchedPost;

    return postFromProps || null;
  }, [postFromProps, postDbId, fetchedPost]);

  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createEmpty());

  const handleEditorChange = (nextEditorState: EditorState) => {
    setEditorState(nextEditorState);
  };

  const handleTranslate = (checked: boolean) => {
    if (post && onTranslate) {
      const contentHTML = editorRef.current?.editor?.editor?.outerHTML || '';

      if (!contentHTML) return;

      onTranslate(checked, contentHTML);

      if (checked) {
        if (post.translateResult) {
          setTimeout(() => {
            translationRef.current?.scrollIntoView({ block: 'center' });
          });
        }
      }
    }
  };

  useEffect(() => {
    if (post) {
      setTimeout(() => {
        setEditorState(EditorState.createWithContent(ContentState.createFromText(post.content || '')));
      });

      if (post.translating) {
        translationRef.current?.scrollIntoView({ block: 'center' });
      }

      if (post.translateChecked && !post.translateResult && !post.translating) {
        setTimeout(() => {
          handleTranslate(true);
        });
      }
    }
  }, [post]);

  if (fetching)
    return (
      <div className={classnames(style.postPreview, style.postPreviewFetching, className)}>
        <LoadingIcon className={style.fetchingIcon} />
        <div className={style.fetchingTip}>{getIn18Text('JIAZAIZHONG..')}</div>
      </div>
    );

  if (!post) return null;

  // commonDateUnitFormat 不会处理未来时间, 用 moment 格式化兜底
  const sendTimestemp = +post.createTime || +post.planSendTime || Date.now();
  const sendTime = commonDateUnitFormat(sendTimestemp, 'precise') || moment(sendTimestemp).format('MM-DD HH:mm');

  return (
    <div
      className={classnames(className, style.postPreview, style[mode], {
        [style.translateAlways]: translateAppear === 'always',
      })}
    >
      <div className={style.header}>
        <Avatar className={style.accountAvatar} size={48} platform={post.platform} avatar={post.publishedAvatar} />
        <div className={style.accountNameWrapper}>
          <div className={style.accountName}>{post.publishedName}</div>
          {showSendTime && (
            <div className={style.sendTimeWrapper}>
              <div className={style.sendTime}>{sendTime}</div>
              <div className={style.dot} />
              <GlobalIcon className={style.icon} />
            </div>
          )}
        </div>
        {translatable && post.content && !contentGenerating && (
          <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
            <div className={style.translate} onClick={() => handleTranslate(!post.translateChecked)}>
              <div className={classnames(style.language, { [style.active]: !post.translateChecked })}>{getIn18Text('WEN')}</div>
              <div className={classnames(style.language, { [style.active]: post.translateChecked })}>{getIn18Text('YIv16')}</div>
            </div>
          </PrivilegeCheck>
        )}
        {editable && post.content && !contentGenerating && (
          <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
            <div
              className={style.edit}
              onClick={() => {
                if (onEdit && post.postDbId) {
                  onEdit(post.postDbId);
                }
              }}
            >
              <PostEditIcon className={style.editIcon} />
              <span>{getIn18Text('BIANJI')}</span>
            </div>
          </PrivilegeCheck>
        )}
      </div>
      {post.postStatus === SnsPostStatus.GENERATING && (
        <div className={style.skeleton}>
          <SkeletonParagraph mode={mode} />
          <Skeleton.Image className={classnames('ant-skeleton-active', style.skeletonImage)} />
        </div>
      )}
      {post.postStatus === SnsPostStatus.FAILED_GENERATE && (
        <div className={style.generateFailed}>
          <PostErrorIcon className={style.icon} />
          <div className={style.reason}>{post.failedReason ? `由于${post.failedReason}原因，内容生成失败，请重新生成` : getIn18Text('NEIRONGSHENGCHENGSHIBAI，')}</div>
        </div>
      )}
      {post.postStatus !== SnsPostStatus.GENERATING && post.postStatus !== SnsPostStatus.FAILED_GENERATE && (
        <div className={style.body}>
          {contentGenerating ? (
            <SkeletonParagraph mode={mode} />
          ) : (
            <div className={style.contentWrapper}>
              <div
                className={classnames(style.content, {
                  [style.opacity]: post.translating,
                })}
              >
                <Editor ref={editorRef} readOnly plugins={[linkifyPlugin, hashtagPlugin]} editorState={editorState} onChange={handleEditorChange} />
              </div>
              <div ref={translationRef} />
              {post.translating && (
                <div className={style.translating}>
                  <LoadingIcon className={style.translatingIcon} />
                  <div className={style.translatingTip}>{getIn18Text('ZHENGZAIFANYI...')}</div>
                </div>
              )}
              {post.translateChecked && post.translateResult && (
                <div className={style.translateResult}>
                  <span className={style.label}>
                    <span className={style.labelText}>{getIn18Text('FANYI')}</span>
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: post.translateResult }} />
                </div>
              )}
            </div>
          )}
          {!!post.mediaList?.length && (
            <div className={style.mediaListWrapper}>
              {post.mediaType === SnsMarketingMediaType.IMAGE ? (
                <PostPreviewImage mode={mode} list={post.mediaList} />
              ) : post.mediaType === SnsMarketingMediaType.VIDEO ? (
                <PostPreviewImage mode={mode} list={post.mediaList} mediaType={SnsMarketingMediaType.VIDEO} />
              ) : (
                `[不支持的文件类型 请前往 ${SnsPlatformName[post.platform]} 查看]`
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostPreview;
