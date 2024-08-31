import React, { useState } from 'react';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './convertModal.module.scss';
import { getIn18Text } from 'api';
interface ConvertModalProps {
  visible: boolean;
  title?: React.ReactNode;
  onSubmit: (addType: boolean) => void;
  onCancel: () => void;
}
const ConvertModal: React.FC<ConvertModalProps> = props => {
  const { visible, onSubmit, onCancel } = props;
  const [addType, setAddType] = useState(true);
  return (
    <Modal className={style.convertModal} title={getIn18Text('TIANJIAKEHU')} visible={visible} width={412} onCancel={onCancel} onOk={() => onSubmit(addType)}>
      <div className={style.content}>
        <div className={classnames([style.item, style.toClue])}>
          <div className={style.card} onClick={() => setAddType(!addType)}>
            <div
              className={classnames([
                style.checkbox,
                {
                  [style.checked]: !addType,
                },
              ])}
            />
          </div>
          <div className={style.text}>{getIn18Text('TIANJIAZHIXIANSUO')}</div>
        </div>
        <div className={classnames([style.item, style.toCustomer])}>
          <div className={style.card} onClick={() => setAddType(!addType)}>
            <div
              className={classnames([
                style.checkbox,
                {
                  [style.checked]: addType,
                },
              ])}
            />
          </div>
          <div className={style.text}>{getIn18Text('TIANJIAZHIKEHU')}</div>
        </div>
      </div>
    </Modal>
  );
};
ConvertModal.defaultProps = {};
export default ConvertModal;
