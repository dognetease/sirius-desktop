import React, { useEffect, useRef, FC, useState } from 'react';
import { Radio, DatePicker, Table } from 'antd';
import * as echarts from 'echarts';
import { EChartsType } from 'echarts';
import moment, { Moment } from 'moment';
import type { RadioChangeEvent, TablePaginationConfig } from 'antd';
import { navigate } from '@reach/router';
import { api, apis, getIn18Text, SiteApi } from 'api';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';

import styles from './index.module.scss';
import { EmptyDataContent } from '../../components/EmptyDataContent';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { STAT_SWITCH_OPTIONS, getSiteCascaderOptions, getSpecifiedDateMilliseconds } from '../utils';
import { useObserveWidth } from '../hooks';
import { setBarChartOption, setLineChartsOption } from './utils';
import productStyle from '@web-edm/components/productPreviewModal/style.module.scss';
import useCountryData from '../hooks/useCountryData';

const { RangePicker } = DatePicker;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface StatDetailsProps {
  qs: any;
}

interface ChartsOption {
  chart: EChartsType | null;
  data: (number | string)[][];
  xAxisType?: string;
  yAxisType?: string;
  seriesType?: string;
  type?: string;
  unit?: string; // 单位，例如：人
}
interface ChartsDataItem {
  timePartition: string;
  userNum: number;
}

interface AllSiteDataItem {
  data?: ChartsDataItem[];
  siteName: string;
}

interface BarChartsDataItem {
  siteProId: string;
  productName: string;
  userNum: number;
}
interface DsurationDataItem {
  siteProId: string;
  productName: string;
  stayTime: number;
}
interface CountryDataItem {
  userNum: number;
  userCountry: string;
}

interface SearchDate {
  sTime: string;
  eTime: string;
}
interface TableDataItem {
  date: string | number;
  count: string | number;
  key: number;
}

interface UpdateTableData {
  allTableData: TableDataItem[];
}

type SiteInfo = {
  siteId: string;
  siteName: string;
};

export type StatDetailsType = 'allAccess' | 'allSubmit' | 'detailsAccess' | 'detailsSubmit' | 'landingView' | 'landingClue';

