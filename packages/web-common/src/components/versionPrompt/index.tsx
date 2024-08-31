import React, { useState, useEffect } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import imgdesktop from '@web-common/images/versionPromptDesktop.png';
import imgweb from '@web-common/images/versionPromptWeb.png';
import { ReactComponent as VersionPromptText } from '@web-common/images/versionPromptText.svg';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import styles from './versionPrompt.module.scss';
import { Button, Divider } from 'antd';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { apis, apiHolder, AccountApi, SystemApi, MailConfApi, EdmRoleApi } from 'api';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { useVersionCheck, setV1v2 } from '@web-common/hooks/useVersion';
import dayjs from 'dayjs';
import { useMount } from 'ahooks';

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const inElectron = apiHolder.env.forElectron;

interface IProps {
  // visible: boolean;
}

function VersionPrompt(props: IProps) {
  const [shouldShowVersionPrompt, setshouldShowVersionPrompt] = useState(false);
  const [closable, setclosable] = useState(true);
  const version = useAppSelector(state => state.privilegeReducer.version);
  let v1v2 = useVersionCheck();
  let localVerionPrompt = JSON.parse(localStorage.getItem('localVerionPrompt') || '{}');
  let today = dayjs().format('YYYY-MM-DD');

  useMount(() => {
    roleApi.getMenuWhitelist().then(res => {
      let isAlert = false;
      isAlert = localVerionPrompt[today] || false;
      if (res?.menuVersionAllNewSwitch || res?.menuVersionPartitionNewSwitch) {
        setshouldShowVersionPrompt(true);
        setclosable(false);
        return;
      }

      if (res?.popup && !isAlert && Object.keys(localVerionPrompt).length < res?.popupDays) {
        setshouldShowVersionPrompt(true);
      }
    });
  });

  const handleV1v2 = () => {
    localVerionPrompt[today] = true;
    localStorage.setItem('localVerionPrompt', JSON.stringify(localVerionPrompt));

    roleApi
      .setMenuListNew({
        menuVersion: 'NEW',
      })
      .then(() => {
        setV1v2('v2');
        // localStorage.setItem('v1v2', 'v2');
        setshouldShowVersionPrompt(false);

        if (inElectron && window.electronLib) {
          window.electronLib.appManage.reLaunchApp();
        } else {
          window?.location?.reload();
        }
      });
  };

  const handleCancel = () => {
    localVerionPrompt[today] = true;
    localStorage.setItem('localVerionPrompt', JSON.stringify(localVerionPrompt));

    setshouldShowVersionPrompt(false);
  };

  return (
    <Modal
      visible={version === 'WEBSITE' || v1v2 === 'v2' ? false : shouldShowVersionPrompt}
      onCancel={handleCancel}
      closable={closable}
      maskClosable={closable}
      bodyStyle={{ padding: 0 }}
      width={'auto'}
      footer={null}
    >
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <div className={styles.title}>全新外贸通导航上线了</div>
          <Divider />
          <div className={styles.desc}>
            <VersionPromptText />
          </div>

          <Button className={styles.btn} type="primary" onClick={handleV1v2}>
            <span>立即体验</span>
          </Button>
        </div>
        <div className={styles.right}>
          <img alt="新版" src={process.env.BUILD_ISELECTRON ? imgdesktop : imgweb} />
        </div>
      </div>
    </Modal>
  );
}

export { VersionPrompt };
