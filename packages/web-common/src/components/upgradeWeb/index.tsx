import React, { useEffect, useMemo, useState } from 'react';
import { apiHolder, DataStoreApi, IntervalEventParams } from 'api';
import { config } from 'env_def';
import Button from '@web-common/components/UI/Button';
import UpgradeModal from '@web-common/components/UI/UpgradeModal';
import { compareWmVersion } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi();
const storageApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const LOCAL_KEY = 'newUpgradeWeb';
const currentVersion = window.getSpConf('version') as string;

// Web端要弹出升级提示必须同时满足以下两种情况：
// ① 本地没有弹出记录，或者服务端版本号 > 本地记录弹出的版本号
// ② 服务端版本 >= 当前版本

// 弹出之后又分为两种情况
// ① 服务端版本 === 当前版本，对应UI为弱提醒
// ② 服务端版本 > 当前版本，对应UI为强提醒

const UpgradeWeb: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [serverVersion, setServerVersion] = useState('');
  const [contentList, setContentList] = useState<string[]>([]);

  const isServerVersionNewer = useMemo(() => {
    if (serverVersion && currentVersion) {
      return compareWmVersion(serverVersion, currentVersion) === 1;
    }
    return false;
  }, [serverVersion]);
  const title = useMemo(() => (serverVersion ? `发现新版本V${serverVersion}` : '发现新版本'), [serverVersion]);

  const checkVersion = async () => {
    const url = config('newUpgradeWeb') as string;
    return httpApi
      .get(url, {
        appName: 'lingxibanggong-waimao',
        version: '1.1.1',
      })
      .then(res => res.data)
      .then(res => {
        const localData = storageApi.getSync(LOCAL_KEY, { noneUserRelated: true })?.data;
        const localDataObj = localData ? JSON.parse(localData) : {};
        const localVersion = localDataObj.version || '';

        if (res?.data?.version) {
          const serverVersion = res.data.version || '';
          // 本地没有弹出记录，或者服务端版本号 > 本地记录弹出的版本号
          const localInvalid = !localVersion || compareWmVersion(serverVersion, localVersion) > 0;
          // 服务端版本 >= 当前版本
          const isServerVersionNewOrEqual = compareWmVersion(serverVersion, currentVersion) >= 0;
          // 以上都满足，才会弹出弹窗
          if (localInvalid && isServerVersionNewOrEqual) {
            // 记录到本地
            storageApi.putSync(LOCAL_KEY, JSON.stringify({ version: serverVersion }), { noneUserRelated: true });
            setVisible(true);
            setServerVersion(res.data.version);
            setContentList(res.data.popupDescriptionList);
          }
        }
      })
      .catch(err => {
        console.log('upgrade web error', err);
      });
  };

  // checkUpgrade
  useEffect(() => {
    const upgradeWebCheckHandle: IntervalEventParams = {
      id: 'upgradeWebCheck',
      eventPeriod: 'long',
      seq: 0,
      handler: () => {
        checkVersion();
      },
    };
    checkVersion();
    const interval = systemApi.intervalEvent(upgradeWebCheckHandle);
    return () => {
      if (interval) {
        systemApi.cancelEvent('long', interval);
      }
    };
  }, []);

  const onUpdate = () => {
    if (isServerVersionNewer) {
      window?.location?.reload();
    } else {
      setVisible(false);
    }
  };

  const onClose = () => {
    setVisible(false);
  };

  const UpdateBtn = (
    <Button btnType="primary" size="large" onClick={onUpdate}>
      {isServerVersionNewer ? '立即更新' : '我知道了'}
    </Button>
  );

  return <UpgradeModal visible={visible} title={title} contentList={contentList} updateBtn={UpdateBtn} showClose={!isServerVersionNewer} onClose={onClose} />;
};

export default UpgradeWeb;
