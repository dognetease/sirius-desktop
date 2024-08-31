import { getIn18Text, SnsMarketingMedia, SnsMarketingMediaType } from 'api';
import * as React from 'react';
import classnames from 'classnames';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { ReactComponent as PreviewIcon } from '@web-sns-marketing/images/preview.svg';
import { ReactComponent as PlayVideo } from '@web-sns-marketing/images/play-video.svg';
import style from './PostPreviewImage.module.scss';

interface PostPreviewImageProps {
  className?: string;
  mode?: 'pc' | 'mobile';
  list: SnsMarketingMedia[];
  mediaType?: SnsMarketingMediaType;
}

const PostPreviewImage: React.FC<PostPreviewImageProps> = props => {
  const { className, mode = 'pc', list, mediaType = SnsMarketingMediaType.IMAGE } = props;
  const [showVideoPlay, setShowVideoPlay] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleMediaPreview = (startIndex: number) => {
    const previewData = list.map(item => ({
      previewUrl: item.url,
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

  if (mode === 'pc')
    return (
      <div className={classnames(className, style.postPreviewImage, style.pc, `sns-pc-preview-image-${list.length}`)}>
        {list.map((item, index) => (
          <div className={style.item}>
            {mediaType === SnsMarketingMediaType.IMAGE ? (
              <>
                <img className={style.img} key={item.url} src={item.url} alt="" />
                <div className={style.mask} onClick={() => handleMediaPreview(index)}>
                  <PreviewIcon className={style.icon} />
                  <span className={style.text}>{getIn18Text('YULAN')}</span>
                </div>
              </>
            ) : null}
            {mediaType === SnsMarketingMediaType.VIDEO ? (
              <div className={style.videoContainer} onClick={pauseVideo}>
                <video ref={videoRef} key={item.url} src={item.url} />
                {showVideoPlay && <PlayVideo onClick={playVideo} />}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );

  if (mode === 'mobile')
    return (
      <div className={classnames(className, style.postPreviewImage, style.mobile, `sns-mobile-preview-image-${list.length}`)}>
        {list.slice(0, 4).map((item, index) => (
          <div className={style.item}>
            {mediaType === SnsMarketingMediaType.IMAGE ? (
              <>
                <img className={style.img} key={item.url} src={item.url} alt="" onClick={() => handleMediaPreview(index)} />
                {index === 3 && list.length > 4 && (
                  <div className={style.mask} onClick={() => handleMediaPreview(index)}>
                    <span className={style.text}>+{list.length - 4}</span>
                  </div>
                )}
              </>
            ) : null}
            {mediaType === SnsMarketingMediaType.VIDEO ? (
              <div className={style.videoContainer} onClick={pauseVideo}>
                <video ref={videoRef} key={item.url} src={item.url} />
                {showVideoPlay && <PlayVideo onClick={playVideo} />}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );

  return null;
};

export default PostPreviewImage;
