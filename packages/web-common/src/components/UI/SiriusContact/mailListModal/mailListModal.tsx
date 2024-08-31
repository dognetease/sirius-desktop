import React from 'react';
import MailListForm from './mailListForm';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './mailListModal.module.scss';
import { getIn18Text } from 'api';

export interface MailListModalProps {
  id?: string;
  purpose: 'create' | 'update';
  email?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const MailListModal = (props: MailListModalProps) => {
  const { purpose, email, onCancel, onSuccess, id } = props;

  return (
    <SiriusHtmlModal width={480} visible destroyOnClose footer={null} closable={false}>
      <div className={styles.wrap} data-test-id="modal_mailList">
        <div className={styles.title}>
          <div className={styles.name} data-test-id="modal_mailList_title">
            {purpose === 'update' ? getIn18Text('BIANJIYOUJIANLIEBIAO') : getIn18Text('XINJIANYOUJIANLIEBIAO')}
          </div>
          <div className={styles.close} data-test-id="modal_mailList_close" onClick={onCancel} />
        </div>

        <div className={styles.content} data-test-id="modal_mailList_content">
          <MailListForm id={id} purpose={purpose} email={email} onCancel={onCancel} onSuccess={onSuccess} />
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
