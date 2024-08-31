import React, { useState } from 'react';
import ContactForm from './ContactForm';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './personalModal.module.scss';
import { ContactModel, api, SystemApi, locationHelper } from 'api';
import { getIn18Text } from 'api';
import { ContactItem } from '@web-common/utils/contact_util';

export interface PersonalModalProps {
  from?: 'detail' | 'contact';
  contact?: ContactModel;
  isEdit?: boolean;
  _account?: string;
  contactId?: string;
  onCancel(): void;
  onSuccess?(params: ContactItem): void;
}
const systemApi = api.getSystemApi() as SystemApi;
export const PersonalModal = (props: PersonalModalProps) => {
  const { isEdit, contactId, contact, onCancel, onSuccess, from = 'contact', _account = systemApi.getCurrentUser()?.id || '' } = props;
  const [visible, setVisible] = useState<boolean>(true);
  const [title, setTitle] = useState<string>(isEdit ? getIn18Text('BIANJILIANXIREN') : getIn18Text('XINJIANLIANXIREN'));
  const isGlobal = locationHelper.testPathMatch('/readMail');
  return (
    <SiriusHtmlModal
      width={480}
      isGlobal={isGlobal}
      visible={visible}
      destroyOnClose={false}
      footer={null}
      closable={false}
      getContainer={() => {
        return document.body;
      }}
    >
      <div
        className={styles.wrap}
        data-test-id="modal_personal"
        onClick={e => {
          return e.stopPropagation();
        }}
      >
        <div className={styles.title}>
          <div className={styles.name} data-test-id="modal_personal_title">
            {title}
          </div>
          <div className={`dark-invert ${styles.close}`} onClick={onCancel} />
        </div>
        <div
          className={styles.content}
          onClick={e => {
            return e.stopPropagation();
          }}
        >
          <ContactForm
            from={isEdit ? 'edit' : 'create'}
            _account={_account}
            contact={contact}
            contactId={contactId}
            onSuccess={onSuccess}
            onCancel={onCancel}
            onChangeVisible={(open: boolean) => setVisible(open)}
            onChangeTitle={(str: string) => setTitle(str)}
          />
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
