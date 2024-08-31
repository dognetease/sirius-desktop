import React from 'react';
import { AccessLog } from './common/accessLog';
import { VisualizedData } from './visualizedData';
import style from './style.module.scss';

const SiteDashboard = () => {
  return (
    <div className={style.wrapper}>
      <VisualizedData />
      <AccessLog />
    </div>
  );
};

export default SiteDashboard;
