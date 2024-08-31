import React, { useState } from 'react';
import classnames from 'classnames';
import { Button, Input } from 'antd';
import { apiHolder, apis, WhatsAppApi, WhatsAppFileExtractResult, WhatsAppFileExtractStatus } from 'api';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import style from './manualInput.module.scss';
import { getIn18Text } from 'api';

interface ManualInputProps {
  className?: string;
  extraction: WhatsAppFileExtractResult | null;
  onExtracted: (extractResult: WhatsAppFileExtractResult) => void;
}
const { TextArea } = Input;
const manualInputPlaceholder = getTransText('ManuallyInputWhatsAppPlaceholder') || '';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const ManualInput: React.FC<ManualInputProps> = props => {
  const { className, extraction, onExtracted } = props;
  const [text, setText] = useState<string>('');
  const [extracting, setExtracting] = useState<boolean>(false);

  const handleTextExtract = () => {
    if (!text) return;

    setExtracting(true);

    whatsAppApi
      .extractJobReceiverText({ text })
      .then(data => {
        onExtracted(data);
        setText('');
      })
      .finally(() => {
        setExtracting(false);
      });
  };

  return (
    <div className={classnames(style.manualInput, className)}>
      <div className={style.body}>
        <TextArea
          className={style.textArea}
          placeholder={manualInputPlaceholder}
          value={text}
          onChange={event => setText(event.target.value)}
          bordered={false}
          autoFocus
        />
      </div>
      <div className={style.footer}>
        <Button className={style.add} type="primary" disabled={!text} loading={extracting} onClick={handleTextExtract}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
export default ManualInput;
