import React from 'react';
import { Modal, Button } from 'antd';
import { ICheckboxSelectProps, CheckboxSelect } from '../CheckboxSelect/index';
import { ModalHeader } from '../../components/ModalHeader/index';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getIn18Text } from 'api';

export interface ISyncContactsProps extends ICheckboxSelectProps {
  id: number | string;
  visible: boolean;
  contactSum: number;
  onCancel: (id: number | string) => void;
  onSync: () => void;
  title: string | React.ReactNode;
  loading: boolean;
}

export function SyncContacts(props: ISyncContactsProps) {
  const { id, visible, contactSum, onCancel, onSync, title, loading, ...rest } = props;
  return (
    <Modal
      className={styles.sync}
      visible={visible}
      closable={false}
      width={480}
      onCancel={() => onCancel(id)}
      footer={[
        <Button onClick={() => onCancel(id)} className={classnames(styles.btn, styles.cancel)}>
          {getIn18Text('setting_system_switch_cancel')}
        </Button>,
        <Button onClick={onSync} className={classnames(styles.btn, styles.confirm)} loading={loading}>
          {getIn18Text('QUEDINGTONGBU')}
        </Button>,
      ]}
      title={
        <div className={styles.syncHeader}>
          <ModalHeader title={title} onClick={() => onCancel(id)} />
          <div className={styles.text}>
            {getIn18Text('DANGQIANTONGXUNLULIANXI')}
            <span className={styles.textColor}>{contactSum}</span>
            {getIn18Text('，TONGBUDAODEZHIBU')}
          </div>
        </div>
      }
    >
      <div className={styles.syncBody}>
        <span className={styles.syncBodyLabel}>{getIn18Text('FENZUMINGCHENG')}</span>
        <CheckboxSelect {...rest} />
      </div>
    </Modal>
  );
}
