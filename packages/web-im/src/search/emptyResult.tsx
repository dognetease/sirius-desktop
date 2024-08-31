import React from 'react';
import classnames from 'classnames/bind';
import emptyStyle from './empty.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(emptyStyle);
export const EmptyPlaceholder: React.FC<{
  height: number;
}> = ({ height }) => (
  <div
    className={realStyle('selectEmpty')}
    style={{
      height: `${height}px`,
    }}
  >
    <div className={realStyle('sirius-empty')} />
    <p className={realStyle('siriusEmptyText')}>{getIn18Text('QINGSHURUGUANJIAN')}</p>
  </div>
);
export const NoResultPlaceholder: React.FC<{
  height: number;
  children?: React.ReactNode | null;
}> = ({ height, children = null }) => (
  <div
    data-test-id="im_seach_modal_no_result_tip"
    className={realStyle('selectEmpty')}
    style={{
      height: `${height}px`,
    }}
  >
    <div className={realStyle('sirius-empty', 'sirius-empty-message')} />
    <p className={realStyle('siriusEmptyText')}>{getIn18Text('ZANWUJIEGUO')}</p>
    {children}
  </div>
);
