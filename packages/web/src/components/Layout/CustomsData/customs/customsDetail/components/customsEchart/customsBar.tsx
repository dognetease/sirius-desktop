import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { topNCompanyInfoItem as barItemType, getIn18Text } from 'api';
import { YearRangePicker } from '../YearRangePicker';

interface Props {
  type: 'buysers' | 'suppliers';
  barData: barItemType[];
}
const BarEcharts = ({ barData, type }: Props) => {
  const lineRef = useRef(null);
  const title = useMemo(() => `Top10${type === 'buysers' ? getIn18Text('CAIGOUSHANG') : getIn18Text('GONGYINGSHANG')}`, [type]);
  const rendeBarChart = () => {
    let chart = null;
    const myChart = echarts.getInstanceByDom(lineRef?.current as unknown as HTMLDivElement);
    if (myChart) {
      chart = myChart;
    } else {
      chart = echarts.init(lineRef?.current as unknown as HTMLDivElement);
    }
    console.log('myChart', myChart);
    chart?.clear();
    let renderData = barData.map(item => {
      return {
        value: Number(item.price),
        name: item.companyName,
      };
    });
    console.log('renderData', renderData);
    const option = {
      color: ['#4C6AFF', '#0FD683', '#FFD500', '#FE5B4C', '#FFB54C', '#00CCAA', '#00C4D6', '#6557FF', '#8C54FE', '#F05B74'],
      tooltip: {
        trigger: 'item',
        //   formatter: function(params){
        //     console.log('params', params);
        //      let result = params.data.name + "<br />";
        //      result += params.marker + params.seriesName + ":" + params.value + "<br />" ;
        //      result += params.marker + 'country' + ":" + params.data.country;
        //       return result;
        //  }
      },
      legend: {
        // orient: 'vertical',
        // left: 'left',
        // top: 30,
        // top: 'bottom',
        bottom: 0,
        // itemGap: 200,
      },
      series: [
        {
          name: `${type === 'buysers' ? getIn18Text('CAIGOUSHANG') : getIn18Text('GONGYINGSHANG')}`,
          type: 'pie',
          radius: ['25%', '50%'],
          center: ['50%', '40%'],
          label: {
            color: '#7A8599',
            // show: true,
            position: 'outer',
            alignTo: 'none',
            bleedMargin: 5,
            // positon: 'outer',
            // alignTo: 'labelLine'
          },
          // avoidLabelOverlap: false,
          // itemStyle: {
          //   borderRadius: 10,
          //   borderColor: '#fff',
          //   borderWidth: 2
          // },
          // label: {
          //   show: false,
          //   position: 'center'
          // },
          // emphasis: {
          //   label: {
          //     show: false,
          //     fontSize: '40',
          //     fontWeight: 'bold'
          //   }
          // },
          // labelLine: {
          //   show: false
          // },
          data: renderData,
        },
      ],
    };
    chart?.setOption(option);
  };
  useEffect(() => {
    if (barData) {
      rendeBarChart();
    }
  }, [barData]);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#272E47', fontSize: '14px', fontWeight: 'bold' }}>{title}</div>
        {/* <YearRangePicker year={year} onChangeYear={onChangeYear} /> */}
      </div>
      <div ref={lineRef} style={{ width: '100%', height: 298 }} />
    </div>
  );
};
export { BarEcharts };
