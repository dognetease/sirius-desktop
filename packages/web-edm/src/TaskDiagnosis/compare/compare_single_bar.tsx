import React, { useState, useRef, useEffect } from 'react';
import useWindowSize from '@web-common/hooks/windowResize';
import * as echarts from 'echarts';
import styles from './compare.module.scss';

type Data = Array<{
  value: number;
  name: string;
}>;

const barOption = (data: Data, recommendValue: number) => ({
  tooltip: {
    show: true,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    axisLine: {
      lineStyle: {
        color: '#E1E3E8',
      },
      // formatter: (params: string) => {
      //   let str = '';
      //   if (params.length > 7) {
      //     str = params.substr(0, 7) + '...';
      //     return str;
      //   }
      //   return params;
      // },
    },
    axisTick: {
      alignWithLabel: true,
      lineStyle: {
        color: '#E1E3E8',
      },
    },
    axisLabel: {
      color: '#747A8C',
      interval: 0,
      width: 64,
      overflow: 'truncate',
    },
    data: ['优秀企业', ...data.map(item => item.name)],
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      show: false,
    },
    splitLine: {
      lineStyle: {
        type: 'dashed',
        color: '#E1E3E8',
      },
    },
    splitNumber: 3,
  },
  dataZoom: [
    {
      type: 'inside',
      startValue: 0,
      endValue: 3,
      xAxisIndex: [0],
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true,
      moveOnMouseMove: true,
    },
  ],
  series: [
    {
      data: [
        {
          value: recommendValue,
          name: '优秀企业',
          itemStyle: {
            color: '#EBEDF2',
            emphasis: {
              color: '#EBEDF2',
            },
          },
        },
        ...data.map(item => ({
          name: item.name,
          value: item.value,
        })),
      ],
      type: 'bar',
      barWidth: 24,
      barMinHeight: 1,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(76, 106, 255, 0.70)' },
          { offset: 1, color: '#4C6AFF' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#747A8C',
        fontSize: 12,
        fontFamily: 'DIN Alternate',
        width: 64,
      },
    },
  ],
});

export interface CompareSingleBarProps {
  title: string;
  titleLineColor: string;
  data: Data;
  recommendValue: number;
}

const CompareSingleBar = (props: CompareSingleBarProps) => {
  const { title, titleLineColor, data, recommendValue } = props;
  const [barChart, setBarChart] = useState<echarts.ECharts | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // 监听窗口缩放
  const offset = useWindowSize(false);

  useEffect(() => {
    if (barRef.current) {
      const myChart = echarts.init(barRef.current);
      setBarChart(myChart);
    }
  }, [barRef.current]);
  useEffect(() => {
    if (barChart && barOption) {
      let option: any = { ...barOption(data, recommendValue) };
      barChart.setOption(option);
    }
  }, [barChart, barOption]);

  useEffect(() => {
    if (offset?.width && barChart) {
      barChart.resize();
    }
  }, [offset?.width]);

  return (
    <div className={styles.barWrapper}>
      <p className={styles.title}>
        <span className={styles.line} style={{ backgroundColor: titleLineColor }}></span>
        {title}
      </p>
      <div className={styles.bar} ref={barRef}></div>
    </div>
  );
};

export default CompareSingleBar;
