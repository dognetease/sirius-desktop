import { apiHolder as api, apis, MailConfApi } from 'api';
import {
  FLOLDER,
  MAIL_SORT_ITEM,
  redFlagStr,
  unReadStr,
  orderByDateDescStr,
  orderByDateAscStr,
  orderBySenderCapDescStr,
  orderBySenderCapAscStr,
  orderByReceiverCapDescStr,
  orderByReceiverCapAscStr,
  orderBySubjectCapDescStr,
  orderBySubjectCapAscStr,
  orderBySizeCapDescStr,
  orderBySizeCapAscStr,
  onStr,
  deferStr,
  myCustomerStr,
  attachmentStr,
} from '@web-mail/common/constant';
import { CommonMailSortConfig } from '@web-mail/types';
import { mailConfigStateIsMerge, folderIdIsContact } from '@web-mail/util';
import { getIn18Text } from 'api';

// 只有按时间降序、时间升序和选择了“仅未读”，有“全标已读“按钮
export const allReadConditionList = [MAIL_SORT_ITEM.UNREAD, MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, MAIL_SORT_ITEM.ORDER_BY_DATE_ASC];

const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;

// 暂时取和邮件menu一样的配置值CommonMailMenuConfig
export type DefaultMailSortConfigMap = {
  [k in MAIL_SORT_ITEM]: CommonMailSortConfig;
};

// 提取一个用的比较多的统一配置, 即 收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹
const unifyFolderList = [FLOLDER.DEFAULT, FLOLDER.SPAM, FLOLDER.ADVITISE, FLOLDER.DELETED, FLOLDER.READYISSUE, FLOLDER.WAITINGISSUE];

// 自定义文件夹id是不唯一的，需要换一个维度判断
// 普通模式下自定义文件夹展示按钮
const CUSTOMIZE_SORT_COMMON_LIST = [
  MAIL_SORT_ITEM.REDFLAG,
  MAIL_SORT_ITEM.UNREAD,
  MAIL_SORT_ITEM.MY_CUSTOMER,
  MAIL_SORT_ITEM.ORDER_BY_DATE_DESC,
  MAIL_SORT_ITEM.ORDER_BY_DATE_ASC,
  MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_DESC,
  MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_ASC,
  MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_DESC,
  MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_ASC,
  MAIL_SORT_ITEM.ORDER_BY_SIZE_DESC,
  MAIL_SORT_ITEM.ORDER_BY_SIZE_ASC,
  MAIL_SORT_ITEM.SENT,
  MAIL_SORT_ITEM.RECEIVED,
];
// 聚合模式下自定义文件夹展示按钮
const CUSTOMIZE_SORT_THREAD_LIST = [MAIL_SORT_ITEM.REDFLAG, MAIL_SORT_ITEM.UNREAD];

