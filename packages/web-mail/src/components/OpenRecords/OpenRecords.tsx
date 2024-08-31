import React, { useState, useEffect, useMemo } from 'react';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import IconSuccess from '@/components/UI/Icons/svgs/Success';
import { ReactComponent as AlertWarn } from '@/images/icons/alert/warn.svg';
import moment from 'moment';

import styles from './openRecords.module.scss';
import { OpenRecordData } from '../../util';
import { MailConfApi, MailEntryModel, apiHolder, apis, getIn18Text } from 'api';

interface Props {
  content: MailEntryModel;
  openRecordData?: OpenRecordData;
  getMailReadDetail?: (content: MailEntryModel) => void;
}

const columns = [
  {
    title: getIn18Text('DANGDISHIJIAN'),
    dataIndex: 'remoteLocalTime',
    key: 'remoteLocalTime',
    render: (text: string) => text || '--',
  },
  {
    title: getIn18Text('DAKAIDIDIAN'),
    dataIndex: 'location',
    key: 'location',
    render: (text: string) => text || '--',
  },
  {
    title: getIn18Text('BENDISHIJIAN'),
    dataIndex: 'settingTime',
    key: 'settingTime',
    render: (text: string) => text || '--',
  },
  {
    title: getIn18Text('IPDIZHI'),
    dataIndex: 'ip',
    key: 'ip',
    render: (text: string) => text || '--',
  },
];

const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;

// 打开记录
const OpenRecords: React.FC<Props> = ({ content, openRecordData, getMailReadDetail }) => {
  const [open, setOpen] = useState<boolean>(false);

  const id = useMemo(() => {
    return content?.id;
  }, [content]);

  const openText = useMemo(() => {
    return !!open ? getIn18Text('SHOUQI') : getIn18Text('XIANGQING');
  }, [open]);

  const showTable = useMemo(() => {
    return open && openRecordData?.records?.length;
  }, [open, openRecordData]);

  const oneRecordText = useMemo(() => {
    if (openRecordData?.records?.length === 1) {
      const one = openRecordData.records[0];
      return getIn18Text('YOUJIANYU:Z(DDSJ:，IP:)BDK', {
        settingTimeZone: one?.settingTimeZone || '--',
        settingTime: one?.settingTime || '--',
        location: one?.location || '--',
        remoteLocalTime: one.remoteLocalTime || '--',
        ip: one?.ip || '--',
      });
    }
    return '';
  }, [openRecordData]);

  const viewDetail = () => {
    if (!open) {
      getMailReadDetail && getMailReadDetail(content);
    }
    setOpen(!open);
  };

  const dayLimit = mailConfApi.getMailDayLimit();

  const overDay = useMemo(() => {
    const {
      entry: { sendTime },
    } = content;
    const dateArr = sendTime?.trim()?.split(/\s+/);
    if (!dateArr || dateArr?.length < 2) {
      return false;
    }
    const utcStr = dateArr[0] + 'T' + dateArr[1] + '+08:00';
    const sendValue = moment(utcStr);
    if (moment().add(-dayLimit.thirdDayLimit, 'day').isAfter(sendValue, 'day')) {
      return true;
    } else {
      return false;
    }
  }, [content]);

  useEffect(() => {
    setOpen(false);
  }, [id]);

  return (
    <>
      {
        // 超过限制天数
        overDay ? (
          <>
            <div className={styles.over30Record}>
              <AlertWarn transform="scale(0.8)" />
              <span className={styles.over30RecordText}>{getIn18Text('WUFACHAKANCHAOGTDDKJL', { count: dayLimit.thirdDayLimit })}</span>
            </div>
          </>
        ) : (
          <>
            {openRecordData?.count ? (
              <>
                {openRecordData?.count === 1 && (
                  <div className={styles.oneRecord}>
                    <IconSuccess transform="scale(0.8)" />
                    <span className={styles.oneRecordText}>{oneRecordText}</span>
                  </div>
                )}
                {openRecordData?.count > 1 && (
                  <div className={styles.multiRecords}>
                    <div className={styles.openRecordTitle}>
                      <IconSuccess transform="scale(0.8)" />
                      <span className={styles.openText}>
                        {getIn18Text('YOUJIANYIBEIDAKC', { openRecordData: openRecordData?.count || 0 })}
                        <span className={styles.openBut} onClick={viewDetail}>
                          {openText}
                        </span>
                      </span>
                    </div>
                    {showTable ? (
                      <div className={styles.openRecordTable}>
                        <SiriusTable
                          pagination={false}
                          columns={columns}
                          dataSource={openRecordData.records}
                          className={styles.openRecordList}
                          rowClassName={styles.openRecordRow}
                          scroll={{ y: 155 }}
                        />
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.noOpenRecord}>
                  <AlertWarn transform="scale(0.8)" />
                  <span className={styles.noOpenRecordText}>{getIn18Text('YOUJIANWEIBEIDAKG')}</span>
                </div>
              </>
            )}
          </>
        )
      }
    </>
  );
};

export default OpenRecords;
