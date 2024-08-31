import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { apiHolder as api, apis, NetStorageShareApi, ExternalShareInteractType, ExternalShareLinkValidPeriod } from 'api';
import classnames from 'classnames';
import styles from './index.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { simpleFormatTime } from './../../utils';
import { getIn18Text } from 'api';
interface DeviceModalProps {
  visible: boolean;
  shareIdentity: string;
  interactType: ExternalShareInteractType;
  visitTime: ExternalShareLinkValidPeriod;
  toggleVisible: (flag?: boolean) => void;
}
interface DeviceInfo {
  deviceName: string;
  system: string;
  deviceType: string;
  loginTime: number;
}
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
// const info = {
//   deviceId: 'aaaa',
//   deviceName: 'mingliang的Mac',
//   system: 'MacOS',
//   deviceType: 'PC',
//   loginTime: '2021-4-25 8:20' // yyyy-MM-dd HH:mm:ss
// };
const DeviceModal: React.FC<DeviceModalProps> = props => {
  const { visible, shareIdentity, interactType, toggleVisible, visitTime } = props;
  const [deviceList, setDeviceList] = useState<DeviceInfo[]>([]);
  const [deviceListLoading, setDeviceListLoading] = useState(false);
  const getDeviceList = async (_shareIdentity: string, _interactType: ExternalShareInteractType) => {
    try {
      setDeviceListLoading(true);
      const res = await nsShareApi.getNSExternalShareInteractDetail({
        interactType: _interactType,
        page: 1,
        pageSize: 100,
        shareIdentity: _shareIdentity,
        visitTime,
      });
      const data = res.details.map(item => ({
        deviceName: item.browser,
        system: item.os,
        deviceType: 'Web',
        loginTime: item.time,
      })) as DeviceInfo[];
      setDeviceList(data);
      setDeviceListLoading(false);
    } catch (error) {
      setDeviceList([]);
      setDeviceListLoading(false);
    }
  };
  useEffect(() => {
    visible && getDeviceList(shareIdentity, interactType);
  }, [shareIdentity, visible, interactType]);
  return (
    <Modal wrapClassName={`${styles.deviceModalWrap} externalsharedevice-device-modal-wrap`} width={476} visible={visible} closable={false} footer={null}>
      <div className={`${styles.deviceWrap} deviceWrap`}>
        <div className={`${styles.deviceWrapTitle} deviceWrapTitle`}>
          <span className={styles.name}>{getIn18Text('FANGWENXIANGQING')}</span>
          <span
            className={`${styles.closeIcon} closeIcon`}
            onClick={() => {
              toggleVisible(false);
            }}
          />
        </div>
        <div className={`${styles.deviceWrapContent} deviceWrapContent`}>
          <Spin spinning={deviceListLoading}>
            {deviceList?.length > 0 ? (
              <div className={`${styles.list} list`}>
                {deviceList.map(item => {
                  const isPC = item.deviceType === 'PC';
                  const isApp = item.deviceType === 'APP';
                  const appIconClass = isApp ? `${styles.deviceMobileIcon} deviceMobileIcon` : styles.deviceWebIcon;
                  const iconClass = isPC ? `${styles.devicePCIcon} devicePCIcon` : appIconClass;
                  return (
                    <div className={`${styles.item} item`} key={item.loginTime}>
                      <div className={classnames(styles.deviceIcon, 'deviceIcon', iconClass)} />
                      <div className={styles.deviceInfo}>
                        <div className={styles.name}>
                          <span className={styles.nameTxt}>{item.deviceName}</span>
                        </div>
                        <div className={styles.system}>
                          {getIn18Text('XITONG\uFF1A')}
                          {item.system}
                        </div>
                        <div className={styles.time}>
                          {getIn18Text('SHIJIAN\uFF1A')}
                          {simpleFormatTime(item.loginTime)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.deviceEmptyWrapper}>
                <div className={styles.deviceEmptyImg} />
                <div>{getIn18Text('ZANWUSHEBEI')}</div>
              </div>
            )}
          </Spin>
        </div>
      </div>
    </Modal>
  );
};
export default DeviceModal;
