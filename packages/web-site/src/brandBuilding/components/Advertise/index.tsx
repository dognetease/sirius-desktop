import React from 'react';
import { Card } from '../Card';
import BrandImg from '../../../images/brand-2.png';
import styles from './index.module.scss';

interface Props {
  onClick: () => void;
}

export const Advertise = (props: Props) => {
  const { onClick } = props;
  return (
    <Card title="我的投放">
      <div className={styles.container}>
        <img src={BrandImg} />
        <div className={styles.content}>
          <div className={styles.title}>
            <span>营销投放</span>
            <span className={styles.line}></span>
            <span>
              首充值&nbsp;
              <span className={styles.money}>¥20,000</span>
              &nbsp;起
            </span>
          </div>
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.itemTitle}>
                <span></span>
                随心设置
              </div>
              <div className={styles.itemInfo}>人群定向，国家定向，商品定向随心设置</div>
            </div>
            <div className={styles.split}></div>
            <div className={styles.item}>
              <div className={styles.itemTitle}>
                <span></span>
                点击计费
              </div>
              <div className={styles.itemInfo}>按点击消耗计费，花钱更安心</div>
            </div>
            <div className={styles.split}></div>
            <div className={styles.item}>
              <div className={styles.itemTitle}>
                <span></span>
                智投工具
              </div>
              <div className={styles.itemInfo}>配套谷歌等海外主流媒体智投工具</div>
            </div>
          </div>
        </div>
        <button className={styles.btn} onClick={onClick}>
          立即咨询
        </button>
      </div>
    </Card>
  );
};
