import React, { useState, useEffect, useRef } from 'react';
import { Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import QRCode from 'qrcode.react';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { api, apis, InsertWhatsAppApi, WaMgmtPageState } from 'api';
import style from './LoginWaModal.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface LoginWaModalProps {
  visible: boolean;
  channelId: string | null;
  whatsAppNumber?: string;
  onFinish: (channelId: string) => void;
  onCancel: () => void;
}

const getChannelId = (channelId: string | null) => {
  if (channelId) return Promise.resolve(channelId);
  return insertWhatsAppApi.getMgmtChannelId();
};

export const LoginWaModal: React.FC<LoginWaModalProps> = props => {
  const { visible, channelId, whatsAppNumber, onFinish, onCancel } = props;
  const [qrCode, setQrCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const timerRef = useRef<NodeJS.Timer | null>(null);

  const handleTimerClear = () => {
    timerRef.current && clearInterval(timerRef.current);
  };

  const handleLoopStart = (channelId: string | null) => {
    setQrCode('');
    setErrorMsg('');
    handleTimerClear();

    getChannelId(channelId).then(channelId => {
      timerRef.current = setInterval(() => {
        insertWhatsAppApi.getMgmtQrCode({ transportId: channelId }).then(res => {
          if (res.pageState === WaMgmtPageState.BIND_ERROR) {
            setErrorMsg(res.errorMessage || '绑定错误');
            handleTimerClear();
          }
          if (res.pageState === WaMgmtPageState.QRCODE) {
            setQrCode(res.qrCode as string);
          }
          if (res.pageState === WaMgmtPageState.READY) {
            onFinish(channelId);
            handleTimerClear();
          }
        });
      }, 3000);
    });
  };

  const handleQrCodeScanAgain = () => {
    if (channelId) {
      insertWhatsAppApi
        .logoutMgmt({
          transportId: channelId,
        })
        .then(success => {
          if (success) {
            handleLoopStart(channelId);
          }
        });
    }
  };

  useEffect(() => {
    if (visible) {
      handleLoopStart(channelId);
    } else {
      setQrCode('');
      setErrorMsg('');
      handleTimerClear();
    }
  }, [visible, channelId]);

  useEffect(() => handleTimerClear, []);

  return (
    <Modal className={style.loginWaModal} title={`扫码登录 ${whatsAppNumber || ''}`} width={300} visible={visible} footer={null} onCancel={onCancel}>
      <div className={style.qrCodeWrapper}>
        {errorMsg ? (
          <>
            <div className={style.errorMsg}>{errorMsg}</div>
            <a onClick={handleQrCodeScanAgain}>重新扫码</a>
          </>
        ) : (
          <Spin spinning={!qrCode} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
            <QRCode size={238} value={qrCode} />
          </Spin>
        )}
      </div>
    </Modal>
  );
};
