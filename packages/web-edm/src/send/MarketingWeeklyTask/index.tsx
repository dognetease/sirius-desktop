// 周任务弹窗判定
import classnames from 'classnames';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';

import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import InfoWeeklyBkg from '@/images/icons/edm/yingxiao/info_weekly_bkg.png';
import SuccessWeeklyBkg from '@/images/icons/edm/yingxiao/success_weekly_bkg.png';
import { RewardTaskPopupInfoRes, RewardTaskPopupInfoCount } from 'api';
import { navigate } from '@reach/router';

interface MarketingWeeklyTaskProps {
  data: RewardTaskPopupInfoRes;
  handleClose: (jumpOut?: boolean) => void;
}

export const MarketingWeeklyTask = (props: MarketingWeeklyTaskProps) => {
  const { data, handleClose } = props;
  const [infoVisible, setInfoVisible] = useState<boolean>(false);
  const [successVisible, setSuccessVisible] = useState<boolean>(false);
  const [rewardCount, setRewardCount] = useState<RewardTaskPopupInfoCount>();

  useEffect(() => {
    const { popupType, edmDays, totalSendCount, rewardSendCount } = data;
    popupType === 0 ? setInfoVisible(true) : setSuccessVisible(true);
    if (popupType === 1) {
      setRewardCount({ edmDays, totalSendCount, rewardSendCount });
    }
  }, [data]);

  const updateInfoVisible = (show: boolean) => {
    setInfoVisible(show);
    handleClose();
  };

  const updateSuccessVisible = (show: boolean) => {
    setSuccessVisible(show);
    handleClose();
  };

  return (
    <div>
      <SiriusModal
        className={classnames(infoVisible ? styles.infoModal : {}, successVisible ? styles.successModal : {})}
        closable={false}
        width={480}
        visible={true}
        footer={null}
      >
        {infoVisible ? (
          <div>
            <div className={styles.background}>
              <img className={styles.img} src={InfoWeeklyBkg} alt="" />
              <div className={styles.contain}>
                <div className={styles.tip}>定期营销</div>
                <div className={styles.title}>
                  奖本周<span className={styles.titlePer}>10%</span>发件量
                  <div className={styles.titleBkg}></div>
                </div>
                <div className={styles.des}>网易外贸通为助力企业营销活动，现推出定期营销奖本周10%发信量的活动</div>
              </div>
            </div>
            <div className={styles.container}>
              <div style={{ marginBottom: '20px' }}>
                <div className={styles.title}>
                  <span className={styles.titleNum}>1.</span>
                  <span className={styles.titleText}>条件</span>
                </div>
                <div className={styles.detail}>1.本周累计使用邮件营销3天及以上</div>
                <div className={styles.detail}>2.同时累计发送人数达500人以上</div>
              </div>
              <div>
                <div className={styles.title}>
                  <span className={styles.titleNum}>2.</span>
                  <span className={styles.titleText}>奖励</span>
                </div>
                <div className={styles.detail}>在下周奖励本周累计发信量的10％。比如达成任务后，累计发送人数1000人，下周奖励100封发件量。</div>
              </div>
            </div>
            <div className={styles.footer}>
              <span className={`${styles.btn} ${styles.close}`} onClick={() => updateInfoVisible(false)}>
                知道了
              </span>
              <span
                className={`${styles.btn} ${styles.mail}`}
                onClick={() => {
                  handleClose(true);
                  navigate('#edm?page=write');
                }}
              >
                去发信
              </span>
            </div>
          </div>
        ) : (
          <></>
        )}
        {successVisible ? (
          <div>
            <div className={styles.background}>
              <img className={styles.img} src={SuccessWeeklyBkg} alt="" />
              <div className={styles.contain}>
                <div className={styles.tip}>恭喜你完成</div>
                <div className={styles.title}>上周定期营销奖发件量任务</div>
              </div>
            </div>
            <div className={styles.container}>
              <div className={`${styles.main} ${styles.common}`}>
                <span className={styles.circle}></span>上周累计营销<span className={styles.num}>{rewardCount?.edmDays}</span>
                <span className={styles.day}>天</span>, 累计发送人数
                <span>
                  <span className={styles.num}>{rewardCount?.totalSendCount}</span>
                </span>
                <span className={styles.day}>人</span>
              </div>
              <div className={`${styles.detail} ${styles.common}`}>
                <span className={styles.circle}></span>
                根据您上周的发送人数，网易外贸通奖励您<span className={styles.num}>{rewardCount?.rewardSendCount}</span>
                <span className={styles.day}>封</span>
                <div className={styles.detailText}>发件量，本周会自动添加到您企业的邮件营销额度中</div>
              </div>
            </div>

            <div className={styles.footer}>
              <span className={`${styles.btn} ${styles.mail}`} onClick={() => updateSuccessVisible(false)}>
                知道了
              </span>
            </div>
          </div>
        ) : (
          <></>
        )}
      </SiriusModal>
    </div>
  );
};
