import React, { FC, useState, useRef, useEffect } from 'react';
import { QueryReport } from 'api';
import * as echarts from 'echarts';

import styles from './MarketingDataPreview.module.scss';
import { getIn18Text } from 'api';

const getBasicOption = (data: QueryReport['replyStat']['timeList']) => ({
  xAxis: {
    type: 'category',
    data: data.map(item => item.time),
    name: getIn18Text('SHIv16'),
  },
  yAxis: {
    type: 'value',
    name: getIn18Text('RENSHU'),
  },
  series: [
    {
      data: data.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(76, 106, 255, 0.07)',
      },
    },
  ],
});

export const ReplayedTime: FC<{
  data: QueryReport['replyStat']['timeList'];
}> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myChart, setMyChart] = useState<echarts.ECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsCoreOption | null>(null);
  const myChartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const myChart = echarts.init(containerRef.current);
      setMyChart(myChart);
    }
  }, [containerRef.current]);

  useEffect(() => {
    if (data) {
      setOption(getBasicOption(data));
    }
  }, [data]);

  const resize = () => {
    if (myChartRef.current) {
      myChartRef.current.resize();
    }
  };
  useEffect(() => {
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);
  useEffect(() => {
    myChartRef.current = myChart;
  }, [myChart]);

  useEffect(() => {
    if (myChart && option) {
      myChart.setOption(option);
    }
  }, [myChart, option]);

  return <div className={styles.chartWrapper} ref={containerRef}></div>;
};
