import React from 'react';
import Login from './index';
import Register from '@web-account/Register/register';
import Banner from '@web-account/Login/banner';
import BannerWaimao from '@web-account/Login/bannerWaimao';
import BannerHuodai from '@web-account/Login/bannerHuodai';
import BindAccountListModal from '@web-account/Login/modal/bindAccountList';
import SuccessModal from '@web-account/Login/modal/success';
import SwitchLoginOrRegister from '@web-account/Login/modal/switchLoginOrRegister';
import RegisterResultDialog from '@web-account/Login/modal/registerResultDialog';
import wyLogos from '../../icons/wylogos.png';
import styles from '@/styles/pages/login.module.scss';
import { apiHolder as api, inWindow, SystemApi } from 'api';
import { getIn18Text } from 'api';
const systemApi = api.api.getSystemApi() as SystemApi;
interface LoginProps {
  type?: 'common' | 'addAccount' | 'addAccountPage' | 'unlockApp';
  initAccount?: string;
  originLoginKey?: string;
  noBorder?: boolean;
  handlerResetPassword: (email: string, password?: string) => void;
}
const LoginPage: React.FC<LoginProps> = props => {
  const isAddAccountPage = systemApi.getIsAddAccountPage();
  if (isAddAccountPage) {
    props.type = 'addAccountPage';
  }
  const isAddAccount = props.type === 'addAccount' || isAddAccountPage;
  const isMacElectron = inWindow() && systemApi.isElectron() && window.electronLib.env.isMac;
  const closeWindow = () => {
    if (isMacElectron) {
      window.electronLib.windowManage.close();
    }
  };
  return (
    <>
      <div className={`extheme ${styles.loginPage}`}>
        <div className={styles.loginPageLeft}>
          <img className={styles.wmlogos} src={wyLogos} alt="" />
          {systemApi.isWebFfEntry() ? <BannerHuodai /> : process.env.BUILD_ISEDM ? <BannerWaimao /> : <Banner />}
        </div>
        <div className={styles.loginPageRight}>
          <Login {...props} />
          {!isAddAccount && <Register />}
        </div>
      </div>
      {isAddAccountPage && isMacElectron ? (
        <a className={styles.closeAccountPageBtn} href="javascript:void(0)" onClick={closeWindow}>
          {getIn18Text('GUANBI')}
        </a>
      ) : (
        ''
      )}
      <BindAccountListModal />
      {!isAddAccount && <SwitchLoginOrRegister />}
      {!isAddAccount && <SuccessModal />}
      {!isAddAccount && <RegisterResultDialog />}
    </>
  );
};
export default LoginPage;
