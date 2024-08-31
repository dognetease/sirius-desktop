import React from 'react';
import { conf } from 'api';
import { Carousel } from 'antd';
import classname from 'classnames';
import styles from './banner.module.scss';
import banner1 from '@/images/onboarding/login/banner_waimao_1.png';
import banner2 from '@/images/onboarding/login/banner_waimao_2.png';
import banner3 from '@/images/onboarding/login/banner_waimao_3.png';
import banner4 from '@/images/onboarding/login/banner_waimao_4.png';
import banner5 from '@/images/onboarding/login/banner_waimao_5.png';

export interface Props {
  itemClass?: string;
}
interface BannerContentProps {
  content: string | string[];
}
const isElectron = conf('build_for') === 'electron';
const BannerContent: React.FC<BannerContentProps> = ({ content }) => {
  if (!Array.isArray(content)) {
    return <div className={styles.itemContentLine}>{content}</div>;
  }
  return (
    <div className={styles.itemContentLine}>
      {content.map((cur, i) => (
        <>
          {i === 0 ? null : <div className={styles.separator} />}
          <span>{cur}</span>
        </>
      ))}
    </div>
  );
};

const Banner: React.FC<Props> = ({ itemClass }) => {
  const bannerList = [
    {
      src: banner1,
      title: '多触点精准营销',
      content: [['邮件营销', 'WhatsApp营销', 'Facebook社媒营销', '营销自动化']],
    },
    {
      src: banner2,
      title: '智能邮箱',
      content: [['已读追踪', '快捷回复', '超大附件', '海量储存']],
    },
    {
      src: banner3,
      title: '全旅程客户管理',
      content: [['全生命周期客户管理', '全渠道旅程监控', '客户合理分配跟进', '老客挖掘']],
    },
    {
      src: banner4,
      title: '多渠道获客',
      content: [['海关数据', 'Google', 'Facebook社媒', 'WhatsApp', '独立站']],
    },
    {
      src: banner5,
      title: '协同办公',
      content: [['邮件+', '日历', '即时沟通', '云文档']],
    },
  ];

  return (
    <Carousel
      className={classname(styles.bannerWrap, styles.bannerWrapWaimao, {
        [styles.isElectron]: isElectron,
      })}
      autoplay
      autoplaySpeed={5000}
      dots={{ className: styles.dotsWrap }}
    >
      {bannerList.map(item => (
        <div className={classname(styles.itemWrap, itemClass)} key={item.title}>
          <img src={item.src} className={styles.itemImg} alt="" />
          <div className={styles.itemTitle}>{item.title}</div>
          <div className={styles.itemContent}>
            {item.content.map(txt => (
              <BannerContent content={txt} />
            ))}
          </div>
        </div>
      ))}
    </Carousel>
  );
};
export default Banner;
