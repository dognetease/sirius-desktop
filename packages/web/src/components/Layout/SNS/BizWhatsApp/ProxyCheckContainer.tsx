import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { getIn18Text, apiHolder } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './ProxyCheckContainer.module.scss';

const storeApi = apiHolder.api.getDataStoreApi();

interface ProxyCheckContainerProps {
  resource: string;
  children: React.ReactElement;
}

const ProxyCheckNotRemind = 'ProxyCheckNotRemind';

const getResourceWithTimestamp = (resource: string) => {
  const url = new URL(resource);
  const searchParams = new URLSearchParams(url.search);
  searchParams.set('t', `${Date.now()}`);
  url.search = searchParams.toString();
  return url.toString();
};

const checkIsProxy = (resource: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = getResourceWithTimestamp(resource);
    img.onload = resolve;
    img.onerror = reject;
    setTimeout(reject, 3000);
  });
};

export const ProxyCheckContainer: React.FC<ProxyCheckContainerProps> = props => {
  const { resource, children } = props;
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleProxyCheck = () => {
    setChecking(true);

    checkIsProxy(resource)
      .then(() => {
        setVisible(false);
      })
      .catch(() => {
        const notRemind = storeApi.getSync(ProxyCheckNotRemind).data;
        setVisible(!notRemind);
      })
      .finally(() => {
        setChecking(false);
      });
  };

  useEffect(() => {
    handleProxyCheck();
  }, []);

  const handleNotRemind = () => {
    setVisible(false);
    storeApi.putSync(ProxyCheckNotRemind, '1');
  };

  return (
    <>
      {children}
      <Modal
        className={style.proxyCheckModal}
        visible={visible}
        width={430}
        title={getIn18Text('XITONGJIANCE\uFF1AIP DEZHIYICHANG')}
        keyboard={false}
        maskClosable={false}
        onCancel={() => setVisible(false)}
        footer={
          <div className={style.proxyCheckModalFooter}>
            <Button onClick={handleNotRemind}>{getIn18Text('BUZAITIXING')}</Button>
            <Button type="primary" loading={checking} onClick={handleProxyCheck}>
              {getIn18Text('ZAICIJIANCE')}
            </Button>
          </div>
        }
      >
        {getIn18Text('WANGLUOLIANJIEYICHANG，QINGNINZAIHEFADEHAIWAIWANGLUOLIANJIEHUANJINGXIAFANGWENCIFUWU')}
      </Modal>
    </>
  );
};
