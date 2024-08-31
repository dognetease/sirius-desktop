/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { apiHolder, DataTrackerApi, apis, UpgradeAppApi, AppDescParmas, IgnoreUpdateInfoType, getIn18Text } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import UpgradeModal from '@web-common/components/UI/UpgradeModal';
import Button from '@web-common/components/UI/Button';
import UpgradeConfirmModal from '@/components/Electron/Upgrade/confirmModal';

const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as UpgradeAppApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi();
interface Props {
  upgradeInfo: AppDescParmas;
  setVisibleUpgradeApp?: (visible: boolean) => void;
}

// const eventApi = apiHolder.api.getEventApi();
function trackButtonClickEvent(buttonName: string) {
  try {
    trackApi.track('pc_click_button_updatePage', buttonName ? { buttonName } : undefined);
  } catch (ex) {
    console.error('trackEvent error', ex);
  }
}

function trackIgnoreUpdate(ignoreType?: string) {
  try {
    trackApi.track('pc_ignore_update_app', { ignoreType });
  } catch (ex) {
    console.error('trackIgnoreUpdate error', ex);
  }
}

function trackUpdateErrorEvent(errorType?: string, errorMsg?: string) {
  try {
    trackApi.track('pc_update_app_error', {
      errorMsg: errorMsg || null,
      errorType: errorType || null,
    });
  } catch (ex) {
    console.error('trackUpdateErrorEvent-catch', ex);
  }
}

