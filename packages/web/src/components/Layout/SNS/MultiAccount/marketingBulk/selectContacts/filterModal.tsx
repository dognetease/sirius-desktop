import React, { useState } from 'react';
import { Progress } from 'antd';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { useInterval } from 'ahooks';
import { ReactComponent as LoadingIcon } from '@/images/icons/marketBulk/filterLoading.svg';
import { ReactComponent as PointerIcon } from '@/images/icons/marketBulk/pointer.svg';

import style from './contactModal.module.scss';

interface Props {
  open: boolean;
}

const FilterModal: React.FC<Props> = ({ open }) => {
  const [count, setCount] = useState(50);
  const clear = useInterval(() => {
    if (count === 98) {
      clear();
    } else {
      setCount(count + 1);
    }
  }, 5);

  return (
    <Modal visible={open} width={418} footer={null} closable={false} mask={false} bodyStyle={{ width: 418, height: 308 }}>
      <div className={style.filterWarp}>
        <LoadingIcon />
        <Progress strokeColor="#4C6AFF" percent={count} />
        <div className={style.checkText}>
          <PointerIcon /> 检查号码是否正确
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;
