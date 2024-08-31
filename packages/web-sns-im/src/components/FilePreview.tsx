import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { SnsImMessageType, SnsImMessageFile } from '../types';
import { formatFileSize } from '@web-common/utils/file';
import { ChatFile } from './ChatFile';
import style from './FilePreview.module.scss';

interface FilePreviewProps {
  visible?: boolean;
  previewData: {
    messageType: SnsImMessageType;
    messageFile: SnsImMessageFile;
  } | null;
  onSend: () => void;
  onCancel: () => void;
}

const TITLE_MAP: Partial<Record<SnsImMessageType, string>> = {
  [SnsImMessageType.IMAGE]: getIn18Text('FASONGTUPIAN'),
  [SnsImMessageType.VIDEO]: getIn18Text('FASONGSHIPIN'),
  [SnsImMessageType.FILE]: getIn18Text('FASONGWENJIAN'),
};

const WIDTH_MAP: Partial<Record<SnsImMessageType, number>> = {
  [SnsImMessageType.IMAGE]: 520,
  [SnsImMessageType.VIDEO]: 520,
  [SnsImMessageType.FILE]: 420,
};

const FilePreview: React.FC<FilePreviewProps> = props => {
  const { visible, previewData, onSend, onCancel } = props;

  const title = previewData ? TITLE_MAP[previewData?.messageType] : '';
  const width = previewData ? WIDTH_MAP[previewData?.messageType] : undefined;

  const previewContent = useMemo(() => {
    if (!previewData) return null;

    const { messageType, messageFile } = previewData;

    if (messageType === SnsImMessageType.IMAGE) {
      return (
        <>
          <img className={style.image} src={messageFile.src} />
          <div className={style.fileName}>{messageFile.fileName}</div>
          <div className={style.fileSize}>{formatFileSize(messageFile.fileSize || 0)}</div>
        </>
      );
    }
    if (messageType === SnsImMessageType.VIDEO) {
      return (
        <>
          <video className={style.image} src={messageFile.src} controls />
          <div className={style.fileName}>{messageFile.fileName}</div>
          <div className={style.fileSize}>{formatFileSize(messageFile.fileSize || 0)}</div>
        </>
      );
    }
    if (messageType === SnsImMessageType.FILE) {
      return <ChatFile messageFile={previewData.messageFile} />;
    }
  }, [previewData]);

  return (
    <Modal className={style.filePreview} visible={visible} width={width} title={title} keyboard={false} maskClosable={false} onOk={onSend} onCancel={onCancel}>
      {previewContent}
    </Modal>
  );
};

export { FilePreview };
