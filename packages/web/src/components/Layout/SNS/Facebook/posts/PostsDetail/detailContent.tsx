import { getIn18Text } from 'api';
import React, { useState } from 'react';
import { Spin } from 'antd';
import style from './detailContent.module.scss';
import classnames, { Argument as classnamesType } from 'classnames';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as RightOutline } from '@/images/icons/facebook/RightOutlined.svg';
import { PostsEditor } from './../PostsEditor';
import MoreComments from './moreComments';
import { Empty } from './../components/empty';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { PostEditorSuccess } from './../type';
import maskSrc from '@/images/icons/facebook/eye.png';
import { apiHolder, apis, FacebookApi, FbCommentListRes, PostInfo, CommentItem as ItemProps, ReplyPostCommentsReq, FacebookMessageType } from 'api';
import { getTransText } from '@/components/util/translate';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

interface PostsContentProps {
  data: FbCommentListRes;
  loading: boolean;
  className?: classnamesType;
  onSuccess: (data: PostEditorSuccess) => void;
  onFailure: () => void;
  sortChange: (sort: string) => void;
}
interface UserInfoProps {
  postInfo: PostInfo;
}

const PostsContent = (props: PostsContentProps) => {
  const { data, loading, onSuccess, onFailure, sortChange } = props;
  return (
    <>
      <div className={style.userWrap}>
        <div className={style.icon}>
          <AvatarTag
            innerStyle={{ border: 'none' }}
            size={36}
            user={{
              name: data.postInfo.publishedName,
              avatar: data.postInfo.publishedAvatar,
            }}
          />
        </div>
        <div className={style.content}>
          <div className={style.title}>{data.postInfo.publishedName}</div>
          <div className={style.time}>{data.postInfo.createTime}</div>
        </div>
      </div>
      <Content postInfo={data.postInfo}></Content>
      <CommentArea sortChange={sortChange} postsData={data} loading={loading} onSuccess={onSuccess} onFailure={onFailure}></CommentArea>
    </>
  );
};

const Content = (props: UserInfoProps) => {
  const { postInfo } = props;
  const imgPreview = (urls: string[], index: number) => {
    let data = urls.map(url => ({
      downloadUrl: url,
      previewUrl: url,
      OriginUrl: url,
      size: 480,
    }));
    ImgPreview.preview({
      data,
      startIndex: index,
    });
  };

  return (
    <div className={style.showContent}>
      <div className={style.title}>{postInfo.postContent}</div>
      <div className={style.imgWrap}>
        {postInfo.mediaType === FacebookMessageType.IMAGE ? (
          (postInfo.mediaUrl || []).slice(0, 6).map((url, index) => (
            <div className={style.imgBox} onClick={() => imgPreview(postInfo.mediaUrl, index)} key={index}>
              <img className={style.img} src={url} alt={getIn18Text('TUPIAN')} />
              {postInfo.mediaUrl.length > 6 && index === 5 ? (
                <div className={style.mask}>{`+${postInfo.mediaUrl.length - 6}`}</div>
              ) : (
                <div className={style.maskHover}>
                  <img src={maskSrc} />
                </div>
              )}
            </div>
          ))
        ) : postInfo.mediaType === FacebookMessageType.TEXT ? (
          ''
        ) : (
          <div>{`[${getTransText('BUZHICHIWENJIANLEIXING')}]`}</div>
        )}
      </div>
    </div>
  );
};

