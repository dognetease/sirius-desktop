import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { SnsMarketingMedia, SnsMarketingMediaType } from 'api';
import { getFileExt } from '../utils';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import ImageCropper from './ImageCropper';
import { formatFileSize } from '@web-common/utils/file';
import { Uploader } from '../utils/uploader';
import { ReactComponent as MediaDelete } from '@web-sns-marketing/images/media-delete.svg';
import { ReactComponent as MediaLoading } from '@web-sns-marketing/images/media-loading.svg';
import { ReactComponent as MediaUpload } from '@web-sns-marketing/images/media-upload.svg';
import { ReactComponent as AiTipIcon } from '@web-sns-marketing/images/ai-tip-white.svg';
import { ReactComponent as PlayVideo } from '@web-sns-marketing/images/play-video.svg';
import { POST_RULE } from '../utils/rules';
import style from './MediaList.module.scss';
interface MediaListProps {
  className?: string;
  mediaList?: SnsMarketingMedia[];
  maxMediaCount?: number;
  itemGap?: number;
  itemSize?: number;
  disabled?: boolean;
  deletable?: boolean;
  uploadable?: boolean;
  aiReplaceable?: boolean;
  maxPreviewCount?: number;
  onChange?: (list: SnsMarketingMedia[]) => void;
  onAiReplaceClick?: (index: number) => void;
  mediaType?: SnsMarketingMediaType;
  onUploading?: (val: boolean) => void;
}

export const getRules = (mediaType: SnsMarketingMediaType) => {
  switch (mediaType) {
    case SnsMarketingMediaType.VIDEO: {
      return {
        types: POST_RULE.videoTypes,
        maxSize: POST_RULE.videoMaxSize,
        maxCount: POST_RULE.videoMaxCount,
      };
    }
    default: {
      return {
        types: POST_RULE.imageTypes,
        maxSize: POST_RULE.imageMaxSize,
        maxCount: POST_RULE.imageMaxCount,
      };
    }
  }
};

