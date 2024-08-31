import React from 'react';
import { Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { UserCheckItemInfo } from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/types';
import styles from './style.module.scss';
import UserItem from '../userItem';

interface Props {
  user: UserCheckItemInfo;
  onChecked: (checked: boolean, id: number) => void;
  disabled?: boolean;
}

const SubCheckItem: React.FC<Props> = ({ user, onChecked, disabled }) => {
  const onChange = (e: CheckboxChangeEvent) => {
    onChecked(e.target.checked, user.accId);
  };

  return (
    <div className={styles.subCheckItem}>
      <Checkbox checked={user.checked} disabled={disabled} onChange={onChange} style={{ alignItems: 'center' }}>
        <UserItem user={user} style={{ width: '254px' }} />
      </Checkbox>
    </div>
  );
};

export default SubCheckItem;
