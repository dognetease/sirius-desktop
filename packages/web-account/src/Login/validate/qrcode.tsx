import React, { useState, useEffect } from 'react';
import { api, apis, inWindow, LoginApi, LoginModel, wait, DataTrackerApi, environment } from 'api';
import styles from './qrcode.module.scss';
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.getSystemApi();
import { doLoginPageClickDataTrack } from './../dataTracker';
import { getIn18Text } from 'api';
import { Popover } from 'antd';
import qrCodeImage from '../../../icons/app-qr-code.png';
import qrCodeTestImage from '../../../icons/app-qr-code-test.png';

type LoginTypes = 'common' | 'addAccount' | 'addAccountPage' | 'addAccountModal' | 'unlockApp';

const QrCheckStatus = {
  init: 0,
  scaning: 1,
  pass: 2,
  expire: 3,
};

let isRequestingQrCodeStatus = false;

const env = typeof environment === 'string' ? environment : 'local';
const isOnline = ['test_prod', 'prod', 'prev'].includes(env);

export const QrcodeValidate: React.FC<{ onLogin: (res: LoginModel) => void; type?: LoginTypes; onUnLockAppSuccess?: () => void }> = props => {
  const { onLogin, type = 'common', onUnLockAppSuccess } = props;
  const isUnLockApp = type === 'unlockApp';

  const [qrUrl, setQrUrl] = useState<string>();
  const [errmsg, setErrmsg] = useState<string>('');
  const [actBtnText, setActBtnText] = useState<string>('');
  const [loginErr, setLoginErr] = useState<string>('');
  const [isScanSuccess, setIsScanSuccess] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(isUnLockApp ? getIn18Text('LOCK_LOGIN_MODAL_TITLE') : getIn18Text('QRCODE_LOGIN'));
  const [loginTip, setLoginTip] = useState<string>('');
  const QRCodeContainerClass = 'lingxi-login-qr-code-container';

  const getHasQrCodeContainer = () => {
    const el = document.querySelector('.' + QRCodeContainerClass);
    if (!el) {
      return false;
    }
    let rect = el.getBoundingClientRect();
    //el容器不展示
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
    if (document.visibilityState === 'hidden') {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (loginErr) {
      setLoginTip('');
    }
  }, [loginErr]);

  const getHasVisibilityState = () => {
    return inWindow() ? (document.visibilityState ? true : false) : false;
  };

  useEffect(() => {
    setQrUrl(loginApi.getLoginQrCodeImgUrl());
  }, []);

  function onVisibilityChanged() {
    setTimeout(() => {
      let visibilityState = document.visibilityState;
      if (visibilityState === 'visible') {
        checkQRCodeStatus();
      }
    }, 0);
  }

  useEffect(() => {
    const hasVisibilityState = getHasVisibilityState();
    if (hasVisibilityState) {
      const eventName = 'visibilitychange';
      document.addEventListener(eventName, onVisibilityChanged);
      return () => {
        document.removeEventListener(eventName, onVisibilityChanged);
      };
    }
    return;
  }, []);

  const delayCheckQRCodeStatus = async () => {
    const hasQrCodeContainer = getHasQrCodeContainer();
    if (!hasQrCodeContainer) return;
    await wait(1000);
    checkQRCodeStatus();
  };

  const loginByQRCode = async (loginUrl: string, node: string) => {
    const res = await loginApi.loginByQRCode(loginUrl, node);
    if (res.pass || (!res.pass && !res.errmsg)) {
      onLogin(res);
    } else {
      if (res.errmsg) {
        doLoginPageClickDataTrack(systemApi.getIsAddAccountPage() ? '账号管理-添加账号登录页' : '原始启动登录页', 'false', res.errmsg, 'qrcode');
      }
      setLoginErr(res.errmsg);
    }
  };

  useEffect(() => {
    setQrUrl(loginApi.getLoginQrCodeImgUrl());
  }, []);

  const handleQrCodeImgLoaded = async () => {
    //等待1s后再去check
    await wait(1000);
    checkQRCodeStatus();
  };

  const checkQRCodeStatus = async () => {
    if (!isRequestingQrCodeStatus) {
      isRequestingQrCodeStatus = true;
    } else {
      return;
    }
    const res = await loginApi.getQRCodeStatus(undefined, isUnLockApp);
    isRequestingQrCodeStatus = false;
    const hasQrCodeContainer = getHasQrCodeContainer();
    if (!hasQrCodeContainer) return;
    if (!res.success) {
      setIsScanSuccess(false);
      setLoginErr(res.errMsg!);
      return;
    }
    if (res.data) {
      const resData = res.data;
      const codeStatus = resData.status;
      switch (codeStatus) {
        case QrCheckStatus.scaning:
          setIsScanSuccess(true);
          setTitle(getIn18Text('SCAN_SUCCESS'));
          setLoginTip(getIn18Text('CONFIRM_LOGIN_ONAPP'));
          break;
        case QrCheckStatus.pass:
          if (isUnLockApp) {
            const loginUrl = resData.loginUrl;
            if (loginUrl) {
              const uid = new URL(loginUrl).searchParams.get('uid');
              if (uid) {
                const currentUser = systemApi.getCurrentUser();
                if ((currentUser && currentUser.id === uid) || (currentUser?.loginAccount && currentUser.loginAccount === uid)) {
                  onUnLockAppSuccess && onUnLockAppSuccess();
                  return;
                }
              }
            }
            setLoginErr(getIn18Text('UNLOCK_OTRER_ACCOUNT_ERROR'));
            refresh();
            return;
          }
          loginByQRCode(resData.loginUrl!, resData.node!);
          setLoginTip(getIn18Text('LOGINING'));
          break;
        case QrCheckStatus.expire:
          setErrmsg(getIn18Text('QRCODE_OUTDATE'));
          setIsScanSuccess(false);
          setActBtnText(getIn18Text('SHUAXIN'));
          break;
        default:
          break;
      }

      if ([QrCheckStatus.scaning, QrCheckStatus.init].includes(codeStatus)) {
        delayCheckQRCodeStatus();
      }
    }
  };

  const resetState = () => {
    setErrmsg('');
    setActBtnText('');
    setIsScanSuccess(false);
    setTitle(getIn18Text('QRCODE_LOGIN'));
    setLoginTip('');
    setLoginErr('');
  };

  useEffect(() => {
    trackerApi.track('pcLogin_show_QRcode_loginPage');
  }, [qrUrl]);

  const refresh = () => {
    const imgUrl = loginApi.getLoginQrCodeImgUrl();
    resetState();
    setQrUrl(imgUrl);
  };

  const appQrCode = (
    <div className="appQrCodeContainer">
      <div className="appQrCode" style={{ background: `url(${isOnline ? qrCodeImage : qrCodeTestImage}) no-repeat center center / cover` }} />
      <div className="appDownText">{getIn18Text('APP_DOWNLOAD')}</div>
    </div>
  );

  return (
    <div key="qrcodeLogin" className={`${styles.container} ${QRCodeContainerClass}`}>
      <div className={styles.title}>{title}</div>
      <div className={styles.qrcodeContainer}>
        <div className={styles.qrcodeWrapper}>
          {qrUrl && <img onLoad={handleQrCodeImgLoaded} src={qrUrl} alt="QRCodeImg" width="176" height="176" />}
          {
            <div className={styles.errTip} style={{ display: errmsg || actBtnText || isScanSuccess ? 'flex' : 'none' }}>
              {errmsg && <div className={styles.errTipText}>{errmsg}</div>}
              {actBtnText && (
                <div className={styles.errActBtn} onClick={refresh}>
                  {actBtnText}
                </div>
              )}
              {isScanSuccess && <div className={styles.successIcon}></div>}
            </div>
          }
        </div>
        <div className={styles.qrcodeTip}></div>
      </div>
      {loginErr && <div className={styles.qrcodeLoginErr}>{loginErr}</div>}
      <div className={styles.qrcodeLoginTip}>
        {!loginTip && (
          <>
            {process.env.BUILD_ISEDM && !isUnLockApp ? (
              <div className={styles.qrcodeTip2}>
                <span className={styles.qrcodeTip2Text}>{getIn18Text('APP_QRCODE')}</span>
                <span className={styles.qrcodeTip2Sep}>|</span>
                <Popover content={appQrCode} placement="topLeft">
                  <span className={styles.qrcodeTip2LinkContainer}>
                    <span className={styles.qrcodeTip2Link}>{isUnLockApp ? getIn18Text('SCAN_AND_UNLOCK') : getIn18Text('APP_QRCODE_TIP')}</span>
                    <span className={styles.qrcodeTip2Icon} />
                  </span>
                </Popover>
              </div>
            ) : (
              <>
                {getIn18Text('PLEASE_USE')}
                <a href="https://office.163.com?from=scan-qrcode" target="_blank">
                  {process.env.BUILD_ISEDM ? getIn18Text('WANGYIWAIMAOTONG') : getIn18Text('WANGYILINGXIBAN')}
                </a>{' '}
                {isUnLockApp ? getIn18Text('SCAN_AND_UNLOCK') : getIn18Text('SCAN_AND_LOGIN')}
              </>
            )}
          </>
        )}
        {loginTip && <>{loginTip}</>}
      </div>
    </div>
  );
};
export default QrcodeValidate;
