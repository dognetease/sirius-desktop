import moment from 'moment';
import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  EntityCatalog,
  EntityMailBox,
  MailBoxModel,
  AccountApi,
  apiHolder,
  apis,
  MailEntryModel,
  SystemApi,
  MailConfApi,
  MailUploadParams,
  MailApi,
  ImportMailsResult,
  util,
} from 'api';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { DEFAULT_REMINDER, initDefaultMoment, loopRules, reminderOpts } from '@web-schedule/components/CreateBox/util';
import { getCatalogList } from '@web-schedule/service';
import Message, { ArgsProps } from '@web-common/components/UI/Message/SiriusMessage';
import Alert from '@web-common/components/UI/Alert/Alert';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import dayjs from 'dayjs';
import {
  thunkHelper,
  thunksStore,
  IResponseError,
  CardGroupDecorateRenderResult,
  MailTreeMap,
  MailTreeState,
  MailStore,
  DOMProps,
  CommonMailMenuConfig,
  stringMap,
} from './types';
import { FOLDER_TREE_MAX_COUNT, FLOLDER, MAIL_LIST_CHOOSE_TYPE, TASK_MAIL_STATUS } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const inElectron = systemApi.isElectron();

export * from './utils/folder';
export * from './utils/mail';
export * from './utils/debounceRequest';

export interface MailItemStatus {
  rclResult?: number;
  email?: string;
  status?: string;
  text?: string;
  color?: string;
  contact?: any;
  result?: number;
  contactName: string;
  modifiedTime: string;
  inner?: boolean;
}

export interface MailStatus {
  isrcl?: boolean;
  data?: MailItemStatus[];
  tid?: string;
}

export interface OpenRecord {
  location: string;
  remoteLocalTime: string;
  currentLocalTime: string;
  ip: string;
  settingTime?: string;
  settingTimeZone?: string;
}

export interface OpenRecordData {
  count: number;
  records: OpenRecord[];
}

// 邮件文件夹Icon
export const iconMap: Map<number, JSX.Element> = new Map([
  [FLOLDER.DEFAULT, <ReadListIcons.NewReceiveFolderSvg />],
  [FLOLDER.DRAFT, <ReadListIcons.DraftFolderSvg />],
  [FLOLDER.SENT, <ReadListIcons.SendFolderSvg />],
  [FLOLDER.DELETED, <ReadListIcons.RecoverFolderSvg />],
  [FLOLDER.SPAM, <ReadListIcons.JunkFolderSvg />],
  [FLOLDER.ADVITISE, <ReadListIcons.AdFolderSvg />],
  [FLOLDER.WAITINGISSUE, <ReadListIcons.UnverifyFolderSvg />],
  [FLOLDER.READYISSUE, <ReadListIcons.VerifyFolderSvg />],
  [FLOLDER.REDFLAG, <ReadListIcons.FlagFolderSvg />],
  [FLOLDER.TASK, <ReadListIcons.TaskFolderSvg />],
  [FLOLDER.STAR, <ReadListIcons.StartFolderSvg />],
  [FLOLDER.UNREAD, <ReadListIcons.UnreadFolderSvg />],
]);
/**
 * 邮件时间转换 规则：
 * 三分钟内：刚刚
 * 今天：9:04 16:18
 * 昨天：昨天
 * 今年：9月12日
 * 非今年：2018年9月15日
 */
