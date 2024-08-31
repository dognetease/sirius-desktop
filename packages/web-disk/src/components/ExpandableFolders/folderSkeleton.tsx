import React from 'react';
import { Skeleton } from 'antd';
import styles from './folderSkeleton.module.scss';

interface FolderSkeletonProps {
  height: number;
}

const FolderSkeleton: React.FC<FolderSkeletonProps> = ({ height }) => (
  <div className={styles.folderSkeleton} style={{ height: `${height}px` }}>
    {Array(10)
      .fill(null)
      .map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={`ske${index}`} className={styles.row}>
          <Skeleton avatar={false} title paragraph={false} active />
        </div>
      ))}
  </div>
);

export default FolderSkeleton;