// 普通模式下自定义文件夹外的展示规则
const FLOLDER_SORT_COMMON_MAP: {
  [key in MAIL_SORT_ITEM]: number[];
} = {
  // 仅红旗：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹
  [MAIL_SORT_ITEM.REDFLAG]: [...unifyFolderList],
  // 仅未读：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹
  [MAIL_SORT_ITEM.UNREAD]: [...unifyFolderList],
  // 仅我的客户：收件/发件/未读/自定义/已审核/未审核
  [MAIL_SORT_ITEM.MY_CUSTOMER]: [FLOLDER.DEFAULT, FLOLDER.SENT, FLOLDER.UNREAD, FLOLDER.READYISSUE, FLOLDER.WAITINGISSUE],
  // 时间由近到远（默认）：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/发件箱/红旗/标签/草稿箱/稍后处理
  [MAIL_SORT_ITEM.ORDER_BY_DATE_DESC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.REDFLAG, FLOLDER.TAG, FLOLDER.DRAFT, FLOLDER.DEFER],
  // 时间由远到近：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/发件箱/红旗/标签/草稿箱/稍后处理
  [MAIL_SORT_ITEM.ORDER_BY_DATE_ASC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.REDFLAG, FLOLDER.TAG, FLOLDER.DRAFT, FLOLDER.DEFER],
  // 发件人首字母 Z→A：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_DESC]: [...unifyFolderList],
  // 发件人首字母 A→Z：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_ASC]: [...unifyFolderList],
  // 收件人首字母 Z→A：草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_DESC]: [FLOLDER.SENT, FLOLDER.DRAFT],
  // 收件人首字母 A→Z：草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_ASC]: [FLOLDER.SENT, FLOLDER.DRAFT],
  // 主题首字母 Z→A：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_DESC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.DRAFT],
  // 主题首字母 A→Z：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_ASC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.DRAFT],
  // 邮件由大到小：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SIZE_DESC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.DRAFT],
  // 邮件由小到大：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹/草稿箱/发件箱
  [MAIL_SORT_ITEM.ORDER_BY_SIZE_ASC]: [...unifyFolderList, FLOLDER.SENT, FLOLDER.DRAFT],
  // 进行中：任务邮件
  [MAIL_SORT_ITEM.ON]: [FLOLDER.TASK],
  // 已逾期/今天：稍后处理
  [MAIL_SORT_ITEM.DEFER]: [FLOLDER.DEFER],
  // 我发出的： 星标联系人
  [MAIL_SORT_ITEM.SENT]: [FLOLDER.STAR],
  // 我收到的： 星标联系人
  [MAIL_SORT_ITEM.RECEIVED]: [FLOLDER.STAR],
};

// 聚合模式下自定义文件夹外的展示规则
const FLOLDER_SORT_THREAD_MAP: {
  [key in MAIL_SORT_ITEM]: number[];
} = {
  // 仅红旗：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹
  [MAIL_SORT_ITEM.REDFLAG]: [...unifyFolderList],
  // 仅未读：收件箱/垃圾邮件/广告邮件/已删除/已审核/待审核文件夹
  [MAIL_SORT_ITEM.UNREAD]: [...unifyFolderList],
  // 进行中：任务邮件
  [MAIL_SORT_ITEM.ON]: [FLOLDER.TASK],
  // 已逾期/今天：稍后处理
  [MAIL_SORT_ITEM.DEFER]: [FLOLDER.DEFER],
  // 我发出的： 星标联系人
  [MAIL_SORT_ITEM.SENT]: [FLOLDER.STAR],
  // 我收到的： 星标联系人
  [MAIL_SORT_ITEM.RECEIVED]: [FLOLDER.STAR],
};

const judgeShow = (type: MAIL_SORT_ITEM, folderId: number | string) => {
  const isThreadMode = mailConfApi.getMailMergeSettings() === 'true';
  // 处理星标联系人
  if (folderIdIsContact(folderId) && (type == MAIL_SORT_ITEM.RECEIVED || type == MAIL_SORT_ITEM.SENT)) {
    return true;
  }
  if (typeof folderId == 'number') {
    if (isThreadMode) {
      return folderId >= 100 ? CUSTOMIZE_SORT_THREAD_LIST.includes(type) : !!FLOLDER_SORT_THREAD_MAP[type]?.includes(folderId);
    }
    return folderId >= 100 ? CUSTOMIZE_SORT_COMMON_LIST.includes(type) : FLOLDER_SORT_COMMON_MAP[type].includes(folderId);
  }
  return false;
};

