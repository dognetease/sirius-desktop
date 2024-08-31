import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import { Modal, Checkbox } from 'antd';
import './index.scss';
interface Props {
  visible: boolean;
  onClose(isNotice: boolean, isSend: boolean): void;
}
const NoticeModal: React.FC<Props> = ({ visible, onClose }) => {
  const [isNotice, setIsNotice] = useState(false);
  const onChange = e => {
    setIsNotice(e.target.checked);
  };
  return (
    <>
      <Modal
        closable={false}
        visible={visible}
        width={400}
        maskClosable={false}
        wrapClassName="notice-modal"
        onOk={() => {
          onClose(isNotice, true);
        }}
        onCancel={() => {
          onClose(isNotice, false);
        }}
        okText={getIn18Text('XUYAO')}
        cancelText={getIn18Text('BUXUYAO')}
      >
        <div className="send-info">
          <div className="send-info-icon"></div>
          <div className="send-info-text">{getIn18Text('YIDIANZAN\uFF0CJIAN')}</div>
        </div>
        <div className="send-check">
          <Checkbox onChange={onChange}>{getIn18Text('JIZHUXUANXIANG')}</Checkbox>
        </div>
      </Modal>
    </>
  );
};
export default NoticeModal;