export const formatTime = (time: string | number) => {
  if (!time) return '';
  const timeZone = mailConfApi.getTimezone();
  const _time = new Date(systemApi.getDateByTimeZone(time, timeZone, true));
  const _now = new Date(systemApi.getDateByTimeZone(new Date(), timeZone));
  const _year = _time.getFullYear();
  const _month = _time.getMonth();
  const _day = _time.getDate();
  const _hour = _time.getHours();
  const _minutes = _time.getMinutes();
  // 相同年
  if (_year === _now.getFullYear()) {
    // 同一天
    if (_time.toDateString() === _now.toDateString()) {
      // 三分钟内 刚刚
      if (_now.getTime() - _time.getTime() <= 180000) {
        return getIn18Text('GANGGANG');
      }
      // 三分钟外 时 分
      // return `${_hour <= 12 ? `上午${_hour}` : `下午${_hour - 12}`}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
      return `${_hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
    }
    // 昨天
    if (_now.setHours(0, 0, 0, 0) - _time.setHours(0, 0, 0, 0) == 86400000) {
      return getIn18Text('ZUOTIAN');
    }
    // 月日
    return `${_month + 1}${getIn18Text('yue2')}${_day}${getIn18Text('ri')}`;
  }
  // 年月日
  return `${_year}${getIn18Text('nian2')}${_month + 1}${getIn18Text('yue2')}${_day}${getIn18Text('ri')}`;
};
/**
 * 邮件时间转换 规则：
 * 三分钟内：刚刚
 * 今天：09:04 16:18
 * 昨天：昨天
 * 今年：09-12
 * 非今年：2018-09-15
 * 特殊场景完整时间 2018-09-15 16:18
 */
export const formatDigitalTime = time => {
  if (!time) return '';
  const timeZone = mailConfApi.getTimezone();
  const _time = new Date(systemApi.getDateByTimeZone(time, timeZone, true));
  const _now = new Date(systemApi.getDateByTimeZone(new Date(), timeZone));
  const _year = _time.getFullYear();
  const _month = _time.getMonth();
  const _day = _time.getDate();
  const _hour = _time.getHours();
  const _minutes = _time.getMinutes();
  if (_year === _now.getFullYear()) {
    if (_time.toDateString() === _now.toDateString()) {
      if (_now.getTime() - _time.getTime() <= 180000) {
        return getIn18Text('GANGGANG');
      }
      // return `${_hour <= 12 ? `上午${_hour}` : `下午${_hour - 12}`}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
      return `${_hour < 10 ? `0${_hour}` : _hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
    }
    if (_now.setHours(0, 0, 0, 0) - _time.setHours(0, 0, 0, 0) == 86400000) {
      return getIn18Text('ZUOTIAN');
    }
    return `${_month < 9 ? `0${_month + 1}` : _month + 1}-${_day < 10 ? `0${_day}` : _day}`;
  }
  return `${_year}-${_month < 9 ? `0${_month + 1}` : _month + 1}-${_day < 10 ? `0${_day}` : _day}`;
};

// 邮件时间转换 带时分
export const formatTimeWithHM = (time: string | number) => {
  if (!time) return '';
  const timeZone = mailConfApi.getTimezone();
  const _time = new Date(systemApi.getDateByTimeZone(time, timeZone, true));
  const _now = new Date(systemApi.getDateByTimeZone(new Date(), timeZone));
  const _year = _time.getFullYear();
  const _month = _time.getMonth() + 1;
  const _month1 = _month < 10 ? `0${_month}` : _month;
  const _day = _time.getDate();
  const _day1 = _day < 10 ? `0${_day}` : _day;
  const _hour = _time.getHours();
  const _minutes = _time.getMinutes();
  const HM = `${_hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
  // 相同年
  if (_year === _now.getFullYear()) {
    // 同一天
    if (_time.toDateString() === _now.toDateString()) {
      // 三分钟内 刚刚
      if (_now.getTime() - _time.getTime() <= 180000) {
        return getIn18Text('GANGGANG');
      }
      // 三分钟外 时 分
      return HM;
    }
    // 昨天
    if (_now.setHours(0, 0, 0, 0) - _time.setHours(0, 0, 0, 0) == 86400000) {
      return getIn18Text('ZUOTIAN') + ' ' + HM;
    }
    // 月日
    return `${_month1}/${_day1} ${HM}`;
  }
  // 年月日
  return `${_year}/${_month1}/${_day1} ${HM}`;
};

// 定时发送邮件时间转换
export const scheduleSendFormatTime = (time: string) => {
  if (!time) return '';
  let timeZone = mailConfApi.getTimezone();
  const useLocalTimeZone = mailConfApi.getLocalTimezone();
  if (useLocalTimeZone) {
    timeZone = -new Date().getTimezoneOffset() / 60;
  }
  const _time = new Date(systemApi.getDateByTimeZone(time, timeZone, true));
  const _now = new Date(systemApi.getDateByTimeZone(new Date(), timeZone));
  const _year = _time.getFullYear();
  const _month = _time.getMonth();
  const _day = _time.getDate();
  const _hour = _time.getHours();
  const _minutes = _time.getMinutes();
  if (_year === _now.getFullYear()) {
    if (_time.toDateString() === _now.toDateString()) {
      if (_now.getTime() - _time.getTime() <= 180000) {
        return getIn18Text('GANGGANG');
      }
      // return `${_hour <= 12 ? `上午${_hour}` : `下午${_hour - 12}`}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
      return `${_hour < 10 ? `0${_hour}` : _hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
    }
    if (_now.setHours(0, 0, 0, 0) - _time.setHours(0, 0, 0, 0) == 86400000) {
      return getIn18Text('ZUOTIAN');
    }
    return `${_month < 9 ? `0${_month + 1}` : _month + 1}-${_day < 10 ? `0${_day}` : _day}`;
  }
  return `${_year}-${_month < 9 ? `0${_month + 1}` : _month + 1}-${_day < 10 ? `0${_day}` : _day}`;
};
// 定时发送邮件时间转换
// export const scheduleSendFormatTime = (time:string) => {
//   if (!time) return '';
//   const _time = new Date(dayjs(time).valueOf());
//   const _now = new Date();
//   const _year = _time.getFullYear();
//   const _month = _time.getMonth();
//   const _day = _time.getDate();
//   const _hour = _time.getHours();
//   const _minutes = _time.getMinutes();
//   if (_year === _now.getFullYear()) {
//     if (_time.toDateString() === _now.toDateString()) {
//       return `${_hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
//     }
//     return `${_month + 1}-${_day} ${_hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
//   }
//   return `${_year}-${_month + 1}-${_day} ${_hour}:${_minutes < 10 ? `0${_minutes}` : _minutes}`;
// };
// 判断草稿箱邮件是否为定时发送邮件
export const isScheduleSend = item => {
  if (!item?.entry?.sendTime || !item?.entry?.receiveTime) {
    return false;
  }
  return moment(item?.entry?.sendTime).unix() > moment(item.entry.receiveTime).unix() && moment(item.entry.sendTime).unix() > moment().unix() && item.entry.folder === 2;
};

export const dateFormat = (fmt: string, dateParam: string, useServerTimeZone = true) => {
  let ret;
  let timeZone = mailConfApi.getTimezone();
  let date = new Date(systemApi.getDateByTimeZone(dateParam, timeZone, useServerTimeZone));
  if (date.getFullYear().toString() === 'NaN') {
    date = new Date(dayjs(dateParam).valueOf());
  }
  const opt = {
    'Y+': date.getFullYear().toString(), // 年
    'm+': (date.getMonth() + 1).toString(), // 月
    'd+': date.getDate().toString(), // 日
    'H+': date.getHours().toString(), // 时
    'M+': date.getMinutes().toString(), // 分
    'S+': date.getSeconds().toString(), // 秒
  };
  for (const k in opt) {
    ret = new RegExp(`(${k})`).exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
    }
  }
  return fmt;
};

const READ_STR = getIn18Text('EMAIL_READ_STATUS_READ');
const RECEIVE_STR = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
const NO_RECEIVE_STR = getIn18Text('EMAIL_READ_STATUS_SERVER_NO_RECEIVE');
const REJECTED_STR = getIn18Text('EMAIL_READ_STATUS_REJECTED');
const SENDING_STR = getIn18Text('EMAIL_READ_STATUS_SENDING');
const REJECTED_BY_SERVER_STR = getIn18Text('MAIL_READ_STATUS_REJECTED_BY_SERVER');
const REVIEWING_STR = getIn18Text('MAIL_READ_STATUS_REVIEWING');
const UNAPPROVED_STR = getIn18Text('MAIL_READ_STATUS_UNAPPROVED');

// 阅读状态
export const readState = {
  109: { status: 'read', text: READ_STR, color: '#5FC375' },
  100: { status: 'unread', text: RECEIVE_STR },
  106: { status: 'unread', text: RECEIVE_STR },
  107: { status: 'unread', text: RECEIVE_STR },
  108: { status: 'unread', text: RECEIVE_STR },
  110: { status: 'unread', text: RECEIVE_STR },
  102: { status: 'unread', text: NO_RECEIVE_STR },
  105: { status: 'unread', text: NO_RECEIVE_STR },
  103: { status: 'unread', text: REJECTED_STR, color: '#F74F4F' },
  104: { status: 'unread', text: REJECTED_STR, color: '#F74F4F' },
  101: { status: 'unkown', text: SENDING_STR },
  201: { status: 'unkown', text: SENDING_STR },
  /** 跟服务端确认状态码含义 */
  200: { status: 'unread', text: RECEIVE_STR },
  206: { status: 'unread', text: RECEIVE_STR },
  207: { status: 'unread', text: RECEIVE_STR },
  208: { status: 'unread', text: RECEIVE_STR },

  202: { status: 'unkown', text: NO_RECEIVE_STR },
  205: { status: 'unkown', text: NO_RECEIVE_STR },
  203: { status: 'unkown', text: REJECTED_BY_SERVER_STR, color: '#F74F4F' },
  204: { status: 'unkown', text: REJECTED_BY_SERVER_STR, color: '#F74F4F' },
  601: { status: 'unkown', text: REVIEWING_STR },
  602: { status: 'unkown', text: UNAPPROVED_STR, color: '#F74F4F' },
  604: { status: 'unkown', text: UNAPPROVED_STR, color: '#F74F4F' },
};
// 撤回状态
export const rclStatus = {
  0: getIn18Text('ZHENGZAICHEHUIYOU'),
  4: getIn18Text('XINJIANBUCUNZAI'),
  5: getIn18Text('MAIL_RECALL_FAIL_BY_READ'), // 信件存在，但已经被读取过
  6: getIn18Text('XINJIANCUNZAIDAN'),
  7: getIn18Text('XINJIANCUNZAI，'),
  8: getIn18Text('XINJIANYIGUOQI'),
  9: getIn18Text('BUZHICHICHEHUI'),
  14: getIn18Text('SHOUXINYONGHUBU'),
  15: getIn18Text('XITONGCHUCUO'),
};
// 用于读信页
export const formatReadStatus = data => {
  const rclList: MailItemStatus[] = [];
  const readList: MailItemStatus[] = [];
  const returnData: MailStatus = {
    isrcl: false,
    data: [],
  };
  data.map(item => {
    if (item.result >= 700) {
      if (item.result == 700 || item.result == 800) {
        item.status = 'suc';
        item.text = '';
        item.color = '#5FC375';
      } else if (item.result == 709) {
        item.status = 'fail';
        item.text = rclStatus[item.rclResult];
        item.color = '#F74F4F';
      }
      rclList.push(item);
    } else {
      const setting = readState[item.result];
      if (setting) {
        item.status = setting.status;
        item.text = setting.text;
        item.color = setting.color;
      }
      readList.push(item);
    }
  });

  returnData.tid = data[0]?.tid;
  if (rclList.length) {
    returnData.isrcl = true;
    returnData.data = rclList;
  } else {
    returnData.data = readList;
  }
  return returnData;
};

// 获取textarea光标
export const getPositionForTextArea = ctrl => {
  const CaretPos = {
    start: 0,
    end: 0,
  };
  if (ctrl.selectionStart) {
    CaretPos.start = ctrl.selectionStart;
  }
  if (ctrl.selectionEnd) {
    CaretPos.end = ctrl.selectionEnd;
  }
  return CaretPos;
};
// 设置textarea光标
export const setCursorPosition = (ctrl, pos) => {
  ctrl.focus();
  ctrl.setSelectionRange(pos, pos);
};

let cachedFirstCatalog: EntityCatalog;

export const conferenceInit = async () => {
  if (cachedFirstCatalog === undefined) {
    const list = await getCatalogList();
    const [firstCatalog] = list;
    cachedFirstCatalog = firstCatalog;
  }
  return {
    catalogId: cachedFirstCatalog?.id,
    color: cachedFirstCatalog?.color,
    enmuRecurrenceRule: loopRules[0].value,
    enmuReminders: reminderOpts(false)[0].value,
    reminders: DEFAULT_REMINDER,
    location: '',
    meetingOrderParam: undefined,
    time: {
      allDay: false,
    },
    moments: {
      ...initDefaultMoment(),
    },
  };
};

export const advancedSearchFolderData2Tree = (data: MailBoxModel) => {
  const treeNode: any = {
    key: data.entry.mailBoxId,
    title: data.entry.mailBoxName,
    isLeaf: !data.children?.length,
    icon: iconMap.get(data.entry?.mailBoxId) || <ReadListIcons.FolderSvg />,
    //   selectable: data.entry.mailBoxId !== -2,
    value: data.entry.mailBoxId,
  };
  if (!treeNode.isLeaf && data.children && data.children.length > 0) {
    treeNode.children = data.children.map(advancedSearchFolderData2Tree);
  }
  return treeNode;
};

export const buildSearchString = form => {
  const str: string[] = [];
  if (form.from) {
    str.push(`发件人:${form.from}`);
  }
  if (form.to) {
    str.push(`收件人:${form.to}`);
  }
  if (form.memo) {
    str.push(`邮件备注:${form.memo}`);
  }
  if (form.subject) {
    str.push(`邮件主题:${form.subject}`);
  }
  if (form.content) {
    str.push(`邮件正文:${form.content}`);
  }
  if (form.fids) {
    str.push(`文件夹:${form.fids}`);
  }
  if (form.start || form.end) {
    const start = form.start && moment.isMoment(form.start) ? form.start.format('YYYY-MM-DD') : '';
    const end = form.end && moment.isMoment(form.end) ? form.end.format('YYYY-MM-DD') : '';
    str.push(`时间范围:${start}:${end}`);
  }
  if (form.attach) {
    str.push(`附件:${form.attach === 1 ? '仅含附件' : '不含附件'}`);
  }
  if (form.redFlag) {
    str.push('红旗:红旗邮件');
  }
  if (form.account) {
    str.push(`搜索邮箱:${form.account}`);
  }
  return str.join('，');
};

/**
 * 表单是否可以提交
 * 搜索邮箱、文件夹、红旗邮件和附件作为后置条件
 * 出了以上三者之外的其他表单项有值则可以提交
 * 否则后端不会返回分组数据
 * @param form 表单
 */
export const advancedSearchEnable = (form: object) => {
  let enable = false;
  for (const key in form) {
    if (Object.prototype.hasOwnProperty.call(form, key)) {
      const element = form[key];
      if (key !== 'account' && key !== 'fids' && key !== 'redFlag' && key !== 'attach' && key !== 'memo') {
        enable = enable || !!element;
      }
    }
  }
  return enable;
};

export const getFolderNameById = (id: any, data: MailBoxModel[]) => {
  let name: string = '';
  for (let index = 0; index < data.length; index++) {
    const el = data[index];
    if (el.mailBoxId === id || el.entry.mailBoxId === id) {
      name = el.entry.mailBoxName;
      break;
    }
    if (el.children && el.children.length > 0) {
      name = getFolderNameById(id, el.children);
    }
  }
  return name;
};

/*
 *    树的DFS Replace
 *    子元素名称：children
 */
const ReplaceDFSHelper = (node, callback: (...args: any[]) => any, extraInfo = { deep: 0, path: [] }, childrenName = 'children') => {
  const { deep = 0, path = [] } = extraInfo;
  let packageNode =
    callback &&
    callback(node, {
      deep: deep + 1,
      path: [...path, node],
    });
  // 返回null则会屏蔽掉该节点，严格返回undefined才使用原节点
  packageNode = packageNode === undefined ? node : packageNode;
  if (packageNode && packageNode[childrenName] && packageNode[childrenName].length) {
    packageNode[childrenName] = treeReplaceDFS(packageNode[childrenName], callback, {
      deep: deep + 1,
      path: [...path, packageNode],
    });
  }
  return packageNode;
};

export const treeReplaceDFS: <T>(tree: T | T[], callback: any, extraInfo?: any) => T | T[] = (tree, callback, extraInfo) => {
  const _tree = Array.isArray(tree) ? tree : [tree];
  if (_tree) {
    const res = _tree.map(node => ReplaceDFSHelper(node, callback, extraInfo)).filter(node => node);
    return Array.isArray(tree) ? res : res[0];
  }
  return null;
};

// todo:util方法type补全，DFS方法为通用方法，其他方法全部补全类型，为folder专用方法
/*
 *    树的DFS
 *    子元素名称：children
 */
const DFSHelper = (node, callback, extraInfo = { deep: 0, path: [] }, childrenName = 'children') => {
  const { deep = 0, path = [] } = extraInfo;
  callback(node, {
    deep: deep + 1,
    path: [...path, node],
  });
  if (node && node[childrenName] && node[childrenName].length) {
    treeDFS(node[childrenName], callback, {
      deep: deep + 1,
      path: [...path, node],
    });
  }
};

export const treeDFS: <T>(tree: T | T[], callback: any, extraInfo?: any) => void = (tree, callback, extraInfo) => {
  const _tree = Array.isArray(tree) ? tree : [tree];
  if (_tree) {
    _tree.forEach(node => {
      DFSHelper(node, callback, extraInfo);
    });
  }
};
/**
 * 检测操作是否被允许
 * @param tree 当前操作的tree
 * @param node 当前操作的节点
 * @returns 是否允许操作
 * 默认操作: 移动，新增
 *
 */
export const operCheck = (tree: MailBoxModel[], node: EntityMailBox) => {
  // 检测当前节点的最大层级
  if (node._deep && node._deep > 12) {
    Message.warn({
      content: getIn18Text('ZUIDUOXINJIAN'),
    });
    return false;
  }
  return true;
};

// 邮件文件夹本地映射
// const LocalLabelConf = {
//   // 收件箱: 'SHOUJIANXIANG',
//   // 发件箱: 'FAJIANXIANG',
//   // 红旗邮件: 'HONGQIYOUJIAN',
//   // 任务邮件: 'RENWUYOUJIAN',
//   // 稍后处理: 'SHAOHOUCHULI',
//   // 草稿箱: 'CAOGAOXIANG',
//   // 已删除: 'YISHANCHU',
//   // 垃圾邮件: 'LAJIYOUJIAN1',
//   // 广告邮件: 'GUANGGAOYOUJIAN'
// } as const;
// 根据MailFolderTree返回id2Node 的 Map
// todo: 通过修改文件夹的model对象来实现翻译，可能会在某些情况下出现无法写入的bug
export const getTreeId2Node = (tree: MailBoxModel[] | MailBoxModel) => {
  const map: { [key: string]: MailBoxModel } = {};
  treeDFS(tree, item => {
    // const key = LocalLabelConf[item?.entry?.mailBoxName as keyof typeof LocalLabelConf];
    // if (key != null) {
    //   try{
    //     item.entry.mailBoxName = getIn18Text(key) || item?.entry?.mailBoxName;
    //   } catch(e){
    //     console.warn('[getTreeId2Node error]', e)
    //   }
    // }
    map[item?.entry?.mailBoxId] = item;
  });
  return map;
};

// 从Foldertree中查找指定id的节点
export const getTreeNodeById: (tree: MailBoxModel[] | MailBoxModel, id: string | number) => MailBoxModel | null = (tree, id) => {
  let res = null;
  treeDFS(tree, node => {
    if (node.entry.mailBoxId == id) {
      res = node;
    }
  });
  return res;
};

// 根据FOlderTree中制定的id查找对应的父节点
export const getParentNodeById = (tree: MailBoxModel | MailBoxModel[], id: number): MailBoxModel | null => {
  const node = getTreeNodeById(tree, id);
  let parentNode: MailBoxModel | null = null;
  if (node) {
    const { pid } = node.entry;
    if (pid != null) {
      // 如果pid = 0 则代表在更多文件夹下，id定下为-2
      parentNode = getTreeNodeById(tree, pid);
    }
  }
  return parentNode;
};

// 根据id在FolderTree中查找从根节点到目标节点的路径idList
export const getTreeIdPathById = (tree: MailBoxModel | MailBoxModel[], id): number[] => {
  let pathList: number[] = [];
  if (tree) {
    treeDFS(tree, (node: MailBoxModel, { path }) => {
      if (node.entry.mailBoxId == id) {
        pathList = path.map(item => item.entry.mailBoxId);
      }
    });
  }
  return [...new Set(pathList)];
};

// 按照规则从tree中过滤出子tree
// toto,该方法因为有深克隆，有性能缺陷
export const getChildTreeByRule: <T>(tree: T | T[], ruleFn: (node: T) => boolean) => T | T[] = (tree, ruleFn) => {
  const _tree = cloneDeep(tree);
  if (_tree && ruleFn != null) {
    return treeReplaceDFS(_tree, (node: T) => (ruleFn(node) ? node : null));
  }
  return _tree;
};

// 搜索结果顺序
export const SEARCH_RESULT_STATS_ORDER = ['fromAddress', 'sentDate', 'flags.attached', 'flags.read'];

// 获取可用的文件夹名称-如果重复则返回可用的名称
export const getNoRepeatFolderName = (tree: MailBoxModel[], parentId: number, name: string, nodeId: number): string => {
  const parentNode = getTreeNodeById(tree, parentId);
  let folderName = name;
  if (parentNode && parentNode.children) {
    const brotherNodes = parentNode.children;
    const brotherNamesMap: { [key: string]: boolean } = {};
    brotherNodes.forEach(item => {
      if (nodeId !== item.entry.mailBoxId) {
        brotherNamesMap[item.entry.mailBoxName.toLowerCase()] = true;
      }
    });
    while (brotherNamesMap[folderName]) {
      folderName += '-1';
    }
  }
  return folderName;
};
/**
 * 获取可用的文件夹名称-如果重复则返回可用的名称（数字+1）
 * @param tree
 * @param parentId
 * @param name
 * @param nodeId
 * @returns
 */
export const getNoRepeatFolderNameByMumber = (tree: MailBoxModel[], parentId: number, name: string, nodeId: number): string => {
  const parentNode = getTreeNodeById(tree, parentId);
  let folderName = name;
  if (parentNode && parentNode.children) {
    const brotherNodes = parentNode.children;
    const brotherNamesMap: { [key: string]: boolean } = {};
    brotherNodes.forEach(item => {
      if (nodeId !== item.entry.mailBoxId) {
        brotherNamesMap[item.entry.mailBoxName.toLowerCase()] = true;
      }
    });
    let index = 0;
    while (true) {
      if (!brotherNamesMap[folderName + (index ? index.toString() : '')]) {
        folderName += index ? index.toString() : '';
        break;
      }
      index += 1;
    }
  }
  return folderName;
};

// 休眠
export async function sleep(time: number) {
  return new Promise(r => {
    setTimeout(r, time);
  });
}

// 文件夹错误提示debouce
const debouceWarn = debounce(params => {
  Message.warn(params);
}, 1000);

// 文件夹名称-合法性检测
export const folderNameValidate = value => {
  const folderName = value.trim();
  const folderNameReg = /[,%'\\"?;<>&*\|]/;
  let hasForbidChar = false;
  try {
    hasForbidChar = folderNameReg.test(folderName);
  } catch (e) {
    console.warn('folderNameValidate', 'reg error');
  }
  if (folderName == null || folderName.length <= 0) {
    Message.warn({
      content: getIn18Text('WENJIANJIAMINGCHENG'),
    });
    return false;
  }
  if (folderName.length > 40) {
    debouceWarn({ content: getIn18Text('MINGCHENGZUIDUOSHU'), duration: 1, key: 'folderNameValidate' });
    return false;
  }
  if (hasForbidChar) {
    debouceWarn({ content: getIn18Text('MINGCHENGBUNENGBAO'), duration: 1, key: 'folderNameValidate' });
    return false;
  }
  return true;
};

/**
 * corp获取threadMessageIds
 * @param item
 * @returns
 */
export function getCorpMessageIdsByMailItem(item): Array<string> {
  const ids = [];
  const { isThread } = item;
  const { threadMessageIds } = item.entry;
  if (isThread && threadMessageIds && threadMessageIds.length) {
    ids.push(...threadMessageIds);
  } else {
    ids.push(item.entry.id);
  }
  return ids;
}

// thunkHelperFactory 提供的默认rejected实现，将吞掉的错误打印出来
const getDefaultThunkRejected = (thunkName: string) => (_: object, action: PayloadAction<any>) => {
  const error = action?.error || action.payload;
  console.error(`${thunkName} thunkError`, error);
};

// 用于快速生成和连接 asyncThunk，防止逻辑割裂
export function thunkHelperFactory(reducerName: string, thunks: thunksStore, extraReducerList: ((builder: any) => void)[]): thunkHelper {
  return params => {
    const { name, request, fulfilled, pending, rejected = getDefaultThunkRejected(name) } = params;
    if (thunks[name]) {
      console.warn(`重复的Thunk： ${name}`);
      return;
    }
    thunks[name] = createAsyncThunk(`${reducerName}/${name}`, request);
    extraReducerList.push(builder => {
      fulfilled && builder.addCase(thunks[name].fulfilled, fulfilled);
      pending && builder.addCase(thunks[name].pending, pending);
      rejected && builder.addCase(thunks[name].rejected, rejected);
    });
  };
}

/**
 * redux中使用message，会出现奇怪的竞态问题，需要包裹一下
 * TODO: 临时解决方案，需要从别的层面入手解决这个问题
 */
export const reduxMessage = {
  warn: (params: ArgsProps) => {
    setTimeout(() => {
      Message.warn(params);
    }, 0);
  },
  loading: (params: ArgsProps) => {
    setTimeout(() => {
      Message.loading(params);
    }, 0);
  },
  error: (params: ArgsProps) => {
    setTimeout(() => {
      Message.error(params);
    }, 0);
  },
  info: (params: ArgsProps) => {
    setTimeout(() => {
      Message.info(params);
    }, 0);
  },
  success: (params: ArgsProps) => {
    setTimeout(() => {
      Message.success(params);
    }, 0);
  },
};

/**
 * 获取展示的错误信息
 * @param resErrorMsg 调用api层返回的错误
 */
export function getFolderErrorMsg(resError: IResponseError): string {
  const msg = resError.message;
  // /^[A-Z_\d]*$/ 表示code的错误码(eg:FA_NO_PARENT)，不展示给用户
  if (typeof msg === 'string' && msg.length && !/^[A-Za-z_\d]*$/.test(msg)) {
    return msg;
  }
  if (msg === 'FA_NAME_EXISTS') {
    return getIn18Text('REPEATFOLDERNAME');
  }
  if (msg === 'FA_THIRD_FOLDER_NOT_CREATED') {
    return getIn18Text('NOCREATEONSERVE');
  }
  return '';
}

// 判断是否是mac
export function isMac() {
  return window.navigator.userAgent.toLocaleLowerCase().includes('mac os');
}

/**
 * 检测-邮件-文件夹最大数量
 */
export const validateFolderTreeCount = (tree: MailBoxModel[]) => {
  // 计算自定义文件夹的最大数量
  let sum = 0;
  treeDFS(tree, () => {
    sum += 1;
  });
  if (sum > FOLDER_TREE_MAX_COUNT) {
    Message.warn({
      content: getIn18Text('ZUIDUOXINJIAN1'),
    });
    return false;
  }
  return true;
};

/**
 * 检测操作是否被允许
 * @param tree 当前操作的tree
 * @param node 当前操作的节点
 * @returns 是否允许操作
 * 默认操作: 移动，新增
 *
 */
export const folderAddOperCheck = (tree: MailBoxModel[], node: MailBoxModel) => {
  // 检测当前节点的最大层级
  if (node && node?.entry?._deep && node?.entry?._deep > 12) {
    Message.warn({
      content: getIn18Text('ZUIDUOXINJIAN'),
    });
    return false;
  }
  return true;
};

/**
 * 邮件列表-增加时间分割-装饰生成器
 */
// 扫描邮件设置时间梯度
// fromIndex 从哪个开始扫描
export const scanMailsSetTimeGradients = (mails: MailEntryModel[], fromIndex: number) => {
  const scanStartIndex = fromIndex || 0;
  if (scanStartIndex >= mails.length) return null;

  // 时间梯度 今天 => 昨天 => 本周 => 本月 => 按月上溯 ...
  // 固定梯度
  let curWeekDay = dayjs().day();
  curWeekDay = curWeekDay === 0 ? 7 : curWeekDay; // 转为iso星期制
  const curMonth = dayjs().month() + 1;
  const fixedTimeGradients = [
    {
      name: 'today',
      nameText: getIn18Text('JINTIAN'),
      start: dayjs().startOf('date'),
      end: dayjs().endOf('date'),
    },
    {
      name: 'yesterday',
      nameText: getIn18Text('ZUOTIAN'),
      start: dayjs().subtract(1, 'day').startOf('date'),
      end: dayjs().subtract(1, 'day').endOf('date'),
    },
    {
      name: 'curWeekRest',
      nameText: getIn18Text('BENZHOU'),
      start: dayjs()
        .subtract(curWeekDay - 1, 'day')
        .startOf('date'),
      end: dayjs()
        .add(7 - curWeekDay, 'day')
        .endOf('date'),
    },
    {
      name: 'curMonthRest',
      nameText: `${curMonth}月`,
      start: dayjs().startOf('month'),
      end: dayjs().endOf('month'),
    },
  ];

  // 固定梯度寻找index 超过就得计算
  let fixedTimeGradientsIndex = 0;

  // 当前时间梯度时间范围
  let curTimeGradientScope: null | { start: dayjs.Dayjs; end: dayjs.Dayjs } = null;

  // 时间锚点
  const timeHashes: CardGroupDecorateRenderResult[] = [];

  // 计算梯度
  const calcuteGradient = (curTimeDJ: dayjs.Dayjs, idx: number) => {
    curTimeGradientScope = {
      start: curTimeDJ.startOf('month'),
      end: curTimeDJ,
    };
    const curGradientYear = curTimeDJ.year();
    const curGradientMonth = curTimeDJ.month() + 1;
    // 梯度说明
    const curGradientText = curGradientYear === dayjs().year() ? `${curGradientMonth}月` : `${curGradientYear}年${curGradientMonth}月`;
    timeHashes.push({
      element: <div className="mail-list-item-top-time">{curGradientText}</div>,
      index: idx,
      height: 27,
      position: 'top',
      fixed: {
        height: 27 + 5,
      },
    });
  };

  // 寻找并设置梯度 并添加至index
  const findAndSetGradient = (curTimeDJ: dayjs.Dayjs, idx: number) => {
    // 未超出 在固定梯度里寻找
    while (fixedTimeGradientsIndex <= 3) {
      const curGradientScope = fixedTimeGradients[fixedTimeGradientsIndex];
      // 找到了
      if (curGradientScope && curTimeDJ.isBefore(curGradientScope.end) && curTimeDJ.isAfter(curGradientScope.start)) {
        curTimeGradientScope = curGradientScope;
        timeHashes.push({
          element: <div className="mail-list-item-top-time">{curTimeGradientScope.nameText}</div>,
          index: idx,
          height: 27,
          position: 'top',
          fixed: {
            height: 27 + 5,
          },
        });
        return;
      }
      fixedTimeGradientsIndex += 1;
    }
    // 找不到 去计算梯度
    calcuteGradient(curTimeDJ, idx);
  };

  for (let i = scanStartIndex; i < mails.length; i++) {
    const mail = mails[i];
    const { entry } = mail;
    const { sendTime } = entry;
    const sendTimeDJ = dayjs(sendTime);
    // 首次
    if (!curTimeGradientScope) findAndSetGradient(sendTimeDJ, i);
    // 超出范围了(比起始小)
    // 寻找并计算出新的梯度
    else if (sendTimeDJ.isBefore(curTimeGradientScope.start)) {
      findAndSetGradient(sendTimeDJ, i);
    }
  }
  return timeHashes;
};

export const setCurrentAccount = (mail?: string) => {
  mail
    ? accountApi.setCurrentAccount({
        email: mail,
      })
    : accountApi.setCurrentAccount();
};

/**
 *  判断当前账号是否是主账号
 */
export const isMainAccount = (accountName?: string): boolean => {
  const currentUser = systemApi.getCurrentUser();
  // 默认不传或者空置，按照主账号处理
  if (accountName == '' || accountName == null) {
    return true;
  }
  if (currentUser && accountName) {
    return currentUser.id === accountName;
  }
  return false;
};

/**
 *  是否展示阅读状态
 */
// export const ifShowReadStatus = async (accountName?: string): Promise<boolean> => {
//   // 主账号 或 子账号的企业账号
//   if (isMainAccount(accountName)) return true;
//   try {
//     const accountRes = await accountApi.getSubAccounts({ subAccountEmail: accountName });
//     if (accountRes?.length) {
//       return accountRes[0]?.accountType === 'qyEmail';
//     }
//     return false;
//   } catch (error) {
//     return false;
//   }
// };

/**
 * 根据传入的accountId，使用所有等价标记去map中尝试获取信息
 */
export const getMapConfigBySameAccountKey: <T>(map: { [key: string]: any }, accountId: string) => T | null = (map, accountId) => {
  if (map && accountId) {
    const accountInfo = accountApi.getSubAccountInfo(accountId);
    if (accountInfo) {
      if (accountInfo?.agentEmail && map[accountInfo?.agentEmail]) {
        return map[accountInfo?.agentEmail];
      }
      if (accountInfo?.agentEmail && map[accountInfo?.agentEmail]) {
        return map[accountInfo?.agentEmail];
      }
      if (accountInfo?.id && map[accountInfo?.id]) {
        return map[accountInfo?.id];
      }
    }
    if (map[accountId]) {
      return map[accountId];
    }
  }
  return null;
};

/**
 * 根据传入的账号，从treeMap中获取对应账号下的属性
 */
export const getTreeStatesByAccount = (map: MailTreeMap, accountId?: string) => {
  if (map) {
    if (accountId && !isMainAccount(accountId)) {
      return getMapConfigBySameAccountKey<MailTreeState>(map, accountId);
    }
    return map.main;
  }
  return null;
};

// 聚合指定邮箱文件下的子文件夹id 返回文件id列表
export const aggregateFolderIds = (mailbox: MailBoxModel): number[] => {
  try {
    const ids: number[] = [];
    const currentId = mailbox.entry.mailBoxId as number;
    // 将当前节点的id加入聚合结果
    if (currentId) {
      ids.push(currentId);
    }

    // 递归处理子节点
    if (mailbox.children && mailbox.children.length > 0) {
      mailbox.children.forEach(item => {
        ids.push(...aggregateFolderIds(item));
      });
    }
    return ids;
  } catch (e) {
    console.error('aggregateFolderIds error');
    return [];
  }
};

/**
 * 获取主账号
 */
export const getMainAccount = (): string => systemApi.getCurrentUser()?.id || '';

/**
 * 当数量超过规定值后格式化为 xxx+
 * ex: formatNumberByMax(100,99)=> '99+'
 */
export const formatNumberByMax = (sum: number, max: number): string => {
  if (max) {
    if (sum < max) {
      return sum + '';
    } else {
      return max + '+';
    }
  }
  return sum + '';
};

/**
 * 读信页-三方邮件的附件卡片功能配置
 */

export const tpMailAttConfig = {
  hidePackDownload: systemApi.inEdm() && !systemApi.isElectron(),
  hideCloudPreview: false,
  hideChatOpenFile: false,
  hideChatOpenDir: false,
  hideActionOperate: false,
  hideMoreOperate: false,
  hideSaveForward: true,
  // disabled: true,
  // onClick: ()=>{
  //   Msg({
  //     type: 'fail',
  //     content:  '他人邮件附件暂不支持操作',
  //     key: 'attach-disabled'
  //   });
  // }
};

export const edmReplyMailAttConfig = {
  hidePackDownload: true,
  hideCloudPreview: true,
  hideChatOpenFile: true,
  hideChatOpenDir: true,
  hideActionOperate: true,
  hideMoreOperate: true,
  hideSaveForward: true,
};

export const isValidArray = (array: any) => Array.isArray(array) && array.length > 0;

/**
 * 判断拖拽事件中传输的文件是否包含eml文件
 */
export const dragTransFileHasEml = (event: React.DragEvent): boolean => {
  const fileList = event?.dataTransfer?.items;
  let hasEml = false;
  try {
    if (fileList) {
      for (let i = 0; i < fileList.length; i++) {
        // eml 的rfc类型为 rfc822
        if (fileList[i]?.type && fileList[i]?.type.includes('rfc822')) {
          hasEml = true;
          break;
        }
      }
    }
  } catch (e) {
    console.error('[Error]: : dragTransFileHasEml', e);
  }
  return hasEml;
};

/**
 * 从拖拽事件中过滤出eml文件
 */
export const getEmlFileFromDragTrans = (event: React.DragEvent): File[] => {
  const fileList = event?.dataTransfer?.items;
  const uploadFileList = [];
  try {
    if (fileList) {
      for (let i = 0; i < fileList.length; i++) {
        // eml 的rfc类型为 rfc822
        if (fileList[i]?.type && fileList[i]?.type.includes('rfc822')) {
          const inputFile = fileList[i].getAsFile && fileList[i].getAsFile();
          if (inputFile) {
            uploadFileList.push(inputFile);
          }
        }
      }
    }
  } catch (e) {
    console.error('[Error]: : getEmlFromDragTrans', e);
  }
  return uploadFileList;
};

/**
 * 邮件导入
 */
export const importMails = (conf: MailUploadParams, useWebImport?: boolean): Promise<any> => {
  // if (conf._account && systemApi.getCurrentUser()?.id !== conf._account) {
  //   conf.fileList = conf.fileList?.map(file => {
  //     return {
  //       name: file.name,
  //       path: file.path,
  //     } as unknown as File;
  //   });
  // }
  // setCurrentAccount(conf._account);
  const hideLoading = Message.loading({ content: getIn18Text('ZHENGZAIDAORUYOUJIAN') });
  return mailApi.doImportMails(conf, useWebImport).then((importResult: ImportMailsResult[]) => {
    let successCount = 0,
      failedCount = 0,
      localRepeatCount = 0,
      networkRepeatCount = 0;
    // 客户端用户取消选择检查，不提示成功/失败数量。 web端没有用户取消FileList为空，不需要判断
    const isCanceled = importResult.some(impRes => !impRes.success && impRes.reason === 'canceled');
    if (isCanceled) {
      return;
    }
    importResult.forEach(res => {
      if (res.success) {
        successCount++;
      } else {
        if (res?.reason === 'local repeat') {
          localRepeatCount++;
        } else if (res?.reason === 'network repeat') {
          networkRepeatCount++;
        }
        failedCount++;
      }
    });
    hideLoading && hideLoading();
    const al = Alert.info({
      title: getIn18Text('DAORUYOUJIANWANCHENG'),
      content: (
        <div>
          <p>{`${getIn18Text('DAORUCHENGGONG')} ${successCount} ${getIn18Text('FENGMAIL')}, ${getIn18Text('FAILED')} ${failedCount} ${getIn18Text('FENGMAIL')}`}</p>
          {inElectron && failedCount > 0 ? (
            <p>
              {`${getIn18Text('SHIBAIYUANYIN')}：${networkRepeatCount} ${getIn18Text('FENGMAIL') + getIn18Text('YICHUNZAIYOUXIANG')}, ${
                failedCount - networkRepeatCount
              } ${getIn18Text('FENGMAIL') + getIn18Text('QITAYUANYIN')}`}
            </p>
          ) : (
            ''
          )}
        </div>
      ),
      funcBtns: [
        {
          text: getIn18Text('ZHIDAOLE'),
          type: 'primary',
          onClick: () => {
            al.destroy();
          },
        },
      ],
    });
  });
};

/**
 * 判断是否在windows系统环境中
 */
export const systemIsWindow = () => {
  try {
    return /windows\s*(?:nt)?\s*[._\d]*/i.test(navigator.userAgent);
  } catch (e) {
    console.error('[Error systemIsWindow]', e);
  }
};
/**
 * 判断是否在mac系统中
 */
export const systemIsMac = () => {
  try {
    return /mac os x/i.test(navigator.userAgent);
  } catch (e) {
    console.error('[Error systemIsWindow]', e);
  }
};

/**
 * 从id列表中，给定的idmap，需要选中的类型返回对应的邮件id
 */
export const getChooseMailId = (mailIdList: string[], store: MailStore, type: MAIL_LIST_CHOOSE_TYPE) => {
  if (mailIdList && mailIdList.length) {
    if (type == MAIL_LIST_CHOOSE_TYPE.EMPTY) {
      return [];
    }
    const res = [];
    for (let i = 0; i < mailIdList.length; i++) {
      const mailId = mailIdList[i];
      const mail = store[mailId];
      if (mail) {
        if (type == MAIL_LIST_CHOOSE_TYPE.ALL) {
          res.push(mail);
        }
        // 选择未读
        if (type == MAIL_LIST_CHOOSE_TYPE.UNREAD && mail?.entry?.readStatus === 'unread') {
          res.push(mail);
        }
        if (type == MAIL_LIST_CHOOSE_TYPE.READ && mail?.entry?.readStatus === 'read') {
          res.push(mail);
        }
      }
    }
    return res
      .filter(item => {
        return item?.taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING;
      })
      .map(item => item?.entry?.id);
  }
  return [];
};

/**
 * 获取邮件别名,附带缓存
 * todo: 这种直接全局变量的缓存会不会有什么问题？？
 */
let mailAliasArrCache: Array<string> | null = null;
export const getMailAliasArr = () => {
  const accountAlias = systemApi.getCurrentUserAccountAlias();
  if (accountAlias && accountAlias.length > 0) {
    return Promise.resolve(accountAlias);
  }
  if (mailAliasArrCache && mailAliasArrCache.length) {
    return Promise.resolve(mailAliasArrCache || []);
  }
  return mailConfApi
    .getMailSenderInfo()
    .then(res => {
      if (res && res.length) {
        return res.map(item => {
          return item.id;
        });
      }
      return [];
    })
    .then(arr => {
      mailAliasArrCache = arr;
      return mailAliasArrCache;
    });
};

/**
 *  从mails中获取单封邮件
 */
export const getMailFromMails = (mails: MailEntryModel | MailEntryModel[]): MailEntryModel => {
  return Array.isArray(mails) ? mails[0] : mails;
};

/**
 * 跳转管理后台
 * anchor: 跳转到管理后台的那个模块 https://docs.popo.netease.com/lingxi/207758571c414e4193b84d48166257e5
 * payform：如果跳转到管理后台的版本升级页面，需要区分来源，灵犀办公是lingxioffice
 */
export const handleBackEnd = async (anchor?: string, payform?: string) => {
  const redirectUrl = `${mailConfApi.getWebMailHost(true)}/admin/login.do?hl=zh_CN&uid=${systemApi.getCurrentUser()?.id}&app=admin&all_secure=1${
    payform ? '&payform=' + payform : ''
  }${anchor ? '&anchor=' + anchor : ''}`;
  const url: string | undefined = await mailConfApi.getWebSettingUrlInLocal('', { url: redirectUrl });
  if (url && url.length > 0) {
    systemApi.openNewWindow(url, false, undefined, undefined, true);
  } else {
    Toast.warn({
      content: getIn18Text('WUFADAKAIZHI'),
      duration: 3,
    });
  }
};

/**
 * 判断链接，是否包含javascript: 伪协议
 */
export const urlHasJavascriptProtocol = (link: string) => {
  try {
    const javascriptRegex = /^\s*(javascript:|https?:\/\/javascript:;)/i;
    return javascriptRegex.test(link);
  } catch (e) {
    console.error('[Error urlHasJavascriptProtocol]', e);
  }
  return false;
};

/**
 * 过滤掉obj中会和react冲突的属性
 */
const deleteReactKey = ['ref', 'key', 'children', 'className', 'style', 'dangerouslySetInnerHTML', 'htmlFor'];
export const filterReactProps = (obj: stringMap) => {
  let res: stringMap = {};
  try {
    res = {
      ...obj,
    };
    if (deleteReactKey?.length) {
      for (let i = 0; i < deleteReactKey.length; i++) {
        if (res[deleteReactKey[i]]) {
          delete res[deleteReactKey[i]];
        }
      }
    }
  } catch (e) {
    console.error('[filterReactProps error]', e);
  }

  return res;
};

/**
 * 将传入的属性转换为可以写入到DOM元素上的Object
 */
export const trans2DomPropsObj = (domProps: DOMProps, mails: MailEntryModel | MailEntryModel[], menuConfig: CommonMailMenuConfig) => {
  let res = {};
  try {
    if (domProps) {
      if (typeof domProps == 'function') {
        const fnRes = domProps(mails, menuConfig);
        if (typeof fnRes == 'object') {
          res = fnRes;
        }
      } else if (typeof domProps == 'object') {
        res = domProps;
      }
    }
  } catch (e) {
    console.error('[error trans2DomPropsObj]', e);
  }
  return filterReactProps(res);
};

/**
 * 将快捷键格式化为方便展示的缩略形式
 */
export const formatHotKey = (hotKey?: string[]) => {
  if (hotKey) {
    const command = util.getCommonTxt();
    const showKey: { [key: string]: string } = {
      command: command,
      shift: '⇧',
      alt: '⌥',
      ctrl: '⌃',
      enter: '↩',
    };
    return hotKey.map(item => showKey[item.toLowerCase()] || item).join('+');
  }
  return '';
};

/**
 * 判断按键是否是系统文字功能键
 */
export const isTextShortcut = (event: KeyboardEvent) => {
  var textShortcuts = ['c', 'v', 'x', 'z', 'y', 'a', 'f', 'h', 'p'];
  var keyName = isMac() ? 'metaKey' : 'ctrlKey';

  if (event[keyName as keyof KeyboardEvent]) {
    if (event.key && textShortcuts.includes(event.key.toLocaleLowerCase())) {
      return true;
    }
  }
  return false;
};
