import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Tree, Spin, Button, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { apiHolder as api, apis, MailApi, getIn18Text } from 'api';
import styles from './index.module.scss';
interface Props {
  mailId: string;
  memo?: string;
  visible: boolean;
  setVisible: React.Dispatch<boolean>;
  account?: string;
}

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const CommentModal: React.FC<Props> = props => {
  const { mailId, memo = '', visible: commentVisible, setVisible: setCommentVisible, account } = props;
  const titleWords = memo ? getIn18Text('XIUGAI') : getIn18Text('TIANJIA');
  const title = `${titleWords}${getIn18Text('BEIZHU')}`;
  const [commentVal, setCommentVal] = useState(memo);
  const onCommentCancel = e => {
    e.stopPropagation();
    setCommentVisible(false);
  };
  const handleCommentOk = e => {
    e.stopPropagation();
    if (!mailId) return;
    mailApi
      .doMarkMail(false, mailId, 'memo', false, true, { memo: commentVal }, account)
      .then(() => {
        message.success(`${getIn18Text('YICHENGGONG')}${titleWords}${getIn18Text('BEIZHU')}`);
        setCommentVisible(false);
      })
      .catch(() => {
        message.fail(getIn18Text('BEIZHUSHIBAI', { titleWords }));
      });
  };

  return (
    <Modal
      centered
      title={title}
      width={480}
      className={`${styles.readmailCommentModal} extheme`}
      visible={commentVisible}
      closeIcon={<CloseIcon className="dark-invert" />}
      onCancel={onCommentCancel}
      bodyStyle={{ overflow: 'auto' }}
      destroyOnClose={true}
      footer={[
        <Button key="cancel" onClick={onCommentCancel} className="local-import-btn">
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button key="confirm" type="primary" onClick={handleCommentOk} disabled={!commentVal.length} className="local-import-btn">
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
      <Input.TextArea
        showCount
        placeholder={getIn18Text('QINGSHURUBEIZHUNR')}
        value={commentVal}
        onClick={e => e.stopPropagation()}
        onChange={e => setCommentVal(e.target.value)}
        className="readmail-comment"
        maxLength={100}
      />
    </Modal>
  );
};

export default CommentModal;
