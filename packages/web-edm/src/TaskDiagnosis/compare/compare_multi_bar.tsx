import React, { useState, useRef, useEffect } from 'react';
import useWindowSize from '@web-common/hooks/windowResize';
import * as echarts from 'echarts';
import styles from './compare.module.scss';

// type DomainData = Array<{
//   name: string;
//   sendCount: number;
//   averageSendCount: number;
//   maxSendCount: number;
// }>;

// type BarType = 'source' | 'sendEmail' | 'domain';

type DataTypePairs =
  | {
      type: 'domain';
      data: Array<{
        name: string;
        sendCount: number;
        averageSendCount: number;
        maxSendCount: number;
      }>;
    }
  | {
      type: 'source';
      data: Array<{
        name: string;
        curValue: number;
        value: number;
      }>;
    }
  | {
      type: 'sendEmail';
      secondList: Array<{
        sendCount: number;
        email: string;
        averageSendCount: number;
        maxSendCount: number;
      }>;
      data: Array<{
        name: string;
      }>;
    };

const bestData = [280, 20, 50];

const Colors = ['#4C6AFF', '#00C4D6', '#FFC470', '#FE6C5E', '#0FD683'];

const getBarItem = (name: string, data: Array<number>, index: number) => ({
  data,
  name: name,
  barGap: 0,
  type: 'bar',
  barWidth: 24,
  barMinHeight: 1,
  itemStyle: {
    color: Colors[index],
    emphasis: {
      color: Colors[index],
    },
    borderRadius: [4, 4, 0, 0],
  },
  label: {
    show: true,
    position: 'top',
    color: '#747A8C',
    fontSize: 12,
    fontFamily: 'DIN Alternate',
  },
});

