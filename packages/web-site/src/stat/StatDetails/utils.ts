import type { EChartsType } from 'echarts';

export const timeItemStyleLabelFormatter = (params: { value: number[] }) => {
  if (!params.value[0]) {
    return '';
  }
  let time = moment.duration(params.value[0], 'minutes'); //得到一个对象，里面有对应的时分秒等时间对象值
  let allHour = 0;
  let hours: string | number = time.hours();
  let minutes: string | number = time.minutes();
  let seconds: string | number = time.seconds();
  const days = time.days();
  const months = time.months();
  const years = time.years();

  if (years) {
    const time = moment.duration(years, 'years');
    allHour += time.asHours();
  }

  if (months) {
    const time = moment.duration(months, 'months');
    allHour += time.asHours();
  }

  if (days) {
    const time = moment.duration(days, 'days');
    allHour += time.asHours();
  }

  let arr = [];
  if (hours) {
    allHour += hours;
    hours = `${allHour}小时`;
    arr.push(hours);
  }

  if (minutes) {
    minutes = `${!arr.length ? '' : minutes < 10 ? 0 : ''}${minutes}分`;
    arr.push(minutes);
  }
  if (seconds) {
    seconds = `${!arr.length ? '' : seconds < 10 ? 0 : ''}${seconds}秒`;
    arr.push(seconds);
  }

  return arr.join('');
};

interface LineChartsOption {
  chart: EChartsType | null; // echarts 实例
  data: Array<(number | string)[]>; // 数据
  names?: Array<string>; // 图例的数据数组，数组项代表一个折线的 name。names空表示一条线，非空表示多条线，分站点或分域名查看数据
}

const textStyle = {
  show: true,
  fontFamily: 'PingFang SC',
  color: '#272E47',
  fontSize: '12',
};

// StatDetails 设置折线图配置
export function setLineChartsOption({ chart, data = [], names }: LineChartsOption) {
  function getSeries() {
    if (names) {
      // 筛选项为全部站点
      const colors = ['#6557FF', '#00CCAA', '#FFB54C', '#FE9D94', '#BB98FE', '#00C4D6', '#A259FF', '#4C6AFF', '#83B3F7', '#C0C8D6', '#4E5A70'];
      return data.map((dataItem: any, index: number) => ({
        type: 'line',
        data: dataItem,
        name: names[index],
        showSymbol: data[0]?.length == 1, // 如果日期筛选范围只有一天，折线图展示一个圆点
        symbolSize: 6,
        symbol: 'circle', // 实心点
        lineStyle: {
          width: 1.5,
          color: colors[index % 11],
        },
        color: colors[index % 11],
      }));
    }

    // 筛选项为单个站点
    return [
      {
        type: 'line',
        data,
        symbol: 'circle', // 实心点
        symbolSize: 6,
        emphasis: {
          // 折线图拐点 hover 时候的样式
          itemStyle: {
            borderColor: '#7088FF', //图形的描边颜色
            borderWidth: 2, // 描边的线宽
          },
        },
        lineStyle: {
          color: '#4C6AFF',
        },
      },
    ];
  }

  const option = {
    tooltip: {
      show: true,
      trigger: 'axis',
      formatter: names
        ? undefined
        : (params: { data: string[] }[]) => {
            let html = '';
            for (let i in params) {
              let param = params[i];
              // echarts日期格式化api
              const marker = '<span style="display:inline-block;margin-right:8px;border-radius:3px;width:6px;height:6px;background-color:#4C6AFF;"></span>';
              const dom = `${param.data?.[0]}<br />${marker}${param.data?.[1]} 人`;
              html += dom;
            }
            return html;
          },
      axisPointer: {
        type: 'line',
        lineStyle: {
          type: 'solid',
          color: '#E1E3E8',
        },
      },
      confine: true, // 将 tooltip 框限制在图表的区域内
      // textStyle: { // 这个配置没起作用，只能让站点名称全展示了
      //   width: 150,
      //   overflow: 'breakAll',
      //   ellipsis: '...',
      // },
      // extraCssText: 'max-width:200px;overflow-x:hidden;white-space:nowrap;text-overflow:ellipsis;',
    },
    legend: {
      data: names,
      right: 20,
      icon: 'circle',
      itemWidth: 6,
    },
    grid: {
      x: 10,
      y: 40,
      x2: 28,
      y2: 20,
      containLabel: true,
    },
    yAxis: {
      type: 'value',
      splitLine: {
        //网格线
        lineStyle: {
          type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
        },
        show: true,
      },
      axisTick: {
        //y轴刻度线
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#E1E3E8',
        },
      },
      axisLabel: {
        textStyle,
      },
    },
    xAxis: {
      // 根据x轴数据决定type类型
      type: 'category',
      boundaryGap: true, // 坐标轴两边留白策略
      splitLine: {
        //网格线
        lineStyle: {
          type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
        },
        show: false, //隐藏或显示
      },
      axisTick: {
        // y轴刻度线
        show: false,
      },
      axisLabel: {
        textStyle,
        hideOverlap: true,
        formatter: (value: number) => {
          // 坐标轴文字展示样式处理
          const date = new Date(value);
          const texts = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
          return texts.join('-');
        },
      },
      // x轴线样式
      axisLine: {
        lineStyle: {
          color: '#E1E3E8',
        },
      },
      // 注： x轴不指定data,自动会从series取
    },
    series: getSeries(),
  };
  chart?.setOption(option, { replaceMerge: ['series'] });
}

