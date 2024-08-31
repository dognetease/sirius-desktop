import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import { TongyongGuanbiXian } from '@sirius/icons';
import { apiHolder, apis, MaterielApi, MaterielFile } from 'api';
import { EventEmitter } from 'events';
import { formatFileSize } from '@web-common/utils/file';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Draggable from 'react-draggable';
import { Uploader, UploadStatus } from '@web-materiel/utils/uploader';
import style from './FileUploader.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;

const MAX_FILE_SIZE = 1024 * 1024 * 1024;

export const uploadEmitter = new EventEmitter();

interface UploadTriggerProps {
  className?: string;
  uploadKey: string;
  types?: string[]; // ['jpg', 'png']
  maxSize?: number;
  validator?: (file: File) => { success: boolean; message: string };
  addToMateriel?: boolean;
  onUploadStart?: () => void;
}

export const UploadTrigger: React.FC<UploadTriggerProps> = props => {
  const { className, uploadKey, types: _types, maxSize: _maxSize, validator: _validator, addToMateriel, onUploadStart, children } = props;
  const types = _types || [];
  const accept = types.length ? types.map(type => `.${type}`).join(', ') : undefined;
  const maxSize = _maxSize || MAX_FILE_SIZE;
  const validator = _validator || (() => ({ success: true, message: '' }));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTrigger = () => inputRef.current?.click();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target.files || [])[0];
    let res;

    if (!file) {
      Message.error('请选择文件');
    } else if (types.length && types.every(type => !file.name.endsWith(`.${type}`))) {
      Message.error(`请选择 ${types.join(', ')} 类型的文件`);
    } else if (file.size > maxSize) {
      Message.error(`请选择不超过 ${formatFileSize(maxSize, 1024)} 的文件`);
    } else if (!(res = validator(file)).success) {
      Message.error(res.message);
    } else {
      uploadEmitter.emit('upload', { file, uploadKey, addToMateriel });
      onUploadStart && onUploadStart();
    }

    event.target.value = '';
    event.target.files = null;
  };

  return (
    <div className={classnames(style.uploadTrigger, className)} onClick={handleTrigger}>
      {children}
      <input ref={inputRef} hidden type="file" accept={accept} onChange={handleInputChange} />
    </div>
  );
};

interface FileUploaderProps {}

export interface UploadEventArgs {
  file: File;
  uploadKey: string;
  addToMateriel?: boolean;
}

export interface CompleteEventArgs {
  file: File;
  uploadKey: string;
  downloadUrl: string;
}

export interface MaterielAddedEventArgs {
  file: Partial<MaterielFile>;
  uploadKey: string;
}

export const FileUploader: React.FC<FileUploaderProps> = props => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const uploaderRef = useRef<Uploader | null>(null);
  const progressRef = useRef<number>(0);
  progressRef.current = progress;

  useEffect(() => {
    uploadEmitter.on('upload', ({ file, uploadKey, addToMateriel }: UploadEventArgs) => {
      if (progressRef.current) {
        return Message.error('有文件正在上传，请稍候');
      }
      setFile(file);
      const uploader = new Uploader(file);
      uploaderRef.current = uploader;

      uploader.on('start', () => {});
      uploader.on('progress', data => {
        setProgress(data.progress);
      });
      uploader.on('complete', data => {
        uploadEmitter.emit('complete', {
          file,
          uploadKey,
          downloadUrl: data.downloadUrl,
        } as CompleteEventArgs);
        if (addToMateriel) {
          materielApi
            .addFile({
              fileName: file.name,
              fileSize: file.size,
              fileLink: data.downloadUrl,
              fileType: 'FILE',
              parentFileId: '0',
              scope: 'PERSONAL',
            })
            .then(file => {
              uploadEmitter.emit('added', {
                file,
                uploadKey,
              } as MaterielAddedEventArgs);
              Message.success('上传成功');
              setFile(null);
              setProgress(0);
            });
        } else {
          Message.success('上传成功');
          setFile(null);
          setProgress(0);
        }
      });
      uploader.on('cancel', () => {
        Message.error('已取消上传');
        setFile(null);
        setProgress(0);
      });
      uploader.on('error', () => {
        Message.error('上传失败');
        setFile(null);
        setProgress(0);
      });
    });
  }, [uploadEmitter]);

  const handleUploadCancel = () => {
    Modal.confirm({
      title: '提示',
      content: '取消文件上传？',
      onOk: () => {
        if (uploaderRef.current?.status === UploadStatus.UPLOADING) {
          uploaderRef.current?.cancelUpload();
        } else {
          Message.error('无法取消，已上传完成');
        }
      },
    });
  };

  if (!file) return null;

  return createPortal(
    <Draggable bounds="body" handle={`.${style.header}`} cancel={`.${style.close}`}>
      <div className={style.fileUploader}>
        <div className={style.header}>
          <div className={style.title}>正在上传 1 项</div>
          <TongyongGuanbiXian wrapClassName={style.close} onClick={handleUploadCancel} />
        </div>
        <div className={style.file}>
          <div className={style.fileInfo}>
            <div className={style.name}>{file.name}</div>
            <div className={style.size}>{formatFileSize(file.size, 1024)}</div>
            <div className={style.progress}>{progress}%</div>
          </div>
          <div className={style.progressBar} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Draggable>,
    document.body
  );
};
