import React, { useContext } from 'react';

import { AppsContext } from '../../../context';
import { pageIdDict } from '../../../pageMapConf';

import { ReportCard } from '../ReportCard';
import styles from './index.module.scss';
import { useDataTracker } from '../../../hooks/useTracker';

export const FillInTab: React.FC<{}> = () => {
  const { setPageId } = useContext(AppsContext);
  const trackerApi = useDataTracker();
  return (
    <div className={styles.container}>
      <div
        className={styles.card}
        onClick={() => {
          trackerApi.track('report_fillin', {
            opera_type: 'daily',
          });
          setPageId(pageIdDict.appsDailyReportFromFillTab);
        }}
      >
        <ReportCard type="daily" />
      </div>
      <div
        className={styles.card}
        onClick={() => {
          trackerApi.track('report_fillin', {
            opera_type: 'weekly',
          });
          setPageId(pageIdDict.appsWeeklyReportFromFillTab);
        }}
      >
        <ReportCard type="weekly" />
      </div>
    </div>
  );
};
