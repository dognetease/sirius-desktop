import { getIn18Text } from 'api';
import React from 'react';
import styles from './index.module.scss';
import { ModalHeader } from '../ModalHeader/index';
import { Button, Select } from 'antd';
import classnames from 'classnames';

import Modal from '@web-common/components/UI/Modal/SiriusModal';
const { Option } = Select;

export interface IAddClientProps {
  visible: boolean;
  title: string | React.ReactNode;
  clientOptions: {
    label: string;
    value: string;
  }[];
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function AddClient(props: IAddClientProps) {
  const { visible, title, clientOptions, onClose, onConfirm, loading, onChange } = props;
  return (
    <Modal
      className={styles.client}
      visible={visible}
      closable={false}
      title={<ModalHeader title={title} onClick={onClose} />}
      footer={[
        [
          <Button onClick={onClose} className={classnames(styles.btn, styles.cancel)}>
            {getIn18Text('setting_system_switch_cancel')}
          </Button>,
          <Button onClick={onConfirm} loading={loading} type="primary">
            {getIn18Text('QUEDING')}
          </Button>,
        ],
      ]}
    >
      <Select
        showSearch
        options={clientOptions}
        onChange={onChange}
        className={styles.clientSelect}
        optionFilterProp="children"
        filterOption={(input, option) => {
          input = input.toLowerCase();
          const { value } = option as IAddClientProps['clientOptions'][number];
          return value.toLocaleLowerCase().includes(input);
        }}
      >
        {clientOptions.map(({ label, value }) => {
          return (
            <Option value={value} key={value}>
              {label}
            </Option>
          );
        })}
      </Select>
    </Modal>
  );
}
