import {
  queryMailBoxParam,
  apiHolder as api,
  apis,
  MailConfApi,
  MailSearchModel,
  MailEntryModel,
  MailSearchStates,
  MailFileAttachModel,
  MailSearchCondition,
  MailSearchModelCondition,
} from 'api';
import moment from 'moment';
import { EdmMailKeys, MailBoxReducerState, stringMap } from '../../types';
import { folderCanSortByTop, orderCanSortByTop } from './folder';
import { getMailListByIdFromStore, isMainAccount, getMainAccount, folderIdIsContact } from '@web-mail/util';
import lodash from 'lodash';
import { FLOLDER, MAIL_STORE_REDUX_STATE, MAIL_LIST_INIT_RANGE_COUNT, MAIL_LIST_MORE_RANGE_COUNT } from '../../common/constant';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { sliceStateCheck } from '@web-mail/utils/slice';
import { getMailOrderDescRequestParam, getMailOrderRequestParam, needTimeRangeByMailOrderType } from './utils';
import { getIn18Text } from 'api';
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
// 根据邮件id判断邮件的类型
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
/**
 * 判断有配置中是否处于聚合模式
 */
export const mailConfigStateIsMerge = (): boolean => mailConfApi.getMailMergeSettings() == 'true';
/**
 * 结合当前选中文件夹，判断是否可以进入聚合功能
 * @param fid
 * @param isSearching
 * @returns
 */
// (fid = 1为收件箱 fid >= 100为用户自定义文件夹)
export const mailLogicStateIsMerge = (fid: number, accountId: string, isSearching: boolean): boolean =>
  mailConfigStateIsMerge() &&
  (fid === FLOLDER.DEFAULT || fid >= 100 || fid == FLOLDER.TAG || fid == FLOLDER.REDFLAG || fid == FLOLDER.UNREAD) &&
  !isSearching &&
  (accountId == '' || accountId == null || isMainAccount(accountId));
// 判断是否是聚合模式
export const isMerge = (selectedKeys, accountId, isSearching) => mailLogicStateIsMerge(selectedKeys, accountId, isSearching);

export const getIsUseRealList = (state: MailBoxReducerState) => {
  if (!process.env.BUILD_ISLINGXI) return false;
  const isUseRealList = state.useRealList;
  const isSeaching = !!state.mailSearching;
  const selectrKeys = state.selectedKeys;
  const isTaskFolder = selectrKeys && selectrKeys.id === FLOLDER.TASK;
  return isUseRealList && !isSeaching && !isTaskFolder;
};

