import { getIn18Text } from 'api';
import React, { FC, useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { SubjectAnalysisRes } from 'api';

import { EchartWrap, EcahrtOption } from '../EchartWrap';
import styles from './UserInfoDetail.module.scss';

const DeviceLabels = [getIn18Text('DIANNAODUAN'), 'IOS', 'IPAD', getIn18Text('ANZHUO'), getIn18Text('WEISHIBIE')];
const Colors = ['#7088FF', '#4759B2', '#FE9D94', '#00C4D6', '#B7BAC2'];
const DeviceLabelColor = DeviceLabels.map((label, index) => ({
  label,
  color: Colors[index],
}));

export const DeviceMap: FC<{
  data: SubjectAnalysisRes['contactInfoAnalysisList'][0]['analysisDetailList'];
}> = ({ data }) => {
  const [option, setOption] = useState<EcahrtOption>();

  useEffect(() => {
    if (data) {
      const curData = data.map(item => ({
        value: item.count,
        name: item.desc,
        itemStyle: {
          color: DeviceLabelColor.find(item1 => item1.label === item.desc)?.color || '',
        },
      }));
      setOption({
        tooltip: {
          trigger: 'item',
        },
        legend: {
          top: '0',
          left: '1%',
          icon: 'circle',
        },
        series: [
          {
            name: '',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            // label: {
            //   show: false,
            //   position: 'center',
            // },
            emphasis: {
              // label: {
              //   show: true,
              //   fontSize: 40,
              //   fontWeight: 'bold',
              // },
            },
            labelLine: {
              show: false,
            },
            data: curData,
          },
        ],
      });
    }
  }, [data]);

  if (option == null) {
    return (
      <div
        className={styles.chartsWrap}
        style={{
          padding: 12,
        }}
      >
        <Skeleton active />
      </div>
    );
  }

  return <EchartWrap className={styles.chartsWrap} echartOption={option} />;
};
