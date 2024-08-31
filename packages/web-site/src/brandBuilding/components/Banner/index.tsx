import React from 'react';
import styles from './index.module.scss';
import BrandImg from '../../../images/brand-bg.png';

interface Props {
  onClick: () => void;
}

export const Banner = (props: Props) => {
  const { onClick } = props;
  return (
    <div className={styles.container}>
      <img className={styles.bannerImg} src={BrandImg} />
      <div className={styles.bannerContent}>
        <div className={styles.bannerTitle}>打造外贸品牌</div>
        <div className={styles.bannerTitle}>开发海外客户，高效获取询盘</div>
        <div className={styles.bannerInfo}>快速搭建站点｜省心运营社媒｜高效流量投放</div>
        <button className={styles.bannerBtn} onClick={onClick}>
          详细咨询
        </button>
      </div>
    </div>
  );
};
