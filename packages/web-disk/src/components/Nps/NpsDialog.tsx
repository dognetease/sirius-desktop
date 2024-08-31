import React, { useState, useEffect } from 'react';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import { NpsRank } from './NpsRank';
import { NpsLike } from './NpsLike';
import styles from './index.module.scss';
import { apiHolder, apis, NetStorageApi, DataTrackerApi, AnnouncementOperateTypeEnum } from 'api';
import { getIn18Text } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const NPS_EVENT_ID = 'pcDisk_nps';
enum NpsOperaType {
  Show = 'show',
  Feedback = 'feedback',
  Close = 'close',
  NoMoreAgain = 'noMoreAgain',
}
export type NpsDialogType = 'rank' | 'like';
interface NpsDialogProps {
  npsId: number;
  title: string;
  type: NpsDialogType;
  npsKey: string; // 用于标识某次特定的nps
  onClose: () => void;
}
export const NpsDialog: React.FC<NpsDialogProps> = ({ npsId, title, type, npsKey, onClose }) => {
  const [visible, setVisible] = useState(true);
  const npsType = npsKey.split('-')[2];
  useEffect(() => {
    if (visible) {
      trackerApi.track(NPS_EVENT_ID, {
        operaType: NpsOperaType.Show,
        npsType,
      });
    }
    return () => {
      onClose();
    };
  }, [visible]);
  function CloseDialog(manual = false) {
    setVisible(false);
    onClose();
    if (manual) {
      trackerApi.track(NPS_EVENT_ID, {
        operaType: NpsOperaType.Close,
        npsType,
      });
      diskApi.operateAnnouncement({
        announcementId: npsId,
        operateType: AnnouncementOperateTypeEnum.CLOSE,
      });
    }
  }
  function DisableDialog() {
    CloseDialog();
    trackerApi.track(NPS_EVENT_ID, {
      operaType: NpsOperaType.NoMoreAgain,
      npsType,
    });
    diskApi.operateAnnouncement({
      announcementId: npsId,
      operateType: AnnouncementOperateTypeEnum.STOP_REMIND,
    });
  }
  function onFeedback(score: number, feedBack: string) {
    CloseDialog();
    trackerApi.track(NPS_EVENT_ID, {
      operaType: NpsOperaType.Feedback,
      npsType,
      score,
    });
    diskApi.feedBackNps({
      announcementId: npsId,
      feedBack,
    });
  }
  let npsDialogBody = <NpsRank levels={10} onFeedback={onFeedback} />;
  let npsDialogWidth = 414;
  if (type === 'like') {
    npsDialogBody = <NpsLike onFeedback={onFeedback} />;
    npsDialogWidth = 280;
  }
  if (!visible) {
    return null;
  }
  return (
    <div className={styles.npsDialogWrapper} style={{ width: npsDialogWidth }}>
      <CloseOutlined className={styles.npsDialogClose} onClick={() => CloseDialog(true)} />
      <div className={styles.npsDialogTitle}>{title}</div>
      <div>{npsDialogBody}</div>
      <div className={styles.npsDialogAction}>
        <div className={styles.npsDialogNoMoreBtn} onClick={DisableDialog}>
          {getIn18Text('BUZAIXUNWEN')}
        </div>
      </div>
    </div>
  );
};
