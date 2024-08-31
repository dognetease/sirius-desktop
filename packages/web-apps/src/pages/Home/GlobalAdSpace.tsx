import { Carousel, Image } from 'antd';
import React, { useContext, useState, useEffect } from 'react';
import { apiHolder as api, apis, AdvtertApi, AdvertConfig, isSupportedConfig, getImageUrl, globalAdSpaceCode } from 'api';
import styles from './index.module.scss';
import { systemApi } from 'api';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseSvg';
import AdvertIcon from '@/images/icons/ad-tag-advert.svg';
import ActivityIcon from '@/images/icons/ad-tag-activity.svg';

const advertApi = api.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const systemApi = api.api.getSystemApi();
const storeApi = api.api.getDataStoreApi();

export const trackViewEvent = (config: AdvertConfig) => {
  config.advertResourceList[0].outsideStatisticsList.forEach(track => {
    if (track.type === 'VIEW') {
      advertApi.track(track);
      return;
    }
  });
};

export function getTag(config: AdvertConfig) {
  if (config.showTag !== 'YES') {
    return undefined;
  }
  if (config.operationType === 'ACTIVITY') {
    return ActivityIcon;
  }
  if (config.operationType === 'ADVERT') {
    return AdvertIcon;
  }
  return undefined;
}

const UserCloseGlobalAdSpaceKey = 'user_close_global_ad_space_key';

export const GlobalAdSpace: React.FC = () => {
  const [adConfigs, setAdConfigs] = useState<AdvertConfig[]>([]);
  const [shouldShowAd, SetShouldShowAd] = useState<boolean>(true);

  const fetchAdConfig = async () => {
    const response = await advertApi.fetchConfig(globalAdSpaceCode);
    if (response.data) {
      const temp = (response.data['itemList'] as AdvertConfig[]) || [];
      const filterTemp = temp.filter(t => {
        const res = t.advertResourceList[0];
        return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
      });
      setAdConfigs(filterTemp || []);
      if (filterTemp[0]) {
        trackViewEvent(filterTemp[0]);
      }
    } else {
      setAdConfigs([]);
    }
  };

  const getImageContent = (config: AdvertConfig) => {
    const imageModel = config.advertResourceList[0].content;
    return imageModel;
  };

  useEffect(() => {
    const store = storeApi.getSync(UserCloseGlobalAdSpaceKey);
    if (store.data === 'true') {
      SetShouldShowAd(false);
    }
  }, [shouldShowAd]);

  useEffect(() => {
    fetchAdConfig();
  }, []);

  const adDidClick = (config: AdvertConfig) => {
    const link = getImageContent(config).clickUrl;
    if (link && link.length > 0) {
      // TODO: 这个地方跳出去的url 是有问题的, 拼了自己的host.
      systemApi.openNewWindow(link);
    }
    config.advertResourceList[0].outsideStatisticsList.forEach(track => {
      if (track.type === 'CLICK') {
        advertApi.track(track);
        return;
      }
    });
  };

  const cancelButtonClick = () => {
    // 点击关闭 就不再显示
    storeApi.putSync(UserCloseGlobalAdSpaceKey, 'true', { noneUserRelated: false });
    SetShouldShowAd(false);
  };

  return adConfigs.length === 0 || !shouldShowAd || !isSupportedConfig(adConfigs[0]) ? null : (
    <div className={styles.globalAd}>
      <div
        className={styles.closeIcon}
        onClick={() => {
          cancelButtonClick();
        }}
      >
        <CloseIcon />
      </div>
      <div className={styles.imageRoot}>
        <Image
          className={styles.imageView}
          onClick={() => {
            adDidClick(adConfigs[0]);
          }}
          preview={false}
          src={getImageUrl(adConfigs[0])}
        />
      </div>
    </div>
  );
};
