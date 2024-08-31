/*
 * @Author: your name
 * @Date: 2022-03-18 16:52:33
 * @LastEditTime: 2022-03-21 16:48:13
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/SendMail/utils.ts
 */
import moment from 'moment';
import { getInsertReminders } from '@web-schedule/components/CreateBox/util';
import { ViewMail, TaskMailType, Attachment } from '@web-common/state/state';
import { apiHolder as api, apis, DataTrackerApi, MailBoxEntryContactInfoModel, ContactAndOrgApi, ReminderParam, MailDraftApi, AccountApi } from 'api';
import { stringMap } from '@web-mail/types';
import store from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import { attachmentDownloadAction } from '@web-common/state/action';
import { getIn18Text } from 'api';
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const draftApi: MailDraftApi = api.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
interface trackSendMailParamType {
  receiver: MailBoxEntryContactInfoModel[];
  attachments: Attachment[];
  readRemind: boolean | undefined;
  conferenceShow: boolean | undefined;
  taskMailShow: boolean | undefined;
  puretext: boolean | undefined;
  praiseMailShow: boolean | undefined;
  scheduledSent: boolean | undefined;
  priority: number | undefined;
  isOneRcpt: boolean | undefined;
  requestReadReceipt: boolean | undefined;
}

// 任务邮件data处理
export const dealTaskMail = async (data: ViewMail) => {
  const { taskMail, entry } = data;
  const { nonEndDate, nonEndTime, enmuReminders, endDate, endTime, expireRemindEveryday: alert } = taskMail as TaskMailType;
  let type: 0 | 1 | 2 = nonEndTime ? 2 : 1;
  let alertTime = null;
  let alertAt = null;
  let deadline = 0;
  const personalEmail = data.receiver.filter(item => ['personal', 'external'].includes(item.contactItem.type)).map(item => item.contactItem.contactItemVal);
  const personalToEnterprise = await contactApi.doGetContactByItem({
    type: 'EMAIL',
    filterType: 'enterprise',
    value: personalEmail,
  });
  const personalToEnterpriseMap: stringMap = {};
  personalToEnterprise.forEach(item => {
    personalToEnterpriseMap[item.contact.accountName] = item;
  });
  const executorList = data.receiver
    .filter(item => item.mailMemberType === 'to')
    .map(item =>
      personalToEnterpriseMap[item.contactItem.contactItemVal] ? personalToEnterpriseMap[item.contactItem.contactItemVal].contact.id : item.contact.contact.id
    );
  const focusList = data.receiver
    .filter(item => item.mailMemberType === 'cc')
    .map(item =>
      personalToEnterpriseMap[item.contactItem.contactItemVal] ? personalToEnterpriseMap[item.contactItem.contactItemVal].contact.id : item.contact.contact.id
    );
  if (nonEndDate) type = 0;
  if (enmuReminders !== undefined) {
    // const { timeUnit, interval, time } = getInsertReminders(enmuReminders) as ReminderParam;
    const getInsertRemindersTime = getInsertReminders(enmuReminders);
    if (getInsertRemindersTime) {
      const { timeUnit, interval, time } = getInsertRemindersTime as ReminderParam;
      if (time) {
        const { hr } = time;
        if (interval) {
          const hor = interval * 24;
          alertTime = (hor + 24 - time.hr) * 60;
        } else {
          alertAt = hr * 60 * 60;
        }
      } else {
        switch (timeUnit) {
          case 1:
            alertTime = interval;
            break;
          case 2:
            alertTime = interval * 60;
            break;
          case 3:
            alertTime = 24 * 60;
            break;
          default:
            break;
        }
      }
    }
  }
  if (!nonEndDate) {
    const time = moment(endDate);
    const endDateTime = moment(endTime);
    const hor = endDateTime.hours();
    const min = endDateTime.minutes();
    time.hour(hor).minutes(min).second(59);
    if (nonEndTime) {
      time.second(59).millisecond(0);
      time.hour(23).minutes(59);
    }
    deadline = time.unix();
  }
  data.task = {
    type,
    deadline,
    alert,
    title: entry.title,
    executorList,
    focusList,
  };
  if (alertTime !== null) {
    data.task.alertTime = alertTime;
  }
  if (alertAt !== null) {
    data.task.alertAt = deadline - 24 * 60 * 60 + alertAt;
  }
  return data;
};

// 表扬邮件data处理
export const dealPraiseMail = (data: ViewMail) => {
  const senderContact = data?.sender?.contact?.contact;
  const praiseLetter = {
    medalId: data.praiseMail?.medalId,
    presenter: data.praiseMail?.presenter,
    presentationWords: data.praiseMail?.presentationWords,
    operator: {
      name: senderContact?.contactName,
      email: contactApi.doGetModelDisplayEmail(senderContact),
      accountId: senderContact?.id,
    },
    winners:
      data.praiseMail?.winners.map(winner => ({
        name: winner.contact.contactName,
        email: contactApi.doGetModelDisplayEmail(winner),
        accountId: winner.contact.id,
      })) || [],
  };
  data.praiseLetter = praiseLetter;
  delete data.praiseMail;
  return data;
};

