import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { Modal } from 'antd';
import { useMap } from 'react-use';
import { api, apis, EdmNotifyApi, QuotaNotifyModalRes, DataTrackerApi, QuotaNotifyModuleType } from 'api';
import { TongyongJiantou2You, TongyongShijianXian, TongyongDianhuaXian } from '@sirius/icons';

import styles from './style.module.scss';

const NotifyApi = api.requireLogicalApi(apis.edmNotifyApiImpl) as EdmNotifyApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface QuotaNotifyModalProps {
  moduleType?: QuotaNotifyModuleType;
  type?: 'click' | 'createTask';
  onVisibleChange?: (visible: boolean) => void;
  handleCancel?: () => void;
}

const QuotaNotifyModal: React.FC<QuotaNotifyModalProps> = ({ type, onVisibleChange, handleCancel, moduleType = 'EDM' }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModal, { setAll: setNotificationModal }] = useMap<QuotaNotifyModalRes>({
    bubbleStyle: '',
    bubbleText: '',
    middleText: '',
    qrCode: '',
    subtitle: '',
    telephone: '',
    title: '',
    workingHours: '',
  });
  const onCancel = () => {
    setShowNotificationModal(false);
    handleCancel && handleCancel();
  };

  useEffect(() => {
    NotifyApi.getQuotaNotifyModal(moduleType, type).then(res => {
      // 点击提示条，red、orange 都弹窗；点击发信，只有 red 弹
      let modalType: Array<string> = [];
      if (moduleType === 'EDM_SEND_HHB' || moduleType === 'EDM_SEND_QJB' || moduleType === 'SEARCH_PERSON_WA' || moduleType === 'SEARCH_BIZ_WA') {
        modalType = ['hide'];
      }
      const modalVisible = ['red', type === 'click' && 'orange', ...modalType].filter(Boolean).includes(res.bubbleStyle);
      setShowNotificationModal(modalVisible);
      setNotificationModal(res);
      onVisibleChange && onVisibleChange(modalVisible);
      trackApi.track('waimao_buyMore_guide', {
        action: type === 'click' ? 'csm_from_guide' : 'csm_from_newEDM',
        type: moduleType,
      });
    });
  }, []);
  return (
    <Modal className={styles.modal} width={704} centered visible={showNotificationModal} footer={null} onCancel={onCancel}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div>
            <h3 className={styles.title}>
              {notificationModal.title}{' '}
              {(notificationModal.bubbleStyle !== 'hide' || Boolean(notificationModal.bubbleText)) && (
                <span
                  className={classnames(
                    styles.number,
                    notificationModal.bubbleStyle === 'orange' && styles.warning,
                    notificationModal.bubbleStyle === 'red' && styles.error
                  )}
                >
                  {notificationModal.bubbleText}
                </span>
              )}
            </h3>
            <div className={styles.subtitle}>{notificationModal.subtitle}</div>
            <div className={styles.middleText}>
              {notificationModal.middleText}
              <TongyongJiantou2You />
            </div>
            <div className={styles.tel}>
              <TongyongDianhuaXian />
              联系电话：{notificationModal.telephone}
            </div>
            <div className={styles.workingHours}>
              <TongyongShijianXian />
              工作时间：{notificationModal.workingHours}
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.qrcode} style={{ backgroundImage: `url(${notificationModal.qrCode})` }}>
            <i className={styles.qrcodeAngleA}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="Rectangle 34624619" d="M25 1H3C1.89543 1 1 1.89543 1 3V25" stroke="#4C6AFF" stroke-width="2" stroke-linecap="round" />
              </svg>
            </i>
            <i className={styles.qrcodeAngleB}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="Rectangle 34624620" d="M25 25L25 3C25 1.89543 24.1046 1 23 1L1 0.999999" stroke="#4C6AFF" stroke-width="2" stroke-linecap="round" />
              </svg>
            </i>
            <i className={styles.qrcodeAngleC}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M1 25L23 25C24.1046 25 25 24.1046 25 23L25 1" stroke="#4C6AFF" stroke-width="2" stroke-linecap="round" />
              </svg>
            </i>
            <i className={styles.qrcodeAngleD}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M0.999999 1L1 23C1 24.1046 1.89543 25 3 25L25 25" stroke="#4C6AFF" stroke-width="2" stroke-linecap="round" />
              </svg>
            </i>
          </div>
          <div className={styles.qrcodeTips}>微信扫码添加专属客户经理</div>
        </div>
      </div>
    </Modal>
  );
};

export default QuotaNotifyModal;
