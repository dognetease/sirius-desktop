import React from 'react';
import { Skeleton } from 'antd';
import styles from './statGroupSkeleton.module.scss';

interface StatGroupSkeletonProps {}

const StatGroupSkeleton: React.FC<StatGroupSkeletonProps> = () => (
  <div className={styles.statGroupSkeleton}>
    <Skeleton avatar={false} title paragraph={false} active />
  </div>
);

export default StatGroupSkeleton;
