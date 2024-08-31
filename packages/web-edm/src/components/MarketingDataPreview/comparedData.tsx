import React, { FC, useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { QueryReport } from 'api';

import styles from './MarketingDataPreview.module.scss';
import { getIn18Text } from 'api';

const dataConf = ['arriveRatio', 'readRatio', 'replyRatio'];

const colorConf = ['#445FE5', '#00CCAA'];

export const ComparedData: FC<{
  data: QueryReport['compareStat'];
}> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myChart, setMyChart] = useState<echarts.ECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsCoreOption | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const myChart = echarts.init(containerRef.current);
      setMyChart(myChart);
    }
  }, [containerRef.current]);

  useEffect(() => {
    if (data) {
      setOption({
        xAxis: {
          type: 'category',
          data: [getIn18Text('SONGDALV'), getIn18Text('DAKAILV'), getIn18Text('HUIFULV')],
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function (value: number) {
              return value + '%';
            },
          },
        },
        legend: {
          top: '5%',
          right: 0,
        },
        series: [
          {
            name: getIn18Text('YONGHUSHUJU'),
            data: dataConf.map((conf, index) => ({
              value: parseFloat((data.userData as any)[conf]),
            })),
            type: 'bar',
            barGap: '60%',
            barWidth: 26,
            itemStyle: {
              color: colorConf[0],
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}%',
            },
          },
          {
            name: getIn18Text('XITONGSHUJU'),
            data: dataConf.map((conf, index) => ({
              value: parseFloat((data.systemData as any)[conf]),
            })),
            type: 'bar',
            barWidth: 26,
            itemStyle: {
              color: colorConf[1],
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}%',
            },
          },
        ],
      });
    }
  }, [data]);

  useEffect(() => {
    if (myChart && option) {
      myChart.setOption(option);
    }
  }, [myChart, option]);

  return <div className={styles.chartWrapper} ref={containerRef}></div>;
};
