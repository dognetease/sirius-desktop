import { getIn18Text } from 'api';
import React, { FC } from 'react';
import { ReactComponent as AiHostingIcon } from '@/images/icons/edm/yingxiao/ai-hosting.svg';
import { ReactComponent as AiHostingBannerIcon } from '@/images/icons/edm/yingxiao/ai-hosting-banner.svg';
import { navigate } from '@reach/router';
import AiMarketingEnter from '../AiMarketingEnter/aiMarketingEnter';

import styles from './AihostingBanner.module.scss';

export const AihostingBanner: FC = props => {
  return (
    <div className={styles.box}>
      <div className={styles.wrap}>
        <div className={styles.left}>
          <AiHostingIcon />
          <div className={styles.info}>
            {getIn18Text('JIANYISHEZHI')}
            <span className={styles.mark}>{getIn18Text('YINGXIAOTUOGUAN')}</span>
            {getIn18Text('RENWU，')}
            <span className={styles.mark}>AI</span>
            {getIn18Text('ZHINENGDIAODU，ZIDONG')}
          </div>
        </div>
        {/* <div className={styles.right} onClick={() => navigate('#edm?page=aiHosting')}>
          立即设置
        </div> */}
        <div className={styles.right}>
          <AiHostingBannerIcon className={styles.icon} />
          <AiMarketingEnter handleType="create" btnType="custom" text={getIn18Text('LIJISHEZHI')} trackFrom="listBanner" />
        </div>
      </div>
    </div>
  );
};
