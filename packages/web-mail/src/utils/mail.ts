import { apiHolder as api, apis, MailConfApi, MailEntryModel, MailFileAttachModel, AccountApi, MailApi, MailContentType, DataTrackerApi } from 'api';
import { folderIdIsContact, isCustomFolder } from './folder';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { GetUniqKey, MailStore } from '../types';
import { SendingMail } from '@web-common/state/reducer/mailReducer';
import { FLOLDER, MAIL_TAG_HOTKEY_LOCAL_KEY } from '@web-mail/common/constant';
import { stringMap } from '@web-mail/types';
import { MailSign, PreHeader, MailSignEnt, SocialLink, UnSubText, MailPreMailContent, MailForwardContent } from './mailClassnameConstant';

const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.api.getSystemApi();
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storageApi = api.api.getDataStoreApi();
const inElectron = systemApi.isElectron();
/**
 * 判断id是否在集合中
 */

export const mailIdinList = (mid, list) => {
  if (typeof mid === 'string' && list.length === 1 && mid === list[0]) {
    return true;
  }
  if (Array.isArray(mid) && mid.length === list.length && mid.every(id => list.includes(id))) {
    return true;
  }
  return false;
};

// 待迁移
/*
 * 合并两个有邮件区间
 * 动态计算偏移量,向下拼接邮件列表-防止邮件区间移动导致的列表重复
 * 只能解决前部邮件增加，前区间邮件减少只能依赖于同步消息
 */
export const asyncMailList = (argMailList, sliceList) => {
  if (!asyncMailList || !sliceList) return [];
  const min = argMailList.length - sliceList.length;
  if (argMailList.length === 0 || sliceList.length === 0) {
    return [...argMailList, ...sliceList];
  }
  let offset = 0;
  for (let i = argMailList.length - 1; i >= min; i--) {
    const curMail = argMailList[i];
    if (curMail?.entry?.id === sliceList[0]?.entry?.id) {
      offset += 1;
      break;
    }
    offset += 1;
  }
  if (offset === sliceList.length) {
    return [...argMailList, ...sliceList];
  }
  return [...argMailList, ...sliceList.slice(offset)];
};

// 待迁移
/**
 * 根据当前操作的ids，激活的id，选择下一个可以激活的邮件id
 * @param mailList 邮件列表
 * @param selectedIds 选中的邮件id列表
 * @param activeId 激活的邮件id
 * @returns
 */
export const getCanActiveMailId = (mailList, selectedIds, activeId) => {
  const mailId2Index = {};
  const index2MailId = {};
  const selectedMap = {};
  selectedIds.forEach(item => {
    selectedMap[item] = true;
  });
  mailList.forEach((mail, index) => {
    mailId2Index[mail.entry.id] = index;
    index2MailId[index] = mail.entry.id;
  });
  let resMailId = null;
  let resMailIndex = null;
  // 如果激活id不在选中列表里-返回activeId
  if (!selectedIds.includes(activeId)) return [activeId, mailId2Index[activeId]];
  // 从当前激活的id-index向下一路查找，找到第一个不在操作列表中的id
  for (let i = mailId2Index[activeId]; i < mailList.length; i++) {
    const curMailId = index2MailId[i];
    if (!selectedMap[curMailId]) {
      resMailId = curMailId;
      resMailIndex = i;
      break;
    }
  }
  // 如果向下都找不到-则向上查找
  if (resMailId == null && resMailIndex == null) {
    for (let i = mailId2Index[activeId]; i >= 0; i--) {
      const curMailId = index2MailId[i];
      if (!selectedMap[curMailId]) {
        resMailId = curMailId;
        resMailIndex = i;
        break;
      }
    }
  }
  // 如果都找不到,则返回空
  return [resMailId, resMailIndex];
};

// todo，该方案需要删除
// 极端邮件列表中邮件的高度
const itemHeight = 63;
const attachHeight = 32;
const statusHeight = 24;

