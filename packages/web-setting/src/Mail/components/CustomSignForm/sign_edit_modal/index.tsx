import React from 'react';
import { Modal } from 'antd';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { CustomSignForm } from './custom-sign-form';
import style from './style.module.scss';
import { getIn18Text } from 'api';

interface SignEditModalProps {
  onSave?: (content: string) => void;
  signEditId: ModalIdList;
}
/** 新建/编辑签名Modal */
const SignEdit = (props: SignEditModalProps) => {
  const { onSave, signEditId } = props;
  const modal = useNiceModal(signEditId);
  const signItem = modal.args.signItem;
  const _account = modal.args._account || '';
  return (
    <Modal bodyStyle={{ padding: 0 }} footer={null} width={688} destroyOnClose closable={false} visible={!modal.hiding}>
      <div style={{ padding: '24px 24px 0' }} className={style.signEditContent}>
        <h3 style={{ marginBottom: 20 }} className={style.title}>
          {signItem === null ? getIn18Text('TIANJIAQIANMING') : getIn18Text('BIANJIQIANMING')}
        </h3>
        <CustomSignForm signEditId={signEditId} editData={signItem} onSave={onSave} currentAccount={_account} />
      </div>
    </Modal>
  );
};

export default SignEdit;
