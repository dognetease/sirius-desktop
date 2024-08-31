import { getIn18Text } from 'api';
import React, { FC } from 'react';
import * as echarts from 'echarts';
import { SubjectAnalysisRes } from 'api';

import { EchartWrap } from '../EchartWrap';
import { UserInfoDetail } from '../UserInfoDetail';
import styles from './UserInfoMapByRegion.module.scss';

export const UserInfoMapByRegion: FC = props => {
  const renderEchart = () => <EchartWrap className={styles.chartsWrap} echartOption={{}} />;

  return (
    <UserInfoDetail
      columns={[]}
      data={[
        {
          analysisDetailList: [
            {
              desc: getIn18Text('ZHONGGUO'),
              count: 120,
              num: 220,
            },
            {
              desc: getIn18Text('MEIGUO'),
              count: 100,
              num: 200,
            },
            {
              desc: getIn18Text('ELUOSI'),
              count: 130,
              num: 230,
            },
          ],
          analysisType: 0,
          emailOpType: 0,
        },
        {
          analysisDetailList: [
            {
              desc: getIn18Text('ZHONGGUO'),
              count: 120,
              num: 220,
            },
          ],
          analysisType: 1,
          emailOpType: 0,
        },
        {
          analysisDetailList: [
            {
              desc: getIn18Text('ELUOSI'),
              count: 130,
              num: 230,
            },
          ],
          analysisType: 2,
          emailOpType: 0,
        },
      ]}
    />
  );
};
