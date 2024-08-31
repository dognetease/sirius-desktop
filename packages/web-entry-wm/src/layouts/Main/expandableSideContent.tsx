import React from 'react';
import SideContentLayout, { SideContentLayoutProps } from './sideContentLayout';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { ExpandMenuActions } from '@web-common/state/reducer';
import { api } from 'api';
import classNames from 'classnames';

import style from './expandableSideContent.module.scss';

const systemApi = api.getSystemApi();
export const ExpandableSideContent: React.FC<SideContentLayoutProps & { isFold: boolean }> = props => {
  const { isFold, children, ...rest } = props;
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const dispatch = useAppDispatch();
  const isElectron = systemApi.isElectron();
  if (isFold) {
    return (
      <div className={style.expandWrapper}>
        <div className={classNames([style.expandBtn, isElectron && style.isElectron])} onClick={() => dispatch(ExpandMenuActions.setIsFold(false))}></div>
      </div>
    );
  }
  return (
    <SideContentLayout
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      <div className={style.foldWrapper}>
        <div className={classNames([style.foldBtn])} onClick={() => dispatch(ExpandMenuActions.setIsFold(true))}></div>
      </div>
      {children}
    </SideContentLayout>
  );
};
