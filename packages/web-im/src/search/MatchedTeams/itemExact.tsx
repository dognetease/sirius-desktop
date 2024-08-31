import React from 'react';
import { Divider } from 'antd';
import classnames from 'classnames/bind';
import style from './itemExact.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface Props {
  keyword: string;
  maxCount: number;
}
export const ItemExact: React.FC<Props> = ({ keyword, maxCount }) => (
  <>
    <div className={realStyle('teamExact')}>
      <div className={realStyle('teamExactIcon')} />
      <div className={realStyle('teamExactText')}>
        <p>{getIn18Text('CHAZHAOGONGKAIQUN')}</p>
        <p className={realStyle('teamExactNum')}>{keyword}</p>
      </div>
    </div>
    {maxCount > 1 && <Divider className={realStyle('teamExactDivider')} />}
  </>
);
