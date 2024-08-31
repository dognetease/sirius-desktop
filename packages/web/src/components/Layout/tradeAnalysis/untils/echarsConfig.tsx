import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
type EChartsOption = echarts.EChartsOption;
import { useCustomsCountryHook } from '../../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { api, apis, CustomsContinent, DistributionFormData, ContinentType, getIn18Text } from 'api';
import NationFlag from '../../CustomsData/components/NationalFlag';
import style from '../tradeAnalysis.module.scss';
import { Tooltip } from 'antd';
import EllipsisTooltip from '../../Customer/components/ellipsisTooltip/ellipsisTooltip';

export interface configProp {
  title?: string | React.ReactNode;
  tabList?: Array<{
    label: string;
    value: string;
  }>;
  echarsConfig?: EChartsOption;
  continentList?: CustomsContinent[];
  height?: number;
  columns?: any[];
  tableData?: any[];
  childNode?: React.ReactNode;
  loading?: boolean;
  tabType?: string;
  isFail?: boolean;
  defaultCountry?: string[];
  to?: 'buysers' | 'supplier';
}

export interface EcharConfigProp {
  gloBuyTrend: configProp;
  buyArea: configProp;
  targetMarket: configProp;
  targetArea: configProp;
  mainMarket: configProp;
}

export interface BsEcharsConfig {
  gloBuyTrend: configProp;
  goodsDistribution: configProp;
  goodsCategory: configProp;
  routeDistribution: configProp;
  transportPrecent: configProp;
  shipPrecent: configProp;
  supplierTop: configProp;
}

type ConfigType = () => [config: EcharConfigProp];
type BsConfigType = () => [config: BsEcharsConfig];

const tabList = [
  {
    value: '1',
    label: getIn18Text('CAIGOUCISHU'),
  },
  {
    value: '2',
    label: getIn18Text('JINE'),
  },
  {
    value: '3',
    label: getIn18Text('SHULIANG'),
  },
  {
    value: '4',
    label: getIn18Text('ZHONGLIANG'),
  },
];

const handleEcharColums = (type: 'buyArea' | 'mainMarket' | 'targetArea') => {
  let tradeClounm = [
    {
      title: type === 'buyArea' ? getIn18Text('CAIGOUGUOJIADIQU') : type === 'mainMarket' ? getIn18Text('CAIGOUSHANGMINGCHENG') : getIn18Text('GONGYINGSHANGMINGCHENG'),
      dataIndex: type === 'buyArea' ? 'countryCn' : 'companyName',
      key: type === 'buyArea' ? 'countryCn' : 'companyName',
      render(value: string, record: DistributionFormData) {
        return (
          <div
            onClick={e => {
              if (value === '其他') {
                e.stopPropagation();
              }
            }}
            style={{ cursor: type === 'buyArea' ? 'auto' : value === '其他' ? 'auto' : 'pointer' }}
          >
            {value}
          </div>
        );
      },
    },
    {
      title: type === 'targetArea' ? getIn18Text('GONGYINGCISHU') : getIn18Text('CAIGOUCISHU'),
      dataIndex: 'sumCount',
      key: 'sumCount',
      render(value: number, record: DistributionFormData) {
        return value === 0 ? getIn18Text('WEIGONGKAI') : value;
      },
    },
    {
      title: getIn18Text('CAIGOUJINEMEIYUAN'),
      dataIndex: 'sumAmount',
      key: 'sumAmount',
      render(value: number, record: DistributionFormData) {
        return value === 0 ? getIn18Text('WEIGONGKAI') : value;
      },
    },
    {
      title: getIn18Text('SHULIANG'),
      dataIndex: 'sumQuantity',
      key: 'sumQuantity',
      render(value: number, record: DistributionFormData) {
        return value === 0 ? getIn18Text('WEIGONGKAI') : value;
      },
    },
    {
      title: getIn18Text('ZHONGLIANGKG'),
      dataIndex: 'sumWeight',
      key: 'sumWeight',
      render(value: number, record: DistributionFormData) {
        return value === 0 ? getIn18Text('WEIGONGKAI') : value;
      },
    },
  ];
  const commonCloum = [
    {
      title: getIn18Text('PINGJUNDANJIASHULIANG'),
      dataIndex: 'avgAmountByQuantity',
      key: 'avgAmountByQuantity',
      render(value: string, record: DistributionFormData) {
        return value ?? getIn18Text('WEIGONGKAI');
      },
    },
    {
      title: getIn18Text('PINGJUNDANJIAZHONGLIANG'),
      dataIndex: 'avgAmountByWeight',
      key: 'avgAmountByWeight',
      render(value: string, record: DistributionFormData) {
        return value ?? getIn18Text('WEIGONGKAI');
      },
    },
  ];
  if (type === 'buyArea') {
    tradeClounm.push({
      title: getIn18Text('CAIGOUSHANGSHULIANG'),
      dataIndex: 'sumCon',
      key: 'sumCon',
      render(value: number, record: DistributionFormData) {
        return value;
      },
    });
    return tradeClounm;
  } else if (type === 'targetArea') {
    tradeClounm.push({
      title: getIn18Text('ZHUYAOCHUKOUDIQU'),
      dataIndex: 'mainRelationCountryCn',
      key: 'mainRelationCountryCn',
      render(value: number, record: DistributionFormData) {
        return value;
      },
    });

    return [...tradeClounm, ...commonCloum];
  } else {
    return [...tradeClounm, ...commonCloum];
  }
};

