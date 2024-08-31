import React from 'react';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import style from '../globalSearch.module.scss';
import { getIn18Text } from 'api';

const intros = [
  getIn18Text('FUGAIQUANQIUGEGUOJIAQUYU'),
  getIn18Text('JUHESHEJIAOMEITIHESOUSUOYINQINGSHUJU'),
  getIn18Text('SHENDUWAJUELIANXIRENYOUXIANG'),
  getIn18Text('HAILIANGSHUJUMEIRIGENGXIN'),
];

export default (props: { introduce?: string[] }) => {
  const { introduce = intros } = props;
  return (
    <div className={style.introWrapper}>
      {introduce.map(tp => (
        <div className={style.introItem} key={tp}>
          <CheckIcon />
          <span className={style.introText}>{tp}</span>
        </div>
      ))}
    </div>
  );
};
