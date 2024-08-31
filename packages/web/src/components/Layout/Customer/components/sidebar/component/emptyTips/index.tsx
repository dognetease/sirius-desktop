import classnames from 'classnames';
import React from 'react';
import { ReactComponent as EmptyDataImg } from '@/images/mailCustomerCard/empty-data.svg';
import style from './index.module.scss';
import { getIn18Text } from 'api';
export const EmptyTips = ({ className, text = getIn18Text('ZANWUSHUJU') }: { className?: string; text?: string }) => (
  <div className={classnames(style.emptyTips, className)}>
    <EmptyDataImg />
    <p>{text}</p>
  </div>
);
