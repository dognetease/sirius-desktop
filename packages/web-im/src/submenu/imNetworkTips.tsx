import React, { useEffect, useState } from 'react';
import { apiHolder, NIMApi, apis, PerformanceApi } from 'api';
import classnames from 'classnames/bind';
import style from './imNetworkTips.module.scss';
import { performanceLogDeclare } from '../common/logDeclare';
import { ReactComponent as WifiCloseIcon } from '@/images/icons/wifi_closed.svg';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// const imReConnectStatKey = performanceLogDeclare.PREFIX_KEY + '_' + performanceLogDeclare.SUB_KEYS.WILL_CONNECT;
const imReConnectStatKey = performanceLogDeclare.PREFIX_KEY + '_' + performanceLogDeclare.SUB_KEYS.WILL_CONNECT;
const MAX_REPORT_TIME_SPAN = 5 * 60 * 1000;
function reportRetryCount(count: number, reconnectTime: number) {
  if (count > 2) {
    const span = Date.now() - reconnectTime;
    performanceApi
      .point({
        statKey: imReConnectStatKey,
        statSubKey: span > MAX_REPORT_TIME_SPAN ? 'continue' : 'finish',
        params: { span },
        value: count,
        valueType: 4,
      })
      .then();
  }
}
const ImNetworkTips: React.FC<{
  networkChange(flag: boolean): void;
}> = ({ networkChange }) => {
  const [networkStatus, setNetworkStatus] = useState<'ing' | 'success' | 'failed'>('success');
  const [retryCount, setRetryCount] = useState(0);
  const [reconnectTime, setReconnectTime] = useState(-1);
  const onwillreconnect = (args: { retryCount: any }) => {
    const { retryCount: count } = args;
    setRetryCount(count);
    // 超过两次打点
    // if (count > 2) {
    //   performanceApi.point({
    //     statKey: imReConnectStatKey,
    //     value: count,
    //     valueType: 2
    //   }).then();
    // }
    setReconnectTime(time => {
      setNetworkStatus('ing');
      if (time <= 0) {
        return Date.now();
      }
      if (Date.now() - time > MAX_REPORT_TIME_SPAN) {
        reportRetryCount(count, time);
      }
      return time;
    });
  };
  const updateAndReport = () => {
    setRetryCount((count: number) => {
      reportRetryCount(count, reconnectTime);
      return 0;
    });
    setReconnectTime(-1);
  };
  const ondisconnect = () => {
    updateAndReport();
    setNetworkStatus('failed');
  };
  const onconnect = () => {
    updateAndReport();
    setNetworkStatus('success');
  };
  useEffect(() => {
    nimApi.subscrible('onwillreconnect', onwillreconnect);
    nimApi.subscrible('ondisconnect', ondisconnect);
    nimApi.subscrible('onconnect', onconnect);
    return () => {
      nimApi.unSubcrible('onwillreconnect', onwillreconnect);
      nimApi.unSubcrible('ondisconnect', ondisconnect);
      nimApi.unSubcrible('onconnect', onconnect);
    };
  }, []);
  useEffect(() => {
    networkChange(networkStatus !== 'success');
  }, [networkStatus]);
  if (networkStatus === 'failed') {
    return (
      <div className={realStyle('imNetworkStatus', 'failed')}>
        <WifiCloseIcon />
        <span className={realStyle('text')}>{getIn18Text('WANGLUOYICHANG~')}</span>
      </div>
    );
  }
  if (networkStatus === 'ing') {
    return (
      <div className={realStyle('imNetworkStatus', 'ing')}>
        <WifiCloseIcon />
        <span className={realStyle('text')}>
          {getIn18Text('WANGLUOLIANJIEZHONG')}
          {retryCount}
          )...
        </span>
      </div>
    );
  }
  return (
    <div className={realStyle('imNetworkStatus', 'success')}>
      <span className="ing-icon" />
      <span className={realStyle('text')}>{getIn18Text('WANGLUOLIANJIECHENG')}</span>
    </div>
  );
};
export default ImNetworkTips;