export const trackSendMail = ({
  receiver,
  attachments,
  readRemind,
  conferenceShow,
  taskMailShow,
  puretext,
  praiseMailShow,
  scheduledSent,
  priority,
  isOneRcpt,
  requestReadReceipt,
}: trackSendMailParamType) => {
  const hasCC = receiver.some(item => item.mailMemberType === 'cc');
  const hasBCC = receiver.some(item => item.mailMemberType === 'bcc');
  const hasAttachment = attachments.some(item => !item.flag?.usingCloud);
  const hasCloudAttachment = attachments.some(item => item.flag?.usingCloud);
  trackApi.track('pcMail_click_send_writeMailPage', {
    read_remind: readRemind ? getIn18Text('KAIQIYIDUTI') : getIn18Text('WEIKAIYIDUTI'),
    schedule: conferenceShow ? getIn18Text('YOURICHENG') : getIn18Text('WURICHENG'),
    task: taskMailShow ? getIn18Text('YOURENWU') : getIn18Text('WURENWU'),
    praise: praiseMailShow ? getIn18Text('YOUBIAOYANG') : getIn18Text('WUBIAOYANG'),
    cc: hasCC ? getIn18Text('YOUCHAOSONG') : getIn18Text('WUCHAOSONG'),
    bcc: hasBCC ? getIn18Text('YOUMISONG') : getIn18Text('WUMISONG'),
    timing: scheduledSent ? getIn18Text('DINGSHIFASONG') : getIn18Text('FEIDINGSHIFASONG'),
    priority: priority ? getIn18Text('JINJI') : getIn18Text('FEIJINJI'),
    singleShow: isOneRcpt ? getIn18Text('QUNFADANXIAN') : getIn18Text('FEIQUNFADANXIAN'),
    attachment: hasAttachment ? getIn18Text('YOUPUTONGFUJIAN') : getIn18Text('WUPUTONGFUJIAN'),
    severAttachment: hasCloudAttachment ? getIn18Text('YOUYUNFUJIAN') : getIn18Text('WUYUNFUJIAN'),
    textMode: puretext ? getIn18Text('CHUNWENBENFAXIN') : getIn18Text('FEICHUNWENBENFAXIN'),
    readReceipt: requestReadReceipt ? '开启已读回执' : '未开启已读回执',
  });
};
// 替换邮件正文中的内容
export const replaceCurrentMailContent = (content: string, replaceTargets: string[]) => {
  const document = new DOMParser().parseFromString(content, 'text/html');
  replaceTargets.forEach(target => {
    const signatureEl = document.querySelectorAll(target);
    if (signatureEl.length > 0) {
      signatureEl.forEach(v => {
        v.parentNode!.removeChild(v);
      });
    }
  });
  return document.documentElement.innerHTML;
};

// 替换邮件正文中的内容
export const resetMailWithDraft = async (cid: string) => {
  // 获取最新的草稿
  const draftRes = await draftApi.getLatestedDraftByCid(cid);
  console.log('draftResdraftRes', draftRes);
  const { success, data } = draftRes;
  // 替换
  if (success && data) {
    const { cid, recoverCid } = data;
    if (recoverCid) {
      console.log('recoverCid', recoverCid);
      cid && draftApi.replaceDraftMailByCid(cid, recoverCid);
      // 本质是新造一封信 替换旧的
      store.dispatch(mailActions.doReplaceMail(data));
      store.dispatch(
        mailTabActions.doReplaceTabById({
          id: String(cid),
          recoverCid: String(recoverCid),
        })
      );
      const filterAttachment = (data.entry.attachment || []).filter(item => !item.inlined);
      filterAttachment.forEach(attachment => {
        const temp = {
          ...attachment,
          mailId: data.cid,
          // 用于重新下载
          downloadContentId: data.entry.id,
          downloadId: attachment.fileUrl + data.entry.id,
          type: 'download', // 需要重新下载 但此逻辑已废弃...
          cloudAttachment: attachment.type === 'netfolder',
        };
        // 添加上附件
        store.dispatch(
          attachmentDownloadAction(temp, {
            forward: true,
            entryId: data.entry.id,
            cid: data.cid || '0',
          })
        );
      });
    }
  }
};

export const accountWork = async (email: string) => {
  const accounts = await accountApi.getMainAndSubAccounts();
  const mainAccount = accounts[0]?.mainAccount;
  if (mainAccount && mainAccount !== email) {
    const accountInfo = accountApi.getSubAccountInfo(email);
    // 过期
    if (!accountInfo) {
      return false;
    }
    if (accountInfo.expired) {
      return false;
    }
    return true;
  } else {
    return true;
  }
};
