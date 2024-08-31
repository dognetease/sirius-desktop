// eslint-disable-next-line no-use-before-define
import React, { useMemo } from 'react';
import { Skeleton, Space } from 'antd';
import styles from './loadings.module.scss';

interface Props {}

export const MailDetailLoading: React.FC<Props> = () =>
  useMemo(
    () => (
      <div
        className={styles.loadingWrap}
        style={{
          padding: '30px',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          // background: '#FFFFFF',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Space>
          <Skeleton.Button shape="round" />
          <Skeleton.Button shape="round" />
          <Skeleton.Button shape="round" />
          <Skeleton.Button shape="round" />
          <Skeleton.Button shape="round" />
          <Skeleton.Button shape="round" />
        </Space>
        <br />
        <br />
        <Skeleton paragraph={{ rows: 0 }} size="large" />
        <Skeleton avatar paragraph={{ rows: 1 }} />
        <br />
        <Skeleton paragraph={{ rows: 100 }} />
      </div>
    ),
    []
  );

export const MergeMailLoading: React.FC<Props> = () => (
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

export const SingleMailLoading: React.FC<Props> = () => (
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

export default MailDetailLoading;
