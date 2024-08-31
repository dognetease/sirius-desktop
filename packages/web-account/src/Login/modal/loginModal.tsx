import React, { useCallback, useMemo, useState } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal, { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import LoginResetPwd from '../components/loginResetPwd';
import styles from '@/styles/pages/login.module.scss';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { sendLogout, setLoginBlock } from '@web-common/utils/utils';
import BannerWaimao from '../bannerWaimao';
import Banner from '../banner';
import { LoginApi, api, apis, util, getIn18Text } from 'api';

const systemApi = api.getSystemApi();
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const LoginModal = () => {
  // 默认展示的登录账号
  const defaultAccount = useAppSelector(state => state.loginReducer.loginModalData.account);
  // 用来回登的账号
  const preAccount = useAppSelector(state => state.loginReducer.loginModalData.prevAccount);
  const dispatch = useAppDispatch();
  const { setLoginModalData } = useActions(LoginActions);

  // 是否处于登录中
  const [isLogin, setIsLogin] = useState(false);

  // 首次进入获取当前账号，用来赋值给回登使用
  const currentAccount = useMemo(() => systemApi.getCurrentUser()?.id, []);

  // 设置回登的上一个账号
  const setPreAccount = useCallback(() => {
    if (currentAccount) {
      dispatch(setLoginModalData({ preAccount: currentAccount }));
    }
  }, [currentAccount]);

  // 关闭当前窗口
  const closeWindow = useCallback(() => {
    // 处于登录中不处理
    if (isLogin) {
      message.info(getIn18Text('ZHENGZAIDENGLUZHANGHZ！'));
      return;
    }
    // 当前账号还存在
    if (systemApi.getCurrentUser()) {
      dispatch(setLoginModalData({ visible: false }));
      return;
    }
    // 当前账号退登了有需要重登的账号
    if (preAccount) {
      SiriusModal.error({
        title: getIn18Text('QUERENFANHUI\uFF1F'),
        content: `${getIn18Text('NINZHENGZAIDENGLUXZH，FHJCXDLZQDZH：')}${preAccount}`,
        onOk: async () => {
          const { pass } = await loginApi.doAutoLogin(preAccount);
          if (pass) {
            dispatch(setLoginModalData({ visible: false }));
            setLoginBlock(false);
          } else {
            message.error(getIn18Text('DENGLUSHIXIAO'));
            sendLogout();
          }
        },
      });
      return;
    }
    // 当前账号退登了无重登的账号
    sendLogout();
  }, [preAccount, isLogin]);

  return (
    <SiriusHtmlModal
      width={1280}
      visible
      destroyOnClose
      maskClosable={false}
      closable={false}
      keyboard={false}
      maskStyle={{ top: 0, left: 0 }}
      bodyStyle={{ borderRadius: '8px' }}
    >
      <div className={`extheme ${styles.loginPage}`} style={{ height: 768 }}>
        <div className={styles.loginPageLeft}>{process.env.BUILD_ISEDM ? <BannerWaimao /> : <Banner />}</div>
        <div className={styles.loginPageRight}>
          <LoginResetPwd
            type="addAccountModal"
            defaultVisibleLogin
            defaultAccount={defaultAccount}
            onLoginSuccess={() => {
              setLoginBlock(false);
              util.reload();
            }}
            onAfterLogout={() => {
              setPreAccount();
              setLoginBlock(true);
            }}
            onAfterLogin={() => {
              setIsLogin(false);
            }}
            onBeforeLogin={() => {
              setIsLogin(true);
            }}
          />
        </div>
        <div className={styles.loginModalCloseBtn} onClick={closeWindow}>
          {getIn18Text('GUANBI')}
        </div>
      </div>
    </SiriusHtmlModal>
  );
};

export default LoginModal;
