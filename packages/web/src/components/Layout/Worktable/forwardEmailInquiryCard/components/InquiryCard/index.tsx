import React, { useCallback } from 'react';
import { apiHolder as api, getIn18Text, SystemApi, MailEntryModel, WorktableApi } from 'api';
import { TongyongYiduMian, TongyongYouxiangMian, TongyongJiantou1You } from '@sirius/icons';
import { Tooltip } from 'antd';
import styles from './index.module.scss';

const systemApi: SystemApi = api.api.getSystemApi();
const worktableApi = api.api.requireLogicalApi('worktableApiImpl') as WorktableApi;

export interface InquiryCardI {
  id: string;
  email: string;
  content: string;
  timestamp: number;
  unread: boolean;
}

interface InquiryCardProps {
  info: InquiryCardI;
  mail: MailEntryModel;
  overviewCallback: (id: string) => void;
}

const HourMillSecs = 60 * 60 * 1000;
const DayMillSecs = 24 * HourMillSecs;
const MonMillSecs = 30 * DayMillSecs;
function calcDiffTime(timestamp: number) {
  const diffTimestamp = Date.now() - timestamp;
  if (diffTimestamp < HourMillSecs) {
    return getIn18Text('XIAOSHINEIHUIFU', { hours: 1 });
  }
  if (diffTimestamp < DayMillSecs) {
    const hours = Math.floor(diffTimestamp / HourMillSecs);
    return getIn18Text('XIAOSHIQIANHUIFU', { hours });
  }
  if (diffTimestamp < MonMillSecs) {
    const days = Math.floor(diffTimestamp / DayMillSecs);
    return getIn18Text('TIANQIANHUIFU', { days });
  }
  const mons = Math.floor(diffTimestamp / MonMillSecs);
  return getIn18Text('YUEQIANHUIFU', { mons });
}

const InquiryCard: React.FC<InquiryCardProps> = ({ info: { id, email, content, timestamp, unread }, mail, overviewCallback }) => {
  const time = calcDiffTime(timestamp);
  const overview = useCallback(() => {
    worktableApi.markEmailInquiryRead(id);
    overviewCallback(id);
    if (systemApi.isElectron()) {
      systemApi
        .createWindowWithInitData(
          { type: 'readMailReadOnly', additionalParams: { account: '' } },
          {
            eventName: 'initPage',
            eventData: { mid: mail?.id, handoverEmailId: id },
            eventStrData: '',
            _account: '',
          }
        )
        .catch(() => {});
    } else {
      window.open(
        `${systemApi.getContextPath()}/readMailReadOnly/?id=${mail?.id}&handoverEmailId=${id}`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  }, [mail]);

  return (
    <div className={styles.inquiryCard}>
      <div className={styles.inquiryCardHeader}>
        {unread ? (
          <TongyongYouxiangMian className={styles.inquiryCardHeaderIconUnread} wrapClassName="wmzz" />
        ) : (
          <TongyongYiduMian className={styles.inquiryCardHeaderIconRead} wrapClassName="wmzz" />
        )}
        <Tooltip title={email.length >= 25 ? email : null}>
          <span className={styles.inquiryCardHeaderText}>{email}</span>
        </Tooltip>
      </div>
      <div className={styles.inquiryCardContent}>{content}</div>
      <div className={styles.inquiryCardFooter}>
        <span className={styles.inquiryCardFooterTime}>{time}</span>
        <div className={styles.inquiryCardFooterBtn} onClick={overview}>
          <span className={styles.inquiryCardFooterBtnText}>{getIn18Text('XIANGQING')}</span>
          <TongyongJiantou1You className={styles.inquiryCardFooterBtnIcon} wrapClassName="wmzz" />
        </div>
      </div>
    </div>
  );
};

export default InquiryCard;
