import React, { useEffect, useState } from 'react';
import TradeEchars from '@/components/Layout/tradeAnalysis/component/tradeEchar/tradeEchar';
import style from './freight.module.scss';
import { YearRangePicker } from './YearRangePicker';
import { Tabs } from '@web-common/components/UI/Tabs';
import { bsnsConfig } from '@/components/Layout/tradeAnalysis/untils/echarsConfig';
import { useMemoizedFn } from 'ahooks';
import { EChartsOption } from 'echarts';
import { TradeValueType } from '@/components/Layout/tradeAnalysis/tradeAnalysis';
import * as ReactDOMServer from 'react-dom/server';
import SiriusTable from '@web-common/components/UI/Table';
import { edmCustomsApi } from '@/components/Layout/globalSearch/constants';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
interface Prop {
  country?: string;
  companyName: string;
  time: string[];
}

interface TipProp {
  data: Array<{
    label: string;
    value: number;
  }>;
}

const tabList = [
  {
    label: '出发地',
    value: 'export',
  },
  {
    label: '目的地',
    value: 'import',
  },
];

const config = bsnsConfig.transportPrecent.echarsConfig;

const TipFormatter: React.FC<TipProp> = ({ data }) => {
  const cloumn = [
    {
      title: '港口',
      dataIndex: 'label',
      width: 100,
      render: (value: string) => {
        return (
          <div style={{ maxWidth: '100px' }}>
            <EllipsisTooltip>{value || '-'}</EllipsisTooltip>
          </div>
        );
      },
    },
    {
      title: '运输次数',
      dataIndex: 'value',
    },
  ];
  return (
    <div className={style.tip}>
      <header>港口Top5</header>
      <SiriusTable rowKey={'value'} columns={cloumn} dataSource={data} pagination={false} />
    </div>
  );
};

const FrieihtEchar: React.FC<Prop> = ({ companyName, country, time }) => {
  const [tab, setTab] = useState<string>('import');
  const [echarConfig, setEcharConfig] = useState<EChartsOption | undefined>(undefined);

  useEffect(() => {
    handlePieData({
      type: tab,
    });
  }, [time]);

  const handlePieData = useMemoizedFn((param: { type: string }) => {
    edmCustomsApi
      .getAreaStatistics({
        recordType: param.type,
        companyList: [
          {
            companyName,
            country: country ?? '',
          },
        ],
        endYear: '',
        startYear: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'transport',
      })
      .then(res => {
        setEcharConfig(() => {
          return {
            ...config,
            tooltip: {
              ...config?.tooltip,
              padding: 0,
              borderWidth: 0,
              borderColor: 'none',
              formatter: (params: any) => {
                return ReactDOMServer.renderToString(<TipFormatter data={params.data.extra} />);
              },
            },
            series: handleLinService(
              config?.series,
              res.pieData?.map(item => {
                return {
                  value: item.value,
                  name: item.labelDesc,
                  extra: res.countryTop5PortCountMap[item.label],
                };
              })
            ),
          };
        });
      });
  });
  const handleLinService = (params: echarts.SeriesOption | echarts.SeriesOption[] | undefined, value: TradeValueType) => {
    if (params && Array.isArray(params)) {
      return params.map(item => {
        return {
          ...item,
          data: value,
        };
      });
    } else {
      return params as any;
    }
  };
  return (
    <div className={style.echarContent}>
      <div className={style.echarHeader}>
        <div className={style.echarTime}>
          <div style={{ color: '#272E47', fontSize: '14px', fontWeight: 'bold' }}>运输地Top 5</div>
        </div>
        <div>
          <Tabs
            defaultActiveKey={tab}
            bgmode="white"
            onChange={data => {
              setTab(data);
              handlePieData({
                type: data,
              });
            }}
            className={style.companyTab}
            size="small"
            type="capsule"
          >
            {tabList.map(item => (
              <Tabs.TabPane tab={item.label} key={item.value}></Tabs.TabPane>
            ))}
          </Tabs>
        </div>
      </div>
      <TradeEchars type="freight" height={262} title={undefined} echarsConfig={echarConfig} style={{ marginTop: 16 }} />
    </div>
  );
};

export default FrieihtEchar;
