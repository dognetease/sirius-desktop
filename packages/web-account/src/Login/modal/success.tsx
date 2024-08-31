import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { api, apis, LoginApi } from 'api';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './success.module.scss';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
interface successModalProp {
  onSure?: () => void;
  title?: string;
  countdown?: number;
}
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const SuccessModal: React.FC<successModalProp> = props => {
  const { onSure, title = getIn18Text('CHUANGJIANCHENGGONG'), countdown = 5 } = props;
  const { visibleSuccessModal, registerInfo } = useAppSelector(state => state.loginReducer);
  const { setVisibleSuccessModal } = useActions(LoginActions);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [time, setTime] = useState<number>(countdown);
  const toLogin = () => {
    if (errorMsg) {
      return;
    }
    const { mobile, code, domainPrefix, adminAccount } = registerInfo;
    loginApi
      .doMobileCodeLogin({
        mobile,
        code,
        domain: domainPrefix + '.ntesmail.com',
        account_name: adminAccount,
      })
      .then(({ pass, errmsg, errCode }) => {
        if (pass) {
          window.location.assign('/');
        } else if (errCode === 'ERR.LOGIN.USERNOTEXIST') {
          setErrorMsg(getIn18Text('WANGLUOQINGQIUCHAO'));
        } else {
          setErrorMsg(errmsg);
        }
      });
  };
  const clickBtn = () => {
    if (disabled) {
      return;
    }
    setVisibleSuccessModal(false);
    toLogin();
    onSure && onSure();
  };
  useEffect(() => {
    let timer: number;
    if (countdown && visibleSuccessModal) {
      setTime(countdown);
      timer = window.setInterval(() => {
        setTime(_time => {
          if (_time <= 0) {
            toLogin();
            clearInterval(timer);
            return 0;
          }
          return _time - 1;
        });
      }, 1000);
    }
    if (!visibleSuccessModal) {
      setErrorMsg('');
      setTime(countdown);
      setDisabled(true);
      // @ts-ignore
      timer && clearInterval(timer);
    }
    return () => {
      timer && clearInterval(timer);
    };
  }, [visibleSuccessModal]);
  useEffect(() => {
    setDisabled(time > 0);
  }, [time]);
  return (
    <SiriusHtmlModal visible={visibleSuccessModal} width={476} closable={false}>
      <div className={styles.wrap}>
        <div className={classnames(styles.icon, errorMsg && styles.warn)} />
        <div className={styles.title}>{errorMsg ? getIn18Text('DENGLUCUOWU') : title}</div>
        <div className={styles.subtitle}>{errorMsg || time + getIn18Text('s HOUZIDONG')}</div>
        <div className={classnames(styles.sureBtn, disabled && styles.disabled)} onClick={clickBtn}>
          {getIn18Text('QUEDING')}
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
export default SuccessModal;