interface CommentAreaProps {
  postsData: FbCommentListRes;
  loading: boolean;
  onSuccess: (data: PostEditorSuccess) => void;
  onFailure: () => void;
  sortChange: (sort: string) => void;
  timeChange?: (time: string) => void;
}
const CommentArea = (props: CommentAreaProps) => {
  const { postsData, loading, onSuccess, onFailure, sortChange } = props;
  const [sortStatus, setSortStauts] = useState<string>('');

  const changeStatus = (status?: string) => {
    let currentStatus = '';
    if (status) {
      currentStatus = status === sortStatus ? '' : status;
    } else {
      currentStatus = sortStatus === '' ? 'asc' : sortStatus === 'asc' ? 'desc' : '';
    }
    setSortStauts(currentStatus);
    sortChange(currentStatus ? `createTime,${currentStatus}` : '');
    // replyTime,desc
  };
  console.log('xxxxcardData', postsData);

  const [visible, setVisable] = useState<boolean>(false);
  const [commentId, setCommentId] = useState<string>('');
  const [commentCount, setCommentCount] = useState<number>(0);
  const [currentCardData, setCurrentCardData] = useState<ItemProps>();

  return (
    <div className={style.commentArea}>
      <div className={style.header}>
        <div className={style.commentNums}>{`共${postsData?.postInfo?.commentCount || 0}条评论`}</div>
        <div className={style.timeSort} onClick={() => changeStatus()}>
          <div className={style.time}>{'评论时间'}</div>
          <div className={style.sort}>
            <span onClick={() => changeStatus('asc')} className={classnames(style.sortUp, sortStatus === 'asc' ? style.sortUpActive : '')}></span>
            <span onClick={() => changeStatus('desc')} className={classnames(style.sortDown, sortStatus === 'desc' ? style.sortDownActive : '')}></span>
          </div>
        </div>
      </div>
      {!postsData.results?.length && (
        <div className={style.postEmpty}>
          <Empty classImageName={style.empty}>
            <div className={style.emptyText}>
              <p className={style.title}>{'暂无评论'}</p>
            </div>
          </Empty>
        </div>
      )}
      {(postsData.results || []).map((item, key) => (
        <div key={key} className={classnames(style.commentBox, postsData.results.length - 1 === key ? style.commentBoxLast : '')}>
          <div className={style.comment}>
            <CommentCard
              key={key}
              cardData={item}
              postInfo={postsData.postInfo}
              childCommentCount={item.childCommentCount}
              onSuccess={onSuccess}
              onFailure={onFailure}
            ></CommentCard>
            {(item.childComments || []).slice(0, 3).map((childItem, childKey) => (
              <CommentCard
                key={childKey}
                cardData={childItem}
                postInfo={postsData.postInfo}
                childCommentCount={item.childCommentCount}
                onSuccess={onSuccess}
                onFailure={onFailure}
                className={style.commentCardChild}
              ></CommentCard>
            ))}
            {item.childCommentCount > 3 && (
              <div className={style.nums}>
                <span
                  className={style.total}
                  onClick={() => {
                    setCurrentCardData(item);
                    setCommentId(item.commentId);
                    setCommentCount(item.childCommentCount);
                    setVisable(true);
                    facebookTracker.trackPostsDetail('more');
                  }}
                >
                  {`${getTransText('GONG')}${item.childCommentCount}${getTransText('HUIFU')}`}
                </span>
                <RightOutline />
              </div>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin spinning={loading}></Spin>
        </div>
      )}
      {visible && (
        <MoreComments
          cardData={currentCardData}
          postInfo={postsData.postInfo}
          commentId={commentId}
          titleNums={commentCount}
          visible={visible}
          onCancel={() => setVisable(false)}
        />
      )}
    </div>
  );
};

const CommentCard = ({
  cardData,
  postInfo,
  className,
  onSuccess,
  onFailure,
  childCommentCount,
  bgWidth,
}: {
  cardData: ItemProps;
  postInfo: PostInfo;
  className?: string;
  onSuccess: (data: PostEditorSuccess) => void;
  childCommentCount?: number;
  onFailure?: () => void;
  bgWidth?: boolean;
}) => {
  console.log('xxxxcardData', cardData);
  const onSave = (params: ReplyPostCommentsReq): any => {
    const config = { params: { ...params } };
    return facebookApi.replyPostComments(config);
  };

  const renderContent = () => {
    if (cardData.mediaType === 0) return;
    if (cardData.mediaType === FacebookMessageType.IMAGE) {
      return (
        <div className={style.commmentMediaType}>
          {(cardData.mediaUrl || []).map((imgUrl, index) => (
            <img key={index} className={style.img} src={imgUrl} alt={getIn18Text('TUPIAN')} />
          ))}
        </div>
      );
    }
    return cardData.mediaType === FacebookMessageType.TEXT ? '' : <div>{`[${getTransText('BUZHICHIWENJIANLEIXING')}]`}</div>;
  };

  const [isReply, setIsReply] = useState<boolean>(false);
  return (
    <>
      <div className={classnames(style.commentCard, className)}>
        <div className={style.icon}>
          <AvatarTag
            innerStyle={{ border: 'none' }}
            size={28}
            user={{
              name: cardData.commentator,
              avatar: cardData.commentatorAvatar,
            }}
          />
        </div>
        <div className={classnames(style.contentBox, bgWidth ? style.contentBoxWidth : '')}>
          <div className={style.content}>
            <div className={style.title}>{cardData.commentator}</div>
            <div className={style.text}>{cardData.commentContent}</div>
            {renderContent()}
          </div>
          <div className={style.contentFooter}>
            <span className={style.time}>{cardData.commentTime}</span>
            <span
              className={style.reply}
              onClick={() => {
                setIsReply(!isReply);
                !isReply && facebookTracker.trackPostsDetail('reply');
              }}
            >
              {isReply ? getTransText('QUXIAOHUIFU') : getTransText('HUIFU')}
            </span>
          </div>
        </div>
      </div>
      {isReply && (
        <div className={style.editor}>
          <div className={style.icon}>
            <AvatarTag
              innerStyle={{ border: 'none' }}
              size={28}
              user={{
                name: postInfo.publishedName,
                avatar: postInfo.publishedAvatar,
              }}
            />
          </div>
          <PostsEditor
            commentId={cardData.parentId ? cardData.parentId : cardData.commentId}
            childCommentCount={childCommentCount}
            onSave={onSave}
            placeholder={`回复@${cardData.commentator}`}
            onSuccess={data => {
              onSuccess(data);
              setIsReply(false);
            }}
            onFailure={onFailure}
          />
        </div>
      )}
    </>
  );
};

export { PostsContent, CommentCard };
