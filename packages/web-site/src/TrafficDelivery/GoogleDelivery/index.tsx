import React, { useRef, useEffect, useState, useMemo } from 'react';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { DatePicker, Table } from 'antd';
import styles from './index.module.scss';
// import { Tabs } from '@web-site/../../web-common/src/components/UI/Tabs';
// import CountryFilter from '@web-site/mySite/components/CountryFilter';
import { ReactComponent as ClickTimes } from '../../images/traffic-delivery/click-times.svg';
import { ReactComponent as ShowTimes } from '../../images/traffic-delivery/show-times.svg';
import { ReactComponent as ClickCost } from '../../images/traffic-delivery/click-cost.svg';
import { ReactComponent as TotalCost } from '../../images/traffic-delivery/total-cost.svg';
// import { ReactComponent as DownloadIcon } from '../../images/download-bottom-line.svg';
import StatLineChart from '@web-site/stat/components/StatLineChart';
import { useObserveWidth } from '@web-site/stat/hooks';
import { EmptyDataContent } from '@web-site/components/EmptyDataContent';
import useTrafficDeliveryOverviewInfo from '../hooks/useTrafficDeliveryOverviewInfo';
import useTimeRange from '../hooks/useTimeRange';
import useExpenseStatisticsTable from '../hooks/useExpenseStatisticsTable';
// import useExpenseRecordTable from '../hooks/useExpenseRecordTable';
import edmStyle from '@web-edm/edm.module.scss';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import useDeliveryCountryList from '../hooks/useDeliveryCountryList';

const { RangePicker } = DatePicker;

export interface GoogleDeliveryProps {
  siteId: string;
}

export enum ExpenseStatisticDimensions {
  date = 'time',
  keyword = 'keyword',
  country = 'country',
}

