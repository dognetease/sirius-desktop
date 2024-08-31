import React, { useMemo } from 'react';
import { getIn18Text } from 'api';
import styles from './detail.module.scss';
import EmptyImage1 from '@/images/empty/customer_1.png';
import EmptyImage2 from '@/images/empty/customer_2.png';
import EmptyImage3 from '@/images/empty/customer_3.png';
import EmptyImage4 from '@/images/empty/customer_4.png';

const EmptyContent = () => {
  const renderData: { src: string; title: string; content: string } = useMemo(() => {
    const list = [
      {
        src: EmptyImage1,
        title: getIn18Text('KUAISUCHAKANKEHZL'),
        content: getIn18Text('CHULIYOUJIANSHI，KKSCKKHXPJL、GJJL、WLYJD'),
      },
      {
        src: EmptyImage2,
        title: getIn18Text('KUAISUTIANJIAKEHGJJL'),
        content: getIn18Text('FASONGBAOJIADAN、HTGTSKKSCJKHGJJL，FBKHGJTX'),
      },
      {
        src: EmptyImage3,
        title: getIn18Text('SHISHILURUKEHGJXX'),
        content: getIn18Text('KEJIANGYOUJIANNEIQYMC、KHXM、ZWDGJXXKSLRDKHXQ'),
      },
      {
        src: EmptyImage4,
        title: getIn18Text('ZAIYOUJIANYEYEKJXKHLZ'),
        content: getIn18Text('ZAICHULIYOUJIANS，KJMSRHGRLXRKSZWQZKH，JXQSMZQGL'),
      },
    ];
    const index = Math.floor(Math.random() * 4);
    return list[index];
  }, []);
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyImage}>
        <img src={renderData.src} />
      </div>
      <div className={styles.emptyTitle}>{renderData.title}</div>
      <div className={styles.emptyContent}>{renderData.content}</div>
    </div>
  );
};

export default EmptyContent;
