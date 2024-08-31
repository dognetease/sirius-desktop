import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Button, Upload } from 'antd';
import { apiHolder, apis, WhatsAppApi, WhatsAppFileExtractResult } from 'api';
import { formatFileSize } from '@web-common/utils/file';
import IconCard from '@web-common/components/UI/IconCard';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import style from './filePicker.module.scss';
import { getIn18Text } from 'api';
interface FilePickerProps {
  className?: string;
  extraction: WhatsAppFileExtractResult | null;
  onExtracted: (extractResult: WhatsAppFileExtractResult) => void;
}
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const FilePicker: React.FC<FilePickerProps> = props => {
  const { className, extraction, onExtracted } = props;
  const { downloadTemplate } = useDownLoad();
  const [templateLink, setTemplateLink] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState<boolean>(false);
  const handleBeforeUpload = (uploadFile: File) => {
    setFile(uploadFile);
    return false;
  };
  const handleTemplateDownload = () => {
    if (!templateLink) return;
    downloadTemplate(templateLink, getIn18Text('WhatsApp QUNFARENWUDAORUMOBAN'));
  };
  useEffect(() => {
    whatsAppApi.getJobTemplateLink().then(link => setTemplateLink(link));
  }, []);
  const handleFileExtract = () => {
    if (!file) return;

    const handler = () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileSize', String(file.size));
      formData.append('fileName', file.name);
      setExtracting(true);
      whatsAppApi
        .extractJobReceiverFile(formData)
        .then(data => {
          onExtracted(data);
        })
        .finally(() => {
          setExtracting(false);
        });
      whatsAppTracker.trackJob('target_upload');
    };

    if (extraction) {
      Modal.confirm({
        title: getTransText('CAOZUOTISHI') || '',
        content: getTransText('OverwriteAddedTip') || '',
        onOk: handler,
      });
    } else {
      handler();
    }
  };
  return (
    <div className={classnames(style.filePicker, className)}>
      <div className={style.body}>
        {file && (
          <div className={style.fileInfo}>
            <IconCard className={style.fileIcon} type={file.name.split('.').pop() as any} />
            <div className={style.fileContent}>
              <div className={style.fileName}>{file.name}</div>
              <div className={style.fileSize}>{formatFileSize(file.size)}</div>
            </div>
          </div>
        )}
        <Upload className={style.fileUpload} maxCount={1} multiple={false} fileList={[]} beforeUpload={handleBeforeUpload}>
          <Button type="primary">{getIn18Text('XUANZEWENJIAN')}</Button>
        </Upload>
        <div className={style.tips}>
          {getIn18Text('ZHICHIxls、xlsxWENJIANGESHI')}
          <span
            className={classnames(style.downloadTemplate, {
              [style.disabled]: !templateLink,
            })}
            onClick={handleTemplateDownload}
          >
            {getIn18Text('XIAZAIMOBAN')}
          </span>
        </div>
      </div>
      <div className={style.footer}>
        <Button className={style.add} type="primary" disabled={!file} loading={extracting} onClick={handleFileExtract}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
export default FilePicker;