export const relateCompany = [
  {
    title: '公司名称',
    dataIndex: 'companyName',
    key: 'companyName',
    render(value: string, record: DistributionFormData) {
      return (
        <div style={{ cursor: 'pointer', color: '#386ee7', maxWidth: '200px' }}>
          <EllipsisTooltip>{value}</EllipsisTooltip>
        </div>
      );
    },
  },
  {
    title: '国家/地区',
    dataIndex: 'countryCn',
    key: 'countryCn',
    render(value: string, record: DistributionFormData) {
      return (
        <>
          <NationFlag name={record.country} />
        </>
      );
    },
  },
  {
    title: '交易数',
    dataIndex: 'sumCount',
    key: 'sumCount',
    render(value: number, record: DistributionFormData) {
      return (
        <>
          <p className={style.sum}>{value === 0 ? getIn18Text('WEIGONGKAI') : value}</p>
          {record.percentCount && <p className={style.sumPercent}>占总比例{record.percentCount}%</p>}
        </>
      );
    },
  },
  {
    title: '交易总额',
    dataIndex: 'sumAmount',
    key: 'sumAmount',
    render(value: number, record: DistributionFormData) {
      return (
        <>
          <p className={style.sum}>{value === 0 ? getIn18Text('WEIGONGKAI') : value}</p>
          {record.percentAmount && <p className={style.sumPercent}>占总比例{record.percentAmount}%</p>}
        </>
      );
    },
  },
  {
    title: '主要交易HScode',
    dataIndex: 'topHsCodes',
    key: 'topHsCodes',
    render(value: string, record: DistributionFormData) {
      return (
        record.topHsCodes &&
        record.topHsCodes.map((item, index) => (
          <Tooltip key={item.hsCode} title={item.hsCodeDesc}>
            <span>{item.hsCode}</span>&nbsp;{index === 2 ? <br /> : ''}
          </Tooltip>
        ))
      );
    },
    // render:
  },
  {
    title: '交易起止日期',
    dataIndex: 'minTradingDate',
    key: 'minTradingDate',
    render(value: string, record: DistributionFormData) {
      return record.minTradingDate + '~' + record.maxTradingDate;
    },
  },
];

