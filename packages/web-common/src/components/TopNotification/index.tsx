import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { Alert } from 'antd';
import { useMap } from 'react-use';
import { api, apis, EdmNotifyApi, DataTrackerApi } from 'api';
import { TongyongYouxiangMian } from '@sirius/icons';

import QuotaNotifyModal from '@web-common/components/QuotaNotifyModal';

import styles from './style.module.scss';

const QuotaNotificationLastClosedDate = 'quotaNotificationLastClosedDate';
const NotifyApi = api.requireLogicalApi(apis.edmNotifyApiImpl) as EdmNotifyApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface TopNotificationProps {}

const TopNotification: React.FC<TopNotificationProps> = () => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notification, { setAll, reset }] = useMap({
    tipsType: 0,
    admin: false,
    params: {
      number: '',
      link: '',
    },
    tipsContent: '',
  });

  const hasClosedToday = () => {
    const lastClosedDate = localStorage.getItem(QuotaNotificationLastClosedDate);
    const currentDate = new Date().toDateString();
    return lastClosedDate === currentDate;
  };

  const closeNotification = () => {
    reset();
    // 将通知标记为今天关闭
    localStorage.setItem(QuotaNotificationLastClosedDate, new Date().toDateString());
  };

  const replaceTags = (content: string): JSX.Element => {
    const replacedContent = content
      .replace(/<number>(.*?)<\/number>/g, (_, number) => `<span class="number">${number}</span>`)
      .replace(
        /<link>(.*?)<\/link>/g,
        (_, link) =>
          `<a class="link">${link}</a><svg class="icon-link" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="#3081F2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      );

    return <div onClick={clickHandler} dangerouslySetInnerHTML={{ __html: replacedContent }} />;
  };

  const clickHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    setShowNotificationModal(true);
  };

  const showNotification = useMemo(() => {
    return [1, 2].includes(notification.tipsType) && !hasClosedToday();
  }, [notification]);

  const notificationType = useMemo(() => {
    if (notification.tipsType === 1) {
      return 'error';
    } else if (notification.tipsType === 2) {
      return 'warning';
    }
    return;
  }, [notification.tipsType]);

  useEffect(() => {
    NotifyApi.getQuotaNotify('EDM').then(res => {
      setAll(res);
      if (res.tipsType === 1 || res.tipsType === 2) {
        trackApi.track('waimao_buyMore_guide', {
          action: 'show',
          type: 'EDM',
        });
      }
    });
  }, []);

  return (
    <>
      {showNotification && (
        <Alert
          className={classnames(styles.alert, notificationType === 'warning' && styles.warning, notificationType === 'error' && styles.error)}
          banner
          message={replaceTags(notification.tipsContent)}
          type={notificationType}
          closable
          icon={<TongyongYouxiangMian />}
          onClose={closeNotification}
        />
      )}
      {showNotificationModal && (
        <QuotaNotifyModal type="click" handleCancel={() => setShowNotificationModal(false)} onVisibleChange={visible => !visible && setShowNotificationModal(false)} />
      )}
    </>
  );
};

export default TopNotification;
