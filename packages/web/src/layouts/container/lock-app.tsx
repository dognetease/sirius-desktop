import React, { useEffect, useState } from 'react';
import { getIn18Text, SystemApi, apiHolder as api } from 'api';
import Styles from './lock-app.module.scss';
import { Button } from 'antd';
import Login from '@web-account/Login/index';
const systemApi = api.api.getSystemApi() as SystemApi;

const LockApp: React.FC<any> = () => {
  const [isUnlocking, setIsUnLocking] = useState<boolean>(false);

  const handleUnLock = () => {
    setIsUnLocking(true);
  };

  const handlerResetPasswordHandler = () => {
    console.log('handlerResetPasswordHandler');
  };

  const handleAppUnLockSuccess = () => {
    systemApi.unLockApp();
  };

  const hanleLoginBackClicked = () => {
    setIsUnLocking(false);
  };

  const getLockAccount = () => {
    const currentUser = systemApi.getCurrentUser();
    if (currentUser && currentUser.id) {
      const loginAccount = currentUser.loginAccount || currentUser.id;
      return loginAccount;
    }

    return '';
  };

  const lockAccount = getLockAccount();

  return (
    <div className={Styles.container}>
      <div className={Styles.wrapper}>
        {!isUnlocking && (
          <>
            <div className={Styles.lockIcon}></div>
            <div className={Styles.lockTitle}>{getIn18Text('LOCK_APP_TITLE_PRE') + lockAccount + getIn18Text('LOCK_APP_TITLE_POST')}</div>
            <div className={Styles.lockTip}>{getIn18Text('LOCK_APP_TIP')}</div>
            <div className={Styles.btnWrapper}>
              <Button type="primary" size="large" onClick={handleUnLock}>
                {getIn18Text('UNLOCK_BTN')}
              </Button>
            </div>
          </>
        )}
        {isUnlocking && (
          <Login
            type="unlockApp"
            initAccount={lockAccount}
            shouldShowBack={true}
            onBackClicked={hanleLoginBackClicked}
            onUnLockAppSuccess={handleAppUnLockSuccess}
            handlerResetPassword={handlerResetPasswordHandler}
            backStyle={{
              left: '20px',
              top: '15px',
            }}
          ></Login>
        )}
      </div>
    </div>
  );
};
export default LockApp;
