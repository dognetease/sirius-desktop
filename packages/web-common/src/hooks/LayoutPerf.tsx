import React, { useLayoutEffect } from 'react';
import { apiHolder, apis, PerformanceApi } from 'api';

const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;

interface Props {
  activeKey: string | undefined;
  setClickTick: () => void;
  tickStart: boolean;
}

const LayoutPerf: React.FC<Props> = ({ activeKey, setClickTick, tickStart, children }) => {
  useLayoutEffect(() => {
    if (activeKey && tickStart) {
      console.timeEnd('sidebar click ' + activeKey);
      setClickTick();
      performanceApi.timeEnd({
        statKey: 'side_bar_click_time' + (process.env.BUILD_ISEDM ? '_inEdm' : ''),
        statSubKey: activeKey,
      });
    }
  }, [activeKey, tickStart]);

  return <>{children}</>;
};

export default LayoutPerf;
