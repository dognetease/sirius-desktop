import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'classnames';
import { TimeFilter, getIn18Text } from 'api';
import style from './tradeReport.module.scss';
import { TabValueList } from '../tradeSearch/tradeSearch';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import TradeEchars from '../tradeEchar/tradeEchar';
import useEcharsConfig, { EcharConfigProp, configProp, BsEcharsConfig } from '../../untils/echarsConfig';
import BsTradeEchar from '../tradeEchar/bsTradeEchar';
import domtoimage from 'dom-to-image';
import { timeRangeOptions } from '@/components/Layout/CustomsData/customs/search/constant';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import RepeatDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import { recData } from '@/components/Layout/CustomsData/customs/customs';
import drawFinallyImage, { drawWaterImage } from './common';
import tradeWaterImage from '@/images/globalSearch/tradeWaterImage.png';
import PeersTradeEchar from '../tradeEchar/peerTradeEchar';
import { renderDataTagList } from '@/components/Layout/utils';

export type TradeType = 'gloBuyTrend' | 'buyArea' | 'targetMarket' | 'mainMarket' | 'targetArea';
export type TradeCompanyType = 'goodsDistribution' | 'goodsCategory' | 'routeDistribution' | 'transportPrecent' | 'shipPrecent' | 'supplierTop' | 'gloBuyTrend';
interface TradeReport {
  searchType: TabValueList;
  keyword: string;
  loading: boolean;
  onTabChange?: (value: string, type: TradeType | TradeCompanyType) => void;
  onSelectChange?: (value: string[][] | string[] | string, type: TradeType | TradeCompanyType) => void;
  config: Array<configProp>;
  bsnsConfig: BsEcharsConfig;
  searchPart: 'company' | 'other';
  selectType: 'export' | 'import';
  setLoading?: (param: boolean) => void;
  searchValue?: string;
  companyCountry?: string;
}
interface ImgList {
  url: string;
  height: number;
}
const TradeReport: React.FC<TradeReport> = ({
  searchType,
  keyword,
  loading,
  config,
  onTabChange,
  onSelectChange,
  bsnsConfig,
  searchPart,
  selectType,
  setLoading,
  searchValue,
  companyCountry,
}) => {
  const [echarsConfig] = useEcharsConfig();
  const [recordType, setRecordType] = useState<'export' | 'import' | 'peers'>(selectType);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('last_three_year');
  const ref = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerShow, setBannerShow] = useState<boolean>(false);
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
      tabOneValue: '',
      queryValue: '',
      originCompanyName: '',
      visited: false,
      otherGoodsShipped: [],
    },
  });
  const [disabled, setDisabled] = useState<boolean>(false);
  useEffect(() => {
    setRecordType(selectType);
  }, [selectType]);
  useEffect(() => {
    if (bannerShow) {
      handleDownload();
    }
  }, [bannerShow]);
  const handleTitleText = useMemo(() => {
    if (searchPart === 'other') {
      return (
        <>
          近5年 <span style={{ color: '#4C6AFF' }}>{searchValue}</span> 趋势报告
        </>
      );
    } else {
      return (
        <>
          <span style={{ color: '#4C6AFF' }}>{searchValue + (companyCountry && recordType !== 'peers' ? '-' + companyCountry : '')}</span> 公司报告{' '}
          <span className={style.tag}>
            {renderDataTagList([
              {
                style: 'blue',
                content: {
                  import: '采购商',
                  export: '供应商',
                  peers: '运输公司',
                }[recordType],
              },
            ])}
          </span>
        </>
      );
    }
  }, [searchPart, loading, searchValue, recordType]);
  const bannerTitle = useMemo(() => {
    if (searchType !== '3') {
      return '近5年';
    }
    if (timeFilter === 'last_five_year') {
      return '近5年';
    } else if (timeFilter === 'last_three_year') {
      return '近3年';
    } else if (timeFilter === 'all') {
      return '所有';
    } else {
      return '近1年';
    }
  }, [searchType, timeFilter]);
  const handleDownload = () => {
    if (ref.current) {
      domtoimage
        .toJpeg(ref.current, { bgcolor: '#fff' })
        .then(async dataUrl => {
          drawFinallyImage(drawWaterImage(), dataUrl).then(res => {
            handleBanner(res as string, ref.current?.offsetHeight);
          });
        })
        .catch(() => setBannerShow(false));
    } else if (companyRef.current) {
      domtoimage.toJpeg(companyRef.current, { bgcolor: '#fff' }).then(function (dataUrl) {
        drawFinallyImage(drawWaterImage(), dataUrl).then(res => {
          handleBanner(res as string, companyRef.current?.offsetHeight);
        });
      });
    }
  };
  const handleBanner = (url: string, height?: number) => {
    if (bannerRef.current && height) {
      domtoimage
        .toJpeg(bannerRef.current, { bgcolor: '#fff' })
        .then(function (dataUrl) {
          drawImage(
            [
              {
                url: dataUrl,
                height: bannerRef.current?.offsetHeight as number,
              },
              {
                url: url,
                height: height,
              },
            ],
            bannerRef.current?.offsetWidth,
            height + (bannerRef.current?.offsetHeight as number)
          )
            .then(res => {
              setBannerShow(false);
              var link = document.createElement('a');
              link.download = '贸易分析.jpeg';
              link.href = res as string;
              link.click();
              link.remove();
            })
            .catch(() => setBannerShow(false));
        })
        .catch(() => setBannerShow(false));
    }
  };
  const drawImage = (list: ImgList[], cwith = 100, cheight = 100) => {
    return new Promise((resolve, reject) => {
      const baseList: any = [];
      // 创建 canvas 节点并初始化
      const canvas = document.createElement('canvas');
      canvas.width = cwith;
      canvas.height = cheight;
      const context = canvas.getContext('2d');
      list.map((item, index) => {
        const img = new Image();
        img.src = item.url;
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          context?.drawImage(img, 0, handlePosition(list, index), cwith, item.height);
          const base64 = canvas.toDataURL('image/png');
          baseList.push(base64);
          if (baseList[list.length - 1]) {
            // React.
            canvas.remove();
            resolve(baseList[list.length - 1]);
          }
        };
      });
    });
  };

  const handlePosition = (arr: ImgList[], index: number) => {
    let height = 0;
    if (index === 0) {
      return 0;
    }
    arr.forEach((item, num) => {
      if (index > num) {
        height += item.height;
      }
    });
    return height;
  };
  const onDrawerClose = useCallback(
    (closeIndex: number) => {
      const rec = (currentIndex: number, recData: any) => {
        if (currentIndex === closeIndex) {
          recData.visible = false;
          recData.children && delete recData.children;
        } else {
          const _recData = recData.children;
          rec(currentIndex + 1, _recData);
        }
      };
      rec(0, recData);
      setRecData({ ...recData });
    },
    [recData]
  );

  const onDrawerOpen = useCallback(
    (content: recData['content'], zIndex: number) => {
      const rec = (currentIndex: number, recData: recData) => {
        if (recData) {
          if (currentIndex === zIndex) {
            recData.visible = true;
            recData.to = content.to;
            // 注意数据兼容性
            recData.content = { ...content };
          } else {
            if (!recData.children) {
              recData.children = {
                visible: false,
                zIndex: currentIndex + 1,
                to: content.to,
                // 注意数据兼容性
                content: { ...content },
              };
            }
            rec(currentIndex + 1, recData.children);
          }
        }
      };
      rec(0, recData);
      setRecData({ ...recData });
    },
    [recData]
  );
  return (
    <div className={style.reportContent}>
      {searchPart === 'company' && (
        <div className={style.echarsSelect}>
          <div className={style.echarsRecord}>
            时间范围：
            <EnhanceSelect
              style={{ width: '208px' }}
              value={timeFilter}
              onChange={value => {
                setTimeFilter(value);
              }}
            >
              {timeRangeOptions
                .filter(item => item.value === 'last_one_year' || item.value === 'last_three_year' || item.value === 'last_five_year' || item.value === 'all')
                .map(item => {
                  return (
                    <InSingleOption value={item.value} key={item.value}>
                      {item.label}
                    </InSingleOption>
                  );
                })}
            </EnhanceSelect>
          </div>
        </div>
      )}
      <div className={style.reportHeader}>
        <div
          className={style.reportTitle}
          style={{ cursor: searchPart === 'company' ? 'pointer' : 'auto' }}
          onClick={() => {
            if (searchPart === 'company') {
              onDrawerOpen(
                {
                  to: recordType === 'export' ? 'supplier' : 'buysers',
                  companyName: searchValue ?? '',
                  country: companyCountry ?? '未公开',
                  originCompanyName: searchValue ?? '',
                },
                0
              );
            }
          }}
        >
          {handleTitleText}
        </div>
        {!disabled && (
          <Button
            loading={bannerShow}
            className={classnames(style.titleBtn)}
            onClick={() => {
              setBannerShow(true);
            }}
          >
            {getIn18Text('XIAZAIBAOGAO')}
          </Button>
        )}
      </div>
      {searchPart === 'other' && (
        <div className={style.reportContainer} ref={ref}>
          {config.map((item, index) => {
            return (
              <TradeEchars
                style={{ marginTop: index === 0 ? 0 : '32px' }}
                type={Object.keys(echarsConfig)[index] as TradeType}
                key={Object.keys(echarsConfig)[index]}
                loading={item.loading}
                echarsConfig={item.echarsConfig}
                title={item.title}
                tabList={item.tabList}
                searchType={searchType}
                onTabChange={(value, type) => {
                  onTabChange && onTabChange(value as string, type);
                }}
                onSelectChange={(value, type) => {
                  const [cou, con] = value;
                  onSelectChange && onSelectChange(con ?? cou, type);
                }}
                continentList={item.continentList}
                height={item.height}
                columns={item.columns}
                tableData={item.tableData}
                childNode={item.childNode}
                defaultTabValue={item.tabType}
                defaultCountry={item.defaultCountry}
                to={item.to}
              />
            );
          })}
        </div>
      )}
      {searchPart === 'company' && (
        <div className={style.reportContainer} ref={companyRef}>
          {recordType != 'peers' && <BsTradeEchar config={bsnsConfig} recordType={recordType} timeFilter={timeFilter} setLoading={setLoading} />}
          {recordType === 'peers' && <PeersTradeEchar recordType={recordType} setDisabled={setDisabled} timeFilter={timeFilter} setLoading={setLoading} />}
        </div>
      )}
      {bannerShow && (
        <div className={style.echarsBanner} ref={bannerRef}>
          <section className={style.echarsBnrTitle}>
            {bannerTitle} <span>“{searchValue + (companyCountry && recordType !== 'peers' ? `${searchType === '3' ? '-' + companyCountry : ''}` : '')}”</span>
            {searchPart === 'company'
              ? `公司作为${
                  {
                    import: '采购商',
                    export: '供应商',
                    peers: '运输公司',
                  }[recordType]
                }`
              : ''}
            贸易分析报告
          </section>
          <section className={style.echarsIntro}>
            基于“{searchValue + `${searchType === '3' && recordType !== 'peers' ? '-' + companyCountry : ''}`}
            ”海关交易记录输出，受各国和地区数据开放程度限制，部分数据可能为空
          </section>
          <section className={style.echarsIntro} style={{ marginBottom: 0 }}>
            {`${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`}生成
          </section>
          <img src={tradeWaterImage} alt="" />
        </div>
      )}
      {/* 详情栏 */}
      <RepeatDrawer recData={recData} onClose={onDrawerClose} onOpen={onDrawerOpen}>
        <CustomsDetail />
      </RepeatDrawer>
    </div>
  );
};

export default TradeReport;
