import { Button } from 'antd';
import React from 'react';
import styles from './index.module.scss';

export interface SiteBannerProps {
  onFreeConsult?: () => void;
  onBuy?: () => void;
}

const SiteBanner = (props: SiteBannerProps) => {
  const { onBuy = () => {}, onFreeConsult = () => {} } = props;
  return (
    <div className={styles.siteBanner}>
      <div className={styles.flexContainer}>
        <div className={styles.mainTitle}>
          外贸通建站服务，<span>快速</span>搭建公司站点
        </div>
        <div className={styles.mainFlexContainer}>
          <div className={styles.left}>
            <div className={styles.rowFlexWrapper}>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>行业全</div>
                <div className={styles.info}>覆盖60+大行业，150+小行业</div>
              </div>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>模板多</div>
                <div className={styles.info}>2000套精美模板，方便选择使用</div>
              </div>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>随心搭</div>
                <div className={styles.info}>搭配建站编辑器，随心自由设计</div>
              </div>
            </div>
            <div className={styles.rowFlexWrapper}>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>赠送域名</div>
                <div className={styles.info}>支持免费申请域名、证书</div>
              </div>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>移动适配</div>
                <div className={styles.info}>适配手机端浏览，多场景营销</div>
              </div>
              <div className={styles.columnFlexWrapper}>
                <div className={styles.title}>智能SEO</div>
                <div className={styles.info}>自动配置SEO，提交搜索引擎收录</div>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <Button className={styles.defaultButton} type="default" onClick={onFreeConsult}>
              免费咨询
            </Button>
            <Button className={styles.primaryButton} type="primary" onClick={onBuy}>
              立即购买
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.priceWrapper}>
        <span className={styles.price}>1999元</span>
        <span className={styles.unit}>/年</span>
      </div>
    </div>
  );
};

export default SiteBanner;
