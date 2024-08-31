import * as React from 'react';
import { SnsPostStatus, getSnsPostStatusName } from 'api';
import { Tag } from 'antd';
import style from './PostStatusTag.module.scss';

interface Props {
  status: SnsPostStatus;
}

const SnsPostStatusName = getSnsPostStatusName();
export const PostStatusTag: React.FC<Props> = props => {
  const { status } = props;

  return <Tag className={`${style.tag} ${style[status]}`}>{SnsPostStatusName[status] || '--'}</Tag>;
};