const DefaultMailSortConfig: DefaultMailSortConfigMap = {
  [MAIL_SORT_ITEM.REDFLAG]: {
    key: MAIL_SORT_ITEM.REDFLAG,
    level: 1,
    sort: 1,
    name: redFlagStr,
    tabName: getIn18Text('HONGQI'),
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.REDFLAG, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.UNREAD]: {
    key: MAIL_SORT_ITEM.UNREAD,
    level: 1,
    sort: 2,
    name: unReadStr,
    tabName: getIn18Text('WEIDU'),
    show: folderId => {
      return judgeShow(MAIL_SORT_ITEM.UNREAD, folderId) || folderIdIsContact(folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ATTACHMENT]: {
    key: MAIL_SORT_ITEM.ATTACHMENT,
    level: 1,
    sort: 2,
    name: attachmentStr,
    tabName: getIn18Text('HANFUJIAN'),
    needDivider: true,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.REDFLAG, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.MY_CUSTOMER]: {
    key: MAIL_SORT_ITEM.MY_CUSTOMER,
    level: 1,
    sort: 3,
    name: myCustomerStr,
    tabName: getIn18Text('WODEKEHU'),
    needDivider: true,
    show: folderId => {
      // 外贸 && 非聚合 && 非星标联系人 && 判断逻辑 && 获取配置
      return (
        process.env.BUILD_ISEDM &&
        mailConfApi.getShowCustomerTab() &&
        !mailConfigStateIsMerge() &&
        !folderIdIsContact(folderId) &&
        judgeShow(MAIL_SORT_ITEM.MY_CUSTOMER, folderId)
      );
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_DATE_DESC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_DATE_DESC,
    level: 2,
    sort: 3,
    name: orderByDateDescStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, folderId);
    },
    onClick: () => {},
    default: true,
  },
  [MAIL_SORT_ITEM.ORDER_BY_DATE_ASC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_DATE_ASC,
    level: 2,
    sort: 4,
    name: orderByDateAscStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_DATE_ASC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_DESC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_DESC,
    level: 2,
    sort: 5,
    name: orderBySenderCapDescStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_DESC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_ASC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_ASC,
    level: 2,
    sort: 6,
    name: orderBySenderCapAscStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SENDER_CAPITAL_ASC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_DESC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_DESC,
    level: 2,
    sort: 5,
    name: orderByReceiverCapDescStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_DESC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_ASC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_ASC,
    level: 2,
    sort: 6,
    name: orderByReceiverCapAscStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_RECEIVER_CAPITAL_ASC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_DESC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_DESC,
    level: 2,
    sort: 7,
    name: orderBySubjectCapDescStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_DESC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_ASC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_ASC,
    level: 2,
    sort: 8,
    name: orderBySubjectCapAscStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SUBJECT_CAPITAL_ASC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SIZE_DESC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SIZE_DESC,
    level: 2,
    sort: 9,
    name: orderBySizeCapDescStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SIZE_DESC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ORDER_BY_SIZE_ASC]: {
    key: MAIL_SORT_ITEM.ORDER_BY_SIZE_ASC,
    level: 2,
    sort: 10,
    name: orderBySizeCapAscStr,
    show: folderId => {
      return !mailConfigStateIsMerge() && judgeShow(MAIL_SORT_ITEM.ORDER_BY_SIZE_ASC, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.ON]: {
    key: MAIL_SORT_ITEM.ON,
    level: 1,
    sort: 1,
    name: onStr,
    show: folderId => {
      return judgeShow(MAIL_SORT_ITEM.ON, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.DEFER]: {
    key: MAIL_SORT_ITEM.DEFER,
    level: 1,
    sort: 1,
    name: deferStr,
    show: folderId => {
      return judgeShow(MAIL_SORT_ITEM.DEFER, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.SENT]: {
    key: MAIL_SORT_ITEM.SENT,
    level: 1,
    sort: 1,
    name: getIn18Text('WOFACHUDE'),
    show: folderId => {
      return judgeShow(MAIL_SORT_ITEM.SENT, folderId);
    },
    onClick: () => {},
  },
  [MAIL_SORT_ITEM.RECEIVED]: {
    key: MAIL_SORT_ITEM.RECEIVED,
    level: 1,
    sort: 1,
    needDivider: true,
    name: getIn18Text('WOSHOUDAODE'),
    show: folderId => {
      return judgeShow(MAIL_SORT_ITEM.RECEIVED, folderId);
    },
    onClick: () => {},
  },
};
export default DefaultMailSortConfig;
