import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from 'antd';
import PreviewContent from './PreviewContent';
import style from './index.module.scss';
import { useAppSelector } from '@web-common/state/createStore';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';

const AttachmentPreview: React.FC = () => {
  const [modalWidth, serModalWidth] = useState(960);

  const isModalVisible = useAppSelector(state => state.attachmentReducer.attachmentsPreview.visible);

  useEffect(() => {
    const clientW = document.body.clientWidth;
    serModalWidth(clientW - 30);
  }, []);

  return useMemo(
    () => (
      <Modal
        visible={isModalVisible}
        className={`${style.modal}`}
        closable={false}
        centered
        footer={null}
        width={modalWidth}
        maskClosable={false}
        destroyOnClose
        closeIcon={<ModalCloseSmall />}
      >
        <PreviewContent hash="" type="attachment" attachmentsInfo={{}} />
      </Modal>
    ),
    [isModalVisible, modalWidth]
  );
};

export default AttachmentPreview;
