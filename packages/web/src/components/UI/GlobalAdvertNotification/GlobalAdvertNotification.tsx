import React, { useEffect, useRef, useState } from 'react';
import styles from './GlobalAdvertNotification.module.scss';
import NotificationCard from '@web-common/components/UI/NotificationCard';
import { useGlobalEventObserver } from '@web-common/hooks/useEventObserver';
import { GlobalAdvertSpaceCode, useGlobalAdvertList } from './useGlobalAdvertList';
import { Carousel } from 'antd';
import { AdvertConfig, api, apiHolder, apis, DataTrackerApi } from 'api';

const systemApi = apiHolder.api.getSystemApi();
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const GlobalAdvertNotification = () => {
  const [visible, setVisible] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const { adList } = useGlobalAdvertList(GlobalAdvertSpaceCode);

  useEffect(() => {
    if (launchSuccess && adList.length > 0) {
      setVisible(true);
    }
  }, [launchSuccess, adList]);

  useGlobalEventObserver('launchSuccessed', () => {
    setLaunchSuccess(true);
  });
  const handleAdClick = (url: string, data: AdvertConfig) => {
    return () => {
      if (url) {
        trackerApi.track('waimao_adver_click', {
          advertId: data.id,
        });
        systemApi.openNewWindow(url);
      }
    };
  };

  const handleCloseBtnClick = () => {
    setVisible(false);
  };

  const handleSlideChange = (currentSlide: number) => {
    const data = adList[currentSlide];
    if (!data || !visible || adList.length <= 1) return;
    trackerApi.track('waimao_adver_exposure', {
      advertId: data.id,
    });
  };

  useEffect(() => {
    // 针对只有一条数据无法触发afterChange导致曝光埋点不上报的问题
    if (visible && adList.length === 1) {
      trackerApi.track('waimao_adver_exposure', {
        advertId: adList[0].id,
      });
    }
  }, [visible, adList]);

  return (
    <NotificationCard
      show={visible}
      style={{
        right: 40,
      }}
    >
      <div className={styles.globalAdvertNotification}>
        <Carousel autoplay afterChange={handleSlideChange}>
          {adList.length &&
            adList.map(item => (
              <div className={styles.slide} key={item.id}>
                <div
                  className={styles.content}
                  onClick={handleAdClick(item.advertResourceList[0]?.content?.clickUrl ?? '', item)}
                  style={{
                    backgroundImage: `url("${item.advertResourceList[0]?.content?.image[0]?.url ?? ''}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    cursor: 'pointer',
                  }}
                ></div>
              </div>
            ))}
        </Carousel>

        <div className={styles.closeBtn} onClick={handleCloseBtnClick}>
          <CloseBtnWithWhiteBg />
        </div>
      </div>
    </NotificationCard>
  );
};

export function CloseBtnWithWhiteBg() {
  const [hover, setHover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMouseOver = () => {
    setHover(true);
  };
  const handleMouseLeave = () => {
    setHover(false);
  };
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener('mouseenter', handleMouseOver);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mouseenter', handleMouseOver);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [containerRef]);

  return (
    <div ref={containerRef}>
      {!hover ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_5655_120254)">
            <rect width="20" height="20" rx="2" fill="#3F465C" fill-opacity="0.4" />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.4419 4.55815C15.686 4.80223 15.686 5.19796 15.4419 5.44204L10.8839 10.0001L15.4419 14.5582C15.686 14.8022 15.686 15.198 15.4419 15.442C15.1979 15.6861 14.8021 15.6861 14.5581 15.442L10 10.884L5.44194 15.442C5.19786 15.6861 4.80214 15.6861 4.55806 15.442C4.31398 15.198 4.31398 14.8022 4.55806 14.5582L9.11612 10.0001L4.55806 5.44204C4.31398 5.19796 4.31398 4.80223 4.55806 4.55815C4.80214 4.31407 5.19786 4.31407 5.44194 4.55815L10 9.11621L14.5581 4.55815C14.8021 4.31407 15.1979 4.31407 15.4419 4.55815Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_5655_120254">
              <rect width="20" height="20" rx="2" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_5808_121825)">
            <rect width="20" height="20" rx="2" fill="#3F465C" fill-opacity="0.8" />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.4419 4.55815C15.686 4.80223 15.686 5.19796 15.4419 5.44204L10.8839 10.0001L15.4419 14.5582C15.686 14.8022 15.686 15.198 15.4419 15.442C15.1979 15.6861 14.8021 15.6861 14.5581 15.442L10 10.884L5.44194 15.442C5.19786 15.6861 4.80214 15.6861 4.55806 15.442C4.31398 15.198 4.31398 14.8022 4.55806 14.5582L9.11612 10.0001L4.55806 5.44204C4.31398 5.19796 4.31398 4.80223 4.55806 4.55815C4.80214 4.31407 5.19786 4.31407 5.44194 4.55815L10 9.11621L14.5581 4.55815C14.8021 4.31407 15.1979 4.31407 15.4419 4.55815Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_5808_121825">
              <rect width="20" height="20" rx="2" fill="white" />
            </clipPath>
          </defs>
        </svg>
      )}
    </div>
  );
}