// 获取邮件请求参数
export const getMailListReqParams = (state: MailBoxReducerState, startIndex: number, isCorpMail = false, noContactRace?: boolean) => {
  const {
    selectedKeys,
    mailTagFolderActiveKey,
    mailListStateTab,
    mailSearchStateMap,
    orderDateRange,
    mailEntities,
    mailDataList,
    useRealList,
    realListCurrentPageSize,
    realListCurrentPage,
  } = state;
  let fid: number | string | undefined = selectedKeys ? selectedKeys.id : 1;
  const idIsContact = folderIdIsContact(fid);
  const setting = mailLogicStateIsMerge(selectedKeys.id, selectedKeys.accountId, Object.keys(mailSearchStateMap).length > 0);
  let count = useRealList ? realListCurrentPageSize : MAIL_LIST_MORE_RANGE_COUNT;
  if (!useRealList && (startIndex === 0 || selectedKeys.id === FLOLDER.TASK)) {
    count = MAIL_LIST_INIT_RANGE_COUNT;
  }

  /**
   * 处理任务邮件导致的邮件列表不结束的特殊逻辑
   * 后续任务邮件-在所有邮件列表的顶部展示数量有变更，需要同样变更次逻辑。
   * 功能：在第二次请求的时候，startIndex需要建去任务邮件的数量，现在固定为2
   */
  // let _startIndex = startIndex;
  // try {
  //   // 检测列表是否有置顶的任务邮件
  //   const mailList = mailDataList.map(id => mailEntities[id]);
  //   let taskSum = 0;
  //   for (let i = 0; i < mailList.length; i++) {
  //     if (mailList[i].entry.taskTop) {
  //       taskSum += 1;
  //     }
  //   }
  //   // 如果是第二页请求，则纠正偏移
  //   if (startIndex == MAIL_LIST_INIT_RANGE_COUNT + taskSum) {
  //     _startIndex -= taskSum;
  //   }
  // } catch (e) {
  //   console.error("[Error getMailListReqParams taskMail Range]",e);
  // }

  const param: queryMailBoxParam = {
    index: startIndex,
    id: fid,
    count,
    returnModel: true,
    returnTag: true,
    noContactRace,
  };
  if (useRealList) {
    param.isRealList = true;
  }
  // 按照tag搜索不用fid
  if (selectedKeys && selectedKeys.id === FLOLDER.TAG) {
    param.id = undefined;
    fid = undefined;
    if (mailTagFolderActiveKey?.key) {
      param.tag = [mailTagFolderActiveKey?.key];
    }
  }
  // 智能模式下线
  // if (mailListStateTab === 'PREFERRED') {
  //   param.filter = {
  //     preferred: 0,
  //   };
  // } else
  if (mailListStateTab === 'UNREAD') {
    param.filter = {
      flags: { read: false },
    };
  } else if (mailListStateTab === 'REDFLAG') {
    param.filter = { label0: 1 };
  } else if (mailListStateTab === 'ATTACHMENT') {
    param.filter = {
      flags: { attached: true },
    };
  } else if (mailListStateTab === 'MY_CUSTOMER') {
    // 我的客户，注意此时使用服务端数据,并且不再同步本地，所以noSync设置为true
    param.filter = {
      flags: { customerMail: true },
    };
    param.noSync = true;
  } else if (folderCanSortByTop(fid as number, isCorpMail) && orderCanSortByTop(mailListStateTab)) {
    param.topFlag = 'top';
  }
  if (mailListStateTab.startsWith('ORDER_BY_')) {
    // 排序逻辑
    param.order = getMailOrderRequestParam(mailListStateTab);
    param.desc = getMailOrderDescRequestParam(mailListStateTab);
    if (needTimeRangeByMailOrderType(mailListStateTab) && orderDateRange?.startDate && orderDateRange?.endDate) {
      param.filter = {
        sentDate: [moment(orderDateRange?.startDate).format('YYYY-MM-DD'), moment(orderDateRange?.endDate).format('YYYY-MM-DD')],
      };
    }
  }
  // 任务邮件箱
  if (selectedKeys.id === FLOLDER.TASK) {
    if (mailListStateTab === 'ALL') {
      param.filter = {
        taskTab: 0,
      };
    } else if (mailListStateTab === 'ON') {
      param.filter = {
        taskTab: 1,
      };
    }
  }
  // 稍后处理 待办邮件箱
  if (selectedKeys.id === FLOLDER.DEFER) {
    if (mailListStateTab === 'DEFER') {
      param.filter = {
        defer: `:${moment().format('YYYYMMDD')}`,
      };
    }
  }
  if (setting) {
    param.checkType = 'checkThread';
  }
  // 如果是星标联系人
  if (idIsContact || selectedKeys.id === FLOLDER.STAR) {
    param.checkType = 'checkStarMail';
    if (mailListStateTab === 'SENT') {
      param.attrQueryFilter = {
        type: 'send',
      };
    }
    if (mailListStateTab === 'RECEIVED') {
      param.attrQueryFilter = {
        type: 'receive',
      };
    }
  }
  return param;
};
// 获取邮件搜索文件夹外的参数
export const getFilterCondParams = (state: MailBoxReducerState) => {
  const filterCond = [];
  const { selectedSearchKeys, mailSearchAccount } = state;
  for (const key in selectedSearchKeys[mailSearchAccount]) {
    if (key !== 'folder' && selectedSearchKeys[mailSearchAccount][key]?.operand !== 'all') {
      filterCond.push(selectedSearchKeys[mailSearchAccount][key]);
    }
  }
  return filterCond;
};
// 获取邮件-高级搜索-接口的请求参数
export const getAdvanceSearchReqParams = (state: MailBoxReducerState, filterCond: MailSearchCondition, startIndex: number): MailSearchModel => {
  const { selectedSearchKeys, searchListStateTab, advanceSearchFromValues: values, mailSearchAccount } = state;
  // const values = advancedSearchForm.getFieldsValue();
  const fids = values.fids && values.fids !== '_ALL_FOLDER_' ? [values.fids] : [];
  const flags = {
    attached: values.attach === 0 ? undefined : values.attach === 1,
    read: searchListStateTab == 'UNREAD' ? false : undefined,
  };
  if (selectedSearchKeys[mailSearchAccount]?.folder) {
    fids.push(+selectedSearchKeys[mailSearchAccount].folder);
  }
  // 从value获取到的参数
  const valueCondition = {
    from: values.from,
    to: values.to,
    memo: values.memo,
    subject: values.subject,
    label0: values.redFlag || searchListStateTab == 'REDFLAG' ? 1 : undefined,
    flags,
    sentDate: [moment.isMoment(values.start) ? values.start.format('YYYY-MM-DD') : undefined, moment.isMoment(values.end) ? values.end.format('YYYY-MM-DD') : undefined],
  };
  // 高级搜索不支持二次筛选
  // 根据filterCond覆盖条件,
  // 发件人
  // if (filterCond && filterCond.field === 'from' && filterCond.operand) {
  //   valueCondition.from = filterCond.operand as string;
  // }
  // if (filterCond && filterCond.field === 'flags' && filterCond.operand) {
  //   // 已读未读
  //   if (filterCond.operand.read !== undefined) {
  //     valueCondition.flags.read = filterCond.operand.read as boolean;
  //   }
  //   // 有无附件
  //   if (filterCond.operand.attached !== undefined) {
  //     valueCondition.flags.attached = filterCond.operand.attached as boolean;
  //   }
  // }
  // 日期处理
  // if (filterCond && filterCond.field === 'sentDate' && filterCond.operand) {
  //   if (typeof filterCond.operand === 'string') {
  //     const now = moment();
  //     const filterMoment = moment(filterCond.operand.substring(0, 10));
  //     // 三天内
  //     if (filterMoment.isSameOrAfter(now.clone().subtract(2, 'day'), 'day')) {
  //       valueCondition.sentDate = [
  //         now.clone().subtract(2, 'day').format('YYYY-MM-DD'),
  //         now.format('YYYY-MM-DD'),
  //       ];
  //     } else if (filterMoment.isSameOrAfter(now.clone().subtract(6, 'day'), 'day')) {
  //       // 一周内
  //       valueCondition.sentDate = [
  //         now.clone().subtract(6, 'day').format('YYYY-MM-DD'),
  //         now.format('YYYY-MM-DD'),
  //       ];
  //     } else if (filterMoment.isSameOrAfter(now.clone().subtract(29, 'day'), 'day')) {
  //       // 一月内
  //       valueCondition.sentDate = [
  //         now.clone().subtract(29, 'day').format('YYYY-MM-DD'),
  //         now.format('YYYY-MM-DD'),
  //       ];
  //     } else if (filterMoment.isSameOrAfter(now.clone().subtract(89, 'day'), 'day')) {
  //       // 三月内
  //       valueCondition.sentDate = [
  //         now.clone().subtract(89, 'day').format('YYYY-MM-DD'),
  //         now.format('YYYY-MM-DD'),
  //       ];
  //     } else if (filterMoment.isBefore(now.clone().subtract(90, 'day'), 'day')) {
  //       // 三月外
  //       valueCondition.sentDate = [
  //         undefined,
  //         now.clone().subtract(90, 'day').format('YYYY-MM-DD'),
  //       ];
  //     }
  //   }
  // }
  return {
    pattern: values.content,
    start: startIndex,
    limit: 20,
    fids: fids.length > 0 ? fids : undefined,
    conditions: [valueCondition as MailSearchModelCondition],
  };
};
// 获取邮件-搜索-接口的请求参数
export const getSearchListReqParams = (state: MailBoxReducerState, startIndex: number) => {
  const { selectedSearchKeys, mailSearchType, searchListStateTab, mailSearchAccount, mailSearchFolderIds } = state;
  // 默认搜索所有文件夹下数据，如果选择了某一文件夹，则搜索对应文件夹数据
  let fid: number = FLOLDER.SEARCH_ALL_RESULT;
  const ids = [...mailSearchFolderIds];
  if (selectedSearchKeys[mailSearchAccount]?.folder) {
    fid = +selectedSearchKeys[mailSearchAccount]?.folder;
  }
  const param: queryMailBoxParam = {
    index: startIndex,
    count: 20,
    returnModel: true,
    returnTag: true,
    searchType: mailSearchType,
  };
  if (fid !== FLOLDER.SEARCH_ALL_RESULT) {
    param.id = fid;
    ids.unshift(fid);
  }
  param.ids = ids;
  if (searchListStateTab === 'UNREAD') {
    param.status = 'unread';
  } else if (searchListStateTab === 'REDFLAG') {
    param.status = 'redFlag';
  }
  return param;
};
/*
 * 合并两个有邮件区间
 * 动态计算偏移量,向下拼接邮件列表-防止邮件区间移动导致的列表重复
 * 只能解决前部邮件增加，前区间邮件减少只能依赖于同步消息
 */
