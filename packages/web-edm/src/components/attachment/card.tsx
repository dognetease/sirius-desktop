import React, { useState } from 'react';
import IconCard from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import { AttachmentUploader, UploadFileStatus } from '../../attachment_upload';
import { getIn18Text, api, apis, FileApi } from 'api';
import { isImage, openDiskFile, openImgAttachment } from '@web-mail/utils/mailAttach';
import { message } from 'antd';
export interface IAttachmentState {
  id: string;
  type: number; // 0 普通附件 1 云附件
  status: UploadFileStatus; //before being success error
  fileName: string;
  fileType: string;
  uploadProgress: number; // 0 ~1
  fileSize: number;
  filePath?: string;
  serverData?: {
    identity: string;
    downloadUrl: string;
    expireTime: number;
  };
}
const statusToIconMap = {
  being: 'upload',
  error: 'error',
};
export interface IAttachmentProps {
  state: IAttachmentState;
  uploader?: AttachmentUploader;
  className?: string;
  removeFromList?: () => void;
}

const fileApi = api.requireLogicalApi(apis.defaultFileApi) as FileApi;
export const AttachmentItem = (props: IAttachmentProps) => {
  const [operateVisible, setOperateVisible] = useState(false);
  const attachmentItem = props.state;
  const leftIconType = statusToIconMap[attachmentItem.status];
  const { fileSize, filePath, status, fileType, fileName, type, serverData } = attachmentItem;

  const reUpload = () => {
    props.uploader?.continueUpload();
  };
  const removeFromList = () => {
    props.removeFromList && props.removeFromList();
  };
  const doAbort = () => {
    props.uploader?.cancelUpload();
    removeFromList();
  };

  const preview = () => {
    if (!serverData) {
      return;
    }
    if (process.env.BUILD_ISELECTRON && filePath) {
      fileApi.openFileFromDownload(filePath).then(res => {
        if (!res) {
          message.error('文件不存在');
        }
      });
      return;
    }
    if (isImage(fileName, fileType)) {
      openImgAttachment({
        downloadUrl: serverData.downloadUrl,
        previewUrl: serverData.downloadUrl,
        name: fileName,
        size: fileSize,
      });
      return;
    }
    openDiskFile({
      fileName,
      expireTime: serverData.expireTime || 0,
      identity: serverData.identity,
      fileSize,
      downloadUrl: serverData.downloadUrl,
    });
    return;
  };
  const opacity = [UploadFileStatus.FAIL, UploadFileStatus.UPLOADING, UploadFileStatus.INIT].includes(status);
  const visiblePreview = status === UploadFileStatus.DONE && serverData;
  return (
    <div
      className={`attachment-card ${status === UploadFileStatus.FAIL ? 'error' : ''} ${props.className || ''}`}
      onClick={() => {
        if (visiblePreview) {
          preview();
        }
      }}
      onMouseLeave={() => setOperateVisible(false)}
      onMouseEnter={() => setOperateVisible(true)}
    >
      <div className="content">
        <div className="info-icon">
          <IconCard type={fileType as any}></IconCard>
        </div>
        <div className="info-right">
          <div className={`info ${opacity ? 'info-opacity' : ''}`}>
            <div className="name">{fileName}</div>
          </div>
          <div className="operate">
            <div className="operate-item">
              <div className="size">{attachmentItem.fileSize > 0 ? formatFileSize(fileSize) : getIn18Text('WEIZHIDAXIAO')}</div>
              {type === 1 && <div className="netfolder-tag">{getIn18Text('YUNFUJIAN')}</div>}
              <div className={`item-box`} hidden={!operateVisible}>
                {status === UploadFileStatus.DONE && (
                  <>
                    {serverData && (
                      <span
                        className="item-ope"
                        onClick={e => {
                          e.stopPropagation();
                          preview();
                        }}
                      >
                        {getIn18Text(filePath ? 'DAKAI' : 'YULAN')}
                      </span>
                    )}
                    <span
                      className="item-ope"
                      onClick={e => {
                        e.stopPropagation();
                        removeFromList();
                      }}
                    >
                      {getIn18Text('SHANCHU')}
                    </span>
                  </>
                )}
                {status === UploadFileStatus.FAIL && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      reUpload();
                    }}
                  >
                    {getIn18Text('ZHONGSHI')}
                  </span>
                )}
                {(status === UploadFileStatus.FAIL || status === UploadFileStatus.UPLOADING) && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      doAbort();
                    }}
                  >
                    {getIn18Text('QUXIAO')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`process-box ${status === UploadFileStatus.UPLOADING ? '' : 'hide'}`}>
        <div className="process" style={{ width: attachmentItem.uploadProgress + '%' }}></div>
      </div>
    </div>
  );
};
