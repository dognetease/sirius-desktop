import React, { useState } from 'react';
import { FFMSStatic } from 'api';
import { Breadcrumb } from 'antd';
import { navigate } from '@reach/router';
import { RouteSearchList } from './routeSearchList';
import { AccessLog, LogType } from '../common/accessLog';
import style from './style.module.scss';

interface Props {
  qs?: Record<string, any>;
}

export const SearchStatDetail: React.FC<Props> = () => {
  const [portInfo, setPortInfo] = useState({ departurePortCode: '', destinationPortCode: '' });
  const [logTitle, setLogTitle] = useState('');

  const onRowSelect = (row: FFMSStatic.PortState) => {
    const departurePortCode = row?.departurePort?.code || '';
    const destinationPortCode = row?.destinationPort?.code || '';

    const departurePort = `${row?.departurePort?.cnName} ${row?.departurePort?.enName}`;
    const destinationPort = `${row?.destinationPort?.cnName} ${row?.destinationPort?.enName}`;
    setLogTitle(`访问记录 【 ${departurePort} - ${destinationPort} 】`);
    setPortInfo({ departurePortCode, destinationPortCode });
  };

  return (
    <div className={style.wrapper}>
      <Breadcrumb>
        <Breadcrumb.Item className={style.breadcrumb} onClick={() => navigate('/#statistics?page=statisticsData')}>
          数据统计
        </Breadcrumb.Item>
        <Breadcrumb.Item>航线搜索排名</Breadcrumb.Item>
      </Breadcrumb>
      <RouteSearchList onSelect={onRowSelect} />

      <AccessLog type={LogType.PortState} title={logTitle} departurePortCode={portInfo.departurePortCode} destinationPortCode={portInfo.destinationPortCode} />
    </div>
  );
};
