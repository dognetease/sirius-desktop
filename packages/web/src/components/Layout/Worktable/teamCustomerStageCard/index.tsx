import React, { useEffect, useRef, useState } from 'react';
import { api, getIn18Text, ResAccountRange, WorktableApi } from 'api';
import { WorktableCard } from '../card';
import * as echarts from 'echarts';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { navigateToCustomerPage } from '@web-unitable-crm/api/helper';
import styles from './index.module.scss';
import { workTableTrackAction } from '../worktableUtils';
import { getRandomColor } from '../util';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const systemApi = api.getSystemApi();
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
    itemWidth: 10, // 修改小块宽度
    itemHeight: 10, // 修改小块高度
    itemGap: 10, // 修改小块与文字间距
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
      name: getIn18Text('TUANDUIKEHUFENB'),
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

const ColorsPan = ['#63D6ED', '#55B9F8', '#D77FF8', '#7C6FF6', '#5596F8'];

export const TeamCustomerStageCard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myChart, setMyChart] = useState<echarts.ECharts | null>(null);
  const [meOptions, setMeOptions] = useState<{ account_id: string; account_name: string; nick_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const memberName = useRef<string>('');

  useEffect(() => {
    if (containerRef.current) {
      const myChart = echarts.init(containerRef.current);
      setMyChart(myChart);
    }
  }, [containerRef.current]);

  const fetchMemberList = () => {
    worktableApi.getAccountRange('CONTACT').then(res => {
      setMeOptions(res.principalInfoVOList);
    });
  };

  const getData = (accList: string[] = []) => {
    setLoading(true);
    worktableApi
      .getAllStagePanel({ account_id_list: accList })
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
      fetchMemberList();
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
            {
              tradeKey: 'manager_list',
              conditionMethod: 'any-of',
              tradeValue: memberName.current ? [memberName.current] : [],
            },
          ],
        };
        navigateToCustomerPage(
          {
            view: 'all',
            filter: uniListFilter,
          },
          systemApi.isWebWmEntry()
        );
      });
    }
  }, [myChart]);

  const handleChange = (value: string) => {
    memberName.current = value;
    getData(value ? [value] : []);
  };

  return (
    <WorktableCard
      title={getIn18Text('TUANDUIKEHUFENB')}
      showTeamIconInTitle
      loading={loading}
      headerToolsConfig={[
        {
          tools: (
            <EnhanceSelect style={{ width: 100 }} placeholder={getIn18Text('QUANBUCHENGYUAN')} onChange={handleChange} allowClear>
              {meOptions.map((me, index) => (
                <InSingleOption key={index} value={me.account_id}>
                  {me.nick_name}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          ),
        },
      ]}
      titleStyles={{
        fontSize: 16,
      }}
    >
      <div className={styles.box}>
        <div className={styles.chartWrapper} ref={containerRef}></div>
      </div>
    </WorktableCard>
  );
};
