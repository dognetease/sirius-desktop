import React from 'react';
import dayjs from 'dayjs';
import styles from './style.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import CloseIcon from '@web-site/images/close.svg';
import { ReactComponent as SwordIRightArrowIconcon } from '@web-site/images/sword.svg';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { DataTrackerApi, apiHolder, apis, getIn18Text } from 'api';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface SiteServiceModalProps {
  visible: boolean;
  onClose: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  serviceInfo?: Record<string, string>;
  onFreeConsule: () => void;
}

function SiteServiceModal(props: SiteServiceModalProps) {
  const { serviceInfo = {}, onFreeConsule } = props;

  const formatTime = () => {
    if (!serviceInfo.beginTime) {
      return '';
    }
    return dayjs(serviceInfo.beginTime).format('YYYY年M月D日') + ' - ' + dayjs(serviceInfo.expTime).format('YYYY年M月D日');
  };

  return (
    <Modal
      className={styles.serviceModal}
      visible={props.visible}
      onCancel={props.onClose}
      title="建站服务详情"
      width={480}
      closeIcon={<img src={CloseIcon} />}
      destroyOnClose={true}
      maskClosable={false}
      footer={null}
    >
      <div className={styles.serviceItem}>
        <div>服务ID：</div>
        <div>{serviceInfo.id}</div>
      </div>
      <div className={styles.serviceItem}>
        <div>服务周期：</div>
        <div>{formatTime()}</div>
      </div>
      <div className={styles.serviceItem}>
        <div>服务状态：</div>
        <div>
          {serviceInfo.exp ? <div className={styles.redTag}>已失效</div> : <div className={styles.greenTag}>{getIn18Text('SHENGXIAOZHONG')}</div>}
          <a
            className={styles.serviceItemLink}
            onClick={() => {
              onFreeConsule();
              trackApi.track('site_service_renew');
            }}
          >
            续费 <SwordIRightArrowIconcon />
          </a>
        </div>
      </div>
      <div className={styles.serviceButton}>
        <Button btnType="primary" type="button" onClick={props.onClose}>
          {getIn18Text('SITE_ZHIDAOLE')}
        </Button>
      </div>
    </Modal>
  );
}

export default SiteServiceModal;
