import React, { FC, useState, useEffect } from 'react';

import styles from './TaskDiagnosis.module.scss';

let timer: NodeJS.Timeout;

export const Loading: FC<{
  loading: boolean;
}> = ({ loading }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!loading) {
      setPercent(100);
    } else if (percent < 90) {
      timer = setTimeout(() => {
        setPercent(percent + 10);
      }, 200);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [percent, loading]);

  return (
    <div className={styles.loading}>
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/01/05/d324b49373d54d74bd51ee822be7a267.png" alt="" />
      <div className={styles.process}>
        <div
          className={styles.childProcess}
          style={{
            transform: `translateX(${percent - 100}%)`,
          }}
        ></div>
      </div>
      <div className={styles.loadingInfo}>正在加载诊断与建议数据...（{percent}%）</div>
    </div>
  );
};
