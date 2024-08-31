/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  NetStorageApi,
  NetStorageType,
  ApiRequestConfig,
  ResponseNSUploadInfo,
  RequestNSUploadInfo,
  StoredSequence,
  DataStoreApi,
  api,
  StoredLock,
} from 'api';
import Modal, { modalProps } from '@web-common/components/UI/Modal/SiriusModal';
import { UploadFileStatus, sliceSize, uploadHost, IUploadFile } from '../../upload';
import { getFileExt, formatFileSize, toFixed } from '@web-common/utils/file';
import { truncateMiddle } from '@web-common/utils/utils';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import ClearIcon from '@web-common/components/UI/Icons/svgs/ClearSvg';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const httpApi = apiHolder.api.getDataTransApi();
const eventApi = apiHolder.api.getEventApi();
const DISK_CLOUD_UPLOAD_LOCK = 'diskCloudFileUploadLock';
export const toastUploadPrivilegeError = (title = getIn18Text('ZANWUSHANGCHUANQUAN')) => {
  Modal.error({
    ...modalProps,
    width: 448,
    className: 'disk-error',
    title,
    okText: getIn18Text('ZHIDAOLE'),
    // icon: <ErrorIcon className={styles.errorIcon} />,
    icon: '',
  });
};
export type SizeLimitType = 'dir' | 'disk';
interface SizeLimitProps {
  remainSize?: number;
  curFileSize?: number;
  limitType?: SizeLimitType;
}
export const SizeLimitErrorContent: React.FC<SizeLimitProps> = props => {
  const { remainSize = 0, curFileSize = 0, limitType = 'dir' } = props;
  return (
    <div className={styles.errorBox}>
      <div className={styles.errorInfo}>
        {limitType === 'dir' ? getIn18Text('WENJIANJIASHENGYU') : getIn18Text('SHENGYUZONGRONGLIANG')}：
        <span className={styles.highlight}>{formatFileSize(remainSize)}</span>
      </div>
      <div className={styles.errorInfo}>
        {getIn18Text('DANGQIANTIANJIAWEN')}
        <span className={curFileSize <= remainSize ? styles.ok : styles.highlight}>{formatFileSize(curFileSize)}</span>
      </div>
    </div>
  );
};
interface UploadFailProps extends SizeLimitProps {
  files: File[];
  removeFile: (file: File) => void;
  singleFileMode?: boolean;
}
export const UploadFail: React.FC<UploadFailProps> = props => {
  const { files, remainSize, removeFile, limitType, singleFileMode } = props;
  const curFileSize = files.reduce((count, cur) => count + cur.size, 0);
  return (
    <div className={styles.uploadFailContent}>
      <SizeLimitErrorContent remainSize={remainSize} curFileSize={curFileSize} limitType={limitType} />
      {!singleFileMode && (
        <div className={styles.uploadFileList}>
          {files.map(file => (
            <div key={file.name} className={styles.uploadFileItem}>
              {truncateMiddle(file.name, 8, 12)}（<span className={styles.uploadFileSize}>{formatFileSize(file.size)}</span>）
              <div
                className={styles.removeIcon}
                onClick={() => {
                  removeFile(file);
                }}
              >
                <ClearIcon />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export interface UploadFailInfo {
  files?: File[];
  fileSize?: number;
  // title?: string;
  sizeLimit?: number;
  onCancel?: (e: any) => void;
  limitType?: SizeLimitType;
}
interface UploadFailModalProps {
  visible: boolean;
  uploadFailInfo: UploadFailInfo;
  closeModal: () => void;
}
// 上传失败model
export const UploadFailModal: React.FC<UploadFailModalProps> = props => {
  const { uploadFailInfo, visible, closeModal } = props;
  const { files: oriFiles, sizeLimit, fileSize, onCancel, limitType } = uploadFailInfo;
  const [files, setFiles] = useState<File[]>([]);
  useEffect(() => {
    if (oriFiles?.length) {
      setFiles(oriFiles);
    }
  }, [oriFiles]);
  const removeFile = (file: File) => {
    setFiles(files => files.filter(item => item !== file));
  };
  const singleFileMode = oriFiles?.length === 1;
  const title = `操作失败，${limitType === 'dir' ? getIn18Text('WENJIANJIARONGLIANG') : getIn18Text('KONGJIANZONGRONGLIANG')}受限。${
    singleFileMode ? getIn18Text('NINKELIANXIGUAN') : getIn18Text('QINGSHIDANGSHANJIAN')
  }`;
  return (
    <Modal
      maskClosable={false}
      closable={false}
      width={448}
      className={classnames('disk-error-modal', singleFileMode ? styles.singleFile : '')}
      title={
        <>
          <ErrorIcon className={styles.errorIcon} />
          <span className="ant-modal-confirm-title">{title}</span>
        </>
      }
      okText={getIn18Text('ZHIDAOLE')}
      cancelText={getIn18Text('ZHONGSHI')}
      onCancel={() => {
        closeModal && closeModal();
        onCancel && onCancel(files);
      }}
      cancelButtonProps={{ disabled: files?.length === 0, hidden: singleFileMode }}
      onOk={closeModal}
      visible={visible}
    >
      <UploadFail files={files} curFileSize={fileSize} remainSize={sizeLimit} removeFile={removeFile} limitType={limitType} singleFileMode={singleFileMode} />
    </Modal>
  );
};
// 上传体
export class UploadFile implements IUploadFile {
  file: File;
  status: UploadFileStatus;
  id: string;
  fileType: string;
  fileSize: string;
  uploadSpeed?: string;
  storeApi: DataStoreApi;
  md5?: string;
  progress?: number;
  sliceUploadStartTime?: number;
  offset: number;
  dirId?: number;
  diskType: NetStorageType;
  uploadInfo?: ResponseNSUploadInfo;
  cb?: Function;
  removeCb?: Function;
  fileReader: FileReader;
  sequence: StoredSequence;
  uploadLock: StoredLock;
  constructor(file: File, dirId, diskType, cb?: Function, removeCb?: Function) {
    const md5 = systemApi.md5(file.name + file.size); // TODO:
    this.file = file;
    this.status = UploadFileStatus.UPLOADING;
    this.storeApi = api.getDataStoreApi();
    this.sequence = this.storeApi.getSeqHelper('disk-cloud-upload', 0);
    this.md5 = md5;
    this.id = md5 + Date.now();
    this.fileType = getFileExt(file.name);
    this.fileSize = formatFileSize(file.size);
    this.offset = 0;
    this.progress = 0;
    this.sliceUploadStartTime = Date.now();
    this.dirId = dirId;
    this.diskType = diskType || 'personal'; // ?
    this.cb = cb;
    this.removeCb = removeCb;
    this.fileReader = new FileReader();
    const name = DISK_CLOUD_UPLOAD_LOCK + '-0' + (((this.sequence.next() || 0) % 3) + 1);
    this.uploadLock = this.storeApi.getLock(name, 20 * 60 * 1000 + 10, false, true);
  }
  async startUpload() {
    const option: RequestNSUploadInfo = {
      fileName: this.file.name,
      fileSize: this.file.size,
      type: this.diskType,
      dirId: this.dirId,
      md5: this.md5,
    };
    await this.uploadLock.lock(this.md5);
    diskApi
      .doGetNSUploadInfo(option, { timeout: 60000 * 3 })
      .then(data => {
        this.uploadInfo = data;
        this.fileReader.onload = e => {
          this.uploadSlice(e.target?.result as ArrayBuffer);
        };
        this.fileReader.onerror = e => {
          this.status = UploadFileStatus.FAIL;
        };
        this.status = UploadFileStatus.UPLOADING;
        this.uploadNext();
      })
      .catch(_ => {
        this.status = UploadFileStatus.FAIL;
        this.uploadLock.unlock();
        this.cb && this.cb(this);
      });
  }
  uploadSlice(slice: ArrayBuffer) {
    const { dirId, offset, status, uploadInfo, diskType } = this;
    if (!slice || !uploadInfo) return;
    if (status !== UploadFileStatus.UPLOADING) return;
    const { bucketName, nosKey, context = '', token, fileId } = uploadInfo;
    const isComplete = slice.byteLength + offset === this.file.size;
    const uploadUrl = `https://${uploadHost}/${bucketName}/${nosKey}`;
    const config: ApiRequestConfig = {
      contentType: 'stream',
      headers: {
        'x-nos-token': token,
      },
      params: {
        offset,
        complete: isComplete,
        context,
        version: '1.0',
      },
    };
    httpApi
      .post(uploadUrl, slice, config)
      .then(ret => {
        console.log('🚀 ~ file: index.ts ~ line 246 ~ httpApi.post ~ ret', ret);
        if (ret.status === 200) {
          // 上传完成
          if (isComplete) {
            const { size, name } = this.file;
            const finishOption =
              diskType === 'cloudAtt'
                ? {
                    fileId,
                    nosKey,
                    fileSize: size,
                  }
                : {
                    dirId,
                    fileId,
                    nosKey,
                    fileSize: size,
                    type: diskType,
                    fileName: name,
                  };
            const method = diskType === 'cloudAtt' ? 'finishUploadAtt' : 'doSetNSUploadFinish';
            diskApi[method](finishOption)
              .then(ret => {
                this.progress = 100;
                this.status = UploadFileStatus.DONE;
                // 刷新容量信息
                eventApi.sendSysEvent({
                  eventName: 'diskInnerCtc',
                  eventStrData: '',
                  eventData: {
                    name: 'refreshVolume',
                  },
                });
                this.uploadLock.unlock();
                this.cb && this.cb(this);
              })
              .catch(e => {
                console.log('finishUploadAtt err', e);
                this.status = UploadFileStatus.FAIL;
                this.uploadLock.unlock();
                this.cb && this.cb(this);
              });
          } else {
            const { data } = ret;
            this.uploadInfo.context = data.context;
            this.offset = data.offset;
            this.progress = toFixed((this.offset * 100) / this.file.size, 1);
            this.uploadSpeed = `${formatFileSize((slice.byteLength * 1000) / (Date.now() - (this.sliceUploadStartTime || 0)))}/s`;
            this.sliceUploadStartTime = Date.now();
            this.cb && this.cb(this);
            this.uploadNext();
          }
        } else {
          this.status = UploadFileStatus.FAIL;
          this.uploadLock.unlock();
          this.cb && this.cb(this);
        }
      })
      .catch(_ => {
        this.status = UploadFileStatus.FAIL;
        this.uploadLock.unlock();
        this.cb && this.cb(this);
      });
  }
  uploadNext = () => {
    const blobSlice = File.prototype.slice;
    this.fileReader.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + sliceSize));
  };
  continueUpload = () => {
    if (!this.uploadInfo) {
      this.startUpload();
    } else {
      this.status = UploadFileStatus.UPLOADING;
      this.uploadNext();
    }
  };
}
