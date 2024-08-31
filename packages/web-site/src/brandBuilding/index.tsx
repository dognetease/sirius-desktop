import React, { useState } from 'react';
import { useLocation } from '@reach/router';
import { DataTrackerApi, apiHolder, apis, getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { CardList } from '../components/CardList';
import { IntroVideo } from '../mySite/components/IntroVideo';
import { Banner } from './components/Banner';
import { Advertise } from './components/Advertise';
import { SNS } from './components/SNS';
import { Site } from './components/Site';
import { PAGE_TYPE } from '../constants';
import styles from './style.module.scss';
import SkuIntroducePanel from './components/SkuIntroducePanel';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const BrandBuilding = () => {
  const location = useLocation();
  const [showContact, setShowContact] = useState(false);
  const contact = () => setShowContact(true);

  return (
    <div className={styles.container}>
      <div className={styles.outer}>
        <div className={styles.line}>
          <div className={styles.add} style={{ width: 105, height: 28 }}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.left} style={{ marginTop: -48 }}>
            <span className={styles.title}>品牌首页</span>
            <Banner onClick={contact} />
            <Site />
            <SNS onClick={contact} />
            <Advertise onClick={contact} />
          </div>
          <div className={styles.right}>
            <IntroVideo
              hash={location.hash}
              videoParams={{
                source: 'pinpaijianshe',
                scene: 'pinpaijianshe_1',
                videoId: 'V23',
                posterUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/12/20/989c412856654f488ca85cc3ca16c476.png',
              }}
              onPlayClick={() => {
                trackApi.track('waimao_brand_home_videoclick');
              }}
            />
            <CardList pageType={PAGE_TYPE.BRAND} />
          </div>
        </div>
      </div>
      <Modal
        zIndex={800}
        visible={showContact}
        getContainer={false}
        width={816}
        className={styles.contactModal}
        title=""
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        onCancel={() => setShowContact(false)}
      >
        <SkuIntroducePanel />
      </Modal>
    </div>
  );
};
