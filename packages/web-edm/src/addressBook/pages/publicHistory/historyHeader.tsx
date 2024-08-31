import React from 'react';
import { Breadcrumb } from 'antd';
import { navigate } from 'gatsby-link';
import style from './historyHeader.module.scss';

interface HistoryHeaderProps {
  paths: {
    url: string;
    name: string;
  }[];
  title: string;
}

const HistoryHeader: React.FC<HistoryHeaderProps> = props => {
  const breadCrumbItems = props.paths.map(({ url, name }) => (
    <Breadcrumb.Item className={url && style.linkBtn} onClick={() => url && navigate(url)}>
      {name}
    </Breadcrumb.Item>
  ));
  return (
    <div className={style.header}>
      <Breadcrumb separator=">">{breadCrumbItems}</Breadcrumb>
      <div className={style.moduleTitle}>{props.title}</div>
    </div>
  );
};

export default HistoryHeader;
