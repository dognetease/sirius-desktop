import React from 'react';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  relationName?: string;
  from: Array<string>;
  to: Array<string>;
  num: number;
}
export const EmailRelationDetail: React.FC<Props> = props => {
  const { relationName, from = [], to = [], num } = props;
  return (
    <span className={style.wrapper}>
      <span className={style.relationName}>
        {relationName}
        {getIn18Text('ZHONG')}
      </span>
      <span>{getIn18Text('BAOHAN')}</span>
      {from.map((nickName, index) => {
        const name = String(nickName).trim();
        if (index !== 0) {
          return <span className={style.nickName}>,{name}</span>;
        }
        return <span className={style.nickName}>{name}</span>;
      })}
      <span>{getIn18Text('YU')}</span>
      {to.map((nickName, index) => {
        const name = String(nickName).trim();
        if (index !== 0) {
          return <span className={style.nickName}>,{name}</span>;
        }
        return <span className={style.nickName}>{name}</span>;
      })}
      <span>{getIn18Text('ZHIJIANGONG')}</span>
      <span className={style.num}>{num}</span>
      <span>{getIn18Text('FENGYOUJIAN')}</span>
    </span>
  );
};
