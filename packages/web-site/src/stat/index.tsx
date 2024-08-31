import React, { useEffect, useRef, FC, useState } from 'react';
import { Radio, DatePicker } from 'antd';
import type { RadioChangeEvent } from 'antd';
import moment, { Moment } from 'moment';
import { navigate } from '@reach/router';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';

import { api, apis, SiteApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';
import styles from './index.module.scss';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import { STAT_SWITCH_OPTIONS, getSiteCascaderOptions, getSpecifiedDateMilliseconds } from './utils';
import { useObserveWidth } from './hooks';
import StatLineChart from './components/StatLineChart';
import StatBarChart from './components/StatBarChart';
import { StatDetailsType } from './StatDetails';
import productStyle from '@web-edm/components/productPreviewModal/style.module.scss';
import useCountryData from './hooks/useCountryData';

const { RangePicker } = DatePicker;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface ChartsDataItem {
  timePartition: number;
  userNum: number;
}
interface SearchDate {
  sTime: string;
  eTime: string;
  countryNames?: string;
}

type SiteInfo = {
  siteId: string;
  siteName: string;
};

type SiteChartData = {
  viewCustomerNumList: Array<any>;
  referIntentionNumList: Array<any>;
  landingPageViewCustomerList: Array<any>;
  landingPageReferIntentionList: Array<any>;
  productViewCustomerList: Array<any>;
  productReferIntentionList: Array<any>;
  favoriteProductList: Array<any>;
  favoriteReferIntentionProductList: Array<any>;
};
type SiteNumData = {
  viewCustomerNum: number;
  referIntentionNum: number;
  landingPageViewCustomerNum: number;
  landingPageReferIntentionNum: number;
  productViewCustomerNum: number;
  productReferIntentionNum: number;
  favoriteProductName: string;
  favoriteReferIntentionProductName: string;
};

export const SiteStat: FC = () => {
  // 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据
  const initHideStatus = useRef<any>(true);
  const currentDateRef = useRef<Moment[] | null>(null);
  const [curretSwitch, setCurrentSwitch] = useState('');
  const [siteCascaderOptions, setSiteCascaderOptions] = useState<any[]>([]);
  // 级联选择站点和域名
  const selectSiteRef = useRef(['']); // 格式: [siteId, domain] / [siteId]

  const [selectedCountrys, setSelectedCountrys] = useState<string[]>([]);

  const { countryList, fetchCountryList } = useCountryData();

  const siteChartDataRef = useRef<SiteChartData>({
    viewCustomerNumList: [],
    referIntentionNumList: [],
    landingPageViewCustomerList: [],
    landingPageReferIntentionList: [],
    productViewCustomerList: [],
    productReferIntentionList: [],
    favoriteProductList: [],
    favoriteReferIntentionProductList: [],
  });
  const [siteNumData, setSiteNumData] = useState<SiteNumData>({
    viewCustomerNum: 0,
    referIntentionNum: 0,
    landingPageViewCustomerNum: 0,
    landingPageReferIntentionNum: 0,
    productViewCustomerNum: 0,
    productReferIntentionNum: 0,
    favoriteProductName: '',
    favoriteReferIntentionProductName: '',
  });

  // 用于监听页面宽度的 dom 元素
  const containerRef = useRef(null);
  const containerWidth = useObserveWidth(containerRef);

  useEffect(() => {
    trackApi.track('sitedate_click');
    fetchCountryList();
  }, []);

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
    // getSiteStatData({
    //   sTime: initDate[0].format("YYYY-MM-DD"),
    //   eTime: initDate[1].format("YYYY-MM-DD"),
    // });
  }, []);

  useEffect(() => {
    if (currentDateRef.current === null) return;
    handleDateChange(currentDateRef.current);
  }, [selectedCountrys]);

  /**
   * 获取图表数据
   * @param param0
   * @startTime 开始时间
   * @endTime 结束时间
   */
  const getSiteStatData = async ({ sTime, eTime, countryNames }: SearchDate) => {
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

    siteApi
      .getSiteStatData({
        sTime,
        eTime,
        siteId,
        domain,
        countryNames,
      })
      .then((data: SiteChartData & SiteNumData) => {
        const {
          viewCustomerNumList, // 整体访问客户数
          referIntentionNumList, // 整体留资客户数
          productViewCustomerList, // 商品详情页访问客户数
          productReferIntentionList, // 商品详情留资客户数
          favoriteProductList,
          favoriteReferIntentionProductList,
          landingPageViewCustomerList,
          landingPageReferIntentionList,
        } = data;

        // 请求过一次数据之后就将展示决定权交给返回的数据
        initHideStatus.current = false;

        siteChartDataRef.current = {
          viewCustomerNumList: getChartsData(viewCustomerNumList),
          referIntentionNumList: getChartsData(referIntentionNumList),
          landingPageViewCustomerList: getChartsData(landingPageViewCustomerList),
          landingPageReferIntentionList: getChartsData(landingPageReferIntentionList),
          productViewCustomerList: getChartsData(productViewCustomerList),
          productReferIntentionList: getChartsData(productReferIntentionList),
          favoriteProductList: getChartsData(favoriteProductList),
          favoriteReferIntentionProductList: getChartsData(favoriteReferIntentionProductList),
        };

        setSiteNumData({
          viewCustomerNum: data.viewCustomerNum,
          referIntentionNum: data.referIntentionNum,
          landingPageViewCustomerNum: data.landingPageViewCustomerNum,
          landingPageReferIntentionNum: data.landingPageReferIntentionNum,
          productViewCustomerNum: data.productViewCustomerNum,
          productReferIntentionNum: data.productReferIntentionNum,
          favoriteProductName: data.favoriteProductName,
          favoriteReferIntentionProductName: data.favoriteReferIntentionProductName,
        });
      });
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

  /**
   *  跳转数据详情页面
   */
  const goDetails = (type: StatDetailsType) => {
    let [startDate, endDate]: any = currentDateRef.current || [];
    [startDate, endDate] = [startDate?.format('YYYY-MM-DD'), endDate?.format('YYYY-MM-DD')];

    let state = { startDate, endDate, siteId: selectSiteRef.current[0], domain: selectSiteRef.current[1], selectedCountrys: selectedCountrys };
    navigate(`#site?page=statDetails&type=${type}`, { state });
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

    // 首次获取数据
    getSiteStatData({
      sTime,
      eTime,
      countryNames: selectedCountrys.join(','),
    });
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
        getSiteStatData({
          sTime: weekDate[0].format('YYYY-MM-DD'),
          eTime: weekDate[1].format('YYYY-MM-DD'),
          countryNames: selectedCountrys.join(','),
        });
        currentDateRef.current = weekDate;
        break;
      case 'mouth':
        const mouthDate = [moment().startOf('month'), moment().endOf('day')];
        getSiteStatData({
          sTime: mouthDate[0].format('YYYY-MM-DD'),
          eTime: mouthDate[1].format('YYYY-MM-DD'),
          countryNames: selectedCountrys.join(','),
        });
        currentDateRef.current = mouthDate;
        break;
      case 'quarter':
        const quarterDate = [moment().startOf('quarter'), moment().endOf('day')];
        getSiteStatData({
          sTime: quarterDate[0].format('YYYY-MM-DD'),
          eTime: quarterDate[1].format('YYYY-MM-DD'),
          countryNames: selectedCountrys.join(','),
        });
        currentDateRef.current = quarterDate;
        break;
      default:
        break;
    }
  };

  const goCustomer = () => {
    navigate('#site?page=siteCustomer');
  };

  const goStat = () => {
    navigate('#site?page=stat');
  };

  const siteChartData = siteChartDataRef.current;

  return (
    <div className={styles.statContainer}>
      <header className={styles.statHeader}>
        <div className={styles.statHeaderContainer}>
          <div onClick={goStat} className={styles.statHeaderTitleActive}>
            站点数据
            <span />
          </div>
          <div onClick={goCustomer} className={styles.statHeaderTitle}>
            潜在客户
          </div>
        </div>
        <div className={styles.statHeaderDate}>
          {siteCascaderOptions.length > 1 && (
            <Cascader
              value={selectSiteRef.current}
              onChange={value => {
                selectSiteRef.current = value as string[];
                handleDateChange(currentDateRef.current!);
              }}
              options={siteCascaderOptions}
              changeOnSelect={true}
              style={{ width: '130px', marginRight: '12px' }}
              popupClassName={productStyle.siteCascader}
            />
          )}
          <div className={styles.statHeaderDateSwitch}>
            <Radio.Group options={STAT_SWITCH_OPTIONS} value={curretSwitch} optionType="button" buttonStyle="outline" onChange={handleSwitchSpecifiedDate} />
          </div>
          <div className={styles.statHeaderDatePicker}>
            <RangePicker
              allowClear={false}
              value={currentDateRef.current}
              onChange={handleDateChange}
              dropdownClassName="edm-date-picker-dropdown-wrap"
              style={{ width: '224px' }}
              separator="~"
            />
          </div>
          <div className={styles.statHeaderCountryPicker}>
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
      </header>

      <section className={styles.statContent} ref={containerRef}>
        <StatLineChart
          data={siteChartData.viewCustomerNumList}
          count={siteNumData.viewCustomerNum}
          title={getIn18Text('ZHENGTIFANGWENKEHUSHU')}
          goDetails={() => goDetails('allAccess')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatLineChart
          data={siteChartData.referIntentionNumList}
          count={siteNumData.referIntentionNum}
          title={getIn18Text('ZHENGTILIUZIKEHUSHU')}
          goDetails={() => goDetails('allSubmit')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatLineChart
          data={siteChartData.landingPageViewCustomerList}
          count={siteNumData.landingPageViewCustomerNum}
          title={getIn18Text('YINGXIAOLUODIYEFANGWENKEHUSHU')}
          goDetails={() => goDetails('landingView')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatLineChart
          data={siteChartData.landingPageReferIntentionList}
          count={siteNumData.landingPageReferIntentionNum}
          title={getIn18Text('YINGXIAOLUODIYELIUZIKEHUSHU')}
          goDetails={() => goDetails('landingClue')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatLineChart
          data={siteChartData.productViewCustomerList}
          count={siteNumData.productViewCustomerNum}
          title={getIn18Text('SHANGPINXIANGQINGYEFANGWENKEHUSHU')}
          goDetails={() => goDetails('detailsAccess')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatLineChart
          data={siteChartData.productReferIntentionList}
          count={siteNumData.productReferIntentionNum}
          title="商品详情留资客户数"
          goDetails={() => goDetails('detailsSubmit')}
          width={containerWidth}
          initHideStatus={initHideStatus.current}
        />

        <StatBarChart
          data={siteChartData.favoriteProductList}
          productName={siteNumData.favoriteProductName}
          title={getIn18Text('REMENSHANGPIN')}
          goDetails={() => goDetails('detailsAccess')}
          width={containerWidth}
        />
        <StatBarChart
          data={siteChartData.favoriteReferIntentionProductList}
          productName={siteNumData.favoriteReferIntentionProductName}
          title={getIn18Text('ZUIGAOTIJIAOLVSHANGPIN')}
          goDetails={() => goDetails('detailsSubmit')}
          width={containerWidth}
        />
      </section>
    </div>
  );
};
