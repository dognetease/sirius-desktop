import React, { useState, useEffect, useRef } from 'react';
import { InputNumber } from 'antd';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { UserCheckItemInfo, AllotModalType } from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/types';

import styles from './style.module.scss';
import UserItem from '../userItem';
import { useAppSelector } from '@web-common/state/createStore';
import { ModeType } from 'api';

interface Props {
  user: UserCheckItemInfo;
  quota: number;
  allotNum: number;
  onAllotNumChange: (num: number, id: number) => void;
  onDelete: (id: number) => void;
  allotModalType: AllotModalType;
}

const SubAllotItem: React.FC<Props> = ({ user, allotNum, quota, onAllotNumChange, allotModalType, onDelete }) => {
  const [allotNumLocal, setAllotNumLocal] = useState(1);
  const isWarning = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeType = useAppSelector(state => state.globalReducer.waModeType);

  useEffect(() => {
    setAllotNumLocal(allotNum);
  }, [allotNum]);

  const onChange = (value: number) => {
    const integerValue = Math.round(value);
    if (integerValue > quota && modeType !== ModeType.limit) {
      if (!isWarning.current) {
        isWarning.current = true;
        Toast.warning({
          content: `${allotModalType === 'add' ? '添加成员' : '分配成员'}数量超过上限`,
          duration: 2.5,
          onClose() {
            isWarning.current = false;
          },
        });
      }
      if (inputRef.current) {
        inputRef.current.blur();
      }
      onAllotNumChange(quota, user.accId);
      return;
    }
    onAllotNumChange(integerValue, user.accId);
  };

  return (
    <div className={styles.subAllotItem}>
      <UserItem user={user} style={{ flex: '0 0 196px', width: '196px' }} />
      <InputNumber ref={inputRef} min={1} max={10000} value={allotNumLocal} onChange={onChange} className={styles.subAllotInput} precision={0} />
      <CloseCircleOutlined className={styles.closeIcon} onClick={() => onDelete(user.accId)} />
    </div>
  );
};

export default SubAllotItem;