export const getMailListRowHeight = (mail: MailEntryModel, isSearching: boolean = false): number => {
  if (mail) {
    let height = itemHeight;
    if (mail && mail.entry.attachment?.length) {
      let attachment: MailFileAttachModel[] = [];
      attachment = mail.entry.attachment?.filter(item => item.inlined == false && item.fileType !== 'ics' && item.type !== 'netfolder');
      if (attachment.length) {
        height += attachHeight;
      }
    }
    if (mail && mail.entry.sendStatus) {
      height += statusHeight;
    }
    // 发件箱，已读未读数有值则展示
    if (mail && mail.entry.folder == 3 && (mail.entry.rcptCount || mail.entry.readCount)) {
      height += 25;
    }
    /**
     * 邮件列表在需求变更后也显示邮件摘要了，不需要通过搜索状态来区分高度了
     */
    // if (isSearching) {
    height += 23;
    // }
    return height + 1;
  }
  return 0;
};

// 待迁移
/**
 * 获取当前列表中Top邮件所占的总高度
 * 注意：请保证列表中top邮件出现在列表顶部
 * 否则计算的高度没有意义，造成后续的定位错误
 */
export const getTopMailSumHeight = mailDataList => {
  let offset = 0;
  mailDataList.forEach(mail => {
    if (mail.entry.top) {
      offset += getMailListRowHeight(mail);
    }
  });
  return offset;
};

// todo: 待迁移
/**
 * 文件夹id是否需要按照top邮件排序
 * // -1 红旗，4 已删除 5 垃圾邮件 -199 标签搜索
 * todo： 该方法已迁移并且变更，需要清理和替换该方法
 */
// export const folderCanSortByTop = fid => fid && !folderIdIsContact(fid) && fid != FLOLDER.DELETED  && fid != FLOLDER.SPAM && fid > 0;

/**
 * 极端列表中top邮件的总数
 */
// 待迁移
export const getTopMailNum = (mailList: MailEntryModel[]): number => {
  let topCount = 0;
  mailList.forEach(item => {
    if (item.entry.top) {
      topCount += 1;
    }
  });
  return topCount;
};

// 待移动
/**
 * 判断有配置中是否处于聚合模式
 */

export const mailConfigStateIsMerge = (): boolean => mailConfApi.getMailMergeSettings() == 'true';

// 待移动
/**
 * 结合当前选中文件夹，判断是否可以进入聚合功能
 * @param fid
 * @param isSearching
 * @returns
 */
//(fid = 1为收件箱 fid > 20为用户自定义文件夹)
// export const mailLogicStateIsMerge = (fid: string | number, accountId: string, isSearching: boolean): boolean => {
//   const email = systemApi.getCurrentUser()?.id;
//   const isMainAccount = !accountId || accountId === email;
//   return typeof fid === 'number' && mailConfigStateIsMerge() && (fid === 1 || fid > 20 || fid === -199 || fid === -1 || fid === -4) && !isSearching && isMainAccount;
// };

export const mailLogicStateIsMerge = (fid: string | number, accountId?: string, isSearching?: boolean): boolean => {
  const email = systemApi.getCurrentUser()?.id;
  const isMainAccount = !accountId || accountId === email;

  // 检查 fid 是否可以转换为一个整数
  if (Number.isInteger(fid)) {
    return (
      mailConfigStateIsMerge() &&
      (fid === FLOLDER.DEFAULT || (fid as number) > 20 || fid === FLOLDER.TAG || fid === FLOLDER.REDFLAG || fid === FLOLDER.UNREAD) &&
      !isSearching &&
      isMainAccount
    );
  }

  return false;
};
/**
 * 顾虑标签中的系统级标签
 */
export const filterSysMailTag = (mail: MailEntryModel): MailEntryModel => {
  try {
    if (mail && mail.tags) {
      return {
        ...mail,
        tags: mail.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%')),
      };
    }
  } catch (e) {
    console.error('[ filterSysMailTag Error]', e);
  }
  return mail;
};

