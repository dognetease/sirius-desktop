import React, { FC, useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { apiHolder as api, SystemApi, DEFAULT_LANG, Lang } from 'api';
import AppIcon from '@/images/favicon.png';
import AppIconEdm from '@/images/favicon_edm.png';
import styles from './languageSwitchModal.module.scss';

interface LanguageSwitchModalProps {
  visible: boolean;
  content?: string;
  onClose: (onOk: boolean) => void;
  lang?: Lang;
}
// className={style.cardItemImgMask}
const systemApi = api.api.getSystemApi() as SystemApi;
// const isElectron = systemApi.isElectron();
// const inEdm = systemApi.inEdm();
const isWebWmEntry = systemApi.isWebWmEntry();

const LanguageSwitchModal: FC<LanguageSwitchModalProps> = props => {
  const { visible: defulatVisible, onClose: closeModal, content: customContent, lang = DEFAULT_LANG } = props;
  const localLangMap = {
    en: {
      setting_system_switch_info: systemApi.inEdm()
        ? 'To change the language, you need to restart NetEase Foreign Trade to take effect!'
        : 'To change the language, you need to restart NetEase Rhino Office to take effect!',
      setting_system_switch_info_web: 'To change the language, you need to refresh the page to take effect!',
      setting_system_switch: 'Immediate reboot',
      setting_system_switch_web: 'Refresh',
      setting_system_switch_cancel: 'cancel',
    },
    zh: {
      setting_system_switch: '立即重启',
      setting_system_switch_web: '刷新',
      setting_system_switch_cancel: '取消',
      setting_system_switch_info: systemApi.inEdm() ? '更改语言需重新启动网易外贸通才能生效！' : '更改语言需重新启动网易灵犀办公才能生效！',
      setting_system_switch_info_web: '更改语言需要刷新页面才能生效！',
    },
    'zh-trad': {
      setting_system_switch_info: systemApi.inEdm() ? '更改語言需重新啟動網易外貿通才能生效！' : '更改語言需重新啟動網易靈犀辦公才能生效！',
      setting_system_switch_info_web: '更改語言需要刷新頁面才能生效！',
      setting_system_switch: '立即重啟',
      setting_system_switch_web: '刷新',
      setting_system_switch_cancel: '取消',
    },
  };
  const getLocalLangLabel = (key: string) => {
    const currentLangMap = localLangMap[lang as Lang] || {};
    //@ts-ignore
    return currentLangMap[key] || '';
  };
  const [visible, setVisible] = useState(false);
  const content = customContent
    ? customContent
    : process.env.BUILD_ISELECTRON || process.env.BUILD_ISEDM
    ? getLocalLangLabel('setting_system_switch_info')
    : getLocalLangLabel('setting_system_switch_info_web');
  useEffect(() => {
    setVisible(defulatVisible);
  }, [defulatVisible]);
  return (
    <Modal
      className={styles.switchModal}
      maskStyle={isWebWmEntry ? { left: 0 } : {}}
      width={480}
      visible={visible}
      title={null}
      okText={process.env.BUILD_ISELECTRON || process.env.BUILD_ISEDM ? getLocalLangLabel('setting_system_switch') : getLocalLangLabel('setting_system_switch_web')}
      cancelText={getLocalLangLabel('setting_system_switch_cancel')}
      onCancel={() => {
        closeModal(false);
        setVisible(false);
      }}
      onOk={() => {
        closeModal(true);
        setVisible(false);
      }}
      centered
    >
      <div className={styles.modalContent}>
        <div>
          <img src={process.env.BUILD_ISEDM ? AppIconEdm : AppIcon} />
        </div>
        <div className={styles.switchInfo}>{content}</div>
      </div>
    </Modal>
  );
};

export default LanguageSwitchModal;
