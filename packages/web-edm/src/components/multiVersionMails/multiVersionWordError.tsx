import { getIn18Text } from 'api';
import React from 'react';
import style from './multiVersionMails.module.scss';

export function MultiVersionWordError() {
  return (
    <div>
      <div className={style.info}>{getIn18Text('ZHENGWENNEIRONGJIEXISHI')}</div>
      <div className={style.info}>{getIn18Text('1. WEIZHENGQUESHI')}</div>
      <div className={style.info}>{getIn18Text('2. YOUJIANNEIRONG')}</div>
      <div className={style.info}>{getIn18Text('3. YOUJIANZHONGZHUAN')}</div>
    </div>
  );
}
