import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { WhatsAppFileExtractResult, WhatsAppFileExtractIndex } from 'api';
import { Button, Tabs, Tooltip } from 'antd';
import RecycleBin from '@web-common/components/UI/Icons/svgs/disk/RecycleBin';
import FilePicker from './filePicker';
import ManualInput from './manualInput';
import ReceiverItem from './receiverItem';
import style from './receiver.module.scss';
import { VerifyNumbersModal } from '../verifyNumbers';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

const { TabPane } = Tabs;

export enum FilterStatus {
  Init = 'init',
  Error = 'error',
  Success = 'success',
}
interface ReceiverProps {
  className?: string;
  extraction: WhatsAppFileExtractResult | null;
  jobId: string?;
  onClear: () => void;
  onRemoveItem: (whatsApp: string) => void;
  onExtracted: (extractType: 'file' | 'text', extractResult: WhatsAppFileExtractResult) => void;
  onFilter?: (filterWhatsApp: string[]) => void;
  onFilterStatusChange: (status: string) => void;
}
const Receiver: React.FC<ReceiverProps> = props => {
  const { className, extraction, jobId, onClear, onRemoveItem, onExtracted, onFilter, onFilterStatusChange } = props;
  const [activeTab, setActiveTab] = useState('file');
  const [disabledFilter, setDisabledFilter] = useState(false);
  const [verifyModalData, setVerifyModalData] = useState<{ visible: boolean; numbers: string[] }>();

  const extractCallback = (extractType: 'file' | 'text', extractResult: WhatsAppFileExtractResult) => {
    onExtracted(extractType, extractResult);
    // 有新内容，允许过滤
    setDisabledFilter(false);
    onFilterStatusChange && onFilterStatusChange(FilterStatus.Init);
  };

  useEffect(() => {
    setDisabledFilter(false);
    onFilterStatusChange && onFilterStatusChange(FilterStatus.Init);
  }, [jobId]);

  const handleVerifyNumbers = () => {
    const numbers = extraction?.body?.map(row => row.content[WhatsAppFileExtractIndex.WHATSAPP]);
    setVerifyModalData({
      visible: true,
      numbers: numbers || [],
    });
    setDisabledFilter(true);
  };

  const handleCancelVerify = () => {
    setVerifyModalData(undefined);
    setDisabledFilter(false);
    onFilterStatusChange && onFilterStatusChange(FilterStatus.Init);
  };

  const handleVerifyOk = (exceptionNumbers: string[]) => {
    setVerifyModalData(undefined);
    // todo
    onFilter && onFilter(exceptionNumbers);
    onFilterStatusChange && onFilterStatusChange(FilterStatus.Success);
  };
  const handleVerifyFail = () => {
    setVerifyModalData(undefined);
    // todo
    setDisabledFilter(false);
    onFilterStatusChange && onFilterStatusChange(FilterStatus.Error);
  };

  return (
    <div className={classnames('edm', style.receiver, className)}>
      <div className={style.picker}>
        <Tabs className="custom-ink-bar" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane className={style.pickerContent} key="file" tab={getIn18Text('CONGWENJIANDAORU')}>
            <FilePicker extraction={extraction} onExtracted={extractResult => extractCallback('file', extractResult)} />
          </TabPane>
          <TabPane className={style.pickerContent} key="text" tab={getIn18Text('SHOUDONGSHURU')}>
            <ManualInput extraction={extraction} onExtracted={extractResult => extractCallback('text', extractResult)} />
          </TabPane>
        </Tabs>
      </div>
      <div className={style.picked}>
        <div className={style.pickedHeader}>
          <div className={style.pickedText}>{getIn18Text('YITIANJIA:')}</div>
          <div className={style.pickedCount}>{extraction?.body.length || 0}</div>
          <div className={style.pickedClear} onClick={onClear}>
            <RecycleBin className={style.clearIcon} />
            <span>{getIn18Text('QINGKONG')}</span>
          </div>
        </div>
        <div className={style.pickedContent}>
          {extraction &&
            extraction.body &&
            extraction.body
              .sort((a, b) => b.status - a.status)
              .map(row => {
                const whatsApp = row.content[WhatsAppFileExtractIndex.WHATSAPP];

                return <ReceiverItem key={whatsApp} whatsApp={whatsApp} status={row.status} content={row.content} onRemove={onRemoveItem} />;
              })}
        </div>
        <div className={style.pickedFooter}>
          {/* <Tooltip title={getTransText('WEIBAOZHENGYINGXIAOXIAOGUO')}>
            <Button className={style.filterBtn} disabled={!extraction?.body?.length || disabledFilter} type="primary" onClick={handleVerifyNumbers}>
              {getTransText('GUOLVHAOMA')}
            </Button>
          </Tooltip> */}
        </div>
      </div>
      {verifyModalData && (
        <VerifyNumbersModal
          visible={verifyModalData.visible}
          numbers={verifyModalData.numbers}
          onCancel={handleCancelVerify}
          onOk={handleVerifyOk}
          onVerifyError={handleVerifyFail}
        />
      )}
    </div>
  );
};
export default Receiver;
