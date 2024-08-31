/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, ReactNode } from 'react';
import { Tooltip, Modal } from 'antd';
import classnames from 'classnames';
import { UploadFileStatus, IUploadFile } from '../../upload';
// import { UploadFile } from '../Upload';
// import UploadBtnIcon from '../../../../UI/Icons/svgs/disk/UploadBtn';
import ErrorMark from '@web-common/components/UI/Icons/svgs/disk/ErrorMark';
import RetryIcon from '@web-common/components/UI/Icons/svgs/disk/Retry';
import ContinueIcon from '@web-common/components/UI/Icons/svgs/disk/Continue';
import ViewIcon from '@web-common/components/UI/Icons/svgs/disk/View';
import PauseIcon from '@web-common/components/UI/Icons/svgs/disk/Pause';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ModalClose';
import ClearIcon from '@web-common/components/UI/Icons/svgs/ClearSvg';
import PackUpIcon from '@web-common/components/UI/Icons/svgs/PackUpSvg';
import InfoIcon from '@web-common/components/UI/Icons/svgs/disk/Info';
import { MessageFlagReaded as CompleteIcon } from '@web-im/common/icon/messageFlag';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { truncateMiddle } from '@web-common/utils/utils';
import styles from './fileList.module.scss';
import { getIn18Text } from 'api';
interface SuspendButtonProps {
  total: number;
  failed: number;
  uploading: number;
  completed: number;
  visible: boolean;
  showTransferList: () => void;
}
export const SuspendButton: React.FC<SuspendButtonProps> = props => {
  const { total, failed, uploading, completed, visible, showTransferList } = props;
  return (
    <div
      className={classnames(styles.suspendButton, { [styles.hidden]: !visible })}
      onClick={() => {
        showTransferList && showTransferList();
      }}
    >
      <div className={styles.statWrap}>
        {completed === total ? <CompleteIcon /> : <IconCard type="boldUpload" />}
        <div>{completed === total ? getIn18Text('SHANGCHUANWANCHENG') : uploading}</div>
      </div>
      {failed > 0 && (
        <div className={classnames(styles.statWrap, styles.failed)}>
          <ErrorMark />
          <div>{failed}</div>
        </div>
      )}
    </div>
  );
};
interface FileListProps {
  visible: boolean;
  fileItems: IUploadFile[];
  changeFileItems: (fileItems: IUploadFile[]) => void;
  visibleUpload: boolean;
  setVisibleUpload: (val) => void;
  setBtnVisible: Function;
}
const FileList: React.FC<FileListProps> = props => {
  const { fileItems, changeFileItems, visibleUpload, setVisibleUpload, visible, setBtnVisible } = props;
  const [suspendVisible, setSuspendVisible] = useState<boolean>(false);
  useEffect(() => {
    setSuspendVisible(!visibleUpload);
    setBtnVisible(!visibleUpload);
  }, [visibleUpload]);
  const removeFile = (fileItem: IUploadFile) => {
    if (fileItem.abortUpload && fileItem.status === UploadFileStatus.UPLOADING) {
      fileItem.abortUpload();
    }
    fileItem.status = UploadFileStatus.PAUSE;
    const curFileItems = fileItems.filter(item => item !== fileItem);
    changeFileItems(curFileItems);
  };
  const removeAll = () => {
    fileItems.forEach(item => {
      if (item.abortUpload && item.status === UploadFileStatus.UPLOADING) {
        item.abortUpload();
      }
      item.status = UploadFileStatus.PAUSE;
    });
    changeFileItems([]);
  };
  const operateFile = (fileItem: IUploadFile) => {
    const list = fileItems.slice();
    if (fileItem.status === UploadFileStatus.DONE) {
      // view file
      if (fileItem.openFile) {
        fileItem.openFile();
      }
    } else if (fileItem.status === UploadFileStatus.FAIL) {
      // retry
      fileItem.continueUpload();
    } else if (fileItem.status === UploadFileStatus.PAUSE) {
      // continue
      fileItem.continueUpload();
    } else if (fileItem.status === UploadFileStatus.CONVERTING) {
      // nothing to do
    } else {
      // UploadConvert 实例有 openFile 方法，导入文件不能暂停
      if (!fileItem.openFile) {
        // pause
        fileItem.status = UploadFileStatus.PAUSE;
      }
    }
    changeFileItems(list);
  };
  const showTransferList = () => {
    setSuspendVisible(false);
    setBtnVisible(false);
    setVisibleUpload(true);
  };
  const minimize = () => {
    setSuspendVisible(true);
    setBtnVisible(true);
    // setVisibleUpload(false);
  };
  const cancelAll = () => {
    if (fileItems.filter(item => item.status === UploadFileStatus.UPLOADING || item.status === UploadFileStatus.PAUSE).length > 0) {
      Modal.confirm({
        title: getIn18Text('QUEDINGQUXIAOSUO11'),
        okText: getIn18Text('QUEDING'),
        cancelText: getIn18Text('QUXIAO'),
        onOk: removeAll,
        width: 448,
        className: 'im-team',
        centered: true,
      });
    } else {
      removeAll();
    }
  };
  const total = fileItems.length;
  const failed = fileItems.filter(item => item.status === UploadFileStatus.FAIL).length;
  const completed = fileItems.filter(item => item.status === UploadFileStatus.DONE).length;
  const uploading = total - failed - completed;
  let title = `上传中...(${fileItems.length})`;
  if (uploading > 0) {
    title = `上传中...(${uploading})`;
  } else if (failed > 0) {
    title = `上传失败(${failed})`;
  } else if (completed === total) {
    title = getIn18Text('QUANBUSHANGCHUANCHENG');
  }
  return (
    <div hidden={!visible} className={classnames(styles.fileListWrap)} style={{ order: suspendVisible ? 0 : 1 }}>
      <SuspendButton total={total} failed={failed} uploading={uploading} completed={completed} visible={suspendVisible} showTransferList={showTransferList} />
      <div className={classnames(styles.uploadBox, { [styles.hidden]: suspendVisible })}>
        <div className={styles.uploadTitleBar}>
          <div className={styles.uploadTitle}>{title}</div>
          <div className={styles.uploadBtnBox}>
            <Tooltip title={getIn18Text('ZUIXIAOHUA')} mouseLeaveDelay={0} overlayClassName="team-setting-tooltip">
              <div className={styles.packUpIcon} onClick={minimize}>
                <PackUpIcon />
              </div>
            </Tooltip>
            <div className={styles.closeIcon} onClick={cancelAll}>
              <CloseIcon />
            </div>
          </div>
        </div>
        <div className={styles.uploadFileList}>
          {fileItems.map(fileItem => {
            let status = '' as ReactNode;
            let operateIcon: JSX.Element = <></>;
            const clearIcon: JSX.Element = (
              <Tooltip
                title={
                  fileItem.status === UploadFileStatus.PAUSE || fileItem.status === UploadFileStatus.UPLOADING
                    ? getIn18Text('QUXIAOSHANGCHUAN')
                    : getIn18Text('SHANCHUJILU')
                }
              >
                <div className={styles.clearIcon}>
                  <ClearIcon />
                </div>
              </Tooltip>
            );
            // 操作icon样式是否设置成dummy(没有hover特效)
            let isDummyOperateIcon = true;
            if (fileItem.status === UploadFileStatus.DONE) {
              if (fileItem.successInfo) {
                status = (
                  <Tooltip overlayStyle={{ maxWidth: '300px' }} className={styles.flexAlign} title={fileItem.successInfo}>
                    <InfoIcon stroke="#262a33" />
                    {getIn18Text('SHANGCHUANCHENGGONG')}
                  </Tooltip>
                );
              } else {
                status = getIn18Text('SHANGCHUANCHENGGONG');
              }
              // operateIcon = <ViewIcon />;
              if (fileItem.openFile) {
                isDummyOperateIcon = false;
                operateIcon = (
                  <Tooltip title={getIn18Text('CHAKAN')}>
                    <div className={styles.viewIcon}>
                      <ViewIcon />
                    </div>
                  </Tooltip>
                );
              }
            } else if (fileItem.status === UploadFileStatus.FAIL) {
              if (fileItem.failedReason) {
                status = (
                  <Tooltip className={styles.flexAlign} title={fileItem.failedReason}>
                    <ErrorMark />
                    {getIn18Text('SHANGCHUANSHIBAI')}
                  </Tooltip>
                );
              } else {
                status = getIn18Text('SHANGCHUANSHIBAI');
              }
              isDummyOperateIcon = false;
              operateIcon = (
                <Tooltip title={getIn18Text('ZHONGSHI')}>
                  <div className={styles.retryIcon}>
                    <RetryIcon />
                  </div>
                </Tooltip>
              );
            } else if (fileItem.status === UploadFileStatus.PAUSE) {
              status = getIn18Text('ZANTING');
              isDummyOperateIcon = false;
              operateIcon = (
                <Tooltip title={getIn18Text('JIXU')}>
                  <div className={styles.continueIcon}>
                    <ContinueIcon />
                  </div>
                </Tooltip>
              );
            } else if (fileItem.status === UploadFileStatus.CONVERTING) {
              status = getIn18Text('ZHUANHUANZHONG');
            } else {
              // fileItem.status === UploadFileStatus.UPLOADING
              status = fileItem.uploadSpeed || getIn18Text('SHANGCHUANZHONG');
              if (!fileItem.openFile) {
                isDummyOperateIcon = false;
                operateIcon = (
                  <Tooltip title={getIn18Text('ZANTING')}>
                    <div className={styles.pauseIcon}>
                      <PauseIcon />
                    </div>
                  </Tooltip>
                );
              }
            }
            const showName = truncateMiddle(fileItem.file.name, 4, 7);
            return (
              <div
                className={classnames([styles.uploadFileItem], {
                  [styles.uploadError]: fileItem.status === UploadFileStatus.FAIL,
                })}
                key={fileItem.id}
              >
                <div className={styles.fileIcon}>
                  <IconCard type={fileItem.fileType as IconMapKey} />
                  {fileItem.status === UploadFileStatus.FAIL && (
                    <div className={styles.errorMark}>
                      <ErrorMark />
                    </div>
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{showName}</div>
                  <div className={styles.fileSize}>{fileItem.fileSize}</div>
                </div>
                <div className={styles.uploadStatus}>{status}</div>
                <div className={styles.uploadProgress}>{fileItem.progress || 0}%</div>
                <div
                  className={isDummyOperateIcon ? styles.dummyOperateIcon : styles.operateIcon}
                  onClick={() => {
                    operateFile(fileItem);
                  }}
                >
                  {operateIcon}
                </div>
                <div
                  className={styles.removeIcon}
                  onClick={() => {
                    removeFile(fileItem);
                  }}
                >
                  {clearIcon}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default FileList;
