import React, { useContext, useEffect, useState, useRef } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, File, FileAttachModel, apis } from 'api';
import { Progress } from 'antd';
import { FileMessageCustomEvent, Context as MessageContext } from '../store/messageProvider';
import style from '../imChatList.module.scss';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import { useRequestImgList } from '../../common/hooks/useRequestImglist';
import { isGifOrBlobOrIco, getThumbnailBenchmark, getThumbnailImg } from '../../common/imgVideoHandle';
import { ChatTypeUploadingFile } from './chatItemFile';

const nimApi = apiHolder.api.requireLogicalApi(apis.imApiImpl);

const fileApi = apiHolder.api.getFileApi();

const realStyle = classnames.bind(style);

interface CustomMsg {
  customFile?: File;
}

interface ChatTypeUploadingVideoApi {
  msg: IMMessage;
  token: UploadVideoApi;
  fileInfo: File;
}

export const ChatTypeUploadingVideo: React.FC<ChatTypeUploadingVideoApi> = props => {
  const { msg, fileInfo, token: uploadToken } = props;
  // 上传状态
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('INIT');

  const [uploadPercent, setUploadPercent] = useState<number>(0);

  // 视频节点
  const videoRef = useRef<HTMLVideoElement>(null);

  // 是否支持播放，默认为true，才能触发onLoadedMetadata
  const [support, setSupport] = useState<boolean>(true);

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

  // 上传视频是否支持播放的判断
  const onLoadVideo = () => {
    // videoWidth为0是只播放声音没有画面的情况（编码不支持）
    setSupport(!!videoRef.current?.videoWidth);
  };

  return (
    <div className={realStyle('msgVideoWrapper')}>
      {support ? (
        <>
          <video ref={videoRef} src={fileInfo.url} controls={false} className={realStyle('msgVideoContent')} onLoadedMetadata={() => onLoadVideo()} />
          {/* 上传进度 */}
          {uploadStatus !== 'INIT' && (
            <div className={realStyle('msgVideoProgress')}>
              {/* 取消上传 */}
              {uploadStatus === 'ING' && (
                <span
                  className={realStyle('msgVideoProgressIcon')}
                  onClick={e => {
                    e.preventDefault();
                    cancelUpload();
                  }}
                />
              )}
              <Progress
                type="circle"
                status="exception"
                percent={uploadPercent}
                showInfo={false}
                strokeColor="#fff"
                trailColor="rgba(103, 106, 112, 0.2)"
                strokeWidth={6}
                width={48}
              />
            </div>
          )}
        </>
      ) : (
        <ChatTypeUploadingFile msg={msg} fileInfo={fileInfo} token={uploadToken} />
      )}
    </div>
  );
};

interface ChatVideoApi {
  msg: CustomMsg & IMMessage;
  testId?: string;
}

interface UploadVideoApi {
  sn: string;
  abort: (...params: any[]) => void;
  onError: (...params: any) => void;
}

type UploadStatus = 'INIT' | 'ING' | 'SUCCESS' | 'FAILED';
export const ChatTypeVideo: React.FC<ChatVideoApi> = props => {
  const { msg, testId = '' } = props;
  const [files, setFiles] = useState<any>(undefined);
  const [canPlay, setCanPlay] = useState<boolean>(false);
  const handleDownloadFile = () => {
    const url = `${msg?.file?.url}?download=${msg?.file?.name}` || '';
    const items = {
      fileName: msg?.file?.name || '',
      fileType: msg?.file?.ext || '',
      fileSize: msg?.file?.size || 0,
      fileSourceType: 2,
      fileUrl: url,
      fileOriginUrl: url,
      type: msg?.type,
    } as FileAttachModel;
    const file = fileApi.registerTmpFile(items);
    setFiles(file as any);
  };

  useEffect(() => {
    handleDownloadFile();
  }, [msg]);

  const previewList = useRequestImgList();

  const videoPreview = async () => {
    // 获取所有图片及视频，用户预览弹窗轮播
    const index = previewList.findIndex(item => item.url === msg?.file?.url);
    if (index === -1) {
      ImagePreview.preview({
        data: [
          {
            previewUrl: msg?.file?.url || '',
            downloadUrl: msg?.file?.url,
            name: msg?.file?.name || '',
            size: msg?.file?.size || 0,
            fileSourceType: 2,
            type: msg?.type,
            ext: msg?.file?.ext,
          },
        ],
        startIndex: 0,
      });
      return;
    }
    ImagePreview.preview({
      data: await Promise.all(
        previewList.map(async item => {
          const baseMark = item?.type === 'image' && !isGifOrBlobOrIco(item) ? getThumbnailBenchmark(item?.fileSize, item?.fileHeight, item?.fileWidth, 600) : 0;
          const newImgUrl = await getThumbnailImg(item?.url || '', {
            height: baseMark,
            width: baseMark,
          });
          return {
            previewUrl: baseMark ? newImgUrl : item?.url,
            downloadUrl: item?.url,
            name: item?.fileName,
            size: item?.fileSize,
            fileSourceType: item?.fileSourceType,
            type: item?.type,
            ext: item?.ext,
            presetSize: [
              {
                url: item?.url,
                width: item?.fileWidth,
                height: item?.fileHeight,
              },
            ],
          };
        })
      ),
      startIndex: index,
    });
  };

  return (
    <div className={realStyle('msgVideoOuter')} data-test-id={testId}>
      {files && (
        <div className={canPlay ? realStyle('msgVideoWrapper') : realStyle('msgVideoWrapperInit')} onClick={videoPreview}>
          <video
            className={realStyle('msgVideoContent')}
            src={files.fileUrl}
            controls={false}
            onContextMenu={() => false}
            // 当前帧可用再展示，避免闪动
            onCanPlay={() => setCanPlay(true)}
          ></video>
          <span className={realStyle('msgVideoIcon')} />
        </div>
      )}
    </div>
  );
};
