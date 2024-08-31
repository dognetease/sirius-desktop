/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Tooltip, Modal } from 'antd';
import classnames from 'classnames';
import { DownloadDisk, DownloadFileStatus } from '../../upload';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ModalClose';
import ErrorMark from '@web-common/components/UI/Icons/svgs/disk/ErrorMark';
import ClearIcon from '@web-common/components/UI/Icons/svgs/ClearSvg';
import PackUpIcon from '@web-common/components/UI/Icons/svgs/PackUpSvg';
import RetryIcon from '@web-common/components/UI/Icons/svgs/disk/Retry';
import { MessageFlagReaded as CompleteIcon } from '@web-im/common/icon/messageFlag';
import { getTrail } from '../../utils';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
export const SuspendButton: React.FC<any> = props => {
  const { total, failed, visible, showTransferList, completed, uploading } = props;
  return (
    <div
      className={classnames(styles.suspendButton, { [styles.hidden]: !visible })}
      onClick={() => {
        showTransferList && showTransferList();
      }}
    >
      <div className={styles.statWrap}>
        {completed === total ? <CompleteIcon /> : <IconCard type="boldDownload" />}
        <div>{completed === total ? getIn18Text('XIAZAIWANCHENG') : uploading}</div>
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
  fileItems: DownloadDisk[]; // 下载列表
  changeFileItems: (fileItems: DownloadDisk[]) => void;
  reDownload: (fileItem: DownloadDisk) => void; // 重新下载
  visibleUpload: boolean;
  setVisibleUpload?: (val: boolean) => void;
  setBtnVisible?: Function;
}
const Download: React.FC<FileListProps> = props => {
  const { fileItems, changeFileItems, reDownload, visibleUpload, setVisibleUpload, visible, setBtnVisible } = props;
  const [suspendVisible, setSuspendVisible] = useState<boolean>(false);
  useEffect(() => {
    setSuspendVisible(visibleUpload);
    setBtnVisible && setBtnVisible(visibleUpload);
  }, [visibleUpload]);
  const removeFile = (fileItem: DownloadDisk) => {
    fileItem.cancel();
    changeFileItems(fileItems.filter(item => item.id !== fileItem.id));
  };
  const operateFile = (fileItem: DownloadDisk) => {
    if (fileItem.status === DownloadFileStatus.DONE) {
      // TODO: view file
    } else if (fileItem.status === DownloadFileStatus.FAIL) {
      // retry
      reDownload(fileItem);
    }
  };
  const showTransferList = () => {
    setSuspendVisible(false);
    setBtnVisible && setBtnVisible(false);
    setVisibleUpload && setVisibleUpload(false);
  };
  const minimize = () => {
    setSuspendVisible(true);
    setBtnVisible && setBtnVisible(true);
    // setVisibleUpload && setVisibleUpload(true);
  };
  const cancelAll = () => {
    if (fileItems.every(item => item.status === DownloadFileStatus.DONE)) {
      changeFileItems([]);
      return;
    }
    Modal.confirm({
      title: getIn18Text('QUEDINGQUXIAOSUO'),
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        fileItems.forEach(i => i.cancel());
        changeFileItems([]);
      },
      width: 448,
      className: 'im-team',
      centered: true,
    });
  };
  const total = fileItems.length;
  const failed = fileItems.filter(item => item.status === DownloadFileStatus.FAIL).length;
  const completed = fileItems.filter(item => item.status === DownloadFileStatus.DONE).length;
  const uploading = total - failed - completed; // 下载中的数目
  let title = `下载中...(${uploading})`;
  if (uploading > 0) {
    title = `下载中...(${uploading})`;
  } else if (failed > 0) {
    title = `下载失败(${failed})`;
  } else if (completed === total) {
    title = getIn18Text('QUANBUXIAZAICHENG');
  }
  return (
    <div hidden={!visible} className={classnames(styles.fileListWrap)} style={{ order: suspendVisible ? 0 : 1 }}>
      {/* 当上传时隐藏下载列表 只展示这个 */}
      <SuspendButton uploading={uploading} completed={completed} total={total} failed={failed} visible={suspendVisible} showTransferList={showTransferList} />
      {/* 下载列表 */}
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
            let status = '';
            let operateIcon: JSX.Element = <></>;
            if (fileItem.status === DownloadFileStatus.DONE) {
              status = getIn18Text('XIAZAICHENGGONG');
              // operateIcon = <ViewIcon />;
            } else if (fileItem.status === DownloadFileStatus.FAIL) {
              status = getIn18Text('XIAZAISHIBAI');
              operateIcon = <RetryIcon />;
            } else {
              status = fileItem.downloadSpeed || getIn18Text('XIAZAIZHONG');
              // operateIcon = <PauseIcon />;
            }
            return (
              <div
                className={classnames([styles.uploadFileItem], {
                  [styles.uploadError]: fileItem.status === DownloadFileStatus.FAIL,
                })}
                key={fileItem.id}
              >
                <div className={styles.fileIcon}>
                  <IconCard type={getTrail(fileItem.name).toLocaleLowerCase() as IconMapKey} />
                  {fileItem.status === DownloadFileStatus.FAIL && (
                    <div className={styles.errorMark}>
                      <ErrorMark />
                    </div>
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{fileItem.name}</div>
                  <div className={styles.fileSize}>{fileItem.fileSize}</div>
                </div>
                <div className={styles.uploadStatus}>{status}</div>
                <div className={styles.uploadProgress}>{fileItem.progress || 0}%</div>
                <div
                  className={styles.operateIcon}
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
                  <ClearIcon />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default Download;
