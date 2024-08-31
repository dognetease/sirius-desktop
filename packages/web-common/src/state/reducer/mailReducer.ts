import { AnyAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  api,
  apis,
  ContactAndOrgApi,
  MailApi,
  MailBoxEntryContactInfoModel,
  mailPerfTool,
  MemberType,
  MailAliasAccountModel,
  DataStoreApi,
  ResponseSignature,
  MailEntryModel,
  SystemApi,
} from 'api';
import { MailActions } from '.';
import { EditorTooltipType, MailEditStatus, ViewMail } from '../state';
import { MailBoxReducerState } from '@web-mail/types';
// mailbox相关状态
import { MailBoxExtraReducers, MailBoxInitialState, MailBoxSlice, MailBoxThunks } from '@web-mail/state/slice/mailReducer/mailReducer';
// mailbox相关状态
export type ReceiveMailContact = MailBoxEntryContactInfoModel | string;

export interface SendingMail {
  id: string;
  cid: string;
  tid: string;
  title: string;
  createTime: number;
  source: string;
  sentTInfo: string;
  optSenderStr?: string;
  toastShow?: boolean;
}

export interface ErrorModalData {
  errModalMailId?: string;
  errorDoc?: string;
  errorText?: string;
  isSimpleTooltip: boolean;
}