const MediaList: React.FC<MediaListProps> = props => {
  const {
    className,
    mediaList: mediaListFromProps,
    mediaType = SnsMarketingMediaType.IMAGE,
    // maxMediaCount = POST_RULE.imageMaxCount,
    itemGap = 16,
    itemSize = 74,
    disabled,
    deletable,
    uploadable,
    aiReplaceable,
    maxPreviewCount = Infinity,
    onChange,
    onAiReplaceClick,
    onUploading,
  } = props;

  const isVideo = mediaType === SnsMarketingMediaType.VIDEO;
  const { types, maxCount, maxSize } = getRules(mediaType);
  const [mediaList, setMediaList] = useState<
    (SnsMarketingMedia & {
      id: number;
      file: File | null;
      complete: boolean;
      uploading: boolean;
    })[]
  >([]);

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropVisible, setCropVisible] = useState<boolean>(false);
  const [showVideoPlay, setShowVideoPlay] = useState(true);

  useEffect(() => {
    const now = Date.now();

    setMediaList(
      (mediaListFromProps || []).map((item, index) => ({
        ...item,
        id: now + index,
        file: null,
        complete: true,
        uploading: false,
      }))
    );
  }, [mediaListFromProps]);

  const uploadRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const handleInputClear = () => {
      event.target.value = '';
      event.target.files = null;
    };
    const file = (event.target.files || [])[0];

    if (file) {
      onUploading?.(true);
      const ext = getFileExt(file);
      const hasSizeError = file.size > maxSize;
      const hasTypeError = !ext || !types.includes(ext);

      if (hasSizeError) {
        const maxSizeText = formatFileSize(maxSize, 1024);
        Message.error(`请上传小于 ${maxSizeText} 的文件`);
        onUploading?.(false);
      } else if (hasTypeError) {
        Message.error(`请上传 ${types.join(', ')} 类型的${SnsMarketingMediaType.IMAGE ? '视频' : '图片'}，当前文件类型: ${ext}`);
        onUploading?.(false);
      } else {
        if (isVideo) {
          checkMediaDuration(file);
        } else {
          setCropFile(file);
          setCropVisible(true);
        }
      }
    }

    handleInputClear();
  };

  const checkMediaDuration = (file: File) => {
    const video = document.createElement('video');
    try {
      video.srcObject = file;
    } catch (err: any) {
      video.src = URL.createObjectURL(file);
    }
    video.addEventListener('loadedmetadata', () => {
      if (video.duration <= POST_RULE.videoMaxDuration && video.duration >= POST_RULE.videoMinDuration) {
        handleMediaUpload(file);
      } else {
        Message.error(`请上传时长在 ${POST_RULE.videoMinDuration}s 到 ${POST_RULE.videoMaxDuration}s 的视频`);
        onUploading?.(false);
      }
    });
  };

  const handleMediaUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = event => {
      if (event.target && event.target.result) {
        const blob = new Blob([event.target.result], { type: file.type });
        const blobURL = window.URL.createObjectURL(blob);
        const uploader = new Uploader(file);
        let id = 0;

        uploader.on('start', data => {
          id = data.id;
          setMediaList(mediaList => [
            ...mediaList,
            {
              url: blobURL,
              id,
              file,
              complete: false,
              uploading: true,
            },
          ]);
        });
        uploader.on('complete', data => {
          setMediaList(mediaList => {
            const nextMediaList = mediaList.map(media => {
              if (media.id !== id) return media;

              return {
                ...media,
                url: data.downloadUrl,
                file: null,
                complete: true,
                uploading: false,
              };
            });
            if (nextMediaList.every(media => media.complete)) {
              onChange && onChange(nextMediaList);
              onUploading?.(false);
            }
            return nextMediaList;
          });
        });
        uploader.on('error', () => {
          Message.error(getIn18Text('SHANGCHUANSHIBAI'));
          setMediaList(mediaList => mediaList.filter(media => media.id !== id));
          onUploading?.(false);
        });
      }
    };
  };

  const handleMediaDelete = (id: number) => {
    const nextMediaList = mediaList.filter(media => media.id !== id);
    setMediaList(nextMediaList);
    if (nextMediaList.every(media => media.complete)) {
      onChange && onChange(nextMediaList);
    }
    setShowVideoPlay(true);
  };

  const handleMediaPreview = (startIndex: number) => {
    const previewData = mediaList.map(media => ({
      previewUrl: media.url,
    }));

    ImgPreview.preview({ data: previewData, startIndex });
  };

  const playVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.play();
    setShowVideoPlay(false);
  };

  const pauseVideo = () => {
    videoRef.current?.pause();
    setShowVideoPlay(true);
  };

  const moreCount = mediaList.length - maxPreviewCount;

  return (
    <>
      <div
        className={classnames(style.mediaList, className, {
          [style.disabled]: disabled,
        })}
        style={{ gap: itemGap }}
      >
        {mediaList.slice(0, maxPreviewCount).map((media, index) => (
          <div className={style.media} style={{ width: isVideo ? 98 : itemSize, height: isVideo ? 74 : itemSize }} key={media.id}>
            {deletable && !disabled && !media.uploading && <MediaDelete className={style.delete} onClick={() => handleMediaDelete(media.id)} />}
            <div className={style.mediaInner}>
              {isVideo ? (
                <div className={style.videoContainer} onClick={pauseVideo}>
                  <video ref={videoRef} src={media.url} />
                  {showVideoPlay && <PlayVideo onClick={playVideo} />}
                </div>
              ) : (
                <img className={style.preview} src={media.url} onClick={() => handleMediaPreview(index)} />
              )}
              {moreCount > 0 && index === maxPreviewCount - 1 && (
                <div className={style.moreMask} onClick={() => handleMediaPreview(index)}>
                  <span className={style.moreText}>+{moreCount}</span>
                </div>
              )}
              {media.uploading && (
                <div className={style.loadingMask}>
                  <MediaLoading className={style.loadingIcon} />
                </div>
              )}
              {aiReplaceable && !disabled && !media.uploading && (
                <div
                  className={style.aiReplace}
                  onClick={() => {
                    if (onAiReplaceClick) {
                      onAiReplaceClick(index);
                    }
                  }}
                >
                  <AiTipIcon className={style.replaceIcon} />
                  <div className={style.replaceText}>{getIn18Text('AI HUANTU')}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {uploadable && mediaList.length < maxCount && (
          <>
            <div
              className={style.upload}
              style={{ width: isVideo ? 98 : itemSize, height: isVideo ? 74 : itemSize }}
              onClick={() => !disabled && uploadRef.current?.click()}
            >
              <MediaUpload />
            </div>
            <input ref={uploadRef} hidden type="file" accept={types.map(type => `.${type}`).join()} onChange={handleInputChange} />
          </>
        )}
      </div>
      {uploadable && (
        <ImageCropper
          visible={cropVisible}
          file={cropFile}
          onCancel={() => {
            setCropFile(null);
            setCropVisible(false);
          }}
          onFinish={file => {
            setCropVisible(false);
            handleMediaUpload(file);
          }}
        />
      )}
    </>
  );
};

export default MediaList;