let isInstalling = false;
const UpgradeApp: React.FC<Props> = props => {
  const { upgradeInfo: propUpgradeInfo, setVisibleUpgradeApp } = props;

  const [visible, setVisible] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  if (!process.env.BUILD_ISELECTRON) {
    return null;
  }
  const [upgradeInfo, setUpgradeInfo] = useState<AppDescParmas>(propUpgradeInfo);
  const [isInstallingInCompent, setIsInstallingInComponent] = useState<boolean>(isInstalling);
  useEffect(() => {
    setUpgradeInfo(propUpgradeInfo);
  }, [propUpgradeInfo]);

  if (!upgradeInfo) {
    return null;
  }

  const checkUpdateAndQuit = (YMLFileUrl: string) => {
    upgradeAppApi.checkAndDownLoadByYMLFile(YMLFileUrl as string).then(res => {
      if (res?.success && !res.errorType) {
        window.electronLib.appManage.quitAndInstallUpdate();
      } else {
        trackUpdateErrorEvent(res?.errorType, res?.errMsg);
        let errorText = '';
        if (res?.errorType) {
          const errorMap = {
            GET_YML_ERROR: '获取更新配置出错',
            DOWNLOAD_ERROR: '校验更新包出错',
            CHECK_YML_ERROR: '更新配置内容错误',
          };
          errorText = errorMap[res?.errorType as keyof typeof errorMap];
        }
        // 校验本地文件出错，报错即可
        message.error({
          content: errorText || getIn18Text('BENDEGENGXINWEN'),
        });
        upgradeAppApi.doUpdateCheck({ forcePopup: true });
      }
    });
  };

  const installNewApp = async () => {
    try {
      setIsInstallingInComponent(true);
      isInstalling = true;
      if (process.env.BUILD_ISELECTRON) {
        upgradeAppApi.writeAppReloadUpdateInfo();
        checkUpdateAndQuit(upgradeInfo.YMLFileUrl as string);
      }
    } catch (ex) {
      setIsInstallingInComponent(false);
      isInstalling = false;
      console.error(ex);
      message.error({
        content: getIn18Text('ANZHUANGSHIBAI\uFF0C'),
      });
    }
  };
  const showIgnoreReason = (ignoreUpdateInfo: IgnoreUpdateInfoType) => {
    if (ignoreUpdateInfo.ignoreUpdate) {
      const ignoreReason = ignoreUpdateInfo.ignoreReason;
      const ignoreReasonTextMap = {
        NO_APPLICATIONS_FOLDER: '因Mac系统的限制，无法更新，请移动应用到“应用程序”目录下',
        NO_SIGNED_PACKAGE: '当前程序未签名，因Mac系统的限制，无法更新，请手动下载新版应用',
        MSI_BUILD: getIn18Text('MSI_NO_UPDATE_TIP'),
      };
      const ignoreText = ignoreReason ? ignoreReasonTextMap[ignoreReason] : '无法更新，请手动下载新版应用';
      if (ignoreText) {
        message.info({
          content: ignoreText,
        });
      }
    }
  };

  const handleIgnoreUpdateInfo = async () => {
    try {
      const ignoreUpdateInfo = await upgradeAppApi.getShouldIgnoreUpdateInfo();
      if (ignoreUpdateInfo && ignoreUpdateInfo.ignoreUpdate) {
        showIgnoreReason(ignoreUpdateInfo);
        trackIgnoreUpdate(ignoreUpdateInfo.ignoreReason);
        return true;
      }
      return false;
    } catch (ex: any) {
      console.error('handleIgnoreUpdateInfo ex', ex);
      return false;
    }
  };

  const install = async () => {
    if (isInstallingInCompent) {
      return;
    }
    setIsInstallingInComponent(true);
    const ignoreUpdate = await handleIgnoreUpdateInfo();
    if (ignoreUpdate) {
      setIsInstallingInComponent(false);
      return;
    }
    trackButtonClickEvent('立即更新');
    installNewApp();
  };

  const installNewAppLater = async () => {
    if (process.env.BUILD_ISELECTRON) {
      upgradeAppApi.writeAppReloadUpdateInfo();
      // 需要重新检查更新
      if (upgradeInfo.isLaterUpdate) {
        upgradeAppApi.checkAndDownLoadByYMLFile(upgradeInfo.YMLFileUrl);
      }
    }
  };

  const installLater = async () => {
    if (isInstallingInCompent) {
      return;
    }
    setIsInstallingInComponent(true);
    const ignoreUpdate = await handleIgnoreUpdateInfo();
    if (ignoreUpdate) {
      setIsInstallingInComponent(false);
    } else {
      installNewAppLater();
      trackButtonClickEvent('稍后更新');
      upgradeAppApi.writeAppPendingUpdateInfo({ ...upgradeInfo, isLaterUpdate: true });
    }
    setVisibleUpgradeApp && setVisibleUpgradeApp(false);
  };

  const closeDialog = () => {
    trackButtonClickEvent('关闭');
    if (!systemApi.isMsiBuild) {
      upgradeAppApi.writeAppPendingUpdateInfo({ ...upgradeInfo, isLaterUpdate: true });
    }
    setVisibleUpgradeApp && setVisibleUpgradeApp(false);
  };

  const tryInstall = async () => {
    if (isInstallingInCompent) {
      return;
    }
    trackButtonClickEvent('尝试安装更新');
    try {
      installNewApp();
    } catch (ex) {
      console.error('tryInstall error', ex);
    }
  };

  const onConfirmCancel = () => {
    closeDialog();
    setTimeout(() => {
      setVisible(true);
    }, 1000);
  };

  const beforeTryInstall = () => {
    setVisible(false);
    setConfirmModalVisible(true);
  };

  const isWin = !window.electronLib.env.isMac;
  const winUserNoAdmin = isWin && !upgradeInfo.hasAdimUserGroup;

  const updateBtn = () => {
    let res = (
      <Button btnType="primary" size="large" onClick={install} loading={isInstallingInCompent}>
        {getIn18Text('LIJIGENGXIN')}
      </Button>
    );
    if (systemApi.isMsiBuild) {
      res = (
        <>
          <Button onClick={closeDialog} size="large" disabled={isInstallingInCompent}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button btnType="primary" size="large" onClick={install} loading={isInstallingInCompent}>
            {getIn18Text('LIJIGENGXIN')}
          </Button>
        </>
      );
    } else if (winUserNoAdmin) {
      res = (
        <>
          <Button onClick={closeDialog} size="large" disabled={isInstallingInCompent}>
            {getIn18Text('GUANBI')}
          </Button>
          <Button btnType="primary" onClick={beforeTryInstall} size="large" loading={isInstallingInCompent}>
            {getIn18Text('LIJIGENGXIN')}
          </Button>
        </>
      );
    } else if (!upgradeInfo.force) {
      res = (
        <>
          <Button onClick={installLater} size="large" disabled={isInstallingInCompent}>
            {getIn18Text('SHAOHOUGENGXIN')}
          </Button>
          <Button btnType="primary" onClick={install} size="large" loading={isInstallingInCompent}>
            {getIn18Text('LIJIGENGXIN')}
          </Button>
        </>
      );
    }
    return res;
  };
  return (
    // <div className="update-container">
    //   <div className="update-wrap">
    //     <div className="update-title">{upgradeInfo.title || '发现新版本'}</div>
    //     <div className="update-content">
    //       {winUserNoAdmin ? <div className="update-tip">{getIn18Text('FAXIANXINBANBEN')}</div> : null}
    //       {(upgradeInfo.description && upgradeInfo.description.length ? upgradeInfo.description : ['1、若干功能优化']).map(item => (
    //         <div className="desc-item">{item}</div>
    //       ))}
    //     </div>
    //     <div className="update-btn">{updateBtn()}</div>
    //   </div>
    // </div>
    <>
      <UpgradeModal visible={visible} title={upgradeInfo.title} contentList={upgradeInfo.description} updateBtn={updateBtn()} showClose={false} onClose={installLater} />
      <UpgradeConfirmModal visible={confirmModalVisible} loading={isInstallingInCompent} onConfirm={tryInstall} onCancel={onConfirmCancel} />
    </>
  );
};
export default UpgradeApp;
