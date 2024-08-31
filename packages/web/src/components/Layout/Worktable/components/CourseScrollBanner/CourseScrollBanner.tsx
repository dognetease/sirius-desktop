import React, { useRef, useState } from 'react';
import { Carousel } from 'antd';
import VideoPlayBtn from '@web-common/components/UI/Icons/svgs/VideoPlayBtn';
import styles from './CourseScrollBanner.module.scss';
import { useAdvertListData, WorktablePopularCourseBannerCode } from '../../hooks/useAdvertListData';
import VideoModal from '../VideoModal/VideoModal';
import { AdvertConfig } from '@/../../api/src';

export interface CourseScrollBannerProps {
  handleChange?: (currentSlide: number, data: AdvertConfig) => void;
  handleSlideClick?: (data: AdvertConfig) => void;
}

export const CourseScrollBanner: React.FC<CourseScrollBannerProps> = props => {
  const carouselRef = useRef<any>(null);
  const [videoInfo, setVideInfo] = useState({
    videoUrl: '',
    posterUrl: '',
    advertId: '',
    videoParam: {
      mediaId: '',
      mediaName: '',
    },
  });
  const [showVideo, setShowVideo] = useState(false);

  const { adList } = useAdvertListData(WorktablePopularCourseBannerCode);

  // eslint-disable-next-line arrow-body-style
  const handleClickPlayButton = (videoUrl: string, posterUrl: string, data: AdvertConfig) => {
    return () => {
      props.handleSlideClick && props.handleSlideClick(data);
      setVideInfo({
        videoUrl,
        posterUrl,
        advertId: data.id,
        videoParam: {
          mediaId: data.advertResourceList[0] ? data.advertResourceList[0].id : '',
          mediaName: data.advertResourceList[0] ? data.advertResourceList[0].name : '',
        },
      });
      setShowVideo(true);
    };
  };

  const handleSlideChange = (currentSlide: number) => {
    props.handleChange && props.handleChange(currentSlide, adList[currentSlide]);
  };

  return adList.length > 0 ? (
    <div className={styles.courseScrollBanner}>
      <Carousel ref={carouselRef} autoplay afterChange={handleSlideChange}>
        {adList.length &&
          adList.map(item => (
            <div className={styles.slide} key={item.id}>
              <div
                className={styles.content}
                style={{
                  backgroundImage: `url("${item.advertResourceList[0]?.content?.image[0]?.url ?? ''}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  cursor: 'pointer',
                }}
                onClick={handleClickPlayButton(item.advertResourceList[0]?.content?.clickUrl ?? '', item.advertResourceList[0]?.content?.clickContent ?? '', item)}
              >
                <VideoPlayBtn style={{ cursor: 'pointer' }} />
              </div>
            </div>
          ))}
      </Carousel>

      <VideoModal
        show={showVideo}
        handleCancel={() => {
          setShowVideo(false);
          setVideInfo({ videoUrl: '', posterUrl: '', advertId: '', videoParam: { mediaId: '', mediaName: '' } });
        }}
        videoUrl={videoInfo.videoUrl}
        posterUrl={videoInfo.posterUrl}
        advertId={videoInfo.advertId}
        videoParam={videoInfo.videoParam}
      />
    </div>
  ) : null;
};
