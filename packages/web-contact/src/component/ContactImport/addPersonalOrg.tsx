import React, { useState, useCallback, useEffect } from 'react';
import styles from './modal.module.scss';
import { Button } from 'antd';
// import SiriusButton from '@web-common/components/UI/Button';
import SiriusButton from '@lingxi-common-component/sirius-ui/Button';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import IconCard from '@web-common/components/UI/IconCard';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { contactApi } from '../../_mock_';
import { InsertPersonalOrgRes } from 'api';
import { getIn18Text } from 'api';

interface Props {
  hidden?: boolean;
  onClose?(): void;
  onOk?(params: InsertPersonalOrgRes): void;
}
export const AddPersonalOrg = ({ hidden, onClose, onOk }: Props) => {
  // 新建分组名称
  const [name, setName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  // 点击确认
  const onSubmit = useCallback(async () => {
    setLoading(true);
    const res = await contactApi.doInsertPersonalOrg({
      groupName: name,
    });
    setLoading(false);
    if (res.success && res.data) {
      onOk && onOk(res.data);
    } else {
      message.error(res.message);
    }
  }, [name]);
  useEffect(() => {
    !hidden && setName('');
  }, [hidden]);
  return (
    <div className={styles.addPersonalOrgWrap} hidden={hidden}>
      <div className={styles.titleWrap}>
        <div className={styles.titleLine}>
          <div className={styles.title}>{getIn18Text('XINJIANGERENFEN')}</div>
          <IconCard onClick={onClose} className={styles.close} width={20} height={20} type="tongyong_guanbi_xian" />
        </div>
      </div>
      <div className={`ant-allow-dark ${styles.content}`}>
        <Input placeholder={getIn18Text('QINGSHURUXINFEN')} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className={styles.footerWrap}>
        <SiriusButton className={styles.cancel} btnType="minorLine" style={{ marginRight: 16 }} onClick={onClose}>
          {getIn18Text('QUXIAO')}
        </SiriusButton>
        <Button type="primary" onClick={onSubmit} loading={loading}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};
