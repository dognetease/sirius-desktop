import React, { FC, useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { SubjectAnalysisRes, getIn18Text } from 'api';

import { EchartWrap, EcahrtOption } from '../EchartWrap';
import styles from './UserInfoDetail.module.scss';

export const TimeMap: FC<{
  data: SubjectAnalysisRes['contactInfoAnalysisList'][0]['analysisDetailList'];
  type: number;
}> = ({ data, type }) => {
  const [option, setOption] = useState<EcahrtOption>();

  useEffect(() => {
    if (data) {
      const curData = data.map(item => ({
        value: item.count,
        name: item.desc,
      }));
      setOption({
        xAxis: {
          type: 'category',
          data: curData.map(item => item.name),
          name: getIn18Text('SHIv16'),
        },
        yAxis: {
          type: 'value',
          name: getIn18Text('RENSHU'),
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          axisPointer: {
            type: 'cross',
            label: {},
          },
          formatter: function (params: any) {
            var res = params[0];
            let title = type === 0 ? getIn18Text('HUIFUSHU') : getIn18Text('DAKAISHU');

            let img = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.3125 7C1.3125 3.85888 3.85888 1.3125 7 1.3125V1.3125C10.1411 1.3125 12.6875 3.85888 12.6875 7V7C12.6875 10.1411 10.1411 12.6875 7 12.6875V12.6875C3.85888 12.6875 1.3125 10.1411 1.3125 7V7Z" stroke="#B7BAC2" stroke-width="0.875"/><path d="M6.5625 3.9375V7.4375H9.1875" stroke="#B7BAC2" stroke-width="0.875" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

            let comp = `<div style="width:130px;height:68px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;"><div style="display:flex;align-items:center;">${img}<span style="font-size:12px;margin-left:4px;line-height:16px;color:#b7bac2">时间：${res.name}</span></div><div style="font-size:16px;line-height:24px;color:#fff;">${title} ${res.value}</div></div>`;
            return comp;
          },
        },
        series: [
          {
            data: curData.map(item => item.value),
            type: 'line',
            smooth: true,
            areaStyle: {
              color: 'rgba(76, 106, 255, 0.07)',
            },
          },
        ],
      });
    }
  }, [data]);

  if (option == null) {
    return (
      <div className={styles.chartsWrap} style={{ padding: 12 }}>
        <Skeleton active />
      </div>
    );
  }
  return <EchartWrap className={styles.chartsWrap} echartOption={option} />;
};
