import { getIn18Text } from 'api';
import { apiHolder, apis, DataTrackerApi, ProductAuthApi, DataStoreApi } from 'api';
import React, { useEffect, useState } from 'react';
import NotificationCard from '../../../../../web-common/src/components/UI/NotificationCard';
import styles from './index.module.scss';
import { useGlobalEventObserver } from '../../../../../web-common/src/hooks/useEventObserver';
import { Button } from 'antd';
import { useBlackList } from './blackList';

const WmEntryNotificationLinkIcon = (props: { className?: string; handleClick?: () => void }) => {
  const { className = '', handleClick = () => {} } = props;

  return (
    <div className={className} onClick={handleClick}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4.03829 7.04248C3.78561 7.29747 3.78748 7.70902 4.04248 7.96171C4.29747 8.21439 4.70902 8.21252 4.96171 7.95752L4.03829 7.04248ZM4.96171 7.95752L10.5508 2.31739L9.62735 1.40234L4.03829 7.04248L4.96171 7.95752Z"
          fill="#4C6AFF"
        />
        <path
          d="M4.56818 3H1.875C1.66789 3 1.5 3.16789 1.5 3.375V10.125C1.5 10.3321 1.66789 10.5 1.875 10.5H8.625C8.83211 10.5 9 10.3321 9 10.125V7.43182"
          stroke="#4C6AFF"
          stroke-width="1.3"
          stroke-linecap="round"
        />
        <path d="M7.125 1.875H9.75C9.95711 1.875 10.125 2.04289 10.125 2.25V4.875" stroke="#4C6AFF" stroke-width="1.3" stroke-linecap="round" />
      </svg>
    </div>
  );
};

const WmEntryNotificationHeaderIcon = (props: { className?: string; handleClick?: () => void }) => {
  const { className = '', handleClick = () => {} } = props;

  return (
    <div className={className} onClick={handleClick}>
      <svg width="27" height="16" viewBox="0 0 27 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.86">
          <path d="M6.30809 2.67363L3.50912 13.3264L0 0H5.61878L6.30809 2.67363Z" fill="white" />
        </g>
        <g opacity="0.94">
          <path d="M12.6369 16H18.2348L14.0364 0H8.4176L12.6369 16Z" fill="white" />
        </g>
        <g opacity="0.86">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.19897 15.9994H9.81778L11.2291 10.6585L8.41886 0L4.19897 15.9994Z" fill="white" />
        </g>
        <path d="M26.653 15.9996H21.0342L20.324 13.326L23.1229 2.65234L26.653 15.9996Z" fill="white" />
        <path d="M18.235 16H12.6162L16.8355 0H22.4544L18.235 16Z" fill="white" />
      </svg>
    </div>
  );
};
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const systemApi = apiHolder.api.getSystemApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const isElectronSide = systemApi.isElectron();
const isOldWebSide = !isElectronSide && typeof window !== 'undefined' && typeof navigator === 'object';
const trackEventId = isElectronSide ? 'waimao_desktop_desktop2web' : isOldWebSide ? 'waimao_oldweb_old2new' : 'unknown';
const trackOpenNewWebAction = isElectronSide ? 'visit_the_Web_version' : isOldWebSide ? 'access_the_new_edition' : 'unknown';
const trackDelayRemindAction = 'reminder_later';
const trackCloseAction = 'close';

const newWebHostName = 'https://waimao.office.163.com/';
const WmEntryNotification = () => {
  const isStorageTagExisted = () => {
    if (isOldWebSide) {
      return false;
    }
    return !!dataStoreApi.getSync(storageKeyForElectron).data;
  };

  if (isElectronSide && isStorageTagExisted()) {
    return null;
  }
  const storageKeyForElectron = 'wmEntryNotificationStorageKeyForElectron';
  const [visible, setVisible] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const inBlack = useBlackList();

  const getIsOpenNewWebGuide = async () => {
    const showNewWebEntryGuide = (await productAuthApi.getABSwitch('show_new_web_entry_guide')) as boolean;
    setIsConfigOpen(showNewWebEntryGuide);
  };

  useEffect(() => {
    getIsOpenNewWebGuide();
  }, []);

  const handleOpenNewWeb = () => {
    trackApi.track(trackEventId, {
      action: trackOpenNewWebAction,
    });
    if (isElectronSide && window.electronLib) {
      systemApi.openNewWindow(newWebHostName, false);
    } else {
      const currentUser = systemApi.getCurrentUser();
      if (currentUser?.sessionId) {
        window.location.replace(`${newWebHostName}jump/index.html?sid=${currentUser.sessionId}`);
      } else {
        console.log('====>>>debug currentUser sessionId获取失败', currentUser?.sessionId);
        window.location.replace(newWebHostName);
      }
    }
    handleCloseClick();
  };

  const handleCloseClick = () => {
    trackApi.track(trackEventId, {
      action: trackCloseAction,
    });
    if (isElectronSide) {
      dataStoreApi.putSync(storageKeyForElectron, 'true', {
        noneUserRelated: false,
      });
    }
    setVisible(false);
  };

  const handleDelayBtnClick = () => {
    if (!visible) return;
    trackApi.track(trackEventId, {
      action: trackDelayRemindAction,
    });
    setVisible(false);
    startWaitNextShowTimer();
  };

  let nextShowTimer = -1;
  const startWaitNextShowTimer = () => {
    clearTimeout(nextShowTimer);
    nextShowTimer = window.setTimeout(() => {
      setVisible(true);
    }, 1000 * 60 * 60);
  };

  useGlobalEventObserver('launchSuccessed', () => {
    setLaunchSuccess(true);
  });

  useEffect(() => {
    // 在loading和接口结果都拿到后，并且isStorageTagExisted返回false，则展示弹窗
    if (launchSuccess && isConfigOpen && !isStorageTagExisted() && !inBlack) {
      setVisible(true);
    }
  }, [launchSuccess, isConfigOpen]);

  useEffect(() => {
    if (inBlack) {
      setVisible(false);
    }
  }, [inBlack]);

  return (
    <NotificationCard show={visible}>
      <div className={styles.wmEntryNotification}>
        <div className={styles.header}>
          <WmEntryNotificationHeaderIcon className={styles.headerIcon} />
          <div className={styles.headerTitle}>{getIn18Text('WANGYEDUANXINBANBENSHANG')}</div>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.info}>
            {getIn18Text('WAIMAOTONGTUICHUXINBAN')}
            <div className={styles.linkWebBtn} onClick={handleOpenNewWeb}>
              {isElectronSide ? getIn18Text('QUWANGYEDUAN') : getIn18Text('FANGWENXINBAN')}
              <WmEntryNotificationLinkIcon className={styles.leftGap} />
            </div>
          </div>

          <div className={styles.btnsGroup}>
            <Button type="default" onClick={handleCloseClick} className={styles.closeBtn}>
              {getIn18Text('ZHIDAOLE')}
            </Button>
            <Button type="primary" onClick={handleDelayBtnClick} className={styles.delayBtn}>
              {getIn18Text('SHAOHOUTIXING')}
            </Button>
          </div>
        </div>
      </div>
    </NotificationCard>
  );
};

export default WmEntryNotification;
