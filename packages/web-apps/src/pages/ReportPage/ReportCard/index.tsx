import React, { useContext } from 'react';

import { doReportInvite } from '../../../api';

import { AppsContext } from '../../../context';
import { pageIdDict } from '../../../pageMapConf';
import { DailyReportIconSvg } from '../Icons/DailyReportIconSvg';
import { WeeklyReportIconSvg } from '../Icons/WeeklyReportIconSvg';
import styles from './index.module.scss';
import { useDataTracker } from '../../../hooks/useTracker';

const CardConfig = {
  daily: {
    title: '日报',
    icon: (
      <div
        className={styles.cardIconContainer}
        style={{
          background: '#EBF0FF',
        }}
      >
        <DailyReportIconSvg width={28} height={28} />
      </div>
    ),
    p1Label: '今日工作',
    p2Label: '明日工作',
    color: '#D7E3FF',
  },
  weekly: {
    title: '周报',
    icon: (
      <div
        className={styles.cardIconContainer}
        style={{
          background: '#EBF9F3',
        }}
      >
        <WeeklyReportIconSvg width={24} height={26} />
      </div>
    ),
    p1Label: '本周工作',
    p2Label: '下周工作',
    color: '#EBF9F3',
  },
} as const;

const GradientBlock: React.FC<{
  color: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ color, className, style }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '12px',
        background: `linear-gradient(90deg, ${color} 2.72%, rgba(245, 248, 255, 0.79) 100.82%)`,
        ...style,
      }}
      className={className}
    ></div>
  );
};

export const ReportCard: React.FC<{
  type: 'daily' | 'weekly';
  editable?: boolean;
}> = ({ type, editable = false }) => {
  const cardConfig = CardConfig[type];
  const { setPageId } = useContext(AppsContext);
  const trackerApi = useDataTracker();

  const operateContent = React.useMemo(() => {
    if (editable) {
      return (
        <div className={styles.operateContent}>
          <div
            className={styles.btn}
            onClick={() => {
              trackerApi.track('report_manage', {
                opera_type: 'invite',
                template_type: type,
              });
              doReportInvite(type);
            }}
          >
            邀请填写
          </div>
          <div
            className={styles.btn}
            onClick={() => {
              trackerApi.track('report_manage', {
                opera_type: 'modify',
                template_type: type,
              });
              setPageId(type === 'daily' ? pageIdDict.appsDailyReportTemplateEdit : pageIdDict.appsWeeklyReportTemplateEdit);
            }}
          >
            修改
          </div>
        </div>
      );
    }
    return null;
  }, [editable]);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>{cardConfig.icon}</div>
        <div className={styles.title}>{cardConfig.title}</div>
      </div>
      <div className={styles.content}>
        <div className={styles.p}>
          <div className={styles.text}>{cardConfig.p1Label}</div>
          <GradientBlock className={styles.block} color={cardConfig.color} />
          <GradientBlock
            className={styles.block}
            color={cardConfig.color}
            style={{
              width: '50%',
            }}
          />
        </div>
        <div className={styles.p}>
          <div className={styles.text}>{cardConfig.p2Label}</div>
          <GradientBlock className={styles.block} color={cardConfig.color} />
          <GradientBlock
            className={styles.block}
            color={cardConfig.color}
            style={{
              width: '50%',
            }}
          />
        </div>
        {operateContent}
      </div>
    </div>
  );
};
