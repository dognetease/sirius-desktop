import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Modal } from 'antd';
// import { MailBoxEntryContactInfoModel } from '@/gen/api';
import { MailBoxEntryContactInfoModel } from 'api';
import classnames from 'classnames';

import styles from './editWindow.module.scss';

export interface LoginWindowProps {
  isModalVisible?: boolean;
  contact?: MailBoxEntryContactInfoModel | undefined;
  onCancel?: Function;
  onConfirm: Function;
}

const EditWindow: React.FC<LoginWindowProps> = ({ isModalVisible, contact, onCancel = () => {}, onConfirm }) => {
  const [value, setValue] = useState<string>('');

  const refInput = useRef(null);

  useEffect(() => {
    if (isModalVisible) {
      setValue(contact?.contactItem?.contactItemVal || '');
      setTimeout(() => {
        (refInput?.current as any)?.focus();
      }, 500);
    }
  }, [contact, isModalVisible]);

  const onValueChange = e => {
    setValue(e.target.value);
  };

  const cancelEdit = () => {
    onCancel();
  };

  const confirmEdit = () => {
    if (value === contact?.contactItem?.contactItemVal) {
      onCancel();
      return;
    }
    const editInfo = {
      origin: contact,
      value,
    };
    onConfirm && onConfirm(editInfo);
  };

  return (
    <div>
      <Modal
        wrapClassName="edit-window"
        visible={isModalVisible}
        centered
        closable={false}
        width="360px"
        onCancel={cancelEdit}
        footer={[
          <Button key="cancel" onClick={cancelEdit}>
            退出
          </Button>,
          <Button key="confirm" type="primary" disabled={!value} onClick={confirmEdit}>
            确定
          </Button>,
        ]}
      >
        <div>
          <Input allowClear ref={refInput} value={value} onChange={onValueChange} onPressEnter={confirmEdit} />
        </div>
      </Modal>
    </div>
  );
};

export default EditWindow;
