import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Carousel } from 'antd';
import { parseNpsUrl } from '@/components/Npsmeter';
import CourseScrollArrow from '../../icons/CourseScrollArrow';
import styles from './AnnouceScrollBanner.module.scss';
import classNames from 'classnames';
import { AdvertConfig, api, apiHolder, apis, DataTrackerApi } from 'api';
import { useAdvertListData, WorktableAdBannerCode } from '../../hooks/useAdvertListData';

export interface AnnouceScrollBannerProps {
  handleChange?: (currentSlide: number, data: AdvertConfig) => void;
  handleSlideClick?: (data: AdvertConfig) => void;
  showDots?: boolean;
  active?: boolean;
}

const systemApi = apiHolder.api.getSystemApi();
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const AnnouceScrollBanner: React.FC<AnnouceScrollBannerProps> = props => {
  const { showDots = true } = props;
  const { adList } = useAdvertListData(WorktableAdBannerCode);
  const showToggleButton = useMemo(() => {
    if (!showDots || adList.length <= 1) {
      return false;
    }
    return true;
  }, [showDots, adList]);
  const carouselRef = useRef<any>(null);

  const handleAdClick = (url: string, data: AdvertConfig) => {
    return async () => {
      if (url) {
        props.handleSlideClick && props.handleSlideClick(data);
        const parsedUrl = await parseNpsUrl(url);
        systemApi.openNewWindow(parsedUrl);
      }
    };
  };

  const handleNextPage = useCallback(() => {
    if (carouselRef.current && typeof carouselRef.current.next === 'function') {
      carouselRef.current.next();
    }
  }, [carouselRef]);

  const handlePrevPage = useCallback(() => {
    if (carouselRef.current && typeof carouselRef.current.prev === 'function') {
      carouselRef.current.prev();
    }
  }, [carouselRef]);

  const handleSlideChange = (currentSlide: number) => {
    // 只有一张图片时，afterChange也会触发，此时拦截该事件
    if (adList.length <= 1 || !props.active) {
      return;
    }
    props.handleChange && props.handleChange(currentSlide, adList[currentSlide]);
  };

  useEffect(() => {
    // 针对只有一条数据无法触发afterChange导致曝光埋点不上报的问题
    if (props.active && adList.length === 1) {
      trackerApi.track('waimao_worktable_adver_exposure', {
        advertId: adList[0].id,
      });
    }
  }, [props.active, adList]);

  return adList.length > 0 ? (
    <div className={styles.annouceScrollBanner}>
      <Carousel ref={carouselRef} autoplay={props.active} afterChange={handleSlideChange}>
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

      {showToggleButton && (
        <>
          <div className={classNames(styles.toggleButton, styles.left)} onClick={handlePrevPage}>
            <CourseScrollArrow direction="left" />
          </div>
          <div className={classNames(styles.toggleButton, styles.right)} onClick={handleNextPage}>
            <CourseScrollArrow direction="right" />
          </div>
        </>
      )}
    </div>
  ) : null;
};
