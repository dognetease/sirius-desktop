import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Tree, Spin, message, Button, Input } from 'antd';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { apiHolder as api, apis, MailApi, getIn18Text } from 'api';
import styles from './index.module.scss';
interface Props {
  visible: boolean;
  setVisible: React.Dispatch<boolean>;
  handleCommentOk: () => void;
  hiddenTxt: string;
}

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const HiddenTxtModal: React.FC<Props> = props => {
  const { visible: commentVisible, setVisible: setCommentVisible, handleCommentOk, hiddenTxt } = props;

  return (
    <Modal
      centered
      title="检测到邮件正文中存在部分被隐藏的内容，如需修改请重新编辑邮件内容。隐藏内容如下"
      width={480}
      className={styles.hiddenTxtModal}
      visible={commentVisible}
      onCancel={() => {
        setCommentVisible(false);
      }}
      closeIcon={<CloseIcon className="dark-invert" />}
      destroyOnClose={true}
      footer={[
        <Button
          key="cancel"
          onClick={e => {
            e.stopPropagation();
            setCommentVisible(false);
          }}
          className="local-import-btn"
        >
          重新编辑
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={e => {
            e.stopPropagation();
            setCommentVisible(false);
            handleCommentOk();
          }}
          className="local-import-btn"
        >
          继续发送
        </Button>,
      ]}
    >
      <div>{hiddenTxt}</div>
    </Modal>
  );
};

export default HiddenTxtModal;
