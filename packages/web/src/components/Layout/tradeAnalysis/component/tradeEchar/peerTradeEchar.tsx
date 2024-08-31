import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
import classnames from 'classnames';
import * as echarts from 'echarts';
import style from './tradeEchars.module.scss';
import { edmCustomsApi } from '@/components/Layout/globalSearch/constants';
import WordCloud from './wordCloud';
type EChartsOption = echarts.EChartsOption;
import { Skeleton } from 'antd';
import { getIn18Text, TransportTradeReq, DistributionFormData } from 'api';
import { peersConfig, PeerConfig as ConfigPorp } from '../../untils/peerConfig';
import TradeEchars from './tradeEchar';
import { TimeFilter } from 'api';
import { TradeContext } from '../../context/tradeContext';
import { useMemoizedFn } from 'ahooks';
import { TradeValueType } from '../../tradeAnalysis';
import { relateCompany } from '../../untils/echarsConfig';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import qs from 'querystring';

interface Prop {
  recordType: 'peers';
  timeFilter: TimeFilter;
  setLoading?: (param: boolean) => void;
  setDisabled?: (param: boolean) => void;
}

interface HandleProp {
  value: TradeValueType;
  type: TradeCompanyType;
  xData?: string[];
  fromData?: any[];
  loading?: boolean;
  unit?: string;
}

type TradeCompanyType = 'peerTrend' | 'containerStatResult' | 'goodsTypeStatResult' | 'transportMethodStatResult' | 'transportRouteDistribution';
const defaultReq: TransportTradeReq = {
  dimensionType: '1',
  nameAndCountry: '',
  timeFilter: 'last_three_year',
};
const customsTab = [
  {
    label: '贸易分析',
    value: 'trade',
  },
  {
    label: '客户',
    value: 'customs',
  },
];

const listTab = [
  {
    label: '托运方',
    value: 'supplier',
  },
  {
    label: '收货方',
    value: 'buysers',
  },
];