const getSeries = (params: DataTypePairs) => {
  // const { data, type } = params;
  if (params.type === 'source') {
    return [
      {
        data: params.data.map(item => item.value),
        barGap: 0,
        name: '贵司结果',
        type: 'bar',
        barWidth: 24,
        barMinHeight: 2,
        itemStyle: {
          color: '#4C6AFF',
          emphasis: {
            color: '#4C6AFF',
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#747A8C',
          fontSize: 12,
          fontFamily: 'DIN Alternate',
        },
      },
      {
        data: params.data.map(item => item.curValue),
        name: '优秀企业',
        type: 'bar',
        barWidth: 24,
        barMinHeight: 2,
        itemStyle: {
          color: '#EBEDF2',
          emphasis: {
            color: '#EBEDF2',
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#747A8C',
          fontSize: 12,
          fontFamily: 'DIN Alternate',
        },
      },
    ];
  }

  if (params.type === 'sendEmail') {
    return [
      ...params.secondList.map((dataItem, index) => getBarItem(dataItem.email, [dataItem.sendCount, dataItem.averageSendCount], index)),
      {
        data: [4000, 500],
        name: '优秀企业',
        type: 'bar',
        barWidth: 24,
        barMinHeight: 2,
        itemStyle: {
          color: '#EBEDF2',
          emphasis: {
            color: '#EBEDF2',
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#747A8C',
          fontSize: 12,
          fontFamily: 'DIN Alternate',
        },
      },
    ];
  }

  return [
    {
      data: params.data.map(item => item.sendCount),
      name: '单域名累计发送',
      barGap: 0,
      type: 'bar',
      barWidth: 24,
      barMinHeight: 2,
      itemStyle: {
        color: '#4C6AFF',
        emphasis: {
          color: '#4C6AFF',
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#747A8C',
        fontSize: 12,
        fontFamily: 'DIN Alternate',
      },
    },
    {
      data: params.data.map(item => item.averageSendCount),
      name: '单域名日均发送',
      type: 'bar',
      barWidth: 24,
      barMinHeight: 2,
      itemStyle: {
        color: '#00C4D6',
        emphasis: {
          color: '#00C4D6',
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#747A8C',
        fontSize: 12,
        fontFamily: 'DIN Alternate',
      },
    },
    {
      data: params.data.map(item => item.maxSendCount),
      name: '单域名单日最大发送',
      type: 'bar',
      barWidth: 24,
      barMinHeight: 2,
      itemStyle: {
        color: '#FFC470',
        emphasis: {
          color: '#FFC470',
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#747A8C',
        fontSize: 12,
        fontFamily: 'DIN Alternate',
      },
    },
  ];
};

const barOption = (params: DataTypePairs, needAxisEllipsis = false, needLegendEllipsis = false) => {
  const names = params.data.map(item => item.name);

  return {
    tooltip: {
      show: true,
      formatter: function (params: any, ticket: string) {
        // console.log(params, ticket, '-----params');
        // var res = params[0];
        // let title = '我是测试';

        // let img = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.3125 7C1.3125 3.85888 3.85888 1.3125 7 1.3125V1.3125C10.1411 1.3125 12.6875 3.85888 12.6875 7V7C12.6875 10.1411 10.1411 12.6875 7 12.6875V12.6875C3.85888 12.6875 1.3125 10.1411 1.3125 7V7Z" stroke="#B7BAC2" stroke-width="0.875"/><path d="M6.5625 3.9375V7.4375H9.1875" stroke="#B7BAC2" stroke-width="0.875" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        // let comp = `<div style="width:130px;height:68px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;"><div style="display:flex;align-items:center;">${img}<span style="font-size:12px;margin-left:4px;line-height:16px;color:#b7bac2">时间：${res.name}</span></div><div style="font-size:16px;line-height:24px;color:#fff;">${title} ${res.value}</div></div>`;
        // return comp;
        return `<span style="color:#9FA2AD;font-size:12px;">${
          names[params.dataIndex]
        }</span><br /><div style="font-size:12px;margin-top:4px;position:relative;padding-left:10px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${
          params.color
        };margin-right:4px;position:absolute;top:7px;left:0;"></span>${params.seriesName}&nbsp;&nbsp;&nbsp;&nbsp;${params.value}</div>`;
      },
    },
    grid: {
      top: 60,
      left: 12,
      right: 12,
      bottom: 4,
      containLabel: true,
    },
    legend: {
      width: needLegendEllipsis ? 226 : 364,
      right: 0,
      itemWidth: 8,
      itemHeight: 8,
      icon: 'circle',
      formatter: ['{a|{name}}'].join('\n'),
      orient: 'horizontal',
      textStyle: {
        color: '#545A6E',
        rich: {
          a: {
            // width: 98,
            lineHeight: 20,
          },
        },
        // 是否需要 legend 的隐藏
        ...(needLegendEllipsis
          ? {
              width: 53,
              overflow: 'truncate',
            }
          : {}),
      },
      tooltip: {
        show: true,
      },
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
        color: '#747A8C',
        interval: 0,
        // 是否超出隐藏
        ...(needAxisEllipsis
          ? {
              width: 64,
              overflow: 'truncate',
            }
          : {}),
      },
      data: names,
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
        endValue: 5,
        xAxisIndex: [0],
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
      },
    ],
    series: getSeries(params),
  };
};

export type CompareMultiBarProps = {
  title: string | JSX.Element;
  titleLineColor: string;
  needAxisEllipsis?: boolean;
  needLegendEllipsis?: boolean;
} & DataTypePairs;

const CompareMultiBar = (props: CompareMultiBarProps) => {
  const { title, data, type, titleLineColor, needAxisEllipsis = false, needLegendEllipsis = false } = props;
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
      let option: any = { ...barOption(props, needAxisEllipsis, needLegendEllipsis) };
      barChart.setOption(option);
    }
  }, [barChart, barOption]);

  useEffect(() => {
    if (offset?.width && barChart) {
      barChart.resize();
    }
  }, [offset?.width]);

  return (
    <div className={styles.multiBarWrapper}>
      <p className={styles.title}>
        <span
          className={styles.line}
          style={{
            backgroundColor: titleLineColor,
          }}
        ></span>
        {title}
      </p>
      <div className={styles.bar} ref={barRef}></div>
    </div>
  );
};

export default CompareMultiBar;
