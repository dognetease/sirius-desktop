import React, { FC, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal } from 'antd';
import style from './toolbarDownloadModal.module.scss';
// import classnames from 'classnames';
import CloseIcon from '@/images/icons/modal-close-btn.svg';
import { ReactComponent as DownloadWindowsMaskIcon } from '@/images/icons/toolbar_download_windows_mask.svg';
import { ReactComponent as DownloadMacOSMaskIcon } from '@/images/icons/toolbar_download_macos_mask.svg';
import { ReactComponent as DownloadiOSMaskIcon } from '@/images/icons/toolbar_download_ios_mask.svg';
import { ReactComponent as DownloadAndroidMaskIcon } from '@/images/icons/toolbar_download_android_mask.svg';
import { ReactComponent as DownloadIcon } from '@/images/icons/toolbar_download_icon.svg';
import { getIn18Text } from 'api';
interface ToolbarDownloadModalProps {
  visible: boolean;
  onClose: () => void;
}
const ToolbarDownloadModal: FC<ToolbarDownloadModalProps> = ({ visible: defulatVisible, onClose: closeModal }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(defulatVisible);
  }, [defulatVisible]);
  return (
    <Modal
      visible={visible}
      className={style.downloadModalWrap}
      width={848}
      bodyStyle={{ padding: '34px 0 56px 0' }}
      footer={null}
      afterClose={closeModal}
      centered
      onCancel={() => {
        closeModal();
      }}
      closeIcon={
        <img
          style={{
            width: '16px',
            height: '16px',
          }}
          src={CloseIcon}
        />
      }
    >
      <span className={style.title}>{getIn18Text('toobar_download_modal_title')}</span>
      <span className={style.desc}>{getIn18Text('toobar_download_modal_desc')}</span>
      <div className={style.cardWrap}>
        <div
          className={style.downloadCardItem}
          onClick={() => {
            if (window) {
              window.location.href = 'https://sirius-config.qiye.163.com/api/pub/client/update/download-windows';
            }
          }}
        >
          <div className={style.cardItemImg}>
            <DownloadWindowsMaskIcon className={style.cardItemImgMask} />
            <DownloadIcon className={style.cardItemImgQR} />
          </div>
          <span className={style.cardItemHoverTitle}>{getIn18Text('toobar_download_modal_click_download')}</span>
          <span className={style.cardItemTitle}>{getIn18Text('toobar_download_modal_windows_desktop')}</span>
        </div>
        <div
          className={style.downloadCardItem}
          onClick={() => {
            if (window) {
              window.location.href = 'https://sirius-config.qiye.163.com/api/pub/client/update/download-mac';
            }
          }}
        >
          <div className={style.cardItemImg}>
            <DownloadMacOSMaskIcon className={style.cardItemImgMask} />
            <DownloadIcon className={style.cardItemImgQR} />
          </div>
          <span className={style.cardItemHoverTitle}>{getIn18Text('toobar_download_modal_click_download')}</span>
          <span className={style.cardItemTitle}>{getIn18Text('toobar_download_modal_mac_desktop')}</span>
        </div>
        <div className={style.downloadCardItem}>
          <div className={style.cardItemImg}>
            <DownloadiOSMaskIcon className={style.cardItemImgMask} />
            <img
              className={style.cardItemImgQR}
              src={'	https://cowork-storage-public-cdn.lx.netease.com/qyy/2021/07/20/fd4279238e7b48a5b776be36ce096bc2'}
              style={{
                width: '102px',
                height: '102px',
              }}
            />
          </div>
          <span className={style.cardItemHoverTitle}>{getIn18Text('toobar_download_modal_scan_download')}</span>
          <span className={style.cardItemTitle}>iOS</span>
          <span className={style.cardItemDesc}>{getIn18Text('toobar_download_modal_ios_support')}</span>
        </div>
        <div className={style.downloadCardItem}>
          <div className={style.cardItemImg}>
            <DownloadAndroidMaskIcon className={style.cardItemImgMask} />
            <img
              className={style.cardItemImgQR}
              src={'https://cowork-storage-public-cdn.lx.netease.com/qyy/2021/07/20/fd4279238e7b48a5b776be36ce096bc2'}
              style={{
                width: '102px',
                height: '102px',
              }}
            />
          </div>
          <span className={style.cardItemHoverTitle}>{getIn18Text('toobar_download_modal_scan_download')}</span>
          <span className={style.cardItemTitle}>Android</span>
          <span className={style.cardItemDesc}>{getIn18Text('toobar_download_modal_android_support')}</span>
        </div>
      </div>
    </Modal>
  );
};

export default ToolbarDownloadModal;
