import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
import classnames from 'classnames';
import { api, apiHolder, apis, TradeReq, TradeData, HotProductRank, HasQuantity, HistoryItem, TradeportValue, PrevScene } from 'api';
import * as echarts from 'echarts';
import style from './tradeAnalysis.module.scss';
import { Breadcrumb } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { getIn18Text } from 'api';
import MyCountUp from '../globalSearch/search/MyCountUp/MyCountUp';
import TradeSearch from './component/tradeSearch/tradeSearch';
import { TabValueList } from './component/tradeSearch/tradeSearch';
import TradeReport from './component/tradeReport/tradeReport';
import useEcharsConfig, { EcharConfigProp, configProp, useBsEcharConfig, BsEcharsConfig } from './untils/echarsConfig';
import { TradeContext } from './context/tradeContext';
import { edmApi, edmCustomsApi } from '../globalSearch/constants';
import { TradeType, TradeCompanyType } from './component/tradeReport/tradeReport';
import SuggestDropDown from '../globalSearch/search/SuggestDropDown';
import { CustomsSearchRef } from '../CustomsData/customs/customsSearch/customsSearch';
import { getSouceTypeFromSen } from '../globalSearch/utils';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import qs from 'querystring';
import SiriusMessage from '../../../../../web-common/src/components/UI/Message/SiriusMessage';
import { ReactComponent as HotFire } from '@/images/icons/customs/hotfire.svg';
import { useCustomsCountryHook } from '../CustomsData/customs/docSearch/component/CountryList/customsCountryHook';
import { customsDataTracker } from '../CustomsData/tracker/tracker';

