import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { WorktableActions } from '@web-common/state/reducer';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import querystring from 'querystring';
import { getFilterText, WorktableCard } from '../card';
import moment from 'moment';
import styles from './edmCard.module.scss';
import { EmailCardColors, NumCard } from '../emailCard/EmailCard';
import { getAllEdmPanelAsync, getMyEdmPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { AdvertApi, AdvertConfig, apiHolder as api, apis, ResEdmPanel, getIn18Text, edmWeeklyReportSpaceCode } from 'api';
import { EdmCardOperate, worktableDataTracker } from '../worktableDataTracker';
import { getTransText } from '@/components/util/translate';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';

const advertApi = api.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;

const toPercent = (num: number) => (num > 0 ? num / 100 + '%' : '-');

export const EDM_ITEMS: Array<{
  title: string;
  dataIndex: keyof ResEdmPanel;
  transformer?: (n: number) => string | number;
}> = [
  // { title: getIn18Text("FAJIANZONGSHU"), dataIndex: 'sendCount' },
  { title: getIn18Text('SONGDAZONGSHU'), dataIndex: 'arriveCount' },
  { title: getIn18Text('SONGDALV'), dataIndex: 'arriveRatio', transformer: toPercent },
  { title: getIn18Text('DAKAIRENSHU'), dataIndex: 'readNum' },
  // { title: getIn18Text("DAKAILV"), dataIndex: 'readRatio', transformer: toPercent },
  { title: getIn18Text('HUIFUZONGSHU'), dataIndex: 'replyCount' },
  // { title: getIn18Text("TUIDINGZONGSHU"), dataIndex: 'unsubscribeCount' },
  { title: getIn18Text('DIANJISHU'), dataIndex: 'traceCount' },
];

const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};

export const EdmCard: React.FC<{
  type: 'myEdm' | 'allEdm';
}> = ({ type }) => {
  const appDispatch = useAppDispatch();

  const { roles: myRoles } = useAppSelector(state => state.privilegeReducer);
  const { loading, data, filters } = useAppSelector(state => (type === 'myEdm' ? state.worktableReducer.myEdm : state.worktableReducer.allEdm));

  const dateRange = useRef([defaultDateRange.start_date, defaultDateRange.end_date]);
  const memberList = useRef<undefined | string[]>();

  const [edmWeeklyReportUrl, setEdmWeeklyReportUrl] = useState('');
  const myRolesMemo = myRoles.map(v => v.roleId).join('');
  const isAdmin = useMemo(() => myRoles.some(role => role.roleType === 'ADMIN'), [myRolesMemo]);

  const fetchWeeklyReportUrl = async () => {
    const response = await advertApi.fetchConfig(edmWeeklyReportSpaceCode);
    if (response.data?.itemList) {
      const temp = (response.data.itemList as AdvertConfig[]) || [];
      const advertResourceList = temp[0]?.advertResourceList;
      const conf = advertResourceList ? advertResourceList[0] : undefined;
      if (conf?.content?.clickUrl) {
        setEdmWeeklyReportUrl(conf?.content.clickUrl);
      }
    }
  };

  const fetchData = () => {
    appDispatch(
      type === 'myEdm'
        ? getMyEdmPanelAsync({
            ...filters,
            start_date: dateRange.current[0],
            end_date: dateRange.current[1],
          })
        : getAllEdmPanelAsync({
            ...filters,
            account_id_list: memberList.current,
            start_date: dateRange.current[0],
            end_date: dateRange.current[1],
          })
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isAdmin && type === 'allEdm') {
      fetchWeeklyReportUrl();
    }
  }, [isAdmin, type]);

  const handleNumClick = () => {
    const params: Record<string, string | number> = {
      tab: type === 'myEdm' ? 1 : 2,
      sendTime: [dateRange.current[0], dateRange.current[1]].join(','),
    };
    if (memberList.current) {
      params.accountIds = memberList.current.join(',');
    }
    workTableTrackAction(type === 'allEdm' ? 'waimao_worktable_allEmailMarketing' : 'waimao_worktable_myEmailMarketing', 'number_of_email_marketing_sent');
    pushNavigateCrossMultiClient('#edm?page=index&_t=' + +new Date() + '&' + querystring.stringify(params));
  };
  const handleRefresh = () => {
    fetchData();
    worktableDataTracker.trackEdmOperate(type === 'myEdm' ? 'my' : 'all', EdmCardOperate.refresh);
  };
  const handlePreview = () => {
    appDispatch(WorktableActions.showModal(type));
    worktableDataTracker.trackEdmOperate(type === 'myEdm' ? 'my' : 'all', EdmCardOperate.preview);
  };
  // const filterNode = useMemo(() => {
  //     return getFilterText(filters, 'EDM', type === 'allEdm', {
  //         exclude_company: true
  //     });
  // }, [filters]);
  return (
    <WorktableCard
      title={type === 'myEdm' ? getTransText('WODEYOUJIANYINGXIAO') : getTransText('TUANDUIYOUJIANYINGXIAO')}
      headerToolsConfig={[
        {
          edmWeeklyReportUrl,
        },
        {
          resourceLabel: 'EDM',
          onMemberChange:
            type === 'myEdm'
              ? undefined
              : (changes: any) => {
                  memberList.current = changes.account_id_list;
                  workTableTrackAction('waimao_worktable_allEmailMarketing', 'member_selection');
                  fetchData();
                },
        },
        {
          onDatePickerChange: (changes: any) => {
            dateRange.current = [changes.start_date, changes.end_date];
            workTableTrackAction(type === 'allEdm' ? 'waimao_worktable_allEmailMarketing' : 'waimao_worktable_myEmailMarketing', 'time_selection');
            fetchData();
          },
        },
        {
          onRefresh: handleRefresh,
        },
      ]}
      showTeamIconInTitle={type !== 'myEdm'}
      loading={loading}
    >
      <div className={styles.emailCard}>
        {/* <div className={cardStyle.cardFilter}>
          {filterNode}
        </div> */}
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className={`${styles.leftContainer} ${type === 'myEdm' ? styles.avatar4LeftBorder : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleNumClick()}>
            <div className={styles.countsNumber}>{data && data['sendCount'] !== null && data['sendCount'] !== undefined ? data['sendCount'] : '-'}</div>
            <div className={styles.countsTitle}>{getTransText('FAJIANZONGSHU')}</div>
          </div>
          <div className={styles.rightContainer}>
            <div className={styles.gridContainer}>
              {EDM_ITEMS.map((item, i) => {
                let text: string | number = '-';
                if (data && data[item.dataIndex] !== null && data[item.dataIndex] !== undefined) {
                  text = item.transformer ? item.transformer(data[item.dataIndex]) : data[item.dataIndex];
                }
                return (
                  <div className={styles.gridItem} key={i}>
                    <NumCard text={item.title} color={EmailCardColors[i]} clickable={false}>
                      {text}
                    </NumCard>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </WorktableCard>
  );
};
