import moment from 'moment';
import type { EChartsType } from 'echarts';
import { getIn18Text } from 'api';

/**
 * 获取本周、本月、本季度的开始时间和结束时间的毫秒数之和
 * @returns
 */
export const getSpecifiedDateMilliseconds = () => {
  return [
    moment().startOf('week').valueOf() + moment().endOf('day').valueOf(),
    moment().startOf('month').valueOf() + moment().endOf('day').valueOf(),
    moment().startOf('quarter').valueOf() + moment().endOf('day').valueOf(),
  ];
};

export const STAT_SWITCH_OPTIONS = [
  { label: getIn18Text('BENZHOU'), value: 'week' },
  { label: getIn18Text('BENYUE'), value: 'mouth' },
  { label: getIn18Text('BENJIDU'), value: 'quarter' },
];

interface ChartsOption {
  chart: EChartsType | null;
  data: (number[] | undefined)[];
  xAxisType?: string;
  yAxisType?: string;
  seriesType?: string;
  unit?: string; // 单位，例如：人
}

/**
 * 设置图表配置
 * @param chart echarts 实例
 * @param data 数据
 */
export const setChartsOption = ({ chart, data, xAxisType = 'category', yAxisType = 'value', seriesType = 'line', unit = '' }: ChartsOption) => {
  const option = {
    tooltip: {
      show: true,
      trigger: 'axis',
      formatter: (params: { data: string[] }[]) => {
        // 自定义tooltip展示
        var html = '';
        for (var i in params) {
          var param = params[i];
          // echarts日期格式化api
          const marker = '<span style="display:inline-block;margin-right:8px;border-radius:3px;width:6px;height:6px;background-color:#4C6AFF;"></span>';
          html += `${param.data?.[0]}<br />${marker}${param.data?.[1]} ${unit}`;
        }
        return html;
      },
      axisPointer: {
        type: seriesType === 'bar' ? 'none' : 'line',
        lineStyle: {
          type: 'solid',
          color: '#E1E3E8',
        },
      },
    },
    grid: {
      x: 10,
      y: 21,
      x2: 27,
      y2: 0,
      containLabel: true,
    },
    yAxis: {
      // 展示内容类型
      type: yAxisType,
      axisTick: {
        // y轴刻度线
        show: false,
      },
      splitLine: {
        //网格线
        lineStyle: {
          type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
        },
        show: true, //隐藏或显示
      },
      axisLabel: {
        textStyle: {
          show: true,
          fontFamily: 'PingFang SC',
          color: '#272E47',
          fontSize: '12',
        },
      },
    },
    xAxis: {
      // 根据x轴数据决定type类型
      type: xAxisType,
      boundaryGap: true, // 坐标轴两边留白
      // 刻度线
      axisTick: {
        show: false,
      },
      // x轴文字样式
      axisLabel: {
        formatter: (value: number) => {
          // 坐标轴文字展示样式处理
          const date = new Date(value);
          const texts = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
          return texts.join('-');
        },
        textStyle: {
          show: true,
          fontFamily: 'PingFang SC',
          color: '#272E47',
          fontSize: '12',
        },
        // interval:0,
        // rotate: -40,
        hideOverlap: true,
      },
      // x轴线样式
      axisLine: {
        lineStyle: {
          color: '#E1E3E8',
        },
      },
      // 注： x轴不指定data,自动会从series取
    },
    series: [
      {
        symbol: 'circle', // 实心点
        symbolSize: 6,
        emphasis: {
          // 折线图拐点 hover 时候的样式
          itemStyle: {
            borderColor: '#7088FF', //图形的描边颜色
            borderWidth: 2, // 描边的线宽
          },
        },
        // 图表类型
        type: seriesType,
        barMaxWidth: 20,
        // barMinWidth: 8,
        data,
        lineStyle: {
          color: '#4C6AFF',
        },
        itemStyle: {
          //柱状颜色和圆角
          color: '#7088FF',
          normal: {
            // 柱状图顶部展示数字
            color: '#7088FF',
            label: {
              show: false,
              position: 'top', //在上方显示
              textStyle: {
                //数值样式
                color: 'black',
                fontSize: 14,
              },
            },
          },
        },
      },
    ],
  };

  chart?.setOption(option);
};

type SiteListItem = {
  siteId: string;
  siteName: string;
  bindDomains: string[];
};

export const getSiteCascaderOptions = (siteList: Array<SiteListItem>) => {
  return [
    { label: getIn18Text('QUANBUZHANDIAN'), value: '' },
    ...siteList.map((siteItem: SiteListItem) => ({
      label: siteItem.siteName || getIn18Text('GUANWANG'),
      value: siteItem.siteId,
      children:
        siteItem.bindDomains?.length > 1
          ? siteItem.bindDomains.map(d => ({
              value: d,
              label: d,
            }))
          : [],
    })),
  ];
};
