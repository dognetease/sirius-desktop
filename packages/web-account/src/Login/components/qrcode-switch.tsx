import React, { useState } from 'react';
import Styles from './qrcode-switch.module.scss';
import { getIn18Text } from 'api';
import classnames from 'classnames';

const inEdm = process.env.BUILD_ISEDM;

const QRCodeSwitch: React.FC<{
  useType?: 'unLockApp' | 'common';
  type: 'QRCodeLogin' | 'PCLogin';
  onTypeChange: (type: 'QRCodeLogin' | 'PCLogin') => void;
}> = props => {
  const { type, onTypeChange, useType } = props;
  const isUnLockApp = useType && useType === 'unLockApp';
  const isQRCodeType = type === 'QRCodeLogin';
  const isPCLoginType = type === 'PCLogin';
  const [hoveringTypeSwitch, setHoveringTypeSwitch] = useState<boolean>(false);
  const isEnglish = window.systemLang === 'en';

  const edmQRCodeEle = isUnLockApp ? (
    <div className={`${Styles.hoverTip + (isEnglish ? ' ' + Styles.en : '')}`} style={{ visibility: hoveringTypeSwitch ? 'visible' : 'hidden' }}>
      {isQRCodeType ? getIn18Text('ACCOUNT_TYPE_UNLOCK') : getIn18Text('SCAN_TYPE_UNLOCK')}
    </div>
  ) : (
    <div className={classnames([Styles.hoverTip2, isQRCodeType ? Styles.hoverTipAccount : Styles.hoverTipQr, isEnglish ? Styles.en2 : ''])}>
      {isQRCodeType ? getIn18Text('ACCOUNT_LOGIN_2') : isPCLoginType ? getIn18Text('QRCODE_LOGIN_2') : ''}
    </div>
  );

  return (
    <div className={Styles.qrcodeSwitchContainer}>
      {inEdm ? (
        edmQRCodeEle
      ) : (
        <div className={`${Styles.hoverTip + (isEnglish ? ' ' + Styles.en : '')}`} style={{ visibility: hoveringTypeSwitch ? 'visible' : 'hidden' }}>
          {isUnLockApp
            ? isQRCodeType
              ? getIn18Text('ACCOUNT_TYPE_UNLOCK')
              : getIn18Text('SCAN_TYPE_UNLOCK')
            : isQRCodeType
            ? getIn18Text('ACCOUNT_LOGIN')
            : isPCLoginType
            ? getIn18Text('QRCODE_LOGIN')
            : ''}
        </div>
      )}

      <div
        className={Styles.right}
        onMouseLeave={() => {
          setHoveringTypeSwitch(false);
        }}
        onMouseOver={() => {
          setHoveringTypeSwitch(true);
        }}
      >
        <div
          data-test-id="login-method-switch"
          className={Styles.iconContainer}
          onClick={() => {
            onTypeChange && onTypeChange(isQRCodeType ? 'PCLogin' : 'QRCodeLogin');
          }}
        >
          <div className={`${Styles.icon} ${isPCLoginType ? Styles.qrcodeLoginIcon : Styles.pcLoginIcon} `}></div>
        </div>
      </div>
    </div>
  );
};
export default QRCodeSwitch;
