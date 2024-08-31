import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import classnames from 'classnames/bind';
import style from './empty.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
export const CommonItemsNote: React.FC<{
  count: number;
  maxCount: number;
  switchTab(flag: boolean): void;
}> = props => {
  const { count, maxCount, switchTab } = props;
  if (count > maxCount) {
    return (
      <span
        className="search-load-more"
        data-test-id="im_search_item_loadmore"
        onClick={() => {
          switchTab(false);
        }}
      >
        {getIn18Text('CHAKANGENGDUO')}
      </span>
    );
  }
  return null;
};
export const RemoteMsgsNote: React.FC<{
  count: number;
}> = props => {
  const { count } = props;
  return (
    <p className={realStyle('remoteTips')}>
      {getIn18Text('GONGSOUDAO')}
      {count}
      {getIn18Text('TIAOYUNDUANLIAOTIAN')}
    </p>
  );
};
export const LocalTeamExactMsgsNote = () => <p className={realStyle('remoteTips')}>{getIn18Text('YIZHANSHIQUANBU')}</p>;
export const LocalMsgsNote: React.FC<{
  count: number;
  maxCount: number;
  switchTab(flag: boolean): void;
}> = props => {
  const { count, maxCount, switchTab = () => {} } = props;
  if (Number.isSafeInteger(maxCount) ? count <= maxCount : count % 30 !== 0) {
    return (
      <p className={realStyle('remoteTips')}>
        {getIn18Text('YIZHANSHIQUANBU')}
        <span
          className={realStyle('remoteLink')}
          onClick={() => {
            switchTab(true);
          }}
        >
          {getIn18Text('CHANGSHIYUNDUANSOU')}
        </span>
      </p>
    );
  }
  return <CommonItemsNote maxCount={maxCount} count={count} switchTab={switchTab} />;
};
