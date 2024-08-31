import { MailEntryModel, MailFileAttachModel, apiHolder, SystemApi, apis, MailConfApi as MailConfApiType, ProductAuthApi, MailOrderedField } from 'api';
import { isMainAccount } from '@web-mail/util';
import { FLOLDER } from '@web-mail/common/constant';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

import { mailListStateTabSelected, stringMap } from '@web-mail/types';
const structHeightMap1 = {
  from: 20, // 20
  summary: 22, // 16+6
  desc: 22, // 16+6
  // 以下为可变行的高度
  attachments: 32, // 24+8
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 24,
};
// 卡片结构的高度：适中
const structHeightMap2 = {
  from: 16, // 16
  summary: 20, // 14+6
  desc: 20, // 14+6
  // 以下为可变行的高度
  attachments: 30, // 24+6
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 24,
};
// 卡片结构的高度：紧凑
const structHeightMap3 = {
  from: 16, // 16
  summary: 18, // 14+4
  desc: 18, // 14+4
  // 以下为可变行的高度
  attachments: 28, // 24+4
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 24,
};

const structHeightMap = [structHeightMap1, structHeightMap2, structHeightMap3];

// 卡片结构的显示策略
const getVisibleStructHeight = (data: MailEntryModel): stringMap => {
  const isCorpMail = systemApi.getIsCorpMailMode();
  const isFree = productAuthApi.doGetProductVersionId() === 'free';
  const isSirius = productAuthApi.doGetProductVersionId() === 'sirius';
  const isOther = productAuthApi.doGetProductVersionId() !== 'free' && productAuthApi.doGetProductVersionId() !== 'sirius';
  const tightness = mailConfApi.getMailListTightness();
  const { from, summary, desc, attachments, sendStatus, readStatus, taskDeadline } = structHeightMap[+tightness - 1];
  const isMainAcc = isMainAccount(data?._account);
  // 固定显示的部分
  const res: stringMap = {
    from,
    summary,
    desc,
  };
  // 判断是否显示附件行
  if (data && data.entry.attachment?.length) {
    let attachment: MailFileAttachModel[] = [];
    attachment = data.entry.attachment?.filter(item => item.inlined === false && item.fileType !== 'ics' && item.type !== 'netfolder');
    if (attachment.length) {
      res.attachments = attachments;
    }
  }
  // 判断是否显示发送状态行
  if (!isCorpMail && data && data.entry.sendStatus) {
    res.sendStatus = sendStatus;
  }
  // 是否显示已读状态
  if (
    !isCorpMail &&
    isMainAcc &&
    !isFree &&
    data &&
    data.entry.folder === FLOLDER.SENT &&
    !data.taskId &&
    // 旗舰版 看 已读数， 旗舰版 看 域内数量
    ((isSirius && (data.entry.rcptCount || data.entry.readCount)) || (isOther && (data.entry.innerCount || data.entry.innerRead)))
  ) {
    res.readStatus = readStatus;
  }
  // task的截止时间占位
  if (!isCorpMail && data && data.taskId && data.taskInfo) {
    // 如果是置顶 或者任务列表中的任务邮件时
    res.taskDeadline = taskDeadline;
    res.desc = null;
  }
  const showDesc = mailConfApi.getMailShowDesc();
  const showAttachment = mailConfApi.getMailShowAttachment();
  if (!showDesc) {
    res.desc = null;
  }
  if (!showAttachment) {
    res.attachments = null;
  }
  return res;
};

export const getCardHeight = (data: MailEntryModel): number => {
  if (data) {
    // 上下边距等基础高度，宽松24，适中20，紧凑16
    let baseHeight = 0;
    const tightness = mailConfApi.getMailListTightness();
    if (+tightness === 1) {
      baseHeight = 24;
    } else if (+tightness === 2) {
      baseHeight = 20;
    } else if (+tightness === 3) {
      baseHeight = 16;
    }
    // 宽松：12+12，适中：10+10，紧凑：8+8
    let sumHeight = baseHeight;
    // 根据显示策略获取高度
    const heightMap = getVisibleStructHeight(data);
    Object.values(heightMap).forEach(height => {
      sumHeight += height;
    });
    return sumHeight;
  }
  return 0;
};

export const getMailOrderRequestParam = (selectedTab: mailListStateTabSelected): MailOrderedField => {
  let orderBy: MailOrderedField = 'date';
  switch (selectedTab) {
    case 'ORDER_BY_SENDER_CAPITAL_DESC':
    case 'ORDER_BY_SENDER_CAPITAL_ASC':
      orderBy = 'from';
      break;
    case 'ORDER_BY_RECEIVER_CAPITAL_DESC':
    case 'ORDER_BY_RECEIVER_CAPITAL_ASC':
      orderBy = 'to';
      break;
    case 'ORDER_BY_SUBJECT_CAPITAL_ASC':
    case 'ORDER_BY_SUBJECT_CAPITAL_DESC':
      orderBy = 'subject';
      break;
    case 'ORDER_BY_SIZE_DESC':
    case 'ORDER_BY_SIZE_ASC':
      orderBy = 'size';
      break;
    default:
      break;
  }
  return orderBy;
};
export const needTimeRangeByMailOrderType = (selectedTab: mailListStateTabSelected): boolean => {
  let needTimeRange: boolean = false;
  switch (selectedTab) {
    case 'ORDER_BY_SENDER_CAPITAL_DESC':
    case 'ORDER_BY_SENDER_CAPITAL_ASC':
    case 'ORDER_BY_RECEIVER_CAPITAL_DESC':
    case 'ORDER_BY_RECEIVER_CAPITAL_ASC':
    case 'ORDER_BY_SUBJECT_CAPITAL_ASC':
    case 'ORDER_BY_SUBJECT_CAPITAL_DESC':
    case 'ORDER_BY_SIZE_DESC':
    case 'ORDER_BY_SIZE_ASC':
      needTimeRange = true;
      break;
    default:
      break;
  }
  return needTimeRange;
};
export const getMailOrderDescRequestParam = (selectedTab: mailListStateTabSelected): boolean => {
  let isDesc = true;
  switch (selectedTab) {
    case 'ORDER_BY_DATE_ASC':
    case 'ORDER_BY_SENDER_CAPITAL_ASC':
    case 'ORDER_BY_RECEIVER_CAPITAL_ASC':
    case 'ORDER_BY_SUBJECT_CAPITAL_ASC':
    case 'ORDER_BY_SIZE_ASC':
      isDesc = false;
      break;
    default:
      break;
  }
  return isDesc;
};