function downloadExpenseRecordExcelFile(url: string, params: string, filename: string) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        const response = xhr.responseText;
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.xlsx`; // 设置要下载的文件名

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error('请求失败：' + xhr.status);
      }
    }
  };
  xhr.send(params);
}

const GoogleDelivery: React.FC<GoogleDeliveryProps> = props => {
  const { siteId } = props;
  // 用于监听页面宽度的 dom 元素
  const containerRef = useRef(null);
  const containerWidth = useObserveWidth(containerRef);

  const { countryListOptionsData, fetchDeliveryCountryList } = useDeliveryCountryList();
  useEffect(() => {
    fetchDeliveryCountryList();
  }, []);

  const [selectedCountrys, setSelectedCountrys] = useState<string[]>([]);

  // const [expenseActiveTab, setExpenseActiveTab] = useState('1');
  // const onExpenseActiveTabChange = (key: string) => {
  //   setExpenseActiveTab(key as string);
  // };

  const [currExpenseStatisDimension, setCurrExpenseStatisDimension] = useState(ExpenseStatisticDimensions.date);
  const handleExpenseStatisDimensionChange = (value: unknown) => {
    setCurrExpenseStatisDimension(value as ExpenseStatisticDimensions);
  };

  const { timeRange: overviewTimeRange, currentDateRef: overviewCurrentDateRef, handleDateChange: handleOverviewDateChange } = useTimeRange();
  const { timeRange: expenseTimeRange, currentDateRef: expenseCurrentDateRef, handleDateChange: handleExpenseDateChange } = useTimeRange();
  // const { timeRange: recordTimeRange, currentDateRef: recordCurrentDateRef, handleDateChange: handleRecordDateChange } = useTimeRange();

  const { overViewInfo, viewChartDataList, clickChartDataList, fetchTrafficDeliveryOverviewInfo } = useTrafficDeliveryOverviewInfo();

  const { getExpenseStatisTableColumns, expenseStatisTableData, fetchExpenseStatisTableData, expenseStatisTableLoading } = useExpenseStatisticsTable();

  const expenseStatisTableColumns = useMemo(() => {
    return getExpenseStatisTableColumns(currExpenseStatisDimension) || [];
  }, [currExpenseStatisDimension]);

  // const { expenseRecordTableColumns, expenseRecordTableData, fetchExpenseRecordTableData, expenseRecordTableLoading } = useExpenseRecordTable();

  useEffect(() => {
    if (overviewTimeRange.eTime && overviewTimeRange.sTime && siteId) {
      fetchTrafficDeliveryOverviewInfo(siteId, overviewTimeRange.sTime, overviewTimeRange.eTime, selectedCountrys);
    }
  }, [overviewTimeRange, siteId, selectedCountrys]);

  useEffect(() => {
    if (expenseTimeRange.eTime && expenseTimeRange.sTime && siteId) {
      fetchExpenseStatisTableData(siteId, expenseTimeRange.sTime, expenseTimeRange.eTime, currExpenseStatisDimension);
    }
  }, [expenseTimeRange, siteId, currExpenseStatisDimension]);

  // useEffect(() => {
  //   if (recordTimeRange.eTime && recordTimeRange.sTime && siteId) {
  //     fetchExpenseRecordTableData(siteId, recordTimeRange.sTime, recordTimeRange.eTime);
  //   }
  // }, [recordTimeRange, siteId]);

  // const handleDownLoadRecordExcel = async () => {
  //   try {
  //     const filename = `花费明细${recordTimeRange.sTime.replaceAll('-', '')}-${recordTimeRange.eTime.replaceAll('-', '')}`
  //     downloadExpenseRecordExcelFile("/site/api/biz/sirius/delivery/download", `siteId=${siteId}&sTime=${recordTimeRange.sTime}&eTime=${recordTimeRange.eTime}`, filename)

  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  return (
    <div className={styles.googleDelivery}>
      <div className={styles.deliveryOverview}>
        <div className={styles.header}>
          <div className={styles.title}>投放概览</div>
          <div className={styles.filterWrapper}>
            <RangePicker
              allowClear={false}
              value={overviewCurrentDateRef.current}
              onChange={handleOverviewDateChange}
              dropdownClassName="edm-date-picker-dropdown-wrap"
              style={{ width: '240px' }}
              separator="~"
            />
            {/* <CountryFilter /> */}
            <EnhanceSelect
              value={selectedCountrys}
              onChange={(value: unknown) => setSelectedCountrys(value as string[])}
              mode="multiple"
              allowClear
              showSearch={true}
              placeholder="选择国家"
              style={{ width: 210 }}
              maxTagCount="responsive"
              optionFilterProp="name"
            >
              {countryListOptionsData.map(item => (
                <InMultiOption value={item.value}>{item.label}</InMultiOption>
              ))}
            </EnhanceSelect>
          </div>
        </div>

        <div className={styles.infoWrapper}>
          <div className={styles.card}>
            <div className={styles.icon}>
              <ShowTimes />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>展示次数</div>
              <div className={styles.value}>{overViewInfo.impressions === -1 ? '' : overViewInfo.impressions}</div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.icon}>
              <ClickTimes />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>点击次数</div>
              <div className={styles.value}>{overViewInfo.clicks === -1 ? '' : overViewInfo.clicks}</div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.icon}>
              <ClickCost />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>平均点击花费</div>
              <div className={styles.value}>
                {overViewInfo.averageCost}
                {overViewInfo.unit}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.icon}>
              <TotalCost />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>总花费（{overViewInfo.unit}）</div>
              <div className={styles.value}>
                {overViewInfo.totalCost}
                {overViewInfo.unit}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.lineChartWrapper} ref={containerRef}>
          <StatLineChart
            data={viewChartDataList}
            count={overViewInfo.viewDataList.length}
            title="展示次数"
            unit="次"
            cardClassName={styles.trafficDeliveryLineChartCard}
            enableDetail={false}
            showCount={false}
            width={containerWidth}
            initHideStatus={false}
          />
          <StatLineChart
            data={clickChartDataList}
            count={overViewInfo.clickDataList.length}
            title="点击次数"
            unit="次"
            cardClassName={styles.trafficDeliveryLineChartCard}
            enableDetail={false}
            showCount={false}
            width={containerWidth}
            initHideStatus={false}
          />
        </div>
      </div>

      <div className={styles.costInfo}>
        <div className={styles.header}>
          <div className={styles.title}>花费统计</div>
          <div className={styles.filterWrapper}>
            <Select value={currExpenseStatisDimension} onChange={handleExpenseStatisDimensionChange}>
              <Select.Option value={ExpenseStatisticDimensions.date}>按日期查看</Select.Option>
              <Select.Option value={ExpenseStatisticDimensions.keyword}>按关键词查看</Select.Option>
              <Select.Option value={ExpenseStatisticDimensions.country}>按国家地区查看</Select.Option>
            </Select>
            <RangePicker
              allowClear={false}
              value={expenseCurrentDateRef.current}
              onChange={handleExpenseDateChange}
              dropdownClassName="edm-date-picker-dropdown-wrap"
              style={{ width: '240px' }}
              separator="~"
            />
          </div>
        </div>
        <div className={styles.costTableWrapper}>
          <Table
            className={`${edmStyle.contactTable}`}
            style={{ flex: 1 }}
            pagination={false}
            columns={expenseStatisTableColumns}
            dataSource={expenseStatisTableData}
            loading={expenseStatisTableLoading}
            scroll={{ x: '100%' }}
            locale={{ emptyText: <EmptyDataContent /> }}
            bordered={false}
          ></Table>
        </div>
      </div>
    </div>
  );
};

export default GoogleDelivery;
