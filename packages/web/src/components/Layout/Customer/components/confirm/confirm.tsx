import React from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/warning.svg';
import style from './confirm.module.scss';
import { getIn18Text } from 'api';
interface ComsProps {
  title?: string;
  content?: string;
}
const Confirm = (props: ComsProps) => {
  Modal.confirm({
    className: 'clientConfirm',
    title: props.title,
    icon: <WarningIcon />,
    content: props.content,
    cancelText: '',
    okText: getIn18Text('ZHIDAOLE'),
    centered: true,
    onOk() {
      console.log('OK');
    },
  });
};
export default Confirm;
