import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import { SnsMarketingAccountType } from 'api';
import { Radio } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './AccountTypeModal.module.scss';

interface AccountTypeModalProps {
  title: string;
  visible: boolean;
  accountTypes: {
    accountType: SnsMarketingAccountType;
    name: string;
  }[];
  okLoading: boolean;
  onOk: (accountType: SnsMarketingAccountType) => void;
  onCancel: () => void;
}

const AccountTypeModal: React.FC<AccountTypeModalProps> = props => {
  const { title, visible, accountTypes, okLoading, onOk, onCancel } = props;

  const [accountType, setAccountType] = useState<SnsMarketingAccountType>(SnsMarketingAccountType.PERSONAL);

  useEffect(() => {
    !visible && setAccountType(SnsMarketingAccountType.PERSONAL);
  }, [visible]);

  return (
    <Modal
      className={style.accountTypeModal}
      width={400}
      title={null}
      visible={visible}
      okText={getIn18Text('QIANWANGSHOUQUAN')}
      getContainer={() => document.body}
      okButtonProps={{
        loading: okLoading,
        disabled: !accountType,
      }}
      onOk={() => accountType && onOk(accountType)}
      onCancel={onCancel}
    >
      <div className={style.title}>{title}</div>
      <Radio.Group value={accountType} onChange={e => setAccountType(e.target.value)}>
        {accountTypes.map(item => (
          <Radio value={item.accountType}>{item.name}</Radio>
        ))}
      </Radio.Group>
    </Modal>
  );
};

export default AccountTypeModal;
