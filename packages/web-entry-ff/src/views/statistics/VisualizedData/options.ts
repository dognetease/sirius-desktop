export const uvOption = {
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: [],
  },
  grid: {},
  toolbox: {
    feature: {},
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
  },
  yAxis: {
    type: 'value',
  },
  series: [],
};

export const queryOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  legend: {
    data: [],
  },
  toolbox: {
    show: true,
    orient: 'vertical',
    left: 'right',
    top: 'center',
    feature: {},
  },
  xAxis: {
    type: 'category',
    axisTick: { show: false },
    axisLabel: {
      interval: 0,
      formatter: function (value: string) {
        //x轴的文字改为竖版显示
        const str = value.split('-');
        return str.join('\n');
      },
    },
    data: [],
  },
  yAxis: [
    {
      type: 'value',
    },
  ],
  series: [],
};
