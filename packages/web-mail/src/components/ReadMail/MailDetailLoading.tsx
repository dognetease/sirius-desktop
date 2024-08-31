// eslint-disable-next-line no-use-before-define
import React, { useMemo } from 'react';
import { Skeleton, Space } from 'antd';

interface Props {}

const MailDetailLoading: React.FC<Props> = () =>
  useMemo(
    () => (
      <div
        style={{
          padding: '30px',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          background: '#FFFFFF',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Space>
          <Skeleton.Button active shape="round" />
          <Skeleton.Button active shape="round" />
          <Skeleton.Button active shape="round" />
          <Skeleton.Button active shape="round" />
          <Skeleton.Button active shape="round" />
          <Skeleton.Button active shape="round" />
        </Space>
        <br />
        <br />
        <Skeleton paragraph={{ rows: 0 }} size="large" />
        <Skeleton avatar paragraph={{ rows: 1 }} />
        <br />
        <Skeleton active paragraph={{ rows: 100 }} />
      </div>
    ),
    []
  );

export default MailDetailLoading;
