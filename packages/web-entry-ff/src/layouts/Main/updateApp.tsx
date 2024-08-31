import React from 'react';
import style from './updateApp.module.scss';
import { apiHolder, apis, UpgradeAppApi, AppDescParmas, DataTrackerApi } from 'api';
import { getIn18Text } from 'api';

const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as UpgradeAppApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
function trackUpdateIconClickEvent() {
  try {
    trackApi.track('pc_click_update_leftSideBar');
  } catch (ex) {
    console.error(`trackUpdateIconClickEvent error`, ex);
  }
}
interface IUpdateAppProps {
  // updateInfo?: AppDescParmas;
}
const UpdateApp: React.FC<IUpdateAppProps> = () => {
  if (!window || !window.electronLib) {
    return null;
  }
  const showNewVersionDesc = async () => {
    trackUpdateIconClickEvent();
    const data = upgradeAppApi.getPendingUpdateInfo();
    if (data) {
      upgradeAppApi.showNewVersionAppDescDialog({ ...data, forcePopup: true });
    }
  };
  return (
    <div className={style.updateApp} onClick={showNewVersionDesc}>
      <div className={style.updateAppIcon} />
      <div className={style.updateAppText}>{getIn18Text('BANBENSHENGJI')}</div>
    </div>
  );
};
export default UpdateApp;