const config: EcharConfigProp = {
  gloBuyTrend: {
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
        name: '单位: 百万',
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
            color: '#EFF2FF',
          },
          lineStyle: {
            color: '#4C6AFF',
          },
        },
      ],
    },
    tabList: tabList,
    height: 206,
    tabType: '1',
  },
  buyArea: {
    title: getIn18Text('CAIGOUQUYUTOP10'),
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
    tabList: tabList,
    height: 275,
    columns: handleEcharColums('buyArea'),
    tableData: [],
    tabType: '1',
  },
  targetMarket: {
    title: getIn18Text('CAIGOUQUYUFENXI'),
    echarsConfig: {
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: ['2023年1月', '2023年2月', '2023年3月', '2023年4月', '2023年5月', '2023年6月', '2023年7月'],
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
        name: '单位: 百万',
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
            color: '#EFF2FF',
          },
          lineStyle: {
            color: '#4C6AFF',
          },
        },
      ],
    },
    tabList: tabList,
    height: 206,
    tableData: [],
    tabType: '1',
  },
  mainMarket: {
    title: (
      <>
        <div style={{ textAlign: 'center', width: '100%' }}>{getIn18Text('MUBIAOSHICHANGZHUYAOCAIGOUSHANGZHANBI')}</div>
      </>
    ),
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
    columns: handleEcharColums('mainMarket'),
    tableData: [],
    tabType: '1',
    to: 'buysers',
  },
  targetArea: {
    title: getIn18Text('GONGYINGQUYUFENXI'),
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
    tabList: tabList,
    height: 275,
    columns: handleEcharColums('targetArea'),
    tableData: [],
    tabType: '1',
    defaultCountry: ['Asia', 'China'],
    to: 'supplier',
  },
};

export const bsnsConfig: BsEcharsConfig = {
  gloBuyTrend: {
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
        name: '单位: 百万',
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
            color: '#EFF2FF',
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
  goodsDistribution: {
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
        name: '单位: 百万',
      },
      tooltip: {
        trigger: 'axis',
        formatter:
          '<div style="line-height: 1">{b}</div><div style="margin-top: 10px;line-height: 1"><span style="display: inline-block; width: 10px; height:10px; border-radius: 4px; background: #4C6AFF"></span> 采购次数：: <span style="font-weight: 600; margin-left: 10px">{c}</span> </div>',
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
    tabList: tabList.filter(item => item.value === '3' || item.value === '4'),
    height: 206,
  },
  goodsCategory: {
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
    tableData: [],
  },
  routeDistribution: {
    echarsConfig: {
      tooltip: {
        trigger: 'item',
        axisPointer: {
          // Use axis to trigger tooltip
          type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
        },
        formatter: (param: any) => {
          return `<div style="line-height: 1">${param.name}</div>
            <div style="margin-top: 10px;line-height: 1">
              <span style="display: inline-block; width: 10px; height:10px; border-radius: 4px; background: #4C6AFF"></span> 
              ${param.seriesName}: <span style="font-weight: 600; margin-left: 10px">${param.value}%</span> 
            </div>
            <div style="margin-top: 10px">
              <span style="font-weight: 600;">${param.data.extra}</span> 
            </div>
            `;
        },
      },
      grid: {
        left: 0,
        top: 0,
        bottom: 35,
        right: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
        axisLabel: {
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'category',
        data: [],
        axisLine: {
          lineStyle: {
            type: 'dashed',
          },
          show: false,
        },
        axisTick: {
          show: false,
        },
        show: true,
      },
      series: [],
    },
    tabList: tabList,
    height: 275,
  },
  transportPrecent: {
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
    tabList: tabList,
    height: 275,
    tableData: [],
  },
  shipPrecent: {
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
  supplierTop: {
    title: '货物种类',
    columns: relateCompany,
    tableData: [],
  },
};

const useEcharsConfig: ConfigType = () => {
  const [continentList, allCountry] = useCustomsCountryHook(true, true);
  const [echarsConfig, setEcharsConfig] = useState<EcharConfigProp>(config);
  useEffect(() => {
    if (continentList && continentList.length > 0) {
      setEcharsConfig(prv => {
        return {
          ...prv,
          targetMarket: {
            ...prv.targetMarket,
            continentList: continentList,
          },
          targetArea: {
            ...prv.targetArea,
            continentList: continentList,
          },
        };
      });
    }
  }, [continentList]);
  return [echarsConfig];
};

export const useBsEcharConfig: BsConfigType = () => {
  return [bsnsConfig];
};

export default useEcharsConfig;
