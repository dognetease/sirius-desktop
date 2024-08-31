import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'classnames';
import { api, apiHolder, apis, CustomsContinent, IndexCode } from 'api';
import * as echarts from 'echarts';
import style from './tradeEchars.module.scss';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { TabValueList } from '../tradeSearch/tradeSearch';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { TradeType, TradeCompanyType } from '../tradeReport/tradeReport';
import { Select, Skeleton } from 'antd';
type EChartsOption = echarts.EChartsOption;
import { useMeasure } from 'react-use';
import RepeatDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import { recData } from '@/components/Layout/CustomsData/customs/customs';
import SiriusPagination from '@web-common/components/UI/Pagination';
import EmptyResult from '@/components/Layout/globalSearch/search/EmptyResult/EmptyResult';
interface TradeEchars {
  type: TradeType | TradeCompanyType | IndexCode | 'freight' | string;
  echarsConfig?: EChartsOption;
  loading?: boolean;
  title?: string | React.ReactNode;
  tabList?: Array<{
    label: string;
    value: string;
  }>;
  searchType?: TabValueList;
  onTabChange?: (value: string | number, type: TradeType | TradeCompanyType) => void;
  onSelectChange?: (value: string[][] | string[] | string, type: TradeType | TradeCompanyType) => void;
  continentList?: CustomsContinent[];
  height?: number;
  tableData?: any[];
  columns?: any[];
  childNode?: React.ReactNode;
  defaultTabValue?: string;
  style?: React.CSSProperties;
  defaultCountry?: string[];
  to?: 'buysers' | 'supplier';
  tips?: string;
  tabDesc?: string;
  pagination?: { from: number; pageSize: number; total: number };
  setPagination?: (page: number, size?: number) => void;
}

const TradeEchars: React.FC<TradeEchars> = ({
  echarsConfig,
  loading = false,
  title,
  tabList,
  searchType,
  onTabChange,
  onSelectChange,
  continentList,
  height,
  columns,
  childNode,
  type,
  defaultTabValue,
  style: echarStyle,
  defaultCountry,
  to,
  tips,
  tabDesc,
  pagination,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [domRef, { width }] = useMeasure<HTMLDivElement>();
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
  const rendeLineChart = () => {
    let chart = null;
    const myChart = echarts.getInstanceByDom(ref?.current as unknown as HTMLDivElement);
    if (myChart) {
      chart = myChart;
    } else {
      chart = echarts.init(ref?.current as unknown as HTMLDivElement);
    }
    chart?.clear();
    echarsConfig ? chart?.setOption(echarsConfig) : '';
  };

  const map = useMemo(() => {
    if (continentList) {
      if (type === 'targetMarket') {
        return [
          {
            label: '其他',
            value: 'OTHER-COUNTRY',
          },
        ].concat(
          continentList.map(e => ({
            label: e.continentCn,
            value: e.continent,
            children: e.countries.map(d => ({
              label: d.nameCn,
              value: d.name,
            })),
          }))
        );
      } else {
        return continentList.map(e => ({
          label: e.continentCn,
          value: e.continent,
          children: e.countries.map(d => ({
            label: d.nameCn,
            value: d.name,
          })),
        }));
      }
    } else {
      return [];
    }
  }, [type]);

  useEffect(() => {
    if (echarsConfig && ref.current) {
      rendeLineChart();
    }
  }, [echarsConfig]);
  useEffect(() => {
    if (ref?.current) {
      const myChart = echarts.getInstanceByDom(ref?.current as unknown as HTMLDivElement);
      if (myChart) {
        myChart.resize();
      }
    }
  }, [width]);

  const onDrawerClose = (closeIndex: number) => {
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
    console.log('_recDataArr-close', recData);
  };

  const onDrawerOpen = (content: recData['content'], zIndex: number) => {
    const rec = (currentIndex: number, recData: recData) => {
      if (recData) {
        if (currentIndex === zIndex) {
          recData.visible = true;
          recData.to = content.to;
          recData.content = { ...content };
        } else {
          if (!recData.children) {
            recData.children = {
              visible: false,
              zIndex: currentIndex + 1,
              to: content.to,
              content: { ...content },
            };
          }
          rec(currentIndex + 1, recData.children);
        }
      }
    };
    rec(0, recData);
    setRecData({ ...recData });
    console.log('_recDataArr-open', recData);
  };

  return (
    <div className={style.echars} style={echarStyle} ref={domRef}>
      <div className={style.echarsHeader}>
        {(title || (continentList && continentList.length > 0)) && (
          <div className={style.echarsTitle} style={{ width: typeof title === 'string' ? '592px' : '100%' }}>
            <span className={style.echarsTPart} style={{ width: tips ? '100%' : 'auto' }}>
              {title && <span>{title}</span>}
              {tips && <span className={style.echarsTips}>{tips}</span>}
            </span>
            {continentList && continentList.length > 0 ? (
              <Cascader
                style={{ width: '215px' }}
                // multiple
                maxTagCount="responsive"
                placeholder="请选择国家"
                defaultValue={defaultCountry ?? []}
                value={defaultCountry ?? []}
                onChange={values => {
                  onSelectChange && onSelectChange(values as string[], type as TradeType | TradeCompanyType);
                }}
                onBlur={() => {
                  // handleSearch()
                }}
                options={map}
              />
            ) : (
              ''
            )}
          </div>
        )}
        {tabList && tabList.length > 0 && (
          <div className={style.echarsTab}>
            <span>{tabDesc ?? ''}</span>
            <Tabs
              type="capsule"
              size="small"
              bgmode="white"
              defaultActiveKey={defaultTabValue ? defaultTabValue : '1'}
              activeKey={defaultTabValue}
              onChange={value => {
                onTabChange && onTabChange(value, type as TradeType | TradeCompanyType);
              }}
              className={classnames(style.searchTab)}
            >
              {tabList?.map(item => (
                <Tabs.TabPane tab={item.label} key={item.value} />
              ))}
            </Tabs>
          </div>
        )}
      </div>
      <Skeleton
        loading={loading}
        paragraph={{
          rows: 4,
        }}
        active
      >
        {childNode ?? ''}
        {echarsConfig && <div className={style.echarsContent} ref={ref} style={{ height: height ?? 300 }}></div>}
        {rest.tableData && rest.tableData.length > 0 && (
          <SiriusTable
            className={style.echarsTable}
            pagination={false}
            columns={columns}
            dataSource={rest.tableData}
            onRow={(record: any) => ({
              onClick: () => {
                if (record.companyName === '其他') {
                  return;
                }
                to &&
                  onDrawerOpen(
                    {
                      to: to ?? 'buysers',
                      companyName: record.companyName,
                      country: record.country ?? '未公开',
                      originCompanyName: record.companyName,
                    },
                    0
                  );
              },
            })}
            locale={{
              emptyText: () => <EmptyResult query={undefined} defaultDesc={'暂无数据'} />,
            }}
          />
        )}
        {pagination && (
          <SiriusPagination
            className={style.pagination}
            onChange={(nPage, nPageSize) => {
              rest.setPagination && rest.setPagination(nPage, nPageSize);
            }}
            {...{
              ...pagination,
              current: pagination.from,
            }}
          />
        )}
      </Skeleton>
      {/* 详情栏 */}
      <RepeatDrawer recData={recData} onClose={onDrawerClose} onOpen={onDrawerOpen}>
        <CustomsDetail />
      </RepeatDrawer>
    </div>
  );
};

export default TradeEchars;
