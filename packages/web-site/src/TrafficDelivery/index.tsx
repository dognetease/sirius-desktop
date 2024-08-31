import React, { useState, useEffect } from 'react';
// import { Tabs } from '@web-site/../../web-common/src/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import styles from './index.module.scss';
import GoogleDelivery from './GoogleDelivery';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import { SiteApi, api, apis, getIn18Text } from 'api';
import FacebookDelivery from './FacebookDelivery';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const { Option } = Select;

enum DeliveryChannel {
  default = '0',
  google = '1',
  facebook = '2',
}

enum TrafficDeliverySkuStatus {
  default,
  enable,
  disabled,
}

type SiteListItem = {
  siteId: string;
  siteName: string;
  bindDomains: string[];
};

const TrafficDelivery = () => {
  // 判断流量投放是否已购买SKU
  const [skuStatus, setSkuStatus] = useState(TrafficDeliverySkuStatus.default);

  const [siteList, setSiteList] = useState<{ value: string; label: string }[]>([]);
  const [currSiteId, setCurrSiteId] = useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = useState(DeliveryChannel.default);
  const onActiveTabChange = (key: string) => {
    setActiveTab(key as DeliveryChannel);
  };

  const onSiteIdChange = (siteId: unknown) => {
    if (typeof siteId !== 'string') return;
    setCurrSiteId(siteId);
  };

  const fetchDeliverySkuStatus = async () => {
    try {
      const data = await siteApi.getAdsDeliveryByOrg();
      setSkuStatus(data ? TrafficDeliverySkuStatus.enable : TrafficDeliverySkuStatus.disabled);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSiteList = async () => {
    // 获取站点列表
    try {
      siteApi.getSiteDomainList({ isShowOuterSite: true }).then(data => {
        if (data?.length > 0) {
          setSiteList([
            ...data.map((siteItem: SiteListItem) => ({
              label: siteItem.siteName || getIn18Text('GUANWANG'),
              value: siteItem.siteId,
            })),
          ]);

          // 默认选中第0个站点，也就是最新的这个
          setCurrSiteId(data[0].siteId);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDeliverySkuStatus();
    fetchSiteList();
  }, []);

  return (
    <div className={styles.trafficDeliveryPage}>
      {skuStatus === TrafficDeliverySkuStatus.default ? (
        ''
      ) : (
        <>
          {activeTab === DeliveryChannel.facebook || skuStatus === TrafficDeliverySkuStatus.disabled ? (
            ''
          ) : (
            <div className={styles.siteListContainer}>
              <Select placeholder="请选择站点" value={currSiteId} style={{ width: '140px' }} onChange={onSiteIdChange}>
                {siteList.map(i => {
                  const { label, value } = i;
                  return (
                    <Option value={value} label={label}>
                      <div className={styles.option}>
                        <div>{label}</div>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </div>
          )}
          <Tabs defaultActiveKey={activeTab} onChange={onActiveTabChange} style={{ height: '100%' }}>
            <Tabs.TabPane tab="Google投放" tabKey={DeliveryChannel.google} key={DeliveryChannel.google}>
              {skuStatus === TrafficDeliverySkuStatus.enable ? <GoogleDelivery siteId={currSiteId || ''} /> : <FacebookDelivery switchGoogleStyle={true} />}
            </Tabs.TabPane>
            <Tabs.TabPane tab="facebook投放" tabKey={DeliveryChannel.facebook} key={DeliveryChannel.facebook}>
              <FacebookDelivery switchGoogleStyle={false} />
            </Tabs.TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default TrafficDelivery;
