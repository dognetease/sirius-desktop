import React from 'react';
import { ReactComponent as PlayIcon } from '../../../images/intro-video/play.svg';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
import { useAppDispatch } from '@web-common/state/createStore';
import { ConfigActions } from '@web-common/state/reducer';
interface IntroVideoProps {
  hash: string;
  onPlayClick: () => void;
  videoParams: {
    source: string;
    scene: string;
    videoId: string;
    posterUrl: string;
  };
}

export const IntroVideo = (props: IntroVideoProps) => {
  const dispatch = useAppDispatch();

  const playVideo = () => {
    const { videoId, scene, source } = props.videoParams;
    dispatch(ConfigActions.showVideoDrawer({ videoId, source, scene }));
  };

  return (
    <>
      <div className={styles.introVideo}>
        <header className={styles.introVideoTitle}>
          {getIn18Text('SITE_PINPAIJIANSHEZHIYIN')}
          <span>视频</span>
        </header>
        <div className={styles.introVideoPoster} style={{ backgroundImage: `url(${props.videoParams.posterUrl})` }}>
          <PlayIcon onClick={playVideo} />
        </div>
      </div>
    </>
  );
};
