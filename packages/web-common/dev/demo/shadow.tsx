import React from 'react';
import { Table } from 'antd';
import styles from './shadow.module.scss';

export const ShadowComponent = () => {
  const columns = [
    {
      title: 'Token',
      dataIndex: 'token',
      width: 150,
    },
    {
      title: '语义',
      dataIndex: 'lan',
      width: 150,
    },
    {
      title: '图例',
      dataIndex: 'tuli',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'mark',
      width: 150,
    },
  ];
  const data = [
    {
      key: 1,
      token: 'shadow-mini',
      lan: '投影-下',
      tuli: <div className={styles.mini} />,
      mark: '场景：小卡片、灰底卡片',
    },
    {
      key: 2,
      token: 'shadow-small',
      lan: '投影1-下',
      tuli: <div className={styles.small} />,
      mark: '场景：小卡片、灰底卡片',
    },
    {
      key: 3,
      token: 'shadow-large',
      lan: '投影2-下',
      tuli: <div className={styles.large} />,
      mark: '场景：小卡片、灰底卡片',
    },
    {
      key: 4,
      token: 'shadow-left',
      lan: '投影3-左',
      tuli: <div className={styles.left} />,
      mark: '场景：小卡片、灰底卡片',
    },
  ];
  return <Table columns={columns} dataSource={data} pagination={false} />;
};
