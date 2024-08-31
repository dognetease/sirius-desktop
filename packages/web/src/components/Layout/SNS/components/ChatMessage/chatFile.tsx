import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import classnames from 'classnames';
import { formatFileSize } from '@web-common/components/util/file';
import IconCard from '@web-common/components/UI/IconCard';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getExtFromMimeType } from '@/components/Layout/SNS/mimeType';
import style from './chatFile.module.scss';

interface ChatFileProps {
  className?: string;
  style?: React.CSSProperties;
  fileName: string;
  fileSize?: number | string;
  fileType?: string;
  downloadUrl?: string;
  getDownloadUrl?: () => Promise<string>;
}

const ChatFile: React.FC<ChatFileProps> = props => {
  const { className, style: styleFromProps, fileName: fileNameFromProps, fileSize: fileSizeFromProps, fileType, downloadUrl, getDownloadUrl } = props;

  const fileName = fileNameFromProps || '未知名称';

  const fileSize = useMemo(() => {
    if (fileSizeFromProps) {
      if (typeof fileSizeFromProps === 'string') {
        return fileSizeFromProps;
      }
      if (typeof fileSizeFromProps === 'number') {
        return formatFileSize(fileSizeFromProps);
      }
    }

    return getIn18Text('WEIZHIDAXIAO');
  }, [fileSizeFromProps]);

  const fileExt = useMemo<any>(() => {
    if (fileType) {
      return getExtFromMimeType(fileType as any) || '';
    }

    if (fileName) {
      return fileName.split('.').pop() || '';
    }

    return '';
  }, [fileType, fileName]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl);
    } else if (getDownloadUrl) {
      getDownloadUrl()
        .then(url => {
          if (url) {
            window.open(url);
          } else {
            Toast.warn({ content: getIn18Text('GAIWENJIANZANBUZHICHI') });
          }
        })
        .catch(() => Toast.warn({ content: getIn18Text('GAIWENJIANZANBUZHICHI') }));
    }
  };

  return (
    <div className={classnames(style.chatFile, className)} style={styleFromProps} onClick={handleDownload}>
      <IconCard className={style.icon} type={fileExt} />
      <div className={style.content}>
        <div className={style.header}>
          <div className={classnames(style.fileName, style.ellipsis)}>{fileName}</div>
        </div>
        <div className={style.body}>
          <div className={style.fileSize}>{fileSize}</div>
          {/* <div className={style.cancel}>
            取消
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ChatFile;
