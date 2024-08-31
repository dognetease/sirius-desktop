import React, { useMemo } from 'react';
import styles from './index.module.scss';
import { ReactComponent as RightArrowIcon } from '../../../images/right-arrow.svg';
import { ReactComponent as CustomerMarketIcon } from '../../../images/customer-market.svg';
import { ReactComponent as CustomerManageIcon } from '../../../images/customer-manage.svg';
import { ReactComponent as CustomerViewIcon } from '../../../images/customer-view.svg';
import { getIn18Text, inWindow } from 'api';

interface Props {
  goMarket: () => void;
  addProduct: () => void;
  addCount: number;
  hasEdmModule?: boolean;
}

export const CustomerCard: React.FC<Props> = props => {
  const { goMarket, addProduct, addCount, hasEdmModule = false } = props;

  const isEnLang = inWindow() && window.systemLang === 'en';
  // const countPrefix = addCount ? getIn18Text("JINRIXINZENG") : getIn18Text("JINRIWUXINZENG");
  // const count = addCount ? <span>{addCount}</span> : null;
  // cn: 今日新增X
  // en: Add X today
  const chakanxiansuo = addCount ? (
    isEnLang ? (
      <>
        Add <span>{addCount}</span> today
      </>
    ) : (
      <>
        今日新增 <span>{addCount}</span>
      </>
    )
  ) : (
    getIn18Text('JINRIWUXINZENG')
  );

  const itemCounts = useMemo(() => {
    return hasEdmModule ? 3 : 2;
  }, [hasEdmModule]);

  return (
    <div className={styles.customerCard}>
      {hasEdmModule && (
        <div onClick={goMarket} className={styles.item}>
          <CustomerMarketIcon />
          <div className={styles.item1}>{getIn18Text('YIJIANYINGXIAO')}</div>
          <div className={styles.item2}>{getIn18Text('YINGXIAOYOUJIANCHARUSHANGPIN')}</div>
          <RightArrowIcon />
        </div>
      )}
      <div
        onClick={addProduct}
        className={styles.item}
        style={{
          width: `calc((100% - 32px) / ${itemCounts})`,
        }}
      >
        <CustomerManageIcon />
        <div className={styles.item1}>{getIn18Text('GUANLISHANGPIN')}</div>
        <div className={styles.item2}>{getIn18Text('SHANGPINDEZENGSHANGAICHA')}</div>
        <RightArrowIcon />
      </div>
      <div
        className={styles.item}
        onClick={() => {
          // 和王海沟通后，因个人映射关系不确定，想先跳全部线索，但是全部线索有权限问题，先保持线上逻辑，下面的 查看线索 没有国际化
          window.location.hash = '#/unitable-crm/lead/list?groupType=SITE_INQUIRY';
        }}
        style={{
          width: `calc((100% - 32px) / ${itemCounts})`,
        }}
      >
        <CustomerViewIcon />
        <div className={styles.item1}>查看线索</div>
        {/* <div className={styles.item1}>{getIn18Text('CHAKANKEHU')}</div> */}
        <div className={styles.item2}>{chakanxiansuo}</div>
        <RightArrowIcon />
      </div>
    </div>
  );
};
