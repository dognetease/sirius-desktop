import React, { useCallback } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { NiceModalIdStatus } from '@web-common/state/reducer/niceModalReducer';
import { useActions, useAppSelector, NiceModalActions } from '@web-common/state/createStore';

interface NiceModalProps {
  id: keyof NiceModalIdStatus;
  children: React.ReactNode;
  [key: string]: any;
}

export const useNiceModal = (modalId: keyof NiceModalIdStatus) => {
  const { showModal, hideModal } = useActions(NiceModalActions);
  const show = useCallback(
    (args?: any) => {
      showModal({ modalId, args });
    },
    [modalId]
  );
  const hide = useCallback(
    (force?: boolean) => {
      hideModal({ modalId, force });
    },
    [modalId]
  );
  const args = useAppSelector(state => state.niceModalReducer[modalId]);
  const hiding = useAppSelector(state => state.niceModalReducer.hiding[modalId]);
  return { args, hiding, visible: !!args, show, hide };
};

export const createNiceModal = (modalId: keyof NiceModalIdStatus, Comp: any) => {
  return (props: any) => {
    const { visible, args } = useNiceModal(modalId);
    if (!visible) return null;
    return <Comp {...args} {...props} />;
  };
};

const NiceModal: React.FC<NiceModalProps> = props => {
  const { id, children, ...rest } = props;
  const modal = useNiceModal(id);
  return (
    <Modal onCancel={() => modal.hide()} onOk={() => modal.hide()} afterClose={() => modal.hide(true)} visible={!modal.hiding} {...rest}>
      {children}
    </Modal>
  );
};

export default NiceModal;
