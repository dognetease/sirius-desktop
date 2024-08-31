import React, { CSSProperties } from 'react';
import VideoPlayBtn from '@web-common/components/UI/Icons/svgs/VideoPlayBtn2';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';

interface Props {
  videoId: string;
  source: string;
  scene: string;
  postUrl: string;
  style?: CSSProperties;
  children?: React.ReactNode;
  className?: string;
  onCardClick?: () => void;
}

const VideoBox: React.FC<Props> = ({ videoId, source, scene, postUrl, style, onCardClick, children, className }) => {
  const dispatch = useAppDispatch();

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
    dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };

  return (
    <>
      {children ? (
        <div className={classnames(className)} onClick={handleCardClick}>
          {children}
        </div>
      ) : (
        <div className={classnames(styles.videoEntry, className)} style={{ backgroundImage: `url(${postUrl})`, ...style }} onClick={handleCardClick}>
          <img className={styles.videoCover} src={postUrl} alt="" />
          <div className={styles.playIcon}>
            <div className={styles.playIconBtn}>
              <VideoPlayBtn />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoBox;
