import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
import classnames from 'classnames';
import { api, apiHolder, apis, CustomsContinent, TradeCompanyReq, TradeCompanyData, AirRouteStatResult, TimeFilter, getIn18Text } from 'api';
import * as echarts from 'echarts';
import style from './tradeEchars.module.scss';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { TabValueList } from '../tradeSearch/tradeSearch';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { BsEcharsConfig, configProp } from '../../untils/echarsConfig';
import TradeEchars from './tradeEchar';
import { TradeContext } from '../../context/tradeContext';
import { edmCustomsApi } from '@/components/Layout/globalSearch/constants';
import { TradeValueType } from '../../tradeAnalysis';
import { TradeCompanyType } from '../tradeReport/tradeReport';
import { Progress, Select, Skeleton, Tooltip } from 'antd';
import WordCloud from './wordCloud';
type EChartsOption = echarts.EChartsOption;
import qs from 'querystring';

interface BsTradeEchars {
  config: BsEcharsConfig;
  recordType: 'export' | 'import';
  timeFilter: TimeFilter;
  setLoading?: (param: boolean) => void;
}

const defaultReq: TradeCompanyReq = {
  hscodeType: '1',
  dimensionType: '1',
  companyName: '',
  country: '',
  timeFilter: 'last_three_year',
  recordType: 'import',
};

