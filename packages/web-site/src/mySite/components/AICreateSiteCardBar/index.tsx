import React from 'react';
import styles from './index.module.scss';

export interface AICreateSiteCardBarProps {
  onConfirmButtonClick?: () => void;
}

const AICreateSiteCardBar: React.FC<AICreateSiteCardBarProps> = props => {
  const handleButtonClick = () => {
    props.onConfirmButtonClick && props.onConfirmButtonClick();
  };

  return (
    <div className={styles.aiCreateSiteCardBar}>
      <div className={styles.icon}></div>
      <div className={styles.info}>
        <div className={styles.title}>
          <span>AI 建站 </span>30秒创建新网站
        </div>
        <div className={styles.subTitle}>智能生成图文描述、网站 SEO 配置等信息</div>
      </div>
      <div className={styles.button} onClick={handleButtonClick}>
        立即体验
      </div>
    </div>
  );
};

export default AICreateSiteCardBar;
