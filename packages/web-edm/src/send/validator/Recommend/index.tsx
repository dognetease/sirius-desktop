import React, { FC, useState, useEffect } from 'react';
import { apiHolder, apis, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';
import classnames from 'classnames';
import { ReactComponent as TuijianBgIcon } from '@/images/icons/edm/bg-tuijian.svg';
import { ReactComponent as TitleQuote } from '@/images/icons/edm/title-quote.svg';

import styles from './Recommend.module.scss';

const barWidth = 178;

export const Recommend: FC<{
  data: GetDiagnosisDetailRes;
}> = ({ data }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (data.suggestSendCount && data.lastPeriodSendCount) {
      setWidth((barWidth * data.lastPeriodSendCount) / data.suggestSendCount);
    }
  }, [data]);

  return (
    <div className={styles.wrap}>
      <div className={styles.bgBox}></div>
      <div className={styles.content}>
        <TuijianBgIcon className={styles.bgIcon} />
        <div className={styles.title}>获客优化</div>
        <div className={styles.slogan}>获客优化建议</div>
        <div className={styles.title2}>
          提升发信量
          <TitleQuote className={styles.titleIcon} />
        </div>
        <div className={styles.emails}>
          <div className={styles.emailsTitle}>最近14天发信量</div>
          <div className={styles.countLine}>
            <div className={styles.countLineLabel}>贵公司：</div>
            <div
              style={{
                width,
              }}
              className={styles.lineBar}
            ></div>
            <div className={styles.lineCount}>{data.lastPeriodSendCount}</div>
          </div>
          <div className={styles.countLine}>
            <div className={styles.countLineLabel}>优秀企业：</div>
            <div
              style={{
                width: barWidth,
              }}
              className={classnames(styles.lineBar, styles.lineBar2)}
            ></div>
            <div className={styles.lineCount}>{data.suggestSendCount}</div>
          </div>
        </div>
        <div className={styles.recommend}>
          <span className={styles.recommendLabel}>建议</span>
          <span className={styles.recommendInfo}>通过大数据获取更多客户，并进行多轮营销，以提升客户触达率。</span>
        </div>
        <div className={styles.splitLine}></div>
      </div>
    </div>
  );
};
