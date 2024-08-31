import React from 'react';
import { ReactComponent as ConfirmIconDelete } from '@/images/icons/edm/confirm-delete.svg';
import { ReactComponent as ConfirmIconSure } from '@/images/icons/edm/confirm.svg';
import SiriusModal from '../../../../../../../web-common/src/components/UI/Modal/SiriusModal';

// import { Modal } from 'antd';

interface ComsProps {
  title?: string | React.ReactNode;
  content?: string;
  makeSure: () => void;
  onCancel?: () => void;
  type?: string; // danger
  okText?: string;
  cancelText?: string;
}

const ShowConfirm = (props: ComsProps) => {
  const { title, makeSure, onCancel, type, content, okText, cancelText } = props;
  SiriusModal.confirm({
    title,
    icon: type === 'danger' ? <ConfirmIconDelete /> : <ConfirmIconSure />,
    okType: type === 'danger' ? 'danger' : 'primary',
    className: 'clientConfirm',
    centered: true,
    closable: true,
    content,
    okText,
    cancelText,
    onOk() {
      makeSure();
    },
    onCancel(e) {
      if (typeof e === 'function') {
        onCancel && onCancel();
        e();
      }
    },
  });
};

export default ShowConfirm;
