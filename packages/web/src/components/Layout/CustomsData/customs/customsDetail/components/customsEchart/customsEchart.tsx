import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { resCustomsStatistics as statisticsType, getIn18Text } from 'api';
import { YearRangePicker } from '../YearRangePicker';
import { useMeasure } from 'react-use';

interface Props {
  statistics: statisticsType;
  type: 'buysers' | 'suppliers';
}
const LineEcharts = ({ statistics, type }: Props) => {
  const lineRef = useRef(null);
  const y1Name = useMemo(() => (type === 'buysers' ? getIn18Text('JINKOUJINE') : getIn18Text('CHUKOUJINE')), [type]);
  const y2Name = useMemo(() => (type === 'buysers' ? getIn18Text('JINKOUCISHU') : getIn18Text('CHUKOUCISHU')), [type]);
  const title = useMemo(() => (type === 'buysers' ? getIn18Text('JINKOUQUSHI') : getIn18Text('CHUKOUQUSHI')), [type]);
  const [domRef, { width }] = useMeasure<HTMLDivElement>();
  const rendeLineChart = () => {
    let chart = null;
    const myChart = echarts.getInstanceByDom(lineRef?.current as unknown as HTMLDivElement);
    if (myChart) {
      chart = myChart;
    } else {
      chart = echarts.init(lineRef?.current as unknown as HTMLDivElement);
    }
    console.log('myChart', myChart);
    chart?.clear();
    const option = {
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        top: '100px',
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true,
      },
      legend: {
        data: [y1Name, y2Name],
        itemWidth: 8,
        itemHeight: 8,
      },
      color: ['#4C6AFF', '#FE5B4C', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      xAxis: {
        type: 'category',
        offset: 16,
        data: statistics.dateTimeList,
      },
      yAxis: [
        {
          position: 'left',
          type: 'value',
          name: `${y1Name}`,
          alignTicks: true,
          lineStyle: {
            type: 'dashed',
          },
        },
        {
          position: 'right',
          type: 'value',
          alignTicks: true,
          name: y2Name,
          lineStyle: {
            type: 'dashed',
          },
        },
      ],
      series: [
        {
          data: statistics.priceList,
          type: 'line',
          yAxisIndex: 0,
          name: y1Name,
          symbolSize: 8,
        },
        {
          data: statistics.countList,
          type: 'line',
          yAxisIndex: 1,
          name: y2Name,
          symbolSize: 8,
        },
      ],
    };
    chart?.setOption(option);
  };
  useEffect(() => {
    if (lineRef?.current) {
      const myChart = echarts.getInstanceByDom(lineRef?.current as unknown as HTMLDivElement);
      if (myChart) {
        myChart.resize();
      }
    }
  }, [width]);
  useEffect(() => {
    if (statistics) {
      rendeLineChart();
    }
  }, [statistics]);
  return (
    <div style={{ position: 'relative', marginBottom: 26 }} ref={domRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#272E47', fontSize: '14px', fontWeight: 'bold' }}>{title}</div>
        {/* <YearRangePicker year={year} onChangeYear={onChangeYear} /> */}
      </div>
      <div ref={lineRef} style={{ width: '100%', height: 278 }} />
    </div>
  );
};
export { LineEcharts };
