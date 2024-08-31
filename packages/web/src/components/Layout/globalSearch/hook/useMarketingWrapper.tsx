import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { getIn18Text } from 'api';
import { useMemoizedFn } from 'ahooks';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { MAX_MARKET_ROWS_LEN, globalSearchApi } from '../constants';

export const useMarketingLimit = () => {
  const [limitLen, setLimitLen] = useState<number>(MAX_MARKET_ROWS_LEN);
  const fetchLimitLen = useMemoizedFn(async () => {
    try {
      const data = await globalSearchApi.searchSettings();
      setLimitLen(data.edmSyncCount);
    } catch (e) {
      // do nothing
    }
  });
  useEffect(() => {
    fetchLimitLen();
  }, []);
  return [limitLen];
};

export const useMarketingWrapper = (selectedRowKeys: string[]) => {
  const [limitLen] = useMarketingLimit();
  const marketingBtnWrapper = useCallback(
    (children: ReactNode) => {
      if (selectedRowKeys.length <= limitLen) return children;
      return (
        <Tooltip
          overlayStyle={{ width: '310px' }}
          getPopupContainer={triggerNode => triggerNode}
          placement="topRight"
          title={`仅支持${limitLen}个公司以内的${getIn18Text('YIJIANYINGXIAO')}`}
        >
          <div style={{ cursor: 'not-allowed', color: '#B7BAC2' }}>{children}</div>
        </Tooltip>
      );
    },
    [selectedRowKeys, limitLen]
  );
  return { marketingBtnWrapper, limitLen };
};
