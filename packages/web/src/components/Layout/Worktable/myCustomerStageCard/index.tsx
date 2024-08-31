import React, { useEffect, useRef, useState } from 'react';
import { api, getIn18Text, WorktableApi } from 'api';
import { WorktableCard } from '../card';
import * as echarts from 'echarts';
import { navigateToCustomerPage } from '@web-unitable-crm/api/helper';
import classNames from 'classnames';
import { getRandomColor } from '../util';
import styles from './index.module.scss';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const systemApi = api.getSystemApi();

const ColorsPan = ['#63D6ED', '#55B9F8', '#D77FF8', '#7C6FF6', '#5596F8'];

const options: echarts.EChartsCoreOption = {
  tooltip: {
    show: false,
    trigger: 'item',
    formatter: '{b}', // 自定义浮层内容
    textStyle: {
      // 自定义浮层文字样式
      fontSize: 12,
      color: '#545A6E',
    },
  },
  legend: {
    bottom: 20,
    // left: 'center',
    itemWidth: 10, // 修改小块宽度
    itemHeight: 10, // 修改小块高度
    itemGap: 10, // 修改小块与文字间距
    itemStyle: {
      borderCap: 'round',
    },
    formatter: function (name: string) {
      if (name.length > 5) {
        return name.substring(0, 5) + '...';
      } else {
        return name;
      }
    },
  },
  series: [
    {
      name: getIn18Text('WODEKEHUFENB'),
      type: 'pie',
      top: -74,
      radius: ['30%', '53%'],
      center: ['50%', '50%'], //居中
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 0,
        borderColor: '#F6F7FB',
        borderWidth: 0,
      },
      label: {
        show: true,
        normal: {
          formatter: '{c}\n',
          textStyle: {
            fontSize: 10,
          },
        },
      },
      labelLine: {
        show: true,
        position: 'outer',
        alignTo: 'edge',
        margin: 0,
      },
      data: [],
      color: [],
    },
  ],
  graphic: [
    {
      type: 'ring',
      left: 'center',
      top: 50,
      style: {
        fill: '#F6F7FB',
      },
      shape: {
        cx: 0,
        cy: 0,
        r: 73,
        r0: 25,
      },
    },
  ],
};

export const MyCustomerStageCard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myChart, setMyChart] = useState<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const myChart = echarts.init(containerRef.current);
      setMyChart(myChart);
    }
  }, [containerRef.current]);

  const getData = () => {
    setLoading(true);
    worktableApi
      .getMyStagePanel()
      .then(res => {
        const { stageList = [] } = res || {};
        const newOption = {
          ...options,
          series: [
            {
              // @ts-ignore
              ...options.series?.[0],
              data: stageList.map(s => ({ ...s, value: s.customerCount, name: s.stageName })),
              color: stageList.length > 5 ? [...ColorsPan, ...getRandomColor(stageList.length - 5, ['#ffffff', '#000000', ...ColorsPan])] : ColorsPan,
            },
          ],
        };
        myChart?.setOption(newOption);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (myChart) {
      getData();
      myChart.on('click', function (params: { data: any }) {
        if (!params?.data?.stageId) return;
        const uniListFilter = {
          relation: 'and',
          subs: [
            {
              tradeKey: 'customer_stage',
              conditionMethod: 'any-of',
              tradeValue: [params.data.stageId],
            },
          ],
        };
        navigateToCustomerPage(
          {
            view: 'my',
            filter: uniListFilter,
          },
          systemApi.isWebWmEntry()
        );
      });
    }
  }, [myChart]);

  return (
    <WorktableCard
      title={getIn18Text('WODEKEHUFENB')}
      titleStyles={{
        fontSize: 16,
      }}
      loading={loading}
    >
      <div className={classNames(styles.box, 'wk-no-drag')}>
        <div className={styles.chartWrapper} ref={containerRef}></div>
      </div>
    </WorktableCard>
  );
};
