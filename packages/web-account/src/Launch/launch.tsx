import React, { useEffect, useState } from 'react';
// import { navigate } from 'gatsby';
import { AccountApi, apiHolder, apis, inWindow, PerformanceApi } from 'api';
import classnames from 'classnames/bind';

import styles from './launch.module.scss';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { getIn18Text } from 'api';
export interface Props {
  from?: 'launch' | 'other';
  onLaunch?: () => void;
}
function reportRemoveLoadingTime() {
  try {
    if (!inWindow()) {
      return;
    }
    const removeLoadingTimeValue = new Date().getTime() - window.pageInitTime;
    const pagePath = location.pathname;
    const pageName = pagePath.replace(/\//g, '');
    const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
    performanceApi
      .point({
        statKey: 'page_remove_loading',
        statSubKey: pageName || 'Index',
        value: removeLoadingTimeValue,
        valueType: 1,
      })
      .then();
  } catch (ex) {
    console.error('reportRemoveLoadingTime', ex);
  }
}
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const stepTextMap: Record<number, string> = {
  0: getIn18Text('GERENZHANGHUJIA'),
  20: getIn18Text('TONGXUNLUJIAZAI'),
  40: getIn18Text('YOUJIANJIAZAIZHONG'),
  60: getIn18Text('XIAOXIJIAZAIZHONG'),
  80: getIn18Text('QITAJIAZAIZHONG'),
  // 80: getIn18Text('TONGBUGUAZAIZHANGHSJZ'),
  100: getIn18Text('JIAZAIWANCHENG'),
};

// 重启app
const restartApp = () => {
  if (process.env.BUILD_ISELECTRON) {
    systemApi.reLaunchApp();
  } else if (inWindow()) {
    history.go();
  }
};

const Launch: React.FC<Props> = ({ from = 'other', onLaunch }) => {
  const isLaunch = from === 'launch';
  const [accoutInited, setAccoutInited] = useState<boolean>(false);
  const [contactInited, setContactInited] = useState<boolean>(true);
  const [catalogInited, setCatalogInited] = useState<boolean>(false);
  const [imInited, setIMInited] = useState<boolean>(true);
  const [syncSubAccountInited, setSyncSubAccountInited] = useState<boolean>(process.env.BUILD_ISELECTRON ? false : true);
  const [mailInited, setMailInited] = useState<boolean>(false);
  const [diskInited, setDiskInited] = useState<boolean>(true);
  const [percent, setPercent] = useState<number>(0);
  const [intervalTimer, setIntervalTimer] = useState<number>();
  const [timeoutTimer, setTimeoutTimer] = useState<number>();
  const [needRestartApp, setNeedRestartApp] = useState<boolean>(false);
  const account = systemApi.getCurrentUser()?.id;
  const getCurrentPercent = () => {
    const list = [accoutInited, contactInited, mailInited, imInited, syncSubAccountInited];
    const len = list.filter(item => item).length;
    const per = 100 / (list.length + 1);
    return per * (len + 1);
  };
  const launchSuccess = () => {
    setPercent(100);
    clearInterval(intervalTimer);
    clearTimeout(timeoutTimer);
    reportRemoveLoadingTime();
    console.log('[launch] initModule end', isLaunch);
    setTimeout(() => {
      onLaunch && onLaunch();
      eventApi.sendSimpleSysEvent('launchSuccessed');
      if (needRestartApp) {
        setNeedRestartApp(false);
        restartApp();
      }
    }, 500);
  };
  const handleModule = (module: string) => {
    switch (module) {
      case 'contact':
        setContactInited(true);
        break;
      case 'mail':
        setMailInited(true);
        break;
      case 'catalog':
        setCatalogInited(true);
        break;
      case 'im':
        setIMInited(true);
        break;
      case 'disk':
        setDiskInited(true);
        break;
      case 'account':
        setAccoutInited(true);
        break;
      case 'syncSubAccount':
        setSyncSubAccountInited(true);
        break;
      default:
        break;
    }
  };
  useEventObserver('initModule', {
    name: 'initModule',
    func: ev => {
      console.log('[launch] initModule receive', ev.eventStrData);
      if (ev.eventStrData === 'syncSubAccount' && ev.eventData?.restartApp) {
        setNeedRestartApp(true);
      }
      ev.eventStrData && handleModule(ev.eventStrData);
    },
  });
  useEventObserver('contactNotify', {
    name: 'contactNotifyInitModule',
    func: ev => {
      if (((ev._account && ev._account === account) || !ev._account) && ev?.eventData?.syncStatus?.local) {
        setContactInited(true);
      }
    },
  });
  useEffect(() => {
    systemApi.switchLoading(false);
    const moduleSet = accountApi.doGetInitModule();
    moduleSet.forEach(module => {
      // TODO: 这个调用时机是不是有问题，现在的 moduleSet 数据不全
      handleModule(module);
    });
    const timer = window.setTimeout(() => {
      console.error('[launch] initModule timeout');
      launchSuccess();
    }, 1000 * 15);

    const interTimer = systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler(e) {
        if (e.seq % 2 === 0) {
          setPercent(per => (per < 80 ? per + 20 : 80));
        }
      },
      seq: 0,
    });
    setTimeoutTimer(timer);
    setIntervalTimer(interTimer);
    return () => {
      clearTimeout(timer);
      systemApi.cancelEvent('mid', interTimer!);
    };
  }, []);
  useEffect(() => {
    if (getCurrentPercent() >= 95) {
      // getCurrentPercent 可能除不尽，所以改为大于等于95
      launchSuccess();
    }
  }, [catalogInited, contactInited, mailInited, imInited, diskInited, accoutInited, syncSubAccountInited]);
  const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';

  return (
    <div className={styles.launchWrap} data-test-id="app-launch-wrap">
      <div className={styles.launchContent}>
        <div
          className={classnames(styles.logo, {
            [styles.logoEdm]: process.env.BUILD_ISEDM,
          })}
        />
        <div className={styles.name}>{process.env.BUILD_ISEDM ? getIn18Text('WANGYIWAIMAOTONG') : getIn18Text('WANGYILINGXIBAN')}</div>
        {/* <div className={styles.version}>版本号：{inWindow() && window.siriusVersion}</div> */}
        <div className={styles.initStep}>
          {account && (
            <div className={styles.initAccount}>
              {getIn18Text('ZHENGZAIDENGLUZHANG')}
              {account}
            </div>
          )}
          <div className={styles.progressWrap}>
            <div className={styles.process} style={{ width: percent + '%' }} />
          </div>
          <div className={styles.txtWrap}>
            <div className={styles.initTxt}>{stepTextMap[percent]}</div>
            <div className={styles.initNum}>{getIn18Text('JINDU') + wordSeparator + percent + '%'}</div>
          </div>
        </div>
        {/* {isFirstInit && (
          <div
            className={styles.startBtn}
            onClick={toIndex}
            hidden={percent !== 100}
          >
开启未来办公新体验
          </div>
        )} */}
      </div>
    </div>
  );
};
export default Launch;
