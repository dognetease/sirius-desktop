import React, { useMemo } from 'react';
import classnames from 'classnames/bind';
import styles from './imSubMenuPannel.module.scss';
import { SysmsgHandler } from './sysmsg';
import { inWindow } from 'api';

const realStyle = classnames.bind(styles);

const imSubMenuPannel: React.FC<{
  paddingMore?: boolean;
}> = ({ paddingMore = false }) => {
  const isClient = inWindow() && process?.env.GATSBY_PLATFORM === 'browser';
  const ImSessionLoading = inWindow() ? useMemo(() => React.lazy(() => import('./imLoadSession')), []) : null;
  const ImStickTop = inWindow() ? useMemo(() => React.lazy(() => import('./imStickTop')), []) : null;

  return (
    <div
      className={realStyle('topSessionWrapper', {
        paddingMore,
      })}
    >
      {isClient && (
        <React.Suspense fallback={<div>loading...</div>}>
          <SysmsgHandler />
          <section className={realStyle('topSessionSection')}>
            <ImStickTop />
            <ImSessionLoading />
          </section>
        </React.Suspense>
      )}
    </div>
  );
};

export default imSubMenuPannel;
