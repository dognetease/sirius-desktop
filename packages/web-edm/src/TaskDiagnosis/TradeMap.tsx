import React, { FC, useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { SubjectAnalysisRes, getIn18Text } from 'api';

import { EchartWrap, EcahrtOption } from '../components/EchartWrap';
import styles from './TaskDiagnosis.module.scss';

export interface TradeMapType {
  recommend?: number;
  data?: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
}

export const TradeMap: FC<TradeMapType> = ({ data, recommend, title }) => {
  const [option, setOption] = useState<EcahrtOption>();

  useEffect(() => {
    if (data && recommend != null) {
      setOption({
        color: '#0CA', // 主题颜色
        // hover x 轴垂直样式
        axisPointer: {
          lineStyle: {
            color: '#8D92A1',
            type: 'solid',
          },
        },
        emphasis: {
          itemStyle: {
            // borderWidth: 0,
            color: '#0CA',
            borderWidth: 5,
            borderType: 'solid',
            borderColor: '#0CA',
          },
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name),
          name: '',
          axisTick: {
            alignWithLabel: true,
          },
          axisLine: {
            lineStyle: {
              color: '#E1E3E8',
            },
          },
          axisLabel: {
            color: '#545A6E',
          },
        },
        yAxis: {
          type: 'value',
          name: '',
          splitLine: {
            //网格线
            lineStyle: {
              type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
              width: 1,
            },
            show: true, //隐藏或显示
            color: ['#E1E3E8'],
          },
          splitNumber: 4,
        },
        // itemStyle: {
        //   normal: {
        //     lineStyle: {
        //       type: 'dotted', //'dotted'虚线 'solid'实线
        //     },
        //   },
        // },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#fff',
          axisPointer: {
            type: 'cross',
            label: {},
          },
          formatter: `<span style="color:#9FA2AD;">{b}</span><br /><div style="margin-top:4px;position:relative;padding-left:10px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#0CA;margin-right:4px;position:absolute;top:7px;left:0;"></span>${title}&nbsp;&nbsp;&nbsp;&nbsp;{c}</div>`,
          // formatter: function (params: any) {
          //   var res = params[0];
          //   let title = getIn18Text('DAKAISHU');

          //   let img = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.3125 7C1.3125 3.85888 3.85888 1.3125 7 1.3125V1.3125C10.1411 1.3125 12.6875 3.85888 12.6875 7V7C12.6875 10.1411 10.1411 12.6875 7 12.6875V12.6875C3.85888 12.6875 1.3125 10.1411 1.3125 7V7Z" stroke="#B7BAC2" stroke-width="0.875"/><path d="M6.5625 3.9375V7.4375H9.1875" stroke="#B7BAC2" stroke-width="0.875" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

          //   let comp = `<div style="width:130px;height:68px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;"><div style="display:flex;align-items:center;">${img}<span style="font-size:12px;margin-left:4px;line-height:16px;color:#b7bac2">时间：${res.name}</span></div><div style="font-size:16px;line-height:24px;color:#fff;">${title} ${res.value}</div></div>`;
          //   return comp;
          // },
        },
        series: [
          {
            data: data.map(item => item.value),
            type: 'line',
            // symbol: 'none',
            symbol: 'circle',
            symbolSize: 0,
            // smooth: true,
            areaStyle: {
              // color: 'rgba(218, 245, 233, 0.8)',
              normal: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: '#DAF5E9',
                    },
                    {
                      offset: 1,
                      color: 'rgba(218, 245, 233, 0.00)',
                    },
                  ],
                  globalCoord: false,
                },
              },
            },
            lineStyle: {
              color: '#0CA',
              width: 1.5,
            },
            markLine: {
              symbol: 'none',
              label: {
                position: 'start',
              },
              data: [
                {
                  silent: false,
                  lineStyle: {
                    color: '#0FD683',
                  },
                  // todo动态的
                  yAxis: recommend,
                  name: '',
                  label: {
                    formatter: '优秀企业指标',
                    position: 'start',
                    borderColor: '#0FD683',
                    color: '#0FD683',
                    padding: [0, 6],
                    borderWidth: 1,
                    fontSize: 11,
                    lineHeight: 18,
                    borderRadius: 9,
                    distance: -78,
                    backgroundColor: '#fff',
                  },
                },
              ],
            },
          },
        ],
        grid: {
          top: 16,
          left: 12,
          right: 12,
          bottom: 4,
          containLabel: true,
        },
      });
    }
  }, [data, recommend, title]);

  if (option == null) {
    return (
      <div className={styles.chartsWrap} style={{ padding: 12 }}>
        <Skeleton active />
      </div>
    );
  }
  return <EchartWrap className={styles.chartsWrap} echartOption={option} />;
};
