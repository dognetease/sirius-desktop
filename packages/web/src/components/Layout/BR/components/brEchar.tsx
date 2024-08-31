import React, { useCallback, useEffect, useState } from 'react';
import TradeEchars from '../../tradeAnalysis/component/tradeEchar/tradeEchar';
import { EChartsOption } from 'echarts';
import { Skeleton } from 'antd';
import { globalSearchApi } from '../../globalSearch/constants';
import { bsnsConfig } from '../../tradeAnalysis/untils/echarsConfig';
import { BrEcharQuery, IndexCode, BrTableData, BrDataProp } from 'api';
import { useMemoizedFn } from 'ahooks';
import { ITablePage } from '../../globalSearch/search/search';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import style from '../br.module.scss';
import * as echarts from 'echarts';

const lineConfig = bsnsConfig.gloBuyTrend.echarsConfig;
export interface Prop {
  country: string;
  countryCn?: string;
}

const BrEchar: React.FC<Prop> = ({ country, countryCn }) => {
  const [impCnConfig, setImpCnConfig] = useState<EChartsOption | undefined>(undefined);
  const [portPutConfig, setProtPutConfig] = useState<EChartsOption | undefined>(undefined);
  const [gniConfig, setGniConfig] = useState<EChartsOption | undefined>(undefined);
  const [gdpConfig, setGdpConfig] = useState<EChartsOption | undefined>(undefined);
  const [midYearConfig, setYearConfig] = useState<EChartsOption | undefined>(undefined);
  const [tableData, setTableData] = useState<BrDataProp[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pageConfig, setPageConfig] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: 10,
  });
  useEffect(() => {
    if (country) {
      handleImp();
      // handlePortPut();
      // handleGni();
      // handleGdp();
      // handleMidYear();
      handleTable(1, 10);
      setPageConfig({
        current: 1,
        total: 0,
        pageSize: 10,
      });
    }
  }, [country]);
  const handleImp = useMemoizedFn(() => {
    globalSearchApi
      .getBrEcharQuery({
        country,
        indexCode: 'importFromChina',
      })
      .then(res => {
        lineConfig && setImpCnConfig(handleData(res, 'importFromChina'));
      });
  });

  const handlePortPut = useMemoizedFn(() => {
    globalSearchApi
      .getBrEcharQuery({
        country,
        indexCode: 'portContainerThroughput',
      })
      .then(res => {
        lineConfig && setProtPutConfig(handleData(res, 'portContainerThroughput'));
      });
  });

  const handleGni = useMemoizedFn(() => {
    globalSearchApi
      .getBrEcharQuery({
        country,
        indexCode: 'gni',
      })
      .then(res => {
        lineConfig && setGniConfig(handleData(res, 'gni'));
      });
  });

  const handleGdp = useMemoizedFn(() => {
    globalSearchApi
      .getBrEcharQuery({
        country,
        indexCode: 'gdp',
      })
      .then(res => {
        lineConfig && setGdpConfig(handleData(res, 'gdp'));
      });
  });

  const handleMidYear = useMemoizedFn(() => {
    globalSearchApi
      .getBrEcharQuery({
        country,
        indexCode: 'midYearPopulation',
      })
      .then(res => {
        lineConfig && setYearConfig(handleData(res, 'midYearPopulation'));
      });
  });

  const handleTable = useMemoizedFn((page: number, size: number) => {
    setSearchLoading(true);
    globalSearchApi
      .getBrTableData({
        country,
        page: page - 1,
        size,
      })
      .then(res => {
        setTableData(res.data);
        setPageConfig({
          pageSize: size,
          total: res.total,
          current: page,
        });
      })
      .finally(() => {});
  });

  const tableColumns = [
    {
      title: '商品编号',
      dataIndex: 'goodsCode',
      key: 'goodsCode',
    },
    {
      title: '商品名称',
      dataIndex: 'goodsName',
      key: 'goodsName',
      width: 270,
    },
    {
      title: '进口数量',
      dataIndex: 'quantityDesc',
      key: 'quantityDesc',
    },
    {
      title: '采购金额（美元）',
      dataIndex: 'dataValue',
      key: 'dataValue',
    },
    {
      title: '采购时间',
      dataIndex: 'quarter',
      key: 'quarter',
    },
  ];

  const handleData = useMemoizedFn((res: BrEcharQuery[], type: IndexCode) => {
    return (
      lineConfig && {
        ...lineConfig,
        xAxis: {
          ...lineConfig.xAxis,
          boundaryGap: true,
          data: res.map(item => item.dataYear),
        },
        yAxis: {
          ...lineConfig.yAxis,
          name: '单位：' + handleUnit(type),
        },
        grid: {
          ...lineConfig.grid,
          bottom: 20,
          left: res && res.length > 0 ? 20 : 50,
        },
        series:
          lineConfig.series && Array.isArray(lineConfig.series)
            ? (lineConfig.series.map(item => {
                return {
                  ...item,
                  data: res.map(item => item.dataValue),
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0.1875,
                        color: '#4C6AFF', // 渐变色起始颜色
                      },
                      {
                        offset: 0.8021,
                        color: 'rgba(76, 106, 255, 0.43)', // 渐变色中间颜色
                      },
                      {
                        offset: 1,
                        color: 'rgba(76, 106, 255, 0)', // 渐变色结束颜色
                      },
                    ]),
                    opacity: 0.15,
                  },
                };
              }) as any)
            : [],
      }
    );
  });
  const handleUnit = useCallback((param: IndexCode) => {
    switch (param) {
      case 'importFromChina':
        return '万美元';
      case 'portContainerThroughput':
        return 'TEU';
      case 'gni':
        return '现价美元';
      case 'gdp':
        return '现价百万美元';
      case 'midYearPopulation':
        return '人';
      default:
        break;
    }
    return '';
  }, []);
  return (
    <>
      <Skeleton loading={searchLoading} active>
        <TradeEchars height={236} type="importFromChina" title={countryCn + '从中国进口（万美元）'} echarsConfig={impCnConfig} />
        {/* <TradeEchars height={236} type="portContainerThroughput" title="港口集装箱吞吐量（TEU）" echarsConfig={portPutConfig} style={{ margin: '0' }} />
      <TradeEchars height={236} type="gni" title="人均国民总收入" echarsConfig={gniConfig} style={{ margin: '0' }} />
      <TradeEchars height={236} type="gdp" title="国内生产总值 （现价百万美元）" echarsConfig={gdpConfig} style={{ margin: '0' }} />
      <TradeEchars height={236} type="midYearPopulation" title="年中人口 (人)" echarsConfig={midYearConfig} style={{ margin: '0' }} /> */}
        <div style={{ color: '#272e47', marginBottom: 12, fontWeight: 500 }}>{countryCn}从中国进口热品</div>
        <SiriusTable columns={tableColumns} dataSource={tableData} pagination={false} />
        <SiriusPagination
          className={style.pagination}
          onChange={(nPage, nPageSize) => {
            setPageConfig({
              ...pageConfig,
              pageSize: nPageSize ?? 10,
              current: nPage,
            });
            handleTable(nPage, nPageSize ?? 10);
          }}
          {...pageConfig}
        />
      </Skeleton>
    </>
  );
};

export default BrEchar;
