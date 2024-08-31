import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, File, FileAttachModel, apis } from 'api';
import { Progress } from 'antd';
import { FileMessageCustomEvent, Context as MessageContext } from '../store/messageProvider';
import style from '../imChatList.module.scss';
import Icon from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import DownloadCard from '@web-common/components/UI/DownloadCard';
import lodashGet from 'lodash/get';
// import {  } from 'api/src';
// import { FileAttachModel } from 'api/src';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi(apis.imApiImpl);
const fileApi = apiHolder.api.getFileApi();
const realStyle = classnames.bind(style);
interface CustomMsg {
  customFile?: File;
}
interface ChatTypeUploadingFileApi {
  msg: IMMessage;
  token: UploadFileApi;
  fileInfo: File;
}
export const ChatTypeUploadingFile: React.FC<ChatTypeUploadingFileApi> = props => {
  const { msg, fileInfo, token: uploadToken } = props;
  // 上传状态
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('INIT');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const { deleteLocalMsg } = useContext(MessageContext);
  const onUploading = (msgId, ...args) => {
    if (msgId !== msg.idClient) {
      return;
    }
    const { percentage } = args[0];
    setUploadStatus('ING');
    setUploadPercent(percentage);
  };
  const onUploadComplete = (msgId, ...args) => {
    if (msgId !== msg.idClient) {
      return;
    }
    const [error] = args;
    if (error === null) {
      setUploadStatus('SUCCESS');
      // 释放连接
      URL.revokeObjectURL(fileInfo.url);
    } else {
      setUploadStatus('FAILED');
      deleteLocalMsg(msg);
    }
  };
  // 取消上传
  const cancelUpload = () => {
    try {
      uploadToken && uploadToken.abort();
    } catch (ex) {}
    // 删除当前本地消息
    deleteLocalMsg(msg);
  };
  useEffect(() => {
    // 监听上传进度
    nimApi.subCustomEvent(FileMessageCustomEvent.UPLOAD_PROGRESS, onUploading);
    // 监听下载完成
    nimApi.subCustomEvent(FileMessageCustomEvent.UPLOAD_COMPLETE, onUploadComplete, { once: true });
    return () => {
      nimApi.offCustomEvent(FileMessageCustomEvent.UPLOAD_PROGRESS, onUploading);
      nimApi.offCustomEvent(FileMessageCustomEvent.UPLOAD_COMPLETE, onUploadComplete);
    };
  }, []);
  return (
    <div className={realStyle('msgFileWrapper')}>
      <div className={realStyle('fileInfo')}>
        <span className={realStyle('fileIcon')}>
          <Icon type={fileInfo?.ext || ''} />
        </span>

        <p className={realStyle('fileName')}>
          {/* 超过8个字符才显示 */}
          {fileInfo.name.length > 8 && <span className={realStyle('left')}>{fileInfo.name.substring(0, fileInfo.name.length - 8)}</span>}
          <span className={realStyle('right')}>{fileInfo.name.substring(fileInfo.name.length - 8, fileInfo.name.length)}</span>
        </p>
      </div>
      <div className={realStyle('fileOperation')}>
        <span className={realStyle('status', uploadStatus.toLocaleLowerCase())} />

        <span className={realStyle('fileSize')}>{formatFileSize(fileInfo.size || 0, 1024)}</span>
        {/* 取消上传 */}
        {uploadStatus === 'ING' && (
          <a
            onClick={e => {
              e.preventDefault();
              cancelUpload();
            }}
            className={realStyle('fileAction', 'cancel')}
          >
            {getIn18Text('QUXIAO')}
          </a>
        )}
      </div>
      {/* 上传进度 */}
      {uploadStatus !== 'INIT' && (
        <div className={realStyle('uploadProgressWrapper')}>
          <Progress percent={uploadPercent} showInfo={false} strokeColor="#386EE7" strokeLinecap="square" trailColor="rgba(38, 42, 51, 0.1)" strokeWidth={3} />
        </div>
      )}
    </div>
  );
};
interface ChatFileApi {
  msg: CustomMsg & IMMessage;
  testId?: string;
}
interface UploadFileApi {
  sn: string;
  abort: (...params: any[]) => void;
  onError: (...params: any) => void;
}
type UploadStatus = 'INIT' | 'ING' | 'SUCCESS' | 'FAILED';
export const ChatTypeFile: React.FC<ChatFileApi> = props => {
  const { msg, testId = '' } = props;
  const [files, setFiles] = useState<any>(undefined);
  // 检测本地是否有同名文件
  const syncRequestFileInfo = async () => {
    const url = `${msg?.file?.url}` || '';
    let fileName = lodashGet(msg, 'file.name', '');
    try {
      const closeFileNames = await fileApi.getFileInfoByFileName(msg?.file?.name || '');
      console.log('[chatTypeFile]', closeFileNames);
      const reg = /^(.+?)(\.[\w\d]+)?$/;
      if (closeFileNames.length) {
        fileName = fileName.replace(reg, `$1(${closeFileNames.length})$2`);
      }
    } catch (ex) {}
    return {
      fileName: fileName,
      fileType: msg?.file?.ext || '',
      fileSize: msg?.file?.size || 0,
      fileSourceType: 2,
      fileUrl: url,
      fileOriginUrl: url,
      fileGeneralType: msg?.type,
    } as FileAttachModel;
  };
  const handleDownloadFile = async () => {
    const url = `${msg?.file?.url}` || '';
    const items = {
      fileName: msg?.file?.name || '',
      fileType: msg?.file?.ext || '',
      fileSize: msg?.file?.size || 0,
      fileSourceType: 2,
      fileUrl: url,
      fileOriginUrl: url,
      fileGeneralType: msg?.type,
    } as FileAttachModel;
    const file = fileApi.registerTmpFile(items);
    setFiles(file as any);
  };
  useEffect(() => {
    handleDownloadFile();
  }, [msg]);
  const cancelDownload = () => {
    SiriusMessage.info({ content: getIn18Text('JINGQINGQIDAI') }).then();
  };
  return (
    <div date-test-id={testId} style={{ overflow: 'initial' }}>
      {files && <DownloadCard syncRequestFileInfo={syncRequestFileInfo} from="chat" downloadInfo={files} />}
    </div>
  );
};
