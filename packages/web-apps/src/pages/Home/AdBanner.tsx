import { Carousel, Image } from 'antd';
import React, { useContext, useState, useEffect } from 'react';
import { apiHolder as api, apis, AdvtertApi, AdvertConfig, conf, getImageUrl, getBgColor, bannerSpaceCode } from 'api';
import styles from './index.module.scss';
import { systemApi } from 'api';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { trackViewEvent, getTag } from './GlobalAdSpace';

const advertApi = api.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const systemApi = api.api.getSystemApi();

export const AdBanner: React.FC = Props => {
  const [adConfigs, setAdConfigs] = useState<AdvertConfig[]>([]);

  const fetchAdConfig = async () => {
    const response = await advertApi.fetchConfig(bannerSpaceCode);
    if (response.data) {
      const temp = (response.data['itemList'] as AdvertConfig[]) || [];
      const filterTemp = temp.filter(t => {
        const res = t.advertResourceList[0];
        return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
      });
      setAdConfigs(filterTemp || []);
    } else {
      setAdConfigs([]);
    }
  };

  useEffect(() => {
    fetchAdConfig();
  }, []);

  const adDidClick = (config: AdvertConfig) => {
    const link = config.advertResourceList[0].content.clickUrl;
    if (link && link.length > 0) {
      systemApi.openNewWindow(link);
    }
    config.advertResourceList[0].outsideStatisticsList.forEach(track => {
      if (track.type === 'CLICK') {
        advertApi.track(track);
        return;
      }
    });
  };

  return adConfigs.length === 0 ? (
    <div className={styles.banner}></div>
  ) : (
    <div className={styles.adBanner}>
      <Carousel
        className={styles.carousel}
        autoplay
        autoplaySpeed={3000}
        afterChange={current => {
          const ad = adConfigs[current];
          if (ad) {
            trackViewEvent(ad);
          }
        }}
      >
        {adConfigs.map(config => {
          return getImageUrl(config).length === 0 ? null : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <div className={styles.bgTag} style={{ backgroundImage: `url(${getTag(config)})` }}></div>
              </div>
              <div className={styles.itemContainer} style={{ backgroundColor: getBgColor(config) }}>
                <img
                  className={styles.itemImg}
                  onClick={() => {
                    adDidClick(config);
                  }}
                  src={getImageUrl(config)}
                  alt=""
                />
              </div>
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};
