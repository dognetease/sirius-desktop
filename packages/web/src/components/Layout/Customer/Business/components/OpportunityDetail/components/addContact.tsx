import React, { useState, useEffect } from 'react';
import { ContactDetail } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import style from './addContact.module.scss';
import { getIn18Text } from 'api';
interface AddContactProps {
  visible: boolean;
  title?: React.ReactNode;
  list: ContactDetail[];
  disabledIds: string[];
  onOk: (contactId: string) => void;
  onCancel: () => void;
}
const { Option } = Select;
const AddContact: React.FC<AddContactProps> = props => {
  const { visible, list, disabledIds, onOk, onCancel } = props;
  const [value, setValue] = useState<string | undefined>(undefined);
  const handleOk = () => {
    if (!value) return Toast.error({ content: getIn18Text('QINGXUANZELIANXIREN') });
    return onOk(value);
  };
  useEffect(() => {
    setValue(undefined);
  }, [visible]);
  return (
    <Modal className={style.addContact} title={getIn18Text('XINZENGLIANXIREN')} visible={visible} width={472} onCancel={onCancel} onOk={handleOk}>
      <div className={style.text}>{getIn18Text('XUANZESHANGJIGUANLIANDEKEHULIANXIREN')}</div>
      <Select style={{ width: '100%' }} placeholder={getIn18Text('QINGXUANZELIANXIREN')} allowClear value={value} onChange={nextValue => setValue(nextValue as string)}>
        {list.map(item => (
          <Option key={item.contact_id} value={item.contact_id} disabled={disabledIds.includes(item.contact_id)}>
            {`${item.contact_name} (${item.email})`}
          </Option>
        ))}
      </Select>
    </Modal>
  );
};
AddContact.defaultProps = {};
export default AddContact;
