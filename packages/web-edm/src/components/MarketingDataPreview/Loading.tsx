import React, { FC } from 'react';
import { Progress, Button } from 'antd';

import styles from './MarketingDataPreview.module.scss';
import { getIn18Text } from 'api';

export const Loading: FC<{
  percent: number;
  /**
   * 0: loading;1:加载失败；2:无网络
   */
  type?: 0 | 1 | 2;
}> = ({ percent, type = 0 }) => {
  if (type === 1) {
    return (
      <div
        className={styles.loadingWrapper}
        style={{
          marginTop: 30,
        }}
      >
        <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/01/11/8931f275dd544d309bd8acf359cdd1ee.png" alt="" />
        <div className={styles.loadingInfo}>{getIn18Text('JIAZAISHIBAI')}</div>
        <Button onClick={() => history.go()} type="primary">
          {getIn18Text('ZHONGXINJIAZAI')}
        </Button>
      </div>
    );
  }

  if (type === 2) {
    return (
      <div
        className={styles.loadingWrapper}
        style={{
          marginTop: 30,
        }}
      >
        <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/01/11/1445517dcf8a40bba866684a998c1bcc.png" alt="" />
        <div className={styles.loadingInfo}>{getIn18Text('WUWANGLUO')}</div>
      </div>
    );
  }

  return (
    <div
      className={styles.loadingWrapper}
      style={{
        marginTop: 30,
      }}
    >
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/01/05/d324b49373d54d74bd51ee822be7a267.png" alt="" />
      <div className={styles.loadingTitle}>
        {getIn18Text('ZHENGZAISHENGCHENGBAOGAO.')}
        {percent}%）
      </div>
      <div className={styles.loadingInfo}>{getIn18Text('SHENGCHENGBAOGAOXUYAOYI')}</div>
      <div
        style={{
          width: 320,
        }}
      >
        <Progress strokeColor="#4C6AFF" strokeWidth={6} strokeLinecap="butt" percent={percent} showInfo={false} />
      </div>
    </div>
  );
};
