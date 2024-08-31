import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './convertModal.module.scss';

interface ConvertModalProps {
  visible: boolean;
  title?: React.ReactNode;
  onSubmit: (createOpportunity: boolean) => void;
  onCancel: () => void;
}

const ConvertModal: React.FC<ConvertModalProps> = props => {
  const { visible, onSubmit, onCancel } = props;
  const [createOpportunity, setCreateOpportunity] = useState(false);

  useEffect(() => {
    setCreateOpportunity(false);
  }, [visible]);

  return (
    <Modal className={style.convertModal} title="转为客户" visible={visible} width={412} onCancel={onCancel} onOk={() => onSubmit(createOpportunity)}>
      <div className={style.content}>
        <div className={classnames([style.item, style.toCustomer])}>
          <div className={style.card}>
            <div className={classnames([style.checkbox, style.disabled])} />
          </div>
          <div className={style.text}>转为客户并新建联系人</div>
        </div>
        <div className={classnames([style.item, style.toOpportunity])}>
          <div className={style.card} onClick={() => setCreateOpportunity(!createOpportunity)}>
            <div
              className={classnames([
                style.checkbox,
                {
                  [style.checked]: createOpportunity,
                },
              ])}
            />
          </div>
          <div className={style.text}>同时新建商机</div>
        </div>
      </div>
    </Modal>
  );
};

ConvertModal.defaultProps = {};

export default ConvertModal;
