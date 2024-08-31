/*
 * @Author: wangzhijie02
 * @Date: 2022-06-10 16:09:58
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-29 17:48:10
 * @Description: file content
 */
import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from '@reach/router';
import classnames from 'classnames';

import { apiHolder, apis, NetStorageApi } from 'api';
import { AppsContext } from '../../context';
import { pageIdDict, PageBaseProps } from '../../pageMapConf';
import styles from './index.module.scss';
import { useDataTracker } from '../../hooks/useTracker';
import { AdBanner } from './AdBanner';
import { SelectedApps } from './SelectedApps';
import { getIn18Text } from 'api';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;

export const Home: React.FC<PageBaseProps> = props => {
  const { setPageId } = useContext(AppsContext);
  const location = useLocation();
  const trackerApi = useDataTracker();
  const isHomePage = location.hash.includes(pageIdDict.appsHome);
  const [uniTableVisiable, setUniTableVisiable] = useState<boolean>(false);
  React.useEffect(() => {
    if (isHomePage) {
      trackerApi.track('report_home', {
        opera_type: 'application',
      });
    }
  }, [isHomePage]);

  useEffect(() => {
    diskApi.appIsEnable().then(res => {
      if (res.enable) {
        setUniTableVisiable(true);
      }
    });
  });

  return (
    <div className={styles.pageContainer}>
      <AdBanner></AdBanner>
      <div hidden={!uniTableVisiable}>
        <div className={styles.sectionTitle}>提效工具</div>
        <div className={styles.btnGroup}>
          <div
            className={styles.btn}
            onClick={() => {
              trackerApi.track('report_home', {
                opera_type: 'daily',
              });
              setPageId(pageIdDict.appsDailyReport);
            }}
          >
            <span className={classnames(styles.icon, styles.dailyIcon)}></span>
            {getIn18Text('RIBAO')}
          </div>
          <div
            className={styles.btn}
            onClick={() => {
              trackerApi.track('report_home', {
                opera_type: 'weekly',
              });
              setPageId(pageIdDict.appsWeeklyReport);
            }}
          >
            <span className={classnames(styles.icon, styles.weeklyIcon)}></span>
            {getIn18Text('ZHOUBAO')}
          </div>
          <div
            className={styles.btn}
            onClick={() => {
              trackerApi.track('report_home', {
                opera_type: 'report',
              });
              setPageId(pageIdDict.appsDailyReportDetail);
            }}
          >
            <span className={classnames(styles.icon, styles.reportIcon)}></span>
            {getIn18Text('HUIBAO')}
          </div>
          <div className={classnames(styles.btn, styles.disabled)}>
            <span className={classnames(styles.icon, styles.moreIcon)}></span>
            {getIn18Text('GENGDUOYINGYONGJING')}
          </div>
        </div>
      </div>
      <div>
        <SelectedApps></SelectedApps>
      </div>
    </div>
  );
};

export default Home;
