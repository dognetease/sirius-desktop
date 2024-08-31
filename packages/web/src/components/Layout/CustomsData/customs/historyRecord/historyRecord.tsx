import React, { useState } from 'react';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { ReactComponent as DeleteIcon } from '../../../../../images/icons/customs/delete.svg';
import classnames from 'classnames';
import style from './historyRecords.module.scss';
import { getIn18Text } from 'api';
interface Props {
  searchList: string[];
  onDelete: () => void;
  onClick: (param: string) => void;
  initLayout: boolean;
}
const HistoryRecords = ({ searchList, onDelete, onClick, initLayout }: Props) => {
  return (
    <div className={style.historyWrap}>
      <span className={style.title}>{getIn18Text('SOUSUOJILU\uFF1A')}</span>
      {searchList.map((item, index) => {
        return (
          <span
            onClick={() => {
              onClick(item);
            }}
            className={classnames(style.btn)}
            key={index}
          >
            <EllipsisTooltip>{item}</EllipsisTooltip>
          </span>
        );
      })}
      <DeleteIcon onClick={() => onDelete()} style={{ cursor: 'pointer', color: '#37435c' }} />
    </div>
  );
};
export default HistoryRecords;
