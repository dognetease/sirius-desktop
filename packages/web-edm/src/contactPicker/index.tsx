import React, { useState } from 'react';
import { ICustomerContactData } from 'api';
import { Tabs } from 'antd';
import RecycleBin from '@web-common/components/UI/Icons/svgs/disk/RecycleBin';
import Customer from './customer';
import ManualInput from './manualInput';
import ContactItem from './contactItem';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const { TabPane } = Tabs;
interface ContactPickerProps {
  pickedContacts: ICustomerContactData[];
  onPickedChange: (contacts: ICustomerContactData[]) => void;
}
const ContactPicker: React.FC<ContactPickerProps> = props => {
  const { pickedContacts, onPickedChange } = props;
  const [activeTab, setActiveTab] = useState('customer');
  const handlePickedChange = (contacts: ICustomerContactData[]) => {
    const nextPickedContacts = [...pickedContacts];
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (nextPickedContacts.every(item => item.email !== contact.email)) {
        nextPickedContacts.push(contact);
      }
    }
    onPickedChange(nextPickedContacts);
  };
  const handleContactRemove = (email: string) => {
    onPickedChange(pickedContacts.filter(contact => contact.email !== email));
  };
  return (
    <div className={style.contactPicker}>
      <div className={style.picker}>
        <Tabs className="custom-ink-bar" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane key="customer" tab={getIn18Text('XUANZEKEHULIEBIAO')}>
            <div className={style.pickerContent}>
              <Customer pickedContacts={pickedContacts} onPickedChange={handlePickedChange} way="Address_Book" />
            </div>
          </TabPane>
          <TabPane key="manual" tab={getIn18Text('SHOUDONGTIANJIA')}>
            <div className={style.pickerContent}>
              <ManualInput onPickedChange={handlePickedChange} />
            </div>
          </TabPane>
        </Tabs>
      </div>
      <div className={style.picked}>
        <div className={style.pickedHeader}>
          <div className={style.pickedText}>{getIn18Text('YITIANJIA:')}</div>
          <div className={style.pickedClear} onClick={() => onPickedChange([])}>
            <RecycleBin className={style.clearIcon} />
            <span>{getIn18Text('QINGKONG')}</span>
          </div>
        </div>
        <div className={style.pickedContent}>
          <div className={style.pickedContacts}>
            {pickedContacts.map(contact => (
              <ContactItem
                key={contact.email}
                name={contact.contact_name}
                email={contact.email}
                checkable={false}
                closable
                onClose={() => handleContactRemove(contact.email)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
ContactPicker.defaultProps = {};
export default ContactPicker;
