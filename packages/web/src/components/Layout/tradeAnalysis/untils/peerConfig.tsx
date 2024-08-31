import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
type EChartsOption = echarts.EChartsOption;
import { getIn18Text } from 'api';
import { configProp } from './echarsConfig';

export interface PeerConfig {
  peerTrend: configProp;
  containerStatResult: configProp;
  goodsTypeStatResult: configProp;
  transportMethodStatResult: configProp;
  transportRouteDistribution: configProp;
}

const tabList = [
  {
    label: '运输次数',
    value: '1',
  },
  {
    label: '货柜数量',
    value: '2',
  },
];

export const peersConfig: PeerConfig = {
  peerTrend: {
    title: getIn18Text('QUANQIUCAIGOUQUSHI'),
    echarsConfig: {
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: [],
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#545A6E',
        },
      },
      grid: {
        left: 10,
        top: 30,
        bottom: 35,
        right: 0,
        containLabel: true,
      },
      yAxis: {
        type: 'value',
      },
      tooltip: {
        trigger: 'axis',
      },
      series: [
        {
          data: [],
          type: 'line',
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0.1875,
                color: '#4C6AFF', // 渐变色起始颜色
              },
              {
                offset: 0.8021,
                color: 'rgba(76, 106, 255, 0.43)', // 渐变色中间颜色
              },
              {
                offset: 1,
                color: 'rgba(76, 106, 255, 0)', // 渐变色结束颜色
              },
            ]),
            opacity: 0.15,
          },
          lineStyle: {
            color: '#4C6AFF',
          },
        },
      ],
    },
    tabList: tabList,
    height: 206,
  },
  containerStatResult: {
    title: '货物分布',
    echarsConfig: {
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: [],
        axisTick: {
          show: false,
        },
      },
      grid: {
        left: 10,
        top: 30,
        bottom: 35,
        right: 0,
        containLabel: true,
      },
      yAxis: {
        type: 'value',
      },
      tooltip: {
        trigger: 'axis',
        formatter:
          '<div style="line-height: 1">{b}</div><div style="margin-top: 10px;line-height: 1"><span style="display: inline-block; width: 10px; height:10px; border-radius: 4px; background: #4C6AFF"></span> 次数：: <span style="font-weight: 600; margin-left: 10px">{c}</span> </div>',
      },
      series: [
        {
          data: [],
          type: 'bar',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: function (param) {
              return '#4C6AFF';
            },
          },
          barWidth: 16,
          barMinHeight: 1,
        },
      ],
    },
    height: 206,
  },
  goodsTypeStatResult: {
    echarsConfig: {
      tooltip: {
        trigger: 'item',
      },
      series: [
        {
          // name: 'Access From',
          type: 'pie',
          radius: ['40%', '60%'],
          color: ['#FFB54C', '#A259FF', '#FE6C5E', '#0FD683', '#FF8F78', '#4C6AFF', '#51546F', '#9a60b4', '#ea7ccc'],
          avoidLabelOverlap: true,
          minAngle: 1,
          itemStyle: {
            borderRadius: 0,
            borderWidth: 6,
          },
          label: {
            show: true,
            formatter(param) {
              if (param.percent) {
                return param.name + ' (' + param.percent + '%)';
              } else {
                return param.name;
              }
            },
            color: 'inherit',
          },
          emphasis: {
            label: {
              fontWeight: 'bold',
            },
          },
          data: [],
        },
      ],
    },
    height: 275,
  },
  transportMethodStatResult: {
    echarsConfig: {
      tooltip: {
        trigger: 'item',
      },
      series: [
        {
          // name: 'Access From',
          type: 'pie',
          radius: ['40%', '60%'],
          color: ['#FFB54C', '#A259FF', '#FE6C5E', '#0FD683', '#FF8F78', '#4C6AFF', '#51546F', '#9a60b4', '#ea7ccc'],
          avoidLabelOverlap: true,
          minAngle: 1,
          itemStyle: {
            borderRadius: 0,
            borderWidth: 6,
          },
          label: {
            show: true,
            formatter(param) {
              if (param.percent) {
                return param.name + ' (' + param.percent + '%)';
              } else {
                return param.name;
              }
            },
            color: 'inherit',
          },
          emphasis: {
            label: {
              fontWeight: 'bold',
            },
          },
          data: [],
        },
      ],
    },
    height: 275,
  },
  transportRouteDistribution: {
    echarsConfig: {
      yAxis: {
        type: 'category',
        boundaryGap: true,
        data: [],
        axisTick: {
          show: false,
        },
      },
      grid: {
        left: 10,
        top: 30,
        bottom: 35,
        right: 0,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
      },
      tooltip: {
        trigger: 'axis',
        formatter:
          '<div style="line-height: 1">{b}</div><div style="margin-top: 10px;line-height: 1"><span style="display: inline-block; width: 10px; height:10px; border-radius: 4px; background: #4C6AFF"></span> 运输次数：: <span style="font-weight: 600; margin-left: 10px">{c}</span> </div>',
      },
      series: [
        {
          data: [],
          type: 'bar',
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: function (param) {
              return '#4C6AFF';
            },
          },
          barWidth: 16,
          barMinHeight: 1,
        },
      ],
    },
    tabList: tabList.filter(item => item.value === '1'),
    height: 206,
  },
};
