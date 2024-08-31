/* eslint-disable jsx-a11y/media-has-caption */
import React, { useCallback, useRef, useEffect } from 'react';
import { api, apis, DataTrackerApi, WorktableApi } from 'api';
import { throttle } from 'lodash';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { CloseBtnWithWhiteBg } from '../../icons/CloseBtnWithWhiteBg';
import styles from './VideoModal.module.scss';
import { getTransText } from '@/components/util/translate';

const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
export interface VideoModalProps {
  show: boolean;
  videoUrl?: string;
  posterUrl?: string;
  advertId?: string;
  videoParam: {
    mediaId: string;
    mediaName: string;
  };
  handleCancel?: () => void;
}

const VideoModal: React.FC<VideoModalProps> = props => {
  const { show, advertId, videoParam, posterUrl, videoUrl } = props;
  const isFirstPlay = useRef(true);
  const playIdRef = useRef<string>();
  const videoParamsRef = useRef(videoParam);

  useEffect(() => {
    videoParamsRef.current = videoParam;
  }, [videoParam]);

  useEffect(() => {
    if (!show) {
      // 关闭重置播放统计
      playIdRef.current = undefined;
    }
  }, [show]);

  const bindVideoEvent = useCallback((video: HTMLVideoElement) => {
    if (video === null) return;
    const ontimeupdate = throttle(() => {
      if (!video) return;

      const { currentTime, duration } = video;

      if (!playIdRef.current) {
        worktableApi.getPlayContext({ mediaId: videoParamsRef.current.mediaId || '', mediaName: videoParamsRef.current.mediaName, totalTime: duration }).then(res => {
          playIdRef.current = res.playId;
          if (!res.playId) {
            return;
          }
          // 上报上传播放进度
          worktableApi.reportPlayTime({
            playId: playIdRef.current || '',
            playTime: currentTime,
          });
        });
      } else {
        // 上报上传播放进度
        worktableApi.reportPlayTime({
          playId: playIdRef.current || '',
          playTime: currentTime,
        });
      }
    }, 5000);
    video.addEventListener('timeupdate', ontimeupdate);
  }, []);

  const handleVideoPlayStart = () => {
    if (!isFirstPlay.current) return;
    isFirstPlay.current = false;
    trackerApi.track('waimao_worktable_video_play', {
      advertId,
    });
  };

  const handleCancel = () => {
    isFirstPlay.current = true;
    // eslint-disable-next-line react/destructuring-assignment
    props.handleCancel && props.handleCancel();
  };

  return (
    <SiriusModal
      className={styles.videoModal}
      visible={show}
      width="70%"
      onCancel={handleCancel}
      centered
      destroyOnClose
      footer={null}
      getContainer={document.body}
      maskClosable={false}
      closeIcon={<CloseBtnWithWhiteBg />}
    >
      <video width="100%" controls controlsList="nodownload" poster={posterUrl || ''} onPlay={handleVideoPlayStart} ref={bindVideoEvent}>
        <source src={videoUrl || ''} type="video/mp4" />
        {getTransText('BUZHICHIH5VIDEO')}
      </video>
    </SiriusModal>
  );
};

export default VideoModal;
