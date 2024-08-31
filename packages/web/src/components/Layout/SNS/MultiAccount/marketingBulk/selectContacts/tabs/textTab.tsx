import React from 'react';
import { Button } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './tab.module.scss';

interface Props {
  addWhatsApp: (whatsApp: string[], clear: () => void) => void;
  value?: string;
  setValue: (text: string) => void;
}
export const TextTab: React.FC<Props> = ({ addWhatsApp, value, setValue }) => {
  const pasteContacts = () => {
    if (value) {
      const replacedText = value.replace(/；/g, ';').replace(/\n/g, ';');
      const pastedList = replacedText.split(';').filter(item => item) || [];
      if (pastedList.length) {
        addWhatsApp(pastedList, () => setValue(''));
      } else {
        Toast.warning('请先填写wahtsapp账号');
      }
    }
  };

  return (
    <div className={style.tabContentWrap}>
      <div className={style.contactPaste}>
        <Input.TextArea
          style={{
            height: '380px',
          }}
          placeholder={'国家区号+手机号，如“8613434342121”，号码之间用“;”或换行隔开'}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </div>
      <div className={style.btnBox}>
        <Button disabled={!value} onClick={() => pasteContacts()}>
          添加
        </Button>
      </div>
    </div>
  );
};
