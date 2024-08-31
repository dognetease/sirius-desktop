import { AccountApi, apiHolder, apis, DataTrackerApi, MailConfApi as MailConfApiType, MailEntryModel, MailFileAttachModel, ProductAuthApi, SystemApi } from 'api';
import { stringMap } from '@web-mail/types';
// import { isMainAccount } from '@web-mail/util';
import { FLOLDER } from '@web-mail/common/constant';
import moment from 'moment';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 卡片结构的显示策略
export const getVisibleStructHeight = (data: MailEntryModel, forceShowAttachemt?: boolean): stringMap => {
  const isCorpMail = systemApi.getIsCorpMailMode();
  const isFree = productAuthApi.doGetProductVersionId() === 'free';
  const isSirius = productAuthApi.doGetProductVersionId() === 'sirius';
  const isOther = productAuthApi.doGetProductVersionId() !== 'free' && productAuthApi.doGetProductVersionId() !== 'sirius';
  const tightness = mailConfApi.getMailListTightness();
  const dayLimit = mailConfApi.getMailDayLimit();
  const { from, summary, desc, attachments, sendStatus, readStatus, taskDeadline } = structHeightMap[+tightness - 1];
  // const isMainAcc = isMainAccount(data?._account);
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
  const accountAlias = systemApi.getCurrentUser(data?._account)?.prop?.accountAlias || [];
  const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
  const senderEmail = data?.sender?.contact?.contact?.accountName || '';
  // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
  const isSend =
    data?.entry?.folder === FLOLDER.SENT ||
    accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
    accountApi.getIsSameSubAccountSync(senderEmail, data._account);
  const dateArr = data.entry.sendTime?.trim()?.split(/\s+/);
  let isBeforeday = false; // 发送时间超过30天的
  if (!data.entry?.sendTime || !dateArr || dateArr?.length < 2) {
    isBeforeday = true; // 取不到时间默认超过30天，不展示
  } else {
    const utcStr = dateArr[0] + 'T' + dateArr[1] + '+08:00';
    const sendValue = moment(utcStr);
    if (moment().add(-dayLimit.thirdDayLimit, 'day').isAfter(sendValue, 'day')) {
      isBeforeday = true;
    } else {
      isBeforeday = false;
    }
  }
  // 展示打开记录，是三方账号的发信并且没有超过30天
  const showOpenRecord = data.authAccountType && data.authAccountType !== '0' && !isBeforeday;
  if (
    !isCorpMail &&
    // (isMainAcc || data?.emailType === 'NeteaseQiYeMail') &&
    !isFree &&
    data &&
    isSend &&
    // (!data.authAccountType || data.authAccountType === '0') &&
    !data.taskId &&
    // 尊享版 看 已读数， 旗舰版 看 域内数量
    ((isSirius && (data.entry.rcptCount || data.entry.readCount)) || (isOther && (data.entry.rcptCount || data.entry.innerRead)) || showOpenRecord)
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
  const showAttachment = forceShowAttachemt || mailConfApi.getMailShowAttachment();
  if (!showDesc) {
    res.desc = null;
  }
  if (!showAttachment) {
    res.attachments = null;
  }
  return res;
};
// 卡片的计算
export const getCardHeight = (data: MailEntryModel, forceShowAttachemt?: boolean): number => {
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
    const heightMap = getVisibleStructHeight(data, forceShowAttachemt);
    Object.values(heightMap).forEach(height => {
      sumHeight += height;
    });
    return sumHeight;
  }
  return 0;
}; // 新的高度映射表，数组结构
// 卡片结构的静态高度，原高度映射表
// const structHeightMap = {
//     from: 22,
//     summary: 24,
//     desc: 20,
//     // 以下为可变行的高度
//     attachments: 28,
//     sendStatus: 24,
//     readStatus: 24,
//     taskDeadline: 24
// };
// 卡片结构的高度：宽松
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
