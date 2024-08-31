import React, { useState, useEffect } from 'react';
import { ICustomerContactData } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ContactPicker from '../contactPicker';
import style from './contactPickerModal.module.scss';
import { getIn18Text } from 'api';
interface ContactPickerModalProps {
  visible?: boolean;
  title?: React.ReactNode;
  adding?: boolean;
  okText?: string;
  cancelText?: string;
  onOk?: (contacts: ICustomerContactData[]) => void;
  onCancel?: () => void;
}
const ContactPickerModal: React.FC<ContactPickerModalProps> = props => {
  const { visible, title, adding, okText, cancelText, onOk, onCancel } = props;
  const [pickedContacts, setPickedContacts] = useState<ICustomerContactData[]>([]);
  useEffect(() => {
    !visible && setPickedContacts([]);
  }, [visible]);
  return (
    <Modal
      className={style.contactPickerModal}
      title={title}
      visible={visible}
      width={992}
      onOk={() => onOk && onOk(pickedContacts)}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        disabled: !pickedContacts.length,
        loading: adding,
      }}
    >
      <ContactPicker pickedContacts={pickedContacts} onPickedChange={setPickedContacts} />
    </Modal>
  );
};
ContactPickerModal.defaultProps = {
  title: getIn18Text('TIANJIAKEHU'),
  okText: getIn18Text('BAOCUN'),
  cancelText: getIn18Text('QUXIAO'),
};
export default ContactPickerModal;