export type TradeValueType = number[] | string[] | Array<{ label?: string; value: number; name?: string; unit?: string; extra?: TradeportValue[] }>;
const defaultReq: TradeReq = {
  countryList: [],
  dimensionType: '1',
  queryValue: '',
  type: '1',
};
const TradeAnalysis: React.FC = () => {
  const [echarsConfig] = useEcharsConfig();
  const [bsConfig] = useBsEcharConfig();
  const [initLayout, setInitLayout] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [searchType, setSearchType] = useState<TabValueList>('1');
  const [loading, setLoading] = useState<boolean>(false);
  // 全球趋势req
  const [gloReq, setGloRe] = useState<TradeReq | null>(null);
  // 采购区域
  const [buyAreaReq, setBuyArea] = useState<TradeReq | null>(null);
  // 采购区域分析折线
  const [targetMarketReq, setTargetMarketReq] = useState<TradeReq | null>(null);
  // 目标市场主要采购商占比
  const [mainMarketReq, setMainMarketReq] = useState<TradeReq | null>(null);
  // 供应区域分析
  const [targetAreaReq, setTargetArea] = useState<TradeReq | null>(null);
  // 非企业配置信息
  const [config, setConfig] = useState<EcharConfigProp>(echarsConfig);
  // 企业配置信息
  const [bsnsConfig, setBsnsConfig] = useState<BsEcharsConfig>(bsConfig);
  const searchInputRef = useRef<CustomsSearchRef>(null);
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const [_, dispatch] = useContext(TradeContext);
  const [hotTableData, setHotTableData] = useState<HotProductRank[]>([]);
  const [searchPart, setSearchPart] = useState<'company' | 'other'>('other');
  const [selectType, setRecordType] = useState<'export' | 'import'>('import');
  const [quantity, setQuantity] = useState<HasQuantity>({
    dayResidualQuota: 0,
    dayTotalQuota: 0,
  });
  const [searchKeyWord, setSearchKeyWord] = useState<string>('');
  const [companyCountry, setCompanyCountry] = useState<string | undefined>(undefined);
  const searchRef = useRef<boolean>(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [cn] = useCustomsCountryHook();
  const locationHash = location.hash;
  useEffect(() => {
    setConfig(echarsConfig);
  }, [echarsConfig]);
  useEffect(() => {
    if (searchType != '3' && gloReq) {
      echarsLoading('gloBuyTrend');
      edmCustomsApi
        .purchaseTrend(gloReq)
        .then(data => {
          handleLineEcahrsConfig(
            data.map(item => item.value),
            'gloBuyTrend',
            data.map(item => item.label),
            undefined,
            false,
            gloReq.dimensionType,
            data && data.length > 0 ? data[0].unit : ''
          );
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          echarsLoading('gloBuyTrend', 'fail');
          searchRef.current = false;
        });
    }
  }, [gloReq]);
  useEffect(() => {
    if (searchType != '3' && buyAreaReq) {
      echarsLoading('buyArea');
      edmCustomsApi
        .importRegionalDistribution(buyAreaReq)
        .then(data => {
          handlePieEcharsConfig(
            data.pieData.map(item => {
              return {
                name: item.label,
                value: item.value,
              };
            }),
            'buyArea',
            undefined,
            data.formData,
            false,
            buyAreaReq.dimensionType
          );
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          echarsLoading('buyArea', 'fail');
          searchRef.current = false;
        });
    }
  }, [buyAreaReq]);
  useEffect(() => {
    if (searchType != '3' && targetMarketReq) {
      echarsLoading('targetMarket');
      edmCustomsApi
        .purchaseTrend(targetMarketReq)
        .then(data => {
          handleLineEcahrsConfig(
            data.map(item => item.value),
            'targetMarket',
            data.map(item => item.label),
            undefined,
            false,
            targetMarketReq.dimensionType,
            data && data.length > 0 ? data[0].unit : '',
            data && data[0].topCountry
              ? handleTopCountry(data[0].topCountry)
              : targetMarketReq.countryList
              ? [handleCountry(targetMarketReq.countryList[0]), targetMarketReq.countryList[0]]
              : []
          );
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          echarsLoading('targetMarket', 'fail');
          searchRef.current = false;
        });
    }
  }, [targetMarketReq]);
  useEffect(() => {
    if (searchType != '3' && mainMarketReq) {
      echarsLoading('mainMarket');
      edmCustomsApi
        .importCompanyDistribution(mainMarketReq)
        .then(data => {
          handlePieEcharsConfig(
            data.pieData.map(item => {
              return {
                name: item.label,
                value: item.value,
              };
            }),
            'mainMarket',
            undefined,
            data.formData,
            false,
            mainMarketReq.dimensionType
          );
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          echarsLoading('mainMarket', 'fail');
          searchRef.current = false;
        });
    }
  }, [mainMarketReq]);
  useEffect(() => {
    if (searchType != '3' && targetAreaReq) {
      echarsLoading('targetArea');
      edmCustomsApi
        .exportCompanyDistribution(targetAreaReq)
        .then(data => {
          handlePieEcharsConfig(
            data.pieData.map(item => {
              return {
                name: item.label,
                value: item.value,
              };
            }),
            'targetArea',
            undefined,
            data.formData,
            false,
            targetAreaReq.dimensionType,
            targetAreaReq.countryList ? [handleCountry(targetAreaReq.countryList[0]), targetAreaReq.countryList[0]] : []
          );
          if (searchRef.current) {
            saveLog();
          }
        })
        .catch(() => {
          echarsLoading('targetArea', 'fail');
          searchRef.current = false;
        });
    }
  }, [targetAreaReq]);
  useEffect(() => {
    if (initLayout) {
      edmCustomsApi.hotProductRanking().then(setHotTableData);
      edmCustomsApi.getQuotaQuery().then(res => {
        setQuantity(res);
      });
      edmCustomsApi.getTradeLogList().then(setHistoryList);
    }
  }, [initLayout]);
  const [country, name, recordType, pageSource] = useMemo(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    if (!['tradeAnalysis', 'wmData'].includes(moduleName)) {
      return [''];
    }
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.country && typeof params.country === 'string' && params.pageSource) {
      return [params.country, params.name, params.type, params.pageSource];
    }
    return [''];
  }, [locationHash]);
  useEffect(() => {
    if (country && name && recordType && pageSource) {
      handleSearch(
        name as string,
        '3',
        country,
        ({
          buysers: 'import',
          supplier: 'export',
          suppliers: 'export',
          peers: 'peers',
        }[recordType as string] as any) || 'import'
      );
      setKeyword(name as string);
      setSearchKeyWord(name as string);
      setSearchType('3');
      setCompanyCountry(country);
      setRecordType(
        ({
          buysers: 'import',
          supplier: 'export',
          suppliers: 'export',
          peers: 'peers',
        }[recordType as string] as any) || 'import'
      );
    }
  }, [country, name, recordType, pageSource]);
  // 处理请求参数
  const handleTabChange = useCallback(
    (type: TradeType | TradeCompanyType, value?: string, country?: string) => {
      switch (type) {
        case 'gloBuyTrend':
          if (gloReq) {
            setGloRe({
              ...gloReq,
              dimensionType: value ?? gloReq.dimensionType,
              countryList: country ? [country] : gloReq.countryList,
            });
          }
          break;
        case 'buyArea':
          if (buyAreaReq) {
            setBuyArea({
              ...buyAreaReq,
              dimensionType: value ?? buyAreaReq.dimensionType,
              countryList: country ? [country] : buyAreaReq.countryList,
            });
          }
          break;
        case 'targetArea':
          if (targetAreaReq) {
            setTargetArea({
              ...targetAreaReq,
              dimensionType: value ?? targetAreaReq.dimensionType,
              countryList: country ? [country] : targetAreaReq.countryList,
            });
          }
          break;
        // 目标市场更新 主要占比也更新
        case 'targetMarket':
          if (targetMarketReq && mainMarketReq) {
            setTargetMarketReq({
              ...targetMarketReq,
              needTopCountry: true,
              dimensionType: value ?? targetMarketReq.dimensionType,
              countryList: country ? [country] : targetMarketReq.countryList,
            });
            setMainMarketReq({
              ...mainMarketReq,
              dimensionType: value ?? mainMarketReq.dimensionType,
              countryList: country ? [country] : mainMarketReq.countryList,
            });
          }
          break;
        default:
          break;
      }
    },
    [targetMarketReq, targetAreaReq, mainMarketReq, buyAreaReq, gloReq]
  );
  // 处理折线echars配置数据
  const handleLineEcahrsConfig = useCallback(
    (value: TradeValueType, type: TradeType, xData?: string[], fromData?: any[], loading?: boolean, tabType?: string, unit?: string, defaultCountry?: string[]) => {
      // config[type]
      setConfig(prv => {
        return {
          ...prv,
          [type]: {
            ...prv[type],
            echarsConfig: {
              ...prv[type].echarsConfig,
              xAxis: {
                ...prv[type].echarsConfig?.xAxis,
                data: xData ?? (prv[type].echarsConfig?.xAxis as any)?.data,
              },
              yAxis: {
                name: unit ? '单位：' + unit : '',
              },
              series: handleService(prv[type].echarsConfig?.series, value),
            },
            tableData: fromData ?? undefined,
            loading: loading ?? false,
            tabType: tabType ?? '1',
            defaultCountry: defaultCountry ?? [],
          },
        };
      });
    },
    [config]
  );
  const handlePieEcharsConfig = useCallback(
    (value: TradeValueType, type: TradeType, xData?: string[], fromData?: any[], loading?: boolean, tabType?: string, defaultCountry?: string[]) => {
      // config[type]
      setConfig(prv => {
        return {
          ...prv,
          [type]: {
            ...prv[type],
            echarsConfig: {
              ...prv[type].echarsConfig,
              series: handleService(prv[type].echarsConfig?.series, value),
            },
            tableData: fromData ?? undefined,
            loading: loading ?? false,
            tabType: tabType ?? '1',
            defaultCountry: defaultCountry ?? [],
          },
        };
      });
    },
    [config]
  );
  // loading 状态控制
  const echarsLoading = useCallback(
    (type: TradeType, status?: 'success' | 'fail') => {
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
  // 插入echars service
  const handleService = (params: echarts.SeriesOption | echarts.SeriesOption[] | undefined, value: TradeValueType) => {
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
  // 搜索
  const handleSearch = (value: string, type: TabValueList, country?: string, recordType?: 'import' | 'export' | 'peers', isRank?: boolean) => {
    if (type === '2' && !/^\d+$/.test(value)) {
      SiriusMessage.warning({
        content: '当前输入的hsCode格式有误',
      });
      return;
    } else if (/^\s*$/.test(value)) {
      SiriusMessage.warning({
        content: '请输入关键词',
      });
      return;
    }
    setKeyword((value ?? '').trim());
    edmCustomsApi.getQuotaQuery().then(res => {
      setQuantity(res);
      if (res.dayResidualQuota === 0) {
        SiriusMessage.warning({
          content: '今日已到查询限额，请明日再试',
        });
        return;
      }
      customsDataTracker.trackTradeReport({
        searchType: isRank ? 'rankingList' : type === '1' ? 'product' : type === '2' ? 'hscode' : 'company',
        keyword: value,
      });
      setSearchKeyWord(value);
      setInitLayout(false);
      if (type === '3') {
        dispatch({
          type: type,
          value: value,
          country: country ?? companyCountry,
          recordType: recordType ?? selectType,
        });
        setSearchPart('company');
      } else {
        setCompanyCountry(undefined);
        setSuggestOpen(false);
        searchRef.current = true;
        setGloRe({ ...defaultReq, queryValue: value, type: type });
        setTargetArea({ ...defaultReq, countryList: ['China'], queryValue: value, type: type });
        setBuyArea({ ...defaultReq, queryValue: value, type: type });
        setMainMarketReq({ ...defaultReq, countryList: [], queryValue: value, type: type });
        setTargetMarketReq({ ...defaultReq, countryList: [], queryValue: value, type: type, needTopCountry: true });
        setSearchPart('other');
      }
    });
  };
  const saveLog = useCallback(() => {
    edmCustomsApi
      .logSave({
        companyName: searchKeyWord,
        searchValue: searchKeyWord,
        type: searchType,
        // country: 'China',
      })
      .then(() => {
        searchRef.current = false;
      });
  }, [searchRef.current]);
  const columns = [
    {
      title: getIn18Text('PAIMING'),
      dataIndex: 'order',
      key: 'order',
      render: (value: string, record: HotProductRank) => {
        return (
          <span style={{ fontWeight: 500, color: record.order === 1 ? '#4C6AFF' : record.order === 2 ? '#0CA' : record.order === 3 ? '#FFB54C' : '#747A8C' }}>
            {record.order}
          </span>
        );
      },
    },
    {
      title: getIn18Text('CHANPINMINGCHENG'),
      dataIndex: 'showProductName',
      key: 'showProductName',
    },
    {
      title: getIn18Text('JINCHUKOUCISHU'),
      dataIndex: 'sumCount',
      key: 'sumCount',
    },
    {
      title: getIn18Text('JINCHUKOUJINEBAIWANMEIYUAN'),
      dataIndex: 'sumAmount',
      key: 'sumAmount',
    },
    {
      title: getIn18Text('JINCHUKOUZHONGLIANGWANDUN'),
      dataIndex: 'sumWeight',
      key: 'sumWeight',
    },
  ];
  const handleSuggestType = useMemo(() => {
    return searchType === '1' ? 0 : searchType === '3' ? 5 : undefined;
  }, [searchType]);
  const handleCountry = useCallback(
    (param: string) => {
      const arr = cn.filter(cn => {
        const { countries } = cn;
        return countries.some(item => item.name === param);
      });
      return arr.length > 0 ? arr[0].continent : param;
    },
    [cn]
  );
  const handleTopCountry = useCallback(
    (param: string) => {
      if (param === 'OTHER-COUNTRY') {
        return ['OTHER-COUNTRY'];
      } else {
        return [handleCountry(param), param];
      }
    },
    [targetMarketReq]
  );
  const apiSuggesType = useMemo(() => {
    return searchType === '1' ? 'customs' : searchType === '2' ? 'hsCode' : 'tradeAnalysis';
  }, [searchType]);
  const renderHistoryRecord = () => {
    return (
      <SuggestDropDown
        keyword={keyword}
        onSelect={(value, country, type) => {
          setKeyword(value);
          setSuggestOpen(false);
          setCompanyCountry(country);
          setRecordType(type as 'import' | 'export');
          handleSearch(value, searchType, country, type);
        }}
        type={apiSuggesType}
        blurTarget={searchInputRef.current?.getInputWrapper?.()}
        target={searchInputRef.current?.getSearchWrapper?.()}
        sugguestType={handleSuggestType}
        open={suggestOpen}
        changeOpen={setSuggestOpen}
        title={searchType === '3' ? '请选择相关公司' : undefined}
      />
    );
  };
  return (
    <div
      className={classnames(style.container, {
        [style.containerList]: !initLayout,
      })}
    >
      {!initLayout && (
        <>
          <Breadcrumb style={{ marginBottom: '12px' }} className={style.bread} separator={<SeparatorSvg />}>
            <Breadcrumb.Item>
              <a
                href="javascript:void(0)"
                onClick={e => {
                  e.preventDefault();
                  if (name && country && recordType && pageSource) {
                    history?.back();
                  } else {
                    setInitLayout(true);
                  }
                }}
              >
                {!pageSource ? getIn18Text('MAOYIFENXI') : getSouceTypeFromSen(pageSource as PrevScene)}
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{getIn18Text('FENXIBAOGAO')}</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ width: '100%' }}>
            <TradeSearch
              ref={searchInputRef}
              onChange={e => {
                setKeyword(e.target.value);
                setSuggestOpen(!!e.target.value);
                setCompanyCountry(undefined);
              }}
              defaultSearchtype={searchType}
              value={keyword}
              onSearch={value => {
                if (searchType === '3' && !companyCountry) {
                  SiriusMessage.warning({
                    content: '请选择相关内容中的信息',
                  });
                } else {
                  handleSearch(value, searchType);
                }
              }}
              initLayout={initLayout}
              handleSearchTypeChange={setSearchType}
              quantity={quantity}
            />
          </div>
          <TradeReport
            searchType={searchType}
            keyword={keyword}
            searchValue={searchKeyWord}
            loading={loading}
            onTabChange={(value, type) => {
              handleTabChange(type, value);
            }}
            onSelectChange={(value, type) => {
              handleTabChange(type, undefined, value as string);
            }}
            config={Object.values(config)}
            bsnsConfig={bsnsConfig}
            searchPart={searchPart}
            selectType={selectType}
            setLoading={setLoading}
            companyCountry={companyCountry}
          />
          {renderHistoryRecord()}
        </>
      )}
      {initLayout && (
        <>
          <div className={style.header}>
            <div className={style.headerInner}>
              <div className={style.textWrap}>
                <h1>{getIn18Text('MAOYIFENXI')}</h1>
                <MyCountUp
                  className={style.countup}
                  date={''}
                  hiddenCountUp={true}
                  end={0}
                  prefix={getIn18Text('CHAZHAOXIANGGUANCHANPINQUANQIUJIAOYIGAILAN,WAJUEMUBIAOQUYUSHANGJI')}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <TradeSearch
                  ref={searchInputRef}
                  onChange={e => {
                    setKeyword(e.target.value);
                    setCompanyCountry(undefined);
                    setSuggestOpen(!!e.target.value);
                  }}
                  defaultSearchtype={searchType}
                  value={keyword}
                  onSearch={value => {
                    if (searchType === '3' && !companyCountry) {
                      SiriusMessage.warning({
                        content: '请选择相关内容中的信息',
                      });
                    } else {
                      handleSearch(value, searchType);
                    }
                  }}
                  handleSearchTypeChange={setSearchType}
                  quantity={quantity}
                  initLayout={initLayout}
                  historyList={historyList}
                  placeholder={`${getIn18Text('QINGSHURU')}${
                    searchType === '1' ? getIn18Text('CHANPINGUANJIANCI') : searchType === '2' ? 'HSCode' : getIn18Text('QIYEMINGCHENG')
                  }`}
                  historySearch={value => {
                    handleSearch(value.value, value.type.toString() as TabValueList, value.country, value.recordType);
                    setKeyword(value.value);
                    setCompanyCountry(value.country);
                    setRecordType(value.recordType as 'import' | 'export');
                  }}
                />
              </div>
              {renderHistoryRecord()}
            </div>
          </div>
          <div className={style.hotKey}>
            <div style={{ background: '#fff' }}>
              <div className={style.hotKeyTitle}>
                <HotFire /> {getIn18Text('WAIMAOREMENCHANPINPAIHANGBANG')}
              </div>
              {hotTableData?.length > 0 && (
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <SiriusTable
                    pagination={false}
                    columns={columns}
                    dataSource={hotTableData}
                    onRow={(data: HotProductRank) => {
                      return {
                        onClick: () => {
                          if (searchType !== '1') {
                            setSearchType('1');
                          }
                          setKeyword(data.productName);
                          handleSearch(data.productName, '1');
                        },
                      };
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TradeAnalysis;
