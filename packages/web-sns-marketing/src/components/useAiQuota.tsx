import { getIn18Text } from 'api';
import React, { useEffect } from 'react';
import classnames from 'classnames';
import { SnsTaskAiQuota } from 'api';
import { getSnsAiQuota, fetchSnsAiQuota } from '@web-common/state/reducer/snsAiQuotaReducer';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { Tooltip } from 'antd';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import style from './useAiQuota.module.scss';

interface AiQuotaProps {
  className?: string;
  style?: React.CSSProperties;
}

type UseAiQuota = (config?: { mode?: 'brief' | 'complete' }) => SnsTaskAiQuota & {
  AiQuota: React.FC<AiQuotaProps>;
  refreshAiQuota: () => void;
};

const useAiQuota: UseAiQuota = config => {
  const { mode = 'brief' } = config || {};
  const appDispatch = useAppDispatch();
  const quota = useAppSelector(state => getSnsAiQuota(state.snsAiQuotaReducer));
  const handleQuotaFetch = () => {
    appDispatch(fetchSnsAiQuota());
  };

  useEffect(() => {
    handleQuotaFetch();
  }, []);

  const AiQuota: React.FC<AiQuotaProps> = props => {
    const { className, style: styleFromProps } = props;

    let quotaText = '';

    if (mode === 'complete') {
      quotaText = `(AI使用次数共${quota.totalQuota}次，剩余${quota.remainQuota}次)`;
    }

    if (mode === 'brief') {
      quotaText = `(AI生成额度：剩余${quota.remainQuota}次 / 总数${quota.totalQuota}次)`;
    }

    return (
      <div className={classnames(style.aiQuota, className)} style={styleFromProps}>
        <div className={style.text}>{quotaText}</div>
        <Tooltip
          overlayClassName={style.aiQuotaTooltip}
          title={
            <>
              {getIn18Text('AIXIETIECISHUXIAO')}
              <br />
              {getIn18Text('1. AIXIETIE')}
              <br />
              {getIn18Text('ZHU：SHOUDONGFATIEZHONG')}
              <br />
              {getIn18Text('2. TIEZINEIRONG')}
              <br />
              {getIn18Text('3. TIEZITUPIAN')}
            </>
          }
        >
          <TipIcon className={style.icon} />
        </Tooltip>
      </div>
    );
  };

  return {
    ...quota,
    AiQuota,
    refreshAiQuota: handleQuotaFetch,
  };
};

export default useAiQuota;
