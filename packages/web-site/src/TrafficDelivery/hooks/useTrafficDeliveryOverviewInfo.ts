import React, { useState, useMemo } from 'react';
import { SiteApi, api, apis } from 'api';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export interface TrafficDeliveryOverviewInfo {
  averageCost: string; // 平均点击花费
  clicks: number; // 点击次数
  totalCost: string; // 总花费
  impressions: number; // 展示次数
  unit: string;
  clickDataList: {
    // 广告投放点击信息
    num: number;
    timePartition: string;
  }[];
  viewDataList: {
    num: number;
    timePartition: string;
  }[];
}

const useTrafficDeliveryOverviewInfo = () => {
  const [overViewInfo, setOverviewInfo] = useState<TrafficDeliveryOverviewInfo>({
    averageCost: '',
    unit: '',
    clicks: -1,
    totalCost: '',
    impressions: -1,
    clickDataList: [],
    viewDataList: [],
  });

  const viewChartDataList = useMemo(() => {
    return overViewInfo.viewDataList.map(item => {
      return [item.timePartition, item.num];
    });
  }, [overViewInfo.viewDataList]);

  const clickChartDataList = useMemo(() => {
    return overViewInfo.clickDataList.map(item => {
      return [item.timePartition, item.num];
    });
  }, [overViewInfo.clickDataList]);

  const fetchTrafficDeliveryOverviewInfo = async (siteId: string, sTime: string, eTime: string, countrys: string[]) => {
    try {
      const data = await siteApi.getTrafficDeliveryInfo({
        siteId,
        startTime: sTime,
        endTime: eTime,
        criteriaIds: countrys,
      });

      if (data) {
        const _data = data as TrafficDeliveryOverviewInfo;
        setOverviewInfo({
          averageCost: _data.averageCost,
          clicks: _data.clicks,
          totalCost: _data.totalCost,
          unit: _data.unit || '',
          impressions: _data.impressions,
          clickDataList: _data.clickDataList || [],
          viewDataList: _data.viewDataList || [],
        });
      }
    } catch (error) {
      console.error('error fetchTrafficDeliveryOverviewInfo: ', error);
    }
  };

  return {
    overViewInfo,
    viewChartDataList,
    clickChartDataList,
    fetchTrafficDeliveryOverviewInfo,
  };
};

export default useTrafficDeliveryOverviewInfo;
