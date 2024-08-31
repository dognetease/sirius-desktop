import React, { useEffect, useState, useRef } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { CommentCard } from './detailContent';
import style from './moreComments.module.scss';
import { apiHolder, apis, FacebookApi, CommentItem as ItemProps, ChildCommentListReq, ChildCommentItem, PostInfo } from 'api';
const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  titleNums: number;
  commentId: string;
  postInfo: PostInfo;
  cardData?: ItemProps;
  getContainer?: false | HTMLElement | (() => HTMLElement);
}

const ChangeStatusModal: React.FC<ComsProps> = ({ visible, onCancel, titleNums, cardData, commentId, postInfo, getContainer = false }) => {
  const [commentListParams, setCommentListParams] = useState<ChildCommentListReq>({
    size: 20,
    page: 0,
    commentId: '',
  });
  const [total, setTotal] = useState<number>(0);
  const [childCommentList, setChildCommentList] = useState<ChildCommentItem[]>([]);
  const onCancelCallBack = () => {
    onCancel();
  };
  const getCommentList = () => {
    if (!commentListParams.commentId) return;
    let params = {
      ...commentListParams,
      size: total + 1,
    };
    facebookApi.getFbChildCommmetList(params).then(res => {
      setTotal(res.total);
      setChildCommentList(res.results);
    });
  };

  const onSuccess = () => {
    getCommentList();
  };

  useEffect(() => {
    if (visible && commentId && titleNums) {
      setTotal(titleNums);
      setCommentListParams({
        size: titleNums,
        page: 0,
        commentId,
      });
    }
  }, [visible, commentId, titleNums]);

  useEffect(() => {
    getCommentList();
  }, [commentListParams]);

  return (
    <Modal
      title={`共${total}条回复`}
      getContainer={getContainer}
      bodyStyle={{ maxHeight: '544px', overflow: 'hidden scroll' }}
      wrapClassName={style.postMoreModalWrap}
      width={620}
      footer={null}
      visible={visible}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        {cardData && <CommentCard cardData={cardData} postInfo={postInfo} onSuccess={onSuccess} bgWidth={true}></CommentCard>}
        {childCommentList.map((item, key) => (
          <CommentCard key={key} cardData={item} postInfo={postInfo} onSuccess={onSuccess} className={style.commentCardChild} bgWidth={true}></CommentCard>
        ))}
      </div>
    </Modal>
  );
};
export default ChangeStatusModal;
