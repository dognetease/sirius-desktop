import React, { FC, useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { SubjectAnalysisRes, getIn18Text } from 'api';

import { EchartWrap, EcahrtOption } from '../components/EchartWrap';
import styles from './TaskDiagnosis.module.scss';

const colorsConf = ['#4C6AFF', '#1ACADA', '#FFCA7E', '#FE6B5E', '#6557FF', '#A259FF', '#83B3F7', '#FE9D94', '#C0C8D6'];

export const PieMap: FC<{
  data: Array<{
    name: string;
    value: number;
  }>;
}> = ({ data }) => {
  const [option, setOption] = useState<EcahrtOption>();

  useEffect(() => {
    if (data) {
      setOption({
        tooltip: {
          trigger: 'item',
        },
        legend: {
          top: 30,
          left: 236,
          orient: 'vertical',
          align: 'left',
          itemGap: 0,
          icon: 'circle',
          // 修改icon大小
          itemHeight: 6,
          textStyle: {
            color: '#747A8C',
            lineHeight: 24,
          },
        },
        series: [
          {
            // name: '',
            type: 'pie',
            radius: ['45%', '75%'],
            center: [115, '50%'],
            avoidLabelOverlap: false,
            emphasis: {
              label: {
                show: false,
              },
            },
            label: {
              normal: {
                show: false,
              },
              formatter: '{b}: {@2012} ({d}%)',
            },
            labelLine: {
              normal: {
                show: false,
              },
            },
            data: data.map((item, index) => ({
              labelLine: {
                show: false,
              },
              ...item,
              ...(colorsConf[index]
                ? {
                    itemStyle: {
                      color: colorsConf[index],
                    },
                  }
                : {}),
            })),
          },
        ],
      });
    }
  }, [data]);

  if (option == null) {
    return (
      <div className={styles.pieWrap} style={{ padding: 12 }}>
        <Skeleton active />
      </div>
    );
  }
  return <EchartWrap className={styles.pieWrap} echartOption={option} />;
};
