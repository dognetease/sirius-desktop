import { config } from 'env_def';
import { inWindow, isElectron } from '@/config';
import { api } from './api/api';
import implsList from './gen/impl_bg_list';
import { ApiManager } from './api_manager';
import { globalStoreConfig } from './api/data/store';

const localStorageWhiteList = [
  { name: 'mail_showMerged' },
  { name: 'aftersend_saveaddr' },
  { name: 'QuickReplyList', global: true },
  { name: 'RecentEmojiList', global: true },
  { name: 'notFirstOpenApp' },
  { name: 'im.richEditorHeight' },
  { name: 'disk_recently_welcome_tip_showed' },
  { name: 'disk_recently_external_share_tip_showed' },
  { name: 'disk_recently_create_tip_showed' },
  { name: 'disk_recently_unitable_create_tip_showed' },
  { name: 'disk_doc_create_tip_showed' },
  { name: 'mfDialogTipState' },
  { name: 'isFirstGet' },
  { name: 'unhandledNotificationCount' },
  { name: 'scheduleTabOpenInWindow' },
  { name: 'CALENDAR_VIEW_TYPE', global: true },
  { name: 'readRecentTip', global: true },
  { name: 'CATALOG_UNCHEDCKED_ID' },
  { name: 'showContact' },
  { name: 'mailTemplateRemind' },
  { name: 'last_use_font_name' },
  { name: 'last_use_font_size' },
  { name: 'last_use_line_height' },
  { name: 'perm_recall_mail' },
];

if (inWindow() && isElectron() && window.electronLib) {
  setTimeout(async () => {
    const sysApi = api.getSystemApi();
    const storeApi = api.getDataStoreApi();
    const accountKey = sysApi.md5(config('keyOfAccount') as string);
    storeApi.loadUser();
    const currentUser = storeApi.getCurrentUser();
    const currentNode = storeApi.getCurrentNode();
    const uuid = storeApi.getUUID();
    const { suc, data: logginedAccount } = storeApi.getSync(accountKey, globalStoreConfig);
    console.log('got from location ', window.location.href, ' data: \n', currentUser, currentNode, uuid, logginedAccount);
    // 遍历localStorage，并存储
    const localStorageObj: { [key: string]: any } = {};
    localStorageWhiteList.forEach(item => {
      const { name, global } = item;
      const res = global ? storeApi.getSync(name, globalStoreConfig) : storeApi.getSync(name);
      if (res?.suc) {
        localStorageObj[name] = {
          global,
          val: res.data,
        };
      }
    });
    window.electronLib.storeManage.set('account', 'localStorageData', JSON.stringify(localStorageObj));
    if (currentUser) {
      await window.electronLib.storeManage.set('account', 'info', JSON.stringify(currentUser));
    }
    if (currentNode && currentNode.length > 0) {
      await window.electronLib.storeManage.set('account', 'node', currentNode);
    }
    if (uuid && uuid.length > 0) {
      await window.electronLib.storeManage.set('account', 'uuid', uuid);
    }
    if (suc && logginedAccount && logginedAccount.length > 0) {
      const realData = await sysApi.decryptMsg(logginedAccount);
      await window.electronLib.storeManage.set('account', 'accounts', realData);
    }
    // window.electronLib.windowManage.createWindow({ type: 'main', additionalParams: { init: 'true' } }).then(() => {
    //   console.log('main window created, close current');
    //   if (config('stage') === 'prod') window.electronLib.windowManage.close({ force: true });
    // });
    // window.electronLib
  }, 0);
}
export const apiManager = new ApiManager(implsList);
