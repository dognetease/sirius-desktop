import * as React from 'react';
import { navigate, PageProps } from 'gatsby';
import { apiHolder, DataStoreApi, EventApi, SystemApi, SystemEvent } from 'api';
import PasswordForm from '@web-common/components/UI/PasswordForm/password-form';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '../layouts';
import { ReactComponent as SpreadImg } from '../images/spread.svg';
import titleImg from '../images/title-text.svg';
import styles from '@/styles/pages/login.module.scss';

console.info('---------------------from resetPwd page------------------');
const buildFor = apiHolder.env.forElectron;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const storeApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const eventApi = apiHolder.api.getEventApi() as EventApi;

const PasswordResetPage: React.FC<PageProps> = () => {
  useCommonErrorEvent('loginErrorOb');

  const onSuccess = async (pwd: string, redirectUrl?: string) => {
    const isAddAccountPage = systemApi.getIsAddAccountPage();
    if (redirectUrl === 'entry') {
      if (isAddAccountPage) {
        eventApi.sendSysEvent({
          eventName: 'accountAdded',
          eventStrData: 'loginSucc',
          eventData: undefined,
          eventSeq: 0,
        });
      } else {
        navigate('/');
      }
    } else {
      let searchStr = isAddAccountPage ? '?add-account-page=true' : '';
      const { suc, data } = await storeApi.get('willAutoLoginAccount', { noneUserRelated: true });
      if (suc && data) {
        const originLoginKey = await systemApi.getLocalLoginToken(data, pwd);
        navigate(`/login${searchStr}#userInfo=` + originLoginKey);
      } else {
        navigate(`/login${searchStr}`);
      }
    }
  };
  const renderLogin = (
    <div className={styles.loginPage}>
      <div className={styles.loginPageLeft}>
        <img className={styles.titleImg} src={titleImg} alt="" />
        <SpreadImg className={styles.spreadImg} />
      </div>
      <div className={styles.loginPageRight}>
        <PasswordForm from="reset_password" onSuccess={onSuccess} />
      </div>
    </div>
  );
  return buildFor ? (
    <SiriusLayout.ContainerLayout isLogin>
      <SiriusLayout.LoginLayout>{renderLogin}</SiriusLayout.LoginLayout>
    </SiriusLayout.ContainerLayout>
  ) : (
    <SiriusLayout.LoginLayout>{renderLogin}</SiriusLayout.LoginLayout>
  );
};

export default PasswordResetPage;

console.info('---------------------end login page------------------');
