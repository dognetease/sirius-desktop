import { getIn18Text } from 'api';
import React, { useContext, useCallback } from 'react';
import { Space, Breadcrumb } from 'antd';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { SnsMarketingPlatform, SnsMarketingAccount } from 'api';
import { TongyongShuaxin } from '@sirius/icons';
import { navigate } from '@reach/router';
import { RangePicker } from '../../components/rangePicker';
import { AccountPicker } from '../../components/accountPicker';
import { StateDispatchContext, StateContext, Action } from '../stateProvider';
import style from './search.module.scss';

interface Props {
  accoundId?: string;
}

export const SearchModule: React.FC<Props> = props => {
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
      <Breadcrumb className={style.breadWrap} separator={<RightOutlined />}>
        <Breadcrumb.Item onClick={() => navigate('#site?page=snsAccountBinding')}>
          <span className={style.breadcrumb}>{getIn18Text('ZHANGHAOBANGDING')}</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className={style.breadcrumbActive}>{getIn18Text('SHEMEIFENXI')}</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Space>
        <AccountPicker value={props.accoundId} onChange={accountChange} showPlatform={false} />
        <RangePicker value={[state.startTime, state.endTime]} onChange={onRangeChange} defaultRange="month" />
        <div className={style.refresh} onClick={() => dispatch({ type: Action.UpdateState, payload: {} })}>
          <TongyongShuaxin size={14} />
        </div>
      </Space>
    </div>
  );
};
