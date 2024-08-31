import React, { useEffect, useRef, useState } from 'react';
import { Spin, Drawer, DrawerProps } from 'antd';
import classnames from 'classnames';
import styles from './index.module.scss';
import { TongyongJiantou2You, TongyongJiazai, TongyongShipinMian } from '@sirius/icons';
import { api, apiHolder, apis, DataTrackerApi, EdmVideoItem, getIn18Text, ProductAuthApi } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { VideoDrawerProp } from '@web-common/state/reducer/configReudcer';
import { ConfigActions } from '@web-common/state/reducer';
import VideoRelevantCard from '@web-common/components/UI/VideoDrawer/recommandCard';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi();
const { isMac } = apiHolder.env;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

const isWindows = systemApi.isElectron() && !isMac;
const isWebWmEntry = systemApi.isWebWmEntry();

interface Props {
  getContainer?: DrawerProps['getContainer'];
}

const VideoDrawer: React.FC<Props> = ({ getContainer }) => {
  const dispatch = useAppDispatch();
  const videoDrawerProp: VideoDrawerProp = useAppSelector(state => state.configReducer.videoDrawerProp);
  const openHelpCenter = useOpenHelpCenter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const playRateRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<EdmVideoItem | null>(null);

  const fetchVideoInfo = (videoId: string) => {
    setLoading(true);
    productApi
      .doGetProductVideos(videoId)
      .then(res => {
        if (res && videoId === videoDrawerProp.videoId) {
          setVideoInfo(res);
        } else {
          console.error('fetch video error');
        }
      })
      .catch(e => {
        console.error('fetch video error', e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onClose = () => {
    dispatch(ConfigActions.closeVideoDrawer());
  };

  const moreCourse = () => {
    if (videoInfo) {
      trackerApi.track('unified_event_tracking_video_catalogs_jump', {
        source: videoDrawerProp.source,
        scene: videoDrawerProp.scene,
        mainvideo: videoDrawerProp.videoId,
        jumpaction: '更多网易外贸通产品课程',
      });
      openHelpCenter(videoInfo.leanMore);
      // window.open(videoInfo.leanMore, '_blank');
    }
  };

  const onVideoEnded = () => {
    playRateRef.current = 1;
  };

  const onAfterClose = () => {
    if (videoRef.current) {
      const { duration = 0, currentTime = 0 } = videoRef.current;
      let playRate = playRateRef.current;
      if (playRate !== 1) {
        playRate = duration && currentTime ? Math.round((currentTime / duration) * 100) / 100 : 0;
      }
      trackerApi.track('unified_event_tracking_video_catalogs_rate', {
        source: videoDrawerProp.source,
        scene: videoDrawerProp.scene,
        mainvideo: videoDrawerProp.videoId,
        mainvideorate: playRate,
      });
      setTimeout(() => {
        playRateRef.current = 0;
        setVideoInfo(null);
        dispatch(ConfigActions.resetVideoDrawer());
        setLoading(false);
      }, 0);
      console.log('video drawer play rate: ', playRate);
    }
  };

  useEffect(() => {
    const { visible, videoId } = videoDrawerProp;
    if (visible) {
      if (videoId) {
        fetchVideoInfo(videoId);
        trackerApi.track('unified_event_tracking_video_catalogs_open', {
          source: videoDrawerProp.source,
          scene: videoDrawerProp.scene,
          mainvideo: videoDrawerProp.videoId,
        });
      } else {
        console.error('Video Drawer no videoId');
      }
    } else if (videoId) {
      // 关闭时有 videoId 是由外界触发的，触发后，先关闭弹窗，然后再清除 source 等相关信息，因为要打点
      onAfterClose();
    }
  }, [videoDrawerProp]);

  return (
    <Drawer
      visible={videoDrawerProp.visible}
      title={getIn18Text('CHANPINXUEYUAN')}
      placement={isWebWmEntry ? 'bottom' : 'right'}
      onClose={onClose}
      width={isWebWmEntry ? '100%' : 'calc(100vw - 68px)'}
      height={isWebWmEntry ? 'calc(100vh - 54px)' : '100%'}
      destroyOnClose
      mask={false}
      maskClosable={false}
      getContainer={getContainer || document.body}
      className={classnames(styles.videoDrawerWrapper, {
        [styles.isWindows]: isWindows,
        [styles.isWebWmEntry]: isWebWmEntry,
      })}
    >
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin delay={500} indicator={<TongyongJiazai className={styles.loading} />} spinning={loading} />
        </div>
      ) : (
        <div className={styles.videoDrawer}>
          <div className={styles.videoDrawerMainWrapper}>
            <div className={styles.videoDrawerMain}>
              {videoInfo && (
                <video ref={videoRef} width="100%" controls controlsList="nodownload" poster={videoInfo?.coverUrl || ''} autoPlay onEnded={onVideoEnded}>
                  <source src={videoInfo?.videoUrl || ''} type="video/mp4" />
                  {getIn18Text('BUZHICHIH5VIDEO')}
                </video>
              )}
              <div className={styles.videoMainTitle}>{videoInfo?.title || ''}</div>
              <div className={styles.videoMainContent}>{videoInfo?.content || ''}</div>
            </div>
          </div>
          <div className={styles.videoDrawerAside}>
            <div className={styles.asideTitle}>
              <TongyongShipinMian className={styles.asideTitleIcon} />
              <span className={styles.asideTitleText}>{getIn18Text('XIANGGUANTUIJIAN')}</span>
            </div>
            <div className={styles.asideContent}>
              {Array.isArray(videoInfo?.relevant) ? (
                videoInfo?.relevant.map(v => (
                  <VideoRelevantCard
                    key={v.videoUrl}
                    videoUrl={v.videoUrl}
                    coverUrl={v.coverUrl}
                    title={v.title}
                    content={v.content}
                    scene={videoDrawerProp.scene}
                    source={videoDrawerProp.source}
                    mainVideoId={videoDrawerProp.videoId}
                  />
                ))
              ) : (
                <></>
              )}
              <div className={styles.asideBottom} onClick={moreCourse}>
                <span className={styles.asideBottomText}>{getIn18Text('GENGDUOKECHENG')}</span>
                <TongyongJiantou2You wrapClassName={styles.asideBottomIconWrapper} className={styles.asideBottomIcon} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default VideoDrawer;
