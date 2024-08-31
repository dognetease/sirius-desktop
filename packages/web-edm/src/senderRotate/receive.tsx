import React, { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { WarmUpData } from 'api';
import useWindowSize from '@web-common/hooks/windowResize';
import { getDateStrList } from './utils';
import styles from './receive.module.scss';

interface Props {
  info: WarmUpData;
}

const lineOption = {
  tooltip: {
    trigger: 'axis',
    formatter: function (param: any) {
      return (
        `<p style='color:#9FA2AD; font-size: 12px;height:20px;line-height:20px;margin-bottom: 0'>${param[0].name}</p>` +
        param
          .map(function (item: any) {
            return `<p style='font-size: 12px;height:20px;line-height:20px;margin-top: 4px;margin-bottom:0;'><span style='display:inline-block;margin-right:4px;border-radius:4px;width:8px;height:8px;background-color:${item.color};'></span><span style='display: inline-block;color:#545A6E; width: 79px;'>${item.seriesName}</span><span style='color:#272E47; width: 102px;'>${item.value}</span></p>`;
          })
          .join('')
      );
    },
  },
  legend: {
    itemWidth: 6,
    itemHeight: 6,
    icon: 'circle',
    right: 0,
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
    },
    axisTick: {
      alignWithLabel: true,
      lineStyle: {
        color: '#E1E3E8',
      },
    },
    axisLabel: {
      color: '#545A6E',
    },
    data: [] as string[],
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        type: 'dashed',
        color: '#E1E3E8',
      },
    },
  },
  series: [] as any,
};

const Receive = (props: Props) => {
  const { info } = props;
  const [lineChart, setLineChart] = useState<echarts.ECharts | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // 监听窗口缩放
  const offset = useWindowSize(false);

  useEffect(() => {
    if (lineRef.current) {
      const myChart = echarts.init(lineRef.current);
      setLineChart(myChart);
    }
  }, [lineRef.current]);

  useEffect(() => {
    if (lineChart && info && lineOption) {
      let option: any = { ...lineOption };
      let totalSent: number[] = [];
      let totalReceived: number[] = [];
      let xAxisData: string[] = [];
      if (info.dailyData && info.dailyData.length > 0) {
        info.dailyData?.forEach(i => {
          const dataStr = (i.date || '').split('-').slice(-2).join('-');
          xAxisData.push(dataStr);
          totalSent.push(i.sent || 0);
          totalReceived.push(i.received || 0);
        });
        option.yAxis.min = null;
        option.yAxis.max = null;
        option.yAxis.interval = null;
      } else {
        xAxisData = getDateStrList(info.filterDate || 14);
        totalSent = new Array(xAxisData.length).fill('-');
        totalReceived = new Array(xAxisData.length).fill('-');
        option.yAxis.min = 0;
        option.yAxis.max = 120;
        option.yAxis.interval = 30;
      }
      option.xAxis.data = xAxisData;
      option.series = [
        {
          name: '发送封数',
          type: 'line',
          color: '#4C6AFF',
          showSymbol: false,
          lineStyle: {
            width: 1.5,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(75,100,250,0.3)',
              },
              {
                offset: 1,
                color: 'rgba(75,100,250,0)',
              },
            ]),
          },
          data: totalSent,
        },
        {
          name: '收到封数',
          type: 'line',
          color: '#00CCAA',
          showSymbol: false,
          lineStyle: {
            width: 1.5,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(0,205,172,0.3)',
              },
              {
                offset: 1,
                color: 'rgba(0,205,172,0)',
              },
            ]),
          },
          data: totalReceived,
        },
      ];
      lineChart.setOption(option);
    }
  }, [lineChart, info, lineOption]);

  useEffect(() => {
    if (offset?.width && lineChart) {
      lineChart.resize();
    }
  }, [offset?.width]);

  return (
    <div className={styles.receiveWrap}>
      <p className={styles.title}>每日的预热邮件收发数据</p>
      <div className={styles.line} ref={lineRef}></div>
    </div>
  );
};

export default Receive;
