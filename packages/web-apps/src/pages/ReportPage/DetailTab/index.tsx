import React from 'react';
import styles from './index.module.scss';
import { DailyReportIconSvg } from '../Icons/DailyReportIconSvg';
import { WeeklyReportIconSvg } from '../Icons/WeeklyReportIconSvg';
import { DataNode, Tree } from './Tree';
import { genOnlyViewUnitableUrl, genReadOnlyUnitableUrl } from '@web-disk/components/Unitable/utils';
import { apiHolder, SystemApi, UserAppUnitableInfo } from 'api';
import { useBridge } from '@web-disk/components/Unitable/useBridge';
import { getUnitableCellContactList } from '@web-disk/components/Unitable/api';
import { HandlerType } from '@web-disk/components/Unitable/bridge';
import { useAppInfo } from '../../../hooks/useAppInfo';
import { pageIdDict, reportAppId } from '../../../pageMapConf';
import { docHost } from '../../../api';
import { useDataTracker } from '../../../hooks/useTracker';
import { AppsContext } from '../../../context';
import { useHazel } from '@web-disk/commonHooks/useHazel';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const treeData: DataNode[] = [
  {
    title: '日报',
    key: 'daily',
    defaultExpandAll: true,
    nodeType: 'expand',
    icon: <DailyReportIconSvg width={16} height={16} />,
    children: [
      {
        title: '全部',
        key: 'daily-all',
      },
      {
        title: '我提交的',
        key: 'daily-submitted',
      },
      {
        title: '我收到的',
        key: 'daily-received',
      },
    ],
  },
  {
    title: '周报',
    key: 'weekly',
    defaultExpandAll: true,
    nodeType: 'expand',
    icon: <WeeklyReportIconSvg width={16} height={16} />,
    children: [
      {
        title: '全部',
        key: 'weekly-all',
      },
      {
        title: '我提交的',
        key: 'weekly-submitted',
      },
      {
        title: '我收到的',
        key: 'weekly-received',
      },
    ],
  },
];
export const DetailTab: React.FC<{}> = () => {
  const { pageId } = React.useContext(AppsContext);
  useHazel();
  const appInfo = useAppInfo(reportAppId);
  const dailyInfo = appInfo?.config?.unitables.daily;
  const weeklyInfo = appInfo?.config?.unitables.weekly;
  const trackerApi = useDataTracker();
  const [selectedKey, setSelectedKey] = React.useState(() => {
    if (pageId === pageIdDict.appsDailyReportDetail) {
      return 'daily-all';
    }
    if (pageId === pageIdDict.appsWeeklyReportDetail) {
      return 'weekly-all';
    }
    return 'daily-all';
  });
  const [dailyMode, setDailyMode] = React.useState(FilterModeEnum.ALL);
  const [weeklyMode, setWeeklyMode] = React.useState(FilterModeEnum.ALL);
  const [dailyVisiblity, setDailyVisiblity] = React.useState(selectedKey.split('-')[0] === 'daily');
  const [weeklyVisiblity, setWeeklyVisiblity] = React.useState(selectedKey.split('-')[0] === 'weekly');
  React.useEffect(() => {
    const [reportType, reportMode] = selectedKey.split('-');
    let setMode = setDailyMode;
    if (reportType === 'daily') {
      setDailyVisiblity(true);
      setWeeklyVisiblity(false);
      setMode = setDailyMode;
    } else if (reportType === 'weekly') {
      setDailyVisiblity(false);
      setWeeklyVisiblity(true);
      setMode = setWeeklyMode;
    }
    switch (reportMode) {
      case 'all':
        setMode(FilterModeEnum.ALL);
        break;
      case 'submitted':
        setMode(FilterModeEnum.SUBMITTED);
        break;
      case 'received':
        setMode(FilterModeEnum.RECEIVED);
        break;
      default:
        setMode(FilterModeEnum.ALL);
        break;
    }
    if (reportType && reportMode) {
      trackerApi.track('report_view', {
        template_type: reportType,
        opera_type: reportMode,
      });
    }
  }, [selectedKey, trackerApi]);
  return (
    <div className={styles.container}>
      <div className={styles.treeContainer}>
        <Tree onSelect={setSelectedKey} treeData={treeData} defaultSelectedKey={selectedKey} />
      </div>
      <div className={styles.gridContainer}>
        <div
          style={{
            opacity: dailyVisiblity ? 1 : 0,
            width: dailyVisiblity ? '100%' : 0,
            height: dailyVisiblity ? '100%' : 0,
          }}
        >
          {dailyInfo && <UnitableGridView data={dailyInfo} mode={dailyMode}></UnitableGridView>}
        </div>
        <div
          style={{
            opacity: weeklyVisiblity ? 1 : 0,
            width: weeklyVisiblity ? '100%' : 0,
            height: weeklyVisiblity ? '100%' : 0,
          }}
        >
          {weeklyInfo && <UnitableGridView data={weeklyInfo} mode={weeklyMode}></UnitableGridView>}
        </div>
      </div>
    </div>
  );
};

