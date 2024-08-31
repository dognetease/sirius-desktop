import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import styles from './tableSkeleton.module.scss';

interface TableSkeletonProps {
  style?: Object;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ style }) => {
  const [rowNum, setRowNum] = useState<number>(40);

  useEffect(() => {
    const skeletonHeight = document.getElementById('table-skeleton')?.clientHeight;
    if (skeletonHeight) {
      const fillNum = (skeletonHeight - 30) / 54;
      const fillInteger = Math.floor(fillNum);
      setRowNum(skeletonHeight - fillInteger * 54 > 44 ? fillInteger + 1 : fillInteger);
    }
  }, []);

  return (
    <div id="table-skeleton" className={styles.tableSkeleton} style={style || {}}>
      {Array(rowNum)
        .fill(null)
        .map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`ske${index}`} className={styles.row}>
            <Skeleton avatar={{ shape: 'square', size: 'small' }} title paragraph={false} active />
          </div>
        ))}
    </div>
  );
};

export default TableSkeleton;
