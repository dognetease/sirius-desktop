import React from 'react';
import { api, apis, DataTrackerApi } from 'api';
import VideoPlayBtn from '@web-common/components/UI/Icons/svgs/VideoPlayBtn2';
import styles from './index.module.scss';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  source: string;
  scene: string;
  title: string;
  content: string;
  videoUrl: string;
  coverUrl: string;
  mainVideoId: string;
}

const VideoRelevantCard: React.FC<Props> = ({ title, content, coverUrl, videoUrl, source, scene, mainVideoId }) => {
  const openHelpCenter = useOpenHelpCenter();

  const onClick = () => {
    trackerApi.track('unified_event_tracking_video_catalogs_jump', { source, scene, mainvideo: mainVideoId, jumpaction: title });
    openHelpCenter(videoUrl);
  };

  return (
    <div className={styles.relevantCard} onClick={onClick}>
      <div className={styles.cardImageContainer}>
        <img className={styles.cardImage} src={coverUrl} alt="" title={title} />
        <div className={styles.playIconBtn}>
          <VideoPlayBtn />
        </div>
      </div>
      <div className={styles.relevantTitle}>{title}</div>
      <div className={styles.relevantContent}>{content}</div>
    </div>
  );
};

export default VideoRelevantCard;
