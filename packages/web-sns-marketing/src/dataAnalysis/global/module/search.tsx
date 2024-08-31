import { getIn18Text } from 'api';
import React, { useContext, useCallback } from 'react';
import { Space } from 'antd';
import { SnsMarketingPlatform, SnsMarketingAccount } from 'api';
import { TongyongShuaxin } from '@sirius/icons';
import { RangePicker } from '../../components/rangePicker';
import { AccountPicker } from '../../components/accountPicker';
import { StateDispatchContext, StateContext, Action } from '../stateProvider';
import style from './search.module.scss';

export const SearchModule: React.FC = () => {
  const dispatch = useContext(StateDispatchContext);
  const state = useContext(StateContext);

  const accountChange = useCallback(
    (platform: SnsMarketingPlatform | '', account: SnsMarketingAccount | null) => {
      const payload = {
        platform: account?.platform || platform || '',
        accountId: account?.accountId || '',
        accountType: account?.accountType || '',
        authorizeType: account?.authorizeType || '',
      };
      dispatch({ type: Action.UpdateState, payload });
    },
    [dispatch]
  );

  const onRangeChange = useCallback(
    (startTime: string, endTime: string) => {
      dispatch({ type: Action.UpdateState, payload: { startTime, endTime } });
    },
    [dispatch]
  );

  return (
    <div className={style.wrapper}>
      <Space>
        <div className={style.title}>{getIn18Text('SHEMEISHUJU')}</div>
        <AccountPicker onChange={accountChange} showAccount={false} />
      </Space>
      <Space>
        <RangePicker value={[state.startTime, state.endTime]} onChange={onRangeChange} defaultRange="month" />

        <div className={style.refresh} onClick={() => dispatch({ type: Action.UpdateState, payload: {} })}>
          <TongyongShuaxin size={14} />
        </div>
      </Space>
    </div>
  );
};
