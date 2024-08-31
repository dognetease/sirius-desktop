import * as React from 'react';
import Styles from './with-menu.module.scss';

const LoadingWithMenu: React.FC = () => {
  return (
    <div className={Styles.mainContainer}>
      <div className={Styles.leftMenu}></div>
      <div className={Styles.rightContentWrap}>
        <div className={Styles.rightContent}>
          <div className={Styles.rightContentBg}>
            <div className={Styles.rightContentScan}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingWithMenu;
