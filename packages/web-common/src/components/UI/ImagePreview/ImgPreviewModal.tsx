import React from 'react';
import { Modal } from 'antd';
import ImagePreview from './ImgPreviewContent';
import CloseIcon from '../Icons/svgs/CloseMailSvg';
import style from './imgPreview.module.scss';
import { ImgPreviewModalProps } from './type';

const ImgPreviewModal: React.FC<ImgPreviewModalProps> = props => (
  <Modal centered footer={null} className={style.modal} closeIcon={<CloseIcon />} {...props}>
    <ImagePreview {...props} />
  </Modal>
);

export default ImgPreviewModal;
