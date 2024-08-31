import React from 'react';
import { Divider } from 'antd';
import ReminderPng from '@/images/reminder.jpg';
import style from './risk-reminder-tips.module.scss';
import { getIn18Text } from 'api';
export const RiskReminderTips = () => (
  <div className={style.riskReminderTips}>
    <div className={style.title}>{getIn18Text('MOSHENGRENLAIXIN')}</div>
    <Divider className={style.divider} />

    <div>
      <div className={style.subTitle}>{getIn18Text('SHENMESHIMOSHENG')}</div>
      <div className={style.desc}>{getIn18Text('GONGNENGKAIQIHOU')}</div>
    </div>
    <div>
      <Divider className={style.divider} />
      <div className={style.subTitle}>{getIn18Text('MOSHENGRENLAIXIN')}</div>
      <img className={style.example} src={ReminderPng} alt="png" />
    </div>
  </div>
);
