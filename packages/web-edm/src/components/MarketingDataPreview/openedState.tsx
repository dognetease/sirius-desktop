import React, { FC, useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { QueryReport } from 'api';

import styles from './MarketingDataPreview.module.scss';

const colorConf = ['#4C6AFF', '#0FD683', '#FFB54C', '#FE6C5E', '#00C4D6', '#A259FF'];

const getBasicOption = (data: QueryReport['readStat']['countryList']) => ({
  tooltip: {
    trigger: 'item',
  },
  // legend: {
  //   top: '5%',
  //   left: 'center'
  // },
  series: [
    {
      type: 'pie',
      // radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      // label: {
      //   show: false,
      //   position: 'center'
      // },
      // emphasis: {
      //   label: {
      //     show: true,
      //     fontSize: 40,
      //     fontWeight: 'bold'
      //   }
      // },
      labelLine: {
        show: true,
      },
      data: data.map((state, index) => ({
        value: state.readCount,
        name: state.country,
        itemStyle: {
          color: colorConf[index],
        },
      })),
      label: {
        formatter: '{b}: {@2012} ({d}%)',
      },
    },
  ],
});

export const OpenedState: FC<{
  data: QueryReport['readStat']['countryList'];
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
      setOption(getBasicOption(data));
    }
  }, [data]);

  useEffect(() => {
    if (myChart && option) {
      myChart.setOption(option);
    }
  }, [myChart, option]);

  return <div className={styles.chartWrapper} ref={containerRef}></div>;
};