export const asyncMailList = (argMailList: MailEntryModel[], sliceList: MailEntryModel[]) => {
  if (!argMailList || !sliceList) return [];
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
/**
 * 邮件列表的融合
 * 在mailList中查找合适的位置，将lastMailList接回去
 * todo:待完整测试
 */
export const conactMailList = (mailList: MailEntryModel[] = [], lastMailList: MailEntryModel[] = []) => {
  let list = [...mailList];
  const listMap: {
    [key: string]: number[];
  } = {};
  mailList.forEach((item, index) => {
    const { id } = item.entry;
    if (id) {
      listMap[id] = [index];
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
// 待迁移
// 邮件列表中邮件的高度
// const itemHeight = 63;
// const attachHeight = 32;
// const statusHeight = 24;
export const getMailListRowHeight = getCardHeight;
// export const getMailListRowHeight = (mail: MailEntryModel): number => {
//   if (mail) {
//     let height = itemHeight;
//     if (mail && mail.entry.attachment?.length) {
//       let attachment: MailFileAttachModel[] = [];
//       attachment = mail.entry.attachment?.filter(item => item.inlined == false && item.fileType !== 'ics' && item.type !== 'netfolder');
//       if (attachment.length) {
//         height += attachHeight;
//       }
//     }
//     if (mail && mail.entry.sendStatus) {
//       height += statusHeight;
//     }
//     // 发件箱，已读未读数有值则展示
//     if (mail && mail.entry.folder == 3 && (mail.entry.rcptCount || mail.entry.readCount)) {
//       height += 25;
//     }
//     /**
//      * 邮件列表在需求变更后也显示邮件摘要了，不需要通过搜索状态来区分高度了
//      */
//     // if (isSearching) {
//     height += 23;
//     // }
//     return height + 1;
//   }
//   return 0;
// };
/**
 * 获取当前列表中Top邮件所占的总高度
 * 注意：请保证列表中top邮件出现在列表顶部
 * 否则计算的高度没有意义，造成后续的定位错误
 */
export const getTopMailSumHeight = (mailDataList: MailEntryModel[]) => {
  let offset = 0;
  mailDataList.forEach(mail => {
    if (mail.entry.top) {
      offset += getMailListRowHeight(mail);
    }
  });
  return offset;
};

export const getNewMailsFromList = (
  networkList: MailEntryModel[],
  lastUpdateTime: number
): null | {
  sumHeight: number;
  sumNewMail: number;
  insertPosi: number;
} => {
  if (networkList && networkList.length) {
    const newMailList = networkList.filter(item => {
      const rcTime = item.entry.receiveTime;
      if (rcTime) {
        const rsTs = moment(rcTime).valueOf();
        if (rsTs) {
          return rsTs > lastUpdateTime;
        }
      }
      return false;
    });
    if (!newMailList || !newMailList.length) {
      return null;
    }
    let sumNewMailHeight = 0;
    newMailList.forEach(item => (sumNewMailHeight += getMailListRowHeight(item)));
    return {
      sumHeight: sumNewMailHeight,
      sumNewMail: newMailList.length,
      insertPosi: newMailList.length,
    };
  }
  return null;
};
/**
 * 根据邮件状态，获取用于对比的邮件id
 */
export const getMailDiffId = (mail: MailEntryModel) => {
  if (mail?.isThread) {
    if (mail?.entry?.id && mail.entry.id.includes('--')) {
      const realId = mail.entry.id.split('--')[0];
      return realId;
    } else {
      return mail?.entry?.id;
    }
  } else {
    return mail?.entry?.id;
  }
};

/**
 * 邮件列表对比差异，找到新邮件的插入点
 * @param newList
 * @param oldList
 * @returns offset: 置顶邮件偏移  index: 插入点  newOffset：新列表的置顶邮件偏移
 * warn: 进行对比的列表，top邮件必须在列表顶部才能使用此函数
 * todo：当前版本不处理-邮件超过30封的批量变化问题
 */
export const mailListDiff = (newList: MailEntryModel[], oldList: MailEntryModel[]) => {
  if (newList && newList.length && oldList && oldList.length) {
    let aim: MailEntryModel;
    let posi: number = -1;
    let offset = 1;
    // 动态寻找插入点
    do {
      if (offset > newList.length) {
        break;
      }
      aim = newList[newList.length - offset];
      posi = oldList.findIndex(item => getMailDiffId(item) === getMailDiffId(aim));
      offset += 1;
    } while (posi < 0);
    // 如果邮件
    if (posi && posi >= 0) {
      let sumNewMailHeight = 0;
      const oldMailIdList = oldList.map(item => getMailDiffId(item));
      const newMailList = newList.slice(0, posi).filter(item => !oldMailIdList.includes(getMailDiffId(item)));
      // 如果没有变化，不插入
      if (newMailList.length == 0) {
        return null;
      }
      // 计算高度
      newMailList.forEach(item => (sumNewMailHeight += getMailListRowHeight(item)));
      return {
        sumHeight: sumNewMailHeight,
        sumNewMail: newMailList.length,
        insertPosi: posi,
      };
    }
  }
  return null;
};
/**
 * 根据当前操作的ids，激活的id，选择下一个可以激活的邮件id
 * @param mailList 邮件列表
 * @param selectedIds 选中的邮件id列表
 * @param activeId 激活的邮件id
 * @returns
 */
export const getCanActiveMailId = (mailList: MailEntryModel[], selectedIds: string[], activeId: string): string | null => {
  const mailId2Index: {
    [key: string]: number;
  } = {};
  const index2MailId: {
    [key: string]: string;
  } = {};
  const selectedMap: {
    [key: string]: boolean;
  } = {};
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
  if (!selectedIds.includes(activeId)) return activeId;
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
  return resMailId;
};
/**
 * 获取当前选中邮件中的真实邮件数目-包含聚合邮件中的数目
 * todo: 所以来的状态应当从state中拆解出来
 */
export const getRealCountFromAvtiveMails = (state: MailBoxReducerState): number => {
  const { activeIds, mailDataList, selectedKeys, mailEntities } = state;
  const isSearching = getIsSearchingMailByState(state);
  let realMailSum = activeIds.length;
  if (isMerge(selectedKeys.id, selectedKeys.accountId, isSearching)) {
    realMailSum = 0;
    mailDataList.forEach(id => {
      if (activeIds.includes(id)) {
        realMailSum += mailEntities[id]?.entry?.threadMessageCount || 0;
      }
    });
  }
  return realMailSum;
};
/**
 * 极端列表中top邮件的总数
 */
export const getTopCountFromMailList = (list: MailEntryModel[]): number => {
  let topCount = 0;
  list.forEach(item => {
    if (item.entry.top) {
      topCount += 1;
    }
  });
  return topCount;
};
/**
 * 根据搜索条件，返回当前正在显示的邮件列表
 */
export const getCurMailList = (state: MailBoxReducerState): MailEntryModel[] => {
  const { searchList, mailDataList } = state;
  const isSearching = getIsSearchingMailByState(state);
  return getMailListByIdFromStore(isSearching ? searchList : mailDataList, state.mailEntities);
};
/**
 * 判断是否可以进行置顶操作
 */
export const mailCanDoTop = (state: MailBoxReducerState, id: string): boolean => {
  // 只有邮件列表显示邮件置顶
  const { selectedKeys, mailListStateTab } = state;
  // const index = mailDataList.findIndex(item => item.entry.id === id);
  return !!(folderCanSortByTop(selectedKeys.id) && mailListStateTab === 'ALL');
};
// 判断是否是系统标签
export const isSystemTag = (tagName: string): boolean => tagName.startsWith('%') && tagName.endsWith('%');
// 过滤邮件中的系统标签
export const filterSysTagInMail = (mail: MailEntryModel): MailEntryModel => ({
  ...mail,
  tags: mail.tags ? mail.tags.filter(tag => !isSystemTag(tag)) : undefined,
});
// 过滤邮件列表中的系统标签
export const filterSysTagInMailList = (list: MailEntryModel[]): MailEntryModel[] =>
  list.map(item => {
    if (item.tags) {
      return {
        ...item,
        tags: item.tags.filter(tag => !isSystemTag(tag)),
      };
    }
    return item;
  });
/**
 * 获取去重后的邮件列表
 */
export const getUniqMailList = (list: MailEntryModel[]): MailEntryModel[] => {
  if (list && list.length) {
    const map = new Map();
    const res = list.filter(item => {
      const { id } = item.entry;
      if (map.has(id)) {
        return false;
      }
      map.set(item.entry.id, true);
      return true;
    });
    return res;
  }
  return list;
};
/**
 *  邮件列表写入之前的综合处理
 */
export const formateMailList = (list: MailEntryModel[]): MailEntryModel[] => {
  try {
    return filterSysTagInMailList(getUniqMailList(list));
  } catch (e) {
    console.error('util-formateMailList', e);
  }
  return list;
};
/**
 * 文件夹移动 - 根据错误码获取错误提示
 */
export const folderOperErrCode2Msg = (errCode: string): string => {
  let res = getIn18Text('YIDONGSHIBAI');
  // if (CORP_FOLDER_ERRCODE_MAP && CORP_FOLDER_ERRCODE_MAP[errCode]) {
  //   res = CORP_FOLDER_ERRCODE_MAP[errCode];
  // }
  return res;
};
/**
 * 在 store 中，通过 id 换取邮件实体
 */
export const getMailsByIdsHelper = (models: Record<string, MailEntryModel>, ids?: string[]): MailEntryModel[] => {
  if (!ids) {
    return [];
  }
  const result: MailEntryModel[] = [];
  ids.forEach(id => {
    const model = models[id];
    if (model) {
      result.push(model);
    }
    // 如何跨slice 读取reducer
  });
  return filterSysTagInMailList(result);
};
/**
 * 是否处于搜索模式
 */
export const isSearchingHelper = (searchState: MailSearchStates): boolean => searchState !== '';
/**
 * 简单的融合规则
 */
const mergeCustomizer = (objValue: any, srcValue: any) => {
  if (srcValue === undefined) {
    return objValue;
  } else {
    return srcValue;
  }
};
/**
 * 将邮件写入到邮件仓库
 */
export const updateMailStore = (state: MailBoxReducerState, mailList: MailEntryModel[], exclude?: string[]) => {
  if (state && state[MAIL_STORE_REDUX_STATE] && mailList && mailList.length) {
    mailList.forEach(mail => {
      const mailId = mail?.entry?.id;
      if (mailId) {
        /**
         * warn：由于 mailentrymodel 不同接口来源 数据不同，字段可能会变少，需要进行融合保持
         * 例如： 邮件列表的刷新，会导致邮件详情页的正文消失
         */
        const curMail = state[MAIL_STORE_REDUX_STATE][mailId];
        if (curMail) {
          try {
            // 邮件model融合
            const content = mail?.entry?.content?.content ? mail?.entry?.content : curMail?.entry?.content;
            // 邮件附件的融合
            let attachment: MailFileAttachModel[] = [];
            // 以解密为准
            // 传入的解密 库里的加密
            if (mail.isDecrypted && !curMail.isDecrypted) {
              attachment = mail?.entry?.attachment || [];
              // 传入的加密 库里的解密
            } else if (!mail.isDecrypted && curMail.isDecrypted) {
              attachment = curMail?.entry?.attachment || [];
            } else {
              // if ((!mail?.entry?.attachment || !mail?.entry?.attachment?.length) && curMail?.entry?.attachment) {
              //   attachment = curMail?.entry?.attachment;
              // } else if ((!curMail?.entry?.attachment || !curMail?.entry?.attachment?.length) && mail?.entry?.attachment) {
              //   attachment = mail?.entry?.attachment;
              // } else if (mail?.entry?.attachment && curMail?.entry?.attachment) {
              //   attachment = curMail?.entry?.attachment?.length > mail?.entry?.attachment?.length ? curMail?.entry?.attachment : mail?.entry?.attachment;
              // }
              // 根据附件来源对附件进行限制，如果是来源于Content，则非Content的附件无法写入redux
              if (curMail?.entry?.attachment?.length) {
                if (mail.entry.attSource == 'content') {
                  attachment = mail?.entry?.attachment || [];
                } else {
                  attachment = curMail?.entry?.attachment || [];
                }
              } else {
                attachment = mail?.entry?.attachment || [];
              }
            }
            // 针对收件人信息的融合处理
            let mergeReceiver = [];
            if (mail?.receiver && curMail?.receiver) {
              mergeReceiver = curMail?.receiver?.length > mail?.receiver.length ? curMail?.receiver : mail?.receiver;
            } else {
              mergeReceiver = mail?.receiver ? mail?.receiver : curMail?.receiver;
            }

            // 对附件进行处理 - 暂时屏蔽
            // let mergerAttachment: MailFileAttachModel[] | undefined = mail?.entry?.attachment || [];
            // if (mail?.mailIllegal && mail?.mailIllegal?.length && mergerAttachment?.length) {
            //   if (mail?.mailIllegal.includes(2)) {
            //     // 检测到内联图片不一致的情况
            //     mergerAttachment.forEach(item => {
            //       item.inlined = true;
            //     });
            //   } else if (mail?.mailIllegal.includes(1)) {
            //     // 其他情况，附件全部展示
            //     mergerAttachment.forEach(item => {
            //       item.inlined = false;
            //     });
            //   }
            // }

            // 策略改变了，不再使用下面的反推策略。1.29 - 2023.10.8
            // 针对邮件附件的融合&兼容处理 - 主要解决邮件列表与详情附件不同的问题
            // let mergerAttachment: MailFileAttachModel[] | undefined = [];
            // if (attachment && curMail?.entry?.attachment) {
            //   let attacMap: stringMap = {};
            //   curMail?.entry?.attachment.forEach(item => {
            //     attacMap[item?.id + ''] = item;
            //   });
            //   mergerAttachment = attachment.map(item => {
            //     const curAttch = attacMap[item?.id + ''];
            //     // 本地对应的附件是内联附件，突变为非内联 - 是由于列表接口和详情接口字段返回不一致造成的
            //     // 识别并屏蔽这种变化
            //     const inlined = !!curAttch?.inlined || !!item?.inlined;
            //     return {
            //       ...item,
            //       inlined,
            //     };
            //   });
            // } else {
            //   mergerAttachment = attachment ? attachment : curMail?.entry?.attachment;
            // }

            // 针对发件人的客户信息的处理
            const cloneSender = {
              ...mail.sender,
              contact: {
                ...mail.sender?.contact,
                customerOrgModel:
                  mail.sender?.contact?.customerOrgModel === undefined && mail.sender?.contactItem?.type === 'external'
                    ? curMail.sender?.contact?.customerOrgModel
                    : mail.sender?.contact?.customerOrgModel,
              },
            };
            const langListMap = Object.assign({}, curMail?.entry?.langListMap || {}, mail?.entry?.langListMap || {});
            const resMail = {
              ...curMail,
              ...mail,
              receiver: mergeReceiver,
              sender: cloneSender,
              entry: {
                ...lodash.mergeWith(curMail?.entry || {}, mail?.entry || {}, mergeCustomizer),
                content,
                attachment: attachment,
                langListMap,
                // 删除备注 服务端会将memo字段设置会undefined
                memo: mail?.entry?.memo,
              },
            };
            // 过滤不需要融合写入的字段
            if (exclude && exclude.length) {
              exclude.forEach(path => {
                lodash.set(resMail, path, lodash.get(curMail, path));
              });
            }
            //过滤邮件的标签
            if (resMail.tags && resMail.tags.length) {
              resMail.tags = resMail?.tags?.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
            }
            // 针对发件人的客户信息的处理
            if (resMail.sender?.contact?.customerOrgModel === undefined && resMail.sender?.contactItem?.type === 'external') {
              resMail.sender.contact.customerOrgModel = curMail.sender?.contact?.customerOrgModel || undefined;
            }
            // 写入store
            state[MAIL_STORE_REDUX_STATE][mailId] = resMail;
          } catch (err) {
            // 如果融合过程出错，直接替换作为兜底
            state[MAIL_STORE_REDUX_STATE][mailId] = mail;
            console.error('[updateMailEntities merge err]:', err);
          }
        } else {
          state[MAIL_STORE_REDUX_STATE][mailId] = mail;
        }
      } else {
        console.warn('updateMailEntities: mailEntities写入数据有误', mail);
      }
    });
  }
};
/**
 * 将邮件写入到邮件仓库-无融合过程
 */
export const updateMailStoreNoMerge = (state: MailBoxReducerState, mailList: MailEntryModel[]) => {
  if (state && state[MAIL_STORE_REDUX_STATE] && mailList && mailList.length) {
    mailList.forEach(mail => {
      const mailId = mail?.entry?.id;
      if (mailId) {
        //过滤邮件的标签
        try {
          if (mail.tags && mail.tags.length) {
            mail.tags = mail?.tags?.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
          }
        } catch (e) {
          console.warn('updateMailEntities: filtertag error', e);
        }
        // 写入store
        state[MAIL_STORE_REDUX_STATE][mailId] = mail;
      } else {
        console.warn('updateMailEntities: mailEntities写入数据有误', mail);
      }
    });
  }
};
/**
 * 分离写入邮件的id和store
 */
export const separateUpdateIdAndStore = (
  state: MailBoxReducerState,
  stateName: 'searchList' | 'mailDataList',
  mailList: MailEntryModel[],
  config?: {
    exclude: string[];
    key: string;
    sliceId?: string;
    type?: EdmMailKeys;
  }
) => {
  const { exclude, key, sliceId, type } = config || {};
  const targetState = state && sliceId && type ? state[type][sliceId] : state;
  if (state && targetState && mailList) {
    const newList = mailList.map(mail => mail?.entry?.id);
    if (sliceId && type) {
      state[type as 'customer'][sliceId][stateName] = newList;
    } else {
      state[stateName] = newList;
    }
    if (exclude && exclude.length && key) {
      mailList.forEach(mail => {
        exclude.forEach(item => {
          lodash.set(state.mailExcludeKeyMap, [key, mail.entry.id].join('.') + item, lodash.get(mail, item));
        });
      });
      // 排除特定的融合字段
      updateMailStore(state, mailList, exclude);
    } else {
      updateMailStore(state, mailList);
    }
  }
};

/**
 * 根据当前选中的文件夹获取对应的状态
 * todo: 完善错误处理
 */
//  export const getTreeStateByAccount = (state: MailStore, stateName: string) => {
//   const { selectedKeys } = state;
//   const { id, accountId } = selectedKeys;
//   if(!accountId){
//     return state.mainAccountState[stateName];
//   } else {
//     return state.childAccountStateMap[accountId][stateName];
//   }
// }

// export const setTreeStateByAccount = (state: MailStore, stateName: string, value: any) => {
//   const { selectedKeys } = state;
//   const { id, accountId } = selectedKeys;
//   if(!accountId){
//     state.mainAccountState[stateName] = value;
//   } else {
//     state.childAccountStateMap[accountId][stateName] = value;
//   }
// }

/**
 * 根据邮件id反查账号，并在请求发起前设置账号信息
 * 已废弃
 */
// export const setAccountByMailId = (state: MailBoxReducerState, mailId: string | string[]) => {
//   const { mailEntities } = state;
//   let id = Array.isArray(mailId) ? mailId[0] : mailId;
//   if (mailEntities && mailId && mailEntities[id]) {
//     const mail = mailEntities[id];
//     setCurrentAccount(mail?._account);
//     return mail?._account;
//   }
// };

export const getAccountByMailId = (state: MailBoxReducerState, mailId: string | string[]) => {
  const { mailEntities } = state;
  let id = Array.isArray(mailId) ? mailId[0] : mailId;
  if (mailEntities && mailId && mailEntities[id]) {
    const mail = mailEntities[id];
    // setCurrentAccount(mail?._account);
    return mail?._account;
  }
  return '';
};

/**
 * 根据邮件id反查模型，获取邮件所属的文件夹id
 */
export const getFolderByMailId = (state: MailBoxReducerState, mailId: string | string[]) => {
  const { mailEntities } = state;
  let id = Array.isArray(mailId) ? mailId[0] : mailId;
  if (mailEntities && mailId && mailEntities[id]) {
    const mail = mailEntities[id];
    return mail.entry.folder;
  }
  return null;
};

export const formatMailDataList = (inputList: MailEntryModel[]) => {
  const map = new Map();
  let list = inputList;
  try {
    list = list.filter(item => {
      const { id } = item.entry;
      if (map.has(id)) {
        return false;
      }
      map.set(item.entry.id, true);
      return true;
    });
    list = list.map(item => {
      if (item.tags) {
        item.tags = item.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
      }
      return item;
    });
  } catch (e) {
    console.warn(e);
  }
  return list;
};

export const getIsSearchingMailByState = (state: MailBoxReducerState, sliceId = '', key: EdmMailKeys) => {
  if (sliceStateCheck(state, sliceId, key)) {
    if (key === 'subordinate') {
      return false;
    }
    return !!state.customer[sliceId].mailSearching;
  }
  return !!state.mailSearching;
};
