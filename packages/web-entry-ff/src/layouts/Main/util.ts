import { apiHolder, configKeyStore } from 'api';

const inElectron = apiHolder.api.getSystemApi().isElectron;
const storeApi = apiHolder.api.getDataStoreApi();
const scheduleTabOpenInWindow = configKeyStore['scheduleTabOpenInWindow'];
const systemApi = apiHolder.api.getSystemApi();

export const navigateToSchedule = (frameNavCallback?: Function) => {
  const keyHolder = storeApi.getSync(scheduleTabOpenInWindow.keyStr);
  if (inElectron() && keyHolder && keyHolder.suc && keyHolder.data && keyHolder.data === 'true') {
    systemApi.createWindow('schedule');
    return true;
  }
  return frameNavCallback && frameNavCallback();
};
