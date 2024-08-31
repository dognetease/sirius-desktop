import React from 'react';
import { ReactComponent as DataStat } from '../../../../web-common/src/images/icons/data_stat.svg';
import { ReactComponent as TopSiteStat } from '../../../../web-common/src/images/icons/top_site_stat.svg';
import { TopMenuPath } from './constant';

export default [
  {
    name: '运价页面统计',
    path: TopMenuPath.statistics,
    label: '',
    children: [
      {
        name: '运价页面统计',
        path: 'statistics',
        label: '',
        icon: <DataStat />,
        children: [
          {
            name: '数据统计',
            path: 'statisticsData',
            label: '',
            parent: 'statistics',
            topMenuIcon: <TopSiteStat />,
            subset: ['SearchStatistics'],
            children: [],
          },
        ],
      },
    ],
  },
];