// 待迁移
/**
 * 邮件列表的融合
 * 在mailList中查找合适的位置，将lastMailList接回去
 * todo:待完整测试
 */
export const conactMailList = (mailList = [], lastMailList = []) => {
  let list = [...mailList];
  const listMap = {};
  mailList.forEach((item, index) => {
    const { id } = item.entry;
    if (id) {
      listMap[item.entry.id] = [index];
    }
  });
  // 动态的确定lastMailList的接头部分
  if (mailList && mailList.length) {
    for (let i = 0; i < lastMailList.length; i++) {
      const id = lastMailList[i]?.entry?.id;
      if (!listMap[id]) {
        const index = i - 1;
        if (index >= 0) {
          const preId = lastMailList[index]?.entry?.id;
          if (preId && listMap[preId]) {
            const [preIndex] = listMap[preId];
            if (preIndex) {
              list = [...mailList.slice(0, preIndex), ...lastMailList.slice(index)?.filter(item => !listMap[item.entry.id])];
              return list;
            }
          }
        }
      }
    }
  }
  // 如果对比结果发现全都不一致
  return [...mailList, ...lastMailList.filter(item => !listMap[item.entry.id])];
};

/**
 * 邮件列表-根据选中的文件夹-获取列表是否展示二级tab
 */
export const isShowMailListTapByFolderId = (folderId: number, isSeaching: boolean = false) => {
  if (isSeaching) {
    return folderId == 1 || folderId == -33 || folderId >= 17;
  }
  return folderId == 1 || (folderId >= 17 && folderId != -199);
};

/**
 * 根据邮件id判断邮件的类型
 */
