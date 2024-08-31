/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useState, useEffect } from 'react';
import { Button, Upload } from 'antd';
import debounce from 'lodash.debounce';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import IconCard from '@web-mail/components/Icon';
import { RcFile } from 'antd/lib/upload';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/remove-icon.svg';
import { ReactComponent as UploadIcon } from '@/images/icons/edm/cloud-upload.svg';
import style from './dataTransfer.module.scss';
import { getIn18Text } from 'api';

interface FieldUploadProps {
  files: RcFile[];
  onChange?: (files: RcFile[]) => void;
}

const toastFileCount = debounce(() => Toast.error({ content: getIn18Text('ZUIDUOZHICHILIANGGEWENJIANSHANGCHUAN') }), 500);
const toastFileSize = debounce(() => Toast.error({ content: getIn18Text('WENJIANDAXIAOBUNENGCHAOGUO5M') }), 500);

export const FileUpload = (props: FieldUploadProps) => {
  const [fileSelected, setFileSelected] = useState<RcFile[]>([]);
  const { files, onChange } = props;

  const onBeforeUpload = useCallback(
    (file: RcFile, fileList: RcFile[]) => {
      if (fileList.length + fileSelected.length > 2) {
        toastFileCount();
        return false;
      }
      if (fileList.some(file => file.size > 5 * 1024 * 1024)) {
        toastFileSize();
        return false;
      }
      const list = fileSelected.concat(fileList);
      setFileSelected(list);
      onChange && onChange(list);
      return false;
    },
    [setFileSelected, onChange, fileSelected]
  );

  const onRemoveFile = (index: number) => {
    files.splice(index, 1);
    const copy = [...files];
    setFileSelected(copy);
    onChange && onChange(copy);
  };

  useEffect(() => {
    setFileSelected(files);
  }, [files]);

  return (
    <div className={style.fileUploadContainer}>
      <h3>{getIn18Text('SHANGCHUANNINDEWENJIAN')}</h3>
      <p className={style.stepDesc}>{getIn18Text('JINZHICHIDANXINGBIAOTOU\uFF0CRUOWENJIANBIAOTOUYOUHEBINGDANYUANGE\uFF0CQINGQUXIAOHEBING')}</p>
      <Upload.Dragger name="file" multiple action="" beforeUpload={onBeforeUpload} showUploadList={false} accept=".xlsx,.xls" disabled={fileSelected.length > 1}>
        {fileSelected.length === 0 && <UploadIcon />}
        {fileSelected.map((file, index) => (
          <div className={style.uploadFileCard} onClick={e => e.stopPropagation()} key={file.uid}>
            <IconCard type="xlsx" style={{ width: 32, height: 32 }} />
            <div className={style.fileName}>{file.name}</div>
            <CloseIcon onClick={() => onRemoveFile(index)} style={{ cursor: 'pointer' }} />
          </div>
        ))}
        <p className={style.uploadDesc}>{getIn18Text('ZUIDAZHICHISHANGCHUANLIANGGEWENJIAN\uFF0CZHICHIxls\u3001xlsxWENJIANGESHI')}</p>
        <Button type="primary" disabled={fileSelected.length > 1}>
          {fileSelected.length === 0 ? getIn18Text('XUANZEWENJIAN') : getIn18Text('ZAICITIANJIA')}
        </Button>
      </Upload.Dragger>
    </div>
  );
};
