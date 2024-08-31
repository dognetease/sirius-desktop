import { util, isElectron as forElectron, NIMApi, apiHolder, getOs, DataStoreApi } from 'api';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const setMinimizeGlobalShortcutUI = apiHolder.api.getSystemApi().setMinimizeGlobalShortcutUI;
const isElectron = forElectron();
const isMac = getOs() === 'mac';

const initMinimize = () => {
  const command = util.getCommonTxt();
  const storeMinimizeShortcut = dataStoreApi.getSync('minimizeShortcut').data;
  const initMinimizeShortcutDefault = isMac ? `${command} M` : `${command} Shift M`;
  let initMinimizeShortcut = storeMinimizeShortcut || initMinimizeShortcutDefault;
  if (initMinimizeShortcut === 'noncapture') initMinimizeShortcut = '';
  const oldMinimizeShortcut = util.storeShortcutTransform(initMinimizeShortcut || '');
  setMinimizeGlobalShortcutUI({ oldShortcut: oldMinimizeShortcut, newShortcut: oldMinimizeShortcut });
};

const globalKeyInit = () => {
  if (!isElectron) return;
  initMinimize();
};

export default globalKeyInit;