interface BarChartsOption {
  chart: EChartsType | null; // echarts 实例
  data: Array<(number | string)[]>; // 数据
  type: 'country' | 'dsuration' | 'submit';
}

// StatDetails 设置柱状图配置
export const setBarChartOption = ({ chart, data, type }: BarChartsOption) => {
  let productNameMap: Record<string, string> = {};
  if (type === 'submit' || type === 'dsuration') {
    data.forEach((item: any) => {
      productNameMap[item[1]] = item[2];
    });
  }

  const option = {
    grid: {
      x: 10,
      y: 20,
      x2: 28,
      y2: 20,
      containLabel: true,
    },
    yAxis: {
      type: 'category',
      inverse: true, //倒序
      axisTick: {
        //y轴刻度线
        show: false,
      },
      axisLabel: {
        width: 120,
        overflow: 'truncate', // 文字超出宽度截断，并在末尾显示...
        textStyle,
        margin: 8,
        // 存在重复的productName，因此 yAxis 的 data 为 siteProId，再特殊处理 axisLabel.formatter，让坐标轴展示 productName
        formatter:
          type === 'submit' || type === 'dsuration'
            ? function (value: string) {
                return productNameMap[value];
              }
            : undefined,
      },
      axisLine: {
        lineStyle: {
          color: '#E1E3E8',
        },
      },
      triggerEvent: true, // 坐标轴的标签可以触发鼠标事件
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, '15%'], // 坐标轴两边留白策略
      splitLine: {
        //网格线
        lineStyle: {
          type: 'dashed', //设置网格线类型 dotted：虚线   solid:实线
        },
        show: true, //隐藏或显示
      },
      axisLabel: {
        textStyle,
        hideOverlap: true,
      },
      // 注： x轴不指定data,自动会从series取
    },
    series: [
      {
        type: 'bar',
        data,
        barMaxWidth: 20,
        itemStyle: {
          //柱状颜色和圆角
          normal: {
            // 柱状图顶部展示数字
            color: '#7088FF',
            label: {
              show: true, //开启显示
              position: 'right', //在上方显示
              textStyle: {
                //数值样式
                color: 'black',
                fontSize: 14,
              },
              // 展示时长顶部数据做自定义渲染
              formatter: type === 'dsuration' ? timeItemStyleLabelFormatter : undefined,
            },
          },
        },
        lineStyle: {
          color: '#4C6AFF',
        },
      },
    ],
  };
  chart?.setOption(option);
};
