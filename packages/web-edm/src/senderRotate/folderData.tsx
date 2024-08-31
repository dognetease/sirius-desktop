import React, { useState, useRef, useEffect } from 'react';
import { WarmUpData, WarmUpDailyData } from 'api';
import { getDateStrList } from './utils';
import useWindowSize from '@web-common/hooks/windowResize';
import * as echarts from 'echarts';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import type { ColumnsType } from 'antd/es/table';
import styles from './FolderData.module.scss';

interface Props {
  info: WarmUpData;
}

const pieOption = {
  tooltip: {
    trigger: 'item',
  },
  title: {
    text: '',
    left: 'center',
    top: 'center',
    textStyle: {
      rich: {
        a: {
          color: '#272E47',
          fontSize: 28,
          fontWeight: 500,
          fontFamily: 'LX-numbers',
          padding: [20, 0, 0, 0],
        },
        b: {
          color: '#747A8C',
          fontSize: 12,
          padding: [5, 0, 0, 0],
        },
      },
      align: 'center',
    },
  },
  legend: {
    top: 0,
    width: 230,
    left: 'center',
    itemWidth: 6,
    itemHeight: 6,
    icon: 'circle',
    formatter: '{a|{name}}',
    textStyle: {
      color: '#747A8C',
      rich: {
        a: {
          width: 98,
          lineHeight: 20,
        },
      },
    },
  },
  series: [
    {
      type: 'pie',
      top: 20,
      radius: [52, 88],
      avoidLabelOverlap: false,
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        label: {
          show: false,
        },
      },
      markPoint: {
        symbol: 'none',
      },
      data: [] as any,
    },
  ],
};

const barOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'none',
    },
    formatter: function (param: any) {
      return (
        `<p style='color:#9FA2AD; font-size: 12px;height:20px;line-height:20px;margin-bottom: 0'>${param[0].name}</p>` +
        param
          .map(function (item: any) {
            return `<p style='font-size: 12px;height:20px;line-height:20px;margin-top: 8px;margin-bottom:0;'><span style='display:inline-block;margin-right:4px;border-radius:4px;width:8px;height:8px;background-color:${item.color};'></span><span style='display: inline-block;color:#545A6E; width: 102px;'>${item.seriesName}</span><span style='color:#272E47; width: 102px;'>${item.value}</span></p>`;
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

const columns: ColumnsType<WarmUpDailyData> = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '邮箱预热发送数',
    dataIndex: 'sent',
    key: 'sent',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '进收件箱数',
    dataIndex: 'inbox',
    key: 'inbox',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '进垃圾箱后移除数',
    dataIndex: 'spam',
    key: 'spam',
    width: 130,
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '进分类文件夹数',
    dataIndex: 'categories',
    key: 'categories',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '丢失数',
    dataIndex: 'others', // 这里 others 没用错. 后端就是这么定义的 @hanxu
    key: 'others',
    width: 60,
    render: value => {
      return <div>{value}</div>;
    },
  },
];

const FolderData = (props: Props) => {
  const { info } = props;
  const [switchVal, setSwitchVal] = useState<0 | 1>(1);
  const [pieChart, setPieChart] = useState<echarts.ECharts | null>(null);
  const [barChart, setBarChart] = useState<echarts.ECharts | null>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // 监听窗口缩放
  const offset = useWindowSize(false);

  useEffect(() => {
    if (pieRef.current) {
      const myChart = echarts.init(pieRef.current);
      setPieChart(myChart);
    }
  }, [pieRef.current]);
  useEffect(() => {
    if (barRef.current) {
      const myChart = echarts.init(barRef.current);
      setBarChart(myChart);
    }
  }, [barRef.current]);

  useEffect(() => {
    if (pieChart && info && pieOption) {
      let option = { ...pieOption };
      let totalReceived = 0; // 收件箱封数
      let totalSpam = 0; // 垃圾箱封数
      let totalCategories = 0; // 其他文件夹封数
      let totalOthers = 0; // 丢失封数
      info.dailyData?.forEach(i => {
        totalReceived += i.inbox || 0;
        totalSpam += i.spam || 0;
        totalCategories += i.categories || 0;
        totalOthers += i.others || 0;
      });
      option.series[0].data = [
        { value: totalReceived, name: '收件箱', itemStyle: { color: '#4C6AFF' } },
        { value: totalCategories, name: '分类文件夹', itemStyle: { color: '#FFC470' } },
        { value: totalSpam, name: '垃圾箱', itemStyle: { color: '#FE5B4C' } },
        { value: totalOthers, name: '丢失', itemStyle: { color: '#C9CBD6' } },
      ];
      option.title.text = `{a|${totalReceived + totalSpam + totalCategories + totalOthers}}\n{b|总发信量}`;
      pieChart.setOption(option);

      // 保留至少一个图例被选中
      pieChart.on('legendselectchanged', function (params: any) {
        try {
          var optionLegend: any = pieChart.getOption();
          var selectValue = Object.values(params.selected);
          if (selectValue.every(val => !val)) {
            optionLegend.legend[0].selected[params.name] = true;
          }
          pieChart.setOption(optionLegend);
        } catch (e) {
          console.error('legendselectchanged', e);
        }
      });
    }
  }, [pieChart, info, pieOption]);
  useEffect(() => {
    if (barChart && info && barOption) {
      let option: any = { ...barOption };
      let xAxisData: string[] = [];
      let receivedData: number[] = [];
      let spamData: number[] = [];
      let categoriesData: number[] = [];
      let othersData: number[] = [];
      if (info.dailyData && info.dailyData.length > 0) {
        info.dailyData.forEach(i => {
          const dataStr = (i.date || '').split('-').slice(-2).join('-');
          xAxisData.push(dataStr);
          receivedData.push(i.inbox || 0);
          spamData.push(i.spam || 0);
          categoriesData.push(i.categories || 0);
          othersData.push(i.others || 0);
        });
        option.yAxis.min = null;
        option.yAxis.max = null;
        option.yAxis.interval = null;
        option.tooltip.axisPointer.type = 'none';
      } else {
        xAxisData = getDateStrList(info.filterDate || 14);
        receivedData = new Array(xAxisData.length).fill('-');
        spamData = new Array(xAxisData.length).fill('-');
        categoriesData = new Array(xAxisData.length).fill('-');
        othersData = new Array(xAxisData.length).fill('-');
        option.yAxis.min = 0;
        option.yAxis.max = 120;
        option.yAxis.interval = 30;
        option.tooltip.axisPointer.type = 'shadow';
      }

      option.xAxis.data = xAxisData;
      option.series = [
        {
          name: '收件箱',
          type: 'bar',
          stack: 'total',
          color: '#4C6AFF',
          data: receivedData,
        },
        {
          name: '垃圾箱',
          type: 'bar',
          stack: 'total',
          color: '#FE5B4C',
          data: spamData,
        },
        {
          name: '分类文件夹',
          type: 'bar',
          stack: 'total',
          color: '#FFC470',
          data: categoriesData,
        },
        {
          name: '丢失',
          type: 'bar',
          stack: 'total',
          color: '#C9CBD6',
          data: othersData,
        },
      ];
      barChart.setOption(option);

      // 保留至少一个图例被选中
      barChart.on('legendselectchanged', function (params: any) {
        try {
          var optionLegend: any = barChart.getOption();
          var selectValue = Object.values(params.selected);
          if (selectValue.every(val => !val)) {
            optionLegend.legend[0].selected[params.name] = true;
          }
          barChart.setOption(optionLegend);
        } catch (e) {
          console.error('legendselectchanged', e);
        }
      });
    }
  }, [barChart, barOption, info]);

  useEffect(() => {
    if (offset?.width && barChart) {
      barChart.resize();
    }
  }, [offset?.width]);

  return (
    <div className={styles.folderWrap}>
      <div className={styles.folderTable}>
        <p className={styles.title}>每日的预热邮件落入位置</p>
        <p className={styles.switch}>
          <span onClick={() => setSwitchVal(1)} className={switchVal === 1 ? styles.active : ''}>
            柱状图
          </span>
          <span onClick={() => setSwitchVal(0)} className={switchVal === 0 ? styles.active : ''}>
            列表
          </span>
        </p>
        <div className={styles.container}>
          {switchVal === 0 && <Table pagination={false} scroll={{ y: 230 }} columns={columns} dataSource={info.dailyData || []} className={styles.table} />}
          {switchVal === 1 && <div className={styles.bar} ref={barRef}></div>}
        </div>
      </div>
      <div className={styles.line}></div>
      <div className={styles.folderPie}>
        <p className={styles.title}>预热邮件落入位置总揽</p>
        <div className={styles.pie} ref={pieRef}></div>
      </div>
    </div>
  );
};

export default FolderData;
