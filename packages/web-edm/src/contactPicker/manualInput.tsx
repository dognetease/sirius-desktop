import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { ICustomerContactData } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { parseReceiverEntity } from '../utils';
import style from './manualInput.module.scss';
import { getIn18Text } from 'api';
interface ManualInputProps {
  onPickedChange: (contacts: ICustomerContactData[]) => void;
}
const { TextArea } = Input;
const ManualInput: React.FC<ManualInputProps> = props => {
  const { onPickedChange } = props;
  const [value, setValue] = useState<string>('');
  const handleSubmit = () => {
    const rows = value.split(/[;；\n]+/).filter(string => string.length > 0);
    if (!rows.length) return Toast.error({ content: getIn18Text('WEIJIEXICHUYOUXIAOYOUXIANGDEZHI') });
    const entities = rows.map(parseReceiverEntity);
    if (!entities.length) return Toast.error({ content: getIn18Text('WEIJIEXICHUYOUXIAOYOUXIANGDEZHI') });
    onPickedChange(
      entities.map(item => ({
        contact_name: item.contactName as string,
        email: item.contactEmail,
        contact_id: undefined as unknown as string,
        company_id: undefined as unknown as string,
        company_name: undefined as unknown as string,
      }))
    );
    setValue('');
  };
  return (
    <div className={style.manualInput}>
      <TextArea
        className={style.textarea}
        value={value}
        bordered={false}
        placeholder={`请填写或粘贴需要添加至名单的邮箱地址，邮箱地址使用"；"或回车隔开`}
        onChange={event => setValue(event.target.value)}
      />
      <div className={style.footer}>
        <Button type="primary" disabled={!value.trim()} onClick={handleSubmit}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
export default ManualInput;
