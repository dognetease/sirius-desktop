import React, { useMemo } from 'react';
import { Skeleton } from 'antd';
import styles from './index.module.scss';

interface props {
  loading: boolean;
  isUseRealList: boolean;
  pageSize: number;
}

const ListLoading: React.FC<props> = props => {
  const { loading = false, isUseRealList, pageSize } = props;
  const defaultListLoading = useMemo(() => {
    const res = [];
    for (let i = 0; i < pageSize; i++) {
      res.push(
        <div style={{ height: '75px' }} key={i}>
          <Skeleton active key={i} loading avatar paragraph={{ rows: 1 }} />
        </div>
      );
    }
    return res;
  }, [pageSize]);

  return (
    <div
      hidden={!loading}
      className={styles.loadingWrap}
      style={{
        width: '100%',
        height: isUseRealList ? '100%' : '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        padding: '10px 5px',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {defaultListLoading}
    </div>
  );
};

export default ListLoading;
