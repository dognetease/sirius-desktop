import React, { useEffect, useState, useMemo } from 'react';
import { Col, Row, Spin } from 'antd';
import { navigate } from '@reach/router';
import { apiHolder, apis, FFMSApi, FFMSStatic } from 'api';
import { Moment } from 'moment';
import { Chart } from './chart';
import { uvOption, queryOption } from './options';
import { RangePicker } from '../common/RangePicker';
import style from './style.module.scss';

interface ChartSeries {
  name: string;
  type: string;
  data: (string | number)[];
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const VisualizedData = () => {
  const [uvData, setUvData] = useState<FFMSStatic.VisitStatic[]>([]);
  const [searchData, setSearchData] = useState<FFMSStatic.PortState[]>([]);
  const [uvQueryDate, setUvQueryDate] = useState<Moment[]>([moment().add(-1, 'week'), moment()]);
  const [searchQueryDate, setSearchQueryDate] = useState<Moment[]>([moment().add(-1, 'month'), moment()]);
  const [uvLoading, setUvLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    getUvData();
  }, [uvQueryDate]);

  useEffect(() => {
    getSearchData();
  }, [searchQueryDate]);

  const uvOptionComputed = useMemo(() => {
    const seriesMap: Record<string, ChartSeries> = {};
    const xAxis: string[] = [];
    (uvData || []).forEach(uv => {
      xAxis.push(uv.date);
      (uv.statistics || []).forEach(data => {
        if (!seriesMap[data.customerTypeId]) {
          seriesMap[data.customerTypeId] = {
            name: data.name,
            type: 'line',
            data: [],
          };
        }
        seriesMap[data.customerTypeId].data.push(data.count);
      });
    });

    const series = Object.values(seriesMap);
    const legend = series.map(item => item.name);
    return {
      ...uvOption,
      xAxis: {
        ...uvOption.xAxis,
        data: xAxis,
      },
      legend: { data: legend },
      series,
    };
  }, [uvData]);

  const searchOptionComputed = useMemo(() => {
    const xAxis: string[] = [];
    const querySum: number[] = [];
    const operateSum: number[] = [];
    const exposureSum: number[] = [];
    (searchData || []).forEach(info => {
      const { departurePort, destinationPort } = info;
      xAxis.push(`${departurePort?.cnName} - ${destinationPort?.cnName} `);
      querySum.push(info?.querySum);
      operateSum.push(info?.operateSum);
      exposureSum.push(info?.exposureSum);
    });
    return {
      ...queryOption,
      xAxis: {
        ...queryOption.xAxis,
        data: xAxis,
      },
      legend: { data: ['查询次数', '曝光航线数', '航线操作数'] },
      series: [
        {
          name: '查询次数',
          type: 'bar',
          data: querySum,
        },
        {
          name: '曝光航线数',
          type: 'bar',
          data: exposureSum,
        },
        {
          name: '航线操作数',
          type: 'bar',
          data: operateSum,
        },
      ],
    };
  }, [searchData]);

  async function getUvData() {
    setUvLoading(true);
    const params = {
      type: FFMSStatic.StaticType.MINE,
      visitDateScope: (uvQueryDate || [])
        .filter(Boolean)
        .map(moment => moment.format('YYYY/MM/DD'))
        .join(':'),
    };
    const res = await ffmsApi.getVisiteState(params);
    setUvData(res || []);
    setUvLoading(false);
  }

  async function getSearchData() {
    setSearchLoading(true);
    const params = {
      type: FFMSStatic.StaticType.MINE,
      visitDateScope: (searchQueryDate || [])
        .filter(Boolean)
        .map(moment => moment.format('YYYY/MM/DD'))
        .join(':'),
      page: 1,
      pageSize: 5,
    };
    const res = await ffmsApi.getPortState(params);
    setSearchData(res?.content || []);
    setSearchLoading(false);
  }

  return (
    <div>
      <Row gutter={30}>
        <Col span={12}>
          <Spin spinning={uvLoading}>
            <div className={style.head}>
              <span className={style.title}>整体访问客户数</span>
              <RangePicker allowClear={false} value={uvQueryDate as [Moment, Moment]} onChange={date => setUvQueryDate((date || []) as [Moment, Moment])} />
            </div>
            <Chart options={uvOptionComputed} />
          </Spin>
        </Col>
        <Col span={12}>
          <Spin spinning={searchLoading}>
            <div className={style.head}>
              <span className={style.title}>航线查询排名</span>
              <RangePicker allowClear={false} value={searchQueryDate as [Moment, Moment]} onChange={date => setSearchQueryDate((date || []) as [Moment, Moment])} />
              <span className={style.linkBtn} onClick={() => navigate('/#statistics?page=SearchStatistics')}>
                详情
              </span>
            </div>
            <Chart options={searchOptionComputed} />
          </Spin>
        </Col>
      </Row>
    </div>
  );
};
