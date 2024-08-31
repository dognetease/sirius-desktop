import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import { getIn18Text } from 'api';
interface Props {
  closeModal: () => void;
  confirm: () => void;
  visible: boolean;
}
const AttachmentBlockModal: React.FC<Props> = ({ closeModal, visible, confirm }) => (
  <Modal
    wrapClassName="modal-dialog"
    onCancel={() => {
      closeModal();
    }}
    visible={visible}
    footer={null}
    closeIcon={<ModalCloseSmall />}
  >
    <div className="modal-content" style={{ marginTop: '10px' }}>
      <div className="modal-icon">
        <WarnIcon />
      </div>
      <div className="modal-text">
        <div className="title">{getIn18Text('FUJIANWEIWANCHENG')}</div>
        <div className="btns">
          <div />
          <div>
            <Button
              className="cancel"
              onClick={() => {
                closeModal();
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button
              className="save"
              onClick={() => {
                confirm();
              }}
            >
              {getIn18Text('BAOCUN')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
);
export default AttachmentBlockModal;
