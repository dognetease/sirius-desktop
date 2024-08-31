import React from 'react';
import { navigate } from '@reach/router';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import styles from './index.module.scss';
import { TongyongJiantou1You } from '@sirius/icons';
import { ReactComponent as Buy } from '../../images/domain-nav/buy.svg';
import { ReactComponent as Order } from '../../images/domain-nav/order.svg';
import { ReactComponent as Temp } from '../../images/domain-nav/temp.svg';
import { ReactComponent as Cert } from '../../images/domain-nav/cert.svg';
import { ReactComponent as Ques } from '../../images/domain-nav/ques.svg';

export const DomainNav = () => {
  const openHelpCenter = useOpenHelpCenter();

  const goBuy = () => {
    navigate('#site?page=domainSearch');
  };

  const goOrder = () => {
    navigate('#site?page=orderManage');
  };

  const goTemp = () => {
    navigate('#site?page=infoTemplate');
  };

  const goCert = () => {
    navigate('#site?page=myCert');
  };

  const goHelpCenter = () => {
    openHelpCenter('/d/1649407615124459521.html');
  };

  return (
    <div className={styles.domainNavContainer}>
      <div className={styles.domainNavItem}>
        <div className={styles.domainNavItemContainer}>
          <Buy />
          <div className={styles.domainNavInfo}>
            <div className={styles.domainNavTitle} onClick={goBuy}>
              购买域名
            </div>
            <div className={styles.domainNavContent}>0元域名限时送</div>
          </div>
        </div>
        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
      </div>
      <div className={styles.domainNavItem}>
        <div className={styles.domainNavItemContainer}>
          <Order />
          <div className={styles.domainNavInfo} onClick={goOrder}>
            <div className={styles.domainNavTitle}>域名订单</div>
            <div className={styles.domainNavContent}>跟踪订单状态</div>
          </div>
        </div>
        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
      </div>
      <div className={styles.domainNavItem}>
        <div className={styles.domainNavItemContainer} onClick={goTemp}>
          <Temp />
          <div className={styles.domainNavInfo}>
            <div className={styles.domainNavTitle}>信息模版</div>
            <div className={styles.domainNavContent}>域名申请模板管理</div>
          </div>
        </div>
        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
      </div>
      <div className={styles.domainNavItem}>
        <div className={styles.domainNavItemContainer}>
          <Cert />
          <div className={styles.domainNavInfo} onClick={goCert}>
            <div className={styles.domainNavTitle}>证书管理</div>
            <div className={styles.domainNavContent}>证书申请和配置</div>
          </div>
        </div>
        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
      </div>
      <div className={styles.domainNavItem} onClick={goHelpCenter}>
        <div className={styles.domainNavItemContainer}>
          <Ques />
          <div className={styles.domainNavInfo}>
            <div className={styles.domainNavTitle}>域名常见问题</div>
            <div className={styles.domainNavContent}>一站式问题答疑</div>
          </div>
        </div>
        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
      </div>
    </div>
  );
};