export const idIsTreadMail = (id: string): boolean => {
  if (id) {
    try {
      const mailIdReg = /\d+/;
      const [realId] = id.split('--') || [''];
      const [res] = mailIdReg.exec(realId) || [null];
      if (res && res.length === realId.length) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
  return false;
};

// 获取邮件的key
export const getMailKey: GetUniqKey<MailEntryModel> = (index, mail) => {
  if (mail && mail.entry && mail.entry.id) {
    return mail.entry.id;
  }
  return index + '';
};

/**
 * 新窗口打开邮件
 */
export const openMailInWinow = (mail: MailEntryModel) => {
  const { id, _account, isTpMail, owner } = mail;
  if (id) {
    const isThread = idIsTreadMail(id);
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData(
        { type: 'readMail', additionalParams: { account: _account } },
        {
          eventName: 'initPage',
          eventData: { id: id, accountId: _account, isTpMail, owner },
          eventStrData: isThread ? 'isthread' : '',
        }
      );
    } else {
      window.open(
        `${systemApi.getContextPath()}/readMail/?id=${id}${_account ? '&account=' + _account : ''}${isThread ? '&isthread=1' : ''}${isTpMail ? '&isTpMail=1' : ''}${
          owner ? '&owner=' + owner : ''
        }`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  }
};

/**
 * 新窗口只读打开邮件 - 通用
 */
export const openReadOnlyUniversalInWindow = (mid: string, account: string = '') => {
  if (mid) {
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData(
        { type: 'readOnlyUniversal', additionalParams: { account } },
        { eventName: 'initPage', eventData: { mid }, eventStrData: '', _account: account }
      );
    } else {
      window.open(`${systemApi.getContextPath()}/readOnlyUniversal/?id=${mid}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  }
};

/**
 * 新窗口只读打开邮件 - IM
 */
export const openReadOnlyMailInWinow = (mid: string, teamId: string) => {
  if (mid && teamId) {
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData(
        { type: 'readMailReadOnly', additionalParams: { account: '' } },
        { eventName: 'initPage', eventData: { mid, teamId }, eventStrData: '', _account: '' }
      );
    } else {
      window.open(`${systemApi.getContextPath()}/readMailReadOnly/?id=${mid}&teamId=${teamId}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  }
};

/**
 * 获取邮件数组中的id
 */
export const getMailIdFromList = (mailList: MailEntryModel[]): string[] => {
  try {
    if (mailList && mailList.length) {
      return mailList.map(item => item?.entry?.id);
    }
  } catch (e) {
    console.error('getMailIdFromList error', e);
  }
  return [];
};

// 撤销时 重新打开邮件
export const reOpenMail = async (item: SendingMail) => {
  const { id, source, optSenderStr } = item;
  const openParams = {
    id,
    mailType: 'draft' as MailContentType,
    writeType: 'editDraft',
    withoutPlaceholder: true,
    optSenderStr: optSenderStr,
  };
  // 用新窗口打开
  if (inElectron && source === 'writeMail') {
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    const params = {
      ...openParams,
      writeWay: 'newWin', // 以新窗口形式打开
      _account: mainAccount,
    };
    // accountApi.setCurrentAccount({ email: mainAccount });
    mailApi.callWriteLetterFunc(params);
    message.success({ content: '已撤销发送' });
    return;
  }
  // 新tab打开
  mailApi.callWriteLetterFunc(openParams);
  message.success({ content: '已撤销发送' });
};

/**
 * 根据邮件id从store中组合出邮件model List
 */
export const getMailListByIdFromStore = (idList: string[], mailStore: MailStore): MailEntryModel[] => {
  try {
    if (mailStore && idList && idList.length) {
      return idList.map(id => mailStore[id])?.filter(item => item) || [];
    }
  } catch (e) {
    console.error('getMailListByIdFromStore error', e);
  }
  return [];
};

export const getCheckedMails = (activeIds?: string[], mailList?: MailEntryModel[]): MailEntryModel[] => {
  const list: MailEntryModel[] = [];
  if (activeIds && mailList) {
    activeIds.forEach(_id => {
      const mail = mailList.find(item => item.entry.id === _id);
      mail && list.push(mail);
    });
  }
  return list;
};

/**
 * 邮件翻译-拼接用于存储的字符串
 */
export const combineContent = (title: string, content: string) => {
  return title + '<headm></headm>' + content;
};

/**
 * 邮件翻译-切割用于存储的字符串
 */
export const splitContent = (condition: string) => {
  try {
    return condition.split('<headm></headm>');
  } catch (e) {
    console.error(e);
  }
  return [];
};

/**
 * 邮件翻译-组装对应的model
 */
export const changeContentByLocal = (toLang: string, comContent: string, content: MailEntryModel): MailEntryModel => {
  try {
    const langListMap = content.entry.langListMap || {};
    const newContent = {
      ...content,
      entry: {
        ...content.entry,
        langListMap: {
          ...langListMap,
        },
        content: {
          ...content.entry.content,
        },
      },
    };
    if (!newContent.entry.langListMap?.origin) {
      newContent.entry.langListMap.origin = combineContent(newContent.entry.title, newContent.entry.content.content);
    }
    const [titleStr, contentStr] = splitContent(comContent);
    if (titleStr != null) {
      newContent.entry.title = titleStr;
    }
    if (contentStr != null) {
      newContent.entry.content.content = contentStr;
    }

    newContent.entry.langType = toLang;
    if (newContent.entry.langListMap && !newContent.entry.langListMap[toLang]) {
      newContent.entry.langListMap[toLang] = comContent;
    }
    return newContent;
  } catch (e) {
    console.error(e);
  }
  return content;
};

/**
 * 根据promise判断是否超时，进行打点上报
 */
// const DEFAULT_MAX_TIMEOUT = 10000;
// export const promiseIsTimeOut = <T>(pr: Promise<T>, name: string, config?: Object): Promise<T> => {
//   // 检测promise对象是否合法
//   if (pr && pr.then != null && pr.finally != null) {
//     const key = setTimeout(() => {
//       const resConfig = config ? { ...config, timeout: MAX_TIMEOUT } : { timeout: MAX_TIMEOUT };
//       trackApi.track(name, resConfig);
//     }, MAX_TIMEOUT);
//     pr.finally(() => {
//       clearTimeout(key);
//     });
//   }
//   return pr;
// };
const DEFAULT_TIMEOUT_LIST = [5000, 10000];

export const promiseIsTimeOut = <T>(pr: Promise<T>, name: string, config?: Object, timeoutConfigs?: number[]): Promise<T> => {
  // 检测promise对象是否合法
  if (pr && pr.then != null && pr.finally != null) {
    const timeoutIds: NodeJS.Timeout[] = [];
    for (const timeout of timeoutConfigs ?? DEFAULT_TIMEOUT_LIST) {
      const key = setTimeout(() => {
        const resConfig = config ? { ...config, timeout } : { timeout };
        trackApi.track(name, resConfig);
      }, timeout);
      timeoutIds.push(key);
    }
    pr.finally(() => {
      for (const id of timeoutIds) {
        clearTimeout(id);
      }
    });
  }
  return pr;
};

/**
 * 从localStoreage获取状态
 */
export const getStateFromLocalStorage = <T>(stateName: string): T | null => {
  try {
    const serializedState = storageApi.getSync(stateName)?.data;
    if (serializedState) {
      return JSON.parse(serializedState) as T;
    }
    return null;
  } catch (err) {
    // console.error(`[ Hook Error useUserLocalStorageState ]Error getting state ${stateName} from localStorage:`, err);
    return null;
  }
};

/**
 * 分用户写入localStoreage
 */
export const setStateToLocalStorage = <T>(stateName: string, state: T): void => {
  try {
    const serializedState = JSON.stringify(state);
    storageApi.putSync(stateName, serializedState);
  } catch (err) {
    console.error(`Error setting state ${stateName} to localStorage: ${err}`);
  }
};

/**
 * 根据用户读取本地标签快捷键配置
 */
export const getHKFromLocalByAccount = (account?: string): stringMap => {
  try {
    const map: stringMap = getStateFromLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY) || {};
    // 获取标准的用户名
    const accountKey = systemApi.getCurrentUser(account)?.id || account;
    if (accountKey) {
      return map[accountKey] || {};
    }
  } catch (e) {
    console.error('[error] getHKFromLocal', e);
  }
  return {};
};

/**
 * 保存快捷键到本地
 */
export const saveHKToLocal = (params: { name: string; hotKey?: string[]; account?: string }) => {
  try {
    const { name, hotKey, account } = params;
    if (name) {
      const map: stringMap = getHKFromLocalByAccount(account);
      if (hotKey && hotKey.length) {
        map[name] = hotKey;
      }
      saveHKMapToLocalByAccount(map, account);
      return map;
    }
  } catch (e) {
    console.error('[error] saveHKToLocal', e);
  }
  return {};
};

/**
 * 保存整个快捷键map到账号下
 */
export const saveHKMapToLocalByAccount = (map: stringMap, account?: string) => {
  try {
    const accountKey = systemApi.getCurrentUser(account)?.id || account;
    if (accountKey) {
      const localMap: stringMap = getStateFromLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY) || {};
      localMap[accountKey] = map;
      setStateToLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY, localMap);
    }
  } catch (e) {
    console.error('[error] saveHKMapToLocalByAccount', e);
  }
};

/**
 * 从本地删删除对应tagName的快捷键
 * 注意：该方法会操作localStorage,有副作用
 */
export const deleteHkByTagName = (tagName: string, account?: string) => {
  try {
    if (tagName) {
      const map: stringMap = getHKFromLocalByAccount(account);
      delete map[tagName];
      // setStateToLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY, map);
      saveHKMapToLocalByAccount(map, account);
      return map;
    }
  } catch (e) {
    console.error('[error] deleteHkByTagName', e);
  }
  return {};
};

/**
 * 更新本地快捷键绑定的tagName
 */
export const updateHKBindTagName = (params: { oldName?: string; name: string; hotKey?: string[]; account?: string }) => {
  try {
    const { oldName, name, hotKey, account } = params;

    if (oldName && name) {
      const map: stringMap = getHKFromLocalByAccount(account);
      delete map[oldName];
      if (!hotKey || hotKey.length == 0) {
        delete map[name];
      } else {
        map[name] = hotKey || map[oldName];
      }
      saveHKMapToLocalByAccount(map, account);
      return map;
    }
  } catch (e) {
    console.error('[error] updateHKBindTagName', e);
  }
};

/**
 * 在加载邮件标签的时候，校验一次本地的邮件标签快捷键
 */
export const checkLocalHk = (mailTagList: any[], account?: string) => {
  try {
    const map: stringMap = getHKFromLocalByAccount(account);
    // 过滤掉key不再tagList中的快捷键
    const tagMap: stringMap = {};
    mailTagList.forEach(item => {
      tagMap[item[0]] = true;
    });

    const filterMap: stringMap = {};
    Object.keys(map).forEach(key => {
      if (tagMap[key]) {
        filterMap[key] = map[key];
      }
    });
    // 写回覆盖
    saveHKMapToLocalByAccount(filterMap, account);
  } catch (e) {
    console.error('[error] checkLocalHk', e);
  }
};

/**
 * 获取所有账号下的快捷键
 */
export const getAllAccountHK = () => {
  try {
    const map: stringMap = getStateFromLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY) || {};
    return map;
  } catch (e) {
    console.error('[error] getAllAccountHK', e);
  }
  return {};
};

