import React from 'react';
import { Carousel } from 'antd';
import classname from 'classnames';
import styles from './banner.module.scss';
import banner3 from '@/images/onboarding/login/banner_waimao_3.png';

export interface Props {
  itemClass?: string;
}

const Banner: React.FC<Props> = ({ itemClass }) => {
  const bannerList = [
    {
      src: banner3,
      title: '全旅程客户管理',
      content: [['全生命周期客户管理', '全渠道旅程监控', '客户合理分配跟进', '老客挖掘']],
    },
  ];

  return (
    <Carousel className={classname(styles.bannerWrap, styles.bannerWrapWaimao)} autoplay autoplaySpeed={5000} dots={{ className: styles.dotsWrap }}>
      {bannerList.map(item => (
        <div className={classname(styles.itemWrap, itemClass)} key={item.title}>
          <img src={item.src} className={styles.itemImg} alt="" />
        </div>
      ))}
    </Carousel>
  );
};
export default Banner;
