import { getIn18Text } from 'api';
import React from 'react';
import { SnsMarketingPlatform } from 'api';
import { Alert } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import BindingEntry from './BindingEntry';
import style from './BindingEntryModal.module.scss';

interface BindingEntryModalProps {
  visible: boolean;
  platforms: {
    platform: SnsMarketingPlatform;
    name: string;
  }[];
  fetchingPlatform: SnsMarketingPlatform | null;
  onCancel: () => void;
  onBindStart: (platform: SnsMarketingPlatform) => void;
}

const BindingEntryModal: React.FC<BindingEntryModalProps> = props => {
  const { visible, platforms, fetchingPlatform, onCancel, onBindStart } = props;

  return (
    <Modal
      className={style.bindingEntryModal}
      width={710}
      title={getIn18Text('TIANJIASHEMEIZHUYE')}
      footer={null}
      visible={visible}
      getContainer={() => document.body}
      onCancel={onCancel}
    >
      <Alert className={style.notice} message={getIn18Text('WENXINTISHI：SHOUQUAN')} type="warning" showIcon />
      <div className={style.content}>
        <BindingEntry platforms={platforms} fetchingPlatform={fetchingPlatform} onBindStart={onBindStart} />
      </div>
    </Modal>
  );
};

export default BindingEntryModal;