/**
 * 将tab2快捷键List转换为快捷键的list，用于判断是否有重复
 */
export const getHKListFromTab2 = (tab2: stringMap) => {
  try {
    const list: string[] = [];
    Object.keys(tab2).forEach(key => {
      list.push(tab2[key].join('+'));
    });
    return list;
  } catch (e) {
    console.error('[error] getHKListFromTab2', e);
  }
  return [];
};

/**
 * 简要的生成按键的组合字符串
 */
export const getKeyString = (event: KeyboardEvent) => {
  let keyString = '';
  try {
    const keyList = [];
    if (event.metaKey) {
      keyList.push('command');
    }
    if (event.ctrlKey) {
      keyList.push('ctrl');
    }
    if (event.shiftKey) {
      keyList.push('shift');
    }
    if (event.altKey) {
      keyList.push('alt');
    }
    keyList.push(event.key.toLowerCase());
    keyString = keyList.join('+');
  } catch (e) {
    console.error('[error] getKeyString', e);
  }
  return keyString;
};
export const deleteNode = (root: HTMLElement, selector: string) => {
  const removeNode = root.querySelector(selector);
  removeNode?.remove();
};

const deleteAllNode = (root: HTMLElement, selector: string) => {
  const removeNodes = root.querySelectorAll(selector);
  removeNodes.forEach(node => node.remove());
};

export const getMailContentText = (options: { content: string; removeSign?: boolean; removeUnSubText?: boolean }) => {
  const { content, removeSign, removeUnSubText } = options;
  let node = null;
  node = document.createElement('div');
  node.innerHTML = content;
  // 如果需要签名信息，则withSign传递true即可
  if (removeSign) {
    deleteNode(node, `.${MailSign}`);
  }
  deleteAllNode(node, `.${SocialLink}`);
  deleteNode(node, `#${PreHeader}`);
  deleteNode(node, `.${MailSignEnt}`);
  deleteNode(node, `.${MailPreMailContent}`);
  deleteNode(node, `#${MailForwardContent}`);
  deleteAllNode(node, `style`);
  deleteAllNode(node, `title`);
  deleteAllNode(node, `script`);
  if (removeUnSubText) {
    deleteAllNode(node, `.${UnSubText}`);
  }
  const result = node.innerText.trim();
  node = null;
  return result;
};
