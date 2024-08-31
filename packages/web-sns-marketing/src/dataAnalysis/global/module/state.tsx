import { getIn18Text } from 'api';
import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiHolder, apis, SnsMarketingApi, SnsDataAnalysis } from 'api';
import { Row, Col, Spin } from 'antd';
import { StateContext, State } from '../stateProvider';
import { OverViewModule } from './overView';
import { Chart } from '../../components/chart';
import style from './state.module.scss';

interface Props {}

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
export const StateModule: React.FC<Props> = () => {
  const search = useContext(StateContext);
  const [stateData, setStateData] = useState<SnsDataAnalysis.MediaStateRes>();
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async (search: State) => {
    setLoading(true);
    const params = {
      ...search,
      startTime: search.startTime ? +search.startTime : '',
      endTime: search.endTime ? +search.endTime : '',
    };
    const res = await snsMarketingApi.getMediaState(params as SnsDataAnalysis.MediaStateReq);
    setStateData(res);
    setLoading(false);
  }, []);

  const defaultChartAxis: string[] = useMemo(() => {
    if (!search.startTime) {
      return [];
    }
    const start = moment(+search.startTime);
    return Array.from(new Array(6)).map((_, index: number) => {
      return start.add(index, 'day').format('MM-DD');
    });
  }, [search.startTime]);

  useEffect(() => {
    fetchState(search);
  }, [search]);

  return (
    <div className={style.wrapper}>
      <OverViewModule loading={loading} data={stateData?.dataScreen as SnsDataAnalysis.MediaOverviewData} />
      <Spin spinning={loading}>
        <Row gutter={12} className={style.row}>
          <Col span={12}>
            <div className={style.cell}>
              <div className={style.content}>
                <div className={style.title}>{getIn18Text('FENSISHU')}</div>
                <div className={style.desc}>{getIn18Text('SHEJIAOHAOFENSISHUSUI')}</div>
                <div className={style.chart}>
                  <Chart name={getIn18Text('FENSISHU')} data={stateData?.fansCountTrends || []} defaultXAxis={defaultChartAxis} />
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className={style.cell}>
              <div className={style.content}>
                <div className={style.title}>{getIn18Text('FENSIJINGZENGCHANG')}</div>
                <div className={style.desc}>{getIn18Text('SHEJIAOHAOFENSIJINGZENG')}</div>
                <div className={style.chart}>
                  <Chart type="bar" name={getIn18Text('FENSIJINGZENGCHANG')} data={stateData?.fansDiffCountTrends || []} defaultXAxis={defaultChartAxis} />
                </div>
              </div>
            </div>
          </Col>
        </Row>
        <Row gutter={12} className={style.row}>
          <Col span={12}>
            <div className={style.cell}>
              <div className={style.content}>
                <div className={style.title}>{getIn18Text('FATIESHU')}</div>
                <div className={style.desc}>{getIn18Text('SHEJIAOHAOFENFATIEWEN')}</div>
                <div className={style.chart}>
                  <Chart type="bar" name={getIn18Text('FATIESHU')} data={stateData?.postSendCountTrends || []} defaultXAxis={defaultChartAxis} />
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className={style.cell}>
              <div className={style.content}>
                <div className={style.title}>{getIn18Text('PINGLUNSHU')}</div>
                <div className={style.desc}>{getIn18Text('SHEJIAOHAOMEITISHANGDE')}</div>
                <div className={style.chart}>
                  <Chart type="bar" name={getIn18Text('PINGLUNSHU')} data={stateData?.postCommentCountTrends || []} defaultXAxis={defaultChartAxis} />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
