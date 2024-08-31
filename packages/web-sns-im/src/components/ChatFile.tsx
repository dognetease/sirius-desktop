import { getIn18Text } from 'api';
import React from 'react';
import classnames from 'classnames';
import { SnsImMessageFile } from '../types';
import { formatFileSize } from '@web-common/components/util/file';
import IconCard from '@web-common/components/UI/IconCard';
import style from './ChatFile.module.scss';

interface ChatFileProps {
  className?: string;
  style?: React.CSSProperties;
  messageFile: SnsImMessageFile;
  downloadable?: boolean;
}

const ChatFile: React.FC<ChatFileProps> = props => {
  const { className, style: styleFromProps, messageFile, downloadable } = props;
  const { src, fileName, fileSize } = messageFile;
  const type = (fileName || '').split('.').pop();

  const handleDownload = () => {
    src && window.open(src);
  };

  return (
    <div
      className={classnames(style.chatFile, className, {
        [style.downloadable]: downloadable,
      })}
      style={styleFromProps}
      onClick={() => downloadable && handleDownload()}
    >
      <IconCard className={style.icon} type={type as any} />
      <div className={style.content}>
        <div className={style.header}>
          <div className={style.fileName}>{fileName || '未知文件'}</div>
        </div>
        <div className={style.body}>
          <div className={style.fileSize}>{fileSize ? formatFileSize(fileSize) : getIn18Text('WEIZHIDAXIAO')}</div>
        </div>
      </div>
    </div>
  );
};

export { ChatFile };
