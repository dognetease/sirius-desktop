import React, { useContext, useState, useEffect } from 'react';
import { apiHolder as api, apis, AdvtertApi, AdvertConfig, AdvertResource, getImageUrl, AdvertResourceContent, selectedAppsSpaceCode } from 'api';
import { Image } from 'antd';
import debounce from 'lodash/debounce';
import styles from './index.module.scss';
import ArrowDown from '@web-common/components/UI/Icons/svgs/ArrowDown';
import ArrowUp from '@web-common/components/UI/Icons/svgs/ArrowUp';
import { getTag, trackViewEvent } from './GlobalAdSpace';

const advertApi = api.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const systemApi = api.api.getSystemApi();
const limitMaxHeight = 96 * 3 + 12 * 3;

export const SelectedApps: React.FC = () => {
  const defaultHeight = limitMaxHeight;

  const [adConfigs, setAdConfigs] = useState<AdvertConfig[]>([]);
  const [openAll, setOpenAll] = useState<boolean>(false);
  const [showExpandButton, setShowExpandButton] = useState<boolean>(false);

  const fetchAdConfig = async () => {
    const response = await advertApi.fetchConfig(selectedAppsSpaceCode);
    if (response.data) {
      const temp = (response.data['itemList'] as AdvertConfig[]) || [];
      const filterTemp = temp.filter(t => {
        const res = t.advertResourceList[0];
        return res && res.source === 'DIRECT_CASTING' && (res.type === 'PIC' || res.type === 'CUSTOM');
      });
      setAdConfigs(filterTemp || []);
      resizeChange();
    } else {
      setAdConfigs([]);
    }
  };

  const appComponent = (config: AdvertConfig) => {
    trackViewEvent(config);
    const resource = config.advertResourceList[0];
    const imageUrl = getImageUrl(config);
    const clickContent = resource.content.clickContent || '';
    return (
      <div
        className={styles.appView}
        style={{ backgroundImage: `url(${getTag(config)})` }}
        onClick={() => {
          onClickTryItButton(resource);
        }}
      >
        <Image preview={false} className={styles.appIcon} src={imageUrl} />
        <div className={styles.appDescRoot}>
          <div className={styles.appTitle}>{resource.content.title}</div>
          <div className={styles.appDesc}>{resource.content.description}</div>
          {resource.content.clickUrl && resource.content.clickUrl.length > 0 ? (
            <div className={styles.appTryIt}>{clickContent.length > 0 ? clickContent : '立即体验'}</div>
          ) : null}
        </div>
      </div>
    );
  };

  useEffect(() => {
    // 监听
    window.addEventListener('resize', resizeChange);
    // 销毁
    return () => window.removeEventListener('resize', resizeChange);
  }, []);

  //浏览器窗口大小改变
  const resizeChange = () => {
    const eleHeight = document.getElementById('flex-collection-view')?.clientHeight || 0;
    if (eleHeight > limitMaxHeight) {
      resize(true);
    }
    if (eleHeight <= limitMaxHeight) {
      resize(false);
    }
  };

  const resize = debounce((visiable: boolean) => {
    setShowExpandButton(visiable);
  }, 100);

  const onClickTryItButton = (resource: AdvertResource) => {
    const link = resource.content.clickUrl;
    if (link && link.length > 0) {
      systemApi.openNewWindow(link);
    }
    resource.outsideStatisticsList.forEach(track => {
      if (track.type === 'CLICK') {
        advertApi.track(track);
      }
    });
  };

  useEffect(() => {
    fetchAdConfig();
  }, []);

  const openAllDidClick = () => {
    setOpenAll(!openAll);
  };

  return adConfigs.length === 0 ? null : (
    <div>
      <div className={styles.sectionTitle}>
        <div>精品应用</div>
        {showExpandButton && (
          <div
            className={styles.openAll}
            onClick={() => {
              openAllDidClick();
            }}
          >
            {openAll ? (
              <div>
                收起
                <span style={{ position: 'relative', top: '-2px', marginLeft: '2px' }}>
                  <ArrowUp />
                </span>
              </div>
            ) : (
              <div>
                展开全部（{adConfigs.length}）
                <span style={{ position: 'relative', top: '-2px', marginLeft: '2px' }}>
                  <ArrowDown />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={openAll ? { overflow: 'hidden' } : { maxHeight: defaultHeight, overflow: 'hidden' }}>
        <div id={'flex-collection-view'} className={styles.selectedAppRoot}>
          {adConfigs.map(config => {
            return appComponent(config);
          })}
        </div>
      </div>
    </div>
  );
};
