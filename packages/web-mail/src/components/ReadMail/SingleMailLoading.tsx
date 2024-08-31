// eslint-disable-next-line no-use-before-define
import React from 'react';
import { Skeleton } from 'antd';

interface Props {}

const SingleMailLoading: React.FC<Props> = () => (
  <div
    style={{
      width: '100%',
      background: '#FFFFFF',
      height: '320px',
      overflow: 'hidden',
      padding: '20px',
    }}
  >
    <Skeleton active paragraph={{ rows: 7 }} />
  </div>
);

export default SingleMailLoading;