export interface IMailReducer extends MailBoxReducerState {
  mails: ViewMail[];
  waittingMailIds: string[];
  currentMail: ViewMail;
  // mailEditShow: boolean;
  receivers?: MailBoxEntryContactInfoModel[];
  subject?: string;
  editorTooltip: EditorTooltipType;
  showWebWriteLetter: boolean;
  selector: {
    focused: string;
    add: boolean;
    pendingItem: any;
  };
  replyExpandedId: string;
  applyGenerateHide: Function;
  forbidSaveTemp: boolean;
  // curAccount: MailAliasAccountModel | null; // 左下角账号
  cacheAttachment: {
    [id: string]: {
      id: string;
      attachment: { type: string; originFileUrl?: string; value: any; localPath?: string }[];
    };
  };
  sendingMails: SendingMail[];
  tooltipVisible: boolean;
  errModalData: ErrorModalData;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const systemApi = api.getSystemApi() as SystemApi;

// @ts-ignore
const InitialState: IMailReducer = {
  mails: [],
  currentMail: {} as ViewMail,
  waittingMailIds: [],
  replyExpandedId: '',
  forbidSaveTemp: false,
  showWebWriteLetter: false,
  // mailEditShow: false,
  receivers: [],
  subject: '',
  selector: {
    focused: '',
    add: false,
    pendingItem: null,
  },
  editorTooltip: {
    top: -999,
    left: 0,
    title: '',
  },
  cacheAttachment: {},
  applyGenerateHide: () => {},
  sendingMails: [],
  tooltipVisible: false,
  errModalData: {
    errorDoc: '',
    errorText: '',
    isSimpleTooltip: false,
  },
  // curAccount: null,
  ...MailBoxInitialState,
};

/**
 * @todo 问下立军这个逻辑，之前逻辑在rootReducer中拦截做的
 * 只要 currentMail 中的属性改变 就触发这个函数？？？
 * 那你倒是问啊。。。
 * 可以在 extraRedcuer 监听匹配changeCurrentMails的字符串的 action,统一调用这个函数
 */
// 用currentMail替换mails中的某一封邮件
const replaceCertainMail = (mails: ViewMail[], currentMail: ViewMail) => mails.map(mail => (mail.cid === currentMail.cid ? currentMail : mail));
export const isChangeCurrentMailAction = (action: AnyAction) => {
  const targetActions = Object.keys(MailActions).map(actionName => `${mailSlice.name}/${actionName}`);
  return targetActions.includes(action.type);
};
export const getVailMailContact = (cur: MailBoxEntryContactInfoModel, pre: MailBoxEntryContactInfoModel) => {
  const curContact = cur.contact.contact;
  const preContact = pre.contact.contact;
  if (curContact.type === 'enterprise') {
    return cur;
  }
  if (preContact.type === 'enterprise') {
    return pre;
  }
  return curContact.id.toString().localeCompare(preContact.id.toString(), 'zh') >= 0 ? cur : pre;
};
export const MailContactUniqueMap = (list: ReceiveMailContact[], receiverType: MemberType): Map<string, MailBoxEntryContactInfoModel> => {
  const contactMap = new Map<string, MailBoxEntryContactInfoModel>();
  list.forEach(item => {
    if (typeof item !== 'string') {
      const email = contactApi.doGetModelDisplayEmail(item.contact);
      const cur = contactMap.get(email);
      if (cur) {
        contactMap.set(email, getVailMailContact(cur, item));
      } else {
        contactMap.set(email, item);
      }
    } else {
      if (!contactMap.get(item)) {
        contactMap.set(
          item,
          mailApi.buildRawContactItem({
            item,
            email: item,
            type: receiverType,
          })
        );
      }
    }
  });
  return contactMap;
};
export const MailContactUnique = (list: ReceiveMailContact[], receiverType: MemberType) => {
  return [...MailContactUniqueMap(list, receiverType).values()];
};
export const MailContactDel = (list: ReceiveMailContact[], delList: ReceiveMailContact[], receiverType: MemberType) => {
  const originMap = MailContactUniqueMap(list, receiverType);
  const delMap = MailContactUniqueMap(delList, receiverType);
  delMap.forEach((_value, key) => {
    if (originMap.has(key)) {
      originMap.delete(key);
    }
  });
  return [...originMap.values()];
};
const mailSlice = createSlice({
  name: 'mailReducer',
  initialState: InitialState,
  reducers: {
    setApplyGenerateHide: (state, action: PayloadAction<Function>) => {
      state.applyGenerateHide = action.payload;
    },
    doReplyChangeExpanded: (state, action: PayloadAction<string>) => {
      state.replyExpandedId = action.payload;
    },
    // 关闭一封邮件
    doCloseMail: (state, action: PayloadAction<string>) => {
      // 删除
      state.mails = state.mails.filter(item => item.cid !== action.payload);
      const index = state.mails.findIndex(item => item.cid === action.payload);
      // 设置新的currentMail
      // 优先选择右边的
      if (state.mails[index + 1]) {
        state.currentMail = state.mails[index + 1];
        return;
      }
      // 其次左边
      if (state.mails[index - 1]) {
        state.currentMail = state.mails[index + 1];
        return;
      }
      // 否则{}
      state.currentMail = InitialState.currentMail;
      return;
    },
    // 清空一些邮件（指定）
    doClearMails: (state, action: PayloadAction<string[]>) => {
      const filteredMails: ViewMail[] = [];
      // 数组
      state.mails.forEach(item => {
        // 临时
        if (item.cid && !action.payload.includes(item.cid)) {
          filteredMails.push(item);
        }
      });
      state.mails = filteredMails;
    },
    // 清空所有邮件
    doClearAllMails: state => {
      state.mails = [];
    },
    // 开启一封新的信
    doWriteMail: (state, action: PayloadAction<ViewMail>) => {
      const mailEntry = action.payload;
      const { receiver, entry, sender, _account } = mailEntry;
      mailEntry.receiver = receiver.filter(_ => _?.originName !== '无收件人');
      // 定时发送
      if (entry.isScheduleSend) {
        if (mailEntry.entry.sendTime) {
          try {
            // 系统市区 -> 设置时区
            mailEntry.scheduleDate = systemApi
              .timeZoneTrans(mailEntry.entry.sendTime, -(new Date().getTimezoneOffset() / 60), systemApi.getSystemTimeZone()?.key || 8)
              ?.format('YYYY-MM-DD HH:mm');
            mailEntry.scheduleDateTimeZone = systemApi.getSystemTimeZone()?.key || 8;
          } catch (error) {
            console.log('设置时区失败', error);
          }
        }
      }
      // 发件人accountId
      mailEntry.initSenderStr = _account || sender.contactItem.contactItemVal;
      const lxWriteRemind = dataStoreApi.getSync('lxWriteRemind', { noneUserRelated: true });
      mailEntry.senderReceivers = lxWriteRemind.suc && lxWriteRemind.data === 'true';
      state.mails.push(mailEntry);
      state.currentMail = mailEntry;
      mailPerfTool.writeMail('end', { writeType: action.payload.writeType });
    },
    doSetWaittingMailIds: (state, action: PayloadAction<string[]>) => {
      const { payload } = action;
      state.waittingMailIds = payload;
    },
    doSetTooltipVisible: (state, action: PayloadAction<boolean>) => {
      state.tooltipVisible = action.payload;
    },
    doSetErrModalData: (state, action: PayloadAction<ErrorModalData>) => {
      state.errModalData = action.payload;
    },
    doCoverErrModalData: (state, action: PayloadAction<any>) => {
      state.errModalData = {
        ...state.errModalData,
        ...action.payload,
      };
    },
    // 添加等待发信邮件id
    doAddWaittingMailIds: (state, action: PayloadAction<string[]>) => {
      const { payload } = action;
      state.waittingMailIds = Array.from(new Set([...state.waittingMailIds, ...payload]));
    },
    doRemWaittingMailId: (state, action: PayloadAction<string>) => {
      const { payload } = action;
      if (payload) {
        state.waittingMailIds = state.waittingMailIds.filter(id => id !== payload);
      }
    },
    setResetCont: (state, action: PayloadAction<boolean>) => {
      state.currentMail = { ...state.currentMail, resetCont: action.payload };
    },
    doShowWebWrite: (state, action: PayloadAction<boolean>) => {
      state.showWebWriteLetter = action.payload;
    },
    // 修改邮件标题
    doModifySubject: (state, action: PayloadAction<string>) => {
      state.currentMail.entry.title = action.payload;
    },
    doUnfinishImgCount: (state, action: PayloadAction<number>) => {
      let count = state.currentMail.unfinishImgCount || 0;
      count += action.payload;
      state.currentMail.unfinishImgCount = count;
    },
    // 去聚焦title
    doFocusTitle: (state, action: PayloadAction<boolean>) => {
      state.currentMail.focusTitle = action.payload;
    },
    doModifyOptSender: (state, action: PayloadAction<MailAliasAccountModel>) => {
      state.currentMail.optSender = { ...action.payload };
    },
    doModifyDefaultSign: (state, action: PayloadAction<{ sign: ResponseSignature; cid?: number }>) => {
      if (state.currentMail.cid === action.payload.cid) {
        state.currentMail.defaultSign = action.payload.sign;
      }
      if (action.payload.cid) {
        const targetIndex = state.mails.findIndex(item => item.cid === action.payload.cid);
        state.mails[targetIndex].defaultSign = action.payload.sign;
      }
    },
    doModifyMailEditStatus: (state, action: PayloadAction<{ cid: string; status?: MailEditStatus }>) => {
      const { cid, status } = action.payload;
      if (state.currentMail.cid === cid) {
        state.currentMail.mailEditStatus = status;
      }
      state.mails = state.mails.map(mail => {
        if (mail.cid === cid) {
          return { ...mail, mailEditStatus: status };
        }
        return mail;
      });
    },
    doModifySender: (state, action: PayloadAction<MailBoxEntryContactInfoModel>) => {
      state.currentMail.sender = { ...action.payload };
    },
    doModifyOptSenderMainEmail: (state, action: PayloadAction<string>) => {
      state.currentMail.optSenderMainEmail = action.payload;
    },
    doModifyInitSenderStr: (state, action: PayloadAction<string>) => {
      state.currentMail.initSenderStr = action.payload;
    },
    doModifyCurMailExpired: (state, action: PayloadAction<boolean>) => {
      state.currentMail.subAccountExpired = action.payload;
    },
    doModifySubAccountExpired: (state, action: PayloadAction<{ email: string; expired: boolean }>) => {
      const { email, expired } = action.payload;
      state.mails = state.mails.map(mail => {
        if (mail.initSenderStr === email) {
          return { ...mail, subAccountExpired: expired };
        }
        return mail;
      });
      if (state.currentMail.initSenderStr === email) {
        state.currentMail.subAccountExpired = expired;
      }
    },
    doAddSendingMails: (state, action: PayloadAction<SendingMail>) => {
      state.sendingMails = [...state.sendingMails, action.payload];
    },
    doRemoveSendingMail: (state, action: PayloadAction<string>) => {
      state.sendingMails = state.sendingMails.filter(item => item.id !== action.payload);
    },
    doUpdateSendingMails: (state, action: PayloadAction<SendingMail[]>) => {
      state.sendingMails = action.payload;
    },
    // 修改收件人
    doModifyReceiver: (
      state,
      action: PayloadAction<{
        receiverType: MemberType;
        receiver: MailBoxEntryContactInfoModel[] | string[];
        operation?: 'delete' | 'paste';
      }>
    ) => {
      const { receiver, receiverType, operation } = action.payload;
      if (operation === 'paste') {
        const unModifed = state.currentMail.receiver.filter(r => r.mailMemberType !== receiverType);
        const filtered = state.currentMail.receiver
          // 过滤出 抄送||密送||发送 的人
          .filter(r => r.mailMemberType === receiverType);
        const uniqueList = MailContactUnique([...filtered, ...receiver] as ReceiveMailContact[], receiverType);
        uniqueList.forEach(item => (item.mailMemberType = receiverType));
        state.currentMail.receiver = [...unModifed, ...uniqueList];
        return;
      }
      if (operation === 'delete') {
        const unModifed = state.currentMail.receiver.filter(r => r.mailMemberType !== receiverType);
        const filtered = state.currentMail.receiver
          // 过滤出 抄送||密送||发送 的人
          .filter(r => r.mailMemberType === receiverType);
        state.currentMail.receiver = [...unModifed, ...MailContactDel(filtered, receiver, receiverType)];
        return;
      }
      // @todo 这里可能有问题 immer
      // 非群发单显情况下，需要把其他输入框内容合并当前输入框内容，但是群发单显情况下不需要，因为只有一个输入框
      let filteredReceiver = state.currentMail?.receiver?.filter(item => item && item.mailMemberType !== receiverType) || [];
      filteredReceiver = state.currentMail.isOneRcpt ? [] : filteredReceiver;
      // filteredReceiver与receiver合并后去重
      // reason: 设置群发单显会在有抄/密送人时将其回填到群发单显框，但为取消后能恢复原状态所以并未改变mailMemberType值，导致filteredReceiver内会出现与state.currentMail.receiver内容重复的情况
      state.currentMail.receiver = [...filteredReceiver, ...MailContactUnique(receiver as ReceiveMailContact[], receiverType)];
    },
    doReplaceReceiver: (state, action: PayloadAction<any>) => {
      state.currentMail.receiver = [...action.payload];
    },
    // 不再提醒（顶栏安全提醒）
    doChangeNoPrompt: (state, action: PayloadAction<boolean>) => {
      state.currentMail.noPrompt = action.payload;
    },
    doReplaceCid: (state, action: PayloadAction<{ cid: string; newCid: string; _account?: string; con: string; mailEditStatus?: MailEditStatus }>) => {
      const { payload } = action;
      const { cid, newCid, _account, con, mailEditStatus } = payload;
      const targetIndex = state.mails.findIndex(item => item.cid === cid);
      state.mails[targetIndex] = {
        ...state.mails[targetIndex],
        ...(mailEditStatus || mailEditStatus === '' ? { mailEditStatus } : {}),
        cid: newCid,
        _account,
      };
      if (con) state.mails[targetIndex].entry.content.content = con;
      if (state.currentMail.cid === cid) {
        state.currentMail = {
          ...state.currentMail,
          ...(mailEditStatus || mailEditStatus === '' ? { mailEditStatus } : {}),
          cid: newCid,
          _account,
        };
        if (con) state.currentMail.entry.content.content = con;
      }
    },
    doChangeMailContent: (state, action: PayloadAction<any>) => {
      // 改变redux里面的content的数据不再同步到编辑器 如果想同步到编辑器 有其他方式
      try {
        state.currentMail.entry.content.content = action.payload;
        state.currentMail.entry.withoutPlaceholder = true;
      } catch (ex) {
        console.error('doChangeMailContent', ex);
      }
    },
    doChangeCurrentMail: (state, action: PayloadAction<number | string | undefined>) => {
      // 容错 允许传入 正数字字符串
      const { payload } = action;
      let val = payload;
      // if (typeof payload === 'string') {
      //   if (!/^[1-9]\d*$/.test('1')) return;
      //   const numberVal = Number(payload);
      //   if (isNaN(numberVal)) return;
      //   val = numberVal;
      // }
      state.currentMail = state.mails.find(item => item.cid === val) as ViewMail;
    },
    // 改变邮件
    doChangeMail: (state, action: PayloadAction<ViewMail>) => {
      const { payload } = action;
      const { cid } = payload;
      const targetIndex = state.mails.findIndex(item => item.cid === cid);
      state.mails[targetIndex] = payload;
      if (state.currentMail.cid === cid) {
        state.currentMail = payload;
      }
    },
    // 改变邮件草稿id
    doChangeMailDraftId: (state, action: PayloadAction<{ cid: string; draftId: string; _id?: string }>) => {
      const { payload } = action;
      const { cid, draftId, _id } = payload;
      const targetIndex = state.mails.findIndex(item => item.cid === cid);
      state.mails[targetIndex].draftId = draftId;
      state.mails[targetIndex]._id = _id;
      if (state.currentMail.cid === cid) {
        state.currentMail.draftId = draftId;
        state.mails[targetIndex]._id = _id;
      }
    },
    // 替换信件
    doReplaceMail: (state, action: PayloadAction<MailEntryModel>) => {
      const { payload } = action;
      const { recoverCid } = payload;
      const targetIndex = state.mails.findIndex(item => item.cid === recoverCid);
      if (targetIndex < 0) return;
      const mergedRes = {
        ...state.mails[targetIndex],
        ...payload,
      };
      state.mails[targetIndex] = mergedRes;
      if (state.currentMail.cid === recoverCid) {
        state.currentMail = {
          ...state.currentMail,
          ...payload,
        };
      }
    },
    doResetCurrentMail: state => {
      state.currentMail = {} as ViewMail;
    },
    doChangeMailInfoStatus: (state, action: PayloadAction<any>) => {
      state.currentMail.status = action.payload;
    },
    doShowWriteContact: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      if (action.payload) {
        state.currentMail!.status!.userBusyFreeShow = false;
      }
      state.currentMail!.status!.showContact = action.payload;
    },
    doShowUserBusyFree: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      if (action.payload) {
        state.currentMail!.status!.showContact = false;
      }
      state.currentMail!.status!.userBusyFreeShow = action.payload;
    },
    doAfterInit: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state!.currentMail!.status!.init = action.payload;
    },
    doConferenceSettting: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state!.currentMail!.status!.conferenceSetting = action.payload;
    },
    doConferenceChange: (state, action: PayloadAction<any>) => {
      state.currentMail.conference = action.payload;
    },
    doConferenceShow: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state.currentMail!.status!.conferenceShow = action.payload;
    },
    doPraiseShow: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state.currentMail!.status!.praiseMailShow = action.payload;
    },
    doCCShow: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state.currentMail!.status!.cc = action.payload;
    },
    doBCCShow: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state.currentMail!.status!.bcc = action.payload;
    },
    doPraiseMailSetting: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state!.currentMail!.status!.praiseMailSetting = action.payload;
    },
    doPraiseMailChange: (state, action: PayloadAction<any>) => {
      state.currentMail.praiseMail = action.payload;
    },
    doTaskShow: (state, action: PayloadAction<any>) => {
      if (!state.currentMail!.status) return;
      state.currentMail!.status!.taskMailShow = action.payload;
    },
    doSetPuretext: (state, action: PayloadAction<any>) => {
      if (!state.currentMail!.status) return;
      state.currentMail!.status!.puretext = action.payload;
    },
    doTaskMailSetting: (state, action: PayloadAction<any>) => {
      if (!state?.currentMail?.status) return;
      state!.currentMail!.status!.taskMailSetting = action.payload;
    },
    doTaskMailChange: (state, action: PayloadAction<any>) => {
      state!.currentMail!.taskMail = action.payload;
    },
    doChangeEditorTooltip: (state, action: PayloadAction<EditorTooltipType>) => {
      state.editorTooltip = action.payload;
    },
    // 更新邮件定时时间时区
    doChangeMailScheduleTimeZone: (state, action: PayloadAction<number | { cid: string; scheduleDateTimeZone: number }>) => {
      const payload = action.payload;
      if (typeof payload === 'object') {
        // 指定对象
        state.mails = state.mails.map(mail => {
          if (mail.cid === payload.cid) {
            mail.scheduleDateTimeZone = payload.scheduleDateTimeZone;
          }
          return mail;
        });
        if (state.currentMail.cid === payload.cid) {
          state.currentMail.scheduleDateTimeZone = payload.scheduleDateTimeZone;
        }
        return;
      } else {
        // 兼容老写法
        state.currentMail.scheduleDateTimeZone = action.payload as number;
        return;
      }
    },
    // 更新邮件是否为加密邮件 API层
    doChangeMailIsEncryptedMail: (state, action: PayloadAction<boolean>) => {
      state.currentMail.isEncryptedMail = action.payload;
    },
    // 更新邮件是否定为加密邮件 UI层
    doChangeMailSetEncrypt: (state, action: PayloadAction<boolean>) => {
      state.currentMail.setEncrypt = action.payload;
    },
    // 更新邮件密码
    doChangeMailEncpwd: (state, action: PayloadAction<string>) => {
      state.currentMail.entry.encpwd = action.payload;
    },
    // 更新邮件密码是否展示
    doChangeMailSavePassword: (state, action: PayloadAction<boolean>) => {
      state.currentMail.savePassword = action.payload;
    },
    // 更新邮件定时时间
    doChangeMailSchedule: (state, action: PayloadAction<string | { cid: string; scheduleDate: string }>) => {
      const payload = action.payload;
      if (typeof payload === 'object') {
        // 指定对象
        state.mails = state.mails.map(mail => {
          if (mail.cid === payload.cid) {
            mail.scheduleDate = payload.scheduleDate;
          }
          return mail;
        });
        if (state.currentMail.cid === payload.cid) {
          state.currentMail.scheduleDate = payload.scheduleDate;
        }
        return;
      } else {
        // 兼容老写法
        state.currentMail.scheduleDate = payload;
        return;
      }
    },
    // 设置邮件紧急情况
    doChangeMailEmergency: (state, action: PayloadAction<number | undefined>) => {
      state.currentMail.entry.priority = action.payload;
    },
    // 设置邮件已读回执
    doChangeRequestReadReceipt: (state, action: PayloadAction<boolean | undefined>) => {
      state.currentMail.requestReadReceipt = action.payload;
    },
    // 更新邮件是否开启已读提醒
    doChangeMailReadRemind: (state, action: PayloadAction<boolean>) => {
      state.currentMail.senderReceivers = action.payload;
    },
    // 删除邮件
    doDeleteMailById: (state, action: PayloadAction<string>) => {
      const index = state.mailDataList.findIndex(id => id === action.payload);
      const nextMailId = state.mailDataList[index + 1] ? state.mailDataList[index + 1] : state.mailDataList[index - 1];
      state.mailDataList = state.mailDataList.filter(id => id !== action.payload);
      state.activeIds = nextMailId ? [nextMailId] : [];
      state.selectedMailId = nextMailId || '';
    },
    doChangeMailOneRcpt: (state, action: PayloadAction<boolean>) => {
      state.currentMail.isOneRcpt = action.payload;
    },
    // 临时禁止存草稿
    doUpdateForbidSaveTemp(state, action: PayloadAction<boolean>) {
      state.forbidSaveTemp = action.payload;
    },
    // 修改缓存的写信附件
    doChangeCacheAttachment(
      state,
      action: PayloadAction<{ id: string; type?: string; value?: any; operationType: 'delete' | 'add' | 'localPathChange'; originFileUrl?: string; localPath?: string }>
    ) {
      const { id, type, value, operationType, originFileUrl, localPath } = action.payload;
      if (operationType === 'delete' && !value) {
        // 删除 currentMailId 的所有附件
        delete state.cacheAttachment[id];
      } else if (operationType === 'delete' && value && type === 'inlineImg') {
        // 删除 currentMailId 中的 value 内联图片
        state.cacheAttachment[id]?.attachment &&
          (state.cacheAttachment[id].attachment = state.cacheAttachment[id].attachment.filter(file => {
            if (file.type === 'inlineImg' && value === file.originFileUrl) {
              return false;
            }
            return true;
          }));
      } else if (operationType === 'delete' && value) {
        // 删除 currentMailId 中的 value 附件
        const fileid = value.id;
        state.cacheAttachment[id]?.attachment &&
          (state.cacheAttachment[id].attachment = state.cacheAttachment[id].attachment.filter(file => {
            const onid = file.value.id;
            return fileid !== onid;
          }));
      } else if (operationType === 'add' && type && value) {
        // 新增附件
        let addValue: any[] = [];
        if (Array.isArray(value)) {
          addValue = value.map(_ => {
            return { type, value: _, originFileUrl, localPath };
          });
        } else {
          addValue = [{ type, value, originFileUrl, localPath }];
        }
        if (state.cacheAttachment[id]) {
          // state.cacheAttachment[id].attachment.push({type, value, originFileUrl});
          state.cacheAttachment[id].attachment = state.cacheAttachment[id].attachment.concat(addValue);
        } else {
          // state.cacheAttachment[id] = {id, attachment: [{type, value, originFileUrl}]};
          state.cacheAttachment[id] = { id, attachment: addValue };
        }
      } else if (operationType === 'localPathChange' && localPath) {
        // 附件 localPath 修改
        const fileid = value.realId || value.id;
        state.cacheAttachment[id]?.attachment &&
          state.cacheAttachment[id].attachment.forEach(file => {
            const onid = file.value.realId || file.value.id;
            if (fileid === onid) {
              file.localPath = localPath;
            }
          });
      }
    },
    doReplaceCacheAttachment(state, action: PayloadAction<{ oldCid: string; newCid: string }>) {
      const { oldCid, newCid } = action.payload;
      if (state.cacheAttachment[oldCid]) {
        state.cacheAttachment[newCid] = {
          id: newCid,
          attachment: state.cacheAttachment[oldCid].attachment || [],
        };
      }
      delete state.cacheAttachment[oldCid];
    },
    // mailbox相关reducer
    ...MailBoxSlice,
  },
  /** 异步操作 or 监听 action */
  extraReducers: builder => {
    MailBoxExtraReducers(builder);
    /** 监听特定的某些action,统一修改某个state */
    /** 待修改 循环应用 action type 没了 */
    builder.addMatcher(isChangeCurrentMailAction, state => {
      if (state.currentMail) {
        state.mails = replaceCertainMail(state.mails, state.currentMail);
      }
    });
  },
});
export const Thunks = {
  ...MailBoxThunks,
};
export const { actions } = mailSlice;
export default mailSlice.reducer;