const PeersTradeEchar: React.FC<Prop> = ({ timeFilter, setLoading, setDisabled }) => {
  const [config, setConfig] = useState<ConfigPorp>(peersConfig);
  const [peerTrendReq, setPeerTrendReq] = useState<null | TransportTradeReq>(null);
  const [containerStatResultReq, setContainerStatResultReq] = useState<null | TransportTradeReq>(null);
  const [goodsTypeStatResultReq, setGoodsTypeStatResultReq] = useState<null | TransportTradeReq>(null);
  const [transportRouteDistributionReq, setTransportRouteDistributionReq] = useState<null | TransportTradeReq>(null);
  // 关键词
  const [productKeyReq, setProductKeyReq] = useState<TransportTradeReq | null>(null);
  const [keyword, setKeywords] = useState<string>('');
  const [searchCountry, setSearchCountry] = useState<string>('');
  const [{ type, value, country, recordType }, dispatch] = useContext(TradeContext);
  const [translateKey, setTranslateKey] = useState<string>('en');
  // 组件在桌面端会造成卡死，切出去后，卸载组件，每次重新生成
  const [wordCloudShow, setWordCloudShow] = useState<boolean>(false);
  // 关键词配置
  const [productKeyConfig, setProductKeyConfig] = useState<{ text: string; size: number }[]>([]);
  const [keywordLoading, setKeywordLoading] = useState<boolean>(false);
  const [reportCategory, setReportCategory] = useState<string>('trade');
  // 客户列表
  const [customsListRes, setCustomsRes] = useState<DistributionFormData[]>([]);
  const [customsListType, setCustomsListType] = useState<'supplier' | 'buysers'>('supplier');
  const [pagination, setPagination] = useState<{ from: number; pageSize: number; total: number }>({
    from: 1,
    total: 0,
    pageSize: 10,
  });
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);
  const searchRef = useRef<boolean>(false);
  const locationHash = location.hash;
  useEffect(() => {
    if (peerTrendReq) {
      echarsLoading('peerTrend');
      edmCustomsApi
        .transportTrend(peerTrendReq)
        .then(res => {
          handleEcahrsConfig({
            value: res.map(item => item.value),
            type: 'peerTrend',
            xData: res.map(item => item.label),
            fromData: undefined,
            loading: false,
            unit: res && res.length > 0 ? res[0].unit : '',
          });
          if (searchRef.current) {
            saveLog();
          }
        })
        .finally(() => {
          echarsLoading('peerTrend', 'fail');
          searchRef.current = false;
        });
    }
  }, [peerTrendReq]);
  // 一个接口 返回两个图表的数据
  useEffect(() => {
    if (goodsTypeStatResultReq) {
      echarsLoading('goodsTypeStatResult');
      echarsLoading('transportMethodStatResult');
      edmCustomsApi
        .transportProportion(goodsTypeStatResultReq)
        .then(res => {
          setConfig(prv => {
            return {
              ...prv,
              goodsTypeStatResult: {
                ...prv.goodsTypeStatResult,
                echarsConfig: {
                  ...prv.goodsTypeStatResult.echarsConfig,
                  series: handleLinService(
                    prv.goodsTypeStatResult.echarsConfig?.series,
                    res.goodsTypeStatResult.map(item => {
                      return {
                        value: item.value,
                        name: item.label,
                      };
                    })
                  ),
                },
                loading: false,
              },
              transportMethodStatResult: {
                ...prv.transportMethodStatResult,
                echarsConfig: {
                  ...prv.transportMethodStatResult.echarsConfig,
                  series: handleLinService(
                    prv.transportMethodStatResult.echarsConfig?.series,
                    res.transportMethodStatResult.map(item => {
                      return {
                        value: item.value,
                        name: item.label,
                      };
                    })
                  ),
                },
                loading: false,
              },
            };
          });
          if (searchRef.current) {
            saveLog();
          }
        })
        .finally(() => {
          echarsLoading('goodsTypeStatResult', 'fail');
          echarsLoading('transportMethodStatResult', 'fail');
          searchRef.current = false;
        });
    }
  }, [goodsTypeStatResultReq]);
  useEffect(() => {
    if (productKeyReq) {
      setKeywordLoading(true);
      edmCustomsApi
        .transportProductKeywords(productKeyReq)
        .then(data => {
          setProductKeyConfig(
            data.map((item, index) => {
              return {
                text: item.label,
                size: index === 0 ? 36 : 32,
              };
            })
          );
          setKeywordLoading(false);
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          setKeywordLoading(false);
          searchRef.current = false;
        });
    }
  }, [productKeyReq]);
  useEffect(() => {
    if (transportRouteDistributionReq) {
      echarsLoading('transportRouteDistribution');
      edmCustomsApi
        .transportRouteDistribution(transportRouteDistributionReq)
        .then(res => {
          handleYEcharConfig({
            value: res?.map(item => item.sumCount),
            type: 'transportRouteDistribution',
            xData: res?.map(item => item.countryCn),
            fromData: undefined,
            loading: false,
            unit: '次',
          });
          if (searchRef.current) {
            saveLog();
          }
        })
        .finally(() => {
          echarsLoading('transportRouteDistribution', 'fail');
          searchRef.current = false;
        });
    }
  }, [transportRouteDistributionReq]);
  useEffect(() => {
    if (containerStatResultReq) {
      echarsLoading('containerStatResult');
      edmCustomsApi
        .transportVolumeDistribution(containerStatResultReq)
        .then(res => {
          handleEcahrsConfig({
            value: res?.map(item => item.value),
            type: 'containerStatResult',
            xData: res?.map(item => item.label),
            fromData: undefined,
            loading: false,
            unit: res && res.length > 0 ? res[0].unit : undefined,
          });
          if (searchRef.current) {
            saveLog();
          }
        })
        .finally(() => {
          echarsLoading('containerStatResult', 'fail');
          searchRef.current = false;
        });
    }
  }, [containerStatResultReq]);
  useEffect(() => {
    if (type === '3') {
      setKeywords(value ?? '');
      setSearchCountry(country ?? '');
      handleSearch(value);
      handleCustomsList('supplier', value);
      setReportCategory('trade');
    }
    return () => {
      dispatch({
        type: '1',
        value: undefined,
        country: '',
      });
    };
  }, [type, country, value, dispatch, recordType]);
  useEffect(() => {
    const params = qs.parse(locationHash.split('?')[1]);
    if (params && params.page === 'tradeAnalysis') {
      setWordCloudShow(true);
    } else {
      setWordCloudShow(false);
    }
  }, [locationHash]);
  useEffect(() => {
    if (peerTrendReq) {
      handleSearch(keyword);
      handleCustomsList(customsListType, keyword);
    }
  }, [timeFilter]);
  // 用于初始化搜索的接口
  const handleSearch = useMemoizedFn((value?: string) => {
    if (!peerTrendReq) {
      searchRef.current = true;
    }
    setLoading && setLoading(true);
    translateKey === 'zn' && setTranslateKey('en');
    setPeerTrendReq({
      ...defaultReq,
      nameAndCountry: value ?? keyword,
      timeFilter,
    });
    setGoodsTypeStatResultReq({
      ...defaultReq,
      nameAndCountry: value ?? keyword,
      timeFilter,
      dimensionType: '',
    });
    setProductKeyReq({
      ...defaultReq,
      nameAndCountry: value ?? keyword,
      timeFilter,
      dimensionType: '',
    });
    setTransportRouteDistributionReq({
      ...defaultReq,
      nameAndCountry: value ?? keyword,
      timeFilter,
    });
    setContainerStatResultReq({
      ...defaultReq,
      nameAndCountry: value ?? keyword,
      timeFilter,
      dimensionType: '',
    });
  });
  const saveLog = useCallback(() => {
    edmCustomsApi
      .logSave({
        searchValue: keyword,
        type: '4',
        country: searchCountry,
      })
      .then(() => {
        searchRef.current = false;
      })
      .catch(() => {
        searchRef.current = true;
      });
  }, [searchRef.current, keyword, searchCountry]);
  const echarsLoading = useCallback(
    (type: TradeCompanyType, status?: 'success' | 'fail') => {
      setConfig(prv => {
        return {
          ...prv,
          [type]: {
            ...prv[type],
            loading: status === 'fail' ? false : true,
          },
        };
      });
    },
    [config]
  );
  const handleEcahrsConfig = useMemoizedFn((param: HandleProp) => {
    setConfig(prv => {
      return {
        ...prv,
        [param.type]: {
          ...prv[param.type],
          echarsConfig: {
            ...prv[param.type].echarsConfig,
            xAxis: {
              ...prv[param.type].echarsConfig?.xAxis,
              data: param.xData ?? (prv[param.type].echarsConfig?.xAxis as any).data,
            },
            yAxis: {
              name: param.unit ? '单位：' + param.unit : '',
            },
            series: handleLinService(prv[param.type].echarsConfig?.series, param.value),
          },
          tableData: param.fromData ?? undefined,
          loading: param.loading ?? false,
        },
      };
    });
  });
  const handleYEcharConfig = useMemoizedFn((param: HandleProp) => {
    setConfig(prv => {
      return {
        ...prv,
        [param.type]: {
          ...prv[param.type],
          echarsConfig: {
            ...prv[param.type].echarsConfig,
            grid: {
              ...prv[param.type].echarsConfig?.grid,
              right: '5%',
              containLabel: true,
            },
            xAxis: {
              type: 'value',
            },
            yAxis: {
              ...prv[param.type].echarsConfig?.yAxis,
              axisTick: {
                show: false,
              },
              data: param.xData ?? (prv[param.type].echarsConfig?.yAxis as any).data,
            },
            series: handleLinService(prv[param.type].echarsConfig?.series, param.value),
          },
          tableData: param.fromData ?? undefined,
          loading: param.loading ?? false,
        },
      };
    });
  });
  const handleLinService = useMemoizedFn((params: echarts.SeriesOption | echarts.SeriesOption[] | undefined, value: TradeValueType) => {
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
  });
  const handleTranslate = useMemoizedFn(async (value: string) => {
    setKeywordLoading(true);
    setTranslateKey(value);
    try {
      await Promise.all(
        productKeyConfig.map(item => {
          return edmCustomsApi
            .customsTranslate({
              q: item.text,
              from: 'auto',
              to: value,
            })
            .then(r => {
              const result = r.translation && r.translation.length ? r.translation[0] : '';
              return {
                text: result,
                size: item.size,
              };
            });
        })
      ).then(transList => {
        setProductKeyConfig(transList);
        setKeywordLoading(false);
      });
    } catch (error) {
      setKeywordLoading(false);
    }
  });
  const handleCustomsList = useMemoizedFn((param: string, value?: string, page?: number, size?: number) => {
    setCustomerLoading(true);
    edmCustomsApi
      .transportPageCustomer({
        nameAndCountry: value ?? keyword,
        orderBy: '',
        page: page ? page - 1 : pagination.from - 1,
        recordType: param === 'supplier' ? 'export' : 'import',
        timeFilter,
        size: size ? size : pagination.pageSize,
      })
      .then(res => {
        setCustomerLoading(false);
        setCustomsRes(res.records);
        if (searchRef.current) {
          saveLog();
        }
        setPagination({
          ...pagination,
          from: page ?? pagination.from,
          pageSize: size ?? pagination.pageSize,
          total: res.total,
        });
      })
      .catch(() => {
        searchRef.current = false;
        setCustomerLoading(false);
      });
  });
  return (
    <>
      <Tabs
        className={style.customsTab}
        activeKey={reportCategory}
        onChange={value => {
          setReportCategory(value);
          if (value === 'customs') {
            setDisabled && setDisabled(true);
            setWordCloudShow(false);
          } else {
            setDisabled && setDisabled(false);
            setWordCloudShow(true);
          }
        }}
      >
        {customsTab.map(item => {
          return <Tabs.TabPane tab={item.label} key={item.value} />;
        })}
      </Tabs>
      {reportCategory === 'trade' && (
        <div>
          <TradeEchars
            key="peerTrend"
            title={'货运趋势'}
            type="peerTrend"
            loading={config.peerTrend.loading}
            tabList={config.peerTrend.tabList}
            defaultTabValue={peerTrendReq?.dimensionType}
            echarsConfig={config.peerTrend.echarsConfig}
            onTabChange={(value, type) => {
              if (peerTrendReq) {
                setPeerTrendReq({
                  ...peerTrendReq,
                  dimensionType: value as string,
                });
              }
            }}
            tableData={config.peerTrend.tableData}
            style={{ marginTop: 0, paddingTop: '28px', borderTop: '1px solid #E1E3E8' }}
          />
          <TradeEchars
            key="containerStatResult"
            title="货柜分布"
            type="containerStatResult"
            loading={config.containerStatResult.loading}
            tabList={config.containerStatResult.tabList}
            echarsConfig={config.containerStatResult.echarsConfig}
            columns={config.containerStatResult.columns}
            tableData={config.containerStatResult.tableData}
          />
          <TradeEchars
            key="goodsTypeStatResult"
            title="货物类型占比"
            type="goodsTypeStatResult"
            loading={config.goodsTypeStatResult.loading}
            tabList={config.goodsTypeStatResult.tabList}
            echarsConfig={config.goodsTypeStatResult.echarsConfig}
            columns={config.goodsTypeStatResult.columns}
            tableData={config.goodsTypeStatResult.tableData}
          />
          <div className={style.echarsCategory} style={{ display: 'block', marginTop: '32px' }}>
            <div className={style.echarsHeader}>
              <header style={{ fontWeight: 500 }}>{getIn18Text('CHANPINGUANJIANCI')}</header>
              <div className={style.echarsTab}>
                <Tabs type="capsule" size="small" bgmode="white" activeKey={translateKey} onChange={handleTranslate} className={classnames(style.searchTab)}>
                  <Tabs.TabPane tab={'英文'} key={'en'} />
                  <Tabs.TabPane tab={'中文'} key={'zn'} />
                </Tabs>
              </div>
            </div>
            <Skeleton
              loading={keywordLoading}
              paragraph={{
                rows: 4,
              }}
              active
            >
              {wordCloudShow && <WordCloud data={productKeyConfig} />}
            </Skeleton>
          </div>
          <TradeEchars
            key="transportRouteDistribution"
            title="运输线路分布"
            type="transportRouteDistribution"
            loading={config.transportRouteDistribution.loading}
            tabList={config.transportRouteDistribution.tabList}
            echarsConfig={config.transportRouteDistribution.echarsConfig}
            columns={config.transportRouteDistribution.columns}
            tableData={config.transportRouteDistribution.tableData}
          />
          <TradeEchars
            key="transportMethodStatResult"
            title="运输类型占比"
            type="transportMethodStatResult"
            loading={config.transportMethodStatResult.loading}
            tabList={config.transportMethodStatResult.tabList}
            echarsConfig={config.transportMethodStatResult.echarsConfig}
            columns={config.transportMethodStatResult.columns}
            tableData={config.transportMethodStatResult.tableData}
          />
        </div>
      )}
      {reportCategory === 'customs' && (
        <div>
          <TradeEchars
            key="customsList"
            title={'客户列表'}
            type="customsList"
            loading={customerLoading}
            onTabChange={tab => {
              setCustomsListType(tab as 'supplier' | 'buysers');
              handleCustomsList(tab as string, keyword, 1, pagination.pageSize);
            }}
            tabList={listTab}
            to={customsListType}
            columns={relateCompany}
            tableData={customsListRes}
            pagination={pagination}
            setPagination={(page, size) => {
              setPagination({
                ...pagination,
                from: page,
                pageSize: size ?? 10,
              });
              handleCustomsList(customsListType, keyword, page, size);
            }}
            style={{ marginTop: 0, paddingTop: '28px', borderTop: '1px solid #E1E3E8' }}
          />
        </div>
      )}
    </>
  );
};

export default PeersTradeEchar;
