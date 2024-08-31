import * as React from 'react';
import Styles from './with-menu.module.scss';

const NoMenu: React.FC = () => {
  return (
    <div className={Styles.rightContentWrap}>
      <div className={Styles.rightContent}>
        <div className={Styles.rightContentBg}>
          <div className={Styles.rightContentScan}></div>
        </div>
      </div>
    </div>
  );
};

export default NoMenu;
