import React, { useRef, useEffect, useCallback } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { PlayState } from './index';
import './index.scss';

export interface VideoModalProps {
  visible: boolean;
  url: string;
  title: string;
  startTime?: number;
  muted?: boolean;
  onClose: (playState?: PlayState) => void;
}

const VideoModal: React.FC<VideoModalProps> = props => {
  const { visible, onClose, url, startTime, title, muted } = props;
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const startPlay = () => {
    if (visible) {
      videoRef.current?.play(); // 避免autoPlay失效，自动播放保底
      startTime && videoRef.current && (videoRef.current.currentTime = startTime);
    }
  };

  const modalClose = () => {
    const duration = videoRef.current?.duration;
    const currentTime = videoRef.current?.currentTime;
    const ended = videoRef.current?.ended;
    onClose && onClose({ duration: duration, currentTime: currentTime, ended: ended });
  };

  return (
    <Modal
      visible={visible}
      getContainer={false}
      width={816}
      title={title}
      maskClosable={false}
      className="lx-video-modal"
      destroyOnClose={true}
      footer={null}
      onCancel={modalClose}
    >
      <video ref={videoRef} muted={!!muted} controls playsInline autoPlay webkit-playsinline="true" onLoadStart={startPlay}>
        <source src={url} />
      </video>
    </Modal>
  );
};

export default VideoModal;
