import React from 'react';
import { Tabs } from 'antd';
import classnames from 'classnames';

import { PageBaseProps, pageIdDict, PageIds, reportAppId } from '../../pageMapConf';
import { AppsContext } from '../../context';

import { FillInTab } from './FillInTab';
import { ManageTab } from './ManageTab';
import { DetailTab } from './DetailTab';
import { FillInIconSvg } from './Icons/FillInIconSvg';
import { ManageIconSvg } from './Icons/ManageIconSvg';
import { DetailIconSvg } from './Icons/DetailIconSvg';

import styles from './index.module.scss';
import { useAppInfo } from '../../hooks/useAppInfo';
import { useDataTracker } from '../../hooks/useTracker';

const { TabPane } = Tabs;
const TabBtn: React.FC<{ icon: (active: boolean) => React.ReactNode; text: string; active: boolean }> = props => {
  return (
    <div className={styles.tabBtn}>
      <div className={styles.icon}>{props.icon(props.active)}</div>
      <div className={classnames(styles.text, props.active ? 'active' : '')}>{props.text}</div>
    </div>
  );
};

const trackerPageIdMap: Record<string, string> = {
  [pageIdDict.appsReportFill]: 'fillin',
  [pageIdDict.appsDailyReportDetail]: 'view',
  [pageIdDict.appsWeeklyReportDetail]: 'view',
  [pageIdDict.appsReportManage]: 'manage',
};

const isDetailPageId = (pageId: PageIds) => {
  return pageId === pageIdDict.appsDailyReportDetail || pageId === pageIdDict.appsWeeklyReportDetail;
};

const DetailTabId = pageIdDict.appsDailyReportDetail;
export const ReportPage: React.FC<PageBaseProps> = ({ pageId }) => {
  const { setPageId } = React.useContext(AppsContext);
  const [activeKey, setActiveKey] = React.useState<string>(DetailTabId);
  const appInfo = useAppInfo(reportAppId);
  const trackerApi = useDataTracker();

  const trackActiveTabInfo = React.useCallback(
    (activeKey: string) => {
      const trackerPageId = trackerPageIdMap[activeKey];
      trackerPageId &&
        trackerApi.track('report_behavior', {
          opera_type: trackerPageId,
        });
    },
    [trackerApi]
  );

  React.useEffect(() => {
    trackActiveTabInfo(activeKey);
  }, [activeKey]);

  const hasManagePermission = appInfo?.permission === 'EDIT';
  React.useEffect(() => {
    if (isDetailPageId(pageId)) {
      setActiveKey(DetailTabId);
    } else {
      setActiveKey(pageId);
    }
  }, [pageId]);
  const tabs: Array<{
    id: string;
    icon: (active: boolean) => React.ReactNode;
    text: string;
    content: React.ReactNode;
  }> = React.useMemo(() => {
    return [
      {
        id: pageIdDict.appsReportFill,
        icon: (active: boolean) => <FillInIconSvg width={16} height={16} active={active} />,
        text: '填写',
        content: <FillInTab />,
      },
      {
        id: DetailTabId,
        icon: (active: boolean) => <DetailIconSvg width={16} height={16} active={active} />,
        text: '查看',
        content: <DetailTab />,
      },
      ...(hasManagePermission
        ? [
            {
              id: pageIdDict.appsReportManage,
              icon: (active: boolean) => <ManageIconSvg width={16} height={16} active={active} />,
              text: '管理',
              content: <ManageTab />,
            },
          ]
        : []),
    ];
  }, [hasManagePermission]);
  return (
    <>
      <div className={styles.pageContainer}>
        <Tabs
          defaultActiveKey={DetailTabId}
          activeKey={activeKey}
          onChange={activeKey => {
            setPageId(activeKey as PageIds);
          }}
          className={styles.tabs}
        >
          {tabs.map(tab => (
            <TabPane tab={<TabBtn icon={tab.icon} text={tab.text} active={pageId === tab.id} />} key={tab.id}>
              {tab.content}
            </TabPane>
          ))}
        </Tabs>
      </div>
    </>
  );
};
