import React, { useMemo, useRef, useImperativeHandle, useEffect, useCallback, useState } from 'react';
import { ReactComponent as FullIcon } from './icon/full.svg';
import { ReactComponent as MutedIcon } from './icon/muted.svg';
import { ReactComponent as UnMutedIcon } from './icon/unMuted.svg';
import { ReactComponent as CloseIcon } from './icon/close.svg';
import { ConfigActions, useActions } from '@web-common/state/createStore';
import { PlayState } from './index';
import './index.scss';

export interface FloatVideoProps {
  bottom?: number;
  right?: number;
  width?: number;
  height?: number;
  url: string;
  title: string;
  visible: boolean;
  hiddenClassName?: string;
  fullScreenConfig: { videoId: string; source: string; scene: string };
  onClose?: (playState?: PlayState) => void;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const FloatVideo = React.forwardRef((props: FloatVideoProps, ref) => {
  const { bottom, right, width, height, url, visible, onClose, title, hiddenClassName = '', fullScreenConfig } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRateRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [hiddenAnimation, setHiddenAnimation] = useState(false);
  const { showVideoDrawer } = useActions(ConfigActions);
  const styles = useMemo(() => {
    return {
      bottom,
      right,
      width,
      height,
    };
  }, [bottom, right, width, height]);

  useImperativeHandle(ref, () => ({
    play() {
      videoRef.current?.play();
    },
    pause() {
      videoRef.current?.pause() || false;
    },
  }));

  const pauseVideo = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', pauseVideo);
    return () => {
      document.removeEventListener('visibilitychange', pauseVideo);
    };
  }, []);

  const closeVideo = async () => {
    videoRef.current?.pause();
    setHiddenAnimation(true);
    await wait(1000);
    setHiddenAnimation(false);
    const duration = videoRef.current?.duration;
    const currentTime = videoRef.current?.currentTime;
    // const ended = videoRef.current?.ended;
    // onClose && onClose({ duration: duration, currentTime: currentTime, ended: ended });
    let playRate = playRateRef.current;
    if (playRate !== 1) {
      playRate = duration && currentTime ? Math.round((currentTime / duration) * 100) / 100 : 0;
    }
    onClose && onClose({ playRate: playRate });
    playRateRef.current = 0;
  };

  const fullScreen = () => {
    videoRef.current?.pause();
    showVideoDrawer({ ...fullScreenConfig, startTime: videoRef.current?.currentTime });
    onClose && onClose();
  };

  const onMuted = () => {
    setMuted(!muted);
  };

  const startPlay = () => {
    if (visible) {
      videoRef.current?.play(); // 避免autoPlay失效，自动播放保底
    }
  };

  const onVideoEnded = () => {
    playRateRef.current = 1;
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <div className={`lx-float-video ${hiddenAnimation ? hiddenClassName : ''}`} style={styles}>
        <video ref={videoRef} muted={muted} playsInline autoPlay webkit-playsinline="true" onLoadStart={startPlay} onEnded={onVideoEnded}>
          <source src={url} />
        </video>
        <div className="lx-float-video-hover">
          <p className="header">
            <span className="magnify-icon" onClick={fullScreen}>
              <FullIcon />
            </span>
            <span className="title">{title}</span>
            <span className="muted-icon" onClick={onMuted}>
              {muted ? <MutedIcon /> : <UnMutedIcon />}
            </span>
            <span className="close-icon" onClick={closeVideo}>
              <CloseIcon />
            </span>
          </p>
        </div>
      </div>
    </>
  );
});

FloatVideo.defaultProps = {
  bottom: 15,
  right: 15,
  width: 419,
  height: 235,
};

export default FloatVideo;
