import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { TongyongGuanbiMian } from '@sirius/icons';
import { MaterielFile } from 'api';
import { formatFileSize } from '@web-common/utils/file';
import { splitFullName } from '@web-materiel/utils';

import style from './FileCard.module.scss';
import { getTrail } from '@web-disk/utils';
import { getIconByExt } from '../utils/getIconByExt';

interface FileCardProps {
  className?: string;
  file?: MaterielFile;
  fileName?: string;
  fileSize?: number;
  fileTime?: string;
  iconSize?: number;
  showTime?: boolean;
  showSize?: boolean;
  closable?: boolean;
  onClose?: () => void;
  onClick?: () => void;
}

export const FileCard: React.FC<FileCardProps> = props => {
  const { className, file, fileName: _fileName, fileSize: _fileSize, fileTime: _fileTime, iconSize: _iconSize, showTime, showSize, closable, onClose, onClick } = props;
  const fileName = file?.fileName || _fileName || '';
  const fileSize = file?.fileSize || _fileSize || 0;
  const fileTime = file?.createAt || _fileTime || 0;
  const { name, ext } = splitFullName(fileName);
  const iconSize = _iconSize || 32;
  const fileType = getTrail(fileName || '');
  const handleClick = () => {
    onClick && onClick();
  };
  return (
    <div className={classnames(style.fileCard, className)}>
      {getIconByExt(fileType, { marginRight: 8 }, iconSize)}
      <div className={style.content} onClick={handleClick}>
        <div className={style.fullName}>
          <div className={style.name}>{name}</div>
          {ext && <div className={style.ext}>.{ext}</div>}
        </div>
        {(showTime || showSize) && (
          <div className={style.desc}>
            {showTime && !!fileTime && <span className={style.time}>{moment(fileTime).format('YYYY-MM-DD')}</span>}
            {showSize && !!fileSize && <span className={style.size}>{formatFileSize(fileSize, 1024)}</span>}
          </div>
        )}
      </div>
      {closable && (
        <div className={style.close} onClick={() => onClose && onClose()}>
          <TongyongGuanbiMian wrapClassName={style.closeIcon} />
        </div>
      )}
    </div>
  );
};