const hsCodeList = [
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

export const barConfig: echarts.SeriesOption = {
  name: '',
  type: 'bar',
  stack: 'total',
  barWidth: 16,
  barMinHeight: 1,
  itemStyle: {
    borderRadius: [0, 0, 0, 0],
    color: '#4C6AFF',
    // width: 16
  },
  data: [],
};

const BsTradeEchar: React.FC<BsTradeEchars> = ({ config: bsConfig, recordType: selectType, timeFilter, setLoading }) => {
  // const { config } = props
  const [config, setConfig] = useState<BsEcharsConfig>(bsConfig);
  // 趋势分布
  const [gloConfigReq, setGloConfigReq] = useState<TradeCompanyReq | null>(null);
  // 货物分布
  const [goodsDistributionReq, setGoodsDistributionReq] = useState<TradeCompanyReq | null>(null);
  // 货物类型
  const [goodsCategoryReq, setGoodsCategoryReq] = useState<TradeCompanyReq | null>(null);
  const [supplierTopReq, setSupplierTopReq] = useState<TradeCompanyReq | null>(null);
  // hscode
  const [hsCodeReq, setHsCodeReq] = useState<TradeCompanyReq | null>(null);
  // 关键词
  const [productKeyReq, setProductKeyReq] = useState<TradeCompanyReq | null>(null);
  // 关键词配置
  const [productKeyConfig, setProductKeyConfig] = useState<{ text: string; size: number }[]>([]);
  // hsCode数据
  const [hsCodeData, setHscodeData] = useState<{ label: string; value: number; labelDesc?: string }[]>([]);
  const [keyword, setKeywords] = useState<string>('');
  const [searchCountry, setSearchCountry] = useState<string>('');
  const [{ type, value, country, recordType }, dispatch] = useContext(TradeContext);
  const searchRef = useRef<boolean>(false);
  const [codeAndKeyLoading, setCodeAndKeyLoading] = useState<{
    hscode: boolean;
    productKey: boolean;
  }>({ hscode: false, productKey: false });
  // 组件在桌面端会造成卡死，切出去后，卸载组件，每次重新生成
  const [wordCloudShwo, setWordCloudShow] = useState<boolean>(false);
  const [translateKey, setTranslateKey] = useState<string>('en');
  const locationHash = location.hash;
  useEffect(() => {
    if (type === '3') {
      setKeywords(value ?? '');
      setSearchCountry(country ?? '');
      handleSearch('3', timeFilter, recordType, value, country);
    }
    return () => {
      dispatch({
        type: '1',
        value: '',
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
    if (gloConfigReq) {
      echarsLoading('gloBuyTrend');
      edmCustomsApi
        .companyPurchaseTrend(gloConfigReq)
        .then(res => {
          let data =
            gloConfigReq.dimensionType === '1'
              ? res.transaction_count
              : gloConfigReq.dimensionType === '2'
              ? res.value_of_goods
              : gloConfigReq.dimensionType === '3'
              ? res.quantity
              : res.weight;
          handleEcahrsConfig(
            data.map(item => item.value),
            'gloBuyTrend',
            data.map(item => item.label),
            undefined,
            false,
            data && data.length > 0 ? data[0].unit : ''
          );
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          echarsLoading('gloBuyTrend', 'fail');
          searchRef.current = false;
        });
    }
  }, [gloConfigReq]);
  useEffect(() => {
    if (goodsDistributionReq) {
      echarsLoading('goodsDistribution');
      edmCustomsApi
        .companyGoodsDistribution(goodsDistributionReq)
        .then(data => {
          handleEcahrsConfig(
            data?.map(item => {
              return {
                ...item,
                name: item.label,
              };
            }),
            'goodsDistribution',
            data?.map(item => item.label),
            undefined,
            false,
            data && data.length > 0 ? data[0].unit : ''
          );
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          echarsLoading('goodsDistribution', 'fail');
          searchRef.current = false;
        });
    }
  }, [goodsDistributionReq]);
  useEffect(() => {
    if (hsCodeReq) {
      setCodeAndKeyLoading(prv => {
        return {
          ...prv,
          hscode: true,
        };
      });
      edmCustomsApi
        .companyHscodeRanking(hsCodeReq)
        .then(data => {
          setHscodeData(data);
          setCodeAndKeyLoading(prv => {
            return {
              ...prv,
              hscode: false,
            };
          });
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          setCodeAndKeyLoading(prv => {
            return {
              ...prv,
              hscode: false,
            };
          });
          searchRef.current = false;
        });
    }
  }, [hsCodeReq]);
  useEffect(() => {
    if (goodsCategoryReq) {
      // 此处影响三个数据 所以仅设置一个，其余loading效果保持跟 goodsCategory 一致
      echarsLoading('goodsCategory');
      edmCustomsApi
        .companyGoodsTypeProportion(goodsCategoryReq)
        .then(res => {
          setConfig(prv => {
            return {
              ...prv,
              // 货物类型占比
              goodsCategory: {
                ...prv.goodsCategory,
                echarsConfig: {
                  ...prv.goodsCategory.echarsConfig,
                  series: handleLinService(
                    prv.goodsCategory.echarsConfig?.series,
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
              // 运输类型占比
              transportPrecent: {
                ...prv.transportPrecent,
                echarsConfig: {
                  ...prv.transportPrecent.echarsConfig,
                  series: handleLinService(
                    prv.transportPrecent.echarsConfig?.series,
                    res.transportMethodStatResult.map(item => {
                      return {
                        value: item.value,
                        name: item.label,
                      };
                    })
                  ),
                },
              },
              // 船公司占比
              shipPrecent: {
                ...prv.shipPrecent,
                echarsConfig: {
                  ...prv.shipPrecent.echarsConfig,
                  series: handleLinService(
                    prv.shipPrecent.echarsConfig?.series,
                    res.transportCompanyStatResult.map(item => {
                      return {
                        value: item.value,
                        name: item.label,
                      };
                    })
                  ),
                },
              },
              // 航线
              routeDistribution: {
                ...prv.routeDistribution,
                echarsConfig: {
                  ...prv.routeDistribution.echarsConfig,
                  yAxis: {
                    ...prv.routeDistribution.echarsConfig?.yAxis,
                    data: Object.keys(res.airRouteStatResult),
                  },
                  series: handleBarService(prv.routeDistribution.echarsConfig?.series, res.airRouteStatResult),
                },
              },
            };
          });
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          echarsLoading('goodsCategory', 'fail');
          searchRef.current = false;
        });
    }
  }, [goodsCategoryReq]);
  useEffect(() => {
    if (supplierTopReq) {
      echarsLoading('supplierTop');
      edmCustomsApi
        .companyRelatedCompany(supplierTopReq)
        .then(data => {
          setConfig(prv => {
            return {
              ...prv,
              supplierTop: {
                ...prv.supplierTop,
                tableData: data,
                loading: false,
              },
            };
          });
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          echarsLoading('supplierTop', 'fail');
          searchRef.current = false;
        });
    }
  }, [supplierTopReq]);
  useEffect(() => {
    if (productKeyReq) {
      setCodeAndKeyLoading(prv => {
        return {
          ...prv,
          productKey: true,
        };
      });
      edmCustomsApi
        .companyProductKeywords(productKeyReq)
        .then(data => {
          setProductKeyConfig(
            data.map((item, index) => {
              return {
                text: item.label,
                size: index === 0 ? 36 : 32,
              };
            })
          );
          setCodeAndKeyLoading(prv => {
            return {
              ...prv,
              productKey: false,
            };
          });
          if (searchRef.current) {
            saveLog();
            searchRef.current = false;
          }
        })
        .catch(() => {
          setCodeAndKeyLoading(prv => {
            return {
              ...prv,
              productKey: false,
            };
          });
          searchRef.current = false;
        });
    }
  }, [productKeyReq]);
  useEffect(() => {
    if (!searchRef.current && (value || keyword)) {
      handleSearch('3', timeFilter, selectType);
    }
  }, [selectType, timeFilter]);
  const handleEcahrsConfig = useCallback(
    (value: TradeValueType, type: TradeCompanyType, xData?: string[], fromData?: any[], loading?: boolean, unit?: string) => {
      setConfig(prv => {
        return {
          ...prv,
          [type]: {
            ...prv[type],
            echarsConfig: {
              ...prv[type].echarsConfig,
              xAxis: {
                ...prv[type].echarsConfig?.xAxis,
                data: xData ?? (prv[type].echarsConfig?.xAxis as any).data,
              },
              yAxis: {
                name: unit ? '单位：' + unit : '',
              },
              series: handleLinService(prv[type].echarsConfig?.series, value),
            },
            tableData: fromData ?? undefined,
            loading: loading ?? false,
          },
        };
      });
    },
    [config]
  );
  const handleSearch = (type: TabValueList, timeFilter: TimeFilter, recordType?: 'import' | 'export' | 'peers', value?: string, country?: string) => {
    searchRef.current = true;
    setLoading && setLoading(true);
    translateKey === 'zn' && setTranslateKey('en');
    setGloConfigReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      recordType,
      timeFilter,
    });
    setGoodsDistributionReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      dimensionType: '3',
      recordType,
      timeFilter,
    });
    // 特殊处理 后续需修修改
    setGoodsCategoryReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      recordType,
      timeFilter,
    });
    setHsCodeReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      recordType,
      timeFilter,
    });
    setSupplierTopReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      recordType,
      timeFilter,
    });
    setProductKeyReq({
      ...defaultReq,
      companyName: value ?? keyword,
      country: country ?? searchCountry,
      recordType,
      timeFilter,
    });
  };
  const handleBarService = (params: echarts.SeriesOption | echarts.SeriesOption[] | undefined, value: AirRouteStatResult) => {
    let arr: any = [];
    Object.values(value)
      .map((item, index) => {
        return item.map((data, num) => {
          return {
            data: handleBarMap(index, data.value.toFixed(2), data.labelDesc),
            name: data.label,
            opacity: num === 0 ? 1 : num === 1 ? 0.8 : num === 2 ? 0.6 : num === 3 ? 0.4 : num === 4 ? 0.2 : 0.2,
          };
        });
      })
      .forEach(item => {
        arr = [...arr, ...item];
      });
    return arr.map((item: any) => {
      return {
        ...barConfig,
        data: item.data,
        name: item.name,
        labelDesc: `${config.routeDistribution.tabList?.find(item => item.value === goodsCategoryReq?.dimensionType)?.label}: ${item.labelDesc}`,
        itemStyle: {
          ...barConfig.itemStyle,
          opacity: item.opacity,
        },
      };
    });
  };
  const handleBarMap = (index: number, value: number | string, desc?: string) => {
    let arr = [];
    for (let i = 0; i < index + 1; i++) {
      if (i === index && value !== 0) {
        arr.push({
          value,
          extra: `${config.routeDistribution.tabList?.find(item => item.value === goodsCategoryReq?.dimensionType)?.label}: ${desc}`,
        });
      } else {
        arr.push('');
      }
    }
    return arr;
  };
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
  const saveLog = useCallback(() => {
    edmCustomsApi
      .logSave({
        companyName: keyword,
        searchValue: keyword,
        type: '3',
        country: searchCountry,
      })
      .then(() => {
        searchRef.current = false;
      })
      .catch(() => {
        searchRef.current = true;
      });
  }, [searchRef.current, keyword, searchCountry]);
  const handleTranslate = useCallback(
    async (value: string) => {
      setCodeAndKeyLoading(prv => {
        return {
          ...prv,
          productKey: true,
        };
      });
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
          setCodeAndKeyLoading(prv => {
            return {
              ...prv,
              productKey: false,
            };
          });
        });
      } catch (error) {
        setCodeAndKeyLoading(prv => {
          return {
            ...prv,
            productKey: false,
          };
        });
      }
    },
    [codeAndKeyLoading, productKeyConfig]
  );
  return (
    <div className={style.bsEchar}>
      <TradeEchars
        key="gloBuyTrend"
        title={getIn18Text('QUANQIUCAIGOUQUSHI')}
        type="gloBuyTrend"
        loading={config.gloBuyTrend.loading}
        tabList={config.gloBuyTrend.tabList}
        defaultTabValue={gloConfigReq?.dimensionType}
        echarsConfig={config.gloBuyTrend.echarsConfig}
        onTabChange={(value, type) => {
          if (gloConfigReq) {
            setGloConfigReq({
              ...gloConfigReq,
              dimensionType: value as string,
            });
          }
        }}
        columns={config.gloBuyTrend.columns}
        tableData={config.gloBuyTrend.tableData}
        style={{ marginTop: 0 }}
      />
      <div className={style.echars}>
        <div className={style.echarsHeader}>
          <header style={{ fontWeight: 500 }}>HSCode排名</header>
          <div className={style.echarsTab}>
            <Tabs
              type="capsule"
              size="small"
              bgmode="white"
              activeKey={hsCodeReq?.dimensionType ?? '2'}
              onChange={value => {
                if (hsCodeReq) {
                  setHsCodeReq({
                    ...hsCodeReq,
                    dimensionType: value,
                  });
                }
              }}
              className={classnames(style.searchTab)}
            >
              {hsCodeList?.map(item => (
                <Tabs.TabPane tab={item.label} key={item.value} />
              ))}
            </Tabs>
          </div>
        </div>
        <Skeleton
          loading={codeAndKeyLoading.hscode}
          paragraph={{
            rows: 4,
          }}
          active
        >
          <div className={style.echarsRandSelect}>
            聚合方式
            <EnhanceSelect
              style={{ width: '208px' }}
              defaultValue={hsCodeReq?.hscodeType}
              value={hsCodeReq?.hscodeType}
              onChange={value => {
                if (hsCodeReq) {
                  setHsCodeReq({
                    ...hsCodeReq,
                    hscodeType: value,
                  });
                }
              }}
            >
              <InSingleOption value={'1'} key={'1'}>
                按前4位
              </InSingleOption>
              <InSingleOption value={'2'} key={'2'}>
                按前6位
              </InSingleOption>
            </EnhanceSelect>
          </div>
          <div className={style.echarsRank}>
            <div className={style.echarsPro}>
              {hsCodeData &&
                hsCodeData.slice(0, 5).map((item, index) => {
                  return (
                    <>
                      <Tooltip title={item.labelDesc}>
                        <div className={style.echarsProItem}>
                          <div
                            className={classnames(style.echarsProIndex, {
                              [style.echarsProSecond]: index === 1,
                              [style.echarsProFirst]: index === 0,
                              [style.echarsProThird]: index === 2,
                            })}
                          >
                            {index + 1}
                          </div>
                          <div className={style.echarsProNum}>{item.label}</div>
                          <Progress percent={typeof item.value === 'number' ? item.value : 0} showInfo={false} strokeColor="#4C6AFF" trailColor="#F2F5FF" />
                          <div className={style.echarsProPrecent}>{typeof item.value === 'number' ? item.value.toFixed(1) : 0}%</div>
                        </div>
                      </Tooltip>
                    </>
                  );
                })}
            </div>
            {hsCodeData && hsCodeData.length > 5 && (
              <div className={style.echarsPro} style={{ padding: '24px 56px 16px 0' }}>
                {hsCodeData.slice(5).map((item, index) => {
                  return (
                    <>
                      <Tooltip title={item.labelDesc}>
                        <div className={style.echarsProItem}>
                          <div className={classnames(style.echarsProIndex)}>{index + 6}</div>
                          <div className={style.echarsProNum}>{item.label}</div>
                          <Progress percent={typeof item.value === 'number' ? item.value : 0} showInfo={false} strokeColor="#4C6AFF" trailColor="#F2F5FF" />
                          <div className={style.echarsProPrecent}>{typeof item.value === 'number' ? item.value.toFixed(1) : 0}%</div>
                        </div>
                      </Tooltip>
                    </>
                  );
                })}
              </div>
            )}
          </div>
        </Skeleton>
      </div>
      <TradeEchars
        key="goodsDistribution"
        title="货物分布"
        type="goodsDistribution"
        loading={config.goodsDistribution.loading}
        tabList={config.goodsDistribution.tabList}
        echarsConfig={config.goodsDistribution.echarsConfig}
        onTabChange={(value, type) => {
          if (goodsDistributionReq) {
            setGoodsDistributionReq({
              ...goodsDistributionReq,
              dimensionType: value as string,
            });
          }
        }}
        defaultTabValue={goodsDistributionReq?.dimensionType ?? '4'}
        columns={config.goodsDistribution.columns}
        tableData={config.goodsDistribution.tableData}
        tips={'按照多个维度，分析海关数据中货物的分布情况'}
        tabDesc={'按'}
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
          loading={codeAndKeyLoading.productKey}
          paragraph={{
            rows: 4,
          }}
          active
        >
          {wordCloudShwo && <WordCloud data={productKeyConfig} />}
        </Skeleton>
      </div>
      <TradeEchars
        key="routeDistribution"
        title={`${recordType === 'export' ? '供应' : '采购'}航线分布`}
        type="routeDistribution"
        defaultTabValue={goodsCategoryReq?.dimensionType}
        loading={config.goodsCategory.loading}
        tabList={config.routeDistribution.tabList}
        echarsConfig={config.routeDistribution.echarsConfig}
        onTabChange={(value, type) => {
          if (goodsCategoryReq) {
            setGoodsCategoryReq({
              ...goodsCategoryReq,
              dimensionType: value as string,
            });
          }
        }}
        columns={config.routeDistribution.columns}
        tableData={config.routeDistribution.tableData}
        tips={'按照多个维度，分析其运输目的港/出发港分布及排名top5，若不足5个则按照实际数量展示'}
        tabDesc={'按'}
      />
      <TradeEchars
        key="goodsCategory"
        title={
          '货物类型占比 ' +
            {
              '1': '/ 采购次数',
              '2': '/ 金额',
              '3': '/ 数量',
              '4': '/ 重量',
              default: '',
            }[goodsCategoryReq?.dimensionType || 'default'] || ''
        }
        type="goodsCategory"
        height={274}
        tabList={config.goodsCategory.tabList}
        loading={config.goodsCategory.loading}
        echarsConfig={config.goodsCategory.echarsConfig}
      />
      <div className={style.echarsCategory}>
        <div className={style.echarsPart}>
          <TradeEchars
            key="transportPrecent"
            title={
              '运输类型占比 ' +
                {
                  '1': '/ 采购次数',
                  '2': '/ 金额',
                  '3': '/ 数量',
                  '4': '/ 重量',
                  default: '',
                }[goodsCategoryReq?.dimensionType || 'default'] || ''
            }
            type="transportPrecent"
            height={274}
            loading={config.goodsCategory.loading}
            echarsConfig={config.transportPrecent.echarsConfig}
            style={{ marginTop: '0' }}
          />
        </div>
        <div className={style.echarsPart}>
          <TradeEchars
            key="shipPrecent"
            style={{ marginTop: '0' }}
            title={
              '船公司占比 ' +
                {
                  '1': '/ 采购次数',
                  '2': '/ 金额',
                  '3': '/ 数量',
                  '4': '/ 重量',
                  default: '',
                }[goodsCategoryReq?.dimensionType || 'default'] || ''
            }
            height={274}
            type="shipPrecent"
            loading={config.goodsCategory.loading}
            echarsConfig={config.shipPrecent.echarsConfig}
          />
        </div>
      </div>
      <TradeEchars
        key="supplierTop"
        title={supplierTopReq?.recordType === 'export' ? '采购Top10' : '供应Top10'}
        type="supplierTop"
        loading={false}
        onTabChange={() => {}}
        to={supplierTopReq?.recordType === 'export' ? 'buysers' : 'supplier'}
        columns={config.supplierTop.columns}
        tableData={config.supplierTop.tableData}
      />
    </div>
  );
};

export default BsTradeEchar;
