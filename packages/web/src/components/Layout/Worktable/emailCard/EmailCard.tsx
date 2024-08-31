import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMyEmailsPanelAsync } from '@web-common/state/reducer/worktableReducer';
import React, { useEffect, useMemo, useRef } from 'react';
import { getFilterText, WorktableCard } from '../card';
import moment from 'moment';
import styles from './emailCard.module.scss';
import { WorktableActions } from '@web-common/state/reducer';
import { getMyEdmPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { ResEdmPanel, ResEmailPanel } from '@/../../api/src';
import classnames from 'classnames';
import { MyEmailOperate, worktableDataTracker } from '../worktableDataTracker';
import { getTransText } from '@/components/util/translate';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';
import querystring from 'querystring';
import { getIn18Text } from 'api';
export interface EmailCardProps {
  title?: string;
}
export const EmailCardColors = ['#8DD6BC', '#6BA9FF', '#AA90F4', '#F7A87C', '#6BA9FF', '#F7A87C', '#8DD6BC'];
type EmailNum = {
  title: string;
  dataIndex: keyof ResEmailPanel;
};
const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};
export const EMAIL_NUM_ITEMS: Array<EmailNum> = [
  {
    title: getIn18Text('SHOUDAOYOUJIANSHU'),
    dataIndex: 'receive_count',
  },
  {
    title: getIn18Text('DUIFANGHUIFUSHU'),
    dataIndex: 'other_reply_count',
  },
  {
    title: getIn18Text('WODEHUIFUSHU'),
    dataIndex: 'my_reply_count',
  },
  {
    title: getIn18Text('WODEHUIFULV'),
    dataIndex: 'my_reply_rate',
  },
  {
    title: getIn18Text('DUIFANGHUIFULV'),
    dataIndex: 'other_reply_rate',
  },
  {
    title: getIn18Text('DUIFANGDAKAILV'),
    dataIndex: 'other_open_rate',
  },
];
const EMAIL_ITEMS: Array<EmailNum> = [
  {
    title: getIn18Text('FASONGYOUJIANSHU'),
    dataIndex: 'sent_count',
  },
  {
    title: getIn18Text('SHOUDAOYOUJIANSHU'),
    dataIndex: 'receive_count',
  },
  {
    title: getIn18Text('DUIFANGDAKAILV'),
    dataIndex: 'other_open_rate',
  },
  {
    title: getIn18Text('DUIFANGHUIFUSHU'),
    dataIndex: 'other_reply_count',
  },
];
const toPercent = (num: number) => (num > 0 ? num / 100 + '%' : '-');
type EdmNum = {
  title: string;
  dataIndex: keyof ResEdmPanel;
  transformer?: (n: number) => string | number;
};
const EDM_ITEMS: Array<EdmNum> = [
  { title: getIn18Text('FAJIANZONGSHU'), dataIndex: 'sendCount' },
  { title: getIn18Text('SONGDAZONGSHU'), dataIndex: 'arriveCount' },
  { title: getIn18Text('SONGDALV'), dataIndex: 'arriveRatio', transformer: toPercent },
  { title: getIn18Text('DAKAIRENSHU'), dataIndex: 'readNum' },
  { title: getIn18Text('HUIFUZONGSHU'), dataIndex: 'replyCount' },
  { title: getIn18Text('DIANJISHU'), dataIndex: 'traceCount' },
];
export const EmailCard: React.FC<EmailCardProps> = props => {
  const type = 'myEdm';
  const loading = useAppSelector(state => state.worktableReducer.myEmail.loading);
  const data = useAppSelector(state => state.worktableReducer.myEmail.data);
  const { data: data2 } = useAppSelector(state => state.worktableReducer.myEdm);
  const filters = useAppSelector(state => state.worktableReducer.myEmail.filters);
  const appDispatch = useAppDispatch();
  const dateRange = useRef([defaultDateRange.start_date, defaultDateRange.end_date]);
  const memberList = useRef<undefined | string[]>();
  const fetchData = () => {
    appDispatch(
      getMyEmailsPanelAsync({
        ...filters,
        start_date: dateRange.current[0],
        end_date: dateRange.current[1],
      })
    );
    appDispatch(
      getMyEdmPanelAsync({
        ...filters,
        start_date: dateRange.current[0],
        end_date: dateRange.current[1],
      })
    );
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleNumClick = () => {
    const params: Record<string, string | number> = {
      tab: type === 'myEdm' ? 1 : 2,
      sendTime: [dateRange.current[0], dateRange.current[1]].join(','),
    };
    if (memberList.current) {
      params.accountIds = memberList.current.join(',');
    }
    workTableTrackAction('waimao_worktable_myEmailMarketing', 'number_of_email_marketing_sent');
    pushNavigateCrossMultiClient('#edm?page=index&_t=' + +new Date() + '&' + querystring.stringify(params));
  };
  const handleClick = (item: EmailNum | EdmNum) => {
    switch (item.dataIndex) {
      case 'sendCount':
        handleNumClick();
        break;
      case 'sent_count':
        pushNavigateCrossMultiClient('#mailbox');
        workTableTrackAction('waimao_worktable_myCustomerEmail', 'number_of_emails_sent_customers');
        // worktableDataTracker.trackMyMailOperate(MyEmailOperate.sendMail);
        break;
      case 'receive_count':
        pushNavigateCrossMultiClient('#mailbox');
        workTableTrackAction('waimao_worktable_myCustomerEmail', 'number_of_emails_receive_customers');
        // worktableDataTracker.trackMyMailOperate(MyEmailOperate.receiveMail);
        break;
      case 'other_reply_count':
        pushNavigateCrossMultiClient('#mailbox');
        workTableTrackAction('waimao_worktable_myCustomerEmail', 'number_of_emails_sent_by_customers');
        break;
    }
  };
  const handleRefresh = () => {
    fetchData();
    worktableDataTracker.trackMyMailOperate(MyEmailOperate.refresh);
  };
  const handleExpand = () => {
    appDispatch(WorktableActions.showModal('myEmail'));
    worktableDataTracker.trackMyMailOperate(MyEmailOperate.refresh);
  };
  const filterNode = useMemo(() => {
    return getFilterText(filters);
  }, [filters]);
  return (
    <WorktableCard
      title={props.title || getIn18Text('WODEKEHUYOUJIAN')}
      headerToolsConfig={[
        {
          onDatePickerChange: (changes: any) => {
            dateRange.current = [changes.start_date, changes.end_date];
            workTableTrackAction('waimao_worktable_myCustomerEmail', 'time_selection');
            fetchData();
          },
        },
        {
          onRefresh: handleRefresh,
        },
      ]}
      loading={loading}
    >
      <div className={styles.emailCard}>
        <div className={styles.leftContainer}>
          <h2 className={styles.title}>{getIn18Text('KEHUYOUJIAN')}</h2>
          <div className={styles.gridContainer}>
            {EMAIL_ITEMS.map((item, i) => {
              return (
                <div className={styles.gridItem} key={i}>
                  <NumCard text={item.title} color="#272E47" clickable={i < 2 || i === 3} onNumClick={() => handleClick(item)}>
                    {data ? data[item.dataIndex] : '-'}
                  </NumCard>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.rightContainer}>
          <h2 className={styles.title}>{getIn18Text('YOUJIANYINGXIAO')}</h2>
          <div className={styles.gridContainer}>
            {EDM_ITEMS.map((item, i) => {
              let text: string | number = '-';
              if (data2 && data2[item.dataIndex] !== null && data2[item.dataIndex] !== undefined) {
                text = item.transformer ? item.transformer(data2[item.dataIndex]) : data2[item.dataIndex];
              }
              return (
                <div className={styles.gridItem} key={i}>
                  <NumCard text={item.title} color="#272E47" clickable={i === 0} onNumClick={() => handleClick(item)}>
                    {text}
                  </NumCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WorktableCard>
  );
};
export const NumCard: React.FC<{
  color?: string;
  text: string;
  clickable?: boolean;
  onNumClick?: () => void;
}> = ({ color, text, children, clickable, onNumClick }) => {
  return (
    <>
      <div className={classnames(styles.num, clickable && styles.clickable)} onClick={clickable ? onNumClick : undefined}>
        {children}
      </div>
      {/* <div className={styles.line} style={{ backgroundColor: color }}/> */}
      <div className={styles.text}>{text}</div>
    </>
  );
};
