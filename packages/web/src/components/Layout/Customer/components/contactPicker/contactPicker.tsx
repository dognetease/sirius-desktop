import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { ContactBasic } from '@lxunit/bridge-types';

import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './contactPicker.module.scss';
import { getIn18Text } from 'api';

interface ContactPickerProps {
  visible: boolean;
  title?: React.ReactNode;
  data: ContactBasic[];
  onSubmit: (pickedIds: string[], pickedEmails: string[]) => void;
  onCancel: () => void;
  getContainer?: string | (() => HTMLElement) | HTMLElement;
}
const columns = [
  { title: getIn18Text('LIANXIREN'), dataIndex: 'contactName' },
  { title: getIn18Text('YOUXIANG'), dataIndex: 'contactEmail' },
];
const ContactPicker: React.FC<ContactPickerProps> = props => {
  const { visible, title, data, onSubmit, onCancel } = props;
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  useEffect(() => {
    setPickedIds([]);
  }, [visible, data]);
  const handleConfirm = () => {
    if (!pickedIds.length) {
      Toast.error({ content: getIn18Text('QINGXUANZELIANXIREN') });
    } else {
      const pickedEmails = data.filter(item => pickedIds.includes(item.contactId)).map(item => item.contactEmail);
      onSubmit(pickedIds, pickedEmails);
    }
  };
  return (
    <Modal className={style.contactPicker} getContainer={props.getContainer} title={title} visible={visible} width={476} onCancel={onCancel} onOk={handleConfirm}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="contactId"
        pagination={false}
        rowSelection={{
          fixed: true,
          selectedRowKeys: pickedIds,
          onChange: ids => setPickedIds(ids as string[]),
        }}
        scroll={{ x: 'max-content' }}
        onRow={record => ({
          onClick: () => {
            // eslint-disable-next-line camelcase
            const { contactId } = record;
            pickedIds.includes(contactId)
              ? // eslint-disable-next-line camelcase
                setPickedIds(pickedIds.filter(item => item !== contactId))
              : // eslint-disable-next-line camelcase
                setPickedIds([...pickedIds, contactId]);
          },
        })}
      />
    </Modal>
  );
};
ContactPicker.defaultProps = {
  // eslint-disable-next-line react/default-props-match-prop-types
  visible: false,
  title: getIn18Text('XUANZELIANXIRENYOUXIANG'),
  // eslint-disable-next-line react/default-props-match-prop-types
  data: [],
  // eslint-disable-next-line react/default-props-match-prop-types
  onSubmit: () => {},
  // eslint-disable-next-line react/default-props-match-prop-types
  onCancel: () => {},
};
export default ContactPicker;
