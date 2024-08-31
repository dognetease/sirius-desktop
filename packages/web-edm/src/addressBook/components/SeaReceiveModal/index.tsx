import React from 'react';
import { AddressRepeatedAction, getIn18Text } from 'api';
import { useAddressRepeatedAction } from '../../hooks/useAddressRepeatedAction';
import Modal from '@/components/Layout/components/Modal/modal';

interface SeaReceiveModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (action: AddressRepeatedAction) => void;
}

const SeaReceiveModal: React.FC<SeaReceiveModalProps> = props => {
  const { visible, title, onCancel, onSubmit } = props;
  const { action, ActionRadioGroup } = useAddressRepeatedAction();

  return (
    <Modal visible={visible} title={title} width={480} onOk={() => onSubmit(action)} onCancel={onCancel}>
      <div>{getIn18Text('LINGQUGONGHAILIANXIRENHOU\uFF0CLIANXIRENJIANGZHANSHIDAOYINGXIAODEZHIBULIEBIAOZHONG\uFF0CKEDUILIANXIRENZUOHOUXUDEGENJINDONGZUO')}</div>
      <ActionRadioGroup style={{ marginTop: 20 }} />
    </Modal>
  );
};
export default SeaReceiveModal;
