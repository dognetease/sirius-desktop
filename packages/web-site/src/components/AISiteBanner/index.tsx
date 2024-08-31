import { Button } from 'antd';
import React, { CSSProperties } from 'react';
import styles from './index.module.scss';

export interface AISiteBannerProps {
  style?: CSSProperties;
  onExperienceClick?: () => void;
}

const AISiteBanner: React.FC<AISiteBannerProps> = props => {
  const { style = {}, onExperienceClick = () => {} } = props;

  return (
    <div className={styles.aiSiteBanner} style={{ ...style }}>
      <div className={styles.title}>
        <span>AI</span>建站 30秒创建新网站
      </div>
      <div className={styles.subTitle}>智能生成图文描述、网站 SEO 配置等信息</div>
      <Button type="primary" className={styles.experienceButton} onClick={onExperienceClick}>
        立即体验
      </Button>
    </div>
  );
};

export default AISiteBanner;
