import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { apiHolder as api, apis, MailApi, getIn18Text } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './comment.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { ReactComponent as ConfirmIconDelete } from '@/images/icons/edm/confirm-delete.svg';
import CommentModal from '../../../../common/components/comment/CommentModal';

interface Props {
  mailId: string;
  memo: string;
  account?: string;
}

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const Comment: React.FC<Props> = props => {
  const { mailId, memo = '', account } = props;
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  const delComment = e => {
    e.stopPropagation();
    SiriusModal.confirm({
      title: (
        <div className={styles.commentDelModal}>
          <ConfirmIconDelete />
          <span className={styles.commentDelDesc}>确定要删除该邮件的备注吗？</span>
        </div>
      ),
      icon: null,
      onOk() {
        mailApi
          .doMarkMail(false, mailId, 'memo', false, true, { memo: '' }, account)
          .then(() => {
            message.success(`已成功删除备注`);
          })
          .catch(() => {
            message.fail(`删除备注失败`);
          });
      },
      onCancel(e) {},
    });
  };

  return (
    <>
      <div className={classnames(styles.comment)} data-test-id="mail-comment-panel">
        <div className={classnames(styles.desc)}>
          <span className={classnames(styles.icon)}>
            <IconCard type="mailComment" />
          </span>
          <span className={classnames(styles.memo)} data-test-id="mail-comment-panel-content">
            {memo}
          </span>
        </div>
        <div className={classnames(styles.operate)}>
          <span
            className={classnames(styles.btn, styles.edit)}
            onClick={e => {
              e.stopPropagation();
              setCommentModalVisible(true);
            }}
            data-test-id="mail-comment-panel-edit"
          >
            编辑
          </span>
          <span className={classnames(styles.btn, styles.del)} onClick={delComment} data-test-id="mail-comment-panel-delete">
            删除
          </span>
        </div>
      </div>
      {commentModalVisible && <CommentModal visible={commentModalVisible} setVisible={setCommentModalVisible} memo={memo} mailId={mailId} account={account} />}
    </>
  );
};

export default Comment;
