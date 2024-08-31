import React, { MouseEvent, useMemo, useState } from 'react';
import { api, apiHolder, getIn18Text, WorktableApi } from 'api';
import TextRoll from '@/components/Layout/Worktable/components/TextRoll';
import { getLastDayInWeek, getRecentWeekday } from '@/components/Layout/utils';
import styles from './index.module.scss';

const LOCAL_KEY = 'report_click';

const storeApi = apiHolder.api.getDataStoreApi();
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

interface Props {
  edmWeeklyReportUrl: string;
}

const EdmWeeklyReport: React.FC<Props> = ({ edmWeeklyReportUrl }) => {
  const lastMonday = getLastDayInWeek(1, 'MM.DD');
  const lastSunday = getLastDayInWeek(7, 'MM.DD');
  const contentList = [getIn18Text('CHAKANQIYEZHOUBAO'), `${lastMonday}-${lastSunday}`];
  const [redPointVisible, setRedPointVisible] = useState(true);

  const showRedPoint = useMemo(() => {
    const { suc, data } = storeApi.getSync(LOCAL_KEY);
    if (!suc || !data) {
      return true;
    }
    return +data < (getRecentWeekday(1) as number);
  }, []);

  const showReport = async (e: MouseEvent) => {
    e.stopPropagation();
    setRedPointVisible(false);
    storeApi.putSync(LOCAL_KEY, Date.now() + '');
    const encryptedUrl = await worktableApi.encryptedReportUrl(edmWeeklyReportUrl);
    window.open(encryptedUrl, '_blank');
  };

  return (
    <div className={styles.edmWeeklyReportContainer} onMouseDown={showReport}>
      <TextRoll width={116} contentList={contentList} pause={3000} duration={500} />
      {showRedPoint && redPointVisible ? <div className={styles.redPoint} /> : <></>}
    </div>
  );
};

export default EdmWeeklyReport;
