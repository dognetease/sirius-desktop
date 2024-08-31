// eslint-disable-next-line no-use-before-define
import React from 'react';
import { Skeleton, Space } from 'antd';

interface Props {}

const MergeMailLoading: React.FC<Props> = () => (
  <div
    style={{
      margin: '12px 20px 0',
      backgroundColor: '#fff',
      borderRadius: '4px',
      height: '56px',
      overflow: 'hidden',
      paddingLeft: '20px',
      paddingTop: '8px',
    }}
  >
    <Skeleton active avatar title={{ width: '90%' }} />
  </div>
);

export default MergeMailLoading;