export const StatDetails: FC<StatDetailsProps> = props => {
  const accessType: Array<StatDetailsType> = ['detailsAccess', 'allAccess', 'landingView'];
  const detailsType: StatDetailsType = props.qs.type;
  const countTitle = accessType.includes(detailsType) ? getIn18Text('FANGWENKEHUSHU') : getIn18Text('LIUZIKEHUSHU');
  const viewTitle = accessType.includes(detailsType) ? getIn18Text('YEMIANFANGWENFENBUREN') : getIn18Text('YEMIANLIUZIFENBUREN');
  const countryTitle = accessType.includes(detailsType) ? getIn18Text('GUOJIAFANGWENFENBUREN') : getIn18Text('GUOJIALIUZIFENBUREN');
  const showDsuration = accessType.includes(detailsType);
  const [title, setTitle] = useState('');
  const accessCountRef = useRef<any>(null);
  const pageSubmitRef = useRef<any>(null);
  const countryVisitRef = useRef<any>(null);
  const accessDsurationRef = useRef<any>(null);
  const currentDateRef = useRef<Moment[] | null>(null);
  const paginationRef = useRef({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  // 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据
  const initHideStatus = useRef<any>(true);
  const objResizeObserverRef = useRef<any>(null);
  const [curretSwitch, setCurrentSwitch] = useState('');
  const [siteCascaderOptions, setSiteCascaderOptions] = useState<any[]>([]);

  const [selectedCountrys, setSelectedCountrys] = useState<string[]>([]);
  const { countryList, fetchCountryList } = useCountryData();

  // 级联选择站点和域名
  const selectSiteRef = useRef(['']); // 格式: [siteId, domain] / [siteId]
  const legendNamesRef = useRef();
  const [allTableData, setAllTableData] = useState<TableDataItem[]>([]);
  const [currentTableData, setCurrentTableData] = useState<UpdateTableData | any>([]);
  const [accessCountDta, setAccessCountDta] = useState<any[]>([]);
  const [pageSubmitData, setPageSubmitData] = useState<any[]>([]);
  // ref 用于缓存 pageSubmitData 数据，注意每次 setPageSubmitData 的时候需要更新 pageSubmitDataRef
  const pageSubmitDataRef = useRef<any>();
  const [countryVisitData, setCountryVisitData] = useState<any[]>([]);
  const [accessDsurationData, setAccessDsurationData] = useState<any[]>([]);
  // ref 用于缓存 accessDsurationData 数据，注意每次 setAccessDsurationData 的时候需要更新 accessDsurationDataRef
  const accessDsurationDataRef = useRef<any>();

  const columns = [
    {
      title: getIn18Text('RIQI'),
      dataIndex: 'date',
      key: 'date',
      width: '70%',
    },
    {
      title: countTitle,
      dataIndex: 'count',
      key: 'count',
      width: '30%',
    },
  ];

  useEffect(() => {
    if (currentDateRef.current === null) return;
    handleDateChange(currentDateRef.current);
  }, [selectedCountrys]);

  useEffect(() => {
    // 默认展示最近七天的数据
    let initDate = [
      moment()
        .day(moment().day() - 6)
        .endOf('day'),
      moment().endOf('day'),
    ];
    // navigate 页面跳转参数
    const state = history.state;
    if (state?.startDate) {
      initDate = [moment(state.startDate), moment(state.endDate)];
      selectSiteRef.current = state.domain ? [state.siteId, state.domain] : [state.siteId];
    }
    if (state.selectedCountrys) {
      setSelectedCountrys(state.selectedCountrys);
    }
    currentDateRef.current = initDate;
    // 首次获取数据
    handleDateChange(currentDateRef.current);
    // 获取title
    updateTitle();
    fetchCountryList();
  }, []);

  // 访问时长分布
  useEffect(() => {
    const dom = document.getElementById('access-duration-chart') as HTMLElement;
    if (dom) {
      accessDsurationRef.current = echarts.init(dom, {}, { renderer: 'svg' });
      setBarChartOption({ chart: accessDsurationRef.current, data: accessDsurationData, type: 'dsuration' });
      // 窗口变化时自适应图表宽度为容器宽度
      window.addEventListener('resize', handleDsurationResize);
      handleShowAxisLabelTooltip(accessDsurationRef.current, 'access-duration-tooltip', 'dsuration');
    }
    return () => {
      window.removeEventListener('resize', handleDsurationResize);
    };
  }, [accessDsurationData.length]);

  // 访问客户数
  useEffect(() => {
    const dom = document.getElementById('access-count-chart') as HTMLElement;
    if (dom) {
      accessCountRef.current = echarts.init(dom, {}, { renderer: 'svg' });
      // 更新图表展示
      setLineChartsOption({ chart: accessCountRef.current, data: accessCountDta, names: legendNamesRef.current });
      // setChartOption({ chart: accessCountRef.current, data: accessCountDta, unit: ' 人' });
      // 窗口变化时自适应图表宽度为容器宽度
      window.addEventListener('resize', handleAccessCountResize);
    }
    return () => {
      window.removeEventListener('resize', handleAccessCountResize);
      objResizeObserverRef.current?.disconnect();
    };
  }, [accessCountDta.length]);

  // 页面访问/提交分布
  useEffect(() => {
    const dom = document.getElementById('page-submit-chart') as HTMLElement;
    if (dom) {
      pageSubmitRef.current = echarts.init(dom, {}, { renderer: 'svg' });
      setBarChartOption({ chart: pageSubmitRef.current, data: pageSubmitData, type: 'submit' });
      // 窗口变化时自适应图表宽度为容器宽度
      window.addEventListener('resize', handlePageSubmitResize);
      handleShowAxisLabelTooltip(pageSubmitRef.current, 'page-submit-tooltip', 'submit');
    }
    return () => {
      window.removeEventListener('resize', handlePageSubmitResize);
    };
  }, [pageSubmitData.length]);

  // 国家访问分布
  useEffect(() => {
    const dom = document.getElementById('country-visit-chart') as HTMLElement;
    if (dom) {
      countryVisitRef.current = echarts.init(dom, {}, { renderer: 'svg' });
      setBarChartOption({ chart: countryVisitRef.current, data: countryVisitData, type: 'country' });
      // 窗口变化时自适应图表宽度为容器宽度
      window.addEventListener('resize', handleCountryVisitResize);
      handleShowAxisLabelTooltip(countryVisitRef.current, 'country-visit-tooltip');
    }
    return () => {
      window.removeEventListener('resize', handleCountryVisitResize);
    };
  }, [countryVisitData.length]);

  const updataData = ({
    accessDsurationData,
    accessCountDta,
    pageSubmitData,
    countryVisitData,
  }: {
    accessDsurationData: any[];
    accessCountDta: any[];
    pageSubmitData: any[];
    countryVisitData: any[];
  }) => {
    accessDsurationRef.current && setBarChartOption({ chart: accessDsurationRef.current, data: accessDsurationData, type: 'dsuration' });
    accessCountRef.current && setLineChartsOption({ chart: accessCountRef.current, data: accessCountDta, names: legendNamesRef.current });
    setBarChartOption({ chart: pageSubmitRef.current, data: pageSubmitData, type: 'submit' });
    countryVisitRef.current && setBarChartOption({ chart: countryVisitRef.current, data: countryVisitData, type: 'country' });
    setTimeout(() => {
      handleDsurationResize();
      handleAccessCountResize();
      handlePageSubmitResize();
      handleCountryVisitResize();
    });
  };

  const containerRef = useRef(null);
  // 监听元素变化实时resize图表
  const containerWidth = useObserveWidth(containerRef);
  useEffect(() => {
    handleDsurationResize();
    handleAccessCountResize();
    handlePageSubmitResize();
    handleCountryVisitResize();
  }, [containerWidth]);

  // 当 Echarts 坐标轴 axisLabel 内容过长的时候，鼠标移入显示全部文字
  const handleShowAxisLabelTooltip = (chart: EChartsType, id: string, type?: string) => {
    const $tooltip = document.getElementById(id) as HTMLElement;
    chart.on('mouseover', function (params: any) {
      if (params.componentType == 'yAxis' && $tooltip) {
        let value = params.value;
        if (type === 'submit' || type === 'dsuration') {
          /**
           * 这里的 data 不能直接用 pageSubmitData / accssDsurationData，
           * 因为 handleShowAxisLabelTooltip 是在 useEffect 里面调用的，pageSubmitData 是 useEffect 执行时那次渲染的state
           */
          let data = type === 'submit' ? pageSubmitDataRef.current : accessDsurationDataRef.current;
          if (!data) return;
          // 根据 params.value (siteProId) 查找 productName
          let index = data.findIndex((item: any) => item[1] == value);
          value = data[index]?.[2];
          if (!value) return;
        }
        //设置Tooltip样式
        $tooltip.style.cssText =
          'position:absolute;z-index: 99;color:#272E47;font-size:12px;max-width:240px;word-break:break-all;padding:6px 9px;border-radius:4px;background:#fff;box-shadow:rgba(0,0,0,0.2) 1px 2px 8px;';
        $tooltip.innerHTML = value;
        $tooltip.style.top = params.event.offsetY + 78 + 'px';
        $tooltip.style.left = params.event.offsetX + 10 + 'px';
      }
    });
    chart.on('mousemove', function (params: any) {
      if (params.componentType == 'yAxis' && $tooltip) {
        $tooltip.style.top = params.event.offsetY + 78 + 'px';
        $tooltip.style.left = params.event.offsetX + 10 + 'px';
      }
    });
    chart.on('mouseout', function (params: any) {
      if (params.componentType == 'yAxis' && $tooltip) {
        $tooltip.style.cssText = 'display:none';
      }
    });
  };

  // 访问时长分布resize 事件回调
  const handleDsurationResize = () => {
    accessDsurationRef.current?.resize();
  };

  // 访问客户数 Marketresize 事件回调
  const handleAccessCountResize = () => {
    accessCountRef.current?.resize();
  };

  // 页面访问分布/页面提交分布resize 事件回调
  const handlePageSubmitResize = () => {
    pageSubmitRef.current?.resize();
  };

  // 国家访问分布resize 事件回调
  const handleCountryVisitResize = () => {
    countryVisitRef.current?.resize();
  };

  // 设置title
  const updateTitle = () => {
    const detailsTypeMap: Record<StatDetailsType, string> = {
      allAccess: getIn18Text('ZHENGTIFANGWENKEHUSHU'),
      allSubmit: getIn18Text('ZHENGTILIUZIKEHUSHU'),
      detailsAccess: '详情页访问客户数',
      detailsSubmit: '详情页留资客户数',
      landingView: getIn18Text('YINGXIAOLUODIYEFANGWENKEHUSHU'),
      landingClue: getIn18Text('YINGXIAOLUODIYELIUZIKEHUSHU'),
    };
    setTitle(detailsTypeMap[detailsType] || '');
  };

  /**
   * 设置图表数据
   * @param param0
   * @startTime 开始时间
   * @endTime 结束时间
   */
  const setSiteStatData = ({ sTime, eTime }: SearchDate) => {
    // 首次获取数据
    if (initHideStatus.current) {
      // 获取站点列表
      try {
        siteApi.getSiteDomainList({ isShowOuterSite: true }).then(data => {
          if (data?.length > 0) {
            setSiteCascaderOptions(getSiteCascaderOptions(data));
          }
        });
      } catch (error) {
        console.error(error);
      }
    }

    const [siteId, domain] = selectSiteRef.current;
    /**
     * v0830重构
     * 1、查看每个详情页面，无论是查看单站点还是全部站点都传type: ALL_SITE_LINE参数，每个接口返回数据结构统一了
     * 2、查看全部站点，totalSiteData 是全部站点的那条线，allSiteData是数组，里面包含每个站点的数据线
     * 3、查看单个站点，假设这个站点下面有两个domain，totalSiteData 是全部域名的线，allSiteData 里面有两条数据，是两个域名的线。
     * 4、只查询一个域名的时候，totalSiteData 返回一条线，allSiteData 就不返回了。
     */
    siteApi
      .getStatDetailsData(detailsType, {
        sTime,
        eTime,
        siteId,
        domain,
        countryNames: selectedCountrys.join(','),
        type: 'ALL_SITE_LINE',
      })
      .then(data => {
        const {
          // 页面访问分布（人） top20
          topViewOrReferList,
          // 访问时长分布 (分钟) top10
          topStayTimeList,
          // 国家访问分布 (人) top5
          topCountryList,
          // 分站点/分域名 访问客户数
          allSiteData,
          // 全部站点/全部域名 访问客户数
          totalSiteData,
        } = data;

        const list = (allSiteData || []).filter((item: AllSiteDataItem) => item.data);
        let accessCountDta: Array<any> = [];
        if (list.length && totalSiteData) {
          // 访问客户数：多条折线（选择了全部站点，分站点展示数据；或者选择了单个站点，分域名展示）
          list.unshift(totalSiteData); // 全部站点/全部域名 折线
          accessCountDta = list.map((item: AllSiteDataItem) => getChartsData(item.data!));
          legendNamesRef.current = list.map((item: AllSiteDataItem) => item.siteName);
        } else {
          // 访问客户数：一条折线
          accessCountDta = getChartsData(totalSiteData?.data);
          legendNamesRef.current = undefined;
        }

        // 详情数据表格
        const allTableData: TableDataItem[] = [...(totalSiteData?.data || [])]
          .reverse()
          .map((item: { timePartition: string; userNum: string }, index: number): TableDataItem => {
            return (
              {
                key: index,
                date: item.timePartition,
                count: item.userNum,
              } || []
            );
          });
        // 更新表格数据
        setAllTableData(allTableData || []);

        // 请求过一次数据之后就将展示决定权交给返回的数据
        initHideStatus.current = false;

        // 页面访问分布（人） top20
        const pageSubmitData = getSubmitData(topViewOrReferList);
        // 访问时长分布 (分钟) top10
        const accessDsurationData = getDsurationData(topStayTimeList);
        // 国家访问分布 (人) top5
        const countryVisitData = getCountryData(topCountryList);
        setAccessCountDta(accessCountDta);
        setPageSubmitData(pageSubmitData);
        pageSubmitDataRef.current = pageSubmitData;
        setCountryVisitData(countryVisitData);
        setAccessDsurationData(accessDsurationData);
        accessDsurationDataRef.current = accessDsurationData;

        // 更新图表数据
        updataData({
          accessDsurationData,
          accessCountDta,
          pageSubmitData,
          countryVisitData,
        });

        // 更新分页数据
        paginationRef.current = { ...paginationRef.current, current: 1, total: allTableData.length };
        // 更新表格展示
        updataCurrentTableData({ allTableData });
      });
  };

  // 回到主页
  const goStat = () => {
    let [startDate, endDate]: any = currentDateRef.current || [];
    [startDate, endDate] = [startDate?.format('YYYY-MM-DD'), endDate?.format('YYYY-MM-DD')];
    navigate('#site?page=stat', { state: { startDate, endDate, siteId: selectSiteRef.current[0], domain: selectSiteRef.current[1], selectedCountrys } });
  };

  // 更新当前表格数据
  const updataCurrentTableData = ({ allTableData }: UpdateTableData) => {
    const { current, pageSize } = paginationRef.current;
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentTabelData = allTableData?.slice(startIndex, endIndex);
    setCurrentTableData(currentTabelData);
  };

  /**
   * 日期变化处理函数
   * @param date moment[]
   */
  const handleDateChange = (date: any[]) => {
    const sTimeValue = date[0].startOf('day').valueOf();
    const eTimeValue = date[1].endOf('day').valueOf();
    const sTime = date[0].startOf('day').format('YYYY-MM-DD');
    const eTime = date[1].endOf('day').format('YYYY-MM-DD');
    const allTime = sTimeValue + eTimeValue;

    const value = getSpecifiedDateMilliseconds();

    switch (allTime) {
      case value[0]:
        setCurrentSwitch('week');
        break;
      case value[1]:
        setCurrentSwitch('mouth');
        break;
      case value[2]:
        setCurrentSwitch('quarter');
        break;
      default:
        setCurrentSwitch('');
        break;
    }

    currentDateRef.current = date;

    // 时间变化重新请求数据
    setSiteStatData({
      sTime,
      eTime,
    });
  };

  /**
   * 分页器变化回调
   * @param paginationConfig
   */
  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    const { current, pageSize } = paginationConfig;
    paginationRef.current = { ...paginationRef.current, current, pageSize };
    updataCurrentTableData({ allTableData });
  };

  /**
   * 获取用于绘制图表的数据格式
   * @param data
   */
  const getChartsData = (data: ChartsDataItem[]) => {
    return (
      data?.map((item: ChartsDataItem) => {
        const { timePartition, userNum } = item;
        return [timePartition, userNum];
      }) || []
    );
  };

  // 存在重复的productName，因此 yAxis 的 data 为 siteProId，再特殊处理 axisLabel.formatter，让坐标轴展示 productName
  const getSubmitData = (data: BarChartsDataItem[], isReverse: boolean = false) => {
    return (
      data?.map((item: BarChartsDataItem) => {
        const { siteProId, productName, userNum } = item;
        return [userNum, siteProId, productName];
      }) || []
    );
  };

  const getDsurationData = (data: DsurationDataItem[], isReverse: boolean = false) => {
    return (
      data?.map((item: DsurationDataItem) => {
        const { siteProId, productName, stayTime } = item;
        return [Number(stayTime / 60), siteProId, productName];
      }) || []
    );
  };

  const getCountryData = (data: CountryDataItem[], isReverse: boolean = false) => {
    return (
      data?.map((item: CountryDataItem) => {
        const { userNum, userCountry } = item;

        return [userNum, userCountry];
      }) || []
    );
  };

  /**
   * 切换指定日期区间处理函数
   * @param param0
   */
  const handleSwitchSpecifiedDate = ({ target: { value } }: RadioChangeEvent) => {
    setCurrentSwitch(value);
    switch (value) {
      case 'week':
        const weekDate = [moment().startOf('week'), moment().endOf('day')];
        setSiteStatData({
          sTime: weekDate[0].format('YYYY-MM-DD'),
          eTime: weekDate[1].format('YYYY-MM-DD'),
        });
        currentDateRef.current = weekDate;
        break;
      case 'mouth':
        const mouthDate = [moment().startOf('month'), moment().endOf('day')];
        setSiteStatData({
          sTime: mouthDate[0].format('YYYY-MM-DD'),
          eTime: mouthDate[1].format('YYYY-MM-DD'),
        });
        currentDateRef.current = mouthDate;
        break;
      case 'quarter':
        const quarterDate = [moment().startOf('quarter'), moment().endOf('day')];
        setSiteStatData({
          sTime: quarterDate[0].format('YYYY-MM-DD'),
          eTime: quarterDate[1].format('YYYY-MM-DD'),
        });
        currentDateRef.current = quarterDate;
        break;
      default:
        break;
    }
  };

  const getChartheight = (length: number) => {
    if (length < 3) {
      return length * 50 + 140 + 'px';
    }
    if (length <= 10) {
      return '331px';
    }
    return '512px';
  };

  return (
    <div className={styles.statDetailsContainer}>
      <header className={styles.statDetailsHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goStat}>站点数据</Breadcrumb.Item>
          <Breadcrumb.Item>{title}</Breadcrumb.Item>
        </Breadcrumb>
        {/* 日期组件区域 */}
        <div className={styles.statDetailsHeaderDate}>
          <div className={styles.statDetailsHeaderDateLeft}>
            <div className={styles.statDetailsHeaderDateSwitch}>
              <Radio.Group options={STAT_SWITCH_OPTIONS} value={curretSwitch} optionType="button" buttonStyle="outline" onChange={handleSwitchSpecifiedDate} />
            </div>
            <div className={styles.statDetailsHeaderDatePicker}>
              <RangePicker
                allowClear={false}
                value={currentDateRef.current}
                onChange={handleDateChange}
                dropdownClassName="edm-date-picker-dropdown-wrap"
                style={{ width: '224px' }}
                separator="~"
              />
            </div>
            <div className={styles.statDetailsHeaderCountryPicker}>
              <EnhanceSelect
                value={selectedCountrys}
                onChange={(value: unknown) => setSelectedCountrys(value as string[])}
                mode="multiple"
                allowClear
                showSearch={true}
                placeholder="选择国家"
                style={{ width: 220 }}
                maxTagCount="responsive"
                optionFilterProp="name"
              >
                {countryList.map(item => (
                  <InMultiOption value={item.value}>{item.label}</InMultiOption>
                ))}
              </EnhanceSelect>
            </div>
          </div>
          {siteCascaderOptions.length > 1 && (
            <Cascader
              value={selectSiteRef.current}
              onChange={value => {
                selectSiteRef.current = value as string[];
                handleDateChange(currentDateRef.current!);
              }}
              options={siteCascaderOptions}
              changeOnSelect={true}
              expandTrigger="hover"
              style={{ width: '130px' }}
              popupClassName={productStyle.siteCascader}
            />
          )}
        </div>
      </header>
      <section className={styles.statDetailsContent} ref={containerRef}>
        {/* 访问客户数 */}
        <div className={styles.statDetailsContentItem} style={{ paddingRight: '12px' }}>
          <div className={styles.statDetailsContentItemHeader}>
            <div className={styles.statDetailsContentItemHeaderTitle}>{countTitle}</div>
          </div>
          {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
          {initHideStatus.current ? null : accessCountDta.length ? <div id="access-count-chart" style={{ height: '294px' }}></div> : <EmptyDataContent />}
        </div>
        <div className={styles.statDetailsContentItem}>
          <div className={styles.statDetailsContentItemHeader}>
            <div className={styles.statDetailsContentItemHeaderTitle}>{getIn18Text('XIANGQINGSHUJU')}</div>
          </div>
          {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
          {initHideStatus.current ? null : currentTableData.length ? (
            <div className={styles.statDetailsContentItemTable}>
              <Table
                scroll={{ x: true, y: 550 }}
                pagination={{
                  ...paginationRef.current,
                  showTotal: total => `共${total}条数据`,
                  showSizeChanger: true,
                  pageSizeOptions: ['20', '50', '100'],
                }}
                onChange={handleTableChange}
                columns={columns}
                dataSource={currentTableData}
                rowClassName={(record, index) => (index % 2 === 0 ? 'even' : 'odd')}
              />
            </div>
          ) : (
            <EmptyDataContent />
          )}
        </div>
        {/* 页面访问分布/页面提交分布 */}
        <div className={styles.statDetailsContentItem}>
          <div className={styles.statDetailsContentItemHeader}>
            <div className={styles.statDetailsContentItemHeaderTitle}>{viewTitle} top20</div>
          </div>
          {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
          {initHideStatus.current ? null : pageSubmitData.length ? (
            <div id="page-submit-chart" style={{ height: getChartheight(pageSubmitData.length) }}></div>
          ) : (
            <EmptyDataContent />
          )}
          <div id="page-submit-tooltip" style={{ display: 'none' }}></div>
        </div>
        {showDsuration && (
          <div className={styles.statDetailsContentItem}>
            <div className={styles.statDetailsContentItemHeader}>
              <div className={styles.statDetailsContentItemHeaderTitle}>{getIn18Text('FANGWENSHICHANGFENBUFENZHONG')} top10</div>
            </div>
            {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
            {initHideStatus.current ? null : accessDsurationData.length ? (
              <div id="access-duration-chart" style={{ height: getChartheight(accessDsurationData.length) }}></div>
            ) : (
              <EmptyDataContent />
            )}
            <div id="access-duration-tooltip" style={{ display: 'none' }}></div>
          </div>
        )}
        <div className={styles.statDetailsContentItem}>
          <div className={styles.statDetailsContentItemHeader}>
            <div className={styles.statDetailsContentItemHeaderTitle}>{countryTitle} top5</div>
          </div>
          {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
          {initHideStatus.current ? null : countryVisitData.length ? (
            <div id="country-visit-chart" style={{ height: getChartheight(countryVisitData.length) }}></div>
          ) : (
            <EmptyDataContent />
          )}
          <div id="country-visit-tooltip" style={{ display: 'none' }}></div>
        </div>
      </section>
    </div>
  );
};