enum FilterModeEnum {
  ALL = 'all',
  SUBMITTED = 'submitted',
  RECEIVED = 'received',
}
const UnitableGridView: React.FC<{ data: UserAppUnitableInfo; mode: FilterModeEnum }> = ({ data, mode }) => {
  const { identity, tableId, views } = data;
  const viewId = views.grid.viewId;
  const curUser = systemApi.getCurrentUser();
  const userId = curUser?.contact?.contact.id;
  const unitableUrl = `${docHost}unitable/?identity=${identity}&tableId=${tableId}&viewId=${viewId}`;
  // const unitableUrl = `http://localhost:2345/?identity=${identity}&tableId=${tableId}&viewId=${viewId}`;
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const { bridge, iframeLink } = useBridge(iframeRef, unitableUrl);
  const [unitableCoreMounted, setUnitableCoreMounted] = React.useState(false);

  React.useEffect(() => {
    const handler: HandlerType<'unitableCoreMounted'> = () => {
      setUnitableCoreMounted(true);
    };
    bridge.on('unitableCoreMounted', handler);
    return () => {
      bridge.remove('unitableCoreMounted', handler);
    };
  }, [bridge]);

  React.useEffect(() => {
    const handler: HandlerType<'getContactList'> = async params => {
      const result = await getUnitableCellContactList(params);
      return result;
    };
    bridge.on('getContactList', handler);
    return () => {
      bridge.remove('getContactList', handler);
    };
  }, [bridge]);

  const changeView = React.useCallback(
    async (
      tableId: string,
      viewId: string,
      filter?: {
        fieldName: string;
        value: string;
      }
    ) => {
      bridge.emit('changeView', {
        tableId,
        viewId,
        options:
          filter != null
            ? {
                filter: {
                  kind: 'collaborator',
                  fieldName: filter.fieldName,
                  condition: {
                    method: 'any-of',
                    values: [filter.value],
                  },
                },
              }
            : null,
      });
    },
    [bridge]
  );

  React.useEffect(() => {
    if (userId == null) {
      console.error(`[UnitableGridView] userId is null`);
      return;
    }
    switch (mode) {
      case FilterModeEnum.ALL:
        changeView(tableId, viewId);
        break;
      case FilterModeEnum.SUBMITTED:
        changeView(tableId, viewId, {
          fieldName: '填写人',
          value: userId,
        });
        break;
      case FilterModeEnum.RECEIVED:
        changeView(tableId, viewId, {
          fieldName: '接收人',
          value: userId,
        });
        break;
    }
  }, [viewId, tableId, changeView, userId, mode, unitableCoreMounted]);

  return (
    <iframe
      className={styles.iframeContainer}
      src={genReadOnlyUnitableUrl(genOnlyViewUnitableUrl(iframeLink))}
      ref={iframeRef}
      allow="clipboard-read; clipboard-write; fullscreen"
    />
  );
};
