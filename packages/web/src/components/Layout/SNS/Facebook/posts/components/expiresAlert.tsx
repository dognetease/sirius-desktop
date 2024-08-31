import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { getTransText } from '@/components/util/translate';
import { apis, apiHolder, FacebookApi } from 'api';
import { FacebookActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import style from './expiresAlert.module.scss';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;
const eventApi = apiHolder.api.getEventApi();

const ExpiresAlert = () => {
  const { setFacebookModalShow } = useActions(FacebookActions);
  const [expiresVisible, setExpiresVisible] = useState(false);

  useEffect(() => {
    handleExpiresAccountFetch();
  }, []);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('facebookAccountExpires', {
      func: () => {
        setExpiresVisible(true);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('facebookAccountExpires', id);
    };
  }, []);

  const handleExpiresAccountFetch = () => {
    facebookApi.getExpiresAccount().then(expiresAccounts => {
      const nextExpiresVisible = (expiresAccounts || []).length > 0;
      setExpiresVisible(nextExpiresVisible);
    });
  };

  if (!expiresVisible) return null;
  return (
    <Alert
      className={style.expiresAlert}
      type="warning"
      showIcon
      closable
      message={
        <>
          {getTransText('BUFENZHANGHAOSHIXIAO')}
          <a onClick={() => setFacebookModalShow({ accModal: true })}>{getTransText('chongxinbangding')}</a>
        </>
      }
      afterClose={() => setExpiresVisible(false)}
    />
  );
};

export default ExpiresAlert;
