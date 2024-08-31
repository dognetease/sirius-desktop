import styles from './index.module.scss';
import { Button, Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import React from 'react';
import { api, apis, ContactAndOrgApi, isElectron, getIn18Text, DbApiV2 } from 'api';

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const dbApi = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
const systemApi = api.getSystemApi();

const SystemOptimize: React.FC<{}> = () => {
  const optimizeContact = async () => {
    message.loading({
      content: getIn18Text('TONGXUNLUYOUHUAHZONG'),
      duration: 120,
    });

    try {
      await contactApi.deleteTrashContactByManual();
    } catch (ex) {
      console.warn('[systemoptimize]optimizeContact.failed', ex);
    }

    message.destroy();
    message.success({
      content: [getIn18Text('TONGXUNLUYOUHUAWANCHENG'), isElectron() ? getIn18Text('TONGXUNLUYOUHUARECLIENTLOADTIP') : getIn18Text('TONGXUNLUYOUHUAREWEBLOADTIP')].join(
        ','
      ),
      duration: 2,
    });

    setTimeout(() => {
      if (process.env.BUILD_ISELECTRON) {
        systemApi.reLaunchApp();
      } else {
        window.location.reload();
      }
    }, 2000);
  };

  const deleteLocalDbNames = async () => {
    const dbnames = await dbApi.getTotalDatabaseNames(true);
    return Promise.all(
      dbnames.map(dbName => {
        dbApi.deleteDB(dbName);
      })
    );
  };

  const optimizeAll = async () => {
    await new Promise((resolve, reject) => {
      Modal.confirm({
        title: getIn18Text('QUANJUYOUHUAHOUXYZQKHD,SFLJYH'),
        okText: getIn18Text('LIJIYOUHUA'),
        cancelText: getIn18Text('QUXIAO'),
        onOk(close) {
          resolve(true);
          close();
        },
        onCancel(close) {
          reject();
          close();
        },
      });
    });
    message.loading({
      content: getIn18Text('QUANJUYOUHUAZHONG...'),
      duration: 120,
    });

    if (process.env.BUILD_ISELECTRON) {
      try {
        await deleteLocalDbNames();
      } catch (ex) {
      } finally {
        systemApi.reLaunchApp();
      }
    } else {
      try {
        await deleteLocalDbNames();
      } catch (ex) {
      } finally {
        window.location.reload();
      }
    }
  };

  return (
    <div className={styles.configContentCheckbox}>
      {/* <div className={styles.configContentCheckboxTitle}>系统优化</div> */}
      <div className={styles.configContentCheckboxTitle}>{getIn18Text('XITONGYOUHUA')}</div>

      <div className={styles.configContentCheckbox}>
        {/* {isElectron() ?<Button onClick={optimizeAll}>全局优化</Button>:null} */}
        <Button className={styles.configContentButton} onClick={optimizeContact}>
          {getIn18Text('TONGXUNLUYOUHUA')}
        </Button>
        <Button className={styles.configContentButton} onClick={optimizeAll}>
          {getIn18Text('QUANJUYOUHUA')}
        </Button>
      </div>
    </div>
  );
};

export default SystemOptimize;
