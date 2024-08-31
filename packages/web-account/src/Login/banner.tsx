import React from 'react';
import { conf } from 'api';
import { Carousel } from 'antd';
import classname from 'classnames';
import styles from './banner.module.scss';
import banner1 from '@/images/onboarding/login/banner_1.png';
import banner2 from '@/images/onboarding/login/banner_2.png';
import banner3 from '@/images/onboarding/login/banner_3.png';
import banner4 from '@/images/onboarding/login/banner_4.png';
import banner5 from '@/images/onboarding/login/banner_5.png';
import { getIn18Text } from 'api';
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
  const isEnglish = window.systemLang === 'en';
  const bannerList = [
    {
      src: banner1,
      title: getIn18Text('\u300CYOUJIAN+\u300D'),
      content: isEnglish ? [] : [getIn18Text('WANGYICHUPIN\uFF0C'), getIn18Text('ZHENGHEYOUXIANG\u3001')],
    },
    {
      src: banner2,
      title: getIn18Text('ZHINENGYOUXIANG'),
      content: isEnglish ? [] : [[getIn18Text('YIDUZHUIZONG'), getIn18Text('KUAIJIEHUIFU'), getIn18Text('CHAODAFUJIAN'), getIn18Text('HAILIANGCHUCUN')]],
    },
    {
      src: banner3,
      title: getIn18Text('XIEZUORICHENG'),
      content: isEnglish ? [] : [[getIn18Text('DINGYUERILI'), getIn18Text('MANGXIANKEJIAN'), getIn18Text('YUDINGHUIYISHI'), getIn18Text('ZIYUANPEIZHI')]],
    },
    {
      src: banner4,
      title: getIn18Text('YUNWENDANG'),
      content: isEnglish ? [] : [[getIn18Text('DUORENCHUANGZUO'), getIn18Text('DUODUANTONGBU'), getIn18Text('YIJIANFENXIANG'), getIn18Text('HUDONGPINGLUN')]],
    },
    {
      src: banner5,
      title: getIn18Text('JISHIXIAOXI'),
      content: isEnglish ? [] : [[getIn18Text('CHUANGJIANQUNZU'), getIn18Text('ZHIDINGHUIHUA'), getIn18Text('CHEHUIBIANJI'), getIn18Text('BIAOQINGHUIFU')]],
    },
  ];
  return (
    <Carousel
      className={classname(styles.bannerWrap, {
        [styles.isElectron]: isElectron,
      })}
      autoplay
      autoplaySpeed={5000}
      dots={{ className: styles.dotsWrap }}
    >
      {bannerList.map(item => (
        <div className={classname(styles.itemWrap, itemClass)}>
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
